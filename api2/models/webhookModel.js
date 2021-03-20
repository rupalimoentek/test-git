/**
 * Created by davey on 3/31/15.
 */
var appModel = require('./appModel'),
	f = require('../functions/functions.js'),
	fs = require("fs"),
	yaml = require("js-yaml"),
	e = yaml.load(fs.readFileSync("config/database.yml")),
	async = require('async'),
	_ = require('underscore'),
	http = require('http'),
	callActionModel = require('../models/callActionModel'),
	ctTransactionModel = require('./ctTransactionModel'),
	table = 'webhook';

var webhook = {
    retrieveWebhooksByOrgUnitIds: function (arrOrgUnitIds, res) {
        if (!Array.isArray(arrOrgUnitIds)) {throw "expected array inside webhook.retrieveWebhookIdsFromOrgUnitIds for arrOrgUnitIds parameter";}
        if (typeof res !== "function") {throw "invalid input type for webhook.retrieveWebhookIdsFromOrgUnitIds for res parameter";}

        if (arrOrgUnitIds.length === 0) {return res();}
        var selQry = "SELECT * FROM webhook WHERE org_unit_id ";
        selQry +=  (arrOrgUnitIds.length > 1)
                   ? "IN (" + arrOrgUnitIds.join(",") + ")"
                   : " = " + arrOrgUnitIds[0];
        appModel.ctPool.query(selQry, function (err, resultSetWebook) {
            if (err) {return res(err + "in retrieveWebhooksByOrgUnitIds");}

            return res(null, resultSetWebook);
        });

    },

	 /**
	  *  Modify the status of multiple users at a time using a specific database handler (ex ctTransactionModel or appmodel.ctPool)
	  *
		 @param {array} arrWebhookIds - array of webhook ids to change status of
		 @param {string} statusToSwitchTo - "either 'active','inactive','suspended','deleted' "
		 @param {callback} res - callback that will be invoked with an error and/or query results from delete query (takes an error as first argument and resulting data as second argument)
		 @param {object} dbh - will typically either be the ctTransactionModel or the appModel.ctPool object depending on
		                       whether you are using this within a ctTransaction begin or expect this to work without it using appModel
		 @returns undefined
	 */
    changeMultipleStatus: function (arrWebhookIds, statusToSwitchTo, res, dbh) {
        // parameter validation
        if (!Array.isArray(arrWebhookIds)) {throw "expected array inside webhook.changeMultipleStatus for first parameter";}
        if (!_.contains(["active", "inactive", "suspended", "deleted"], statusToSwitchTo)) { throw "invalid input for webhook.changeMultipleStatus for status to switch to ----> " + statusToSwitchTo;}
        if (typeof res !== "function") {throw "invalid input type for webhook.changeMultipleStatus for third parameter";}


        if (arrWebhookIds.length === 0) {return res(null, "No webhooks to change status for.");}

        var updateQry = "UPDATE webhook SET webhook_status = '" + statusToSwitchTo + "' WHERE webhook_id ";
        updateQry += (arrWebhookIds.length > 1)
                      ? "IN (" + arrWebhookIds.join(",") + ")"
                      : " = " + arrWebhookIds[0];
	    dbh.query(updateQry, function (err, resultSet) {
            if (err) {return res(err);}
            console.log("updated statuses for tags yay");
            return res(null, resultSet);
        });


    },
	create: function(data, res) {
		if (data.action === 'webhook') { data.webhook_id = data.action_target; }
		var insertData = {
			table : table,
			values: data
		};
		appModel.ctPool.insert(insertData, function(err, ret) {
			if (err) { res(err); return; } else { res(null, ret); }
			/*if (data.field_group) {
				webhook.payloadAdd(ret.insertId, data.trigger_id, data.field_group, function(err, result) {
					if (err) { res(err); } else { res(null, ret); }
				});
			} else {
				res(null, ret);
			}
			*/
		});
	},
	update: function(data, res) {
		console.log('starting model update');
		data.webhook_updated = 'CURRENT_TIMESTAMP';
		if (data.action === 'webhook') { data.webhook_id = data.action_target; }
		var ctTrans = new ctTransactionModel.begin(function(err){
		async.waterfall([
				function(callback){
					if(data.webhook_status === 'inactive'){
						webhook.deletePreWebhookReferences(ctTrans, data.webhook_id,function(err){
							if(err){return callback(err);}
							callback(null,data);
						});
					}else{
						callback(null,data);
					}
				},
				function(data,callback){
					var updateData = {
						table : table,
						values: data,
						where: " WHERE webhook_id=" + data.webhook_id
					};
					appModel.ctPool	.update(updateData, function(err, ret) {
						if (err) { callback(err); return; } else { callback(null, ret); }
						/*if (data.field_group) {
							webhook.payloadAdd(ret.insertId, data.trigger_id, data.field_group, function(err, result) {
								if (err) { res(err); } else { res(null, ret); }
							});
						} else {
							res(null, ret);
						}
						*/
					});
				}
			], function (err, result) {
					if (err) {
				 ctTrans.rollback(function(){
					 res(err);
				 });
			 } else {
				 ctTrans.commit(function(){
					 res(null);
				 });
			 }
			});
		});
	},
	deletePreWebhookReferences: function(ctTrans,webhookid, res) {
		async.waterfall([
			  function(callback){
					var query = "SELECT provisioned_route_id FROM provisioned_route WHERE webhook_id = "+ webhookid;
					ctTrans.query(query, function(err, data) {
						if (err) { callback(err); return; }
						var routes = _.pluck(data, 'provisioned_route_id');
						callback(null, routes);
					});
			  },
			  function(provisionedRoutes, callback){
					if(provisionedRoutes.length > 0){
						var query = "UPDATE provisioned_route  SET webhook_id = NULL WHERE provisioned_route_id IN ( "+provisionedRoutes+" )";
						var updateData = {
 						 table : 'provisioned_route',
 						 values: { 'webhook_id': 'NULL' },
 						 where : " WHERE provisioned_route_id IN ( "+ provisionedRoutes +" )"
 					 };
						ctTrans.query(query, function(err, data) {
							if (err) { callback(err); return; }
							callback(null,provisionedRoutes);
						});
					}else{
						callback(null, provisionedRoutes);
					}
			  },
			  function(provisionedRoutes, callback){
					if(provisionedRoutes.length > 0){
					 var updateData = {
						 table : 'call_flows',
						 values: { 'webhook_enabled': false },
						 where : " WHERE provisioned_route_id IN ( "+ provisionedRoutes +" )"
					 };
					 ctTrans.update(updateData, function(err, data) {
 						 if (err) { callback(err); return; }
 						 callback(null,provisionedRoutes);

 					 });
 				 }else{
 					 callback(null, provisionedRoutes);
 				 }
			  },
			  function(provisionedRoutes, callback){
					if(provisionedRoutes.length > 0){
 					 var query = "SELECT ir.id from call_flows cf JOIN ce_ivr_routes2 as ir on ir.id = cf.routable_id AND cf.routable_type = 'IvrRoute2' WHERE provisioned_route_id IN ( "+provisionedRoutes+" )";
 					 ctTrans.query(query, function(err, data) {
 						 if (err) { callback(err); return; }
						 var ivrs = _.pluck(data, 'id');
 						 callback(null,ivrs);
 					 });
 				 }else{
 					 callback(null,[]);
 				 }
			  },
			  function(ivrs, callback){
					if(ivrs !== undefined && ivrs.length > 0){
						var updateData = {
							table : 'ce_ivr_options2',
							values: { 'webhook_enabled': false },
							where : " WHERE ivr_route_id IN ( "+ ivrs +" )"
						};
 					 ctTrans.update(updateData, function(err, data) {
 						 if (err) { callback(err); return; }
 						 callback(null);
 					 });
 				 }else{
 					 callback(null);
 				 }
			  }
			], function (err, result) {
					if (err) {
					 res(err);
			 } else {
					 res(null);
			 }
		});
	},
	test: function(data, res) {
		
		var webhookdata;
		var datatype ;
		var webhookString;


		webhookdata = {
			"Call ID":"Call ID",
			"Provisioned Route ID":"Provisioned Route ID",
			"Org Unit ID":"Org Unit ID",
			"Campaign Name":"Campaign Name",
			"Campaign External ID":"Campaign External ID",
			"Caller ID":"Caller ID",
			"Tracking Number":"Tracking Number",
			"Ad Source":"Ad Source",
			"Ring To":"Ring To",
			"Dispositon":"Dispositon",
			"Duration":"Duration",
			"Repeat Call":"Repeat Call",
			"Call Started":"Call Started",
			"Call Ended":"Call Ended",
			"Cdr Source":"Cdr Source",
			"Call Mine Status":"Call Mine Status",
			"Call External ID":"Call External ID",
			"Outbound Call":"Outbound Call",
			"Call Value":"Call Value",
			"Call Recording Filename":"Call Recording Filename",
			"Call Recording URL": "Call Recording URL",
			"Group ID":"Group ID",
			"Parent Group ID":"Parent Group ID",
			"Billing Group ID":"Billing Group ID",
			"External Group ID":"External Group ID",
			"Group Name":"Group Name",
			"Group Status":"Group Status",
			"Group Address":"Group Address",
			"Group City":"Group City",
			"Group State":"Group State",
			"Group Zip":"Group Zip",
			"Group Phone Number":"Group Phone Number",
			"Group Date Created":"Group Date Created",
			"Group Date Modified":"Group Date Modified",
			"Industry Name":"Industry Name",
			"Route Name":"Route Name",
			"Route ID":"Route ID",
			"Route type":"Route type",
			"Route Group ID":"Route Group ID",
			"Repeat Interval":"Repeat Interval",
			"Route Description":"Route Description",
			"Route Status":"Route Status",
			"Route Created":"Route Created",
			"Route Modified":"Route Modified",
			"Geo Location Name":"Geo Location Name",
			"dni_logs":
			{
				"Custom Params":
				{
					"custom 1":"custom 1"
				},
				"First Page":"First Page",
				"IP Host":"IP Host",
				"Last Page":"Last Page",
				"Location":{
					"ip": "0.0.0.0",
                	"country_code": "country_code",
                	"country_name": "country_name",
                	"region_code": "region_code",
                	"region_name": "region_name",
                	"city":"city",
                	"zipcode": "zipcode",
                	"latitude": "latitude",
                	"longitude": "longitude",
                	"metro_code": "metro_code",
                	"area_code": "area_code"
				},
				"Ref Params":
				{
					"gclid":"gclid",
					"gclsrc":"gclsrc",
					"utm_campaign":"utm_campaign",
					"utm_medium":"utm_medium",
					"kw":"keyword",
					"search engine parameters": "search engine parameters"
				},
				"Referring":"Referring",
				"Referring Type":"Referring Type",
				"Search Words":"Search Words",
				"Session ID":"Session ID"
			},
			"Indicators":
			[
				{
					"name":"name",
					"score":"score"
				},
				{
					"name":"name",
					"score":"score"
				},
				{
					"name":"name",
					"score":"score"
				}
			],
			"Static Params":data.param,
			//"field Name":data.param,
			//"field value":data.param,
			
			"Custom Source 1":"Custom Source 1",
			"Custom Source 2":"Custom Source 2",
			"Custom Source 3":"Custom Source 3",
			"Custom Source 4":"Custom Source 4",
			"Custom Source 5":"Custom Source 5",
			"data_append":{
				"caller_name" : 'caller_name',
				"company_name": 'company_name',
				"address"     : 'address',
				"city"        : 'city',
				"state"       : 'state',
				"zip"         : 'zip',
				"line_type"   : 'line_type'
			}
		};

		//webhookString = JSON.stringify(webhookdata);
		//console.log("hello test",webhookString);
		console.log("static params are",data.param);
		var request = require('../functions/sendRequest');
		var urlData = 'https://script.google.com/macros/s/AKfycby8utv65-Tn7L3pnP2_-kkJ_BaoUdPCpBoG2MN7Isvvc6pVJJKu/exec';
		var requestData = {
			url: data.url,
			method: data.method,
			format: data.format,
			payload: webhookdata
		};

		//console.log("-----Check----",requestData);
		request['http'](requestData, function(err,data) {
			if (err) {
				console.log('Error sending webhook');
				res(err,null);
			} else {
				console.log('sent call_action webhook');
				res(null,data);
			}
		});
	},
	drop: function(webhookid, res) {
		if (webhookid === undefined || webhookid === '') { return res('No webhook ID given'); }
		var ctTrans = new ctTransactionModel.begin(function(err){
		async.waterfall([
			  function(callback){
						webhook.deletePreWebhookReferences(ctTrans,webhookid,function(err,data){
							if(err){return callback(err);}
							callback(null);
						});
			  },
			  function(callback){
					var updateData = {
						table : 'webhook',
						values: { 'webhook_status':'deleted' },
						where : " WHERE webhook_id=" + webhookid
					};
					var qry = "DELETE FROM call_action WHERE action='webhook' AND action_target='"+webhookid+"'";
					ctTrans.update(updateData, function(err, ret) {
					if (err) { return callback('Failed to execute deletion of webhook. '+err); }
						ctTrans.query(qry, function(err) {
							if (err) { return callback('Failed to execute deletion of call actions. '+err); }
							callback(null, 'success');
						});
					});
			  }
			], function (err, result) {
					if (err) {
				 ctTrans.rollback(function(){
					 res(err);
				 });
			 } else {
				 ctTrans.commit(function(){
					 res(null);
				 });
			 }
			});
		});
	},
	lookup: function(req, res) {
		var webhookid = req.params.id;
		var user_ou_id = req.params.ouid;
		if (!isNaN(webhookid) && !isNaN(user_ou_id)) {
			var qry = "SELECT * FROM webhook WHERE webhook_id=" + webhookid +" AND org_unit_id = "+ user_ou_id;
			appModel.ctPool.query(qry, function(err, data) {
				if (err) { res(err); return; }
				if(data.length < 1){res("webhook not found"); return; }
				// get static parameters
				qry = "SELECT webhook_map_id, field_name, field_value FROM webhook_map WHERE webhook_id=" + webhookid + " AND field_id IS NULL ORDER BY map_order ASC";
				appModel.ctPool.query(qry, function (err, data3) {
					if (err) { res(err); return; }
					console.log("data inside", data3);
					data[0].static = data3;

					// get related routes
					qry = "SELECT DISTINCT ON (p.provisioned_route_id) p.provisioned_route_id, p.provisioned_route_name FROM call_action c, provisioned_route p " +
					      "WHERE c.action='webhook' AND c.action_target='" + webhookid + "' AND c.provisioned_route_id=p.provisioned_route_id AND p.provisioned_route_status != 'deleted'";
					appModel.ctPool.query(qry, function(err, data2) {
						if (err) { res(err); return; }
						data[0].routes = data2;
						res(null, data);
					});
				});
			});
		} else {
			res('Invalid webhook ID submitted');
		}
	},
	mapCreate: function(data, res) {
		var insertData = {
			table : 'webhook_map',
			values: data
		};
		appModel.ctPool.insert(insertData, function(err, ret) {
			if (err) { res(err); } else { res(null, ret); }
		});
	},
	mapUpdate: function(data, res) {
		// replaced update query with delete and add as on prod cannot make update for this table.
		var oldData, mapid = data.webhook_map_id;
		if (!isNaN(mapid)) {
			var qry = "SELECT * FROM webhook_map WHERE webhook_map_id=" + mapid;
			appModel.ctPool.query(qry, function(err, ret) {
				if (err) { res(err); return; }
				qry = "DELETE FROM webhook_map WHERE webhook_map_id=" + mapid;
				appModel.ctPool.query(qry, function(err, ret2) {
					if (err) { res(err); }
					else {
						var insertData = {
			table : 'webhook_map',
			values: data
		};
						appModel.ctPool.insert(insertData, function(err, ret) {
			if (err) { res(err); } else { res(null, ret); }
		});
					}
				});
			});
		} else {
			res('Invalid webhook_map ID submitted');
		}

		// var updateData = {
		// 	table : 'webhook_map',
		// 	values: data
		// };
		// appModel.ctPool.update(updateData, function(err, ret) {
		// 	if (err) { res(err); } else { res(null, ret); }
		// });
	},
	mapDrop: function(mapid, res) {
		if (!isNaN(mapid)) {
			var qry = "SELECT * FROM webhook_map WHERE webhook_map_id=" + mapid;
			appModel.ctPool.query(qry, function(err, ret) {
				if (err) { res(err); return; }

				var qry = "DELETE FROM webhook_map WHERE webhook_map_id=" + mapid;
				appModel.ctPool.query(qry, function(err, ret2) {
					if (err) { res(err); } else { res(null, { "webhook_id": ret[0].webhook_id}); }
				});
			});
		} else {
			res('Invalid webhook_map ID submitted');
		}
	},
	/* These functions are no longer being used

	payloadAdd: function(webhookid, triggerid, group, res) {
		if (!isNaN(webhookid) && !isNaN(triggerid)) {
			var qry = "SELECT * FROM trigger_field WHERE trigger_id=" + triggerid + " AND field_group='" + group + "'";
			appModel.ctPool.query(qry, function(err, data) {
				if (err) { res(err); }
				// now take the results to insert the fields for the webhook
				qry = "INSERT INTO webhook_map (webhook_id, field_id, map_order) VALUES ";
				var qry2 = '';
				var cnt = 0;
				data.forEach(function(row, key) {
					qry2 += ",('" + webhookid + "', '" + row.field_id + "', '" + cnt + "')";
					cnt++;
				});
				qry += qry2.substring(1);

				// add fields to webhook
				appModel.ctPool.query(qry, function(err, ret) {
					if (err) { res(err); };
					qry = "UPDATE webhook SET trigger_id=" + triggerid + " WHERE webhook_id=" + webhookid;
					appModel.ctPool.query(qry, function(err, ret2) {
						if (err) {
							res(err);
						} else {
							res(null, {'fields_added':cnt});
						}
					});
				});
			});
		} else {
			res('Invalid webhook or trigger ID submitted')
		}
	},
	payloadList: function(triggerid, res) {
		if (!isNaN(triggerid)) {
			var qry = "SELECT * FROM trigger_field WHERE trigger_id=" + triggerid + " ORDER BY field_group ASC, field_order ASC";
			appModel.ctPool.query(qry, function(err, data) {
				if (err) { res(err); }
				var ret = {};
				var grp = '';
				data.forEach(function(row) {
					if (grp !== row.field_group) {
						grp = row.field_group;
						ret[grp] = [];
					}
					var tmp = { "field_id":row.field_id, "display_name":row.display_name };
					ret[grp].push(tmp);
				});
				res(null, ret);
			});
		} else {
			res('Invalid trigger ID submitted');
		}
	},
	*/
	list: function(ouid, res) {
		if (!isNaN(ouid)) {
			var qry = "SELECT wb.webhook_id, wb.webhook_name, wb.webhook_status, array_to_string(array_agg(DISTINCT pr.provisioned_route_name), ',') as post_webhooks, array_to_string(array_agg(DISTINCT pre_pr.provisioned_route_name), ',') as pre_webhooks "
								+"FROM webhook wb "
								+"LEFT JOIN call_action ca ON (CAST(ca.action_target AS INTEGER) = wb.webhook_id and ca.action = 'webhook') "
								+"LEFT JOIN provisioned_route pr ON (ca.provisioned_route_id = pr.provisioned_route_id AND pr.provisioned_route_status != 'deleted') "
								+"LEFT JOIN provisioned_route pre_pr ON (pre_pr.webhook_id = wb.webhook_id AND pre_pr.provisioned_route_status != 'deleted') "
								+"WHERE wb.webhook_status != 'deleted' AND wb.org_unit_id = "+ouid
								+" GROUP BY wb.webhook_id "
								+"ORDER BY wb.webhook_name"
			appModel.ctPool.query(qry, function(err, data) {
				if (err) { res(err); return; }
					res(null,data);
			});
		} else {
			res('Invalid OrgUnitID value submitted');
		}
	},
	getWebhookList: function(ouid, res) {
		if (!isNaN(ouid)) {
			var qry = "SELECT webhook_id, webhook_name FROM webhook WHERE org_unit_id=" + ouid + " AND webhook_status = 'active' ORDER BY webhook_name";
			appModel.ctPool.query(qry, function(err, data) {
				if (err) { res(err); return; }
				res(null,data);
			});
		} else {
			res('Invalid OrgUnitID value submitted');
		}
	},
	webhookRoute: function(webhookid, res) {
		if (webhookid === undefined || webhookid === '') { return res('No webhook ID provided for route check.'); }

		var qry = "SELECT pr.provisioned_route_id, pr.provisioned_route_name FROM call_action ca, provisioned_route pr " +
			"WHERE ca.provisioned_route_id=pr.provisioned_route_id AND ca.action='webhook' AND ca.action_target='"+webhookid+"'";
		appModel.ctPool.query(qry, function(err, data) {
			if (err) { return res('Failed to execute lookup of call actions for webhook. '+err); }
			res(null, {call_action_route:data});
		});
	},
	getTargetById: function(webhookid, res) {
		//For AMP3 use
		if (webhookid === undefined || webhookid === '') { return res('No webhook ID provided.'); }

		var qry = "SELECT target_url FROM webhook WHERE webhook_id="+webhookid;
		appModel.ctPool.query(qry, function(err, data) {
			if (err) { return res('Failed to execute lookup webhook. '+err); }
			res(null, {webhook:data});
		});
	}
	/* ,
	triggerList: function(res) {
		var qry = "SELECT DISTINCT(tf.field_group), t.trigger_id, t.trigger_name, t.trigger_desc FROM trigger t, trigger_field tf WHERE t.trigger_id=tf.trigger_id ORDER BY t.trigger_id";
		appModel.ctPool.query(qry, function(err, data) {
			if (err) { res(err); }
			var newdata = [];
			var triggerid = 0;

			data.forEach(function(row) {
				if (triggerid != row.trigger_id) {
					row['payload'] = [ row.field_group ];
					delete row.field_group;
					newdata.push(row);
					triggerid = row.trigger_id;
				} else {
					newdata[ newdata.length - 1].payload.push( row.field_group );
				}
			});
			res(null, newdata);
		});
	},
	fieldList: function(triggerid, res) {
		if (!isNaN(triggerid)) {
			console.log('executing query');
			var qry = "SELECT field_id, display_name FROM trigger_field WHERE trigger_id=" + triggerid +
			          " ORDER BY field_order ASC";
			appModel.ctPool.query(qry, function (err, data) {
				if (err) { res(err); } else { res(null, data); }
			});
		} else {
			console.log('invalid! ' + typeof triggerid);
			res('Invalid trigger ID value submitted');
		}
	}
	*/
};

module.exports = webhook;
