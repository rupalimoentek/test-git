var appModel            = require('./appModel'),
	connector           = require('./appModel'),
	ctTransactionModel  = require('./ctTransactionModel'),
	ceTransactionModel  = require('./ceTransactionModel'),
	orgUnitModel        = require('./orgUnitModel.js'),
	yaml                = require("js-yaml"),
	fs                  = require("fs"),
	async               = require('async'),
	ctlogger            = require('../lib/ctlogger.js'),
	_                   = require('underscore');
var timezone = 'UTC';

var distribution = {
	list: function(ouId, userId, roleId, res) {
		var subQuery = "SELECT org_unit_id from org_unit where org_unit_id = " + ouId + " or org_unit_parent_id = " + ouId + " or org_unit_parent_id IN(select org_unit_id from org_unit where org_unit_parent_id = " + ouId + ")";

		var query = "SELECT el.list_id, array_to_string(array_agg(rsch.report_name),'\n' ) as report_name, el.list_name, el.owner_user_id ";
		 	query += "FROM email_list as el ";
		 	query += "LEFT Join schedule sch on (sch.list_id = el.list_id) AND schedule_status != 'deleted' ";
		 	query += "LEFT Join report_sched rsch on (rsch.report_id = sch.report_id) AND rsch.report_status != 'deleted' ";
		 	query += "WHERE el.org_unit_id = " + ouId;
		 	query += "group by el.list_id, el.list_name, el.owner_user_id ";
		 	query += "ORDER BY el.list_name";

		appModel.ctPool.query(query, function(err, data) {
			if(err) {
				return res(err);
			}
			return res(null, data);
		});
	},
	getListById: function(req, res) {
		var receipientList = [];
		var listData = {};
		var additionalEmails = [];
		async.waterfall([
			function(cb){
				var query = "SELECT list_id,org_unit_id, list_name,from_label,owner_user_id FROM email_list WHERE list_id = "+req.params.id;
				appModel.ctPool.query(query, function(err, data) {
					if(err) {
						cb(err);
					} else {
						listData = {
							list_id 		: data[0].list_id,
							org_unit_id 	: data[0].org_unit_id,
							list_name 		: data[0].list_name,
							from_label 		: data[0].from_label,
							owner_user_id 	: data[0].owner_user_id,
						};
						cb(null);
					}
				});
			},
			function(cb) {
				var query = "SELECT recipient_id, campaign_id, ct_user_id, email_address FROM email_recipient WHERE list_id = "+req.params.id;
				appModel.ctPool.query(query, function(err, data) {
					if(err)
						cb(err);
					else
						cb(null, data);
				});
			},
            function(receipientData, cb) {
            	async.each(receipientData,function(receipient,cb2) {
            		var recipientHash = {};
            		recipientHash.recipient_id = receipient.recipient_id;
            		if(receipient.campaign_id !== null && receipient.campaign_id !== "") {
            			recipientHash.recipientType = "campaign";
            			recipientHash.recipientTypeValue = receipient.campaign_id;
            			receipientList.push(recipientHash);
            		}
            		if(receipient.ct_user_id !== null && receipient.ct_user_id !== "") {
            			recipientHash.recipientType = "user";
            			recipientHash.recipientTypeValue = receipient.ct_user_id;
            			receipientList.push(recipientHash);
            		}
            		if(receipient.email_address !== null && receipient.email_address !== "")
            			additionalEmails.push(receipient.email_address);

            		cb2(null);
            	},
				function(err) {
					cb(err)
				})
            }],
			function(err) {
				if(err)
					res(err);
				else {
					var data = {
						listData: listData,
						recipientlist: receipientList,
						additionalEmails:additionalEmails.join()
					}
				}
				res(null, data);
			}
		);

	},
	create: function(data, user_id, ou_id, res) {
		var distributionList = data.distributionlist;
		var list_id = "";
		var listData = {
			org_unit_id 	: distributionList.org_unit_id,
			list_name 		: distributionList.list_name,
			from_label 		: distributionList.from_label,
			owner_user_id 	: user_id
		};

		var ctTrans = new ctTransactionModel.begin(function(err) {
			async.waterfall([
				function(cb){
					var insertData = {
						which: 'insert',
						table: 'email_list',
						values: listData
					};
					ctTrans.query(insertData, function(err, result) {
						if(err)
							return cb(err);
						list_id = parseInt(result[0].list_id);
						cb(null, list_id);
					});
				},
	            function(listId, cb) {
					saveRecipients(ctTrans, distributionList.recipientlist, distributionList.additionalemails, listId, cb);
	            }],
				function(err){
					if(err) {
						ctTrans.rollback(function() {
							res(err);
						});
					}
					else {
						ctTrans.commit(function(err) {
							var newdata = {'org_unit_id':ou_id, 'ct_user_id':user_id, 'distribution_list_id':list_id, 'log_data': distributionList};
							ctlogger.log(newdata, 'insert', 'distribution_list');
							var data = {
								list_id: list_id,
								list_name: distributionList.list_name
							}
							res(err, data);
						});
					}
				}
			);
		}); //end ct transaction
	},
	update: function(data, user_id, ou_id, res) {
		if(data.distributionlist.list_id == undefined)
			return res(err, 'Invalid params passed.');

		var distributionList = data.distributionlist;
		var list_id = distributionList.list_id;
		var listData = {
			list_id 		: list_id,
			org_unit_id 	: distributionList.org_unit_id,
			list_name 		: distributionList.list_name,
			from_label 		: distributionList.from_label
		};

		var ctTrans = new ctTransactionModel.begin(function(err) {
			async.waterfall([
				function(cb) {
					var qry = "SELECT count(list_id) as numrecords FROM email_list WHERE list_id = "+ listData.list_id;
					appModel.ctPool.query(qry, function(err, result) {
						if(err)
							cb(err);
						else {
							if(result[0].numrecords > 0)
								cb(null);
							else
								cb("Record not fount");
						}
					});
				},
				function(cb){
					var updateData = {
						which: 'update',
						table: 'email_list',
						where: ' WHERE list_id = '+listData.list_id,
						values: listData
					};
					ctTrans.query(updateData, function(err, result) {
						cb(err, listData.list_id);
					});
				},
				function(listId, cb) {
					var qry = "DELETE FROM email_recipient WHERE list_id = "+ listId;
					ctTrans.query(qry, function(err, result) {
						cb(err, listId);
					});
				},
	            function(listId, cb) {
	            	saveRecipients(ctTrans, distributionList.recipientlist, distributionList.additionalemails, listId, cb);
	            }],
				function(err){
					if(err) {
						ctTrans.rollback(function() {
							res(err);
						});
					}
					else {
						ctTrans.commit(function(err) {
							var newdata = {'org_unit_id':ou_id, 'ct_user_id':user_id, 'distribution_list_id':list_id, 'log_data': distributionList};
							ctlogger.log(newdata, 'update', 'distribution_list');
							res(err, 'Distribution List updated.');
						});
					}
				}
			);
		});//end ct transaction
	},
	delete: function(req, res) {
		if(req.params.id) {
			listId = req.params.id;
			var ctTrans = new ctTransactionModel.begin(function(err) {
				async.waterfall([
				function(cb) {
					var qry = "DELETE FROM email_recipient WHERE list_id = "+ listId;
					ctTrans.query(qry, function(err, result) {
						cb(err);
					});
				},
				function(cb) {
					var qry = "DELETE FROM email_list WHERE list_id = "+listId;
					ctTrans.query(qry, function(err, result) {
				        cb(err);
				    });
				}],
				function(err){
					if(err) {
						ctTrans.rollback(function() {
							res(err);
						});
					}
					else {
						ctTrans.commit(function(err) {
							var newdata = {'org_unit_id':req.user.ou_id, 'ct_user_id':req.user.user_id, 'distribution_list_id':listId, 'log_data': {list_id:listId}};
							ctlogger.log(newdata, 'delete', 'distribution_list');
					        res(null, "Distribution list has been deleted successfully.");
						});
					}
				}
				);
			});
		} else {
			res("Invalid parameter passed");
		}
	},

	recipientList: function(req, res) {
		var retData = [];
		async.waterfall([
			function(cb) {
				var qry = "SELECT cu.ct_user_id, cu.first_name || ' ' || cu.last_name || ' - ' || cu.username AS name, 'user' AS type, '<i class=\"fa fa-user\"></i>' AS icon FROM ct_user cu " +
					"WHERE cu.ct_user_ou_id IN ("+req.orglist.join(',')+") ORDER BY cu.first_name ASC, cu.last_name ASC";
				appModel.ctPool.query(qry, function(err, userList) {
					if (err) { return cb('Failed to execute query of users. '+err); }
					retData.push({name:'Add Users', msGroup: true});
					retData = retData.concat(userList);
					retData.push({msGroup: false});
					cb(null);
				});
			},
		    function(cb) {
			    if (req.user.role_id === 1) {
				    var qry = "SELECT c.campaign_id, c.campaign_name, c.campaign_owner_user_id AS ct_user_id, cu.first_name || ' ' || cu.last_name || ' - ' || cu.username AS user_name FROM campaign c, ct_user cu "+
					    "WHERE c.campaign_owner_user_id=cu.ct_user_id AND c.campaign_id IN ("+req.camplist.join(',')+")";
			    } else {
				    var qry = "SELECT c.campaign_id, c.campaign_name, c.campaign_owner_user_id AS ct_user_id, cu.first_name || ' ' || cu.last_name || ' - ' || cu.username AS user_name " +
					    "FROM campaign c, ct_user cu, campaign_ct_user ccu "+
					    "WHERE c.campaign_owner_user_id=cu.ct_user_id AND c.campaign_id=ccu.campaign_id AND (c.campaign_owner_user_id="+req.userid+" OR ccu.ct_user_id="+req.userid+")";
			    }
			    appModel.ctPool.query(qry, function(err, campList) {
					if (err) { return cb('Failed to execute query of campaigns. '+err); }
				    //console.log('CAMPLIST', campList);
					cb(null, campList);
				});
		    },
		    function(campList, cb) {
			    if (campList.length > 0) {
				    retData.push({name:'Add Campaign Users', msGroup:true});
					async.each(campList, function(row, cb2) {
						//console.log('ROW', row);
						var qry = "SELECT cu.ct_user_id, cu.first_name || ' ' || cu.last_name || ' - ' || cu.username AS name, '<i class=\"fa fa-user\"></i>' AS icon FROM campaign_ct_user ccu, ct_user cu " +
							"WHERE ccu.campaign_id="+row.campaign_id+" AND ccu.ct_user_id=cu.ct_user_id ORDER BY cu.first_name ASC, cu.last_name ASC";
						appModel.ctPool.query(qry, function(err, campUser) {
							if (err) { return cb2('Failed to lookup campaign users. '+err); }
							var tmp = {
								campaign_id: row.campaign_id,
								name: row.campaign_name,
								type: 'campaign',
								icon: '<i class="fa fa-building"></i>',
								users: [
									{
										ct_user_id: row.ct_user_id,
										name:       row.user_name,
										icon:       '<i class="fa fa-user"></i>'
									}
								]
							};
							if (campUser.length > 0) {
								tmp.users = tmp.users.concat(campUser);
							}
							retData.push(tmp);
							cb2(null);
						});

					}, function(err) {
						if (err) { return cb(err); }
						retData.push({msGroup:false});
						cb(null);
					});
			    } else {
				    cb(null);
			    }
		    }

		], function(err) {
			if (err) { return res(err); }
			res(null, retData);
		});
	},

	campaignAndAssignedUser: function(ouId, userId, roleId, res){
		var campaignAndAssignedUsers = [];
		var subQuery = "select org_unit_id from org_unit where org_unit_id = " + ouId + " OR org_unit_parent_id = " + ouId + " OR top_ou_id = " + ouId;

		var	query = "FROM campaign as camp ";
			query += "LEFT JOIN campaign_ct_user ccu ON (camp.campaign_id = ccu.campaign_id) "
			query += "LEFT JOIN ct_user us ON (us.ct_user_id =  ccu.ct_user_id AND us.user_status = 'active') ";
			query += "JOIN ct_user camp_owner ON (camp_owner.ct_user_id = camp.campaign_owner_user_id ) "
		var	where = "WHERE camp.campaign_name IS NOT null AND camp.campaign_status != 'deleted' AND ";
			if(roleId == 1)
				where += "camp.campaign_ou_id = " + ouId ;
			else if(roleId == 2) //stadard user
				where += "(ccu.ct_user_id = '"+ userId + "' OR camp.campaign_owner_user_id = '"+ userId + "') OR camp.campaign_ou_id = "+ouId;

		async.series([
			function(cb) {
				var mainQuery = "SELECT DISTINCT ctu.ct_user_id as id, 'user' as type, ctu.first_name || ' ' || ctu.last_name as user_name, ctu.username as email FROM ct_user as ctu JOIN org_unit ou ON (ctu.ct_user_ou_id =  ou.org_unit_id) ";
				mainQuery += "WHERE (ctu.user_status = 'active') AND (ou.org_unit_id = " + ouId + " OR ou.org_unit_parent_id = " + ouId + " OR ou.top_ou_id = " + ouId + ") ";
				mainQuery += "ORDER BY user_name ";
				connector.ctPool.query(mainQuery, function(err, data){
					if(err){
						cb(err);
					}

					cb(err, data);
				});
			},
			function(cb) {
				var mainQuery = "SELECT DISTINCT camp.campaign_id as id, 'campaign' as type, camp.campaign_name as campaign_name ";
				mainQuery += query + where;
				mainQuery += " ORDER BY campaign_name ASC ";
				connector.ctPool.query(mainQuery, function(err, data){
					if(err){
						cb(err);
					}
					cb(err, data);
				});
			},
		],
		function(err, ret) {
			// console.log('completed', err, ret);
			if (err) { return res('Failed to complete update ' + err); }
			var result = {
				userList : ret[0],
				campList : ret[1]
			}
			res(null, result);
		});
	},

	campaignUsers: function(ouId, userId, roleId, campId, res){
		var subQuery = "select org_unit_id from org_unit where org_unit_id = " + ouId + " OR org_unit_parent_id = " + ouId + " OR top_ou_id = " + ouId;
		var	query = "FROM campaign as camp ";
			query += "LEFT JOIN campaign_ct_user ccu ON (camp.campaign_id = ccu.campaign_id) "
			query += "LEFT JOIN ct_user us ON (us.ct_user_id =  ccu.ct_user_id AND us.user_status = 'active') ";
			query += "JOIN ct_user camp_owner ON (camp_owner.ct_user_id = camp.campaign_owner_user_id ) "
		var	where = "WHERE camp.campaign_name IS NOT null AND camp.campaign_status != 'deleted' AND camp.campaign_id IN("+ campId +") AND ";
			if(roleId == 1)
				where += "camp.campaign_ou_id = " + ouId ;
			else if(roleId == 2) //stadard user
				where += "(ccu.ct_user_id = '"+ userId + "' OR camp.campaign_owner_user_id = '"+ userId + "') OR camp.campaign_ou_id = "+ouId;

		var mainQuery = "SELECT camp.campaign_id as CampaignId, array_to_string(array_agg(us.first_name || ' ' || us.last_name || ' - ' || us.username ORDER BY us.first_name ASC ), ',') as usersname, array_to_string(array_agg('user-' ||ccu.ct_user_id), ',') as usersid, ";
			mainQuery += " (camp_owner.first_name || ' ' || camp_owner.last_name || ' - ' || camp_owner.username ) as ownername, camp_owner.ct_user_id as owner_id "
			mainQuery += query + where;
			mainQuery += " GROUP BY camp.campaign_id, camp_owner.ct_user_id"
			connector.ctPool.query(mainQuery, function(err, data){
				if (err) { return res('Failed to get campaign users: ' + err); }
				res(null, data);
			});
	}
};

function saveRecipients(passed_ctTransModel, recipientList, additionalEmails, listId, callback) {
	var recipientData = getDBFormatedRecipients(recipientList, listId);
	var additionalEmailsData = getDBFormatedAdditionalEmails(additionalEmails, listId);
	var saveData = getFinalStringToSave(recipientData, additionalEmailsData);
	if(saveData !== "") {
		var qry = "INSERT INTO email_recipient(list_id, campaign_id, ct_user_id, email_address) VALUES "+saveData;
		var insertData = {
            which: 'query',
            qry:   qry
        };
		passed_ctTransModel.query(insertData, function(err, result) {
			return callback(err);
		});
	} else {
		return callback(null);
	}
}

function getDBFormatedRecipients(recipientList, listId) {
	var formatedRecipient = "";
	if(recipientList !== undefined && recipientList.length > 0) {
		formatedRecipient += _.map(recipientList, function(row) {
			var recipient = [listId,null,null,null];
			if(row.recipientType == 'campaign') {
				recipient[1] = row.recipientTypeValue;
			} else if(row.recipientType == 'user') {
				recipient[2] = row.recipientTypeValue;
			}
			return "("+recipient[0]+","+recipient[1]+","+recipient[2]+","+recipient[3]+")";
		});
	}
	return formatedRecipient;
}

function getDBFormatedAdditionalEmails(commaSeparatedEmails, listId) {
	var formatedEmails = "";
	var allEmails = [];
	var uniqueEmails = [];
	if(commaSeparatedEmails !== undefined && commaSeparatedEmails.length > 0) {
		//convert comma separated emails into array
		allEmails = commaSeparatedEmails.split(',').map(function(email) {
		    return email;
		});
		//get unque emails from the list of emails
		uniqueEmails = _.unique(allEmails);
		//create db formated string
		formatedEmails += uniqueEmails.map(function(email) {
		    return "("+listId+","+null+","+null+",'"+email+"')";
		});
	}
	return formatedEmails;
}

function getFinalStringToSave(recipientData, additionalEmailsData) {
	var result = "";
	if(recipientData !== "" && additionalEmailsData !== "") {
		result = recipientData +","+ additionalEmailsData;
	} else if(recipientData !== "" && additionalEmailsData == "") {
		result = recipientData;
	} else if(recipientData == "" && additionalEmailsData !== "") {
		result = additionalEmailsData;
	}
	return result;
}

module.exports = distribution;
