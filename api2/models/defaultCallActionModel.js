var connector = require('./appModel'),
    f = require('../functions/functions.js'),
    fs = require("fs"),
    yaml = require("js-yaml"),
    e = yaml.load(fs.readFileSync("config/database.yml")),
    async = require('async'),
    ctTransactionModel = require('../models/ctTransactionModel'),
    _ = require('underscore'),
    orgUnitModel = require('../models/orgUnitModel'),
    defCallActionRuleTable = 'default_call_action_rule',
    OrgUnitDetailTable = 'default_org_setting',
    defCallActionTable = 'default_call_action';
    


var defaultCallAction = {
    //Create and  Insert new Call Action Record
    create: function(data, res) {
        var rules = data.rules;
        delete data.rules;

        //keep track of specific call action
        var qry = "SELECT action_order AS cnt FROM " + defCallActionTable + " WHERE org_unit_id = " + data.org_unit_id + " ORDER BY default_action_id DESC LIMIT 1";
        connector.ctPool.query(qry, function(err, numcnt) {
            if (err) { return res('Failed to query call actions for the supplied group'); }

            data['action_order'] = ((numcnt.length > 0 && numcnt[0].cnt) ? parseInt(numcnt[0].cnt) + 1 : data.action_order);
            var insertData = {
                which: 'insert',
                table: defCallActionTable,
                values: data
            };
            connector.ctPool.insert(insertData, function(err, retData) {
                if (err) { return ('Failed to insert new Call Action record'); }
                if (rules.length > 0) {
                    // console.log(retData);
                    defaultCallAction.createRules(rules, retData.insertId, function(err) {
                        if (err) { return res(err); }
                        defaultCallAction.updateSettings(data.org_unit_id, function(err) {
                            if (err) { return res(err); }
                            return res(null, retData);
                        });
                       // return res(null, retData);
                    });
                } else {
                    return res(null, retData);
                }
            });
        });
    },

    readByActionId: function(actionid, res) {
        if (isNaN(actionid)) {
            res('Not a valid call action ID');
        } else {
            var query = "SELECT * FROM " + defCallActionTable + " WHERE default_action_id=" + actionid;
            connector.ctPool.query(query, function (err, data) {
                if (err) { return res('Failed to retrieve call action ' + err); }

                async.map(data, defaultCallAction.getRules, function(err, result) {
                    if (err) { return res('Failed to retrieve call action rules ' + err); }
                    res(null, result);
                });
            });
        }
    },//end re
    //Update existing call Action record

    updateSettings: function(org_unit_id, callback){
        var selectQry = "SELECT org_unit_id from " + OrgUnitDetailTable + " where org_unit_id = " + org_unit_id;
        var oudata = {};
        oudata.override_call_action_settings = false;
        connector.ctPool.query(selectQry, function(err, ret) {
            if (err) {
                callback(err);
            } else {
                if (ret.length > 0 && ret[0].org_unit_id) {
                    var updateData = {
                        which: 'update',
                        table: OrgUnitDetailTable,
                        values: oudata,
                        where: ' WHERE org_unit_id = ' + org_unit_id
                    };

                    connector.ctPool.update(updateData, function(err, ret) {
                        callback(err);
                    });
                } else {

                    oudata.org_unit_id = org_unit_id;
                    var insertData = {
                        table :OrgUnitDetailTable,
                        values:oudata
                    };
                    
                    connector.ctPool.insert(insertData, function(err, ret) {
                        callback(err);
                    });
                }
            }
        });
    },

    update: function(data, res) {
        data.action_updated = 'CURRENT_TIMESTAMP';
        delete data.rule;

        var updateData = {
            which: 'update',
            table: defCallActionTable,
            values: data,
            where: ' WHERE default_action_id = ' + data.default_action_id
        };
        connector.ctPool.update(updateData, function(err, ret) {
            if (err) { return res('Failed to update call action ' + err); }
            defaultCallAction.updateSettings(data.org_unit_id, function(err) {
                if (err) { return res(err); }
                res(null, ret);
            });
            
        });
    },
    //Retrive Call Action Record by specific action_id
    
    //Remove call action record of specific action_id
    remove: function(action_id, ouid, res) {
        // console.log(action_id);
        if (!isNaN(action_id)) {
            var query = "DELETE FROM " + defCallActionTable + " WHERE default_action_id= " + action_id;
            connector.ctPool.query(query, function(err, data) {
                if (err) { return res('Failed to remove call action record. ' + err); }
                defaultCallAction.updateSettings(ouid, function(err) {
                    if (err) { return res(err); }
                    res(null, data);
                });
            });
        } else {
            res('Not a valid call action ID');
        }
    },
    //Create rules
    createRules: function(data, action_id, res) {
        var group = 0;
        var join = '';
        var cnt = 0;
        var post = 0;
        _.each(data, function(rule) {
            cnt++;
            if (!rule.indicator_id) {
                rule.indicator_id = (!isNaN(rule.data_field) ? rule.data_field : null);
            }
            if (rule.indicator_id) { post = 1; }
            if (!rule.rule_order) { rule.rule_order = cnt; }
            rule.default_action_id = action_id;
            if (!rule.join_type) { rule.join_type = 'NONE'; }

            //insert rule
            var insertData = {
                which: 'insert',
                table: defCallActionRuleTable,
                values: rule
            };
            connector.ctPool.insert(insertData, function(err) {
                if (err) { return res('Failed to insert rule ' + cnt); }
            });
        });

        if (post) {
            var qry = "UPDATE " + defCallActionTable + " SET post_process=true WHERE default_action_id=" + action_id;
            connector.ctPool.query(qry, function(err) {
                if (err) { return res('Failed to update Call Action to be post processed' + err); }
                res(null, 'success');
            });
        } else {
            res(null, 'success');
        }
    },
    //Get rule
    getRules: function(actiondata, res) {
        var qry = "SELECT * FROM " + defCallActionRuleTable + " WHERE default_action_id=" + actiondata.default_action_id + " ORDER BY rule_order ASC, grouping ASC";
        connector.ctPool.query(qry, function(err, ruleData) {
            if (err) { return res('Failed to retrieve call action rules. ' + err); }


            actiondata['rules'] = ruleData;
            // console.log('RULES DATA SET', actiondata);
            res(null, actiondata);
        });
    },
    //Get Call Action on group_id
    read: function(orgunitid, res) {
        var createNew = false, old_org_unit_id;
        async.waterfall([
            function(callback) {
                orgUnitModel.checkOverrideSettings("call_action", orgunitid, function(err, settings_ou){
                    if (err) {
                        callback(err);
                    } else {
                        if(orgunitid != settings_ou){
                            old_org_unit_id = orgunitid;
                            createNew = true;   
                        }
                        orgunitid = settings_ou;
                        callback(null);
                    }
               })
            },
            function(callback) {
                
                var qry = "SELECT * FROM " + defCallActionTable + " WHERE org_unit_id= " + orgunitid + " ORDER BY action_order ASC";
                connector.ctPool.query(qry, function(err, data) {
                    if (err) { return res("Failed to retrieve Call Actions for group. " + err); }

                    async.map(data, defaultCallAction.getRules, function(err, result) {
                        if (err) { return res('Failed to retrieve Call Action Rules. ' + err); }
                        callback(null, result);
                    });
                });
            },
            
            function(result, callback) {
                if(createNew  && result.length > 0 ){
                    
                    defaultCallAction.createBulkCallAction(old_org_unit_id, result, function(err, newResult){
                        if(err){
                             callback(err);
                        }else{
                             callback(null, newResult);
                        }

                    })
                }else{
                   callback(null, result); 
                }
            },
        ], function(err, data) {
            res(err, data);
        });
    },
    //Remove Call Action rule of specific action-id
    createBulkCallAction: function(old_org_unit_id, actions, res) {
        async.waterfall([
            function(callback) {
                var actionDelete = "DELETE FROM default_call_action WHERE org_unit_id = " + old_org_unit_id;
                connector.ctPool.query(actionDelete, function(err, insertIds) {
                    if (err) {
                        callback(err);
                    }else{
                        callback(null);
                    }
                });
                
            },
            function(callback) {
                var actionInsert = "INSERT into default_call_action (org_unit_id, action_order, action, action_target) VALUES "
                // console.log(actions);
                async.eachSeries(actions, function(action, cb){
                    actionInsert += "( " + old_org_unit_id + ", " + action.action_order +  ", '" + action.action + "', '" + action.action_target + "') ";
                    if(actions.indexOf(action) !== actions.length -1){
                        actionInsert = actionInsert + ",";
                    }else{
                        actionInsert += " returning default_action_id";
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
                var ruleInsert = "INSERT into default_call_action_rule (default_action_id, data_field, indicator_id, operator, comparator, join_type, rule_order, grouping) VALUES "
                async.eachSeries(actions, function(action, innerCb){
                    async.eachSeries(action.rules, function(rule, outerCb){
                        var index = actions.indexOf(action);
                        var actionIndex = insertIds[index].default_action_id;
                        actions[index].default_action_id = actionIndex;
                        ruleInsert += "( " + actionIndex + ", '" + rule.data_field +  "', " + rule.indicator_id + ", '" + rule.operator + "', '" + rule.comparator + "', '" + rule.join_type + "', " + rule.rule_order + ", " + rule.grouping + ") ";
                        if(action.rules.indexOf(rule) !== action.rules.length -1 || actions.indexOf(action) !== actions.length -1){
                            ruleInsert = ruleInsert + ",";
                        }
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

    dropRules: function(action_id, res) {
        var qry = "DELETE FROM " + defCallActionRuleTable + " WHERE default_action_id=" + action_id;
        connector.ctPool.query(qry, function(err, ret) {
            if (err) { return res('Failed to remove call action record. ' + err); }
            res(null, ret);
        });
    }

}

module.exports = defaultCallAction;