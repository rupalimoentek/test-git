var connector = require('./appModel'),
    f = require('../functions/functions.js'),
    fs = require("fs"),
    yaml = require("js-yaml"),
    e = yaml.load(fs.readFileSync("config/database.yml")),
    async = require('async'),
    ctTransactionModel = require('../models/ctTransactionModel'),
    _ = require('underscore'),
    manualScoreActionTable = 'score_card_action';


var ScoreAction = {
    //get Score Card Action by useing id
    readManualScoreActionById: function(score_card_action_id, res) {
        console.log(score_card_action_id);
        if (isNaN(score_card_action_id)) {
            res('Not a valid manual score action ID');
        } else {
            var query = "SELECT * FROM " + manualScoreActionTable + " WHERE score_card_action_id = " + parseInt(score_card_action_id);
            console.log("GetScoreAction: ", query);
            connector.ctPool.query(query, function(err, data) {
                if (err) { return res('Failed to retrieve call action ' + err); }

                // async.map(data, ScoreAction.getManualScoreRules, function(err, result) {
                //     if (err) { return res('Failed to retrieve manual score action rules ' + err); }
                console.log(data);
                res(null, data);
                // });
            });
        }
    },

    //get score Card Action by user id
    readManualScoreActionByUserID: function(user_id, res) {

        var qry = "SELECT * FROM " + manualScoreActionTable + " WHERE ct_user_id = " + user_id;
        connector.ctPool.query(qry, function(err, data) {
            if (err) { return res("Failed to retrieve Score Card Actions By User id. " + err); }

            // async.map(data, ScoreAction.getManualScoreRules, function(err, result) {
            //     if (err) { return res('Failed to retrieve Score Card Action Rules. ' + err); }
            console.log(data);
            res(null, data);
            // });
        });

    },

    //Get manual score rule from scor_card_action table
    getManualScoreRules: function(manualscoreactiondata, res) {
        var qry = "SELECT score_card_rule FROM " + manualScoreActionTable + " WHERE score_card_action_id=" + manualscoreactiondata.score_card_action_id + " ORDER BY score_card_rule ASC";
        connector.ctPool.query(qry, function(err, scorecardruleData) {
            if (err) { return res('Failed to retrieve Score card action rules. ' + err); }

            manualscoreactiondata['rules'] = scorecardruleData;
            console.log('Score Card Rules', manualscoreactiondata);
            res(null, manualscoreactiondata);
        });
    },

    // Insert new score_card_action record
    saveScoreManualAction: function(data, res) {
        console.log("Send Data: -----------------------", data);

        var insertData = {
            which: 'insert',
            table: manualScoreActionTable,
            values: data
        };
        connector.ctPool.insert(insertData, function(err, ret) {
            if (err) { return ('Failed to insert new Call Action record'); } else {
                return res(null, ret);
            }
        });
    },

    // Insert bulk score_card_action record
    createBulkScoreAction: function(data, user_id, res) {
        console.log("Send Data: -----------------------", data);
        var score_action = data;

        async.waterfall([
                function(callback) {
                    var qry = "DELETE FROM " + manualScoreActionTable;
                    qry += " WHERE ct_user_id = " + parseInt(user_id);

                    connector.ctPool.query(qry, function(err, deleteScoreCardAction) {
                        if (err) { return res('Failed to delete Score card action.' + err); } else {
                            callback(null, deleteScoreCardAction);
                        }
                    });
                },
                function(callback) {
                    var qry = "INSERT into " + manualScoreActionTable + " (ct_user_id, score_card_action, score_card_rule, score_card_action_target, created_by, updated_by) VALUES ";

                    async.eachSeries(score_action, function(action, cb) {
                        qry += "( " + action.ct_user_id + ", '" + action.score_card_action + "', '" + action.score_card_rule + "', '" + action.score_card_action_target + "' , '" + action.created_by + "', '" + action.updated_by + "') ";
                        if (score_action.indexOf(action) !== score_action.length - 1) {
                            qry = qry + ",";
                        } else {
                            qry += " returning score_card_action_id";
                        }
                        cb(null);
                    }, function(err) {
                        if (err) {
                            console.log("FOUND AN ERROR:", err);
                            res(err);
                        } else {
                            console.log("qry: "+qry)
                            connector.ctPool.query(qry, function(err, data) {
                                if (err) {
                                    res(err);
                                } else {
                                    res(null, data)
                                }
                            });
                        }
                    });

                }
            ],
            function(err, data) {
                res(err, data);
            });
    },

    //update existing score_card_action record
    updateScoreManualActions: function(data, res) {
        data.updated_on = 'CURRENT_TIMESTAMP';
        var updateData = {
            which: 'update',
            table: manualScoreActionTable,
            values: data,
            where: ' WHERE score_card_action_id = ' + parseInt(data.score_card_action_id)
        };
        connector.ctPool.update(updateData, function(err, ret) {
            if (err) { return res('Failed to update existing Score Card Action record ' + err); }
            res(null, ret);
        });
    },

    //delete score_card_action by id
    deleteScoreManualActions: function(score_card_action_id, res) {

        var qry = "DELETE FROM " + manualScoreActionTable;
        qry += " WHERE score_card_action_id = " + parseInt(score_card_action_id);

        connector.ctPool.query(qry, function(err, deleteScoreCardAction) {
            if (err) { return res('Failed to delete Score card action.' + err); } else {
                res(null, deleteScoreCardAction);
            }
        });

    }

}
module.exports = ScoreAction;