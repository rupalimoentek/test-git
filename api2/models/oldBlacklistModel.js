var appModel = require('./appModel'),
	table = 'blacklist',
	ceTransactionModel = require('./ceTransactionModel'),
	ouModel = require('./orgUnitModel'),
	campaignModel = require('./campaignModel'),
	callFlowModel = require('./callFlowModel'),
	async = require('async'),
	yaml = require("js-yaml"),
	fs = require("fs"),
	_ = require("underscore"),
	envVar = process.env.NODE_ENV,
	config = yaml.load(fs.readFileSync("config/config.yml")),
	crypto = require('crypto'),
        algorithm = config[envVar].CALLER_ENCRYPTION_ALGORITHM,
        key = config[envVar].CALLER_ENCRYPTION_KEY,
        iv = config[envVar].CALLER_ENCRYPTION_IV;

var oldblacklist = {
	isUnique: function(data, res){
		var qry = "SELECT COUNT(*) as count FROM " + table;
		qry += " WHERE number=" + data.number;
		qry += " AND call_flow_id=" + data.call_flow_id;
		qry += " AND action='" + data.action + "'";

		appModel.cePool.query(qry, function(err, result){
			res(err, result);
		});
	},
	removeNumbers: function(req, res){
		var callerIdsArr = [],
				data = req.body;
		_.each(data, function (callerID) {
			_.each(callerID, function (callerID) {
				callerIdsArr.push(callerID);
			});
		});
		var blockedCallFlow = [];
		var callersArrayToStr = callerIdsArr.join(',');
		if(data.encrypted_source){
			data.source = decrypt(data.encrypted_source);
		}
		ouModel.ouAndDescendents(req.ouid, function(ous){
			if (ous === '') {
				res('Invalid ouid.');
				return;
			}
			campaignModel.getRouteIdByOus(ous, function(err, pr_ids){
				if (pr_ids === '') {
					res(null);
					return;
				}
				blockedCallFlow = pr_ids.split(",");
				callFlowModel.getCallFlowIdsByCeProvisionedRouteIds(pr_ids, function(err, cf_ids){
					if (err) {
						res(err);
						return;
					}
					if(cf_ids.length>0){
						var cf_id_array = [];
						async.each(cf_ids, function(cf_id, cb){
							cf_id_array.push(cf_id.id);
							cb();
						},
						function(err){
							var ceTrans = new ceTransactionModel.begin(function(err){
								if(err){
									return res(err);
								}
								var cf_id_list = cf_id_array.join();
								var qry = "DELETE FROM " + table + " WHERE call_flow_id IN( " + cf_id_list + ") AND number IN ('" + callerIdsArr.join("','") + "'" + " );";
								var qryData = {
									which: 'query',
									qry: qry
								};
								ceTrans.query(qryData, function(err, result){
									if (err) {
										ceTrans.rollback(function(){
											res(err);
										});
									} else {
										ceTrans.commit(function(){	
											var response = {
												blockedCallFlow : blockedCallFlow,
												encrypted_source: data.encrypted_source ? data.encrypted_source : encipher(callersArrayToStr),
												source: data.encrypted_source ? decrypt(data.encrypted_source) : callersArrayToStr,
											};
											res(null, response);
										});
									}
								});
							});
						});
					}else{
						var response = {
							blockedCallFlow : blockedCallFlow,
							encrypted_source: data.encrypted_source ? data.encrypted_source : encipher(callersArrayToStr),
							source: data.encrypted_source ? decrypt(data.encrypted_source) : callersArrayToStr,
						};
						res(null, response);
					}
				});
			});
		});

	},
	getOrgOfBlockedNumbers: function (req, res) {
		var number = req.params.id; 
		var billing_id= req.user.billing_id;
		async.waterfall([
			function (cb) {
				var query = "select call_flow_id from "+table+" where number = "+number+" ;" 
				appModel.cePool.query(query, function (err, cf_ids) {
						if (err) {
							cb(err);
						} else {
							var cf_id_array = [];
							_.each(cf_ids, function (cf_id) {
								cf_id_array.push(cf_id.call_flow_id);
							});
							cb(null,cf_id_array);
						}
					});
			},function (cf_ids,cb) {
				var qry = "SELECT distinct ou.org_unit_name FROM ce_call_flows AS ccf " 
				qry+="LEFT JOIN org_unit AS ou ON (ccf.ouid = ou.org_unit_id) "
				qry+="WHERE ou.org_unit_status = 'active' and ccf.app_id='CT' and ccf.status = 'active' and ccf.id in ( "+ cf_ids +" );";
				appModel.ctPool.query(qry, function(err,result){
					if(err){
						cb(err);
					}else{
						cb(null,result);
					}
				});
			}
		], function (err, result) {
		if (err)
			res(err);
		else
			res(null, result);
	});
	},
	getByOuid: function(req, res){
		var ouid = req.ouid;
		ouModel.ouAndDescendents(ouid, function(ous){

			if (ous === '') {
				res('Invalid ouid.');
				return;
			}
			ous = _.intersection(ous.split(",").map(Number),req.orglist);
			if (ous.length < 1) {
				res('Invalid ouid.');
				return;
			}
			campaignModel.getRouteIdByOus(ous, function(err, pr_ids){
				if (pr_ids === '') {
					res(null);
					return;
				}
				callFlowModel.getCallFlowIdsByProvisionedRouteIds(pr_ids, function(err, cf_ids){
						if (err) {
							return res(err);
						}
						cfIdArray = [];
						for (var key in cf_ids) {
							cfIdArray.push(cf_ids[key].id);
						}
						cfIdList = cfIdArray.join(',');
						qry = "SELECT DISTINCT number FROM "+ table +" WHERE call_flow_id IN("+cfIdList+")";
						appModel.cePool.query(qry, function(err, results){
							if (err) {
								return res(err);
							}
							return res(null, results);
						});
					});		

				// res(err,[]);

				// var qry = "SELECT number FROM " + table + " WHERE call_flow_id in (SELECT cf.id FROM call_flows AS cf WHERE provisioned_route_id IN(" + pr_ids + ") AND app_id='CT') GROUP BY number";
				// appModel.cePool.query(qry, function(err, data){
				// 	var numList = [];
				// 	for(var key in data){
				// 		if(data[key].number.length == 10){
				// 			var num ={};
				// 			num.encrypted_source = encipher(data[key].number);
				// 			num.number = data[key].number;
				// 			num.provisioned_route_ids = pr_ids.split(",");
				// 			numList.push(num);
				// 		}
				// 	}
				// 	res(err,numList);
				// });
			});
		});
	},
	deleteByCallFlowIds: function(cf_ids, res){
		var cfList = [];
		for (var key in cf_ids) {
			cfList.push(cf_ids[key].id);
		}
		cfList = cfList.join(',');
		var qry = "DELETE FROM " + table + " WHERE call_flow_id in(" + cfList + ")";
		appModel.cePool.query(qry, function(err,data){
			res(err, data);
		});
	},
	create: function(data,res){
		ouModel.ouAndDescendents(data.org_unit_id, function(ous){
			if (ous === '') {
				res('Invalid ouid.');
				return;
			}
			campaignModel.getRouteIdByOus(ous, function(err, pr_ids){
				if (pr_ids === '') {
					res(null);
					return;
				}
				callFlowModel.getCallFlowIdsByCeProvisionedRouteIds(pr_ids, function(err, cf_ids){
					if (err) {
						return res(err);
					}
					if(cf_ids.length>0){
						getBlacklistedIds(cf_ids, data.caller_id, function(err, results){
							if (err) {
								return res(err);
							}
							bulkInsert(cf_ids, data.caller_id, function(err){
								if (err) {
									return res(err);
								}
								if(results.length > 0) {
									var qry = "DELETE FROM " + table + " WHERE id IN(" + results[0].ids + ")";
									appModel.cePool.query(qry, function(err, data){
										return res(null, 'Blacklist created.');
									});
								} else {
									return res(null, 'Blacklist created.');
								}
							});
						});
					}else{
						return res(null, 'Blacklist created.');
					}
				});
			});
		});
	}
};

module.exports = oldblacklist;

function insertSomeSql(cf_ids, number, res){
	var values = [], qry = '', err = null;
	try {
		for (var key in cf_ids) {
			console.log("number:",number,"  :: key: ",key,"  :: cf_ids[key]: ",cf_ids[key])
			values.push("(" + number + "," + cf_ids[key] + ",'block')");
		}
		if (values.length > 0) {
			qry = 'INSERT INTO ' + table + ' (number, call_flow_id, action) VALUES ' + values.join(',');
		}
	}catch (e){
		console.log('insertSomeSql error', e);
		err = 'insertSomeSql error';
	}
	res(err, qry);
}

function bulkInsert(cf_ids, numbers, res) {
	var nums = numbers.split(',');
	cfIdArray = [];
	for (var key in cf_ids) {
		cfIdArray.push(cf_ids[key].id);
	}
	try {
		async.times(nums.length, function(n, next){
			insertSomeSql(cfIdArray, nums[n], function(err, insertQry){
				if (err) {
					return res(err);
				}
				// console.log(insertQry);
		        appModel.cePool.query(insertQry, function(err,result){
		        	next(err, {});
		        });
			});
	    }, function(err){
			if(err){
	        	console.log(err);
			}
			return res(err);
	    });
	}catch (e){
		console.log('bulkInsert error', e);
		err = 'bulkInsert error';
		return res(err);
	}
}

function getBlacklistedIds(cf_ids, numbers, res){
	cfIdArray = [];
	for (var key in cf_ids) {
		cfIdArray.push(cf_ids[key].id);
	}
	cfIdList = cfIdArray.join(',');
	qry = "SELECT group_concat(id) as ids FROM "+ table +" WHERE number IN("+numbers+") AND call_flow_id IN("+cfIdList+")";
	appModel.cePool.query(qry, function(err, results){
		if (err) {
			return res(err);
		}
		return res(null, results);
	});
}

function encipher(text){
	var cipher = crypto.createCipheriv(algorithm,key,iv)
  var crypted = cipher.update(text,'utf-8',"base64")
	crypted += cipher.final("base64");
  return crypted;
}

function decrypt(text){
 var decipher = crypto.createDecipheriv(algorithm,key, iv)
 var dec = decipher.update(text,'base64','utf8')
 dec += decipher.final('utf8');
 return dec;
}
