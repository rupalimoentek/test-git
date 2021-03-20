var connector = require('./appModel'),
	f = require('../functions/functions.js'),
	table = 'phone_number',
	_ = require('underscore'),
	fs = require("fs"),
	yaml = require("js-yaml"),
	async 		= require('async'),
	transaction = require('./ctTransactionModel'); //// Need to leave this is for amp methods

var phoneNumber = {
	getPhoneByNumber: function(req,callback){
		var qry = "SELECT phone_number_id from " + table + " WHERE number = "+req.params.number+" AND phone_number_status = 'reserved';";
		connector.ctPool.query(qry, function(err, results){
			callback(err,results);
		});
	},
	getRateCenterState: function(req,callback){
		//// FOR AMP3 USE DO NOT CHANGE ////
		var npanxx = parseInt(req.params.number.toString().slice(0,6));
		var qry = "SELECT state,rc from npanxx_city WHERE npanxx = '"+npanxx+"' LIMIT 1;";
		connector.ctPool.query(qry, function(err, results){
			callback(err,results);
		});
	},
	update: function(data, res){
		var date_timestamp = f.mysqlTimestamp();
		data.phone_number_modified = date_timestamp;
		var updateData = {
			table : table,
			values: data
		};
		connector.ctPool.update(updateData, function(data){
			res(data);
		});
	},
	numberByNpa: function(npa, res) {
		// JAW update to fix field names and use joins where required
		//// THIS IS USED BY AMP MAKE SURE AMP GETS UPDATED IF CHANGES ARE MADE HERE
		var qry = "SELECT phone_number.number_id, number, npa, pd.vendor_id, 'inventory' AS source FROM " + table + " LEFT JOIN phone_detail pd on pd.number_id = phone_number.number_id WHERE npa = "+npa+" AND number_status='unprovisioned'";
		connector.ctPool.query(qry, function(err, data1) {
			if (err) { return res("Failed to execute phone number lookup. "+err); }
			for (var i = data1.length - 1; i >= 0; i--) {
				data1[i].pretty_number = f.prettyPhoneNumber(data1[i].number);
			}
			res(null, data1);
		});
	},
	numberByCityStateNpa: function(city, state, npa, is_migrated, res) {
		// JAW update to fix field names and use joins where required
		//// THIS IS USED BY AMP MAKE SURE AMP GETS UPDATED IF CHANGES ARE MADE HERE
		var qry = "SELECT phone_number.number_id, number, npa, pd.vendor_id, 'inventory' AS source FROM " + table + " LEFT JOIN phone_detail pd on pd.number_id = phone_number.number_id WHERE number_status='unprovisioned' AND concat( cast(npa as varchar), cast(nxx as varchar) ) IN " +
			"(SELECT cast(npanxx as varchar) FROM npanxx_city WHERE city='" + city.toUpperCase() + "' AND state='" + state.toUpperCase() + "' AND npa='" + npa + "' GROUP BY npanxx)";
			qry += " AND pd.vendor_id IN( 10001, 10002)";
			connector.ctPool.query(qry, function(err, data) {
				if (err) { return res("Failed to execute lookup of phone numbers from inventory. "+err); }

				// set the nicely formatted phone number value for each entry
				_.each(data, function(val, key) {
					data[key].pretty_number = f.prettyPhoneNumber(val.number);
				});
				res(null, data);
			});
	},
	getReserved: function(req, res) {
		var orgUnit = require('./orgUnitModel');
		 orgUnit.getAllParentOuIds(req.params.ouid, function (ouids) {
			// Include the current ouid in the list ouids
			ouids += ',' + req.params.ouid;
 			var qry = "SELECT phone_number.number_id, phone_number.number, phone_number.npa, pd.vendor_id, 'inventory' AS source, pd.org_unit_id AS number_ou_id FROM " + table + " LEFT JOIN phone_detail pd on pd.number_id = phone_number.number_id " + "WHERE phone_number.number_status='reserved' AND pd.org_unit_id in ("+ouids+") AND pd.app_id = 'CT'";
				qry += " AND pd.vendor_id IN(10001, 10002)";
				qry += " ORDER BY phone_number.number ASC";
				connector.ctPool.query(qry, function(err, data) {
					if (err) { return res("Failed to execute lookup of reserved numbers from inventory. "+err); }
					// set the nicely formatted phone number value for each entry
					_.each(data, function(val, key) {
						data[key].pretty_number = f.prettyPhoneNumber(val.number);
					});

					res(null, data);
				});
 		});
	},
	numberByNpanxx: function(data, res) {
		var where = [];
		for (var i = data.length - 1; i >= 0; i--) {
			// JAW update to concatenate npa and nxx for join
			where.push("concat(npa,nxx) = " + data[i].npanxx  );
		}
		// JAW update to fix field names
		var qry = "SELECT number_id, number, npa, vendor_id, 'inventory' AS source FROM " + table + " WHERE (" + where.join(' OR ') + ") AND number_status='unprovisioned'";
		connector.ctPool.query(qry, function(err, data1){
			for (var i = data1.length - 1; i >= 0; i--) {
				data1[i].pretty_number = f.prettyPhoneNumber(data1[i].number);
			}
			res(data1);
		});
	},
	idByNumber: function(number, res){
		// JAW fix field names, removed number_type from query, was number_type=1
		var qry = "SELECT number_id,number_status from " + table + " WHERE number = '" + number + "'";
		connector.ctPool.query(qry, function(err, data){
			res(data);
		});
	},
	vendorIdByNumber: function(number, res){
		//FOR AMP3 USE DO NOT CHANGE
		
		var qry = "SELECT pn.number_id,pn.number_status,pd.vendor_id";
		qry += " FROM phone_number AS pn";
		qry += " JOIN phone_detail AS pd ON pd.number_id = pn.number_id";
		qry += " WHERE pn.number = '"+number+"'";

		connector.ctPool.query(qry, function(err, data){
			res(data);
		});
	},
	provision: function(data, res){
		var date_timestamp = f.mysqlTimestamp();
		data.phone_number_modified = date_timestamp;
		// JAW fix field names and split into 2 updates, one for phone_number and one or phone_detail
		var qry2 = "UPDATE phone_detail set num_pr_id=" + data.provisioned_route_id+",number_updated="+data.phone_number_modified+" WHERE number_id=" + data.phone_number_id;
		connector.ctPool.query(qry2, function(err,data){
			res(data);
		});

		// JAW fix fieldnames and split into this and above query in this code block (provision)
		var qry = "UPDATE phone_number SET number_status = 'provisioned' WHERE number_id = " + data.phone_number_id + " AND number_status = 'unprovisioned'";
		connector.ctPool.query(qry, function(err, data){
			res(data);
		});
	},
	unprovisionById: function(req, callback){
		var date_timestamp = f.mysqlTimestamp();
		var qry = "UPDATE phone_number SET number_status = 'unprovisioned' WHERE number_id = "+req.body.phone_number.id+";";
		connector.ctPool.query(qry, function(err, data){
			callback(data);
		});
	},
	poolNumDelete: function(data, res){
		var qry = "DELETE FROM phone_number  WHERE number= " + data.number;
		console.log('delete qry is :' + qry);
		connector.ctPool.query(qry, function(err, data){
			res(data);
		});
	},
	transStatus: function(trans, id, status, cb){
	// JAW fix field names
		phoneNumberData = {
			number_status: status,
		};
		var updateData = {
			which: 'update',
			table : 'phone_number',
			values: phoneNumberData,
			where: " WHERE number_id = " + id + " AND number_status = 'unprovisioned'"
		};
		trans.query(updateData, function(err, result){
			if (err) {
				cb(err);
				return;
			}
			if (result.rowCount < 1) err='Phone Number Provisioning Error.';
			cb(err,result);
		});
	},
	post: function(data, callback){
		var trans = require('./ctTransactionModel');

		var t = new trans.begin(function(err){
			if (err) {
				callback(err);
				return;
			}

			data.npa = parseInt(data.number.toString().slice(0,3));
			//data.npanxx = parseInt(data.number.toString().slice(0,6));
			data.nxx = parseInt(data.number.toString().slice(3,6));
			data.ocn = parseInt(data.number.toString().slice(6,10));
			data.number = parseInt(data.number);
			data.number_str = data.number;
			//data.phone_number_created = f.mysqlTimestamp().split(' ')[0];
			//data.phone_number_status = 'provisioned'
			data.number_status = 'provisioned'
			
			dat = {
				table: 'phone_number',
				values: data
			}
			t.insert(dat, function(err, d){
				if (err) {
					callback(err);
					t.rollback(function(){});
				} else {
					t.commit(function(){});
					callback(null,d);
				}
			})
		})
	},
	unsetLmcReferanceByNumberId: function(id, callback){
		var date_timestamp = f.mysqlTimestamp();
		var qry = "UPDATE phone_detail SET app_id='CT', num_ou_id = null, num_pr_id = null WHERE number_id = "+id+";";
		connector.ctPool.query(qry, function(err, data){
			callback(data);
		});
	},
	updateStatus: function(req, callback){
		var qry = "UPDATE phone_number SET number_status = '"+req.body.phone_number.status+"' WHERE number_id = "+req.body.phone_number.id+";";
		connector.ctPool.query(qry, function(err, data){
			callback(err, data);
		});
	},
	getPhoneDataByNumber: function(req,callback){
		//// FOR AMP3 USE DO NOT CHANGE ////
		//var qry = "SELECT phone_number_id from " + table + " WHERE number = "+req.params.number+" AND phone_number_status = 'reserved';";
		var phoneData = {}
		var provisionedRouteIds = [];
		var isPool = false;

		async.waterfall([
			function(cb){
				//// Get phone_number
				var qry = "SELECT * FROM phone_number WHERE number = "+req.params.number;
				connector.ctPool.query(qry, function(err, results){
					phoneData.phone_number = results;
					cb(err)
				});
			},
			function(cb){
				//// Get phone_detail

				if (phoneData.phone_number.length < 1 || phoneData.phone_number[0].number_id === null) {
					phoneData.phone_detail = [];
					return cb(null);
				}
				var qry = "SELECT * FROM phone_detail WHERE number_id = "+phoneData.phone_number[0].number_id;
				connector.ctPool.query(qry, function(err, results){
					phoneData.phone_detail = results;
					cb(err)
				});
			},
			function(cb){
				/// get phone_pool_number
				phoneData.phone_pool_number = [];
				phoneData.phone_pool = [];
				var qry = "SELECT * FROM phone_pool_number WHERE phone_number = '"+req.params.number+"'";
				connector.ctPool.query(qry, function(err, results){
					phoneData.phone_pool_number = results;
						cb(err);
				});
			},
			function(cb){
				/// get phone_pool
				if (phoneData.phone_pool_number.length < 1 || phoneData.phone_pool_number[0].number_id === null) {
					phoneData.phone_pool = [];
					return cb(null);
				}
				var pool_id = [];
				isPool = true;

				_.each(phoneData.phone_pool_number,function(poolData){
					pool_id.push(poolData.pool_id)
				});
				var qry = "SELECT * FROM phone_pool WHERE pool_id IN ("+pool_id+")";
				connector.ctPool.query(qry, function(err, results){
					phoneData.phone_pool = results;
					_.each(results,function(result){
						if (result.provisioned_route_id !== null && result.provisioned_route_id !== '') {
							provisionedRouteIds.push(result.provisioned_route_id);
						}
					})
					cb(err);
				});
			},
			function(cb){
				//// Get provisioned_route_number

				if (phoneData.phone_number.length < 1 || phoneData.phone_number[0].number_id === null) {
					phoneData.provisioned_route_number = [];
					return cb(null);
				}

				var qry = "SELECT * FROM provisioned_route_number WHERE phone_number_id = "+phoneData.phone_number[0].number_id;

				connector.ctPool.query(qry, function(err, results){
					phoneData.provisioned_route_number = results;

					async.eachSeries(results,function(r,cb1){
						provisionedRouteIds.push(r.provisioned_route_id);
						cb1(null);
					},
					function(err){
						if (err) {return cb(err);}
						cb(err)
					});
				});
			},
			function(cb){
				//// Get provisioned_route
				console.log("provisionedRouteIds ",provisionedRouteIds)
				phoneData.provisioned_route = [];
				if (provisionedRouteIds.length < 1) {return cb(null);}

				if ((phoneData.provisioned_route_number.length < 1 || phoneData.provisioned_route_number[0].provisioned_route_id === null) && !isPool) {
					
					return cb(null);
				}

				var qry = "SELECT * FROM provisioned_route WHERE provisioned_route_id in ("+provisionedRouteIds.join(',')+")";
				connector.ctPool.query(qry, function(err, results){
					phoneData.provisioned_route = results;
					cb(err)
				});
			},
			function(cb){
				//// Get call engine call_flows
				phoneData.call_flows = [];

				var qry = "SELECT * FROM call_flows WHERE dnis = '"+req.params.number+"'";

				if (provisionedRouteIds.length > 0){
					qry += " OR provisioned_route_id IN ("+provisionedRouteIds.join(',')+") AND app_id = 'CT'"
				}
				connector.ctPool.query(qry, function(err, results){
					phoneData.call_flows = results;
					cb(err)
				});
				
				// if (phoneData.phone_detail.length < 1 || phoneData.phone_detail[0].app_id === null) {
				// 	if (phoneData.phone_number.length < 1 || phoneData.phone_number[0].number_id === null) {
						
				// 		return cb(null);
				// 	} else {
				// 		var qry = "SELECT * FROM call_flows WHERE dnis = '"+phoneData.phone_number[0].number+"'";
				// 		connector.ctPool.query(qry, function(err, results){
				// 			phoneData.call_flows = results;
				// 			cb(err)
				// 		});
				// 	}
				// } else {
					
				// 	var provisionedRouteId = null;
				// 	var appId = null;

				// 	if ( phoneData.phone_detail[0].app_id === 'CT') {
				// 		appId = phoneData.phone_detail[0].app_id;
				// 		provisionedRouteId = phoneData.phone_detail[0].provisioned_route_id;
				// 	} else if (phoneData.phone_detail[0].app_id === 'LMC') {
				// 		appId = phoneData.phone_detail[0].app_id;
				// 		provisionedRouteId = phoneData.phone_detail[0].num_pr_id;
				// 	}

				// 	if (appId === null || provisionedRouteId === null) {
				// 		return cb(null);
				// 	}

				// 	var qry = "SELECT * FROM call_flows WHERE (app_id = '"+appId+"' AND provisioned_route_id = "+provisionedRouteId+") OR dnis = '"+phoneData.phone_number[0].number+"'";
				// 	connector.ctPool.query(qry, function(err, results){
				// 		phoneData.call_flows = results;
				// 		cb(err)
				// 	});
				// }
			},
			function(cb){
				//// Get postgres call_flows
				phoneData.ce_call_flows = [];
				var qry = "SELECT * FROM ce_call_flows WHERE dnis = '"+req.params.number+"'";

				if (provisionedRouteIds.length > 0){
					qry += " OR provisioned_route_id IN ("+provisionedRouteIds.join(',')+") AND app_id = 'CT'"
				}

				connector.ctPool.query(qry, function(err, results){
					phoneData.ce_call_flows = results;
					cb(err);
				});
			}
		],
		function(err){
			callback(err,phoneData);
		});
	},
	phoneNumbersByBillingOuid: function(req,callback){
		//// FOR AMP3 USE DO NOT CHANGE ////
		var billingOuid = req.query.billingOuid;
		var trans = new transaction.begin(function(err){
			if (err) {
				callback(err);
				return;
			}
			var r = {
				phoneNumbers: [],
				poolNumbers: []
			};
			async.parallel({
				phoneNumbers: function(cb){
					qry = "SELECT pn.number_id AS phone_number_id,pn.number,pd.vendor_id";
					qry += " FROM phone_detail AS pd";
					qry += " JOIN phone_number AS pn ON pn.number_id = pd.number_id";
					qry += " WHERE pd.app_id = 'CT'";
					qry += " AND pd.org_unit_id IN (SELECT org_unit_id FROM org_unit WHERE billing_id = "+billingOuid+");";

					trans.query(qry,function(err,results){
						cb(err,results);
					});
				},
				poolNumbers: function(cb){
					qry = "SELECT DISTINCT ppn.phone_number as number,pp.pool_id,ppn.vendor_id";
					qry += " FROM phone_pool AS pp";
					qry += " JOIN phone_pool_number AS ppn ON ppn.pool_id = pp.pool_id";
					qry += " WHERE pp.org_unit_id IN (SELECT org_unit_id FROM org_unit WHERE billing_id = "+billingOuid+");";

					trans.query(qry,function(err,results){
						cb(err,results);
					});
				}
			},
			function(err,results){
				r.phoneNumbers = results.phoneNumbers;
				r.poolNumbers = results.poolNumbers;
				trans.close(function(er){
					callback(er,r);
				});
			});
		});
	},
	// trakcingNumber is single number
	// ringToNumbers is array
	getLDMInfo: function(trackingNumber, ringToNumbers, cb) {
		ringToNumbers = _.compact(ringToNumbers);
		this.getLata([trackingNumber].concat(ringToNumbers), function(err, records) {
			var res = { isLDM: false, numberType: '', rateCenter: '' };
			var numbers = [ ];
			
			[trackingNumber].concat(ringToNumbers)
			.forEach(function(number__) {
				var npaxx = _.find(records, { npa: parseInt(number__.substring(0, 3)) });

				if(npaxx === undefined) return;
				
				numbers.push({ 
					npa: parseInt(npaxx.npa),
					number: number__,
					numberType: parseInt(npaxx.npa) === parseInt(trackingNumber.toString().substring(0, 3)) ? 'Tracking Number' : 'Ring to number',
					isLDM: false,
					lata: npaxx.lata,
					rateCenterName: '',
					cost: 0
				});
			});

			phoneNumber.setLDMStatus(numbers);
			phoneNumber.getRateCenterRate(_.pluck(numbers, 'rateCenterName'),function(err, rates) {
				phoneNumber.isPremiumNumber(trackingNumber, function(isPremiumNumber) {
					var isTrackingNumberPremium = false;

					if(isPremiumNumber) {
						numbers.forEach(function(number__) {
							if(number__.numberType === 'Tracking Number') { isTrackingNumberPremium = true; };
						});
					}

					if(isTrackingNumberPremium) { cb(res); return; };
					// no number is ldm
					if(_.filter(numbers, { isLDM: true}).length === 0) { cb(res); return; }

					// either tracking number or ring to number is ldm
					if(_.filter(numbers, { isLDM: true}).length === 1) { 
						res.isLDM = true;
						res.rateCenter = _.filter(numbers, { isLDM: true})[0].rateCenterName;
						res.rateCenter = _.filter(numbers, { isLDM: true})[0].rateCenterName;
						res.numberType = _.filter(numbers, { isLDM: true})[0].numberType;
					}

					// case 1) either tracking number and ring to number both are ldm
					// case 2) tracking number is not ldm but more than 1 ring to numbers are ldm
					if(_.filter(numbers, { isLDM: true}).length > 1) { 
						// all ldms belong to same rate center, means no ldm charges
						if(_.filter(numbers, { isLDM: true, numberType: 'Tracking Number'}).length > 0) {
							// all ldms belong to same rate center, means no ldm charges
							res.isLDM = _.uniq(_.map(_.filter(numbers, { isLDM: true}), 'lata')).length > 1;
						} else {
							res.isLDM = true;
						}
						
						if(!res.isLDM) { cb(res); return };

						numbers.forEach(function(number__) {
							if(_.find(rates, { rateCenterName: number__.rateCenterName })) {
								number__.cost = parseFloat(_.find(rates, { rateCenterName: number__.rateCenterName }).cost);
							}
						});
						
						// case 1) tracking number and ring to number both are ldm
						if(_.filter(numbers, { isLDM: true, numberType: 'Tracking Number'}).length === 1) {
							var numberWithGreaterCost = _.max(numbers, 'cost');

							res.numberType = numberWithGreaterCost.numberType;
							res.rateCenter = numberWithGreaterCost.rateCenterName;
							res.cost = numberWithGreaterCost.cost;
						}

						// case 2) all ring to numbers are ldm
						if(_.filter(numbers, { isLDM: true, numberType: 'Ring to number'}).length > 0) {
							var numberWithGreaterCost = _.max(numbers, 'cost');

							res.numberType = numberWithGreaterCost.numberType;
							res.rateCenter = numberWithGreaterCost.rateCenterName;
							res.cost = numberWithGreaterCost.cost;
						}
					}
					cb(res);
				});
			});
		});
	},
	getLata: function(phoneNumbers, cb) {
		var npas = '';
		phoneNumbers.map(function(phoneNumber__) { 
			return phoneNumber__.toString().substring(0, 3)
		})
		.forEach(function(phoneNumber__) { 
			npas = npas === '' ? phoneNumber__ : npas + ',' + phoneNumber__;
		});
		var qry = "SELECT npa, lata FROM npanxx_city WHERE npa IN (" +  npas + ") GROUP BY npa, lata HAVING lata IS NOT NULL";
		connector.ctPool.query(qry,function(err,data) {
			if(err) {
				cb(err, null);
			} else {
				cb(null, data);
			}
		});
	},
	setLDMStatus: function(numbers) {	   
		var ldmConfig = yaml.load(fs.readFileSync("config/LDM_components.yml"));
		Object.keys(ldmConfig).forEach(function(rateCenter) {
			numbers.forEach(function(number__) {
				if(ldmConfig[rateCenter].indexOf(parseInt(number__.lata)) > -1) {
					number__.isLDM = true;
					number__.rateCenterName = rateCenter.replace(/_/g, ' ');
				}
			});
		});
	},
	getRateCenterRate: function(rateCenterNames_, cb) {
		var rateCenterNames = '';
		var res = [];

		rateCenterNames_.forEach(function(rateCenterName__) { 
			rateCenterNames = rateCenterNames === '' ? rateCenterName__ : rateCenterNames + ',' + rateCenterName__;
		});

		var qry="SELECT tier_name, usage_cost from phone_tier";

		connector.ctPool.query(qry,function(err,data){
			data.forEach(function(data) {
				if(rateCenterNames_.indexOf(data.tier_name) !== -1) {
					res.push({ rateCenterName: data.tier_name, cost: parseFloat(data.usage_cost)});
				}
			});
			if(err) {
		    	cb(err, null);
			} else {
				cb(null, res);
			}
		});
	},
	isPremiumNumber: function(trackingNumber, cb) {
		if(!trackingNumber) { cb(false); return };
		if(isNaN(parseFloat(trackingNumber))) { cb(false); return };

		var qry = "SELECT * FROM phone_number where number=" + parseInt(trackingNumber);

		connector.ctPool.query(qry, function(err, data){
			if(err || data.length === 0) {
				cb(false);
			} else {
				var qry = "SELECT * FROM org_component JOIN org_component_count occ ON (org_component.component_id = occ.component_id) " +
				"WHERE org_component.number_id=" + parseInt(data[0].number_id) + " AND org_component.component_type='number'";
				
				connector.ctPool.query(qry, function(err, data){
					if(err || data.length === 0) {
						cb(false);
					} else {
						cb(true);
					}
				});
			}
		});
	}		
};

module.exports = phoneNumber;
