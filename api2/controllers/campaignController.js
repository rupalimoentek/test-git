var ctTransactionModel = require('../models/ctTransactionModel');
var ceTransactionModel = require('../models/ceTransactionModel');
var controller         = require('./appController');
var f                  = require('../functions/functions');
var campaignModel      = require('../models/campaignModel');
var scheduleModel      = require('../models/scheduleModel');
var ctUserModel        = require('../models/ctUserModel');
var appModel           = require('../models/appModel');
var ctlogger           = require('../lib/ctlogger.js');
var async              = require('async');
var token 			   = require('../lib/token');

var campaign = {
	getCallflowByCampaignIdAction: function(campaignId, res){
		//// FOR AMP 3 DO NOT CHANGE ////
		campaignModel.getCallflowByCampaignId(campaignId, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	searchCallflowByCampaignIdAction: function(req, res){
		//// FOR AMP 3 DO NOT CHANGE ////
		campaignModel.searchCallflowByCampaignIdAction(req, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	moveAction: function(req,callback){
		var ctTrans = new ctTransactionModel.begin(function(err){
			var ceTrans = new ceTransactionModel.begin(function(err){
				async.parallel([
					function(cb){
						//Update campaign ouid and campaign owner user id.
						var data = {
							campaign_id: req.body.campaign.id,
							campaign_ou_id: req.body.campaign.ouid,
							campaign_owner_user_id: req.body.campaign.user_id
						}
						campaignModel.move(ctTrans,data, function(err, data){
							cb(err);
						});
					},
					function(cb){
						cb(null)
					}
				],
				function(err){
					if(err){
						ctTrans.rollback(function(err){});
						ceTrans.rollback(function(err){});
					}else{
						ctTrans.commit(function(err){});
						ceTrans.commit(function(err){});
					}
					controller.responsify(err,'DONE',function(response){
						callback(response);
					})
				}
				);
			});
		});
	},
	getAction: function(req, which, id, timezone,page, res){
		campaignModel.read(which, id, timezone, page, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	getAction1: function(req, which, id, timezone,timezone1, res) {
		var timeZone = timezone + '/'+ timezone1;
		campaignModel.read(which, id, timeZone, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
    statusAction: function(req, callback){
    	var data = req.body;
        var ctTrans = new ctTransactionModel.begin(function (err) {
            if (err) { return callback(err); }
			campaignModel.setStatus(data, req, function (err, result) {
                if (err) {
                    ctTrans.rollback(function () {
                        controller.responsify(err, data, function(response){
                            callback(response);
                        });
                    });
                } else {
					ctTrans.commit(function () {
						if(!req.is_migrated){
							async.each(result.prov_id, function(pr_id, cb){
								var callFlowModel = require("../models/callFlowModel");
								callFlowModel.sendForMigration(pr_id, function(err){ 
									if (err) {cb(null)};
									cb(null);
								});
							},function(err){
								if(data.campaign.status !== '' && data.campaign.status === 'deleted') {
									var newdata = {'org_unit_id':req.ouid, 'ct_user_id':req.userid, 'campaign_id':data.campaign.id, 'log_data': data};
									ctlogger.log(newdata, 'delete', 'campaign','','',req.headers.authorization);
								}
								controller.responsify(err, result.status, function(response){
									callback(response);
								});
							});
						}else{
							if(data.campaign.status !== '' && data.campaign.status === 'deleted') {
								var newdata = {'org_unit_id':req.ouid, 'ct_user_id':req.userid, 'campaign_id':data.campaign.id, 'log_data': data};
								ctlogger.log(newdata, 'delete', 'campaign','','',req.headers.authorization);
							}
							controller.responsify(err, result.status, function(response){
								callback(response);
							});	
						}
	                });
                }
            }, ctTrans);
        });
    },
    getAllUnderOuidAction: function(ouid, res){
    	//For amp3 use, DO NOT CHANGE
    	campaignModel.getAllUnderOuid(ouid, function(err, data){
    		controller.responsify(err, data, function(response){
    			res(response);
    		});
    	});
	},
	getByOuIdCallFlowAction: function(queryParams, res){
		//console.log(campaignIds);
    	campaignModel.getCallFlowByCampaignId(queryParams.campaign_id, function(err, data){
    		controller.responsify(err, data, function(response){
    			res(response);
    		});
    	});
    },

    getAllCampaignCallflow:  function(req, res){
		//console.log(campaignIds);
		var campIds = req.body.campaign_ids.join(",");
    	campaignModel.getCallFlowByCampaignId(campIds, function(err, data){
    		controller.responsify(err, data, function(response){
    			res(response);
    		});
    	});
    },
	getByUserIdAction: function(userid, res){
		campaignModel.getByUserId(userid, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	getByOuIdAction: function(userid, ouid, user_ou_id, userAccess, orglist, timezone, queryParams, res){
		campaignModel.getByOuId(userid, ouid,user_ou_id, userAccess, orglist, timezone, queryParams, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},

	getReportData : function(ouid,userid,userAccess,timezone,orgList, camp_id, res){
		
		campaignModel.getCampCallflowReport(ouid, userid, userAccess, timezone, orgList, camp_id, function(err,data){
			controller.responsify(err, data, function(response){
				res(response);
			});	
		});
	},


	getByOuIdAction1: function(userid, ouid, user_ou_id, userAccess, orglist, timezone, timezone1,res){
		var timeZone = timezone + '/'+ timezone1;
		console.log('controller TIMEZONE: ' + timeZone);
		campaignModel.getByOuId(userid, ouid,user_ou_id, userAccess, orglist, timeZone, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	postAction: function(req, res){
		if(req.body.campaign) {
			campaignModel.checkDuplicateCampaignId(req.body.campaign.external_id, false, req.user.billing_id, function(err, data) {
				if (err) {
					var response = {
			            result: 'error',
			            err: err,
			            json: {}
			        };
                    return res(response);
				}
				var status = '';
				var campaign_status = 'active';
				var campaign_end_date = null;
				if (req.body.campaign.status) {
					status = req.body.campaign.status;
				}
				var dte = moment().tz(req.body.campaign.timezone);
				var campaignJson = {};
				async.waterfall([
					function(callback){
						if (status !== '') {
							campaign_status = status;
						}

						if(dte.isBefore(moment.tz(req.body.campaign.start_date, req.body.campaign.timezone).format())){
							campaign_status = 'inactive';
						}

						if (req.body.campaign.end_date && req.body.campaign.end_date !== '') {
							campaign_end_date = req.body.campaign.end_date;
						}
						var campaignData = {
							campaign_ou_id: req.body.campaign.org_unit_id,
							campaign_ext_id: req.body.campaign.external_id,
							campaign_name: req.body.campaign.name,
							campaign_status: campaign_status,
							campaign_start_date: req.body.campaign.start_date,
							campaign_end_date: campaign_end_date,
							campaign_owner_user_id: req.body.campaign.owner_user_id,
							referral_number: req.body.referral.pnumber,
							campaign_timezone: req.body.campaign.timezone
						};
						var isCallFromMigrationTool = false;
						if(req.body.isCallFromMigrationTool !== undefined && req.body.isCallFromMigrationTool === true) {
							isCallFromMigrationTool = req.body.isCallFromMigrationTool;
						}
						campaignModel.create(campaignData, function(err, data) {
							if (err) {
								callback(err)
								return;
							}
							campaignJson.campaign = {campaign_id: data.insertId};

							// need to add a campaign ID to the list
							var newdata = {'org_unit_id':req.body.campaign.org_unit_id, 'ct_user_id':req.userid, 'campaign_id':data.insertId, 'log_data': campaignData};
							ctlogger.log(newdata, 'insert', 'campaign','','',req.headers.authorization);
							token.addCampaign(req, data.insertId, function(err, retData) {
								if (err) { return res(err); }
							});

							scheduleData = {
								start_date: req.body.campaign.start_date,
								next_run_date: null,
								end_date: campaign_end_date,
								reference_id: data.insertId,
								task_type: 'campaign',
								task_data: 'start'
							};
							// var dt = new Date();
							// var st_dt = new Date(scheduleData.start_date)
							// console.log('\n**********************************\n\n')
							// console.log('server date is '+dt)
							// console.log('start data is '+JSON.stringify(scheduleData))
							// console.log('server date gettime is '+dt.getTime())
							// console.log('start data gettime is '+st_dt.getTime())
							// console.log('\n------------------------------------\n\n')
							if(dte.isBefore(moment.tz(req.body.campaign.start_date, req.body.campaign.timezone).format()) && !isCallFromMigrationTool){
								scheduleData.next_run_date = req.body.campaign.start_date + " " + req.body.campaign.timezone;
							}

							scheduleModel.create(scheduleData, function(err, data2) {

							});
							if(campaign_end_date && !isCallFromMigrationTool){
								scheduleData.next_run_date = campaign_end_date + " " + req.body.campaign.timezone;
								scheduleData.task_data = 'end';
								scheduleModel.create(scheduleData, function(err, data2) {

								});
							} else {
								scheduleData.next_run_date = null;
								scheduleData.task_data = 'end';
								scheduleModel.create(scheduleData, function(err, data2) {

								});

							}
							if (req.body.users && req.body.users.id.length > 0) {
								var campaignCtUserModel = require('../models/campaignCtUserModel');
								campaignCtUserModel.insertMany(req.body.users.id, data.insertId, function(d){
									callback(null,data);
									// create a log record of users added to campaign
									var newdata = {'org_unit_id':req.body.campaign.org_unit_id, 'ct_user_id':req.userid, 'campaign_id':data.insertId, 'log_data': {'user_list':req.body.users.id}};
									ctlogger.log(newdata, 'insert', 'campaign', 'Added users','',req.headers.authorization);
								});
							} else {
								callback(null, data);
							}
					    });
					},
					function(insertData, callback){
						// var dte = new Date();
						// if (!f.inDateRange(req.body.campaign.start_date, campaign_end_date, dte)) {
						// 	status = 'inactive';
						// }

						async.parallel([
							//function(cb){
							//	var orgComponentCountModel = require('../models/orgComponentCountModel');
							//	orgComponentCountModel.increment(null, 2, req.body.campaign.org_unit_id, 1, function(err, result){
							//		console.log("????????????????????????????????");
							//		console.log("????????????????????");
							//		console.log("?????????????");
							//		console.log("INCREMENTING LOWER ONE!!!!!!!!");
							//		console.log("?????????????");
							//		console.log("????????????????????");
							//		console.log("????????????????????????????????");
							//		cb(err);
							//	});
							//},
							function(cb){
								var d = {};
								d.status = status;
								d.campaign = {
									id: insertData.insertId,
								};
								if (req.body.call_flows) {
									var provisionedRouteModel = require("../models/provisionedRouteModel");
									d.call_flows = req.body.call_flows;
									provisionedRouteModel.createCallFlows(d, function(err){
										if (err) {
											campaignJson.error = err;
											cb(err);
										} else {
											cb();
										}
									});
								} else {
									cb(null);
								}
							}
							],
							function(err) {
								callback();
							});
					}
					], function(err){
						controller.responsify(err, campaignJson, function(response){
							res(response);
						});
					}
				);
			});
		}
	},
	putAction: function(req, res) {
		if (req.body.campaign === undefined) {
			return res('No campaign data provided');
		}
		// Check for dupliacte Campaign ID
		campaignModel.checkDuplicateCampaignId(req.body.campaign.external_id, req.body.campaign.id, req.user.billing_id,
			function (err, data) {
				if (err) {
					var response = {
						result:'error',
						err   :err,
						json  :{}
					};
					return res(response);
				}

				// retrieve the original campaign record to check for status change
				var qry = "SELECT campaign_status, referral_number FROM campaign WHERE campaign_id="+req.body.campaign.id;
				appModel.ctPool.query(qry, function (err, orig) {
					if (err) { return res('Failed to query the original campaign record'); }
					var returnJson = {};
					var provisionedRouteModel = require("../models/provisionedRouteModel");
					var callFlowModel = require("../models/callFlowModel");
					var campaign_end_date = null;
					var isEndDatePassed = false;
					var ori_referral_number = orig[0].referral_number;
					var ori_campaign_status = orig[0].campaign_status;
					var referral_phone_number = req.body.referral.pnumber;
					var referal_add_or_remove = false;
					var referral_end_date = null;
					var dte = moment().tz(req.body.campaign.timezone);
					if (req.body.campaign.end_date && req.body.campaign.end_date !== '') {
						campaign_end_date = req.body.campaign.end_date;
						if(dte.isBefore(moment.tz(req.body.campaign.end_date, req.body.campaign.timezone).format()))
							isEndDatePassed = true;
					}
					var status = 'active';
					var campaignStatus = '';
					if (req.body.campaign.status) {
						campaignStatus = req.body.campaign.status;
						status = req.body.campaign.status;
					}
					if(dte.isBefore(moment.tz(req.body.campaign.start_date, req.body.campaign.timezone).format())){
						status = 'inactive';
						campaignStatus = status;
					}
					// If the user select the checkbox again- when the user hits save, the call flows will immediately go into referral
					if(isEndDatePassed === false && campaignStatus === 'inactive' && req.body.referral.pnumber !== null) {
						referral_phone_number = req.body.referral.pnumber;
						//var referralEndDate = new Date(req.body.campaign.end_date);
						//referralEndDate.setDate(referralEndDate.getDate() + 30);
						var referralEndDate = moment(req.body.campaign.end_date).add(30, 'days').format("YYYY-MM-DD HH:mm:SS");
						referral_end_date = referralEndDate;

						referal_add_or_remove = true;
						status = 'referral';
					}
					//If the user does not select the referral checkbox before saving, we will remove the previously saved referral date in the data base
					else if(req.body.referral.pnumber === null && ori_referral_number !== null) {
						//remove phone number from call flow and provisioned route
						referral_phone_number = null;
						referal_add_or_remove = true;
					}
					if(ori_campaign_status ==='inactive' && ori_referral_number !== null){
						var ori_campaign_status = 'referral'
					}
					var logAdded = false;
					async.series([
						function (callback) {
							if (status !== '' && ori_campaign_status !== 'referral') {
								var pr_statusData = {
									provisioned_route:{
										campaign_id:req.body.campaign.id,
										status     :status,
										referal_add_or_remove:referal_add_or_remove,
										referral_phone_number: referral_phone_number,
										referral_end_date: referral_end_date,
										campaign_end_date: campaign_end_date,
										timezone: req.body.campaign.timezone
									}
								};
								provisionedRouteModel.setStatusAll(null, pr_statusData, req, function () {
									callback();
								});
							} else {
								callback();
							}
						},
						function (callback) {
							async.parallel([
									function (cb1) {
										if (req.body.campaign) {
											var campaignData = {
												campaign_id           	:req.body.campaign.id,
												campaign_ext_id       	:req.body.campaign.external_id,
												campaign_name         	:req.body.campaign.name,
												campaign_start_date   	:req.body.campaign.start_date,
												campaign_end_date     	:campaign_end_date,
												campaign_owner_user_id	:req.body.campaign.owner_user_id,
												campaign_timezone		: req.body.campaign.timezone,
												referral_number 	  	:referral_phone_number
											};
											if (campaignStatus !== '') {
												campaignData.campaign_status = campaignStatus;
											}
											campaignModel.update(campaignData, function (data) {
												var newdata = {};
												newdata['org_unit_id'] = (req.body.campaign.org_unit_id ? req.body.campaign.org_unit_id : req.body.campaign.campaign_ou_id);
												newdata['ct_user_id']  = req.userid;
												newdata['campaign_id'] = req.body.campaign.id;
												newdata['log_data']    = campaignData;
												var outhToken = req.headers.authorization;
												// check if log added for camapign status change
												if(!logAdded)
												ctlogger.log(newdata, 'update', 'campaign','','',outhToken);
												scheduleStartData = {
													start_date   :req.body.campaign.start_date,
													next_run_date:req.body.campaign.start_date + " " + req.body.campaign.timezone,
													end_date     :campaign_end_date,
													id           :req.body.campaign.id,
													task_type    :'campaign',
													task_data    :'start'
												};
												scheduleEndData = {
													start_date   :req.body.campaign.start_date,
													next_run_date:req.body.campaign.start_date,
													end_date     :campaign_end_date,
													id           :req.body.campaign.id,
													task_type    :'campaign',
													task_data    :'end'
												};

												if(dte.isBefore(moment.tz(req.body.campaign.start_date, req.body.campaign.timezone).format())){
													scheduleModel.update(scheduleStartData, function (err, data) {});
												}else{
													scheduleStartData.next_run_date = null;
													scheduleModel.update(scheduleStartData, function (err, data) {});
												}

												if (campaign_end_date) {
													scheduleEndData.next_run_date = campaign_end_date + " " + req.body.campaign.timezone;
													scheduleModel.update(scheduleEndData, function (err, data) {
													});
												}
												else {
													scheduleEndData.next_run_date = null;
													scheduleModel.update(scheduleEndData, function (err, data) {
													});
												}

												ctUserModel.getById(req.userid, function (data) {
													returnJson.campaign = {
														id     :req.body.campaign.id,
														message:'Updated.'
													};
													cb1(null);
												});
											});
										} else {
											cb1(null);
										}
									},
									function (cb1) {
										if (req.body.users) {
											var campaignCtUserModel = require('../models/campaignCtUserModel');
											campaignCtUserModel.deleteAll(req.body.campaign.id, function (data) {
												if (req.body.users.id && req.body.users.id.length > 0) {
													campaignCtUserModel.insertMany(req.body.users.id,
														req.body.campaign.id, function (data) {
															cb1(null);
														});
												} else {
													cb1(null);
												}
											});
										} else {
											cb1(null);
										}
									}
								],
								function (err) {
									if (err) {
										callback(err);
									} else {
										callback();
									}

								}
							);
						}
					],
					function (err) {
						controller.responsify(err, returnJson, function (response) {
							res(response);
						});
					});
				});
		});
	},
	getByUserAction: function(req, id, res){
		campaignModel.getIdByRelation('user', id, function(data){
			var ids = [];
			for (var i = 0; i < data.length; i++) {
				ids.push(data[i].id);
			}
			campaignModel.read('campaign', ids.join(','), function(d){
				res(d);
			});
		});
	},
	cfaCampaignSingle: function(campaignId, res){
		campaignModel.cfaCampaignSingle(campaignId, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	updateCampaignEndDateAction: function(req, res){
		campaignModel.updateCampaignEndDate(req, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});

	},
	allowedOwnersAction: function(req,callback) {
		//// FOR AMP3 DO NOT CHANGE
		
		campaignModel.allowedOwners(req, function(err, data){
			controller.responsify(err, data, function(response){
				callback(response);
			});
		});
	}
};


module.exports = campaign;
