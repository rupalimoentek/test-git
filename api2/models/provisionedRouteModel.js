var appModel = require('./appModel'),
	ctTransactionModel = require('./ctTransactionModel'),
	ceTransactionModel = require('./ceTransactionModel'),
	f = require('../functions/functions.js'),
	async = require('async'),
	table = 'provisioned_route',
	dniSettingModel = require('./dniSettingModel'),
	orgComponentCountModel = require('./orgComponentCountModel'),
	orgUnitModel = require('./orgUnitModel'),
	numberPoolModel = require('./newNumberPoolModel'),
	shoutPointModel = require('./shoutPointModel'),
	zuoraController = require('../controllers/zuoraController'),
	moment = require('moment');
	scheduleModel = require('./scheduleModel'),
	customSourceModel = require('./customSourceModel'),
	overFlowNumberModel = require('./overFlowNumberModel');
	_           = require('underscore'),
	callFlowModel = require("../models/callFlowModel");
var provisionedRoutes = {
	create: function(data, res){
		var date_timestamp = f.mysqlTimestamp();
		data.provisioned_route_modified = date_timestamp;
		data.provisioned_route_created = date_timestamp;
		var insertData = {
			table : table,
			values: data
		};
		appModel.ctPool.insert(insertData, function(err, data){
			res(err, data);
		});
	},
	update: function(data, res){
		var date_timestamp = f.mysqlTimestamp();
		data.provisioned_route_modified = date_timestamp;
		var updateData = {
			table : table,
			values: data
		};
		appModel.ctPool.update(updateData, function(data){
			res(data);
		});
	},
	setStatusAll: function(ctTrans, data, req, callback){
		if (!ctTrans) {
			var ctTrans = new ctTransactionModel.begin(function(err){
				if (err){
					callback(err);
				} else {
					// get all the provisioned route ids by campaign id
					var campaignProvisionedRoutes = require('./campaignProvisionedRouteModel');
					campaignProvisionedRoutes.getProvisionedRoutes(data.provisioned_route.campaign_id, function(err, prIdData){
						var provisioned_route_ids = [];
						provisioned_route_ids = _.pluck(prIdData, 'provisioned_route_id');
						data.provisioned_route.ids = provisioned_route_ids;
						statusCallFlows(ctTrans, data, req, function(err, d){
							if (err) {
								ctTrans.rollback(function(){
									callback(err);
								});
							} else {
								ctTrans.commit(function(){
									if(!req.is_migrated){
										async.each(data.provisioned_route.ids, function(pr_id, cb){
											var callFlowModel = require("../models/callFlowModel");
											callFlowModel.sendForMigration(pr_id, function(err){ 
												cb(null, d);
											});
										},
										function(err){
											callback(err, d);	
										})
									}else{
										callback(null, d);
									}
								});
							}
						});
					});
				}
			});
		} else {
			statusCallFlows(ctTrans, data, req, function(err, d){
				callback(err, d);
			});
		}
	},
	setStatusAllOld: function(campaignData, res){
		var campaignProvisionedRoutes = require('./campaignProvisionedRouteModel');
		campaignProvisionedRoutes.getProvisionedRoutes(campaignData.id, function(err, data){
			var provisioned_route_ids = [];
			for (var i = data.length - 1; i >= 0; i--) {
				provisioned_route_ids.push(data[i].provisioned_route_id);
			}
			if (provisioned_route_ids.length > 0) {
				var qry = "UPDATE " + table + " SET provisioned_route_status='" + campaignData.status + "' WHERE provisioned_route_id IN ( " + provisioned_route_ids.join(',') + ")";
				appModel.ctPool.query(qry, function(err, data){
					res();
				});
			} else {
				res();
			}
		});

	},
	createMany: function(data, res){
 		createCallFlowsOld(this, data, function(err){
 			res(null);
 		});
	},
	createCallFlows: function(data, ou_id, user_id,req, res,log_auth){
		spCreateCallFlows(data, ou_id, user_id, req.is_migrated, req.user.billing_id,function(err, returnData){
			res(err, returnData);
		},log_auth);
	},
	checkUniqueCallFlow: function(prName,camp_id, provisioned_route_id, res) {
		if ((prName).indexOf("'") > -1)
			prName = (prName).replace(/'/g, "''");
		var qry = "SELECT * FROM "+ table +" AS pr";
		qry += " JOIN campaign_provisioned_route AS cmpr ON cmpr.campaign_id ="+ camp_id ;
		qry += " WHERE pr.provisioned_route_id = cmpr.provisioned_route_id AND pr.provisioned_route_status != 'deleted' AND pr.provisioned_route_name ='" + prName + "'";

		appModel.ctPool.query(qry, function(err, result) {
			if (err) { res(err); }
			if (result.length > 0) {
				if (provisioned_route_id && provisioned_route_id === result[0].provisioned_route_id && result.length == 1) {
					res(null, true);
				} else {
					res('Tracking number name is already in use');
				}
			} else {
				res(null, true);
			}
		});
	},
	putDelete: function(ctTrans, data, req, callback){
		if (!ctTrans) {
			var ctTrans = new ctTransactionModel.begin(function(err){
				if (err){
					callback(err);
				} else {
					spDeleteCallFlows(ctTrans, req.is_migrated, data, req.user.user_id , function(err, d){
						if (err) {
							ctTrans.rollback(function(){
								callback(err);
							});
						} else {
							ctTrans.commit(function(){
								if(!req.is_migrated){
									async.each(data.provisioned_route.ids, function(pr_id,cb){
										var callFlowModel = require("../models/callFlowModel");
										callFlowModel.sendForMigration(pr_id, function(err){ 
											cb(null, d);
										});
									},
									function(err){
										callback(err, d);	
									})
								}else{
									callback(null, d);
								}	
							});
						}
					});
				}
			});
		} else {
			spDeleteCallFlows(ctTrans, req.is_migrated, data, req.user.user_id, function(err, d){
				callback(err, d);
			});
		}
	},
	updateCallFlows: function(data, ou_id, user_id,req, res,log_auth){
		spUpdateCallFlows(data, ou_id,req.is_migrated, user_id, function(err){
			res(err);
		},log_auth);
	},
	getProvisionedRouteIdsByIds: function(data, res){
		var sql = "SELECT provisioned_route_id,provisioned_route_ou_id FROM provisioned_route where provisioned_route_id IN("+data.provisioned_route_ids.join(',')+")";
		appModel.ctPool.query(sql, function(err, data){
			res(err, data);
		});
	},
	getProvisionedRouteById: function(id, res){
		var sql = "SELECT * FROM provisioned_route where provisioned_route_id = "+id;
		appModel.ctPool.query(sql, function(err, data){
			res(err, data);
		});
	},
	phoneDetailByProvisionedRouteIds: function(req, res){
		//// FOR AMP3 USE DO NOT CHANGE
		var qry = "SELECT prn.provisioned_route_id,pn.number, pd.*";
		qry += " FROM provisioned_route_number as prn";
		qry += " JOIN phone_number AS pn ON pn.number_id = prn.phone_number_id";
		qry += " JOIN phone_detail AS pd ON pd.number_id = prn.phone_number_id";
		qry += " WHERE prn.provisioned_route_id in ("+req.body.route_ids.join(',')+")";
		appModel.ctPool.query(qry, function(err, data){
			res(err, data);
		});
	},
	poolDetailByProvisionedRouteIds: function(req, res){
		//// FOR AMP3 USE DO NOT CHANGE
		var qry = "SELECT pp.provisioned_route_id,pp.pool_name, ppn.*";
		qry += " FROM phone_pool as pp";
		qry += " JOIN phone_pool_number AS ppn ON ppn.pool_id = pp.pool_id";
		qry += " WHERE pp.provisioned_route_id in ("+req.body.route_ids.join(',')+")";
		appModel.ctPool.query(qry, function(err, data){
			res(err, data);
		});
	},
	poolDataByRouteId: function(req, res){
		//// FOR AMP3 USE DO NOT CHANGE
		console.log("req query: "+JSON.stringify(req.query))
		var qry = "SELECT *";
		qry += " FROM provisioned_route AS pr";
		qry += " LEFT JOIN phone_pool AS pp ON pp.provisioned_route_id = pr.provisioned_route_id";
		qry += " LEFT JOIN phone_pool_number AS ppn ON ppn.pool_id = pp.pool_id";
		qry += " WHERE pr.provisioned_route_id = "+req.query.id;
		qry += " AND pr.provisioned_route_status != 'deleted'"
		qry += " ORDER BY ppn.phone_number ASC";

		appModel.ctPool.query(qry, function(err, results){
			var data = [];
			var tmp = {};

			async.eachSeries(results, function(r,cb){
				if (tmp.provisionedRouteId === undefined) {
					tmp = {
						provisionedRouteId: r.provisioned_route_id,
						provisionedRouteName: r.provisioned_route_name,
						poolId: r.pool_id,
						poolName: r.pool_name,
						vendorId: r.vendor_id,
						poolNumbers: [],
						poolData: []
					};
				}
				
				if (r.phone_number !== null && r.phone_number !== '') {
					tmp.poolNumbers.push(r.phone_number);
					var tempPool = {
						Number : r.phone_number,
						last_used   : r.last_used,
                        keep_alive_mins   : r.keep_alive_mins,
					};
                    tmp.poolData.push(tempPool);
				}
				cb(null);
			},
			function(err){
				data.push(tmp);
				res(err, data);
			});
		});
	},
	byNumberData:function(req,res){
		//// FOR AMP3 USE DO NOT CHANGE 
		var returnData = {};
		var phone = [];
		console.log("req",req.query.id);
        var qry = "SELECT * FROM phone_number WHERE number ="+req.query.id;
		appModel.ctPool.query(qry,function(err,numbData){
		if(numbData.length > 0){

		var provisionQry = "SELECT pr.number,pr.number_status,pd.number_id,pd.vendor_id FROM phone_number AS pr "
			provisionQry +="JOIN phone_detail AS pd on (pd.number_id = pr.number_id ) AND pr.number ="+req.query.id;
			appModel.ctPool.query(provisionQry,function(err,response){
			if(err){cb(err);}
				if(response[0].number_status !== 'provisioned'){ //only for provosioned numbers
					res(err,response);
				}else{
					//cb(null);
					async.waterfall([
						function(cb){
								var qry = "SELECT pn.number_status,pn.number,ccf.app_id,ccf.ouid,ou.org_unit_name,";
								qry += "ob.account_code,ou.org_unit_name,pd.vendor_id,pr.route_type,pr.provisioned_route_id,";
								qry += "pr.provisioned_route_name,c.campaign_id,c.campaign_name,ccf.message_enabled,";
								qry += "ccf.whisper_enabled FROM provisioned_route AS pr ";
								qry +="JOIN provisioned_route_number AS prn ON prn.provisioned_route_id = pr.provisioned_route_id ";
								qry +="JOIN phone_number AS pn ON pn.number_id = prn.phone_number_id ";
								qry +="JOIN phone_detail AS pd ON pd.number_id = prn.phone_number_id ";
								qry +="JOIN ce_call_flows AS ccf ON ccf.provisioned_route_id = pr.provisioned_route_id ";
								qry +="JOIN campaign_provisioned_route AS cpr ON cpr.provisioned_route_id = pr.provisioned_route_id ";
								qry +="JOIN campaign AS c ON c.campaign_id = cpr.campaign_id ";
								qry +="JOIN org_unit AS ou ON ou.org_unit_id = ccf.ouid ";
								qry +="JOIN org_billing AS ob ON ob.org_unit_id = ou.billing_id ";
								qry +="WHERE pn.number = "+response[0].number + " AND pr.provisioned_route_status='active'";
								appModel.ctPool.query(qry,function(err,results){
									if(err){cb(err);}
									cb(null,results);
								});				
						},
						function(results,cb){
							var numberData = null;
							 numberData = results;
							if(numberData.length>0){
								var query  = "SELECT org_unit_name AS billingOUName FROM org_unit where org_unit_id IN"; 
								query += "(SELECT billing_id FROM org_unit WHERE org_unit_id = "+ numberData[0].ouid +")";
								appModel.ctPool.query(query,function(err,data){
									if(err){cb(err);}
									returnData = {
										number_status:numberData[0].number_status,
										number:numberData[0].number,
										app_id:numberData[0].app_id,
										ouid:numberData[0].ouid,
										org_unit_name:numberData[0].org_unit_name,
										account_code:numberData[0].account_code,
										vendor_id:numberData[0].vendor_id,
										route_type:numberData[0].route_type,
										provisioned_route_id:numberData[0].provisioned_route_id,
										provisioned_route_name:numberData[0].provisioned_route_name,
										campaign_id:numberData[0].campaign_id,
										campaign_name:numberData[0].campaign_name,
										message_enabled:numberData[0].message_enabled,
										whisper_enabled:numberData[0].whisper_enabled,
										billingOUName:data[0].billingouname
									}
									phone.push(returnData);
									cb(null);
									
								});
							}else{
								cb("Number is not provisioned yet");
							}
						}
					],function(err){
						res(err, phone );
					});

				}
			});
		}else{
			var returnPool = {};
			var poolPhone = [];
			async.waterfall([
				function(cb){  //for numberpool data
					var qry = "SELECT ppn.phone_number ,ppn.vendor_id,ppn.pool_id ,pp.status,ccf.app_id,ccf.ouid,ou.org_unit_name,"
					qry += "ob.account_code,ou.org_unit_name,pr.route_type,pr.provisioned_route_id,"
					qry += "pr.provisioned_route_name,c.campaign_id,c.campaign_name,ccf.message_enabled,"
					qry += "ccf.whisper_enabled FROM provisioned_route AS pr "
					qry += "JOIN provisioned_route_number AS prn ON prn.provisioned_route_id = pr.provisioned_route_id "
					qry += "JOIN  phone_pool AS pp on pp.pool_id = prn.pool_id "
					qry += "JOIN phone_pool_number AS ppn on  ppn.pool_id = pp.pool_id "
					qry += "JOIN ce_call_flows AS ccf ON ccf.provisioned_route_id = pr.provisioned_route_id "
					qry += "JOIN campaign_provisioned_route AS cpr ON cpr.provisioned_route_id = pr.provisioned_route_id " 
					qry += "JOIN campaign AS c ON c.campaign_id = cpr.campaign_id " 
					qry += "JOIN org_unit AS ou ON ou.org_unit_id = ccf.ouid "
					qry += "JOIN org_billing AS ob ON ob.org_unit_id = ou.billing_id " 
					qry += "WHERE pp.status = 'active'and ppn.phone_number ="+req.query.id;
					appModel.ctPool.query(qry,function(err,data1){
						if(err){cb(err);}
						cb(null,data1);
					});
				},
				function(data1,cb){
					var pool = null;
					pool = data1;
					if(pool.length>0){
						var query  = "SELECT org_unit_name AS billingOUName FROM org_unit WHERE org_unit_id in"; 
						query += "(SELECT billing_id FROM org_unit WHERE org_unit_id = "+ pool[0].ouid +")";
						appModel.ctPool.query(query,function(err,data){
							returnPool = {
								number_status:pool[0].status,
								number:pool[0].phone_number,
								app_id:pool[0].app_id,
								ouid:pool[0].ouid,
								org_unit_name:pool[0].org_unit_name,
								account_code:pool[0].account_code,
								vendor_id:pool[0].vendor_id,
								route_type:pool[0].route_type,
								provisioned_route_id:pool[0].provisioned_route_id,
								provisioned_route_name:pool[0].provisioned_route_name,
								campaign_id:pool[0].campaign_id,
								campaign_name:pool[0].campaign_name,
								message_enabled:pool[0].message_enabled,
								whisper_enabled:pool[0].whisper_enabled,
								pool_id:pool[0].pool_id,
								billingOUName:data[0].billingouname
							}
							poolPhone.push(returnPool);
							cb(null);
						});

					}else{
						cb("Number is not provisioned yet");
					}

				}
			],function(err){
				res(err, poolPhone );
			});
		}
	  });

	
	},
	checkOutboundCallerId :function(data, res){
		var sql = "SELECT  COUNT(id) FROM ce_outbound_routes  where callerid = ('"+data+"')";
		appModel.ctPool.query(sql, function(err, data){
			res(err, data);
		});
	},
	checkOutboundCallerIdByCampaign :function(data, res){
		var sql = "select count(id) from ce_outbound_routes where callerid in (select dnis from ce_call_flows where provisioned_route_id in (select provisioned_route_id from campaign_provisioned_route   where campaign_id='"+data+"'))";
		appModel.ctPool.query(sql, function(err, data){
			res(err, data);
		});
	},
	moveProvisionedRouteToCampaign: function(req,callback){
		var ctTrans = new ctTransactionModel.begin(function(err){
			if (err){
				callback(err);
				return;
			}
			async.eachSeries(req.body.callFlows,function(callFlow,cb){
				async.waterfall([
					function(cb1){
						//Get new and old ouids
						var oldOuid = null;
						var newOuid = null;
						async.parallel([
							function(cb2){
								//Get old ouid from old campaign
								var qry = "SELECT campaign_ou_id FROM campaign WHERE campaign_id = "+callFlow.campaignId;
								ctTrans.query(qry,function(err,data){
									oldOuid = data[0].campaign_ou_id;
									cb2(err);
								});
							},
							function(cb2){
								//Get new ouid from new campaign
								var qry = "SELECT campaign_ou_id FROM campaign WHERE campaign_id = "+callFlow.newCampaignId;
								ctTrans.query(qry,function(err,data){
									newOuid = data[0].campaign_ou_id;
									cb2(err);
								});
							}
						],
						function(err){
							cb1(err,oldOuid,newOuid)
						});//async.parallel cb2
					},
					function(oldOuid,newOuid,cb1){
						//do updates
						console.log("old: "+oldOuid+" new: "+newOuid);
						async.parallel([
							function(cb2){
								//Update provisioned_route
								var qry = "UPDATE provisioned_route SET provisioned_route_ou_id = "+newOuid+" WHERE provisioned_route_id = "+callFlow.provisionedRouteId;
								ctTrans.query(qry,function(err,data){
									cb2(err);
								});
							},
							function(cb2){
								//Update campaign_provisioned_route
								//update campaign_provisioned_route set campaign_id = 34405 where provisioned_route_id = 24283
								var qry = "UPDATE campaign_provisioned_route SET campaign_id = "+callFlow.newCampaignId+" WHERE provisioned_route_id = "+callFlow.provisionedRouteId;
								ctTrans.query(qry,function(err,data){
									cb2(err);
								});
							},
							function(cb2){
								//Update phone detail
								//update phone_detail set ouid = 8670 where number_id = 1005513
								var qry = "SELECT phone_number_id FROM provisioned_route_number WHERE provisioned_route_id = "+callFlow.provisionedRouteId;
								ctTrans.query(qry,function(err,data){
									if (err) {return cb2(err)}
									if (data.length < 1) {return cb2('provisioned route number not found')}
									qry = "UPDATE phone_detail SET org_unit_id = "+newOuid+" WHERE app_id = 'CT' AND number_id = "+data[0].phone_number_id;
									ctTrans.query(qry,function(err,data){
										cb2(err);
									});
								});
							},
							function(cb2){
								//Update call flows
								//update call_flows set ouid = 8670 where provisioned_route_id = 24283 and app_id = 'CT'
								var qry = "UPDATE call_flows SET ouid = "+newOuid+" WHERE app_id = 'CT' AND provisioned_route_id = "+callFlow.provisionedRouteId;
								ctTrans.query(qry,function(err,data){
									cb2(err);
								});
							},
							function(cb2){
								//Update call history and rerun aggregations if callHistory is true
								if (callFlow.callHistory) {
									var qry = "UPDATE call SET org_unit_id = "+newOuid+" WHERE org_unit_id = "+oldOuid+" AND provisioned_route_id = "+callFlow.provisionedRouteId;
									ctTrans.query(qry,function(err,data){
										cb2(err);
									});
								} else {
									cb2(null);
								}
							}
						],function(err){
							cb1(err)
						});//async.parallel cb2
					}
				],function(err){
					cb(err)
				});//async.waterfall cb1
			},
			function(err){
				if (err) {
					ctTrans.rollback(function(er){
						console.log("there was an error rolling back")
						callback(err);
					});
				} else {
					console.log("there was not an error. commiting")
					ctTrans.commit(function(er){
						callback(er);
					});
				}
			});//async.eachSerie cb
		});
	},
	routeDataForUpdate: function(req, callback){
		//// FOR AMP3 USE DO NOT CHANGE
		
		var qry ="SELECT *";
		qry += " FROM provisioned_route AS pr";
		qry += " JOIN ce_call_flows AS ccf ON ccf.provisioned_route_id = pr.provisioned_route_id AND ccf.app_id = 'CT'";
		qry += " JOIN campaign_provisioned_route AS cpr ON cpr.provisioned_route_id = pr.provisioned_route_id";
		qry += " JOIN campaign AS c on c.campaign_id = cpr.campaign_id";
		qry += " WHERE pr.provisioned_route_id IN ("+req.query.ids+")";
		qry += " ORDER BY pr.provisioned_route_id ASC";

		appModel.ctPool.query(qry, function(err, results){
			callback(err,results);			
		});
	}
};

module.exports = provisionedRoutes;

function statusCallFlows(ctTrans, data, req, callback){
	if (data.provisioned_route.status == 'deleted'){
		spDeleteCallFlows(ctTrans, req.is_migrated, data, req.user.user_id, function(err, d){
			return callback(err, d);
		});
		
	} else {
		async.each(data.provisioned_route.ids, function(id, cb) {
			var orig_status = null;
			var origReferralEndDate = null;
			var origReferralStatus = "";
			var origphoneNumberId = "";
			var updateNumberPool = false;
			async.waterfall([
				function(callback) {
					// lookup the original provisioned route record and associated phone numbers
					var qry = "SELECT pr.provisioned_route_status, pr.provisioned_route_ou_id AS ouid, prn.phone_number_id,pr.referral_end_date FROM provisioned_route pr " +
						"LEFT JOIN provisioned_route_number prn ON (pr.provisioned_route_id=prn.provisioned_route_id AND prn.assign_active=true) WHERE pr.provisioned_route_id="+id;
					ctTrans.select(qry, function(err, prodata) {
						if (err) { return callback("Failed to lookup provisioned_route original records. "+err); }
						callback(null, prodata);
					});
				},
				function (prort, callback) {
					// get the count of phone number associated with provisioned route
					var ph_count = 0;
					orig_status = prort[0].provisioned_route_status;
					origReferralEndDate = prort[0].referral_end_date;
					origReferralStatus = orig_status;
					origphoneNumberId = prort[0].phone_number_id;
					if (prort[0].phone_number_id) {
						ph_count = 1;
						callback(null, ph_count, orig_status, prort[0].ouid, prort[0].phone_number_id);
					} else {
						var qry = "SELECT count(ppn.phone_number) AS ph_count FROM phone_pool pp ";
								qry += "JOIN phone_pool_number ppn ON (pp.pool_id = ppn.pool_id) ";
								qry += "WHERE pp.provisioned_route_id = " + id;
						ctTrans.query(qry,function(err,data){
							if (err) { return callback('Failed to query number pool. '+err); }
							if (data.length > 0) {
								ph_count = data[0].ph_count;
								updateNumberPool = true;
							}
							callback(null, ph_count, orig_status, prort[0].ouid, null);
						});
					}
				},
				function(ph_count, orig_status, ouid, phone_number_id,callback) {
					var isPremium = false ;
					var qry = "SELECT occ.component_id,occ.count_total,occ.secondary_total FROM org_component oc JOIN org_component_count occ ON (oc.component_id = occ.component_id) WHERE number_id = "+ phone_number_id +" AND component_type = 'number'";
					var componentQry = {
						which: 'query',
						qry: qry
					};
					ctTrans.query(componentQry, function(err, ret){
						if (err) {callback(err);}
						else {
							if(phone_number_id && ret.length > 0 && ret[0].component_id !== undefined ){
								isPremium = true;
							};
							var component_id = isPremium ? ret[0].component_id:18;
							if (orig_status !== data.provisioned_route.status) { // status has changed - proceed
								if (data.provisioned_route.status === 'deleted') {
									if (orig_status === 'active' ) {
										orgComponentCountModel.decrement(ctTrans, component_id, ouid, ph_count, function (err) {
											if (err) { return callback(err); }
											else{
												callback(null);
											}
										});
									}else if (orig_status === 'inactive'){
										orgComponentCountModel.decrementSubTotal(ctTrans, component_id, ouid, ph_count, function (err){
											if (err) { return callback(err); }
											else callback(null);
										});
									}
								} 
								else if (data.provisioned_route.status === 'referral') {
									if(isPremium){
										if(orig_status === 'active'){
											orgComponentCountModel.decrement(ctTrans, component_id, ouid, ph_count, function (err) {
												if (err) { return callback(err); }else{
													orgComponentCountModel.incrementRefTotal(ctTrans, component_id, ouid, ph_count, function (err) {
														if (err) { return callback(err); }else{
															callback(null);
														}
													});
												}
											});
										}else if(orig_status === 'inactive'){
											orgComponentCountModel.decrementSubTotal(ctTrans, component_id, ouid, ph_count, function (err) {
												if (err) { return callback(err); }else{
													orgComponentCountModel.incrementRefTotal(ctTrans, component_id, ouid, ph_count, function (err) {
														if (err) { return callback(err); }else{
															callback(null);
														}
													});
												}
											});
										}else{
											callback(null);
										}
									}else{
										if(orig_status === 'active'){
											orgComponentCountModel.decrement(ctTrans, component_id, ouid, ph_count, function (err) {
												if (err) { return callback(err); }else{
													orgComponentCountModel.increment(ctTrans, 28, ouid, ph_count, function (err) {
														if (err) { return callback(err); }else{
															callback(null);
														}
													});
												}
											});
										}else if(orig_status === 'inactive'){
											orgComponentCountModel.decrementSubTotal(ctTrans, component_id, ouid, ph_count, function (err) {
												if (err) { return callback(err); }else{
													orgComponentCountModel.increment(ctTrans, 28, ouid, ph_count, function (err) {
														if (err) { return callback(err); }else{
															callback(null);
														}
													});
												}
											});
										}else{
											callback(null);
										}
									}											
								}
								else {
									if(data.provisioned_route.status === 'active'){
										orgComponentCountModel.increment(ctTrans, component_id, ouid, ph_count, function (err) {
											if (err) { return callback(err); }
											else{
												orgComponentCountModel.decrementSubTotal(ctTrans, component_id, ouid, ph_count, function (err){
													if (err) { return callback(err); }
													else callback(null);
												});
											}
										});
									}
									if(data.provisioned_route.status === 'inactive'){
										orgComponentCountModel.decrement(ctTrans, component_id, ouid, ph_count, function (err) {
											if (err) { return callback(err); }
											else{
												orgComponentCountModel.incrementSubTotal(ctTrans, component_id, ouid, ph_count, function (err){
													if (err) { return callback(err); }
													else callback(null);
												});
											}
										});
									}
								}
							}
							else callback(null);
						}
					});
				}
			], function(err) {
				if (err) { return cb(err); }
				var doUpdate = true;
				if(origReferralEndDate !== null) {
					doUpdate = false;
				}
				async.parallel([
					function(cb1){
						var date_timestamp = 'CURRENT_TIMESTAMP';
						if (data.provisioned_route.referal_add_or_remove === true && doUpdate === true) {
							var qry = "UPDATE provisioned_route SET referral_end_date = '" + data.provisioned_route.referral_end_date + "',provisioned_route_modified = " + date_timestamp + ", provisioned_route_status =  '" + data.provisioned_route.status + "' WHERE provisioned_route_id = "+id+" AND provisioned_route_status <> '"+data.provisioned_route.status+"' AND provisioned_route_status <> 'deleted'";
						}else{
							var qry = "UPDATE provisioned_route SET provisioned_route_modified = " + date_timestamp + ", provisioned_route_status =  '" + data.provisioned_route.status + "' WHERE provisioned_route_id = "+id+" AND provisioned_route_status <> '"+data.provisioned_route.status+"' AND provisioned_route_status <> 'deleted'";
							if (data.provisioned_route.status !== 'referral')
								qry += " AND provisioned_route_status <> 'referral'"
						}
						var updateData = {
							which: 'query',
							qry:   qry
						};

						ctTrans.query(updateData, function(err, data){
							cb1(err);
						});
					},
					function(cb1){
						var callFlowData = {
							provisioned_route_id: id,
							updated_at: f.mysqlTimestamp(),
							status: data.provisioned_route.status
						};
						var where = " WHERE provisioned_route_id = "+id+" AND status <> '"+data.provisioned_route.status+"' AND status <> 'deleted' AND app_id='CT'"
						if (data.provisioned_route.referal_add_or_remove === true && doUpdate === true) {
							callFlowData.referral_number  = data.provisioned_route.referral_phone_number;
							callFlowData.referral_date 	  = data.provisioned_route.campaign_end_date;
							console.log("******************Updating call_flows table with referral condition");
						}
						if (data.provisioned_route.status !== 'referral')
								where += " AND status <> 'referral'"
						var updateData = {
							which: "update",
							table: "ce_call_flows",
							values: callFlowData,
							where: where,
						};
						ctTrans.query(updateData, function(err, data){
							cb1(err);
						});
					},
					function(cb1){
						if (data.provisioned_route.referal_add_or_remove === true && doUpdate === true && origphoneNumberId !== "" && origphoneNumberId !== null && data.provisioned_route.status === 'referral') {
							console.log("******************Updating phone_number table with referral condition");
							var qry = "UPDATE phone_number SET number_status =  '" + data.provisioned_route.status + "' WHERE number_id = "+origphoneNumberId;
							var updateData = {
								which: 'query',
								qry:   qry
							};
							ctTrans.query(updateData, function(err, data){
								cb1(err);
							});
						} else {
							cb1();
						}
					},
					function (cb1) {
						if(updateNumberPool === true && data.provisioned_route.referal_add_or_remove === true && doUpdate === true) {
								console.log("******************Updating number pool in MongoDB table with referral condition");
								var qry = " SELECT pool_id from phone_pool where provisioned_route_id ="+ id;
								ctTrans.query(qry,function(err,res){
									if(err){return cb1(err);}
									if(res.length >0){
										var poolData = {
											provisioned_route_id: id,
											pool_id: parseInt(res[0].pool_id),
											status : data.provisioned_route.status 
										};
										numberPoolModel.update(poolData, ctTrans, function(err,data){
											if(err){
												return cb1(err);
											}
											cb1(null);
										});
									}
								});
							
					} else {
						cb1(null);
					}
					},
					function(cb1){
						if(data.provisioned_route.status === "referral" && orig_status !== "referral") {
							var scheduleData = {
								start_date: data.provisioned_route.referral_end_date,
								next_run_date: data.provisioned_route.referral_end_date,
								end_date: data.provisioned_route.referral_end_date,
								reference_id: id,
								task_type: 'referral_provision_route',
								task_data: 'delete'
							};
							if(data.provisioned_route.timezone !== undefined && data.provisioned_route.timezone !== null) {
								scheduleData.next_run_date = data.provisioned_route.referral_end_date + " " + data.provisioned_route.timezone;
							}
							console.log("********** Creating referral scheduler...");
							scheduleModel.create(scheduleData, function(err, data2) {
								cb1(err);
							});
						} else {
							cb1(null)
						}
					},
				],
				function(err){
					cb(err);
				});//async parallel

			});
		},
		function(err){
			callback(err);
		});
	}
}
function spDeleteCallFlows(ctTrans, isMigrated, data, user_id, callc){
	var provisioned_route_id;
	var data_for_product = {};
	var blah = new Date();
	var prov_data = data;
	async.each(data.provisioned_route.ids, function(id, cb0){
		provisioned_route_id = id
		var isPremium = false;
		var isNumberPool = false;
		var tracking_number = '';
		var ou_id = '';
		async.waterfall([
			function(callback) {
				// lookup the original provisioned route record and associated phone numbers
				var qry = "SELECT pr.provisioned_route_id, pr.provisioned_route_status, pr.provisioned_route_ou_id AS ouid, prn.phone_number_id, pn.number as did FROM provisioned_route pr " +
					"LEFT JOIN provisioned_route_number prn ON (pr.provisioned_route_id=prn.provisioned_route_id AND prn.assign_active=true) "+
					"LEFT JOIN phone_number pn on (prn.phone_number_id = pn.number_id) "+
					"WHERE pr.provisioned_route_id="+id;
				ctTrans.select(qry, function(err, data) {
					if (err) { return callback("Failed to lookup provisioned_route original records. "+err); }
					if(data.length > 0) {
						data_for_product = {
									ouid : data[0].ouid,
									num_id : data[0].phone_number_id
								};
						callback(null, data);
					} else {
						cb0(null);
					}
				});
			},
			function (prort, callback) {
				// get the count of phone number associated with provisioned route
				var ph_count = 0;
				var orig_status = prort[0].provisioned_route_status,
				ou_id = prort[0].ouid; // set the globally available ouid
				var provisioned_route_id = prort[0].provisioned_route_id
				console.log(prort);
				//sdsd
				if (prort[0].phone_number_id) {
					ph_count = prort.length;
					ph_id = prort[0].phone_number_id; // set the globally available phone_number_id
					tracking_number = prort[0].did;
					callback(null, ph_count, orig_status, prort[0].ouid, isNumberPool, ph_id);
				} else {
					var qry = "SELECT count(ppn.phone_number) AS ph_count FROM phone_pool pp "
					qry += "JOIN phone_pool_number ppn ON (pp.pool_id = ppn.pool_id) "
					qry += "WHERE pp.provisioned_route_id = " + provisioned_route_id;


					ctTrans.query(qry, function(err, data){
						if (err) { return callback('Failed to query MongoDB for number pool. '+err); }
						if(data.length > 0) {
							isNumberPool = true;
							ph_count = data[0].ph_count;
						}
						console.log(ph_count, isNumberPool);
						//sds
						callback(null, ph_count, orig_status, prort[0].ouid, isNumberPool,0);
					});
				}
			},
			function(ph_count, orig_status, ouid, isNumberPool, ph_id, callback) {
				if(!isNumberPool && ph_id !== undefined){
					async.waterfall([
						function(cb9){
							var qry = "SELECT occ.component_id,occ.count_total,occ.secondary_total FROM org_component oc JOIN org_component_count occ ON (oc.component_id = occ.component_id) WHERE number_id = "+ ph_id +" AND component_type = 'number'";
							data = {
								which: 'query',
								qry: qry
							};
							ctTrans.query(data, function(err, ret){
								if (err) {cb9(err);}
								else {
									if(ret.length > 0 && ret[0].component_id !== undefined ){ isPremium = true;};
									cb9(null, ret);
								}
							});
						},function(ret,cb9){
							if(orig_status !== prov_data.provisioned_route.status){
								if(isPremium && ret.length > 0){
									if(orig_status == 'active'){
										orgComponentCountModel.decrement(ctTrans, ret[0].component_id, ouid, ph_count, function (err) {
											if (err) { return cb9(err); }
											cb9(null);
											});
									}else if(orig_status == 'inactive'){
										orgComponentCountModel.decrementSubTotal(ctTrans, ret[0].component_id, ouid, ph_count, function (err) {
											if (err) { return cb9(err); }
											cb9(null);
											});
									}else if(orig_status == 'referral'){
										orgComponentCountModel.decrementRefTotal(ctTrans, ret[0].component_id, ouid, ph_count, function (err) {
											if (err) { return cb9(err); }
											cb9(null);
											});
									}
								}else{
									if(orig_status == 'active'){
										orgComponentCountModel.decrement(ctTrans, 18, ouid, ph_count, function (err) {
											if (err) { return cb9(err); }
											cb9(null);
											});
									}else if(orig_status == 'inactive'){
										orgComponentCountModel.decrementSubTotal(ctTrans, 18, ouid, ph_count, function (err) {
											if (err) { return cb9(err); }
											cb9(null);
											});
									}else if(orig_status == 'referral'){
										orgComponentCountModel.decrement(ctTrans, 28, ouid, ph_count, function (err) {
											if (err) { return cb9(err); }
											cb9(null);
											});
									}
								}
							}else{
								cb9(null);
							}
						}
					],
					function(err) {
						if (err) { return callback(err); }else{
							callback(null);
						}							
					});
				} else if (orig_status !== prov_data.provisioned_route.status) { // status has changed - proceed
					if (orig_status === 'active') {
						orgComponentCountModel.decrement(ctTrans, 18, ouid, ph_count, function (err) {
							if (err) { return callback(err); }else{
								callback(null);
							}
						});
					}else if(orig_status === 'inactive'){
						orgComponentCountModel.decrementSubTotal(ctTrans, 18, ouid, ph_count, function (err){
							if (err) { return callback(err); }else{
								callback(null);
							}										
						});
					}else if(orig_status === 'referral'){
						orgComponentCountModel.decrement(ctTrans, 28, ouid, ph_count, function (err){
							if (err) { return callback(err); }else{
								callback(null);
							}										
						});
					}else{
						callback(null);
					}
				}
			},
			function(callback){
				var qry = "SELECT phone_number_id FROM provisioned_route_number WHERE provisioned_route_id = "+id+" AND assign_active = true";
				data = {
					which: 'query',
					qry: qry
				};
				ctTrans.queryRet(data, function(err, data){
					if (err) {
						//console.log("!!!!!!!!!!! LINE 243 deleteCallFlows " + err);
						callback(err);
					} else {
						callback(null, data.insertId);
					}
				});
			},
			function(phone_number_id, callback){
				async.series([
					function(cb){
						var provisionedRouteData = {
							provisioned_route_id: id,
							provisioned_route_modified: f.mysqlTimestamp(),
							provisioned_route_status: 'deleted',
							referral_end_date: null,
							webhook_id:null

						};
						var updateData = {
							which: 'update',
							table: table,
							values: provisionedRouteData
						};
						ctTrans.query(updateData, function(err, data){
							cb(err);
						});
					},
					function(cb){
						async.parallel([
							function(cb3){
								if(phone_number_id !== undefined && phone_number_id !== null ){
									var phoneNumberData = {
										number_status: 'suspended'
									};
									// JAW update field name from phone_number_id to number_id
									var updateData = {
										which: 'update',
										table: 'phone_number',
										values: phoneNumberData,
										where: ' WHERE number_id = ' + phone_number_id
									};
									ctTrans.query(updateData, function(err, data){
										if (err) { cb3("ERROR in deleteCallFlows updating phone_number " + err); }
										else cb3(null);
									});
								}else{
									cb3(null);
								}
							},
							function(cb3){
								if(phone_number_id !== undefined && phone_number_id !== null){

									var current_date = f.mysqlTimestamp();
									var qry = "UPDATE phone_detail SET misdial=false, app_id = NULL,org_unit_id = NULL,provisioned_route_id = NULL, number_updated='"+current_date+"' WHERE number_id = "+phone_number_id+";";
									var updateData = {
										which: 'query',
										qry: qry
									};
									ctTrans.query(updateData, function(err, data){
										if (err) { cb3("ERROR in deleteCallFlows updating phone_detail " + err); }
										cb3(err);
									});
								}else{
									cb3(null);
								}
							},
							function(cb3){
								if(phone_number_id !== undefined && phone_number_id !== null){
									var qry = "UPDATE provisioned_route_number SET assign_active = false, date_removed = Now()";
									qry += " WHERE provisioned_route_id = "+id;
									qry += " AND phone_number_id = "+phone_number_id;
									updateData = {
										which: 'query',
										qry: qry
									};
									ctTrans.query(updateData, function(err, data){
										if (err) { console.log("ERROR in deleteCallFlows updating provisioned_route_number" + err); }
										cb3(err);
									});
								}else{
									cb3(null);
								}
							},
							function(cb3){
								if(id !== undefined && id !== null){
									var qry = "UPDATE dni_setting SET dni_active = false, dni_setting_modified = Now()";
									qry += " WHERE provisioned_route_id = "+id;
									updateData = {
										which: 'query',
										qry: qry
									};
									ctTrans.query(updateData, function(err, data){
										if (err) { console.log("ERROR in deleteCallFlows updating dni_setting " + err); }
										cb3(err);
									});
								}else{
									cb3(null);
								}
							},
							function(cb3){
								if(phone_number_id === undefined || phone_number_id === null){
									var numberPool = require('./newNumberPoolModel');
									var updateData = {
										// condition : { provisioned_route_id: parseInt(id), app_id: 'CT' },
										provisioned_route_id: null, 
										status : 'deleted' 
									};

									var qry = { provisioned_route_id: parseInt(id)};
									//Read the record from number pool for provisioned_route_id
									numberPool.read(qry, function(err,pooldata){
										if (err) {
											console.log("ERROR in deleteCallFlows updating phone_number_pools " + err);
											cb3(err);
										}
										else {
											console.log("inside delete poolData",pooldata);
											if(pooldata.length > 0) { // if the numbers are exist then update the provisioned_route_id
												updateData.pool_id = pooldata[0].pool_id;
												numberPool.update(updateData,ctTrans, function(err, data){
													if(err){cb3(err);}
													else{
														var qry = " SELECT * FROM phone_pool_number where pool_id="+ pooldata[0].pool_id;
														ctTrans.query(qry,function(err,result){
															if(err){cb3(err);}
															if(result.length >0){
																updatePoolDataDetils(ctTrans,result, pooldata[0].org_unit_id,function(err){
																	if(err){cb3(err);}
																	else cb3(null);
																});
															}
															else cb3(null);
														});
													}														
												});
											} else {
												cb3(null);
											}
										}
									});
								}else{
									cb3(null);
								}
							},
							function(cb3){
								async.waterfall([
									function(cb4){
										var qry = "SELECT provisioned_route_ou_id FROM provisioned_route WHERE provisioned_route_id = "+id;
										data = {
											which: 'query',
											qry: qry
										};
										ctTrans.queryRet(data, function(err, data){
											if (err) {
												console.log("ERROR in deleteCallFlows selecting provisioned_route " + err);
												cb4(err);
											} else {
												ouid = data.insertId;
												cb4(null, ouid);
											}
										});
									},
									function(ouid, cb4){
										var qry = "SELECT billing_id FROM org_unit WHERE org_unit_id = "+ouid;
										data = {
											which: 'query',
											qry: qry
										};
										ctTrans.query(data, function(err, data){
											if (err) {
												console.log("ERROR in deleteCallFlows selecting org_unit " + err);
												cb4(err);
											} else {
												cb4(null,data.insertId);
											}
										});
									}
								],
								function(err){
									if(err){ cb3("ERROR in deleteCallFlows on async waterfall " + err);}
									else cb3(null);
								});
							}
						],
						function(err){
							if(err){ cb(err);}
							else cb(null);
						});
					},
					function(cb){
						var callFlowModel = require('./callFlowModel');
						callFlowModel.spGetByProvisionedRouteId(id, function(err, data){
							if (data.length < 1){
								cb(null);
							}else{
								async.parallel([
									function(cb1){
										var qry = "UPDATE ce_call_flows SET status = 'suspended' WHERE id = " + data[0].id + " AND app_id='CT' ";
										var deleteData = {
											which: "query",
											qry: qry
										};
										ctTrans.query(deleteData, function(err, data) {
											if (err) { cb1('ERROR in deleteCallFlows deleting call_flows ' + err); }
											else cb1(null);
										});
									},
									function(cb1){
										var qry = "DELETE FROM ce_hunt_types WHERE id = " + data[0].hunt_option ;
										var deleteData = {
											which: "query",
											qry: qry
										};
										ctTrans.query(deleteData, function(err, data) {
											if (err) { console.log('ERROR in ce_hunt_types deleting hunt_types ' + err); }
											cb1(err);
										});
									},
									function(cb1){
										var qry = "DELETE FROM ce_hunt_options WHERE hunt_route_id = " + data[0].hunt_option ;
										var deleteData = {
											which: "query",
											qry: qry
										};
										ctTrans.query(deleteData, function(err, data) {
											if (err) { console.log('ERROR in ce_hunt_options deleting hunt_options ' + err); }
											cb1(err);
										});
									},
									function(cb1){
										switch(data[0].routable_type){
											case 'IvrRoute2':
												console.log('Deleting Ivr Routes.');
												async.parallel([
													function(cb2){
														var qry = "DELETE FROM ce_ivr_routes2 WHERE id = " + data[0].routable_id;
														var deleteData = {
															which: 'query',
															qry: qry
														};
														ctTrans.query(deleteData, function(err, result) {
															if (err) { console.log('ERROR in deleteCallFlows deleting ivr_routes2 '+err); }
															cb2(err, result);
														});
													},
													function(cb2){
														var qry = "DELETE FROM ce_ivr_options2 WHERE ivr_route_id = " + data[0].routable_id;
														var deleteData = {
															which: 'query',
															qry: qry
														};
														ctTrans.query(deleteData, function(err, result) {
															if (err) { console.log('ERROR in deleteCallFlows deleting ivr_options2 '+err); }
															cb2(err, result);
														});
													}
													],
													function(err){
														cb1(err);
													});
											break;
											case 'GeoRoute':
												console.log('Deleting Geo Routes.');
												async.parallel([
													function(cb2){
														var qry = "DELETE FROM ce_geo_routes WHERE id = " + data[0].routable_id;
														var deleteData = {
															which: 'query',
															qry: qry
														};
														ctTrans.query(deleteData, function(err, result) {
															if (err) { console.log('ERROR in deleteCallFlows deleting geo_routes '+err); }
															cb2(err, result);
														});
													},
													function(cb2){
														var qry = "DELETE FROM ce_geo_options WHERE geo_route_id = " + data[0].routable_id;
														var deleteData = {
															which: 'query',
															qry: qry
														};
														ctTrans.query(deleteData, function(err, result) {
															if (err) { console.log('ERROR in deleteCallFlows deleting geo_options '+err); }
															cb2(err, result);
														});
													}
													],
													function(err,result){
														cb1(err,result);
													});
											break;
											case 'ScheduleRoute':
												callFlowModel.deleteScheduleRoutes(ctTrans,data[0].routable_id,function(err){
														cb1(err);
												});
											break;
											default:
												console.log('No options for this route.');
												cb1(null);
										}
									}],
									function(err,result) {
										if (err) { return cb('ERROR in deleteCallFlows on async parallel '+err); }
										else cb(null);
									}
								);
							}								
						});
					}
				],
				function(err){
					if (err) {
						console.log('ERROR in deleteCallFlows on async series '+err);
						callback(err);
					} else {
						callback(null);
					}
				});//async series
			},
			function(callback){
				if(id !== undefined){
					var customSourceData ={
						provisioned_route_id : id
					}
					customSourceModel.deleteCustomSourceByProvisionedRoute(ctTrans, customSourceData,function(err, data) {
						if (err) { callback(err);}
							callback(null);
					});
				}else{
					callback(null);
				}
			}
			// commenting for temporary deletion
			// function(callback){
			// 	if (!isPremium && !isNumberPool) {
			// 		var qry = " SELECT username FROM ct_user where ct_user_id = "+ user_id + " limit 1";
			// 		appModel.ctPool.query(qry, function(err, result) {
			// 			if (err) { callback(err); }
			// 			if (result.length > 0) {
			// 				var sms_data = {
			// 					'old_status' : false,
			// 					'new_status' : false,
			// 					'org_unit_id' : ou_id,
			// 					'did' : tracking_number,
			// 					'email' : result[0].username,
			// 					'provisioned_route_id' : provisioned_route_id
			// 				};
			// 				shoutPointModel.checkSMSFeature(sms_data, true, function(err){
			// 					if(err){ console.log("Error From Dev Support Ticket", err); }
			// 					callback(null);
			// 				});
			// 			} else {
			// 				callback('no user found');
			// 			}
			// 		});
					
			// 	}else{
			// 		callback(null);
			// 	}
			// }
		],
		function(err){
			if (err) { return cb0(err); }
		else cb0(null);
		});
	},
	function(err){
		if (err) {
			callc(err);
		} else {
			callc(null);
		}
	});
}
function updatePoolDataDetils(model,data,ouid,res){
	var phoneErr = null;
	var values = [];
 	var number_id,id_count;
	var fields = ["number", "number_status", "number_str", "npa", "nxx","ocn","rate_center","number_type"];
	var phoneDetailValues = [];
	var phoneDetailFields = ["number_id","lata","app_id","provisioned_route_id","org_unit_id","vendor_id","number_updated","resporg_id"];
	if(data.length >0){
		async.series([
			function (cb1) {
				async.each(data,function(number,cb){
							var ph_number = number['phone_number'];
							var xqry = "SELECT rc FROM npanxx_city WHERE npa='" + ph_number.substr(0, 3) + "' AND nxx='" + ph_number.substr(3, 3) + "' LIMIT 1";
									model.query(xqry,function(err,ratecenter){
										if(err){return cb(err);}
										var rateCenter = null;

										if(ratecenter.length>0) {
											rateCenter = ratecenter[0].rc
										}

										var tempString = "(";
										var tempValues = [ph_number, 'suspended',ph_number.toString(), ph_number.substr(0, 3), ph_number.substr(3, 3), ph_number.substr(6, 4),rateCenter,number['number_type']];
										_.each(tempValues, function(tempValue, index){
												if(index === 0)
														tempString += tempValue;
												else if (typeof tempValue === 'string')
														tempString += ",'" + tempValue + "'";
												else
														tempString += "," + tempValue;
										});	
										tempString += ")";
										values.push(tempString);
										cb(null);
											
									

							});
						
						
				},function(err){
						if(err){return cb1(err);}
						else{
							if(values.length){
								var qry  = "INSERT INTO phone_number (" + fields.join(',') + ") VALUES " + values.join(',');
								model.query(qry,function(err,result){
										if(err){
												return cb1(err);
										}
										number_id = result[0].number_id;
										id_count = result.length;
										cb1(null);
								});
							}
							else{
								cb1(null);
							}
						}
				});
					
			},
			function (cb1) {
				 async.each(data,function(number,callback){
					var numIndex = data.indexOf(number); 
					var vendor_id = number.vendor_id;
					var ph_number = number['phone_number'];
					var tempString = "(";
					var current_date = f.mysqlTimestamp();
					var tempValues = [number_id, 0, null, null, null, vendor_id, current_date,number['resporg_id']];
					if(!isNaN(number_id)){
							_.each(tempValues, function(tempValue, index){
								if(index === 0){
										tempValue =  tempValue - numIndex;
										tempString += tempValue;
								}
								else if (typeof tempValue === 'string')
										tempString += ",'" + tempValue + "'";
								else
										tempString += "," + tempValue;
						});	
						tempString += ")";
						phoneDetailValues.push(tempString);
						callback(null);
					}
					else{callback("Not able to delete callflow please contact customer support.");}
				 },function(err){
					  if(err){return cb1(err);}
						else{
							if(phoneDetailValues.length){
								var qry  = "INSERT INTO phone_detail (" + phoneDetailFields.join(',') + ") VALUES " + phoneDetailValues.join(",");
								model.query(qry,function(err,data){
										if(err){
												return cb1(err);
										}
										cb1(null);
								});
							}
							else{cb1(null);}
						}
				 });
				
					
			},
			
		],function(err) {
			if (err) { 
				res(err);
			}else{
				res(null);
			}
		});
	}
	else{res(null);}	
}
function spUpdateCallFlows(data, ou_id, migrated, user_id, callback,log_auth) {
	var provisioned_route_id;
	var ctTrans = new ctTransactionModel.begin(function(err){
		if (err) { return callback(err); }
			async.each(data.call_flows, function(call_flow, cb) {
				provisioned_route_id = call_flow.call_flow.provisioned_route_id;
				var old_sms_status = false;
				var new_sms_status = false;
				//check npa against npa blacklist table
				npaCheck(call_flow, function(err, result) {
					if (err) { return cb("Failed to lookup NPA blacklist. "+err); }
					if(result[0] && result[0].npa) { return cb("The specified ring to area code "+result[0].npa+" is not allowed. Please contact customer service at 855-889-3939 for assistance."); }

					// get the original status of the provisioned_route_status and total count of phone numbers used
					var qry = "SELECT pr.provisioned_route_id, COUNT(prn.route_number_id) AS number_count, pr.provisioned_route_status " +
						"FROM provisioned_route pr LEFT JOIN provisioned_route_number prn ON (pr.provisioned_route_id=prn.provisioned_route_id) " +
						"WHERE pr.provisioned_route_id=" + call_flow.provisioned_route.id + " GROUP BY pr.provisioned_route_id";
					appModel.ctPool.query(qry, function(err, orig) {
						if (err) { return cb("Failed to lookup original record. "+err); }

						var returnJson = {};
						var provisioned_route_id = '';
						var isPremium = false;
						var premiumComponentId = '';
						var status = '';
						if (call_flow.provisioned_route.status) {
							status = call_flow.provisioned_route.status;
						} else if (call_flow.call_flow.status) {
							status = call_flow.call_flow.status;
						}
						async.waterfall([
							function(cb1){
								var qry = "SELECT oc.component_id from org_component oc ";
								qry += "JOIN phone_detail pd ON (oc.number_id = pd.number_id) ";
								qry += "WHERE pd.provisioned_route_id = "+call_flow.provisioned_route.id+" AND component_type = 'number' ";
								ctTrans.query(qry,function(err, premiumData){
									if(err){return cb1("There is some issue while fetching premium number");}{
										if(premiumData.length > 0){
											premiumComponentId = premiumData[0].component_id;
											isPremium = true;
											cb1();
										}else{
											cb1();
										}
									}
								});
							},
							function(cb1) {
								var qry = " SELECT sms_enabled FROM ce_call_flows WHERE provisioned_route_id="+ call_flow.provisioned_route.id ;
									ctTrans.query(qry,function(err, result){
										if(err){return cb1("There is some issue while fetching callflow sms_enabled");}
										if(result.length > 0){
											old_sms_status = result[0].sms_enabled;
											cb1(null);
										}
										else cb1(null);
									});
							},
							function(cb1) {
								async.parallel({
									unique: function(cb3) {
										provisionedRoutes.checkUniqueCallFlow(call_flow.provisioned_route.name,data.campaign.id, call_flow.provisioned_route.id , function(err) {
											cb3(err);
										});
									}
								},
								function (err,results){
									cb1(err, results);
								});
							},							
							function(err, cb1) {
								async.parallel([
									function(callback) {
										if (call_flow.provisioned_route) {
											var provisionedRouteData = {
												provisioned_route_id: call_flow.provisioned_route.id,
												route_type: call_flow.provisioned_route.route_type,
												provisioned_route_name: call_flow.provisioned_route.name,
												channel_id: call_flow.channel.id,
												webhook_id:null,
												provisioned_route_modified: 'NOW()' 
											};
											if (call_flow.provisioned_route.call_value && call_flow.provisioned_route.call_value !== '' && call_flow.provisioned_route.call_value !== null && call_flow.provisioned_route.call_value !== undefined) {
												provisionedRouteData.call_value = call_flow.provisioned_route.call_value;
											}else{
												provisionedRouteData.call_value = null;
											}
											if(call_flow.provisioned_route.repeat_interval !== undefined && call_flow.provisioned_route.repeat_interval !== null){
												provisionedRouteData.repeat_interval = call_flow.provisioned_route.repeat_interval;
											}

											if(call_flow.call_flow.webhook_id){
												provisionedRouteData.webhook_id = call_flow.call_flow.webhook_id;
											}
											if (status !== '') {
												provisionedRouteData.provisioned_route_status = status;
											}

											if (call_flow.provisioned_route.post_IVR_enabled !== undefined && call_flow.provisioned_route.post_IVR_enabled !== null && call_flow.provisioned_route.post_IVR_enabled !== '') {
												provisionedRouteData.is_post_call_ivr_enabled = call_flow.provisioned_route.post_IVR_enabled;
											}
											if(call_flow.call_flow.overflowNumbers && call_flow.call_flow.overflowNumbers.length >0 ){
												if(call_flow.call_flow.overflowNumbers.length == 1 && call_flow.call_flow.isSimultaneousRing == false){
													provisionedRouteData.hunt_type = 'overflow';
												}
												else if(call_flow.call_flow.overflowNumbers.length >0 && call_flow.call_flow.isSimultaneousRing == true){
													provisionedRouteData.hunt_type = 'simultaneous';
												}
												else if(call_flow.call_flow.overflowNumbers.length > 1 && call_flow.call_flow.isSimultaneousRing == false){
													provisionedRouteData.hunt_type = 'rollover';
												}
											} else {
												provisionedRouteData.hunt_type = null;
											}
											var updateData = {
												which: 'update',
												table: table,
												values: provisionedRouteData
											};
											async.parallel([
												function(cb){
													ctTrans.query(updateData, function(data) {
														cb(null);
													});
												},
												function(cb) {
													// update pool name if cf name changed to number pool.
													if (call_flow.number_pool && call_flow.number_pool.id !== '') {
														var numberPool = require('./newNumberPoolModel');
														var updateData = {
															pool_id : parseInt(call_flow.number_pool.id),
															provisioned_route_id: parseInt(call_flow.provisioned_route.id), 
															pool_name: call_flow.provisioned_route.name, 
															status: 'active'
														};
														numberPool.update(updateData, ctTrans, function(err, data){
															cb(err);
														});
													} else {
														cb(null);
													}
												}
												],
												function (err){
													callback(err);
												});

										}
									},
									function(callback){
										var cnt;
										if(!isPremium && status !== '' && status === 'inactive'){
											var qry = " SELECT status FROM ce_call_flows WHERE provisioned_route_id="+ call_flow.provisioned_route.id ;
											ctTrans.query(qry,function(err,result){
												if(err){return callback("There is some issue while fetching callflow status");}
												if(result.length >0){
													if(result[0].status !== 'deleted' && result[0].status !== status){
														var qry = "SELECT count(ppn.phone_number) AS ph_count FROM phone_pool pp "
																qry += "JOIN phone_pool_number ppn ON (pp.pool_id = ppn.pool_id) "
																qry += "WHERE pp.provisioned_route_id = " + call_flow.provisioned_route.id;
														ctTrans.query(qry, function(err,data){
															if(err){return callback(err);}
															if(data[0].ph_count > 0){
																cnt = data[0].ph_count;
															}
															else cnt =1;
															orgComponentCountModel.decrement(ctTrans, 18, call_flow.provisioned_route.org_unit_id, cnt, function (err) {
																if (err) { return callback(err); }
																else{
																	orgComponentCountModel.incrementSubTotal(ctTrans, 18, call_flow.provisioned_route.org_unit_id, cnt, function (err) {
																		if (err) { return callback(err); }
																		else callback(null);
																	 });
																}
															 });
														});		
														
													}
													else callback(null);
												}
												else callback(null);
											});
										}
										else if(!isPremium && status !== '' && status === 'active'){
											var qry = " SELECT status FROM ce_call_flows WHERE provisioned_route_id="+ call_flow.provisioned_route.id ;
											ctTrans.query(qry,function(err,result){
												if(err){return callback("There is some issue while fetching callflow status");}
												if(result.length >0){
													if(result[0].status !== 'deleted' && result[0].status !== status){
														var qry = "SELECT count(ppn.phone_number) AS ph_count FROM phone_pool pp "
																qry += "JOIN phone_pool_number ppn ON (pp.pool_id = ppn.pool_id) "
																qry += "WHERE pp.provisioned_route_id = " + call_flow.provisioned_route.id;
														ctTrans.query(qry, function(err,data){
															if(err){return callback(err);}
															if(data[0].ph_count > 0){
																cnt = data[0].ph_count;
															}
															else cnt =1;
															orgComponentCountModel.increment(ctTrans, 18, call_flow.provisioned_route.org_unit_id, cnt, function (err) {
																if (err) { return callback(err); }
																else{
																	orgComponentCountModel.decrementSubTotal(ctTrans, 18, call_flow.provisioned_route.org_unit_id, cnt, function (err) {
																		if (err) { return callback(err); }
																		else callback(null);
																	 });
																}
															 });
														});		
													}
													else callback(null);
												}
												else callback(null);
											});
										}
										else if(!isPremium && status !== '' && status === 'referral'){
											var qry = " SELECT status FROM ce_call_flows WHERE provisioned_route_id="+ call_flow.provisioned_route.id ;
											ctTrans.query(qry,function(err,result){
												if(err){return callback("There is some issue while fetching callflow status");}
												if(result.length >0){
													if(result[0].status !== 'deleted' && result[0].status !== status){
														var qry = "SELECT count(ppn.phone_number) AS ph_count FROM phone_pool pp "
																qry += "JOIN phone_pool_number ppn ON (pp.pool_id = ppn.pool_id) "
																qry += "WHERE pp.provisioned_route_id = " + call_flow.provisioned_route.id;
														ctTrans.query(qry, function(err,data){
															if(err){return callback(err);}
															if(data[0].ph_count > 0){
																cnt = data[0].ph_count;
															}
															else cnt =1;
															orgComponentCountModel.increment(ctTrans, 28, call_flow.provisioned_route.org_unit_id, cnt, function (err) {
																if (err) { return callback(err); }
																else{
																	if(result[0].status == 'active'){
																		orgComponentCountModel.decrement(ctTrans, 18, call_flow.provisioned_route.org_unit_id, cnt, function (err) {
																			if (err) { return callback(err); }
																			else callback(null);
																		 });
																	}else{
																		orgComponentCountModel.decrementSubTotal(ctTrans, 18, call_flow.provisioned_route.org_unit_id, cnt, function (err) {
																			if (err) { return callback(err); }
																			else callback(null);
																		 });
																	}
																}
															 });
														});		
													}
													else callback(null);
												}
												else callback(null);
											});
										}else if(isPremium){
											var qry = " SELECT status FROM ce_call_flows WHERE provisioned_route_id="+ call_flow.provisioned_route.id ;
											ctTrans.query(qry,function(err,result){
												if(err){return callback("There is some issue while fetching callflow status");}
												if(result.length >0){
													if(result[0].status !== 'deleted' && result[0].status !== status){
														if(status !== '' && status === 'inactive' && result[0].status == 'active'){
															orgComponentCountModel.incrementSubTotal(ctTrans, premiumComponentId, call_flow.provisioned_route.org_unit_id, 1, function (err) {
																if (err) { return callback(err); }
																else{
																	orgComponentCountModel.decrement(ctTrans, premiumComponentId, call_flow.provisioned_route.org_unit_id, 1, function (err) {
																		if (err) { return callback(err); }
																		else callback(null);
																	});
																}
															 });
														}else if(status !== '' && status === 'active' && result[0].status == 'inactive'){
															orgComponentCountModel.increment(ctTrans, premiumComponentId, call_flow.provisioned_route.org_unit_id, 1, function (err) {
																if (err) { return callback(err); }
																else{
																	orgComponentCountModel.decrementSubTotal(ctTrans, premiumComponentId, call_flow.provisioned_route.org_unit_id, 1, function (err) {
																		if (err) { return callback(err); }
																		else callback(null);
																	});
																}
															 });
														}else if(status !== '' && status === 'referral' && result[0].status == 'active'){
															orgComponentCountModel.decrement(ctTrans, premiumComponentId, call_flow.provisioned_route.org_unit_id, 1, function (err) {
																if (err) { return callback(err); }
																else{
																	orgComponentCountModel.incrementRefTotal(ctTrans, premiumComponentId, call_flow.provisioned_route.org_unit_id, 1, function (err) {
																		if (err) { return callback(err); }
																		else callback(null);
																	});
																}
															 });
														}else if(status !== '' && status === 'referral' && result[0].status == 'inactive'){
															orgComponentCountModel.decrementSubTotal(ctTrans, premiumComponentId, call_flow.provisioned_route.org_unit_id, 1, function (err) {
																if (err) { return callback(err); }
																else{
																	orgComponentCountModel.incrementRefTotal(ctTrans, premiumComponentId, call_flow.provisioned_route.org_unit_id, 1, function (err) {
																		if (err) { return callback(err); }
																		else callback(null);
																	});
																}
															 });
														}
													}
													else callback(null);
												}
												else callback(null);
											});
										}
									},
									function(callback) {
										console.log('starting ivr location link');
										async.series([
											function(cb1){
												if (call_flow.call_flow) {
													var callFlowModel = require("../models/callFlowModel");
													var whisper_message = 'blank://';
													switch (call_flow.call_flow.whisper_type) {
														case 'text':
															whisper_message = 'tts://' + call_flow.call_flow.whisper_message;
														break;
														case 'file':
															whisper_message = 'file://' + call_flow.call_flow.whisper_message + '.wav';
														break;
													}
													var message = 'blank://';
													switch (call_flow.call_flow.message_type) {
														case 'text':
															message = 'tts://' + call_flow.call_flow.message;
														break;
														case 'file':
															message = 'file://' + call_flow.call_flow.message + '.wav';
														break;
													}
													var vm_message = 'blank://';
													switch (call_flow.call_flow.vm_type) {
														case 'text':
															vm_message = 'tts://' + call_flow.call_flow.vm_message;
														break;
														case 'file':
															vm_message = 'file://' + call_flow.call_flow.vm_message + '.wav';
														break;
													}
													var record_until = null;
													if (call_flow.call_flow.record_until && call_flow.call_flow.record_until !== ''){
														record_until = call_flow.call_flow.record_until;
													}

													if(call_flow.call_flow.voicemail_rings_count === undefined)
														call_flow.call_flow.voicemail_rings_count = 3
													var callFlowData = {
														id: call_flow.call_flow.id,
														ouid: call_flow.call_flow.organizational_unit_id,
														dnis: call_flow.call_flow.tracking_number,
														play_disclaimer: call_flow.call_flow.play_disclaimer,
														record_until: record_until,
														routable_type: call_flow.call_flow.route_type,
														whisper_enabled: call_flow.call_flow.whisper_enabled,
														message_enabled: call_flow.call_flow.message_enabled,
														webhook_enabled: false,
														spam_filter_enabled: false,
														ring_delay: (call_flow.call_flow.voicemail_rings_count * 6),
														vm_message: vm_message,
														country_code: 1
													};

													if(call_flow.call_flow.route_type == 'outbound' && call_flow.provisioned_route.callerid !== null){
														callFlowData.outboundData = {
															pin: call_flow.provisioned_route.pin,
															callerid: call_flow.provisioned_route.callerid
														}
													}
													if(call_flow.call_flow.spam_active){
														callFlowData.spam_filter_enabled = true;
														callFlowData.spam_threshold = 3;

													}
													if(call_flow.call_flow.play_disclaimer === undefined || call_flow.call_flow.play_disclaimer === null){
														callFlowData.play_disclaimer = 'never';
													}
													if(call_flow.call_flow.vm_enabled != undefined && call_flow.call_flow.vm_enabled !== null){
														if (call_flow.call_flow.route_type == 'PercentageBasedRoute' || call_flow.call_flow.route_type == 'outbound'){
															callFlowData.vm_enabled = false;
														}else{
															callFlowData.vm_enabled = call_flow.call_flow.vm_enabled;
														}
													}
													if (call_flow.call_flow.webhook_id) {
														callFlowData.webhook_enabled = true;
													}
													if (call_flow.call_flow.ringto) {
														callFlowData.default_ringto = call_flow.call_flow.ringto;
													}
													if (call_flow.call_flow.route_type == 'schedule') {
														callFlowData.default_ringto = call_flow.call_flow.ringto;

													}

													if (call_flow.call_flow.whisper_message) {
														callFlowData.whisper_message = whisper_message;
													}else{
														callFlowData.whisper_message = '';
													}

													if (call_flow.call_flow.vm_message) {
														callFlowData.vm_message = vm_message;
													}else{
														callFlowData.vm_message = '';
													}

													if(call_flow.call_flow.dnis_as_cid === "caller_id" || call_flow.call_flow.dnis_as_cid == undefined){
														callFlowData.dnis_as_cid = false;
													}else{
														callFlowData.dnis_as_cid = true;
													}
													if (call_flow.call_flow.sms_enabled && call_flow.call_flow.sms_enabled === true) {
														callFlowData.sms_enabled = true;
														new_sms_status = true;
													}else{
														callFlowData.sms_enabled = false;
														new_sms_status = false;
													}

													if (call_flow.call_flow.message) {
														callFlowData.message = message;
													}else{
														callFlowData.message = '';
													}

													if (status !== '') {
														callFlowData.status = status;
													}
													if(!migrated && call_flow.ivrs !== undefined && call_flow.ivrs.length){
														callFlowData.ivrs = call_flow.multiIvrs;
													}
													
													if(call_flow.multiIvrs && call_flow.multiIvrs.ivrActions !== undefined && migrated ){
														if (call_flow.multiIvrs && call_flow.multiIvrs.ivrActions.length > 0) {
															callFlowData.ivrs = call_flow.multiIvrs.ivrActions;
															switch (call_flow.multiIvrs.message_type) {
																case 'text':
																callFlowData.message = 'tts://' + call_flow.multiIvrs.message;
																callFlowData.message_enabled = true;
																break;
																case 'file':
																callFlowData.message = 'file://' + call_flow.multiIvrs.message + '.wav';
																callFlowData.message_enabled = true;
																break;
															}
														}
													}
													
													if (call_flow.geo_route) {
														callFlowData.geo_route = call_flow.geo_route;
													}
													if (call_flow.provisioned_route.schedule_data) {
														callFlowData.schedule_data = call_flow.provisioned_route.schedule_data;

													}
													if (call_flow.geo_options) {
														callFlowData.geo_options = call_flow.geo_options;
													}
													if (call_flow.ringto) {
														callFlowData.default_ringto = call_flow.ringto;
													}
													if (call_flow.call_flow.route_type ==  'voicemail'){
														callFlowData.default_ringto = '';
													}
													if (call_flow.ringto_percentage) {
														callFlowData.ringto_percentage = call_flow.ringto_percentage;
													}
													if( call_flow.call_flow.overflowNumbers && call_flow.call_flow.overflowNumbers.length >0 && call_flow.call_flow.isSimultaneousRing == true) {
														call_flow.call_flow.hunt_type = 'simultaneous';
														
													}
													if(call_flow.call_flow.overflowNumbers && call_flow.call_flow.overflowNumbers.length >0 && call_flow.call_flow.isSimultaneousRing == false) {
														call_flow.call_flow.hunt_type = 'Rollover';
													}
													var values = [];
													var loggerData = {
														'ouid':ou_id,
														'userid':user_id,
														'log_auth': log_auth

													};

													async.series([
														function(cb4) {
															if(callFlowData.status === 'active') {
																var camapaignModel = require("./campaignModel");
																if (data.campaign && data.campaign.id && data.campaign.id !== '') {
																	data.campaign.status = callFlowData.status;
																	camapaignModel.setCampaignStatus(data,function(err){
																		if(err) {
																			cb4(err);
																			//return;
																		}
																		cb4(null);
																	});
																}
															}else{
																cb4(null);
															}
														},
														function(cb4) {
															overFlowNumberModel.deleteByProvisionId(ctTrans, data.call_flows[0].provisioned_route.id, function(err){
																cb4(err, null);
															});
														},
														function(cb4) {
															if(call_flow.call_flow.overflowNumbers && call_flow.call_flow.overflowNumbers.length > 0 && (call_flow.provisioned_route.route_type === 'simple' ||  call_flow.provisioned_route.route_type  ==='geo')){
																overFlowNumberModel.save(call_flow.call_flow.overflowNumbers, callFlowData.ouid, call_flow.call_flow.hunt_type, ctTrans,data.call_flows[0].provisioned_route.id, function(err, hunt_option_id){
																	if(hunt_option_id){ callFlowData.hunt_option = hunt_option_id;}
																	cb4(err, null);
																});
															}else{
																callFlowData.hunt_option = 0;
																cb4(null);
															}
														},
														function(cb4){
															callFlowModel.update(ctTrans, callFlowData, migrated, loggerData, data.call_flows[0].provisioned_route.id, function(err, d){
																cb4(err);
															}); 
														},
														function(cb4){
															var post_IVR_enabled = false;
															if(call_flow.provisioned_route.post_IVR_enabled !== undefined && call_flow.provisioned_route.post_IVR_enabled !== null && call_flow.provisioned_route.post_IVR_enabled !== '' && call_flow.provisioned_route.post_IVR_enabled && call_flow.call_flow.post_IVR_data) {
																post_IVR_enabled = true;
															}
															var updateQuery = "UPDATE ce_call_flows SET postcall_ivr_enabled = "+ post_IVR_enabled +" WHERE app_id='CT' AND provisioned_route_id = "+ call_flow.call_flow.provisioned_route_id;
															ctTrans.query(updateQuery, function(err) {
																if(err){cb4(err);}
																if(call_flow.call_flow.post_IVR_data && call_flow.call_flow.post_IVR_data !== {}){
																	var postIVRData = call_flow.call_flow.post_IVR_data;
																	switch(postIVRData.type){
																		case 'conversion':
																			var postIvrOption = {
																				provisioned_route_id : call_flow.call_flow.provisioned_route_id,
																				post_call_ivr_option_id : 1,
																				post_call_ivr_status: 'active',
																				updated_by: user_id																			
																			};
																			postIVRData.postIvrOption = postIvrOption;
																			postIVRData.currentUser = user_id;
																			postIvrOption.created_by = user_id;
																			postIvrOption.created_on = 'CURRENT_TIMESTAMP';
																			savePostCallIVR(postIVRData, ctTrans, function(err){
																				if(err){cb4(err);}
																				cb4(null);
																			});														
																			break;
																
																		case 'agentID':
																			var postIvrOption = {
																				provisioned_route_id : call_flow.call_flow.provisioned_route_id,
																				post_call_ivr_option_id : 2,
																				post_call_ivr_status: 'active',
																				updated_by: user_id																			
																			};
																			postIVRData.postIvrOption = postIvrOption;
																			postIVRData.currentUser = user_id;
																			postIvrOption.created_by = user_id;
																			postIvrOption.created_on = 'CURRENT_TIMESTAMP';
																			savePostCallIVR(postIVRData, ctTrans, function(err){
																				if(err){cb4(err);}
																				cb4(null);
																			});
																			break;
																		
																		case 'conversionAgentID':
																			var postIvrOption = {
																				provisioned_route_id : call_flow.call_flow.provisioned_route_id,
																				post_call_ivr_option_id : 3,
																				post_call_ivr_status: 'active',
																				updated_by: user_id																			
																			};
																			postIVRData.postIvrOption = postIvrOption;
																			postIVRData.currentUser = user_id;
																			postIvrOption.created_by = user_id;
																			postIvrOption.created_on = 'CURRENT_TIMESTAMP';
																			savePostCallIVR(postIVRData, ctTrans, function(err){
																				if(err){cb4(err);}
																				cb4(null);
																			});
																			break;											
																		default:
																		cb4(null);
																	}
																}else{
																	clearPostCallIvrRoutes(call_flow.call_flow.provisioned_route_id, ctTrans, function(err){
																		cb4(err);
																	});																	
																}
															});														
														},														
													],
													function(err){
														if (err) {
															cb1(err);
														} else {
															cb1(null);
														}
													});
												} else {
													cb1('Missing call flows');
												}
											}
										],
										function(err) {
											callback(err);
										});
									},
									function(callback){
										if (call_flow.dni_setting) {
											var	dniSettingData = {
												provisioned_route_id: call_flow.dni_setting.provisioned_route_id,
												destination_url: call_flow.dni_setting.destination_url,
												dni_type: call_flow.dni_setting.dni_type,
												dni_element: call_flow.dni_setting.dni_element,
												referrer: call_flow.dni_setting.referrer,
												org_unit_id: call_flow.dni_setting.org_unit_id,
												dni_ttl: call_flow.dni_setting.dni_ttl,
											};

											if(call_flow.dni_setting.referrer_type) {
												dniSettingData.referrer_type = call_flow.dni_setting.referrer_type;
											}

											if(call_flow.dni_setting.dni_setting_id) {
												dniSettingData.dni_setting_id = call_flow.dni_setting.dni_setting_id;
												dniSettingModel.update(ctTrans, dniSettingData, function(err){
													callback(err);
												});
											} else {
												dniSettingModel.create(ctTrans, dniSettingData, function(err){
													callback(err);
												});
											}
										} else {
											dniSettingModel.read(call_flow.call_flow.organizational_unit_id, call_flow.provisioned_route.id, function(err, data){
												if (data.length && data[0].dni_settings.length) {
													dniSettingModel.deleteDNISetting(data[0].dni_settings[0].dni_setting_id, function(err, data) {
														callback(err);
													},ctTrans);
												} else {
													callback(null);
												}
											});
										}
									},
									function(callback){
										if (call_flow.call_flow.customSourceList !== undefined && call_flow.call_flow.customSourceList !== []) {
											var customSourceData = {
												provisioned_route_id: call_flow.provisioned_route.id,
												customSourceList: call_flow.call_flow.customSourceList
											};
											customSourceModel.updateCustomSource(ctTrans,customSourceData,function(err,result){
												if(err) { return callback(err); }
												callback();
											});
										}else {
											callback();
										}
									},
									function(cb2){
										if (!isPremium && (new_sms_status !== old_sms_status) && call_flow.call_flow.tracking_number) {
											var qry = " SELECT username FROM ct_user where ct_user_id = "+ user_id + " limit 1";
											appModel.ctPool.query(qry, function(err, result) {
												if (err) { cb2(err); }
												if (result.length > 0) {
													var sms_data = {
														'old_status' : old_sms_status,
														'new_status' : new_sms_status,
														'org_unit_id' : ou_id,
														'did' : call_flow.call_flow.tracking_number,
														'email' : result[0].username,
														'provisioned_route_id' : call_flow.call_flow.provisioned_route_id
													};
													shoutPointModel.checkSMSFeature(sms_data, false, function(err){
														if(err){ console.log("Error From Dev Support Ticket", err); }
														cb2(null);
													});
												} else {
													cb2('no user found');
												}
											});
											
										}else{
											cb2(null);
										}
									}
								],function(err) {
									cb1(err);
								});//async parallel
							}
						],
						function(err) {
							cb(err);
						});//async waterfall
					}); // status query
				});
			},
			function(err){
				if (err) {
					ctTrans.rollback(function(){
						callback(err);
					});
				} else {
					if (err) {
						ctTrans.rollback(function(){
							callback(err);
						});
					} else {
						ctTrans.commit(function(){							
							if(migrated){
								if(data.call_flows[0].call_flow.route_type === 'ivr' ||data.call_flows[0].call_flow.route_type === 'geo'){
									var callFlowModel = require("../models/callFlowModel");
									callFlowModel.orphanPathQueue(provisioned_route_id, function(err){ 
										callback(err);
									})
								}else{
								callback(null);
								}
							}else{
								var callFlowModel = require("../models/callFlowModel");
								callFlowModel.sendForMigration(provisioned_route_id, function(err){
									callback(err);
								})
							}
						});
					}
				}

			});//async each
		});//ct transaction begin
}
function updatePremiumComponent(ctTrans, counter_ou_id, num_id, callback){
	var updateData = {
	 which: 'update',
	 table : 'org_component',
	 values: { 'org_unit_id' : counter_ou_id },
	 where: " WHERE number_id = "+ num_id
 };
	ctTrans.queryRet(updateData, function(err, result){
		if (err) { return callback(err); }
		var qry = "UPDATE org_component_count as org_co "
						+"SET org_unit_id = "+ counter_ou_id +" FROM org_component ou "
						+"WHERE ou.component_id = org_co.component_id and ou.number_id = "+ num_id;
				ctTrans.query(qry, function(err, result){
					if (err) { return callback(err); }
					 callback(null);
				 });
	 });
}
function npaCheck(call_flow, callback) {
	var where = null;
	switch(call_flow.provisioned_route.route_type) {
		case 'simple':
			if(call_flow.call_flow.ringto == 'hangup') where = "WHERE nb.npa = 000";
			else where = "WHERE nb.npa=" + call_flow.call_flow.ringto.substring(0,3);
			break;
		//for geo routes we only need to check the default ring to since the location numbers will be validated at the time the list is created
		case 'geo':
			where = "WHERE nb.npa=" + call_flow.call_flow.ringto.substring(0,3);
			break;
		case 'PercentageBasedRoute': //percentage route
			var numbers = [];
			for(var x in call_flow.ringto_percentage) {
				numbers.push(call_flow.ringto_percentage[x].ringto.substring(0,3));
			}
			numbers = numbers.join();
			where = "WHERE nb.npa IN("+numbers+")";
			break;
		case 'ivr':
			var numbers = [];
			for(var x in call_flow.ivrs) {
				if(call_flow.ivrs[x].ivr.target_did && call_flow.ivrs[x].ivr.target_did != 'hangup') {
					numbers.push(call_flow.ivrs[x].ivr.target_did.substring(0,3));
				}
				//also get the default ring to number for a geo route type ivr option
				else if(call_flow.ivrs[x].ivr.route_type && call_flow.ivrs[x].ivr.route_type == 'geo') {
					numbers.push(call_flow.ivrs[x].ivr.default_ringto.substring(0,3));
				}
			}
			numbers = numbers.join();
			if(numbers.length < 1){
				where = "WHERE nb.npa = 000";
			}else{
				where = "WHERE nb.npa IN("+numbers+")";
			}
			break;
		default:
			where = "WHERE nb.npa = 000";
	}
	var qry = "SELECT * FROM npa_blacklist as nb "+where  ;
	appModel.ctPool.query(qry, function(err, result) {
		callback(err, result);
	});
}
function spCreateCallFlows(data, ou_id, user_id, isMigrated, billing_id,callback,log_auth){
	var ctTrans = new ctTransactionModel.begin(function(err){
		if (err){
			callback(err);
			return;
		}
			var vendor_id;
			var returnData = {};
			var provisioned_route_id;
			var thirdNums = {};
			var provisioned_route_ids = '';
			var callflow_organizational_unit_id;

			async.eachSeries(data.call_flows, function(call_flow, cb){
				if(call_flow.phone_number)
					vendor_id = call_flow.phone_number.vendor_id;
				callflow_organizational_unit_id = call_flow.call_flow.organizational_unit_id
				var isCallFromMigrationTool = false;
				if(call_flow.call_flow.isCallFromMigrationTool !== undefined && call_flow.call_flow.isCallFromMigrationTool === true){
					isCallFromMigrationTool = true;
					delete call_flow.call_flow['isCallFromMigrationTool'];
				}
				var isPremium = false;
				//check npa against npa blacklist table
				npaCheck(call_flow, function(err, result) {
					if (err) { return cb("Failed to lookup NPA blacklist. "+err); }
					if(result[0] && result[0].npa) { return cb("The specified ring to area code "+result[0].npa+" is not allowed. Please contact customer service at 855-889-3939 for assistance."); }

					var call_flow_status = 'active';
					if (data.status !== '') {
						call_flow_status = data.status;
					} else if (call_flow.provisioned_route.status) {
						call_flow_status = call_flow.provisioned_route.status;
					} else if (call_flow.call_flow.status) {
						call_flow_status = call_flow.call_flow.status;
					}
					if(call_flow_status === "referral") {
						var referralEndDate = data.referral.referral_end_date;
						var referralPHoneNumber = data.referral.referral_phone_number;
						var campaignEndDate = data.referral.campaign_end_date;
					}
					async.waterfall([
						function(cb1){
							async.parallel({
								prids: function(cb3){
									//Need to get the the ous provisioned route ids to get the blacklisted numbers.
									async.waterfall([
										function(cb2) {
											orgUnitModel.ouAndDescendents(call_flow.call_flow.organizational_unit_id, function(ous){
												cb2(null,ous);
											});
										},
										function(ous,cb2) {
											var qry = "SELECT string_agg(CAST(provisioned_route_id as varchar), ',') FROM "+table+" WHERE provisioned_route_ou_id in ("+ous+")";
											ctTrans.select(qry, function(err, prids){
												provisioned_route_ids = prids;
												cb2(null);
											});
										}
									],
									function(err){
										if (err) {
											cb3(err);
										} else {
											cb3(null);
										}
									});//async waterfall cb2
								},
								unique: function(cb3){
									provisionedRoutes.checkUniqueCallFlow(call_flow.provisioned_route.name,data.campaign.id, null, function(err) {
										cb3(err);
									});
								},
								pn: function(cb3) {
									// order numbers that are not from our inventory (selected through third party vendors)
									if (call_flow.phone_number !== undefined && call_flow.phone_number.number !== '' && call_flow.phone_number.source !== 'inventory' && call_flow.phone_number.source !=='special_inventory') {
										switch(parseInt(call_flow.phone_number.vendor_id)) {
											case 9999:
												cb3(null);
												break;
											case 2:
												var vitelityModel = require('./vitelityModel');
												var did = [call_flow.phone_number.number];
												vitelityModel.orderNumber(did, 'selectedNumber',function(err, result){
													if(err)
														cb("Number is not available for provisioning");
													else{
														console.log('New vitelity phone number id '+JSON.stringify(result));
														call_flow.phone_number.id = result[did].id; // set the ID so it's considered part of our inventory
														cb3(null);
													}
												});
												break;
											case 7:
											// JAW include ouid and prid for ordering a number
												var bandwidthModel = require('./bandwidthModel');
												if(call_flow.phone_number.number){
													var did = [call_flow.phone_number.number];
												}else{
													var did = [call_flow.call_flow.tracking_number];
												}

												var number_id;
												var qry = "SELECT number_id FROM phone_number WHERE number_str = '"+did+"'";
												ctTrans.select(qry, function(err, row){
													if(row.length > 0) {
														number_id = row[0].number_id;
												}
													if(number_id) {
														call_flow.phone_number.id = parseInt(number_id);
														cb3(null);
													} else {
												bandwidthModel.orderNumber(did, 'selectedNumber', function(err, result) {
													if (err) {
														cb("Number is not available for provisioning");
													} else {
														call_flow.phone_number.id = result[did].id; // set the ID so it's considered part of our inventory
														cb3(null);
															}
														});
													}
												});
												break;
												case 10001:
											// JAW include ouid and prid for ordering a number
												if(call_flow.phone_number.number){
													var did = [call_flow.phone_number.number];
												}else{
													var did = [call_flow.call_flow.tracking_number];
												}

												var number_id;
												var number_status;
												var qry = "SELECT number_id, number_status FROM phone_number WHERE number_str = '"+did+"'";
												ctTrans.select(qry, function(err, row){
													if(row.length > 0) {
														number_id = row[0].number_id;
														number_status = row[0].number_status
													}
													if(number_status !== "provisioned"){
														if(number_id) {
															call_flow.phone_number.id = parseInt(number_id);
															cb3(null);
														} 
														else {
	
															shoutPointModel.orderNumber(did, ctTrans, false, function(err, result) {
																if (err) {
																	console.log('Received error', err);
																	cb("Number is not available for provisioning");
																} 
																else {
																	//console.log('New bandwidth phone number id ',result[did].id);
																	call_flow.phone_number.id = result[did].id; // set the ID so it's considered part of our inventory
																	cb3(null);
																}
															});
														}
													}else{
														cb("Number is not available for provisioning");
													}
												});
												break;
											default:
												cb3(null);
												break;

										}
									} else {
										cb3(null);
									}
								},
								pr: function(cb3){
									if (call_flow.provisioned_route) {
										var provisionedRouteData = {
											provisioned_route_ou_id: call_flow.provisioned_route.org_unit_id,
											route_type: call_flow.provisioned_route.route_type,
											provisioned_route_name: call_flow.provisioned_route.name,
											provisioned_route_status: call_flow_status,
											channel_id: call_flow.channel.id
										};
										
										if(call_flow.provisioned_route.repeat_interval != undefined && call_flow.provisioned_route.repeat_interval != null){
											provisionedRouteData.repeat_interval = call_flow.provisioned_route.repeat_interval;
										}
										if (call_flow.provisioned_route.call_value !== undefined && call_flow.provisioned_route.call_value !== null && call_flow.provisioned_route.call_value !== '') {
											provisionedRouteData.call_value = call_flow.provisioned_route.call_value;
										}else{
											provisionedRouteData.call_value = null;
										}

										if(call_flow.call_flow.webhook_id){
											provisionedRouteData.webhook_id = call_flow.call_flow.webhook_id;
										}

										if(call_flow_status === "referral") {
											provisionedRouteData.referral_end_date = referralEndDate;
										}

										if (call_flow.provisioned_route.post_IVR_enabled !== undefined && call_flow.provisioned_route.post_IVR_enabled !== null && call_flow.provisioned_route.post_IVR_enabled !== '') {
											provisionedRouteData.is_post_call_ivr_enabled = call_flow.provisioned_route.post_IVR_enabled;
										}
										if(call_flow.call_flow.overflowNumbers && call_flow.call_flow.overflowNumbers.length >0 ){
											if(call_flow.call_flow.overflowNumbers.length == 1 && call_flow.call_flow.isSimultaneousRing == false){
												provisionedRouteData.hunt_type = 'overflow';
											}
											else if(call_flow.call_flow.overflowNumbers.length > 0 && call_flow.call_flow.isSimultaneousRing == true){
												provisionedRouteData.hunt_type = 'simultaneous';
											}
											else if(call_flow.call_flow.overflowNumbers.length > 1 && call_flow.call_flow.isSimultaneousRing == false){
												provisionedRouteData.hunt_type = 'rollover';
											}
										}else{
											provisionedRouteData.hunt_type = null;	
										}
										
										var insertData = {
											which: 'insert',
											table: table,
											values: provisionedRouteData
										};
										ctTrans.queryRet(insertData, function(err, result){
											if(err){
												return cb3(err);
											}
											returnData.provisioned_route_id = result.insertId;
											provisioned_route_id = result.insertId;
											cb3(null, provisioned_route_id);
										});
									} else {
										cb3('Provisioned Route Missing');
									}
								}
								},
								function (err,results){
									cb1(err, results.pr);
								}
							);
						},
						function(provisioned_route_id, cb1){
							async.series([
								function(cb2){
									var orgComponentCountModel = require('../models/orgComponentCountModel');
									var num_id;
									var cnt = 1; // set default amount in increment
									var cmpt = 18; // set default component_id to active "Numbers"
									var counter_ou_id = call_flow.provisioned_route.org_unit_id;
									if (call_flow.number_pool !== undefined) { // need to get count of numbers in pool
										// **********************************************************************************************
										// TODO:  add field sent from front-end of total count of numbers in the number pool used.
										if (call_flow.number_pool.number_quantity !== undefined) { cnt = call_flow.number_pool.number_quantity; }
									}
									//if (call_flow_status === 'inactive') { cmpt = 22; } // set to component for counting "Inactive Numbers"
									var isReservedOnly = false;

									if(call_flow.phone_number){
										counter_ou_id = call_flow.phone_number.number_ou_id;
										num_id = call_flow.phone_number.id;
									}
									// increment the component count for org unit
									if(call_flow && call_flow.phone_number && call_flow.phone_number.source && call_flow.phone_number.source === 'inventory'){
										async.waterfall([
											function(cb6){
												var qry = "SELECT pn.number_status, pd.org_unit_id from phone_number pn JOIN phone_detail pd ON(pd.number_id =pn.number_id) WHERE pn.number_status = 'reserved' AND pn.number_id = "+ num_id ;
												ctTrans.query(qry,function(err,result){
													if(err){return cb6(err);}
													else{
														if(result.length > 0){
															isReservedOnly = true;
															counter_ou_id = result[0].org_unit_id;
															cb6();
														}else{
															cb6();
														}
													}
												});
											},
											function(cb6){
												 var qry = "SELECT occ.component_id, occ.count_total, occ.secondary_total FROM org_component oc JOIN org_component_count occ ON (oc.component_id = occ.component_id) WHERE number_id = "+ call_flow.phone_number.id +" AND component_type = 'number'";
													var compQry = {
														which: 'query',
														qry: qry
													};
													ctTrans.query(compQry, function(err, ret){
														if (err) {cb6(err);}
														else {
															if(ret.length > 0 && ret[0].component_id !== undefined ){isPremium = true; isReservedOnly = false};
															cb6(null, ret);
														}
													});
											},
											function(ret,cb6){
												if(isPremium && !isReservedOnly){
													if (call_flow_status !== 'referral') {
														if(counter_ou_id != call_flow.provisioned_route.org_unit_id){
															updatePremiumComponent(ctTrans, call_flow.provisioned_route.org_unit_id ,num_id,function(err){
																if (err) { return cb6(err); }
																if(call_flow_status == 'active'){
																	orgComponentCountModel.increment(ctTrans, ret[0].component_id, call_flow.provisioned_route.org_unit_id, cnt, function (err) {
																		if (err) { return cb6(err); }
																		orgComponentCountModel.decrementSubTotal(ctTrans, ret[0].component_id, call_flow.provisioned_route.org_unit_id, cnt, function (err) {
																			if (err) { return cb6(err); }
																			cb6(null);
																		});
																	});
																}else if(call_flow_status == 'inactive'){
																	cb6(null);
																}else{
																	cb6('Not able to determine callflow status');
																}																		
															});
														}else{
															if(call_flow_status == 'active'){
																orgComponentCountModel.increment(ctTrans, ret[0].component_id, call_flow.provisioned_route.org_unit_id, cnt, function (err) {
																	if (err) { return cb6(err); }
																		orgComponentCountModel.decrementSubTotal(ctTrans, ret[0].component_id, call_flow.provisioned_route.org_unit_id, cnt, function (err) {
																			if (err) { return cb6(err); }
																			cb6(null);
																		});
																	});
															}else if(call_flow_status == 'inactive'){
																cb6(null);
															}else{
																cb6('Not able to determine callflow status');
															}
														}
													} else{
														if(counter_ou_id != call_flow.provisioned_route.org_unit_id){
															updatePremiumComponent(ctTrans, call_flow.provisioned_route.org_unit_id ,num_id, function(err){
																if (err) { return cb6(err); }
																cb6(null);
															});
															}else{
																orgComponentCountModel.increment(ctTrans, 28, call_flow.provisioned_route.org_unit_id, cnt, function (err) {
																	if (err) { return cb6(err); }
																		cb6(err);
																	});
															}
													}
												}else if(!isPremium && isReservedOnly){
													orgComponentCountModel.decrement(ctTrans, 930, counter_ou_id, cnt, function (err) {
														if (err) { return cb6(err); } else{
															if (call_flow_status == 'active' ) {
																orgComponentCountModel.increment(ctTrans, cmpt, call_flow.provisioned_route.org_unit_id, cnt, function (err) {
																	if (err) { return cb6(err); }
																	cb6(null);
																});
															} else if(call_flow_status == 'inactive') {
																orgComponentCountModel.incrementSubTotal(ctTrans, cmpt, call_flow.provisioned_route.org_unit_id, cnt, function (err) {
																	if (err) { return cb6(err); }
																	cb6(null);
																});
															}else if(call_flow_status == 'referral'){
																orgComponentCountModel.increment(ctTrans, 28, call_flow.provisioned_route.org_unit_id, cnt, function (err) {
																	if (err) { return cb6(err); }
																	cb6(null);
																});
															}else{
																cb6('not able to identify callflows status');
															}
														}
													});
												}else{
													if (call_flow_status == 'active' ) {
														orgComponentCountModel.increment(ctTrans, cmpt, call_flow.provisioned_route.org_unit_id, cnt, function (err) {
															if (err) { return cb6(err); }
															cb6(null);
														});
													} else if(call_flow_status == 'inactive') {
														orgComponentCountModel.incrementSubTotal(ctTrans, cmpt, call_flow.provisioned_route.org_unit_id, cnt, function (err) {
															if (err) { return cb6(err); }
															cb6(null);
														});
													}else if(call_flow_status == 'referral'){
														orgComponentCountModel.increment(ctTrans, 28, call_flow.provisioned_route.org_unit_id, cnt, function (err) {
															if (err) { return cb6(err); }
															cb6(null);
														});
													}else{
														cb6('not able to identify callflows status');
													}
												}
											}],
								      function(err) {
								        if (err) { return cb2(err); }
								        cb2(null);
								      });
									}else{
										if (call_flow_status == 'active' ) {
											orgComponentCountModel.increment(ctTrans, cmpt, call_flow.provisioned_route.org_unit_id, cnt, function (err) {
												if (err) { return cb2(err); }
												cb2(null);
											});
										} else if(call_flow_status == 'inactive') {
											orgComponentCountModel.incrementSubTotal(ctTrans, cmpt, call_flow.provisioned_route.org_unit_id, cnt, function (err) {
												if (err) { return cb2(err); }
												cb2(null);
											});
										}else if(call_flow_status == 'referral'){
											orgComponentCountModel.increment(ctTrans, 28, call_flow.provisioned_route.org_unit_id, cnt, function (err) {
												if (err) { return cb2(err); }
												cb2(null);
											});
										}else{
											cb2('not able to identify callflows status');
										}
									}
								},
								function(cb2){

									// add special inventory numbers to inventory
									// if(call_flow.phone_number && call_flow.phone_number.source ==='special_inventory'){
									// 	call_flow.phone_number.source = 'inventory';
									// }

									// add inventory numbers to provisioned route
									if (call_flow.phone_number !== undefined && call_flow.phone_number.id !== '') {
										var provisionedRouteNumberData = {
											provisioned_route_id: provisioned_route_id,
											phone_number_id: call_flow.phone_number.id
										};
										var insertData = {
											which: 'insert',
											table: 'provisioned_route_number',
											values: provisionedRouteNumberData
										};
										ctTrans.queryRet(insertData, function(err, result){
											cb2(err, result);
										});
									} else if (call_flow.number_pool !== undefined && call_flow.number_pool.id !== '') {
										var provisionedRouteNumberData = {
											provisioned_route_id: parseInt(provisioned_route_id),
											pool_id: parseInt(call_flow.number_pool.id)
										};
										var insertData = {
											which: 'insert',
											table: 'provisioned_route_number',
											values: provisionedRouteNumberData
										};
										ctTrans.query(insertData, function(err, result){
											cb2(err, result);
										});
									} else {
										cb2();
									}
								},
								function(cb2){
									if (call_flow.phone_number === undefined) {
										cb2(null);
									} 
									else{
										if (call_flow.phone_number.id !== '' && (call_flow.phone_number.source === 'inventory' || call_flow.phone_number.source === 'special_inventory')) {
										phoneNumberData = {
											number_status: 'provisioned',
										};

										if(call_flow_status === "referral") {
											phoneNumberData.number_status = 'referral';
										}

										var updateData = {
											which: 'update',
											table : 'phone_number',
											values: phoneNumberData,
											where: " WHERE number_id = " + call_flow.phone_number.id + " AND ( number_status = 'unprovisioned' OR number_status = 'reserved' )"
										};
										ctTrans.queryRet(updateData, function(err, result){
											if (err) {
												cb2(err);
												return;
											}
												if (result.rowCount < 1) {
													err ='Phone Number Provisioning Error.';
													cb2(err);
												}

												updateData.table = 'phone_detail';
												updateData.values = { app_id: 'CT', provisioned_route_id: provisioned_route_id };
												updateData.where = " WHERE number_id = " + call_flow.phone_number.id;

												//if we are migration from AMP3 tool then no need to set the app_id as CT for now when we fully migrate then we set the app_id as CT
												if(isCallFromMigrationTool) {
													delete updateData.values.app_id;
												}
												ctTrans.queryRet(updateData, function(err, result) {
													if (err) console.log('@@@@@@@@ ERR updating phone_detail', err);
											cb2(err);
										});
											});
										} 
										else if (call_flow.phone_number.source === 'shoutpoint') {
											var updateData = {
												which: 'update',
												table: 'phone_number',
												values: { number_status: 'provisioned' },
												where: " WHERE number_id = " + call_flow.phone_number.id
											};
											ctTrans.queryRet(updateData, function(err, result){
												if (err) {
													cb2(err);
													return;
												}
												if (result.rowCount < 1) {
													err ='Phone Number Provisioning Error.';
													cb2(err);
												}

												updateData.table = 'phone_detail';
												updateData.values = { app_id: 'CT', provisioned_route_id: provisioned_route_id, vendor_id: call_flow.phone_number.vendor_id };
												//if we are migration from AMP3 tool then no need to set the app_id as CT for now when we fully migrate then we set the app_id as CT
												if(isCallFromMigrationTool) {
													delete updateData.values.app_id;
												}

												ctTrans.queryRet(updateData, function(err, result) {
													if (err) { console.log('@@@@@@@@@ ERR Updating phone_detail:', err);}
													cb2(err);
												});
											});
										}
									}
								},
								function(cb2){
									//Update phone detail table with provisioned route id.
									if (call_flow.phone_number !== undefined && call_flow.phone_number.id !== '') {
										var current_date = f.mysqlTimestamp();
										phoneDetailData = {
											provisioned_route_id: provisioned_route_id,
											org_unit_id: call_flow.call_flow.organizational_unit_id,
											number_updated: current_date
										};
										var updateData = {
											which: 'update',
											table : 'phone_detail',
											values: phoneDetailData,
											where: " WHERE number_id = " + call_flow.phone_number.id
										};
										ctTrans.queryRet(updateData, function(err, result){
											if (err) {
												cb2(err);
												return;
											}
											if (result.rowCount < 1) err ='Phone Detail Update Error.';
											cb2(err);
										});
									} else {
										cb2();
									}
								},
								function(cb2){
									async.series([
										function(cb3){
											if (call_flow.number_pool && call_flow.number_pool.id !== '') {
												var numberPool = require('./newNumberPoolModel');
												var updateData = {
													pool_id : parseInt(call_flow.number_pool.id),
													provisioned_route_id: parseInt(provisioned_route_id), 
													pool_name: call_flow.provisioned_route.name, 
													status: 'active'
												};
												numberPool.update(updateData, ctTrans,function(err, data){
													if(err){cb3(err);}
													cb3(null);
												});
												returnData.number_pool = call_flow.number_pool.id + ' Updated.';
											} else {
												cb3();
											}
										},
										function(cb3){
											if (call_flow.dni_setting) {
												var	dniSettingData =  {
													provisioned_route_id: provisioned_route_id,
													org_unit_id:      call_flow.dni_setting.org_unit_id,
													destination_url:      call_flow.dni_setting.destination_url,
													dni_type:             call_flow.dni_setting.dni_type,
													dni_element:          call_flow.dni_setting.dni_element,
													referrer:             call_flow.dni_setting.referrer,
													referrer_type:        null,
												};
												if(call_flow.dni_setting.referrer_type) {
													dniSettingData.referrer_type = call_flow.dni_setting.referrer_type;
												}
												if(call_flow.dni_setting.dni_ttl) {
													dniSettingData.dni_ttl = call_flow.dni_setting.dni_ttl;
												}
												dniSettingModel.create(ctTrans, dniSettingData,function(err){
													cb3(err);
												});
											}else{
												cb3(null);
											}
										}
									],
									function(err){
										cb2(err);
									});
								},
								function(cb2){
									if (data.campaign && data.campaign.id && data.campaign.id !== '') {
										var campaignProvisionedData = {
											campaign_id: data.campaign.id,
											provisioned_route_id: provisioned_route_id
										};
										var insertData = {
											which: 'insert',
											table: 'campaign_provisioned_route',
											values: campaignProvisionedData
										};
										ctTrans.query(insertData, function(err) {
											cb2(err);
										});
									} else {
										cb2('Missing Campaign Id.');
									}
								},
								function(cb2){
									if (call_flow.call_flow.customSourceList !== undefined && call_flow.call_flow.customSourceList !== []) {
										var customSourceData = {
											provisioned_route_id: provisioned_route_id,
											customSourceList: call_flow.call_flow.customSourceList
										};
										customSourceModel.addCustomSource(ctTrans,customSourceData,function(err,result){
											if(err){ return cb2(err);}
											cb2(null);
										});
									}else {
										cb2(null);
									}
								},
								function(cb2){
									if (call_flow.call_flow) {
										//TODO: Need to add this to transaction roll back.
										var callFlows = require("../models/callFlowModel");
										var whisper_message = 'blank://';
										switch (call_flow.call_flow.whisper_type) {
											case 'text':
												whisper_message = 'tts://' + call_flow.call_flow.whisper_message;
											break;
											case 'file':
												whisper_message = 'file://' + call_flow.call_flow.whisper_message + '.wav';
											break;
										}
										var message = 'blank://';
										switch (call_flow.call_flow.message_type) {
											case 'text':
												message = 'tts://' + call_flow.call_flow.message;
											break;
											case 'file':
												message = 'file://' + call_flow.call_flow.message + '.wav';
											break;
										}

										var vm_message = 'blank://';
										call_flow.call_flow.vm_message = call_flow.call_flow.vm_message === undefined ? "" : call_flow.call_flow.vm_message;
										switch (call_flow.call_flow.vm_type) {
											case 'text':
												vm_message = 'tts://' + call_flow.call_flow.vm_message;
											break;
											case 'file':
												vm_message = 'file://' + call_flow.call_flow.vm_message + '.wav';
											break;
										}
										var record_until = null;
										if (call_flow.call_flow.record_until && call_flow.call_flow.record_until !== ''){
											record_until = call_flow.call_flow.record_until;
										}

										if(call_flow.call_flow.voicemail_rings_count === undefined)
											call_flow.call_flow.voicemail_rings_count = 3

										////THIS HAS BEEN ADDED FOR AMP
										var messageEnabled = call_flow.call_flow.message_enabled;
										var whisperEnabled = call_flow.call_flow.whisper_enabled;

										if (messageEnabled === 1) {
											messageEnabled = true;
										} else if (messageEnabled === 0){
											messageEnabled = false;
										}

										if (whisperEnabled === 1) {
											whisperEnabled = true;
										} else if (whisperEnabled === 0){
											whisperEnabled = false;
										}

										if(call_flow.call_flow.blocked_recording){
											record_until = '2015-08-08'
									 	}
										

										var callFlowData = {
											provisioned_route_id: provisioned_route_id,
											ouid: call_flow.call_flow.organizational_unit_id,
											dnis: call_flow.call_flow.tracking_number,
											routable_type: call_flow.call_flow.route_type,
											play_disclaimer: call_flow.call_flow.play_disclaimer,
											record_until: record_until,
											status: call_flow_status,
											whisper_enabled: whisperEnabled,
											message_enabled: messageEnabled,
											webhook_enabled:false,
											spam_filter_enabled: false,
											ring_delay: (call_flow.call_flow.voicemail_rings_count * 6),
											vm_message: vm_message,
											country_code : 1											
										};
										if(call_flow.call_flow.route_type == 'outbound' &&  call_flow.provisioned_route.callerid !== null){
											callFlowData.outboundData = {
												pin: call_flow.provisioned_route.pin,
												callerid: call_flow.provisioned_route.callerid
											}
										}

										if(call_flow.call_flow.vm_enabled !== undefined && call_flow.call_flow.vm_enabled !== null){
											if (call_flow.call_flow.route_type == 'PercentageBasedRoute' && call_flow.call_flow.route_type == 'outbound'){
												callFlowData.vm_enabled = false;
											}else{
												callFlowData.vm_enabled = call_flow.call_flow.vm_enabled
											}
										}
										if(call_flow.call_flow.webhook_id){
											callFlowData.webhook_enabled = true;
										}

										if(call_flow.call_flow.spam_active){
											callFlowData.spam_filter_enabled = true;
											callFlowData.spam_threshold = 3;
										}

										if (call_flow.call_flow.ringto){
											callFlowData.default_ringto = call_flow.call_flow.ringto;
										}
										if (call_flow.call_flow.whisper_message) {
											callFlowData.whisper_message = whisper_message;
										}
										if (call_flow.call_flow.message) {
											callFlowData.message = message;
										}
										if (call_flow.call_flow.sms_enabled && call_flow.call_flow.sms_enabled == true) {
											callFlowData.sms_enabled = true;
										}else{
											callFlowData.sms_enabled = false;
										}

										if(call_flow.call_flow.dnis_as_cid === "caller_id" || call_flow.call_flow.dnis_as_cid == undefined){
											callFlowData.dnis_as_cid = false;
										}else{
											callFlowData.dnis_as_cid = true;
										}

										if (call_flow.call_flow.ringto === ''){
											callFlowData.default_ringto = null;
										}
										if(call_flow_status === "referral") {
											callFlowData.referral_number = referralPHoneNumber;
											callFlowData.referral_date = campaignEndDate;
										}
										if(call_flow.call_flow.overflowNumbers && call_flow.call_flow.overflowNumbers.length >0 && call_flow.call_flow.isSimultaneousRing == true) {
											call_flow.call_flow.hunt_type = 'Simultaneous';
										}
										if(call_flow.call_flow.overflowNumbers && call_flow.call_flow.overflowNumbers.length >0 && call_flow.call_flow.isSimultaneousRing == false) {
											call_flow.call_flow.hunt_type = 'Rollover';
										}
										
										switch (call_flow.call_flow.route_type) {
											case 'ivr':
											  if(!isMigrated){
												callFlowData.ivrs = call_flow.multiIvrs
												}
												else{
													callFlowData.ivrs = call_flow.multiIvrs.ivrActions;
												switch (call_flow.multiIvrs.message_type) {
													case 'text':
													callFlowData.message = 'tts://' + call_flow.multiIvrs.message;
													callFlowData.message_enabled = true;
													break;
													case 'file':
													callFlowData.message = 'file://' + call_flow.multiIvrs.message + '.wav';
													callFlowData.message_enabled = true;
													break;
												}
												}
											break;
											case 'geo':
												if (!call_flow.geo_route || !call_flow.geo_options) {
													cb2('Missing Geo Data.');
													return;
												}
												callFlowData.geo_route = call_flow.geo_route;
												callFlowData.geo_options = call_flow.geo_options;
											break;
											case 'PercentageBasedRoute':
												callFlowData.ringto_percentage = call_flow.ringto_percentage;
												callFlowData.routable_type = "PercentageBasedRoute";
											break;
											case 'schedule': 
												callFlowData.schedule_data=call_flow.provisioned_route.schedule_data;
											break;
										}

										if (call_flow.route_type) {
											callFlowData.route_type = call_flow.route_type;
										}
										var values = [];
										var loggerData = {
											'ouid':ou_id,
											'userid':user_id,
											'log_auth': log_auth
										};
										async.series([
											function(cb4) {
												if(callFlowData.status === 'active') {
													var camapaignModel = require("./campaignModel");
													if (data.campaign && data.campaign.id && data.campaign.id !== '') {
														data.campaign.status = callFlowData.status;
														camapaignModel.setCampaignStatus(data,function(err){
															if(err) {
																cb4(err);
																//return;
															}
															cb4(null);
														});
													}
												}else{
													cb4(null);
												}
											},
											function(cb4) {
												if(call_flow.call_flow.overflowNumbers && call_flow.call_flow.overflowNumbers.length > 0){

													overFlowNumberModel.save(call_flow.call_flow.overflowNumbers, callFlowData.provisioned_route_id, call_flow.call_flow.hunt_type, ctTrans,callFlowData.provisioned_route_id, function(err, hunt_option_id){
														if(hunt_option_id){
															callFlowData.hunt_option = hunt_option_id;
														}
														cb4(err, null);
													});
												}else{
													cb4(null);
												}
											},
											function(cb4){
												callFlows.create(ctTrans, callFlowData,isMigrated, loggerData, function(err, d){
														cb4(err, d);
												}); 
											}
										],
										function(err){
											if (err) {
												cb2(err);
											} else {
												cb2(null);
											}
										});//async waterfall cb3
										
									}  else {
										cb2('Missing Call Flow.');
									}
								},
								function(cb2){
									if(call_flow_status === "referral") {
										var scheduleData = {
											start_date: referralEndDate,
											next_run_date: referralEndDate,
											end_date: referralEndDate,
											reference_id: provisioned_route_id,
											task_type: 'referral_provision_route',
											task_data: 'delete'
										};
										if(data.campaign.timezone !== undefined && data.campaign.timezone !== null)
											scheduleData.next_run_date = referralEndDate + " " + data.campaign.timezone;
											scheduleModel.create(scheduleData, function(err, data2) {
												cb2(err);
											});
									} else {
										cb2(null);
									}
								},
								function(cb2){
									var post_IVR_enabled = false;
									if(call_flow.provisioned_route.post_IVR_enabled !== undefined && call_flow.provisioned_route.post_IVR_enabled !== null && call_flow.provisioned_route.post_IVR_enabled !== '' && call_flow.provisioned_route.post_IVR_enabled && call_flow.call_flow.post_IVR_data) {
										post_IVR_enabled = true;
									}
									var updateQuery = "UPDATE ce_call_flows SET postcall_ivr_enabled = "+ post_IVR_enabled +" WHERE app_id = 'CT' AND provisioned_route_id = "+ provisioned_route_id;
									ctTrans.query(updateQuery, function(err) {
										if(err){cb2(err);}
											if(call_flow.call_flow.post_IVR_data && call_flow.call_flow.post_IVR_data !== {}) {
												var postIVRData = call_flow.call_flow.post_IVR_data;
												switch(postIVRData.type){
													case 'conversion':
														var postIvrOption = {
															provisioned_route_id : provisioned_route_id,
															post_call_ivr_option_id : 1,
															post_call_ivr_status: 'active',
															created_by: user_id,
															created_on: 'CURRENT_TIMESTAMP',
															updated_by: user_id,
															updated_on: 'CURRENT_TIMESTAMP'
														};
														postIVRData.postIvrOption = postIvrOption;
														postIVRData.currentUser = user_id;
														savePostCallIVR(postIVRData, ctTrans, function(err){
															if(err){cb2(err);}
															cb2(null);
														});
														break;
											
													case 'agentID':
														var postIvrOption = {
															provisioned_route_id : provisioned_route_id,
															post_call_ivr_option_id : 2,
															post_call_ivr_status: 'active',
															created_by: user_id,	
															created_on: 'CURRENT_TIMESTAMP',
															updated_by: user_id,
															updated_on: 'CURRENT_TIMESTAMP'
														};
														postIVRData.postIvrOption = postIvrOption;
														postIVRData.currentUser = user_id;
														savePostCallIVR(postIVRData, ctTrans, function(err){
															if(err){cb2(err);}
															cb2(null);
														});
														break;
													
													case 'conversionAgentID':
														var postIvrOption = {
															provisioned_route_id : provisioned_route_id,
															post_call_ivr_option_id : 3,
															post_call_ivr_status: 'active',
															created_by: user_id,
															created_on: 'CURRENT_TIMESTAMP',
															updated_by: user_id,
															updated_on: 'CURRENT_TIMESTAMP'
														};
														postIVRData.postIvrOption = postIvrOption;
														postIVRData.currentUser = user_id;
														savePostCallIVR(postIVRData, ctTrans, function(err){
															if(err){cb2(err);}
															cb2(null);
														});
														break;											
													default:
													cb2(null);
												}
											}else{
												clearPostCallIvrRoutes(provisioned_route_id, ctTrans, function(err){
													if(err){cb2(err);}
													cb2(null);
												});
											}
										});
								},
								function(cb2){
									var is_routed = true;
									if(call_flow.phone_number){
										var qry = "SELECT pn.number, pd.vendor_id from phone_number pn JOIN phone_detail pd ON (pn.number_id = pd.number_id) where pn.number_id = " + call_flow.phone_number.id;
										ctTrans.select(qry, function(err, numbers){
											var phone_number = numbers[0].number;
											var vendor_id = numbers[0].vendor_id;
											var qry = "SELECT id, billing_id FROM migration_account WHERE is_migration_done = false AND billing_id = " + billing_id;
											ctTrans.select(qry, function(err, billingData){
												if(err){cb2(err);}
												if(billingData && billingData.length < 1){
													//removed check for vendor id 10002. We need to send request to SP API to set number to API routing every time
													shoutPointModel.postSIPNumberToSP(phone_number, function(err){
														if(err){
															console.log("postSipNumberToSP error: "+err)
															return cb2("Number is not available for provisioning number: "+phone_number);
														}

														shoutPointModel.updateCallflowConfig(phone_number, callflow_organizational_unit_id, function(err, res){
															if(err || res == false){
																console.log("updateCallflowConfig error: "+err);
																console.log("isMigrated: "+isMigrated);
																is_routed = false;
																if (!isMigrated) { //// HAD TO ADD THIS TO ALLOW AMP MIGRATED ROUTES --RANDY
																	return cb2("Number is not available for provisioning number: "+phone_number);
																}
															}
															if(err){ is_routed = false; }
															var phoneNumberData = {
																'is_routed' : is_routed,
																'vendor_id' : 10001
															}
															var updateData = {
																which: 'update',
																table : 'phone_detail',
																values: phoneNumberData,
																where: " WHERE number_id = " + call_flow.phone_number.id
															};
															ctTrans.queryRet(updateData, function(err, result){
																if (err) {cb2(err); return;}else{
																	cb2(null);
																} 
															});
														});
													});
													
												}else{
													console.log("Ignoring number porting call came from migration tool for provisione");
													cb2(null);
												}
											});																						
										})
									}else
										cb2(null);	
								},
								function(cb2){
									if (!isPremium && call_flow && call_flow.phone_number && call_flow.call_flow.sms_enabled && call_flow.call_flow.sms_enabled == true) {
										var qry = " SELECT username FROM ct_user where ct_user_id = "+ user_id + " limit 1";
										appModel.ctPool.query(qry, function(err, result) {
											if (err) { cb2(err); }
											if (result.length > 0) {
												var sms_data = {
													'old_status' : false,
													'new_status' : true,
													'org_unit_id' : call_flow.call_flow.organizational_unit_id,
													'did' : call_flow.call_flow.tracking_number,
													'email' : result[0].username,
													'provisioned_route_id' : provisioned_route_id
												};
												shoutPointModel.checkSMSFeature(sms_data, false, function(err){
													if(err){ console.log("Error From Dev Support Ticket", err); }
													cb2(null);
												});
											} else {
												cb2('no user found');
											}
										});
										
									}else{
										cb2(null);
									}
								}
								],
								function(err){
									cb1(err);
								}
							);//async parallel
						}
						],
						function(err){
							cb(err);
						}
					);//async waterfall
				});
				},
				function(err){
					if (err) {
						ctTrans.rollback(function(){
							callback(err);
						});
					} else {
						ctTrans.commit(function(){
							if(!isMigrated){
								var callFlowModel = require("../models/callFlowModel");
								callFlowModel.sendForMigration(provisioned_route_id, function(err){ 
									callback(err,returnData);
								})
							}else{
								callback(null,returnData);
							}
						});
					}
				});//async each;
					
	});//ct transaction begin
}
function savePostCallIVR(postIVRData, ctTrans, callback){
	async.waterfall([
		function(cb1) {
			clearPostCallIvrRoutes(postIVRData.postIvrOption.provisioned_route_id, ctTrans, function(err){
				cb1(err);
			});
		},
		function(cb1){
			var insertData = {
				which: 'insert',
				table: 'post_call_ivr',
				values: postIVRData.postIvrOption
			};
			ctTrans.insert(insertData, function(err, result){
				if(err){ return cb1(err); }
				var postCallIvrId =  result.insertId;
				async.each(postIVRData.prompts, function(prompt, cb){
					var message = '';
					switch (prompt.msgType) {
						case 'text':
							message = 'tts://' + prompt.promt;
						break;
						case 'file':
							message = 'file://' + prompt.promt + '.wav';
						break;
					}
					var promptOption = {
						post_call_ivr_id : postCallIvrId,
						voice_prompt : prompt.type,
						voice_prompt_value: message,
						created_by : postIVRData.currentUser,
						created_on : 'CURRENT_TIMESTAMP',
						updated_by: postIVRData.currentUser,
						updated_on: 'CURRENT_TIMESTAMP'
					}
					if(prompt.noOfDigits > 0){
						promptOption.number_of_digits = prompt.noOfDigits
					}
					var insertData = {
						which: 'insert',
						table: 'post_call_ivr_voice_prompts',
						values: promptOption
					};
					ctTrans.insert(insertData, function(err){
						if(err){ return cb(err);}
							cb(null);
					});
				},function(err){
					if(err){ return cb1(err); }
					var updateQuery = "UPDATE ce_call_flows SET postcall_ivr_id = "+ postCallIvrId +" WHERE app_id = 'CT' AND provisioned_route_id = "+ postIVRData.postIvrOption.provisioned_route_id;
					ctTrans.query(updateQuery, function(err, res) {
						cb1(err);
					});		
				});		
			});
		}
	],
	function(err) {
		callback(err);
	});
}
function clearPostCallIvrRoutes(provisioned_route_id, ctTrans ,callback){
	if(!provisioned_route_id){return callback('In-valide provisioned_route_id');}
	async.waterfall([
		function(cb1) {
			var deleteQuery = "DELETE FROM post_call_ivr WHERE provisioned_route_id = "+provisioned_route_id;
			ctTrans.query(deleteQuery, function(err, res) {
				cb1(null);
			});	
		},
		function(cb1){
			var updateQuery = "UPDATE ce_call_flows SET postcall_ivr_id = NULL WHERE provisioned_route_id = "+provisioned_route_id;
			ctTrans.query(updateQuery, function(err, res) {
				cb1(null);
			});	
		}
	],
	function(err) {
		callback(err);
	});//async waterfall
}
function formatIVR(ivrs, isRecordingBlocked){
        console.log("ivrs",ivrs,isRecordingBlocked);
        _.map(ivrs,function(ivr){
                if(isRecordingBlocked){
                        ivr.ivr.record_enabled = 0;
                        ivr.ivr.play_disclaimer = 'never';
                }
        })
         console.log("ivrs",ivrs,isRecordingBlocked);
        return ivrs;
}
