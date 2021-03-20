var ctTransactionModel = require('../models/ctTransactionModel');
var customSourceModel = require('../models/customSourceModel');
var ctUserModel = require('../models/ctUserModel.js');
var controller = require('./appController'),
	orgUnitModel = require('../models/orgUnitModel'),
	ctlogger = require('../lib/ctlogger.js');

var orgUnit = {
	setOrgAllowAdminByOuidAction: function (req, callback) {
		orgUnitModel.setOrgAllowAdminByOuid(req, function (err, results) {
			controller.responsify(err, results, function (response) {
				callback(response);
			});
		});
	},
	// ======= For Export functionality ===============
	getGroupsReport: function (req, res) {
		var ouid = req.params.ouid;
		var userAccess = req.params.userAccess;
		var userid = req.userid;
		orgUnitModel.groupsList(ouid, userAccess, userid, function (err, data) {
			controller.responsify(err, data, function (response) {
				res(response);
			});
		});
	},

	getOrgAllowAdminByOuidAction: function (req, callback) {
		orgUnitModel.getOrgAllowAdminByOuid(req, function (err, results) {
			controller.responsify(err, results, function (response) {
				callback(response);
			});
		});
	},
	getAllAction: function (req, res) {
		orgUnitModel.getAll(function (err, data) {
			controller.responsify(err, data, function (response) {
				res(response);

			});
		});
	},
	getActionInternal: function (req, res) {
		//This is an amp3 endpoint
		orgUnitModel.getById(req.params.id, function (err, data) {
			controller.responsify(err, data, function (response) {
				res(response);
			});
		});
	},
	getAction: function (req, res) {
		var params;
		if (req.params.id) {
			params = { "org_unit_id": req.params.id, "orgList": req.user.orglist };
		}
		else {
			params = { "org_unit_parent_id": req.query.org_unit_parent_id, "orgList": req.user.orglist };
		}
		orgUnitModel.read(params, false, function (data) {
			res(data);
		});
	},
	getOuAndAboveActiveUsersAction: function (ouid, callback) {
		//For Amp3 use DO NOT CHANGE
		orgUnitModel.getOuAndAboveActiveUsers(ouid, function (err, data) {
			controller.responsify(err, data, function (response) {
				callback(response);

			});
		});
	},
	getByIdActionInternal: function (req, callback) {
		//For AMP3 Use DO NOT CHANGE
		orgUnitModel.getByIdInternal(req, function (err, data) {
			controller.responsify(err, data, function (response) {
				callback(response);
			});
		});
	},
	setMigrationAccount: function (req, callback) {
		//For AMP3 Use DO NOT CHANGE
		orgUnitModel.setMigrationAccount(req, function (err, data) {
			controller.responsify(err, data, function (response) {
				callback(response);
			});
		});
	},
	setShoutPointMigrated: function (req, callback) {
		//For AMP3 Use DO NOT CHANGE
		orgUnitModel.setShoutPointMigrated(req, function (err, data) {
			controller.responsify(err, data, function (response) {
				callback(response);
			});
		});
	},
	inAction: function (req, res) {
		//This is for amp3
		console.log("ids " + JSON.stringify(req.query))
		orgUnitModel.in(req.query.ids, function (err, data) {
			controller.responsify(err, data, function (response) {
				res(response);
			});
		});
	},
	extIdExist: function (req, res) {
		var ouData = {
			org_unit_ext_id: req.params.id,
			billing_id: req.params.billingid
		};
		orgUnitModel.checkDuplicateExternalId(ouData, function (err, data) {
			var d = { ext_id_exist: false };
			if (err) {
				d.ext_id_exist = true;
			}
			controller.responsify(null, d, function (response) {
				res(response);
			});
		});
	},
	getAllAction: function (ouid, res) {
		orgUnitModel.ouAndDescendentsInternal(ouid, function (err, data) {
			controller.responsify(err, data, function (response) {
				res(response);
			});
		});
	},
	getAllByTopAction: function (ouid, res) {
		orgUnitModel.topOuDescendentsInternal(ouid, function (err, data) {
			controller.responsify(err, data, function (response) {
				res(response);
			});
		});
	},
	getInfoAction: function (req, res) {
		var params = { "org_unit_id": req.params.id, "orgList": req.user.orglist };
		// first get the org_unit & org_unit_detail information
		orgUnitModel.read(params, true, function (data) {
			var access = require('../controllers/userAccessController');
			var user = require('../models/ctUserModel');
			// now retrieve any custom white label settings
			access.stylingAction(req.params.id, function (err, style) {
				if (data[0] !== undefined)
					data[0].style = style;
				ctUserModel.getAudioList({ "ou_id": req.params.id }, function (err, audioData) {
					data[0].prompts = audioData.prompts;
					data[0].whispers = audioData.whispers;
					data[0].voicemails = audioData.voicemails;
					user.getAudioDownloadSettings(data[0].org_unit_id, function (err, result) {
						data[0].download_audio_enabled = result;
						res(null, data);
					});
				});
			});
		});
	},
	postAction: function (req, res, ctTrans) {
		//// !!!! ctTrans is being used properly here.  For now I added to close it so connection
		//// doesn't stay open but this needs to be re looked at at some time --Randy 3/20/2020 !!!!

		var ctTrans = new ctTransactionModel.begin(function (err) {
			if (req.body.orgUnit.org_unit_ext_id && req.body.orgUnit.org_unit_ext_id !== '' && req.body.orgUnit.org_unit_ext_id !== undefined) {
				orgUnitModel.checkDuplicateExternalId(req.body.orgUnit, function (err, data) {
					if (err) {
						controller.responsify(err, data, function (response) {
							res(response);
						});
						return;
					} else {
						orgUnitModel.create(req, function (err, data) {
							if (err) {
							    ctTrans.rollback(function(rollbackErr){
								controller.responsify(err, data, function (response) {
									res(response);
								});
							    });
							} else {
							    ctTrans.commit(function(commitErr){
								controller.responsify(err, data, function (response) {
									res(response);
								});
							    });
							}
							var newdata = { 'org_unit_id': req.body.orgUnit.org_unit_parent_id, 'ct_user_id': req.userid, 'log_data': req.body.orgUnit };
							ctlogger.log(newdata, 'insert', 'user', 'org group', '', req.headers.authorization);
							///ctTrans.commit(function(){}); //// This is a tempory fix. ctTrans is not being used properly
						}, ctTrans);
					}
				});
			} else {
				orgUnitModel.create(req, function (err, data) {
					if (err) {
					    ctTrans.rollback(function(rollbackErr){
						controller.responsify(err, data, function (response) {
							res(response);
						});
					    });
					} else {
					    ctTrans.commit(function(commitErr){
						controller.responsify(err, data, function (response) {
							res(response);
						});
					    });
					}
					var newdata = { 'org_unit_id': req.body.orgUnit.org_unit_parent_id, 'ct_user_id': req.userid, 'log_data': req.body.orgUnit };
					ctlogger.log(newdata, 'insert', 'user', 'org group', '', req.headers.authorization);
					//ctTrans.commit(function(){}); //// This is a tempory fix. ctTrans is not being used properly
				}, ctTrans);
			}
		});
	},
	putAction: function (req, res) {
		if (req.body.orgUnit.org_unit_ext_id && req.body.orgUnit.org_unit_ext_id !== '' && req.body.orgUnit.org_unit_ext_id !== undefined) {
			orgUnitModel.checkDuplicateExternalId(req.body.orgUnit, function (err, data) {
				if (err) {
					res(err, data);
					return;
				} else {
					orgUnitModel.update(req.body.orgUnit, function (data) {
						res(null, data);

						var newdata = { 'org_unit_id': req.body.orgUnit.org_unit_parent_id, 'ct_user_id': req.userid, 'log_data': req.body.orgUnit };
						ctlogger.log(newdata, 'update', 'user', 'org group', '', req.headers.authorization);
					});
				}
			});
		} else {
			orgUnitModel.update(req.body.orgUnit, function (data) {
				res(null, data);
				var newdata = { 'org_unit_id': req.body.orgUnit.org_unit_parent_id, 'ct_user_id': req.userid, 'log_data': req.body.orgUnit };
				ctlogger.log(newdata, 'update', 'user', 'org group', '', req.headers.authorization);
			});
		}
	},

	getSelfAndChildrenMeta: function (ouId, res) {
		orgUnitModel.getSelfAndChildrenMetaData(ouId, function (err, data) {
			res(err, data);
		});
	},

	//deleteAction: function (ouId, res) {
	//    orgUnitModel.deleteComponentsOfOuAndChildren(ouId, function (err, data) {
	//        res(err, data);
	//    });
	//},
	deleteAction: function (ouId, res) {
		var ctTrans = new ctTransactionModel.begin(function (err) {
			if (err) {
				return res(err);
			}
			orgUnitModel.deleteComponentsOfOuAndChildren(ouId, function (err, data) {
				if (err) {
					ctTrans.rollback(function () {
						return res(err);
					});
				} else {
					ctTrans.commit(function () {
						if (!ouId['is_migrated']) {
							async.each(data.prov_id, function (pr_id, cb) {
								var callFlowModel = require("../models/callFlowModel");
								callFlowModel.sendForMigration(pr_id, function (err) {
									if (err) { cb(null) };
									cb(null);
								});
							}, function (err) {
								return res(err, data[0]);
							});
						} else {
							return res(null, data[0]);
						}
					});
				}
			}, ctTrans);
		});
	},

	ouLevel: function (req, res) {
		orgUnitModel.getOULevel(req).then(function (result) {
			res(result.err, { ouLevel: result.data });
		});
	},

	userListAction: function (ouid, res) {
		orgUnitModel.orgUserList(ouid, function (err, data) {
			if (err) {
				res(err);
			} else {
				res(null, data);
			}
		});
	},
	deleteAccountAction: function (req, callback) {
		orgUnitModel.deleteAccount(req, function (err, data) {
			controller.responsify(err, data, function (response) {
				callback(response);
			});
		});
	},
	getGroupsByAccessLevel: function (req, res) {
		orgUnitModel.getGroupsByAccessLevel(req.query, req.user.ou_id, function (err, data) {
			controller.responsify(err, data, function (response) {
				res(response);
			});
		});
	},
	deleteCustomSource: function (req, callback) { // check if this implementation is correct?
		console.log("deleteCustomSource req.body=", req.body)
		customSourceModel.deleteCustomSource(req.body.custom_sources, function (err, data) {

			controller.responsify(err, data, function (response) {
				callback(response);
			});
		});
	},
	getActionOuIdsByIds: function (req, res) {
		orgUnitModel.getOuIdsByIds(req.body, function (err, data) {
			controller.responsify(err, data, function (response) {
				res(response);
			});
		});
	},
	setOrgAccountComponentAction: function (req, callback) {
		//// FOR AMP 3 USE DO NOT CHANGE ///
		orgUnitModel.setOrgAccountComponent(req, function (err, data) {
			controller.responsify(err, data, function (response) {
				callback(response);
			});
		});
	},
	getSelfAndTopLevelUsersByOuid: function (ouId, res) {
		orgUnitModel.getSelfAndTopLevelUsersByOuid(ouId, function (err, data) {
			controller.responsify(err, data, function (response) {
				res(response);
			});
		});
	},
	checkCfaParentLevel: function (parentOU, res) {
		orgUnitModel.checkCfaParentLevel(parentOU, function (err, data) {
			controller.responsify(err, data, function (response) {
				res(response);
			});
		});
	},
	hasManualScorecard: function (ouid, callback) {
		//// FOR AMP3 DO NOT CHANGE ////
		orgUnitModel.hasManualScorecard(ouid, function (err, result) {
			var d = {
				hasManualScorecard: result
			}
			controller.responsify(err, d, function (response) {
				callback(response);
			});
		})
	},
	forMove: function (req, callback) {
		//For AMP3 Use DO NOT CHANGE
		var data = [
			{
				level: null,
				users: [],
				campaigns: [],
				subgroups: []
			}
		];

		async.series([
			function(cb){
				//// get org unit stuff
				async.parallel({
					orgUnit: function(cb1){
						orgUnitModel.getByIdInternal(req, function (err, data) {
							cb1(err,data);
						});
					},
					orgUnitLevel: function(cb1){
						orgUnitModel.getOULevel(req).then(function (result) {
							cb1(result.err,result.data);
						});
					},
					subGroups: function(cb1){
						orgUnitModel.subGroups(req.params.id, function (err, data) {
							cb1(err,data);
						});
					}
				},
				function(err,results){
					
					if (err === undefined || err === null || err === '') {
						data = results.orgUnit;
						data[0].users = [];
						data[0].campaigns = [];
						data[0].level = results.orgUnitLevel;
						data[0].subGroups = results.subGroups;
					}
					cb(err);
					
				})
			},
			function (cb) {
				///Get ou users and campaigns
				async.parallel([
					function(cb1) {
						////Get sent ou users and campaigns
						async.parallel([
							function(cb2) {
								////Get sent ou users
								orgUnitModel.orgUsers(data[0].org_unit_id,function(err,results){
									async.eachSeries(results,function(result,cb3){
										data[0].users.push(result);
										cb3(null);
									},
									function(err){
										cb2(err);
									});
								});
							},
							function(cb2) {
								////Get sent ou campaigns
								orgUnitModel.orgCampaigns(data[0].org_unit_id,function(err,results){
									async.eachSeries(results,function(result,cb3){
										data[0].campaigns.push(result);
										cb3(null);
									},
									function(err){
										cb2(err);
									});
								});
							}
						],
						function(err) {
							cb1(err);
						});
					},
					function(cb1) {
						////Get sub groups users and campaign
						async.eachSeries(data[0].subGroups,function(group,cb2){
							async.parallel([
								function(cb3) {
									////Get sent subgroup users
									orgUnitModel.orgUsers(group.org_unit_id,function(err,results){
										async.eachSeries(results,function(result,cb4){
											data[0].users.push(result);
											cb4(null);
										},
										function(err){
											cb3(err);
										});
									});
								},
								function(cb3) {
									////Get sent subgroup campaigns
									orgUnitModel.orgCampaigns(group.org_unit_id,function(err,results){
										async.eachSeries(results,function(result,cb4){
											data[0].campaigns.push(result);
											cb4(null);
										},
										function(err){
											cb3(err);
										});
									});	
								}
							],
							function(err) {
								cb2(err);
							});
						},
						function(err){
							cb1(err);
						});
					}
				],
				function(err){
					cb(err);
				})
			}
		],
		function(err){
			controller.responsify(err, data, function (response) {
				callback(response);
			});
		});
		
		
	},
	move: function (req, callback) {
		//For AMP3 Use DO NOT CHANGE
		orgUnitModel.move(req, function (err, data) {
			controller.responsify(err, data, function (response) {
				callback(response);
			});
		});
	},
	usersForCampaign (req,callback) {
		//For AMP3 Use DO NOT CHANGE
		orgUnitModel.usersForCampaign(req, function (err, data) {
			controller.responsify(err, data, function (response) {
				callback(response);
			});
		});
	},
	getBillingOUNames (req,callback) {
		//For AMP3 Use DO NOT CHANGE
		orgUnitModel.getBillingOUNames(req, function (err, data) {
			controller.responsify(err, data, function (response) {
				callback(response);
			});
		});
	},
	getAccountInfo (req,callback) {
		//For AMP3 Use DO NOT CHANGE
		orgUnitModel.getAccountInfo(req, function (err, data) {
			controller.responsify(err, data, function (response) {
				callback(response);
			});
		});
	},
	getGroupBilling: function (req, res) {
		//This is for amp3
		orgUnitModel.getGroupBilling(req.query.ids, function (err, data) {
			controller.responsify(err, data, function (response) {
				res(response);
			});
		});
	},
	validateBillingId (req,callback) {
		//For AMP3 Use DO NOT CHANGE
		orgUnitModel.validateBillingId(req, function (err, data) {
			controller.responsify(err, data, function (response) {
				callback(response);
			});
		});
	}
};

module.exports = orgUnit;
