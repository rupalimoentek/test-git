/*jshint loopfunc: true */
var mysql = require('mysql'),
    connector = require('./appModel'),
    appModel = require('./appModel'),
    ctTransactionModel = require('./ctTransactionModel'),
    yaml = require("js-yaml"),
    f = require('../functions/functions.js'),
    fs = require("fs"),
    e = yaml.load(fs.readFileSync("config/database.yml")),
    s3yml = yaml.load(fs.readFileSync("config/s3.yml")),
    me = yaml.load(fs.readFileSync("config/mongodb.yml")),
    AWS = require('aws-sdk'),
    async = require('async'),
    _ = require('underscore'),
    envVar = process.env.NODE_ENV,
    table = 'call';
moment = require('moment');
var timezone = 'UTC'; //set default
//test
var call = {
    getCallDetail: function(req, res) {
        var orgUnitModel = require('./orgUnitModel');
        var where;
        var andOp = [];
        var joins = [];
        var data = {};
        async.waterfall([
                function(cb) {
                    orgUnitModel.ouAndDescendents(req.ouid, function(ouids) {
                        cb(null, ouids);
                        where = " WHERE call.org_unit_id in (" + ouids + ")";
                    });
                },
                function(ouids, cb) {
                    var data = req.query.criteria;
                    if (data.external_ouid && data.external_ouid !== '') {
                        data.ouid = data.external_ouid;
                    }
                    if (data.ouid && ouids.indexOf(data.ouid) < 0) {
                        cb('Not a valid ouid');
                        return;
                    }
                    if (data.ouid && data.ouid !== '') {
                        where = " WHERE call.org_unit_id = " + data.ouid;
                    }
                    var limit = 100;
                    var offset = 0;
                    var sort_by = "call.call_id";
                    var sort_order = "ASC";
                    if (req.query.limit && req.query.limit !== '') {
                        limit = req.query.limit;
                    }
                    if (req.query.start && req.query.start !== '') {
                        offset = req.query.start;
                    }
                    if (req.query.sort_by && req.query.sort_by !== '') {
                        switch (req.query.sort_by) {
                            case 'id':
                                sort_by = "call.call_id";
                                break;
                            case 'tracking_number':
                                sort_by = "call.tracking";
                                break;
                            case 'ringto_number':
                                sort_by = "call.ring_to";
                                break;
                        }
                    }
                    if (req.query.sort_order && req.query.sort_order !== '') {
                        switch (req.query.sort_order) {
                            case 'asc':
                                sort_order = "ASC";
                                break;
                            case 'desc':
                                sort_order = "DESC";
                                break;
                        }
                    }
                    if (req.query.criteria.tracking_number && req.query.criteria.tracking_number !== '') andOp.push("call.tracking LIKE '" + req.query.criteria.tracking_number + "%'");
                    if (req.query.criteria.ringto_number && req.query.criteria.ringto_number !== '') andOp.push("call.ring_to LIKE '" + req.query.criteria.ringto_number + "%'");
                    if (req.query.criteria.start_calldate && req.query.criteria.start_calldate !== '' && !req.query.end_calldate) {
                        andOp.push("call.call_started BETWEEN '" + f.fullDate(req.query.criteria.start_calldate, false) + "' AND '" + f.fullDate(req.query.criteria.start_calldate, true) + "'");
                    } else if (req.query.criteria.end_calldate && req.query.criteria.end_calldate !== '' && !req.query.start_calldate) {
                        andOp.push("call.call_started <= '" + f.fullDate(req.query.criteria.end_calldate, true) + "'");
                    } else if (req.query.criteria.start_calldate && req.query.criteria.start_calldate !== '' && req.query.criteria.end_calldate && req.query.criteria.end_calldate !== '') {
                        andOp.push("call.call_started BETWEEN '" + f.fullDate(req.query.criteria.start_calldate, false) + "' AND '" + f.fullDate(req.query.criteria.end_calldate, true) + "'");
                    }

                    if (req.query.criteria.tags && req.query.criteria.tags !== '') {
                        var tags = req.query.criteria.tags.split(',');
                        var tagsArr = [];
                        for (var i = tags.length - 1; i >= 0; i--) {
                            tagsArr.push("'" + tags[i] + "'");
                        }
                        andOp.push("ct.tag_id in (SELECT tag_id FROM tag WHERE tag_name IN (" + tagsArr.join(',') + ") AND org_unit_id IN (" + ouids + "))");
                        joins.push(" LEFT JOIN call_tag AS ct ON ct.call_id = call.call_id");
                    }
                    var qry = "SELECT DISTINCT(call.call_id), call.*";
                    qry += ", cd.*";
                    //qry += ", ct.tag_id AS tag_id";
                    qry += " FROM " + table;
                    qry += " JOIN call_detail AS cd on cd.call_id = call.call_id";
                    if (joins.length > 0) qry += " " + joins.join(' ');
                    //qry += " LEFT JOIN call_tag AS ct ON ct.call_id = call.call_id";
                    qry += where;
                    if (andOp.length > 0) qry += " AND " + andOp.join(' AND ');
                    qry += " ORDER BY " + sort_by + " " + sort_order;
                    qry += " OFFSET " + offset;
                    qry += " LIMIT " + limit;

                    appModel.ctPool.query(qry, function(err, result) {
                        cb(err, result);
                    });



                }
            ],
            function(err, result) {
                if (err) {
                    res(err);
                } else {
                    data.calls = result;
                    res(null, data);
                }
            }
        );
    },
    getInfo: function(req, res) {
        //use parallel to run all the queries at the same time and wait for all to complete.
        async.parallel([
                function(callback) {
                    //get caller id data
                    var qry = "SELECT * FROM call_extend WHERE call_id = " + req.id;
                    connector.ctPool.query(qry, function(err, data) {
                        //if(data.length == 0) data = [{}];
                        callback(err, data);
                    });

                },
                function(callback) {
                    //get indicator data
                    var qry = "SELECT ins.score_value, ind.indicator_name FROM indicator_score as ins ";
                    qry += "JOIN indicator as ind on ind.indicator_id = ins.indicator_id ";
                    qry += "WHERE ind.indicator_active = TRUE and ins.call_id = " + req.id;
                    connector.ctPool.query(qry, function(err, data) {
                        //console.log(err);
                        callback(err, data);
                    });
                },
                function(callback) {
                    var qry = "SELECT cd.dni_log_id, cdl.*,dpn.*,ref_param.* from ct_dni_logs cdl " +
                        "LEFT JOIN dni_phone_numbers dpn ON(cdl.ct_dni_log_id =dpn.ct_dni_log_id) " +
                        "LEFT JOIN ct_dni_log_referring_parameters ref_param ON(ref_param.ct_dni_log_id = cdl.ct_dni_log_id) " +
                        "JOIN call_detail cd ON(cd.dni_log_id = cdl.dni_log_id) WHERE  cd.call_id = " + req.id;
                    connector.ctPool.query(qry, function(err, data) {
                        if (data[0] && data[0].dni_log_id.length) {
                            callback(err, data);
                        } else {
                            callback(err, []);
                        }
                    });
                }
            ],
            // optional callback
            function(err, results) {
                var result = [{ "source_data": results[0], "indicator_scores": results[1], "dni": results[2] }];
                res(err, result);
            });
    },

    getComments: function(req, res) {
        var zone = (req.timezone ? req.timezone : 'EST');
        var qry = "SELECT com.comment_id, com.call_id, com.ct_user_id, com.comment_text, ";
        qry += "com.comment_created AT TIME ZONE '" + zone + "' as comment_created, com.comment_modified, com.comment_parent_id, ";
        qry += "com.comment_active, ctuser.first_name, ctuser.last_name FROM comment as com ";
        qry += "LEFT JOIN ct_user as ctuser on ctuser.ct_user_id = com.ct_user_id ";
        qry += "WHERE com.call_id = '" + req.id + "';";
        connector.ctPool.query(qry, function(err, data) {
            res(err, data);
        });
    },

    postComments: function(req, res) {
        var comment = req.body.comment;
        var date_timestamp = 'CURRENT_TIMESTAMP'; // f.mysqlTimestamp();
        if(req.body.is_from_report){
            comment.is_from_report = req.body.is_from_report;
        }
        comment.comment_created = date_timestamp;
        comment.comment_modified = date_timestamp;
        comment.comment_timestamp = 0;
        comment.comment_active = true;
        var insertData = {
            table: 'comment',
            values: comment
        };
        console.log(comment);
        connector.ctPool.insert(insertData, function(err, data) {
            res(err, data);
        });
    },

    emailRecordings: function(req, res) {
        var email = require('../lib/email');
        var template = 'recording';
        if (!req.body.email.name) req.body.email.name = 'An unknown user ';
        if (!req.body.email.message) req.body.email.message = '';
        // Check looker user has access to listen to recording.
        if (req.body.email.user_authorised !== undefined && req.body.email.user_authorised == false) {
            template = 'unauthorized';
        };

        if (req.body.email.s3URL.trim() === "") {
            req.body.email.s3URL = "#";
            req.body.email.message = "No audio recording available for this call."
        }

        var org_unit_id = req.user.ou_id !== undefined ? req.user.ou_id : req.body.email.org_unit_id;
        email.send(template, req.body.email, req.body.email.to, org_unit_id, function(err, data) {
            if (err) { return res(err); }
            res(null, data);
        });
    },

    deleteComments: function(req, res) {
        var qry = "DELETE FROM comment WHERE comment_id = '" + req.params.id + "'";
        connector.ctPool.query(qry, function(err, data) {
            res(err, data);
        });
    },

    getTags: function(req, res) {
        var qry = "SELECT DISTINCT (ct.call_id),tag.*, usr.role_id,acc.permission FROM call_tag as ct ";
        qry += "LEFT JOIN tag as tag on tag.tag_id = ct.tag_id ";
        qry += "LEFT JOIN ct_user as usr on usr.ct_user_id = ct.ct_user_id ";
        qry += "LEFT JOIN role_access as acc on acc.role_id = usr.role_id AND acc.scope_id = (select scope_id from scope where scope_code = 'tag') ";
        qry += "WHERE ct.call_id = " + req.id + " AND tag.tag_active = 't' AND tag.org_unit_id IN (SELECT org_unit_id FROM org_unit WHERE top_ou_id = (SELECT distinct billing_id FROM org_unit WHERE org_unit_id in ("+req.orglist+")))";
        connector.ctPool.query(qry, function(err, data) {
            res(err, data);
        });
    },

    updateTags: function(req, res) {
        var taglist = req.body.tag;
        var date_timestamp = f.mysqlTimestamp();
        tag.call_tag_created = date_timestamp;

        var calltagjson = {
            "tag": {
                "call_id": tag.call_id,
                "ct_user_id": tag.ct_user_id,
                "tag_id": null,
                "call_tag_created": tag.call_tag_created
            }
        };

    },

    postTags: function(req, res) {

        //get current call_tag list
        //add to it modified field set to false
        //join users role to user id

        //qry = "SELECT call.call_id, call.tag_id, call.ct_user_id, call.call_tag_created, ctuser.role_id "
        //	+ "FROM call_tag AS call "
        //	+ "LEFT JOIN ct_user AS ctuser ON ctuser.ct_user_id = call.ct_user_id "
        //	+ "WHERE call_id = '" + req.body.call_id + "';";


        var qry = [
            "SELECT call.call_id, call.tag_id, call.ct_user_id, call.call_tag_created, ctuser.role_id ",
            "FROM call_tag AS call ",
            "LEFT JOIN ct_user AS ctuser ON ctuser.ct_user_id = call.ct_user_id ",
            "WHERE call_id = '" + req.body.call_id + "';"
        ].join("");



        connector.ctPool.query(qry, function(err, data) {
            if (err) {
                console.log(err);
                return;
            }
            var error = "";
            var results = "Call Tag Processing Complete.";


            //Cases:
            //	Add New Single Tag & Data Length of tags = 0
            //  Add New Single Tag & Data Length of tags > 0
            //  Add Multiple Tags & Data Length of tags = 0
            //  Add Multiple Tags & Data Length of tags > 0
            //  Remove Multiple Tags & Data Length of tags > 0


            if (req.body.addmultiple) {

                console.log("DATA LENGTH: " + data.length);

                if (data.length <= 0) {
                    data = [];
                }

                console.log("ADD MULTIPLE: " + req.body.addmultiple);
                //console.log("retrieved original call_tag list!");
                //console.log(req.body.call_id);
                //console.log(req.body);
                //console.log("data: " + req.body.calltags[0].tag.tag_id);

                var tagstoremove = lookupTagsToRemove(req.body.calltags, data); //remove from data
                var tagstoadd = lookupTagsToAdd(req.body.calltags, data); //add to data

                //Remove Tags not selected
                if (tagstoremove.length > 0) {

                    //console.log("tagstoremove: " + tagstoremove);
                    qry = "DELETE FROM call_tag WHERE call_id = '" + req.body.call_id + "' AND tag_id IN (" + tagstoremove + ");";
                    //console.log(qry);

                    connector.ctPool.query(qry, function(err, data) {
                        if (err) {
                            console.log(err);
                            error += err;
                            //console.log("ERROR DELETING");
                            return;
                        } else {
                            //res(err, data);
                            results += "Done Deleting Tags. ";
                            return;
                        }
                    });
                }



                //Add selected tags
                if (tagstoadd.length > 0) {
                    //console.log("tagstoadd: " + tagstoadd);

                    var tagvalues = [];
                    var table = "call_tag";
                    var rowheader = "call_id, tag_id, ct_user_id, call_tag_created";

                    for (var i = 0; i < tagstoadd.length; i++) {
                        var rowvalues = req.body.call_id + "," + tagstoadd[i] + "," + req.body.ct_user_id + ",'" + f.mysqlTimestamp() + "'";
                        //console.log("rowvalues: " + rowvalues);
                        tagvalues.push("(" + rowvalues + ")");
                    }

                    //console.log(tagvalues);

                    qry = "INSERT INTO " + table + " (" + rowheader + ") VALUES " + tagvalues.join(',');

                    var insertData = {
                        which: 'query',
                        qry: qry
                    };


                    //console.log("QRY: " + qry);

                    var ctTrans = new ctTransactionModel.begin(function(err) {
                        //console.log("Transaction Begin:");
                        ctTrans.query(insertData, function(err, data) {
                            if (err) {
                                error += err;
                                ctTrans.rollback(function() {
                                    return;
                                    //res(err);
                                });
                            } else {
                                ctTrans.commit(function() {
                                    results += 'Call Tags created. ';
                                    return;
                                    //res(null, 'Call Tags created.');
                                    //console.log("Call Tags created.");
                                });
                            }
                        });
                    });
                }
                res(error, results);
                //console.log("data: " + data);

            } else {
                //add new tags one by one
                //check if exists in current list and drop if exists
                //add

                var tag = req.body.calltags[0].tag;
                var date_timestamp = f.mysqlTimestamp();
                tag.call_tag_created = date_timestamp;

                var calltagjson = {
                    "tag": {
                        "call_id": tag.call_id,
                        "ct_user_id": tag.ct_user_id,
                        "tag_id": null,
                        "call_tag_created": tag.call_tag_created
                    }
                };

                var tagjson = {
                    "tag": {
                        "org_unit_id": tag.org_unit_id,
                        "tag_name": tag.tag_text,
                        "tag_created": tag.call_tag_created,
                        "tag_active": true
                    }
                };

                qry = "SELECT * FROM tag WHERE LOWER(tag_name) = LOWER('" + tag.tag_text + "') AND tag_active = true AND org_unit_id in (select org_unit_id from org_unit where billing_id = (SELECT billing_id FROM org_unit WHERE org_unit_id ="+tag.org_unit_id+" ));";
                connector.ctPool.query(qry, function(err, data) {
                    var insertData;

                    if (err) {
                        console.log(err);
                        return;
                    }

                    if (data.length > 0) {
                        calltagjson.tag.tag_id = data[0].tag_id;

                        var get_all_group = "select * from tag where org_unit_id in (select org_unit_id from org_unit where billing_id = (SELECT billing_id FROM org_unit WHERE org_unit_id ="+tag.org_unit_id+" ))";
                        console.log("group _id "+tag.org_unit_id);
                        connector.ctPool.query(get_all_group, function(err, data) {
                            if(data[0].tag_id == calltagjson.tag.tag_id){
                                if(data[0].tag_active == 'f'){
                                    var activate_tag = "Update tag set tag_active = 't' where tag_id="+data[0].tag_id;
                                    connector.ctPool.query(activate_tag, function(err, data) {
                                        console.log("updated tag ",data[0].tag_id);
                                    })
                                }
                            }
                        });

                        insertData = {
                            table: 'call_tag',
                            values: calltagjson.tag
                        };
                        activatedTag = {
                            "tag_id": calltagjson.tag.tag_id,
                            "tag_name": tag.tag_text
                        };

                        qry = "SELECT * FROM call_tag WHERE tag_id = " + calltagjson.tag.tag_id + " AND call_id = " + tag.call_id + ";";

                        connector.ctPool.query(qry, function(err, data) {
                            if (data.length == 0) {

                                connector.ctPool.insert(insertData, function(err, data) {
                                    if (err) {
                                        console.log(err);
                                        res(err);
                                        return;
                                    } else {
                                        res(err, activatedTag);
                                        return;
                                    }
                                });
                            } else {
                                res(err, activatedTag);
                                return;
                            }
                        });

                        if (data[0].tag_active == false) {
                            var qry = "UPDATE tag SET tag_active=true WHERE tag_id = " + data[0].tag_id;
                            connector.ctPool.query(qry, function(err, data) {
                                if (err) {
                                    console.log(err);
                                    res(err);
                                    return;
                                }

                            });
                        }
                    } else {
                        insertData = {
                            table: 'tag',
                            values: tagjson.tag
                        };
                        connector.ctPool.insert(insertData, function(err, data) {
                            if (err) {
                                console.log(err);
                                res(err);
                                return;
                            }

                            if (data.insertId !== undefined) {
                                calltagjson.tag.tag_id = data.insertId;

                                tagjson.tag.tag_id = data.insertId;
								tagjson.tag.ct_user_id = calltagjson.tag.ct_user_id;
			                    ctlogger.log(tagjson.tag, 'insert', 'tag','','',req.headers.authorization);

                                insertData = {
                                    table: 'call_tag',
                                    values: calltagjson.tag
                                };
                                connector.ctPool.insert(insertData, function(err, data) {
                                    if (err) {
                                        console.log(err);
                                        return;
                                    }
                                    insertedTag = {
                                        "tag_id": calltagjson.tag.tag_id,
                                        "tag_name": tag.tag_text
                                    };
                                    res(err, insertedTag);
                                    return;
                                });
                            } else {
                                res(err, data);
                                return;
                            }
                        });
                    }
                });
            }
            return;
        });

    },

    saveAgentdata: function (data, res) {
        console.log(data.ct_user_id + " " + data.call_id);
        var qry = "SELECT scc.score_card_call_status, c.ct_user_id FROM score_card_calls AS scc"
        qry += " JOIN call AS c ON scc.call_id = c.call_id"
        qry += " WHERE scc.call_id =" + data.call_id;

        appModel.ctPool.query(qry, function (err, result) {
            if (err) { res(err) }
            else if (result.length > 0 && data.ct_user_id === "unassigned" && (result[0].score_card_call_status == 'scored' || result[0].score_card_call_status == 'reviewed')) {
                res('Can not remove agent due to call already scored.');
            } else {
                if (data.ct_user_id === "unassigned")
                    data.ct_user_id = null;

                var query = "UPDATE " + table;
                query += " SET ct_user_id = " + data.ct_user_id;
                query += " WHERE call_id = " + data.call_id;
                console.log(query);
                appModel.ctPool.query(query, function (err, result) {
                    if (err) {
                        return res("Unable to update data");
                    } else {
                        return res(null, result);
                    }
                });
            }
        });

    }
};

function queryBuild(filterarray2, i) {
    //console.log(filterarray2);
    var column = filterarray2[0 + (i * 4)];
    var operator = filterarray2[1 + (i * 4)];
    var include = filterarray2[2 + (i * 4)];
    var text = filterarray2[3 + (i * 4)].replace("**", ",");
    var qry = "";
    var textArray = [];
    if (include === "NOT ")
        operator = convertOperator(operator);

    if (column === "call.call_started") {
        if (operator === 'ILIKE' || operator === 'NOT ILIKE') {
            if (include === "NOT ")
                operator = "NOT BETWEEN";
            else
                operator = "BETWEEN";
            text = moment(text).format("YYYY-MM-DD HH:mm:ss");
            text = text + " " + timezone + "' AND '" + f.reportFullDate(text) + " " + timezone;
            //console.log(text);
        } else {
            var extraTime = calculateExtraTime(text);
            if (operator === ">")
                text = moment(text).add(1, extraTime).format("YYYY-MM-DD HH:mm:ss") + " " + timezone;
            else
                text = moment(text).format("YYYY-MM-DD HH:mm:ss") + " " + timezone;
            //console.log("test",text)
        }
    }
    if (operator === 'ILIKE' || operator === 'NOT ILIKE') {
        opsymbol1 = "'%";
        opsymbol2 = "%'";
    } else {
        opsymbol1 = "'";
        opsymbol2 = "'";
    }

    if (column === "call.duration")
        column = "TO_CHAR((" + column + "|| ' second')::interval, 'HH24:MI:SS')";
    //console.log(column);
    switch (column) {
        /*case "cd.ring_to_name":
            qry =  "AND (" + column + " " + operator + " " + opsymbol1 + text + opsymbol2 ;
            qry += " OR call.ring_to" + " " + operator + " " + opsymbol1 + text + opsymbol2;
            qry += ")";
			break;*/
        case "cd.ring_to_name":
            if (text.indexOf("|") > 0) {
                textArray = text.split("|");
                qry = "AND (" + column + " " + operator + " " + opsymbol1 + textArray[0] + opsymbol2;
                qry += (include === "NOT ") ? " AND" : " OR";
                if (textArray[1])
                    qry += "(call.ring_to" + " " + operator + " " + opsymbol1 + textArray[1] + opsymbol2 + ")";
                qry += ")";
            } else {
                qry = "AND (" + column + " " + operator + " " + opsymbol1 + text + opsymbol2;
                qry += (include === "NOT ") ? " AND" : " OR";
                qry += " call.ring_to" + " " + operator + " " + opsymbol1 + text + opsymbol2;
                qry += ")";
            }

            break;
        case "chan.category":
            if (text.indexOf(":") > 0) {
                textArray = text.split(":");
                qry = "AND (" + column + " " + operator + " " + opsymbol1 + textArray[0] + opsymbol2;

                qry += (include === "NOT ") ? " OR" : " AND";

                if (textArray[1])
                    qry += " (chan.sub_category" + " " + operator + " " + opsymbol1 + textArray[1] + opsymbol2 + ")";
                qry += ")";
            } else {
                qry = "AND (" + column + " " + operator + " " + opsymbol1 + text + opsymbol2;
                qry += " OR chan.sub_category" + " " + operator + " " + opsymbol1 + text + opsymbol2;
                qry += ")";
            }

            break;
        case "tag.tag_name":
            qry = " AND call.call_id IN(SELECT ct.call_id FROM call_tag AS ct JOIN tag AS tag ON ct.tag_id = tag.tag_id WHERE tag.tag_name " + operator + " " + opsymbol1 + text + opsymbol2 + ") ";
            break;
        case "call.call_id":
            if (operator === 'ILIKE' || operator === 'NOT ILIKE') {
                qry = "AND ( CAST(" + column + " AS varchar) " + operator + " " + opsymbol1 + text + opsymbol2 + ") ";
            } else {
                qry = "AND (" + column + " " + operator + " " + opsymbol1 + text + opsymbol2 + ") ";
            }
            break;
        default:
            qry = "AND (" + column + " " + operator + " " + opsymbol1 + text + opsymbol2 + ") ";
            break;
    }
    return qry
}

function calculateExtraTime(date) {
    var extraTimeBy;
    var dateStr = date.split(' ')[0];
    var dateArr = dateStr.split('-');
    var timeStr = date.split(' ')[1];
    if (timeStr === undefined) {
        extraTimeBy = "days"
    } else {
        var timeArr = timeStr.split(':');
        switch (timeArr.filter(Boolean).length) {
            case 1:
                extraTimeBy = "seconds"
                break;
            case 2:
                extraTimeBy = "minutes"
                break;
                extraTimeBy = "seconds"
                break;
        }
    }
    return extraTimeBy;
}

function convertOperator(operator) {
    mapped_keys = {
        "=": "!=",
        "<": ">=",
        ">": "<=",
        "ILIKE": "NOT ILIKE"
    };
    operator = mapped_keys[operator];
    return operator;
}
//returns an array of tag indexes to add
function lookupTagsToAdd(calltags, data) {

    var tagIndexToAdd = [];
    var matchArr = [];
    if (data === undefined)
        data = [];
    for (var i = 0; i < calltags.length; i++) {
        matchArr[i] = 0;
        myArray = data.filter(function(el, index) {

            if (el.tag_id === calltags[i].tag.tag_id) {
                matchArr[i] = 1;
                el.index = index;
                //console.log("i: " + i + ", calltag:" + calltags[i].tag.tag_id + ", el.tag_id:" + el.tag_id + ", index:" + index, ", match:" + matchArr[i]);
                return true;
            } else {
                //console.log("i: " + i + ", calltag:" + calltags[i].tag.tag_id + ", el.tag_id:" + el.tag_id + ", index:" + index, ", match:" + matchArr[i]);
                return false;
            }
        });
        if (matchArr[i] === 0) {
            tagIndexToAdd.push(calltags[i].tag.tag_id);
            //console.log("need to add");
        }
        //console.log( myArray );
    }

    //console.log( tagIndexToAdd );
    return tagIndexToAdd;
}

//returns an array of tag indexes to remove
function lookupTagsToRemove(calltags, data) {
    var tagIdToRemove = [];
    var matchArr = [];
    for (var i = 0; i < data.length; i++) {
        matchArr[i] = 0;
        myArray = calltags.filter(function(el, index) {

            if (el.tag.tag_id === data[i].tag_id) {
                matchArr[i] = 1;
                //console.log("i: " + i + ", datatag:" + data[i].tag_id + ", el.tag_id:" + el.tag.tag_id + ", index:" + index, ", match:" + matchArr[i]);
                return true;
            } else {
                //console.log("i: " + i + ", datatag:" + data[i].tag_id + ", el.tag_id:" + el.tag.tag_id + ", index:" + index, ", match:" + matchArr[i]);
                return false;
            }
        });
        if (matchArr[i] === 0) {
            tagIdToRemove.push(data[i].tag_id);
            //console.log("need to remove");
        }
        //console.log( myArray );
    }
    //console.log( tagIdToRemove );
    return tagIdToRemove;
}

module.exports = call;
