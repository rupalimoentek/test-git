var connector          = require('./appModel'),
	 f                  = require('../functions/functions.js'),
	 table              = 'campaign',
	 numberPoolModel    = require('./newNumberPoolModel.js'),
	 ceTransactionModel = require('./ceTransactionModel'),
	 ctTransactionModel = require('./ctTransactionModel'),
	 ctlogger           = require('../lib/ctlogger.js'),
	 orgComponentCountModel  = require('./orgComponentCountModel'),
	 q                  = require("q"),
	 scheduleModel      = require('./scheduleModel'),
	 moment             = require("moment"),  
		_                  = require("underscore"),
	 functions = require('../functions/functions');
var campaign_operators = { startswith : "ILIKE", eq : "=", neq : "<>"}; // options while searching campaigns with kendoui

var campaigns = {
		move: function(ctTrans,data,callback){
				async.parallel([
						function(cb){
								//Update campaign
								var qry = "UPDATE campaign SET campaign_ou_id = "+data.campaign_ou_id+", campaign_owner_user_id = "+data.campaign_owner_user_id+" WHERE campaign_id = "+data.campaign_id;
								ctTrans.query(qry,function(err,d){
										cb(err);
								});
						},
						function(cb){
								async.waterfall([
										function(cb1){
												//Fetch provisioned routes.
												var cprModel = require('./campaignProvisionedRouteModel');
												var qry = "SELECT cpr.provisioned_route_id ";
												qry += " FROM campaign_provisioned_route as cpr";
												qry += " JOIN provisioned_route as pr on cpr.provisioned_route_id = pr.provisioned_route_id";
												qry += " AND provisioned_route_status !='deleted'";
												qry += " WHERE campaign_id = "+data.campaign_id;
												ctTrans.query(qry,function(err,provisioned_routes){
														cb1(err,provisioned_routes);
												});
										},
										function(provisioned_routes,cb1){
												async.each(provisioned_routes,function(provisioned_route,cb2){
														
														async.parallel([
																function(cb3){
																		//Update provisioned route
																		var qry = "UPDATE provisioned_route SET provisioned_route_ou_id = "+data.campaign_ou_id+" WHERE provisioned_route_id = "+provisioned_route.provisioned_route_id;
																		ctTrans.query(qry,function(err){
																				cb3(err);
																		});
																},
																function(cb3){
																		//Update call flows
																		async.waterfall([
																				function(cb4){
																						//fetch callflow
																						var qry = "SELECT id,routable_type,routable_id FROM ce_call_flows WHERE provisioned_route_id = "+provisioned_route.provisioned_route_id;
																						var call_flow_data = {
																								which: 'query',
																								qry: qry
																						};
																						ctTrans.query(call_flow_data,function(err,call_flow){
																								cb4(err,call_flow);
																						});
																				},
																				function(call_flow,cb4){
																						
																						async.parallel([
																								function(cb5){
																										//update call flow record
																										var qry = "UPDATE ce_call_flows SET ouid = "+data.campaign_ou_id+" WHERE id = "+call_flow[0].id;
																										var update_data = {
																												which: 'query',
																												qry: qry
																										};
																										ctTrans.query(update_data,function(err){
																												cb5(err);
																										});
																								},
																								function(cb5){
																										//Update route type options
																										var qry = '';
																										switch(call_flow[0].routable_type){
																												case 'GeoRoute':
																														qry = "UPDATE ce_geo_options SET ouid = "+data.campaign_ou_id+" WHERE geo_route_id = "+call_flow[0].routable_id;
																														break;
																												case 'IvrRoute2':
																														qry = "UPDATE ce_ivr_options2 SET ouid = "+data.campaign_ou_id+" WHERE ivr_route_id = "+call_flow[0].routable_id;
																														break;
																										};
																										if (qry !== ''){
																												var routable_update_data ={
																														which: 'query',
																														qry: qry
																												}
																												ctTrans.query(routable_update_data,function(err){
																														cb5(err);
																												})
																										}else{
																												cb5(null);
																										}
																								}
																						],
																						function(err){
																								cb4(err);
																						});//async.parallel cb5
																				}
																		],
																		function(err){
																				cb3(err);
																		});//async.waterfall cb4
																}
														],
														function(err){
																cb2(err)
														});//async.parallel cb3
												},
												function(err){
														cb1(err)
												});//async.each cb2
										}
								],
								function(err){
										cb(err)
								}
								);//async.waterfall cb1
						}
				],
				function(err){
						callback(err);
				});//async.parallel cb


		},
	 create: function (data, res) {
			 var date_timestamp = 'CURRENT_TIMESTAMP';// f.mysqlTimestamp();
			 data.campaign_modified = date_timestamp;
			 data.campaign_created = date_timestamp;
			 var orgUnitsModel = require('./orgUnitModel');
			 data = changeDate(data);
			 delete data.campaign_timezone;
			 var insertData = {
					 table:  'campaign',
					 values: data
			 };
			 connector.ctPool.insert(insertData, function (err, data1) {
					 if (err) { return res(err); }

					 // increment the component count total for campaigns
					 if (insertData.values.campaign_status === "active") {
							 orgComponentCountModel.increment(null, 2, insertData.values.campaign_ou_id, 1, function (err) {
									 if (err) { return res(err); }
									 res(null, data1);
							 });
					 } else if (insertData.values.campaign_status === "inactive") {
							 orgComponentCountModel.incrementSubTotal(null, 2, insertData.values.campaign_ou_id, 1, function (err) {
									 if (err) { return res(err); }
									 res(null, data1);
							 });
					 }
			 });
	 },


	 // @param   {array of integer(s)} arrOrgUnitIds
	 // returns  promise object with {array of integers}
	 getCampaignIdsByOrgUnitIds: function (arrOrgUnitIds) {

			 var deferred = q.defer();

			 // Parameter validation
			 if (!Array.isArray(arrOrgUnitIds)) {
					 throw "invalid parameter getCampaignsByOrgUnitIds";

					 // Would have just gotten back an empty array set anyway
			 }
			 else if (Array.isArray(arrOrgUnitIds) && !arrOrgUnitIds.length) {
					 deferred.resolve([]);
					 return deferred.promise;
			 }

			 var queryPiece = (arrOrgUnitIds.length > 1)
					 ? "IN (" + arrOrgUnitIds.join(",") + ")"
					 : " = " + arrOrgUnitIds[0];

			 var selQry = "";
			 selQry += "SELECT campaign_id ";
			 selQry += "FROM campaign ";
			 selQry += "WHERE campaign_ou_id " + queryPiece;

			 connector.ctPool.query(selQry, function (err, campaignIdsResultSet) {
					 if (err) {
							 deferred.resolve({err: err});

					 }
					 else {
							 deferred.resolve({err: null, data: campaignIdsResultSet});
					 }
			 });

			 return deferred.promise;


	 },
	 getAllUnderOuid: function (ouid, callback) {
			 var orgUnitModel = require('./orgUnitModel');
			 async.waterfall([
					 function(cb){
							 orgUnitModel.ouAndDescendents(ouid, function(ous){
									 cb(null,ous);
							 });
					 },
					 function(ous, cb){
							 var selQry = "";
							 selQry += "SELECT campaign_id, campaign_name";
							 selQry += " FROM campaign";
							 selQry += " WHERE campaign_ou_id IN ("+ous+")";
							 selQry += " AND campaign_status = 'active'"

							 connector.ctPool.query(selQry, function (err, campaignResultSet) {
									 cb(err, campaignResultSet);
							 });
					 }
			 ],
			 function(err, result){
					 if (err) {
							 callback(err);
					 } else {
							 callback(null, result);
					 }
			 });
	 },
	 setCampaignStatus: function (data, res) {
			 var campaignData = {
					 campaign_status  :data.campaign.status,
					 campaign_modified:'CURRENT_TIMESTAMP',
					 campaign_id      :data.campaign.id
			 };
			 if (data.campaign.date_changed) {
					 if (data.campaign.start_date && data.campaign.start_date !== undefined) {
							 campaignData.campaign_start_date = (data.campaign.timezone !== undefined ? data.campaign.start_date + " " + data.campaign.timezone : data.campaign.start_date);
							 campaignData.campaign_end_date = (data.campaign.timezone !== undefined && data.campaign.end_date !== null ? data.campaign.end_date + " " + data.campaign.timezone : data.campaign.end_date);
					 }
			 }
			 var updateData = {
					 which :'update',
					 table :table,
					 values:campaignData
			 };
			 campaigns.campaignCount(connector.ctPool, campaignData, function(err) {
					 if (err) { return res('Failed to set campaign counts. '+err); }

					 connector.ctPool.update(updateData, function (err) {
							 if (err) { return res('Failed to update campaign status. ' + err); }
							 res(null);
					 });
			 });
	 },
	 setStatus: function (data, req, callback, ctTransModelPassedIn) {
		 var provisioned_route_id;
			 async.series([
				 function (cb) {
						 // update the campaign count totals based on status change
						 campaigns.campaignCount(ctTransModelPassedIn, data, function(err) {
								 if (err) { return cb('Failed to set campaign counts. '+err); }
								 cb(null);
						 });
				 },
					 function (cb) {
							 var qry = "UPDATE campaign SET campaign_modified = CURRENT_TIMESTAMP, campaign_status = '" + data.campaign.status + "' WHERE campaign_id  = " + data.campaign.id;
							 var updateData = {
									 which: 'query',
									 qry:   qry
							 };
							 ctTransModelPassedIn.query(updateData, function (err) {
									 cb(err);
							 });
					 },
					 function (cb) {
							 async.waterfall([
									 function (cb1) {
										 var campaignProvisionedRoutes = require('./campaignProvisionedRouteModel');
										 campaignProvisionedRoutes.getProvisionedRoutes(data.campaign.id, function (err, d) {
												 if (err) { return cb1('Failed to get list of provisioned routes. ' + err); }
												 var provisioned_route_ids = _.pluck(d, 'provisioned_route_id');
												 cb1(null, provisioned_route_ids);
										 });
									 },
									 function (pr_ids, cb1) {
											 var provisionedRouteModel = require('./provisionedRouteModel');
											 var prData = {
													 provisioned_route: {
															 ids:    pr_ids,
															 status: data.campaign.status
													 }
											 };
											 provisionedRouteModel.setStatusAll(ctTransModelPassedIn, prData, req, function (err) {
													 cb1(err,pr_ids);
											 });
									 },
									 function (pr_ids, cb1) {
											 // delete scheduled tasks from scheduler for deleted provisioned routes.
											 var scheduleModel      = require('../models/scheduleModel');
											 provisioned_route_id = pr_ids;
											 if(data.campaign.status === 'deleted') {
													 scheduleModel.delete(pr_ids.join(','), function (err,data) {
															 cb1(err);
													 });
											 } else {
													 cb1(null);
											 }
									 }
							 ],
							 function (err) {
									 cb(err);
							 });
					 }
			 ],
			 function(err) {
					 if (err) { return callback(err); }
					 
					 var result = {
						 prov_id : provisioned_route_id,
						 status: "Campaign Status Updated"
					 }
					 callback(null, result);
			 });
	 },
	 getByUserId: function (userid, res) {
			 var selectData = {
					 userid: userid
			 };
			 var query = selectCampaignSql(selectData);
			 connector.ctPool.query(query, function (err, data) {
					 res(err, jsonGetCampaigns(data));
					 //res(data);
			 });
	 },
	 getCampaignsUserId:function (userid, res) {
			 var query = "SELECT campaign_id as id, campaign_name as name FROM "+ table +" WHERE campaign_owner_user_id = " + userid +" AND campaign_status !='deleted'";
			 connector.ctPool.query(query, function (err, data) {
					 var campaignList = [];
					 for (var i = 0; i < data.length; i++) {
							 campaignList.push(data[i].name);
					 }
					 res(err, campaignList);
			 });
	 },
	 cfaCampaignSingle: function (campaignId, res) {
				var query = "select c.*, ou.* from campaign c ";
						query += "join org_unit ou on ou.org_unit_id =  c.campaign_ou_id ";
						query += "where campaign_status = 'active' and c.campaign_id = " +campaignId;
				connector.ctPool.query(query, function (err, ctData) {
						if(err){
								return res(err);
						}else{
								res(err, ctData);
						}
				});
		},
	allowedOwners: function (req, callback) {
		//// FOR AMP3 DO NOT CHANGE

		var qry = "SELECT *"; 
		qry += " FROM ct_user AS cu";
		qry += " JOIN ct_user_detail AS ud ON ud.ct_user_id = cu.ct_user_id";
		qry += " WHERE ct_user_ou_id IN (";
		qry += " SELECT org_unit_id FROM org_unit WHERE top_ou_id = ("
		qry += " SELECT top_ou_id FROM org_unit WHERE org_unit_id = "+req.params.ouid
		qry += ") AND org_unit_status = 'active'";
		qry += " )";
		qry += " AND cu.role_id IN (1,2)";


		connector.ctPool.query(qry, function (err, data) {
			if(err){
				return callback(err);
			}else{
				callback(err, data);
			}
		});
	},
	getByOuId: function (userid, ouid, user_ou_id, userAccess, orglist, timezone, queryParams, res) {
		var ou_list = orglist;
		var selectData = {
			userid:     userid,
			ouid:       ouid,
			userAccess: userAccess,
			timezone:   timezone,
			user_ou_id: user_ou_id,
			oulist: ou_list,
			limit: 100,
			offset: (parseInt(queryParams.page) - 1) * 100,
			orderBy: (queryParams.orderBy)? queryParams.orderBy : 'c.campaign_name',
			order: (queryParams.order)? queryParams.order : 'ASC',
		};

		var query = "";
		query += " FROM " + table;
		query += " c LEFT JOIN campaign_provisioned_route cpr ON (c.campaign_id=cpr.campaign_id) LEFT JOIN campaign_ct_user ccu ON (c.campaign_id=ccu.campaign_id AND ccu.ct_user_id = " + selectData.userid + ") ";
		query += "  LEFT JOIN provisioned_route pr ON (cpr.provisioned_route_id=pr.provisioned_route_id AND pr.provisioned_route_status != 'deleted')";
		query += "  LEFT JOIN provisioned_route_number prn ON (pr.provisioned_route_id=prn.provisioned_route_id) ";
		query += "  LEFT JOIN phone_number pn ON (prn.phone_number_id=pn.number_id) ";
		query += "  LEFT JOIN phone_pool pp ON pp.provisioned_route_id = pr.provisioned_route_id ";
		query += "  LEFT JOIN phone_pool_number ppn ON (ppn.pool_id=pp.pool_id) ";
		query += "  LEFT JOIN org_unit ou ON ou.org_unit_id = c.campaign_ou_id";
		query += "  LEFT JOIN user_permissions up ON (up.ct_user_id=ccu.ct_user_id)";
		query += "  LEFT JOIN channel ch on ch.channel_id = pr.channel_id  ";
		query += "  LEFT JOIN ce_call_flows cf on cf.provisioned_route_id = pr.provisioned_route_id ";

		if (selectData.userAccess == 7) { // if the user is an admin they see every campaign within the current ou
			query += " WHERE c.campaign_ou_id = " + selectData.ouid + " AND c.campaign_status !='deleted' "
		} else if (selectData.userAccess === undefined || selectData.userAccess < 7) { // if the user is not an admin they see campaigns that they are users or owners of for the current ou
			query += " WHERE ((c.campaign_owner_user_id = " + selectData.userid + " OR ccu.ct_user_id = " + selectData.userid + "))  AND c.campaign_status !='deleted' AND c.campaign_ou_id = " + selectData.ouid ;
		}

		async.waterfall([
			function(cb1){
				//Fetch provisioned routes.
				var selectQuery = "";
				selectQuery += "SELECT DISTINCT c.campaign_id as id, c.campaign_name as name, c.campaign_ext_id as camp_ext_id, c.campaign_start_date AT TIME ZONE '" + selectData.timezone+"' As start_date , c.campaign_end_date AT TIME ZONE '" + selectData.timezone + "' AS end_date, c.campaign_status as status, (count(ppn.pool_id) + count(prn.phone_number_id)) as quantity "
				var campQuery = selectQuery + query;
				campQuery += "GROUP BY c.campaign_id "
				if(queryParams.filter !== undefined && queryParams.filter !== ''){
					campQuery += " ORDER BY " + selectData.orderBy + " " + selectData.order
				}else{
					campQuery += " ORDER BY " + selectData.orderBy + " " + selectData.order +" LIMIT " + selectData.limit + " OFFSET " + selectData.offset;
				}
				connector.ctPool.query(campQuery, function(err,campaignData){
					jsonGetCampaignsList(campaignData, timezone, function(err, data){
						cb1(err, data);
					});
				});
			},
			function(campaignData, cb1){
				var selectQuery = "";
				selectQuery += "SELECT count(DISTINCT c.campaign_id) as total ";
				query = selectQuery + query;
				connector.ctPool.query(query,function(err, campTotal){
					cb1(err, {'campaigns': campaignData,'total':  campTotal[0].total})
				});
			}
		],
		function(err, result){
			res(err, result);
		});
	},
	getCampaignOwner: function (id, res) {
				if (id) {
						var query = "SELECT campaign_owner_user_id as owner_user_id FROM " + table + " WHERE campaign.campaign_id =" + id;
						connector.ctPool.query(query, function (err, data) {
								if (data && data.length > 0) {
										res(data[0].owner_user_id);
								}
						});
				}
				else {
						res(null);
				}
		},
		
		getCampCallflowReport: function(ouid, userid, userAccess, timezone, orgList, camp_id, res)
	 	{
			 var selectData = {
					 ouid:       ouid,
					 userAccess: userAccess,
					 timezone:   timezone,
					 userid: userid
			 };
			 var subscriptionFlag=false;
			 var reportData = {};
			 var accessgroup = [];
			 
			 var campaign_ids = [];
		
			 query = " FROM " + table;
			 query += " c LEFT JOIN campaign_provisioned_route cpr ON (c.campaign_id=cpr.campaign_id) LEFT JOIN campaign_ct_user ccu ON (c.campaign_id=ccu.campaign_id AND ccu.ct_user_id = " + selectData.userid + ") ";
			 query += "  LEFT JOIN provisioned_route pr ON (cpr.provisioned_route_id=pr.provisioned_route_id AND pr.provisioned_route_status != 'deleted')";
			 query += "  LEFT JOIN provisioned_route_number prn ON (pr.provisioned_route_id=prn.provisioned_route_id) ";
			 query += "  LEFT JOIN phone_number pn ON (prn.phone_number_id=pn.number_id) ";
			 query += "  LEFT JOIN org_unit ou ON ou.org_unit_id = c.campaign_ou_id";
			 query += "  LEFT JOIN user_permissions up ON (up.ct_user_id=ccu.ct_user_id)";
		
			if(camp_id){
				query += " WHERE c.campaign_id = " + camp_id + " AND c.campaign_status !='deleted' "
			}else if (selectData.userAccess == 7) { // if the user is an admin they see every campaign within the current ou
					query += " WHERE c.campaign_ou_id IN ("+ orgList +") AND c.campaign_status !='deleted' "
					 //query += " OR org_unit_parent_id =("+selectData.ouid+") INTERSECT SELECT unnest(groups_list) FROM user_permissions WHERE ct_user_id = ("+selectData.userid +")) AND c.campaign_status !='deleted' ";
			}
			else if (selectData.userAccess === undefined || selectData.userAccess < 7) { // if the user is not an admin they see campaigns that they are users or owners of for the current ou
					query += " WHERE ((c.campaign_owner_user_id = " + selectData.userid + " OR ccu.ct_user_id = " + selectData.userid + "))  AND c.campaign_status !='deleted' AND c.campaign_ou_id IN (SELECT unnest(array[org_unit_id]) AS group_access FROM org_unit WHERE org_unit_id = ("+selectData.ouid+") OR top_ou_id =("+selectData.ouid+") " ;
					query += " OR org_unit_parent_id =("+selectData.ouid+") INTERSECT SELECT unnest(groups_list) FROM user_permissions WHERE ct_user_id = ("+selectData.userid +")) AND c.campaign_status !='deleted' ";
			}

		 
			 async.waterfall([
				
					function(cb1){
							 
							 var selectQuery = "";
							 selectQuery += "SELECT DISTINCT c.campaign_id ";
							 var campQuery = selectQuery + query;

							 connector.ctPool.query(campQuery,function(err,campaignData){
									 for (var i = 0; i < campaignData.length; i++) {
											 campaign_ids.push(campaignData[i].campaign_id);
									 }

									 
								 cb1(err,campaign_ids);
									 
							 });
					 },
					 function(campaign_ids, cb1){
					 var selectQuery =" SELECT  ca.campaign_id as id, ca.campaign_ou_id AS ouid, ou.org_unit_name AS group_name, ca.campaign_name AS name , ca.campaign_start_date AT TIME ZONE '" + selectData.timezone + "' AS start_date, ca.campaign_end_date AT TIME ZONE '" + selectData.timezone + "' AS end_date, ca.campaign_status AS campaign_status, ";
					 selectQuery +=" op.org_unit_name AS parent_group_name, op.org_unit_ext_id AS parent_group_external_id, op.org_unit_id AS parent_group_id , ";
					 selectQuery +="  ch.category || ' ' || ch.sub_category AS ad_source, ou.org_unit_id AS group_id, ob.org_unit_ext_id AS account_exid, ou.org_unit_status AS group_status, ";
					 selectQuery +=" wh.webhook_name AS pre_call_webhook,  dniouid.custom_params AS custom_parameters, ds.dni_element AS html_class,";
					 selectQuery +=" ds.destination_url AS host_domain, ds.dni_type, cf.vm_enabled AS sce_enabled, ";
					 selectQuery +=" CASE WHEN cf.routable_type = 'IvrRoute2' THEN null WHEN cf.routable_type != 'IvrRoute2' AND cf.whisper_enabled = false THEN null ELSE cf.whisper_message END AS whisper_message,CASE WHEN cf.routable_type = 'IvrRoute2' THEN null WHEN cf.routable_type != 'IvrRoute2' AND cf.message_enabled = false THEN null ELSE cf.message END AS voice_prompt, ";
					 selectQuery +=" CASE WHEN cf.routable_type = 'IvrRoute2' THEN '' ELSE cf.play_disclaimer END AS play_disclaimer, ";
					 //selectQuery +=" CASE WHEN cf.routable_type = 'IvrRoute2' AND io2.target_did = 'hangup' THEN '' "
					 selectQuery +=" CASE WHEN cf.routable_type = 'IvrRoute2' THEN null " ;
					 selectQuery += " ELSE (CASE WHEN pr.provisioned_route_id IS NOT NULL AND cf.record_until IS NULL THEN 'Yes' WHEN pr.provisioned_route_id IS NOT NULL AND cf.record_until IS NOT NULL THEN 'No' ELSE '' END)  END AS record_call , ";
					 selectQuery += " CASE WHEN cf.sms_enabled = 't'  THEN 'Yes' ELSE 'No' END AS sms_enabled, ";
					 selectQuery +=" pr.repeat_interval AS repeat_interval,pr.call_value AS call_value, ds.referrer AS referring_website,ds.referrer_type AS referrer_type ,";
					 selectQuery +=" ou.org_unit_ext_id AS group_external_id, ce_gre.strategy, ca.campaign_ext_id AS campaign_external_id,CASE WHEN pr.provisioned_route_id IS NOT NULL AND ds.dni_setting_id IS NOT NULL THEN 'Yes' WHEN pr.provisioned_route_id IS NOT NULL AND ds.dni_setting_id IS  NULL THEN 'No' ELSE ''  END AS  dni, pn.number AS tracking_number, cf.routable_type AS tracking_number_type, pr.provisioned_route_status AS tracking_number_status,pr.provisioned_route_name AS tracking_name, ";
					 //selectQuery +=" ou.org_unit_ext_id AS group_external_id, ca.campaign_ext_id AS campaign_external_id,CASE WHEN  ds.dni_setting_id IS NULL THEN 'No' ELSE 'Yes' END AS  dni, pn.number AS tracking_number, cf.routable_type AS tracking_number_type, pr.provisioned_route_status AS tracking_number_status,pr.provisioned_route_name AS tracking_name, ";
					 selectQuery +=" pr.provisioned_route_id AS tracking_id, ob.org_unit_id AS account_id, ob.org_unit_ext_id AS acc_exid, ob.org_unit_name AS account_name, cs1.custom_source_name AS cs1, cs2.custom_source_name AS cs2, ";
					 selectQuery +=" cs3.custom_source_name AS cs3,cs4.custom_source_name AS cs4, cs5.custom_source_name AS cs5 , pr.provisioned_route_status AS status,";
	
					// Spamgard Protection
					selectQuery += "CASE ";
					selectQuery += "WHEN ora.component_id IS NOT NULL THEN ( CASE WHEN cf.spam_filter_enabled = 't'  THEN 'Yes' ELSE 'No' END) ELSE null " ;
					selectQuery += "END AS spam_guard, ";
					
					// Hunt Options
					selectQuery += "CASE ";
					selectQuery += "WHEN cf.routable_type = 'ScheduleRoute' THEN ces.ce_hunt_type_id " ;
					selectQuery += "WHEN cf.routable_type = 'PercentageBasedRoute' THEN pro.ce_hunt_type_id " ;
					selectQuery += "WHEN cf.routable_type = 'SimpleRoute' AND cf.hunt_option IS NOT NULL THEN cf.hunt_option ";
					selectQuery += "WHEN cf.routable_type = 'GeoRoute' AND cf.hunt_option IS NOT NULL THEN cf.hunt_option ";

					selectQuery += "ELSE null " ;
					selectQuery += "END AS hunt_option, ";


					selectQuery += "CASE ";
					selectQuery += "WHEN cf.routable_type = 'ScheduleRoute' THEN ces.vm_enabled " ;
					selectQuery += "WHEN cf.routable_type = 'PercentageBasedRoute' THEN pro.vm_enabled " ;
					selectQuery += "WHEN cf.routable_type = 'SimpleRoute' THEN cf.vm_enabled ELSE null " ;
					selectQuery += "END AS vm_enabled, ";

					selectQuery += "CASE ";
					selectQuery += "WHEN cf.routable_type = 'ScheduleRoute' THEN csr.default_ringto " ;
					selectQuery += "ELSE '' " ;
					selectQuery += "END AS ses_ring_to, ";

					selectQuery += "CASE ";
					selectQuery += "WHEN cf.routable_type = 'ScheduleRoute' THEN csr.vm_enabled " ;
					selectQuery += "END AS sch_enabled, ";
					// Refferal component
					selectQuery += "CASE ";
					selectQuery += "WHEN orr.component_id IS NOT NULL THEN ( CASE WHEN ca.referral_number IS NOT NULL THEN 'Yes' ELSE 'No' END) ELSE null " ;
					selectQuery += "END AS referral_number, ";
					selectQuery += "CASE WHEN pr.is_post_call_ivr_enabled = 't' THEN pcio.post_call_ivr_option_name  ELSE null END AS post_call_ivr,  ";
					selectQuery += "CASE WHEN pr.is_post_call_ivr_enabled = 't' THEN 'Yes'  ELSE 'No' END AS post_call_ivr_status,  ";

					//selectQuery += " CASE WHEN cf.routable_type = 'IvrRoute2' AND io2.target_did != 'hangup' AND substring(io2.target_did,1,12) != 'geo_route://' THEN io2.target_did ";
					 //selectQuery += " WHEN cf.routable_type = 'IvrRoute2' AND io2.target_did != 'hangup' AND substring(io2.target_did,1,12) = 'geo_route://' THEN cf.default_ringto ";
					 //selectQuery += " WHEN cf.routable_type = 'IvrRoute2' AND io2.target_did = 'hangup' THEN  io2.target_did ";
					 //selectQuery += " WHEN cf.routable_type = 'GeoRoute'  THEN    lr.location_route_target ::varchar ";
					 selectQuery += "CASE WHEN cf.routable_type = 'PercentageBasedRoute' THEN pro.target_did WHEN cf.routable_type = 'ScheduleRoute' THEN ces.target_did ELSE cf.default_ringto END  AS  ring_to_number ";
					 selectQuery +=" FROM campaign ca ";
					 selectQuery +=" LEFT JOIN campaign_provisioned_route cpr ON ca.campaign_id = cpr.campaign_id ";
					 selectQuery +=" LEFT JOIN provisioned_route pr ON (cpr.provisioned_route_id = pr.provisioned_route_id ) ";
					 selectQuery +=" LEFT JOIN org_unit ou ON ou.org_unit_id = ca.campaign_ou_id ";
					 selectQuery +=" JOIN org_unit ob ON ob.org_unit_id = ou.billing_id ";
					 selectQuery +=" LEFT JOIN org_unit op ON op.org_unit_id = ou.org_unit_parent_id ";

					// Joins for spam_guard value	
					selectQuery += "LEFT JOIN org_billing orb ON orb.org_unit_id = ou.billing_id ";
					selectQuery += "LEFT JOIN org_account ora ON ( ora.org_unit_id = ou.billing_id AND ora.component_id = 396 ) ";
					// Refferal component  to check subscription
					selectQuery += "LEFT JOIN org_account orr ON ( orr.org_unit_id = ou.billing_id AND orr.component_id = 28 ) ";

					selectQuery += "LEFT JOIN org_account orac ON (orac.org_unit_id = ou.billing_id AND orac.subscription_id IS NOT NULL) ";
					selectQuery += "LEFT JOIN subscription sub ON sub.subscription_id = orac.subscription_id ";
					selectQuery += "LEFT JOIN subscription_component sc ON ( sc.subscription_id = sub.subscription_id AND sc.component_id = 19 ) ";
					
					selectQuery += "LEFT JOIN default_org_setting dos ON dos.org_unit_id = ou.org_unit_id ";
					selectQuery += "LEFT JOIN default_org_setting dops ON dops.org_unit_id = ou.org_unit_parent_id ";
					selectQuery += "LEFT JOIN default_org_setting dots ON dots.org_unit_id = ou.top_ou_id ";
					
					 selectQuery +=" LEFT JOIN channel ch ON ch.channel_id = pr.channel_id ";
					 selectQuery +=" LEFT JOIN ce_call_flows cf ON (cf.provisioned_route_id = pr.provisioned_route_id AND cf.status!='deleted' AND cf.app_id='CT') ";
					 selectQuery +=" LEFT JOIN post_call_ivr pci ON (cf.provisioned_route_id = pci.provisioned_route_id AND pci.post_call_ivr_status!='deleted') ";
					 selectQuery +=" LEFT JOIN post_call_ivr_options pcio ON (pci.post_call_ivr_option_id = pcio.post_call_ivr_option_id) ";
					 selectQuery +=" LEFT JOIN dni_setting ds ON (ds.provisioned_route_id = pr.provisioned_route_id and ds.dni_active = true) ";
					 selectQuery +=" LEFT JOIN dni_org_unit dniouid on dniouid.org_unit_id = ds.org_unit_id ";
					 selectQuery +=" LEFT JOIN phone_detail pd ON pd.provisioned_route_id = pr.provisioned_route_id";
					 selectQuery +=" LEFT JOIN phone_number pn ON pn.number_id = pd.number_id ";
					 selectQuery +=" LEFT JOIN callflow_custom_source cfcs1 ON cfcs1.provisioned_route_id = pr.provisioned_route_id AND cfcs1.custom_source_type = 'CS1' ";
					 selectQuery +=" LEFT JOIN custom_source cs1 ON cs1.custom_source_id = cfcs1.custom_source_id ";
					 selectQuery +=" LEFT JOIN callflow_custom_source cfcs2 ON cfcs2.provisioned_route_id = pr.provisioned_route_id AND cfcs2.custom_source_type = 'CS2' ";
					 selectQuery +=" LEFT JOIN custom_source cs2 ON cs2.custom_source_id = cfcs2.custom_source_id ";
					 selectQuery +=" LEFT JOIN callflow_custom_source cfcs3 ON cfcs3.provisioned_route_id = pr.provisioned_route_id AND cfcs3.custom_source_type = 'CS3' ";
					 selectQuery +=" LEFT JOIN custom_source cs3 ON cs3.custom_source_id = cfcs3.custom_source_id ";
					 selectQuery +=" LEFT JOIN callflow_custom_source cfcs4 ON cfcs4.provisioned_route_id = pr.provisioned_route_id AND cfcs4.custom_source_type = 'CS4' ";
					 selectQuery +=" LEFT JOIN custom_source cs4 ON cs4.custom_source_id = cfcs4.custom_source_id ";
					 selectQuery +=" LEFT JOIN callflow_custom_source cfcs5 ON cfcs5.provisioned_route_id = pr.provisioned_route_id AND cfcs5.custom_source_type = 'CS5' ";
					 selectQuery +=" LEFT JOIN custom_source cs5 ON cs5.custom_source_id = cfcs5.custom_source_id ";
					 selectQuery += " LEFT JOIN ce_geo_routes ce_gre ON ce_gre.id = cf.routable_id AND cf.routable_type = 'GeoRoute' "; 
					 selectQuery += " LEFT JOIN ce_percentage_route_options pro ON pro.percentage_route_id = cf.routable_id AND cf.routable_type = 'PercentageBasedRoute' ";  
					 selectQuery += " LEFT JOIN ce_schedule_options ces ON ces.schedule_route_id = cf.routable_id AND cf.routable_type = 'ScheduleRoute' ";  
					 selectQuery += " LEFT JOIN ce_schedule_routes csr ON csr.id = cf.routable_id AND cf.routable_type = 'ScheduleRoute' ";
					 //selectQuery += " LEFT JOIN ce_ivr_options2 io2 ON cf.routable_id = io2.ivr_route_id AND cf.routable_type = 'IvrRoute2'";
					 //selectQuery += "  LEFT JOIN  location_route lr ON lr.location_route_id = pr.provisioned_route_id ";
					// selectQuery +="  LEFT JOIN ce_call_flows c on c.provisioned_route_id = pr.provisioned_route_id";
					 selectQuery += " LEFT JOIN webhook wh on wh.webhook_id = pr.webhook_id   ";
					 selectQuery +=" WHERE pr.provisioned_route_status != 'deleted' AND ca.campaign_id IN (" + campaign_ids.join(",") + ")  ORDER BY ca.campaign_name,pr.provisioned_route_name";
					 connector.ctPool.query(selectQuery,function(err,campaignData){
								getHuntOptionsInfo(campaignData, function(err, result1){
									reportData = jsonGetCampCallflowReport(result1,selectData.timezone,subscriptionFlag);
									cb1(err,reportData);
								});
							 });
					 },
					
			 ], function (err, reportData) {
						
					 res(err, reportData);
			 });
			

	 },
	  //SPmodel to get Callflow by campaignId
	  getCallFlowByCampaignId: function(campIds,res){
		 if (campIds) {

				var query =  "";
				query += " SELECT campaign.campaign_id as id, pr.provisioned_route_id AS callflow_id, pr.call_value AS call_value, pr.provisioned_route_name AS callFlow_name, ";
				query += " cf.routable_type AS type, cf.postcall_ivr_enabled AS instant_insights, pcio.post_Call_ivr_option_name AS instant_insights_config, pr.repeat_interval AS repeat_interval, wh.webhook_name AS pre_call_webhook,  ";
				// query += " CASE WHEN cf.routable_type = 'IvrRoute2' AND io2.target_did = 'hangup' THEN '' ";
				query += " CASE WHEN cf.routable_type = 'IvrRoute2' THEN null" ;
				query += " ELSE (CASE WHEN pr.provisioned_route_id IS NOT NULL AND cf.record_until IS NULL THEN 'Yes' WHEN pr.provisioned_route_id IS NOT NULL AND cf.record_until IS NOT NULL THEN 'No' ELSE '' END) END AS record_call  , ";
				query += " CASE WHEN cf.routable_type = 'IvrRoute2' THEN '' ELSE cf.play_disclaimer END AS play_disclaimer,";
				query += " CASE WHEN cf.routable_type = 'IvrRoute2' THEN null WHEN cf.routable_type != 'IvrRoute2' AND cf.whisper_enabled = false THEN null ELSE cf.whisper_message END AS whisper_message,CASE WHEN cf.routable_type = 'IvrRoute2' THEN null WHEN cf.routable_type != 'IvrRoute2' AND cf.message_enabled = false THEN null ELSE cf.message END AS voice_prompt, (ch.category || ':' || ch.sub_category) AS Ad_Source,  ";
				query += " CASE WHEN  dni.dni_setting_id IS NULL THEN 'No' ELSE 'Yes' END AS dni, dni.destination_url AS host_domain, dni.dni_type, dni.referrer AS referring_website, dni.referrer_type AS referrer_type,";   
				query += " CASE WHEN cf.routable_type = 'ScheduleRoute' THEN scr.default_ringto ELSE '' END AS sch_ringto , scr.vm_enabled AS sch_enabled, "
				query += " CASE WHEN cf.routable_type = 'ScheduleRoute' THEN sce.ce_hunt_type_id WHEN cf.routable_type = 'PercentageBasedRoute' THEN pro.ce_hunt_type_id WHEN cf.routable_type = 'SimpleRoute' AND cf.hunt_option IS NOT NULL THEN cf.hunt_option WHEN cf.routable_type = 'GeoRoute' AND cf.hunt_option IS NOT NULL THEN cf.hunt_option ELSE null END AS hunt_type, "
				query += " dni.dni_element AS html_class, ce_gre.strategy, dniouid.custom_params AS custom_parameters,     ph.number AS track_number, cf.spam_filter_enabled AS spam_guard_status, cf.sms_enabled, ";
				query += " pr.provisioned_route_status AS status, cs1.custom_source_name AS custom_source_1, cs2.custom_source_name AS custom_source_2,  ";
				query += " cs3.custom_source_name AS custom_source_3,cs4.custom_source_name AS custom_source_4, cs5.custom_source_name AS custom_source_5 , "; 
				// query += " CASE WHEN cf.routable_type = 'IvrRoute2' AND io2.target_did != 'hangup' AND substring(io2.target_did,1,12) != 'geo_route://' THEN io2.target_did ";
				// query += " WHEN cf.routable_type = 'IvrRoute2' AND io2.target_did != 'hangup' AND substring(io2.target_did,1,12) = 'geo_route://' THEN cf.default_ringto ";
				// query += " WHEN cf.routable_type = 'IvrRoute2' AND io2.target_did = 'hangup' THEN  io2.target_did ";
				// query += " WHEN cf.routable_type = 'GeoRoute'  THEN    lr.location_route_target ::varchar ";
				query += " CASE WHEN cf.routable_type =   'ScheduleRoute' THEN sce.target_did  "; 
				query += " WHEN cf.routable_type =   'PercentageBasedRoute' THEN pro.target_did ELSE cf.default_ringto END  AS  ring_to_number,";
				query += " CASE WHEN cf.routable_type =   'ScheduleRoute' THEN sce.vm_enabled  ";
				query += " WHEN cf.routable_type =   'PercentageBasedRoute' THEN pro.vm_enabled ELSE cf.vm_enabled END  AS  vm_enabled"
				query += " from campaign  ";
				query += " LEFT JOIN campaign_provisioned_route cpr  ON campaign.campaign_id = cpr.campaign_id ";  
				query += " LEFT JOIN provisioned_route AS pr ON (pr.provisioned_route_id=cpr.provisioned_route_id) ";
				query += " LEFT JOIN provisioned_route_number prn ON prn.provisioned_route_id = pr.provisioned_route_id  ";  
				query += " LEFT JOIN phone_detail pd ON pd.provisioned_route_id = pr.provisioned_route_id "
				query += " LEFT JOIN phone_number ph ON ph.number_id = pd.number_id";
				query += " LEFT JOIN channel ch on ch.channel_id = pr.channel_id   ";
				query += " LEFT JOIN callflow_custom_source cfcs1 ON cfcs1.provisioned_route_id = pr.provisioned_route_id AND cfcs1.custom_source_type = 'CS1'   ";  
				query += " LEFT JOIN custom_source cs1 ON cs1.custom_source_id = cfcs1.custom_source_id  ";          
				query += " LEFT JOIN callflow_custom_source cfcs2 ON cfcs2.provisioned_route_id = pr.provisioned_route_id AND cfcs2.custom_source_type = 'CS2'  ";  
				query += " LEFT JOIN custom_source cs2 ON cs2.custom_source_id = cfcs2.custom_source_id  ";
				query += " LEFT JOIN callflow_custom_source cfcs3 ON cfcs3.provisioned_route_id = pr.provisioned_route_id AND cfcs3.custom_source_type = 'CS3' ";  
				query += " LEFT JOIN custom_source cs3 ON cs3.custom_source_id = cfcs3.custom_source_id  ";
				query += " LEFT JOIN callflow_custom_source cfcs4 ON cfcs4.provisioned_route_id = pr.provisioned_route_id AND cfcs4.custom_source_type = 'CS4' ";  
				query += " LEFT JOIN custom_source cs4 ON cs4.custom_source_id = cfcs4.custom_source_id  LEFT JOIN callflow_custom_source cfcs5 ON cfcs5.provisioned_route_id = pr.provisioned_route_id AND cfcs5.custom_source_type = 'CS5'  ";  
				query += " LEFT JOIN custom_source cs5 ON cs5.custom_source_id = cfcs5.custom_source_id  LEFT JOIN dni_setting dni on dni.provisioned_route_id = pr.provisioned_route_id AND dni.dni_active = true";
				query += " LEFT JOIN dni_org_unit dniouid on dniouid.org_unit_id = dni.org_unit_id  ";
				query += " LEFT JOIN ce_call_flows cf on (cf.provisioned_route_id = pr.provisioned_route_id AND cf.status!='deleted' AND cf.app_id='CT') "; 
				query += " LEFT JOIN ce_percentage_route_options pro ON pro.percentage_route_id = cf.routable_id AND cf.routable_type = 'PercentageBasedRoute' "; 
				query += " LEFT JOIN ce_schedule_options sce ON sce.schedule_route_id = cf.routable_id AND cf.routable_type = 'ScheduleRoute'  ";
				query += " LEFT JOIN ce_schedule_routes scr ON scr.id = cf.routable_id AND cf.routable_type = 'ScheduleRoute'  ";
				//query += " LEFT JOIN ce_ivr_options2 io2 ON cf.routable_id = io2.ivr_route_id AND cf.routable_type = 'IvrRoute2' ";   
				query += " LEFT JOIN ce_geo_routes ce_gre ON ce_gre.id = cf.routable_id AND cf.routable_type = 'GeoRoute' ";  
				query += " LEFT JOIN post_call_ivr pci  ON cf.postcall_ivr_id = pci.post_call_ivr_id  ";
				query += " LEFT JOIN post_call_ivr_options pcio  ON pcio.post_call_ivr_option_id = pci.post_call_ivr_option_id  ";

				//query += " LEFT JOIN ce_call_flows c on c.provisioned_route_id = pr.provisioned_route_id ";
				// query += "  LEFT JOIN  location_route lr ON lr.location_route_id = pr.provisioned_route_id ";
				query += " LEFT JOIN webhook wh on wh.webhook_id = pr.webhook_id   ";
				query += " WHERE campaign.campaign_id IN ("+ campIds +") "; 
				query += " ORDER BY ph.number ASC, pr.provisioned_route_name ASC , sce.id  ASC";

					 connector.ctPool.query(query, function (err, data) {
						 
							 if(err) return res(err);
							var report = (require('./reportModel'));
							report.getHuntOptionsInfo(data, function(err, trackingData){
							 if (data && data.length > 0) {
									
									 res(null, jsonGetCampcallflow(data))
							 }else{
									 res(null, [])
							 }
							});
					 });
			 }
			 else {
					 res(null);
			 }
	
	},
		  

	 //SPmodel end
	 getCampaignOwner: function (id, res) {
			 if (id) {
					 var query = "SELECT campaign_owner_user_id as owner_user_id FROM " + table + " WHERE campaign.campaign_id =" + id;
					 connector.ctPool.query(query, function (err, data) {
							 if (data && data.length > 0) {
									 res(data[0].owner_user_id);
							 }
					 });
			 }
			 else {
					 res(null);
			 }
	 },
	 read: function (which, id, timezone,page, res) {
	 		var limit = 100;
			var offset = (parseInt(page) - 1) * 100;
			 if (timezone === 'undefined') { timezone = 'America/New_York'; }
			 var pool_provisioned_ids = [];
			 var where = "";
			 switch (which) {
					 case 'campaign':
							 where = "WHERE campaign.campaign_id IN (" + id + ") ";
							 break;
					 case 'organizational_unit':
							 where = "WHERE campaign.campaign_ou_id = " + id + " ";
			}				 
			var query = "",
				joinQuery = "",
				countQuery = "",
				orderQuery = "",
				limitQuery = "";

			countQuery = "SELECT count(DISTINCT pr.provisioned_route_id) ";

			query += "SELECT pp.pool_id, pp.provisioned_route_id,pp.pool_name,pp.keep_alive_mins,pp.number_count,pp.pool_created,pp.pool_updated,pp.org_unit_id, campaign.campaign_id as id, campaign_ou_id as org_unit_id, campaign.campaign_ext_id, campaign_name as name, campaign_start_date AT TIME ZONE '" + timezone + "' AS start_date, campaign_end_date AT TIME ZONE '" + timezone + "' AS end_date, campaign_owner_user_id as owner_user_id, campaign_status as status, campaign.referral_number";
			query += ", pr.provisioned_route_id, cf.routable_type, cf.sms_enabled, cf.spam_filter_enabled, pr.provisioned_route_name, pr.provisioned_route_status, pr.repeat_interval, pr.call_value, pr.referral_end_date";
			query += ", pn.number_id, pn.number as phone_number, pd.vendor_id as vendor_id, ";
			//query += ", ct_user.ct_user_id, ct_user.username as username, ";
			//query += " CASE WHEN cf.routable_type = 'IvrRoute2' AND io2.target_did != 'hangup' AND substring(io2.target_did,1,12) = 'geo_route://' THEN cf.default_ringto ";
			//query += " WHEN cf.routable_type = 'IvrRoute2' AND io2.target_did = 'hangup' THEN  io2.target_did ";
			query += " CASE WHEN cf.routable_type =   'PercentageBasedRoute' THEN pro.target_did WHEN cf.routable_type = 'ScheduleRoute' THEN ces.target_did ELSE cf.default_ringto END  AS  ring_to_number ";
			query += " ,CASE WHEN cf.routable_type = 'ScheduleRoute' THEN csr.default_ringto ELSE '' END AS sch_ringto "


			query += ", channel.channel_id, ce_gre.strategy, channel.category as channel_category, channel.sub_category as channel_sub_category, channel_status, pr.webhook_id ";
			
			joinQuery += "FROM " + table + " ";
			joinQuery += "LEFT JOIN campaign_provisioned_route AS cmpr ON (cmpr.campaign_id=campaign.campaign_id) ";
			joinQuery += "LEFT JOIN provisioned_route pr ON (cmpr.provisioned_route_id=pr.provisioned_route_id AND pr.provisioned_route_status != 'deleted') ";
			joinQuery += "LEFT JOIN ce_call_flows cf on (cf.provisioned_route_id = pr.provisioned_route_id AND cf.status!='deleted' AND cf.app_id='CT') "; 
			joinQuery += " LEFT JOIN ce_geo_routes ce_gre ON ce_gre.id = cf.routable_id AND cf.routable_type = 'GeoRoute' ";  
			joinQuery += " LEFT JOIN ce_percentage_route_options pro ON pro.percentage_route_id = cf.routable_id AND cf.routable_type = 'PercentageBasedRoute' ";  
			joinQuery += " LEFT JOIN ce_schedule_options ces ON ces.schedule_route_id = cf.routable_id AND cf.routable_type = 'ScheduleRoute' ";
			joinQuery += " LEFT JOIN ce_schedule_routes csr ON csr.id = cf.routable_id AND cf.routable_type = 'ScheduleRoute' ";  
			//joinQuery += " LEFT JOIN ce_ivr_options2 io2 ON cf.routable_id = io2.ivr_route_id AND cf.routable_type = 'IvrRoute2' ";   
			joinQuery += "LEFT JOIN channel ON (pr.channel_id=channel.channel_id) ";
			joinQuery += "LEFT JOIN provisioned_route_number prn ON (pr.provisioned_route_id=prn.provisioned_route_id) ";
			joinQuery += "LEFT JOIN phone_number pn ON (prn.phone_number_id=pn.number_id) ";
			joinQuery += "LEFT JOIN phone_pool pp ON (pp.provisioned_route_id=pr.provisioned_route_id) ";
			//joinQuery += "LEFT JOIN phone_pool_number ppn ON (ppn.pool_id=pp.pool_id) ";
			//joinQuery += "LEFT JOIN campaign_ct_user AS cmus ON cmus.campaign_id=campaign.campaign_id ";
			joinQuery += "LEFT JOIN phone_detail as pd on pd.number_id = pn.number_id ";
			//joinQuery += "LEFT JOIN ct_user ON ct_user.ct_user_id=cmus.ct_user_id AND ct_user.user_status != 'inactive' AND ct_user.user_status != 'deleted'";
			joinQuery += where;
			if(page)
                orderQuery += "ORDER BY campaign.campaign_name ASC, campaign.campaign_id ASC, pr.provisioned_route_id ASC ,pro.route_order ASC, ces.id ASC LIMIT "+ limit+" OFFSET "+offset;
            else
                orderQuery += "ORDER BY campaign.campaign_name ASC, campaign.campaign_id ASC, pr.provisioned_route_id ASC , ces.id ASC";
	 		async.waterfall([
				function(cb1){
					connector.ctPool.query(query+joinQuery+orderQuery, function (err, data) {
						response = jsonGetCampaigns(data);
						if(response.campaigns && response.campaigns[0].provisioned_routes){
							async.map(response.campaigns[0].provisioned_routes, function(provisioned_route, cb){
								if(provisioned_route.pool && provisioned_route.pool.length > 0 && provisioned_route.pool[0].quantity > 0){
									getStateAndRC(provisioned_route.pool[0].pool_id, function(err, rcData){
										if(err){ cb(err); }else{
											if(rcData && rcData.length > 0){
												provisioned_route.state = rcData[0].state
												provisioned_route.rate_center = rcData[0].rc;
												provisioned_route.poolNPA = rcData[0].npa;
												provisioned_route.poolNXX = rcData[0].nxx;
												cb(null);
											}else{
												cb(null);
											}
										}
									});
								}else{
									cb(null);
								}
							},function(err){
								if(err){return cb1(err);}
								else{
									cb1(null, response);
								}
							});
						}else{
							cb1(null, response);
						}						
			 		});
				},
				function(campaignData, cb1){
					connector.ctPool.query(countQuery+joinQuery, function (err, data) {
						campaignData.campaigns[0].totalRows = data[0].count;
						cb1(null, campaignData);
			 		});
				}
			],
			function(err, campaignData){
				res(err, campaignData);
			});	
			 
	 },
	 update: function (data, res) {
			 data.campaign_modified = 'CURRENT_TIMESTAMP';
			 data = changeDate(data);
			 delete data.campaign_timezone;
			 var updateData = {
					 table:  table,
					 values: data
			 };
		 campaigns.campaignCount(connector.ctPool, data, function(err) {
				 if (err) { return res(err); }

				 connector.ctPool.update(updateData, function (err) {
						 if (err) { return res(err); }
							 res(data);
					 });
			 });
	 },
	 delete: function (req, res) {
			 if (req.params.id) {
				 var data = { 'campaign_id': req.params.id, 'campaign_status': 'deleted' };
				 campaigns.campaignCount(connector.ctPool, data, function(err) {
						 if (err) { return res(err); }

						 var query = "DELETE FROM " + table + " where campaign_id=" + req.params.id;
						 connector.ctPool.query(query, function (err, data2) {
								 if (err) { return res(err); }
									 res(null, data);

									 var newdata = {
											 "org_unit_id": req.ouid,
											 "ct_user_id":  req.userid,
											 "campaign_id": req.params.id,
											 "log_data":    req.params
									 };
									 ctlogger.log(newdata, 'delete', 'campaign','','',req.headers.authorization);
							 });
					 });
			 } else {
					 res('no campaign specified to delete');
			 }
	 },
	 getIdByRelation: function (which, id, res) {
			 var where = '';
			 switch (which) {
					 case 'user':
							 where = "WHERE usr.id = " + id + " ";
							 break;
			 }
			 var query = "SELECT campaign.id ";
			 query += "FROM " + table + " as campaign ";
			 query += "LEFT JOIN campaigns_users AS cmus ON cmus.campaign_id=campaign.id ";
			 query += "LEFT JOIN users AS usr ON usr.id=cmus.user_id ";
			 query += where;

			 connector.ctPool.query(query, function (err, data) {
					 res(data);
			 });
	 },
	 getRouteIdByOus:            function (ous, res) {
			 var qry = "";
			 qry += "SELECT pr.provisioned_route_id";
			 qry += " FROM campaign AS ca";
			 qry += " INNER JOIN campaign_provisioned_route AS cpr ON cpr.campaign_id = ca.campaign_id";
			 qry += " INNER JOIN provisioned_route AS pr ON pr.provisioned_route_id = cpr.provisioned_route_id";
			 qry += " WHERE ca.campaign_ou_id IN (" + ous + ")";
			 qry += " AND ca.campaign_status = 'active'";

			 connector.ctPool.query(qry, function (err, data) {
					 var routeIds = [];
					 for (var key in data) {
							 routeIds.push(data[key].provisioned_route_id);
					 }
					 //join array to a list
					 routeIds = routeIds.join(",");
					 res(err, routeIds);
			 });
	 },
	 checkDuplicateCampaignId:   function (campaign_ext_id, camp_id, billing_id, res) {
			 if (campaign_ext_id !== '') {
					 var query = "SELECT campaign_id";
					 query += " FROM " + table;
					 query += " WHERE campaign_ext_id = '" + campaign_ext_id + "' AND campaign_ou_id IN(SELECT org_unit_id FROM org_unit WHERE top_ou_id = "+billing_id+")";
					 connector.ctPool.query(query, function (err, data) {
							 if (err) {
									 res(err, null);
							 }
							 if (data && data.length > 0) {
									 if (camp_id && camp_id == data[0].campaign_id && data.length == 1) {
											 res(null, true);
									 }
									 else {
											 res('Campaign ID is already in use');
									 }
							 }
							 else {
									 res(null, true);
							 }
					 });
			 }
			 else {
					 res(null, true);
			 }
	 },
	 // this will lookup the original campaign record and adjust counts correctly based on the status ('data' requires at least: campaign_id, campaign_status)
	 campaignCount: function (conn, data, res) {
		 
		 if (data.campaign !== undefined) {
				 if (data.campaign.id && !data.campaign_id) { data.campaign_id = data.campaign.id; }
				 if (data.campaign.status && !data.campaign_status) { data.campaign_status = data.campaign.status; }
		 }
		 if (data.campaign_id === undefined || data.campaign_status === undefined || data.campaign_id === '' || data.campaign_status === '') {
				 return res('Missing either campaign_id or campaign_status value for campaignCount to execute');
		 }
		 if (!conn) { conn = connector.ctPool; }
		
			 var qry = "SELECT campaign_status, campaign_ou_id FROM campaign WHERE campaign_id="+data.campaign_id;
			 conn.query(qry, function (err, orig) {
				 
					 if (err) { return res('Failed to lookup campaign record. '+err); }
					 if (orig.length < 1) { return res(null) }
				 
					 if (orig[0].campaign_status !== data.campaign_status) { // verify that the status has changed

							 // handle the count for the correct status change
							 if (data.campaign_status === 'active') {
								
									 if (orig[0].campaign_status === 'inactive') { // check if we need to decrement the inactive count
											 orgComponentCountModel.decrementSubTotal(conn, 2, orig[0].campaign_ou_id, 1, function (err) {
													 if (err) { return res('Failed to decrement the inactive campaign count. '+err); }
											 });
									 }
									 orgComponentCountModel.increment(conn, 2, orig[0].campaign_ou_id, 1, function (err) {
											 if (err) { return cb('Failed to increment the campaign count. '+err); }
									 });
							 } else if (data.campaign_status === 'inactive') {
								 
									 if (orig[0].campaign_status === 'active') { // check if we need to decrement the active count
											 orgComponentCountModel.decrement(conn, 2, orig[0].campaign_ou_id, 1, function (err) {
													 if (err) { return res('Failed to decrement the active campaign count. '+err); }
											 });
									 }
									 orgComponentCountModel.incrementSubTotal(conn, 2, orig[0].campaign_ou_id, 1, function (err) {
											 if (err) { return cb('Failed to increment the inactive campaign count. '+err); }
									 });
							 } else if (data.campaign_status === 'deleted') {
								 
									 if (orig[0].campaign_status === 'active') {
											 orgComponentCountModel.decrement(conn, 2, orig[0].campaign_ou_id, 1, function (err) {
													 if (err) { return res('Failed to decrement the active campaign count. '+err); }
											 });
									 } else if (orig[0].campaign_status === 'inactive') {
											 orgComponentCountModel.decrementSubTotal(conn, 2, orig[0].campaign_ou_id, 1, function (err) {
													 if (err) { return res('Failed to decrement the inactive campaign count. '+err); }
											 });
									 }
							 } else {

								 return res(null);
							 }
					 }
						
					 
					 res(null);
			 });
	 },
	 getCallflowByCampaignId: function (campaignId, res) {
		//// FOR AMP 3 DO NOT CHANGE ////
		var qry = "SELECT *"; 
		qry += " FROM campaign_provisioned_route AS cpr";
		qry += " LEFT JOIN provisioned_route AS pr on pr.provisioned_route_id = cpr.provisioned_route_id";
		qry += " WHERE cpr.campaign_id = "+campaignId;
		qry += " AND pr.provisioned_route_status != 'deleted';"
		connector.ctPool.query(qry, function (err, data) {
				//res(err, jsonGetCampaigns(data));
				res(err,data)
		});
	},
	searchCallflowByCampaignIdAction: function (req, callback) {
		//// FOR AMP 3 DO NOT CHANGE ////

		var campaignId = req.query.campaignid
		var offset = 0;
		var limit = 10;
		var prids = null;
		var name = null;
		var q = req.query;

		if (q.offset !== undefined && q.offset !== '') {
			offset = q.offset;
		}

		if (q.limit !== undefined && q.limit !== '') {
			limit = q.limit;
		}

		if (q.prids !== undefined && q.prids !== '') {
			prids = q.prids.trim();
		}

		if (q.name !== undefined && q.name !== '') {
			name = q.name.trim();
		}

		var data = {count: 0,data: []};

		var qry = "SELECT *"; 
		qry += " FROM campaign_provisioned_route AS cpr";
		qry += " LEFT JOIN provisioned_route AS pr on pr.provisioned_route_id = cpr.provisioned_route_id";
		qry += " LEFT JOIN provisioned_route_number AS prn on prn.provisioned_route_id = cpr.provisioned_route_id and prn.assign_active = true";
		qry += " LEFT JOIN phone_number AS pn ON pn.number_id = prn.phone_number_id";
		qry += " WHERE cpr.campaign_id = "+campaignId;
		qry += " AND pr.provisioned_route_status != 'deleted'"
		if (prids != null) {
			qry += " AND pr.provisioned_route_id in ("+prids+")";
		}
		if (name != null) {
			qry += " AND pr.provisioned_route_name like '%"+name+"%'";
		}

		async.series([
			function(cb){
				//// Get data count
				connector.ctPool.query(qry, function (err, r) {
					data.count = r.length;
					cb(err);
				});
			},
			function(cb){
				//// Get Data
				qry += " OFFSET "+offset;
				qry += " LIMIT "+limit;
				connector.ctPool.query(qry, function (err, r) {
					data.data = r;
					cb(err);
				});
			}
		],
		function(err){
			callback(err,data);
		})
	},
	updateCampaignEndDate: function(req,callback){
		var campaignData = {
			campaign_end_date: req.body.campaign.end_date,
			campaign_modified: 'CURRENT_TIMESTAMP',
			campaign_id: req.body.campaign.id
		};

		var updateData = {
			which :'update',
			table :'campaign',
			values:campaignData
		};
		connector.ctPool.update(updateData, function(err) {
			if (err) { return callback('Failed to set campaign end date. '+err); }

			connector.ctPool.update(updateData, function (err) {
				if (err) { return callback('Failed to update campaign end date. ' + err); }
				callback(null);
			});
		});
	}
};

function getHuntOptionsInfo(campaigns, callback){
			var campaignsHuntoptions = [];
			var campWithHuntOption = [];
			campaignsHuntoptions = _.pluck(campaigns,'hunt_option');
			campaignsHuntoptions = campaignsHuntoptions.filter(function(value, index, arr){
				return value !== 0 && value !== null && value !== '';
			});

			if(campaignsHuntoptions.length > 0){
				var query = "SELECT cht.hunt_type, cho.target_did, cho.overflow_order, cho.hunt_route_id FROM ce_hunt_options cho LEFT JOIN ce_hunt_types  cht ON (cho.hunt_route_id = cht.id) WHERE cht.id IN (" + campaignsHuntoptions + ")  ";
				connector.ctPool.query(query, function(err, result){
					if(err){ callback(err);}

					campaigns.forEach(function(campaign){
						var HuntOptions = _.filter(result, function(huntOption) {
							if(huntOption.hunt_route_id == campaign.hunt_option){
								return huntOption;
							};
							return;
						});	
						//console.log(HuntOptions);				
						//var HuntOptions = result.filter(huntOption => huntOption.hunt_route_id == campaign.hunt_option);
						if(HuntOptions.length > 0){
								if(HuntOptions[0].hunt_type.toLowerCase() === "rollover" && HuntOptions.length === 1)
									campaign.hunt_type = "Overflow";
								else
									campaign.hunt_type = HuntOptions[0].hunt_type;
							campaign.ring_to_numbers = _.pluck(HuntOptions, 'target_did');
							
							
						}else{
							campaign.hunt_type = '';
							campaign.ring_to_numbers = '';
								
						}
						campWithHuntOption.push(campaign);
					});
					callback(err, campWithHuntOption);
					// async.mapSeries(campaigns,function(campaign,cb1){
						
					// }, function(err){
					// 	callback(err, campaigns);
					// });
				});
			}else{
				callback(null, campaigns);	
			}
	}

function changeDate(data){
	 if(data.campaign_start_date)
			 data.campaign_start_date = data.campaign_start_date + " " + data.campaign_timezone;
	 if(data.campaign_end_date)
			 data.campaign_end_date = data.campaign_end_date + " " + data.campaign_timezone;
	 return data;
}

String.prototype.capitalize = function() {
	 return this.charAt(0).toUpperCase() + this.slice(1);
}

function jsonGetCampaignsList(data, timezone, callback) {
	 var timezones = {
			 "America/Halifax" : "AST",
			 "America/New_York" : "EST",
			 "America/Chicago" : "CST",
			 "America/Denver" : "MST",
			 "America/Phoenix" : "MST",
			 "America/Los_Angeles" : "PST"
	 }
	 async.map(data, function(campaign, cb){
		campaign.start_date = moment(campaign.start_date).format("MM-DD-YY hh:mm a") + " " + timezones[timezone];
		campaign.end_date = campaign.end_date === null ? "Never" : moment(campaign.end_date).format("MM-DD-YY hh:mm a") + " " + timezones[timezone];
		if(campaign.quantity == 0 ){
			campaign.quantity = '';
		}
		campaign.status = campaign.status.capitalize();
		cb(null);
	 }, function(err){
		callback(err, data);
	 });
}

function jsonGetCampaigns(data) {
	 var route_types = {
			"SimpleRoute" : "Simple",
			"GeoRoute": "GeoRoute",
			"IvrRoute2": "IVR",
			"PercentageBasedRoute": "Percentage",
			"OutboundRoute" :"Outbound",
			"ScheduleRoute": "Schedule",
			"VoicemailRoute" : "Voicemail" 
		};

	 var geo_types = {
	 	"claimedState" : "Claimed State",
	 	"Claimed" : "Claimed Zip-code",
	 	"Npa" : "Caller Area Code Proximity",
	 	"Zipcode": "Zip-code Proximity"
	 }
	 var response = {};
	 var campaigns = [];
	 var provisioned_routes = [];
	 var users = [];
	 var campaign_ids = [];
	 var route_ids = [];
	 var pool_ids = [];
	 var provisioned_route_ids = [];
	 var phone_number_ids = [];
	 var user_ids = [];
	 var channel_ids = [];
	 var sch_ringto = [];
	 
	 for (var i = 0; i < data.length; i++) {
			 if (campaign_ids.indexOf(data[i].id) < 0) {
					 campaigns.push({
							 id:                     data[i].id,
							 organizational_unit_id: data[i].org_unit_id,
							 organization_unit_name : data[i].group_name,
							 campaign_id:            data[i].id,
							 campaign_ext_id:        data[i].campaign_ext_id,
							 name:                   data[i].name,
							 start_date:             data[i].start_date,
							 end_date:               data[i].end_date,
							 owner_user_id:          data[i].owner_user_id,
							 status:                 data[i].status,
							 referral_number:        data[i].referral_number,
							 provisioned_routes:     [],
							 users:                  [],
							 call_flow:              parseInt(data[i].call_flow),
							 list_ids:               data[i].list_ids
					 });
					 campaign_ids.push(data[i].id);
			 }

			 for (var j = 0; j < campaigns.length; j++) {
					 if (campaigns[j].id == data[i].id && data[i].provisioned_route_id) {
							 //if (provisioned_route_ids.indexOf(data[i].provisioned_route_id) < 0 && data[i].provisioned_route_id) {
								campaigns[j].provisioned_routes.push({
												id:              data[i].provisioned_route_id,
												name:            data[i].provisioned_route_name,
												repeat_interval: data[i].repeat_interval,
												call_value:      data[i].call_value,
												status:          data[i].provisioned_route_status,
												referral_end_date:data[i].referral_end_date,
												spam_filter_enabled: data[i].spam_filter_enabled,
												sms_enabled: data[i].sms_enabled,
												ringto:  route_types[data[i].routable_type] == "IVR" ? "" : f.prettyPhoneNumber(data[i].ring_to_number),
												route_type: route_types[data[i].routable_type] !== "GeoRoute" ? route_types[data[i].routable_type] : (route_types[data[i].routable_type] + " - " + geo_types[data[i].strategy]),
												phone_numbers:   [],
												channels:        [],
												webhook_id: data[i].webhook_id
										});								 
							 //}
							 if(provisioned_route_ids.indexOf(data[i].provisioned_route_id) === -1 && data[i].sch_ringto){
								var dataSchCallflows= (_.filter(data, {provisioned_route_id: data[i].provisioned_route_id})).length;
								var campCallFlowDataSchCallflows=(_.filter(campaigns[j].provisioned_routes, {id: data[i].provisioned_route_id})).length;
								if(dataSchCallflows === campCallFlowDataSchCallflows){
									campaigns[j].provisioned_routes.push({
										id:              data[i].provisioned_route_id,
										name:            data[i].provisioned_route_name,
										repeat_interval: data[i].repeat_interval,
										call_value:      data[i].call_value,
										status:          data[i].provisioned_route_status,
										referral_end_date:data[i].referral_end_date,
										spam_filter_enabled: data[i].spam_filter_enabled,
										sms_enabled: data[i].sms_enabled,
										ringto:  f.prettyPhoneNumber(data[i].sch_ringto),
										route_type: route_types[data[i].routable_type],
										phone_numbers:   [],
										channels:        [],
										webhook_id: data[i].webhook_id
								});
								sch_ringto.push(data[i].sch_ringto);
								provisioned_route_ids.push(data[i].provisioned_route_id);
								}
							 }
					 }
					 for (var k = 0; k < campaigns[j].provisioned_routes.length; k++) {

							 if (campaigns[j].provisioned_routes[k].id == data[i].provisioned_route_id) {
									// if (route_ids.indexOf(data[i].provisioned_route_id) < 0) {
									 		
											 campaigns[j].provisioned_routes[k].phone_numbers.push({
													 id:            data[i].phone_number_id,
													 number:        data[i].phone_number,
													 pretty_number: f.prettyPhoneNumber(data[i].phone_number),
													 vendor_id:     data[i].vendor_id
											 });
											//}
											 campaigns[j].provisioned_routes[k].channels.push({
													 id:           data[i].channel_id,
													 category:     data[i].channel_category,
													 sub_category: data[i].channel_sub_category,
													 status:       data[i].channel_status
											 });
											
											 if(data[i].pool_id && data[i].pool_id !== null && pool_ids.indexOf(data[i].pool_id) == -1){
												campaigns[j].provisioned_routes[k].pool = [];
												campaigns[j].provisioned_routes[k].pool.push({
													pool_id: data[i].pool_id,
													quantity: data[i].number_count,
													status: data[i].status
												});
												pool_ids.push(data[i].pool_id);
												
										 }
											 route_ids.push(data[i].provisioned_route_id);
									 //}
							 }
					 }

					 if (!user_ids[j]) {
							 user_ids[j] = [];
					 }
					 if (data[i].ct_user_id && campaigns[j].id == data[i].id && user_ids[j].indexOf(data[i].ct_user_id) < 0) {
							 campaigns[j].users.push({
									 id:       data[i].ct_user_id,
									 username: data[i].username
							 });
							 user_ids[j].push(data[i].ct_user_id);
					 }
			 }
	 }

	 response.campaigns = campaigns;
	 // response.provisioned_routes = provisioned_routes;
	 // response.users = users;
	 return (response);
}

module.exports = campaigns;

function jsonGetCampcallflow(data){

	var route_types = {
	 	"SimpleRoute" : "Simple",
	 	"GeoRoute": "GeoRoute",
	 	"IvrRoute2": "IVR",
	 	"PercentageBasedRoute": "Percentage",
	 	"OutboundRoute" :"Outbound",
		"ScheduleRoute": "Schedule",
		"VoicemailRoute" : "Voicemail" 

	 }

	 var geo_types = {
	 	"claimedState" : "Claimed State",
	 	"Claimed" : "Claimed Zip-code",
	 	"Npa" : "Caller Area Code Proximity",
	 	"Zipcode": "Zip-code Proximity"
	 }
	//   var provisioned_route_ids = [];
	  var callflow_ids = []
	   var ses_ring_to = [];
	//  console.log(data);
	 var campCallFlowData = [];
	 for(var i = 0; i < data.length; i++){
			if(data[i].status !== 'deleted' && data[i].status != null){
				if(data[i].referring_website == '*.google.*' ){
					data[i].referring_website = 'google';
				}
				if(data[i].referring_website == '*.yahoo.com' ){
					data[i].referring_website = 'yahoo';
				}
				if(data[i].referring_website == '*.bing.com' ){
					data[i].referring_website = 'bing';
				}

			 var tempCallFlow = {
					 tracking : data[i].track_number === null ?  data[i].callflow_name : data[i].track_number,
					 tracking_number_name : data[i].callflow_name === null ? "" : data[i].callflow_name,
					 campaign_id : data[i].id === null ? "" : data[i].id,
					 call_flow_id : data[i].callflow_id === null ? "" : data[i].callflow_id,
					 ad_source : data[i].ad_source === null ?  "" : data[i].ad_source,
					 spam_guard : data[i].spam_guard_status  == null ? "" : data[i].spam_guard_status  == false ? "":data[i].spam_guard_status,
					 sms_enabled : data[i].sms_enabled === true ? true : false,
					 call_value : data[i].call_value  == null ? "" : data[i].call_value,
					 custom_parameters : data[i].custom_parameters  == null ? "" :data[i].custom_parameters,
					 custom_source_1 : data[i].custom_source_1 == null ? "" :data[i].custom_source_1,
					 custom_source_2 : data[i].custom_source_2 == null ? "" :data[i].custom_source_2,
					 custom_source_3 : data[i].custom_source_3 == null ? "" :data[i].custom_source_3,
					 custom_source_4 : data[i].custom_source_4 == null ? "" :data[i].custom_source_4,
					 custom_source_5 : data[i].custom_source_5 == null ? "" :data[i].custom_source_5,
					 dni : data[i].dni == null ? "" :data[i].dni,
					 dni_type : data[i].dni_type == null ? "" :data[i].dni_type,
					 host_domain : data[i].host_domain  == null ? "" :data[i].host_domain,
					 html_class : data[i].html_class  == null ? "" :data[i].html_class,
					 record_call : data[i].record_call == null ? "": data[i].record_call,
					 play_disclaimer : data[i].record_call  === "No" ? "" : data[i].record_call == null ? "": data[i].play_disclaimer,
					 vm_enabled: data[i].vm_enabled === true ? 'Yes' : 'No' ,
					 referring_website : data[i].referring_website  == null ? "" :data[i].referrer_type == "null" ? data[i].referring_website:data[i].referring_website+"("+data[i].referrer_type+")",
					 repeat_interval : data[i].repeat_interval  == null ? "" : data[i].repeat_interval,
					 voice_prompt : data[i].voice_prompt  == null ? "" :data[i].voice_prompt,
					 ring_to_number : (data[i].type === "voicemail"|| data[i].type === "ivr"|| data[i].type === "IvrRoute2") ? "" : data[i].ring_to_number  == null ? "" :data[i].ring_to_number,
					 tracking_number_type : data[i].type === "ringto" ? "Percentage" : data[i].type == null ? "" : data[i].type !== 'GeoRoute' ? route_types[data[i].type] : (route_types[data[i].type] + " - " + geo_types[data[i].strategy]),
					 instant_insights : data[i].instant_insights === 't' || data[i].instant_insights === true ? 'Yes' : 'No',
					 instant_insights_config : data[i].instant_insights_config  ? data[i].instant_insights_config : '',
					 hunt_type : data[i].hunt_type ,
					 whisper_message : data[i].whisper_message  == null ? "" :data[i].whisper_message,  
					 pre_call_webhook : data[i].pre_call_webhook == null ? "" : data[i].pre_call_webhook,
					 tracking_number_status: data[i].status.capitalize()  == null ? "" :data[i].status.capitalize(),
			 }
			 campCallFlowData.push(tempCallFlow);
			 if(callflow_ids.indexOf(data[i].callflow_id) === -1 && typeof data[i].sch_ringto !== undefined && data[i].sch_ringto!=='' && data[i].sch_ringto!==null){
				var dataSchCallflows= (_.filter(data, {callflow_id: data[i].callflow_id})).length;
				var campCallFlowDataSchCallflows=(_.filter(campCallFlowData, {call_flow_id: data[i].callflow_id})).length;
				if(dataSchCallflows === campCallFlowDataSchCallflows){
					var tempSecondHash = {};
					Object.keys(tempCallFlow).forEach(function(key) {
							 tempSecondHash[ key ] = tempCallFlow[ key ];
					});
					tempSecondHash.ring_to_number = data[i].sch_ringto;
					tempSecondHash.hunt_type = "";
					tempSecondHash.vm_enabled = data[i].sch_enabled === true ? 'Yes' : 'No';
					ses_ring_to.push(data[i].sch_ringto);
					campCallFlowData.push(tempSecondHash);
					callflow_ids.push(data[i].callflow_id);
				} 
			}
		 }
	 }
	 return campCallFlowData;
}

function jsonGetCampCallflowReport(data,timezone,subscriptionFlag){

	 var campCallFlowData = [];
	 var route_ids = [];
	 var provisioned_route_ids = [];
	 var ses_ring_to = [];
	 var timezones = {
		"America/Halifax" : "AST",
		"America/New_York" : "EST",
		"America/Chicago" : "CST",
		"America/Denver" : "MST",
		"America/Phoenix" : "MST",
		"America/Los_Angeles" : "PST"
	}

	var route_types = {
	 	"SimpleRoute" : "Simple",
	 	"GeoRoute": "GeoRoute",
	 	"IvrRoute2": "IVR",
	 	"PercentageBasedRoute": "Percentage",
	 	"OutboundRoute" :"Outbound",
		"ScheduleRoute": "Schedule",
		"VoicemailRoute" : "Voicemail" 

	 }

	 var geo_types = {
	 	"claimedState" : "Claimed State",
	 	"Claimed" : "Claimed Zip-code",
	 	"Npa" : "Caller Area Code Proximity",
	 	"Zipcode": "Zip-code Proximity"
	 }
	 for(var i = 0; i < data.length; i++){
			 if(data[i].status !== 'deleted'){
			 	if(data[i].referring_website == '*.google.*' ){
					data[i].referring_website = 'google';
				}
				if(data[i].referring_website == '*.yahoo.com' ){
					data[i].referring_website = 'yahoo';
				}
				if(data[i].referring_website == '*.bing.com' ){
					data[i].referring_website = 'bing';
				}
				data[i]['allRingto'] = [];
				data[i]['allRingto'].push(data[i].ring_to_number);
				_.each(data[i].ring_to_numbers, function(num){
					data[i]['allRingto'].push(num);
				})

				var huntingOptions = {
					"Rollover" : "Rollover",
					"Simultaneous" : "Simultaneous Ring",
					"Overflow" : "Overflow",
					"rollover" : "Rollover",
					"simultaneous" : "Simultaneous Ring",
					"overflow" : "Overflow"
				}


				// if(ses_ring_to.indexOf(data[i].ses_ring_to) === -1 ){
				// 	ses_ring_to.push(data[i].ses_ring_to);

				// }
			 	var tempCallFlow = {
					 account_id  : data[i].account_id,
					 account_name : data[i].account_name,
					 account_exid : data[i].acc_exid,
					 parent_group_id : data[i].parent_group_id,
					 parent_group_name : data[i].parent_group_name,
					 parent_group_external_id : data[i].parent_group_external_id,
					 group_name : data[i].group_name,
					 group_id   : data[i].group_id,
					 group_external_id : data[i].group_external_id,
					 group_status : data[i].group_status,
					 campaign_id : data[i].id,
					 campaign_name : data[i].name,
					 campaign_external_id : data[i].campaign_external_id,
					 start_date : moment(new Date(data[i].start_date)).format("MM-DD-YYYY hh:mm:ss a") + " " + timezones[timezone],
					 end_date : data[i].end_date === null ? "Never" : moment(new Date(data[i].end_date)).format("MM-DD-YYYY hh:mm:ss a") + " " + timezones[timezone],
					 campaign_status : data[i].campaign_status.capitalize()  == null ? "" :data[i].campaign_status.capitalize(),
					 tracking_name : data[i].tracking_name,
					 tracking_id : data[i].tracking_id,
					 tracking_number_type : data[i].tracking_number_type === "ringto" ? "Percentage" : data[i].tracking_number_type == null ? "" : data[i].tracking_number_type !== 'GeoRoute' ? route_types[data[i].tracking_number_type] : (route_types[data[i].tracking_number_type] + " - " + geo_types[data[i].strategy]),
					 tracking_number_status : data[i].tracking_number_status  == null ? "" :data[i].tracking_number_status.capitalize(),
					 tracking_number : data[i].tracking_number === null ? data[i].tracking_name : data[i].tracking_number,
					 Ad_Source : data[i].ad_source,
					 callFlow_name : data[i].callflow_name,
					// ring_to_number : data[i].tracking_number_type == 'voicemail' ? '' : data[i].ring_to_number,
					 dni : data[i].tracking_number_type == 'voicemail' ? '' : data[i].dni,
					 spam_guard : data[i].spam_guard == null ? "":data[i].spam_guard,
					 sms_enabled : data[i].sms_enabled == null ? "": data[i].sms_enabled,
					 dni_type : data[i].tracking_number_type == 'voicemail' ? '' : data[i].dni_type == null ? "" :data[i].dni_type,
					 ad_source : data[i].tracking_number_type == 'voicemail' ? '' : data[i].ad_source,
					 custom_source_name1 : data[i].tracking_number_type == 'voicemail' ? '' : data[i].cs1,
					 custom_source_name2 : data[i].tracking_number_type == 'voicemail' ? '' : data[i].cs2,
					 custom_source_name3 : data[i].tracking_number_type == 'voicemail' ? '' : data[i].cs3,
					 custom_source_name4 : data[i].tracking_number_type == 'voicemail' ? '' : data[i].cs4,
					 custom_source_name5 : data[i].tracking_number_type == 'voicemail' ? '' : data[i].cs5,
					 pre_call_webhook : data[i].tracking_number_type == 'voicemail' ? '' : data[i].pre_call_webhook,
					 custom_parameters : data[i].tracking_number_type == 'voicemail' ? '' : data[i].custom_parameters,
					 html_class : data[i].tracking_number_type == 'voicemail' ? '' : data[i].html_class,
					 whisper_message : data[i].tracking_number_type == 'voicemail' ? '' : data[i].whisper_message  == null ? "" : data[i].whisper_message,
					 voicemail : data[i].tracking_number_type == 'voicemail' ? '' : data[i].vm_enabled === true ? 'Yes' : data[i].vm_enabled === false ? 'No' : '',
					 voice_prompt : data[i].tracking_number_type == 'voicemail' ? '' : data[i].voice_prompt  == null ? "" :data[i].voice_prompt,
					 record_call : data[i].tracking_number_type == 'voicemail' ? '' : data[i].record_call == null ? "": data[i].record_call,
					 play_disclaimer : data[i].tracking_number_type == 'voicemail' ? '' : data[i].record_call  === "No" ? "":data[i].record_call  === '' ? "": data[i].play_disclaimer,
					 repeat_interval : data[i].tracking_number_type == 'voicemail' ? '' : data[i].repeat_interval,
					 call_value : data[i].tracking_number_type == 'voicemail' ? '' : data[i].call_value,
					 referring_website : data[i].tracking_number_type == 'voicemail' ? '' : data[i].referring_website  == null ? "" :data[i].referrer_type == "null" ? data[i].referring_website:data[i].referring_website+"("+data[i].referrer_type+")",
					 referral_number : data[i].tracking_number_type == 'voicemail' ? '' : data[i].referral_number == null ? "" : (data[i].referral_number === 'Yes'? "Yes" : "No"),
					 host_domain : data[i].tracking_number_type == 'voicemail' ? '' : data[i].host_domain,
					 hunt_type : data[i].tracking_number_type == 'voicemail' || data[i].hunt_type === undefined ? '' : data[i].hunt_type=='Rollover'?(data[i].ring_to_numbers.length<=1?'Overflow': huntingOptions[data[i].hunt_type]):huntingOptions[data[i].hunt_type],
					 ring_to_number : (data[i].tracking_number_type == 'voicemail' || data[i].tracking_number_type == 'ivr' || data[i].tracking_number_type == 'IvrRoute2') ? '' : data[i].allRingto.join(","),//data[i].ring_to_numbers,
					 post_call_ivr : data[i].tracking_number_type == 'voicemail' ? '' : data[i].post_call_ivr,
					 post_call_ivr_status : data[i].tracking_number_type == 'voicemail' ? '' : data[i].post_call_ivr_status				 
							
			}
			
			campCallFlowData.push(tempCallFlow);
			if(provisioned_route_ids.indexOf(data[i].tracking_id) === -1 && data[i].ses_ring_to){
		 		var tempSecondHash = {};
				Object.keys(tempCallFlow).forEach(function(key) {
				     tempSecondHash[ key ] = tempCallFlow[ key ];
				}); 
				 
				tempSecondHash.ring_to_number = data[i].ses_ring_to;
				tempSecondHash.hunt_type = "";
				tempSecondHash.voicemail = data[i].sch_enabled === true ? 'Yes' : 'No';
				ses_ring_to.push(data[i].ses_ring_to);
				campCallFlowData.push(tempSecondHash);
			}
			provisioned_route_ids.push(data[i].tracking_id)
		 }
	 }
	 return campCallFlowData;
}

function selectCampaignSql(selectData) {
	 var and = [];
	 if (selectData.ouid) {
			 and.push(" AND campaign.campaign_ou_id = " + selectData.ouid);
	 }
	 if (selectData.timezone === undefined) {
			 selectData.timezone = 'EST';
	 }

	 var query = "";
	 query += "SELECT c.campaign_id as id, pn.number_id as phone_number_id, c.campaign_ou_id as org_unit_id, ou.org_unit_name AS group_name, c.campaign_ext_id as campaign_id, c.campaign_name as name,  c.campaign_start_date AT TIME ZONE '" + selectData.timezone;
	 query += "' AS start_date, c.campaign_end_date AT TIME ZONE '" + selectData.timezone + "' AS end_date, c.campaign_status as status, pr.provisioned_route_id as route_id";
	 query += " FROM " + table;
	 query += "  LEFT JOIN campaign_provisioned_route cpr ON (c.campaign_id=cpr.campaign_id) LEFT JOIN campaign_ct_user ccu ON (c.campaign_id=ccu.campaign_id AND ccu.ct_user_id = " + selectData.userid + ") ";
	 query += "  LEFT JOIN provisioned_route pr ON (cpr.provisioned_route_id=pr.provisioned_route_id AND pr.provisioned_route_status != 'deleted')";
	 query += "  LEFT JOIN provisioned_route_number prn ON (pr.provisioned_route_id=prn.provisioned_route_id) ";
	 query += "  LEFT JOIN phone_number pn ON (prn.phone_number_id=pn.number_id) ";
	 query += "  LEFT JOIN org_unit ou ON ou.org_unit_id = c.campaign_ou_id";
	 query += "  LEFT JOIN user_permissions up ON (up.ct_user_id=ccu.ct_user_id)";

	 if (selectData.userAccess == 7) { // if the user is an admin they see every campaign within the current ou
				query += " WHERE c.campaign_ou_id = " + selectData.ouid + " AND c.campaign_status !='deleted' "
	 }
	 else if (selectData.userAccess === undefined || selectData.userAccess < 7) { // if the user is not an admin they see campaigns that they are users or owners of for the current ou
			 query += " WHERE ((c.campaign_owner_user_id = " + selectData.userid + " OR ccu.ct_user_id = " + selectData.userid + "))  AND c.campaign_status !='deleted' AND c.campaign_ou_id = " + selectData.ouid ;
	 }
	 //else if(selectData.userAccess == 7){
	 //  query += " WHERE ((c.campaign_ou_id = " + selectData.ouid + ") OR (c.campaign_owner_user_id = " + selectData.userid + " OR ccu.ct_user_id = " + selectData.userid + ")) AND c.campaign_status !='deleted' " ;
	 //}
	
	 if(selectData.limit && selectData.offset !== undefined){
			 query += " ORDER BY c.campaign_name ASC, c.campaign_id ASC LIMIT " + selectData.limit + " OFFSET " + selectData.offset;
	 }else{
			 query += " GROUP BY c.campaign_id, ou.org_unit_id, pn.number_id ORDER BY c.campaign_name ASC, c.campaign_id ASC";
	 }
	 return query;
}

function getStateAndRC(pool_id, callback){
	var qry = " SELECT phone_number FROM phone_pool_number WHERE pool_id ="+ pool_id +" LIMIT 1";
	connector.ctPool.query(qry, function (err, poolNumber) {
		if(err){callback(err);}else{
			var qry = "SELECT state, rc FROM npanxx_city WHERE npa='" + poolNumber[0].phone_number.substr(0, 3) + "' AND nxx='" + poolNumber[0].phone_number.substr(3, 3) + "' LIMIT 1";
			connector.ctPool.query(qry, function (err, rcData) {
				if(err){callback(err);}else{
					if(rcData.length > 0){
						rcData[0].npa = poolNumber[0].phone_number.substr(0, 3);
						rcData[0].nxx = poolNumber[0].phone_number.substr(3, 3);
						callback(null, rcData);
					}else{
						callback(null, rcData);
					}
					
				}
			});
		}
	});
}

