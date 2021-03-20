var mysql = require('mysql'),
    appModel = require('./appModel'),
    yaml = require("js-yaml"),
    f = require('../functions/functions.js'),
    fs = require("fs"),
    e = yaml.load(fs.readFileSync("config/database.yml")),
    envVar = process.env.NODE_ENV,
    async = require('async'),
    geoCoder = require('../lib/geoCoder'),
    table = 'dni_setting',
    numberPool = require('./newNumberPoolModel'),
    Mongo = require('mongodb'),
    m = yaml.load(fs.readFileSync("config/mongodb.yml")),
    _ = require("underscore"),
    orgUnitModel = require('../models/orgUnitModel'),
    crypto = require('crypto'),
    ctTransactionModel = require('./ctTransactionModel');

var dniSetting = {
    create: function(model, data, res) {
        console.log(data);
       // dd
        dniSetting.checkDuplicate(data, function(err, data1) {
            if (err) {
                res(err);
            } else {
                if (data.referrer_type === undefined) {
                    data.referrer_type = null;
                }

                qry = "SELECT org_unit_id FROM dni_org_unit WHERE"
                qry += " org_unit_id = " + data.org_unit_id;

                model.query(qry, function(err, dataOrgUNit) {
                    if (err) res(err);
                    else {
                        if (dataOrgUNit.length === 0) {
                            var insertDNIData = {
                                org_unit_id: data.org_unit_id,
                                dni_code: crypto.createHash('md5').update(data.org_unit_id.toString()).digest('hex'),
                            }
                            var insertData = {
                                table: "dni_org_unit",
                                values: insertDNIData
                            };
                            model.insert(insertData, function(err, retData) {
                                var qry = "INSERT INTO " + table;
                                qry += " (provisioned_route_id, org_unit_id, destination_url, dni_type, dni_element,referrer, referrer_type, dni_setting_created)";
                                qry += " VALUES (" + parseInt(data.provisioned_route_id) + "," + data.org_unit_id + ",'" + data.destination_url + "'";
                                qry += ",'" + data.dni_type + "','" + data.dni_element + "','" + data.referrer + "','" + data.referrer_type + "','" + f.mysqlTimestamp() + "')";

                                var insertData = {
                                    which: 'query',
                                    qry: qry
                                };

                                model.query(insertData, function(err, retData) {
                                    if (err) res(err);
                                    else {
                                        //if ttl is passed (session dni) we need to lookup the phone number pool record and update keep_alive_minutes
                                        if (data.dni_ttl) {
                                            //to lookup the phone number pool we first need to get the provisioned route id from the dni setting record
                                            qry= {
                                                provisioned_route_id: parseInt(data.provisioned_route_id)
                                               
                                            }
                                            //to update the phone number pool record we have to lookup the _id field
                                            numberPool.read(qry, function(err, mongoData) {
                                                //console.log(mongoData);
                                                if (err) res(err);
                                                else {
                                                    if(mongoData.length >0){
                                                        var d = {
                                                            keep_alive_mins: data.dni_ttl 
                                                            // qry: {Id: mongoData[0]._id, values: {keep_alive_minutes: data.dni_ttl}}
                                                        };
                                                        d.pool_id = mongoData[0].pool_id
                                                        numberPool.update(d, model,function(err, data) {
                                                            res(err, retData);
                                                        });
                                                    }
                                                    else{res(null);}
                                                }
                
                                            });
                                        } else {
                                            res(err, retData);
                                        }
                                    }
                                });
                            });
                        } else {
                            var qry = "INSERT INTO " + table;
                            qry += " (provisioned_route_id, org_unit_id, destination_url, dni_type, dni_element,referrer, referrer_type, dni_setting_created)";
                            qry += " VALUES (" + parseInt(data.provisioned_route_id) + "," + data.org_unit_id + ",'" + data.destination_url + "'";
                            qry += ",'" + data.dni_type + "','" + data.dni_element + "','" + data.referrer + "','" + data.referrer_type + "','" + f.mysqlTimestamp() + "')";

                            var insertData = {
                                which: 'query',
                                qry: qry
                            };

                            model.query(insertData, function(err, retData) {
                                if (err) res(err);
                                else {
                                    //if ttl is passed (session dni) we need to lookup the phone number pool record and update keep_alive_minutes
                                    if (data.dni_ttl) {
                                        //to lookup the phone number pool we first need to get the provisioned route id from the dni setting record
                                        qry= {
                                            provisioned_route_id: parseInt(data.provisioned_route_id)
                                           
                                        }
                                        //to update the phone number pool record we have to lookup the _id field
                                        numberPool.read(qry, function(err, mongoData) {
                                            //console.log(mongoData);
                                            if (err) res(err);
                                            else {
                                                if(mongoData.length >0){
                                                    var d = {
                                                        keep_alive_mins: data.dni_ttl 
                                                        // qry: {Id: mongoData[0]._id, values: {keep_alive_minutes: data.dni_ttl}}
                                                    };
                                                    d.pool_id = mongoData[0].pool_id
                                                    numberPool.update(d,model, function(err, data) {
                                                        res(err, retData);
                                                    });
                                                }
                                                else{res(null);}
                                            }
            
                                        });
                                    } else {
                                        res(err, retData);
                                    }
                                }
                            });
                        }

                    }
                });
            }
        });
    },

    // @param - required - arrOUids - array of ouids
    // @param - required - res      - callback for passing back error and/or results
    // purpose - get all dni_setting that are associated with an array of org unit id numbers
    // returns - an array of objects with properties of matching column names (only returns values from dni_setting_id column)
    retrieveDNIsettingsFromOUids: function(arrOUids, res) {
        if (!Array.isArray(arrOUids)) { throw "invalid input for retrieveDNIsettingsFromOUids"; }
        if (!arrOUids.length) { return res(null, []); }

        var qry = "SELECT dni_setting_id FROM dni_setting WHERE org_unit_id IN (" + arrOUids.join(",") + ")";
        console.log("!!!!!!!!!!!!!!!!!!!!!retrieveDNIsettingsFromOUids!!!!!!!!!!!!!!!!!!!11");
        appModel.ctPool.query(qry, function(err, resultSet) {
            if (err) { return res(err); }
            return res(null, resultSet);
        });
    },

    // @param {string or number or array of strings/numbers} idOrIds - dni setting ids to delete
    // @param {callback} res - callback that will be invoked with an error and/or query results from delete query
    // @param {database model class object} dbh - will typically either be the ctTransactionModel or the appModel.ctPool object depending on
    //      whether you are using this within a ctTransaction begin or expect this to work without it using appModel
    deleteDNISetting: function(idOrIds, res, dbh) {
        if (Array.isArray(idOrIds) && idOrIds.length) {
            if (!_.contains(["string", "number"], typeof idOrIds[0])) { return res("invalid data type in array in dni_settings deleteDNISetting") }

            var updateQry = "UPDATE " + table + " SET dni_active = 'false' WHERE dni_setting_id ";
            updateQry += (idOrIds.length > 1) ? "IN (" + idOrIds.join(",") + ")" : " = " + idOrIds[0];
            dbh.query(updateQry, function(err, resultSetData) {
                if (err) { return res(err); }

                return res(null, resultSetData);
            });
        } else if (idOrIds) {
            var query = "UPDATE " + table + " SET dni_active = 'false' where dni_setting_id=" + idOrIds;
            dbh.query(query, function(err, data) {
                if (err) {
                    return res(err);
                } else {
                    return res(null, data);
                }
            });
        } else {
            res({ result: 'nothing to delete' });
        }
    },
    updateDNISetting: function(data, res) {
        var ctTrans = new ctTransactionModel.begin(function(err) {
            if (err) {
                res(err);
                return;
            }
            dniSetting.update(ctTrans, data, function(err, data) {
                if (err) {
                    ctTrans.rollback(function() {
                        res(err);
                    });
                } else {
                    ctTrans.commit(function() {
                        res(null, data);
                    });
                }
            });
        });
    },
    update: function(model, data, res) {
        //update modified
        dniSetting.checkDuplicate(data, function(err, data1) {
            console.log(err);
            if (err) {
                res(err);
            } else {
                if (data.referrer_type === undefined) {
                    data.referrer_type = null;
                }
                var qry = "UPDATE " + table;
                qry += " SET destination_url = '" + data.destination_url + "',dni_type = '" + data.dni_type + "',dni_element = '" + data.dni_element + "'";
                qry += ", referrer = '" + data.referrer + "', referrer_type = '" + data.referrer_type + "', dni_setting_modified = '" + f.mysqlTimestamp() + "'";
                qry += " WHERE dni_setting_id = " + parseInt(data.dni_setting_id);
                var updateData = {
                    which: 'query',
                    qry: qry
                };
                model.query(updateData, function(err, retData) {
                    if (err) res(err);
                    else {
                        //if ttl is passed (session dni) we need to lookup the phone number pool record and update keep_alive_minutes
                        if (data.dni_ttl) {
                            //to lookup the phone number pool we first need to get the provisioned route id from the dni setting record
                            qry= {
                                provisioned_route_id: parseInt(data.provisioned_route_id)
                               
                            }
                            //to update the phone number pool record we have to lookup the _id field
                            numberPool.read(qry,function(err, mongoData) {
                                //console.log(mongoData);
                                if (err) res(err);
                                else {
                                    if(mongoData.length >0){
                                        var d = {
                                            keep_alive_mins: data.dni_ttl 
                                            // qry: {Id: mongoData[0]._id, values: {keep_alive_minutes: data.dni_ttl}}
                                        };
                                        d.pool_id = mongoData[0].pool_id
                                        numberPool.update(d, model,function(err, data) {
                                            res(err, retData);
                                        });
                                    }
                                    else{res(null);}
                                }

                            });
                        } else {
                            res(err, retData);
                        }
                    }
                });
            }
        });
    },
    checkDuplicate: function(data, res) {
        if (data.referrer_type === undefined) {
            data.referrer_type = null;
        }
        if (data.destination_url !== '' && data.dni_type !== "" && data.dni_type !== "url" && data.referrer !== "" && data.dni_element !== "") {
            var dupQuery = "SELECT * FROM " + table + " WHERE destination_url = '" + data.destination_url + "' AND dni_element = '" + data.dni_element;
            dupQuery += "' AND referrer = '" + data.referrer + "' AND referrer_type = '" + data.referrer_type + "' AND org_unit_id = " + data.org_unit_id;
            dupQuery += " AND dni_active = TRUE";

            appModel.ctPool.query(dupQuery, function(err, retData1) {
                if (err) {
                    res(err, null);
                    return;
                }
                if (retData1 && retData1.length > 0) {
                    if (data.dni_setting_id && data.dni_setting_id == retData1[0].dni_setting_id && retData1.length == 1) {
                        res(null, true);
                    } else {
                        res('Referrer-HTML Class ID combination is currently in use for that Host Domain. A unique combination is required.');
                    }
                } else {
                    res(null, true);
                }
            });
        } else {
            res(null, true);
        }
    },

    getDNICode: function(org_unit_id, res) {
        async.waterfall([
            function(callback) {
                var query = "SELECT dou.dni_code FROM dni_org_unit dou";
                query += " LEFT JOIN dni_setting ds ON (ds.org_unit_id = dou.org_unit_id)"
                query += " WHERE dou.org_unit_id =" + org_unit_id;
                query += " GROUP BY dou.dni_code"

                appModel.ctPool.query(query, function(err, dniData) {
                    if (err) {
                        callback(null);
                    } else {
                        callback(null, dniData);
                    }
                });
            },
            function(dniData, callback) {
                if (dniData[0] !== undefined) {
                    var dni_code = dniData[0].dni_code;
                } else {
                    var dni_code = '';
                }


                var query = "SELECT dou.share_with_subgroup as org_share_sub, "
                query += " tou.share_with_subgroup as top_share_sub, "
                query += " pou.share_with_subgroup as parent_share_sub, "
                query += " pdou.dni_code as parent_dni_code, "
                query += " tdou.dni_code as top_dni_code, "
                query += " cdou.dni_code as child_dni_code, ou.top_ou_id "
                query += " FROM org_unit  ou"
                query += " LEFT JOIN default_org_setting tou ON (tou.org_unit_id = ou.top_ou_id) "
                query += " LEFT JOIN default_org_setting pou ON (pou.org_unit_id = ou.org_unit_parent_id) "
                query += " LEFT JOIN default_org_setting dou ON (dou.org_unit_id = ou.org_unit_id) "
                query += " LEFT JOIN dni_org_unit pdou ON (pdou.org_unit_id = ou.org_unit_parent_id) "
                query += " LEFT JOIN dni_org_unit tdou ON (tdou.org_unit_id = ou.top_ou_id) "
                query += " LEFT JOIN dni_org_unit cdou ON (cdou.org_unit_id = ou.org_unit_id) "
                query += " WHERE ou.org_unit_id = " + org_unit_id;


                appModel.ctPool.query(query, function(err, dniParentData) {
                    if (dniParentData[0].top_ou_id == org_unit_id) {
                        if (dniParentData[0].org_share_sub == true) {
                            dni_code = dniParentData[0].child_dni_code;
                        }
                    } else if (dniParentData[0].parent_share_sub == true) {
                        if (dniParentData[0].top_share_sub == true) {
                            dni_code = dniParentData[0].top_dni_code;
                        } else {
                            dni_code = dniParentData[0].parent_dni_code;
                        }
                    } else if (dniParentData[0].top_share_sub == true) {
                        dni_code = dniParentData[0].top_dni_code;
                    } else if (dniParentData[0].org_share_sub == true) {
                        dni_code = dniParentData[0].child_dni_code;
                    }


                    if (err) {
                        callback(null);
                    } else {
                        callback(null, { dni_code: dni_code });
                    }
                });

            }
        ], function(err, data) {
            res(err, data);
        });
    },

    read: function(ouid, provisionedRouteId, res, userAccess, userid) {
        //TODO: validate and sanitize data before running query.
        //console.log(data);
        async.parallel([
                function(callback) {
                    var query = "SELECT org_unit_id, custom_params, dni_code FROM dni_org_unit WHERE org_unit_id = " + ouid;
                    appModel.ctPool.query(query, function(err, data) {
                        callback(err, data);
                    });
                },
                function(callback) {
                    var query = "SELECT Distinct on (dni.dni_setting_id) dni.dni_setting_id, camp.campaign_name,pp.keep_alive_mins, pr.provisioned_route_status, dou.org_unit_id, dou.dni_code, dou.custom_params, dni.destination_url, ";
                    query += "dni.referrer, dni.referrer_type, dni.dni_element, dni.dni_type, pr.provisioned_route_name, pr.provisioned_route_id, pn.number ";
                    query += "FROM " + table + " AS dni ";
                    query += "LEFT JOIN dni_org_unit AS dou ON (dni.org_unit_id = dou.org_unit_id) ";
                    query += "JOIN provisioned_route as pr ON (pr.provisioned_route_id = dni.provisioned_route_id) ";
                    query += "LEFT JOIN provisioned_route_number as prn ON (prn.provisioned_route_id = dni.provisioned_route_id) ";
                    query += "LEFT JOIN phone_number as pn ON (pn.number_id = prn.phone_number_id) ";
                    query += "JOIN campaign_provisioned_route AS cpr ON (cpr.provisioned_route_id = dni.provisioned_route_id) ";
                    query += "JOIN campaign AS camp ON (camp.campaign_id = cpr.campaign_id) ";
                    query += "LEFT JOIN phone_pool AS pp ON (pp.provisioned_route_id = dni.provisioned_route_id) ";
                    query += "WHERE dni.dni_active = true and dou.org_unit_id = " + ouid;
                    //if the user is not an admin they see campaigns that they are users or owners of for the current ou
                    if (userAccess !== 'undefined' && parseInt(userAccess) < 7) {
                        query += " AND camp.campaign_owner_user_id = " + userid;
                    }

                    if (provisionedRouteId !== 'undefined') {
                        query += " AND dni.provisioned_route_id = " + provisionedRouteId;
                    }
                    console.log(query);

                    appModel.ctPool.query(query, function(err, data) {
                        if (err) {
                            res(err);
                        } else {
                           // sss
                           // callback(err, data);
                            async.each(data, function(row, cb2) {
                                    //cb2();


                                    if (row.dni_type == 'session') {
                                        var qry = "SELECT pool_name, keep_alive_mins, pool_id FROM phone_pool WHERE provisioned_route_id = " + row.provisioned_route_id;
                                        appModel.ctPool.query(qry, function(err, mongoData) {
                                            if (err) {
                                                cb2(err);
                                            } else {
                                                         //console.log(mongoData);
                                                if (mongoData.length) {
                                                    row.number = mongoData[0].name;
                                                    row.dni_ttl = mongoData[0].keep_alive_mins;
                                                    row.pool_id = mongoData[0]._id;
                                                }
                                                cb2();
                                            }
                                        });
                                    } else {
                                         cb2();
                                    }
                                },
                                function(err) {
                                    callback(err, data); //parallel callback
                                });
                        }
                    });
                }
            ],
            function(err, results) {
                var result = [{ "dni_org_unit": results[0], "dni_settings": results[1] }];
                //console.log(results);
                res(err, result);
            });
    }
};


module.exports = dniSetting;
