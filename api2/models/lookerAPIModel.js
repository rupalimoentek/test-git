/**
 * Created by Aloha technology on 08/02/2017.
 */
var http = require('http'),
    crypto = require('crypto'),
    moment = require('moment'),
    momentTimezone = require('moment-timezone'),
    querystring = require('querystring'),
    _ = require('underscore'),
    async = require('async'),
    envVar = process.env.NODE_ENV,
    appModel = require('./appModel');


var looker = {
    postTag: function(req, res) {
        var callData = [],
            tagData = [];
        callData.call_id = parseInt(req.body.data.value);
        callData.ct_user_id = req.user.user_id;
        callData.call_tag_created = 'CURRENT_TIMESTAMP';
        tagData.tag_name = req.body.form_params.tag_name;
        tagData.org_unit_id = req.body.org_unit_id;
        tagData.tag_active = true;
        async.waterfall([
                function(cb1) {
                    isMatch(tagData, function(err, data) {
                        if (err) { return res(err); }
                        if (data.length > 0) {

                            callData.tag_id = data[0].tag_id;
                            cb1(null);
                        } else {
                            var insertTag = {
                                table: 'tag',
                                values: tagData
                            };
                            appModel.ctPool.insert(insertTag, function(err, data) {
                                if (err) { return cb1(err); }
                                callData.tag_id = parseInt(data.insertId);
                                cb1(null);
                            });
                        }
                    });
                },
                function(cb1) {
                    var insertCallTag = {
                        table: 'call_tag',
                        values: callData
                    };
                    appModel.ctPool.insert(insertCallTag, function(err, insertId) {
                        if (err) { return cb1(err); }
                        cb1(null, insertId);
                    });
                }
            ],
            function(err, results) {
                res(err, "Tag added successfully");
            });
    },
    putTag: function(req, res) {
        var tagData = {};
        var lookerData = JSON.parse(req.body.data.value);
        tagData.tag_name = req.body.form_params.tag_name;
        var updateTag = {
            table: 'tag',
            values: tagData,
            where: " where tag_id = " + lookerData.tag_id
        };
        appModel.ctPool.update(updateTag, function(err) {
            if (err) { return res(err); }
            res(null);
        });
    },
    deleteTag: function(req, res) {
        lookerData = JSON.parse(req.body.data.value);
        var query = "DELETE FROM call_tag WHERE call_id =" + lookerData.call_id + " AND tag_id = " + lookerData.tag_id;
        appModel.ctPool.query(query, function(err, data) {
            if (err) { return res(err); }
            res(null, data);
        });
    },
    postComment: function(req, res) {
        var commentData = [];
        commentData.call_id = parseInt(req.body.data.value);
        commentData.ct_user_id = req.user.user_id;
        commentData.comment_text = req.body.form_params.comment;
        commentData.comment_created = 'CURRENT_TIMESTAMP';
        commentData.comment_modified = 'CURRENT_TIMESTAMP';
        commentData.comment_active = true;
        commentData.is_from_report = true;
        commentData.comment_timestamp = 0;

        var insertData = {
            table: 'comment',
            values: commentData
        };

        appModel.ctPool.insert(insertData, function(err) {
            if (err) { return res(err); }
            res(null);
        });
    },

    putComment: function(req, res) {
        var commentData = [];
        console.log(req.body.data.value);
        var lookerData = JSON.parse(req.body.data.value);
        commentData.call_id = parseInt(lookerData.call_id);
        //commentData.comment_id = parseInt(lookerData.comment_id);
        commentData.ct_user_id = lookerData.ct_user_id;
        commentData.comment_text = req.body.form_params.comment_text;
        commentData.comment_modified = 'CURRENT_TIMESTAMP';
        var insertData = {
            table: 'comment',
            values: commentData,
            where: " where comment_id = " + parseInt(lookerData.comment_id)
        };

        appModel.ctPool.update(insertData, function(err) {
            if (err) { return res(err); }
            res(null);
        });
    },

    deleteComment: function(req, res) {
        var lookerData = JSON.parse(req.body.data.value);
        var query = "UPDATE comment SET comment_active = false WHERE comment_id =" + lookerData.comment_id;
        appModel.ctPool.query(query, function(err, data) {
            if (err) { return res(err); }
            res(null);
        })
    },

    getUsers: function(req, res) {
        var manualScoring = false;
        async.waterfall([
                function(callback) {
                    var query = "SELECT count(*) AS subscription_count FROM ct_user cu "
                    query += "JOIN org_unit ou ON (ou.org_unit_id = cu.ct_user_ou_id) "
                    query += "JOIN org_billing ob ON ob.org_unit_id = ou.billing_id "
                    query += "JOIN org_account oc ON oc.org_unit_id = ob.org_unit_id AND oc.component_id IS NOT NULL "
                    query += "JOIN component c ON c.component_id = oc.component_id "
                    query += "WHERE cu.ct_user_id = " + req.params.id
                    query += " AND component_name ILIKE '%manual score card%'"

                    appModel.ctPool.query(query, function(err, compData) {
                        if (compData[0].subscription_count > 0)
                            manualScoring = true;
                        callback(err);
                    });
                },

                function(callback) {
                    var callQuery = "SELECT c.ct_user_id, scc.score_card_call_status " +
                        " FROM call c LEFT JOIN score_card_calls scc ON scc.call_id = c.call_id WHERE c.call_id = " + req.params.call_id;
                    appModel.ctPool.query(callQuery, function(err, scoreCallData) {
                        callback(err, scoreCallData);
                    });
                },

                function(scoreCallData, callback) {
                    var callQuery = "SELECT cu.ct_user_id, up.score_call, cu.role_id " +
                        " FROM ct_user cu JOIN user_permissions up ON cu.ct_user_id = up.ct_user_id WHERE cu.ct_user_id = " + req.params.id;
                    appModel.ctPool.query(callQuery, function(err, userData) {
                        callback(err, userData, scoreCallData);
                    });
                },

                function(userData, scoreCallData, callback) {
                    console.log(userData);
                    var query = "SELECT first_name || ' ' || last_name || ' | ' || username AS username, ct_user.ct_user_id FROM ct_user "
					query += "LEFT JOIN partner_admin_user AS pau ON pau.ct_user_id = ct_user.ct_user_id "
					query += "WHERE pau.ct_user_id IS NULL AND "
                    query += "(ARRAY[ct_user_ou_id]  <@ ARRAY[( select groups_list from user_permissions where ct_user_id = " + req.params.id + ")] AND ct_user.role_id IN (1,2,3,8) AND user_status = 'active') ";

                    if (scoreCallData[0].ct_user_id)
                        query += " OR ct_user.ct_user_id = " + scoreCallData[0].ct_user_id;

                   	query += " ORDER BY first_name";

                    appModel.ctPool.query(query, function(err, data) {
                        if (err) { return res(err); }

                        if (manualScoring) {
                            var assignedLabel = "Identify Agent";
                            if (scoreCallData[0].score_card_call_status !== null && (scoreCallData[0].score_card_call_status === 'scored' || scoreCallData[0].score_card_call_status === 'reviewed'))
                                assignedLabel = "Identify Agent (Agent change will not reflect as call is already scored/reviewed)"
                            
                            if(userData[0].score_call === false){
                                assignedLabel = "Identify Agent (Agent change will not reflect as the logged in user do not have access for scoring.).";
                            }

                            if(userData[0].role_id === 3 ) {
                                assignedLabel = "Identify Agent (Agent change will not reflect as the logged in user role is Read-only).";
                            }

                            if(userData[0].role_id === 8 ) {
                                assignedLabel = "Identify Agent (Agent change will not reflect as the logged in user role is Identifiedonly).";
                            }

                            var form_parameters = [{
                                name: assignedLabel,
                                label: assignedLabel,
                                type: "select",
                                default: scoreCallData[0].ct_user_id,
                                options: []
                            }]
                            for (var i = 0; i < data.length; i++) {
                                var tempHash = {
                                    "label": data[i].username,
                                    "name": data[i].ct_user_id
                                }
                                form_parameters[0].options.push(tempHash);
                            }
                            var tempHash = {
                                "label": "Unassign",
                                "name": "unassigned"
                            }
                            form_parameters[0].options.unshift(tempHash);
                        } else {
                            var assignedLabel = "Identified-Only role is not available for your subscription. To avail the feature of identifying agent on a call, please contact our support team."
                            var form_parameters = [{
                                name: assignedLabel,
                                label: assignedLabel,
                                type: "string",
                            }]
                        }
                        callback(null, form_parameters);
                    });
                }


            ],
            function(err, results) {
                res(err, results);
            });
    },


    addUser: function(req, res) {
        async.waterfall([
                function(cb1) {
                    var selectQry = "SELECT c.call_id, scc.score_card_call_status FROM call c "
                    selectQry += "LEFT JOIN score_card_calls scc ON (scc.call_id = c.call_id) "
                    selectQry += "WHERE c.call_id = " + req.body.data.value;
                    appModel.ctPool.query(selectQry, function(err, scoreData) {
                        cb1(err, scoreData);
                    });
                },
                function(scoreData, cb1) {
                    var selectUserQry = "SELECT cu.role_id , us.score_call FROM ct_user cu "
                    selectUserQry += "JOIN user_permissions us ON us.ct_user_id = cu.ct_user_id "
                    selectUserQry += "where cu.ct_user_id = " + req.userId;

                    appModel.ctPool.query(selectUserQry, function(err, userData) {
                        cb1(err, scoreData, userData);
                    });
                },
                function(scoreData, userData, cb1) {
                    console.log(userData, scoreData);
                    if (userData[0].score_call === true && userData[0].role_id !== 3 && userData[0].role_id !== 8 && (scoreData[0].score_card_call_status !== 'scored' && scoreData[0].score_card_call_status !== 'reviewed')) {
                        var query = "UPDATE call SET ct_user_id = " + req.body.form_params['Identify Agent'] + " WHERE call_id = " + req.body.data.value;
                        if (req.body.form_params['Identify Agent'] === "unassigned")
                            req.body.form_params['Identify Agent'] = null;
                        appModel.ctPool.query(query, function(err, data) {
                            if (err) { return res(err); }
                            res(null, "User is added");
                        })
                    } else {
                        cb1(null, "User is added");
                    }
                }
            ],
            function(err, results) {
                res(err, results);
            });
    }
};


module.exports = looker;

function isMatch(data, cb) {
    var ouModel = require('./orgUnitModel');
    async.waterfall([
            function(cb1) {
                ouModel.getById(data.org_unit_id, function(err, ou) {
                    cb1(err, ou[0].top_ou_id);
                });
            },
            function(top_ou, cb1) {
                ouModel.ouAndDescendents(top_ou, function(ous) {
                    cb1(null, ous);
                });
            },
            function(ous, cb1) {
                var qry = "SELECT tag_id FROM tag WHERE LOWER(tag_name) = LOWER('" + data.tag_name + "') And org_unit_id in (" + ous + ") AND tag_active=true";
                appModel.ctPool.query(qry, function(err, d) {
                    cb1(err, d);
                });
            }
        ],
        function(err, results) {
            cb(err, results);
        });
}

function get_call_info(req, cb) {
    var qry = "select org_unit_id, recording_url AS S3_URL from call c join call_detail cd ON c.call_id = cd.call_id where c.call_id = 398248";
    appModel.ctPool.query(qry, function(err, d) {
        req.body
        cb(err, d);
    });
}