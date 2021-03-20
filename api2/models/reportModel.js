var mysql = require('mysql'),
    connector = require('./appModel'),
    appModel = require('./appModel'),
    ctTransactionModel = require('./ctTransactionModel'),
    yaml = require("js-yaml"),
    f = require('../functions/functions.js'),
    access = require('../controllers/userAccessController'),
    fs = require('fs'),
    e = yaml.load(fs.readFileSync("config/database.yml")),
    async = require('async'),
    envVar = process.env.NODE_ENV,
    orgUnitModel = require('./orgUnitModel.js'),
    callFlowModel = require('./callFlowModel.js'),
    numberPoolModel = require('./newNumberPoolModel.js'),
    table = 'callFlowReport',
    advFilterValidate = require('../lib/advFilterValidate.js'),
    moment = require('moment'),
    timeStampToSec = require('./convertTimestampToSec.js'),
	userpermissions = require('./userPermissionModel'),
    momentTimezone = require('moment-timezone');
    amqp = require('amqplib'),
    ctlogger = require('../lib/ctlogger.js'),
    ctUserModel = require('./ctUserModel'),
    uservoiceSSO = require('../lib/uservoiceSSO.js'),
    when = require('when'),
    toll_frees = require('../config/toll_free.json'),
    csTransactionModel = require('./csTransactionModel'),
    grep = require('grep-from-array'),
    _ = require('underscore');

var rabbit = yaml.load(fs.readFileSync("./config/rabbit.yml"));
var timezone = 'UTC';
var url = 'amqp://' + rabbit[envVar].user + ':' + rabbit[envVar].password + '@' + rabbit[envVar].host + ':' + rabbit[envVar].port + '/' + rabbit[envVar].vhost;
var nonHavingValues = ['ou.org_unit_id', 'ou.org_unit_name', 'ou.org_unit_ext_id', 'pr.provisioned_route_name', 'pn.number', 'c.campaign_name', 'c.campaign_ext_id']
var report = {
    acqCallFlowReport: function(req, res) {
        var result = { "rdo": null, "aggregated_data": null };
        var data;

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
                var query = "SELECT * FROM report_definition_object WHERE rdo_report_name = 'Call Flows'";
                connector.ctPool.query(query, function(err, rdoData) {
                    if (err) { return callback('Failed to execute lookup of report definition object. ' + err); }
                    if (rdoData.length < 1) { return callback('No matching record found for RDO'); }
                    result.rdo = rdoData;
                    callback(null);
                });
            },
            function(callback) {
                data = req.query;
                // data.secondary = (data.secondary !== undefined && data.secondary ? data.secondary : 'ring_to_number');
                data.secondary = (data.secondary !== undefined && data.secondary ? (data.secondary).replace(/acq_/g, '') : 'ring_to_number');

                var query2 = "SELECT rcf_date AT TIME ZONE '" + data.timezone + "' as adjusted_date, rcf_json FROM report_call_flow WHERE provisioned_route_id IN (";
                query2 += "SELECT DISTINCT pr.provisioned_route_id FROM provisioned_route AS pr  ";
                query2 += "JOIN campaign_provisioned_route as cpr on cpr.provisioned_route_id=pr.provisioned_route_id ";
                query2 += "JOIN campaign as camp on camp.campaign_id=cpr.campaign_id  ";
                query2 += "LEFT JOIN campaign_ct_user as ccu on ccu.campaign_id = camp.campaign_id ";
                query2 += "WHERE ccu.ct_user_id=" + data.ct_user_id + " OR camp.campaign_owner_user_id=" + data.ct_user_id + ") " +
                    "AND rcf_grouping_key='" + data.secondary + "' ";

                if (data.start_date && data.end_date) {
                    if (data.end_date.length <= 10) { data.end_date += ' 23:59:59'; }
                    query2 += "AND rcf_date BETWEEN '" + data.start_date + " " + data.timezone + "' AND '" + data.end_date + " " + data.timezone + "' ";
                }

                connector.ctPool.query(query2, function(err, data) {
                    var res_data = [],
                        call_flow_ids = [],
                        call_flow_list = [],
                        call_flow_names = [];
                    for (var x in data) {
                        data[x].rcf_json.date = data[x].adjusted_date;
                        if (call_flow_list.indexOf(data[x].rcf_json.provisioned_route_id) === -1) {
                            call_flow_ids.push(data[x].rcf_json.provisioned_route_id);
                        }
                    }
                    // replacing all call flow names if call flow names were updated before.
                    if (call_flow_ids.length > 0) {
                        var query = "SELECT provisioned_route_id,provisioned_route_name FROM provisioned_route WHERE provisioned_route_id IN (" + call_flow_ids + ")";
                        connector.ctPool.query(query, function(err, pr_data) {
                            if (pr_data) {
                                for (var i = 0; i < pr_data.length; i++) {
                                    call_flow_names[pr_data[i].provisioned_route_id] = pr_data[i].provisioned_route_name;
                                }
                                for (var x in data) {
                                    var cf_id = data[x].rcf_json.provisioned_route_id;
                                    data[x].rcf_json.call_flow_name = call_flow_names[cf_id];
                                    res_data.push(data[x].rcf_json);
                                }
                                callback(err, res_data);
                            } else {
                                callback(err, res_data);
                            }
                        });
                    } else {
                        callback(err, res_data);
                    }
                });
            }
        ], function(err, results) {
            result.groupingKeyNames = [{ "primaryGroupName": "provisioned_route_id", "secondaryGroupName": data.secondary }];
            result.aggregated_data = results;
            res(err, result);
        });
    },
    acqKeywordReport: function(req, res) {
        var result = { "rdo": null, "aggregated_data": null };
        var data;

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
                var query = "SELECT * FROM report_definition_object WHERE rdo_report_name = 'Keywords'";
                connector.ctPool.query(query, function(err, rdoData) {
                    if (err) { return callback('Failed to execute lookup of report definition object. ' + err); }
                    if (rdoData.length < 1) { return callback('No matching record found for RDO'); }
                    result.rdo = rdoData;
                    callback(null);
                });
            },
            function(callback) {
                data = req.query;
                // data.secondary = (data.secondary !== undefined && data.secondary ? data.secondary : 'source');
                data.secondary = (data.secondary !== undefined && data.secondary ? (data.secondary).replace(/acq_/g, '') : 'source');

                var query2 = "SELECT rk_date AT TIME ZONE '" + data.timezone + "' as adjusted_date, rk_json FROM report_keyword WHERE campaign_id IN (";
                query2 += "SELECT camp.campaign_id FROM campaign AS camp  ";
                query2 += "LEFT JOIN campaign_ct_user AS ccu ON camp.campaign_id = ccu.campaign_id ";
                query2 += "WHERE ccu.ct_user_id = " + data.ct_user_id + " OR camp.campaign_owner_user_id = " + data.ct_user_id + ") ";
                query2 += "AND rk_grouping_key='" + data.secondary + "' ";
                if (data.start_date && data.end_date) {
                    if (data.end_date.length <= 10) { data.end_date += ' 23:59:59'; }
                    query2 += "AND rk_date BETWEEN '" + data.start_date + " " + data.timezone + "' AND '" + data.end_date + " " + data.timezone + "' ";
                }
                connector.ctPool.query(query2, function(err, data) {
                    var res_data = [];
                    for (var x in data) {
                        data[x].rk_json.date = data[x].adjusted_date;
                        res_data.push(data[x].rk_json);
                    }
                    callback(err, res_data);
                });
            }
        ], function(err, results) {
            result.groupingKeyNames = [{ "primaryGroupName": "keyword", "secondaryGroupName": data.secondary }];
            result.aggregated_data = results;
            res(err, result);
        });
    },
    acqSourceReport: function(req, res) {
        var result = { "rdo": null, "aggregated_data": null };
        var data;

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
                var query = "SELECT * FROM report_definition_object WHERE rdo_report_name = 'Sources'";
                connector.ctPool.query(query, function(err, rdoData) {
                    if (err) { return callback('Failed to execute lookup of report definition object. ' + err); }
                    if (rdoData.length < 1) { return callback('No matching record found for RDO'); }
                    result.rdo = rdoData;
                    callback(null);
                });
            },
            function(callback) {
                data = req.query;
                // data.secondary = (data.secondary !== undefined && data.secondary ? data.secondary : 'call_flow');
                data.secondary = (data.secondary !== undefined && data.secondary ? (data.secondary).replace(/acq_/g, '') : 'call_flow');

                var query2 = "SELECT rs_date AT TIME ZONE '" + data.timezone + "' AS adjusted_date, rs_json FROM report_source WHERE campaign_id IN(";
                query2 += "SELECT camp.campaign_id FROM campaign AS camp  ";
                query2 += "LEFT JOIN campaign_ct_user AS ccu ON camp.campaign_id = ccu.campaign_id WHERE ct_user_id = " + data.ct_user_id + " OR camp.campaign_owner_user_id = " + data.ct_user_id + ") ";
                query2 += "AND rs_grouping_key = '" + data.secondary + "' ";
                if (data.start_date && data.end_date) {
                    if (data.end_date.length <= 10) { data.end_date += ' 23:59:59'; }
                    query2 += "AND rs_date BETWEEN '" + data.start_date + " " + data.timezone + "' AND '" + data.end_date + " " + data.timezone + "' ";
                }
                connector.ctPool.query(query2, function(err, data) {
                    if (err) {
                        console.log(err);
                        console.log(query2)
                    };
                    var res_data = [];
                    for (var x in data) {
                        data[x].rs_json.date = data[x].adjusted_date;
                        res_data.push(data[x].rs_json);
                    }
                    callback(err, res_data);
                });
            }
        ], function(err, results) {
            result.groupingKeyNames = [{ "primaryGroupName": "dynamicsource", "secondaryGroupName": data.secondary }];
            result.aggregated_data = results;
            res(err, result);
        });
    },
    acqCampaignReport: function(req, res) {
        var result = { "rdo": null, "aggregated_data": null };
        var data;

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
                var query = "SELECT * FROM report_definition_object WHERE rdo_report_name = 'Campaigns'";
                connector.ctPool.query(query, function(err, rdoData) {
                    if (err) { return callback('Failed to execute lookup of report definition object. ' + err); }
                    if (rdoData.length < 1) { return callback('No matching record found for RDO'); }
                    result.rdo = rdoData;
                    callback(null);
                });
            },
            function(callback) {
                data = req.query;
                // data.secondary = (data.secondary !== undefined && data.secondary ? data.secondary : 'call_flow');
                data.secondary = (data.secondary !== undefined && data.secondary ? (data.secondary).replace(/acq_/g, '') : 'call_flow');

                var query2 = "SELECT rc_date AT TIME ZONE '" + data.timezone + "' as adjusted_date, rc_json FROM report_campaign WHERE campaign_id IN(";
                query2 += "SELECT camp.campaign_id FROM campaign AS camp  ";
                query2 += "LEFT JOIN campaign_ct_user AS ccu ON camp.campaign_id = ccu.campaign_id WHERE ct_user_id = " + data.ct_user_id + " OR camp.campaign_owner_user_id = " + data.ct_user_id + ") ";
                query2 += "AND rc_grouping_key = '" + data.secondary + "' ";

                console.log('START', data.start_date, 'END', data.end_date);
                if (data.start_date && data.end_date) {
                    if (data.end_date.length <= 10) { data.end_date += ' 23:59:59'; }
                    query2 += "AND rc_date BETWEEN '" + data.start_date + " " + data.timezone + "' AND '" + data.end_date + " " + data.timezone + "' ";
                }

                connector.ctPool.query(query2, function(err, data) {
                    var res_data = [],
                        camp_ids = [],
                        camp_list = [],
                        camp_names = [];
                    for (var x in data) {
                        data[x].rc_json.date = data[x].adjusted_date;
                        if (camp_list.indexOf(data[x].rc_json.campaign_id) === -1) {
                            camp_ids.push(data[x].rc_json.campaign_id);
                        }
                    }
                    // replacing all camapign names if campaign names were updated before.
                    if (camp_ids.length > 0) {
                        var query = "SELECT campaign_id,campaign_name FROM campaign WHERE campaign_id IN (" + camp_ids + ")";
                        connector.ctPool.query(query, function(err, camp_data) {
                            if (camp_data) {
                                for (var i = 0; i < camp_data.length; i++) {

                                    camp_names[camp_data[i].campaign_id] = camp_data[i].campaign_name;
                                }
                                for (var x in data) {
                                    var c_id = data[x].rc_json.campaign_id;
                                    data[x].rc_json.campaign_name = camp_names[c_id];
                                    res_data.push(data[x].rc_json);
                                }
                                callback(err, res_data);
                            } else {
                                callback(err, res_data);
                            }
                        });
                    } else {
                        callback(err, res_data);
                    }
                });
            }
        ], function(err, results) {
            result.groupingKeyNames = [{ "primaryGroupName": "campaign", "secondaryGroupName": data.secondary }];
            result.aggregated_data = results;
            res(err, result);
        });
    },
    acqGroupReport: function(req, res) {
        var result = { "rdo": null, "aggregated_data": null };
        var data;

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
                var query = "SELECT * FROM report_definition_object WHERE rdo_report_name = 'Groups'";
                connector.ctPool.query(query, function(err, rdoData) {
                    if (err) { return callback('Failed to execute lookup of report definition object. ' + err); }
                    if (rdoData.length < 1) { return callback('No matching record found for RDO'); }
                    result.rdo = rdoData;
                    callback(null);
                });
            },
            function(callback) {
                data = req.query;
                data.secondary = (data.secondary !== undefined && data.secondary ? (data.secondary).replace(/acq_/g, '') : 'call_flow');
                var query2 = "SELECT rg_date AT TIME ZONE '" + data.timezone + "' as adjusted_date, rg_json FROM report_group ";

                if (data.secondary === 'call_flow') {
                    query2 += " WHERE rg_grouping_key = '" + data.secondary + "' AND rg_grouping_value IN (";
                    query2 += "SELECT DISTINCT(CAST(pr.provisioned_route_id AS varchar)) FROM provisioned_route AS pr  ";
                    query2 += "JOIN campaign_provisioned_route as cpr on cpr.provisioned_route_id = pr.provisioned_route_id ";
                    query2 += "JOIN campaign as camp on camp.campaign_id = cpr.campaign_id  ";
                    query2 += "LEFT JOIN campaign_ct_user as ccu on ccu.campaign_id = camp.campaign_id ";
                } else if (data.secondary === 'campaign') {
                    query2 += " WHERE rg_grouping_key = '" + data.secondary + "' AND rg_grouping_value IN (";
                    query2 += "SELECT CAST(camp.campaign_id AS varchar) FROM campaign as camp ";
                    query2 += "LEFT JOIN campaign_ct_user as ccu on ccu.campaign_id = camp.campaign_id ";
                } else {
                    query2 += " WHERE rg_grouping_key = '" + data.secondary + "' AND campaign_id IN (";
                    query2 += "SELECT camp.campaign_id FROM campaign as camp ";
                    query2 += "LEFT JOIN campaign_ct_user as ccu on ccu.campaign_id = camp.campaign_id ";
                }
                query2 += "WHERE (ccu.ct_user_id='" + data.ct_user_id + "' OR camp.campaign_owner_user_id='" + data.ct_user_id + "'))";

                console.log('START', data.start_date, 'END', data.end_date);

                if (data.start_date && data.end_date) {
                    console.log('adding date range');
                    if (data.end_date.length <= 10) { data.end_date += ' 23:59:59'; }
                    query2 += " AND rg_date BETWEEN '" + data.start_date + " " + data.timezone + "' AND '" + data.end_date + " " + data.timezone + "' ";
                }
                //console.log(query2);
                connector.ctPool.query(query2, function(err, data) {
                    var res_data = [],
                        group_ids = [],
                        group_list = [],
                        group_names = [];
                    for (var x in data) {
                        data[x].rg_json.date = data[x].adjusted_date;
                        if (group_list.indexOf(data[x].rg_json.org_unit_id) === -1) {
                            group_ids.push(data[x].rg_json.org_unit_id);
                        }
                    }

                    // replacing all orgunit names if orf unit names were updated before.
                    if (group_ids.length > 0) {
                        var query = "SELECT org_unit_id,org_unit_name FROM org_unit WHERE org_unit_id IN (" + group_ids + ")";
                        connector.ctPool.query(query, function(err, org_data) {
                            if (org_data) {
                                for (var i = 0; i < org_data.length; i++) {

                                    group_names[org_data[i].org_unit_id] = org_data[i].org_unit_name;
                                }
                                for (var x in data) {
                                    var ou_id = data[x].rg_json.org_unit_id;
                                    data[x].rg_json.org_unit_name = group_names[ou_id];
                                    res_data.push(data[x].rg_json);
                                }
                                callback(err, res_data);
                            } else {
                                callback(err, res_data);
                            }
                        });
                    } else {
                        callback(err, res_data);
                    }
                });
            }
        ], function(err, results) {
            result.groupingKeyNames = [{ "primaryGroupName": "group", "secondaryGroupName": data.secondary }];
            result.aggregated_data = results;
            res(err, result);
        });
    },
    homeReport: function(req, res) {
        var data;
        var result = { "rdo": null, "aggregated_data": null };

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
                var query = "SELECT * FROM report_definition_object WHERE rdo_report_name = 'Home'";
                connector.ctPool.query(query, function(err, rdoData) {
                    //if (err) { return callback('Failed to execute lookup of report definition object. '+err); }
                    //if (rdoData.length < 1) { return callback('No matching record found for RDO'); }
                    result.rdo = rdoData;
                    callback(err);
                });
            },
            function(callback) {
                data = req.query;

                if (data.ou_id === 'undefined') {
                    data.ou_id = req.ouid;
                }
                var timezone = (data.timezone !== 'undefined') ? data.timezone : req.user.timezone;
                var query2 = "SELECT rh_date AT TIME ZONE '" + timezone + "' as adjusted_date, rh_json FROM report_home WHERE org_unit_id =" + data.ou_id + " ";
                if (data.start_date && data.end_date) {
                    if (data.end_date.length <= 10) { data.end_date += ' 23:59:59'; }
                    query2 += "AND rh_date BETWEEN '" + data.start_date + " " + timezone + "' AND '" + data.end_date + " " + timezone + "' ";
                }
                //console.log(query2);
                connector.ctPool.query(query2, function(err, data) {
                    var res_data = [];
                    for (var x in data) {
                        //console.log(data[x].rh_date);
                        data[x].rh_json.date = data[x].adjusted_date;
                        res_data.push(data[x].rh_json);
                        //console.log(data);
                    }
                    callback(err, res_data);
                });
            }
        ], function(err, results) {
            result.groupingKeyNames = [{ "primaryGroupName": "group" }];
            //result.rdo = results[0];
            result.aggregated_data = results;
            res(err, result);
        });
    },
    campaignSettings: function(params, userData, res) {
        var err = null;
        console.log('starting campaignSettings', userData);

        params = JSON.parse(decodeURIComponent(params));
        console.log('PARAMS', params);

        var limit = 100;
        if (params.limit && params.limit > 0) limit = params.limit;
        var offset = 0;
        if (params.offset && params.offset > 0) offset = params.offset;


        var query = "";
        var where = "";
        query += "SELECT c.campaign_id as id, c.campaign_name as campaign_name, c.campaign_ext_id as campaign_ext_id, c.campaign_ou_id as org_unit_id, ou.org_unit_name as org_unit_name, ";
        query += "CONCAT(usr.first_name,' ', usr.last_name) AS campaign_owner, ";
        query += "c.campaign_start_date AT TIME ZONE '" + userData.timezone + "' AS start_date, ";
        query += "c.campaign_end_date AT TIME ZONE '" + userData.timezone + "' AS end_date, c.campaign_status as status,  ";
        query += "COUNT(CASE WHEN pr.provisioned_route_status = 'active' THEN 1 END) AS active_routes, ";
        query += "COUNT(CASE WHEN pr.provisioned_route_status = 'inactive' THEN 1 END) AS inactive_routes, ";
        query += "string_agg(DISTINCT(CONCAT(ausr.first_name,' ', ausr.last_name)), ', ') as assigned_users, ";
        query += "c.campaign_status, campaign_start_date AT TIME ZONE '" + timezone + "' AS campaign_start_date, campaign_end_date AT TIME ZONE '" + timezone + "' AS campaign_end_date ";
        query += "FROM campaign as c ";
        query += "JOIN ct_user as usr on usr.ct_user_id = c.campaign_owner_user_id ";
        query += "JOIN org_unit AS ou ON c.campaign_ou_id = ou.org_unit_id ";
        query += "LEFT JOIN campaign_provisioned_route cpr ON c.campaign_id = cpr.campaign_id ";
        query += "LEFT JOIN provisioned_route pr ON cpr.provisioned_route_id = pr.provisioned_route_id ";
        query += "LEFT JOIN campaign_ct_user AS ccu ON c.campaign_id = ccu.campaign_id ";
        query += "JOIN ct_user as ausr on ausr.ct_user_id = ccu.ct_user_id ";
        async.series([
            function(callback) {
                if (userData.role_id == 1) { // if the user is an admin they see every campaign within the current ou
                    orgUnitModel.ouAndDescendents(userData.ou_id, function(ous) {
                        where = " WHERE (c.campaign_ou_id IN(" + ous + ") OR c.campaign_owner_user_id = " + userData.user_id + ") AND c.campaign_status !='deleted' ";
                        query += where;
                        callback(null, 'one');
                    });
                } else { // if the user is not an admin they see campaigns that they are users or owners of for the current ou
                    where = " WHERE c.campaign_owner_user_id = " + userData.user_id + "   AND c.campaign_status !='deleted' ";
                    query += where;
                    callback(null, 'one');
                }

            }
        ], function(err, results) {
            var formatedResults = { "results": null, "total_count": null };
            async.parallel([
                    function(cb2) {
                        query += "GROUP BY c.campaign_id, ou.org_unit_name, usr.first_name, usr.last_name ORDER BY c.campaign_name ASC Limit " + limit + " OFFSET " + offset;
                        connector.ctPool.query(query, function(err, data) {
                            //console.log(data[0]);
                            formatedResults.results = data;
                            cb2(err, null);
                        });
                    },
                    function(cb2) {
                        //don't do total count if offset is passed
                        if (params.offset && params.offset > 0) {
                            formatedResults.total_count = 'N/A';
                            cb2(err, null);
                        } else {
                            var countQuery = "SELECT COUNT(*) as total_count FROM campaign as c " + where;
                            connector.ctPool.query(countQuery, function(err, count) {
                                formatedResults.total_count = count[0].total_count;
                                cb2(err, null);
                            });
                        }
                    }
                ],
                // optional callback
                function(err, results2) {
                    //console.log(formatedResults);
                    res(err, formatedResults);
                });


        });
    },
    callFlowSettings: function(req, res) {
        //if (req.params.filter === undefined) { return res('No page or filter information provided'); }
        if (req.query === undefined) { return res('No page or filter information provided'); }
        var filter = req.query;
        var provisioned_pool_ids = [];

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
                var data = req.query;
                data.order = 'pr.provisioned_route_name';
                if ((data.exportData !== undefined && data.exportData === true) || data.exportData === 'true') {
                    //data.order += ", io.value, pro.percentage";
                    data.limit = '100000'; // reset limit
                    data.offset = '0'; // force to start
                }
                console.log("----------------------------------------");
                console.log('filterRule SET', unescape(data.filterRule));
                //data.filterRule = checkAndReplaceHash(data.filterRule);
                data.filterRule = data.filterRule;
                var finalAdvFilter = advFilterValidate.finalFilterValue(req, data)
                console.log("finalAdvFilter:===",finalAdvFilter)
                if (data.filterRule != undefined || data.filterRule != null){
                    data.filterRule = advFilterValidate.checkAndReplaceHash(finalAdvFilter)
                }
                //console.log("------------------------------Filter Ruleset: "+data.filterRule);
                //sdds
                var qryCnt = "SELECT COUNT (DISTINCT pr.provisioned_route_id) AS total ";
                var qryPre = "SELECT DISTINCT pr.provisioned_route_id, cpr.campaign_id, pr.provisioned_route_name, cf.routable_type, pr.provisioned_route_status , ce_cso.target_did as schedule_target_did,ce_cso.days as days,ce_cso.from_time as from_time,ce_cso.to_time as to_time, " +
                    "ou.org_unit_id, ou.org_unit_parent_id, ou.billing_id, ds.destination_url, ds.dni_element, ds.referrer, ds.referrer_type, ds.dni_type, ds.dni_active, pn.number, c.campaign_name, ou.org_unit_name, " +
                    " CASE WHEN cf.routable_type = 'IvrRoute2' THEN null" +
				    " ELSE (CASE WHEN pr.provisioned_route_id IS NOT NULL AND cf.record_until IS NULL THEN 'Yes' WHEN pr.provisioned_route_id IS NOT NULL AND cf.record_until IS NOT NULL THEN 'No' ELSE '' END) END AS record_call  , "+
                    " CASE WHEN cf.routable_type = 'IvrRoute2' THEN '' ELSE cf.play_disclaimer END AS play_disclaimer, "+                     
                    "CASE WHEN cf.routable_type = 'VoicemailRoute' THEN 'Voicemail' ELSE cf.default_ringto END , " + 
                    "CASE "+
                    "WHEN cf.routable_type = 'PercentageBasedRoute' THEN pro.vm_enabled "+
                    "WHEN cf.routable_type = 'ScheduleRoute' THEN ce_cso.vm_enabled "+
                    "ELSE cf.vm_enabled END AS vm_enabled,"+
                    "CASE WHEN cf.routable_type = 'ScheduleRoute' THEN csr.default_ringto ELSE '' END AS sch_ringto , csr.vm_enabled AS sch_enabled,"+
                    "ou.org_unit_id, ce_gre.strategy, cf.postcall_ivr_enabled AS instant_insights, pcio.post_Call_ivr_option_name AS instant_insights_config, cf.record_until, cf.play_disclaimer, cf.message_enabled, cf.whisper_enabled, cf.vm_enabled, ch.cat_combo, cf.routable_id, dou.custom_params , wb.webhook_name , pro.percentage, pro.target_did, pro.vm_enabled as percentage_vm_enabled, ce_cso.vm_enabled as schedule_vm_enabled ";
                    if ((data.exportData !== undefined && data.exportData === true) || data.exportData === 'true') {
                        qryPre += ",CASE ";
                        qryPre += "WHEN cf.routable_type = 'ScheduleRoute' THEN ce_cso.ce_hunt_type_id " ;
                        qryPre += "WHEN cf.routable_type = 'PercentageBasedRoute' THEN pro.ce_hunt_type_id " ;
                        qryPre += "WHEN cf.routable_type = 'SimpleRoute' AND cf.hunt_option IS NOT NULL THEN cf.hunt_option ";
                        qryPre += "WHEN cf.routable_type = 'GeoRoute' AND cf.hunt_option IS NOT NULL THEN cf.hunt_option ";
                        qryPre += "ELSE null " ;
                        qryPre += "END AS hunt_type ";
                    }else{
                         qryPre += ",pr.hunt_type ";
                    }

                var qry = "FROM campaign AS c LEFT JOIN campaign_ct_user AS ccu ON (c.campaign_id=ccu.campaign_id AND ccu.ct_user_id=" + data.ct_user_id + ") " +
                    "JOIN campaign_provisioned_route AS cpr ON (cpr.campaign_id=c.campaign_id) " +
                    "JOIN provisioned_route AS pr ON (pr.provisioned_route_id=cpr.provisioned_route_id AND pr.provisioned_route_status!='deleted') " +
                    "LEFT JOIN channel ch ON (pr.channel_id=ch.channel_id) " +
                    "LEFT JOIN provisioned_route_number prn ON (pr.provisioned_route_id=prn.provisioned_route_id) " +
                    "LEFT JOIN phone_number pn ON (prn.phone_number_id=pn.number_id) " +
                    "LEFT JOIN phone_detail pd ON (pd.number_id=pn.number_id AND app_id='CT') " +
                    "LEFT JOIN ce_call_flows cf ON (pr.provisioned_route_id=cf.provisioned_route_id AND cf.status!='deleted' AND cf.status!='suspended' AND cf.app_id='CT') " +
                    "LEFT JOIN post_call_ivr pci  ON cf.postcall_ivr_id = pci.post_call_ivr_id  "+
                    "LEFT JOIN post_call_ivr_options pcio  ON pcio.post_call_ivr_option_id = pci.post_call_ivr_option_id  "+
                    "LEFT JOIN ivr_options2 io ON (cf.routable_id=io.ivr_route_id AND cf.routable_type='IvrRoute2') "+
                    " LEFT JOIN ce_geo_routes ce_gre ON ce_gre.id = cf.routable_id AND cf.routable_type = 'GeoRoute' " +
                    " LEFT JOIN ce_schedule_routes csr ON csr.id = cf.routable_id AND cf.routable_type = 'ScheduleRoute' " +
                    " LEFT JOIN ce_schedule_options ce_cso ON (ce_cso.schedule_route_id = cf.routable_id AND cf.routable_type = 'ScheduleRoute' ";
                    if ((data.exportData !== undefined && data.exportData === true) || data.exportData === 'true') {
                        qry += " ) ";
                    }else{
                        qry += "AND ce_cso.id IN(SELECT id FROM ce_schedule_options WHERE schedule_route_id = cf.routable_id LIMIT 1 ) ) ";
                    }
                    qry += "LEFT JOIN ce_percentage_route_options pro ON (cf.routable_id=pro.percentage_route_id AND  cf.routable_type='PercentageBasedRoute' ";
                    if ((data.exportData !== undefined && data.exportData === true) || data.exportData === 'true') {
                        qry += " ) ";
                    }else{
                        if(!req.is_migrated){
                            qry += " AND pro.id IN(SELECT id FROM ce_percentage_route_options WHERE cf.routable_id=pro.percentage_route_id LIMIT 1 ) ) ";
                        }else{
                            qry += " AND pro.route_order = 1 ) ";
                        }
                    }
                    qry += " LEFT JOIN dni_setting ds ON (pr.provisioned_route_id=ds.provisioned_route_id AND ds.dni_active=true) ";
                if (data.filterRule && (data.filterRule.indexOf('custom_source_type') > -1 || data.filterRule.includes('cs1'))) {
                    qry += "LEFT JOIN callflow_custom_source cfcs1 ON cfcs1.provisioned_route_id = pr.provisioned_route_id AND cfcs1.custom_source_type = 'CS1' " +
                        "LEFT JOIN custom_source cs1 ON cs1.custom_source_id = cfcs1.custom_source_id  " +
                        "LEFT JOIN callflow_custom_source cfcs2 ON cfcs2.provisioned_route_id = pr.provisioned_route_id AND cfcs2.custom_source_type = 'CS2' " +
                        "LEFT JOIN custom_source cs2 ON cs2.custom_source_id = cfcs2.custom_source_id  " +
                        "LEFT JOIN callflow_custom_source cfcs3 ON cfcs3.provisioned_route_id = pr.provisioned_route_id AND cfcs3.custom_source_type = 'CS3' " +
                        "LEFT JOIN custom_source cs3 ON cs3.custom_source_id = cfcs3.custom_source_id  " +
                        "LEFT JOIN callflow_custom_source cfcs4 ON cfcs4.provisioned_route_id = pr.provisioned_route_id AND cfcs4.custom_source_type = 'CS4'  " +
                        "LEFT JOIN custom_source cs4 ON cs4.custom_source_id = cfcs4.custom_source_id  " +
                        "LEFT JOIN callflow_custom_source cfcs5 ON cfcs5.provisioned_route_id = pr.provisioned_route_id AND cfcs5.custom_source_type = 'CS5'  " +
                        "LEFT JOIN custom_source cs5 ON cs5.custom_source_id = cfcs5.custom_source_id  ";
                }
                qry += "JOIN org_unit ou ON (c.campaign_ou_id = ou.org_unit_id) " +
                    "LEFT JOIN dni_org_unit dou ON (ou.org_unit_id=dou.org_unit_id) " +
                    "LEFT JOIN webhook wb ON (wb.webhook_id = pr.webhook_id) " +
                    "WHERE (pr.provisioned_route_ou_id IN (" + req.user.orglist + "))" + (data.filterRule ? data.filterRule + ' ' : '');
                //dd
                var qryOrd = " ORDER BY " + data.order + " ASC LIMIT " + data.limit + " OFFSET " + data.offset;

                var total = 0;
                var retData = [];
                var retData2 = [];
                var routeIds = [];
                // execute the queries
                async.waterfall([
                    function(cb) {
                        // figure out if we need to get the count total or not
                        if (data.exportData !== 'true') {
                            connector.ctPool.query(qryCnt + qry, function(err, ret) {
                                if (err) { return cb('Failed to execute total count query. ' + err); }
                                ret.forEach(function(tot) {
                                    total = parseInt(total) + parseInt(tot.total);
                                });
                                cb(null);
                            });
                        } else {
                            cb(null);
                        }
                    },
                    function(cb) {
                        // execute
                            connector.ctPool.query(qryPre + qry + qryOrd, function(err, ret2) {
                                if (err) { return cb('Failed to execute callFlowSettings query. ' + err); }
                                if ((data.exportData !== undefined && data.exportData === true) || data.exportData === 'true') {
                                    report.getHuntOptionsInfo(ret2, function(err, trackingData){
                                        retData = trackingData;
                                        cb(null)
                                    })
                                }else{
                                    retData = ret2;
                                    cb(null)
                                }
                                
                            });
                              
                    },
                    function(cb){
                        if ((data.exportData !== undefined && data.exportData === true) || data.exportData === 'true') {
                            var geo_types = {
                                "claimedState" : "Claimed State",
                                "Claimed" : "Claimed Zip-code",
                                "Npa" : "Caller Area Code Proximity",
                                "Zipcode": "Zip-code Proximity"
                            }
                            async.each(retData, function(row, cb2) {
                                if(row.routable_type === "GeoRoute"){
                                    row.routable_type = row.routable_type + " - " + geo_types[row.strategy];
                                    console.log(row.routable_type);
                                }
                                if(row.routable_type === "IvrRoute2"){
                                    row.default_ringto = '';
                                    console.log(row.routable_type);
                                }
                                cb2(null);

                            }, function(err) {
                                if (err) { return cb(err); }
                                cb(null);
                            });
                        }else{
                            cb();
                        }
                    },
                    function(cb){
                        async.each(retData, function(row, cb2) {
                            if(row.org_unit_parent_id == null || row.org_unit_parent_id == undefined){
                                row.level = 0;
                            }else if (row.org_unit_parent_id == row.billing_id){
                                row.level = 1;
                            }else{
                                row.level = 2;
                            }
                            routeIds.push(row.provisioned_route_id,row.level)
                            cb2(null);
                        }, function(err) {
                            if (err) { return cb(err); }
                            cb(null);
                        })
                    },
                    function(cb) {
                        // execute query to get data set
                        if (retData.length > 0 && routeIds.length > 0) {
                            // var qry = "SELECT pr.provisioned_route_id as custom_source_route_id ,COALESCE((CASE WHEN 1=1 THEN (SELECT custom_source_name from callflow_custom_source ccs JOIN custom_source cs ON(ccs.custom_source_id=cs.custom_source_id) where ccs.provisioned_route_id = pr.provisioned_route_id and ccs.custom_source_type = 'CS1') END), ' ') as custom_source1, " +
                            //     "COALESCE((CASE WHEN 1=1 THEN (SELECT custom_source_name from callflow_custom_source ccs JOIN custom_source cs ON(ccs.custom_source_id=cs.custom_source_id) where ccs.provisioned_route_id = pr.provisioned_route_id and ccs.custom_source_type = 'CS2') END), ' ') as custom_source2, " +
                            //     "COALESCE((CASE WHEN 1=1 THEN (SELECT custom_source_name from callflow_custom_source ccs JOIN custom_source cs ON(ccs.custom_source_id=cs.custom_source_id) where ccs.provisioned_route_id = pr.provisioned_route_id and ccs.custom_source_type = 'CS3') END), ' ') as custom_source3, " +
                            //     "COALESCE((CASE WHEN 1=1 THEN (SELECT custom_source_name from callflow_custom_source ccs JOIN custom_source cs ON(ccs.custom_source_id=cs.custom_source_id) where ccs.provisioned_route_id = pr.provisioned_route_id and ccs.custom_source_type = 'CS4') END), ' ') as custom_source4, " +
                            //     "COALESCE((CASE WHEN 1=1 THEN (SELECT custom_source_name from callflow_custom_source ccs JOIN custom_source cs ON(ccs.custom_source_id=cs.custom_source_id) where ccs.provisioned_route_id = pr.provisioned_route_id and ccs.custom_source_type = 'CS5') END), ' ') as custom_source5 " +
                            //     "FROM provisioned_route pr " +
                            //     "WHERE pr.provisioned_route_id IN (" + routeIds + ")"
                            var qry =' SELECT cs1.custom_source_name AS "Custom Source 1", cs2.custom_source_name AS "Custom Source 2", cs3.custom_source_name AS "Custom Source 3", cs4.custom_source_name AS "Custom Source 4", cs5.custom_source_name AS "Custom Source 5", pg_provisioned_route.provisioned_route_id  AS "provisioned_route.provisioned_route_id" ';
                                qry +=' FROM public.provisioned_route  AS pg_provisioned_route ';
                                qry +=" LEFT JOIN callflow_custom_source cfcs1 ON cfcs1.provisioned_route_id = pg_provisioned_route.provisioned_route_id AND cfcs1.custom_source_type = 'CS1' ";
                                qry +=" LEFT JOIN custom_source cs1 ON cs1.custom_source_id = cfcs1.custom_source_id ";
                                qry +=" LEFT JOIN callflow_custom_source cfcs2 ON cfcs2.provisioned_route_id = pg_provisioned_route.provisioned_route_id AND cfcs2.custom_source_type = 'CS2' ";
                                qry +=' LEFT JOIN custom_source cs2 ON cs2.custom_source_id = cfcs2.custom_source_id ';
                                qry +=" LEFT JOIN callflow_custom_source cfcs3 ON cfcs3.provisioned_route_id = pg_provisioned_route.provisioned_route_id AND cfcs3.custom_source_type = 'CS3' ";
                                qry +=' LEFT JOIN custom_source cs3 ON cs3.custom_source_id = cfcs3.custom_source_id ';
                                qry +=" LEFT JOIN callflow_custom_source cfcs4 ON cfcs4.provisioned_route_id = pg_provisioned_route.provisioned_route_id AND cfcs4.custom_source_type = 'CS4' ";
                                qry +=' LEFT JOIN custom_source cs4 ON cs4.custom_source_id = cfcs4.custom_source_id ';
                                qry +=" LEFT JOIN callflow_custom_source cfcs5 ON cfcs5.provisioned_route_id = pg_provisioned_route.provisioned_route_id AND cfcs5.custom_source_type = 'CS5' ";
                                qry +=' LEFT JOIN custom_source cs5 ON cs5.custom_source_id = cfcs5.custom_source_id ';
                                qry +=' WHERE pg_provisioned_route.provisioned_route_id IN(' + routeIds + ')';
                            connector.ctPool.query(qry, function(err, customSourceRecords) {
                                if (err) { return cb('Failed to execute report query. ' + err); }
                                _.each(retData, function(callFlowRecord) {
                                    _.each(customSourceRecords, function(csRecord) {
                                        if (callFlowRecord['provisioned_route_id'] === csRecord['provisioned_route.provisioned_route_id']) {
                                            callFlowRecord = _.extend(callFlowRecord, csRecord);
                                        }
                                    });
                                });
                                cb(null, { dataset: retData, totalcnt: total });
                            });
                        } else {
                            cb(null, { dataset: retData, totalcnt: total });
                        }
                    }
                ], function(err, result) {
                    if (err) { return callback(err); }
                    callback(null, result);
                });
            }
        ], function(err, result) {
            if (err) { return res(err); }
            res(null, result);
        });
    },
    getHuntOptionsInfo: function(trackingData, callback){
        var huntingOptions = {
            "rollover": "Rollover",
            "simultaneous Ring" :"Simultaneous Ring",
            "simultaneous":"Simultaneous Ring",
            "Simultaneous" :"Simultaneous Ring",
            "Rollover": "Rollover",
            "Simultaneous Ring":"Simultaneous Ring"
        }
        var trackingDataHuntoptions = [];
        var campWithHuntOption = [];
        trackingDataHuntoptions = _.pluck(trackingData,'hunt_type');
        trackingDataHuntoptions = trackingDataHuntoptions.filter(function(value, index, arr){
            return value !== 0 && value !== null && value !== '';
        });

        if(trackingDataHuntoptions.length > 0){
            var query = "SELECT cht.hunt_type, cho.target_did, cho.overflow_order, cho.hunt_route_id FROM ce_hunt_options cho LEFT JOIN ce_hunt_types  cht ON (cho.hunt_route_id = cht.id) WHERE cht.id IN (" + trackingDataHuntoptions + ")  ";
            connector.ctPool.query(query, function(err, result){
                if(err){ callback(err);}

                trackingData.forEach(function(tracking){
                    var HuntOptions = _.filter(result, function(huntOption) {
                        if(huntOption.hunt_route_id == tracking.hunt_type){
                            return huntOption;
                        };
                        return;
                    }); 
                    //var HuntOptions = result.filter(huntOption => huntOption.hunt_route_id == tracking.hunt_option);
                    if(HuntOptions.length > 0){
                            if(HuntOptions[0].hunt_type.toLowerCase() === "rollover" && HuntOptions.length === 1){
                                tracking.hunt_type = "Overflow";
                            }
                            else{
                                tracking.hunt_type = huntingOptions[HuntOptions[0].hunt_type];
                            }
                        tracking.ring_to_numbers = _.pluck(HuntOptions, 'target_did');
                        
                        
                    }else{
                        tracking.hunt_type = '';
                        tracking.ring_to_numbers = '';
                            
                    }
                    campWithHuntOption.push(tracking);
                });

                callback(err, campWithHuntOption);
                // async.mapSeries(trackingData,function(campaign,cb1){
                    
                // }, function(err){
                //  callback(err, campaigns);
                // });
            });
        }else{
            callback(null, trackingData);  
        }
    },
    ivrSettings: function(req, res) {
        // no need to get data from ivr_routes2 table as we can reuse code for provisioned route id.
        if (req.params.routableid === undefined) { return res('No routable_id included in request.'); }
        callFlowModel.getByProvisionedRoute(req.params.routableid, req.is_migrated, function(err, ret) {
            console.log(ret);
            res(null, ret);
        });
    },
    percentSettings: function(req, res) {
        if (req.params.prid === undefined) { return res('No percentage route ID provided.'); }

        var qry = "SELECT * FROM ce_percentage_route_options WHERE percentage_route_id=" + req.params.prid + " ORDER BY percentage DESC";
        connector.ctPool.query(qry, function(err, ret) {
            if (err) { return res('Failed to execute percentage_route_options query. ' + err); }
            res(null, ret);
        });
    },
    callDetails: function(req, res) {
		var filterValue = [];
		var filterANDValue = [];
		var ar1=[];
		var ar2=[];
		var arrtest = [];
        var s3yml = yaml.load(fs.readFileSync("config/s3.yml")),
            AWS = require('aws-sdk');
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
                var filterVal = req.query.filter.split(",")[2];
                console.log('FILTER RULES SET', req.query.filterRule);
                var data = req.query;
                finalAdvFilter = advFilterValidate.finalFilterValue(req, data)
                console.log(finalAdvFilter,"==========")
                if(finalAdvFilter == "AND (cds.tracking_type = 'Hangup')" && filterVal == 'Hangup'){
                    finalAdvFilter = "AND (call.ring_to = 'hangup')"  
                }
                finalAdvFilter = advFilterValidate.checkAndReplaceHash(finalAdvFilter);
                
                var qryPre = "SELECT DISTINCT call.provisioned_route_id, cds.hunt_type, cds.tracking_type,cds.cdr_source, call.call_id, call.call_started AT TIME ZONE '"+data.timezone+"' AS call_started, " +
                    "c.campaign_id, c.campaign_name, ch.category, pcir.post_Call_ivr_option_name AS instant_insights_config, ch.sub_category, call.source, call.tracking, " +
                    "cd.ring_to_name as ring_to_name, call.ring_to, call.disposition, call.duration, call.repeat_call, cds.is_voicemail, call.ct_user_id, acu.first_name || ' ' || acu.last_name || ' | ' || acu.username AS username," +
                    "ou.org_unit_name, ou.org_unit_id,cd.recording_file, cext.call_data::jsonb , call.encrypted_source, CASE " +
                    "   WHEN scc.score_card_call_status IS NULL THEN 'needs_scorecard' " +
                    "   ELSE scc.score_card_call_status " +
                    "END AS score_card_call_status " +
                    ", CASE WHEN pcir.call_id IS NOT NULL THEN true ELSE false END AS instant_insights ";
                var qryCnt = "SELECT COUNT(DISTINCT (call.call_id)) AS total_count_calls ";
                var qryMain = "FROM call call " +
                    "JOIN org_unit ou ON call.org_unit_id = ou.org_unit_id " +
                    "LEFT JOIN ct_user cu ON cu.ct_user_ou_id = call.org_unit_id " +
                    "LEFT JOIN ce_call_flows cf ON call.provisioned_route_id = cf.provisioned_route_id "+
                    "LEFT JOIN post_call_ivr_responses pcir ON call.call_id = pcir.call_id "+
                    "JOIN campaign_provisioned_route cpr ON call.provisioned_route_id = cpr.provisioned_route_id " +
                    "JOIN call_detail cd ON call.call_id = cd.call_id " +
                    ((filterVal !== "(no keywords)") ? "LEFT JOIN call_keywords ck ON ck.call_id = cd.call_id " : "") +
                    "JOIN channel ch ON cd.channel_id = ch.channel_id " +
                    "JOIN campaign c ON cpr.campaign_id = c.campaign_id " +
                    "JOIN provisioned_route pr ON pr.provisioned_route_id = call.provisioned_route_id " +
                    "LEFT JOIN call_detail cds ON cds.call_id = call.call_id " +
                    "LEFT JOIN call_extend cext ON call.call_id = cext.call_id " +
                    "LEFT JOIN call_tag ctag ON call.call_id = ctag.call_id " +
                    "LEFT JOIN tag t ON t.tag_id = ctag.tag_id " +
                    "LEFT JOIN score_card_calls scc ON scc.call_id = call.call_id " +
                    "LEFT JOIN ct_user acu ON acu.ct_user_id = call.ct_user_id " +
                    "LEFT JOIN call_custom_source cfcs1 ON cfcs1.call_id = call.call_id AND cfcs1.custom_source_type = 'CS1' " +
                    "LEFT JOIN custom_source cs1 ON cs1.custom_source_id = cfcs1.custom_source_id  " +
                    "LEFT JOIN call_custom_source cfcs2 ON cfcs2.call_id = call.call_id AND cfcs2.custom_source_type = 'CS2' " +
                    "LEFT JOIN custom_source cs2 ON cs2.custom_source_id = cfcs2.custom_source_id  " +
                    "LEFT JOIN call_custom_source cfcs3 ON cfcs3.call_id = call.call_id AND cfcs3.custom_source_type = 'CS3' " +
                    "LEFT JOIN custom_source cs3 ON cs3.custom_source_id = cfcs3.custom_source_id  " +
                    "LEFT JOIN call_custom_source cfcs4 ON cfcs4.call_id = call.call_id AND cfcs4.custom_source_type = 'CS4'  " +
                    "LEFT JOIN custom_source cs4 ON cs4.custom_source_id = cfcs4.custom_source_id  " +
                    "LEFT JOIN call_custom_source cfcs5 ON cfcs5.call_id = call.call_id AND cfcs5.custom_source_type = 'CS5'  " +
                    "LEFT JOIN custom_source cs5 ON cs5.custom_source_id = cfcs5.custom_source_id  " +
                    "LEFT JOIN campaign_ct_user ccu ON (c.campaign_id=ccu.campaign_id AND ccu.ct_user_id=" + data.ct_user_id + ") " 
					//"WHERE (c.campaign_ou_id IN ("+req.user.orglist+"))" + finalAdvFilter ;
             
                var ct_user_qry = " call.ct_user_id = " + req.user.user_id;
                if (req.user.role_id === 8) {
                    // qryMain += " AND c.ct_user_id = " + req.user.user_id + (data.filterRule ? data.filterRule + ' ' : '');
                    qryMain += "WHERE " + ct_user_qry + finalAdvFilter;
                } else {
                    qryMain += "WHERE ((ou.org_unit_id IN (" + req.user.orglist + ") )" + " OR " + ct_user_qry + " ) " + finalAdvFilter;
                    // qryMain += ;
                }
                
                if (data.start_date && data.end_date) {
                    if (data.end_date.length <= 10) { data.end_date += ' 23:59:59'; } //if not time specified
                    qryMain += "AND call.call_started BETWEEN '" + data.start_date + " " + data.timezone + "' AND '" + data.end_date + " " + data.timezone + "' ";
                }

                if (data.report === 'call_back') {
                    qryMain += "AND t.tag_name = 'callback' ";
                    // qryMain += " AND call.call_id IN (SELECT ct.call_id FROM call_tag ct JOIN tag ON (ct.tag_id=tag.tag_id) WHERE tag.tag_name='callback') ";
                } else if (data.report === 'call_tag') {
                    qryMain += "AND call.call_id IN (SELECT ct.call_id FROM call_tag AS ct, tag WHERE ct.tag_id=tag.tag_id) ";
                }
                if (req.query.count === undefined || req.query.count === false) { qryMain += " ORDER BY " + data.order + " DESC LIMIT " + data.limit + " OFFSET " + data.offset; }

                var ret = [];
                var call = [];
                var callList = [];
                var ret2 = [];
                var callIds = [];
                async.waterfall([
                    function(cb) {
                        // only retrieve the count total of record set
                        if (req.query.count !== undefined && (req.query.count === true || req.query.count === 'true')) {
                            console.log('Executing count query');
                            connector.ctPool.query(qryCnt + qryMain, function(err, callData) {
                                if (err) { return cb('Failed to execute query to get total count. ' + err); }
                                ret.push(callData[0]);
                                cb(null);
                            });
                        } else {
                            cb(null);
                        }
                    },
                    function(cb) {
                        // execute query to get data set
                        if (req.query.count === undefined || req.query.count === false) {
                            console.log('Executing data set query');
                            connector.ctPool.query(qryPre + qryMain, function(err, callRec) {
                                if (err) { return cb('Failed to execute report query. ' + err); }
                                callList = callRec;
                                callIds = _.pluck(callList, 'call_id');
                                cb(null);
                            });
                        } else {
                            cb(null);
                        }
                    },
                    function(cb){
                            if(callIds.length > 0){
                            var qry = "SELECT c.call_id, pcir.post_call_ivr_option_name AS instant_insights_config, "+
                            "CASE WHEN pcir.call_id IS NOT NULL THEN true ELSE false END AS instant_insights "+
                            "from call c "+
                            "LEFT JOIN  post_call_ivr_responses pcir ON (pcir.call_id = c.call_id) "+
                            "LEFT JOIN  post_call_ivr pci ON (pci.provisioned_route_id = c.provisioned_route_id) "+
                            "LEFT JOIN  post_call_ivr_options pcio ON (pci.post_call_ivr_option_id = pcio.post_call_ivr_option_id) "+
                            "WHERE c.call_id IN("+ callIds +") ";
                            connector.ctPool.query(qry, function(err, instantInsightData) {
                                if (err) { return cb('Failed to execute instant insight  query. ' + err); }
                                _.each(callList, function(callRecord) {
                                    _.each(instantInsightData, function(instantInsightRecord) {
                                        if (callRecord['call_id'] === instantInsightRecord['call_id']) {
                                            callRecord = _.extend(callRecord, instantInsightRecord);
                                        }
                                    });
                                });
                                cb(null);
                            });
                        }else{
                            cb(null);
                        }
                    },
                    function(cb) {
                        // execute query to get data set
                        if (callList.length > 0 && callIds.length > 0 && (req.query.count === undefined || req.query.count === false)) {
                            var qry = "SELECT cl.call_id as custom_source_call_id ,COALESCE((CASE WHEN 1=1 THEN (SELECT custom_source_name from call_custom_source ccs JOIN custom_source cs ON(ccs.custom_source_id=cs.custom_source_id) where ccs.call_id = cl.call_id and ccs.custom_source_type = 'CS1') END), ' ') as custom_source1, " +
                                "COALESCE((CASE WHEN 1=1 THEN (SELECT custom_source_name from call_custom_source ccs JOIN custom_source cs ON(ccs.custom_source_id=cs.custom_source_id) where ccs.call_id = cl.call_id and ccs.custom_source_type = 'CS2') END), ' ') as custom_source2, " +
                                "COALESCE((CASE WHEN 1=1 THEN (SELECT custom_source_name from call_custom_source ccs JOIN custom_source cs ON(ccs.custom_source_id=cs.custom_source_id) where ccs.call_id = cl.call_id and ccs.custom_source_type = 'CS3') END), ' ') as custom_source3, " +
                                "COALESCE((CASE WHEN 1=1 THEN (SELECT custom_source_name from call_custom_source ccs JOIN custom_source cs ON(ccs.custom_source_id=cs.custom_source_id) where ccs.call_id = cl.call_id and ccs.custom_source_type = 'CS4') END), ' ') as custom_source4, " +
                                "COALESCE((CASE WHEN 1=1 THEN (SELECT custom_source_name from call_custom_source ccs JOIN custom_source cs ON(ccs.custom_source_id=cs.custom_source_id) where ccs.call_id = cl.call_id and ccs.custom_source_type = 'CS5') END), ' ') as custom_source5 " +
                                "FROM call cl " +
                                "WHERE cl.call_id IN (" + callIds + ")";
                            connector.ctPool.query(qry, function(err, customSourceRecords) {
                                if (err) { return cb('Failed to execute report query. ' + err); }
                                _.each(callList, function(callRecord) {
                                    _.each(customSourceRecords, function(csRecord) {
                                        if (callRecord['call_id'] === csRecord['custom_source_call_id']) {
                                            callRecord = _.extend(callRecord, csRecord);
                                        }
                                    });
                                });
                                cb(null);
                            });
                        } else {
                            cb(null);
                        }
                    },
                    function(cb) {
                        // cycle through each record and create active recording url
                        if (callList.length > 0) {
                            console.log('Creating recording link for records');
                            var hunt_types = {
                                "overflow" : "Overflow",
                                "rollover" : "Rollover",
                                "simultaneous" : "Simultaneous Ring"
                            }
                            AWS.config.update({ accessKeyId: s3yml[envVar].access_key_id, secretAccessKey: s3yml[envVar].secret_access_key });
                            async.each(callList, function(row, callback2) {
                                var file = null;
                                row.duration = moment.utc(row.duration * 1000).format("HH:mm:ss");
                                if (!row.recording_file) {
                                    row.s3URL = null;
                                    if(row.hunt_type){
                                        row.hunt_type = hunt_types[row.hunt_type];
                                    }else{
                                        row.hunt_type = ' ';
                                    }
                                    ret.push(row);
                                    callback2(null);
                                } else {
                                    file = row.recording_file;
                                    if(row.hunt_type){
                                        row.hunt_type = hunt_types[row.hunt_type];
                                    }else{
                                        row.hunt_type = ' ';
                                    }
                                    var s3 = new AWS.S3();
                                    file = file.substr(0, file.lastIndexOf('.')) || file;
                                    var s3_expire = (req.user.s3_expire) ? req.user.s3_expire : 86400*7;
                                    var params = { Bucket: s3yml[envVar].bucket, Key: "call_recordings/" + file + ".mp3", Expires: s3_expire };
                                    s3.getSignedUrl('getObject', params, function(err, url) {
                                        row.s3URL = (err ? 'error' : url);
                                        ret.push(row);
                                        callback2(err);
                                    });
                                }
                            }, function(err) {
                                if (err) { return cb(err); }
                                cb(null);
                            });
                        } else {
                            cb(null);
                        }
                    },
                    function(cb){
                        if (callList.length > 0 && req.query.count === undefined) {
                            var query = "SELECT cu.first_name || ' ' || cu.last_name || ' | ' || cu.username AS username, cu.ct_user_id FROM ct_user AS cu ";
							query += "LEFT JOIN partner_admin_user AS pau ON pau.ct_user_id = cu.ct_user_id ";
							query += "WHERE cu.role_id IN (1,2,3,8) AND cu.ct_user_ou_id IN(" + req.user.orglist + ") AND cu.user_status = 'active' AND pau.ct_user_id IS NULL ";
							query += "ORDER BY cu.first_name";
                            appModel.ctPool.query(query, function(err, data) {
                                if (err) {
                                    return cb("Users are not availabled")
                                } else {
                                    data.unshift({
                                        "username": "Unassign",
                                        "ct_user_id": "unassigned"
                                    });
                                    cb(null, [{"callList":ret, "agents":data}]);
                                }
                            });
                        }else{
                            cb(null,ret);
                        }
                    }
                ], function(err, result) {
                    if (err) { return callback(err); }
                    callback(null, result);
                });
            }
        ], function(err, result) {
            if (err) { return res(err); }
            res(err, result);
        });
    },
    campaignSettings: function(params, userData, res) {
        var err = null;
        //try to parse json string, and if it fails return error.
        try {
            params = JSON.parse(params);
        } catch (exception) {
            res('JSON invalid', null);
            return;
        }
        //console.log(params[0].filters);

        //console.log('User data: ');
        //console.log(userData[0]);
        var limit = 100;
        if (params[0].limit && params[0].limit > 0) limit = params[0].limit;
        var offset = 0;
        if (params[0].offset && params[0].offset > 0) offset = params[0].offset;

        var query = "";
        var where = "";
        //var having = "";
        query += "SELECT c.campaign_id as id, c.campaign_name as campaign_name, c.campaign_ext_id as campaign_ext_id, c.campaign_ou_id as org_unit_id, ou.org_unit_name as org_unit_name, ";
        query += "c.campaign_owner_user_id as campaign_owner_user_id, CONCAT(usr.first_name,' ', usr.last_name) AS campaign_owner, c.campaign_start_date AT TIME ZONE '" + timezone + "'::text as text_date, ";
        query += "c.campaign_start_date AT TIME ZONE '" + userData[0].timezone + "' AS start_date, ";
        query += "c.campaign_end_date AT TIME ZONE '" + userData[0].timezone + "' AS end_date, c.campaign_status as status,  ";
        query += "(SELECT COUNT(CASE WHEN pr.provisioned_route_status = 'active' THEN 1 END) FROM campaign_provisioned_route AS cpr JOIN provisioned_route AS pr ON pr.provisioned_route_id = cpr.provisioned_route_id WHERE cpr.campaign_id = c.campaign_id) AS active_routes, ";
        query += "(SELECT COUNT(CASE WHEN pr.provisioned_route_status = 'inactive' THEN 1 END) FROM campaign_provisioned_route AS cpr JOIN provisioned_route AS pr ON pr.provisioned_route_id = cpr.provisioned_route_id WHERE cpr.campaign_id = c.campaign_id) AS inactive_routes, ";
        query += "(SELECT string_agg(CONCAT(scu.first_name,' ', scu.last_name), ', ') from campaign_ct_user as sccu join ct_user as scu on scu.ct_user_id = sccu.ct_user_id where sccu.campaign_id = c.campaign_id)as assigned_users, ";
        query += "c.campaign_status, c.campaign_start_date AT TIME ZONE '" + timezone + "' AS campaign_start_date, campaign_end_date AT TIME ZONE '" + timezone + "' AS campaign_end_date ";
        query += "FROM campaign as c ";
        query += "JOIN ct_user as usr on usr.ct_user_id = c.campaign_owner_user_id ";
        query += "JOIN org_unit AS ou ON c.campaign_ou_id = ou.org_unit_id ";
        query += "LEFT JOIN campaign_provisioned_route cpr ON c.campaign_id = cpr.campaign_id ";
        query += "LEFT JOIN provisioned_route pr ON cpr.provisioned_route_id = pr.provisioned_route_id ";
        query += "LEFT JOIN campaign_ct_user AS ccu ON c.campaign_id = ccu.campaign_id ";
        query += "JOIN ct_user as ausr on ausr.ct_user_id = ccu.ct_user_id ";
        async.series([
                function(callback) {
                    if (userData[0].role_id === 1) { // if the user is an admin they see every campaign within the current ou
                        orgUnitModel.ouAndDescendents(userData[0].ou_id, function(ous) {
                            where = " WHERE (c.campaign_ou_id IN(" + ous + ") OR c.campaign_owner_user_id = " + userData[0].user_id + ") AND c.campaign_status !='deleted' ";
                            callback(null, 'one');
                        });
                    } else { // if the user is not an admin they see campaigns that they are users or owners of for the current ou
                        where = " WHERE c.campaign_owner_user_id = " + userData[0].user_id + "   AND c.campaign_status !='deleted' ";
                        callback(null, 'one');
                    }
                }
            ],
            // optional callback
            function(err, results) {
                var columns = {
                    campaign_id: "c.campaign_id",
                    campaign_name: "c.campaign_name",
                    campaign_ext_id: "c.campaign_ext_id",
                    campaign_owner_name: "CONCAT(usr.first_name,' ', usr.last_name)",
                    campaign_status: "c.campaign_status",
                    campaign_user: "CONCAT(ausr.first_name, ' ', ausr.last_name)",
                    campaign_start: "c.campaign_start_date",
                    campaign_end: "c.campaign_end_date",
                    count_active_routes: "(SELECT COUNT(CASE WHEN pr.provisioned_route_status = 'active' THEN 1 END) FROM campaign_provisioned_route AS cpr JOIN provisioned_route AS pr ON pr.provisioned_route_id = cpr.provisioned_route_id WHERE cpr.campaign_id = c.campaign_id) ",
                    count_inactive_routes: "(SELECT COUNT(CASE WHEN pr.provisioned_route_status = 'inactive' THEN 1 END) FROM campaign_provisioned_route AS cpr JOIN provisioned_route AS pr ON pr.provisioned_route_id = cpr.provisioned_route_id WHERE cpr.campaign_id = c.campaign_id) ",
                    provisioned_route_name: "pr.provisioned_route_name",
                    org_unit_name: "ou.org_unit_name",
                    org_unit_id: "c.campaign_ou_id"
                };
                //check to see if filter is being used, and if so which type (basic/advanced)
                if (params[0].ft === 'a') {
                    //loop over advanced filter criteria sets
                    for (x in params[0].filters) {

                        //a bit of validation
                        //make sure col is set
                        if (!params[0].filters[x].col) continue; //make sure column is set or continue
                        var columnName = params[0].filters[x].col; //shorten variable name
                        if (!columns[columnName]) continue; //make sure column name exists

                        if (!params[0].filters[x].userInput) continue; //make sure userInput is set or continue

                        //if inclusivity == include
                        if (params[0].filters[x].inc === 'include') {
                            var operators_values = {
                                contains: " ILIKE " + "'%" + params[0].filters[x].userInput + "%'",
                                eq: " = " + "'" + params[0].filters[x].userInput + "'",
                                gt: " > '" + params[0].filters[x].userInput + "'",
                                lt: " < '" + params[0].filters[x].userInput + "'"
                            };
                        } else { //exclude
                            var operators_values = {
                                contains: " NOT ILIKE " + "'%" + params[0].filters[x].userInput + "%'",
                                eq: " != " + "'" + params[0].filters[x].userInput + "'",
                                gt: " <= '" + params[0].filters[x].userInput + "'",
                                lt: " >= '" + params[0].filters[x].userInput + "'"
                            };
                        }
                        //validate operators
                        if (!params[0].filters[x].compOp) continue; //make sure comp operator is set or continue
                        var compOperator = params[0].filters[x].compOp; //shorten
                        if (!operators_values[compOperator]) continue; //make sure passed comp operator exists

                        where += " AND " + columns[columnName] + " " + operators_values[compOperator]; //add to query
                    }
                } else //basic
                {
                    var uValue = params[0].filters[0].search; //shorten the variable name
                    where += " AND (c.campaign_name ILIKE '%" + uValue + "%' OR CONCAT(usr.first_name,' ', usr.last_name) ILIKE '%" + uValue + "%' OR c.campaign_ext_id ILIKE '%" + uValue + "%'";
                    where += " OR CONCAT(ausr.first_name,' ', ausr.last_name) ILIKE '%" + uValue + "%' OR ou.org_unit_name ILIKE '%" + uValue + "%' ";
                    if (!isNaN(uValue)) { //it's a number
                        where += " OR c.campaign_id = " + uValue + " OR c.campaign_ou_id = " + uValue + " ";
                    }
                    where += ")";
                }
                query += where;
                var formatedResults = { "results": null, "total_count": null };
                async.parallel([
                        function(cb2) {
                            query += " GROUP BY c.campaign_id, ou.org_unit_name, usr.first_name, usr.last_name ";
                            //query += having;
                            query += " ORDER BY c.campaign_name ASC Limit " + limit + " OFFSET " + offset;
                            connector.ctPool.query(query, function(err, data) {
                                //console.log(data[0]);
                                formatedResults.results = data;
                                cb2(err, null);
                            });
                        },
                        function(cb2) {
                            //don't do total count if offset is passed
                            if (params[0].offset && params[0].offset > 0) {
                                formatedResults.total_count = 'N/A';
                                cb2(err, null);
                            } else //only do count if offset is not passed
                            {
                                var countQuery = "SELECT COUNT(DISTINCT(c.campaign_id)) as total_count FROM campaign as c ";
                                countQuery += " JOIN ct_user as usr on usr.ct_user_id = c.campaign_owner_user_id ";
                                countQuery += " JOIN org_unit AS ou ON c.campaign_ou_id = ou.org_unit_id ";
                                countQuery += " LEFT JOIN campaign_ct_user AS ccu ON c.campaign_id = ccu.campaign_id ";
                                countQuery += " JOIN ct_user as ausr on ausr.ct_user_id = ccu.ct_user_id ";
                                countQuery += " LEFT JOIN campaign_provisioned_route cpr ON c.campaign_id = cpr.campaign_id ";
                                countQuery += " LEFT JOIN provisioned_route pr ON cpr.provisioned_route_id = pr.provisioned_route_id ";
                                countQuery += where;
                                connector.ctPool.query(countQuery, function(err, count) {
                                    formatedResults.total_count = count[0].total_count;
                                    cb2(err, null);
                                });
                            }
                        }
                    ],
                    // optional callback
                    function(err, results2) {
                        //console.log(formatedResults);
                        res(err, formatedResults);
                    });
            });
    },
    getGroupActivities: function(req, res) {
        console.log('QUERY STRING', req.query);
         function findingCDRsource(callflow , cb){
            var query = "SELECT cd.cdr_source FROM call_detail cd LEFT JOIN call c ON (cd.call_id=c.call_id) WHERE c.provisioned_route_id="+callflow.provisioned_route_id
                connector.ctPool.query(query , function(err , ret){
                    if(err){cb(err)};
                    if(ret[0] !== undefined){
                        callflow.cdr_source = ret[0].cdr_source.toString();
                        cb(null , callflow);
                    }else{
                        callflow.cdr_source = '';
                        cb(null , callflow);
                    }
                })
        }
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
                var data = req.query;
                data.order = (data.order ? data.order : 'ou.org_unit_name');
                if (data.exportData === true || data.exportData === 'true') {
                    data.limit = 10000;
                    data.offset = 0;
                }
                var finalAdvFilter = advFilterValidate.finalFilterValue(req, data)
                console.log("finalAdvFilter:===",finalAdvFilter)
                if (data.filterRule != undefined || data.filterRule != null){
                    data.filterRule = advFilterValidate.checkAndReplaceHash(finalAdvFilter)
                }
                var groupBy = 'ou.org_unit_name, ou.org_unit_id ';
                var qryCnt = "SELECT COUNT(cd.call_id) AS total_calls, " +
                    "COALESCE(SUM(cd.call_value),0) AS call_value, " +
                    "COUNT(CASE WHEN call.repeat_call = false THEN 1 END) AS unique_calls, " +
                    "COUNT(CASE WHEN call.disposition = 'ANSWERED' THEN 1 END) AS answered, " +
                    "COUNT(CASE WHEN cd.is_voicemail = 't' THEN 1 END) AS voicemail, " + 
                    "COUNT(CASE WHEN conversion.score_value > 50 THEN 1 END) AS conversion, " +
                    "COUNT(CASE WHEN lead_score.score_value > 50 THEN 1 END) AS total_leads, " +
                    "COALESCE(SUM(cd.bill_second::float/60),0) AS bill_minutes";

                var qryPre = "SELECT COUNT(cd.call_id) AS total_calls, COALESCE(SUM(cd.call_value),0) AS call_value, " +
                    "COUNT(CASE WHEN call.repeat_call = false THEN 1 END) AS unique_calls, " +
                    "COUNT(CASE WHEN call.disposition = 'ANSWERED' THEN 1 END) AS answered, " +
                    "COUNT(CASE WHEN cd.is_voicemail = 't' THEN 1 END) AS voicemail, " +
                    "COUNT(CASE WHEN conversion.score_value > 50 THEN 1 END) AS conversion, " +
                    "COALESCE(SUM(cd.bill_second::float/60),0) AS billable_mintes, " +
                    "COUNT(CASE WHEN lead_score.score_value > 50 THEN 1 END) AS leads, COUNT(*) OVER () AS TotalRecords, ou.org_unit_name, ou.org_unit_id, ou.org_unit_ext_id";
                if (data.secondary === "call_flow") {
                    qryPre += ", pr.provisioned_route_name AS call_flow, pn.number AS tracking_number, pr.provisioned_route_id";
                    groupBy += ', pr.provisioned_route_name, pn.number, pr.provisioned_route_id ';
                    data.order += ", pr.provisioned_route_name";

                } else if (data.secondary === 'campaign') {
                    qryPre += ", c.campaign_name, c.campaign_ext_id, c.campaign_id";
                    groupBy += ", c.campaign_name, c.campaign_id, c.campaign_ext_id";
                    data.order += ", c.campaign_name";
                }

                var qry = " FROM campaign AS c JOIN org_unit AS ou ON (c.campaign_ou_id=ou.org_unit_id) " +
                    "LEFT JOIN campaign_provisioned_route AS cpr ON (c.campaign_id=cpr.campaign_id) " +
                    "LEFT JOIN provisioned_route AS pr ON (cpr.provisioned_route_id=pr.provisioned_route_id) " +
                    "LEFT JOIN provisioned_route_number AS prn ON (pr.provisioned_route_id=prn.provisioned_route_id) " +
                    "LEFT JOIN phone_number pn ON (prn.phone_number_id=pn.number_id) " +
                    "LEFT JOIN call ON pr.provisioned_route_id=call.provisioned_route_id ";
                if (data.start_date && data.end_date) {
                    if (data.end_date.length <= 10) data.end_date += ' 23:59:59'; //if not time specified
                    qry += "AND call.call_started BETWEEN '" + data.start_date + "' AND '" + data.end_date + "' ";
                }
                qry += "LEFT JOIN call_detail AS cd ON (call.call_id=cd.call_id) " +
                    "LEFT JOIN indicator_score AS conversion ON (cd.call_id=conversion.call_id AND conversion.indicator_id=18) " +
                    "LEFT JOIN indicator_score AS lead_score ON (cd.call_id=lead_score.call_id AND lead_score.indicator_id=51) " +
                    "LEFT JOIN campaign_ct_user AS ccu ON (c.campaign_id=ccu.campaign_id AND ccu.ct_user_id=" + data.ct_user_id + ") " +
                    "WHERE c.campaign_ou_id IN (" + req.user.orglist + ")";
                if(data.secondary === "call_flow"){
                    qry += " AND pr.provisioned_route_name IS NOT NULL ";    
                }
                if (data.havingFilterRule == '' || data.havingFilterRule == undefined){
                    qry += (data.filterRule ? data.filterRule : '');
                }
                var qryGrp = " GROUP BY " + groupBy;
                var qryHavingGrp = '';
                if (data.havingFilterRule)
                    if (data.filtertype == 'a' || data.filtertype == 'ha'){
                        qryHavingGrp = " HAVING " + data.filterRule.replace("AND",'');
                
                    }else{
                        qry += (data.filterRule ? data.filterRule : '');
                        qryHavingGrp = " HAVING " + data.havingFilterRule;
                        //qryGrp += " HAVING (CASE WHEN COUNT(CASE WHEN pr.provisioned_route_status='active' OR pr.provisioned_route_status='inactive' THEN 1 END) = 0 THEN (COUNT(call.call_id) > 0) ELSE (COUNT(call.call_id) >= 0) END )";
                    }
                if (data.count === undefined || data.count === false) {
                    var qryLimit = " ORDER BY " + data.order + " ASC";
                    qryLimit += " LIMIT " + data.limit + " OFFSET " + data.offset;
                }
                // execute the query
                console.log(data.count);
                var query = (data.count !== undefined && data.count === 'true' ? qryCnt + qry + qryGrp + qryHavingGrp : qryPre + qry + qryGrp + qryHavingGrp + qryLimit);

                connector.ctPool.query(query, function(err, retData) {
                    if (err) { return callback('Failed to execute group activity query. ' + err); }
                    if (data.count !== undefined && data.count === 'true') {
                        retData = report.getTotalValue(retData);
                    }
                    callback(null, retData);
                });
            },
            function(retData , callback){
                var data = req.query;
                if(data.secondary === "call_flow" && (data.count === undefined || data.count === false)){
                    var callflowData = []
                    async.forEach(retData , function(callflow , cb){
                        if(callflow.provisioned_route_id !== undefined){
                            findingCDRsource(callflow , function(err , data){
                                if(err){callback(err)}
                                callflowData.push(data);
                                cb(null)
                            })
                        }else{
                            callflowData.push(retData)
                            cb(null);
                        }
                    },function(err){
                        if(err){
                            callback(err)
                        }else{
                            callback(null , callflowData)
                        }
                    })
                }else{
                    callback(null , retData);
                }
            },
            function(retData , callback){
                var data = req.query;
                if(data.secondary === "call_flow" && (data.count === undefined || data.count === false)){
                    var trackingData = [];
                async.forEach(retData , function(callflow , cb){
                        if(callflow.cdr_source === 'API' && callflow.tracking_number === null){
                            var qry="SELECT tracking FROM call WHERE provisioned_route_id="+callflow.provisioned_route_id;
                            connector.ctPool.query(qry, function(err, ret){
                                if(err){cb(err)};
                                if(ret.length > 0){
                                    var qryPhonenumber = "SELECT number FROM phone_number WHERE number='"+ret[0].tracking.toString()+"'";
                                connector.ctPool.query(qryPhonenumber , function(err,ret2){
                                    if(err){cb(err)};
                                    if(ret2.length > 0){
                                        callflow.tracking_number = ret2[0].number;
                                        trackingData.push(callflow);
                                        cb(null);
                                    }else{
                                        var qryPhonepool = "SELECT phone_number , pool_id FROM phone_pool_number WHERE phone_number="+parseInt(ret[0].tracking);
                                        connector.ctPool.query(qryPhonepool , function(err , ret3){
                                            if(err){cb(err)};
                                            if(ret3.length > 0){
                                                var qryPhonepoolNumber = "SELECT org_unit_id FROM phone_pool WHERE pool_id="+ret3[0].pool_id
                                                connector.ctPool.query(qryPhonepoolNumber , function(err , ret4){
                                                    if(err){cb(err)}
                                                    if(parseInt(ret4[0].org_unit_id) === parseInt(callflow.org_unit_id)){
                                                        callflow.tracking_number = null;
                                                        trackingData.push(callflow);
                                                        cb(null);
                                                    }else{
                                                        callflow.tracking_number = ret[0].tracking.toString();
                                                        trackingData.push(callflow);
                                                        cb(null);
                                                    }
                                                })
                                            }else{
                                                callflow.tracking_number = ret[0].tracking.toString();
                                                trackingData.push(callflow);
                                                cb(null);
                                            }
                                        })
                                    }
                                })
                                }else{
                                    trackingData.push(callflow);
                                    cb(null);
                                }
                            })
                        }else{
                            trackingData.push(callflow);
                            cb(null);
                        }
                    },function(err){
                        if(err){
                            callback(err);
                        }else{
                            callback(null,trackingData);
                        }
                    })
                }else{
                    callback(null, retData); 
                }
            }
        ], function(err, result) {
            if (err) { return res(err); }
            res(err, result);
        });
    },

    getTotalValue: function(data) {
        // vat tempArray = [];
        var grpTotalCnt = {
            total_calls: 0,
            call_value: 0,
            unique_calls: 0,
            answered: 0,
            voicemail: 0,
            conversion: 0,
            total_leads: 0,
            bill_minutes: 0,
        }
        _.each(data, function(dt) {
            grpTotalCnt.total_calls = grpTotalCnt.total_calls + parseInt(dt.total_calls);
            grpTotalCnt.call_value = grpTotalCnt.call_value + parseInt(dt.call_value);
            grpTotalCnt.unique_calls = grpTotalCnt.unique_calls + parseInt(dt.unique_calls);
            grpTotalCnt.answered = grpTotalCnt.answered + parseInt(dt.answered);
            grpTotalCnt.voicemail = grpTotalCnt.voicemail + parseInt(dt.voicemail);
            grpTotalCnt.conversion = grpTotalCnt.conversion + parseInt(dt.conversion);
            grpTotalCnt.total_leads = grpTotalCnt.total_leads + parseInt(dt.total_leads);
            grpTotalCnt.bill_minutes = grpTotalCnt.bill_minutes + parseFloat(dt.bill_minutes);

        });
        return [grpTotalCnt];
    },

    loadFilterRule: function(req, res) {
        console.log('starting loadFilterRule');
        async.waterfall([
            function(callback) {
                // check if we need to lookup the filter settings
                if (req.query.filter_id !== undefined && parseInt(req.query.filter_id) > 0) {
                    console.log('working from filter_id', req.query.filter_id);
                    var qry = "SELECT * FROM filter WHERE filter_id=" + req.query.filter_id;
                    appModel.ctPool.query(qry, function(err, filterData) {
                        if (err) { return callback("Failed to execute lookup of filter settings. " + err); }

                        req.query.role = req.user.role_id;
                        req.query.timezone = req.user.timezone;
                        req.query.user_id = req.userid;
                        if (req.query.timezone === undefined) { req.query.timezone = 'America/Denver'; }

                        // TODO: need to set start and end dates
                        console.log('filter Data', filterData);
                        filterData = filterData[0];
                        // set the start and end timestamps to use
                        if (filterData.filter_range !== null) {
                            req.query.end_date = momentTimezone().tz(req.query.timezone).format('YYYY-MM-DD 23:59:59');
                            // set the start time
                            if (filterData.filter_range === 'today') {
                                req.query.start_date = momentTimezone().tz(req.query.timezone).startOf('day').format('YYYY-MM-DD 00:00:00');

                            } else if (filterData.filter_range === 'yesterday') {
                                req.query.start_date = momentTimezone().tz(req.query.timezone).subtract(1, 'days').format('YYYY-MM-DD 00:00:00');
                                req.query.end_date = momentTimezone().tz(req.query.timezone).subtract(1, 'days').format('YYYY-MM-DD 23:59:59');

                            } else if (filterData.filter_range === 'last_week') {
                                req.query.start_date = momentTimezone().tz(req.query.timezone).subtract(6, 'days').format('YYYY-MM-DD 00:00:00');
                                req.query.end_date = momentTimezone().tz(req.query.timezone).subtract(0, 'days').format('YYYY-MM-DD 23:59:59');
                            } else if (filterData.filter_range === 'last_30') {
                                req.query.start_date = momentTimezone().tz(req.query.timezone).subtract(29, 'days').format('YYYY-MM-DD 00:00:00');
                                req.query.end_date = momentTimezone().tz(req.query.timezone).subtract(0, 'days').format('YYYY-MM-DD 23:59:59');
                            } else if (filterData.filter_range === 'this_month') {
                                // var yearmonth = momentTimezone().tz(req.query.timezone).format('YYYY-MM');
                                req.query.start_date = momentTimezone().tz(req.query.timezone).startOf('month').startOf('day').format('YYYY-MM-DD 00:00:00');
                                req.query.end_date = momentTimezone().tz(req.query.timezone).endOf('month').endOf('day').format('YYYY-MM-DD 23:59:59')

                            } else if (filterData.filter_range === 'last_month') {
                                req.query.start_date = momentTimezone().tz(req.query.timezone).subtract(1, 'month').startOf('month').startOf('day').format('YYYY-MM-DD 00:00:00');
                                req.query.end_date = momentTimezone().tz(req.query.timezone).subtract(1, 'month').endOf('month').endOf('day').format('YYYY-MM-DD 23:59:59');
                            }
                        } else {
                            req.query.start_date = momentTimezone(filterData.filter_start).format('YYYY-MM-DD 00:00:00');
                            req.query.end_date = momentTimezone(filterData.filter_end).format('YYYY-MM-DD 23:59:59');
                        }
                        console.log('start', req.query.start_date, 'end', req.query.end_date);

                        // get the filter rules to apply
                        qry = "SELECT * FROM filter_rule WHERE filter_id=" + req.query.filter_id + " ORDER BY filter_type ASC, filter_id ASC";
                        appModel.ctPool.query(qry, function(err, ruleData) {
                            if (err) { return callback("Failed to retrieve filter rules. " + err); }

                            report.writeRuleSQL(req, ruleData, filterData.report_used, function(err, reqTmp) {
                                if (err) { return callback(err); }
                                req = reqTmp;
                                callback(null);
                            });
                        });
                    });
                } else {
                    callback(null);
                }
            },
            function(callback) {
                // ADVANCED FILTER from query string
                if ((req.query.filtertype === 'a' || req.query.filtertype === 'ha') && (req.query.filter_id === undefined || !req.query.filter_id)) {
                    console.log('using query string values for advanced filter');
                    var fakeSet = [];

                    req.query.filter = unescape(req.query.filter);
                    req.query.timezone = unescape(req.query.timezone);
                    var ruleList = req.query.filter.split(',');
                    console.log("ruleList");
                    console.log(ruleList);
                    async.waterfall([
                        function(cb) {
                            if (ruleList.length <= 4 && ruleList[0] === 'filter') {
                                // do simple filter
                                req.query.filtertype = 's';
                                req.query.filter = ruleList[2];

                            } else {
                                cb(null);
                            }
                        },
                        function(cb) {
                            if (ruleList.length >= 4) {
                                // do advanced filter
                                // req.query.filtertype = 'a';

                                async.whilst(
                                    function() { return ruleList.length >= 4; },
                                    function(callback2) {
                                        var row = {};
                                        row.filter_key = ruleList.shift();
                                        row.comparator = ruleList.shift();
                                        //row.filter_value = f.pg_escape_string(ruleList.shift());
                                        row.filter_value = ruleList.shift();
                                        row.filter_join = ruleList.shift();
                                        row.filter_type = req.query.filtertype === 'a' ? "advanced_filter" : "having_advanced_filter";
                                        fakeSet.push(row);
                                        callback2(null);
                                    },
                                    function(err) {
                                        if (err) { return cb('An error occurred parsing filter rules. ' + err); }
                                        console.log('FILTER RULES', fakeSet);

                                        report.writeRuleSQL(req, fakeSet, req.query.report, function(err, reqTmp) {
                                            if (err) { return cb(err); }
                                            req = reqTmp;
                                            cb(null);
                                        });
                                    }
                                );
                            } else {
                                cb(null);
                            }
                        }
                    ], function(err) {
                        if (err) { return callback(err); }
                        console.log('finish with advanced filter query string');
                        callback(null);
                    });
                } else {
                    callback(null);
                }
            },
            function(callback) {
                // SIMPLE FILTER from query string
                if (req.query.filter !== undefined && req.query.filter !== '' && req.query.filtertype === 's') {
                    console.log('using query string values for basic filter');
                    var fakeSet = [];
                    var row = {};
                    row.filter_key = 'filter ';
                    row.comparator = '=';
                    row.filter_value = req.query.filter;
                    row.filter_join = 'NONE';
                    row.filter_type = 'basic_filter';
                    fakeSet.push(row);

                    report.writeRuleSQL(req, fakeSet, req.query.report, function(err, reqTmp) {
                        if (err) { return callback(err); }
                        req = reqTmp;
                        callback(null);
                    });

                } else {
                    callback(null);
                }
            }
        ], function(err) {
            if (err) { return res(err); }

            console.log('setting missing default variables');
            req.query.timezone = (req.query.timezone !== undefined && req.query.timezone ? req.query.timezone : req.user.timezone);
            if (req.query.timezone === undefined) { req.query.timezone = 'America/Denver'; }
            req.query.org_unit_id = (req.query.org_unit_id !== undefined && req.query.org_unit_id ? req.query.org_unit_id : req.ouid);
            req.query.ct_user_id = (req.query.ct_user_id !== undefined && req.query.ct_user_id ? req.query.ct_user_id : req.userid);
            req.query.limit = (req.query.limit !== undefined && req.query.limit ? req.query.limit : 100);
            req.query.offset = (req.query.offset !== undefined && req.query.offset ? req.query.offset : 0);

            console.log('finished loadFilterRule', req.query.filterRule);
            res(null, req);
        });
    },
    // parses filter_rule records and formats into the SQL equivalent

    writeRuleSQL: function(req, ruleData, report, res) {
        console.log('starting writeRuleSQL');
        if (ruleData.length < 1) { return res(null, req); }
        var filterRule = '';
        var havingFilterRule = '';
        var filter = [];
        var last = '';
        var csKeys = ['CS1', 'CS2', 'CS3', 'CS4', 'CS5'];

        async.each(ruleData, function(row, cb) {
            console.log(row);
            if (row.filter_type === 'advanced_filter') {
				req.query.filtertype = 'a';
                if(row.filter_key=='scc.final_score')
                    {
                        row.filter_key=row.filter_key;
                        row.filter_value=row.filter_value.replace('%', '')
                    }
                // console.log('Advanced Filter Rule Spotted: Types: { filter_key:', typeof(row.filter_key) + ', comparator:', typeof(row.comparator) + ', filter_value:', typeof(row.filter_value) + ', filter_join:', typeof(row.filter_join) + ', filter_type:', typeof(row.filter_type), '}' );
                // set filter rules for SQL

                if (last !== '' && last !== row.filter_join) { filterRule = '(' + filterRule + ')'; }

                if (row.filter_key == 'cf.record_until') {
                    row.comparator = row.filter_value === "1" ? 'IS NULL' : 'IS NOT NULL';
                    filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + row.filter_key + " " + row.comparator;
                }if(row.filter_key == 'cf.postcall_ivr_enabled'){
                    row.filter_value = row.filter_value === 'true' ? 'true' : 'false';
                }if(row.filter_key == 'pcir.call_id'){
                    if(row.comparator == '='){
                        row.filter_value = row.filter_value === 'true' ? 'true' : 'false';
                    }
                    if(row.comparator == '!='){
                        row.filter_value = row.filter_value === 'true' ? 'false' : 'true';
                    }
                    filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + row.filter_key + " " + row.comparator;
                }else if (row.filter_key == 'ck.keyword') {
                    console.log("row.filter_key====", row.filter_key);
                    if (row.comparator == '=' || row.comparator == '!=') {
                        if (row.filter_value !== "(no keywords)") {
                            console.log("row.filter_value====", row.filter_value);
                            filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + row.filter_key + " " + row.comparator + "'";
                            filterRule += row.filter_value + "'";
                        } else {
                            console.log("row.filter_value====", row.filter_value);
                            filterRule += " (cd.dni_log_id = '') IS NOT FALSE ";
                        }
                    }
                } else if (row.filter_key == 'cf.routable_type') {
                    if (row.filter_value.split("-")[0] ===  "GeoRoute") {
                            filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + row.filter_key + " " + row.comparator + "'";
                            filterRule += row.filter_value.split("-")[0] + "' AND ce_gre.strategy = '" + row.filter_value.split("-")[1] + "'";
                    }else{
                        filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + row.filter_key + " " + row.comparator + "'";
                        filterRule += row.filter_value + "'";
                    }
                } else if (row.filter_key == 'call.ct_user_id' && row.filter_value === 'unassigned') {
                    if (row.comparator == '=') {
                    filterRule += " call.ct_user_id IS NULL";
                    }
                    else{
                        filterRule += " call.ct_user_id IS NOT NULL";
                    }
                } else if (row.filter_key == 'c.ct_user_id' && row.filter_value === 'unassigned') {
                    if (row.comparator == '=') {
                    filterRule += " c.ct_user_id IS NULL";
                    }
                    else
                    {
                        filterRule += " c.ct_user_id IS NOT NULL";
                    }
                }else if (row.filter_key == 'cf.vm_enabled') {

                    if (row.comparator === '=' && row.filter_value === '1') {
                        filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + "(ce_cso.vm_enabled = true OR pro.vm_enabled = true OR cf.vm_enabled = true)";
                    } 

                    if (row.comparator === '=' && row.filter_value === '0') {
                        filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + "(ce_cso.vm_enabled = false OR pro.vm_enabled = false OR cf.vm_enabled = false)";
                    } 
                }else if (row.filter_key == 'call.duration') {
                    row.filter_value = timeStampToSec.convertToSec(row.filter_value);
                    if (row.comparator !== 'ILIKE' && row.comparator !== 'NOT ILIKE') {
                        filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + " (TO_CHAR((call.duration || ' second')::interval, 'HH24:MI:SS') " + row.comparator + " '%" + row.filter_value + "%')";
                    } else {
                        filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + " (TO_CHAR((call.duration || ' second')::interval, 'HH24:MI:SS') " + row.comparator + " '" + row.filter_value + "')";
                    }
                }else if (row.filter_key == 'c.duration') {
                    if (row.comparator !== 'ILIKE' && row.comparator !== 'NOT ILIKE') {
                        filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + " (TO_CHAR((c.duration || ' second')::interval, 'HH24:MI:SS') " + row.comparator + " '%" + row.filter_value + "%')";
                    } else {
                        filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + " (TO_CHAR((c.duration || ' second')::interval, 'HH24:MI:SS') " + row.comparator + " '" + row.filter_value + "')";
                    }
                }
                 else if (row.filter_key == 't.tag_name') {
                    if (row.comparator === "!=") {
                        filterRule += ' ' + row.filter_join + " call.call_id NOT IN (select ct.call_id from call_tag AS ct JOIN tag AS t on t.tag_id = ct.tag_id WHERE t.tag_name = '" + row.filter_value + "')"
                    } else {
                        filterRule += ' ' + row.filter_join + " " + row.filter_key + " " + row.comparator + " '" + row.filter_value + "' ";
                    }
                } else if (String(row.filter_key).substring(0, 4) === 'cext') {
                    // Include
                    if (row.comparator === '=' || row.comparator === 'ILIKE') {
                        switch (row.filter_key) {
                            case "cext.call_data.name":
                                row.filter_key = "cext.call_data->'belongs_to'->0->>'name'";
                                break;
                            case "cext.call_data.address":
                                row.filter_key = "cext.call_data->'current_addresses'->0->>'street_line_1'";
                                break;
                            case "cext.call_data.city":
                                row.filter_key = "cext.call_data->'current_addresses'->0->>'city'";
                                break;
                            case "cext.call_data.state":
                                row.filter_key = "cext.call_data->'current_addresses'->0->>'state_code'";
                                break;
                            case "cext.call_data.zip":
                                row.filter_key = "cext.call_data->'current_addresses'->0->>'postal_code'";
                                break;
                            case "cext.call_data.line":
                                row.filter_key = "cext.call_data->>'line_type'";
                                break;
                        }
                    }
                    // Exclude
                    else if (row.comparator === '!=' || row.comparator === 'NOT ILIKE') {
                        switch (row.filter_key) {
                            case "cext.call_data.name":
                                row.filter_key = "cext.call_data->'belongs_to' IS NULL OR json_array_length(cext.call_data->'belongs_to') = 0 OR cext.call_data->'belongs_to'->0->>'name' IS NULL OR cext.call_data->'belongs_to'->0->>'name'";
                                break;
                            case "cext.call_data.address":
                                row.filter_key = "cext.call_data->'current_addresses' IS NULL OR json_array_length(cext.call_data->'current_addresses') = 0 OR cext.call_data->'current_addresses'->0->>'street_line_1' IS NULL OR cext.call_data->'current_addresses'->0->>'street_line_1'";
                                break;
                            case "cext.call_data.city":
                                row.filter_key = "cext.call_data->'current_addresses' IS NULL OR json_array_length(cext.call_data->'current_addresses') = 0 OR cext.call_data->'current_addresses'->0->>'city' IS NULL OR cext.call_data->'current_addresses'->0->>'city'";
                                break;
                            case "cext.call_data.state":
                                row.filter_key = "cext.call_data->'current_addresses' IS NULL OR json_array_length(cext.call_data->'current_addresses') = 0 OR cext.call_data->'current_addresses'->0->>'state_code' IS NULL OR cext.call_data->'current_addresses'->0->>'state_code'";
                                break;
                            case "cext.call_data.zip":
                                row.filter_key = "cext.call_data->'current_addresses' IS NULL OR json_array_length(cext.call_data->'current_addresses') = 0 OR cext.call_data->'current_addresses'->0->>'postal_code' IS NULL OR cext.call_data->'current_addresses'->0->>'postal_code'";
                                break;
                            case "cext.call_data.line":
                                row.filter_key = "cext.call_data->>'line_type' IS NULL OR cext.call_data->>'line_type'";
                                break;
                        }
                    }
                    filterRule += ' ' + (row.filter_join !== 'NONE' ? row.filter_join : '') + " (" + row.filter_key + " " + row.comparator + " '" + row.filter_value + "') ";
                } else if (csKeys.indexOf(row.filter_key) > -1) { // it is not date
                    if (report === 'callflow_setting') {
                        switch (row.filter_key) {
                            case 'CS1':
                                filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + "((CASE WHEN 1=1 THEN (SELECT custom_source_id from callflow_custom_source ccs where ccs.provisioned_route_id = cf.provisioned_route_id and ccs.custom_source_type = 'CS1') END) " + row.comparator + ' ' + row.filter_value + ' ';
                                if (row.comparator === '!=') {
                                    filterRule += ' OR ' + "(CASE WHEN 1=1 THEN (SELECT custom_source_id from callflow_custom_source ccs where ccs.provisioned_route_id = cf.provisioned_route_id and ccs.custom_source_type = 'CS1') END) IS NULL ) ";
                                } else { filterRule += ' ) '; }
                                break;
                            case 'CS2':
                                filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + "((CASE WHEN 1=1 THEN (SELECT custom_source_id from callflow_custom_source ccs where ccs.provisioned_route_id = cf.provisioned_route_id and ccs.custom_source_type = 'CS2') END) " + row.comparator + ' ' + row.filter_value + ' ';
                                if (row.comparator === '!=') {
                                    filterRule += ' OR ' + "(CASE WHEN 1=1 THEN (SELECT custom_source_id from callflow_custom_source ccs where ccs.provisioned_route_id = cf.provisioned_route_id and ccs.custom_source_type = 'CS2') END) IS NULL ) ";
                                } else { filterRule += ' ) '; }
                                break;
                            case 'CS3':
                                filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + "((CASE WHEN 1=1 THEN (SELECT custom_source_id from callflow_custom_source ccs where ccs.provisioned_route_id = cf.provisioned_route_id and ccs.custom_source_type = 'CS3') END) " + row.comparator + ' ' + row.filter_value + ' ';
                                if (row.comparator === '!=') {
                                    filterRule += ' OR ' + "(CASE WHEN 1=1 THEN (SELECT custom_source_id from callflow_custom_source ccs where ccs.provisioned_route_id = cf.provisioned_route_id and ccs.custom_source_type = 'CS3') END) IS NULL ) ";
                                } else { filterRule += ' ) '; }
                                break;
                            case 'CS4':
                                filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + "((CASE WHEN 1=1 THEN (SELECT custom_source_id from callflow_custom_source ccs where ccs.provisioned_route_id = cf.provisioned_route_id and ccs.custom_source_type = 'CS4') END) " + row.comparator + ' ' + row.filter_value + ' ';
                                if (row.comparator === '!=') {
                                    filterRule += ' OR ' + "(CASE WHEN 1=1 THEN (SELECT custom_source_id from callflow_custom_source ccs where ccs.provisioned_route_id = cf.provisioned_route_id and ccs.custom_source_type = 'CS4') END) IS NULL ) ";
                                } else { filterRule += ' ) '; }
                                break;
                            case 'CS5':
                                filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + "((CASE WHEN 1=1 THEN (SELECT custom_source_id from callflow_custom_source ccs where ccs.provisioned_route_id = cf.provisioned_route_id and ccs.custom_source_type = 'CS5') END) " + row.comparator + ' ' + row.filter_value + ' ';
                                if (row.comparator === '!=') {
                                    filterRule += ' OR ' + "(CASE WHEN 1=1 THEN (SELECT custom_source_id from callflow_custom_source ccs where ccs.provisioned_route_id = cf.provisioned_route_id and ccs.custom_source_type = 'CS5') END) IS NULL ) ";
                                } else { filterRule += ' ) '; }
                                break;
                        }
                    } else {
                        switch (row.filter_key) {
                            case 'CS1':
                                filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + "((CASE WHEN 1=1 THEN (SELECT custom_source_id from call_custom_source ccs where ccs.call_id = call.call_id and ccs.custom_source_type = 'CS1') END) " + row.comparator + ' ' + row.filter_value + ' ';
                                if (row.comparator === '!=') {
                                    filterRule += ' OR ' + "(CASE WHEN 1=1 THEN (SELECT custom_source_id from call_custom_source ccs where ccs.call_id = call.call_id and ccs.custom_source_type = 'CS1') END) IS NULL ) ";
                                } else { filterRule += ' ) '; }
                                break;
                            case 'CS2':
                                filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + "((CASE WHEN 1=1 THEN (SELECT custom_source_id from call_custom_source ccs where ccs.call_id = call.call_id and ccs.custom_source_type = 'CS2') END) " + row.comparator + ' ' + row.filter_value + ' ';
                                if (row.comparator === '!=') {
                                    filterRule += ' OR ' + "(CASE WHEN 1=1 THEN (SELECT custom_source_id from call_custom_source ccs where ccs.call_id = call.call_id and ccs.custom_source_type = 'CS2') END) IS NULL ) ";
                                } else { filterRule += ' ) '; }
                                break;
                            case 'CS3':
                                filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + "((CASE WHEN 1=1 THEN (SELECT custom_source_id from call_custom_source p where p.call_id = call.call_id and ccs.custom_source_type = 'CS3') END) " + row.comparator + ' ' + row.filter_value + ' ';
                                if (row.comparator === '!=') {
                                    filterRule += ' OR ' + "(CASE WHEN 1=1 THEN (SELECT custom_source_id from call_custom_source ccs where ccs.call_id = call.call_id and ccs.custom_source_type = 'CS3') END) IS NULL ) ";
                                } else { filterRule += ' ) '; }
                                break;
                            case 'CS4':
                                filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + "((CASE WHEN 1=1 THEN (SELECT custom_source_id from call_custom_source ccs where ccs.call_id = call.call_id and ccs.custom_source_type = 'CS4') END) " + row.comparator + ' ' + row.filter_value + ' ';
                                if (row.comparator === '!=') {
                                    filterRule += ' OR ' + "(CASE WHEN 1=1 THEN (SELECT custom_source_id from call_custom_source ccs where ccs.call_id = call.call_id and ccs.custom_source_type = 'CS4') END) IS NULL ) ";
                                } else { filterRule += ' ) '; }
                                break;
                            case 'CS5':
                                filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + "((CASE WHEN 1=1 THEN (SELECT custom_source_id from call_custom_source ccs where ccs.call_id = call.call_id and ccs.custom_source_type = 'CS5') END) " + row.comparator + ' ' + row.filter_value + ' ';
                                if (row.comparator === '!=') {
                                    filterRule += ' OR ' + "(CASE WHEN 1=1 THEN (SELECT custom_source_id from call_custom_source ccs where ccs.call_id = call.call_id and ccs.custom_source_type = 'CS5') END) IS NULL ) ";
                                } else { filterRule += ' ) '; }
                                break;
                        }
                    }
                // } else if (row.filter_key !== 'call.call_started' || row.filter_key !== 'cs.call_scored_date') { // it is not date
                //     if (row.comparator !== ' ILIKE' && row.comparator !== 'NOT ILIKE') {
                //         row.filter_value = f.pg_escape_bracket(row.filter_value);
                //         filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + row.filter_key + " " + row.comparator + "'" + row.filter_value + "'";
                //     } else {
                //         row.filter_value = f.pg_escape_string(row.filter_value);
                //         filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + row.filter_key + " " + row.comparator + " '.*?" + row.filter_value + "'";
                //     }
                // } else { // code for date
                //     if (row.comparator == '=' || row.comparator == '!=') {
                //         row.filter_value = f.pg_escape_bracket(row.filter_value);
                //         filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + row.filter_key + " " + (row.comparator === '!=' ? 'NOT ' : '') + "BETWEEN '" + f.fullDate(row.filter_value, false) + " " + req.query.timezone + "' AND '" + f.fullDate(row.filter_value, true) + " " + req.query.timezone + "'";
                //         console.log('filterRule', filterRule);
                //     } else {
                //         row.filter_value = f.pg_escape_string(row.filter_value);
                //         filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + row.filter_key + " " + row.comparator + " '" + f.fullDate(row.filter_value, (row.comparator === '>=') ? false : true) + " " + req.query.timezone + "'";
                //     }
                // }

            }else if (row.filter_key == 'call.call_started')
                {
                    if (row.comparator == '=' ) {
                                row.filter_value = f.pg_escape_bracket(row.filter_value);
                                filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + row.filter_key + " " + "BETWEEN '" + f.fullDate(row.filter_value, false) + " " + req.query.timezone + "' AND '" + f.fullDate(row.filter_value, true) + " " + req.query.timezone + "'";
                            }else if (row.comparator == '!=')
                            {
                                row.filter_value = f.pg_escape_bracket(row.filter_value);
                                filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + row.filter_key + " " + (row.comparator === '!=' ? 'NOT ' : '') + "BETWEEN '" + f.fullDate(row.filter_value, false) + " " + req.query.timezone + "' AND '" + f.fullDate(row.filter_value, true) + " " + req.query.timezone + "'";
                            }
                            else if(row.comparator == '<=')
                            {
                                row.filter_value = f.pg_escape_string(row.filter_value);
                                        filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + row.filter_key + " " + row.comparator + " '" + f.fullDate(row.filter_value, (row.comparator === '<=') ? true : false) + " " + req.query.timezone + "'";
                            }
                            else if(row.comparator == '>=')
                            {
                                row.filter_value = f.pg_escape_string(row.filter_value);
                                        filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + row.filter_key + " " + row.comparator + " '" + f.fullDate(row.filter_value, (row.comparator === '>=') ? false : true) + " " + req.query.timezone + "'";
                            }
                }else if (row.filter_key !== 'call.call_started' || row.filter_key !== 'cs.call_scored_date') { // it is not date
                    if (row.comparator !== 'ILIKE' && row.comparator !== 'NOT ILIKE') {
                        row.filter_value = f.pg_escape_bracket1(row.filter_value);
                        filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + row.filter_key + " " + row.comparator + "'%" + row.filter_value + "%'";
                    } else {
                        row.filter_value = f.pg_escape_string1(row.filter_value);
                        filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + row.filter_key + " " + row.comparator + " '" + row.filter_value + "'";
                    }
                } 
                filter.push(row.filter_key);
                filter.push(row.comparator);
                filter.push(row.filter_value);
                filter.push(row.filter_join ? row.filter_join : 'NONE');
                cb(null);

            } else if (row.filter_type === 'having_advanced_filter') {
                console.log('is having advanced filter rule');
                // set filter rules for SQL
                filter.push(row.filter_key); // add column to match
                filter.push(row.comparator);
                filter.push(row.filter_value);
                filter.push(row.filter_join ? row.filter_join : 'NONE');

                if (last !== '' && last !== row.filter_join) { havingFilterRule = '(' + havingFilterRule + ')'; }
                if (_.lastIndexOf(nonHavingValues, row.filter_key) > -1) {
                    if (row.comparator !== 'ILIKE' && row.comparator !== 'NOT ILIKE') {
                        filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + row.filter_key + row.comparator + "'%" + (row.filter_value) + "%'";
                    } else {
                        filterRule += (row.filter_join !== 'NONE' ? ' ' + row.filter_join : '') + ' ' + row.filter_key + " " + row.comparator + "'" + (row.filter_value) + "'";
                    }
                } else {
                    if (row.comparator !== 'ILIKE' && row.comparator !== 'NOT ILIKE') {
                        havingFilterRule += ((row.filter_join !== 'NONE' && havingFilterRule.length > 0) ? ' ' + row.filter_join : '') + ' ' + row.filter_key + " " + row.comparator + " '%" + row.filter_value +"%'";
                    } else {
                        havingFilterRule += ((row.filter_join !== 'NONE' && havingFilterRule.length > 0) ? ' ' + row.filter_join : '') + ' ' + row.filter_key + " " + row.comparator + " '" + (row.filter_value) + "'";
                    }

                }
                cb(null);

            } else if (row.filter_type === 'basic_filter') {
                console.log('is basic filter rule');
                // apply basic filter per report type
                var search = [row.filter_value]; // row.filter_value.split(' ');
                var wh = [];
                var hv = [];
                async.each(search, function(word, cb2) {
                    word = (word);
                    if (!isNaN(word)) { // is number
                        if (report === 'callflow_setting') {
                            wh.push("pr.provisioned_route_id::text ILIKE '%" + (word) + "%'");
                            wh.push("pn.number::text ILIKE '%" + (word) + "%'");
                            wh.push("cf.default_ringto::text ILIKE '%" + (word) + "%'");

                        } else if (report === 'group_activity') {
                            if (req.query.secondary === "call_flow") {
                                hv.push("pn.number=" + word);
                            }
                            hv.push("ou.org_unit_ext_id ILIKE '%" + word + "%'");
                            hv.push("ou.org_unit_id::text ILIKE '%" + word +"%'");
                            hv.push("COUNT(cd.call_id)=" + word);
                            hv.push("COUNT(CASE WHEN cd.bill_second >= 0 THEN 1 END) =" + word);
                            hv.push("COUNT(CASE WHEN lead_score.score_value > 50 THEN 1 END)=" + word);
                            hv.push("COUNT(CASE WHEN conversion.score_value > 50 THEN 1 END)=" + word);
                            hv.push("COALESCE(SUM(cd.call_value),0 )=" + word);
                            hv.push("COUNT(CASE WHEN call.repeat_call = false THEN 1 END)=" + word);
                            hv.push("COUNT(CASE WHEN call.repeat_call = false THEN 1 END)=" + word);
                            hv.push("COUNT(CASE WHEN call.disposition = 'ANSWERED' THEN 1 END)=" + word);
                            hv.push("COUNT(CASE WHEN call.disposition = 'NO ANSWER' THEN 1 END)=" + word);

                        } else if (report === 'call_detail' || report === 'call_back') {
                            word = f.pg_specialCharacter(word);
                            wh.push("call.disposition::text ILIKE '%" + (word) + "%'");
                            wh.push("cext.call_data->'belongs_to'->0->>'name' ILIKE '%" + (word) + "%'");
                            wh.push("cext.call_data->'current_addresses'->0->>'street_line_1' ILIKE '%" + (word) + "%'");
                            wh.push("cext.call_data->'current_addresses'->0->>'city' ILIKE '%" + (word) + "%'");
                            wh.push("cext.call_data->'current_addresses'->0->>'state_code' ILIKE '%" + (word) + "%'");
                            wh.push("cext.call_data->'current_addresses'->0->>'postal_code' ILIKE '%" + (word) + "%'");
                            wh.push("cext.call_data->>'line_type' ILIKE '%" + (word) + "%'");
                            wh.push("call.call_id=" + (word));
                            wh.push("c.campaign_name ILIKE '%" + (word) + "%'");
                            wh.push("call.duration=" + (word));
                            wh.push("call.source ILIKE '%" + (word) + "%'");
                            wh.push("call.tracking ILIKE '%" + (word) + "%'");
                            wh.push("call.ring_to ILIKE '%" + (word) + "%'");
                        
                        }
                    } else { // is string
                        if (report === 'callflow_setting') {
                           
                            word = f.pg_specialCharacter(word);
                            if (f.stringConversionRouteType(word) === "yes")
                                wh.push("cf.record_until IS NULL");

                            if (f.stringConversionRouteType(word) === "no")
                                wh.push("cf.record_until IS NOT NULL");

                            wh.push("pr.provisioned_route_name ILIKE '%" + word + "%'");
                            //wh.push("pn.number::text IS NULL");
                            wh.push("pn.number::text ILIKE '%" + word + "%'");
                            wh.push("ch.cat_combo ILIKE '%" + word + "%'");
                            wh.push("ou.org_unit_name ILIKE '%" + word + "%'");
                            wh.push("c.campaign_name ILIKE '%" + (word) + "%'");
                            wh.push("ds.dni_type ILIKE '%" + word + "%'");
                            wh.push("ds.destination_url ILIKE '%" + word + "%'");
                            wh.push("ds.referrer ILIKE '%" + word + "%'");
                            wh.push("ds.dni_element ILIKE '%" + word + "%'");
                            wh.push("dou.custom_params ILIKE '%" + word + "%'");
                            wh.push("cf.routable_type ILIKE '%" + f.stringConversionRouteType(word) + "%'");
                            wh.push("cs1.custom_source_name ILIKE '%" + word + "%'");
                            wh.push("cs2.custom_source_name ILIKE '%" + word + "%'");
                            wh.push("cs3.custom_source_name ILIKE '%" + word + "%'");
                            wh.push("cs4.custom_source_name ILIKE '%" + word + "%'");
                            wh.push("cs5.custom_source_name ILIKE '%" + word + "%' ");
                            wh.push("wb.webhook_name ILIKE '%" + word + "%'");
                            wh.push("pr.provisioned_route_status::text ILIKE '%" + word + "%'");
                            wh.push("cf.default_ringto ILIKE '%" + f.stringConversionRouteType(word) + "%'");
                            wh.push("cf.play_disclaimer ILIKE '%" + word + "%'");
                            wh.push("cf.message_enabled::text ILIKE '%" + f.stringConversionRouteType(word) + "%'");
                            wh.push("cf.whisper_enabled::text ILIKE '%" + f.stringConversionRouteType(word) + "%'"); 
                            wh.push("pr.hunt_type::text ILIKE '%" + f.stringConversionHuntType(word) + "%'");
                            wh.push("pcio.post_Call_ivr_option_name::text ILIKE'%" + word + "%'");

                        } else if (report === 'group_activity') {
                            word = f.pg_specialCharacter(word);
                            wh.push("ou.org_unit_name ILIKE '%" + word + "%'");
                            wh.push("ou.org_unit_ext_id ILIKE '%" + word + "%'");
                            if (req.query.secondary === "call_flow") {
                                wh.push("pr.provisioned_route_name ILIKE '%" + word + "%'");
                            } else if (req.query.secondary === "campaign") {
                                wh.push("c.campaign_name ILIKE '%" + word + "%'");
                                wh.push("c.campaign_ext_id ILIKE '%" + word + "%'");
                            }

                        } else if (report === 'call_detail' || report === 'call_back') {
                            word = f.pg_specialCharacter(word);
                          //jjk
                            wh.push("call.disposition::text ILIKE '%" + word + "%'");
                            wh.push("cext.call_data->'belongs_to'->0->>'name' ILIKE '%" + word + "%'");
                            wh.push("cext.call_data->'current_addresses'->0->>'street_line_1' ILIKE '%" + word + "%'");
                            wh.push("cext.call_data->'current_addresses'->0->>'city' ILIKE '%" + word + "%'");
                            wh.push("cext.call_data->'current_addresses'->0->>'state_code' ILIKE '%" + word + "%'");
                            wh.push("cext.call_data->'current_addresses'->0->>'postal_code' ILIKE '%" + word + "%'");
                            wh.push("cext.call_data->>'line_type' ILIKE '%" + word + "%'");
                            wh.push("ou.org_unit_name ILIKE '%" + word + "%'");
                            wh.push("c.campaign_name ILIKE '%" + word + "%'");
                            wh.push("ch.cat_combo ILIKE '%" + word + "%'");
                            wh.push("cd.ring_to_name ILIKE '%" + word + "%'");
                            wh.push("cs1.custom_source_name ILIKE '%" + word + "%'");
                            wh.push("cs2.custom_source_name ILIKE '%" + word + "%'");
                            wh.push("cs3.custom_source_name ILIKE '%" + word + "%'");
                            wh.push("cs4.custom_source_name ILIKE '%" + word + "%'");
                            wh.push("cs5.custom_source_name ILIKE '%" + word + "%'");
                            wh.push("cd.ring_to_name||call.ring_to ILIKE '%" + word + "%'");
                            wh.push("cd.hunt_type::text ILIKE '%" + f.stringConversionHuntType(word) + "%'");
                            wh.push("pcir.post_Call_ivr_option_name::text ILIKE'%" + word + "%'");
                            wh.push("(TO_CHAR((call.duration || ' second')::interval, 'HH24:MI:SS') ILIKE '%" + word.replace("|", "") + "%')");
                            if (moment(word).isValid()) { //it's a date
                                simpleFilterDate = moment(word).format("YYYY-MM-DD HH:mm:ss");
                                wh.push("call.call_started BETWEEN '" + simpleFilterDate + " " + req.query.timezone + "' AND '" + f.reportFullDate(simpleFilterDate) + " " + req.query.timezone + "' ");
                            }
                            console.log("wh===",wh)
                            
                        } else if (report === 'call_detail_scorecard') {
                            wh.push("call.disposition::text ILIKE '%" + word + "%'");
                            wh.push("cext.call_data->'belongs_to'->0->>'name' ILIKE '%" + word + "%'");
                            wh.push("cext.call_data->'current_addresses'->0->>'street_line_1' ILIKE '%" + word + "%'");
                            wh.push("cext.call_data->'current_addresses'->0->>'city' ILIKE '%" + word + "%'");
                            wh.push("cext.call_data->'current_addresses'->0->>'state_code' ILIKE '%" + word + "%'");
                            wh.push("cext.call_data->'current_addresses'->0->>'postal_code' ILIKE '%" + word + "%'");
                            wh.push("cext.call_data->>'line_type' ILIKE '%" + word + "%'");
                            wh.push("ou.org_unit_name ILIKE '%" + (word) + "%'");
                            wh.push("cd.ring_to_name ILIKE '%" + word + "%'");
                            wh.push("cs.custom_source_name ILIKE '%" + word + "%'");
                            wh.push("cd.ring_to_name||call.ring_to ILIKE '%" + word + "%'");
                            wh.push("sc.score_card_name ILIKE '%" + word + "%'");
                            wh.push("cu.first_name ILIKE '%" + word + "%'");
                            wh.push("cs.call_score_status ILIKE '%" + word + "%'");
                            wh.push("(TO_CHAR((call.duration || ' second')::interval, 'HH24:MI:SS') ILIKE '%" + word.replace("|", "") + "%')");
                            if (moment(word).isValid()) { //it's a date
                                simpleFilterDate = moment(word).format("YYYY-MM-DD HH:mm:ss");
                                wh.push("call.call_started BETWEEN '" + simpleFilterDate + " " + req.query.timezone + "' AND '" + f.reportFullDate(simpleFilterDate) + " " + req.query.timezone + "' ");
                                wh.push("cs.call_scored_date BETWEEN '" + simpleFilterDate + " " + req.query.timezone + "' AND '" + f.reportFullDate(simpleFilterDate) + " " + req.query.timezone + "' ");
                            }
                        }
                    }
                    last = row.filter_join;
                    cb2(null);

                }, function(err) {
                    if (err) { return cb(err); }
                    if (wh.length > 0)
                        filterRule += ' AND (' + wh.join(' OR ') + ')';
                    if (hv.length > 0)
                        havingFilterRule = '(' + hv.join(' OR ') + ')';
                    cb(null);
                });
            } else { // set variable value
                console.log('is variable rule');
                req.query[row.filter_key] = row.filter_value;
                cb(null);
            }

        }, function(err) {
            if (err) { return res(err); }
            req.query.filter = filter.join(',');
            if (filterRule.substring(1, 4) !== 'AND') { filterRule = ' AND ' + filterRule; }
            if (filterRule.length <= 6) { filterRule = ''; }
            // if (havingFilterRule.substring(1, 4) === 'AND') { havingFilterRule = ' AND '+havingFilterRule; }
            if (havingFilterRule.length <= 6) { havingFilterRule = ''; }
            req.query.filterRule = filterRule;
            req.query.havingFilterRule = havingFilterRule;
            console.log('finished writeRuleSQL');
            res(null, req);
        });
    },
   
    ouList: function(req, res) {
        //var qry = "SELECT DISTINCT(ou.org_unit_id), ou.org_unit_name FROM org_unit ou, campaign c LEFT JOIN campaign_ct_user ccu ON (c.campaign_id=ccu.campaign_id) " +
        //	"WHERE (c.campaign_owner_user_id="+req.userid+" OR ccu.ct_user_id="+req.userid+") AND c.campaign_ou_id=ou.org_unit_id ORDER BY ou.org_unit_name ASC";
        var qry = "SELECT org_unit_name, org_unit_id FROM org_unit WHERE org_unit_id IN (" + req.orglist.join(',') + ") ORDER BY org_unit_name ASC";
        connector.ctPool.query(qry, function(err, retData) {
            if (err) { return res('Failed to execute lookup of org units. ' + err); }
            res(null, retData);
        });
    },
    campaignList: function(req, res) {
        //var qry = "SELECT c.campaign_id, c.campaign_name FROM campaign c LEFT JOIN campaign_ct_user ccu ON (c.campaign_id=ccu.campaign_id) " +
        //	"WHERE (c.campaign_owner_user_id="+req.userid+" OR ccu.ct_user_id="+req.userid+") ORDER BY c.campaign_name ASC";
        var qry = "SELECT campaign_id, campaign_name FROM campaign WHERE campaign_id IN (" + req.camplist.join(',') + ") ORDER BY campaign_name ASC";
        connector.ctPool.query(qry, function(err, retData) {
            if (err) { return res('Failed to execute lookup of campaigns. ' + err); }
            res(null, retData);
        });
    },

    channelList: function(req, res) {
        var qry = "SELECT channel_id, cat_combo FROM channel ORDER BY cat_combo ASC";
        connector.ctPool.query(qry, function(err, retData) {
            if (err) { return res('Failed to execute lookup of channels. ' + err); }
            res(null, retData);
        });
    },
    // *************** Scheduled Report Methods ******************************************************
    getFilter: function(req, res) {
        var filter_id = req.params.filter_id;
        async.parallel([
            function(callback) {
                var qry = "SELECT * FROM filter WHERE filter_id=" + filter_id;
                appModel.ctPool.query(qry, function(err, filterData) {
                    if (err) { return callback('Failed to execute retrieval of filter data. ' + err); }
                    callback(null, filterData);
                });
            },
            function(callback) {
                var qry = "SELECT * FROM filter_rule WHERE filter_id=" + filter_id + " ORDER BY filter_rule_id ASC";
                appModel.ctPool.query(qry, function(err, ruleData) {
                    if (err) { return callback('Failed to execute retrieval of filter_rule data. ' + err); }
                    callback(null, ruleData);
                });
            }

        ], function(err, result) {
            if (err) { return res(err); }
            var retData = {
                filter: result[0],
                filter_rule: result[1]
            };
            res(null, retData);
        });
    },

    setFilter: function(req, res) {
        if (req.body.filter === undefined) { return res('Missing or improperly formatted filter data.'); }
        var data = req.body.filter;

        var qryData = {
            table: 'filter',
            values: {
                report_used: data.report_used,
                filter_status: (data.filter_status !== undefined && data.filter_status !== '' ? data.filter_status : 'active')
            }
        };
        if (data.filter_range !== undefined && data.filter_range !== null) {
            qryData.values.filter_range = data.filter_range;
            qryData.values.filter_start = null;
            qryData.values.filter_end = null;
        } else if (data.filter_start !== undefined && data.filter_start !== '' && data.filter_end !== undefined && data.filter_end !== '') {
            qryData.values.filter_start = data.filter_start;
            qryData.values.filter_end = data.filter_end;
            qryData.values.filter_range = null;
        } else {
            return res('Invalid or missing range or start/end date');
        }
        // insert or update record
        if (data.filter_id !== undefined && data.filter_id !== '') {
            qryData.where = " WHERE filter_id = " + data.filter_id;
            qryData.values.filter_modified = 'NOW()';

            console.log('updating data', qryData);
            appModel.ctPool.update(qryData, function(err) {
                if (err) { return res('Failed to update filter record. ' + err); }
                if (req.body.filter_rule !== undefined) {
                    report.setFilterRule(req, data.filter_id, function(err, retData) {
                        if (err) { return res(err); }
                        res(null, { filter: { filter_id: data.filter_id }, filter_rule: retData });
                    });
                } else {
                    res(null, { filter: { filter_id: data.filter_id } });
                }
            });
        } else {
            appModel.ctPool.insert(qryData, function(err, resData) {
                if (err) { return res('Failed to insert filter record. ' + err); }
                if (req.body.filter_rule !== undefined) {
                    report.setFilterRule(req, resData.insertId, function(err, retData) {
                        if (err) { return res(err); }
                        res(null, { filter: { filter_id: resData.insertId }, filter_rule: retData });
                    });
                } else {
                    res(null, { filter: { filter_id: resData.insertId } });
                }
            });
        }
    },
    setFilterRule: function(req, filterid, res) {
        console.log('setting filter rule');
        if (req.body.filter_rule === undefined) { return res('Missing or improperly formatted filter rule data.'); }
        var data = req.body.filter_rule;

        if ((filterid === undefined || filterid === '') && (data[0].filter_id === undefined || !data[0].filter_id)) {
            return res('No filter ID included to attach rule to');
        } else if (filterid === undefined || filterid === '') {
            filterid = data[0].filter_id;
        }
        var fields = ["filter_id", "filter_key", "comparator", "filter_value", "filter_type", "filter_join"];
        // cycle through each defined rule object

        async.waterfall([
            function(callback) {
                // delete all previous rules
                console.log('deleting filter rules');
                var qry = "DELETE FROM filter_rule WHERE filter_id=" + filterid;
                appModel.ctPool.query(qry, function(err) {
                    if (err) { return callback('Failed to delete previous filter rules. ' + err); }
                    callback(null);
                });
            },
            function(callback) {
                // cycle through each filter rule
                var cnt = 0;
                var retData = {};
                retData.filter_rule_id = [];
                async.each(data, function(row, cb) {
                    cnt++;
                    var tmpRule = {};
                    row.filter_id = filterid;
                    async.each(fields, function(fld, cb2) {
                        if (row[fld] === undefined || row[fld] === '') { return cb2('Missing required field ' + fld); }
                        tmpRule[fld] = row[fld];
                        cb2(null);

                    }, function(err) {
                        if (err) {
                            retData.filter_rule_id.push(err);
                            cb(null);
                        } else {
                            // insert the filter rule and record primary key
                            var qryData = {
                                table: 'filter_rule',
                                values: tmpRule
                            };
                            appModel.ctPool.insert(qryData, function(err, retRule) {
                                if (err) {
                                    retData.filter_rule_id.push(err);
                                } else {
                                    console.log('filter_rule return', retRule.insertId);
                                    retData.filter_rule_id.push(retRule.insertId);
                                }
                                cb(null);
                            });
                        }
                    });

                }, function(err) {
                    if (err) { return callback(err); }
                    callback(null, retData);
                });
            }
        ], function(err, result) {
            if (err) { return res(err); }
            console.log('RESULT', result);
            res(null, result);
        });
    },
    setReportRecord: function(req, res) {
        var updateSchelduleStatus = false;
        if (req.body.report === undefined) { return res('Missing or improperly formatted report data.'); }
        var data = req.body.report;
        if (data.filter_id === undefined || data.filter_id === '') { return callback('Missing required filter_id'); }
        if (data.report_name === undefined || !data.report_name) { return res('Missing required Report Name value in request.'); }
        if (data.org_unit_id === undefined || !data.org_unit_id) { return res('Missing required Org Unit ID value in request.'); }
        if (data.ct_user_id === undefined || !data.ct_user_id) { data.ct_user_id = req.userid; }

        if (data.update_scheldule_status !== undefined) {
            updateSchelduleStatus = data.update_scheldule_status;
            delete data.update_scheldule_status;
        }

        var qryData = {
            table: 'report_sched',
            values: {
                report_name: data.report_name,
                report_desc: (data.report_desc ? data.report_desc : null),
                filter_id: data.filter_id,
                report_status: (data.report_status ? data.report_status : 'active')
            }
        };

        if (data.report_id !== undefined && data.report_id !== null && data.report_id !== "") {
            qryData.where = " WHERE report_id = " + data.report_id;
            qryData.values.report_modified = 'NOW()';
            if (updateSchelduleStatus) {
                report.updateSchelduleStatus(data.report_id, data.report_status, function(err) {
                    if (err) { return res('Failed to update report record. ' + err); }
                    appModel.ctPool.update(qryData, function(err) {
                        if (err) { return res('Failed to update report record. ' + err); }
                        res(null, { report_id: data.report_id });
                    });
                })
            } else {
                appModel.ctPool.update(qryData, function(err) {
                    if (err) { return res('Failed to update report record. ' + err); }
                    res(null, { report_id: data.report_id });
                });
            }
        } else {
            qryData.values.org_unit_id = data.org_unit_id;
            qryData.values.ct_user_id = data.ct_user_id;
            appModel.ctPool.insert(qryData, function(err, ret) {
                if (err) { return res('Failed to insert new report record. ' + err); }
                res(null, { report_id: ret.insertId });
            });
        }
    },

    updateSchelduleStatus: function(report_id, report_status, cb1) {
        var ctTrans = new ctTransactionModel.begin(function(err) {
            if (err) { return cb1(err); }

            var csTrans = new csTransactionModel.begin(function(err) {
                if (err) { return cb1(err); }
                async.waterfall([
                    function(cb) {
                        //Check if any Schelduler is associated with it
                        var schQry = "SELECT * from schedule where report_id=" + report_id;
                        ctTrans.query(schQry, function(err, scheduleData) {
                            if (err) { return cb(err); }
                            cb(err, scheduleData);
                        });
                    },
                    function(scheduleData, cb) {
                        var scheduleIds = [];
                        if (scheduleData.length > 0) {
                            _.each(scheduleData, function(schData) {
                                scheduleIds.push(schData.schedule_id);
                            });
                            if (scheduleIds.length > 0) {
                                var schQry = "UPDATE schedule set schedule_status='" + report_status + "'";
                                schQry += " where schedule_id IN (" + scheduleIds.join(",") + ")";
                                ctTrans.query(schQry, function(err, data) {
                                    if (err) { return cb(err); }
                                    if (report_status === "inactive") {
                                        var csScheduleIdsString = "";
                                        _.each(scheduleIds, function(id, key) {
                                            if (key === scheduleIds.length - 1)
                                                csScheduleIdsString += "'" + id + "'"
                                            else
                                                csScheduleIdsString += "'" + id + "',"
                                        });

                                        var schQry = "DELETE FROM schedule WHERE task_type='schedule_report'";
                                        schQry += " AND task_data IN (" + csScheduleIdsString + ")";
                                        csTrans.query(schQry, function(err, data) {
                                            if (err) { return cb(err); }
                                            cb(null);
                                        });
                                    } else {
                                        var schQry = report.createCSQry(scheduleData);
                                        schQry = "INSERT into schedule (min, hour, day_of_month, month, day_of_week, next_run_date, start_date, task_type, task_data) values" + schQry;
                                        csTrans.query(schQry, function(err, data) {
                                            if (err) { return cb(err); }
                                            cb(null);
                                        });
                                    }
                                });
                            } else {
                                cb(null);
                            }
                        } else {
                            cb(null);
                        }
                    }
                ], function(err) {
                    if (err) {
                        ctTrans.rollback(function() {
                            csTrans.rollback(function() {
                                cb1(err);
                            });
                        });
                    } else {
                        ctTrans.commit(function() {
                            csTrans.commit(function() {
                                cb1(null);
                            });
                        });
                    }

                }); //async each
            }); //ce transaction begin
        });
    },

    createCSQry: function(data) {
        var qry = "";
        _.each(data, function(dt, key) {
            var tempHash = {};
            var tempStr = "";
            var dateNow = moment().format(),
                nextRun = moment().format();
            switch (dt.freq_unit) {

                case 'daily':
                    var hr = parseInt(dt.freq_value);
                    var hrNow = parseInt(moment(dateNow).format('HH'));
                    tempHash = {
                        min: '*',
                        hour: hr,
                        day_of_month: '*',
                        month: '*',
                        day_of_week: '*'
                    };
                    var diff = 0;
                    if (hr === hrNow) {
                        diff = 24;
                    } else if (hr < hrNow) {
                        diff = (hr + 24) - hrNow;
                    } else {
                        diff = hr - hrNow;
                    }
                    nextRun = moment(dt).add(diff, 'h').minute(0).second(0);
                    break;

                case 'weekly':
                    var dow = parseInt(dt.freq_value);
                    var dowNow = parseInt(moment(dateNow).format('d'));
                    tempHash = {
                        min: '*',
                        hour: '9',
                        day_of_month: '*',
                        month: '*',
                        day_of_week: dow
                    };
                    var diff = 0;
                    if (dow === dowNow) {
                        diff = 7;
                    } else if (dow < dowNow) {
                        diff = (dow + 7) - dowNow;
                    } else {
                        diff = dow - dowNow;
                    }
                    nextRun = moment(dateNow).add(diff, 'd').hour(9).minute(0).second(0);
                    break;

                case 'monthly':
                    var dom = parseInt(dt.freq_value);
                    var domNow = parseInt(moment(dateNow).format('DD'));
                    tempHash = {
                        min: '*',
                        hour: '9',
                        day_of_month: dom,
                        month: '*',
                        day_of_week: '*'
                    };
                    var diff = 1;
                    if (dom > domNow) {
                        diff = 0;
                    }
                    nextRun = moment(dateNow).add(diff, 'M').date(dom).hour(9).minute(0).second(0);
                    break;

                case 'quarterly':
                    var monNow = parseInt(moment(dateNow).format('MM')) - 1, //'MM return month starting with jan = 1'
                        mon = parseInt(moment(dateNow).format('MM')) - 1;
                    var yr = parseInt(moment(dateNow).format('YYYY'));
                    tempHash = {
                        min: '*',
                        hour: '9',
                        day_of_month: '*',
                        month: '0,3,6,9',
                        day_of_week: '*'
                    };
                    if (monNow < 3) {
                        mon = 3;
                    } else if (monNow < 6) {
                        mon = 6;
                    } else if (monNow < 9) {
                        mon = 9;
                    } else {
                        mon = 0;
                        yr++;
                    }
                    nextRun = moment().year(yr).month(mon).date(1).hour(9).minute(0).second(0);
                    break;

                default:
                    cb('Invalid Frequency unit');
                    return;
            }
            nextRun = moment(nextRun).format();
            tempHash.next_run_date = nextRun;
            tempHash.start_date = moment().format('YYYY-MM-DD HH:mm:ss');
            tempHash.task_type = 'schedule_report';
            tempHash.task_data = String(dt.schedule_id);
            _.each(_.values(tempHash), function(id, key) {
                if (key === _.values(tempHash).length - 1)
                    tempStr += "'" + id + "'"
                else
                    tempStr += "'" + id + "',"
            });
            if (key === 0)
                qry += "(" + tempStr + ")"
            else
                qry += ",(" + tempStr + ")"
        });
        return qry;
    },

    setSchedule: function(req, res) {
        if (req.body.schedule === undefined || req.body.schedule === '') { return res('Missing or improperly formatted schedule data.'); }
        var data = req.body.schedule;
        if (data.freq_unit === undefined || !data.freq_unit) { return res('Missing required Freqency Unit value in request.'); }
        if (data.freq_value === undefined) { return res('Missing required Freqency value in request.'); }
        if (data.format === undefined || !data.format) { return res('Missing required Format value in request.'); }
        if (data.list_id === undefined || !data.list_id) { return res('Missing required Distribution List ID value in request.'); }
        if (data.report_id === undefined || !data.report_id) { return res('Missing required Report ID value in request.'); }
        if (data.schedule_name === undefined || !data.schedule_name) { return res('Missing required Schedule Name value in request.'); }

        var retData = {};
        data.format = '{' + (Array.isArray(data.format) ? data.format.join(',') : data.format) + '}';

        async.waterfall([
            function(cb) {
                //Insert or update to cfa schedule table
                var qryData = {
                    table: 'schedule',
                    values: {
                        report_id: data.report_id,
                        freq_unit: data.freq_unit,
                        freq_value: data.freq_value,
                        format: data.format,
                        list_id: data.list_id,
                        schedule_name: data.schedule_name
                    }
                };
                if (data.schedule_status !== undefined && data.schedule_status !== '') { qryData.values.schedule_status = data.schedule_status; }
                if (data.message !== undefined) { qryData.values.message = data.message; }
                if (data.from_label !== undefined && data.from_label !== '') { qryData.values.from_label = data.from_label; }

                if (data.schedule_id !== undefined && data.schedule_id !== '') {
                    qryData.where = " WHERE schedule_id = " + data.schedule_id;
                    qryData.values.schedule_modified = 'NOW()';
                    appModel.ctPool.update(qryData, function(err) {
                        if (err) { return cb('Failed to update schedule record. ' + err); }
                        cb(null, data.schedule_id);

                        var newdata = { 'org_unit_id': req.ouid, 'ct_user_id': req.userid, 'schedule_id': data.schedule_id, 'log_data': req.body.schedule };
                        ctlogger.log(newdata, 'update', 'schedule');
                    });

                } else {
                    appModel.ctPool.insert(qryData, function(err, retData) {
                        if (err) { return cb('Failed to insert schedule record. ' + err); }
                        cb(null, retData.insertId);

                        var newdata = { 'org_unit_id': req.ouid, 'ct_user_id': req.userid, 'schedule_id': retData.insertId, 'log_data': req.body.schedule };
                        ctlogger.log(newdata, 'insert', 'schedule');
                    });
                }
            },
            function(schedule_id, cb) {
                //Insert or update to scripts schedule table
                if (data.schedule_status === "active") {
                    var qryData = {
                        table: 'schedule',
                        values: {}
                    };
                    var dateNow = moment().format(),
                        nextRun = moment().format();
                    switch (data.freq_unit) {

                        case 'daily':
                            var hr = parseInt(data.freq_value);
                            var hrNow = parseInt(moment(dateNow).format('HH'));
                            qryData.values = {
                                min: '*',
                                hour: hr,
                                day_of_month: '*',
                                month: '*',
                                day_of_week: '*'
                            };
                            var diff = 0;
                            if (hr === hrNow) {
                                diff = 24;
                            } else if (hr < hrNow) {
                                diff = (hr + 24) - hrNow;
                            } else {
                                diff = hr - hrNow;
                            }
                            nextRun = moment(dateNow).add(diff, 'h').minute(0).second(0);
                            break;

                        case 'weekly':
                            var dow = parseInt(data.freq_value);
                            var dowNow = parseInt(moment(dateNow).format('d'));
                            qryData.values = {
                                min: '*',
                                hour: '9',
                                day_of_month: '*',
                                month: '*',
                                day_of_week: dow
                            };
                            var diff = 0;
                            if (dow === dowNow) {
                                diff = 7;
                            } else if (dow < dowNow) {
                                diff = (dow + 7) - dowNow;
                            } else {
                                diff = dow - dowNow;
                            }
                            nextRun = moment(dateNow).add(diff, 'd').hour(9).minute(0).second(0);
                            break;

                        case 'monthly':
                            var dom = parseInt(data.freq_value);
                            var domNow = parseInt(moment(dateNow).format('DD'));
                            qryData.values = {
                                min: '*',
                                hour: '9',
                                day_of_month: dom,
                                month: '*',
                                day_of_week: '*'
                            };
                            var diff = 1;
                            if (dom > domNow) {
                                diff = 0;
                            }
                            nextRun = moment(dateNow).add(diff, 'M').date(dom).hour(9).minute(0).second(0);
                            break;

                        case 'quarterly':
                            var monNow = parseInt(moment(dateNow).format('MM')) - 1, //'MM return month starting with jan = 1'
                                mon = parseInt(moment(dateNow).format('MM')) - 1;
                            var yr = parseInt(moment(dateNow).format('YYYY'));
                            qryData.values = {
                                min: '*',
                                hour: '9',
                                day_of_month: '*',
                                month: '0,3,6,9',
                                day_of_week: '*'
                            };
                            if (monNow < 3) {
                                mon = 3;
                            } else if (monNow < 6) {
                                mon = 6;
                            } else if (monNow < 9) {
                                mon = 9;
                            } else {
                                mon = 0;
                                yr++;
                            }
                            nextRun = moment().year(yr).month(mon).date(1).hour(9).minute(0).second(0);
                            break;

                        default:
                            cb('Invalid Frequency unit');
                            return;
                    }
                    nextRun = moment(nextRun).format();
                    console.log('Setting next_run_data: ' + nextRun);
                    qryData.values.next_run_date = nextRun;
                    if (data.schedule_id !== undefined && data.schedule_id !== '') {
                        //qryData.values.schedule_modified = 'NOW()';
                        qryData.where = " WHERE task_type='schedule_report' AND task_data='" + schedule_id + "'";
                        appModel.csPool.update(qryData, function(err) {
                            if (err) { return cb('Failed to update scripts schedule record. ' + err); }
                            cb(null, schedule_id);
                        });

                    } else {
                        qryData.values.start_date = moment().format('YYYY-MM-DD HH:mm:ss');
                        qryData.values.task_type = 'schedule_report';
                        qryData.values.task_data = String(schedule_id);
                        appModel.csPool.insert(qryData, function(err) {
                            if (err) { return cb('Failed to insert scripts schedule record. ' + err); }
                            cb(null, schedule_id);
                        });
                    }
                } else {
                    cb(null, schedule_id);
                }
            }
        ], function(err, result) {
            if (err) { return res(err); }
            res(null, { schedule_id: result });
        });
    },
    setReport: function(req, res) {
        var retData = {};

        async.waterfall([
            function(callback) {
                // add filter data and rules (if included)
                if (req.body.filter !== undefined && req.body.filter) {
                    console.log('saving filter data');
                    report.setFilter(req, function(err, fData) {
                        if (err) { return callback(err); }
                        //_.extend(retData, fData);
                        retData = fData;
                        if (req.body.report !== undefined) { req.body.report.filter_id = fData.filter.filter_id; }
                        callback(null);
                    });
                } else {
                    callback(null);
                }
            },
            function(callback) {
                // set the report record
                if (req.body.report !== undefined && req.body.report) {
                    report.setReportRecord(req, function(err, rData) {
                        if (err) { return callback(err); }
                        retData.report = {};
                        retData.report.report_id = rData.report_id;
                        if (req.body.schedule !== undefined) { req.body.schedule.report_id = rData.report_id; }
                        callback(null);
                    });
                } else {
                    callback(null);
                }
            },
            function(callback) {
                // handle the schedule (if sent)
                if (req.body.schedule !== undefined && req.body.schedule) {
                    report.setSchedule(req, function(err, sData) {
                        if (err) { return callback(err); }
                        retData.schedule = {};
                        retData.schedule.schedule_id = sData.schedule_id;
                        callback(null);
                    });
                } else {
                    callback(null);
                }
            }
        ], function(err) {
            if (err) { return res(err); }
            res(null, retData);
        });
    },
    readScheduleList: function(req, res) {
        if (req.params.org_unit_id === undefined || !req.params.org_unit_id) { return res('Missing required Org Unit ID to lookup data for.'); }
        if (req.orglist.indexOf(parseInt(req.params.org_unit_id)) < 0) { return res('Unauthorized to view the specified group. '); }

        var qry = "SELECT rs.report_id,f.filter_start,f.filter_end,f.filter_range,rs.report_name, rs.report_status, cu.first_name, cu.last_name, cu.username, f.report_used, s.freq_unit, s.freq_value, array_to_string(s.format, ',') AS format, s.list_id, el.list_name, " +
            "row_number() OVER (PARTITION BY rs.report_id) AS rnum " +
            "FROM ct_user cu, filter f, report_sched rs LEFT JOIN schedule s ON (rs.report_id=s.report_id  AND s.schedule_status != 'deleted') LEFT JOIN email_list el ON (s.list_id=el.list_id) " +
            "WHERE rs.org_unit_id = " + req.params.org_unit_id + " AND ";

        if (req.user.role_id === 2) {
            qry += " rs.ct_user_id =" + req.user.user_id + " AND ";
        }

        qry += "rs.ct_user_id=cu.ct_user_id AND rs.filter_id=f.filter_id AND rs.report_status != 'deleted' ";
        qry += "ORDER BY rs.report_name ASC, rs.report_id ASC, rnum ASC";
        appModel.ctPool.query(qry, function(err, retData) {
            if (err) { return res('Failed to execute lookup of scheduled reports. ' + err); }
            res(null, retData);
        });
    },
    setHistory: function(req, res) {
        if (req.body.history === undefined) { return res('Missing or improperly formatted history data.'); }
        var data = req.body.history;
        if (data.schedule_id === undefined || !data.schedule_id) { return res('Missing required Schedule ID value in request.'); }
        if (data.report_file === undefined || !data.report_file) { return res('Missing required Report File value in request.'); }
        if (data.recipient === undefined || data.recipient.length < 1) { return res('Missing required Recipient array in request.'); }

        var qryData = {
            table: 'schedule_history',
            values: {
                schedule_id: data.schedule_id,
                report_file: data.report_file,
                recipient: "{" + data.recipient.join(',') + "}"
            }
        };
        if (data.file_path !== undefined && data.file_path !== '') { qryData.values.file_path = data.file_path; }
        if (data.date_sent !== undefined && data.date_sent !== '') { qryData.values.date_sent = data.date_sent; }

        if (data.history_id !== undefined && data.history_id !== '') {
            qryData.where = "history_id=" + data.history_id;
            appModel.ctPool.update(qryData, function(err) {
                if (err) { return res('Failed to update schedule_history record. ' + err); }
                res(null, 'success');
            });
        } else {
            appModel.ctPool.insert(qryData, function(err) {
                if (err) { return res('Failed to insert schedule_history record. ' + err); }
                res(null, 'success');
            });
        }
    },
    getReport: function(req, res) {
        if (req.params.schedule_id === undefined || !req.params.schedule_id) { return res('Missing the required Schedule ID for scheduled report.'); }
        var scheduleid = req.params.schedule_id;
        var retData = {};

        // execute and gather all information needed to run the scheduled report
        async.waterfall([
            function(cb) {
                var qry = "SELECT s.freq_unit, s.schedule_id, s.from_label, s.list_id, s.message, s.report_id, s.freq_value, array_to_string(s.format, ',') AS format,  el.list_name FROM schedule as s LEFT JOIN email_list el ON (s.list_id=el.list_id) WHERE s.schedule_id=" + scheduleid;
                appModel.ctPool.query(qry, function(err, schData) {
                    if (err) { return cb('Failed to execute schedule lookup. ' + err); }
                    retData.schedule = schData[0];
                    if (retData.schedule === undefined) {
                        cb('Failed to execute schedule lookup. ');
                    } else {
                        cb(null);
                    }

                });
            },
            function(cb) {
                var qry = "SELECT * FROM report_sched WHERE report_id=" + retData.schedule.report_id;
                appModel.ctPool.query(qry, function(err, rptData) {
                    if (err) { return cb('Failed to execute report lookup. ' + err); }
                    retData.report = rptData[0];
                    cb(null);
                });
            },
            function(cb) {
                var qry = "SELECT * FROM filter WHERE filter_id=" + retData.report.filter_id;
                appModel.ctPool.query(qry, function(err, filData) {
                    if (err) { return cb('Failed to execute filter lookup. ' + err); }
                    retData.filter = filData[0];
                    cb(null);
                });
            },
            function(cb) {
                var qry = "SELECT * FROM filter_rule WHERE filter_id=" + retData.report.filter_id + " ORDER BY filter_id ASC";
                appModel.ctPool.query(qry, function(err, ruleData) {
                    if (err) { return cb('Failed to execute filter_rule lookup. ' + err); }
                    retData.filter_rule = ruleData;
                    cb(null);
                });
            },
            function(cb) {
                // retrieve all recipients
                report.getRecipient(retData.schedule.list_id, function(err, repList) {
                    if (err) { return cb(err); }
                    retData.list = repList;
                    cb(null);
                });
            }
        ], function(err, result) {
            if (err) { return res(err); }
            res(null, retData);
        });
    },
    getReportReport: function(req, res) {
        if (req.params.report_id === undefined || !req.params.report_id) { return res('Missing the required Schedule ID for scheduled report.'); }
        var reportid = req.params.report_id;
        var retData = {};

        // execute and gather all information needed to run the scheduled report
        async.waterfall([
            function(cb) {
                var qry = "SELECT s.freq_unit, s.schedule_id, s.from_label, s.list_id, s.message, s.report_id, s.freq_value, array_to_string(s.format, ',') AS format,  el.list_name FROM schedule as s LEFT JOIN email_list el ON (s.list_id=el.list_id)  WHERE report_id=" + reportid + " AND s.schedule_status != 'deleted'"
                appModel.ctPool.query(qry, function(err, schData) {
                    if (err) { return cb('Failed to execute schedule lookup. ' + err); }
                    retData.schedule = schData;
                    cb(null);
                });
            },
            function(cb) {
                var qry = "SELECT * FROM report_sched WHERE report_id=" + reportid;
                appModel.ctPool.query(qry, function(err, rptData) {
                    if (err) { return cb('Failed to execute report lookup. ' + err); }
                    retData.report = rptData[0];

                    // get filter data
                    var qry = "SELECT * FROM filter WHERE filter_id=" + retData.report.filter_id;
                    appModel.ctPool.query(qry, function(err, filData) {
                        if (err) { return cb('Failed to execute filter lookup. ' + err); }
                        retData.filter = filData[0];

                        var qry = "SELECT * FROM filter_rule WHERE filter_id=" + retData.report.filter_id + " ORDER BY filter_id ASC";
                        appModel.ctPool.query(qry, function(err, ruleData) {
                            if (err) { return cb('Failed to execute filter_rule lookup. ' + err); }
                            retData.filter_rule = ruleData;
                            cb(null);
                        });
                    });
                });
            }
        ], function(err) {
            if (err) { return res(err); }
            res(null, retData);
        });
    },
    getRecipient: function(listId, res) {
        var qry = "SELECT cu.username, u.username AS email, er.email_address, er.dist_list_id " +
            "FROM email_recipient er LEFT JOIN campaign_ct_user ccu ON (er.campaign_id=ccu.campaign_id AND er.campaign_id IS NOT NULL) " +
            "LEFT JOIN ct_user cu ON (ccu.ct_user_id=cu.ct_user_id) LEFT JOIN ct_user u ON (er.ct_user_id=u.ct_user_id AND er.ct_user_id IS NOT NULL) " +
            "WHERE er.list_id=" + listId;
        appModel.ctPool.query(qry, function(err, retSet) {
            if (err) { return res('Failed to execute distribution list recipient lookup. ' + err); }
            var emailList = [];
            async.each(retSet, function(row, cb) {
                // add e-mail address to list
                if (row.username !== null) {
                    emailList.push(row.username);
                } else if (row.email !== null) {
                    emailList.push(row.email);
                } else if (row.email_address !== null) {
                    emailList.push(row.email_address);
                }
                // retrieve other distribution list
                if (row.dist_list_id !== null) {
                    report.getRecipient(row.dist_list_id, function(err, ret) {
                        if (err) { cb(err); }
                        emailList.concat(ret);
                        cb(null);
                    });
                } else {
                    cb(null);
                }

            }, function(err) {
                if (err) { return res(err); }
                res(null, emailList);
            });
        });
    },
    deleteSchedule: function(req, res) {
        if (req.params.schedule_id === undefined || !req.params.schedule_id) { return res('Missing required Schedule ID value in request.'); }
        var schedule_id = req.params.schedule_id;
        async.parallel([
            function(cb) {
                var qry = "UPDATE schedule SET schedule_status='deleted' WHERE schedule_id=" + schedule_id;
                appModel.ctPool.query(qry, function(err) {
                    if (err) { return cb('Failed to delete schedule. ' + err); }
                    cb(null);
                });
            },
            function(cb) {
                var csQry = "DELETE FROM schedule WHERE task_type='schedule_report' AND task_data='" + schedule_id + "'";
                appModel.csPool.query(csQry, function(err) {
                    if (err) { return cb('Failed to delete scripts schedule record. ' + err); }
                    cb(null);
                });
            },
            function(cb) {
                cb(null);
                var newdata = { 'org_unit_id': req.ouid, 'ct_user_id': req.userid, 'schedule_id': schedule_id, 'log_data': { schedule_id: schedule_id } };
                ctlogger.log(newdata, 'delete', 'schedule');
            }
        ], function(err) {
            if (err) { return res(err); }
            res(null, 'Schedule report has been deleted successfully');
        });
    },
    deleteReport: function(req, res) {
        if (req.params.report_id === undefined || !req.params.report_id) { return res('Missing required Report ID value in request.'); }
        var schedule_ids = [];
        var report_id = req.params.report_id;
        async.waterfall([
            function(cb) {
                var qry = "SELECT schedule_id FROM schedule WHERE schedule_status!='deleted' AND report_id=" + report_id;
                appModel.ctPool.query(qry, function(err, data) {
                    if (err) { return cb(err); }
                    async.each(data, function(sched, cb2) {
                        schedule_ids.push(sched.schedule_id);
                        cb2(null);

                    }, function(err) {
                        cb(err);
                    });
                });
            },
            function(cb) {
                var qry = "UPDATE report_sched SET report_status='deleted' WHERE report_id=" + report_id;
                appModel.ctPool.query(qry, function(err) {
                    if (err) return cb(err);
                    cb(null);
                });
            },
            function(cb) {
                if (schedule_ids.length > 0) {
                    async.each(schedule_ids, function(sched, cb2) {
                        req.params.schedule_id = sched;
                        report.deleteSchedule(req, function(err) {
                            if (err) { return cb2(err); }
                            cb2(null);
                        });
                    }, function(err) {
                        if (err) { return cb(err); }
                        cb(null);
                    });
                } else {
                    cb(null);
                }
            },
            function(cb) {

                if (schedule_ids.length > 0) {
                    cb(null);
                    var newdata = { 'org_unit_id': req.ouid, 'ct_user_id': req.userid, 'schedule_id': schedule_ids, 'log_data': { report_id: report_id, schedule_id: schedule_ids } };
                    ctlogger.log(newdata, 'delete', 'schedule');
                } else {
                    cb(null);
                }
            }
        ], function(err) {
            if (err) { return res(err); }
            res(null, 'Report has been deleted successfully');
        });
    },
    setCookie: function(req, res) {
        if (req.body.ct_user_id === undefined || !req.body.ct_user_id) { return res('Missing User ID in request. '); }
        if (req.body.security_key === undefined || !req.body.security_key) { return res('Missing Security Key in request. '); }
        if (req.body.security_key !== 'BsyFp<U%Z:>JG!Td]]m#Ch}1') { return res('Invalid security key used.'); }

        var oauthToken = require('../lib/token'),
            access = require('../controllers/userAccessController'),
            conf = yaml.load(fs.readFileSync('config/config.yml'));

        ctUserModel.getByLoginUserId(req.body.ct_user_id, function(err, user){
            async.parallel([
                    function(callback) {
                        access.getAction(user.user_id, function(err, userscope) {
                            if (err) { return callback('Failed to retrieve user access information. ' + err); }
                            callback(null, userscope);
                        });
                    },
                    function(callback) {
                        access.stylingAction(user.ou_id, function(err, style) {
                            if (err) { return callback('Failed to retrieve custom styling information. ' + err); }
                            callback(null, style);
                        });
                    },
                    function(callback) { // retrieve org unit authorized list
                        userpermissions.getAllUserPermission(req.body.ct_user_id, user.ou_id, user.role_id, function(err, permission) {
							if (err) { return callback('Failed to retrieve OU information. ' + err); }
							callback(null, permission[0].groups_list);
						});
                    },
                    function(callback) { // retrieve campaign authorized list
                        access.campaignList(user.user_id, user.ou_id, user.role_id, function(err, camplist) {
                            if (err) { return callback(err); }
                            callback(null, camplist);
                        });
                    }
                ],
                function(err, result) {
                    if (err) { return done(null, false); }
                    var encodedSSO = uservoiceSSO.get({ email: user.email, display_name: user.first_name + " " + user.last_name, allow_forums: [388389], guid: user.ou_id});
                    var data = {
                        userId: user.user_id,
                        clientId: conf[envVar].clientId,
                        scope: result[0],
                        data    :{
                            email		 :user.email,
                            user_id      :user.user_id,
                            ou_id        :user.ou_id,
                            ou_name      :user.ou_name,
                            tl_id        :user.tl_id,
                            first_name   :user.first_name,
                            last_name    :user.last_name,
                            timezone     :user.timezone,
                            user_ou_level:user.user_ou_level,
                            billing_id   :user.billing_id,
                            billing_ou : user.billing_ou,
                            role_id      :user.role_id,
                            s3_expire : user.s3_expire,
                            uservoiceSSO: encodedSSO,
                            protect_caller_id : user.protect_caller_id,
                            reports: user.reports,
                            badge     : user.badge,
                            score_call : user.score_call,
                            access_audio : user.access_audio,
                            is_migrated : user.is_migrated,
                            prompts : user.prompts,
                            whispers : user.whispers,
                            voicemails : user.voicemails,
                            levelOneOus : user.levelOneOus,
                            looker_user_id : user.looker_user_id,
                            style: result[1],
                            orglist: result[2],
                            camplist: result[3]
                        }
                    };
                    var token;
                    async.waterfall([
                        function(cb) {
                            oauthToken.getToken('access', function(err, tokenValue) {
                                if (err) { return cb(err); }
                                cb(null, tokenValue);
                            });
                        },
                        function(tokenValue, cb) {
                            data.token = tokenValue;
                            token = data;
                            oauthToken.setAccess(tokenValue, token, function(err, ret) {
                                if (err) {
                                    console.log('Failed on accessToken creation');
                                    return cb(err);
                                }
                                cb(null, tokenValue);
                            });
                        }

                    ], function(err, tokenValue) {
                        if (err) { return res(err); }
                        var ret = {
                            access_token: tokenValue,
                            expires_in: conf[envVar].tokenLife,
                            status: 'success'
                        };
                        console.log("Post Coockei Token :", ret);                        
                        res(null, ret);
                    });
                });
        });
    },
	getReportByOuid: function(req, callback) {
		//// FOR AMP3 DO NOT CHANGE ////
		var qry = "SELECT rs.report_id,rs.report_name,s.schedule_id"; 
		qry += " FROM report_sched AS rs";
		qry += " JOIN schedule AS s ON s.report_id = rs.report_id";
		qry += " WHERE rs.org_unit_id = "+req.params.ouid;
		var data = [];
		appModel.ctPool.query(qry, function(err, report) {
			if (err) { return callback('Failed to retrieve report data. '+err); }
			var tmpData = {};
			async.eachSeries(report, function(row, cb) {
				tmpData = {
					report_id: row.report_id,
					report_name: row.report_name,
					schedule_id: row.schedule_id
				};
				data.push(tmpData);
				cb(null);
			}, function(err) {
				return callback(err, data);
			});
		});
	},
    sendScheduleReport: function(req, res) {
        var qry = "SELECT schedule_id FROM schedule WHERE report_id=" + req.params.id;
        appModel.ctPool.query(qry, function(err, sched) {
            if (err) { return res('Failed to retrieve schedule data. ' + err); }
            async.each(sched, function(row, cb) {
                var qry = "SELECT * FROM schedule WHERE task_type = 'schedule_report' AND task_data='" + row.schedule_id + "'";
                appModel.csPool.query(qry, function(err, task) {
                    console.log('-task-', task);
                    if (err) { return res('Failed to send schedule report. ' + err); }
                    if (task.length > 0) {
                        amqp.connect(url).then(function(conn) {
                            return when(conn.createChannel().then(function(ch) {
                                var q = rabbit[envVar].report.queue;
                                var ok = ch.assertQueue(q, { durable: true });
                                var msg = {
                                    schedule_id: task[0].task_data,
                                    task_id: row.schedule_id
                                };
                                return ok.then(function() {
                                    ch.sendToQueue(q, new Buffer(JSON.stringify(msg)), { deliveryMode: true });
                                    return ch.close();
                                });
                            })).ensure(function() {
                                conn.close();
                                cb(null);
                            });
                        }).then(null, console.warn);
                    } else {
                        cb(null);
                    }
                });
            }, function(err) {
                return res(null, "successfully send to queue");
            });
        });
    },
    deleteMultipleSchedules: function(scheduleIds, callback) {
        if (scheduleIds != undefined && scheduleIds.length > 0) {
            var qry = "UPDATE schedule SET schedule_status  = 'deleted' WHERE schedule_id IN (" + scheduleIds.join(",") + ")";
            appModel.ctPool.query(qry, function(err) {
                if (err) { return callback('Failed to remove schedule. ' + err); }

                var csQry = "DELETE FROM schedule WHERE task_type = 'schedule_report' AND task_data IN('" + scheduleIds.join("','") + "')";
                appModel.csPool.query(csQry, function(err) {
                    if (err) { return callback('Failed to delete scripts schedule record. ' + err); }
                    callback(null);
                });
            });
        } else {
            return callback(null);
        }
    },
    authorizeReport: function(req, res) {
        var qry = '';
        if (req.body.report_id !== undefined && req.body.report_id) {
            qry = "SELECT org_unit_id, ct_user_id FROM report_sched WHERE report_id=" + req.body.report_id;

        } else if (req.body.schedule_id !== undefined && req.body.schedule_id) {
            qry = "SELECT r.org_unit_id, r.ct_user_id FROM report_sched r, schedule s WHERE s.report_id=r.report_id AND s.schedule_id=" + req.body.schedule_id;

        } else {
            return res('Invalid field specified in report authorization check');
        }
        appModel.ctPool.query(qry, function(err, data) {
            if (err) { return res('Failed to query DB for report authorization. ' + err); }
            if (data.length < 1) { return res('No matching report found.'); }
            if (req.user.role_id === 1 || req.user.role_id === 4) { // verify the org_unit
                console.log('doing admin', data[0].org_unit_id);
                if (req.orglist.indexOf(data[0].org_unit_id) >= 0) {
                    res(null, 'authorized');
                } else {
                    res(null, 'denied');
                }
            } else { // verify it's owned by the user
                console.log('doing standard', data[0].ct_user_id);
                if (data[0].ct_user_id === req.userid) {
                    res(null, 'authorized');
                } else {
                    res(null, 'denied');
                }
            }
        });
    },
    getCustomSources: function(row, customSourceNames) {
        var custom_source1 = grep(customSourceNames, function(element, index) {
            return element.provisioned_route_id === row.provisioned_route_id && element.custom_source_type === 'CS1';
        });
        var custom_source2 = grep(customSourceNames, function(element, index) {
            return element.provisioned_route_id === row.provisioned_route_id && element.custom_source_type === 'CS2';
        });
        var custom_source3 = grep(customSourceNames, function(element, index) {
            return element.provisioned_route_id === row.provisioned_route_id && element.custom_source_type === 'CS3';
        });
        var custom_source4 = grep(customSourceNames, function(element, index) {
            return element.provisioned_route_id === row.provisioned_route_id && element.custom_source_type === 'CS4';
        });
        var custom_source5 = grep(customSourceNames, function(element, index) {
            return element.provisioned_route_id === row.provisioned_route_id && element.custom_source_type === 'CS5';
        });
        row.custom_source1 = (custom_source1[0] !== undefined) ? custom_source1[0].custom_source_name : ' '
        row.custom_source2 = (custom_source2[0] !== undefined) ? custom_source2[0].custom_source_name : ' '
        row.custom_source3 = (custom_source3[0] !== undefined) ? custom_source3[0].custom_source_name : ' ';
        row.custom_source4 = (custom_source4[0] !== undefined) ? custom_source4[0].custom_source_name : ' ';
        row.custom_source5 = (custom_source5[0] !== undefined) ? custom_source5[0].custom_source_name : ' ';
        return row;
    },
    finalFilterValue : function(req, data){
        var orFlag = true;
				var flag = false;
				var filterValue = [];
				var finalAdvFilter = [];
                var i=0;
                var filterValue = [];
                var filterANDValue = [];
                var ar1=[];
                var ar2=[];
                var arrtest = [];
                var advFilterValue = req.query.filter.split(",");
                //console.log("Advanced Filter:====================", advFilterValue);
                console.log("Advanced Filter:====================", data);
				var afterFilterValue = _.without(advFilterValue,"ILIKE","NONE","AND")
				var advTemp = afterFilterValue;
				var afterFilterValue = _.without(advFilterValue,"NONE","AND")
                var final = [];
                ar1.push("(");
                var advTemp = afterFilterValue;
                if (data.filtertype == 'a' || advFilterValue.length>4){// get all column name for Query
					if(advTemp.length>2 || filtertype == 'a'){
						for ( var t = 0; t< advTemp.length ; t++){
							filterValue.push(advTemp[t])
							t = t+2
						}
                    }
                    _.each(_.uniq(filterValue),function(j){
							for (var t =0 ; t<advTemp.length;t++){
								if (j == advTemp[t]){
                                    if (orFlag){
										ar1.push("(");
										if (advTemp.length>0){
                                            var d = advTemp[t+2].indexOf("'");
                                            if (d>-1){
                                                advTemp[t+2] = advTemp[t+2].replace("'","''");
                                             }
                                        }
                                        var idxCext = advTemp[t].indexOf("cext")
                                        if (idxCext > -1){
                                            //if (advTemp[t]) {
                                                switch (advTemp[t]) {
                                                    case "cext.call_data.name":
                                                        advTemp[t] = "cext.call_data->'belongs_to'->0->>'name'";
                                                        break;
                                                    case "cext.call_data.address":
                                                        advTemp[t] = "cext.call_data->'current_addresses'->0->>'street_line_1'";
                                                        break;
                                                    case "cext.call_data.city":
                                                        advTemp[t] = "cext.call_data->'current_addresses'->0->>'city'";
                                                        break;
                                                    case "cext.call_data.state":
                                                        advTemp[t] = "cext.call_data->'current_addresses'->0->>'state_code'";
                                                        break;
                                                    case "cext.call_data.zip":
                                                        advTemp[t] = "cext.call_data->'current_addresses'->0->>'postal_code'";
                                                        break;
                                                    case "cext.call_data.line":
                                                        advTemp[t] = "cext.call_data->>'line_type'";
                                                        break;
                                                }
                                        }
                                        if (advTemp[t] === "call.duration"){
                                          var b = timeStampToSec.convertToSec(advTemp[t+2]);
                                             b = parseInt(moment.duration(b).asSeconds());
                                            advTemp[t+2] = b;
                                            flagDurationForInt = true;
                                        }else {
                                            flagDurationForInt = false;
                                        }
                                        
                                        if (advTemp[t+1].trim() == "ILIKE"){
                                            advTemp[t+2] = advTemp[t+2].toString().replace("(", "\\(")
                                            advTemp[t+2] = advTemp[t+2].toString().replace(")", "\\)")
                                            console.log(advTemp[t+2].indexOf('_'),"====len============",f.pg_escape_string(advTemp[t+2]))
                                            if (advTemp[t+2].indexOf('_') > -1 || advTemp[t+2].indexOf("'") > -1 || advTemp[t+2].indexOf('%') > -1){
                                                advTemp[t+2] =advTemp[t+2].replace(/\\/g, "");
                                                switch(advTemp[t+2]){
                                                    case '_': advTemp[t+2] = f.pg_escape_string(advTemp[t+2]);
                                                            break;
                                                    case "'": advTemp[t+2] = f.pg_escape_string(advTemp[t+2]);
                                                            break;
                                                    case '%': advTemp[t+2] = f.pg_escape_string(advTemp[t+2]);
                                                            break;
                                                }
                                            }
                                                
                                            //advTemp[t+2] = advTemp[t+2].indexOf('_') > -1 ? advTemp[t+2].indexOf("'") > -1 ? advTemp[t+2].replace(/\\/g, ""): f.pg_escape_string(advTemp[t+2]) : advTemp[t+2];
                                            ar1.push(advTemp[t]+" "+"ILIKE '%"+advTemp[t+2]+"%'")
										}else {
                                            advTemp[t+2] = advTemp[t+2].toString().replace("(", "\\(")
                                            advTemp[t+2] = advTemp[t+2].toString().replace(")", "\\)")
                                            if (flagDurationForInt == true){
                                                ar1.push(advTemp[t]+" "+advTemp[t+1]+" "+advTemp[t+2])
                                            }else{
                                                if ( advTemp[t] === 'call.call_started'){
                                                    if ( advTemp[t+1] == '<=' || advTemp[t+1] == '>='){
                                                        advTemp[t+2] = advTemp[t+1] === "<=" ? f.fullDate(advTemp[t+2], true) +" "+ req.query.timezone :f.fullDate(advTemp[t+2], false) +" "+ req.query.timezone ;
                                                        ar1.push( advTemp[t]+ advTemp[t+1]+" '"+ advTemp[t+2] + "'");
                                                    }else{
                                                        ar1.push(advTemp[t]+" BETWEEN ' "+ f.fullDate(advTemp[t+2], false)+" "+req.query.timezone +"' AND '"+ f.fullDate(advTemp[t+2], true) +" "+ req.query.timezone +"'");
                                                    }
                                                }else{
                                                    ar1.push(advTemp[t]+" "+advTemp[t+1]+" '"+advTemp[t+2]+"'");
                                                }
                                            }
										}
										orFlag = false
									}else {
                                        ar1.push("OR")
                                        if (advTemp[t+1] == "ILIKE"){
											advTemp[t+2] = advTemp[t+2].replace("(", "\\(")
											advTemp[t+2] = advTemp[t+2].replace(")", "\\)")
                                            ar1.push(advTemp[t]+" "+"ILIKE '%"+advTemp[t+2]+"%'")
										}else{
											advTemp[t+2] = advTemp[t+2].replace("(", "\\(")
                                            advTemp[t+2] = advTemp[t+2].replace(")", "\\)")
                                            if(flagDurationForInt === true){
                                                ar1.push(advTemp[t]+" = "+advTemp[t+2])
                                            }else{
                                                ar1.push(advTemp[t]+" = '"+advTemp[t+2]+"'")
                                            }
										}
                                    }
                                    
								}else{
								}
							}
							ar1.push(")")
							ar1.push(" AND ")
							orFlag = true
					})
                    ar1.pop();
                    ar1.push(") ")
                    ar1.unshift(" AND ")
                    finalAdvFilter = ar1.toString();
                    finalAdvFilter = finalAdvFilter.replace(/,/g, " ");
                    //finalAdvFilter = finalAdvFilter.replace(/\\/g, "\_");
                    // if (!idxOfcomma){
                    //     finalAdvFilter = finalAdvFilter.replace(/\\/g, "");
                    // }else{

                    // }
                    
					//console.log(finalAdvFilter)
					// finalAdvFilter = finalAdvFilter.replace("(", "\\(");
                    // finalAdvFilter = finalAdvFilter.replace(")", "\\)");
                    //finalAdvFilter = finalAdvFilter.replace(/#/g,",");
                    flag = true;
                }
                data.order = (data.order !== undefined && data.order !== '' ? data.order : 'call_started');
                if (data.exportData === true) {
                    data.limit = 10000;
                    data.offset = 0;
                }
                
                if (data.filterRule !== undefined && data.filterRule.split(" ")[3] === 'NONE') {
                    data.filterRule = data.filterRule.replace("NONE", "");
                }
                if(flag === true){
                    console.log("=====80-----")
                    finalAdvFilter = finalAdvFilter;
                }else{
                    //connsole.log(typeof(data.filterRule),"============data.filterRule===========")
                    data.filterRule =  data.filterRule != undefined ? data.filterRule.replace(/\\/g, '\\'): data.filterRule;
                    finalAdvFilter = (data.filterRule ? data.filterRule+' ' : '')
                    flag = false;
                }
    return finalAdvFilter ;

    }
};

module.exports = report;

function checkAndReplaceHash (str){
    if (typeof(str) == "string"){
        var idx =  str.indexOf("`");
        if (idx > -1 ){
            str = str.replace(/`/g,",")
        }
    }

    return str;

}

// function finalFilterValue(req, data){
                
// }
