/**
 * Created by davey on 5/15/15.
 */
"use strict";

var connector = require('./appModel'),
	ctTransactionModel = require('./ctTransactionModel'),
	async = require('async'),
	_ = require('underscore'),
	ctlogger = require('../lib/ctlogger.js'),
	zuoraController = require('../controllers/zuoraController'),
	dripController = require('../controllers/dripController'),
	moment = require('moment');


var billing = {
	count: function (ouid, res) {
		console.log('starting count');
		if (!ouid) { return res('No Org Unit ID specified'); }

		var qry = "SELECT billing_id, org_unit_id FROM org_unit WHERE org_unit_id="+ouid;
		connector.ctPool.query(qry, function (err, self) {
			if (err) { return res("Failed to execute check for billing node. "+err); }
			async.waterfall([
			// insert components for billing node
			function(callback) {
				if (self[0].billing_id === self[0].org_unit_id) {
					console.log('BILLING NODE');
						var qry = "SELECT c.component_name, c.component_id, SUM(occ.count_total) AS count_total, SUM(occ.secondary_total) AS secondary_total ";
							qry += " FROM org_component_count occ ";
							qry += " JOIN org_unit o ON(occ.org_unit_id = o.org_unit_id)";
							qry += " JOIN org_account oa ON(oa.org_unit_id = o.billing_id AND oa.subscription_id IS NOT NULL) ";
							qry += " JOIN subscription s ON (oa.subscription_id = s.subscription_id) ";
							qry += " JOIN component c ON (occ.component_id = c.component_id)";
							qry += " JOIN subscription_component sc ON (s.subscription_id = sc.subscription_id AND occ.component_id = sc.component_id)";
							qry += " WHERE (o.org_unit_id=" + ouid + " OR o.billing_id=" + ouid + ") AND o.org_unit_status <> 'deleted'";
							qry += " GROUP BY c.component_name, c.component_id ";
							qry += " ORDER BY c.component_id ASC";
						connector.ctPool.query(qry, function (err, data) {

							if (err) { return res("Failed to execute query for count totals. "+err); }
							callback(null, data);
						});
			} else {
				var qry = " SELECT c.component_name, c.component_id, SUM(occ.count_total) AS count_total, SUM(occ.secondary_total) AS secondary_total ";
					qry += " FROM org_component_count occ ";
					qry += " JOIN org_unit o ON(occ.org_unit_id = o.org_unit_id)";
					qry += " JOIN org_account oa ON(oa.org_unit_id = o.billing_id AND oa.subscription_id IS NOT NULL) ";
					qry += " JOIN subscription s ON (oa.subscription_id = s.subscription_id) ";
					qry += " JOIN component c ON (occ.component_id = c.component_id)";
					qry += " JOIN subscription_component sc ON (s.subscription_id = sc.subscription_id AND occ.component_id = sc.component_id)";
					qry += " WHERE o.org_unit_id=" + ouid + " AND o.org_unit_status <> 'deleted'";
					qry += " GROUP BY c.component_name, c.component_id ";
					qry += " ORDER BY c.component_id ASC";
				connector.ctPool.query(qry, function (err, data) {
					if (err) { return res(err); }
					callback(null, data);
				});
				}
			},function(data,callback){
				var premiumNumbers = {
						component_name: 'Premium Numbers',
						count_total: 0,
						secondary_total: 0 };
				var query = "SELECT COALESCE(SUM(occ.count_total),0) AS count_total,COALESCE(SUM(occ.secondary_total),0) AS secondary_total FROM  org_component_count occ "
						+"JOIN org_unit ou ON ( ou.org_unit_id = occ.org_unit_id ) "
						+"JOIN org_component oc ON(occ.component_id = oc.component_id AND oc.org_unit_id = occ.org_unit_id ) "
						+"WHERE oc.component_type ='number' AND ou.org_unit_status <> 'deleted' ";

						console.log(self[0].billing_id === self[0].org_unit_id);
					if (self[0].billing_id === self[0].org_unit_id) {
						query += " AND (ou.org_unit_id = " + ouid + " OR ou.billing_id = "+ouid + ")";
					}else{
						query += "AND ou.org_unit_id = " + ouid;
					}


					connector.ctPool.query(query, function (err, ret) {
						if (err) { return res(err); }
						if(ret[0].count_total){premiumNumbers.count_total = ret[0].count_total}
						if(ret[0].secondary_total){premiumNumbers.secondary_total = ret[0].secondary_total}
								data[data.length] = premiumNumbers;
								callback(null, data);
						});
			},function(data,callback){
				var premiumMinutes = {
					component_name: 'Premium Minutes',
					count_total: 0,
					secondary_total: 0 };
					var query ="SELECT COALESCE(SUM(occ.count_total),0) AS count_total FROM  org_component_count occ "
						  +"JOIN org_unit ou ON ( ou.org_unit_id = occ.org_unit_id ) "
						  +"JOIN org_component oc ON(occ.component_id = oc.component_id AND oc.org_unit_id = occ.org_unit_id ) "
						  +"JOIN phone_number pn ON (pn.number_id = oc.number_id ) "
						  +"WHERE oc.component_type ='minute' AND ou.org_unit_status <> 'deleted' ";

					if (self[0].billing_id === self[0].org_unit_id) {
						query += " AND (ou.org_unit_id = " + ouid + " OR ou.billing_id = "+ouid + ")";
					}else{
						query += "AND ou.org_unit_id = " + ouid;
					}

					connector.ctPool.query(query, function (err, ret) {
					if (err) { return res(err); }
					if(ret[0].count_total){premiumMinutes.count_total = ret[0].count_total}
						data[data.length] = premiumMinutes;
						callback(null, data);
				});
			},
			function(data,callback){
				var analyzedNumbers = {
						component_name: 'Analyzed Numbers',
						count_total: 0,
						secondary_total: 0 };
				var query = "SELECT COALESCE(SUM(occ.count_total),0) AS count_total,"
						+"COALESCE(SUM(occ.secondary_total),0) AS secondary_total "
						+"FROM  org_component_count occ "
						+"JOIN org_unit ou ON ( ou.org_unit_id = occ.org_unit_id ) "
						+"WHERE occ.component_id = 19 AND ou.org_unit_status <> 'deleted' ";

						console.log(self[0].billing_id === self[0].org_unit_id);
					if (self[0].billing_id === self[0].org_unit_id) {
						query += " AND (ou.org_unit_id = " + ouid + " OR ou.billing_id = "+ouid + ")";
					}else{
						query += "AND ou.org_unit_id = " + ouid;
					}


					connector.ctPool.query(query, function (err, ret) {
						if (err) { return res(err); }
						if(ret[0].count_total){analyzedNumbers.count_total = ret[0].count_total}
						if(ret[0].secondary_total){analyzedNumbers.secondary_total = ret[0].secondary_total}
								data[data.length] = analyzedNumbers;
								callback(null, data);
						});
			}],function(err,result){
				res(null,result);
			});
		});
	},
	countEach: function(ouid, res) {
		console.log('starting countEach');
		if (!ouid) { return res('No Org Unit ID specified'); }

		var qry = "SELECT o.org_unit_id, c.component_name, c.component_id, occ.count_total, occ.secondary_total, sc.component_ext_id " +
			"FROM org_component_count occ, component c, org_unit o, org_account oa LEFT JOIN subscription_component sc ON (oa.subscription_id=sc.subscription_id AND oa.subscription_id IS NOT NULL) " +
			"WHERE (o.org_unit_id="+ouid+" OR o.billing_id="+ouid+") AND o.org_unit_id=oa.org_unit_id  AND (oa.component_id=c.component_id OR sc.component_id=c.component_id) AND " +
			"c.component_id=occ.component_id AND o.org_unit_id=occ.org_unit_id AND o.org_unit_status <> 'deleted'" +
			"GROUP BY o.org_unit_id, c.component_name, c.component_id, occ.count_total, occ.secondary_total, sc.component_ext_id " +
			"ORDER BY o.org_unit_id ASC, c.component_id ASC";
		connector.ctPool.query(qry, function (err, data) {
			if (err) { return res("Failed to execute query for count totals. "+err); }

			// create the data set grouping
			var ret = {};
			var cur = '';
			_.each(data, function(row) {
				if (cur !== row.org_unit_id) {
					ret[row.org_unit_id] = [];
					cur = row.org_unit_id;
				}
				ret[cur].push(row);
			});
			return res(null, ret);

		});
	},
	// this will get the current count of active and inactive campaigns based on the timestamp passed
	countCampaign: function(ouid, time, res) {
		console.log('starting countCampaign');
		if (!ouid) { return res('No Org Unit ID supplied'); }
		var date = (time ? moment(time).format("YYYY-MM-DD HH:mm:ss") : moment().format("YYYY-MM-DD HH:mm:ss"));
		var ret = { 'component_name':'Campaign', 'component_id':'2', 'count_total':0, 'secondary_total':0 };

		//  query the current count totals for active and inactive campaigns
		var qry = "SELECT COUNT(campaign_status) AS total, campaign_status FROM campaign WHERE campaign_ou_id="+ouid+" AND campaign_start_date <= '"+date+"' ";
		qry += "AND (campaign_end_date > '"+date+"' OR campaign_end_date IS NULL) GROUP BY campaign_status";
		connector.ctPool.query(qry, function (err, data) {
			if (err) { return res('Failed to execute query for campaign count. '+err); }

			// cycle through result set and pull out active and inactive counts
			async.each(data, function(row, callback) {
				if (row.campaign_status === 'active') {
					ret.count_total = row.total;
				} else if (row.campaign_status === 'inactive') {
					ret.secondary_total = row.total;
				}
				callback(null);
			}, function(err) {
				if (err) { return res(err); }

				if (ret.count_total < 1 && ret.secondary_total < 1) { return res(null, ret); } // skip update with zero value

				// update the component count record
				var updateData = {
					table   : 'org_component_count',
					values  : {'count_total':ret.count_total, 'secondary_total':ret.secondary_total},
					where   : " WHERE org_unit_id="+ouid+" AND component_id=2"
				};
				connector.ctPool.update(updateData, function (err) {
					if (err) { res("Failed to update org component count for campaigns. "+err); } else { res(null, ret); }
				});
			});
		});
	},
	// resets the count total for phone numbers
	countPhone: function(ouid, res) {
		console.log('starting countPhone');
		if (!ouid) { return res('No Org Unit ID supplied'); }
		var ret = { 'component_name':'Numbers', 'component_id':'18', 'sec_comp_id':'22', 'sec_name':'Inactive Numbers', 'count_total':0, 'secondary_total':0 };

		//  query the current count totals for active and inactive phone numbers
		var qry = "SELECT prn.phone_number_id, pr.provisioned_route_status, pr.provisioned_route_id FROM provisioned_route pr LEFT JOIN provisioned_route_number prn ON (pr.provisioned_route_id=prn.provisioned_route_id) ";
		qry += "WHERE pr.provisioned_route_ou_id="+ouid+" AND (pr.provisioned_route_status='active' OR pr.provisioned_route_status='inactive') AND pr.provisioned_route_status <> 'deleted' ";
		connector.ctPool.query(qry, function (err, data) {
			if (err) { return res("Failed to execute query for count on phone numbers. "+err); }

			// cycle through result set and pull out active and inactive counts
			async.each(data, function(row, callback) {
				var cnt = 0;
				// set the correct count of phone numbers
				if (row.phone_number_id) { // need to query numbers_pool to get phone count
					cnt = 1;

				} else {
					var mongo = {
						qry: { provisioned_route_id: row.provisioned_route_id, app_id: 'CT'},
						collection: 'phone_number_pools',
						projection: { phone_number: 1 }
					};
					console.log("MONGO SETTINGS", mongo);
					console.log('PHONE_NUMBER_ID', row.phone_number_id);

					connector.mongoPool.query(mongo, function(err, data) {
						//console.log('MONGO RETURN DATA', err, data);
						if (err) { return callback('Failed to read number pool for provisioned route '+row.provisioned_route_id); }
						cnt = data.length;
						console.log("Number pool count", cnt);
					});
				}

				// increment the appropriate count
				if (row.provisioned_route_status === 'active' || row.provisioned_route_status === 'inactive') {
					ret.count_total += cnt;
				}
				callback(null);
			},
			function(err) {
				if (err) { return res(err); }
				if (ret.count_total < 1 && ret.secondary_total < 1) { return res(null, ret); } // skip update with zero value

				// update the component count record for ACTIVE numbers
				var updateData = {
					table   : 'org_component_count',
					values  : { 'count_total':ret.count_total },
					where   : " WHERE org_unit_id="+ouid+" AND component_id=18"
				};
				connector.ctPool.update(updateData, function (err) {
					if (err) { return res("Failed to update org component count for phone numbers. "+err); }
					if (ret.secondary_total < 1) { return res(null, ret); } // skip update with zero value
						res(null, ret);
				});
			});
		});
	},
	// resets the count total for users
	countUser: function(ouid, res) {
		console.log('starting countUser');
		if (!ouid) { return res('No Org Unit ID supplied'); }
		var ret = { 'component_name':'Users', 'component_id':'3', 'count_total':0, 'secondary_total':0 };

		// query the current count totals for active and inactive users
		var qry = "SELECT COUNT(ct_user_id) AS total, user_status FROM ct_user WHERE ct_user_ou_id="+ouid+" GROUP BY user_status";
		connector.ctPool.query(qry, function (err, data) {
			if (err) { res(err); return; }
			// cycle through result set and pull out active and inactive counts
			_.each(data, function(row) {
				if (row.user_status === 'active') {
					ret.count_total = row.total;
				} else if (row.user_status === 'inactive') {
					ret.secondary_total = row.total;
				}
			});
			if (ret.count_total < 1) { return res(null, ret); } // skip update with zero value

			// update the component count record
			var updateData = {
				table   : 'org_component_count',
				values  : {'count_total':ret.count_total, 'secondary_total':ret.secondary_total},
				where   : " WHERE org_unit_id="+ouid+" AND component_id=3"
			};
			connector.ctPool.update(updateData, function (err) {
				if (err) { return res("Failed to update org component count for users. "+err); }
				console.log('finished countUser - returning', ret);
				res(null, ret);
			});
		});
	},
	// resets the count total of Calls and Minutes
	countCall: function(ouid, date, res) {
		console.log('starting countCall');
		if (!ouid) { return res('No Org Unit ID supplied'); }
		if (!date) { return res('No starting date specified'); }

		var qry = "SELECT COUNT(call_id) AS call_total, SUM(duration) AS min_total FROM call WHERE org_unit_id="+ouid+" AND call_started >= '"+date+"'";
		connector.ctPool.query(qry, function (err, data) {
			if (err) { return res("Failed to retrieve count totals for calls and minutes"+err); }

			var ret = { 'component_name':'Calls', 'component_id':'5', 'sec_comp_id':'21', 'sec_name':'Minutes', 'count_total':data[0].call_total,
				'secondary_total':(data[0].min_total !== null ? data[0].min_total : 0) };
			if (ret.count_total < 1 && ret.secondary_total < 1) { return res(null, ret); } // skip update with zero value

			// update the component count record for total CALLS
			var updateData = {
				table   : 'org_component_count',
				values  : { 'count_total':ret.count_total },
				where   : " WHERE org_unit_id="+ouid+" AND component_id=5"
			};
			connector.ctPool.update(updateData, function (err) {
				if (err) { return res("Failed to update org component count for total calls. "+err); }
				if (ret.secondary_total < 1) { return res(null, ret); } // skip update with zero value

				// update the component count record for total MINUTES
				updateData = {
					table   : 'org_component_count',
					values  : { 'count_total':ret.secondary_total },
					where   : " WHERE org_unit_id="+ouid+" AND component_id=21"
				};
				connector.ctPool.update(updateData, function (err) {
					if (err) { return res("Failed to update org component count for total minutes. "+err); }
					console.log('finished countCall - returning', ret);
					res(null, ret);
				});
			});

		});
	},
	// resets the count total for Call Actions
	countAction: function(ouid, res) {
		console.log('starting countAction');
		if (!ouid) { return res('No Org Unit ID supplied'); }

		var qry = "SELECT COUNT(ca.action_id) AS call_action FROM call_action ca, provisioned_route pr WHERE pr.provisioned_route_ou_id="+ouid+" AND pr.provisioned_route_status='active' AND " +
			"pr.provisioned_route_id=ca.provisioned_route_id";
		connector.ctPool.query(qry, function (err, data) {
			if (err) { return res("Failed to retrieve count total for Call Actions" + err); }

			var ret = { 'component_name':'Call Actions', 'component_id':'10', 'count_total':data[0].call_action, 'secondary_total':0 };
			if (ret.count_total < 1) { return res(null, ret); } // skip update with zero value

			// update the component count record for total CALLS
			var updateData = {
				table :'org_component_count',
				values:{'count_total':ret.count_total},
				where :" WHERE org_unit_id=" + ouid + " AND component_id=10"
			};
			connector.ctPool.update(updateData, function (err) {
				if (err) { return res("Failed to update org component count for Call Actions. " + err); }
				console.log('finished countAction - returning', ret);
				res(null, ret);
			});
		});
	},

	/*  This will reset the counters to zero and then get the current count for the timestamp provided (and NOW() on some) to set the starting count totals
		NOTE: it will count the current active/inactive campaigns, phone numbers, and users to set starting totals
			Also this will only reset the supplied OU count totals, unless it's a billing node, in which case all children are processed as well */
	reset: function (req, res) {
		if (!req.body.org_unit_id) { res('No Org Unit ID specified'); return; }
		console.log('RESET COUNT TOTALS');
		var ctTrans = new ctTransactionModel.begin(function(err){
			async.waterfall([
				function (callback) {
					console.log('First Execute..');
					var billing_qry = "UPDATE org_component_count " +
					"SET count_total = 0 , secondary_total = 0 "+
					"FROM org_unit ou "+
					"WHERE ou.org_unit_id = org_component_count.org_unit_id and org_component_count.component_id IN (5,21,19) "+
					"AND (ou.billing_id=" + req.body.org_unit_id + " OR ou.org_unit_id=" + req.body.org_unit_id+") AND ou.org_unit_status <> 'deleted' ";
					ctTrans.query(billing_qry, function(err, data) {
						callback(err);
					});
				},
				function (callback) {
					var billing_qry = "UPDATE org_component_count " +
							"SET count_total = 0 , secondary_total = 0" +
							"FROM org_component oc "+
							"JOIN org_unit ou ON (ou.org_unit_id = oc.org_unit_id ) "+
							"WHERE org_component_count.component_id = oc.component_id and oc.component_type = 'minute' "+
							"AND (ou.billing_id=" + req.body.org_unit_id + " OR ou.org_unit_id=" + req.body.org_unit_id+") AND ou.org_unit_status <> 'deleted' ";
					ctTrans.query(billing_qry, function(err, data) {
						callback(err);
					});
				}
			],
			function (err) {
				if (err) {
					ctTrans.rollback(function(){
						res(err);
					});
				} else {
					ctTrans.commit(function(){
						res(null);
					});
				}
			})
		});
	},

	resetAndSaveLog: function (req, res) {
		if (!req.body.usageData.org_unit_id) { res('No Org Unit ID specified'); return; }
		console.log('RESET COUNT TOTALS');
		
		var ctTrans = new ctTransactionModel.begin(function(err){
			async.waterfall([
				function (callback) {
					console.log('First Execute..');
					var billing_qry = "UPDATE org_component_count " +
					"SET count_total = 0 , secondary_total = 0 "+
					"FROM org_unit ou "+
					"where ou.org_unit_id = org_component_count.org_unit_id and org_component_count.component_id IN (5,21,19) "+
					"and (ou.billing_id=" + req.body.usageData.org_unit_id + " OR ou.org_unit_id=" + req.body.usageData.org_unit_id+")";
					ctTrans.query(billing_qry, function(err, data) {
						callback(err);
					});
				},
				function (callback) {
					var billing_qry = "UPDATE org_component_count " +
							"SET count_total = 0 , secondary_total = 0" +
							"FROM org_component oc "+
							"JOIN org_unit ou ON (ou.org_unit_id = oc.org_unit_id ) "+
							"where org_component_count.component_id = oc.component_id and oc.component_type = 'minute' "+
							"and (ou.billing_id=" + req.body.usageData.org_unit_id + " OR ou.org_unit_id=" + req.body.usageData.org_unit_id+")";
					ctTrans.query(billing_qry, function(err, data) {
						callback(err);
					});
				},
				function (callback) {

					var billing_qry = "UPDATE org_component_count "+
					"SET count_total = 0 , secondary_total = 0 where component_id IN ( "+
					"SELECT c.component_id from org_component_count oc "+
					"JOIN org_unit ou ON ou.org_unit_id = oc.org_unit_id  "+
					"JOIN component c ON c.component_id = oc.component_id  "+
					"JOIN component_types ct ON c.component_type_id = ct.component_type_id  "+
					"WHERE c.component_type_id IN (2,4,5) AND (ou.billing_id=" + req.body.usageData.org_unit_id + " OR ou.org_unit_id=" + req.body.usageData.org_unit_id + ") " +
					"GROUP BY c.component_id ) AND org_unit_id IN ( "+
					"SELECT ou.org_unit_id from org_unit as ou where ou.billing_id=" + req.body.usageData.org_unit_id + ") "

					console.log(billing_qry);
					
					ctTrans.query(billing_qry, function(err, data) {
						callback(err);
					});
				},
				function (callback) {
					var save_log_query = "INSERT INTO usages_logs " +
							"(org_unit_id, account_code, billing_code, usage_data, created_by, updated_by) VALUES" +
							"(" + req.body.usageData.org_unit_id  + ",'" +  req.body.usageData.account_code + "','" + req.body.usageData.billing_code + "','" + 
							JSON.stringify(req.body.usageData.usage_data) +"'," + req.userid + "," + req.userid + ")";
					ctTrans.query(save_log_query, function(err, data) {
						
						callback(err);
					});
				}
			],
			function (err) {
				if (err) {
					ctTrans.rollback(function(){
						res(err);
					});
				} else {
					ctTrans.commit(function(){
						res(null);
					});
				}
			})
		});
	},

	processReset: function(data, req, res) {
		var ret = {};
		var start_date = (req.body.cycle_start ? req.body.cycle_start : moment().format("YYYY-MM-DD HH:mm:ss"));

		// cycle through all matching records
		async.each(data, function(row, callback) {
			console.log('processing org_unit ' + row.org_unit_id);

			var start_date = (req.body.count_start ? req.body.count_start : moment().format("YYYY-MM-DD HH:mm:ss"));

			// first reset the count totals, then get the count totals for each component for the current org unit
			async.series([
				function(callback2) {
					var qry = "UPDATE org_component_count SET count_total= 0 from org_component oc, org_unit ou" +
					"where oc.component_type='minute' and oc.component_id = org_component_count.component_id"+
					"and oc.org_unit_id = ou.org_unit_id and ou.billing_id=" + req.body.org_unit_id + " OR ou.org_unit_id=" + req.body.org_unit_id;
					"and oc.component_id IN (5,21)";
					connector.ctPool.query(qry, function (err) {
						if (err) { return callback2("Failed to reset org unit component count totals for "+row.org_unit_id+". " + err); }
						callback2(null);
					});
				},
				function(callback2) {
					async.parallel([
						function(cb) {
							// adjust the count for campaigns
							billing.countCampaign(row.org_unit_id, start_date, function(err, camp) {
								if (err) { return cb("Failed to adjust counts for Campaigns. "+err); }
								cb(null, camp);
							});
						},
						function(cb) {
							// adjust the count for phone numbers
							billing.countPhone(row.org_unit_id, function(err, ph) {
								if (err) { return cb("Failed to adjust count for Numbers and Inactive Numbers. "+err); }
								cb(null, ph);
							});
						},
						function(cb) {
							// adjust the count for users
							billing.countUser(row.org_unit_id, function(err, user) {
								if (err) { return cb("Failed to adjust User count " + err); }
								cb(null, user);
							});
						},
						function(cb) {
							// adjust the count for calls and minutes
							billing.countCall(row.org_unit_id, start_date, function(err, call) {
								if (err) { return cb("Failed to adjust Call and Minutes count for Org Unit "+row.org_unit_id+". "+err); }
								cb(null, call);
							});
						},
						function(cb) {
							// adjust the count for call actions
							billing.countAction(row.org_unit_id, function(err, action) {
								if (err) { return cb("Failed to adjust Call Actions count " + err); }
								cb(null, action);
							});
						}
					],
					function(err, results) {
						if (err) { return callback2("Failed in count process for Org Unit "+row.org_unit_id+". "+err); }
						console.log("RESET RESULTS", results);

						// set the count totals
						var tot = {};
						async.each(results, function(row, callback2) {
							//console.log('count record', row);
							if (row.sec_name !== undefined) {
								tot[row.component_id] = {
									'component_name':row.component_name,
									'count_total'   :row.count_total
								};
								tot[row.sec_comp_id] = {
									'component_name':row.sec_name,
									'count_total'   :row.secondary_total
								};
							} else {
								tot[row.component_id] = {
									'component_name':row.component_name,
									'count_total'   :row.count_total,
									'secondary_total':row.secondary_total
								};
							}
							callback2(null);

						}, function(err) {
							console.log('FINISHED count totals for', row.org_unit_id);
							if (err) { return callback(err); }
							ret[row.org_unit_id] = tot;
							callback(null);

							// log that the counts were reset
							/*req.body.count_totals = tot;
							 var newdata = {
							 'org_unit_id':row.org_unit_id,
							 'ct_user_id' :req.userid,
							 'log_data'   :req.body
							 };
							 ctlogger.log(newdata, 'update', 'billing', 'count totals reset','',req.headers.authorization);
							 */
						});
					}); // end of parallel
				}
			],
			function(err) {
				if (err) { return eachback('Failed on Org Unit '+row.org_unit_id+". "+err); }
				console.log("FINISHED series");
				eachback(null);
			}); // end of series

		}, function(err) {
			if (err) { return res("Failed to reset totals. "+err); }
			console.log("finished processReset");
			return res(null, ret);
		});
	},
	updateDate: function(req, res) {
		// update the count timestamps
		console.log('UPDATING BILLING DATES', req.body);
		var up = '';
		/*var up = ", cycle_start=" + (req.body.cycle_start ? "'"+req.body.cycle_start+"'" : "cycle_end") +
				", cycle_end=" + (req.body.cycle_end ? "'"+req.body.cycle_end+"'" : moment().format("YYYY-MM-DD"));
		*/
		if (req.body.billing_date) { up += ", prev_invoice_date='"+req.body.billing_date+"', prev_invoice_amount='0.00'"; }
		var qry = "UPDATE org_billing SET prev_count_start=current_count_start, current_count_start=CURRENT_TIMESTAMP"+up+" WHERE org_unit_id="+req.body.org_unit_id;
		connector.ctPool.query(qry, function (err) {
			if (err) { return res("Failed to reset billing cycle timestamps. " + err); }
			res(null);
		});
	},
	usage: function(req, res) {
		console.log('starting usage');
		billing.count(req.params.ouid, function(err, data) {
			if (err) { res(err); return; }
			req.body.org_unit_id = req.params.ouid;
			console.log('setting OUID to', req.params.ouid);

			billing.reset(req, function(err, resetdata) {
				if (err) { return res(err); }
				var ret = { 'count_totals':data, 'reset_totals':resetdata };
				console.log('finished usage - returning', ret);
				res(null, ret);
			});
			/*var qry = "SELECT org_unit_id, billing_id FROM org_unit WHERE org_unit_id=" + req.body.org_unit_id;
			connector.ctPool.query(qry, function(err, billnode) {
				if (billnode[0].org_unit_id !== billnode[0].billing_id) { // org unit is not a billing node - only process for that OU
					// normal reset of only one org_unit
					console.log('executing normal');
					billing.reset(req, function(err) {
						var ret = { 'count_totals':data, 'reset_totals':data };
						if (err) { res(err); } else { res(null, ret); }
					});

				} else {
					console.log('billing node');
					billing.countEach(req.params.ouid, function(err, reset) {
						if (err) { return res("Failed to retrieve count totals for each child node. "+err); }

						billing.reset(req, function(err) {
							if (err) { return res(err); }
							var ret = { 'count_totals':data, 'reset_totals':reset };
							res(null, ret);
						});
					});
				}
			});
			*/
		});
	},
	overwrite: function(req, res) {
		if (!req.org_unit_id) { res('No Org Unit ID specified'); return; }
		if (req.count_total.length < 1) { res('No count total amounts sent'); return; }

		_.each(req.count_total, function(row, key) {
			if (row.count_total === undefined) {
				_.each(row, function(nrow, ky) {
					if (ky === 21 || ky === 5) { // keep the count from when reset was called and add the total amount to it (Calls & Minutes)
						var qry = "UPDATE org_component_count SET count_total=count_total+" + nrow.count_total + ", secondary_total=secondary_total+" +
							nrow.secondary_total + " WHERE component_id=" + ky + " AND org_unit_id=" + key;
						connector.ctPool.query(qry, function (err) {
							if (err) { return res("Failed to update count on " + nrow.component_name + " for org unit "+key+". " + err); }
						});
					}
				});
			} else {
				if (key === 21 || key === 5) { // keep the count from when reset was called and add the total amount to it (Calls & Minutes)
					var qry = "UPDATE org_component_count SET count_total=count_total+" + row.count_total + ", secondary_total=secondary_total+" +
						row.secondary_total + " WHERE component_id=" + key + " AND org_unit_id=" + req.org_unit_id;
					connector.ctPool.query(qry, function (err) {
						if (err) { return res("Failed to update count on " + row.component_name + ". " + err); }
					});
				}
				/* else {
				 var qry = "UPDATE org_component_count SET count_total=" + row.count_total + ", secondary_total=" +
					row.secondary_total + " WHERE component_id=" + row.component_id + " AND org_unit_id=" + req.org_unit_id;
				 }*/
			}
		});
		res(null, { 'message':'Count totals reset for Org Unit ' + req.org_unit_id });
	},
	getProfile: function(ouid, res) {
		if (!ouid) { res('No Org Unit ID/Zuora Account ID specified'); return; }
		if (isNaN(ouid)) {
			var rule = "ob.billing_account_id='" + ouid + "'";
		} else {
			var rule = "ob.org_unit_id=" + ouid;
		}
		//var qry = "SELECT * FROM org_billing WHERE org_unit_id=" + ouid;
		var qry = "SELECT ob.*, o.org_unit_name AS account_name, s.subscription_name AS billing_name FROM org_unit o, org_billing ob " +
			"LEFT JOIN org_account oa ON (ob.org_unit_id=oa.org_unit_id AND oa.subscription_id IS NOT NULL) " +
			"LEFT JOIN subscription s ON (oa.subscription_id=s.subscription_id)  WHERE " + rule + " AND ob.org_unit_id=o.org_unit_id";
		connector.ctPool.query(qry, function (err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	postProfile: function(body, res, ctTrans) {
		if(!ctTrans)
			ctTrans = connector.ctPool;
		if (!body.org_unit_id) { res('missing Org Unit ID'); return; }
		var qry = "SELECT * FROM org_billing WHERE org_unit_id=" + body.org_unit_id;
		ctTrans.query(qry, function(err, data) {
			if (err) { return res('Failed to execute org_billing lookup. ' + err); }
			if (data.length > 0) { return res('Already have billing profile for this Org Unit'); }
			body.is_migrated = true;
			var insertData = {
				table :'org_billing',
				values:body
			};
			ctTrans.insert(insertData, function (err, data1) {
				if (err) { return res('Failed to insert org_billing record. ' + err); }

				// now update org_unit to become a billing node
				var updateData = {
					table :'org_unit',
					values:{'billing_id':body.org_unit_id},
					where :" WHERE org_unit_id=" + body.org_unit_id
				};
				ctTrans.update(updateData, function (err, data2) {
					if (err) { return res('Failed to update org_billing record. ' + err); }

					// and update all child of org_unit to point to this OU
					qry = "UPDATE org_unit SET billing_id=" + body.org_unit_id + " WHERE org_unit_id IN ";
					qry += "((SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id="+body.org_unit_id+") UNION ";
					qry += "(SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IN (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id="+body.org_unit_id+")) UNION ";
					qry += "(SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id="+body.org_unit_id+"))";
					ctTrans.query(qry, function(err, data) {
						if (err) { return res('Failed to update children org_unit to use new record as billing node. ' + err); }
						res(null, data2);
					});
				});
			});
		});
	},
	putProfile: function(body, res) {
		if (!body.org_unit_id) { res('missing Org Unit ID'); return; }
		var updateData = {
			table : 'org_billing',
			values: body,
			where: ' WHERE org_unit_id = ' + body.org_unit_id
		};
		connector.ctPool.update(updateData, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	dropProfile: function(ouid, res) {
		if (!ouid) { res('missing Org Unit ID'); return; }

		// lookup profile to verify that OU is not top level
		var qry = "SELECT * FROM org_unit WHERE org_unit_id=" + ouid;
		connector.ctPool.query(qry, function(err, data) {
			if (err) { res(err); return; }
			if (!data[0].org_unit_parent_id) { res('top level org unit cannot remove billing profile'); return; }

			// find billing node of parent
			billing.getBillingNode(null, data[0].org_unit_parent_id, function(err, billingid) {
				if (err) { res(err); return; }

				if (billingid !== null) {
					// update self and all child OU billing_id
					qry = "UPDATE org_unit SET billing_id=" + billingid + " WHERE org_unit_id=" + ouid +
						" OR org_unit_id IN ";
					qry += "((SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id=" + ouid + ") UNION ";
					qry += "(SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IN (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id=" +
						ouid + ")))";
					connector.ctPool.query(qry, function (err, data) {
						if (err) { return res('Failed to update self and children to new billing node. ', err); }

						// now remove the org_billing record
						qry = "DELETE FROM org_billing WHERE org_unit_id=" + ouid;
						connector.ctPool.query(qry, function (err) {
							if (err) { return res('Failed to remove Org Unit billing record'); }

							res(null, {'billing_node':billingid});
						});
					});
				}
			});
		});

	},
	getBillingNode: function(ouid, parentid, res) {
		if ((!ouid || ouid === null) && (!parentid || parentid === null)) { return res(null, null); } // is top level org unit
		if (ouid === parentid) { return res(null, null); } // is top level org unit

		var qry = "SELECT a.billing_id AS node1, b.billing_id AS node2, c.billing_id AS node3 ";
		qry += "FROM org_unit a LEFT JOIN org_unit b ON (a.org_unit_parent_id=b.org_unit_id AND a.org_unit_parent_id IS NOT NULL) ";
		qry += "LEFT JOIN org_unit c ON (b.org_unit_parent_id=c.org_unit_id AND b.org_unit_parent_id IS NOT NULL) WHERE a.org_unit_id=" + (ouid ? ouid : parentid);
		connector.ctPool.query(qry, function (err, data) {
			if (err) { res('Failed to execute query to lookup billing node'); return; }
			console.log(data);
			if(data.length <= 0) {
				return res(null);
			}
			if (data[0].node1) {
				res(null, data[0].node1);
			} else if (data[0].node2) {
				res(null, data[0].node2);
			} else if (data[0].node3) {
				res(null, data[0].node3);
			} else {
				res('Failed to find billing node. ');
			}
		});
	},
	copyBilling: function(ouid, billing_ouid, res, ctTrans) {
		if(!ctTrans)
			ctTrans = connector.ctPool;
		if (!ouid && !billing_ouid) { res('Missing Org Unit ID specified for self or billing node'); return; }

		// copy all org_account records from billing node to ouid supplied
		var qry = "SELECT * FROM org_account WHERE org_unit_id=" + billing_ouid;
		ctTrans.query(qry, function (err, data) {
			if (err) { res('Failed to retrieve billing node account information. '+err); return; }
			console.log('Parent org_account data', data);
			async.each(data, function(val, callback) {
				console.log("record",val);
				var insertData = [];
				insertData.org_unit_id = ouid;
				if (parseInt(val.threshold_max) > 0) { insertData.threshold_max = val.threshold_max; }
				if (val.subscription_id) { insertData.subscription_id = val.subscription_id; }
				if (val.component_id) { insertData.component_id = val.component_id; }
				//console.log(insertData);
				var insertSet = {
					table : 'org_account',
					values: insertData
				};
				ctTrans.insert(insertSet, function (err, data2) {
					if (err) { return res('Error inserting ' + (val.subscription_id ? 'subscription ' + val.subscription_id : 'component' + val.component_id) + ' account record for org unit'); }
				});
				callback();
			});

			// copy all org_component_count records from billing node to ouid supplied
			var qry = "SELECT DISTINCT (ocu.component_id) FROM org_component_count ocu JOIN subscription_component sc ON (ocu.component_id = sc.component_id) WHERE ocu.org_unit_id = " + billing_ouid;
			ctTrans.query(qry, function (err, data2) {
				if (err) { res('Failed to retrieve billing node component information'); return; }
				async.each(data2, function(val, callback) {
					var insertData = {
						table : 'org_component_count',
						values: {'org_unit_id':ouid, 'component_id':val.component_id}
					};
					ctTrans.insert(insertData, function (err) {
						if (err) { res('Error inserting component ' + val.component_id + ' count record for org unit'); return; }
						console.log('Added component', val.component_id);
					});
					callback();
				});
				res(null, ouid);
			});
		});
	},
	addSubscription: function(req, body, res, ctTrans) {
		if(!ctTrans)
			ctTrans = connector.ctPool;
		if (!body.org_unit_id) { return res('missing Org Unit ID'); }
		if (!body.subscription_external_id) { return res('missing Subscription External ID'); }
		if (!body.ext_billing_id) { return res('missing Ext Billing ID'); }

		// first get the subscription component information - also validates the subscription
		var qry = "SELECT sc.*, c.component_name FROM subscription s, subscription_component sc, component c WHERE s.subscription_external_id='" + body.subscription_external_id;
		qry += "' AND s.subscription_id=sc.subscription_id AND sc.component_id=c.component_id";
		ctTrans.query(qry, function (err, data) {
			if (err) { return res('Failed to query subscription components'); }
			if (data.length < 1) { return res('No subscription information found'); }
			var subscription_id = data[0].subscription_id;
			// create the subscription record for the org unit
			
			var insertData = {
				table : 'org_account',
				values :{
					"org_unit_id"    :body.org_unit_id,
					"subscription_id":data[0].subscription_id,
					"ext_billing_id" :body.ext_billing_id
				}
			};
			ctTrans.insert(insertData, function (err, acct) {
				if (err) { return res('Failed to insert account record ' + err); }

				async.waterfall([
					// insert components for billing node
					function(callback) {
						var ret = []; // build a list of components to add for children
						// cycle through all the components
						async.each(data, function(row, cb) {
							console.log('*** processing each', row.component_id);
							if (parseInt(row.component_threshold_max) > 0) { // only do components that have a threshold set

								// query to check if they already have this component and add one if they don't
								qry = "SELECT * FROM org_component_count WHERE org_unit_id=" + body.org_unit_id +
									" AND component_id=" + row.component_id;
								ctTrans.query(qry, function (err, check) {
									if (err) { return cb('Failed to execute component count record check. '+err); }
									console.log('no component', row.component_id, 'for org_unit', body.org_unit_id);
									if (check.length < 1) {
										var insertNew = {
											table :'org_component_count',
											values:{
												"org_unit_id" :body.org_unit_id,
												"component_id":row.component_id,
												"count_total":0,
												"secondary_total":0
											}
										};
										ctTrans.insert(insertNew, function (err) {
											if (err) { return cb('Failed to component count record ' + err); }
											console.log('inserted component', row.component_id);
											ret.push(row.component_id);
											cb(null);

											// log the component billing creation action
											var newdata = {
												'org_unit_id':body.org_unit_id,
												'ct_user_id' :req.userid,
												'billing_id' :row.component_id,
												'log_data'   :body
											};
											ctlogger.log(newdata, 'insert', 'billing', 'component ' + row.component_name);
										});
									} else {
										console.log('Already have count record for component ', row.component_id, ' on org_unit_id ', body.org_unit_id);
										//res('Already have count record for component '+row.component_id+' on org_unit_id '+body.org_unit_id);
										cb(null);
									}
								});
							} else {
								cb(null);
							}
						},
						function(err) {
							console.log('finished billing components');
							if (err) { return callback(err); }
							console.log('finished cycling through components for billing node org_unit');
							callback(null, ret, body.org_unit_id);
						});
					},
					// now get a list of child org_units
					function(componentlist, ouid, callback) {
						console.log('getting child OU list');
						qry = "SELECT org_unit_id FROM org_unit WHERE billing_id="+ouid+" AND org_unit_id!="+ouid;
						ctTrans.query(qry, function (err, oulist) {
							if (err) { return callback('Failed to query subscription components'); }
							callback(null, componentlist, oulist);
						});
					},
					function(componentlist, oulist, callback) {
						console.log('getting child OU list');
						async.eachSeries(oulist, function(ou, cb4) {
							qry = "INSERT INTO org_account (org_unit_id,subscription_id) VALUES ("+ ou.org_unit_id + "," + subscription_id +")";
							ctTrans.query(qry, function (err, data) {
								if (err) { return callback('Failed to query subscription components'); }
								cb4(null);
							});
						},
						function(err) {
							console.log('finished with child foreach');
							if (err) { return callback(err); }
							else{ callback(null, componentlist, oulist); }
						});
					},
					// add components for all children org units
					function(componentlist, oulist, callback) {
						console.log('inserting components for all child org units');
						async.each(oulist, function(row, cb) { // cycle through each child org_unit
							console.log('running child org unit', row.org_unit_id);
							async.each(componentlist, function(compid, cb2) { // cycle through each component to add
								qry = "SELECT * FROM org_component_count WHERE org_unit_id=" + row.org_unit_id +
									" AND component_id=" + compid;
								ctTrans.query(qry, function (err, check) {
									if (err) { return cb('Failed to execute component count record check. '+err); }
									if (check.length < 1) {
								var insertNew = {
									table :'org_component_count',
									values:{
										"org_unit_id" :row.org_unit_id,
										"component_id":compid,
										"count_total":0,
										"secondary_total":0
									}
								};
								ctTrans.insert(insertNew, function (err) {
									if (err) { return cb('Failed to insert component count record ('+compid+') for child org_unit '+row.org_unit_id+'. ' + err); }
									cb2(null);
								});
									} else {
										console.log('component present for org unit id'+row.org_unit_id);
										cb2(null);
									}
							});
							}, function(err){
								if(err) { cb(err); }
								else { cb(null); }
							});
						},
						function(err) {
							console.log('finished with child foreach');
							if (err) { return callback(err); }
							callback(null);
						});
					},

					// drip API call
					function(callback) {
						dripController.checkIfAccountExists(function(error, accountExists) {
							if(error) {
								console.log(error);
								callback(error);
							} else {
								if(accountExists) {
									callback(null);
								}else{
									callback(error);
								}
							}
						});
					},

					function(callback) {
						dripController.fetchSubscriber(body.username, function(error, subscriberExists, subscriberId) {
							if(error) {
								console.log(error);
								callback(error);
							} else {
								if(subscriberExists) {
									callback(null, subscriberId);
								}else{
									callback(null, subscriberId);
								}
							}
						});
					},

					function(subscriberId, callback) {
						var strSql = "SELECT org_unit_name FROM org_unit WHERE org_unit_id = " +body.org_unit_id;
						ctTrans.query(strSql, function (err, result) {
							if (err) { return callback('Failed to get company name for drip API. '+err); }
							if(result.length > 0 ) {
								callback(null, subscriberId, result[0].org_unit_name);
							} else {
								callback("There is no company name for drip api");
							}
						});
					},

					function(subscriberId,companyName, callback){
						//email first name last name company phone, tags
						return callback(null) //// Drip has been disabled RS 3-4-2021
						var qry = " SELECT subscription_name FROM subscription WHERE subscription_external_id = '" + body.subscription_external_id + "'";
						ctTrans.query(qry, function (err, result) {
						if (err) { return callback('Failed to get subscription record for drip API. '+err); }
							if (result.length > 0) {
								var tempHash = {
									email: body.username,
									custom_fields: {
										first_name: body.first_name,
										last_name: body.last_name,
										phone: body.phone,
										company: companyName
									},									
									tags: [result[0].subscription_name]
								}

								if(subscriberId.length > 0) {
									tempHash.id = subscriberId
								} 

								var payload = {
									subscribers: []
								}

								payload.subscribers.push(tempHash);
								dripController.createOrUpdateSubscriber(payload, function(error, res) {
									if(error) {
										console.log(error);
										callback(error);
									}else{
										callback(null);
									}
								});
							} else {
								callback("No such subscription exists for Drip API.");
							}
						});						
					}
				],
				function(err) {
					if (err) { return res(err); }
					console.log('completed with addSubscription');
					res(null, acct);
				});
			});
		});
	},
	convertTextToNumber: function(body, cb){
		var number = [];
		var dial_pad = {
			"ABC":  2,
			"DEF":  3,
			"GHI":  4,
			"JKL":  5,
			"MNO":  6,
			"PQRS": 7,
			"TUV":  8,
			"WXYZ": 9,

		}
		var numArray = body.component_desc.replace(/-/g,"").split("");
		var componentName = body.component_name.replace(' ','').toLowerCase();
			_.each(numArray, function(substr) {
					if(isNaN(substr)){
						substr = substr.toUpperCase();
						_.map(Object.keys(dial_pad), function (value) {
							if(value.indexOf(substr) > -1){
									substr = dial_pad[value];
									return false;
								}
						});
					}
					number.push(substr);
			});
		cb(number.join(""));
	},

	addComponent: function(body, res) {
		if (!body.org_unit_id) { return res('missing Org Unit ID'); }
		if (!body.component_ext_id) { return res('missing component External ID'); }
		if (!body.component_desc) { return res('missing component description '); }
		var ctTrans = new ctTransactionModel.begin(function(err){
			if (err){
				res(err);
			} else {
				var uom = body.uom.toLowerCase();
				async.waterfall([
					function(callback){
						billing.convertTextToNumber(body, function(number){
							var query = "SELECT ph.number_id from phone_number ph ";
							query += "JOIN org_component oc ON (oc.number_id = ph.number_id) ";
							query += "where oc.component_type ='" + uom +"' AND ph.number_str ='" + number +"'" ;

							ctTrans.query(query, function(err, data){
								if(err){
									return callback(err);
								}else{
									if(data.length > 0)
										return callback("Component is already added for this number");
									else {
										var query = "SELECT ph.number_id, pd.org_unit_id from phone_number ph ";
										query += "JOIN phone_detail pd on (pd.number_id = ph.number_id)"
										query += "where ph.number_str ='" + number +"'";
										ctTrans.query(query, function(err, data){
											if(err){
												return callback(err);
											}
											if(data.length === 0)
												return callback("Invalid Number component");

											callback(null, data[0]["number_id"],data[0]["org_unit_id"]);
										})
									}
								}
							});
						});
					},
					function(number_id, org_unit_id, callback){
						body.org_unit_id = org_unit_id
						 var insertData = {
							 table : 'component',
							 values :{
								 'component_name'  	:body.component_name,
								 'component_desc'  	:body.component_desc
							 }
						 };
						 ctTrans.insert(insertData, function(err, data){
							 if(err){
								 return callback(err);
							 }
							 callback(null, number_id, data.insertId);
						 });
					},
					function(number_id, comp_id, callback) {
						var insertDataOrg = {
							table : 'org_component',
							values :{
								'org_unit_id' 		: body.org_unit_id,
								'component_id'   	: comp_id,
								'component_ext_id'	: body.component_ext_id,
								'number_id' 	 	: number_id,
								'component_type'    : uom
							}
						};
						ctTrans.insert(insertDataOrg, function(err, data){
							if(err){
							   return callback(err);
							}
							callback(null, comp_id);
						});
					},
					function(comp_id,callback) {
						var insertDataCount = {
							table : 'org_component_count',
							values :{
								'org_unit_id' 		: body.org_unit_id,
								'component_id'   	: comp_id,
								'count_total' 		:	0,
								'secondary_total' 	: body.uom === 'Number' ? 1 : 0,
							}
						};
						ctTrans.insert(insertDataCount, function(err, data){
							if(err){
							   return callback(err);
							}
							callback(null);
						});
					},
					function(callback) {
						var query =  "SELECT account_code from org_unit ou";
							query += " JOIN org_billing ob ON (ob.org_unit_id  = ou.billing_id)";
							query += " where ou.org_unit_id ="+ body.org_unit_id;

							ctTrans.query(query, function(err, data){
								if(err){
									return callback(err);
								}
								if(data.length === 0)
									return callback("Account Code not found");

								callback(null, data[0].account_code);
							})
					},
					function(account_code,callback){
						zuoraController.getSubscriptionByAccount(account_code, function(zuoraResult){
							var subscription = _.find(zuoraResult.subscriptions, function(subscription) {
								if(subscription['status'].toLowerCase() == "active" )
									   return subscription;
								});
								if (zuoraResult.success) {
									callback(null,subscription.id);
								} else {
								   callback(zuoraResult);
								  }
						 });
					},
					function(subscription_id,callback){
						   var  updateData = {
									which: 'update',
									table: 'org_account',
									values: { ext_billing_id: subscription_id },
									where: " WHERE org_unit_id = "+ body.org_unit_id
								};
								ctTrans.query(updateData, function(err, result){
									if (err) {
										callback(err);
									}
									callback(null);
							   });
					}
				],
				function(err) {
					if (err) {
						ctTrans.rollback(function(){
							res(err);
						});
					} else {
						ctTrans.commit(function(err){
							res(null, "insert Success");
						});
					}
				});
			}
		});
	},

	invoicePosted: function(body, res){
		if (!body.org_unit_id) { return res('missing Org Unit ID'); }
		var ctTrans = new ctTransactionModel.begin(function(err){
			if (err){
				res(err);
			} else {
				async.waterfall([
					function(callback){

						var query = "SELECT oc.component_ext_id, ob.account_code from org_component oc ";
						query += "JOIN phone_number pn ON (pn.number_id = oc.number_id) "
						query += "JOIN org_unit ou ON (ou.org_unit_id = oc.org_unit_id) "
						query += "JOIN org_billing ob ON (ou.billing_id = ob.org_unit_id) "
						query += "where ou.billing_id = " + body.org_unit_id + "and pn.number_status = 'suspended' and oc.component_type = 'number'"


						ctTrans.query(query, function(err, data){
							if(err){
								return callback(err);
							}else if(data.length > 0){
								async.eachSeries(data, function (row, cb) {
									var product_data = {
										component_ext_id : row.component_ext_id,
										account_code : row.account_code,
										post_invoice_date : moment(body.prev_invoice_date, "YYYY-MM-DD").add(1,'days').format('YYYY-MM-DD')
									}
									billing.removePremiumProduct(ctTrans, product_data , function(err,data) {
										if(err)
											return cb(err);
										cb(null);
									});
								}, function (err) {
									if (err) {
										return callback(err);
									} else {
										callback(null);
									}
								});

							}else {
								callback(null);
							}
						});
					},

					function(callback){
						var qry = "UPDATE org_billing SET prev_invoice_date= '"+ body.prev_invoice_date + "', prev_invoice_amount= "+ body.prev_invoice_amount + " WHERE org_unit_id="+ body.org_unit_id;
						ctTrans.query(qry, function(err, data){
							if(err){
								return callback(err);
							}
							callback(null);
						});
					}

				],
				function(err) {
					if (err) {
						ctTrans.rollback(function(){
							res(err);
						});
					} else {
						ctTrans.commit(function(err){
							res(null, "Successfully Posted the invoice");
						});
					}
				});
			}
		});
	},

	removePremiumProduct: function(ctTrans, product_data, callback){
		var zuoraError = [];
		var isPremium = false;
		async.waterfall([
			function(cb){
				zuoraController.getSubscriptionByAccount(product_data.account_code, function(zuoraResult){
				if(zuoraResult.success){
					var subscription = _.find(zuoraResult.subscriptions, function(subscription) {
					if(subscription['status'].toLowerCase() == "active" )
							 return subscription;
						});
						var ratePlanCharges = subscription.ratePlans;
						var currentComp = billing.getcurrentComp(ratePlanCharges, product_data.component_ext_id);
						cb(null,currentComp.id, subscription.id);
					}else{
						zuoraError.zuora.push(zuoraResult);
						cb(zuoraError);
					  }
				});
			},
			function(productRatePlanId, subscription_id, cb){
				var	productData = {
					"Name":"Remove a Product",
					"Description":"Remove Product",
					"ServiceActivationDate": product_data.post_invoice_date,
					"status":"Draft",
					"SubscriptionId":subscription_id,
					"Type":"RemoveProduct"
				}
				zuoraController.createAmendment(productData, function(result){
					if (result.Success) {
						cb(null,result.Id,productRatePlanId);
					} else {
						zuoraError.push(result)
						cb(zuoraError);
					}
				});
			},
			function(amendmentId, productRatePlanId,cb){
				var	productData = {
					"AmendmentId": amendmentId,
					"AmendmentSubscriptionRatePlanId":productRatePlanId,
					"AmendmentType":"RemoveProduct"
				}
				zuoraController.createRatePlan(productData, function(tres){
					if (tres.Success) {
						cb(null,amendmentId);
					} else {
						zuoraError.push(tres)
						cb(zuoraError);
					}
				});
			},
			function(amendmentId,cb){
				var	productData = {
						"ContractEffectiveDate": product_data.post_invoice_date,
						"Status":"Completed",
						"Id":amendmentId
				}
				zuoraController.updateAmendment(productData, function(response){
					if (response.Success) {
						cb(null);
					} else {
						zuoraError.push(response)
						cb(zuoraError);
					}
				});
			}
			],
			function(err){
				if (err) {
					if(!isPremium){
						callback(null);
					} else if(zuoraError.length > 0){
						var email = require('../lib/email');
						var email_to = 'manish.516aloha@gmail.com';
						var msg = "Error to remove premium number"+ product_data.num_id
						email.sendZuoraEmail(msg, email_to, function(err){
							console.log("sent....",err);
							callback(null);
						});
					}else {
						callback(err);
					}
				} else {
						callback(null);
				}
			});
	},

	getcurrentComp : function(ratePlanCharges, component_ext_id) {
		var currentComp;
	 	for (var k = 0; k < ratePlanCharges.length; k++) {
			 //console.log(ratePlanCharges.ratePlanCharges);
			 for (var i = 0; i < ratePlanCharges[k].ratePlanCharges.length; i++) {
					 // console.log(ratePlanCharges[k].ratePlanCharges[i].productRatePlanChargeId, component_ext_id);
					 if(ratePlanCharges[k].ratePlanCharges[i].originalChargeId == component_ext_id){
							 currentComp = ratePlanCharges[k];
					 }
			 }
	}
		return currentComp;
	},

	removeComponent: function(body, res) {
		if (!body.org_unit_id) { return res('missing Org Unit ID'); }
		if (!body.component_ext_id) { return res('missing component External ID'); }

		var ctTrans = new ctTransactionModel.begin(function(err){
			if (err){
				res(err);
			} else {
				async.waterfall([
					function(callback){
						var query = "SELECT oc.component_id, oc.number_id from org_component oc ";
						query += " where oc.component_ext_id ='" + body.component_ext_id +"'";

						ctTrans.query(query, function(err, data){
							if(err){
								return callback(err);
							}else if(data.length > 0){
								callback(null,data[0].component_id,data[0].number_id);
							}else {
								return callback("Component is not present ");
							}
						});
					},
					function(component_id,number_id,callback){
						if(component_id !== undefined && number_id !== undefined){
							var query = "select pn.number_status from phone_number pn ";
								query += " where pn.number_id ='" + number_id +"' AND number_status='suspended'" ;

							ctTrans.query(query, function(err, data){
								if(err){
									return callback(err);
								}else if(data.length > 0){
									callback(null,component_id);
								}else {
									return callback("No suspended number for this component");
								}
							});
						}else {
							return callback("Component Id or Number Id is not present");
						}
					},
					function(component_id,callback){
						var query = "DELETE from component where component_id='"+component_id+"'";
						ctTrans.query(query, function(err, data){
							if(err){
								return callback(err);
							}
							callback(null);
						});
					}
				],
				function(err) {
					if (err) {
						ctTrans.rollback(function(){
							res(err);
						});
					} else {
						ctTrans.commit(function(err){
							res(null, "DELETED Success");
						});
					}
				});
			}
		});
	},


	dropSubscription: function(req, body, res) {
		if (!body.org_unit_id) { return res('missing Org Unit ID'); }
		if (!body.ext_billing_id) { return res('missing External Billing ID'); }
		if (!body.removeComponent) { return res('missing remove Component check'); }
		var no_child = false;
		var subscriptionName = '';
		console.log('starting dropSubscription');
		var qry = "SELECT * FROM cqm_to_cfa_billing_migration WHERE org_unit_id  = '" +  body.org_unit_id + "'";
			connector.ctPool.query(qry, function (err, result) {
			if (err) {
				res('Failed to query the DB for billing migration for', err);
			} else if (result.length > 0) {
				res("Manual migrated account subscription");
	 		}else {
		// first get the subscription component information - also validates the subscription
				var qry = "SELECT sc.*, c.component_name, s.subscription_name FROM subscription_component sc, org_account oa, component c, subscription s";
				qry += " WHERE oa.org_unit_id='" + body.org_unit_id + "' AND oa.subscription_id=sc.subscription_id AND sc.component_id=c.component_id AND sc.component_ext_id IS NOT NULL AND s.subscription_id = sc.subscription_id";
				connector.ctPool.query(qry, function (err, data) {
					if (err) { return res('Failed to query subscription components ' + err); }
					if (data.length < 1) { return res('No subscription information found'); }
					var complist = [];
					var component_ids = [];
					subscriptionName = data[0].subscription_name;

			// remove each of the metric counted component records
					async.series([
						function(callback) {
							if(body.removeComponent == 'true') {
							_.each(data, function(row){
								component_ids.push(row.component_id)
							});
							var qry = "DELETE FROM org_component_count WHERE org_unit_id=" + body.org_unit_id + " AND component_id IN (" + component_ids.join(",") + ")";
							connector.ctPool.query(qry, function (err) {
								if (err) { return cb('Failed to remove component counter for component ' + component_ids.join(",") + err); }
								callback(null);
							});
							} else {
								callback(null);
							}
						},
						function(callback) { // now remove the subscription record
							console.log('removing subscription');
							qry = "DELETE FROM org_account WHERE org_unit_id=" + body.org_unit_id;
							connector.ctPool.query(qry, function (err) {
								if (err) {
									return callback('Failed to remove org unit account subscription with ext_billing_id ' +
										body.ext_billing_id + err);
								}
								callback(null);
							});
						},
						function(callback) {
							console.log('selecting children org units');
							qry = "SELECT org_unit_id FROM org_unit WHERE billing_id="+body.org_unit_id+" AND org_unit_id!="+body.org_unit_id;
							async.waterfall([
								function(wc) {
									connector.ctPool.query(qry, function (err, child) {
										if (err) { return wc('Failed to select child org units. ' + err); }
										if (child.length == 0) {
											console.log('no children to process');
											no_child = true;
											return wc("no children to process");
										}
										wc(null, child)
									});
								},
								function(child, wc) {
									var children = [];
									_.each(child, function(row){
										children.push(row.org_unit_id)
									});
									if(body.removeComponent == 'true') {
									var qry = "DELETE FROM org_component_count WHERE org_unit_id IN (" + children.join(",") + ") AND component_id IN (" + component_ids.join(",") + ")";
									connector.ctPool.query(qry, function (err) {
										if (err) { return cb('Failed to remove component counter for component ' + component_ids.join(",") + err); }
										wc(null, children);
									});
									} else {
										wc(null, children);
									}
								},
								function(children, wc) { // now remove the subscription record
									console.log('removing subscription');
									qry = "DELETE FROM org_account WHERE org_unit_id IN (" + children.join(",") + ")";
									connector.ctPool.query(qry, function (err) {
										if (err) {
											return wc('Failed to remove child ous' + err);
										}
										wc(null);
									});
								}
							],
							function(err) {
								if (err) {
									if(no_child){
										callback(null);
									}else{
										callback(err);
									}
								}else{
									callback(null);
								}
							});
						},

						// drip API - set subscription -tag as Blank when we remove subscription
						function(callback) {
							var strSelectQry = " SELECT ou.org_unit_name, cu.username, cu.first_name, cu.last_name, cud.primary_phone AS phone"+
										  " FROM ct_user cu JOIN org_unit ou "+
										  " ON ou.org_unit_id = cu.ct_user_ou_id "+
										  " JOIN ct_user_detail cud ON cud.ct_user_id = cu.ct_user_id "+
										  " WHERE cud.is_from_drip = true AND ou.org_unit_id = "+body.org_unit_id;

							connector.ctPool.query(strSelectQry, function (err, result) {
								if (result.length > 0 ) {
									dripController.fetchSubscriber(result[0].username, function(error, subscriberExists, subscriberId) {
										if(error) {
											console.log(error);
											callback(error);
										} else {
											if(subscriberExists) {
												var tempHash = {
													email: result[0].username,
													custom_fields: {
														first_name: result[0].first_name,
														last_name: result[0].last_name,
														phone: result[0].phone,
														company: result[0].org_unit_name
													},									
													remove_tags: [subscriptionName]
												}

												if(subscriberId.length > 0) {
													tempHash.id = subscriberId
												} 

												var payload = {
													subscribers: []
												}

												payload.subscribers.push(tempHash);
												dripController.createOrUpdateSubscriber(payload, function(error, res) {
													if(error) {
														console.log(error);
														callback(error);
													}else{
														callback(null);
													}
												});
											}else{
												callback('Failed to load subscriber for drip api for username - ' + result.username);
											}
										}
									});											
								} else {
									callback('Failed to load username for drip api. ' + err);
								}
							});
						}
					],
					function(err) {
						console.log('completed removing subscription');
						if (err) { return res(err); }
						res(null, 'Successfully removed billing subscription ' + data[0].subscription_id);
					});
				});
	 		}
		});
	},
	getAccount: function(ouid, res) {
		if (!ouid) { res('missing Org Unit ID'); return; }

		var qry = "SELECT oa.*, c.component_name, s.subscription_name, s.subscription_external_id, cc.component_name AS sub_component_name, sc.component_ext_id, cc.component_id AS sub_component_id ";
		qry += "FROM org_account oa LEFT JOIN component c ON (oa.component_id=c.component_id AND oa.component_id IS NOT NULL) ";
		qry += "LEFT JOIN subscription s ON (oa.subscription_id=s.subscription_id AND oa.subscription_id IS NOT NULL) ";
		qry += "LEFT JOIN subscription_component sc ON (s.subscription_id=sc.subscription_id) ";
		qry += "LEFT JOIN component cc ON (sc.component_id=cc.component_id) WHERE oa.org_unit_id=" + ouid;

		/*var qry = "SELECT oa.*, s.subscription_name, s.subscription_external_id, c.component_name FROM org_account oa ";
		qry += "LEFT JOIN subscription s ON (oa.subscription_id=s.subscription_id AND oa.subscription_id IS NOT NULL) ";
		qry += "LEFT JOIN component c ON (oa.component_id=c.component_id AND oa.component_id IS NOT NULL) WHERE oa.org_unit_id=" + ouid;
		*/
		connector.ctPool.query(qry, function (err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	billList: function(start, res) {
		var date = (start ? moment(start).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD"));
		//var end = (start ? moment(start).format("YYYY-MM-DD 23:59:59") : moment().format("YYYY-MM-DD 23:59:59"));
		console.log('checking for matching billing cycle end date of', date);

		var qry = "SELECT * FROM org_billing WHERE cycle_end = '" + date + "'";
		connector.ctPool.query(qry, function (err, data) {
			if (err) {
				res('Failed to query the DB for billing list for', date, err);
			} else if (data.length < 1) {
				res(null, { 'message':'No billing cycle entries due for ' + date });
			} else {
				res(null, data);
			}
		});
	},
	getOuByZuoraAccountId: function(id, res) {
		var qry = "SELECT * FROM org_billing WHERE billing_account_id = '" + id + "'";
		connector.ctPool.query(qry, function (err, data) {
			if (err) {
				res('Failed to query the DB for get OU by zuora account id ' + id);
			} else if (data.length < 1) {
				res(null, { 'message':'No OU entries due for billing_account_id = ' + id });
			} else {
				res(null, data);
			}
		});
	},
	updateSubscriptionExtBillingId: function(req, body, res) {
		if (!body.org_unit_id) { res('missing OU id'); return; }
		if (!body.ext_billing_id) { res('missing current zuora subscription id'); return; }

		var qry = "UPDATE org_account SET ext_billing_id = '" + body.ext_billing_id + "' WHERE org_unit_id = '" + body.org_unit_id + "'";

		connector.ctPool.query(qry, function (err, data) {
			if (err) {
				res('Failed to query the DB for update the Subscription ext_billing_id for OU '+body.org_unit_id+'. '+err);
			} else {
				res(null, data);
			}
		});
	},
	summary: function(ouid, res) {
		if (!ouid) { return res('Missing org unit ID'); }

		// retrieve profile information
		var qry = "SELECT o.billing_id, ob.*, o.org_unit_name AS account_name, s.subscription_name AS billing_name FROM org_unit o, org_billing ob " +
			"LEFT JOIN org_account oa ON (ob.org_unit_id=oa.org_unit_id AND oa.subscription_id IS NOT NULL) " +
			"LEFT JOIN subscription s ON (oa.subscription_id=s.subscription_id)  WHERE ob.org_unit_id=" + ouid + " AND ob.org_unit_id=o.org_unit_id";
		connector.ctPool.query(qry, function (err, profile) {
			if (err) { return res(err); }

			// now retrieve count totals
			billing.count(ouid, function(err, count) {
				if (err) { return res(err); }
				console.log(count);
				var newcount = []

				async.each(count, function(row, callback) {
					newcount.push(row);
					callback(null);
				}, function(err) {
					if (err) { return res(err); }

					if (profile.length > 0) {
						//console.log('adding to array');
						profile[0].count = newcount;
					} else {
						//console.log('adding to object');
						profile.push({ 'count' : newcount });
					}
					//console.log('profile', profile[0]);
					res(null, profile[0]);
				});
			});
		});

		 /**************************************************************************************
		 * Dev : Yogesh Thombare
		 * Date : 01-10-2015
		 * Defect Id : CT-4723 and CT-4724
		 * Made updates in the code as the campaign and numbers count is not coming properly.
		 * took data directly from respective tables and updated the records for that specific
		 * total and secondary total count
		 *************************************************************************************/
		/*
		async.waterfall([
				function(cb1){
					// retrieve profile information
					var qry = "SELECT ob.*, ob.account_code AS account_number, o.org_unit_name AS account_name, s.subscription_name AS billing_name FROM org_unit o, org_billing ob " +
						"LEFT JOIN org_account oa ON (ob.org_unit_id=oa.org_unit_id AND oa.subscription_id IS NOT NULL) " +
						"LEFT JOIN subscription s ON (oa.subscription_id=s.subscription_id)  WHERE ob.org_unit_id=" + ouid + " AND ob.org_unit_id=o.org_unit_id";
					connector.ctPool.query(qry, function(err, data){
						if (err) {
							cb1(err);
						} else {
							var profile = data;
							cb1(null,profile);
						}
					});
				},
				function(profile, cb1) {
					billing.count(ouid, function(err, count) {
						if (err) { return cb1(err,profile); }

						_.each(count, function(row, index) {
							if (row.component_name === 'Minutes') {
								count[index].count_total = Math.round(row.count_total / 60);
							}
						});

						if (profile.length > 0) {
							console.log('adding to array');
							profile[0]['count'] = count;
						} else {
							console.log('adding to object');
							profile.push({ 'count' : count });
						}
						cb1(null,profile);
					});
				},
				function(profile1, cb1){
					// get campaign active and inactive and update existing records.
					var qry = "SELECT COUNT(campaign_status) AS total, campaign_status FROM campaign WHERE campaign_ou_id= "+ ouid +" group by campaign_status";
					connector.ctPool.query(qry, function(err, data){
						if (err) {
							cb2(err);
						} else {
							var ret = { 'count_total':0, 'secondary_total':0 };
							_.each(data, function(row) {
								if (row.campaign_status === 'active') {
									ret.count_total = row.total;
								} else if (row.campaign_status === 'inactive') {
									ret.secondary_total = row.total;
								}
							});
							_.each(profile1[0].count, function(row) {
								if(row.component_name === 'Campaign') {
									row.count_total = ret.count_total;
									row.secondary_total = ret.secondary_total;
								}
							});
							var profile2 = profile1;
							cb1(null,profile2);
						}
					});
				},
				function(profile2, cb1){
					// get provisioned route active and inactive and update existing records.
					var qry = "SELECT COUNT(provisioned_route_status) AS total, provisioned_route_status FROM provisioned_route WHERE provisioned_route_ou_id= "+ ouid +"  group by provisioned_route_status";
					connector.ctPool.query(qry, function(err, data){
						if (err) {
							cb1(err);
						} else {
							var ret = { 'count_total':0, 'secondary_total':0 };
							_.each(data, function(row) {
								if (row.provisioned_route_status === 'active') {
									ret.count_total = row.total;
								} else if (row.provisioned_route_status === 'inactive') {
									ret.secondary_total = row.total;
								}
							});
							_.each(profile2[0].count, function(row) {
								if(row.component_name === 'Numbers') {
									row.count_total = ret.count_total;
									row.secondary_total = ret.secondary_total;
								}
							});
							var profile3 = profile2;
							cb1(null,profile3);
						}
					});
				}
			],
			function(err, profile3	){
				if(err) {
					cb1(err);
				} else {
					res(null, profile3[0]);
				}
			}
		);
		*/
	},

	migrationAccount: function(ouid, res) {
		if (!ouid) { return res('Missing org unit ID'); }

		// retrieve profile information
		var qry = "SELECT count(org_unit_id) As acc_count FROM cqm_to_cfa_billing_migration where org_unit_id = " + ouid;
		connector.ctPool.query(qry, function (err, data) {
			if (err) { return res(err); }
			var result = {}
			if(data[0].acc_count > 0){
				result.migratedAccount = true;
			}else{
				result.migratedAccount = false;
			}
			res(err, result)
		});

		
	},
	usageCount: function (ouid, res) {
		console.log('starting count for send Usages');
		if (!ouid) { return res('No Org Unit ID specified'); }

		var qry = "SELECT billing_id, org_unit_id FROM org_unit WHERE org_unit_id="+ouid;
		connector.ctPool.query(qry, function (err, self) {
			if (err) { return res("Failed to execute check for billing node. "+err); }
			if (self[0].billing_id === self[0].org_unit_id) {
				async.parallel({
					subscription:function(callback) {
						var qry = "SELECT c.component_name,  c.component_id, oa.ext_billing_id, SUM(occ.count_total) AS count_total, SUM(occ.secondary_total) AS secondary_total ,sc.component_ext_id "  +
									"from org_unit o " + 
									"JOIN org_account oa ON (oa.org_unit_id = o.billing_id AND oa.subscription_id IS NOT NULL) " +
									"JOIN subscription_component sc ON (oa.subscription_id=sc.subscription_id AND oa.subscription_id IS NOT NULL) " +
									"JOIN component c ON  (c.component_id = sc.component_id) " +
									"JOIN org_component_count occ ON (occ.component_id = c.component_id AND occ.org_unit_id = o.org_unit_id) " +
									"WHERE o.org_unit_status <> 'deleted' AND o.billing_id = " + ouid +
									"GROUP BY c.component_id, c.component_name ,sc.component_ext_id,oa.ext_billing_id " +
									"ORDER BY c.component_id"

						connector.ctPool.query(qry, function (err, data) {
							if (err) { return res("Failed to execute query for count totals. "+err); }
							var qry = "SELECT c.component_name,  c.component_id, oa.ext_billing_id, SUM(occ.count_total) AS count_total, SUM(occ.secondary_total) AS secondary_total " +
									"FROM org_account oa " +
									"LEFT JOIN org_unit o  ON (oa.org_unit_id = o.billing_id AND oa.subscription_id IS  NULL) " +
									"JOIN org_component_count occ ON (occ.component_id = oa.component_id AND occ.org_unit_id = o.org_unit_id) " +
									"JOIN component c ON  (c.component_id = occ.component_id) " +
									"WHERE o.org_unit_status <> 'deleted' AND oa.org_unit_id = "+ ouid +
									"GROUP BY c.component_id, c.component_name, oa.ext_billing_id ORDER BY c.component_id ";
							connector.ctPool.query(qry, function (err, accountData) {
									if (err) { return res(err); }
									console.log(mergeByProperty(data,accountData, 'component_id'));
									callback(null, mergeByProperty(data,accountData, 'component_id'));
							});
						});
					},
					org_account:function(callback) {
							var qry = "SELECT iu.org_unit_id, iu.component_id, iu.include_usage from included_usages iu " + 
								"WHERE iu.org_unit_id="+ouid ;
						connector.ctPool.query(qry, function (err, data) {
							if (err) { return res("Failed to execute query for count totals. "+err); }
							callback(null, data);
						});
					},
					org_component:function(callback) {
							var qry = "SELECT ph.number, c.component_name, oc.component_type, c.component_id, SUM(occ.count_total) AS count_total, SUM(occ.secondary_total) AS secondary_total ,oc.component_ext_id from org_unit ou "+
								"JOIN org_component oc ON (oc.org_unit_id = ou.org_unit_id) "+
								"JOIN org_component_count occ ON (occ.component_id = oc.component_id) "+
								"JOIN component c ON (oc.component_id = c.component_id) "+
								"JOIN phone_number ph ON (ph.number_id = oc.number_id) "+
								"WHERE (ou.org_unit_id="+ouid+" OR ou.billing_id="+ouid+") AND ou.org_unit_status <> 'deleted' "+
								"GROUP BY c.component_name, c.component_id ,oc.component_ext_id, ph.number, oc.component_type ORDER BY c.component_id ASC";
						connector.ctPool.query(qry, function (err, data) {
							if (err) { return res("Failed to execute query for count totals. "+err); }
							callback(null, data);
						});
					},
					tracking_number:function(callback) {
						var qry = " SELECT pn.number FROM org_unit ou "+
								  " JOIN campaign c ON c.campaign_ou_id = ou.org_unit_id "+
								  " JOIN campaign_provisioned_route cpr ON cpr.campaign_id = c.campaign_id "+
								  " JOIN provisioned_route pr ON pr.provisioned_route_id = cpr.provisioned_route_id "+
								  " JOIN phone_detail pd ON pd.provisioned_route_id = pr.provisioned_route_id "+
								  " JOIN phone_number pn ON pn.number_id = pd.number_id "+
								  " WHERE (ou.org_unit_id="+ouid+" OR ou.billing_id="+ouid+") AND ou.org_unit_status <> 'deleted' "+
								  " AND ou.org_unit_status != 'deleted' AND pr.provisioned_route_status != 'deleted' "
					
						connector.ctPool.query(qry, function (err, data) {
							if (err) { return res("Failed to execute query for count totals. "+err); }
							callback(null, data);
						});		  
					},
					manual_score_card_users:function(callback) {
						var qry = " SELECT ext_billing_id FROM org_account WHERE component_id = 927 AND org_unit_id = "+ ouid
						connector.ctPool.query(qry, function (err, data) {
							if (err) { return res("Failed to execute query for count totals. "+err); }
							callback(null, data);
						});		  
					}
				}, function(err, results) {
					var subscriptionData = results.subscription;
					var org_componentData = results.org_component;
					var org_account = results.org_account;
					var tracking_number = results.tracking_number;
					var manual_score_card_users = results.manual_score_card_users;

					for (var obj in org_componentData) {
						subscriptionData.push(org_componentData[obj]);
					};
					var result = {
						subscriptionData: subscriptionData,
						threshold : org_account,
						tracking_number : tracking_number,
						manual_score_card_users: manual_score_card_users
					}
					// delete results.org_component;
					// console.log(subscriptionData);
					// results.subscription = subscriptionData;
					// console.log("results==",results);
					res(null, result);
				});


			}
		});
	},
};

module.exports = billing;

function mergeByProperty(arr1, arr2, prop) {	
    _.each(arr2, function(arr2obj) {	
        var arr1obj = _.find(arr1, function(arr1obj) {	
            return arr1obj[prop] === arr2obj[prop];	
        });	

         //If the object already exist extend it with the new values from arr2, otherwise just add the new object to arr1	
        arr1obj ? _.extend(arr1obj, arr2obj) : arr1.push(arr2obj);	
    });	
    return arr1	
}
