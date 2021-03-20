var appModel = require('./appModel'),
    async = require('async'),
    ouModel = require('./orgUnitModel'),
    table = 'custom_source',
    ctTransactionModel = require('./ctTransactionModel'),
    functions = require('../functions/functions');

var customSourceModel = {
    // JAW fix where clause of query
    addCustomSource: function(ctTrans, data, res) {
        var customSourceData = {};
        async.each(data.customSourceList, function(item, callback) {
                customSourceData.provisioned_route_id = data.provisioned_route_id;
                if (item.custom_source_id !== undefined && item.custom_source_id !== '' && item.custom_source_type !== undefined) {
                    customSourceData.custom_source_id = item.custom_source_id;
                    customSourceData.custom_source_type = item.custom_source_type
                    var insertData = {
                        table: 'callflow_custom_source',
                        values: customSourceData
                    };
                    ctTrans.insert(insertData, function(err, data) {
                        if (err) { callback(err); }
                        callback();
                    });
                } else {
                    callback();
                }
            },
            function(err) {
                if (err) { res(err); }
                res();
            }
        );
    },
    updateCustomSource: function(ctTrans, data, res) {
        customSourceModel.delete(ctTrans, data, function(err, result) {
            if (err) { res(err); }
            customSourceModel.addCustomSource(ctTrans, data, function(err, result) {
                res(err, result);
            });
        });
    },
    delete: function(ctTrans, data, res) {
        var qry = "DELETE FROM callflow_custom_source ";
        qry += "WHERE provisioned_route_id = " + data.provisioned_route_id;
        ctTrans.query(qry, function(err, result) {
            if (err) { res(err); }
            res(err, result);
        });
    },
    getByOuid: function(req, res) {
        var ouid = parseInt(req.params.ouid);
        var user_access_id = parseInt(req.params.user_access_id);
        var ouModel = require('./orgUnitModel');
        var ous = [];
        ous.push(ouid);
        var custom_source_ous = [];
        var new_ouid = ouid;
        var include_parent_id = true;
        async.series([
            function(cb) {
                if (user_access_id == 7) {
                    var qry = "SELECT org_unit_parent_id FROM org_unit WHERE org_unit_id =" + ouid;
                    appModel.ctPool.query(qry, function(err, data) {
                        if (!err) {
                            if (data[0].org_unit_parent_id !== null) {
                                new_ouid = data[0].org_unit_parent_id;
                                include_parent_id = false;
                            }
                        }
                        cb(err);
                    });
                }
                cb(null);
            },
            function(cb) {
                ouModel.ouAndDescendents(new_ouid, function(ous1) {
                    if (ous === '') {
                        res('Invalid ouid.');
                        return;
                    }
                    custom_source_ous = ous1.split(",");
                    ous = custom_source_ous;
                    if (!include_parent_id) {
                        var index = custom_source_ous.indexOf(new_ouid.toString());
                        if (index > -1) {
                            custom_source_ous.splice(index, 1);
                        }
                    }
                    cb(null);
                });
            },
            function(cb) {
                ouModel.getAllParentOuIds(ouid, function(ous2) {
                    if (ous === '') {
                        res('Invalid ouid.');
                        return;
                    }
                    ous2 = ous2.split(",");
                    ous = _.union(ous, ous2);
                    ous = ous.map(function(ou) {
                        return parseInt(ou);
                    });
                    ous = _.intersection(ous, req.user.orglist);
                    if (ous.length < 1) {
                        ous = req.params.ouid;
                    }
                    var qry = "SELECT cs.custom_source_id, cs.custom_source_name,cs.custom_source_active, cs.org_unit_id "
                    qry += "FROM " + table + " cs "
                        // qry +="LEFT JOIN callflow_custom_source ccs ON (ccs.custom_source_id =cs .custom_source_id ) "
                    qry += "WHERE cs.org_unit_id  in (" + ous + ")" + "ORDER BY cs.custom_source_name"
                    appModel.ctPool.query(qry, function(err, data) {
                        jsonGetCustomSources(data, custom_source_ous, function(error, result) {
                            res(error, result);
                        });
                    });
                });
            }
        ]);
    },
    read: function(ouid, res) {
        var ouid = parseInt(ouid);
        ouModel.getAllParentOuIds(ouid, function(ouids) {
            ouids = ouids + "," + ouid;
            console.log("************ " + ouids);
            //var qry = "SELECT custom_source_id, custom_source_name, custom_source_type FROM custom_source WHERE org_unit_id IN ("+ouids+ ")";
            var qry = "SELECT custom_source_id,org_unit_id, custom_source_name, custom_source_type,custom_source_active FROM custom_source WHERE org_unit_id IN (" + ouids + ") AND custom_source_active = 't'";

            // console.log(qry);
            appModel.ctPool.query(qry, function(err, data) {
                if (err) { res(err); }
                return res(err, data);
            });
        });
    },
    getCustomSources: function(req, res) {
        var ouid = parseInt(req.params.ouid);
        var user_access_id = parseInt(req.params.user_access_id);
        customSourceModel.getByOuid(req, function(err, result) {
            if (err) { return res(err); }
            var csIds = _.map(result, function(cs, key) { return cs.custom_source_id; });
            var qry = "SELECT DISTINCT custom_source_id FROM callflow_custom_source WHERE custom_source_id IN (" + csIds + ")";
            if (csIds.length > 0) {
                appModel.ctPool.query(qry, function(err, data) {
                    if (err) { res(err); }
                    var response = [];
                    var data = _.map(data, function(cs, key) { return cs.custom_source_id; });
                    async.each(result, function(customSource, cb) {
                            if (data.indexOf(parseInt(customSource.custom_source_id)) > -1) {
                                customSource.isAssociated = true;
                            } else { customSource.isAssociated = false; }

                            if (customSource.custom_source_active) { response.push(customSource); }
                            cb(null);
                        },
                        function(err) {
                            return res(err, response);
                        }
                    );
                });
            } else {
                res(null, []);
            }
        });
    },
    getCustomSourcesByUserId: function(req, res) {
            var qry="SELECT DISTINCT (custom_source_name), custom_source_id, custom_source_type , max((CASE WHEN custom_source_active = 't' THEN 't' ELSE 'f' END)) AS custom_source_active FROM custom_source WHERE org_unit_id IN  ("+ req.user.orglist +") GROUP by 1,2 ORDER BY custom_source_name";
            //var qry = "SELECT custom_source_id,org_unit_id, custom_source_name, custom_source_type,custom_source_active FROM custom_source WHERE org_unit_id IN (" + req.user.orglist + ") ORDER by custom_source_name";
            // console.log(qry);
            appModel.ctPool.query(qry, function(err, data) {
                if (err) { res(err); }
                return res(err, data);
            });

    },
    create: function(custom_source_data, res) {
        var ctTrans = new ctTransactionModel.begin(function(err) {
            if (err) {
                res(err);
                return;
            }
            async.waterfall([
                    function(cb1) {

                        var qry = "SELECT * FROM custom_source"
                        qry += " WHERE org_unit_id = " + custom_source_data.org_unit_id + " AND LOWER(custom_source_name) = LOWER('" + functions.pg_escape_str(custom_source_data.custom_source_name) + "')"
                        qry += " AND custom_source_type = '" + functions.pg_escape_str(custom_source_data.custom_source_type) + "'";
                        qry += " AND custom_source_active = 't'";
                        ctTrans.query(qry, function(err, data) {
                            cb1(err, data);
                        });

                    },
                    function(data, cb1) {
                        console.log("welcome");
                        if (data.length === 0) {
                            var insertData = {
                                which: 'insert',
                                table: table,
                                values: custom_source_data
                            };
                            ctTrans.queryRet(insertData, function(err, data) {
                                var j = {
                                    custom_source_id: data.insertId
                                };
                                cb1(err, j);
                            });
                        } else if (data.length > 0 && !data[0].custom_source_active) {
                            var qry = "UPDATE " + table + " SET custom_source_active = true,org_unit_id = " + custom_source_data.org_unit_id + " WHERE LOWER(custom_source_name) = LOWER('" + functions.pg_escape_str(custom_source_data.custom_source_name) + "') And org_unit_id in (" + ous + ") ";
                            ctTrans.query(qry, function(err, dt) {
                                var j = {
                                    custom_source_id: data[0].custom_source_id
                                };
                                cb1(err, j);
                            });
                        } else if (data.length > 0 && data[0].custom_source_active) {
                            cb1("This Custom Source is already exists");
                        }
                    }
                ],
                function(err, results) {
                    if (err) {
                        ctTrans.rollback(function() {
                            res(err);
                        });
                    } else {
                        ctTrans.commit(function() {
                            res(null, results);
                        });
                    }
                });
        });
    },
    deleteCustomSource: function(arrCustomSourceIds, res) {
        // var query = "DELETE FROM custom_source WHERE custom_source_id IN (" + arrCustomSourceIds.join(',') + ");"
        var query = "UPDATE custom_source SET custom_source_active = 'f' WHERE custom_source_id IN (" + arrCustomSourceIds.join(',') + ");"
        appModel.ctPool.query(query, function(err, data) {
            if (err) {
                return res("error on deleteTag model query");
            } else {
                return res(null, "successful delete custom source");
            }
        })
    },
    deleteCustomSourceByProvisionedRoute: function(ctTransactPassedDown, arrCustomSourceIds, res) {
            var qry = "DELETE FROM callflow_custom_source WHERE provisioned_route_id in (" + arrCustomSourceIds.provisioned_route_id + ")";
            ctTransactPassedDown.query(qry, function(err) {
                if (err) { return res(err, "error on deleteTag model query"); } else {
                    return res(null, "successful delete custom source");
                }
            });
        }
        //deleteCustomSource: function(data, res){
        //	ctTransactionModel.begin(function(err){
        //		console.log('data is ' + JSON.stringify(data));
        //		var qry = "UPDATE " + table + " SET custom_source_active = false WHERE custom_source_id in (" + data.join(',') + ")";
        //		var qryData = {
        //			which: 'query',
        //			qry: qry
        //		};
        //		ctTransactionModel.query(qryData, function(err){
        //			if (err) {
        //               console.log("ERR in delete custom sources");
        //				ctTransactionModel.rollback(function(){
        //					res(err);
        //				});
        //			} else {
        //               console.log("deleted custom sources OK!");
        //				ctTransactionModel.commit(function(){
        //					res();
        //				});
        //			}
        //		});
        //	});
        //}
};

function jsonGetCustomSources(customSources, ous, res) {
    var response = [];
    async.each(customSources, function(customSource, cb) {
            customSource.isAssociated = false;
            if (customSource.provisioned_route_id) { customSource.isAssociated = true; }
            if (ous.indexOf(customSource.org_unit_id.toString()) > -1) {
                customSource.editable = true;
                response.push(customSource);
            } else {
                customSource.editable = false;
                response.push(customSource);
            }
            cb(null);
        },
        function(err) {
            res(err, response);
        }
    );
}

module.exports = customSourceModel;