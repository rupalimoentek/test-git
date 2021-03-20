var commonMethods 		= require('../lib/commonMethods.js');
var advFilterValidate 		= require('../lib/advFilterValidate.js');
var nonHavingValues = ['ou.org_unit_id', 'ou.org_unit_name','ou.org_unit_ext_id','pr.provisioned_route_name', 'pn.number','c.campaign_name', 'c.campaign_ext_id']

var scoreCardCall = {

	retriveScoreCardCalls: function(req, res) {
		async.waterfall([
			function(callback) {
				// check if we need to lookup the filter settings
				commonMethods.report.loadFilterRule(req, function(err, filterSetting) {
					if (err) { return callback(err); }
					req = filterSetting;
					callback(null);
				});
			},
			function(callback) {
				var filterVal = req.query.filter.split(",")[2];
							
							//dsds
				var data = req.query;
				
				data.order = (data.order !== undefined && data.order !== '' ? data.order : 10);
				data.orderBy = (data.orderBy !== undefined && data.orderBy !== '' ? data.orderBy : 'DESC');

				if (data.exportData === true) { data.limit = 10000; data.offset = 0; }

				if(data.filterRule !== undefined && data.filterRule.split(" ")[3] === 'NONE'){
					data.filterRule = data.filterRule.replace("NONE", "");
				}
				console.log("==========data==========",data);
				var finalAdvFilter = advFilterValidate.finalFilterValue(req, data);
				if (data.filterRule != undefined || data.filterRule != null){
                    data.filterRule = advFilterValidate.checkAndReplaceHash(finalAdvFilter)
                }
				var qryPre = "SELECT DISTINCT c.call_id, " +
									"ou.org_unit_name AS group_name, " +
									"ou.org_unit_id AS group_id, " +
									"first_name || ' ' || last_name || ' | ' || username AS agent, cu.ct_user_id, " +
									"cf.call_title, cf.is_call_listened, " +
									"c.duration, " +
									"ou.org_unit_ext_id AS group_external_id, ";
									
				// if (req.query.count !== undefined && (req.query.count === false || req.query.count === 'false')) {
				// 	qryPre += "t.tag_name AS tag, cm.comment_text AS comment, " +
				// 	"cm.comment_created AT TIME ZONE '"+data.timezone+"' AS comment_date_time, " +
				// 	"cm.ct_user_id AS commenter, ";
					
				// }	
				
				qryPre += "c.call_started AT TIME ZONE '"+data.timezone+"' AS call_date_time, " +
				"sc.score_card_id, " +
				"sc.score_card_title AS scorecard, " +
				"(TO_NUMBER(scc.final_score, '999')) AS score, "+ 
				"sc.score_card_outcome_label || ' - ' || (CASE WHEN scc.score_card_outcome_answer = true THEN 'Yes' " +
				"ELSE 'No' END) AS outcome, " +
				"scc.selected_by AS selector, " +
				"cu.ct_user_ou_id as userOuId, " +
				"scc.selected_on AT TIME ZONE '"+data.timezone+"' AS selected_date_time, " +
				"scc.scored_by AS scorer, " +
				"scc.scored_on AT TIME ZONE '"+data.timezone+"' AS score_date, " +
				"scc.reviwed_by AS reviewer, " +
				"scc.reviwed_on AT TIME ZONE '"+data.timezone+"' AS reviwed_date_time, " +

				"CASE " +
				"	WHEN scc.score_card_call_status IS NULL THEN 'needs_scorecard' " +
				"	ELSE scc.score_card_call_status " +
				"END AS status,   " +
				"cd.recording_file AS play_call";

				var qryCnt = "SELECT COUNT(c.call_id) AS total_count_calls ";

				var qryMain = " FROM call c " +
									" LEFT JOIN score_card_calls scc ON scc.call_id = c.call_id " +
									" LEFT JOIN score_cards sc ON sc.score_card_id = scc.score_card_id " +
									" LEFT JOIN org_unit ou ON ou.org_unit_id = c.org_unit_id "	+		
									" LEFT JOIN ct_user cu ON cu.ct_user_id = c.ct_user_id "  +
									" LEFT JOIN call_fields cf ON cf.call_id = c.call_id ";
									
				if(data.filter.lastIndexOf('t.tag_name') > -1){
					qryMain +=	" JOIN call_tag ct ON ct.call_id = c.call_id "  
					qryMain += 	" JOIN tag t ON t.tag_id = ct.tag_id ";
				}

				if(data.filter.lastIndexOf('cm.comment_text') > -1){
					qryMain +=	" JOIN comment cm ON cm.call_id = c.call_id "  

				}
				// if (req.query.count !== undefined && (req.query.count === false || req.query.count === 'false')) {
				// 	qryMain += " LEFT JOIN comment cm ON cm.call_id = c.call_id " +
				// 		" LEFT JOIN call_criteria cc ON cc.call_id = c.call_id " +
				// 		" LEFT JOIN call_tag ct ON ct.call_id = c.call_id " + 
				// 		" LEFT JOIN tag t ON t.tag_id = ct.tag_id ";
				// }	

				qryMain += " LEFT JOIN call_detail cd ON cd.call_id = c.call_id " +
				" WHERE ou.org_unit_status IN ('deleted','active','inactive') " 
				// "AND ou.org_unit_id IN ("+req.user.orglist+")"+(da	ta.filterRule ? data.filterRule+' ' : '');

				if(data.status){
					var tempStatusString = '';
					commonMethods._.each(data.status, function(status) {
						tempStatusString += "'" + status + "',";
					})
					qryMain += " AND CASE " +
					"	WHEN scc.score_card_call_status IS NULL THEN 'needs_scorecard' " +
					"	ELSE scc.score_card_call_status " +
					"END IN(" + tempStatusString.replace(/,\s*$/, "") + ")"; 
				}	
				
				var ct_user_qry = " c.ct_user_id = " + req.user.user_id;

				if (data.start_date && data.end_date) {
					if (data.end_date.length <= 10) { data.end_date += ' 23:59:59'; } //if not time specified
					qryMain += " AND c.call_started BETWEEN '"+data.start_date +" "+data.timezone+"' AND '"+data.end_date +" "+data.timezone+"' ";
				}

				if (req.user.role_id === 8) {
                    // qryMain += " AND c.ct_user_id = " + req.user.user_id + (data.filterRule ? data.filterRule + ' ' : '');
                    qryMain += "AND" + ct_user_qry + (data.filterRule ? data.filterRule + ' ' : '');
                } else {
                    qryMain += "AND (ou.org_unit_id IN (" + req.user.orglist + ")" + " OR " + ct_user_qry + ")" + (data.filterRule ? data.filterRule + ' ' : '');
                    // qryMain += ;
                }


				var ret = {};
				var call = [];
				var callList = [];
				var ret2 = [];
				var callIds = [];
				commonMethods.async.waterfall([
					function(cb) {
						
						// only retrieve the count total of record set
						if (req.query.count !== undefined && (req.query.count === true || req.query.count === 'true')) {
							
							commonMethods.connector.ctPool.query(qryCnt+qryMain, function(err, callData) {
								if (err) { return cb('Failed to execute query to get total count. '+err); }
								ret['total'] = callData[0];
								cb(null,ret);
							});
						} else {
							cb(null,ret);
						}
					},
					function(ret,cb) {
						// execute query to get data set
							if (req.query.count !== undefined && (req.query.count === true || req.query.count === 'true')) {
								if (data.order == 'username'){
									data.order = 'agent'
								}
								qryMain += " ORDER BY "+data.order+" " + data.orderBy +" LIMIT "+data.limit+" OFFSET "+data.offset; }
							commonMethods.connector.ctPool.query(qryPre+qryMain, function(err, callRec) {
								if (err) { return cb('Failed to execute report query. '+err); }
								
								callList = callRec;

								//var duration =commonMethods._.pluck(callList, 'duration');
								 //var d = moment.utc(duration * 1000).format("HH:mm:ss");
								//console.log("call list:==============", duration);

								ret['call'] = callRec;
								callIds =commonMethods._.pluck(callList, 'call_id');
								
								//commenter = commonMethods._.pluck(callList, 'commenter');
								selector = commonMethods._.pluck(callList, 'selector');
								scorer = commonMethods._.pluck(callList, 'scorer');
								reviewer = commonMethods._.pluck(callList, 'reviewer');
								ct_user_ids = commonMethods._.without(commonMethods._.union(selector, scorer, reviewer), null);
								
								cb(null,ret, ct_user_ids, callIds);
							});
					},
					function(ret, ct_user_ids, callIds, cb) {
						var zone = req.query.timezone;
						if (req.query.count !== undefined && (req.query.count === false || req.query.count === 'false')) {
							var commentQry = "SELECT c.call_id, array_to_string(array_agg(DISTINCT cm.comment_text), ',') as comment, " +
											"array_to_string(array_agg(DISTINCT cm.comment_created AT TIME ZONE '" + zone + "'), ',') AS comment_date_time, " +
											"array_to_string(array_agg(DISTINCT t.tag_name), ',') AS tag, " +
											"array_to_string(array_agg(DISTINCT first_name || ' ' || last_name || ' | ' || username), ',') AS commenter " +
											"from call c " +
											"LEFT JOIN comment cm ON cm.call_id = c.call_id " +
											"LEFT JOIN ct_user cu ON cu.ct_user_id = cm.ct_user_id " +
											"LEFT JOIN call_tag ct ON ct.call_id = c.call_id  " +
											"LEFT JOIN tag t ON t.tag_id = ct.tag_id " +
											"WHERE c.call_id IN (" + callIds.join(",") + ") GROUP BY c.call_id"


							commonMethods.connector.ctPool.query(commentQry, function(err, commentDEtails) {
								
								async.each(ret.call, function(detail, callback2) {
											var tempCommentDetail = _.find(commentDEtails, function(commentDetail){
												return commentDetail.call_id == detail.call_id;
											})
											// if(tempCtUserName !== undefined){
											// 	detail[keyType] = tempCtUserName.name;	
											// }
											detail.comment = tempCommentDetail.comment;
											detail.comment_date_time = tempCommentDetail.comment_date_time;
											detail.tag = tempCommentDetail.tag;
											detail.commenter = tempCommentDetail.commenter;

										callback2(null);
								}, function(err) {
									if (err) { return cb(err); }
									cb(null, ret, ct_user_ids);
								});								
							});
						}else{
							cb(null,ret, ct_user_ids);
						}	
					},
					function(ret, ct_user_ids, cb) {
						commonMethods.AWS.config.update({accessKeyId: commonMethods.s3yml[envVar].access_key_id, secretAccessKey: commonMethods.s3yml[envVar].secret_access_key});
						if(ct_user_ids.length > 0){
							var ctUserQry = "SELECT cu.ct_user_id, cu.first_name || ' ' || cu.last_name || ' | ' || cu.username AS name from ct_user as cu where  cu.ct_user_id IN (" +ct_user_ids.join(",")+ ")";
							commonMethods.connector.ctPool.query(ctUserQry, function(err, userDetails) {
								async.each(ret.call, function(detail, callback2) {
									_.each(['selector', 'scorer', 'reviewer'], function(keyType){
										var tempCtUserName = _.find(userDetails, function(userInfo){
											return userInfo.ct_user_id == detail[keyType];
										})
										if(tempCtUserName !== undefined){
											detail[keyType] = tempCtUserName.name;	
										}
									})
									callback2(null);
								}, function(err) {
									if (err) { return cb(err); }
									cb(null, ret);
								});								
							});
						}else{
							cb(null, ret);
						}			
					},
					function(ret, cb) {
						commonMethods.AWS.config.update({accessKeyId: commonMethods.s3yml[envVar].access_key_id, secretAccessKey: commonMethods.s3yml[envVar].secret_access_key});
						async.each(ret.call, function(detail, callback2) {
							file = detail.play_call;
							if(file){
								var s3 = new commonMethods.AWS.S3();
								file = file.substr(0, file.lastIndexOf('.')) || file;
								var s3_expire = (req.user.s3_expire) ? req.user.s3_expire : 86400*7;
								var params = {Bucket: commonMethods.s3yml[commonMethods.envVar].bucket, Key: "call_recordings/" + file + ".mp3" , Expires: s3_expire};
								s3.getSignedUrl('getObject', params, function (err, url) {
									detail.play_call = (err ? 'error' : url);
									callback2(err);
								});
							}else{
								callback2(null);
							}							
						}, function(err) {
							if (err) { return cb(err); }
							cb(null, ret);
						});								
					},
					function(ret, cb){
						async.each(ret.call, function(detail, callback) {
							var duration = detail.duration;
							detail.duration = moment.utc(duration * 1000).format("HH:mm:ss");
							callback(null);

							}, function(err) {
								if (err) { return cb(err); }
								cb(null, ret);
						});
					},
					function(ret, cb) {
							var ctUserQry = "SELECT * FROM user_permissions where ct_user_id = " + req.user.user_id;
							commonMethods.connector.ctPool.query(ctUserQry, function(err, userAccessData) {
								if (err) { return cb('Failed to execute query to get total count. '+err); }
								ret['access_audio'] = userAccessData[0].access_audio;
								ret['score_call'] = userAccessData[0].score_call;
								cb(null,ret);								
							});
					}
				], function(err) {					
					if (err) { return callback(err); }
					callback(null, ret);
				});
			},
		], function(err, result) {
			if (err) { return res(err); }
			res(err, result);
		});
	},

	retriveActiveScoreCards: function(req, res) {

		async.waterfall([
			function (callback) {
			var strSelectQry = "SELECT score_card_id, score_card_title FROM score_cards " + 
							" WHERE scorecard_status = 'active' AND ARRAY["+req.params.ouid+"] <@ ARRAY[groups_list] ORDER BY  score_card_title";
			commonMethods.connector.ctPool.query(strSelectQry, function(err, scoreCardData) {
				
				if (err) {
						callback(null, res('Failed to execute query to get active score cards. '+err)) 
				}else{
						scoreCardData.unshift({
							"score_card_id": "unassigned",
							"score_card_title": "Unassign"
						})
						callback(null,scoreCardData);
					}
				});
		},function (scoreCardData,callback) {

			var strSelectQryNew = "SELECT DISTINCT sc.score_card_id, sc.score_card_title FROM score_cards sc";
			strSelectQryNew +=	" LEFT JOIN score_card_calls scc ON scc.score_card_id = sc.score_card_id";
			strSelectQryNew += " WHERE scc.score_card_call_status !='unscored' AND sc.scorecard_status = 'active' AND sc.org_unit_id = " + req.params.ouid;
			strSelectQryNew += " ORDER BY  sc.score_card_title"; 
			commonMethods.connector.ctPool.query(strSelectQryNew, function(err, scoreCardData1) {
				
				if (err) {
					return res('Failed to execute query to get active score cards. '+err); 
				}else{
					scoreCardData1.unshift({
						"score_card_id": "unassigned",
						"score_card_title": "Unassign"
					})
					scoreCardData = _.uniq(_.union(scoreCardData, scoreCardData1), false, _.property('score_card_id'));
					// res(null,scoreCardData);
				}
			});

			callback(null,scoreCardData);
		
		}
		], function(err, result) {
			if (err) { return res(err); }
			res(err, result);
		});
	},
	saveAgent: function(req, res){

		var strSelectQry = "SELECT call_id FROM score_card_calls WHERE score_card_call_id = " +req.params.scoreCardCallId;
		
		commonMethods.connector.ctPool.query(strSelectQry, function(err, scoreCardCallData) {
			if (err) {
				return res('Failed to execute query to get call_id of score cards calls. '+err); 
			}else{
				var updateAgentQry = "UPDATE call SET ct_user_id = " + req.params.ctUserId+ " WHERE call_id = " +scoreCardCallData.call_id;
				
		 
				commonMethods.connector.ctPool.query(updateAgentQry, function(err, updateAgentsData) {
					
					if (err) {
						return res('Failed to update ct_user_id(agent) for score_card_call. '+err); 
					}else{
						res(null,updateAgentsData);
					}
				});
			}
		});			
	},
	getIdentifyUsers : function(req, res){
		var user_ids = [];
		var qry = "SELECT org_unit_id FROM call WHERE call_id="+req.params.callID;
		commonMethods.connector.ctPool.query(qry, function(error, group_data) {
			if(error){
				return res(err);
			}else{
				console.log("org_unit_id", group_data[0].org_unit_id);
               var grpQuery = "SELECT ct_user_id FROM user_permissions  WHERE "+ group_data[0].org_unit_id+" = any(groups_list)";
			   commonMethods.connector.ctPool.query(grpQuery, function(error, ctUser_data){
				   if(error){
					return res(error)
				   }else{
					   for(var ele of Object.keys(ctUser_data)){
                         user_ids.push(ctUser_data[ele].ct_user_id);
					   }
					   var query = "SELECT cu.first_name || ' ' || cu.last_name || ' | ' || cu.username AS username, cu.ct_user_id, cu.ct_user_ou_id	";
					  	   query += "FROM ct_user as cu ";
					       query += "LEFT JOIN partner_admin_user AS pau on pau.ct_user_id = cu.ct_user_id ";
						   query +="WHERE  cu.user_status = 'active' AND cu.role_id IN (1,2,3,8) AND cu.ct_user_id IN(" + user_ids+ ") AND pau.ct_user_id is null  ORDER BY cu.first_name";
						   commonMethods.connector.ctPool.query(query, function(err, users){
							if (err) {
								 return res('Failed to execute query to get active users '+err); 
							}else{
								users.unshift({
									"username": "Unassign",
									"ct_user_id": "unassigned",
									"ct_user_ou_id":"unassigned"
								})
								res(null,users);
							}
						});
				   }
			   });
			}
		});
	},

	saveComment: function(req, res){
		req.body.comment_text = req.body.comment_text.replace("$$", ""); //remove $$ if found 
		var strInsertQry = "INSERT INTO comment (call_id,ct_user_id,comment_text,comment_active,comment_timestamp, is_from_report) VALUES (" + req.params.callID+ ", " +req.body.ct_user_id+ ", $$"+req.body.comment_text+"$$, 't', '"+req.body.comment_timestamp+"', 'f')";
		
		commonMethods.connector.ctPool.query(strInsertQry, function(err, insertCommentData) {
			if (err) {
				return res('Failed to execute query to insert comment for score card call. '+err); 
			}else{
				res(null,insertCommentData);
			}
		});	
	},

	saveCallCriteria: function(req, res){
		
		if(req.body.isChecked) {
			var strCallCriteriaQry = "INSERT INTO call_criteria (call_id,scorecard_criteria_id,criteria_timestamp,created_by,updated_by, display_order) VALUES (" + req.params.callID+ ", " +req.body.scorecard_criteria_id+ ", '"+req.body.criteria_timestamp+"', " +req.body.ct_user_id+ ", " +req.body.ct_user_id+ ", " + req.body.displayOrder + ")";
		} else {
			var strCallCriteriaQry = "DELETE FROM call_criteria WHERE scorecard_criteria_id = " +req.body.scorecard_criteria_id+ " AND call_id = "+req.params.callID;
		}

		commonMethods.connector.ctPool.query(strCallCriteriaQry, function(err, insertCallCriteriaData) {
			if (err) {
				return res('Failed to execute query to insert/delete call criteria. '+err); 
			}else{
				res(null,insertCallCriteriaData);
			} 
		});	
	},

	retriveAdvancedFilterActiveScoreCards: function(req, res) {
		 var qry = "SELECT DISTINCT(sc.score_card_title), sc.score_card_id FROM score_cards sc"
		 qry += " WHERE sc.scorecard_status = 'active' AND sc.groups_list <@ ARRAY[ " + req.orglist + "] ORDER BY  sc.score_card_title;"

		 commonMethods.connector.ctPool.query(qry, function(err, scoreCardData) {
			if (err) {
				return res('Failed to execute query to get active score cards. '+err); 
			}else{
				scoreCardData.unshift({
					"score_card_id": "unassigned",
					"score_card_title": "Unassign"
				})
				res(null,scoreCardData);
			}
		});
	},
	checkIfUserValid : function(req, res){
		var qry = "SELECT ct_user_id from user_permissions WHERE  " + req.params.callGroup + " = ANY(groups_list) AND ct_user_id = "+req.params.userId+" limit 1";
		commonMethods.connector.ctPool.query(qry, function(err, result) {
			if(err){return res(null, []);}else{
				if(result.length > 0){
					res(null, result);
				}else{
					res(null, []);
				}
			}
        });		
	},
};
module.exports = scoreCardCall;
