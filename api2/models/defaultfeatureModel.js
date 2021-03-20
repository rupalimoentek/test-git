var connector = require('./appModel'),
    f = require('../functions/functions.js'),
    fs = require("fs"),
    yaml = require("js-yaml"),
    e = yaml.load(fs.readFileSync("config/database.yml")),
    async = require('async'),
    ctTransactionModel = require('../models/ctTransactionModel'),
    orgUnitModel = require('../models/orgUnitModel'),
    _ = require('underscore');

//Given Tables are used to apply default group settings
var OrgUnitDetailTable = 'default_org_setting',
    defDNISettingTable = 'default_dni_setting';
//Default DNI settings at group level
var defaultFeatureSettings = {
    // create: function(data, saveCustomParams, customParams ,res) {
    create: function(data, res) {
        console.log(data)
            // async.parallel([
            // function(cb) {
            //     var selectQry = "SELECT org_unit_id from " + defDNISettingTable + " where org_unit_id = " + data.dniSettingData.org_unit_id;
            //     connector.ctPool.query(selectQry, function(err, ret) {
            //         if (err) {
            //             cb(err);
            //         } else {
            //             if (ret.length > 0 && ret[0].org_unit_id) {
            //                 var qry = "UPDATE " + defDNISettingTable;
            //                 qry += " SET destination_url = '" + data.dniSettingData.destination_url + "',dni_type = '" + data.dniSettingData.dni_type + "',dni_element = '" + data.dniSettingData.dni_element + "'";
            //                 qry += ", referrer = '" + data.dniSettingData.referrer + "', referrer_type = '" + data.dniSettingData.referrer_type + "', dni_setting_modified = '" + f.mysqlTimestamp() + "',share_with_subgroup = " + data.dniSettingData.share_with_subgroup;
            //                 qry += ",ttl= '" + data.dniSettingData.ttl + "'";
            //                 qry += " WHERE org_unit_id = " + parseInt(data.dniSettingData.org_unit_id);

        //                 connector.ctPool.query(qry, function(err, ret) {
        //                     console.log(err);
        //                     cb(err);
        //                 });
        //             } else {
        // };
        //                 var insertQry = "INSERT INTO " + defDNISettingTable;
        //                 insertQry += " (org_unit_id, destination_url, dni_type, dni_element,referrer, referrer_type, dni_setting_created, share_with_subgroup, ttl)";
        //                 insertQry += " VALUES (" + data.dniSettingData.org_unit_id + ",'" + data.dniSettingData.destination_url + "'";
        //                 insertQry += ",'" + data.dniSettingData.dni_type + "','" + data.dniSettingData.dni_element + "','" + data.dniSettingData.referrer + "','" + data.dniSettingData.referrer_type + "','" + f.mysqlTimestamp() + "'," + data.dniSettingData.share_with_subgroup + "," + data.dniSettingData.ttl + ")";
        //                 connector.ctPool.query(insertQry, function(err, ret) {
        //                     cb(err);
        //                 });
        //             }
        //         }
        //     });
        // },
        // function(cb) {
        var selectQry = "SELECT org_unit_id from " + OrgUnitDetailTable + " where org_unit_id = " + data.defaultData.org_unit_id;
        var oudata = {};
        // oudata.org_unit_modified = 'CURRENT_TIMESTAMP';
        // if (saveCustomParams)
        //     oudata.custom_params = customParams;

        oudata.conversation_analytics_status = data.defaultData.conversation_analytics_status;
        oudata.spam_guard_status = data.defaultData.spam_guard_status;
        oudata.share_with_subgroup = data.defaultData.share_with_subgroup;
        oudata.override_feature_settings = false;
        connector.ctPool.query(selectQry, function(err, ret) {
            if (err) {
                res(err);
            } else {
                if (ret.length > 0 && ret[0].org_unit_id) {
                    var updateData = {
                        which: 'update',
                        table: OrgUnitDetailTable,
                        values: oudata,
                        where: ' WHERE org_unit_id = ' + data.defaultData.org_unit_id
                    };

                    connector.ctPool.update(updateData, function(err, ret) {
                        if(data.defaultData.share_with_subgroup){
                            var updateQry = "UPDATE default_org_setting SET share_with_subgroup = false WHERE org_unit_id IN ( SELECT org_unit_id from org_unit WHERE (top_ou_id = " + data.defaultData.org_unit_id + " OR org_unit_parent_id = " + data.defaultData.org_unit_id + ") AND org_unit_id != " + data.defaultData.org_unit_id + ")";
                            
                            connector.ctPool.query(updateQry, function(err, ret) {
                                res(err);
                            }); 
                        }else{
                            res(err);
                        }
                    });
                } else {

                    oudata.org_unit_id = data.defaultData.org_unit_id;
                    var insertData = {
                        table: OrgUnitDetailTable,
                        values: oudata
                    };

                    connector.ctPool.insert(insertData, function(err, ret) {
                        if (err)
                            res(err);
                        else
                            res(null, "Succesfully save the settings");

                    });
                }
            }
        });
        // }
        // ],
        // function(err) {
        //     if (err) {
        //         res(err);
        //     } else {
        //         res(null, "Succesfully save the settings");
        //     }
        // });
    },

    // createCustomParams: function(data, res) {
    //     defaultFeatureSettings.read(data.dniOrgUnit.org_unit_id, function(err, dataFromDb) {
    //         if (err) {
    //             res(err)
    //         } else {
    //             var defaultSettingData = {};
    //             defaultSettingData.dniSettingData = dataFromDb.dniSettingData[0];
    //             defaultSettingData.dniSettingData.org_unit_id = data.dniOrgUnit.org_unit_id;
    //             defaultSettingData.defaultData = dataFromDb.defaultData[0];
    //             defaultFeatureSettings.create(defaultSettingData, true, data.dniOrgUnit.custom_params, function(err, data) {
    //                 res(err, data)
    //             });
    //         }
    //     })
    // },


    // populateCustomParams: function(ouid, res) {
    //     async.waterfall([
    //         function(callback) {
    //             var query = "SELECT custom_params FROM dni_org_unit WHERE org_unit_id = " + ouid;
    //             connector.ctPool.query(query, function(err, ouData) {
    //                 if (err) {
    //                     callback(null);
    //                 } else {
    //                     callback(null, ouData);
    //                 }
    //             });
    //         },
    //         function(ouData, callback) {
    //             if (ouData[0].custom_params === null)
    //                 orgUnitModel.checkOverrideSettings("feature", ouid, function(err, settings_ou) {
    //                     if (err) {
    //                         callback(err);
    //                     } else {
    //                         ouid = settings_ou
    //                         callback(null, ouData);
    //                     }
    //                 })
    //             else {
    //                 callback(null, ouData);
    //             }
    //         },
    //         function(ouData, callback) {
    //             if (ouData[0].custom_params === null) {
    //                 var query = "SELECT custom_params FROM " + OrgUnitDetailTable + " WHERE org_unit_id =" + ouid;
    //                 connector.ctPool.query(query, function(err, data) {
    //                     if (err) {
    //                         callback(err);
    //                     } else {
    //                         callback(null, data);
    //                     }

    //                 });
    //             } else {
    //                 callback(null, ouData);
    //             }
    //         }
    //     ], function(err, data) {
    //         res(err, data);
    //     });
    // },
    // readCustomParams: function(org_unit_id, res) {
    //     async.waterfall([
    //         function(callback) {
    //             orgUnitModel.checkOverrideSettings("feature", org_unit_id, function(err, settings_ou) {
    //                 if (err) {
    //                     callback(err);
    //                 } else {
    //                     org_unit_id = settings_ou
    //                     callback(null);
    //                 }
    //             })
    //         },
    //         function(callback) {
    //             var query = "SELECT custom_params FROM " + OrgUnitDetailTable + " WHERE org_unit_id =" + org_unit_id;
    //             connector.ctPool.query(query, function(err, data) {
    //                 if (err) {
    //                     callback(err);
    //                 } else {
    //                     callback(null, data);
    //                 }

    //             });
    //         }
    //     ], function(err, data) {
    //         res(err, data);
    //     });
    // },
    //Retrive DNI settings Record by specific org_unit_id
    read: function(org_unit_id, res) {
        var currentOu = org_unit_id;
        async.waterfall([
                function(callback) {
                    orgUnitModel.checkOverrideSettings("feature", org_unit_id, function(err, settings_ou) {
                        if (err) {
                            callback(err);
                        } else {
                            org_unit_id = settings_ou
                            callback(null);
                        }
                    })
                },
                function(callback) {
                    var query = "SELECT * FROM " + OrgUnitDetailTable + " WHERE org_unit_id =" + org_unit_id;
                    connector.ctPool.query(query, function(err, defaulSettingdata) {
                        if (err) {
                            callback(err);
                        } else {
                            var data = {
                                // dniSettingData dniData,
                                defaultData: defaulSettingdata
                            }
                            callback(null, data);
                        }
                    });
                },
                function(data, callback) {
                    defaultFeatureSettings.getShareDni(currentOu, "org_unit", function(err, disable_share_dni, share_group_name, location_level_ou) {
                        if(data.defaultData.length > 0 ){
                            data.defaultData[0].disable_share_dni = disable_share_dni;
                            data.defaultData[0].share_group_name = share_group_name;
                            data.defaultData[0].location_level_ou = location_level_ou;
                        }
                        callback(null, data);
                    });
                }
            ],
            function(err, data) {
                res(err, data);
            });
    },

    getShareDni: function(org_unit_id, controller, callback) {
        var query = "SELECT ou.org_unit_name, ou.top_ou_id, ou.org_unit_parent_id, touid.org_unit_name AS top_ou, pouid.org_unit_name AS p_ou, dou.share_with_subgroup as org_share_sub, tou.share_with_subgroup as top_share_sub, pou.share_with_subgroup as parent_share_sub " +
            "FROM org_unit ou  " +
            "LEFT JOIN default_org_setting tou ON (tou.org_unit_id = ou.top_ou_id) " +
            "LEFT JOIN default_org_setting pou ON (pou.org_unit_id = ou.org_unit_parent_id) " +
            "LEFT JOIN default_org_setting dou ON (dou.org_unit_id = ou.org_unit_id) " +
            "LEFT JOIN org_unit touid ON (touid.org_unit_id = ou.top_ou_id) " +
            "LEFT JOIN org_unit pouid ON (pouid.org_unit_id = ou.org_unit_parent_id) " +
            " WHERE ou.org_unit_id = " + org_unit_id;

        connector.ctPool.query(query, function(err, result) {
            var disable_share_dni = false;
            var share_group_name = '';
            var location_level_ou = false;
            if (err) { callback(err); } else {
                if (controller === "org_unit") {
                    console.log(result[0]);
                    if (result[0].top_ou_id == org_unit_id) {
                        disable_share_dni = false
                    } else if (result[0].parent_share_sub == true) {
                        if(result[0].top_share_sub == true){
                            disable_share_dni = true;
                            share_group_name = result[0].top_ou;
                        }else{
                            disable_share_dni = true;
                            share_group_name = result[0].p_ou;
                        }
                    } else if (result[0].top_share_sub == true) {
                        disable_share_dni = true;
                        share_group_name = result[0].top_ou;
                    }

                    console.log(result[0]);
                    if(result[0].top_ou_id !== result[0].org_unit_parent_id && result[0].org_unit_parent_id !== null)
                        location_level_ou = true
                } else {
                    if (result[0].top_ou_id == org_unit_id) {
                        if (result[0].org_share_sub == true) {
                            share_group_name = result[0].org_unit_name;
                            disable_share_dni = true
                        }
                    } else if (result[0].parent_share_sub == true) {
                        if(result[0].top_share_sub == true){
                            disable_share_dni = true;
                            share_group_name = result[0].top_ou;
                        }else{
                            disable_share_dni = true;
                            share_group_name = result[0].p_ou;
                        }
                    } else if (result[0].top_share_sub == true) {
                        disable_share_dni = true;
                        share_group_name = result[0].top_ou;
                    } else if (result[0].org_share_sub == true) {
                        disable_share_dni = true;
                        share_group_name = result[0].org_unit_name;
                    }
                }
                callback(null, disable_share_dni, share_group_name, location_level_ou, location_level_ou);
            }
        })
    }
}

module.exports = defaultFeatureSettings