var 
	controller				= require('./appController'),
	f 						= require('../functions/functions'),
	yaml 					= require("js-yaml"),
	fs 						= require("fs"),
	d 						= yaml.load(fs.readFileSync('config/directories.yml')),
	provisionedRouteModel 	= require('../models/provisionedRouteModel'),
	ctTransactionModel		= require('../models/ctTransactionModel'),
	ceTransactionModel 		= require('../models/ceTransactionModel'),
	callFlowModel 			= require('../models/callFlowModel'),
	orgUnitModel 			= require('../models/orgUnitModel')
	referralCampaignModel 	= require('../models/referralCampaignModel');

	async = require('async');

var provisionedRoute = {
	moveProvisionedRouteToCampaignAction: function(req,res) {
		provisionedRouteModel.moveProvisionedRouteToCampaign(req,function(err,results){
			controller.responsify(err, results, function(response){
				res(response);
			});
		});
	},

	
	postAction: function(req,res) {
		var error;
		if (req.body.campaign && req.body.campaign.id !== '') {
			var d = {};
			d.status = '';
			/*d.campaign = {
				id: req.body.campaign.id,
			};*/
			d.campaign = req.body.campaign;
			if (req.body.call_flows && req.body.call_flows.length > 0) {
				d.call_flows = req.body.call_flows;
				
				if(d.call_flows[0].call_flow.status !== undefined && d.call_flows[0].call_flow.status === 'referral'){
					console.log("here in referral condition-----");
					referralCampaignModel.campaignReferralData(d.campaign.id, function(err, data) {
						console.log("********campaign data:",data);
						d.referral = {
							referral_end_date : moment(data[0].campaign_end_date).add(30, 'days').format("YYYY-MM-DD HH:mm:SS"),
							referral_phone_number : data[0].referral_number,
							campaign_end_date : moment(data[0].campaign_end_date).format("YYYY-MM-DD HH:mm:SS")
						};
						console.log("d.referral",d.referral);
						
						provisionedRouteModel.createCallFlows(d,req.ouid,req.userid,req, function(err, returnData){
								controller.responsify(err, returnData, function(response){
								res(response);
							});
						},req.headers.authorization);
					});
				} else {
					provisionedRouteModel.createCallFlows(d,req.ouid,req.userid, req,function(err, returnData){
							controller.responsify(err, returnData, function(response){
							res(response);
						});
					},req.headers.authorization);
				}
			} else {
				error = 'Missing call flows.';
			}
		} else {
			error = 'Missing campaign id.';
		}
		if (error) {
			controller.responsify(error, '', function(response){
				res(response);
			});
		}

	},
	putAction: function(req,res){
		provisionedRouteModel.updateCallFlows(req.body,req.ouid,req.userid, req, function(err){
			controller.responsify(err, 'Provisioned Route Updated.', function(response){
				res(response);
			});
		},req.headers.authorization);
	},
	putDeleteAction: function(req,res){
		provisionedRouteModel.putDelete(null, req.body, req, function(err){
			var loggerData = { "org_unit_id":req.ouid, "ct_user_id":req.userid, "call_flow_id":req.body.provisioned_route.ids[0], "data":req.body.provisioned_route };
			ctlogger.log(loggerData, 'delete', 'call_flow','','',req.headers.authorization);
			controller.responsify(err, 'Provisioned Routes Deleted.', function(response){
				res(response);
			});
		});
	},
	deleteAction: function(req, res) {
		var data = { 'provisioned_route': { 'ids':req.params.id } };
		console.log(req.is_migrated);
		provisionedRouteModel.putDelete(null, data, req, function(err) {
			res(err, 'Provisioned Route Deleted.');

			var loggerData = { "org_unit_id":req.ouid, "ct_user_id":req.userid, "call_flow_id":req.body.provisioned_route.ids[0], "data":req.body.provisioned_route };
			ctlogger.log(loggerData, 'delete', 'call_flow','','',req.headers.authorization);
		});
	},
	voicePromptAction: function(req,res){
		var fs = require('fs');
		var transcoder = require('../lib/transcoder');
		var filename = req.files.file.name.split('.')[0];
		var callFlowRecordingModel = require('../models/callFlowRecordingModel');
		var src_path = '/' + req.files.file.path;
		var transcoderData = {
			src_path: src_path,
			dest_path: d.prompt_audio + filename + '.wav',
			newExt: 'wav'
		};
		var callFlowRecordingData = {
			call_flow_recording_ou_id: req.body.org_unit_id,
			call_flow_recording_filename: req.files.file.name.split('.')[0],
			call_flow_recording_name: req.body.name,
			call_flow_recording_type: 'prompt'
		};
		async.parallel([
			function(cb){
				callFlowRecordingModel.create(callFlowRecordingData, function(err, data){
					if (err) {
						cb(err);
					} else {
						cb(null, data.insertId);
					}
				});
			},
			function(cb){
				transcoder.start(transcoderData, function(err, data){
					if (fs.existsSync(src_path)) {
						fs.unlinkSync(src_path);
					}
					if (err) {
						cb(err);
					} else {
						cb(null, 'transcoded');
					}
				});
			}
			],
			function(err, results){
				if (err) {
					res(err);
				} else {
					res({id: results[0], name: req.body.name});
				}
			});
	},
	whisperAction: function(req,res){
		var fs = require('fs');
		var transcoder = require('../lib/transcoder');
		var filename = req.files.audio.name.split('.')[0];
		var callFlowRecordingModel = require('../models/callFlowRecordingModel');
		var src_path = '/' + req.files.audio.path;
		var transcoderData = {
			src_path: src_path,
			dest_path: d.whisper_audio + filename + '.wav',
			newExt: 'wav'
		};
		var callFlowRecordingData = {
			call_flow_recording_ou_id: req.body.org_unit_id,
			call_flow_recording_filename: req.files.audio.name.split('.')[0],
			call_flow_recording_name: req.body.name,
			call_flow_recording_type: 'whisper'
		};
		async.parallel([
			function(cb){
				callFlowRecordingModel.create(callFlowRecordingData, function(err, data){
					if (err) {
						cb(err);
					} else {
						cb(null, data.insertId);
					}
				});
			},
			function(cb){
				transcoder.start(transcoderData, function(err, data){
					if (fs.existsSync(src_path)) {
						fs.unlinkSync(src_path);
					}
					if (err) {
						cb(err);
					} else {
						cb(null, 'transcoded');
					}
				});
			}
			],
			function(err, results){
				if (err) {
					res(err);
				} else {
					res({id: results[0], name: req.body.name});
				}
			});
	},
	getRecordingAction: function(req, ou_id, type, res){
		var callFlowRecordingModel = require('../models/callFlowRecordingModel');
		callFlowRecordingModel.getByOuIds(ou_id, type, function(err, data){
			if (err) {
				res(err);
			} else {
				res(data);
			}
		});
	},
	checkOutboundCallerId: function(req, ou_id, res){
		provisionedRouteModel.checkOutboundCallerId(ou_id, function(err, data){
			controller.responsify(err, data, function (response) {
				if (err) {
				res(err);
			} else {
				res(response);
			}
			});
		});
	},
	checkOutboundCallerIdByCampaign: function(req, ou_id, res){
		provisionedRouteModel.checkOutboundCallerIdByCampaign(ou_id, function(err, data){
			controller.responsify(err, data, function (response) {
				if (err) {
				res(err);
			} else {
				res(response);
			}
			});
		});
	},
	getActionProvisionedRouteIdsByIds : function(req, res){
		console.log("req.body:",req.body);
		provisionedRouteModel.getProvisionedRouteIdsByIds(req.body, function(err, data){
			controller.responsify(err, data, function (response) {
				res(response);
			});
		});
	},
	phoneDetailByProvisionedRouteIds: function(req, res){
		//// FOR AMP3 USE DO NOT CHANGE
		provisionedRouteModel.phoneDetailByProvisionedRouteIds(req, function(err, data){
			controller.responsify(err, data, function (response) {
				res(response);
			});
		});
	},
	poolDetailByProvisionedRouteIds: function(req, res){
		//// FOR AMP3 USE DO NOT CHANGE
		provisionedRouteModel.poolDetailByProvisionedRouteIds(req, function(err, data){
			controller.responsify(err, data, function (response) {
				res(response);
			});
		});
	},
	poolDataByRouteId: function(req,callback){
		//// FOR AMP3 USE DO NOT CHANGE ////
		provisionedRouteModel.poolDataByRouteId(req,function(err,results){	
			controller.responsify(err,results,function(response){
				callback(response);
			});
		});
	},
	routeDataForUpdate: function(req,callback){
		//// FOR AMP3 USE DO NOT CHANGE ////
		var isMigrated = true;
		var provisionedRouteIds = req.query.ids.split(',');

		if (req.query.isMigrated !== undefined) {
			isMigrated = req.query.isMigrated;
		}
		console.log('provisionedRouteIds '+JSON.stringify(provisionedRouteIds))

		var ret = {
			billingOuid: null,
			routes: {}
		};

		var allowedOuids = [];

		async.eachSeries(provisionedRouteIds,function(provisionedRouteId,cb){
			ret.routes[provisionedRouteId] = {};
			async.series([
				function(cb1) {
					////Get provisioned route data
					provisionedRouteModel.getProvisionedRouteById(provisionedRouteId, function(err, data){
						if (err) {
							ret = [];
							return cb1(err);
						}

						if (data.length < 1) {
							return cb1('Invalid provisioned route '+provisionedRouteId);
						}
						
						async.eachSeries(Object.keys(data[0]),function(key,cb2){
							async.series([
								function(cb3) {
									//// Build account ouids list
									if (allowedOuids.length > 0) {
										return cb3(null);
									}
									async.parallel([
										function(cb4) {
											//// Get billing ouid
											orgUnitModel.getBillingId(data[0].provisioned_route_ou_id, function(err,billingId){
												console.log('billing ouid '+billingId)
												if (err) {return cb4(err);}
												ret.billingOuid = billingId;
												cb4(null);
											});
										},
										function(cb4){
											//// Add allowed ouids
											orgUnitModel.getAccountOus(data[0].provisioned_route_ou_id, function(err,ous){
												if (err) {return cb4(err);}
												async.eachSeries(ous,function(ou,cb5){ //// Getting seriously close to async HELL
													allowedOuids.push(ou.org_unit_id);
													cb5(null);
												},
												function(err) {
													cb4(err);
												});
											});
										}
									],
									function(err){
										cb3(err);
									});
								},
								function(cb3){
									//// Build data arrah
								
									ret.routes[provisionedRouteId][key] = data[0][key];

									switch (key) {
										case 'provisioned_route_ou_id':
											var ouidToCheck = data[0][key]
											
											if (allowedOuids.indexOf(ouidToCheck) < 0) {
												return cb3('Route need to belong to same account')
											}
											
											break;
									
										default:
											break;
									}
									cb3(null)
								}
							],
							function(err){
								cb2(err);
							});
						},
						function(err){
							cb1(err);
						});
					});
				},
				function(cb1) {
					////Get call flow data
					callFlowModel.getByProvisionedRoute(provisionedRouteId,isMigrated, function(err, data){
						if (err) {
							ret = [];
							return cb1(err);
						}

						if (data.length < 1) {
							return cb1(null);
						}
						async.forEach(Object.keys(data),function(key,cb2){
							ret.routes[provisionedRouteId][key] = data[key];
							cb2(null)
						},
						function(err){
							cb1(err);
						});
					});
				}
			],
			function(err) {
				cb(err);
			});			
		},
		function(err){
			controller.responsify(err,ret,function(response){
				callback(response);
			});
		});
		// provisionedRouteModel.routeDataForUpdate(req,function(err,results){	
		// 	controller.responsify(err,results,function(response){
		// 		callback(response);
		// 	});
		// });
	},
	byNumberData: function(req,res){
		//// FOR AMP3 USE DO NOT CHANGE
		provisionedRouteModel.byNumberData(req,function(err,data){
			controller.responsify(err,data,function(response){
				console.log("In controller");
				res(response);
			})
		});
	}
};

module.exports = provisionedRoute;