var connector = require('./appModel'),
    f = require('../functions/functions.js'),
    fs = require("fs"),
    yaml = require("js-yaml"),
    e = yaml.load(fs.readFileSync("config/database.yml")),
    async = require('async'),
    ctTransactionModel = require('../models/ctTransactionModel'),
    orgUnitModel = require('../models/orgUnitModel'),
    defaultfeatureModel = require('../models/defaultfeatureModel'),
    _ = require('underscore');
//Used Table Name
var defProvisionerouteTable = 'default_provisioned_route',
    defCustomSourceTable = 'default_custom_source',
    customSource = 'custom_source',
    defDNISettingTable = 'default_dni_setting',
    OrgUnitDetailTable = 'default_org_setting';
    callFlowRecording = 'ce_call_flow_recording'; 
    defPostCallIvrVoicePrompts = 'default_post_call_ivr_voice_prompts';
    defPostCallIvrSetting = 'default_post_call_ivr_settings';
    //defAdvTrackingSetting = 'default_advanced_org_unit_settings';

var defaultCallFlow = {
    create: function (data, saveCustomParams, customParams, res) {
        // var data = req.body;
        // data.callFlowData.userid = req.userid
        async.waterfall([
            function (callback) {
                async.parallel([
                    function (cb1) {
                        var selectQry = "SELECT org_unit_id FROM " + defProvisionerouteTable + " WHERE org_unit_id = " + data.callFlowData.org_unit_id;
                        connector.ctPool.query(selectQry, function (err, ret) {
                            // console.log(ret);
                            if (err) {
                                callback(err);
                            } else {
                                // console.log(data);
                                data.callFlowData.ringto = data.callFlowData.ringto === undefined ? null : data.callFlowData.ringto;
                                if (ret.length > 0 && ret[0].org_unit_id) {
                                    var updateQry = "UPDATE " + defProvisionerouteTable;
                                    updateQry += " SET record_call = " + data.callFlowData.recordcall + ",play_voice_prompt_first = " + data.callFlowData.play_voice_prompt + ",play_whisper_message = " + data.callFlowData.play_whisper_message;
                                    updateQry += ", play_voice_prompt_first_text = '" + data.callFlowData.prompt_message + "', play_whisper_message_text = '" + data.callFlowData.whisper_message + "'"
                                    updateQry += ", ring_to_number = " + data.callFlowData.ringto + ", play_disclaimer = '" + data.callFlowData.play_disclaimer + "', repeat_interval_call = '" + data.callFlowData.repeat_interval_call + "'";
                                    updateQry += ", voice_prompt_url = '" + data.callFlowData.voice_prompt_url + "', whisper_message_url = '" + data.callFlowData.whisper_message_url + "', voice_prompt_id = " + data.callFlowData.voice_prompt_id + ",whisper_id = " + data.callFlowData.whisper_id + ",whisper_message_name = '" + data.callFlowData.whisper_message_name + "', prompt_message_name = '" + data.callFlowData.prompt_message_name + "',call_value = "+data.callFlowData.call_Value + " WHERE org_unit_id = " + data.callFlowData.org_unit_id;

                                    connector.ctPool.query(updateQry, function (err, ret) {
                                        if (err) { cb1(err) }
                                        else {
                                            cb1(null);
                                        }
                                    });
                                } else {
                                    var insertQry = "INSERT INTO " + defProvisionerouteTable;
                                    insertQry += " (org_unit_id, record_call, play_voice_prompt_first, play_whisper_message, play_voice_prompt_first_text,play_whisper_message_text, ring_to_number, play_disclaimer, repeat_interval_call, voice_prompt_url, whisper_message_url, voice_prompt_id,whisper_id,prompt_message_name, whisper_message_name, call_value)";
                                    insertQry += " VALUES (" + data.callFlowData.org_unit_id + "," + data.callFlowData.recordcall + "";
                                    insertQry += "," + data.callFlowData.play_voice_prompt + "," + data.callFlowData.play_whisper_message + ",'" + data.callFlowData.prompt_message + "','" + data.callFlowData.whisper_message + "'," + data.callFlowData.ringto + ",'" + data.callFlowData.play_disclaimer + "'," + data.callFlowData.repeat_interval_call + ",'" + data.callFlowData.voice_prompt_url + "','" + data.callFlowData.whisper_message_url + "'," + data.callFlowData.voice_prompt_id + "," + data.callFlowData.whisper_id + ",'" + data.callFlowData.prompt_message_name + "','" + data.callFlowData.whisper_message_name + "',"+data.callFlowData.call_Value +")";

                                    connector.ctPool.query(insertQry, function (err, data) {
                                        if (err) { cb1(err) }
                                        else {
                                            cb1(null);
                                        }
                                    });
                                }
                            }
                        });

                    },
                    function (cb1) {
                        var selectQry = "SELECT org_unit_id FROM default_advanced_org_unit_settings WHERE org_unit_id = " + data.callFlowData.org_unit_id;
                        connector.ctPool.query(selectQry, function (err, ret) {
                            if (err) {
                                callback(err);
                            } else {
                                // console.log(data.callFlowData);
                                data.callFlowData.ringto = data.callFlowData.ringto === undefined ? null : data.callFlowData.ringto;
                              
                                    if(data.callFlowData.is_migrated){
                                        if (ret.length > 0 && ret[0].org_unit_id) {
                                            var updateQry = "UPDATE default_advanced_org_unit_settings ";
                                            updateQry += " SET ce_call_flow_recording_id = " + data.callFlowData.call_flow_recording_id + ", activate_voicemail = " + data.callFlowData.activate_voicemail_status;
                                            updateQry += ",voicemail_greeting_message = '" + data.callFlowData.voicemail_greeting_message +"', voicemail_rings = " + data.callFlowData.voicemail_rings_count + ", overflow_rings = " + data.callFlowData.overflow_rings_count;
                                            updateQry += ", updated_by = " + data.callFlowData.userid;
                                            updateQry += ", updated_on = CURRENT_TIMESTAMP";
                                            updateQry += " WHERE org_unit_id = " + data.callFlowData.org_unit_id;
                                            connector.ctPool.query(updateQry, function (err, result) {
        
                                                if (err) { cb1(err) }
                                                else {
                                                    cb1(null);
                                                }
                                            });
                                        } else {
                                            var insertQry = " INSERT INTO default_advanced_org_unit_settings ";
                                                insertQry += " (org_unit_id, ce_call_flow_recording_id, activate_voicemail, voicemail_greeting_message, voicemail_rings, overflow_rings, updated_by, created_by)" ;
                                                insertQry += " VALUES (" + data.callFlowData.org_unit_id + "," + data.callFlowData.call_flow_recording_id + "," + data.callFlowData.activate_voicemail_status + ",'" + data.callFlowData.voicemail_greeting_message +"',"+ data.callFlowData.voicemail_rings_count + "," + data.callFlowData.overflow_rings_count + "," + data.callFlowData.userid +"," + data.callFlowData.userid + ")" ;
                                                connector.ctPool.query(insertQry, function(err, result) {
                                                    if(err){cb1(err)}
                                                    else{
                                                        cb1(null);
                                                    }
                                                });
                                        }
                                    }else{
                                        cb1(null);
                                    }
                                }
                        });

                    }], function (err) {
                        callback(null);

                    });

            },
            function (callback) {
                if (data.customSourceData !== undefined) {
                    // console.log("fdffd");
                    var deleteQry = "DELETE FROM " + defCustomSourceTable + " WHERE org_unit_id = " + data.callFlowData.org_unit_id;
                    connector.ctPool.query(deleteQry, function (err, ret) {
                        if (err) {
                            callback(err);
                        } else {
                            var insertQry = "INSERT INTO " + defCustomSourceTable;
                            insertQry += " (org_unit_id, custom_source_id)";
                            insertQry += " VALUES "
                            _.each(data.customSourceData.ids, function (id, key) {
                                insertQry += "(" + data.callFlowData.org_unit_id + "," + id + ")"
                                if (key !== data.customSourceData.ids.length - 1)
                                    insertQry += ","
                            })
                            connector.ctPool.query(insertQry, function (err, ret) {
                                callback(err);
                            });
                        }
                    });
                } else {
                    callback(null);
                }

            },

            function (callback) {
                var selectQry = "SELECT org_unit_id from " + defDNISettingTable + " where org_unit_id = " + data.dniSettingData.org_unit_id;
                connector.ctPool.query(selectQry, function (err, ret) {
                    if (err) {
                        callback(err);
                    } else {
                        if (saveCustomParams) {
                            // console.log("customParams:", customParams);
                            data.dniSettingData.custom_params = customParams;
                        }

                        if (ret.length > 0 && ret[0].org_unit_id) {
                            var qry = "UPDATE " + defDNISettingTable;
                            qry += " SET destination_url = '" + data.dniSettingData.destination_url + "',dni_type = '" + data.dniSettingData.dni_type + "',dni_element = '" + data.dniSettingData.dni_element + "'";
                            qry += ", referrer = '" + data.dniSettingData.referrer + "', referrer_type = '" + data.dniSettingData.referrer_type + "', dni_setting_modified = '" + f.mysqlTimestamp() + "'";
                            // qry += " ttl= " + parseInt(data.dniSettingData.ttl);

                            if (data.dniSettingData.custom_params !== null || data.dniSettingData.custom_params !== undefined) {
                                qry += ", custom_params= '" + data.dniSettingData.custom_params + "'";
                            }
                            qry += " WHERE org_unit_id = " + parseInt(data.dniSettingData.org_unit_id);

                            connector.ctPool.query(qry, function (err, ret) {
                                console.log(err);
                                callback(err);
                            });
                        } else {
                            var insertQry = '';
                            if (data.dniSettingData.custom_params !== null || data.dniSettingData.custom_params !== undefined) {
                                insertQry = "INSERT INTO " + defDNISettingTable;
                                insertQry += " (org_unit_id, destination_url, dni_type, dni_element,referrer, referrer_type, dni_setting_created, custom_params)";
                                insertQry += " VALUES (" + data.dniSettingData.org_unit_id + ",'" + data.dniSettingData.destination_url + "'";
                                insertQry += ",'" + data.dniSettingData.dni_type + "','" + data.dniSettingData.dni_element + "','" + data.dniSettingData.referrer + "','" + data.dniSettingData.referrer_type + "','" + f.mysqlTimestamp() + "','" + data.dniSettingData.custom_params + "')";
                            } else {
                                insertQry = "INSERT INTO " + defDNISettingTable;
                                insertQry += " (org_unit_id, destination_url, dni_type, dni_element,referrer, referrer_type, dni_setting_created)";
                                insertQry += " VALUES (" + data.dniSettingData.org_unit_id + ",'" + data.dniSettingData.destination_url + "'";
                                insertQry += ",'" + data.dniSettingData.dni_type + "','" + data.dniSettingData.dni_element + "','" + data.dniSettingData.referrer + "','" + data.dniSettingData.referrer_type + "','" + f.mysqlTimestamp() + "')";

                            }
                            connector.ctPool.query(insertQry, function (err, ret) {
                                callback(err);
                            });
                        }
                    }
                });
            },///// SP save POST Call IVR Setting
            function (callback) {
              
                if (data.callFlowData.is_migrated && (data.postCallIvrValue.postCallIvrEnable == true || data.postCallIvrValue.postCallIvrEnable != undefined) && data.postCallIvrValue ) {
                    console.log("fdffd");
                    var deleteQry = "DELETE FROM " + defPostCallIvrVoicePrompts + " WHERE org_unit_id = " + data.callFlowData.org_unit_id;
                    connector.ctPool.query(deleteQry, function (err, ret) {
                        if (err) {
                            callback(err);
                        } else {
                            if (data.postCallIvrValue.postCallIvrEnable == true || data.postCallIvrValue.postCallIvrEnable != undefined) {
                                async.parallel([
                                    function (cb3) {
                                        var selectQry = "SELECT org_unit_id from  default_post_call_ivr_settings  where org_unit_id = " + data.dniSettingData.org_unit_id;
                                            connector.ctPool.query(selectQry, function (err, ret) {
                                                if (err) {
                                                            cb3(err);
                                                } 
                                                else 
                                                {
                                                        if (ret.length > 0 && ret[0].org_unit_id) {
                                                            var qry = "UPDATE default_post_call_ivr_settings ";
                                                                qry += " SET post_call_ivr_option_id = " + data.postCallIvrValue.post_call_ivr_id +",updated_by = "+data.callFlowData.userid ;
                                                                qry += " ,updated_on = CURRENT_TIMESTAMP";
                                                                qry += " WHERE org_unit_id = " + data.callFlowData.org_unit_id;

                                                            connector.ctPool.query(qry, function (err, ret) {
                                                                if (err) {
                                                                    cb3(err);
                                                                } else {
                                                                    cb3(null);
                                                                }
                                                            });
                                                    }else{
                                                        var insertQuery = "INSERT INTO default_post_call_ivr_settings ";
                                                        insertQuery += " (org_unit_id, post_call_ivr_option_id, created_by, updated_by )";
                                                        insertQuery += "VALUES (" + data.callFlowData.org_unit_id + "," + data.postCallIvrValue.post_call_ivr_id + "," + data.callFlowData.userid + "," + data.callFlowData.userid + ")";
                                                            connector.ctPool.query(insertQuery, function (err, result) {
                                                                if (err) {
                                                                    cb3(err);
                                                                } else {
                                                                    cb3(null);
                                                                }
                                                            });


                                                    }
                                                }    
                                            });            

                                    },function (cb3) {
                                        var qryInsert = '';
                                        qryInsert = "INSERT INTO " + defPostCallIvrVoicePrompts;
                                        qryInsert += "(org_unit_id,voice_prompt,voice_prompt_value,created_by,updated_by ) VALUES";
                                        if (data.postCallIvrValue.post_call_ivr_id === 1 || data.postCallIvrValue.post_call_ivr_id === 3) {
                                            for (var i = 0; i < data.postCallIvrValue.prompts.length; i++) {
                                                if(data.postCallIvrValue.prompts[i].type != "record_agent_id"){
                                                        qryInsert += "(" + data.callFlowData.org_unit_id + ",'" + data.postCallIvrValue.prompts[i].type + "','" + data.postCallIvrValue.prompts[i].promt + "'," + data.callFlowData.userid + "," + data.callFlowData.userid + "),";
                                                }
                                            }
                                            qryInsert = qryInsert.replace(/,\s*$/, "");
                                            connector.ctPool.query(qryInsert, function (err, result) {
                                                if (err) {
                                                    cb3(err);
                                                } else {
                                                    cb3(null);
                                                }
                                            });
                                        }
                                        else {
                                            cb3(null);
                                        }
                                    }, function (cb3) {
                                        if (data.postCallIvrValue.post_call_ivr_id === 2 || data.postCallIvrValue.post_call_ivr_id === 3) {
                                            var qryInsert1 = "INSERT INTO " + defPostCallIvrVoicePrompts;
                                            qryInsert1 += "(org_unit_id,voice_prompt,voice_prompt_value, number_of_digits, created_by,updated_by )";
                                            qryInsert1 += "VALUES (" + data.callFlowData.org_unit_id + ",'" + data.postCallIvrValue.prompts[0].type + "','" + data.postCallIvrValue.prompts[0].promt + "'," + data.postCallIvrValue.prompts[0].noOfDigits + "," + data.callFlowData.userid + "," + data.callFlowData.userid + ")";
                                            connector.ctPool.query(qryInsert1, function (err, result) {
                                                if (err) {
                                                    cb3(err);
                                                } else {
                                                    cb3(null);
                                                };
                                            });

                                        }
                                        else {
                                            cb3(null);
                                        }
                                    }
                                ], function (err) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        callback(null);
                                    }

                                });
                            }
                            else {
                                callback(null);
                            }
                        }
                    });
                }
                else {
                    callback(null);
                }
                   
            },
            function (callback) {
                var oudata = {};
                // oudata.org_unit_modified = 'CURRENT_TIMESTAMP'
                oudata.override_tracking_number_settings = false;
                oudata.is_dni_enabled = data.callFlowData.dni_status;
                oudata.is_post_call_ivr_enabled = data.postCallIvrValue.postCallIvrEnable

                var selectQry = "SELECT org_unit_id from " + OrgUnitDetailTable + " where org_unit_id = " + data.callFlowData.org_unit_id;
                connector.ctPool.query(selectQry, function (err, ret) {
                    if (err) {
                        callback(err);
                    } else {
                        if (ret.length > 0 && ret[0].org_unit_id) {
                            var updateData = {
                                which: 'update',
                                table: OrgUnitDetailTable,
                                values: oudata,
                                where: ' WHERE org_unit_id = ' + data.callFlowData.org_unit_id
                            };

                            connector.ctPool.update(updateData, function (err, ret) {
                                if (err)
                                    callback(err);
                                else
                                    callback(null, ret);
                            });
                        } else {
                            customParams
                            oudata.org_unit_id = data.callFlowData.org_unit_id;
                            var insertData = {
                                table: OrgUnitDetailTable,
                                values: oudata
                            };

                            connector.ctPool.insert(insertData, function (err, ret) {
                                if (err)
                                    callback(err);
                                else
                                    callback(null, ret);
                            });
                        }
                    }
                });
            }
        ],
            function (err, ret) {
                if (err)
                    res(err);
                else
                    
                res(null, ret);
            })
    },
    //Update existing call Flow record
    update: function (data, res) {
        async.waterfall([
            function (callback) {
                var updateQry = "UPDATE " + defProvisionerouteTable;
                updateQry += " SET record_call = '" + data.recordcall + "',play_voice_prompt_first = '" + data.play_voice_prompt + "',play_whisper_message = '" + data.play_whisper_message + "'";
                updateQry += ", ring_to_number = '" + data.ringto + "', play_disclaimer = '" + data.play_disclaimer + "', repeat_interval_call = '" + data.repeat_interval_call + "'";
                updateQry += " WHERE org_unit_id = " + data.org_unit_id;

                connector.ctPool.query(updateQry, function (err, ret) {
                    if (err) { return callback('Failed to insert Call Flow ' + err); }
                    callback(null, data);
                });
            },
            function (callback) {
                defaultCallFlow.deleteCustomSource(data, function (err, result) {
                    if (err) { res(err); }
                    defaultCallFlow.create(data, function (err, result) {
                        res(err, result);
                    });
                });
            }
        ], function (err, data) {
            res(err, data);
        })
    },
    //Retrive Call Flow Record by specific org_unit_id
    read: function (org_unit_id, res) {
        async.waterfall([
            function (callback) {
                orgUnitModel.checkOverrideSettings("call_flow", org_unit_id, function (err, settings_ou) {
                    if (err) {
                        callback(err);
                    } else {
                        org_unit_id = settings_ou
                        callback(null);
                    }
                })
            },
            function (callback) {
                if (isNaN(org_unit_id)) {
                    callback('Not a valid org_unit ID');
                } else {
                    var query = "SELECT dpt.*,  dvos.ce_call_flow_recording_id, dvos.activate_voicemail, dvos.voicemail_rings, dvos.overflow_rings, dvos.voicemail_greeting_message FROM " + defProvisionerouteTable+" dpt" ;
                        query +=" LEFT JOIN default_advanced_org_unit_settings dvos ON (dvos.org_unit_id = dpt.org_unit_id)  ";
                        query +=" WHERE dpt.org_unit_id =" + org_unit_id;
                    connector.ctPool.query(query, function (err, data) {
                        if (err) { return callback('Failed to retrieve group specific Call Flow ' + err); }
                        callback(null, data);
                    });
                }
            },
            function (callFlowData, callback) {
                if (isNaN(org_unit_id)) {
                    callback('Not a valid Org_unit ID');
                } else {
                    var query = "SELECT "
                    var query = "SELECT cs.custom_source_id, cs.custom_source_name, cs.custom_source_type FROM " + defCustomSourceTable + " dcs"
                    query += " JOIN custom_source cs ON (cs.custom_source_id = dcs.custom_source_id)"
                    query += " WHERE dcs.org_unit_id =" + org_unit_id

                    connector.ctPool.query(query, function (err, data) {
                        if (err) { return callback('Failed to retrieve group specific Custom Source ' + err); }
                        var result = {
                            callFlowData: callFlowData,
                            customSourceData: data
                        }
                        callback(err, result);
                    });
                }
            },// retrive Data for Post Call IVR
            function (callFlowData, callback) {
                if (isNaN(org_unit_id)) {
                    callback('Not a valid Org_unit ID');
                } else {
                    var resultPostCallIVR = [];
                    var query = "SELECT  dvos.voice_prompt, dvos.voice_prompt_value, dvos.number_of_digits, divrs.post_call_ivr_option_id ";
                    query += " FROM default_post_call_ivr_voice_prompts  dvos "
                    query += " LEFT JOIN default_post_call_ivr_settings divrs  ON (divrs.org_unit_id = dvos.org_unit_id)"
                    query += " WHERE dvos.org_unit_id =" + org_unit_id;

                    connector.ctPool.query(query, function (err, data) {
                        if (err) { return callback('Failed to retrieve group specific Custom Source ' + err); }
                        for(var i=0; i<data.length; i++){
                            var qryResult = {
                                ce_call_flow_recording_id: data[i].ce_call_flow_recording_id,
                                voice_prompt: data[i].voice_prompt,
                                voice_prompt_value: data[i].voice_prompt_value,
                                number_of_digits: data[i].number_of_digits,
                                post_call_ivr_option_id : data[i].post_call_ivr_option_id 
                            }
                            resultPostCallIVR.push(qryResult);

                        }
                        var result = {
                            callFlowData: callFlowData.callFlowData,
                            customSourceData: callFlowData.customSourceData,
                            postCallIVR : resultPostCallIVR
                        }
                        callback(err, result);
                    });
                }
            },
            function (callFlowData, callback) {
                var query = "SELECT is_post_call_ivr_enabled AS postCallIVR_status, is_dni_enabled AS dni_status  FROM " + OrgUnitDetailTable + " WHERE org_unit_id =" + org_unit_id;
                connector.ctPool.query(query, function (err, defdata) {
                    if (err)
                        callback(err);
                    var data = {
                        callFlowData: callFlowData.callFlowData,
                        customSourceData: callFlowData.customSourceData,
                        postCallIVR : callFlowData.postCallIVR,
                        defOrgComponentStatus : defdata
                        
                    }
                    callback(null, data);
                });
            },
            function (callFlowData, callback) {
                var query = "SELECT * FROM " + defDNISettingTable + " WHERE org_unit_id =" + org_unit_id;
                connector.ctPool.query(query, function (err, dniData) {
                    if (err)
                        callback(err);
                    var data = {
                        callFlowData: callFlowData.callFlowData,
                        customSourceData: callFlowData.customSourceData,
                        postCallIVR : callFlowData.postCallIVR,
                        defOrgComponentStatus : callFlowData.defOrgComponentStatus,
                        dniSettingData: dniData
                    }
                    callback(null, data);
                });
            },

        ], function (err, data) {
            res(err, data);
        })
    },

    //Populate Custom parameters
    populateCustomParams: function (ouid, res) {
        async.waterfall([
            function (callback) {
                var query = "SELECT custom_params FROM dni_org_unit WHERE org_unit_id = " + ouid;
                connector.ctPool.query(query, function (err, ouData) {
                    if (err) {
                        callback(null);
                    } else {
                        callback(null, ouData);
                    }
                });
            },
            function (ouData, callback) {
                if (ouData[0].custom_params === null)
                    orgUnitModel.checkOverrideSettings("call_flow", ouid, function (err, settings_ou) {
                        if (err) {
                            callback(err);
                        } else {
                            ouid = settings_ou
                            callback(null, ouData);
                        }
                    })
                else {
                    callback(null, ouData);
                }
            },
            function (ouData, callback) {
                if (ouData[0].custom_params === null) {
                    var query = "SELECT custom_params FROM " + defDNISettingTable + " WHERE org_unit_id =" + ouid;
                    connector.ctPool.query(query, function (err, data) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, data);
                        }

                    });
                } else {
                    callback(null, ouData);
                }
            }
        ], function (err, data) {
            res(err, data);
        });
    },
    //retrive custom_param
    readCustomParams: function (org_unit_id, res) {
        async.waterfall([
            function (callback) {
                orgUnitModel.checkOverrideSettings("call_flow", org_unit_id, function (err, settings_ou) {
                    if (err) {
                        callback(err);
                    } else {
                        org_unit_id = settings_ou
                        callback(null);
                    }
                })
            },
            function (callback) {
                var query = "SELECT custom_params FROM " + defDNISettingTable + " WHERE org_unit_id =" + org_unit_id;
                connector.ctPool.query(query, function (err, data) {
                    console.log(data);
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, data);
                    }

                });
            }
        ], function (err, data) {
            res(err, data);
        });
    },

    createCustomParams: function (data,userid, res) {
        defaultCallFlow.read(data.dniOrgUnit.org_unit_id, function (err, dataFromDb) {
            if (err) {
                res(err)
            } else {
                var defaultSettingData = {};
                defaultSettingData.dniSettingData = {};
                defaultSettingData.callFlowData = {};
                defaultSettingData.postCallIvrValue = {};

                defaultSettingData.dniSettingData = dataFromDb.dniSettingData[0];
                defaultSettingData.dniSettingData.org_unit_id = data.dniOrgUnit.org_unit_id;
                defaultSettingData.callFlowData.dni_status = dataFromDb.defOrgComponentStatus[0].dni_status;
                defaultSettingData.callFlowData.recordcall = dataFromDb.callFlowData[0].record_call;
                defaultSettingData.callFlowData.play_voice_prompt = dataFromDb.callFlowData[0].play_voice_prompt_first;
                defaultSettingData.callFlowData.play_whisper_message = dataFromDb.callFlowData[0].play_whisper_message;
                defaultSettingData.callFlowData.prompt_message = dataFromDb.callFlowData[0].play_voice_prompt_first_text;
                defaultSettingData.callFlowData.whisper_message = dataFromDb.callFlowData[0].play_whisper_message_text;
                defaultSettingData.callFlowData.ringto = dataFromDb.callFlowData[0].ring_to_number;
                defaultSettingData.callFlowData.play_disclaimer = dataFromDb.callFlowData[0].play_disclaimer;
                defaultSettingData.callFlowData.repeat_interval_call = dataFromDb.callFlowData[0].repeat_interval_call;
                defaultSettingData.callFlowData.activate_voicemail_status = dataFromDb.callFlowData[0].activate_voicemail;
                defaultSettingData.callFlowData.call_flow_recording_id = dataFromDb.callFlowData[0].ce_call_flow_recording_id;
                defaultSettingData.callFlowData.voicemail_greeting_message = dataFromDb.callFlowData[0].voicemail_greeting_message;
                defaultSettingData.callFlowData.voicemail_rings_count = dataFromDb.callFlowData[0].voicemail_rings;
                defaultSettingData.callFlowData.overflow_rings_count = dataFromDb.callFlowData[0].overflow_rings;
                defaultSettingData.callFlowData.voice_prompt_url = dataFromDb.callFlowData[0].voice_prompt_url;
                defaultSettingData.callFlowData.whisper_message_url = dataFromDb.callFlowData[0].whisper_message_url;
                defaultSettingData.callFlowData.voice_prompt_id = dataFromDb.callFlowData[0].voice_prompt_id;
                defaultSettingData.callFlowData.whisper_id = dataFromDb.callFlowData[0].whisper_id;
                defaultSettingData.callFlowData.whisper_message_name = dataFromDb.callFlowData[0].whisper_message_name;
                defaultSettingData.callFlowData.prompt_message_name = dataFromDb.callFlowData[0].prompt_message_name;
                defaultSettingData.callFlowData.call_Value = dataFromDb.callFlowData[0].call_value;
                defaultSettingData.callFlowData.org_unit_id = data.dniOrgUnit.org_unit_id;
                defaultSettingData.callFlowData.userid = userid;
                defaultSettingData.postCallIvrValue.postCallIvrEnable = dataFromDb.defOrgComponentStatus[0].postcallivr_status;
                if(dataFromDb.postCallIVR && dataFromDb.postCallIVR.length >0){
                    defaultSettingData.postCallIvrValue.prompts = [];
                defaultSettingData.postCallIvrValue.post_call_ivr_id = dataFromDb.postCallIVR[0].post_call_ivr_option_id;
                    
                    for(var i=0 ; i< dataFromDb.postCallIVR.length ; i++){
                        defaultSettingData.postCallIvrValue.prompts.push({
                            'type': dataFromDb.postCallIVR[i].voice_prompt,
                            'promt': dataFromDb.postCallIVR[i].voice_prompt_value,
                            'noOfDigits':dataFromDb.postCallIVR[i].number_of_digits
                            
                        });
                    }
                }



                // defaultCallFlow.create(defaultSettingData, function(err, data) {
                // console.log(defaultSettingData);
                // ddd
                defaultCallFlow.create(defaultSettingData, true, data.dniOrgUnit.custom_params, function (err, data) {
                    res(err, data)
                });
            }
        })
    },

    //Delete call flow
    delete: function (org_unit_id, res) {
        if (!isNaN(org_unit_id)) {
            var query = "DELETE FROM " + defProvisionerouteTable + " WHERE org_unit_id= " + org_unit_id;
            connector.ctPool.query(query, function (err, data) {
                if (err) { return res('Failed to remove call Flow record. ' + err); }
                res(null, data);
            });
        } else {
            res('Not a valid Org Unit ID');
        }
    },

    deleteCustomSource: function (data, callback) {
        var deleteQry = "DELETE FROM " + defCustomSourceTable;
        deleteQry += " WHERE org_unit_id = " + data.org_unit_id;
        connector.ctPool.query(deleteQry, function (err, result) {
            if (err) { callback(err); }
            callback(err, result);
        });
    },

    deleteCustomSourceByID: function (customsourceid, res) {
        async.waterfall([
            function (callback) {
                var deleteQry = "DELETE FROM " + defCustomSourceTable;
                deleteQry += " WHERE custom_source_id = " + customsourceid;
                connector.ctPool.query(deleteQry, function (err, result) {
                    callback(err);
                });
            },
            function (callback) {
                var deleteQry = "DELETE FROM " + customSource;
                deleteQry += " WHERE custom_source_id = " + customsourceid;
                connector.ctPool.query(deleteQry, function (err, result) {
                    callback(err);
                });
            },

        ], function (err, data) {
            res(err, data);
        })
    }

}
var commonModel = {
    read: function (org_unit_id, res) {
        async.waterfall([
            function (callback) {
                defaultCallFlow.read(org_unit_id, function (err, result) {
                    callback(err, result);
                })
            },
            function (callFlowData, callback) {
                defaultfeatureModel.read(org_unit_id, function (err, featureData) {
                    var result = {
                        featureData: featureData,
                        callFlowData: callFlowData
                    }
                    callback(err, result);
                })
            },
        ], function (err, data) {
            res(err, data);
        })
    }
}

module.exports = {
    defaultCallFlow: defaultCallFlow,
    commonModel: commonModel
}