var mysql               = require('mysql'),
	connector           = require('./appModel'),
	appModel            = require('./appModel'),
	ctTransactionModel  = require('./ctTransactionModel'),
	yaml                = require("js-yaml"),
	f                   = require('../functions/functions.js'),
	access              = require('../controllers/userAccessController'),
	fs                  = require('fs'),
	e                   = yaml.load(fs.readFileSync("config/database.yml")),
	async               = require('async'),
	envVar              = process.env.NODE_ENV,
	orgUnitModel        = require('./orgUnitModel.js'),
	callFlowModel       = require('./callFlowModel.js'),
	numberPoolModel     = require('./newNumberPoolModel.js'),
	report              = require('./reportModel.js'),
	table               = 'callFlowReport',
	moment			        = require('moment'),
	momentTimezone      = require('moment-timezone'),
	amqp        	      = require('amqplib'),
	ctlogger            = require('../lib/ctlogger.js'),
	when                = require('when'),
	toll_frees          = require('../config/toll_free.json'),
	csTransactionModel  = require('./csTransactionModel'),
	grep                = require('grep-from-array'),
	_					= require('underscore');
	var scorecard 		= require('./scoreModel');


var	rabbit = yaml.load(fs.readFileSync("./config/rabbit.yml"));
var timezone = 'UTC';
var  url = 'amqp://'+rabbit[envVar].user+':'+rabbit[envVar].password+'@'+rabbit[envVar].host+':'+rabbit[envVar].port+'/'+rabbit[envVar].vhost;
var nonHavingValues = ['ou.org_unit_id', 'ou.org_unit_name','ou.org_unit_ext_id','pr.provisioned_route_name', 'pn.number','c.campaign_name', 'c.campaign_ext_id']


var scoreDetail = {

callDetailScorecard: function(req, res) {
		async.waterfall([
			function(callback) {
				// check if we need to lookup the filter settings
				report.loadFilterRule(req, function(err, filterSetting) {
					if (err) { return callback(err); }
					req = filterSetting;
					callback(null);
				});
			},
			function(callback) {
				// var filterVal = req.query.filter;
				// var dateObj = new Date(filterVal);
				// var momentObj = moment(dateObj);
				// var momentString = momentObj.format('YYYY-MM-DD HH:MM:SS');
				// var dateCheck = momentObj.isValid();
				// console.log('FILTER RULES SET', req.query.filterRule);
				// var data = req.query;
				// data.order = (data.order !== undefined && data.order !== '' ? data.order : 'call_started');
				// if (data.exportData === true) { data.limit = 10000; data.offset = 0; }
        //
				// if(data.filterRule !== undefined && data.filterRule.split(" ")[3] === 'NONE'){
        //
				// 	data.filterRule = data.filterRule.replace("NONE", "");
				// }
				var filterVal = req.query.filter.split(",")[2];
							console.log('FILTER RULES SET', req.query.filterRule);
				var data = req.query;
				data.order = (data.order !== undefined && data.order !== '' ? data.order : 'call_started');
				if (data.exportData === true) { data.limit = 10000; data.offset = 0; }

				if(data.filterRule !== undefined && data.filterRule.split(" ")[3] === 'NONE'){

					data.filterRule = data.filterRule.replace("NONE", "");
				}
				var qryPre = "SELECT DISTINCT call.call_id, call.call_started AT TIME ZONE '"+data.timezone+"' AS call_started, " +
					"cd.ring_to_name as ring_to_name, cd.recording_file,  call.disposition, call.duration, call.repeat_call, cu.username, sc.score_card_name, "+
					"cs.call_score_card_id, cs.appt_booked, cs.user_id, cs.score_card_id, cs.score, cs.call_scored_date, cs.call_score_reviewed,cs.call_score_status,cs.call_scored_by, ou.org_unit_name, ou.org_unit_id ";
				var qryCnt = "SELECT COUNT(call.call_id) AS total_count_calls ";
				var qryMain = "FROM call call "+
					"JOIN org_unit ou ON call.org_unit_id = ou.org_unit_id "+
					"JOIN campaign_provisioned_route cpr ON call.provisioned_route_id = cpr.provisioned_route_id "+
					"JOIN call_detail cd ON call.call_id = cd.call_id "+
					"LEFT JOIN call_score_card cs ON call.call_id = cs.call_id "+
					"LEFT JOIN score_card sc ON cs.score_card_id = sc.score_card_id "+
					((filterVal !== "(no keywords)")?"LEFT JOIN call_keywords ck ON ck.call_id = cd.call_id ":"")+
					"JOIN provisioned_route pr ON pr.provisioned_route_id = call.provisioned_route_id "+
					"LEFT JOIN ct_user cu ON (ou.org_unit_id = cu.ct_user_ou_id AND cu.ct_user_id="+req.user.user_id+") " +
					"WHERE ou.org_unit_id IN ("+req.user.orglist+")"+(data.filterRule ? data.filterRule+' ' : '');// +"AND ou.org_unit_name like '%"+filterVal +"%' ";


					// if(!dateCheck){
						 // qryMain += " AND (CAST(cs.score AS TEXT) LIKE '%"+f.pg_escape_str1(filterVal) +"%' OR CAST(cs.call_score_status AS TEXT) LIKE '%"+f.pg_escape_str1(filterVal) +"%' OR cu.username LIKE '%"+f.pg_escape_str1(filterVal) +"%' ";
						 // qryMain += " OR ou.org_unit_name LIKE '%"+f.pg_escape_str1(filterVal) +"%' OR sc.score_card_name LIKE '%"+f.pg_escape_str1(filterVal) +"%' OR cd.ring_to_name LIKE '%"+f.pg_escape_str1(filterVal) +"%')";
					// }else {
					// 	 qryMain += " AND (call.call_started::text LIKE '%"+ filterVal+" "+data.timezone +"%' OR cs.call_scored_date::text LIKE '%"+ filterVal+" "+data.timezone +"%')";
					// }

				// add date range
				if (data.start_date && data.end_date) {
					if (data.end_date.length <= 10) { data.end_date += ' 23:59:59'; } //if not time specified
					qryMain += " AND call.call_started BETWEEN '"+data.start_date +" "+data.timezone+"' AND '"+data.end_date +" "+data.timezone+"' ";
				}

				if (req.query.count === undefined || req.query.count === false) { qryMain += " ORDER BY "+data.order+" DESC LIMIT "+data.limit+" OFFSET "+data.offset; }

				var ret = {};
				var call = [];
				var callList = [];
				var ret2 = [];
				var callIds = [];
				async.waterfall([
					function(cb) {
						console.log('COUNT', req.query.count, typeof req.query.count);
						// only retrieve the count total of record set
						if (req.query.count !== undefined && (req.query.count === true || req.query.count === 'true')) {
							console.log('Executing count query');
							connector.ctPool.query(qryCnt+qryMain, function(err, callData) {
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
							console.log('Executing data set query');
							connector.ctPool.query(qryPre+qryMain, function(err, callRec) {
								if (err) { return cb('Failed to execute report query. '+err); }
								callList = callRec;
								ret['call'] = callRec;
								callIds =_.pluck(callList, 'call_id');
								cb(null,ret);
							});
					}
				], function(err) {
					if (err) { return callback(err); }
					callback(null, ret);
				});
			},
      function(ret, callback){
        var query ="SELECT cu.ct_user_id, cu.username, cu.first_name, cu.last_name, cu.ct_user_ou_id, up.groups_list FROM ct_user cu JOIN user_permissions up ON (up.ct_user_id = cu.ct_user_id) WHERE up.score_call = true AND cu.ct_user_ou_id IN ("+req.user.orglist+") AND user_status='active'";
          appModel.ctPool.query(query, function(error, data){
            if (error){ res(error);}
            if(data.length > 1){
              ret["agent"] = data;
              callback(null,ret);
            }else {
              callback(null,ret);
            }
          });
      },
      function(ret, callback){
        var query ="SELECT score_card_id, score_card_name, org_unit_id, score_card_created FROM score_card WHERE org_unit_id IN ("+req.user.orglist+") AND score_card_status !='archieve'";
          appModel.ctPool.query(query, function(error, data){
            if (error){ res(error);}
            if(data.length > 0){
              ret["score_card"] = data;
              callback(null,ret);
            }else {
              callback(null,ret);
            }
          });
      }
		], function(err, result) {
			if (err) { return res(err); }
			res(err, result);
		});
	},

getCallAudioFile : function(req, res){
	var s3yml = yaml.load(fs.readFileSync("config/s3.yml")),
		AWS = require('aws-sdk');
		var qry= "SELECT call.duration, cd.recording_file FROM call call JOIN call_detail cd ON cd.call_id = call.call_id WHERE call.call_id = "+req.params.callID;
    appModel.ctPool.query(qry, function(error, data){
      if (error){ res(error);}
				AWS.config.update({accessKeyId: s3yml[envVar].access_key_id, secretAccessKey: s3yml[envVar].secret_access_key});
					var file = null;
					if(data){
					 	//data[0].duration = moment.utc(data[0].duration * 1000).format("HH:mm:ss");
						if (data[0].recording_file === '' || data[0].recording_file === undefined ) {
							data[0].s3URL = null;
							res(null,data[0]);
						} else {
							file = data[0].recording_file;
							var s3 = new AWS.S3();
							file = file.substr(0, file.lastIndexOf('.')) || file;
							var s3_expire = (req.user.s3_expire) ? req.user.s3_expire : 86400*7;
							var params = {Bucket: s3yml[envVar].bucket, Key: "call_recordings/" + file + ".mp3" , Expires: s3_expire};
							s3.getSignedUrl('getObject', params, function (err, url) {
								data[0].s3URL = (err ? 'error' : url);
								res(null,data[0]);
	    					});
						}
					}else{
						res(null,data[0]);
					}
			});
},

getCallsTags : function(req, res){
	var ret = {};
	var query="SELECT * FROM call_tag ct, tag t WHERE ct.tag_id = t.tag_id and call_id="+parseInt(req.params.callID);
	 appModel.ctPool.query(query, function(error, data){
      if (error){ res(error);}
      if(data.length > 0){
	 	ret.tags = data;
        res(null,ret);
      }else {
        res(null,[]);
      }
    });
},

getIdentifyUsers : function(req, res){
  var query ="SELECT username FROM ct_user WHERE ct_user_ou_id IN ("+req.user.orglist+")";
    appModel.ctPool.query(query, function(error, data){
      if (error){ res(error);}
      if(data.length > 1){
        var users = _.pluck(data,'username');
        res(null,users);
      }else {
        res(null,null);
      }
    });
},
updateScoreCallDetail:function(req,res){
	var data = req.body;
	if(data !=undefined){
		if(data.call_score_card_id || data.call_score_card_id != null){
			async.parallel([
				function(cb1){
						var tags = data.tags > 0 ? "ARRAY["+data.tags+"]" : "'{}'";
						var qry = "Update call_score_card SET score_card_id = " + data.selectedScorecard + ", score = '" + data.score + "', call_score_status = '" + data.call_score_status + "', call_scored_by = " + data.call_scored_by + ", user_id = "+ data.identifyAgent + ", appt_booked = "+data.appt_booked+" WHERE call_score_card_id = "+data.call_score_card_id;

						appModel.ctPool.query(qry, function (err, result) {
								if (err) { return res(err); }
								else{
									cb1(null);
								}
								});
				},
				function(cb1){
						var comments = [];

						if(data.comments.length > 0){
							async.each(data.comments, function (comment, cb2) {
								comments.call_id = data.call_id;
								comments.comment_text = comment;
								comments.comment_active = true;
								comments.ct_user_id = data.user_id;
								comments.comment_parent_id = '';
								var insertData = {
										table:  'comment',
										values: comments
								};

								appModel.ctPool.insert(insertData, function (err, result) {
										if (err) { cb2(err); }
									});
									cb2(null);
							},function(err){
								if (err) { cb1(err); }
								cb1(null);
							});
						}else{
							cb1(null);
						}
				},
				function(cb1){
					var tags = [];
					if(data.tags.length > 0){
						async.each(data.tags, function (tag, cb2) {
							tags.tag_id = tag;
							tags.call_id = data.call_id;
							tags.ct_user_id = data.user_id;
							var insertData = {
									table:  'call_tag',
									values: tags
							};

							appModel.ctPool.insert(insertData, function (err, result) {
									if (err) { cb2(err); }
								});
								cb2(null);
						},function(err){
							if (err) { cb1(err); }
							cb1(null);
						});
					}else{
						cb1(null);
					}
				},
				function(cb1){
					var rating = [];
					if(data.scorecard_rating.length > 0){
						async.each(data.scorecard_rating, function (rate, cb2) {
							if(rate.selectedCheckPass){
								rating.criteria_answer = 1;
							} else if(rate.selectedCheckFail){
								rating.criteria_answer = 0;
							} else {
								rating.criteria_answer = parseInt(rate.selectedRadio);
							}
							rating.call_score_card_id = data.call_score_card_id;
							rating.score_card_id = data.score_card_id;
							var insertData = {
									table:  'call_score_criteria_review',
									values: rating
							};

							appModel.ctPool.insert(insertData, function (err, result) {
									if (err) { cb2(err); }
								});
								cb2(null);
						},function(err){
							if (err) { cb1(err); }
							cb1(null);
						});
					}else{
						cb1(null);
					}
				}
			],
			function (err) {
			if(err){return res(err);}
				res(null,"Call Detail Scorecard  Updated successfully");
			});

		}else {
			var groups =[];
			var current_date_timestamp = 'CURRENT_TIMESTAMP';
			var qry = "Insert into call_score_card (call_id, score_card_id, score, call_score_status, call_scored_by, user_id) values(";
			qry += "'" + data.call_id + "'," + data.score_card_id + ",'" + data.score + "','" + data.call_score_status + "'," + data.call_scored_by + ","+ data.user_id + ") RETURNING call_score_card_id";

			appModel.ctPool.query(qry, function (err, result) {
					if (err) { return res(err); }
					else{
						res(null,result[0]);}
					});
		}
	}
},
updateScoreStatus:function(req,res){
	if (req.params.callScorecardId || req.params.callScorecardId != null) {
		var selectCallQuery = "SELECT ct_user_id FROM call WHERE call_id =" + req.params.callScorecardId;
		appModel.ctPool.query(selectCallQuery, function (err, result) {
			if (err) { res(err) }
			else if (result.length === 0) {
				res('Call record does not exist.');
			} else if (result.length > 0 && !result[0].ct_user_id) {
				res('Identified agent not attached to the call. Please add identified agent and score card to call before score or review.');
			} else {
				var current_date_timestamp = 'CURRENT_TIMESTAMP';
				var qry = "UPDATE score_card_calls SET reviwed_by = " + req.userid + " ,reviwed_on = " + current_date_timestamp + " , score_card_call_status = '" + req.params.callScoreStatus + "' WHERE call_id = " + req.params.callScorecardId;
				appModel.ctPool.query(qry, function (err, result) {
					if (err) {
						return res(err);
					} else {
						var selectQry = "SELECT scored_by FROM score_card_calls WHERE call_id = " + req.params.callScorecardId;
						console.log(selectQry);
						appModel.ctPool.query(selectQry, function (err, result) {
							console.log(result);
							if (err) {
								return res(err);
							} else {
								scorecard.get_org_details(req.params.callScorecardId, function (err, orgDetails) {
									if (err) { console.log(err); } else {
										var qdata = {};
										qdata.call_id = req.params.callScorecardId;
										qdata.org_id = orgDetails[0].org_unit_id;
										qdata.org_name = orgDetails[0].org_unit_name;
										qdata.call_action = 'reviewed';
										qdata.process = 'scorecardactions';
										qdata.user_id = result[0].scored_by;
										qdata.timezone = req.query.timezone;
										scorecard.send_score_to_rabbit_q(qdata, function () {
											res(null, orgDetails);
										});
									}
								});
							}
						});
					}
				});
			}
		});
	}
},
addScoreCallDetail: function(req, res){
	var data = req.body;
	if(data !=undefined){
		var groups =[];
		var current_date_timestamp = 'CURRENT_TIMESTAMP';
		if(!data.call_score_card_id){
			var qry = "Insert into call_score_card (call_id, score_card_id, score, call_score_status, call_scored_by, user_id) values(";
			qry += "'" + data.call_id + "'," + data.score_card_id + ",'" + data.score + "','" + data.call_score_status + "'," + data.call_scored_by + ","+ data.user_id + ") RETURNING call_score_card_id";

			appModel.ctPool.query(qry, function (err, result) {
					if (err) { return res(err); }
					else{
						res(null,result[0]);}
			});
		}else {
			var qry = "Update call_score_card SET score_card_id = " + data.selectedScorecard + ", score = '" + data.score + "', call_score_status = '" + data.call_score_status + "', call_scored_by = " + data.call_scored_by + ", user_id = "+ data.identifyAgent + " WHERE call_score_card_id = "+data.call_score_card_id;

			appModel.ctPool.query(qry, function (err, result) {
					if (err) { return res(err); }
					else{
						res(null,"Updated Successfully");
					}
			});
		}

	}
},
addTagByCallId:function(req,res){
		console.log("\n~~~~~~~~~~~~~~~\n~~~~~~~~")
	console.log("res.body----\n",req.body)
	console.log("req.params===",req.params)
	var query="insert into call_tag (call_id,tag_id,ct_user_id)values("+req.params.callID+","+req.body.tag_id+","+req.body.userId+")";
	appModel.ctPool.query(query, function (err, result) {
		if (err) { return res(err); }
		else{
			res(null,"Tag inserted Successfully");
		}
	});
},
deleteTagByCallId:function(req,res){
	
	console.log("req.params===",req.params)
	var query="delete from call_tag  where call_id="+req.params.callID+" and tag_id="+req.params.tagId;
	appModel.ctPool.query(query, function (err, result) {
		if (err) { return res(err); }
		else{
			res(null,result);
		}
	});
},
addCommentRespons:function(req, res){
	console.log("addCommentRespons in model........")
	console.log("res.params=",req.params);
	console.log("res.body=",req.body);
	//req.params.parentResponId==undefined?0:req.params.parentResponId;
	req.body.commentText = req.body.commentText.replace("$$", ""); //remove $$ if found 
	var query ="Insert into comment_response (comment_id,response,created_by,updated_by) values("+req.params.commentID+",$$"+req.body.commentText+"$$,'"+req.body.created_by+"','"+req.body.updated_by+"') RETURNING comment_response_id ";
    appModel.ctPool.query(query, function(error, data){
      if (error){ res(error);}
      if(data.length > 1){
       // var users = _.pluck(data,'username');
        res(null,data);
      }else {
        res(null,null);
      }
    });
},

deleteComment: function(req, res){
	console.log("deleteComment in model........")
	console.log("res.params=",req.params);
	console.log("res.body=",req.body);
	
	//var ret ;
	async.waterfall([
		function(callback) {
	 		var query =" delete FROM comment_response where comment_id = " + req.params.commentID;
				appModel.ctPool.query(query, function(error, data){
			      if (error){ return callback(error);}
			      //console.log("data is ", data);
			      if(data.length >= 0){
			      	console.log("data=",data);
			      	//ret = data;
			      	 callback(null,data);
			      }
			  });
		},
		function(ret, callback){
			//console.log("rest=",ret)
			//var newResult = ret;
			var query = "delete from comment where comment_id =" + req.params.commentID ;
			appModel.ctPool.query(query, function(error, data){
		      if (error){ res(error);}
		      else{ res(null,data);}
		    });
		}
	


	], function(err,result) {
		if (err) { return res(err); }
			res(null, result);
	});	

},

deleteCommentResponse: function(req, res){
	console.log("deleteComment in model........")
	console.log("res.params=",req.params);
	console.log("res.body=",req.body);

	var query = "delete from comment_response where comment_response_id=" + req.params.responseID ;
	appModel.ctPool.query(query, function(error, data){
      if (error){ res(error);}
      else{ res(null,data);}
    });

},
getAllComments:function(req,res){
	var zone = (req.query.timezone ? req.query.timezone : 'EST'); 
	console.log("getAllComments in model........" , req.query.timezone)
	// console.log("res.params=",req.params);
	async.waterfall([
       function(done){
	     // Fetch comment details and commented user details.
		var query = " SELECT c.comment_id, c.call_id, c.comment_text, c.comment_created AT TIME ZONE '" + zone + "' as comment_created, c.comment_timestamp, c.is_from_report,c.source,cu.first_name, cu.last_name FROM comment c LEFT JOIN comment_response cr ON (cr.comment_id = c.comment_id), ct_user cu WHERE c.ct_user_id = cu.ct_user_id and c.call_id  = " + req.params.callID + " GROUP BY c.comment_id, cu.ct_user_id; "
		// var query = " SELECT c.*, cu.*, COALESCE(COUNT(comment_response_id),0) as comment_responseCount FROM comment c LEFT JOIN comment_response cr ON (cr.comment_id = c.comment_id), ct_user cu WHERE c.ct_user_id = cu.ct_user_id and c.call_id  = " + req.params.callID + " GROUP BY c.comment_id, cu.ct_user_id ";
			appModel.ctPool.query(query, function(error, data){
			  if (error){ return res(error);}
			  console.log("@@@@@@@@@@@@@@@@@ data is ", data);
			  done(null,data); // Pass data to next function
		  });
	   },
       function(comments, done){
		if(comments && comments.length > 0) {
        var commentIdArray = _.map(comments, function(comment) {return comment.comment_id});
		var query =" SELECT cr.comment_response_id, cr.comment_id, cr.response, cr.created_on, cu.first_name, cu.last_name FROM comment_response cr, ct_user cu WHERE cr.created_by = cu.ct_user_id and cr.comment_id IN (" + commentIdArray.toString() + ")";
		appModel.ctPool.query(query, function(error, data){
		  if (error){ res(null,error);}
		  if(data && data.length > 0){
			// done(null,data);
			comments = _.map(comments, function(comment){
				var replies = _.filter(data, function(reply){
                    return comment.comment_id === reply.comment_id; 
				});
				comment['replies'] = replies;
				return comment;
			});
			res(null, comments);
		  } else {
			res(null, comments);
		  }
		  });
		} else {
			res(null, []);
		}
	   } 
	]);
	
	//console.log("res.body=",req.body);
	 //var query ="SELECT * FROM comment WHERE call_id = " + req.params.callID;
	 
	 // var query ="SELECT * FROM comment c LEFT JOIN comment_response cr ON cr.comment_response_id = c.comment_response_id WHERE c.call_id = " + req.params.callID;
  //   appModel.ctPool.query(query, function(error, data){
  //     if (error){ res(error);}
  //     console.log("data is ", data);
  //     if(data.length > 1){
  //     //  var users = _.pluck(data,'username');
  //     var commentIds=_.pluck(data, 'comment_id');
  //     console.log("\n all commentIds=",commentIds)
  //       res(null,data);
  //     }else {
  //       res(null,null);
  //     }
  //   });

 //    var ret ;
	// async.waterfall([
	// 	function(callback) {
	 		
	// 	},
		
	// ], function(err,result) {
	// 	if (err) { return res(err); }
	// 		res(null, result);
	// });

},
getCommentResponses:function(req,res){
	console.log("getAllComments in model........")
	console.log("res.params=",req.params);
	var query =" SELECT * FROM comment_response cr, ct_user cu WHERE cr.created_by = cu.ct_user_id and cr.comment_id = " + req.params.commentID;
	appModel.ctPool.query(query, function(error, data){
      if (error){ res(null,error);}
      //console.log("data is ", data);
      if(data.length > 0){
      	res(null,data);
      }
  	});
}


};
module.exports = scoreDetail;
