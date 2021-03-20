var http = require('http'),
	_ = require('underscore'),
    	async = require('async'),
	access              = require('../controllers/userAccessController'),
	appModel = require('./appModel'),
	orgComponentCountModel = require('./orgComponentCountModel'),
	userPermissionsLog = require('./userPermissionsLog'),
	token  = require('../lib/token'),
	ctlogger           = require('../lib/ctlogger.js'),
	report_table = 'reports';

var permission = {
	getAllUserPermission: function(userid, ou_id, role_id, res){
		var convirzaAnalytic = false;
		async.waterfall([
			function(cb){
				if (role_id === 5 || role_id === 6) {
					access.adminAction(userid, function(err, userscope) {
						if (err) { return res(err); }
						if(userscope.ca){convirzaAnalytic = true;}
						cb(null);
				 });
			 }else{
				 access.getAction(userid, function (err, userscope) {
					 if (err) { return res('Failed to retrieve user access information. '+err); }
					 if(userscope.ca){convirzaAnalytic = true;}
					 cb(null);
				 });
			 }
			 },
			function(cb){
		 	 var qry = "select * from user_permissions where ct_user_id = "+userid;
				 appModel.ctPool.query(qry, function(err, result){
					 if (err){ return res(err,"error");}
					  cb(null,result);
				 });
			 },
			 function(data,cb){
				 if(data.length < 1){
					 var qry = "SELECT org_unit_id from org_unit ou JOIN ct_user cu ON (ou.top_ou_id = cu.ct_user_ou_id OR ou.org_unit_parent_id = cu.ct_user_ou_id OR ou.org_unit_id = cu.ct_user_ou_id) WHERE ou.org_unit_status = 'active' AND cu.ct_user_id = "+userid;
		 				 appModel.ctPool.query(qry, function(err, result){
		 					 if (err){ return res(err,"error");}
								 data[0] =  {
								 reports_list : [],
								 groups_list : _.pluck(result, "org_unit_id"),
								 score_call : true,
								 access_audio : true
								}
		 					  cb(null,data);
		 				 });
				 }else{
					 cb(null,data);
				 }
 			 },
 			 function(data,cb){
				var qry = "SELECT ob.is_migrated, COALESCE(ob.looker_old_ui, false) as looker_old_ui from org_unit ou JOIN org_billing ob ON (ou.billing_id = ob.org_unit_id) WHERE ou.org_unit_id = "+ ou_id;
 				 appModel.ctPool.query(qry, function(err, result){
					 
					 data[0]['looker_old_ui'] = result[0].looker_old_ui;
 					 if (err){ return res(err,"error");}
					 cb(null,data, result[0].is_migrated);
 				 });
 			 },

			 function(data, is_migrated, cb){
				 if(!(_.isEmpty(data[0].reports_list))){
					 var reports = [];
					 if(!is_migrated){
					 	report_table = 'old_reports'
					 }else{
					 	report_table = 'reports'
					 }

					 var qry = "select report_id,report_name,looker_id as looker_id FROM " + report_table + " where report_id IN ("+data[0].reports_list+") AND is_deleted = false"

					 if(convirzaAnalytic){
						qry = "select report_id,report_name,ca_looker_id as looker_id FROM " + report_table + " where report_id IN ("+data[0].reports_list+")  AND is_deleted = false"
					 }

					 if(role_id !== 8){
					 	qry += " OR "+ou_id+"=ANY(report_ous) ";
					 }
					 qry += " order by report_name";
					

					 appModel.ctPool.query(qry, function(err, result){
						 if (err){ return res(err,"error");}
						 async.each(result,function(report,cb1){
							 var report = {
										 report_id: report.report_id,
										 report_name:report.report_name,
										 looker_id : report.looker_id
									 };
									  reports.push(report);
									 cb1(null);
						 },function(err){
							 if(err){return cb(err);}
							 data[0]['reports'] = reports;
							 cb(null,data);
						 });
						});
				 }else{
					 data[0]['reports'] = [];
					 cb(null,data);
				 }
			 }
		 ],function(err,result){
			 if(err){return res(err);}
			 res(null,result);
		 });
	},
	getReportsListByOuid: function(req, res){
		async.waterfall([
			function(cb){
				var qry = "SELECT reports_list FROM user_permissions WHERE ct_user_id = "+ req.user.user_id;
	 			 appModel.ctPool.query(qry, function(err, result){
	 				 if (err){ return res(err);}
					 		var reportId = _.pluck(result,'reports_list');
							cb(null,reportId);
				 });
			},
			function(reportIDs,cb){
				var reportInfo = [];
				if(!req.is_migrated){
					report_table = 'old_reports'
				}
			 	 var qry = "SELECT report_id,report_name,is_admin_only, rep.access, rep.component_id, oa.component_id FROM "+ report_table +" AS rep "; 
				 qry += "LEFT JOIN org_account AS oa ON oa.component_id = rep.component_id AND rep.access = 'account' AND oa.org_unit_id = "+req.user.ou_id+" ";
				 qry += "WHERE (is_default = true AND report_id IN ("+ reportIDs +") AND (rep.component_id IS NULL OR (rep.component_id IS NOT NULL AND oa.component_id IS NOT NULL))) OR "+req.user.ou_id+"=ANY(report_ous) AND is_deleted = false ";
				 qry += "order by report_name;";
					 appModel.ctPool.query(qry, function(err, result){
						 if (err){ return res(err);}
						 if(result.length > 0){
							 _.each(result,function(report){
								 reportInfo.push({
										 report_id :   report.report_id,
										 report_name : report.report_name,
										 is_admin_only : report.is_admin_only,
										 report_checked:false
								 });
							 });
						 }else{
							 reportInfo = [];
					 }
						 cb(null,reportInfo);
					 });
			}
		],
		function(err, result){
				if (err) {
						res(err);
				} else {
						res(null, result);
				}
		});
	},
	getOuListByOuid: function(req, res){
		var ouid = req.params.ouid;
		var topid = req.params.topid;
		var currentOULevel = parseInt(req.params.currentOULevel);
		var userOULevel = parseInt(req.params.userOULevel);
		var groupInfo = [];
		var allOuId = [];
		async.waterfall([
			function(cb){
				var query = "SELECT org_unit_parent_id FROM org_unit WHERE org_unit_id = "+ ouid;
				appModel.ctPool.query(query, function (err, data) {
					 if(err){return res(err);}
					 cb(null,data[0]);
				});
			},
			function(data1,cb){
				var ctOuData = [];
				var whereClause = " WHERE org_unit_status = 'active' ";
				var orderByClause = " ORDER BY ou.org_unit_name ";
				if(userOULevel === 0 && currentOULevel === 0){
					if (ouid) whereClause += " AND ou.org_unit_id = '" + ouid + "' ";
				}else{
					if (data1.org_unit_parent_id) whereClause += " AND org_unit_parent_id = '" + data1.org_unit_parent_id + "' ";
				}
				var query = "SELECT * FROM org_unit ou ";
				query += "JOIN org_unit_detail oud ON (oud.org_unit_id = ou.org_unit_id) ";
				query += whereClause;
				query += orderByClause;
				appModel.ctPool.query(query, function (err, ousData) {
					if(ousData.length > 0){
						  allOuId = _.pluck(ousData,'org_unit_id');
					 }else{
						 	allOuId = [];
					 }
					 cb(null,allOuId);
				 });
			 },
			 function (ouids,cb) {
				 var topous =[];
				 if(ouids.length > 0){
					 var qry = "select org_unit_id FROM org_unit WHERE org_unit_status = 'active' AND org_unit_id IN (" + ouids + ") or org_unit_parent_id IN (" + ouids + ") ";
	 				qry += " or org_unit_parent_id IN (select org_unit_id FROM org_unit WHERE org_unit_status = 'active' AND org_unit_parent_id IN (" + ouids + "))";
					appModel.ctPool.query(qry, function(error, ous){
						if (error){ res(error);}
						topous = _.pluck(ous,'org_unit_id');
						topous = _.intersection(topous,req.user.orglist);
						cb(null,topous);
				});
			}else{
				res(null,topous);
			}
		},
		function(ouids,cb){
			oudata = {
				"ouids":ouids
			};
			if(((userOULevel === 0 && currentOULevel === 2) || (userOULevel === 1 && currentOULevel === 1) || (userOULevel === 2 && currentOULevel === 0))){
				var qry ="SELECT org_unit_id FROM org_unit WHERE org_unit_status = 'active' AND org_unit_parent_id = "+topid ;
				appModel.ctPool.query(qry, function(error, ous){
					if (error){ res(error);}
					var parentOus = _.pluck(ous,'org_unit_id');
					oudata.parentOus = parentOus;
					cb(null,oudata);
				});
			}else{
				cb(null,oudata);
			}
		},
		function(oudata,cb){
					var ouids = oudata.ouids;
					if(ouids.length > 0){
					var query ="SELECT org_unit_id, org_unit_name, org_unit_parent_id, top_ou_id  FROM org_unit WHERE org_unit_status = 'active' AND org_unit_id IN ("+ouids+") ORDER BY org_unit_name";
						appModel.ctPool.query(query, function(error, data){
							if (error){ res(error);}
							if(data.length > 0){
								_.each(data,function(group){
									var trimName = (group.org_unit_name === '' || group.org_unit_name === null )? group.org_unit_name : group.org_unit_name.substr(0,30)
									if(group.org_unit_parent_id === parseInt(topid) && ((userOULevel === 0 && currentOULevel === 1) || (userOULevel === 1 && currentOULevel === 0))){
										groupInfo.push({
												id :    group.org_unit_id,
												name : group.org_unit_name,
												tName : trimName,
												parent: null,
												top: group.top_ou_id,
												checked:false
										});
									}else if(_.contains(oudata.parentOus,group.org_unit_parent_id) && ((userOULevel === 0 && currentOULevel === 2) || (userOULevel === 1 && currentOULevel === 1) || (userOULevel === 2 && currentOULevel === 0))){
										groupInfo.push({
												id :    group.org_unit_id,
												name : group.org_unit_name,
												tName : trimName,
												parent: null,
												top: group.top_ou_id,
												checked:false
										});
									}else{
										groupInfo.push({
												id :    group.org_unit_id,
												name : group.org_unit_name,
												tName : trimName,
												parent: group.org_unit_parent_id,
												top: group.top_ou_id,
												checked:false
										});
									}
								});
							}else{
								groupInfo = [];
							}
								cb(null,groupInfo);
							});
					}else{
						groupInfo = [];
						cb(null,groupInfo);
					}
			}
		],
		function(err, result){
				if (err) {
						res(err);
				} else {
						res(null, result);
				}
		});
	},
	getOuListByUserid: function(req, res){
		console.log("getOuListByUserid ");
		var reports_list = [];
		var ct_user_id;
		var score_card;
		var access_audio;
		var passedOuLevel;

		async.waterfall([
			function (cb){
				async.parallel({
					loggedOu: function(cb1){
						//Need to get logged in user ou to know if can see sister groups
						var qry = "SELECT ou.org_unit_id,ou.org_unit_name,ou.top_ou_id,ou.org_unit_parent_id";
						qry += " FROM ct_user AS cu";
						qry += " JOIN org_unit AS ou ON ou.org_unit_id = cu.ct_user_ou_id"
						qry += " WHERE cu.ct_user_id = "+req.userid;

						var level;
						appModel.ctPool.query(qry, function(err, results){
							if (err){ return cb1(err);}
							cb1(null,results[0]);
						});
					},
					passedOu: function(cb1){
						//Need to get passed ou for getting groups to send back
						var qry = "SELECT org_unit_id,org_unit_name,top_ou_id,org_unit_parent_id";
						qry += " FROM org_unit";
						qry += " WHERE org_unit_id = "+req.params.ouid;

						var level;
						appModel.ctPool.query(qry, function(err, results){
							if (err){ return cb1(err);}
							cb1(null,results[0]);
						});
					},
				},
				function(err,result){
					cb(err,result.loggedOu,result.passedOu);
				});//async parallel cb1
			},
			function(loggedOu,passedOu,cb){
				console.log("loggedOu: "+JSON.stringify(loggedOu));
				console.log("passOu: "+JSON.stringify(passedOu));
				var loggedOuLevel;
				

				if (loggedOu.org_unit_parent_id == null ) {
					loggedOuLevel = 1;
				} else if (loggedOu.org_unit_parent_id == req.params.topouid) {
					loggedOuLevel = 2;
				} else {
					loggedOuLevel = 3;
				}

				if (passedOu.org_unit_parent_id == null ) {
					passedOuLevel = 1;
				} else if (passedOu.org_unit_parent_id == req.params.topouid) {
					passedOuLevel = 2;
				} else {
					passedOuLevel = 3;
				}
				var allOuQry;
				if (passedOuLevel === 1) {
					allOuQry = "SELECT org_unit_id, org_unit_name, org_unit_parent_id FROM org_unit WHERE top_ou_id = "+req.params.topouid+" AND org_unit_status = 'active' ORDER BY org_unit_name ASC";
				} else if(passedOuLevel == 3 && loggedOuLevel < 3) {
					allOuQry = "SELECT org_unit_id, org_unit_name, org_unit_parent_id from org_unit WHERE org_unit_parent_id IN(SELECT org_unit_id FROM org_unit where org_unit_parent_id = "+req.params.topouid+") ";
					allOuQry += "AND org_unit_status = 'active' ORDER BY org_unit_name ASC";					
				} else if (loggedOuLevel <= passedOuLevel) {
					allOuQry = "SELECT org_unit_id, org_unit_name, org_unit_parent_id FROM org_unit"; 
					allOuQry += " WHERE (org_unit_parent_id = "+passedOu.org_unit_parent_id+" OR org_unit_parent_id in (";
					allOuQry += " SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id = "+passedOu.org_unit_parent_id;
					allOuQry += " )) AND org_unit_status = 'active' ORDER BY org_unit_name ASC";
				} else {
					allOuQry = "SELECT org_unit_id, org_unit_name, org_unit_parent_id FROM org_unit"; 
					allOuQry += " WHERE (org_unit_id = "+passedOu.org_unit_id+" OR org_unit_parent_id = "+passedOu.org_unit_id;
					allOuQry += " ) AND org_unit_status = 'active' ORDER BY org_unit_name ASC";
				}

				async.parallel({
					allOus: function(cb1){
						if (allOuQry === undefined) {
							return cb1(null,passedOu);
						}
						appModel.ctPool.query(allOuQry, function(err, results){
							if (err){ return cb1(err);}
							
							cb1(null, results);
						});
					},
					userPermissions: function(cb1){
						console.log('permissoin ous');
						var qry = "SELECT up.groups_list,up.score_call,up.access_audio,up.reports_list";
						qry += ",cu.ct_user_ou_id AS ouid";
						qry += " FROM user_permissions AS up";
						qry += " JOIN ct_user AS cu ON cu.ct_user_id = up.ct_user_id";
						qry += " WHERE up.ct_user_id = "+req.params.uid;
						appModel.ctPool.query(qry, function(err, results){
							if (err){ return cb1(err);}
							cb1(null,results);
						});
					}
				},
				function(err,results){
					cb(err,results);
				});//asyn parallet cb1
			}
		],
		function(err,results){
			//console.log("err: "+JSON.stringify(err)+" results: "+JSON.stringify(results))
			var topOuid = req.params.topouid;
			var groupsList = results.userPermissions[0].groups_list;
			var userOuid = results.userPermissions[0].ouid;
			var topLevelOu = [];
			var secondLevelOus = [];
			var thirdLevelOus = {};
			var allGroupsList = [];
			var loggedOrgAccess = req.user.orglist;

			async.series([
				function(cb){
					//Build third level ous
					var count = 0;
					async.eachSeries(results.allOus,function(ou,cb1){
						ou.selected = false;
						ou.disabled = false;
						ou.hidden = false;

						if (groupsList.indexOf(ou.org_unit_id) > -1) {
							ou.selected = true;
						}

						if (userOuid == ou.org_unit_id  || loggedOrgAccess.indexOf(ou.org_unit_id) < 0) {
							ou.disabled = true;
						}

						if (loggedOrgAccess.indexOf(ou.org_unit_id) < 0) {
							ou.hidden = true;
						}
						
						if (ou.org_unit_id == topOuid) {
							//This is top ou
							ou.ous = [];
							topLevelOu.push(ou);
							setTimeout(() => {cb1(null)});
						} else if (ou.org_unit_parent_id == topOuid) {
							//This is second ou
							ou.ous = [];
							secondLevelOus.push(ou);
							setTimeout(() => {cb1(null)});
						} else {

							//This is third level ou
							//if we are loading the list of third level groups at the third level we want the array to be flat
							if(passedOuLevel == 3) {
								if (thirdLevelOus[count] == undefined) {
									thirdLevelOus[count] = [];
								}
								thirdLevelOus[count].push(ou);
							}
							else {
							if (thirdLevelOus[ou.org_unit_parent_id] == undefined) {
								thirdLevelOus[ou.org_unit_parent_id] = [];
							}
							thirdLevelOus[ou.org_unit_parent_id].push(ou);
							}							
							count++;
							setTimeout(() => {cb1(null)});
						}
					},
					function(err){
						cb(err);
					});//async eachSeries cb1
				},
				function(cb){
					//Build second level ous

					if (topLevelOu.length > 0) {
						allGroupsList = topLevelOu;
					}

					if (topLevelOu.length > 0 && secondLevelOus.length > 0) {
						allGroupsList[0].ous = secondLevelOus;
						allGroupsList[0].accessOus = (_.find(secondLevelOus, function (obj) { return obj.hidden === false; }))? true: false;
						if(!allGroupsList[0].disabled){
							allGroupsList[0].disabled = (_.find(secondLevelOus, function (obj) { return (obj.hidden && obj.selected) === true; }))? true: false;
						}
						async.eachSeries(allGroupsList[0].ous,function(ou,cb1){
							if (thirdLevelOus[ou.org_unit_id] != undefined) {
								ou.ous = thirdLevelOus[ou.org_unit_id];
							}
							ou.accessOus = (_.find(ou.ous, function (obj) { return obj.hidden === false; }))? true: false;
							if(!ou.disabled){
								ou.disabled = 	(_.find(ou.ous, function (obj) { return (obj.hidden && obj.selected) === true; }))? true: false;
							}
							setTimeout(() => {cb1(null)});
						},
						function(err){
							cb(err);
						});//async eachSeries cb1
					} else if(secondLevelOus.length > 0){
						allGroupsList = secondLevelOus;
						async.eachSeries(allGroupsList, function(ou, cb1){
							if (thirdLevelOus[ou.org_unit_id] != undefined) {
								ou.ous = thirdLevelOus[ou.org_unit_id];
							}
							ou.accessOus = (_.find(ou.ous, function (obj) { return obj.hidden === false; }))? true: false;
							if(!ou.disabled){
								ou.disabled = (_.find(ou.ous, function (obj) { return (obj.hidden && obj.selected) === true; }))? true: false;
							}
							setTimeout(() => {cb1(null)});
						},
						function(err){
							cb(err);
						});//async eachSeries cb1
					} else {
						var keys = Object.keys(thirdLevelOus);
						//Using asnyc in case thirdLevelOus length is very large
						async.eachSeries(keys,function(key,cb1){
							allGroupsList.push(thirdLevelOus[key][0]);
							cb1(null);
						},
						function(err){
							cb(err);
						});
						
					}
				}
			],
			function(err){
				var returnData = {
					score_call: results.userPermissions[0].score_call,
					access_audio: results.userPermissions[0].access_audio,
					reports_list: results.userPermissions[0].reports_list,
					group_list: allGroupsList
				};
				res(err,returnData);			
			});//async series cb
		});//async waterfall cb

 	},
 	saveUserScorecardPermissions: function(req,callback){
		 //// FOR AMP3 USE DO NOT CHANGE
		 var logData = {
			'ct_user_id' : req.body.user_id,
			'current_permissions' : {
				'score_call': !req.body.score_call,
			},
			'updated_permissions' : {
				'score_call': req.body.score_call,
			}
		};
 		qry = "UPDATE user_permissions SET score_call = "+req.body.score_call+", updated_by = 2, updated_on = CURRENT_TIMESTAMP  WHERE ct_user_id = "+req.body.user_id;
 		appModel.ctPool.query(qry, function(err, result){
			if (err){ return callback(err,"error");}
			userPermissionsLog.updateLog(2, 8, logData, true, function(err){
				if(err){ console.log("Error In User Permissions Log For : ", req.body.user_id, ' ERROR : '+err);}else{
					console.log("Inserted User Permissions Log For : ", req.body.user_id);
				}
			});
			return callback(null,"User's score card permission updated successfully");
		});
 	},
 	setUserReportPermissions: function(req,callback){
 		//// FOR AMP3 USE DO NOT CHANGE
 		var allowedActions = ['add','remove'];
 		var action = req.body.action;
 		var reportId = req.body.report_id;
 		var ouid = req.body.org_unit_id;

 		if (action === undefined || reportId === undefined || ouid === undefined) {
 			return callback("Missing params");
 		}

 		console.log("action: "+action+" reportId: "+reportId+" oiud: "+ouid);

 		if (allowedActions.indexOf(action) < 0) {
 			return callback("This action is not allowed");
 		}

 		var ctTrans = new ctTransactionModel.begin(function(err) {
	 		async.waterfall([
	 			function(cb){
	 				//// First get report
	 				var qry = "SELECT * FROM reports WHERE report_id = "+reportId;
	 				ctTrans.query(qry,function(err,results){
	 					if (err) { return cb(err);}

	 					if (results.length < 1) {return cb("Report not found");}
	 					console.log("report: "+JSON.stringify(results));
	 					cb(null,results[0]);
	 				});
	 			},
	 			function(report,cb){
	 				switch(action) {
						case 'add':
							if (report.access === 'account') {
								async.waterfall([
									function(cb2){
										//// Check if ou has org account for this component 
										var qry = "SELECT org_unit_id FROM org_account";
										qry += " WHERE component_id = "+report.component_id+" AND org_unit_id = "+ouid;
										ctTrans.query(qry,function(err,results){
											if (err) {return cb2(err);}
											if (results.length < 1) {return cb2('This ou does not have component');}
											console.log("org_account: "+JSON.stringify(results))
											cb2()
										});
									},
									function(cb2){
										//// Now get user ids
										var qry  = "SELECT ctu.ct_user_id";
										qry += " from ct_user ctu";
			                            qry += " JOIN org_unit ou ON (ctu.ct_user_ou_id = ou.org_unit_id)";
			                            qry += " WHERE ou.billing_id = ("+ouid+")";
			                            qry += " AND ctu.user_status != 'deleted'";
			                            if (report.is_admin_only) {
			                            	qry += " AND (ctu.role_id = 1 or ctu.role_id = 4)";
			                            }
			                            ctTrans.query(qry,function(err,results){
			                            	if (err) {return cb2(err);}
											if (results.length < 1) {return cb2('This ou does not have users');}
											console.log("users: "+JSON.stringify(results));
											var userIds = [];
											async.eachSeries(results,function(user,cb3){
												userIds.push(user.ct_user_id);
												cb3(null);
											},
											function(err){
												cb2(null,userIds);
											});
			                            });
									},
									function(userIds,cb2){
										//// Finally update ct user permissions
										async.eachSeries(userIds,function(userId,cb3){
											var logData = {
												'ct_user_id' : userId
											};
											// qry = "SELECT * FROM user_permissions WHERE ct_user_id="+userId+" AND "+reportId+"=ANY(reports_list);";
											qry = "SELECT * FROM user_permissions WHERE ct_user_id="+userId;
											ctTrans.query(qry,function(err,results){
												console.log('results ',results[0].groups_list)
												if (err) {return cb3(err);}

												var oldReportsList = JSON.parse(JSON.stringify(results[0].reports_list));
												results[0].reports_list.push(reportId);
												var newReportsList = results[0].reports_list;

												if (oldReportsList.indexOf(reportId) < 0) {

													// var newReports = result[0].reports_list;
													logData.current_permissions = {
														'groups_list':results[0].groups_list,
														'reports_list': oldReportsList,
														'score_call':results[0].score_call,
														'access_audio': results[0].access_audio
													};
													logData.updated_permissions = {
														'groups_list':results[0].groups_list,
														'reports_list': newReportsList,
														'score_call':results[0].score_call,
														'access_audio': results[0].access_audio
													};
													qry = "UPDATE user_permissions SET reports_list = array_cat(reports_list, '{"+ reportId+"}'), updated_by = 2, updated_on = CURRENT_TIMESTAMP  where ct_user_id IN ("+userId+")";
													ctTrans.query(qry,function(err){
														userPermissionsLog.updateLog(2, 8, logData, true, function(err){
															if(err){ console.log("Error In User Permissions Log For : ", userId, ' ERROR : '+err);}else{
																console.log("Inserted User Permissions Log For : ", userId);
															} 
														});
														cb3(err);
													});
												} else {
													cb3(null);
												}
											});
										},
										function(err){
											cb2(err);
										});
									}
								],
								function(err){
									cb(err);
								});
							} else {
								cb('Report access is not account');
							}
							break;
						case 'remove':
							//// for this code look in ctscripts addUserPermissionTable.js
							cb('This has not been added yet to amp');
							break;
						default:
							cb('This action is not valid');
					}
	 			}
	 		],
	 		function(err){
	 			if (err) {
	 				ctTrans.rollback(function(){
	 					callback(err);
	 				});
	 			} else {
	 				ctTrans.commit(function(){
	 					callback(null);
	 				});
	 			}
	 		});
						});
 	},
 	addUserPermissions: function(req, res){
 		var ouList = [];
 		async.eachSeries(req.body.ou_list,function(first,cb){
 			if (first.selected) {
 				ouList.push(first.org_unit_id);
 			}
 			if (first.ous !== undefined) {
 				async.eachSeries(first.ous,function(second,cb1){
 					if (second.selected) {
 						ouList.push(second.org_unit_id);
 					}

 					if (second.ous !== undefined) {
 						async.eachSeries(second.ous,function(third,cb2){
 							if (third.selected) {
 								ouList.push(third.org_unit_id);
 							}
 							setTimeout(() => {cb2(null)});
 						},
 						function(err){
 							setTimeout(() => {cb1(err)});
 						});
 					} else {
 						setTimeout(() => {cb1(null)});
 					}
 				},
 				function(err){
 					setTimeout(() => {cb(err)});
 				});
 			} else {
 				setTimeout(() => {cb(null)});
 			}
 		},
 		function(err){
			 var qry = "select * from user_permissions where ct_user_id="+req.body.user_id;
			 var logData = {
					'ct_user_id' : req.body.user_id,
				}; 
			 appModel.ctPool.query(qry, function(err, result){
				if (err){ return res(err,"error");}
				//deleted ou's are not loaded in the UI but we need to maintain permissions for those ou's. Do a lookup to get that list and add them to the ouList array.
				var qry2 = "select org_unit_id from org_unit where org_unit_status = 'deleted' and org_unit_id IN("+result[0].groups_list+")";
				appModel.ctPool.query(qry2, function(err, result2){
					if (err){ return res(err,"error");}
					//add deleted ou's to the list to be saved
					result2.forEach(function(row){
						ouList.push(row.org_unit_id);
					});
					var ous = req.body.ou_list.length > 0 ? "ARRAY["+ouList+"]" : "'{}'";
					var reports = req.body.report_list.length > 0 ? "ARRAY["+req.body.report_list+"]" :"'{}'";
					//update session if user is updating his own permissions				
				if(req.user.user_id === req.body.user_id){
					token.updateOuList(req, req.body.ou_list, function(err, retData) {
						if (err) { return res(err); }
					});
				}
				if (result.length <= 0) {
					var insertQry = "insert into user_permissions values("+req.body.user_id+","+ous+","+reports+","+req.body.score_call+","+req.body.access_audio+", updated_by = "+ req.user.user_id +", updated_on = CURRENT_TIMESTAMP )";
					appModel.ctPool.query(insertQry, function(err){
						if (err){ return res(err,"error");}
						logData.current_permissions = {
							'groups_list': ouList,
							'reports_list': req.body.report_list,
							'score_call': req.body.score_call,
							'access_audio': req.body.access_audio
						};
						userPermissionsLog.createLog(req.user.user_id, req.user.ou_id, logData, false, function(err){
							if(err){ console.log("Error In User Permissions Log For : ", req.body.user_id, ' ERROR : '+err);}else{
								console.log("Inserted User Permissions Log For : ", req.body.user_id);
							} 
						});
						return res(null,"User's permission added successfully");
					});
				} else {
					logData.current_permissions = {
						'groups_list':result[0].groups_list,
						'reports_list': result[0].reports_list,
						'score_call':result[0].score_call,
						'access_audio': result[0].access_audio
					};
					logData.updated_permissions = {
						'groups_list': ouList,
						'reports_list': req.body.report_list,
						'score_call': req.body.score_call,
						'access_audio': req.body.access_audio
					};
					var updateQry = "update user_permissions set groups_list = "+ous+", reports_list = "+reports+", score_call="+req.body.score_call+", access_audio ="+req.body.access_audio+", updated_by = "+ req.user.user_id +", updated_on = CURRENT_TIMESTAMP WHERE ct_user_id="+req.body.user_id;
					appModel.ctPool.query(updateQry, function(err){
						if (err){ return res(err,"error");}
						userPermissionsLog.updateLog(req.user.user_id, req.user.ou_id, logData, false, function(err){
							if(err){ console.log("Error In User Permissions Log For : ", req.body.user_id, ' ERROR : '+err);}else{
								console.log("Inserted User Permissions Log For : ", req.body.user_id);
							} 
						});
						return res(null,"User's permission updated successfully");
					});
				}
			});
		});
		});
 	},
 	deleteUserPermissions: function(req, res){
 		var qry = "select * from user_permissions where ct_user_id="+req.body.user_id ;
		appModel.ctPool.query(qry, function(err, result){
			if (result.length <= 0) {
				return res("No record deletion for user id "+req.body.user_id);
			} else {
		 		var qry = "delete from user_permissions where ct_user_id="+req.body.user_id;
				appModel.ctPool.query(qry, function(err, result){
					if (err){ return res(err,"error");}
					return res(null,"Record deleted successfully");
				});
			}
		});
 	},
	getDataAppend : function(req,res){
		var qry = "select data_append from org_billing where org_unit_id = "+ req.params.ouid;
		appModel.ctPool.query(qry, function(err, result){
			if (err) {
				return res("Error : "+err);
			}
			res(null,result);
		});
	},
	getAccessibleOuid: function(req, res){
		//// FOR AMP3 USE DO NOT CHANGE
		console.log("req query: "+JSON.stringify(req.query))
		var passedOuLevel;
		var user_id;
		var user_name;
		var ouids = [];
		var data = [];
		async.waterfall([
			function (cb){
				var qry = "SELECT ou.org_unit_id,ou.org_unit_name,ou.top_ou_id,ou.org_unit_parent_id,cu.ct_user_id,cu.username";
				qry += " FROM ct_user AS cu";
				qry += " JOIN org_unit AS ou ON ou.org_unit_id = cu.ct_user_ou_id"
				qry += " WHERE cu.ct_user_id = "+req.query.id;

				var level;
				appModel.ctPool.query(qry, function(err, results){
					if (err){ return cb(err);}
					cb(err,results[0]);
				});
			},
			function(passedOu,cb){
				console.log("passOu: "+JSON.stringify(passedOu));
				if(passedOu != undefined){
					user_id = passedOu.ct_user_id;
					user_name = passedOu.username;
					if (passedOu.org_unit_parent_id == null ) {
						passedOuLevel = 1;
					} else if (passedOu.org_unit_parent_id == passedOu.top_ou_id) {
						passedOuLevel = 2;
					} else {
						passedOuLevel = 3;
					}
					var allOuQry;
					if (passedOuLevel === 1){
						allOuQry = "SELECT org_unit_id FROM org_unit WHERE top_ou_id = "+passedOu.top_ou_id+" AND org_unit_status = 'active' ORDER BY org_unit_name ASC";
					}else if(passedOuLevel === 2){
						allOuQry = "SELECT org_unit_id FROM org_unit";
						allOuQry += " WHERE (org_unit_parent_id = "+passedOu.org_unit_parent_id+" OR org_unit_parent_id in (";
						allOuQry += " SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id = "+passedOu.org_unit_parent_id;
						allOuQry += " )) AND org_unit_status = 'active' ORDER BY org_unit_name ASC";
					} else if(passedOuLevel === 3) {
						allOuQry = "SELECT org_unit_id from org_unit WHERE org_unit_parent_id IN(SELECT org_unit_id FROM org_unit where org_unit_parent_id = "+passedOu.top_ou_id+") ";
						allOuQry += "AND org_unit_status = 'active' ORDER BY org_unit_name ASC";
					}

					if (allOuQry === undefined) {
						return cb(null,passedOu);
					}
					appModel.ctPool.query(allOuQry, function(err, results){
						if (err){ return cb(err);}
						var tmp = {};
						results.forEach(function(row){
							ouids.push(row.org_unit_id);
						});
						if (tmp.UserId === undefined) {
							tmp = {
								UserId: user_id,
								UserName: user_name,
								ouids: ouids,
							};
						}
						cb(null, tmp);
					});
				}else{
					cb(null)
				}
			}
		],
		function(err,tmp){
			if (tmp !== undefined) {
				data.push(tmp);
			}
			res(err,data);
		});//async waterfall cb
	},
	getUserPermissions: function(req, res){
		//// FOR AMP3 USE DO NOT CHANGE
		console.log("req query: "+JSON.stringify(req.query))
		var user_id;
		var user_name;
		var data = [];
		async.waterfall([
			function (cb){
				var qry = "SELECT cu.ct_user_id,cu.username";
				qry += " FROM ct_user AS cu"
				qry += " WHERE cu.ct_user_id = "+req.query.id;
				appModel.ctPool.query(qry, function(err, results){
					if (err){ return cb(err);}
					cb(err,results[0]);
				});
			},
			function(user_details,cb){
				console.log("user_details: "+JSON.stringify(user_details));
				if(user_details != undefined){
					user_id = user_details.ct_user_id;
					user_name = user_details.username;
					var allOuQry = "SELECT groups_list FROM user_permissions WHERE ct_user_id = "+user_id;

					if (allOuQry === undefined) {
						return cb(null,user_details);
					}
					appModel.ctPool.query(allOuQry, function(err, results){
						if (err){ return cb(err);}
						var tmp = {};
						if (tmp.UserId === undefined && results.length > 0) {
							tmp = {
								UserId: user_id,
								UserName: user_name,
								ouids: results[0].groups_list,
							};
						}
						cb(null, tmp);
					});
				}else{
					cb(null)
				}
			}
		],
		function(err,tmp){
			if (tmp !== undefined) {
				data.push(tmp);
			}
			res(err,data);
		});//async waterfall cb
	},
	getOuListByUserId: function(req, res){
		if(req.params.userid){
			var query = "SELECT distinct org_unit_id , org_unit_name FROM org_unit WHERE ARRAY[org_unit_id] <@ ARRAY[( select groups_list from user_permissions where ct_user_id = "+req.params.userid+")] AND org_unit_status = 'active'"
			appModel.ctPool.query(query, function(err, results){
				if (err){ return res(err);}
				res(null, results);
			});
		}else{
			res('Please provide userid');
		}
	},
	moveUser: function(req, res){
		if(req.body.ct_user_id && req.body.org_unit_id){
			var old_ct_user_ou_id = '';
			var newdata = {
				"org_unit_id": req.ouid,
				"ct_user_id": req.userid,
				"log_data": req.body.user
			};
			var ctTrans = new ctTransactionModel.begin(function(err) {
				async.waterfall([
					function (cb){
						var qry = "SELECT * FROM ct_user AS cu"
						qry += " WHERE cu.user_status != 'deleted' AND cu.ct_user_id = "+req.body.ct_user_id;
						ctTrans.query(qry, function(err, results){
							if (err){ return cb(err);}
							old_ct_user_ou_id = results[0].ct_user_ou_id;
							cb(err, results[0]);
						});
					},
					function(user_details, cb){
						if(user_details.ct_user_ou_id != req.body.org_unit_id){
							user_details.ct_user_ou_id = req.body.org_unit_id;
							newdata.log_data = user_details;
							var updateQry = "UPDATE ct_user SET ct_user_ou_id = " + req.body.org_unit_id + " WHERE ct_user_id  = "+ req.body.ct_user_id ;
							ctTrans.query(updateQry, function(err){
								if (err){ return cb(err);}
								newdata.log_data.old_org_unit_id = old_ct_user_ou_id;
								cb(err, true);
							});

						}else{
							cb(null, false);
						}
					},
					function(is_ou_changes, cb){
						if(is_ou_changes){
							var qry = "select org_unit_id from org_unit where org_unit_id = " + req.body.org_unit_id + " or org_unit_parent_id = " + req.body.org_unit_id + " ";
							qry += " or org_unit_parent_id IN(select org_unit_id from org_unit where org_unit_parent_id = " + req.body.org_unit_id + ")";
							appModel.ctPool.query(qry, function(err, data) {
								var ouList = [];
								for (var key in data) {
									ouList.push(data[key].org_unit_id);
								}
								ouList = ouList.join(",");
								cb(null ,ouList);
							});
						}else{
							cb(null);
						}
					},
					function(groupList, cb){
						if(groupList && groupList.length > 0){
							var updateQry = "UPDATE user_permissions SET groups_list = ARRAY[" + groupList+ "], updated_by = "+ req.user.user_id +", updated_on = CURRENT_TIMESTAMP WHERE ct_user_id  = "+ req.body.ct_user_id ;
							ctTrans.query(updateQry, function(err){
								if (err){ return cb(err);}
								cb(err);
							});
						}else{
							cb(null);
						}
					},
					function(cb){
						orgComponentCountModel.decrement(ctTrans, 2, old_ct_user_ou_id, 1, function (err) {
							if (err) { return cb(err); }else{
								orgComponentCountModel.increment(ctTrans, 2, req.body.org_unit_id, 1, function (err) {
									if (err) { return cb(err); }else{
										cb(null);
									}
								});
							}
						});
					}
				],
				function(err){
					if (err) {
						ctTrans.rollback(function(){
							res(err);
						});
					} else {
						ctTrans.commit(function(){
							// create log record							
							ctlogger.log(newdata, 'move', 'user', 'User '+newdata.log_data.username+' Moved to group '+ req.body.org_unit_id, '', req.headers.authorization);
							res(null, 'User Moved to '+ req.body.org_unit_id);
						});
					}
				});
			});
		}else{
			res('Please provide userid and org_unit_id');
		}
	}
};
module.exports = permission;
