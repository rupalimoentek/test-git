var connector = require('./appModel'),
    f = require('../functions/functions.js'),
    nodemailer      = require("nodemailer"),
    smtpTransport   = require('nodemailer-smtp-transport'),
	htmlToText      = require('nodemailer-html-to-text').htmlToText,
    fs = require("fs"),
    yaml = require("js-yaml"),
    config = yaml.load(fs.readFileSync('config/config.yml')),
    crypto = require('crypto'),
    envVar = process.env.NODE_ENV,
    async = require('async'),
    q = require("q"),
    _ = require("underscore"),
    appModel = require('./appModel'),
    ctTransactionModel = require('./ctTransactionModel'),
    userpermissions = require('./userPermissionModel'),
    schedulePlansModel = require('./schedulePlansModel'),
    moment = require('moment'),    
    userPermissionsLog = require('./userPermissionsLog'),
    conversation = require('../models/conversationModel'),
    orgComponentCountModel = require('./orgComponentCountModel'),
    table = 'ct_user';

var user = {
	setDefaultPassword: function(req, callback, ctTrans) {
        var qry = "UPDATE ct_user SET password = '0b5f3072f4d67a26af0ad7acdf27ba3b469d5944' WHERE ct_user_id = " + req.body.user.user_id + ";";
        console.log('qry ', qry)
        if (!ctTrans)
            ctTrans = connector.ctPool;
        ctTrans.query(qry, function(err, results) {
            console.log('err ' + err + ' results ' + JSON.stringify(results));
            callback(err, results);
        });
    },
    create: function(req, res, ctTransaction) {
        // First verify if the username value is available
        var ctTrans = new ctTransactionModel.begin(function(err) {
            if (err) { return res(err); }

            if (!ctTransaction) {
                ctTransaction = ctTrans;
            }

            data = req.body.user;
            var is_increment = true;
            var ca_enabled = false;
            var IscallFromDuh = false
            if (data.is_increment !== undefined && data.is_increment !== null) {
                is_increment = data.is_increment;
            }

            if (data.is_call_from_duh !== undefined && data.is_call_from_duh !== null) {
                IscallFromDuh = data.is_call_from_duh;
            }

            data.username = data.username.toLowerCase();
            user.checkUsername(data.username,data.agent_code, req.user.billing_id, null, function(err, res2) {
                if (err) {
                    ctTransaction.rollback(function() {
                        return res(err);
                    }); 
                } else {
                    var ctUserData = {
                        first_name: data.first_name,
                        role_id: data.role_id,
                        ct_user_ou_id: data.ct_user_ou_id,
                        username: data.username,
                        user_status: data.user_status.toLowerCase()
                    };
                    if (data.last_name) ctUserData.last_name = data.last_name;
                    if (data.user_ext_id) ctUserData.user_ext_id = data.user_ext_id;

                    if (data.hashPassword !== undefined && !data.hashPassord && data.password !== undefined) {
                        ctUserData.password = data.password
                    } else {
                        ctUserData.password = ((data.password !== null && data.password !== '' && data.password !== undefined) ? user.getHash(data.password) : user.getHash('lmc2demo'));
                    }
                    if(data.agent_ring_to !== undefined || data.agent_ring_to !== null || data.agent_ring_to !== ''){
                        user.checkAgentRingto(data.agent_ring_to, null, function(err, result){
                            if(err){
                                res("Agent ring to is already exists");
                            }else{
                                createUser(req,ctUserData,ctTransaction,is_increment,IscallFromDuh,ca_enabled,function(err, result){
                                    res(err, result);
                                });
                            } 
                        })
                    }
                }
            });
        });
    },
    update: function(req, res) {
        data = req.body.user

        var isDisabledUser = false;
        // first check to see if e-mail has changed or in use by another user
        // First verify if the username value is available and normalize to all lowercase
        var ctTrans = new ctTransactionModel.begin(function(err) {
            if (err) { return res(err); }
            data.username = data.username.toLowerCase();
             if(data.agent_ring_to !== undefined || data.agent_ring_to !== null || data.agent_ring_to !== ''){
                user.checkAgentRingto(data.agent_ring_to, data.ct_user_id, function(err, result){
                    if(err){
                        res("Agent ring to is already exists");
                    }else{
                        user.checkUsername(data.username,data.agent_code, req.user.billing_id, data.ct_user_id, function(err, res3) {
                            if (err) { return res(err); }

                            var orig = [];
                            var qry = "SELECT * FROM ct_user WHERE ct_user_id=" + data.ct_user_id;
                            connector.ctPool.query(qry, function(err, orig) {
                                if (err) { return res('Failed to retrieve original user record. ' + err); }

                                orig = orig;
                                var ctUserData = {};
                                
                                if (data.password) {        
                                    ctUserData.ct_user_id = data.ct_user_id;
                                    if (data.first_name) { ctUserData.first_name = data.first_name; }
                                    if (data.last_name) { ctUserData.last_name = data.last_name; }
                                    // if (data.role_id) { ctUserData.role_id = data.role_id; }
                                    if (data.ct_user_ou_id) { ctUserData.ct_user_ou_id = data.ct_user_ou_id; }
                                    if (data.username) { ctUserData.username = data.username; }
                                    if (data.user_ext_id === '' || data.user_ext_id) { ctUserData.user_ext_id = data.user_ext_id; }
                                    if (data.user_status) { ctUserData.user_status = data.user_status.toLowerCase(); }
                                    ctUserData.password = user.getHash(data.password);
                                }
                                else{                                        
                                    ctUserData.ct_user_id = data.ct_user_id;
                                    if (data.first_name) { ctUserData.first_name = data.first_name; }
                                    if (data.last_name) { ctUserData.last_name = data.last_name; }
                                    if (data.role_id) { ctUserData.role_id = data.role_id; }
                                    if (data.ct_user_ou_id) { ctUserData.ct_user_ou_id = data.ct_user_ou_id; }
                                    if (data.username) { ctUserData.username = data.username; }
                                    if (data.user_ext_id === '' || data.user_ext_id) { ctUserData.user_ext_id = data.user_ext_id; }
                                    if (data.user_status) { ctUserData.user_status = data.user_status.toLowerCase(); }
                                }
                                if (data.user_status !== 'active') {
                                    isDisabledUser = true;
                                }

                                var updateData = {
                                    which: 'update',
                                    table: table,
                                    values: ctUserData
                                };
                                async.parallel([
                                        function(callback) {
                                            ctTrans.query(updateData, function(err, result) {
                                                callback(err, result);
                                            });
                                        },
                                        function(callback) {

                                            var ctUserDetailData = {};
                                            if (data.agent_code) {
                                                 ctUserDetailData.agent_code = data.agent_code;
                                            }else{
                                               ctUserDetailData.agent_code = null;
                                            }
					                        if (data.agent_ring_to === undefined || !data.agent_ring_to ) { 
                                    		    ctUserDetailData.agent_ring_to = null;
                                		    }else{
                                    		    ctUserDetailData.agent_ring_to = data.agent_ring_to.toLowerCase();
                                	        }
                                            if (data.primary_phone !== undefined) ctUserDetailData.primary_phone = data.primary_phone;
                                            if (data.mobile_phone) ctUserDetailData.mobile_phone = data.mobile_phone;
                                            if (data.add_to_campaigns === true || data.add_to_campaigns === false) ctUserDetailData.add_to_campaigns = data.add_to_campaigns;
                                            if (data.timezone) ctUserDetailData.timezone = data.timezone;
                                            var date_timestamp = f.mysqlTimestamp();
                                            ctUserDetailData.user_modified = date_timestamp;
                                            var updateData = {
                                                which: 'update',
                                                table: 'ct_user_detail',
                                                values: ctUserDetailData,
                                                where: ' WHERE ct_user_id = ' + data.ct_user_id
                                            };
                                            //console.log(updateData);
                                            ctTrans.query(updateData, function(err, result2) {
                                                if (err) { callback(err, result2); }

                                                // check for user status change and adjust count if need be
                                                if (orig[0].user_status !== undefined && data.user_status !== undefined) {
                                                    if (orig[0].user_status.toLowerCase() !== data.user_status.toLowerCase()) { // status has changed
                                                        if (data.user_status.toLowerCase() === 'active') {
                                                            orgComponentCountModel.increment(connector.ctPool, 3, data.ct_user_ou_id, 1, function(err) {
                                                                // if (err) { return res('Failed to increment the user count. ' + err); }
                                                                callback(err, result2);
                                                            });
                                                        } else if (data.user_status.toLowerCase() !== 'suspended') {
                                                            orgComponentCountModel.decrement(connector.ctPool, 3, data.ct_user_ou_id, 1, function(err) {
                                                                // if (err) { return res('Failed to increment the user count. ' + err); }
                                                                callback(err, result2);
                                                            });
                                                        }
                                                    } else {
                                                        callback(null, result2);
                                                    }
                                                } else {
                                                    callback(null, result2);
                                                }
                                            });
                                        },
                                        function(callback) {
                                            if (data.add_user_to_camapains) {
                                                var accessController = require('../controllers/userAccessController');
                                                accessController.campaignList(req.user.user_id, data.ct_user_ou_id, req.user.role_id, function(err, camplist) {
                                                    var campaignCtUserModel = require('../models/campaignCtUserModel');
                                                    campaignCtUserModel.insertManyCampaigns(ctTrans, data.ct_user_id, camplist, function(err, data) {
                                                        callback(err, data);
                                                    });
                                                });
                                            } else {
                                                callback(null);
                                            }
                                        },
                                        
                                        /*function(callback) {
                                            var userpermissionsData = {};
                                            userpermissionsData.score_call = false;
                                            if (data.role_id === '1') {
                                                userpermissionsData.score_call = true;
                                            }                                       
                                            var updateUserPermissionData = {
                                                which: 'update',
                                                table: 'user_permissions',
                                                values: userpermissionsData,
                                                where: ' WHERE ct_user_id = ' + data.ct_user_id
                                            };
                                            ctTrans.update(updateUserPermissionData, function(err) {
                                                if (err) {
                                                    console.log(err);
                                                    return callback(err);
                                                }
                                                callback(null);
                                            });
                                        },*/

                                        function(callback) {
                                            console.log(data.user_status);

                                            if(ctUserData.user_status === 'inactive'){
                                                var updateQry = "UPDATE call SET ct_user_id = NULL WHERE call_id IN( "
                                                updateQry += " SELECT c.call_id FROM call c"
                                                updateQry += " LEFT JOIN score_card_calls scc ON c.call_id = scc.call_id"  
                                                updateQry += " WHERE c.ct_user_id = "+ data.ct_user_id +" AND (scc.score_card_call_status = 'unscored' OR scc.score_card_call_status IS NULL))";
                                                ctTrans.query(updateQry, function(err, updateResult2) {
                                                    callback(null);
                                                });
                                            }else{
                                                callback(null);
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
                        });
                    }
                })
            }
        });
    },
    deleteUser: function(req, res) {
        data = req.body.user
            // first check to see if e-mail has changed or in use by another user
            // First verify if the username value is available and normalize to all lowercase
        var ctTrans = new ctTransactionModel.begin(function(err) {
            if (err) { return res(err); }
            data.username = data.username.toLowerCase();
            user.checkUsername(data.username,null, req.user.billing_id, data.ct_user_id, function(err, res3) {
                if (err) { return res(err); }
                var orig = [];
                var qry = "SELECT * FROM ct_user WHERE ct_user_id=" + data.ct_user_id;
                connector.ctPool.query(qry, function(err, orig) {
                    if (err) { return res('Failed to retrieve original user record. ' + err); }
                    orig = orig;
                    async.parallel([
                            function(callback) {
                                var deleteQry = {
                                    which: "query",
                                    // qry: "delete from ct_user WHERE ct_user_id=" + data.ct_user_id
                                    qry: "UPDATE ct_user SET user_status = 'deleted', username = '_deleted_"+ moment().format('YYYYMMDD_HHmmss')+"_"+ data.username + "' where ct_user_id = " + data.ct_user_id
                                };
                                ctTrans.query(deleteQry, function(err, deleteResult) {
                                    callback(err, deleteResult);
                                });
                            },
                            function(callback) {
                                var ctUserDetailData = {};
                                if (data.primary_phone !== undefined) ctUserDetailData.primary_phone = data.primary_phone;
                                if (data.mobile_phone) ctUserDetailData.mobile_phone = data.mobile_phone;
                                if (data.add_to_campaigns === true || data.add_to_campaigns === false) ctUserDetailData.add_to_campaigns = data.add_to_campaigns;
                                if (data.timezone) ctUserDetailData.timezone = data.timezone;
                                var date_timestamp = f.mysqlTimestamp();
                                ctUserDetailData.user_modified = date_timestamp;
                                ctUserDetailData.agent_ring_to = null;
                                var updateData = {
                                    which: 'update',
                                    table: 'ct_user_detail',
                                    values: ctUserDetailData,
                                    where: ' WHERE ct_user_id = ' + data.ct_user_id
                                };
                                ctTrans.query(updateData, function(err, result2) {
                                    if (err) { callback(err, result2); }
                                    if (orig[0].user_status !== data.user_status) { // status has changed
                                        orgComponentCountModel.decrement(connector.ctPool, 3, data.ct_user_ou_id, 1, function(err) {
                                            console.log(result2);
                                            // if (err) { return res('Failed to increment the user count. ' + err); }
                                            callback(err, result2);
                                        });
                                    }
                                });
                            },
                            function(callback) {
                                var deleteQry = {
                                    which: "query",
                                    qry: "DELETE from email_recipient where ct_user_id = " + data.ct_user_id
                                };
                                ctTrans.query(deleteQry, function(err, deleteResult2) {
                                    callback(err, deleteResult2);
                                });

                            },
                            function(callback) {
                                var updateQry = "UPDATE call SET ct_user_id = NULL WHERE call_id IN( ";
                                updateQry += " SELECT c.call_id FROM call c"
                                updateQry += " LEFT JOIN score_card_calls scc ON c.call_id = scc.call_id"  
                                updateQry += " WHERE c.ct_user_id = "+ data.ct_user_id +" AND (scc.score_card_call_status = 'unscored' OR scc.score_card_call_status IS NULL))";
                                ctTrans.query(updateQry, function(err, updateResult2) {
                                    if (updateResult2.length == 0){
                                        callback(null, updateResult2);
                                    }else{
                                        callback(err, updateResult2);
                                    }
                                    
                                });

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
                            if (!err) {
                                schedulePlansModel.deleteLookerUser(orig[0].looker_user_id, function(err, result) {
                                    if(err){
                                        var msg = "Hello Support,<br/>";
                                        msg += "Error on deleting UserId "+ orig[0].ct_user_id+" <br/><br/>";
                                        msg += "Error : "+err;

                                        var mailOptions = {
                                            from        : 'no-reply@messages.services',
                                            to          : config[envVar].SUPPORT_EMAIL,
                                            replyTo     : 'no-reply@messages.services',
                                            subject     : "Error on deleting UserId : "+orig[0].ct_user_id,
                                            html        : msg
                                        };
                                        var transport = nodemailer.createTransport(smtpTransport({
                                            host        : 'localhost',
                                            port        : 25,
                                            ignoreTLS   : true,
                                            secure      : false
                                        }));
                                        transport.use('compile', htmlToText());
                                        console.log('Sending e-mail');
                                        transport.sendMail(mailOptions, function(err, res2) {
                                            if (err) { console.log('Failed to send e-mail. '+err); }
                                            console.log('Successfully sent', res2);
                                        });
                                    }        
                                });
                            }
                        });
                });
            });
        });
    },

    // @returnvalue ->  a promise of results after update
    // @param -> partialRecordsOfUsers should be similar to this format,
    //  [
    //    { ct_user_id: 121, ct_user_ou_id: 3, user_status: 'active' },
    //    { ct_user_id: 158, ct_user_ou_id: 1, user_status: 'active' },
    //    { ct_user_id: 161, ct_user_ou_id: 1, user_status: 'inactive' },
    //    { ct_user_id: 164, ct_user_ou_id: 2, user_status: 'active' },
    //    { ct_user_id: 170, ct_user_ou_id: 2, user_status: 'active' }
    //    ... etc
    //  ]
    // @param -> newStatusForUsers should be 'active' or 'inactive' or 'deleted'

    // Notes -
    // -Per example above, can split users between different org units or current user status
    // -Can switch active or inactive to deleted
    //   or can switch active or inactive to its opposite BUT
    //   can not switch deleted back to active or inactive

    multipleChangeUserStatus: function(partialRecordsOfUsers, newStatusForUsers, ctTransModelPassedIn) {

        var deferred = q.defer();

        // Parameter validation
        if (!partialRecordsOfUsers || !Array.isArray(partialRecordsOfUsers)) {
            throw "user records parameter is invalid for multipleChangeUserStatus";
        }
        if (!_.contains(["active", "inactive", "deleted"], newStatusForUsers)) {
            throw "invalid status to switch records to for multipleChangeUserStatus";
        }

        // Parameter validation
        if (!partialRecordsOfUsers || !Array.isArray(partialRecordsOfUsers)) {
            throw "user records parameter is invalid for multipleChangeUserStatus";
        }
        if (!_.contains(["active", "inactive", "deleted"], newStatusForUsers)) {
            throw "invalid status to switch records to for multipleChangeUserStatus";
        }

        if (!partialRecordsOfUsers.length) {
            deferred.resolve("no users to change status");
            return deferred.promise;
        }

        // ex result [121, 158, 161, 164, 170]
        // use later for updating all user records
        var userIdsToSwitchStatus = _.pluck(partialRecordsOfUsers, "ct_user_id");

        // ex result [121, 158, 161, 164, 170]
        // use later for updating all user records
        var userIdsToSwitchStatus = _.pluck(partialRecordsOfUsers, "ct_user_id");

        ///////////////////////////////////////
        //  For updating component count table
        ///////////////////////////////////////

        ///////////////////////////////////////
        //  For updating component count table
        ///////////////////////////////////////

        // ex result {3: [user1], 1: [user2, user3], 2:[user4, user5]}
        var usersGroupedByOuId = _.groupBy(partialRecordsOfUsers, "ct_user_ou_id");

        // cont. ex result ->
        // {
        //    3: {active:[user1]}
        //    1: {active:[user2], inactive:[user3]},
        //    2: {active:[user4, user5]}
        // }
        _.each(usersGroupedByOuId, function(arrUsers, ouIdKey, arrEntire) {
            arrEntire[ouIdKey] = _.groupBy(arrUsers, "user_status");
        });

        // async.each can't iterate over an object and give you the keys, which
        // contain the data, so this is a small abstraction above what we already have
        usersGroupedByOuId = _.map(usersGroupedByOuId, function(val, key) {
            return { ouid: key, statuses: val };
        });

        async.each(usersGroupedByOuId,
            function iterationCallback(orgUnitGrouping, cbDone) {
                var qryFinal = qryBuilderBasedOnStatuses(orgUnitGrouping.statuses, newStatusForUsers);
                // this would be false if we didn't build a qry
                if (qryFinal) {
                    qryFinal += " WHERE component_id = 3 AND org_unit_id = " + orgUnitGrouping.ouid;
                    ctTransModelPassedIn.query(qryFinal, function(err, result) {
                        if (err) {
                            cbDone(err);
                        } else {
                            cbDone(); // yay success
                        }
                    });
                } else {
                    cbDone();
                }
            },

            function endCallback(err) {
                // org_component_count table should be updated now
                if (err) {
                    console.log("error inside endCallback!---- ", err);
                    return deferred.reject(err);
                }

                // Time to update ct_user table to actually switch the status now for users in set
                //if (newStatusForUsers != 'deleted') {
                   var qry = 'SELECT ct_user_id, username FROM ct_user WHERE ct_user_id IN (' + userIdsToSwitchStatus.join(",") + ')';
                            console.log(qry)
                            ctTransModelPassedIn.query(qry, function(err, result){
                                console.log("Data", result);
                                async.eachSeries(result, function(cid, sp){
                                    var userTableUpdateQry = "UPDATE ct_user SET user_status = '" + newStatusForUsers +"', username = '_deleted_"+ moment().format('YYYYMMDD_HHmmss')+"_"+ cid.username + "' WHERE ct_user_id = "+cid.ct_user_id;
                                    ctTransModelPassedIn.query(userTableUpdateQry, function(err, result) {
                                    // ct_user table should be updated now
                                        if (err) {
                                            sp(err);
                                        } else {
                                            sp()
                                        }
                                    });
                                }, function(err){
                                    if (err) {
                                        console.log("error inside endCallback!---- ", err);
                                        return deferred.reject(err);
                                    } else {
                                        return deferred.resolve(result);
                                    }
                                });
                            });
                        
                       
                    
                    
                // } else {
                //     var userTableUpdateQry = "DELETE from ct_user WHERE ct_user_id IN (" + userIdsToSwitchStatus.join(",") + ")";
                //     ctTransModelPassedIn.query(userTableUpdateQry, function(err, result) {
                //         // ct_user table should be updated now
                //         if (err) {
                //             console.log("error inside endCallback!---- ", err);
                //             return deferred.reject(err);
                //         } else {
                //             return deferred.resolve(result);
                //         }
                //     });
                // }

            }
        );

        return deferred.promise;


        // Helper function
        function qryBuilderBasedOnStatuses(thisOuStatusesToChange, statusToSwitchTo) {

            var updateQry = "UPDATE org_component_count ";
            var activeCount = !_.isUndefined(thisOuStatusesToChange.active) ?
                thisOuStatusesToChange.active.length :
                0;
            var inactiveCount = !_.isUndefined(thisOuStatusesToChange.inactive) ?
                thisOuStatusesToChange.inactive.length :
                0;

            var deletedCount = !_.isUndefined(thisOuStatusesToChange.deleted) ?
                thisOuStatusesToChange.deleted.length :
                0;

            // _.contains is an easy way to do multiple OR checks
            function totals_col_arithmetic_partial_qry(columnToModify, method, qtyToDecrement) {
                if (!_.contains(["count_total", "secondary_total"], columnToModify) || !_.contains(["decrement", "increment"], method) ||
                    (typeof qtyToDecrement !== "number" && qtyToDecrement < 0)) {
                    throw "incorrect parameter(s) passed to totals_col_arithmetic_partial_qry function";
                }

                var arithMethod = { increment: " + ", decrement: " - " };
                return columnToModify + " = " + columnToModify + arithMethod[method] + qtyToDecrement;
            }

            if (statusToSwitchTo === "deleted") {
                if (activeCount !== 0 && inactiveCount !== 0) {
                    updateQry += "SET " + totals_col_arithmetic_partial_qry("count_total", "decrement", activeCount) + ",";
                    updateQry += totals_col_arithmetic_partial_qry("secondary_total", "decrement", inactiveCount);
                } else if (activeCount !== 0) {
                    updateQry += "SET " + totals_col_arithmetic_partial_qry("count_total", "decrement", activeCount);
                } else if (inactiveCount !== 0) {
                    updateQry += "SET " + totals_col_arithmetic_partial_qry("secondary_total", "decrement", inactiveCount);
                } else {
                    console.log("we don't have anything deleteable to delete!");
                    return false;
                }
            } else if (statusToSwitchTo === "active") {

                if (inactiveCount === 0 && deletedCount === 0) {
                    // No need to update count since there isn't anything to change
                    return false;
                } else {
                    updateQry += "SET " + totals_col_arithmetic_partial_qry("secondary_total", "decrement", inactiveCount) + ",";
                    updateQry += totals_col_arithmetic_partial_qry("count_total", "increment", inactiveCount + deletedCount);
                }
            } else if (statusToSwitchTo === "inactive") {

                if (activeCount === 0 && deletedCount === 0) {
                    // No need to update count since there isn't anything to change
                    return false;
                } else {
                    updateQry += "SET " + totals_col_arithmetic_partial_qry("secondary_total", "increment", activeCount + deletedCount) + ",";
                    updateQry += totals_col_arithmetic_partial_qry("count_total", "decrement", activeCount);

                }
            }

            return updateQry;
        } // end qryBuilderBasedOnStatuses inside multipleChangeUserStatus()
    }, // end multipleChangeUserStatus()

    read: function(data, res) {
        //TODO: validate and sanitize data before running query.
        //console.log(data);
        var whereClause = ' where 1=1 '; 
        if (data.ct_user_id) {
            whereClause += " and ctu.ct_user_id = '" + data.ct_user_id + "' ";
        }
		else {
			whereClause += " and pau.ct_user_id is NULL AND ctu.role_id != 4 "; //don't display partner admin child users or support admin users unless looking up by id
		}
        if (data.email) {
            whereClause += " and ctu.username = '" + data.email + "' ";
        }
        if (data.ct_user_ou_id) {
            whereClause += " and ctu.ct_user_ou_id = '" + data.ct_user_ou_id + "' ";
        }
        if (data.user_ext_id) {
            whereClause += " and ctu.user_ext_id = '" + data.user_ext_id + "' ";
        }
        if (data.role_id) {
            whereClause += " and ctu.role_id = '" + data.role_id + "' ";
        }
        if (data.first_name) {
            whereClause += " and ctu.first_name = '" + data.first_name + "' ";
        }
        if (data.last_name) {
            whereClause += " and ctu.last_name = '" + data.last_name + "' ";
        }
        if (data.user_status) {
            if (data.user_status == "deleted") {
                whereClause += " and ctu.user_status != '" + data.user_status + "' ";
            } else {
                whereClause += " and ctu.user_status = '" + data.user_status + "' ";
            }
        }
        var orderBy = " ORDER BY ctu.first_name ";
        var query = "SELECT ctu.ct_user_id, ctu.user_ext_id, ctu.username, ctu.first_name, ctu.last_name, ctu.role_id, ";
        query += "r.role_name, ctud.primary_phone, ctud.mobile_phone, ctu.ct_user_ou_id, ou.org_unit_name, ";
        query += "ctud.user_created, ctud.user_modified, ctu.user_status, ctud.agent_code, ctud.agent_ring_to, ctud.timezone, count(c.call_id) as assigned_calls, array_to_string(array_agg(er.list_id), ',') as list_ids ";
        query += "FROM " + table + " as ctu ";
        query += "LEFT JOIN ct_user_detail AS ctud ON ctud.ct_user_id = ctu.ct_user_id ";
        query += "JOIN org_unit AS ou ON ou.org_unit_id = ctu.ct_user_ou_id ";
        query += "JOIN role AS r ON r.role_id = ctu.role_id ";
        query += "LEFT JOIN email_recipient er ON er.ct_user_id=ctu.ct_user_id ";
        query += "LEFT JOIN call c ON c.ct_user_id = ctu.ct_user_id ";
		query += "LEFT JOIN partner_admin_user pau on pau.ct_user_id = ctu.ct_user_id ";
        query += whereClause;
        query += " GROUP BY ctu.ct_user_id, r.role_name, ctud.ct_user_id, ou.org_unit_id "
        query += orderBy;
        //console.log(query);
        connector.ctPool.query(query, function(err, data) {
            res(err, data);
        });
    },
    checkUsername: function (email, agentcode, billingId, userid, res) {
    async.waterfall([
        function(cb){
            email = email.toLowerCase();
            var qry = "SELECT * FROM ct_user WHERE username='" + email + "'";
            connector.ctPool.query(qry, function (err, result) {
                if (err) {
                    cb(err);
                    return;
                }
                if (result.length > 0) {
                    if (userid && userid.toString() === result[0].ct_user_id.toString()) {
                        cb(null, result);
                    } else {
                        cb('Email selected is already in use');
                    }
                } else {
                    cb(null, []);
                }
            });
        },
        function(result, cb){
            if (billingId === undefined) {
                //// This is an AMP user migration
                return cb(null,[]);
            }
            if(agentcode !== null && agentcode !== undefined){
                var qry = "SELECT * FROM ct_user ct JOIN org_unit ou ON (ct.ct_user_ou_id = ou.org_unit_id) JOIN ct_user_detail cud ON (cud.ct_user_id = ct.ct_user_id) WHERE cud.agent_code = '"+agentcode +"' AND ct_user_ou_id IN ( select org_unit_id from org_unit where  billing_id = "+billingId+")";
                connector.ctPool.query(qry, function (err, result) {
                    if (err) {
                        cb(err);
                        return;
                    }
                    if (result.length > 0) {
                        if (userid && userid.toString() === result[0].ct_user_id.toString()) {
                            cb(null, result);
                        } else {
                            cb('Agent ID selected is already in use');
                        }
                    } else {
                        cb(null, result);
                    }
                });
            }else{
                cb(null, []);
            }
        }
        ],
        function(err, result){
            if (err) { return res(err); }
            res(null,result);
        });
    },

    checkAgentRingto:function(agent_ring_to, userid, res){
        var qry = "SELECT * FROM ct_user_detail WHERE agent_ring_to='" + agent_ring_to + "'";
        connector.ctPool.query(qry, function(err, result) {
            if (err) {
            res(err);
                return;
            }
            if (result.length > 0) {
                if (userid && userid.toString() === result[0].ct_user_id.toString()) {
                    res(null, result);
                } else {
                    res('This number is already assigned to another User');
                }
            } else {
                res(null, result);
            }
        });
    },    
    getByFirstnameLastname: function(first_name, last_name, res) {
        var query = "SELECT * FROM " + table + " AS cu ";
        query += "LEFT JOIN ct_user_detail as cud ON cud.ct_user_id = cu.ct_user_id ";
        query += "WHERE cu.first_name = '" + first_name + "' AND cu.last_name = '" + last_name + "' LIMIT 1";
        connector.ctPool.query(query, function(err, data) {
            res(data);
        });

    },
    getUserOrganizationalUnits: function(first_name, last_name, res) {
        this.getByFirstnameLastname(first_name, last_name, function(data) {
            var result = [];
            if (data.length > 0) {
                result.push({ userEmail: data[0].username });
                var organizationanlUnits = require('./orgUnit');
                orgUnit.ouAndDescendents(data[0].org_unit_id, function(data2) {
                    result.push({ ous: data2 });
                    res(result);
                });
            } else {
                res(result);
            }

        });
    },
    getByLoginPass: function(username, password, res) {

        // If using the support login admin, we need to internally send the plain hash of the password
        // to know when to avoid hashing the already hashed PW, we use this string flag at the end of the PW
        // to recognize it
        var supportSecretPass = require("./supportSecret.js");
        var passwordToLookUp = (password.indexOf(supportSecretPass) !== -1) ? password.replace(supportSecretPass, "") : user.getHash(password);

        var qry = "SELECT u.username AS email, u.ct_user_id AS user_id, u.first_name, u.last_name, u.ct_user_ou_id AS ou_id, u.role_id, o.billing_id, o.top_ou_id AS tl_id, ud.timezone, o.org_unit_name AS ou_name, " +
            "oo.org_unit_id AS tl_org_unit_id, oo.org_unit_name AS tl_org_unit_name, o.org_unit_id, o.org_unit_parent_id , u.looker_user_id as looker_user_id " +
            "FROM ct_user u, ct_user_detail ud, org_unit o LEFT JOIN org_unit oo ON (o.top_ou_id=oo.org_unit_id) " +
            "WHERE u.username='" + username + "' AND u.password='" + passwordToLookUp + "' AND u.user_status='active' AND " + "u.ct_user_id=ud.ct_user_id AND u.ct_user_ou_id=o.org_unit_id";
        connector.ctPool.query(qry, function(err, data) {
            if (err) { return res(err); }
            if (data.length < 1) { return res('Failed to find any matching record'); }
            user.getProtectCallerIdByOuId(data[0].org_unit_id, function(err, result) {
                data[0].protect_caller_id = result.protect_caller_id;
                if (data[0].tl_org_unit_id === data[0].org_unit_id) {
                    data[0].user_ou_level = 0;
                } else if (data[0].tl_org_unit_id === data[0].org_unit_parent_id) {
                    data[0].user_ou_level = 1;
                } else {
                    data[0].user_ou_level = 2;
                }
                user.getMigratedStatus(data, function (err, result) {
                    userpermissions.getAllUserPermission(data[0].user_id, data[0].org_unit_id, data[0].role_id, function (err, permission) {
                        data[0].user_permissions_ou_list = permission[0].groups_list;
                        data[0].reports = permission[0].reports;
                        data[0].score_call = permission[0].score_call;
                        data[0].access_audio = permission[0].access_audio;
						data[0].looker_old_ui = permission[0].looker_old_ui;
                        if (result.length) {
                            data[0].is_migrated = result[0].is_migrated;
                        }
                        user.getAudioDownloadSettings(data[0].org_unit_id, function (err, result) {
                            data[0].download_audio_enabled = result;
                            conversation.badgeUpdation(data[0], function (err, count) {
                                user.getLevelOneOuList(data[0], function (err, result1) {
                                    user.getAudioList(result1, function (err, userData) {
                                        res(err, userData);
                                    });
                                });
                            })
                        })
                    });
                });
            });
        });
    },
    getByLoginUserId: function(userId, res) {
        var qry = "SELECT u.username AS email, u.ct_user_id AS user_id, u.first_name, u.last_name, u.ct_user_ou_id AS ou_id, u.role_id, o.billing_id, o.top_ou_id AS tl_id, ud.timezone, o.org_unit_name AS ou_name, " +
            "oo.org_unit_id AS tl_org_unit_id, oo.org_unit_name AS tl_org_unit_name, o.org_unit_id, o.org_unit_parent_id , u.looker_user_id as looker_user_id " +
            "FROM ct_user u, ct_user_detail ud, org_unit o LEFT JOIN org_unit oo ON (o.top_ou_id=oo.org_unit_id) " +
            "WHERE u.ct_user_id = "+userId+" AND u.user_status='active' AND " + "u.ct_user_id=ud.ct_user_id AND u.ct_user_ou_id=o.org_unit_id";
        connector.ctPool.query(qry, function(err, data) {
            if (err) { return res(err); }
            if (data.length < 1) { return res('Failed to find any matching record'); }
            user.getProtectCallerIdByOuId(data[0].org_unit_id, function(err, result) {
                data[0].protect_caller_id = result.protect_caller_id;
                if (data[0].tl_org_unit_id === data[0].org_unit_id) {
                    data[0].user_ou_level = 0;
                } else if (data[0].tl_org_unit_id === data[0].org_unit_parent_id) {
                    data[0].user_ou_level = 1;
                } else {
                    data[0].user_ou_level = 2;
                }
                user.getMigratedStatus(data, function(err, result){
                    userpermissions.getAllUserPermission(data[0].user_id, data[0].org_unit_id, data[0].role_id, function(err, permission) {
                        data[0].user_permissions_ou_list = permission[0].groups_list;
                        data[0].reports = permission[0].reports;
                        data[0].score_call = permission[0].score_call;
                        data[0].access_audio = permission[0].access_audio;
                        if(result.length){
                            data[0].is_migrated = result[0].is_migrated;
                        }
                        conversation.badgeUpdation(data[0],function(err,count){
                            user.getLevelOneOuList(data[0], function(err, result1) {
                                user.getAudioList(result1 , function(err, userData){
                                    res(err, userData);
                                });
                            });
                        })
                    });
                });
            });
        });
    },
    getAudioList: function(data, res){
        async.parallel([
            function(callback){
                user.getPrompts(data, function(err, result){
                    if(result.length){
                        data.prompts = result;
                    }else{
                        data.prompts = [];
                    }
                    callback(null);
                });
            },
            function(callback){
                user.getWhispers(data, function(err, result){
                    if(result.length){
                        data.whispers = result;
                    }else{
                        data.whispers = [];
                    }
                    callback(null);
                });
            },
            function(callback){
                user.getVoicemails(data, function(err, result){
                    if(result.length){
                        data.voicemails = result;
                    }else{
                        data.voicemails = [];
                    }
                    callback(null);
                });
            },
            function(callback){
                qry = "SELECT ou2.s3_exp_hr FROM org_unit ou join org_unit ou2 on ou.billing_id = ou2.org_unit_id WHERE ou.org_unit_id ="+data.ou_id;
                connector.ctPool.query(qry, function (err, result) { 
                    var expireInSeconds = 86400*7;
                    if(result && result.length && result[0].s3_exp_hr !== null){
                        data.s3_expire = parseInt(result[0].s3_exp_hr)*60*60;
                        callback(null);
                    }else{
                        data.s3_expire = expireInSeconds;
                        callback(null);
                    }
                });
            }
          ], function (err) {
            res(err, data);
          });
    },
    getLevelOneOuList: function(data, res) {
        var ctOuData = [];
        var whereClause = " WHERE org_unit_status != 'deleted' ";
        var orderByClause = " ORDER BY ou.org_unit_name ";
        if (data.user_ou_level === 0) {
            if (data.org_unit_id) whereClause += " AND ou.org_unit_id = '" + data.org_unit_id + "' ";
        } else {
            if (data.org_unit_parent_id) whereClause += " AND org_unit_parent_id = '" + data.org_unit_parent_id + "' ";
        }
        var query = "SELECT ou.org_unit_id as id, ou.org_unit_name as name FROM org_unit ou ";
        query += "JOIN org_unit_detail oud ON (oud.org_unit_id = ou.org_unit_id) ";
        query += whereClause;
        query += orderByClause;
        appModel.ctPool.query(query, function(err, ousData) {
            async.each(ousData, function(ouData, cb) {
                if (data.user_permissions_ou_list.indexOf(ouData.id) > -1) {
                    ctOuData.push(ouData);
                }
                cb(null);
            }, function(err) {
                if (err) { return res(err); }
                data.levelOneOus = ctOuData;
                res(null, data);
            });
        });
    },
    getByUsernamePassword: function(username, hash, res) {
        console.log('calling getByUsernamePassword');
        var query = "SELECT usr.ct_user_id as user_id, usr.first_name as user_first_name, usr.last_name as user_last_name, usr.username as username, ";
        query += "org_unit.org_unit_id as org_unit_id, org_unit.org_unit_name as org_unit_name, org_unit.org_unit_parent_id, ";
        query += "tl_org_unit.org_unit_id as tl_org_unit_id, tl_org_unit.org_unit_name as tl_org_unit_name, cud.timezone";
        query += " FROM ct_user AS usr";
        query += " LEFT JOIN ct_user_detail cud ON (usr.ct_user_id=cud.ct_user_id)";
        query += " LEFT JOIN org_unit AS org_unit ON org_unit.org_unit_id=usr.ct_user_ou_id ";
        query += " LEFT JOIN org_unit AS tl_org_unit ON org_unit.top_ou_id=tl_org_unit.org_unit_id ";
        query += " WHERE usr.username  = '" + username + "'";
        query += " AND usr.password = '" + hash + "' AND usr.user_status='active' LIMIT 1";
        connector.ctPool.query(query, function(err, data) {
            console.log('user/pass check');
            console.log(data);
            if (data.length < 1) {
                res('Failed to find any matching record');
                return;
            }
            //console.log('\n\ndata: ' + JSON.stringify(data))
            if (!data[0].org_unit_parent_id && !data[0].tl_org_unit_id) {
                data[0].tl_org_unit_id = data[0].org_unit_id;
                data[0].tl_org_unit_name = data[0].org_unit_name;
            }
            res(null, data);
        });
    },
    getById: function(id, res) {
        var qry = "SELECT u.ct_user_id AS user_id, u.username AS username, u.first_name, u.last_name, u.ct_user_ou_id AS ou_id, u.role_id, o.billing_id, o.top_ou_id AS tl_id, ud.timezone, o.org_unit_name AS ou_name, " +
            "oo.org_unit_id AS tl_org_unit_id, oo.org_unit_name AS tl_org_unit_name, o.org_unit_id, o.org_unit_parent_id, o.protect_caller_id " +
            "FROM ct_user u, ct_user_detail ud, org_unit o LEFT JOIN org_unit oo ON (o.top_ou_id=oo.org_unit_id) WHERE u.ct_user_id='" + id + "' AND u.user_status='active' AND " +
            "u.ct_user_id=ud.ct_user_id AND u.ct_user_ou_id=o.org_unit_id";
        connector.ctPool.query(qry, function(err, data) {
            if (err) { return res(err); }
            if (data.length < 1) { return res('Failed to find any matching record'); }

            if (data[0].tl_org_unit_id === data[0].org_unit_id) {
                data[0].user_ou_level = 0;
            } else if (data[0].tl_org_unit_id === data[0].org_unit_parent_id) {
                data[0].user_ou_level = 1;
            } else {
                data[0].user_ou_level = 2;
            }
            res(null, data);
        });
    },
    getHash: function(pass) {
        var salt = config[envVar].salt;
        var hash = crypto.createHash('sha1').update(salt + pass).digest('hex');
        return hash;
    },
    usersByGroupAndUp: function(ouid, res) {
        //TODO: validate and sanitize data before running query.
        //Get descendants

        //Get ancestors
        var getOUsQuery = "SELECT concat_WS(',',oul3.org_unit_id, oul2.org_unit_id, oul1.org_unit_id) AS ou_list FROM org_unit AS oul3 ";
        getOUsQuery += "left join org_unit AS oul2 ON (oul3.org_unit_parent_id = oul2.org_unit_id) ";
        getOUsQuery += "left join org_unit AS oul1 ON (oul2.org_unit_parent_id = oul1.org_unit_id) WHERE oul3.org_unit_id = " + ouid;
        connector.ctPool.query(getOUsQuery, function(err, data) {
            //console.log(data);
            var query = "SELECT ct_user_id, username, ct_user_ou_id, org_unit_name ";
            query += "FROM " + table + " as ctuser ";
            query += "JOIN org_unit as ou on ou.org_unit_id = ctuser.ct_user_ou_id WHERE ou.org_unit_id IN(" + data[0].ou_list + ")";
            //console.log(query);
            connector.ctPool.query(query, function(err, data) {
                res(data);
            });
        });
    },
    allowedCampaignUsers: function(ouid, res) {
        //TODO: validate and sanitize data before running query.
        //Get descendants
        //Get ancestors
        var getOUsQuery = "SELECT concat_WS(',',oul3.org_unit_id, oul2.org_unit_id, oul1.org_unit_id) AS ou_list FROM org_unit AS oul3 ";
        getOUsQuery += "left join org_unit AS oul2 ON (oul3.org_unit_parent_id = oul2.org_unit_id) ";
        getOUsQuery += "left join org_unit AS oul1 ON (oul2.org_unit_parent_id = oul1.org_unit_id) WHERE oul3.org_unit_id = " + ouid;
        connector.ctPool.query(getOUsQuery, function(err, data) {
            //console.log(data);
            var query = "SELECT ct_user_id, username, ct_user_ou_id, org_unit_name ";
            query += "FROM " + table + " as ctuser ";
            query += "JOIN org_unit as ou on ou.org_unit_id = ctuser.ct_user_ou_id";
            query += " WHERE ou.org_unit_id IN(" + data[0].ou_list + ")";
            query += " AND ctuser.role_id in(1,2)";
            //console.log(query);
            connector.ctPool.query(query, function(err, data) {
                res(data);
            });
        });
    },
    //function to get all users that can be assigned to a campaign
    getCampaignUsers: function(ouid, res) {
        //setup some vars to keep track of ou ids as we go
        var last_desc_ous = [ouid];
        var all_des_ous = [ouid];
        var last_anc_ou = [ouid];
        var all_anc_ous = [ouid];
        var desc_rec_count = 1; //used to
        var all_ous = [];
        async.parallel({
                //loop to find descendants
                descendants: function(cb1) {
                    async.whilst(
                        function() {
                            return desc_rec_count > 0;
                        },
                        function(cb2) {
                            var query = "SELECT org_unit_id FROM org_unit where org_unit_parent_id IN(" + last_desc_ous + ")";
                            connector.ctPool.query(query, function(err, data) {
                                //console.log(data.length);
                                desc_rec_count = data.length;
                                last_desc_ous = [];
                                for (var id in data) {
                                    //console.log(data[id]);
                                    last_desc_ous.push(data[id].org_unit_id);
                                    all_des_ous.push(data[id].org_unit_id);
                                }
                                last_desc_ous = last_desc_ous.join(",");
                                //console.log(last_desc_ous);
                                //console.log(all_des_ous);
                                cb2();
                            });
                            //des_ous.push(found_ous);
                        },
                        function(err) {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            //all_des_ous = all_des_ous.join(",");
                            cb1(null, all_des_ous);
                        }
                    );
                },
                //loop to find ancestors
                ancestors: function(cb1) {
                    async.whilst(
                        function() {
                            return last_anc_ou;
                        },
                        function(cb2) {
                            var query = "SELECT org_unit_parent_id FROM org_unit where org_unit_id =" + last_anc_ou;
                            connector.ctPool.query(query, function(err, data) {
                                //console.log(data);
                                //console.log(data.length);
                                last_anc_ou = data[0].org_unit_parent_id;
                                if (data[0].org_unit_parent_id) {
                                    all_anc_ous.push(last_anc_ou);
                                }
                                cb2();
                            });
                        },
                        function(err) {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            cb1(null, all_anc_ous);
                        }
                    );
                }
            },
            function(err, results) {
                //console.log(results);
                async.parallel({
                    all_users: function(cb2) {
                        var all_ous = results.descendants.concat(results.ancestors);
                        all_ous = all_ous.join(",");
                        //console.log(all_ous);
                        //use ou's from previous queries to get the list of users and their ou's
                        query = "SELECT ctuser.ct_user_id, ctuser.username, ctuser.ct_user_ou_id, ou.org_unit_name, false as add_to_campaigns ";
                        query += "FROM " + table + " AS ctuser ";
                        query += "LEFT JOIN ct_user_detail as cud on cud.ct_user_id = ctuser.ct_user_id ";
                        query += "JOIN org_unit AS ou ON ou.org_unit_id = ctuser.ct_user_ou_id WHERE ou.org_unit_id IN(" + all_ous + ") AND ctuser.user_status = 'active' AND ctuser.role_id < 4";
                        connector.ctPool.query(query, function(err, data) {
                            cb2(err, data);
                        });
                    },
                    added_users: function(cb2) {
                        var all_ous = results.ancestors;
                        all_ous = all_ous.join(",");
                        console.log('add_to_users', all_ous);
                        //use ou's from previous queries to get the list of users and their ou's
                        query = "SELECT array_to_string(array_agg(ctuser.ct_user_id ), ',') as users_list ";
                        query += "FROM " + table + " AS ctuser ";
                        query += "LEFT JOIN ct_user_detail as cud on cud.ct_user_id = ctuser.ct_user_id ";
                        query += "JOIN org_unit AS ou ON ou.org_unit_id = ctuser.ct_user_ou_id WHERE ou.org_unit_id IN(" + all_ous + ") AND ctuser.user_status = 'active' ";
                        query += " AND ctuser.role_id < 4 AND cud.add_to_campaigns = true";
                        //console.log(query);
                        connector.ctPool.query(query, function(err, data) {
                            //console.log(data);
                            cb2(err, data);
                        });
                    }
                }, function(err, results2) {
                    res(err, results2);
                });
            });

    },
    //function to get all users that can be assigned as an owner to a campaign
    getCampaignOwners: function(ouList, res) {
        var query = "SELECT usr.ct_user_id, usr.username, ou.org_unit_id, ou.org_unit_name FROM org_unit as ou";
        query += " JOIN ct_user as usr on usr.ct_user_ou_id = ou.org_unit_id AND usr.user_status = 'active'";
		query += "LEFT JOIN partner_admin_user AS pau on pau.ct_user_id = usr.ct_user_id ";
        query += " WHERE org_unit_id IN(" + ouList + ") and role_id < 3 AND pau.ct_user_id is null ";
        connector.ctPool.query(query, function(err, data) {
            //console.log(data);
            res(err, data);
        });
    },
    getUsersByOuid: function(ouid, callback) {
        var qry = "SELECT ct_user_id,username,first_name,last_name FROM ct_user WHERE ct_user_ou_id = " + ouid + " AND user_status = 'active';";
        connector.ctPool.query(qry, function(err, data) {
            callback(err, data);
        });
    },
    usersByNames: function(names,callback){
		//For Amp3
		var namesList = "('"+names.join("','")+"')"
		var qry = "SELECT username FROM ct_user WHERE username in "+namesList+" AND user_status = 'active';";
		connector.ctPool.query(qry,function(err,data){
			callback(err,data);
		});
    },
    getAudioDownloadSettings: function (ouid, callback) {
        var qry = "SELECT dou.download_audio_enabled as org_das, "
        qry += "tou.download_audio_enabled as top_das, pou.download_audio_enabled as parent_das FROM org_unit ou "
        qry += "LEFT JOIN org_data_append_setting tou ON (tou.org_unit_id = ou.top_ou_id) "
        qry += "LEFT JOIN org_data_append_setting pou ON (pou.org_unit_id = ou.org_unit_parent_id) "
        qry += "LEFT JOIN org_data_append_setting dou ON (dou.org_unit_id = ou.org_unit_id) "
        qry += "WHERE ou.org_unit_id =" + ouid;
        connector.ctPool.query(qry, function (err, data) {
            if (err) {
                callback(null, true);
            } else {
                if (data && data.length > 0) {
                    if (data[0].org_das !== null) {
                        callback(null, data[0].org_das);
                    } else if (data[0].parent_das !== null) {
                        callback(null, data[0].parent_das);
                    } else if (data[0].top_das !== null) {
                        callback(null, data[0].top_das);
                    } else {
                        callback(null, true);
                    }
                }
            }
        });
    },
    getProtectCallerIdByOuId: function(ouid, callback) {
        async.waterfall([
            function(callback) {
                var query = "SELECT protect_caller_id,org_unit_parent_id , top_ou_id from org_unit WHERE org_unit_id = " + ouid;
                connector.ctPool.query(query, function(err, setting) {
                    if (err) { return callback(err); }
                    if (setting.length > 0) {
                        callback(null, setting[0]);
                    } else {
                        callback(null);
                    }
                });
            },
            function(result, callback) {
                if (result.protect_caller_id) {
                    callback(null, result);
                } else if (result.org_unit_parent_id) {
                    var query = "SELECT protect_caller_id from org_unit WHERE org_unit_id = " + result.org_unit_parent_id;
                    connector.ctPool.query(query, function(err, setting) {
                        if (err) { return callback(err); }
                        if (setting.length > 0) {
                            result.protect_caller_id = setting[0].protect_caller_id;
                            callback(null, result);
                        } else {
                            callback(null);
                        }
                    });
                } else {
                    callback(null, result);
                }
            },
            function(result, callback) {
                if (result.protect_caller_id) {
                    callback(null, result);
                } else {
                    var query = "SELECT protect_caller_id from org_unit WHERE org_unit_id = " + result.top_ou_id;
                    connector.ctPool.query(query, function(err, setting) {
                        if (err) { return callback(err); }
                        if (setting.length > 0) {
                            result.protect_caller_id = setting[0].protect_caller_id;
                            callback(null, result);
                        } else {
                            callback(null);
                        }
                    });
                }
            }
        ], function(err, result) {
            if (err) { return callback(err); }
            callback(null, result);
        });
    },

    getMigratedStatus: function(ouid, callback) {

        var query = "SELECT billing_id FROM org_unit where org_unit_id = " + ouid[0].ou_id;
        connector.ctPool.query(query, function(err, data) {
            var qry = "SELECT is_migrated  FROM org_billing  WHERE org_unit_id = " + data[0].billing_id;
            connector.ctPool.query(qry, function(err, data) {
                callback(err, data);
            });
        });
    },
    getVoicemails: function (ouid, callback) {
        orgUnitModel.getAllParentAndSiblingOuIds(ouid.ou_id, function (result) {
            result += ',' + ouid.ou_id;
            var qry = "SELECT call_flow_recording_id, call_flow_recording_filename, call_flow_recording_name, call_flow_recording_type, recording_active FROM call_flow_recording WHERE call_flow_recording_ou_id in (" + result + ") AND call_flow_recording_type = 'voicemail'";
            connector.ctPool.query(qry, function(err, data) {
                var r = [];
                if(data.length > 0){
                    async.each(data, function (d) {
                        aws.config.loadFromPath('config/aws-shoutpoint.json');
                        var s3 = new aws.S3();
                        key = s3yml[envVar].voicemail_message_key;
                        var params = { Bucket: s3yml[envVar].sp_message_bucket, Key: key + "/" + d.call_flow_recording_filename + '.wav', Expires: 86400 * 7 };
                        s3.getSignedUrl('getObject', params, function (err, url) {
                            if (!err) {
                                r.push({
                                    id: d.call_flow_recording_id,
                                    name: d.call_flow_recording_name,
                                    filename: d.call_flow_recording_filename,
                                    type: d.call_flow_recording_type,
                                    url: url,
                                    active: d.recording_active
                                });
                            }
                        });
                    });
                    callback(err, r);
                }else{
                    r =[];
                    callback(err, r);
                }
            });
        });
    },
    
    getWhispers: function (ouid, callback) {
        orgUnitModel.getAllParentAndSiblingOuIds(ouid.ou_id, function (result) {
            result += ',' + ouid.ou_id;
            var qry = "SELECT call_flow_recording_id, call_flow_recording_filename, call_flow_recording_name, call_flow_recording_type, recording_active FROM call_flow_recording WHERE call_flow_recording_ou_id in (" + result + ") AND call_flow_recording_type = 'whisper'";
            connector.ctPool.query(qry, function(err, data) {
                var r = [];
                if(data.length > 0){
                    async.each(data, function (d) {
                        aws.config.loadFromPath('config/aws-shoutpoint.json');
                        var s3 = new aws.S3();
                        key = s3yml[envVar].whisper_message_key;
                        var params = { Bucket: s3yml[envVar].sp_message_bucket, Key: key + "/" + d.call_flow_recording_filename + '.wav', Expires: 86400 * 7 };
                        s3.getSignedUrl('getObject', params, function (err, url) {
                            if (!err) {
                                r.push({
                                    id: d.call_flow_recording_id,
                                    name: d.call_flow_recording_name,
                                    filename: d.call_flow_recording_filename,
                                    type: d.call_flow_recording_type,
                                    url: url,
                                    active: d.recording_active
                                });
                            }
                        });
                    });
                    callback(err, r);
                }else{
                    r =[];
                    callback(err, r);
                }
            });
        });
    },
    
    getPrompts: function (ouid, callback) {
        orgUnitModel.getAllParentAndSiblingOuIds(ouid.ou_id, function (result) {
            result += ',' + ouid.ou_id;
            var qry = "SELECT call_flow_recording_id, call_flow_recording_filename, call_flow_recording_name, call_flow_recording_type, recording_active FROM call_flow_recording WHERE call_flow_recording_ou_id in (" + result + ") AND call_flow_recording_type = 'prompt'";
            connector.ctPool.query(qry, function(err, data) {
                    var r = [];
                    if(data.length > 0){
                        async.each(data, function (d) {
                            aws.config.loadFromPath('config/aws-shoutpoint.json');
                            var s3 = new aws.S3();
                            key = s3yml[envVar].prompt_message_key;
                            var params = { Bucket: s3yml[envVar].sp_message_bucket, Key: key + "/" + d.call_flow_recording_filename + '.wav', Expires: 86400 * 7 };
                            s3.getSignedUrl('getObject', params, function (err, url) {
                                if (!err) {
                                    r.push({
                                        id: d.call_flow_recording_id,
                                        name: d.call_flow_recording_name,
                                        filename: d.call_flow_recording_filename,
                                        type: d.call_flow_recording_type,
                                        url: url,
                                        active: d.recording_active
                                    });
                                }
                            });
                        });
                        callback(err, r);
                    }else{
                        r =[];
                        callback(err, r);
                    }
                });
        });        
	},

    usersList: function(ouid, userAccess, userid, res) {
        //// Get user info
        qry = "SELECT cu.first_name,cu.last_name,cu.username AS email,cu.user_ext_id,cu.ct_user_id,cu.user_status AS status";
        qry += ",cud.agent_ring_to, cud.agent_code AS agent_id";
        qry += ",ou.org_unit_name AS group,ou.org_unit_id AS group_ouid,ou.org_unit_ext_id AS group_external_id";
        qry += ",oub.org_unit_name AS account,oub.org_unit_id AS account_ouid,oub.org_unit_ext_id AS account_external_id";
        qry += ",oup.org_unit_name AS parent_group,oup.org_unit_id AS parent_group_ouid,oup.org_unit_ext_id AS parent_group_external_id";
        qry += ",r.role_name AS role";
        qry += ",CASE WHEN up.access_audio = 't' THEN 'Yes' ELSE 'No' END AS access_audio"; 
        qry += ",CASE WHEN oa.component_id IS NOT NULL THEN( CASE WHEN up.score_call = 't' THEN 'Yes' ELSE 'No' END ) ELSE NULL END AS score_call";
        qry += ",cardinality(up.groups_list) AS group_access";
        qry += ",(array_to_string(ARRAY(select unnest(array[report_name]) from reports where report_id = ANY (up.reports_list)), ';')) AS report_access"; 
        qry += " FROM ct_user AS cu";
        qry += " JOIN ct_user_detail cud ON cud.ct_user_id = cu.ct_user_id";
        qry += " JOIN user_permissions up ON up.ct_user_id = cu.ct_user_id";
        qry += " JOIN role r ON r.role_id = cu.role_id"; 
        qry += " LEFT JOIN partner_admin_user pau on pau.ct_user_id = cu.ct_user_id";
        qry += " JOIN org_unit ou ON ou.org_unit_id = cu.ct_user_ou_id";
        qry += " LEFT JOIN org_account oa ON ( oa.org_unit_id = ou.billing_id AND oa.component_id = "+config[envVar].scoreCardComponentId+")";
        qry += " LEFT JOIN org_unit AS oub ON (oub.org_unit_id = ou.billing_id)";
        qry += " LEFT JOIN org_unit AS oup ON (oup.org_unit_id = ou.org_unit_parent_id)";
        qry += " WHERE cu.ct_user_ou_id IN";
        qry += " (SELECT org_unit_id FROM org_unit WHERE billing_id =";
        qry += " (SELECT billing_id FROM org_unit WHERE org_unit_id = "+ouid+"))";
        qry += " AND cu.user_status != 'deleted'"; 
        qry += " AND cu.role_id != "+config[envVar].supportAdminRoleId+""; 
        qry += " and pau.ct_user_id is NULL";

        appModel.ctPool.query(qry, function(err, results) {
            if (results && results.length > 0) {
                res(null, jsonGetUserReport(results));
            } else {
                res(null, "No Records Found.");
            }
        });
    },
    getmigratedUsersRole: function(ct_userIds, callback) {
        var qry = "SELECT role_id,username FROM ct_user WHERE ct_user_id IN ('" + ct_userIds.data.join("','") + "')";
        connector.ctPool.query(qry, function(err, data) {
            callback(err, data);
        });
    },
    getAllTopOuUsers: function(req, res) {
        var query = "SELECT first_name || ' ' || last_name || ' | ' || username AS username, ct_user_id FROM ct_user WHERE ct_user.role_id IN (1,2,3,8) AND ct_user_ou_id IN(" + req.user.orglist + ") AND user_status = 'active' ORDER BY first_name";
        appModel.ctPool.query(query, function(err, data) {
            if (err) {
                return res("Users are not availabled")
            } else {
                data.unshift({
                    "username": "Unassign",
                    "ct_user_id": "unassigned"
                })
                return res(null, data);
            }
        });
    },
    getAllDeletedTopOuUsers: function(req, res) {
        async.waterfall([
            function(callback){
                var query = "SELECT DISTINCT(first_name || ' ' || last_name || ' | ' || username) AS username, ct_user_id FROM ct_user WHERE ct_user.role_id IN (1,2,3,8) AND ct_user_ou_id IN(" + req.user.orglist + ") AND user_status = 'active' ORDER BY username ";
                appModel.ctPool.query(query, function(err, data) {
                    if (err) {
                        callback("Users are not availabled")
                    } else {
                        callback(null, data);
                    }
                });
            },function(activeUser, callback){
                var query = "SELECT DISTINCT(cu.first_name || ' ' || cu.last_name || ' | ' || cu.username) AS username, cu.ct_user_id FROM ct_user cu JOIN call c ON(cu.ct_user_id = c.ct_user_id) WHERE cu.role_id IN (1,2,3,8) AND cu.ct_user_ou_id IN(" + req.user.orglist + ") AND cu.user_status != 'active' ORDER BY username ";
                appModel.ctPool.query(query, function(err, data) {
                    if (err) {
                        callback("Users are not availabled")
                    } else {
                        var users= _.union(activeUser, data);
                        users =  _.sortBy(users, 'first_name');
                        callback(null, users);
                    }
                });
            }
        ],
        function(err, results) {
                if (err) { cb(err); } 
                results.unshift({
                    "username": "Unassign",
                    "ct_user_id": "unassigned"
                })
                res(null, results);                
            });
        },
    getUserInformation: function(req, res){
        //// FOR AMP3 USE DO NOT CHANGE
        console.log("req query: "+JSON.stringify(req.query))
        var user_id;
        var user_name;
        var data = [];
        async.waterfall([
            function (cb){
                var query = "SELECT ctu.ct_user_id,ctu.username,ctu.first_name,ctu.last_name,ctu.user_status,ctu.ct_user_ou_id,ctud.timezone,ou.org_unit_status FROM ct_user AS ctu ";
                query +=" LEFT JOIN ct_user_detail AS ctud ON ctud.ct_user_id = ctu.ct_user_id ";
                query +=" LEFT JOIN org_unit AS ou ON ou.org_unit_id = ctu.ct_user_ou_id ";
                query +=" WHERE ctu.ct_user_id = "+req.query.id;

                    appModel.ctPool.query(query, function(err, results){
                        if (err){ return cb(err);}
                        cb(err,results[0]);
                    });
            },
            function(userData,cb){
                console.log("userData: "+JSON.stringify(userData));
                var tmp = {};
                if(userData != undefined){
                    user_id = userData.ct_user_id;
                    user_name = userData.username;
                    first_name = userData.first_name;
                    last_name = userData.last_name;
                    timezone = userData.timezone;
                    if(userData.org_unit_status != 'deleted'){
                        if(userData.user_status != 'deleted'){
                            tmp = {
								UserId: user_id,
								UserName: user_name,
                                FirstName: first_name,
                                LastName: last_name,
                                Timezone: timezone
							};
                            cb(null, tmp);
                        }else{
                            cb(null);
                        }
                    }else{
                        cb(null);
                    }

                }else{
                    cb(null);
                }
            }


        ], function(err,tmp){
			data.push(tmp);
			res(err,data);
		});//async waterfall cb
    },
    getUserDataByEmailId: function(req, res){
        //// FOR AMP3 USE DO NOT CHANGE
        async.waterfall([
            function (cb){
                var query = "SELECT ctu.ct_user_id,ctu.first_name,ctu.last_name,ctu.ct_user_ou_id,ctud.timezone,ou.billing_id,r.role_name FROM ct_user AS ctu ";
                query +=" LEFT JOIN ct_user_detail AS ctud ON ctud.ct_user_id = ctu.ct_user_id ";
                query +=" JOIN org_unit AS ou ON ou.org_unit_id = ctu.ct_user_ou_id ";
                query +=" JOIN role AS r ON r.role_id = ctu.role_id";
                query +=" WHERE ctu.user_status = 'active' AND ctu.username = '" + req.query.email + "'";
                appModel.ctPool.query(query, function(err, results){
                    if (err){ return cb(err);}
                    cb(err,results[0]);
                });
            },
            function (data,cb){
                if(data != undefined){
                    var query = "SELECT distinct org_unit_id FROM org_unit WHERE ARRAY[org_unit_id] <@ ARRAY[( select groups_list from user_permissions where ct_user_id = "+data.ct_user_id+")] AND org_unit_status = 'active'"
                    appModel.ctPool.query(query, function(err, results){
                        if (err){ return cb(err);}
                        data.groups_list = _.pluck(results,'org_unit_id');
                        cb(null, data);
                    });
                }else{
                    cb(null,data);
                }
            },
            function(userData,cb){
                var tmp = {};
                if(userData != undefined){
                    tmp = {
                        UserId: userData.ct_user_id,
                        FirstName: userData.first_name,
                        LastName: userData.last_name,
                        UserOuid: userData.ct_user_ou_id,
                        Timezone: userData.timezone,
                        billingId: userData.billing_id,
                        Role: userData.role_name,
                        GroupList: userData.groups_list
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
    getUserDataBybilllingId: function(req, res){
        //// FOR AMP3 USE DO NOT CHANGE
        var query = "SELECT ctu.ct_user_id,ctu.first_name,ctu.last_name,ctu.username,ctu.ct_user_ou_id,ctud.timezone,r.role_name FROM ct_user AS ctu";
        query +=" LEFT JOIN ct_user_detail AS ctud ON ctud.ct_user_id = ctu.ct_user_id ";
        query +=" JOIN org_unit AS ou ON ou.org_unit_id = ctu.ct_user_ou_id ";
        query +=" JOIN role AS r ON r.role_id = ctu.role_id";
        query +=" WHERE ctu.user_status = 'active' AND ctu.ct_user_ou_id IN (SELECT org_unit_id FROM org_unit WHERE billing_id = "+req.query.billingId+" AND org_unit_status = 'active')";
        appModel.ctPool.query(query, function(err, results){
            if (err){ return res(err);}
            var data = [];
            async.eachSeries(results, function(r,cb){
                var tmp = {};
                tmp = {
                    UserId: r.ct_user_id,
                    FirstName: r.first_name,
                    LastName: r.last_name,
                    UserName: r.username,
                    UserOuid: r.ct_user_ou_id,
                    Timezone: r.timezone,
                    Role: r.role_name
                };
                data.push(tmp);
                cb(null, data);
            },
            function(err){
                res(err, data);
            });
        });
    }
};

function createUser(req,ctUserData,ctTransaction,is_increment,IscallFromDuh,ca_enabled,userCallback){
    var isManualScoreCardEnable = false;
    var logData = {};
    var logInsertingUser = {
        'ct_user_id' : 2,
        'ct_user_ou_id' : 8
    };
    async.waterfall([
        function(cb) {
            var insertData = {
                which: 'insert',
                table: table,
                values: ctUserData
            };
            ctTransaction.queryRet(insertData, function(err, result) {
                if (err) { return cb(err); }
                cb(null, result);
            });
        },
        function(result, cb) {
            var ctUserDetailData = {};
            ctUserDetailData.ct_user_id = result.insertId;
            if (data.agent_code) ctUserDetailData.agent_code = data.agent_code;
            if (data.agent_ring_to) ctUserDetailData.agent_ring_to = data.agent_ring_to;
            if (data.primary_phone) ctUserDetailData.primary_phone = data.primary_phone;
            if (data.mobile_phone) ctUserDetailData.mobile_phone = data.mobile_phone;
            if (data.timezone) ctUserDetailData.timezone = data.timezone;

            var insertCtUserData = {
                which: 'insert',
                table: 'ct_user_detail',
                values: ctUserDetailData
            };
            async.parallel([
                    function(callback) {
                        ctTransaction.query(insertCtUserData, function(err,results) {
                            if (err) { console.log(results); return callback(err); }
                            if (is_increment) {
                                orgComponentCountModel.increment(null, 3, data.ct_user_ou_id, 1, function(err) {
                                    if (err) { console.log(results); return callback(err); }
                                    // User table needs the newly created user's id
                                    callback(null, { insertId: result.insertId });
                                });
                            } else {
                                callback(null, { insertId: result.insertId });
                            }
                        });
                    },
                    function(callback) {
                        if (data.add_user_to_camapains) {
                            var accessController = require('../controllers/userAccessController');
                            accessController.campaignList(req.user.user_id, req.body.user.ct_user_ou_id, req.user.role_id, function(err, camplist) {
                                var campaignCtUserModel = require('../models/campaignCtUserModel');
                                campaignCtUserModel.insertManyCampaigns(ctTransaction, result.insertId, camplist, function(err, data) {
                                    console.log('campaignCtUserModel', err);
                                    callback(err, { insertId: result.insertId });
                                });
                            });
                        } else {
                            callback(null);
                        }
                    },
                ],
                function(err, results) {
                    if (err) {
                        console.log(err);
                        cb(err);
                    } else {
                        cb(null, { insertId: result.insertId });
                    }
                });
        },
        function(id, cb) {
            var query = "SELECT component_id FROM org_component_count WHERE component_id = 19 AND org_unit_id = " + ctUserData.ct_user_ou_id;
            ctTransaction.query(query, function(err, component_result) {
                if (err) { console.log(results); return cb(err); }
                if (component_result.length > 0) {
                    ca_enabled = true;
                }
                cb(null, id);
            });
        },
        function(id, cb) {
            var query = "SELECT component_id FROM org_account oc LEFT JOIN org_unit ou ON (oc.org_unit_id = ou.billing_id) WHERE oc.component_id = 927 AND ou.org_unit_id = " + ctUserData.ct_user_ou_id;
            ctTransaction.query(query, function(err, component_result) {
                if (err) { console.log(results); return cb(err); }
                if (component_result.length > 0) {
                    isManualScoreCardEnable = true;
                }
                cb(null, id);
            });
        },
        function(id, cb) {
            var query = "SELECT report_id, is_default , is_admin_only FROM reports";
            ctTransaction.query(query, function(err, data1) {
                if (err) { console.log(results); return cb(err); }
                var reports = [];

                if (isManualScoreCardEnable) {
                    reports.push(1140);
                }

                if (data.role_id == 8 && ca_enabled === true) {
                    reports.push(1128);
                } else {
                    _.map(data1, function(report) {
                        if (ca_enabled === false) {
                            if (report.report_id != 1128 && report.report_id != 1140) {
                                if ((data.role_id === 1 || data.role_id === 4) && report.is_default) {
                                    reports.push(report.report_id);
                                } else if (!report.is_admin_only) {
                                    reports.push(report.report_id);
                                }
                            }
                        } else {
                            if(report.report_id != 1140){
                                if ((data.role_id === 1 || data.role_id === 4) && report.is_default) {
                                    reports.push(report.report_id);
                                } else if (!report.is_admin_only) {
                                    reports.push(report.report_id);
                                }
                            }                           
                            reports = _.uniq(reports);
                        }
                    });
                }
                var access_report = [];
                if (req.user !== undefined) {
                    logInsertingUser.ct_user_id = req.user.user_id;
                    logInsertingUser.ct_user_ou_id = req.user.ou_id;
                    access_report = _.pluck(req.user.reports, 'report_id');
                    reports = _.intersection(reports, access_report);
                } +
                cb(null, { insertId: id.insertId, report: reports });
            });
        },
        function(udata, cb) {
            var userpermissionsData = {};
            var ous = [];
            var isCallFromAmp = false;

            if (req.user.source && req.user.source === 'amp') {
                isCallFromAmp = true;
            }

            var qry = "select org_unit_id from org_unit where (org_unit_id = " + data.ct_user_ou_id + " or org_unit_parent_id = " + data.ct_user_ou_id + " ";
            qry += " or org_unit_parent_id IN(select org_unit_id from org_unit where org_unit_parent_id = " + data.ct_user_ou_id + ")) AND org_unit_status = 'active' ";
            ctTransaction.query(qry, function(err, data2) {
                if (err) { console.log(data2); return cb(err); }
                ous = _.pluck(data2, 'org_unit_id');
                if (req.user !== undefined && !IscallFromDuh && !isCallFromAmp) {
                    ous = _.intersection(ous, req.user.orglist);
                }
                userpermissionsData.ct_user_id = udata.insertId;
                userpermissionsData.groups_list = "{" + ous + "}";
                userpermissionsData.reports_list = "{" + udata.report + "}";
                userpermissionsData.score_call = false;
                userpermissionsData.updated_by = logInsertingUser.ct_user_id;
                if (data.role_id === 1 || data.role_id === 4) {
                    userpermissionsData.score_call = true;
                }
                userpermissionsData.access_audio = true;
                cb(null, userpermissionsData);
            });
        },
        function(userdata, cb) {
            var insertuserpermissionsData = {
                which: 'insert',
                table: 'user_permissions',
                values: userdata
            };
            logData.ct_user_id = userdata.ct_user_id;
            logData.current_permissions = {
                'groups_list':userdata.groups_list,
                'reports_list': userdata.reports_list,
                'score_call':userdata.score_call,
                'access_audio': userdata.access_audio
            };
            ctTransaction.query(insertuserpermissionsData, function(err) {
                if (err) { console.log(err); return cb(err); }
                cb(null, { insertId: userdata.ct_user_id });
            });
        }
    ],
    function(err, results) {
        if (err) {
            ctTransaction.rollback(function() {
                userCallback(err);
            });
        } else {
            ctTransaction.commit(function() {
                userPermissionsLog.createLog(logInsertingUser.ct_user_id, logInsertingUser.ct_user_ou_id, logData, false, function(err){
                    if(err){ console.log("Error In User Permissions Log For : ", results.insertId, ' ERROR : '+err);}else{
                        console.log("Inserted User Permissions Log For : ", results.insertId);
                    } 
                });
                userCallback(null, results);
            });
        }
    });
}
function jsonGetUserReport(data) {
    var usersData = [];

    for (var i = 0; i < data.length; i++) {
        var tempUsers = {}
        for (var k in data[i]){
            var val = ' ';
            if (data[i][k] !== null){
                val = data[i][k];
            }
            tempUsers[k] =val;
        }

        usersData.push(tempUsers);
    }
    // for (var i = 0; i < data.length; i++) {
    //     var tempUsers = {
    //         account: data[i].account,
    //         account_ouid: data[i].account_ouid,
    //         account_external_id: data[i].account_external_id,
    //         parent_group: data[i].parent_group,
    //         parent_group_ouid: data[i].parent_group_ouid,
    //         parent_group_external_id: data[i].parent_group_external_id,
    //         group: data[i].group,
    //         group_ouid: data[i].group_ouid,
    //         group_external_id: data[i].group_external_id,
    //         first_name: data[i].first_name,
    //         last_name: data[i].last_name,
    //         email: data[i].email,
    //         user_ext_id: data[i].user_ext_id,
    //         agent_ring_to: data[i].agent_ring_to,
    //         agent_id: data[i].agent_id,
    //         role: data[i].role,
    //         status: data[i].status,
    //         access_audio: data[i].access_audio,
    //         score_call			: data[i].score_call,
    //         report_access: data[i].report_access,
    //         group_access: data[i].group_access
    //     };
    //     usersData.push(tempUsers);
    // }
    return usersData;
}


module.exports = user;
