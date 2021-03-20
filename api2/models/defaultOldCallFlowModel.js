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

var defaultCallFlow = {
    create: function(req, saveCustomParams, customParams, res) {
        var data = req.body;
        async.waterfall([
                function(callback) {
                    console.log(data.callFlowData);
                    var selectQry = "SELECT org_unit_id FROM " + defProvisionerouteTable + " WHERE org_unit_id = " + data.callFlowData.org_unit_id;
                    connector.ctPool.query(selectQry, function(err, ret) {
                        console.log(ret);
                        if (err) {
                            callback(err);
                        } else {
                            console.log(data);
                            data.callFlowData.ringto = data.callFlowData.ringto === undefined ? null : data.callFlowData.ringto;
                            if (ret.length > 0 && ret[0].org_unit_id) {
                                var updateQry = "UPDATE " + defProvisionerouteTable;
                                updateQry += " SET record_call = " + data.callFlowData.recordcall + ",play_voice_prompt_first = " + data.callFlowData.play_voice_prompt + ",play_whisper_message = " + data.callFlowData.play_whisper_message;
                                updateQry += ", play_voice_prompt_first_text = '" + data.callFlowData.prompt_message + "', play_whisper_message_text = '" + data.callFlowData.whisper_message + "'"
                                updateQry += ", ring_to_number = " + data.callFlowData.ringto + ", play_disclaimer = '" + data.callFlowData.play_disclaimer + "', repeat_interval_call = '" + data.callFlowData.repeat_interval_call + "'";
                                updateQry += ", voice_prompt_url = '" + data.callFlowData.voice_prompt_url + "', whisper_message_url = '" + data.callFlowData.whisper_message_url + "', voice_prompt_id = " + data.callFlowData.voice_prompt_id + ",whisper_id = " + data.callFlowData.whisper_id +",whisper_message_name = '" + data.callFlowData.whisper_message_name + "', prompt_message_name = '" + data.callFlowData.prompt_message_name + "' WHERE org_unit_id = " + data.callFlowData.org_unit_id;

                                connector.ctPool.query(updateQry, function(err, ret) {
                                    callback(err);
                                });
                            } else {
                                var insertQry = "INSERT INTO " + defProvisionerouteTable;
                                insertQry += " (org_unit_id, record_call, play_voice_prompt_first, play_whisper_message, play_voice_prompt_first_text,play_whisper_message_text, ring_to_number, play_disclaimer, repeat_interval_call, voice_prompt_url, whisper_message_url, voice_prompt_id,whisper_id,prompt_message_name, whisper_message_name)";
                                insertQry += " VALUES (" + data.callFlowData.org_unit_id + "," + data.callFlowData.recordcall + "";
                                insertQry += "," + data.callFlowData.play_voice_prompt + "," + data.callFlowData.play_whisper_message + ",'" + data.callFlowData.prompt_message + "','" + data.callFlowData.whisper_message + "'," + data.callFlowData.ringto + ",'" + data.callFlowData.play_disclaimer + "'," + data.callFlowData.repeat_interval_call + ",'" + data.callFlowData.voice_prompt_url + "','"+ data.callFlowData.whisper_message_url+ "',"+data.callFlowData.voice_prompt_id+","+ data.callFlowData.whisper_id+",'" + data.callFlowData.prompt_message_name + "','"+ data.callFlowData.whisper_message_name+ "')";

                                connector.ctPool.query(insertQry, function(err, data) {
                                    callback(err);
                                });
                            }
                        }
                    });

                },
                function(callback) {
                    if (data.customSourceData !== undefined) {
                        console.log("fdffd");
                        var deleteQry = "DELETE FROM " + defCustomSourceTable + " WHERE org_unit_id = " + data.callFlowData.org_unit_id;
                        connector.ctPool.query(deleteQry, function(err, ret) {
                            if (err) {
                                callback(err);
                            } else {
                                var insertQry = "INSERT INTO " + defCustomSourceTable;
                                insertQry += " (org_unit_id, custom_source_id)";
                                insertQry += " VALUES "
                                _.each(data.customSourceData.ids, function(id, key) {
                                    insertQry += "(" + data.callFlowData.org_unit_id + "," + id + ")"
                                    if (key !== data.customSourceData.ids.length - 1)
                                        insertQry += ","
                                })
                                connector.ctPool.query(insertQry, function(err, ret) {
                                    callback(err);
                                });
                            }
                        });
                    } else {
                        callback(null);
                    }

                },

                function(callback) {
                    var selectQry = "SELECT org_unit_id from " + defDNISettingTable + " where org_unit_id = " + data.dniSettingData.org_unit_id;
                    connector.ctPool.query(selectQry, function(err, ret) {
                        if (err) {
                            callback(err);
                        } else {
                            if (saveCustomParams) {
                                console.log("customParams:", customParams);
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

                                connector.ctPool.query(qry, function(err, ret) {
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
                                connector.ctPool.query(insertQry, function(err, ret) {
                                    callback(err);
                                });
                            }
                        }
                    });
                },


                function(callback) {
                    var selectQry = "SELECT org_unit_id from " + OrgUnitDetailTable + " where org_unit_id = " + data.callFlowData.org_unit_id;
                    var oudata = {};
                    // oudata.org_unit_modified = 'CURRENT_TIMESTAMP'
                    oudata.override_tracking_number_settings = false;
                    connector.ctPool.query(selectQry, function(err, ret) {
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

                                connector.ctPool.update(updateData, function(err, ret) {
                                    callback(err);
                                });
                            } else {
                                customParams
                                oudata.org_unit_id = data.callFlowData.org_unit_id;
                                var insertData = {
                                    table: OrgUnitDetailTable,
                                    values: oudata
                                };

                                connector.ctPool.insert(insertData, function(err, ret) {
                                    callback(err);
                                });
                            }
                        }
                    });
                }
            ],
            function(err, data) {
                res(err, data);
            })
    },
    //Update existing call Flow record
    update: function(data, res) {
        async.waterfall([
            function(callback) {
                var updateQry = "UPDATE " + defProvisionerouteTable;
                updateQry += " SET record_call = '" + data.recordcall + "',play_voice_prompt_first = '" + data.play_voice_prompt + "',play_whisper_message = '" + data.play_whisper_message + "'";
                updateQry += ", ring_to_number = '" + data.ringto + "', play_disclaimer = '" + data.play_disclaimer + "', repeat_interval_call = '" + data.repeat_interval_call + "'";
                updateQry += " WHERE org_unit_id = " + data.org_unit_id;

                connector.ctPool.query(updateQry, function(err, ret) {
                    if (err) { return callback('Failed to insert Call Flow ' + err); }
                    callback(null, data);
                });
            },
            function(callback) {
                defaultCallFlow.deleteCustomSource(data, function(err, result) {
                    if (err) { res(err); }
                    defaultCallFlow.create(data, function(err, result) {
                        res(err, result);
                    });
                });
            }
        ], function(err, data) {
            res(err, data);
        })
    },
    //Retrive Call Flow Record by specific org_unit_id
    read: function(org_unit_id, res) {
        async.waterfall([
            function(callback) {
                orgUnitModel.checkOverrideSettings("call_flow", org_unit_id, function(err, settings_ou) {
                    if (err) {
                        callback(err);
                    } else {
                        org_unit_id = settings_ou
                        callback(null);
                    }
                })
            },
            function(callback) {
                if (isNaN(org_unit_id)) {
                    callback('Not a valid org_unit ID');
                } else {
                    var query = "SELECT * FROM " + defProvisionerouteTable + " WHERE org_unit_id =" + org_unit_id;
                    connector.ctPool.query(query, function(err, data) {
                        if (err) { return callback('Failed to retrieve group specific Call Flow ' + err); }
                        callback(null, data);
                    });
                }
            },
            function(callFlowData, callback) {
                if (isNaN(org_unit_id)) {
                    callback('Not a valid Org_unit ID');
                } else {
                    var query = "SELECT "
                    var query = "SELECT cs.custom_source_id, cs.custom_source_name, cs.custom_source_type FROM " + defCustomSourceTable + " dcs"
                    query += " JOIN custom_source cs ON (cs.custom_source_id = dcs.custom_source_id)"
                    query += " WHERE dcs.org_unit_id =" + org_unit_id

                    connector.ctPool.query(query, function(err, data) {
                        if (err) { return callback('Failed to retrieve group specific Custom Source ' + err); }
                        var result = {
                            callFlowData: callFlowData,
                            customSourceData: data
                        }
                        callback(err, result);
                    });
                }
            },
            function(callFlowData, callback) {
                var query = "SELECT * FROM " + defDNISettingTable + " WHERE org_unit_id =" + org_unit_id;
                connector.ctPool.query(query, function(err, dniData) {
                    if (err)
                        callback(err);
                    var data = {
                        callFlowData: callFlowData.callFlowData,
                        customSourceData: callFlowData.customSourceData,
                        dniSettingData: dniData
                    }
                    callback(null, data);
                });
            },

        ], function(err, data) {
            res(err, data);
        })
    },

    //Populate Custom parameters
    populateCustomParams: function(ouid, res) {
        async.waterfall([
            function(callback) {
                var query = "SELECT custom_params FROM dni_org_unit WHERE org_unit_id = " + ouid;
                connector.ctPool.query(query, function(err, ouData) {
                    if (err) {
                        callback(null);
                    } else {
                        callback(null, ouData);
                    }
                });
            },
            function(ouData, callback) {
                if (ouData[0].custom_params === null)
                    orgUnitModel.checkOverrideSettings("call_flow", ouid, function(err, settings_ou) {
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
            function(ouData, callback) {
                if (ouData[0].custom_params === null) {
                    var query = "SELECT custom_params FROM " + defDNISettingTable + " WHERE org_unit_id =" + ouid;
                    connector.ctPool.query(query, function(err, data) {
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
        ], function(err, data) {
            res(err, data);
        });
    },
    //retrive custom_param
    readCustomParams: function(org_unit_id, res) {
        async.waterfall([
            function(callback) {
                orgUnitModel.checkOverrideSettings("call_flow", org_unit_id, function(err, settings_ou) {
                    if (err) {
                        callback(err);
                    } else {
                        org_unit_id = settings_ou
                        callback(null);
                    }
                })
            },
            function(callback) {
                var query = "SELECT custom_params FROM " + defDNISettingTable + " WHERE org_unit_id =" + org_unit_id;
                connector.ctPool.query(query, function(err, data) {
                    console.log(data);
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, data);
                    }

                });
            }
        ], function(err, data) {
            res(err, data);
        });
    },

    createCustomParams: function(data, res) {
        defaultCallFlow.read(data.dniOrgUnit.org_unit_id, function(err, dataFromDb) {
            console.log(data.dniOrgUnit.custom_param);
            if (err) {
                res(err)
            } else {
                var defaultSettingData = {};
                defaultSettingData.dniSettingData = dataFromDb.dniSettingData[0];
                defaultSettingData.dniSettingData.org_unit_id = data.dniOrgUnit.org_unit_id;

                defaultSettingData.callFlowData = {};
                defaultSettingData.callFlowData.recordcall = dataFromDb.callFlowData[0].record_call;
                defaultSettingData.callFlowData.play_voice_prompt = dataFromDb.callFlowData[0].play_voice_prompt_first;
                defaultSettingData.callFlowData.play_whisper_message = dataFromDb.callFlowData[0].play_whisper_message;
                defaultSettingData.callFlowData.prompt_message = dataFromDb.callFlowData[0].play_voice_prompt_first_text;
                defaultSettingData.callFlowData.whisper_message = dataFromDb.callFlowData[0].play_whisper_message_text;
                defaultSettingData.callFlowData.ringto = dataFromDb.callFlowData[0].ring_to_number;
                defaultSettingData.callFlowData.play_disclaimer = dataFromDb.callFlowData[0].play_disclaimer;
                defaultSettingData.callFlowData.repeat_interval_call = dataFromDb.callFlowData[0].repeat_interval_call;
                // defaultSettingData.callFlowData.org_unit_id = dataFromDb.callFlowData[0].org_unit_id;
                defaultSettingData.callFlowData.org_unit_id = data.dniOrgUnit.org_unit_id;

                // defaultCallFlow.create(defaultSettingData, function(err, data) {
                console.log()
                defaultCallFlow.create(defaultSettingData, true, data.dniOrgUnit.custom_params, function(err, data) {
                    res(err, data)
                });
            }
        })
    },

    //Delete call flow
    delete: function(org_unit_id, res) {
        if (!isNaN(org_unit_id)) {
            var query = "DELETE FROM " + defProvisionerouteTable + " WHERE org_unit_id= " + org_unit_id;
            connector.ctPool.query(query, function(err, data) {
                if (err) { return res('Failed to remove call Flow record. ' + err); }
                res(null, data);
            });
        } else {
            res('Not a valid Org Unit ID');
        }
    },

    deleteCustomSource: function(data, callback) {
        var deleteQry = "DELETE FROM " + defCustomSourceTable;
        deleteQry += " WHERE org_unit_id = " + data.org_unit_id;
        connector.ctPool.query(deleteQry, function(err, result) {
            if (err) { callback(err); }
            callback(err, result);
        });
    },

    deleteCustomSourceByID: function(customsourceid, res) {
        async.waterfall([
            function(callback) {
                var deleteQry = "DELETE FROM " + defCustomSourceTable;
                deleteQry += " WHERE custom_source_id = " + customsourceid;
                connector.ctPool.query(deleteQry, function(err, result) {
                    callback(err);
                });
            },
            function(callback) {
                var deleteQry = "DELETE FROM " + customSource;
                deleteQry += " WHERE custom_source_id = " + customsourceid;
                connector.ctPool.query(deleteQry, function(err, result) {
                    callback(err);
                });
            },

        ], function(err, data) {
            res(err, data);
        })
    }

}
var commonModel = {
    read: function(org_unit_id, res) {
        async.waterfall([
            function(callback) {
                defaultCallFlow.read(org_unit_id, function(err, result) {
                    callback(err, result);
                })
            },
            function(callFlowData, callback) {
                defaultfeatureModel.read(org_unit_id, function(err, featureData) {
                    var result = {
                        featureData: featureData,
                        callFlowData: callFlowData
                    }
                    callback(err, result);
                })
            },
        ], function(err, data) {
            res(err, data);
        })
    }
}

module.exports = {
    defaultCallFlow: defaultCallFlow,
    commonModel: commonModel
}