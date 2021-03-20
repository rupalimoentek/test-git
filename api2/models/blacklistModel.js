var connector = require('./appModel'),
	f = require('../functions/functions.js'),
	fs = require("fs"),
	yaml = require("js-yaml"),
	e = yaml.load(fs.readFileSync("config/database.yml")),
	async = require('async'),
	_ = require('underscore'),
	blacklist_table = 'ce_blacklist',
	oauthToken = require('../lib/token');

var blacklist = {
	bulkInsert: function (req, res) {
		var data = req.body;
		var query = '';
		async.waterfall([
			function (cb) {
				var selectqry = "SELECT org_unit_id FROM " + blacklist_table + " WHERE number::text ILIKE '%" + data.caller_id + "%' AND org_unit_id = '" + data.org_unit_id + "'";
				connector.ctPool.query(selectqry, function (err, orgdata) {
					if (err)
						cb(err);
					else
						cb(null, orgdata);
				})
			},
			function (orgdata, cb) {
				if (orgdata.length === 0) {
					var deleteQuery = " DELETE FROM " + blacklist_table + " WHERE  org_unit_id IN ( ";
						deleteQuery += req.user.orglist.join(', ');
						deleteQuery += ") AND number::text ILIKE '%" + data.caller_id + "%'";
					if(req.user.orglist !== orgdata.org_unit_id )
					connector.ctPool.query(deleteQuery, function (err, deletedData) {
						if (err)
							cb(err);
						else
							cb(null);
					});
				}
				else{
					var errorMsg = data.caller_id + ' is already added in blacklist';
					cb(errorMsg);
				}
			},
			function (cb) {
				query = "INSERT INTO " + blacklist_table + "(number, action, org_unit_id, billing_id, by_billing_id, status) VALUES";
				_.each(req.orglist, function (err, id) {
					query += " (" + parseInt(data.caller_id) + ",'block', " + req.orglist[id] + ", " + req.user.billing_id + ", 0, 1),";
				});
				//removed last comma
				query = query.replace(/,\s*$/, "");
				connector.ctPool.query(query, function (err, result) {
					if (err) {
						cb(err, "Caller ID is not able to insert");
					}
					else {
						cb(null);
					}
				});
			},
			function (cb) {
				var selectQuery = " SELECT id FROM call_flows WHERE status != 'suspended' AND ouid IN ( ";
					selectQuery += req.user.orglist.join(', ');
					selectQuery += " ) ";
					connector.cePool.query(selectQuery, function (err, callflowData) {
						if (err)
							cb(err);
						else
						cb(null, callflowData);
					});
			},
			function (callflowData, cb) {
				if(callflowData.length > 0){
					var deleteQuery = " DELETE FROM blacklist WHERE  call_flow_id IN ( ";
					_.each(callflowData, function (cf) {
						deleteQuery += cf.id+", ";
					});
					deleteQuery = deleteQuery.replace(/,\s*$/, "");
					deleteQuery += ") AND number LIKE '%" + data.caller_id + "%'";
					connector.cePool.query(deleteQuery, function (err, deletedData) {
						if (err)
							cb(err);
						else
							cb(null, callflowData);
					});
				}else{
					cb(null, callflowData);
				}					
			},
			function (callflowData, cb) {
				query = "INSERT INTO blacklist (number, action, call_flow_id) VALUES ";
				if(callflowData.length > 0){
					_.each(callflowData, function (cf) {
						query += " (" + parseInt(data.caller_id) + ",'block', " + cf.id + " ),";
					});
					//removed last comma
					query = query.replace(/,\s*$/, "");
					connector.cePool.query(query, function (err, result) {
						if (err) {
							cb(err, "Caller ID is not able to insert");
						}
						else {
							cb(null);
						}
					});
				}else{
					cb(null);
				}
			},
			function(cb){
				var blacklistNumber=[]
				let numberDetail ={}
				async.eachSeries(req.orglist,function(org_unit_id,cb){
					key = data.caller_id+'_'+org_unit_id
					value  = req.user.billing_id+'|'+org_unit_id+'|'+org_unit_id+'|'+'CT'+'|'+'block'+'|'+ req.user.billing_id
					oauthToken.updateMemcacheBlacklist(key,value,function(err, res){
						if (err) {
							console.log('Blacklist accessToken updation Failed.');
							cb(err);
						}else{
							cb(null);
						}
					});
				},
				function(err){
					if (err) {
						cb(err);
					} else {
						cb(null)
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
	
	//All Blocked caller_ids having group access
	getAllBlacklistNumbers: function (req, page, search,res) {
		var limit = 100,
			offset = "",
			blacklistNumbers = [],
			blacklistData = {};
			if(search == undefined){
				search = "";
			}
			var endQerypart = " AND  number::text ILIKE '%" + search + "%'  LIMIT " + limit ;
			if(page == 'allNumbers'){
				page = "";
				endQerypart = " AND  number::text ILIKE '%" + search + "%'" ; 
			}
			if(page){
				offset = (parseInt(page) - 1) * 100;	
			}
			if(offset){
				endQerypart +=  " OFFSET " + offset;
			}
		async.waterfall([
			function(cb1){
				var qry = "SELECT DISTINCT(number) FROM " + blacklist_table + " WHERE org_unit_id IN ( " + req.orglist + ") AND billing_id = " + req.user.billing_id + endQerypart;
				connector.ctPool.query(qry, function (err, result) {
					if (err) {cb1(err); }
					else {
						blacklistData['blacklistNumbers'] = result;
						cb1(null, blacklistData);
					}
			});
			},
			function(blacklistData, cb1){	
				var qry = "SELECT COUNT(DISTINCT(number)) FROM " + blacklist_table + " WHERE org_unit_id IN ( " + req.orglist + ") AND billing_id = " + req.user.billing_id + " AND  number::text ILIKE '%" + search + "%'";	
				connector.ctPool.query(qry, function (err, result1) {	
					if (err) {	
						cb1(null,err);	
					}	
					else {	
					blacklistData['totalRows'] = result1[0].count;	
						cb1(null, blacklistData);	
					}	
				});	
		}
		],function(err, blacklistData){
				res(err, blacklistData);
			});	
	},

	//Blocked on Group section should list group names for which the caller id's are blocked. 
	//get black list Tracking Numbers, org_unit_name for which the caller id's are blocked.
	getOrgOfBlockedNumbers: function (req, res) {
		var query = "SELECT ou.org_unit_name FROM " + blacklist_table + " AS bc ";
		query += " LEFT JOIN org_unit AS ou ON (bc.org_unit_id = ou.org_unit_id)";
		query += " WHERE ou.org_unit_status = 'active' ";
		query += " AND bc.number IN ( '" + req.params.id + "') AND bc.org_unit_id IN ( " + req.user.orglist + ")" ;
		connector.ctPool.query(query, function (err, result) {
			if (err) {
				res(err);
			} else {
				res(null, result);
			}
		});
	},

	//search caller_id in grid
	getSearchCallerID: function (caller_id, res) {
		var query = "SELECT number FROM " + blacklist_table + " WHERE number::text ILIKE '%" + caller_id + "%'";
		connector.ctPool.query(query, function (err, result) {
			if (err) {res(err); } else {
				res(null, result);
			}
		});
	},
	deleteCallerID: function (req, res) {
		var callerIdsObj = [],
			data = req.body;
		_.each(data, function (callerID) {
			_.each(callerID, function (callerID) {
				callerIdsObj.push(callerID);
			});
		});
		async.waterfall([
			function (cb) {
				var query = " DELETE FROM " + blacklist_table + " WHERE number IN ('" + callerIdsObj.join("','") + "'" + " ) AND org_unit_id IN (" + req.orglist + ")";
				connector.ctPool.query(query, function (err, result) {
					if (err) {
						cb("Caller Id is not deleted" + err);
					}
					else {
						cb(null);
					}
				});
			},function (cb) {
				var selectQuery = " SELECT id FROM call_flows WHERE status != 'suspended' AND ouid IN ( ";
					selectQuery += req.orglist;
					selectQuery += " ) ";
					connector.cePool.query(selectQuery, function (err, callflowData) {
						if (err)
							cb(err);
						else
						cb(null, callflowData);
					});
			},function (callflowData, cb) {
				if(callflowData.length > 0){
					var query = " DELETE FROM blacklist WHERE number IN ('" + callerIdsObj.join("','") + "'" + " ) AND call_flow_id IN (" + _.pluck(callflowData, 'id').join(', ') + ")";
					connector.cePool.query(query, function (err, result) {
						if (err) {
							cb("Caller Id is not deleted" + err);
						}
						else {
							cb(null);
						}
					});
				}else{
					cb(null);
				}
			},function (cb) {
				async.eachSeries(callerIdsObj, function(caller_id,cb1){
					async.eachSeries(req.orglist, function(org_unit_id,cb){
						key = caller_id +'_'+org_unit_id
						oauthToken.deleteBlacklistAccess(key,function(err, memRes){
							if (err) {
								console.log('Blacklist accessToken updation Failed.');
								cb(err);
							}else{
								cb(null);
							}
						});
					},
					function(err){
						if (err) {
							res(err);
						} else {
							cb1(null);
						}
					});
				},
				function(err){
					if (err) {
						res(err);
					} else {
						res(null);
					}
				});
			}
		], function (err) {
			if (err) {
				res(err);
			} else {
				res(null);
			}
		});
	}
};



module.exports = blacklist;
