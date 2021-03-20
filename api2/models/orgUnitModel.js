var mysql = require('mysql'),
    appModel = require('./appModel'),
    yaml = require("js-yaml"),
    f = require('../functions/functions.js'),
    fs = require("fs"),
    e = yaml.load(fs.readFileSync("config/database.yml")),
    envVar = process.env.NODE_ENV,
    async = require('async'),
    geoCoder = require('../lib/geoCoder'),
    billingModel = require('../models/billingModel'),
    table = 'org_unit',
    blacklist_table='ce_blacklist',
    _ = require("underscore"),
    ctlogger = require("../lib/ctlogger.js"),
    userModel = require("./ctUserModel"),
    webhookModel = require("../models/webhookModel"),
    dniSettingModel = require('../models/dniSettingModel'),
    ctTransactionModel = require('./ctTransactionModel'),
    ceTransactionModel = require('./ceTransactionModel'),
    userPermissionsLog = require('./userPermissionsLog'),
    zuoraController = require('../controllers/zuoraController'),
    moment             = require("moment"),
    q = require("q");
var token = require('../lib/token');

var orgUnit = {
    setOrgAccountComponent: function(req,callback) {
        //// FOR AMP3 USE DO NOT CHANGE IT ////
        console.log("req "+JSON.stringify(req.body))

        var allowedComponents = [927];
        var componentId = parseInt(req.body.component_id);
        var ouid = parseInt(req.body.org_unit_id);
        
        if (allowedComponents.indexOf(componentId) < 0) {
            return callback('This component is not set up yet',null);
        }

        

        async.series([
            function(cb){
                //// Need to check that this is billing id
                qry = "SELECT org_unit_id FROM org_unit WHERE billing_id = "+ouid+";";
                 appModel.ctPool.query(qry, function(err, results) {
                    if (err) {return cb(err);}
                    if (results.length > 0) {
                        cb(null);
                    } else {
                        cb('Ouid is not billing ou');
                    }
                });
            },
            function(cb){
                //// Now check if component already set
                qry = "SELECT org_unit_id FROM org_account WHERE org_unit_id = "+ouid+" AND component_id = "+componentId+";";
                 appModel.ctPool.query(qry, function(err, results) {
                    if (err) {return cb(err);}
                    if (results.length > 0) {
                        cb('Component is already set for this ou');
                    } else {
                        cb(null);
                    }
                });
            },
            function(cb){
                //// Finally set org account for this component
                console.log("Creating org account for ouid: "+ouid+" component id: "+componentId);
                var ctTrans = new ctTransactionModel.begin(function(err) {
                    var qry = "INSERT INTO org_account (org_unit_id,component_id,account_created,threshold_max)";
                    qry += " VALUES ("+ouid+","+componentId+",NOW(),0);";
                    var insertData = {
                        which: 'query',
                        qry: qry
                    };
                    ctTrans.query(insertData, function(err, d) {
                        if (err){ 
                            ctTrans.rollback(function(){
                                cb(err);
                            });                            
                        } else {
                            ctTrans.commit(function(){
                                cb(null);
                            });
                        }
                    });
                });
            }
        ],
        function(err){
            callback(err,[])
        });
    },
    hasManualScorecard: function(ouid,callback) {
        //// FOR AMP3 USE DO NOT CHANGE IT ////
        qry = "SELECT account_id FROM org_account WHERE org_unit_id = "+ouid+" AND component_id = 927;";
         appModel.ctPool.query(qry, function(err, results) {
            if (results.length > 0) {
                callback(err,true);
            } else {
                callback(err,false);
            }
        });
    },
    setOrgAllowAdminByOuid: function(req, callback) {
        var qry = "UPDATE org_billing SET allow_admin = true WHERE org_unit_id = " + req.body.org_unit.org_unit_id;
        appModel.ctPool.query(qry, function(err, results) {
            callback(err, results);
        });
    },
    getOrgAllowAdminByOuid: function(req, callback) {
        var qry = "SELECT allow_admin FROM org_billing AS ou WHERE ou.org_unit_id = " + req.params.ouid;
        appModel.ctPool.query(qry, function(err, results) {
            callback(err, results);
        });
    },
    create: function(req, res, ctTrans) {
        var data = req.body.orgUnit;
        var oudata = [];
        oudata.org_unit_name = data.org_unit_name;
        if (data.org_unit_ext_id) oudata.org_unit_ext_id = data.org_unit_ext_id;
        if (data.org_unit_parent_id) oudata.org_unit_parent_id = data.org_unit_parent_id;
        oudata.org_unit_status = 'active';

        if(!ctTrans){
            ctTrans = appModel.ctPool;
        }
        // get parent billing node
        billingModel.getBillingNode(null, oudata.org_unit_parent_id, function(err, billid) {
            if (err) { return res(err); }
            if (billid) {
                oudata.billing_id = billid;
            }
            var insertData = {
                table: table,
                values: oudata
            };
            ctTrans.insert(insertData, function(err, retData) {
                var ousdata = [];
                ousdata.org_unit_created = 'CURRENT_TIMESTAMP';
                ousdata.org_unit_id = retData.insertId;
                oudata.org_unit_id = retData.insertId;
                if (data.address) ousdata.address = data.address;
                if (data.city) ousdata.city = data.city;
                if (data.state) ousdata.state = data.state;
                if (data.zip) ousdata.zip = data.zip;
                if (data.phone_number) ousdata.phone_number = data.phone_number;
                if (data.industry_id) ousdata.industry_id = data.industry_id;
                if (data.custom_layout) ousdata.custom_layout = data.custom_layout;
                if (err) {
                    console.log('Insert error: ' + err);
                    return res(err);
                }
                orgUnit.getAllUser(oudata, function(err, userIds) {
                    if (err) {
                        console.log('Select User error: ' + err);
                        return res(err);
                    }
                    var userIds = _.pluck(userIds, 'ct_user_id');
                    var ou = parseInt(retData.insertId);

                    var ous = [];

                    if (req.user !== undefined && req.user.orglist !== undefined) {
                        ous = req.user.orglist;
                    }
                    ous.push(ou);
                    
                    // var ouids = ous.length > 0 ? "ARRAY["+ous+"]" : "'{}'";
                    // var reports = _.pluck(req.user.reports,"report_id");
                    // reports = reports.length > 0 ? "ARRAY["+reports+"]" :"'{}'";
                    // var score_call = false;
                    // var access_audio = true;

                    if (userIds.length > 0) {
                        var updateQry = "UPDATE user_permissions SET groups_list = array_cat(groups_list, ARRAY[" + ou + "]), updated_by = "+ req.user.user_id +", updated_on = CURRENT_TIMESTAMP WHERE ct_user_id IN (" + userIds + ")";
                        ctTrans.query(updateQry, function(err) {
                            userPermissionsLog.addNewGroupToUsersLog(req.user, ou, userIds, function(err){
                                if(err){ console.log("Error In User Permissions Bulk Log For : ", userIds, ' ERROR : '+err);}else{
                                    console.log("Inserted User Permissions Bulk Log For Group: ", ou);
                                } 
                            });
                            if (err) { return res(err, "error"); }
                        });
                    }
                    // update the billing node to itself if no billing node is identified and set top level OU to itself
                    if (req.headers.authorization !== undefined) {
                        token.updateOuList(req, ous, function(err, retData) {
                            if (err) { return res(err); }
                        });
                    }

                    if (!billid) {
                        var updateData = {
                            table: 'org_unit',
                            values: { 'billing_id': retData.insertId },
                            where: " WHERE org_unit_id=" + retData.insertId
                        };
                        console.log('Setting billing ID to self - ' + retData.insertId);
                        ctTrans.update(updateData, function(err) {
                            if (err) {
                                return res('Failed to update org unit billing node');
                            }
                        });
                    }
                   

                    // insert the org_unit_detail record
                    var insertData = {
                        table: 'org_unit_detail',
                        values: ousdata
                    };

                    ctTrans.insert(insertData, function(err) {
                        if (err) {
                            return res(err);
                        }
                        //lookup and set top level ou
                        orgUnit.setTopOuId(retData.insertId, function(err, topOu) {
                            if (err) {
                                res(err);
                                return;
                            }

                            if (billid) {
                                billingModel.copyBilling(retData.insertId, billid, function(err) {
                                    if (err) {
                                        res(err);
                                    } else {
                                        if (oudata.org_unit_parent_id && oudata.org_unit_parent_id!=''){
                                            var qry="select distinct number from ce_blacklist where org_unit_id = "+ oudata.org_unit_parent_id;
                                            ctTrans.query(qry, function (err, result) {
                                                if (err) {
                                                    return res(err, "New group is not able to search blacklisted numbers from parent group");
                                                }
                                                else {
                                                    if(result.length > 0){
                                                        query = "INSERT INTO " + blacklist_table + "(number, action, org_unit_id, billing_id, by_billing_id, status) VALUES";
                                                        _.each(result, function (err, id) {
                                                            query += " (" + result[id].number + ",'block', " + ou + ", " + oudata.billing_id + ", 0, 1),";
                                                        });
                                                        //removed last comma
                                                        query = query.replace(/,\s*$/, "");
                                                        ctTrans.query(query, function (err, result) {
                                                            if (err) {
                                                                res("Unable to insert Caller ID in New group");
                                                            }
                                                            else {
                                                                res(null, retData);
                                                            }
                                                        });
                                                    }else{
                                                        res(null, retData);
                                                    }
                                                }
                                            });
                                        }else{
                                            res(null, retData);
                                        }
                                    }
                                }, ctTrans);
                            } else {
                                res(null, retData);
                            }
                        }, ctTrans);
                    });
                });
            });
        });
    },
    getAllUser: function(data, res) {
        var ous = [];
        if (data.org_unit_id) ous.push(data.org_unit_id);
        if (data.org_unit_parent_id) ous.push(data.org_unit_parent_id);
        if (data.billing_id) ous.push(data.billing_id);
        if (data.org_unit_parent_id === undefined || data.org_unit_parent_id === null || data.org_unit_parent_id === '') {
            var qry = "SELECT cu.ct_user_id FROM ct_user cu JOIN user_permissions up ON (cu.ct_user_id=up.ct_user_id) WHERE cu.ct_user_ou_id IN( " + ous + " )";
        } else {
            var qry = "SELECT cu.ct_user_id FROM ct_user cu JOIN user_permissions up ON (cu.ct_user_id=up.ct_user_id) WHERE " + data.org_unit_parent_id + " = ANY(groups_list) ";
        }
        appModel.ctPool.query(qry, function(err, userIds) {
            res(null, userIds);
        });
    },
    update: function(data, res) {
        var oudata = [];
        oudata.org_unit_id = data.org_unit_id;
        if (data.org_unit_ext_id !== undefined) oudata.org_unit_ext_id = data.org_unit_ext_id;
        if (data.org_unit_name) oudata.org_unit_name = data.org_unit_name;
        if (data.org_unit_parent_id) oudata.org_unit_parent_id = data.org_unit_parent_id;
        if (data.org_unit_status) oudata.org_unit_status = data.org_unit_status;
        // NOTE:  currently it is not allowed to change to a different billing node - should that change, logic will need to be added here
        var updateData = {
            table: table,
            values: oudata
        };
        //console.log(insertData);
        appModel.ctPool.update(updateData, function(err, retData) {
            if (err) {
                res(err);
                return;
            }
            //console.log(data);
            //var date_timestamp = f.mysqlTimestamp();
            var ousdata = [];
            ousdata.org_unit_modified = 'CURRENT_TIMESTAMP';
            if (data.address) ousdata.address = data.address;
            ousdata.city = data.city;
            if (data.state) ousdata.state = data.state;
            ousdata.zip = data.zip;
            ousdata.phone_number = data.phone_number;
            if (data.industry_id) ousdata.industry_id = data.industry_id;
            if (data.custom_layout) ousdata.custom_layout = data.custom_layout;
            var updateData = {
                table: 'org_unit_detail',
                values: ousdata,
                where: ' where org_unit_id = ' + data.org_unit_id
            };
            appModel.ctPool.update(updateData, function(err, retData2) {
                if (err) {
                    res(err);
                    return;
                }
                // update the top level OU value
                orgUnit.setTopOuId(data.org_unit_id, function(err, topOu) {
                    if (err) {
                        res(err);
                    } else {
                        res(null, retData);
                    }
                });
            });
        });
    },
    checkDuplicateExternalId: function(ouData, res, ctTrans) {
        if (!ctTrans)
            ctTrans = appModel.ctPool;
        var query = "SELECT org_unit_id FROM " + table + " WHERE org_unit_status <> 'deleted' AND org_unit_ext_id = '" + ouData.org_unit_ext_id + "' AND billing_id = " + ouData.billing_id;
        ctTrans.query(query, function(err, data) {
            if (err) {
                res(err, null);
            }
            if (data && data.length > 0) {
                if (ouData.org_unit_id && ouData.org_unit_id == data[0].org_unit_id && data.length === 1) {
                    res(null, true);
                } else {
                    res('External ID is already in use');
                }
            } else {
                res(null, true);
            }
        });
    },
    getAll: function(res) {
        var query = "SELECT org_unit_id,org_unit_name FROM " + table + " ORDER BY org_unit_name ASC";
        appModel.ctPool.query(query, function(err, data) {
            if (err)
                res(err)
            else
                res(null, data);
        });
    },
    setShoutPointMigrated: function(req, callback) {
        //For AMP3 Use DO NOT CHANGE

        if (!req.body.isMigrated) {
            return callback("Sorry amigo, you can't set back to old ui");
        }

        var billingOuid = req.body.billingOuid;
        var isMigrated = req.body.isMigrated;

        var qry = "UPDATE org_billing SET is_migrated = "+isMigrated+" WHERE org_unit_id = "+billingOuid;

        var trans = new ctTransactionModel.begin(function(err){
            if (err) {return callback(err)}

            trans.query(qry,function(err,data){
                if (err) {
                    trans.rollback(function(er){
                        callback(err);
                    });
                } else {
                    trans.commit(function(err){
                        callback(err);
                    });
                }
            });
        });
    },
    getByIdInternal: function(req, callback) {
        //For AMP3 Use DO NOT CHANGE

        // var qry = "SELECT * FROM " + table + " AS ou";
        // qry += " JOIN org_unit_detail AS oud ON (oud.org_unit_id = ou.org_unit_id)";
        // qry += " LEFT JOIN org_billing AS oub ON (oub.org_unit_id = ou.org_unit_id)";
        // qry += " WHERE ou.org_unit_id = " + req.params.id;

        var qry = "SELECT ou.org_unit_id,ou.org_unit_ext_id,ou.org_unit_name,ou.org_unit_parent_id,ou.top_ou_id,ou.org_unit_status,ou.billing_id,ou.s3_exp_hr,ou.protect_caller_id,ou.api_key,ou.api_secret";
        qry += ",oud.address,oud.city,oud.state,oud.zip,oud.phone_number,oud.industry_id,oud.custom_layout,oud.org_unit_created,oud.org_unit_modified";
        qry += ",oub.activation_date,oub.cycle_start,oub.cycle_end,oub.billing_account_id,oub.prev_invoice_date,oub.prev_invoice_amount,oub.data_append,oub.allow_admin,oub.billing_code,oub.payment_date,oub.account_code,oub.is_sip_check_date";
        qry += ",oub2.is_migrated";
        qry += " FROM " + table + " AS ou";
        qry += " JOIN org_unit_detail AS oud ON (oud.org_unit_id = ou.org_unit_id)";
        qry += " LEFT JOIN org_billing AS oub ON (oub.org_unit_id = ou.org_unit_id)";
        qry += " LEFT JOIN org_billing AS oub2 ON (oub2.org_unit_id = ou.billing_id)";
        qry += " WHERE ou.org_unit_id = " + req.params.id;

        // console.log(query);
        appModel.ctPool.query(qry, function(err, data) {
            callback(err, data);
        });
    },
    setMigrationAccount: function(req, callback) {
        //For AMP3 Use DO NOT CHANGE
        console.log("++++ req body "+JSON.stringify(req.body))
        
        var billingId = req.body.billing_id;
        var isMigrationDone = req.body.is_migration_done;

        var ctTrans = new ctTransactionModel.begin(function(err) {
            var qry = "SELECT * FROM migration_account WHERE billing_id = "+billingId;
            ctTrans.select(qry,function(err,data){
                if (data.length < 1) {
                    qry = "INSERT INTO migration_account (billing_id,is_migration_done,created_on)";
                    qry += " VALUES ("+billingId+","+isMigrationDone+",now())";
                    ctTrans.query(qry,function(err,d){
                        ctTrans.commit(function(err){
                            callback(err,d);
                        });
                    })
                } else {
                    qry = "UPDATE migration_account SET is_migration_done = "+isMigrationDone+" WHERE billing_id = "+billingId;
                    ctTrans.query(qry,function(err,d){
                        ctTrans.commit(function(err){
                            callback(err,d);
                        });
                    })
                }
            });
        });
    },
    read: function(data, check_pro_caller_id, res) {
        //TODO: validate and sanitize data before running query.
        var whereClause = " WHERE org_unit_status != 'deleted' ";
        var orderByClause = " ORDER BY ou.org_unit_name ";
        //console.log(data);
        if (data.org_unit_name) whereClause += " AND org_unit_name = '" + data.org_unit_name + "' ";
        if (data.org_unit_parent_id) whereClause += " AND org_unit_parent_id = '" + data.org_unit_parent_id + "' ";
        if (data.org_unit_id) whereClause += " AND ou.org_unit_id = '" + data.org_unit_id + "' ";
        if (data.org_unit_ext_id) whereClause += " AND org_unit_ext_id = '" + data.org_unit_ext_id + "' ";

        var query = "SELECT * FROM " + table + " ou ";
        query += "JOIN org_unit_detail oud ON (oud.org_unit_id = ou.org_unit_id) ";
        query += whereClause;
        query += orderByClause;
        // console.log(query);
        appModel.ctPool.query(query, function(err, ctData) {
            var ctOuData = [];
            async.each(ctData, function(ouData, cb) {
                if (data.orgList.indexOf(ouData.org_unit_id) > -1) {
                    ctOuData.push(ouData);
                }
                cb(null);
            }, function(err) {
                if (err) { return res(err); }
                if (!(_.isEmpty(ctOuData))) {
                    if (check_pro_caller_id) {
                        userModel.getProtectCallerIdByOuId(ctOuData[0].org_unit_id, function(err, proCallerData) {
                            ctOuData[0].protect_caller_id = proCallerData.protect_caller_id;
                            res(ctOuData);
                        });
                    } else {
                        res(ctOuData);
                    }
                } else {
                    res(ctOuData);
                }
            });
        });
    },
    in: function(ids,res){
    	//For AMP3 Use DO NOT CHANGE
    	var query = "SELECT org_unit_id FROM org_unit WHERE org_unit_id in ("+ids+") AND org_unit_status = 'active';";
		appModel.ctPool.query(query, function (err, data) {
			if(err)
				res(err)
			else
			res(null,data);
		});
    },
    delete: function(req, callback) {
        var sourcesTOBeDeleted = req.body.custom_source.join();
        var qry = "DELETE FROM " + table + " WHERE custom_source_id IN (" + sourcesTOBeDeleted + ")";
        appModel.ctPool.query(qry, function(err, data) {
            callback(err, data);
        });
    },
    ouAndDescendents: function(ouid, res) {
        var qry = "select org_unit_id from " + table + " where org_unit_id = " + ouid + " or org_unit_parent_id = " + ouid + " ";
        qry += " or org_unit_parent_id IN(select org_unit_id from " + table + " where org_unit_parent_id = " + ouid + ")";
        //console.log(qry);
        appModel.ctPool.query(qry, function(err, data) {
            var ouList = [];
            //loop and put in array
            for (var key in data) {
                //console.log(data[key].org_unit_id);
                ouList.push(data[key].org_unit_id);
            }
            //join array to a list
            ouList = ouList.join(",");
            //console.log(ouList);
            res(ouList);
        });
    },
    ouAndDescendentsInternal: function(ouid, res) {
        var qry = "SELECT ou.org_unit_id AS id, ou.org_unit_ext_id AS external_id, ou.org_unit_name AS name, ou.org_unit_parent_id AS parent, oud.city, oud.state, oud.zip, oud.industry_id";
        qry += " FROM " + table + " AS ou";
        qry += " JOIN org_unit_detail AS oud ON oud.org_unit_id = ou.org_unit_id";
        qry += " WHERE (ou.org_unit_id = " + ouid + " OR ou.billing_id = " + ouid + ")";
        qry += " AND ou.org_unit_status = 'active'";
        qry += " order by ou.org_unit_id";
        //console.log(qry);
        appModel.ctPool.query(qry, function(err, data) {
            res(err, data);
        });
    },
    topOuDescendentsInternal: function(ouid, res) {
        var qry = "SELECT ou.org_unit_id,ou.org_unit_name,ou.top_ou_id,ou.billing_id";
        qry += " FROM org_unit AS ou";
        qry += " where ou.top_ou_id = (select top_ou_id from org_unit as ou1 where ou1.org_unit_id = " + ouid + ")";
        qry += " AND ou.org_unit_status = 'active'";
        qry += " ORDER BY ou.org_unit_name ASC;";
        //console.log(qry);
        appModel.ctPool.query(qry, function(err, data) {
            res(err, data);
        });
    },
    getById: function(ou_id, res) {
        var qry = "SELECT ou.*,od.industry_id, id.industry_name FROM " + table + " AS ou"
        qry += " JOIN org_unit_detail AS od ON od.org_unit_id = ou.org_unit_id"
        qry += " LEFT JOIN industry AS id ON id.industry_id = od.industry_id"
        qry += " WHERE ou.org_unit_id = " + ou_id;

        appModel.ctPool.query(qry, function(err, data) {
            res(err, data);
        });
    },
    ouDetailById: function(ou_id, res) {
        var qry = "SELECT *";
        qry += " FROM org_unit AS ou";
        qry += " LEFT JOIN org_unit_detail AS oud ON oud.org_unit_id = ou.org_unit_id";
        qry += " WHERE ou.org_unit_id = " + ou_id;
        appModel.ctPool.query(qry, function(err, data) {
            res(err, data);
        });
    },
    setTopOuId: function(ouid, res, ctTrans) {
        if (!ctTrans)
            ctTrans = appModel.ctPool;
        var topOuId = null; //variable to hold top ou when found
        var qry = "SELECT o.org_unit_parent_id AS ouid1, o1.org_unit_parent_id AS ouid2, o2.org_unit_parent_id AS ouid3 ";
        qry += "FROM org_unit o LEFT JOIN org_unit o1 ON (o.org_unit_parent_id=o1.org_unit_id AND o.org_unit_parent_id IS NOT NULL) ";
        qry += "LEFT JOIN org_unit o2 ON (o1.org_unit_parent_id=o2.org_unit_id) WHERE o.org_unit_id=" + ouid;
        ctTrans.query(qry, function(err, data) {
            if (err) {
                res('Failed to execute search to find top level parent');
                return;
            }
            if (data[0].ouid3) {
                topOuId = data[0].ouid3;
            } else if (data[0].ouid2) {
                topOuId = data[0].ouid2;
            } else if (data[0].ouid1) {
                topOuId = data[0].ouid1;
            } else {
                topOuId = ouid;
            }

            var updateData = {
                table: table,
                values: { 'top_ou_id': topOuId },
                where: ' WHERE org_unit_id=' + ouid
            };
            ctTrans.update(updateData, function(err, data2) {
                if (err) {
                    res('Failed to update org unit record with top level OUID');
                } else {
                    res(null, topOuId);
                }
            });
        });


        /*var topOuId = null; //variable to hold top ou when found
         var parent_test = true; //variable for loop test
         //if parent id is set we need to find the top level ou
         if(org_unit_parent_id) {
         async.whilst(
         function () { return parent_test },
         function (callback) {
         var qry = "SELECT org_unit_id, org_unit_parent_id FROM org_unit WHERE org_unit_id ="+org_unit_parent_id;
         appModel.ctPool.query(qry, function(err, data) {
         //if parent id is null we found the top ou
         if(data[0].org_unit_parent_id == null) {
         topOuId = org_unit_parent_id;
         parent_test = false;
         }
         else {
         //if not null take the next parent id for the next query
         org_unit_parent_id = data[0].org_unit_parent_id;
         }
         callback();
         });
         },
         function (err) {
         if(err) {
         console.log(err);
         return;
         }
         res(topOuId);
         }
         );
         } else {
         //else we just return itself
         res(ouid);
         }
         */
    },
    getAllParentAndSiblingOuIds: function(ouid, res) {
        var OuParents = [];
        if (ouid) {
            var qry = "SELECT org_unit_id, org_unit_parent_id, top_ou_id  FROM org_unit WHERE org_unit_id =" + ouid;
            appModel.ctPool.query(qry, function(err, data) {
                    if(err){ return res(err); }
                    if (data[0].org_unit_parent_id !== null) {
                        OuParents.push(data[0].org_unit_parent_id);
                    }
                    if (data[0].top_ou_id !== null) {
                        OuParents.push(data[0].top_ou_id);
                    }
                    if(data.length && data[0].org_unit_parent_id !== null){
                        var qry = "SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id =" + data[0].org_unit_parent_id;
                        appModel.ctPool.query(qry, function(err, subOus) {
                            if(err){ return res(err); }
                            if(subOus.length > 0){
                                async.each(subOus,function(d, cb){
                                    OuParents.push(d.org_unit_id);
                                    cb(null);
                                },function(err){
                                    OuParents = OuParents.join(",");
                                    res(OuParents);                                        
                                });
                            }else{
                                OuParents = OuParents.join(",");
                                res(OuParents);
                            } 
                        });
                    }else{
                        OuParents = OuParents.join(",");
                        res(OuParents);
                    }                    
            });
        } else {
            //else we just return itself
            res(ouid);
        }
    },
	getAllParentOuIds: function(ouid, res) {
        var OuParents = [];
        if (ouid) {
            var qry = "SELECT org_unit_id, org_unit_parent_id, top_ou_id  FROM org_unit WHERE org_unit_id =" + ouid;
            appModel.ctPool.query(qry, function(err, data) {
                    if(err){ return res(err); }
                    if (data[0].org_unit_parent_id !== null) {
                        OuParents.push(data[0].org_unit_parent_id);
                    }
                    if (data[0].top_ou_id !== null) {
                        OuParents.push(data[0].top_ou_id);
                    }
                    OuParents = OuParents.join(",");  
					res(OuParents);					
            });
        } else {
            //else we just return itself
            res(ouid);
        }
    },
    ouLocations: function(ouid, res) {
        var done = false;
        var count = 0;
        var ous = [];
        var parent_ids = [];
        async.until(
            function() {
                return done;
            },
            function(callback) {
                count++;
                var qry = "SELECT ou.org_unit_id, ou.org_unit_name, ou.org_unit_parent_id";
                qry += ", oud.address, oud.state, oud.city, oud.zip, oud.phone_number";
                qry += " FROM " + table + " AS ou";
                qry += " LEFT JOIN org_unit_detail AS oud ON ou.org_unit_id = oud.org_unit_id";
                if (parent_ids.length < 1) {
                    qry += " WHERE ou.org_unit_id = " + ouid;
                } else {
                    qry += " WHERE ou.org_unit_parent_id IN (" + parent_ids + ")";
                }
                qry += " AND ou.org_unit_status = 'active'";

                appModel.ctPool.query(qry, function(err, data) {
                    parent_ids = [];
                    if (err) {
                        callback(err);
                        return;
                    }
                    async.each(data, function(d, cb) {
                            parent_ids.push(d.org_unit_id);
                            if (d.address && d.city && d.state && d.zip && d.phone_number) {
                                ous.push(d);
                            }
                            cb();
                        },
                        function(err) {
                            if (count > 10 || parent_ids.length < 1) done = true;
                            callback(err);
                        });
                });

            },
            function(err) {
                res(err, ous);
            });
    },
    // meta data being number of correlated  ORG UNITS, USERS, and CAMPAIGNS
    getSelfAndChildrenMetaData: function(selfOuId, res) {
        var selfAndChildrenMetaData = {};
        // OU is not included in this hash because it needs its own query and not one based off the query builder
        var qryConfigs = {
            users: {
                primKey: "ct_user_id",
                tableName: "ct_user",
                ouIdForeignKey: "ct_user_ou_id",
                status: "user_status",
                statusType: "enum",
                logTableName: "user"
            },

            provRoutes: {
                primKey: "provisioned_route_id",
                tableName: "provisioned_route",
                ouIdForeignKey: "provisioned_route_ou_id",
                status: "provisioned_route_status",
                statusType: "enum",
                logTableName: "call_flow"
            },

            campaigns: {
                primKey: "campaign_id",
                tableName: "campaign",
                ouIdForeignKey: "campaign_ou_id",
                status: "campaign_status",
                statusType: "enum",
                logTableName: "campaign"
            },

            webHooks: {
                primKey: "webhook_id",
                tableName: "webhook",
                ouIdForeignKey: "org_unit_id",
                status: "webhook_status",
                statusType: "enum",
                logTableName: "webhook"
            },

            dniSettings: {
                primKey: "dni_setting_id",
                tableName: "dni_setting",
                ouIdForeignKey: "org_unit_id",
                status: "dni_active",
                statusType: "bool",
                logTableName: "ivr"
            },

            tags: {
                primKey: "tag_id",
                tableName: "tag",
                ouIdForeignKey: "org_unit_id",
                status: "tag_active",
                statusType: "bool",
                logTableName: "tag"
            }
            // scoreCards: {
            //     primKey: "score_card_id",
            //     tableName: "score_cards",
            //     ouIdForeignKey: "org_unit_id",
            //     status: "scorecard_status",
            //     statusType: "enum",
            //     logTableName: "score_cards"
            // }


        };

        var beginningOfQry = _.template(
            "SELECT COUNT(org_unit_id) " +
            "FROM org_unit " +
            "WHERE org_unit_status != 'deleted' AND (org_unit_id = <%= selfOuId %> OR org_unit_parent_id = <%= selfOuId %>) "
        )({ selfOuId: selfOuId });

        var subQueryForOUtoDelete = _.template(
            "SELECT org_unit_id FROM org_unit WHERE org_unit_id = <%= selfOuId %> OR org_unit_parent_id = <%= selfOuId %>"
        )({ selfOuId: selfOuId });

        var valueToDenoteDeleted = {
            "enum": "'deleted'",
            "bool": "FALSE"
        };

        function countQueryBuilder(queryConfigParams) {

            queryConfigParams.ouToDeleteSubQry = subQueryForOUtoDelete;
            /*if(queryConfigParams.tableName == "dni_setting") {
		 		queryConfigParams.ouToDeleteSubQry = "SELECT dni_org_unit_id FROM dni_org_unit WHERE org_unit_id IN ( "+ queryConfigParams.ouToDeleteSubQry +" )";
			}*/
            queryConfigParams.valueForDeleted = valueToDenoteDeleted[queryConfigParams.statusType];

            return _.template(
                "UNION ALL " +
                "(SELECT COUNT(<%= primKey %>) " +
                "FROM <%= tableName %> " +
                "WHERE <%= status %> != <%= valueForDeleted %> AND " +
                "<%= ouIdForeignKey %> IN (<%= ouToDeleteSubQry %>)) "
            )(queryConfigParams);
        }


        var restOfQuery = _.map(qryConfigs, function(qryConfig) {
            return countQueryBuilder(qryConfig);
        }).join("");

        var entireQuery = beginningOfQry + restOfQuery;

        async.parallel([
                function(cb) {
                    appModel.ctPool.query(entireQuery, function(err, data) {
                        if (err || !data) {
                            cb(err);
                        } else {
                            selfAndChildrenMetaData['orgUnitCount'] = data[0].count;
                            selfAndChildrenMetaData['userCount'] = data[1].count;
                            selfAndChildrenMetaData['callFlowCount'] = data[2].count;
                            selfAndChildrenMetaData['campaignCount'] = data[3].count;
                            selfAndChildrenMetaData['webhookCount'] = data[4].count;
                            selfAndChildrenMetaData['dniCount'] = data[5].count;
                            selfAndChildrenMetaData['tagCount'] = data[6].count;
                            //  selfAndChildrenMetaData['scoreCardCount'] = data[7].count;
                            cb();
                        }
                    });
                },
                function(cb) {
                    var reserverNumberqry = "SELECT COUNT(DISTINCT pn.number_id) as reservedCount FROM org_unit ou " +
                        "JOIN phone_detail pd ON pd.org_unit_id = ou.org_unit_id " +
                        "JOIN phone_number pn ON pn.number_id = pd.number_id AND pn.number_status ='reserved' " +
                        "LEFT JOIN org_component oc ON (oc.number_id = pn.number_id) " +
                        "Where (ou.org_unit_id = " + selfOuId + " OR org_unit_parent_id = " + selfOuId + " OR org_unit_parent_id = " + selfOuId + ") AND oc.number_id IS NULL "
                    appModel.ctPool.query(reserverNumberqry, function(err, data) {
                        if (err || !data) {
                            cb(err);
                        } else {
                            selfAndChildrenMetaData['reservedCount'] = data[0].reservedcount;
                            cb();
                        }
                    });
                },
                function(cb) {
                    var reserverPremiumNumberqry = "SELECT COUNT(DISTINCT pn.number_id) as reservedPremiumCount FROM org_unit ou " +
                        "JOIN phone_detail pd ON pd.org_unit_id = ou.org_unit_id " +
                        "JOIN phone_number pn ON pn.number_id = pd.number_id AND pn.number_status ='reserved' " +
                        "JOIN org_component oc ON(pn.number_id = oc.number_id) " +
                        "Where (ou.org_unit_id = " + selfOuId + " OR org_unit_parent_id = " + selfOuId + " OR org_unit_parent_id = " + selfOuId + ")";
                    appModel.ctPool.query(reserverPremiumNumberqry, function(err, data) {
                        if (err || !data) {
                            cb(err);
                        } else {
                            selfAndChildrenMetaData['reservedPremiumCount'] = data[0].reservedpremiumcount;
                            cb();
                        }
                    });
                },

                function(cb) {
                    var org_unit_parent_id = "SELECT org_unit_parent_id FROM org_unit WHERE org_unit_id = " + selfOuId;
                    appModel.ctPool.query(org_unit_parent_id, function(err, data) {
                        var ouParentId = data[0].org_unit_parent_id;
                        var scoreCardCountQuery = "SELECT COUNT(DISTINCT sc.score_card_id) as scoreCardCount FROM org_unit ou ";
                        scoreCardCountQuery += "JOIN score_cards sc ON sc.org_unit_id = ou.org_unit_id ";
                        scoreCardCountQuery += " Where (ou.org_unit_id = " + selfOuId + " OR ou.org_unit_parent_id = " + selfOuId + ") AND sc.scorecard_status !='deleted'";
                        appModel.ctPool.query(scoreCardCountQuery, function(err, data) {
                            if (err || !data) {
                                cb(err);
                            } else {
                                selfAndChildrenMetaData['scoreCardCount'] = data[0].scorecardcount;
                                cb();
                            }
                        });
                    });
                },
            ],
            function(err) {
                if (err) {
                    res(err, {});
                } else {
                    res(err, selfAndChildrenMetaData);
                }
            }); //async parallel
    },
    // DOES NOT WORK ON TOP LEVEL OU
    deleteComponentsOfOuAndChildren: function(req, res, ctTransacPassedIn) {
        var tagModel = require("../models/tagModel"); // commented out because it was causing a circular dependency
        var selfOuId = req.params.id;
        var parent_ou_id = req.params.parent_ou;
        var parentOU = [];
        var arrCampIdsToDelete = [];
        var provisioned_route_id = [];
        // Purpose of query is to find out if our org_unit in question has a parent OU.
        // if it does, then we're good to proceed. If we get a null parent, then we're at
        // the top level and should escape out of this procedure
        var isMiddleOrLowerOuQuery = "" +
            "SELECT o2.* " +
            "FROM org_unit o1 " +
            "LEFT JOIN org_unit o2 on (o1.org_unit_parent_id = o2.org_unit_id) " +
            "WHERE o1.org_unit_id = " + selfOuId;
        appModel.ctPool.query(isMiddleOrLowerOuQuery, function(err, data) {
            if (err) {
                return res(err);
            }else if (data[0].org_unit_id === null) {
                return res("can't delete top level ou", data);
            }
            // is NOT a TOP level node. yay.
            // we need to pass this back
            parentOU.push(data[0]);
            // We know we're at a level 2 or lower OU, so let's the ou id's of itself
            // and any children it might have since all those would need to be deleted as well
            // if the level 2 is being deleted (or marked as)
            var orgUnitsToDeleteSubQuery = _.template([
                "SELECT org_unit_id FROM org_unit ",
                "WHERE org_unit_status != 'deleted' AND ",
                "(org_unit_id = <%= ou_id %> OR org_unit_parent_id = <%= ou_id %>)"
            ].join(""))({ ou_id: selfOuId });
            appModel.ctPool.query(orgUnitsToDeleteSubQuery, function(err, data) {
                if (err) {
                    return res(err);
                }
                var orgUnitsToDeleteById = _.pluck(data, "org_unit_id");
                function deleteUsers(done) {
                    var userRecordsToDeleteQry = "SELECT ct_user_id, ct_user_ou_id, user_status " +
                        "FROM ct_user " +
                        "WHERE ct_user_ou_id IN (" + orgUnitsToDeleteById.join(",") + ")";
                    appModel.ctPool.query(userRecordsToDeleteQry, function(err, data) {
                        if (err) {
                            done("problem getting user records to delete" + err);
                        }
                        var partialUserRecords = data;
                        userModel.multipleChangeUserStatus(partialUserRecords, "deleted", ctTransacPassedIn)
                            .then(function() {
                                done(null, "user delete done");
                            })
                            .catch(function(err) {
                                done(err);
                            });
                    });
                }
                // @param done -> used for the async function later used to determine when this function is finished
                // doing its asynchronous tasks
                function deleteCampaigns(done) {
                    var campaignModel = require("../models/campaignModel");
                    campaignModel.getCampaignIdsByOrgUnitIds(orgUnitsToDeleteById).then(function(errAndResult) {
                        if (errAndResult.err) {
                            return done(errAndResult.err + "in getCampaignIdsByOrgUnitIds promise result");
                        }
                        arrCampIdsToDelete = _.pluck(errAndResult.data, "campaign_id");
                        // on the finish of all of them being deleted, call 'done()'
                        // iterate over all camp ids and set each of their statuses to 'deleted'
                        async.eachSeries(arrCampIdsToDelete, function (campIdToDelete, iterationFinishedCb) {
                                var dataStructureSetStatusRequires = {
                                    campaign: {
                                        id: campIdToDelete,
                                        status: 'deleted'
                                    }
                                };
                                campaignModel.setStatus(dataStructureSetStatusRequires, req, function(err,result) {
                                    if (err) {
                                        iterationFinishedCb(err);
                                    }
                                    provisioned_route_id.push.apply(provisioned_route_id, result.prov_id);
                                    iterationFinishedCb(err);
                                }, ctTransacPassedIn);
                            },
                            function (err) {
                                if (err) {
                                    done(err + "in doneCb for getCampaignIdsByOrgUnitIds");
                                }else{
                                    done(null, "campaigns done delete");
                                }
                            }
                        );
                    });
                }


                function deleteTags(done) {
                    // get tags to delete
                    // pass tag stuff to tagModel delete tags
                    // cal done when it's done
                    var qryStr = "SELECT tag_id FROM tag WHERE org_unit_id IN (" + orgUnitsToDeleteById.join(",") + ")";
                    appModel.ctPool.query(qryStr, function(err, tag_ids_to_delete) {
                        if (err) {
                            return done(err + "inside deleteTags iter cb");
                        }
                        if (tag_ids_to_delete.length) {
                            var tags_to_delete_array = [];
                            for (var x in tag_ids_to_delete) {
                                tags_to_delete_array.push(tag_ids_to_delete[x].tag_id);
                            }
                            var data = {
                                'body': {
                                    'tag': { 'id': tags_to_delete_array }
                                },
                                'headers': req.headers.authorization,
                                'ouid': req.ouid,
                                'userid': req.userid
                            }
                            tagModel.deleteTag(data, done, ctTransacPassedIn);
                        } else {
                            return done(null, "tag delete done");
                        }
                    });
                }

                function deleteWebhooks(done) {
                    webhookModel.retrieveWebhooksByOrgUnitIds(orgUnitsToDeleteById, function(err, webhookRecords) {
                        if (err) {
                            return done("problem getting webhook records" + err);
                        }

                        var webhookIdsToChangeStatus = _.pluck(webhookRecords, "webhook_id");
                        if (webhookIdsToChangeStatus.length === 0) { return done(null, "no webhooks to delete"); }


                        webhookModel.changeMultipleStatus(webhookIdsToChangeStatus, "deleted", function(err, result) {
                            if (err) {
                                console.log(err);
                                return done(err + "in webhook delete change multi");
                            }

                            return done(null, "webhook delete done");
                        }, ctTransacPassedIn);
                    });
                }

                function deleteDniSetting(done) {
                    dniSettingModel.retrieveDNIsettingsFromOUids(orgUnitsToDeleteById, function(err, dniSettingRecords) {
                        if (err) {
                            return done(err + " in DNI SETTING first", err);
                        }
                        var dniSettingIds = _.pluck(dniSettingRecords, "dni_setting_id");
                        if (!dniSettingIds.length) {
                            return done(null, "no dnisetting records to delete");
                        }

                        dniSettingModel.deleteDNISetting(dniSettingIds, function(err, result) {
                            if (err) {
                                return done(err + " in DNI SETTING error deleting dni setting second" + err);
                            }
                            return done(null, "dnisetting delete done");
                        }, ctTransacPassedIn);
                    });

                }


                function deleteOrgUnits(done) {
                    if (!Array.isArray(orgUnitsToDeleteById)) { return done("incorrect parameter type for orgUnitsToDelete"); }
                    if (!orgUnitsToDeleteById.length) { return done(null, "no org units to delete"); }

                    var qry = "" +
                        "UPDATE org_unit " +
                        "SET org_unit_status = 'deleted' " +
                        "WHERE org_unit_id IN (" + orgUnitsToDeleteById.join(",") + ")";

                    ctTransacPassedIn.query(qry, function(err, resultSet) {
                        if (err) { return done(err + "inside deleteOrgUnits callback"); } else {
                            return done(null, "orgUnit delete done");
                        }
                    });


                }

                function deleteReservedPremiumNumber(done) {
                    var reserverPremiumNumberqry = "SELECT DISTINCT pn.number_id, pd.org_unit_id  FROM org_unit ou " +
                        "JOIN phone_detail pd ON pd.org_unit_id = ou.org_unit_id " +
                        "JOIN phone_number pn ON pn.number_id = pd.number_id AND pn.number_status ='reserved' " +
                        "JOIN org_component oc ON(pn.number_id = oc.number_id) " +
                        "Where ou.org_unit_id IN (" + orgUnitsToDeleteById.join(",") + ")";

                    ctTransacPassedIn.query(reserverPremiumNumberqry, function(err, resultSet) {
                        if (err) {
                            return done(err + " in DNI SETTING first", err);
                        }
                        async.eachSeries(resultSet, function(set, cb1) {
                                var updateQry = "UPDATE phone_number SET number_status = 'suspended' where number_id =" + set.number_id;
                                ctTransacPassedIn.query(updateQry, function(err, resultSet) {
                                    if (err) { cb1(err); }
                                    var updatePhoneDetailQry = "UPDATE phone_detail SET app_id = NULL, org_unit_id = NULL, provisioned_route_id = NULL where number_id =" + set.number_id;
                                    ctTransacPassedIn.query(updatePhoneDetailQry, function(err, resultSet) {
                                        if (err) { return cb1(err); }
                                        console.log(set);
                                        var data_for_product = {
                                            ouid: set.org_unit_id,
                                            num_id: set.number_id
                                        };
                                        var provisionedRouteModel = require('./provisionedRouteModel');
                                        provisionedRouteModel.removePremiumProduct(ctTransacPassedIn, data_for_product, function(err, data) {
                                            cb1(err);
                                        });
                                    });
                                });
                            },
                            function(err) {
                                if (err) { return done(err + "inside deleteOrgUnits callback"); } else {
                                    return done(null, "orgUnit delete done");
                                }
                            });
                        // var updateQry = "UPDATE phone_number SET number_status = 'suspended' where number_id IN ("
                    });
                }

                function deleteReservedNumber(done) {
                    var reserverNumberqry = "SELECT DISTINCT pn.number_id, pd.org_unit_id FROM org_unit ou " +
                        "JOIN phone_detail pd ON pd.org_unit_id = ou.org_unit_id " +
                        "JOIN phone_number pn ON pn.number_id = pd.number_id AND pn.number_status ='reserved' " +
                        "LEFT JOIN org_component oc ON (oc.number_id = pn.number_id) " +
                        "Where ou.org_unit_id IN (" + orgUnitsToDeleteById.join(",") + ") AND oc.number_id IS NULL "
                    ctTransacPassedIn.query(reserverNumberqry, function(err, resultSet) {
                        if (err) {
                            return done(err + " in DNI SETTING first", err);
                        }
                        async.eachSeries(resultSet, function(set, cb1) {
                                var updateQry = "UPDATE phone_number SET number_status = 'suspended' where number_id =" + set.number_id;
                                ctTransacPassedIn.query(updateQry, function(err, resultSet) {
                                    if (err) { cb1(err); }
                                    var updatePhoneDetailQry = "UPDATE phone_detail SET app_id = NULL, org_unit_id = NULL, provisioned_route_id = NULL where number_id =" + set.number_id;
                                    ctTransacPassedIn.query(updatePhoneDetailQry, function(err, resultSet) {
                                        if (err) { cb1(err); }
                                        var updateQry = "UPDATE org_component_count SET secondary_total = secondary_total - 1 where component_id = 18 AND org_unit_id = " + set.org_unit_id;
                                        ctTransacPassedIn.query(updateQry, function(err, resultSet) {
                                            cb1(err);
                                        });
                                    });
                                });
                            },
                            function(err) {
                                if (err) { return done(err + "inside deleteOrgUnits callback"); } else {
                                    return done(null, "orgUnit delete done");
                                }
                            });
                        // var updateQry = "UPDATE phone_number SET number_status = 'suspended' where number_id IN ("
                    });
                }

                var callbackTasks = [deleteUsers, deleteTags, deleteWebhooks, deleteDniSetting, deleteCampaigns, deleteOrgUnits, deleteReservedPremiumNumber, deleteReservedNumber];
                //var callbackTasks = [deleteReservedNumber, deleteReservedPremiumNumber];
                async.parallel(callbackTasks, function afterQueryCallbacks(err, results) {
                    if (err) {
                        return res(err);
                    }
                    _.each(arrCampIdsToDelete, function(id) {
                        var newdata = { 'org_unit_id': parent_ou_id, 'ct_user_id': req.userid, 'data': id };
                        ctlogger.log(newdata, 'delete', 'campaign', '', '', req.headers.authorization);
                    });
                    var newdata = { 'org_unit_id': parent_ou_id, 'ct_user_id': req.userid, 'data': selfOuId };
                    ctlogger.log(newdata, 'delete', 'user', 'org group', '', req.headers.authorization);

                    // dont need to pass back results because it's really just an array of "success!" type strings
                    parentOU.prov_id = provisioned_route_id;
                    return res(null, parentOU);
                });
            });
        });
    },
    // uses PROMISE style instead of callback
    getOULevel: function(req) {

        var ouIdToCheck = req.params.id;
        var qry = " SELECT org_unit_parent_id, top_ou_id " +
            " FROM org_unit " +
            " WHERE org_unit_id = " + ouIdToCheck;


        var deferred = q.defer();
        appModel.ctPool.query(qry, function(errUpdate, data) {
            if (errUpdate) {
                return deferred.resolve(errUpdate);
            }
            var level_number,
                ouRecord = data[0];

            if (!ouRecord) {
                errUpdate = "No OU exists by id - " + ouIdToCheck;
                level_number = null;
            } else if (ouRecord.org_unit_parent_id === null) {
                level_number = 1;
            } else if (ouRecord.org_unit_parent_id === ouRecord.top_ou_id) {
                level_number = 2;
            } else if (ouRecord.org_unit_parent_id !== ouRecord.top_ou_id) {
                level_number = 3;
            } else {
                errUpdate = "No OU exists by id - " + ouIdToCheck;
                level_number = null;
            }
            deferred.resolve({ err: errUpdate, data: level_number });
        });

        return deferred.promise;

    },
    orgUserList: function(ouid, res) {
        var qry = "SELECT ct_user_id, first_name || ' ' || last_name AS name FROM ct_user WHERE ct_user_ou_id=" + ouid;
        appModel.ctPool.query(qry, function(err, data) {
            if (err) {
                res(err);
            } else {
                res(null, data);
            }
        });
    },
    deleteAccount: function(req, callback) {
        var ctTrans = new ctTransactionModel.begin(function(err) {
            var ouid = req.params.ouid;
            var ouids_sql = "select org_unit_id from org_unit";
            ouids_sql += " where org_unit_id = " + ouid + " or org_unit_parent_id = " + ouid;
            ouids_sql += " or org_unit_parent_id IN(select org_unit_id from org_unit where org_unit_parent_id = " + ouid + ")";
            async.parallel([
                    function(cb) {
                        //update org_units to deleted
                        var qry = "UPDATE org_unit SET org_unit_status = 'deleted' WHERE org_unit_id IN (" + ouids_sql + ");";
                        var updateData = {
                            which: 'query',
                            qry: qry
                        };
                        ctTrans.query(updateData, function(err, d) {
                            cb(err, d);
                        });
                    },
                    function(cb) {
                        //update campaign to deleted
                        var qry = "UPDATE campaign SET campaign_status = 'deleted' WHERE campaign_ou_id IN (" + ouids_sql + ");";
                        var updateData = {
                            which: 'query',
                            qry: qry
                        };
                        ctTrans.query(updateData, function(err, d) {
                            cb(err, d);
                        });
                    },
                    function(cb) {
                        //update provisioned route to deleted
                        var qry = "UPDATE provisioned_route SET provisioned_route_status = 'deleted' WHERE provisioned_route_ou_id IN (" + ouids_sql + ");";
                        var updateData = {
                            which: 'query',
                            qry: qry
                        };
                        ctTrans.query(updateData, function(err, d) {
                            cb(err, d);
                        });
                    },
                    function(cb) {
                        //remove call flows
                        var qry = "SELECT provisioned_route_id FROM provisioned_route WHERE provisioned_route_ou_id IN (" + ouids_sql + ");";
                        var selectData = {
                            which: 'query',
                            qry: qry
                        };
                        ctTrans.query(selectData, function(err, dat) {
                            async.eachSeries(dat, function(d, cb1) {
                                    var callFlowModel = require('./callFlowModel');
                                    callFlowModel.deleteById(ctTrans, null, d.provisioned_route_id, function(err) {
                                        cb1(err);
                                    });
                                },
                                function(err) {
                                    cb(err);
                                });
                        });

                    },
                    function(cb) {
                        //update phone number to suspended
                        var qry = "UPDATE phone_number SET number_status = 'suspended'";
                        qry += " WHERE number_id IN(SELECT phone_number_id FROM provisioned_route_number";
                        qry += " WHERE provisioned_route_id IN (SELECT provisioned_route_id FROM provisioned_route";
                        qry += " WHERE provisioned_route_ou_id IN (" + ouids_sql + ")))";

                        var updateData = {
                            which: 'query',
                            qry: qry
                        };
                        ctTrans.query(updateData, function(err, d) {
                            cb(err, d);
                        });
                    },
                    function(cb) {
                        //update org_billing cycle_end to null
                        var qry = "UPDATE org_billing SET cycle_end = NULL WHERE org_unit_id IN (" + ouids_sql + ");";
                        var updateData = {
                            which: 'query',
                            qry: qry
                        };
                        ctTrans.query(updateData, function(err, d) {
                            cb(err, d);
                        });
                    },
                    function(cb) {
                        //update ct_user to deleted except CT Support Admin
                        var qry = "UPDATE ct_user SET user_status = 'deleted' WHERE ct_user_ou_id IN (" + ouids_sql + ") AND role_id IN (1,2,3);";
                        var updateData = {
                            which: 'query',
                            qry: qry
                        };
                        ctTrans.query(updateData, function(err, d) {
                            cb(err, d);
                        });
                    },
                    function(cb) {
                        //update webhook webhook_status to deleted
                        var qry = "UPDATE webhook SET webhook_status = 'deleted' WHERE org_unit_id IN (" + ouids_sql + ");";
                        var updateData = {
                            which: 'query',
                            qry: qry
                        };
                        ctTrans.query(updateData, function(err, d) {
                            cb(err, d);
                        });
                    },
                    function(cb) {
                        //update tag tag_active to false
                        var qry = "UPDATE tag SET tag_active = 'false' WHERE org_unit_id IN (" + ouids_sql + ");";
                        var updateData = {
                            which: 'query',
                            qry: qry
                        };
                        ctTrans.query(updateData, function(err, d) {
                            cb(err, d);
                        });
                    },
                    function(cb) {
                        async.waterfall([
                                function(cb1) {
                                    var qry = "SELECT number_id FROM phone_detail WHERE org_unit_id IN (" + ouids_sql + ")";
                                    appModel.ctPool.query(qry, function(err, data) {
                                        if (data.length > 0) {
                                            var orgUnitsToDeleteById = _.pluck(data, "number_id");
                                            cb1(null, orgUnitsToDeleteById);

                                        } else {
                                            cb1(null, []);
                                        }
                                    });
                                },
                                function(number_id, cb1) {
                                    //update phone_detail provisioned_route_id to NULL
                                    if (number_id.length > 0) {
                                        var qry = "UPDATE phone_detail SET app_id = NULL, org_unit_id = NULL, provisioned_route_id = NULL WHERE number_id IN (" + number_id.join(',') + ")";
                                        var updateData = {
                                            which: 'query',
                                            qry: qry
                                        };
                                        ctTrans.query(updateData, function(err, d) {
                                            cb1(null, number_id);
                                        });
                                    } else {
                                        cb1(null, []);
                                    }
                                },
                                function(number_id, cb1) {
                                    //update provisioned_route_number date_removed to current timestamp
                                    if (number_id.length > 0) {
                                        var qry = "UPDATE provisioned_route_number SET assign_active = false, date_removed = Now() WHERE phone_number_id IN (" + number_id.join(',') + ")";
                                        var updateData = {
                                            which: 'query',
                                            qry: qry
                                        };
                                        ctTrans.query(updateData, function(err, d) {
                                            cb1(null, d);
                                        });
                                    } else {
                                        cb1(null);
                                    }
                                }
                            ],
                            function(err, d) {
                                if (err) {
                                    cb(err);
                                } else {
                                    cb(null, d);
                                }
                            });
                    }
                ],
                function(err) {
                    if (err) {
                        ctTrans.rollback(function() {});
                    } else {
                        ctTrans.commit(function() {});
                    }
                    callback(err, 'Account Deleted.')
                });
        });
    },
    getGroupsByAccessLevel: function(data, ouId, res) {
        var subQuery = "select org_unit_id from org_unit where org_unit_id = " + ouId + " or org_unit_parent_id = " + ouId + " or org_unit_parent_id IN(select org_unit_id from org_unit where org_unit_parent_id = " + ouId + ")"

        var query = "SELECT DISTINCT ou.org_unit_id,ou.org_unit_name ";
        query += "FROM org_unit AS ou ";
        query += "JOIN campaign AS camp ON ou.org_unit_id = camp.campaign_ou_id ";
        // query += "JOIN campaign_provisioned_route cpr ON camp.campaign_id = cpr.campaign_id ";
        // query += "JOIN provisioned_route pr ON cpr.provisioned_route_id = pr.provisioned_route_id AND pr.provisioned_route_id IS NOT NULL ";
        query += "LEFT JOIN campaign_ct_user ccu ON (camp.campaign_id = ccu.campaign_id AND ccu.ct_user_id = " + data.user_id + ") ";
        //query += "WHERE ";
        if (data.role == 1)
            query += "WHERE camp.campaign_ou_id IN(" + subQuery + ")";
        else if (data.role == 2) //stadard user
            query += "WHERE (ccu.ct_user_id = '" + data.user_id + "' OR camp.campaign_owner_user_id = '" + data.user_id + "') ";
        else if (data.role == 3) //Read-Only user
            query += "WHERE ccu.ct_user_id = '" + data.user_id + "' ";

        query += " ORDER BY ou.org_unit_name ASC";

        appModel.ctPool.query(query, function(err, data) {
            if (err) {
                return res(err);
            }
            return res(err, data);
        });
    },
    checkOverrideSettings: function(type, ouid, callback) {
        var defaultSettingsType = {
            "feature": "override_feature_settings",
            "call_flow": "override_tracking_number_settings",
            "call_action": "override_call_action_settings"
        }
        var qry = "SELECT ou.org_unit_id, ou.org_unit_parent_id, ou.top_ou_id, dou." + defaultSettingsType[type] + " as self_setting," +
            "pdou." + defaultSettingsType[type] + " as parent_setting, tdou." + defaultSettingsType[type] + " as top_setting " +
            "from org_unit as ou " +
            "LEFT JOIN default_org_setting as dou ON (ou.org_unit_id = dou.org_unit_id) " +
            "LEFT JOIN default_org_setting as pdou ON (ou.org_unit_parent_id = pdou.org_unit_id) " +
            "LEFT JOIN default_org_setting as tdou ON (ou.top_ou_id = tdou.org_unit_id) " +
            "WHERE ou.org_unit_id = " + ouid
        appModel.ctPool.query(qry, function(err, data) {
            var settingOu = ouid;
            if (err) {
                return callback(err);
            }
            if (data[0].self_setting === false) {
                settingOu = data[0].org_unit_id;
            } else if (data[0].parent_setting === false) {
                settingOu = data[0].org_unit_parent_id;
            } else if (data[0].top_setting === false) {
                settingOu = data[0].top_ou_id;
            }

            return callback(null, settingOu);
        });
    },
    getOuAndAboveActiveUsers: function(ouid,callback){ 
        //For Amp3 use DO NOT CHANGE

        qry = "SELECT * FROM ct_user WHERE ct_user_ou_id in (";
        qry += "SELECT org_unit_id FROM org_unit WHERE top_ou_id = (";
        qry += "SELECT top_ou_id FROM org_unit WHERE org_unit_id = "+ouid+") AND org_unit_status = 'active'"
        qry += ") AND user_status = 'active'"

        appModel.ctPool.query(qry, function (err, data) { 
            if (err) { 
                callback(err);
            } else { 
                callback(null,data); 
            }
        });   
    },
    // ======= For Export functionality ===============	
    groupsList: function(ouid, userAccess, userid, res) {
        var reportData = {};
        async.parallel([
                function(cb) {
                    var selectQuery = "";
                    selectQuery += "SELECT DISTINCT ob.org_unit_name AS account, ob.org_unit_id AS account_ouid, ob.org_unit_ext_id AS account_external_id, ";
                    selectQuery += "op.org_unit_name AS parent_group, op.org_unit_id AS parent_group_ouid, ou.org_unit_ext_id AS group_external_id, ";
                    selectQuery += "op.org_unit_ext_id AS parent_group_external_id, ou.org_unit_name AS group, ou.org_unit_id AS group_ouid, ";
                    selectQuery += "CASE WHEN i.industry_group IS NOT NULL THEN CONCAT(i.industry_group ,': ' ,i.industry_name) ELSE null END AS industry, ";
                    selectQuery += "oud.phone_number AS phone, oud.city AS city, oud.state AS state_province, oud.zip AS zip_postal_code, ";

                    // DNI checkbox ";
                    selectQuery += "CASE ";
                    selectQuery += "WHEN dos.override_tracking_number_settings IS NOT NULL AND dos.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dos.is_dni_enabled ";
                    selectQuery += "WHEN dops.override_tracking_number_settings IS NOT NULL AND dops.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dops.is_dni_enabled  ";
                    selectQuery += "WHEN dots.override_tracking_number_settings IS NOT NULL AND dots.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dots.is_dni_enabled ";
                    selectQuery += "ELSE 'false' END AS is_dni_enabled, ";

                    // Host Domain ";
                    selectQuery += "CASE ";
                    selectQuery += "WHEN dos.override_tracking_number_settings IS NOT NULL AND dos.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dds.destination_url ";
                    selectQuery += "WHEN dops.override_tracking_number_settings IS NOT NULL AND dops.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN ddps.destination_url  ";
                    selectQuery += "WHEN dots.override_tracking_number_settings IS NOT NULL AND dots.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN ddts.destination_url ";
                    selectQuery += "ELSE '*.*' END AS host_domain, ";
                    // Referring Website
                    selectQuery += "CASE ";
                    selectQuery += "WHEN dos.override_tracking_number_settings IS NOT NULL AND dos.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dds.referrer  ";
                    selectQuery += "WHEN dops.override_tracking_number_settings IS NOT NULL AND dops.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN ddps.referrer  ";
                    selectQuery += "WHEN dots.override_tracking_number_settings IS NOT NULL AND dots.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN ddts.referrer  ";
                    selectQuery += "ELSE 'Any' END AS referring_website, ";
                    // HTML Class
                    selectQuery += "CASE ";
                    selectQuery += "WHEN dos.override_tracking_number_settings IS NOT NULL AND dos.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dds.dni_element ";
                    selectQuery += "WHEN dops.override_tracking_number_settings IS NOT NULL AND dops.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN ddps.dni_element ";
                    selectQuery += "WHEN dots.override_tracking_number_settings IS NOT NULL AND dots.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN ddts.dni_element ";
                    selectQuery += "ELSE '' END  AS html_class, ";

                    // Conversion Analytics
                    selectQuery += "CASE ";
                    selectQuery += "WHEN sc.component_id IS NOT NULL THEN( CASE ";
                    selectQuery += "WHEN dos IS NOT NULL AND dos.override_feature_settings = 'f' ";
                    selectQuery += "THEN dos.conversation_analytics_status ";
                    selectQuery += "WHEN dops IS NOT NULL AND dops.override_feature_settings = 'f' ";
                    selectQuery += "THEN dops.conversation_analytics_status ";
                    selectQuery += "WHEN dots IS NOT NULL AND dots.override_feature_settings = 'f' ";
                    selectQuery += "THEN dots.conversation_analytics_status ";
                    selectQuery += "ELSE 'true' END ) ELSE null ";
                    selectQuery += "END AS enable_conversation_analytics, ";

                    // Spamgard Protection
                    selectQuery += "CASE ";
                    selectQuery += "WHEN ora.component_id IS NOT NULL THEN( CASE ";
                    selectQuery += "WHEN dos IS NOT NULL AND dos.override_feature_settings = 'f' ";
                    selectQuery += "THEN dos.spam_guard_status ";
                    selectQuery += "WHEN dops IS NOT NULL AND dops.override_feature_settings = 'f' ";
                    selectQuery += "THEN dops.spam_guard_status ";
                    selectQuery += "WHEN dots IS NOT NULL AND dots.override_feature_settings = 'f' ";
                    selectQuery += "THEN dots.spam_guard_status ";
                    selectQuery += "ELSE 'true' END ) ELSE null ";
                    selectQuery += "END AS enable_spam_guard, ";

                    // Share DNI
                    selectQuery += "CASE ";
                    selectQuery += "WHEN dos IS NOT NULL AND dos.override_feature_settings = 'f' ";
                    selectQuery += "THEN dos.share_with_subgroup ";
                    selectQuery += "ELSE 'false' END AS share_dni_settings, ";

                    // Play Voice Prompt
                    selectQuery += "CASE ";
                    selectQuery += "WHEN dos IS NOT NULL AND dos.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dpr.play_voice_prompt_first ";
                    selectQuery += "WHEN dops IS NOT NULL AND dops.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dppr.play_voice_prompt_first ";
                    selectQuery += "WHEN dots IS NOT NULL AND dots.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dtpr.play_voice_prompt_first ";
                    selectQuery += "ELSE 'false' ";
                    selectQuery += "END AS voice_prompt, ";
                    // Whisper message 
                    selectQuery += "CASE ";
                    selectQuery += "WHEN dos IS NOT NULL AND dos.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dpr.play_whisper_message ";
                    selectQuery += "WHEN dops IS NOT NULL AND dops.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dppr.play_whisper_message ";
                    selectQuery += "WHEN dots IS NOT NULL AND dots.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dtpr.play_whisper_message ";
                    selectQuery += "ELSE 'false' ";
                    selectQuery += "END AS whisper_message, ";
                    // Ring To Number
                    selectQuery += "CASE ";
                    selectQuery += "WHEN dos IS NOT NULL AND dos.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dpr.ring_to_number ";
                    selectQuery += "WHEN dops IS NOT NULL AND dops.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dppr.ring_to_number ";
                    selectQuery += "WHEN dots IS NOT NULL AND dots.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dtpr.ring_to_number ";
                    selectQuery += "ELSE null ";
                    selectQuery += "END AS ring_to_number, ";
                    // Record Call
                    selectQuery += "CASE ";
                    selectQuery += "WHEN dos IS NOT NULL AND dos.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dpr.record_call ";
                    selectQuery += "WHEN dops IS NOT NULL AND dops.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dppr.record_call ";
                    selectQuery += "WHEN dots IS NOT NULL AND dots.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dtpr.record_call ";
                    selectQuery += "ELSE 'true' ";
                    selectQuery += "END AS record_call, ";
                    // Play Disclaimer
                    selectQuery += "CASE ";
                    selectQuery += "WHEN dos IS NOT NULL AND dos.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dpr.play_disclaimer ";
                    selectQuery += "WHEN dops IS NOT NULL AND dops.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dppr.play_disclaimer ";
                    selectQuery += "WHEN dots IS NOT NULL AND dots.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dtpr.play_disclaimer ";
                    selectQuery += "ELSE 'before' ";
                    selectQuery += "END AS call_recording_disclaimer, ";
                    // Repeat Interval
                    selectQuery += "CASE ";
                    selectQuery += "WHEN dos IS NOT NULL AND dos.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dpr.repeat_interval_call ";
                    selectQuery += "WHEN dops IS NOT NULL AND dops.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dppr.repeat_interval_call ";
                    selectQuery += "WHEN dots IS NOT NULL AND dots.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dtpr.repeat_interval_call ";
                    selectQuery += "ELSE 72 ";
                    selectQuery += "END AS repeat_interval, ";

                    // Play call value
                    selectQuery += "CASE ";
                    selectQuery += "WHEN dos.override_tracking_number_settings IS NOT NULL AND dos.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dpr.call_value ";
                    selectQuery += "WHEN dops.override_tracking_number_settings IS NOT NULL AND dops.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dppr.call_value ";
                    selectQuery += "WHEN dots.override_tracking_number_settings IS NOT NULL AND dots.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN dtpr.call_value ";
                    selectQuery += "ELSE null ";
                    selectQuery += "END AS call_value, ";

                    // Activate Voicemail?
                    selectQuery += "CASE WHEN orab.component_id IS NOT NULL THEN ( CASE ";
                    selectQuery += "WHEN dos.override_tracking_number_settings IS NOT NULL AND dos.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN ( CASE WHEN daous.activate_voicemail IS NULL THEN false ELSE daous.activate_voicemail END ) ";
                    selectQuery += "WHEN dops.override_tracking_number_settings IS NOT NULL AND dops.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN ( CASE WHEN daoups.activate_voicemail IS NULL THEN false ELSE daoups.activate_voicemail END ) ";
                    selectQuery += "WHEN dots.override_tracking_number_settings IS NOT NULL AND dots.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN ( CASE WHEN daouts.activate_voicemail IS NULL THEN false ELSE daouts.activate_voicemail END ) ";                    
                    selectQuery += "ELSE false END ) ELSE null ";
                    selectQuery += "END AS activate_voicemail, ";

                    // Voicemail Rings
                    selectQuery += "CASE WHEN orab.component_id IS NOT NULL THEN ( CASE ";
                    selectQuery += "WHEN dos.override_tracking_number_settings IS NOT NULL AND dos.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN daous.voicemail_rings ";
                    selectQuery += "WHEN dops.override_tracking_number_settings IS NOT NULL AND dops.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN daoups.voicemail_rings ";
                    selectQuery += "WHEN dots.override_tracking_number_settings IS NOT NULL AND dots.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN daouts.voicemail_rings ";
                    selectQuery += "ELSE 3 END ) ELSE NULL ";
                    selectQuery += "END AS voicemail_rings, ";

                    // Overflow Rings
                    selectQuery += "CASE ";
                    selectQuery += "WHEN dos.override_tracking_number_settings IS NOT NULL AND dos.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN daous.overflow_rings ";
                    selectQuery += "WHEN dops.override_tracking_number_settings IS NOT NULL AND dops.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN daoups.overflow_rings ";
                    selectQuery += "WHEN dots.override_tracking_number_settings IS NOT NULL AND dots.override_tracking_number_settings = 'f' ";
                    selectQuery += "THEN daouts.overflow_rings ";
                    selectQuery += "ELSE 3 ";
                    selectQuery += "END AS overflow_rings, ";

                    //  post call IVR status
                     selectQuery += "CASE WHEN orad.component_id IS NOT NULL THEN ( CASE ";
                     selectQuery += "WHEN dos.override_tracking_number_settings IS NOT NULL AND dos.override_tracking_number_settings = 'f' ";
                     selectQuery += "THEN dos.is_post_call_ivr_enabled  ";
                     selectQuery += "WHEN dops.override_tracking_number_settings IS NOT NULL AND dops.override_tracking_number_settings = 'f' ";
                     selectQuery += "THEN dops.is_post_call_ivr_enabled ";
                     selectQuery += "WHEN dots.override_tracking_number_settings IS NOT NULL AND dots.override_tracking_number_settings = 'f' ";
                     selectQuery += "THEN dots.is_post_call_ivr_enabled ";
                     selectQuery += "ELSE false END ) ELSE NULL ";
                     selectQuery += "END AS is_post_call_ivr_enabled, ";

                     // postCallIVR Value
                     selectQuery += "CASE WHEN orad.component_id IS NOT NULL THEN ( CASE ";
                     selectQuery += "WHEN dos.override_tracking_number_settings IS NOT NULL AND dos.override_tracking_number_settings = 'f' ";
                     selectQuery += "THEN dpcivrs.post_call_ivr_option_id ";
                     selectQuery += "WHEN dops.override_tracking_number_settings IS NOT NULL AND dops.override_tracking_number_settings = 'f' ";
                     selectQuery += "THEN dpcivrps.post_call_ivr_option_id ";
                     selectQuery += "WHEN dots.override_tracking_number_settings IS NOT NULL AND dots.override_tracking_number_settings = 'f' ";
                     selectQuery += "THEN dpcivrts.post_call_ivr_option_id ";
                     selectQuery += "ELSE 1 END ) ELSE NULL ";
                     selectQuery += "END AS post_call_ivr_option_id, ";
 

                    //selectQuery += "CASE WHEN dca.action IS NOT NULL THEN 'Yes' ELSE 'No' END AS call_action "; 
                    selectQuery += "CASE ";
                    selectQuery += "WHEN dos IS NOT NULL AND dos.override_call_action_settings = 'f' AND dca.default_action_id IS NOT NULL ";
                    selectQuery += "THEN 'Yes' ";
                    selectQuery += "WHEN dos IS NOT NULL AND dos.override_call_action_settings = 'f' AND dca.default_action_id IS NULL ";
                    selectQuery += "THEN 'No' ";
                    selectQuery += "WHEN (dos IS NULL OR dos.override_call_action_settings = 't') AND dops IS NOT NULL AND dops.override_call_action_settings = 'f' AND dpca.default_action_id IS NOT NULL ";
                    selectQuery += "THEN 'Yes' ";
                    selectQuery += "WHEN (dos IS NULL OR dos.override_call_action_settings = 't') AND dops IS NOT NULL AND dops.override_call_action_settings = 'f' AND dpca.default_action_id IS NULL ";
                    selectQuery += "THEN 'No' ";
                    selectQuery += "WHEN (dos IS NULL OR dos.override_call_action_settings = 't') AND (dops IS NULL OR dops.override_call_action_settings = 't') AND dots IS NOT NULL AND dots.override_call_action_settings = 'f' AND dtca.default_action_id IS NOT NULL ";
                    selectQuery += "THEN 'Yes' ";
                    selectQuery += "WHEN (dos IS NULL OR dos.override_call_action_settings = 't') AND (dops IS NULL OR dops.override_call_action_settings = 't') AND dots IS NOT NULL AND dots.override_call_action_settings = 'f' AND dtca.default_action_id IS NULL ";
                    selectQuery += "THEN 'No' ";
                    selectQuery += "ELSE 'No' ";
                    selectQuery += "END AS call_action ";

                    selectQuery += "FROM org_unit ou ";
                    selectQuery += "JOIN org_unit ob ON ob.org_unit_id = ou.billing_id ";
                    selectQuery += "LEFT JOIN org_unit op ON op.org_unit_id = ou.org_unit_parent_id ";
                    selectQuery += "JOIN org_unit_detail oud ON oud.org_unit_id = ou.org_unit_id ";

                    selectQuery += "LEFT JOIN org_billing orb ON orb.org_unit_id = ou.billing_id ";

                    selectQuery += "LEFT JOIN org_account ora ON ( ora.org_unit_id = ou.billing_id AND ora.component_id = 926 ) ";
                    selectQuery += "LEFT JOIN org_account orac ON (orac.org_unit_id = ou.billing_id AND orac.subscription_id IS NOT NULL) ";
                    selectQuery += "LEFT JOIN subscription sub ON sub.subscription_id = orac.subscription_id ";
                    selectQuery += "LEFT JOIN subscription_component sc ON ( sc.subscription_id = sub.subscription_id AND sc.component_id = 19 ) ";
                    selectQuery += "LEFT JOIN subscription_component orad ON ( orad.subscription_id = sub.subscription_id AND orad.component_id = 929 ) ";
                    selectQuery += "LEFT JOIN subscription_component orab ON ( orab.subscription_id = sub.subscription_id AND orab.component_id = 928 ) ";

                    selectQuery += "LEFT JOIN default_org_setting dos ON dos.org_unit_id = ou.org_unit_id ";
                    selectQuery += "LEFT JOIN default_org_setting dops ON dops.org_unit_id = ou.org_unit_parent_id ";
                    selectQuery += "LEFT JOIN default_org_setting dots ON dots.org_unit_id = ou.top_ou_id ";
                    // default_advanced_org_unit_settings
                    selectQuery += "LEFT JOIN default_advanced_org_unit_settings daous ON  daous.org_unit_id = ou.org_unit_id ";
                    selectQuery += "LEFT JOIN default_advanced_org_unit_settings daoups ON  daoups.org_unit_id = ou.org_unit_parent_id ";
                    selectQuery += "LEFT JOIN default_advanced_org_unit_settings daouts ON  daouts.org_unit_id = ou.top_ou_id ";
                    // default_post_call_ivr_settings
                    selectQuery += "LEFT JOIN default_post_call_ivr_settings dpcivrs ON  dpcivrs.org_unit_id = ou.org_unit_id ";
                    selectQuery += "LEFT JOIN default_post_call_ivr_settings dpcivrps  ON  dpcivrps.org_unit_id = ou.org_unit_parent_id ";
                    selectQuery += "LEFT JOIN default_post_call_ivr_settings dpcivrts  ON  dpcivrts.org_unit_id = ou.top_ou_id ";
                    // default DNI settings
                    selectQuery += "LEFT JOIN default_dni_setting dds ON dds.org_unit_id = ou.org_unit_id ";
                    selectQuery += "LEFT JOIN default_dni_setting ddps ON ddps.org_unit_id = ou.org_unit_parent_id ";
                    selectQuery += "LEFT JOIN default_dni_setting ddts ON ddts.org_unit_id = ou.top_ou_id ";

                    selectQuery += "LEFT JOIN industry i ON i.industry_id = oud.industry_id ";
                    selectQuery += "LEFT JOIN default_provisioned_route dpr ON dpr.org_unit_id = ou.org_unit_id ";
                    selectQuery += "LEFT JOIN default_provisioned_route dppr ON dppr.org_unit_id = ou.org_unit_parent_id ";
                    selectQuery += "LEFT JOIN default_provisioned_route dtpr ON dtpr.org_unit_id = ou.top_ou_id ";
                    selectQuery += "LEFT JOIN default_call_action dca ON dca.org_unit_id = ou.org_unit_id ";
                    selectQuery += "LEFT JOIN default_call_action_rule dcar ON (dcar.default_action_id = dca.default_action_id and dcar.default_action_id IS NOT NULL) ";
                    selectQuery += "LEFT JOIN default_call_action dpca ON dpca.org_unit_id = ou.org_unit_parent_id "
                    selectQuery += "LEFT JOIN default_call_action_rule dpcar ON (dpcar.default_action_id = dpca.default_action_id and dpcar.default_action_id IS NOT NULL) "
                    selectQuery += "LEFT JOIN default_call_action dtca ON dtca.org_unit_id = ou.top_ou_id "
                    selectQuery += "LEFT JOIN default_call_action_rule dtcar ON (dtcar.default_action_id = dtca.default_action_id and dtcar.default_action_id IS NOT NULL) "
                    selectQuery += "WHERE ou.org_unit_id IN (SELECT unnest(array[org_unit_id]) FROM org_unit ";
                    selectQuery += "WHERE org_unit_id = " + ouid + " OR top_ou_id = " + ouid + "  OR org_unit_parent_id = " + ouid + " AND org_unit_status = 'active' ";
                    selectQuery += "INTERSECT SELECT org_unit_id FROM org_unit ";
                    selectQuery += "where org_unit_id in (SELECT unnest(groups_list) FROM user_permissions WHERE ct_user_id = " + userid + ") AND org_unit_status = 'active') ";

                    appModel.ctPool.query(selectQuery, function(err, groupReportData) {
                        reportData['groupReportData'] = groupReportData;
                        if (err) {
                            cb(err);
                        } else {
                            cb(null);
                        }
                    });
                },
                function(cb) {
                    var selectQuery = "";
                    selectQuery += "SELECT cs.org_unit_id, cs.custom_source_type, string_agg(custom_source_name, ';') from custom_source cs "
                    selectQuery += " JOIN org_unit ou ON (ou.org_unit_id = cs.org_unit_id) "
                    selectQuery += "where (ou.org_unit_id IN (SELECT unnest(groups_list) FROM user_permissions WHERE ct_user_id = " + userid + ")"
                    selectQuery += " OR ou.top_ou_id IN (SELECT unnest(groups_list) FROM user_permissions WHERE ct_user_id = " + userid + ")"
                    selectQuery += " OR ou.org_unit_parent_id IN (SELECT unnest(groups_list) FROM user_permissions WHERE ct_user_id = " + userid + ")) AND cs.custom_source_active = 't'"
                    selectQuery += "GROUP BY cs.org_unit_id, cs.custom_source_type "
                        //selectQuery += "where org_unit_id in (SELECT unnest(groups_list) FROM user_permissions WHERE ct_user_id = "+ userid +") AND org_unit_status = 'active') ";

                    appModel.ctPool.query(selectQuery, function(err, customsourcedata) {
                        reportData['customsourcedata'] = customsourcedata;
                        if (err) {
                            selectQuery +=
                                cb(err);
                        } else {
                            cb(null);
                        }
                    });

                }
            ],
            function(err) {
                if (err) {
                    res(err, {});
                } else {
                    //console.log(reportData['customsourcedata']);
                    _.map(reportData['customsourcedata'], function(cs) {
                        //console.log(cs);
                        _.map(reportData['groupReportData'], function(rdata) {
                            if (rdata.group_ouid === cs.org_unit_id || rdata.account_ouid === cs.org_unit_id || rdata.parent_group_ouid === cs.org_unit_id) {
                                if (rdata[cs.custom_source_type] !== undefined) {
                                    rdata[cs.custom_source_type] = rdata[cs.custom_source_type] + ";" + cs.string_agg;
                                } else {
                                    rdata[cs.custom_source_type] = cs.string_agg;
                                }

                            }
                        });

                    });
                    res(null, jsonGetGroupsReport(reportData['groupReportData']));
                }
            }
        );
    },
    subGroups: function(ouid,callback){ 
        //For Amp3 use DO NOT CHANGE

        qry = "SELECT * FROM org_unit WHERE org_unit_status != 'deleted' AND org_unit_parent_id = "+ouid;

        appModel.ctPool.query(qry, function (err, data) { 
            if (err) { 
                callback(err);
            } else { 
                callback(null,data); 
            }
        });   
    },
    move: function(req, callback) {
        //For AMP3 Use DO NOT CHANGE
        console.log("orgunit move data: "+JSON.stringify(req.body))
        var sourceOu = {
            org_unit_id: req.body.sourceOuid
        };

        var parentOu = {
            org_unit_id: req.body.parentOuid
        };

        var ctTrans = new ctTransactionModel.begin(function(err) {
            async.waterfall([
                function(cb){
                    ////Get ouid data
                    async.parallel([
                        function(cb1){
                            //// get sourceOu is_migrated
                            orgUnit.getByIdInternal({params: {id: sourceOu.org_unit_id}}, function (err, data) {
                                if (data.length < 1) {return cb1('Invalid Source Ouid');}
                                sourceOu.is_migrated = data[0].is_migrated;
                                cb1(null);
                            });
                        },
                        function(cb1){
                            //// get parentOu is_migrated
                            orgUnit.getByIdInternal({params: {id: parentOu.org_unit_id}}, function (err, data) {
                                if (data.length < 1) {return cb1('Invalid Parent Ouid');}
                                parentOu.is_migrated = data[0].is_migrated;
                                cb1(null);
                            });
                        },
                        function(cb1){
                            /// get sourceOu level
                            orgUnit.getOULevel({params: {id: sourceOu.org_unit_id}}).then(function (result) {
                                if (result.err) {return cb1(result.err);}
                                sourceOu.level = result.data;
                                cb1(null);
                            });
                        },
                        function(cb1){
                            /// get parentOu level
                            orgUnit.getOULevel({params: {id: parentOu.org_unit_id}}).then(function (result) {
                                if (result.err) {return cb1(result.err);}
                                parentOu.level = result.data;
                                cb1(null);
                            });
                        },
                        function(cb1){
                            //// get sourceOu subgroups
                            orgUnit.subGroups(sourceOu.org_unit_id, function (err, data) {
                                sourceOu.subGroups = data;
                                cb1(err);
                            });
                        },
                        function(cb1) {
                            /// Get parent billing and top_ouid
                            qry = "SELECT top_ou_id,billing_id FROM org_unit WHERE org_unit_id = "+parentOu.org_unit_id;
                            ctTrans.select(qry,function(err,data){
                                console.log("parent data: "+JSON.stringify(data))
                                parentOu.data = data[0]
                                cb1(err);
                            })
                        }
                    ],
                    function(err){
                        cb(err);
                    })
                },
                function(cb){
                    ////Validate data
                    async.parallel([
                        function(cb1) {
                            ////Check levels
                            if (sourceOu.level === 1) {
                                return cb1("SourceOu can not be billing Ou")
                            } else if (parentOu.level === 3) {
                                return cb1("ParentOU can not be level 3")
                            } else {
                                cb1(null);
                            }
                        },
                        function(cb1) {
                            ////Make sure source and parent aren't same ou
                            if (sourceOu.org_unit_id === parentOu.org_unit_id) {
                                return cb1("Source and Parent can not be same ou");
                            }
                            return cb1(null);
                        },
                        function(cb1){
                            ////Make sure if parent level is 2, source can not have subgroups
                            if (parentOu.level === 2 && sourceOu.subGroups.length > 0) {
                                return cb1('Source has subgroups, can not have parent level 2');
                            }
                            return cb1(null);
                        },
                        function(cb1) {
                            ////Check UI platform match
                            if (sourceOu.is_migrated !== parentOu.is_migrated) {
                                return cb1('UI platform mismatch');
                            }
                            return cb1(null);
                        }
                    ],
                    function(err){
                        console.log("sourceOu "+JSON.stringify(sourceOu))
                        console.log("parentOu "+JSON.stringify(parentOu))
                        console.log("Validation errors: "+err)
                        cb(err);
                    })
                },
                function(cb){
                    ////Move ous
                    async.parallel([
                        function(cb1) {
                            ////Move source ou
                            qry = "UPDATE org_unit SET top_ou_id = "+parentOu.data.top_ou_id;
                            qry += ",billing_id = "+parentOu.data.billing_id;
                            qry += ",org_unit_parent_id = "+parentOu.org_unit_id;
                            qry += " WHERE org_unit_id = "+sourceOu.org_unit_id;
                            
                            ctTrans.query(qry,function(err,data){
                                console.log("update qry err: "+err+" data: "+JSON.stringify(data))
                                cb1(err);
                            });
                        },
                        function(cb1) {
                            ////Move source sub ous
                            qry = "UPDATE org_unit SET top_ou_id = "+parentOu.data.top_ou_id;
                            qry += ",billing_id = "+parentOu.data.billing_id;
                            qry += " WHERE org_unit_parent_id = "+sourceOu.org_unit_id;
                            
                            ctTrans.query(qry,function(err,data){
                                console.log("update qry err: "+err+" data: "+JSON.stringify(data))
                                cb1(err);
                            });
                        }
                    ],
                    function(err){
                        cb(err);
                    });
                },
                function(cb) {
                    ////update campaign with correct owner user id
                    async.waterfall([
                        function(cb1) {
                            ////Get campaign users
                            console.log('Fetching campaign users')

                            var qry = "SELECT ct_user_id";
                            qry += " FROM ct_user";
                            qry += " WHERE ct_user_ou_id IN";
                            qry += " (SELECT org_unit_id FROM org_unit WHERE billing_id = ";
                            qry += " (SELECT billing_id FROM org_unit WHERE org_unit_id = "+parentOu.org_unit_id+"))";
                            qry += " AND role_id in (1,2)"
                            
                            ctTrans.query(qry,function(err,users){
                                if (err) {cb1(err);}
                                var d = []
                                async.eachSeries(users,function(user,cb2){
                                    d.push(user.ct_user_id);
                                    cb2(null);
                                },
                                function(err){
                                    cb1(err,d);
                                });
                            });
                        },
                        function(users,cb1) {
                            ////Check new campaign users
                            console.log('Checking campaign users '+JSON.stringify(users))
                            if (req.body.campaigns === undefined || req.body.campaigns.length < 1) {
                                return cb1(null);
                            }
                            async.eachSeries(req.body.campaigns,function(campaign,cb2){
                                console.log('campaignUserId '+campaign.campaignUserId)
                                if (users.indexOf(parseInt(campaign.campaignUserId)) < 0) {
                                    return cb2('invalid user id');
                                }
                                cb2(null);
                            },
                            function(err){
                                cb1(err);
                            });
                        },
                        function(cb1) {
                            ////Update campaign with new users
                            console.log('Updating campaign users')
                            if (req.body.campaigns === undefined || req.body.campaigns.length < 1) {
                                return cb1(null);
                            }
                            async.eachSeries(req.body.campaigns,function(campaign,cb2){
                                qry = "UPDATE campaign SET campaign_owner_user_id = "+campaign.campaignUserId+" WHERE campaign_id = "+campaign.campaignId;
                                
                                ctTrans.query(qry,function(err,data){
                                    cb2(err);
                                });
                            },
                            function(err) {
                                cb1(err);
                            });
                        }
                    ],
                    function(err){
                        cb(err);
                    });
                }
            ],
            function(err){
                if (err) {
                    console.log("This is the err "+err)
                    ctTrans.rollback(function(){
                        callback(err);
                    });
                } else {
                    ctTrans.commit(function(){
                        callback();
                    });
                }
            });
        });
    },
    orgUsers: function(ouid, res) {
        //For AMP3 Use DO NOT CHANGE
        qry = "SELECT cu.ct_user_id,cu.username,cu.role_id";
        qry += ",ou.org_unit_id,ou.org_unit_name";
        qry += " FROM ct_user AS cu"
        qry += " JOIN org_unit AS ou on ou.org_unit_id = cu.ct_user_ou_id";
        qry += " WHERE user_status != 'deleted' AND ct_user_ou_id=" + ouid;
        qry += " ORDER BY username ASC";
        appModel.ctPool.query(qry, function(err, data) {
            if (err) {
                res(err);
            } else {
                res(null, data);
            }
        });
    },
    orgCampaigns: function(ouid, res) {
        //For AMP3 Use DO NOT CHANGE
        var qry = "SELECT c.*";
        qry += ",cu.ct_user_id,cu.username";
        qry += ",ou.org_unit_name";
        qry += " FROM campaign AS c";
        qry += " JOIN ct_user AS cu on cu.ct_user_id = c.campaign_owner_user_id";
        qry += " JOIN org_unit AS ou ON ou.org_unit_id = c.campaign_ou_id";
        qry += " WHERE campaign_status != 'deleted' AND campaign_ou_id=" + ouid;
        appModel.ctPool.query(qry, function(err, data) {
            if (err) {
                res(err);
            } else {
                res(null, data);
            }
        });
    },
    usersForCampaign: function(req,callback){ 
        //For Amp3 use DO NOT CHANGE

        qry = "SELECT cu.ct_user_id,cu.username,cu.role_id";
        qry += ",ou.org_unit_id,ou.org_unit_name"; 
        qry += " FROM ct_user AS cu";
        qry += " JOIN org_unit AS ou ON ou.org_unit_id = cu.ct_user_ou_id";
        qry += " WHERE cu.ct_user_ou_id in";
        qry += " (SELECT org_unit_id FROM org_unit WHERE billing_id = ";
        qry += " (SELECT billing_id FROM org_unit WHERE org_unit_id = "+req.params.ouid+"))";
        qry += " AND cu.role_id in (1,2)"

        appModel.ctPool.query(qry, function (err, data) { 
            if (err) { 
                callback(err);
            } else { 
                callback(null,data); 
            }
        });   
    },
    getAccountOus: function(ouid,callback) {
        //// FOR AMP USE, DO NOT CHANGE

        qry = "SELECT * FROM org_unit WHERE org_unit_id IN ";
        qry += " (SELECT org_unit_id FROM org_unit WHERE billing_id = ";
        qry += "(SELECT billing_id FROM org_unit WHERE org_unit_id = "+ouid+"))";
        qry += " AND org_unit_status = 'active'";

        appModel.ctPool.query(qry, function (err, data) { 
            if (err) { 
                callback(err);
            } else { 
                callback(null,data); 
            }
        });  
    },
    getBillingId: function(ouid,callback) {
        //// FOR AMP USE, DO NOT CHANGE

        qry = "SELECT billing_id FROM org_unit WHERE org_unit_id = "+ouid;

        appModel.ctPool.query(qry, function (err, data) { 
            if (err) { 
                callback(err);
            } else { 
                var billingId = data[0].billing_id;
                callback(null,billingId); 
            }
        });
    },
    getBillingOUNames: function(ouid,callback) {
        //// FOR AMP USE, DO NOT CHANGE
        var qry = "SELECT ob.org_unit_id, ou.org_unit_name FROM org_billing ob JOIN org_unit ou ON ou.org_unit_id = ob.org_unit_id";
        appModel.ctPool.query(qry, function (err, data) {
            if (err) {
                callback(err);
            } else {
                callback(null,data);
            }
        });
    },
    getAccountInfo: function(req, res){
        //// FOR AMP3 USE DO NOT CHANGE
        async.waterfall([
            function (cb){
                var query = "SELECT o.billing_id, o.org_unit_name AS account_name, o.org_unit_status, ob.activation_date, ob.account_code AS account_number, s.subscription_name FROM org_unit o, org_billing ob ";
                query +="LEFT JOIN org_account oa ON (ob.org_unit_id=oa.org_unit_id AND oa.subscription_id IS NOT NULL) ";
                query +="LEFT JOIN subscription s ON (oa.subscription_id=s.subscription_id)  WHERE ob.org_unit_id=" + req.query.id + " AND ob.org_unit_id=o.org_unit_id";
                appModel.ctPool.query(query, function(err, results){
                    if (err){ return cb(err);}
                    cb(err,results[0]);
                });
            },
            function(accountData,cb){
                var account_code = accountData.account_number;
                zuoraController.getSubscriptionByAccount(account_code, function(zuoraResult){
                    if(zuoraResult.success){
                        var subscriptionStatus = _.pluck(zuoraResult.subscriptions, 'status');
                        accountData.subscriptionStatus = subscriptionStatus;
                        cb(null,accountData);
                    }else{
                        cb(null,accountData);
                    }
                });
            },
            function(accountData,cb){
                var tmp = {};
                if(accountData != undefined){
                    tmp = {
                        billingId: accountData.billing_id,
                        accountName: accountData.account_name,
                        orgUnitStatus: accountData.org_unit_status.capitalize(),
                        accountNumber: accountData.account_number,
                        activationDate: moment(accountData.activation_date).format('MMM D, YYYY'),
                        subscriptionName: accountData.subscription_name,
                        subscriptionStatus: accountData.subscriptionStatus
                    };
                    cb(null, tmp);
                }else{
                    cb(null);
                }
            }
        ], function(err,data){
			res(err,data);
		});//async waterfall cb
    },
    validateBillingId: function(req,callback) {
        //// FOR AMP USE, DO NOT CHANGE
        var qry = "SELECT * FROM org_billing ob JOIN org_unit ou ON ou.org_unit_id = ob.org_unit_id WHERE ob.org_unit_id=" + req.query.id + " AND ou.org_unit_status = 'active'";
        appModel.ctPool.query(qry, function (err, data) {
            if (err) {
                callback(err);
            } else {
                callback(null,data);
            }
        });
    },
    fetchS3ExpireValue: function(ouid, callback) {
        qry = "SELECT ou2.s3_exp_hr FROM org_unit ou join org_unit ou2 on ou.billing_id = ou2.org_unit_id WHERE ou.org_unit_id ="+ouid;
        appModel.ctPool.query(qry, function (err, data) { 
            if (err) { 
                callback(err);
            } else {
                var expireInSeconds = 86400*7;
                if(data && data.length && data[0].s3_exp_hr !== null){
                    expireInSeconds = parseInt(data[0].s3_exp_hr)*60*60;
                    callback(null, expireInSeconds); 
                }else{
                    callback(null, expireInSeconds); 
                }
            }
        });

    },
    getGroupBilling: function(ids,res){
    	//For AMP3 Use DO NOT CHANGE
    	var query = "SELECT org_unit_name FROM org_unit WHERE billing_id ="+ids+" AND org_unit_id ="+ids+" AND org_unit_status = 'active';";
		appModel.ctPool.query(query, function (err, data) {
            if(err){
				res(err);
            }else{
                res(null,data);
            }
		});
    }
};

function jsonGetGroupsReport(data) {
    var groupsData = [];

    var states = [
        { subgroup: "US", value: "AK", text: "Alaska" },
        { subgroup: "US", value: "HI", text: "Hawaii" },
        { subgroup: "US", value: "CA", text: "California" },
        { subgroup: "US", value: "NV", text: "Nevada" },
        { subgroup: "US", value: "OR", text: "Oregon" },
        { subgroup: "US", value: "WA", text: "Washington" },
        { subgroup: "US", value: "AZ", text: "Arizona" },
        { subgroup: "US", value: "CO", text: "Colorado" },
        { subgroup: "US", value: "ID", text: "Idaho" },
        { subgroup: "US", value: "MT", text: "Montana" },
        { subgroup: "US", value: "NE", text: "Nebraska" },
        { subgroup: "US", value: "NM", text: "New Mexico" },
        { subgroup: "US", value: "ND", text: "North Dakota" },
        { subgroup: "US", value: "UT", text: "Utah" },
        { subgroup: "US", value: "WY", text: "Wyoming" },
        { subgroup: "US", value: "AL", text: "Alabama" },
        { subgroup: "US", value: "AR", text: "Arkansas" },
        { subgroup: "US", value: "IL", text: "Illinois" },
        { subgroup: "US", value: "IA", text: "Iowa" },
        { subgroup: "US", value: "KS", text: "Kansas" },
        { subgroup: "US", value: "KY", text: "Kentucky" },
        { subgroup: "US", value: "LA", text: "Louisiana" },
        { subgroup: "US", value: "MN", text: "Minnesota" },
        { subgroup: "US", value: "MS", text: "Mississippi" },
        { subgroup: "US", value: "MO", text: "Missouri" },
        { subgroup: "US", value: "OK", text: "Oklahoma" },
        { subgroup: "US", value: "SD", text: "South Dakota" },
        { subgroup: "US", value: "TX", text: "Texas" },
        { subgroup: "US", value: "TN", text: "Tennessee" },
        { subgroup: "US", value: "WI", text: "Wisconsin" },
        { subgroup: "US", value: "CT", text: "Connecticut" },
        { subgroup: "US", value: "DE", text: "Delaware" },
        { subgroup: "US", value: "FL", text: "Florida" },
        { subgroup: "US", value: "GA", text: "Georgia" },
        { subgroup: "US", value: "IN", text: "Indiana" },
        { subgroup: "US", value: "ME", text: "Maine" },
        { subgroup: "US", value: "MD", text: "Maryland" },
        { subgroup: "US", value: "MA", text: "Massachusetts" },
        { subgroup: "US", value: "MI", text: "Michigan" },
        { subgroup: "US", value: "NH", text: "New Hampshire" },
        { subgroup: "US", value: "NJ", text: "New Jersey" },
        { subgroup: "US", value: "NY", text: "New York" },
        { subgroup: "US", value: "NC", text: "North Carolina" },
        { subgroup: "US", value: "OH", text: "Ohio" },
        { subgroup: "US", value: "PA", text: "Pennsylvania" },
        { subgroup: "US", value: "RI", text: "Rhode Island" },
        { subgroup: "US", value: "SC", text: "South Carolina" },
        { subgroup: "US", value: "VT", text: "Vermont" },
        { subgroup: "US", value: "VA", text: "Virginia" },
        { subgroup: "US", value: "WV", text: "West Virginia" },
        { subgroup: "Canada", value: "AB", text: "Alberta" },
        { subgroup: "Canada", value: "BC", text: "British Columbia" },
        { subgroup: "Canada", value: "MB", text: "Manitoba" },
        { subgroup: "Canada", value: "NB", text: "New Brunswick" },
        { subgroup: "Canada", value: "NF", text: "Newfoundland" },
        { subgroup: "Canada", value: "NT", text: "Northwest Territories" },
        { subgroup: "Canada", value: "NS", text: "Nova Scotia" },
        { subgroup: "Canada", value: "ON", text: "Ontario" },
        { subgroup: "Canada", value: "PE", text: "Prince Edward Island" },
        { subgroup: "Canada", value: "QC", text: "Quebec" },
        { subgroup: "Canada", value: "SK", text: "Saskatchewan" },
        { subgroup: "Canada", value: "YT", text: "Yukon" }
    ];

    function getCountryByCode(code) {
        for (var i = 0; i < states.length; i++) {
            if (states[i].value === code) {
                return states[i].text;
            }
        }
    }
 
    for (var i = 0; i < data.length; i++) {
        var tempGroups = {
            account: data[i].account,
            account_ouid: data[i].account_ouid,
            account_external_id: data[i].account_external_id,
            parent_group: data[i].parent_group,
            parent_group_ouid: data[i].parent_group_ouid,
            parent_group_external_id: data[i].parent_group_external_id,
            group: data[i].group,
            group_ouid: data[i].group_ouid,
            group_external_id: data[i].group_external_id,
            industry: data[i].industry,
            phone: data[i].phone,
            city: data[i].city,
            state_province: getCountryByCode(data[i].state_province),
            zip_postal_code: data[i].zip_postal_code,
            enable_conversation_analytics: data[i].enable_conversation_analytics === true ? "Yes" : data[i].enable_conversation_analytics === null ? "" : "No",
            enable_spam_guard: data[i].enable_spam_guard === true ? "Yes" : data[i].enable_spam_guard === null ? "" : "No",
            share_dni_settings: data[i].share_dni_settings === true ? "Yes" : "No",
            repeat_interval: data[i].repeat_interval,

            call_value: data[i].call_value,
            activate_voicemail: data[i].activate_voicemail === true ? "Yes" : data[i].activate_voicemail === null ? "" : "No",
            voicemail_rings: data[i].voicemail_rings === null ? "" : data[i].voicemail_rings,
            overflow_rings: data[i].overflow_rings,
            is_post_call_ivr_enabled: data[i].is_post_call_ivr_enabled === true ? "Yes" : data[i].is_post_call_ivr_enabled === null ? "" : "No",
            post_call_ivr_option: data[i].post_call_ivr_option_id === 1 ? "Call Outcome" : data[i].post_call_ivr_option_id === 2 ? "Agent ID" : data[i].post_call_ivr_option_id === 3 ? "Call Outcome and Agent ID " : '',

            custom_source_name1: data[i].CS1 === undefined ? '' : data[i].CS1,
            custom_source_name2: data[i].CS2 === undefined ? '' : data[i].CS2,
            custom_source_name3: data[i].CS3 === undefined ? '' : data[i].CS3,
            custom_source_name4: data[i].CS4 === undefined ? '' : data[i].CS4,
            custom_source_name5: data[i].CS5 === undefined ? '' : data[i].CS5,
            record_call: data[i].record_call === true ? "Yes" : "No",
            call_recording_disclaimer: data[i].record_call === true ? data[i].call_recording_disclaimer : '',
            voice_prompt: data[i].voice_prompt === true ? "Yes" : "No",
            whisper_message: data[i].whisper_message === true ? "Yes" : "No",
            ring_to_number: data[i].ring_to_number,
            call_action: data[i].call_action,

            html_class: data[i].is_dni_enabled === true ? data[i].html_class: '',
            referring_website: data[i].is_dni_enabled === true ? data[i].referring_website : '',
            host_domain: data[i].is_dni_enabled === true ? data[i].host_domain : ''
        };
        groupsData.push(tempGroups);

    }
    return groupsData;
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

module.exports = orgUnit;
