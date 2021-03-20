var connector = require('./appModel'),
    f = require('../functions/functions.js'),
    fs = require("fs"),
    yaml = require("js-yaml"),
    e = yaml.load(fs.readFileSync("config/database.yml")),
    async = require('async'),
    ctTransactionModel = require('../models/ctTransactionModel'),
    _ = require('underscore');

//Given Tables are used to apply default group settings
var defCallActionTable = 'default_call_action',
    OrgUnitDetailTable = 'default_org_setting',
    defDNISettingTable = 'default_dni_setting',
    defCustomSourceTable = 'default_custom_source',
    defProvisionerouteTable = 'default_provisioned_route',
    CustomSourceValue = 'default_custom_source_value';


//Apply Call Action settings at group level


//Default DNI settings at group level
// var defaultdniSetting = {
//     create: function(data, res) {
//         async.parallel([
//                 function(cb) {
//                     var selectQry = "SELECT org_unit_id from " + defDNISettingTable + " where org_unit_id = " + data.dniSettingData.org_unit_id;
//                     connector.ctPool.query(selectQry, function(err, ret) {
//                         if (err) {
//                             cb(err);
//                         } else {
//                             if (ret[0].org_unit_id) {
//                                 var qry = "UPDATE " + defDNISettingTable;
//                                 qry += " SET destination_url = '" + data.dniSettingData.destination_url + "',dni_type = '" + data.dniSettingData.dni_type + "',dni_element = '" + data.dniSettingData.dni_element + "'";
//                                 qry += ", referrer = '" + data.dniSettingData.referrer + "', referrer_type = '" + data.dniSettingData.referrer_type + "', dni_setting_modified = '" + f.mysqlTimestamp() + "',share_with_subgroup = " + data.dniSettingData.share_with_subgroup;
//                                 qry += " WHERE org_unit_id = " + parseInt(data.dniSettingData.org_unit_id);

//                                 connector.ctPool.query(qry, function(err, ret) {
//                                     cb(err);
//                                 });
//                             } else {
//                                 var insertQry = "INSERT INTO " + defDNISettingTable;
//                                 insertQry += " (org_unit_id, destination_url, dni_type, dni_element,referrer, referrer_type, dni_setting_created, share_with_subgroup)";
//                                 insertQry += " VALUES (" + data.dniSettingData.org_unit_id + ",'" + data.dniSettingData.destination_url + "'";
//                                 insertQry += ",'" + data.dniSettingData.dni_type + "','" + data.dniSettingData.dni_element + "','" + data.dniSettingData.referrer + "','" + data.dniSettingData.referrer_type + "','" + f.mysqlTimestamp() + "'," + data.dniSettingData.share_with_subgroup + ")";
//                                 connector.ctPool.query(insertQry, function(err, ret) {
//                                     cb(err);
//                                 });
//                             }
//                         }
//                     });
//                 },
//                 function(cb) {
//                     var oudata = {};
//                     // oudata.org_unit_modified = 'CURRENT_TIMESTAMP';
//                     oudata.conversation_analytics_status = data.caData.conversation_analytics_status;
//                     oudata.spam_guard_status = data.caData.spam_guard_status;

//                     var updateData = {
//                         which: 'update',
//                         table: OrgUnitDetailTable,
//                         values: oudata,
//                         where: ' WHERE org_unit_id = ' + data.dniSettingData.org_unit_id
//                     };

//                     connector.ctPool.update(updateData, function(err, ret) {
//                         cb(err);
//                     });
//                 }
//             ],
//             function(err) {
//                 if (err) {
//                     res(err);
//                 } else {
//                     res(null, "Succesfully save the settings");
//                 }
//             });
//     },
//     //Retrive DNI settings Record by specific org_unit_id
//     read: function(org_unit_id, res) {
//         async.waterfall([
//             function(callback) {
//                 var query = "SELECT * FROM " + defDNISettingTable + " WHERE org_unit_id =" + org_unit_id;
//                 connector.ctPool.query(query, function(err, data) {
//                     if (err) {
//                         callback(err);
//                     } else {
//                         callback(null, data);
//                     }

//                 });
//             },
//             function(dniData, callback) {
//                 var query = "SELECT * FROM " + OrgUnitDetailTable + " WHERE org_unit_id =" + org_unit_id;
//                 connector.ctPool.query(query, function(err, data) {
//                     if (err) {
//                         callback(err);
//                     } else {
//                         var data = {
//                             dniSettingData: dniData,
//                             caData: data
//                         }
//                         callback(null, data);
//                     }
//                 });
//             }
//         ], function(err, data) {
//             res(err, data);
//         });
//     }
// }

//Default Custom Source settings at group level
var defaultCustomSource = {
    //Create new CustomSource
    create: function(data, res) {
        var customSourceData = {};
        customSourceData.org_unit_id = data.org_unit_id;
        if (data.org_unit_id !== undefined && data.org_unit_id !== '' && data.custom_source_type !== undefined) {
            customSourceData.custom_source_type = data.custom_source_type;
            customSourceData.custom_source_name = data.custom_source_name;
            var insertData = {
                table: defCustomSourceTable,
                values: customSourceData
            };
            //insert data into default_custom_source table
            connector.ctPool.insert(insertData, function(err, data) {
                if (err) { return res('Failed to add default Custom source settings. ' + err); }
                // res(null, data);
                //insert data into custom_source_value table
                var selectqry = "SELECT * FROM " + defCustomSourceTable + " WHERE org_unit_id = " + customSourceData.org_unit_id;
                connector.ctPool.query(selectqry, function(err, items) {
                    async.eachSeries(items,
                        function(item, callback) {
                            if (item.custom_source_type_id !== undefined && item.org_unit_id !== undefined) {
                                var insertCustomSource = {};
                                insertCustomSource.custom_source_name = item.custom_source_name;
                                insertCustomSource.org_unit_id = item.org_unit_id;
                                insertCustomSource.custom_source_type_id = item.custom_source_type_id;
                                callInsert(insertCustomSource, function(err, data) {
                                    if (err) { return callback(err); } else {
                                        callback(null);
                                    }
                                });
                            } else {
                                callUpdate(item, function(err, data) {
                                    if (err) { return callback(err); } else {
                                        callback(null);
                                    }
                                });
                            }
                        }

                        ,
                        function(err) {
                            if (err) { return res(err); } else {
                                res(null, "Successfully added Custom Sources");
                            }
                        });
                });
            });

        } else {
            res(null);
        }

        //Insert values into custom_source_value table
        var callInsert = function(item, cb) {
            var insertCustomData = {};
            insertCustomData.org_unit_id = item.org_unit_id;
            insertCustomData.custom_source_type_id = item.custom_source_type_id;
            insertCustomData.custom_source_value = item.custom_source_name;

            var insertData = {
                which: 'insert',
                table: CustomSourceValue,
                values: insertCustomData
            };
            connector.ctPool.insert(insertData, function(err, data) {
                if (err) { return cb(err); }
                cb(null, data);
            });
            // var insertQry = "INSERT INTO " + CustomSourceValue;
            // insertQry += " (org_unit_id, custom_source_type_id, custom_source_value)";
            // insertQry += " VALUES (" + item.org_unit_id + "," + item.custom_source_type_id + ",'" + item.custom_source_name + "')";
            // connector.ctPool.query(insertQry, function(err, data) {
            //     console.log("Custom Source value: " + data);
            //     if (err) { return cb(err); }
            //     cb(null, data);
            // });
        }

        //Update values into custom_source_value table
        var callUpdate = function(item, cb) {
            var updateQuery = "UPDATE " + CustomSourceValue;
            updateQuery += " SET custom_source_value = '" + item.custom_source_name + "'";
            updateQuery += " WHERE org_unit_id = " + item.org_unit_id;
            connector.ctPool.query(updateQuery, function(err, data) {
                console.log("Data1: " + data);
                if (err) { return res('Failed to update custom source setting. ' + err); }
                cb(null, data);
            });
        }

    },

    //update Custom Source
    update: function(data, res) {
        defaultCustomSource.delete(data, function(err, result) {
            if (err) { res(err); }
            defaultCustomSource.create(data, function(err, result) {
                res(err, result);
            });
        });
    },

    delete: function(data, res) {
        var deleteQry = "DELETE FROM " + defCustomSourceTable;
        deleteQry += " WHERE org_unit_id = " + data.org_unit_id;
        connector.ctPool.query(deleteQry, function(err, result) {
            if (err) { res(err); }
            res(err, result);
        });
    },

    //Retrive Custom Source Record by specific org_unit_id
    read: function(org_unit_id, res) {
        console.log(org_unit_id);
        if (isNaN(org_unit_id)) {
            res('Not a valid Org_unit ID');
        } else {
            var query = "SELECT * FROM " + defCustomSourceTable + " WHERE org_unit_id =" + org_unit_id;
            console.log(query);
            connector.ctPool.query(query, function(err, data) {

                console.log(err, data);
                if (err) { return res('Failed to retrieve group specific Custom Source ' + err); }
                res(err, result);
            });
        }
    }
}

//Default Call Flow settings at group level
// var defaultCallFlow = {
//     create: function(data, res) {
//         var insertQry = "INSERT INTO " + defProvisionerouteTable;
//         insertQry += " (org_unit_id, record_call, play_voice_prompt_first, play_whisper_message, play_voice_prompt_first_text,play_whisper_message_text, ring_to_number, play_disclaimer)";
//         insertQry += " VALUES (" + data.org_unit_id + ",'" + data.recordcall + "'";
//         insertQry += ",'" + data.play_voice_prompt + "','" + data.play_whisper_message + "','" + data.prompt_message + "','" + data.whisper_message + "','" + data.ringto + "','" + data.play_disclaimer + "')";

//         connector.ctPool.query(insertQry, function(err, data) {
//             if (err) { return res('Failed to insert Call Flow ' + err); }
//             res(null, data);
//         });
//     },
//     //Update existing call Flow record
//     update: function(data, res) {
//         var updateQry = "UPDATE " + defProvisionerouteTable;
//         updateQry += " SET record_call = '" + data.recordcall + "',play_voice_prompt_first = '" + data.play_voice_prompt + "',play_whisper_message = '" + data.play_whisper_message + "'";
//         updateQry += ", ring_to_number = '" + data.ringto + "', play_disclaimer = '" + data.play_disclaimer + "'";
//         updateQry += " WHERE org_unit_id = " + data.org_unit_id;

//         connector.ctPool.query(updateQry, function(err, ret) {
//             if (err) { return res('Failed to insert Call Flow ' + err); }
//             res(null, data);
//         });
//     },

//     //Retrive Call Flow Record by specific org_unit_id
//     read: function(org_unit_id, res) {
//         if (isNaN(org_unit_id)) {
//             res('Not a valid org_unit ID');
//         } else {
//             var query = "SELECT * FROM " + defProvisionerouteTable + " WHERE org_unit_id =" + org_unit_id;
//             connector.ctPool.query(query, function(err, data) {
//                 if (err) { return res('Failed to retrieve group specific Call Flow ' + err); }
//                 res(null, data);
//             });
//         }
//     },

//     //Delete call flow
//     delete: function(org_unit_id, res) {
//         if (!isNaN(org_unit_id)) {
//             var query = "DELETE FROM " + defProvisionerouteTable + " WHERE org_unit_id= " + org_unit_id;
//             connector.ctPool.query(query, function(err, data) {
//                 if (err) { return res('Failed to remove call Flow record. ' + err); }
//                 res(null, data);
//             });
//         } else {
//             res('Not a valid Org Unit ID');
//         }
//     }
// }

module.exports = {
    defaultCallAction: defaultCallAction,
    // defaultdniSetting: defaultdniSetting,
    defaultCustomSource: defaultCustomSource,
    // defaultCallFlow: defaultCallFlow
}