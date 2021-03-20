var connector = require('./appModel'),
    f = require('../functions/functions.js'),
    fs = require("fs"),
    yaml = require("js-yaml"),
    e = yaml.load(fs.readFileSync("config/database.yml")),
    async = require('async'),
    _ = require('underscore'),
    table = 'call_action';
var orgComponentCount = require("./orgComponentCountModel");

var callAction = {
	bulkInsert: function(data, res) {
		var actions = data;
		async.waterfall([
			function(callback) {
                var actionInsert = "DELETE FROM call_action WHERE provisioned_route_id = " + actions[0].provisioned_route_id
                connector.ctPool.query(actionInsert, function(err, insertIds) {
                    if (err) {
                        callback(err);
                    }else{
                        callback(null)
                    }
                });
            },
            function(callback) {
                var actionInsert = "INSERT into call_action (provisioned_route_id, action_order, action, action_target) VALUES "
                async.eachSeries(actions, function(action, cb){

                    actionInsert += "( " + action.provisioned_route_id + ", " + action.action_order +  ", '" + action.action + "', '" + action.action_target + "') ";
                    if(actions.indexOf(action) !== actions.length -1){
                        actionInsert = actionInsert + ",";
                    }else{
                        actionInsert += " returning action_id";
                    }
                   cb(null);
                },function(err){
                    if(err) {
                        console.log("FOUND ERROR:",err);
                        res(err);
                    } else{             
                        connector.ctPool.query(actionInsert, function(err, insertIds) {
                            if (err) {
                                callback(err);
                            }else{
                                callback(null,insertIds)
                            }
                        });
                    }
                });
            },
            function(insertIds, callback) {
                var ruleInsert = "INSERT into call_action_rule (action_id, data_field, indicator_id, operator, comparator, join_type, rule_order) VALUES "
               	var cnt = 0;
                async.eachSeries(actions, function(action, innerCb){
                    async.eachSeries(action.rules, function(rule, outerCb){
                    	cnt++;
                        var index = actions.indexOf(action);
                        var actionIndex = insertIds[index].action_id;
                        actions[index].action_id = actionIndex;

                        if (!rule.indicator_id) {
							rule.indicator_id = (!isNaN(rule.data_field) ? rule.data_field : null);
						}
						if (rule.indicator_id) { post = 1; }
						/*if (join !== rule.join_type) {
							join = rule.join_type;
							group++;
						}
						rule['grouping'] = group;
						*/
						if (!rule.rule_order) { rule.rule_order = cnt; }
						rule.action_id = actionIndex;
						if (!rule.join_type) { rule.join_type = 'NONE'; }
                        ruleInsert += "( " + rule.action_id + ", '" + rule.data_field +  "', " + rule.indicator_id + ", '" + rule.operator + "', '" + rule.comparator + "', '" + rule.join_type + "', " + rule.rule_order + ") ";

                        if(action.rules.indexOf(rule) !== action.rules.length -1 || actions.indexOf(action) !== actions.length -1){
                            ruleInsert = ruleInsert + ",";
                        }
						// console.log(actions.length)
						// sds
                        outerCb(null);
                    },function(err){
                        if(err) {
                            res(err);
                        } else{             
                            innerCb(null);
                        }
                    });
                },function(err){
                    if(err) {
                        console.log("FOUND ERROR:",err);
                        res(err);
                    } else{          
                        connector.ctPool.query(ruleInsert, function(err, insertIds) {
                            if (err) {
                                callback(err);
                            }else{
                                callback(null,actions)
                            }
                        });
                    }
                });
            }
        ], function(err, data) {
            res(err, data);
        });
	},
	create: function(data, res) {
		var self = this;
		// separate out the rules from the call_action data
		var rules = data.rules;
		delete data.rules;

		// NOTE: I believe that the front-end is keeping track of the ordering, which this query can be skipped if that's the case
		var qry = "SELECT action_order AS cnt FROM call_action WHERE provisioned_route_id=" + data.provisioned_route_id +" ORDER BY action_id DESC LIMIT 1";
		connector.ctPool.query(qry, function (err, numcnt) {
			if (err) { return res('Failed to query call actions for the supplied provisioned route'); }

			data['action_order'] = ((numcnt.length > 0 && numcnt[0].cnt) ? parseInt(numcnt[0].cnt) + 1 : data.action_order);
			var insertData = {
				which: 'insert',
				table: table,
				values: data
			};

			connector.ctPool.insert(insertData, function(err, ret) {
				if (err) { return('Failed to insert new Call Action record'); }
				if (rules.length > 0) {
					callAction.createRules(rules, ret.insertId, function (err) {
						if (err) { return res(err); }
						return res(null, ret);
					});
				} else {
					return res(null, ret);
				}



				// as of CT-4717 we aren't monetizing or displaying the Call action count, so we don't need
				// to be incrementing/decrementing its count

				//self.getOUidByCallActionId(action_id, function (err, ou_id) {
				//	if (err) { return res("Couldn't retrieve ou_id for action_id "+action_id+":"+JSON.stringify(err)); }
				//
				//	// now check to enter in rules for call action
				//	if (rules.length > 0) {
				//		callAction.createRules(rules, ret.insertId, function (err) {
				//			console.log("inside CALLBACK OF CREATE RULLES");
				//			if (err) {
				//				return res(err);
				//			}
				//
				//			return res(null, ret);
				//			orgComponentCount.increment(null, 10, ou_id, 1, function (err, incData) {
				//				if (err){ return res(err); }
				//				return res(null, ret);
				//			});
				//
				//		});
				//	} else {
				//
				//
				//		orgComponentCount.increment(null, 10, ou_id, 1, function (err, incData) {
				//			if (err){ return res(err); }
				//			return res(null, ret);
				//		});
				//	}
				//});
			});
		});
	},//end create
	update: function(data, res) {
		data.action_updated = 'CURRENT_TIMESTAMP';
		//var rules = data.rule;
		delete data.rule;

		var updateData = {
			which: 'update',
			table : table,
			values: data,
			where: ' WHERE action_id = ' + data.action_id
		};
		connector.ctPool.update(updateData, function(err, ret) {
			if (err) { return res('Failed to update call action ' + err); }
			res(null, ret);
		});
	},//end update
	changeTarget: function(data, res) {
		data.action_updated = 'CURRENT_TIMESTAMP';
		var actionId = data.action_id;
		delete data.action_id;

		var updateData = {
			which: 'update',
			table : table,
			values: data,
			where: ' WHERE action_id = ' + actionId
		};

		connector.ctPool.update(updateData, function(err, ret) {
			if (err) { return res('Failed to update call action ' + err); }
			res(null, ret);
		});
	},
	read: function(actionid, res) {
		if (isNaN(actionid)) {
			res('Not a valid call action ID');
		} else {
			var query = "SELECT * FROM " + table + " WHERE action_id=" + actionid;
			connector.ctPool.query(query, function (err, data) {
				if (err) { return res('Failed to retrieve call action ' + err); }

				async.map(data, callAction.getRules, function(err, result) {
					if (err) { return res('Failed to retrieve call action rules ' + err); }
					res(null, result);
				});
			});
		}
	},//end read
	remove: function(actionid, res) {
		if (!isNaN(actionid)) {
			var query = "DELETE FROM " + table + " WHERE action_id=" + actionid;
			connector.ctPool.query(query, function (err, data) {
				if (err) { return res('Failed to remove call action record. ' + err); }
				res(null, data);
			});
		} else {
			res('Not a valid call action ID');
		}


		// as of CT-4717 we aren't monetizing or displaying the Call action count, so we don't need
		// to be incrementing/decrementing its count

		//if (isNaN(actionid)) {
		//    return res('Not a valid call action ID')
		//}
		//this.getOUidByCallActionId(actionid, function (err, ouId) {
		//	if (err) { return res("Failed to get OUid to match this call action" + err); }
		//
		//	var query = "DELETE FROM " + table + " WHERE action_id=" + actionid;
		//	connector.ctPool.query(query, function (err) {
		//		if (err) { return res('Failed to remove call action record. ' + err); }
		//		orgComponentCount.decrement(null, 10, ouId, 1, function (err, decremenetData) {
		//			if (err) { return res("Could not decrement from org component count table"); }
		//			return res(null, decremenetData);
		//		});
		//	});
		//});


	},// end remove
	dropRules: function(actionid, res) {
		var qry = "DELETE FROM call_action_rule WHERE action_id=" + actionid;
		connector.ctPool.query(qry, function (err, ret) {
			if (err) { return res('Failed to remove call action record. ' + err); }
			res(null, ret);
		});
	},// end dropRules
	getRules: function(data, res) {
		var qry = "SELECT * FROM call_action_rule WHERE action_id=" + data.action_id + " ORDER BY rule_order ASC, grouping ASC";
		connector.ctPool.query(qry, function (err, subdata) {
			if (err) { return res('Failed to retrieve call action rules. ' + err); }
			data['rules'] = subdata;
			res(null, data);
		});
	},// end getRules
	createRules: function(data, actionid, res) {
		console.log('starting createRules');
		var group = 0;
		var join = '';
		var cnt = 0;
		var post = 0;
		_.each(data, function(rule) {
			cnt++;
			//console.log('cycling through rule ' + cnt);
			//console.log(rule);
			if (!rule.indicator_id) {
				rule.indicator_id = (!isNaN(rule.data_field) ? rule.data_field : null);
			}
			if (rule.indicator_id) { post = 1; }
			/*if (join !== rule.join_type) {
				join = rule.join_type;
				group++;
			}
			rule['grouping'] = group;
			*/
			if (!rule.rule_order) { rule.rule_order = cnt; }
			rule.action_id = actionId;
			if (!rule.join_type) { rule.join_type = 'NONE'; }
			//if (rule.webhook_id === '' || !rule.webhook_id) { delete rule.webhook_id; }

			console.log('rule', rule);
			var insertData = {
				which: 'insert',
				table: 'call_action_rule',
				values: rule
			};
			connector.ctPool.insert(insertData, function(err) {
				if (err) { return res('Failed to insert rule ' + cnt); }
			});
		});

		if (post) {
			var qry = "UPDATE call_action SET post_process=true WHERE action_id=" + actionid;
			connector.ctPool.query(qry, function (err) {
				if (err) { return res('Failed to update Call Action to be post processed' + err); }
				res(null, 'success');
			});
		} else {
			res(null, 'success');
		}
	},//end createRules
	byNumber: function(routeid, res) {
		var result_set = [];
		var qry = "SELECT * FROM call_action WHERE provisioned_route_id=" + routeid + " ORDER BY action_order ASC" ;
		connector.ctPool.query(qry, function (err, data) {
			if (err) { return res("Failed to retrieve Call Actions for route. " + err); }
			async.map(data, callAction.getRules, function(err, result) {
				if (err) { return res('Failed to retrieve Call Action Rules. ' + err); }
				async.eachSeries(data, function(dt, cb){
					if(dt.action == "tag_call"){
						var qry = "SELECT STRING_AGG(tag_id::text, ',') as tag_list from tag WHERE tag_id in ("+dt.action_target+") AND tag_active = true";
						connector.ctPool.query(qry, function (err, tag_data) {
							if (err) { return res('Failed to retrieve Call Action Rules. ' + err); }
							if(tag_data[0].tag_list != null){
								console.log("gott ",tag_data[0].tag_list)
								dt.action_target = tag_data[0].tag_list;
							}
							else{
								dt.action_target = '';
							}
							result_set.push(dt);
							cb(null);//waiting till query result
						})
					}
					else{
						result_set.push(dt);
						cb(null);
					}
					                         
                },function(err){
                    if(err) {
                        res(err);
                    } else{
						res(null,result_set);
                    }
                });
			});
		});
	}//end byNumber
};

// only used with decrementing/incrementing call action count so no need to compile it

//callAction.getOUidByCallActionId = function(action_id, res) {
//	var getCallActionsOUQuery = "" +
//		"SELECT pr.provisioned_route_ou_id " +
//		"FROM call_action ca " +
//		"LEFT JOIN provisioned_route as pr ON (ca.provisioned_route_id=pr.provisioned_route_id) " +
//		"WHERE ca.action_id = " + action_id;
//	connector.ctPool.query(getCallActionsOUQuery, function (err, ou_id) {
//		ou_id = ou_id[0].provisioned_route_ou_id;
//		return res(err, ou_id);
//	});
//};


module.exports = callAction;
