var controller = require('./appController'),
    yaml = require("js-yaml"),
    fs = require("fs"),
    s3yml = yaml.load(fs.readFileSync("config/s3.yml")),
    AWS = require('aws-sdk'),
    envVar = process.env.NODE_ENV,
    callModel = require('../models/callModel'),
    _ = require('underscore');

var callDetail = {
    getAction: function(req, res) {
        callModel.getCallDetail(req, function(err, data) {
            AWS.config.update({ accessKeyId: s3yml[envVar].access_key_id, secretAccessKey: s3yml[envVar].secret_access_key });
            var indicatorScoreModel = require('../models/indicatorScoreModel');
            var call_ids = [];
            var dni_log_ids = {};
            var j = {};
            var isSession = false;
            var isExtended = false;
            async.eachSeries(data.calls, function(call, cb) {
                    if (call_ids.indexOf(call.call_id) < 0) {
                        call_ids.push(call.call_id);
                    }
                    if (req.query.criteria && req.query.criteria.dni) {
                        var getDni = req.query.criteria.dni.toString();
                        if ((getDni == 'true' || getDni == '1') && call.dni_log_id && call.dni_log_id !== '') {
                            dni_log_ids[call.call_id] = call.dni_log_id;
                            isSession = true;
                        }
                    }
                    if (req.query.criteria && req.query.criteria.extended) {
                        var getExtended = req.query.criteria.extended.toString();
                        if (getExtended == 'true' || getExtended == '1') {
                            isExtended = true;
                        }
                    }


                    async.parallel({
                            file_url: function(cb1) {
                                var file = null;
                                if (!call.recording_file) {
                                    file = 'recordingOff.mp3';
                                } else {
                                    file = call.recording_file;
                                }
                                var s3 = new AWS.S3();
                                file = file.substr(0, file.lastIndexOf('.')) || file;
                                var s3_expire = (req.user.s3_expire) ? req.user.s3_expire : 86400*7
                                var params = { Bucket: s3yml[envVar].bucket, Key: "call_recordings/" + file + ".mp3", Expires: s3_expire };
                                s3.getSignedUrl('getObject', params, function(err, url) {
                                    if (err) console.log(err);
                                    cb1(err, url);
                                });
                            }
                        },
                        function(err, results) {
                            var isOutbound = 0;
                            var tagged = false;
                            if (call.is_outbound) {
                                isOutbound = 1;
                            }
                            if (req.query.criteria.tags) {
                                tagged = true;
                            }

                            j[call.call_id] = {
                                call_mine_status: call.call_mine_status,
                                cdr_source: call.cdr_source,
                                tracking_number: call.tracking,
                                disposition: call.disposition,
                                duration: call.duration,
                                external_id: call.external_id,
                                id: call.call_id,
                                is_outbound: isOutbound,
                                ouid: call.org_unit_id,
                                repeat_call: call.repeat_call,
                                caller_id: call.source,
                                calldate: call.call_started,
                                ringto_number: call.ring_to,
                                title: null,
                                user_id: null,
                                scored: false,
                                call_value: call.call_value,
                                indicator: {
                                    active_indicators: [],
                                    custom_indicators: []
                                },
                                tagged: tagged,
                                mine_error: null,
                                call_recorded: call.recording_file,
                                file_url: results.file_url
                            };
                            if (isSession) j[call.call_id].session_data = { data: {} };
                            if (isExtended) j[call.call_id].extended_data = {};
                            cb(err);
                        }); //async parallel cb1
                },
                function(err) {
                    async.parallel({
                            scores: function(cb2) {
                                indicatorScoreModel.getByCallIds(call_ids, function(e, scores) {
                                    cb2(err, scores);
                                });
                            },
                            sessions: function(cb2) {
                                if (!_.isEmpty(dni_log_ids)) {
                                    var dniLogModel = require('../models/dniLogModel');
                                    var session = {};
                                    dniLogModel.getByIds(_.values(dni_log_ids), function(err, docs) {
                                        for (var i = docs.length - 1; i >= 0; i--) {
                                            session[docs[i]._id] = docs[i].data;
                                        }
                                        cb2(err, session);
                                    });
                                } else {
                                    cb2(null, null);
                                }

                            },
                            tags: function(cb2) {
                                var tags = [];
                                if (!req.query.criteria.tags) {
                                    var callTagModel = require('../models/callTagModel');
                                    callTagModel.getByCallIds(call_ids, function(err, tags) {
                                        cb2(err, tags);
                                    });
                                } else {
                                    cb2(null, tags);
                                }
                            },
                            extended: function(cb2) {
                                var extended = {};
                                if (isExtended) {
                                    var callExtendModel = require('../models/callExtendModel');
                                    callExtendModel.getByCallIds(call_ids, function(err, extended) {
                                        cb2(err, extended);
                                    });
                                } else {
                                    cb2(null, extended);
                                }
                            }
                        },
                        function(err, results) {
                            var calls = [];
                            async.each(call_ids, function(call_id, cb3) {
                                    if (results.scores[call_id]) j[call_id].indicator.active_indicators.push(results.scores[call_id]);
                                    if (dni_log_ids[call_id] && results.sessions[dni_log_ids[call_id]]) j[call_id].session_data.data = results.sessions[dni_log_ids[call_id]];
                                    if (results.tags[call_id] && results.tags[call_id].length > 0) j[call_id].tagged = true;
                                    if (results.extended[call_id]) j[call_id].extended_data = results.extended[call_id];
                                    calls.push(j[call_id]);
                                    cb3(null);
                                },
                                function(err) {
                                    var d = {
                                        status: null,
                                        transaction_id: null
                                    };
                                    if (err) {
                                        d.status = 'error';
                                        d.error_message = err;
                                    } else {
                                        d.status = 'success';
                                        d.matches = calls.length;
                                        d.result = calls;
                                    }
                                    res(d);
                                });
                        }
                    );
                }); //async each cb
        });
    },


    saveAgentdata: function(req, res) {
        callModel.saveAgentdata(req.body, function(err, results) {
            controller.responsify(err, results, function(response) {
                console.log("I am in controller");
                res(response);
            });

        });
    }
};

module.exports = callDetail;
