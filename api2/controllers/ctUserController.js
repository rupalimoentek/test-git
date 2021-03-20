var controller = require('./appController'),
    userModel = require('../models/ctUserModel'),
    ctlogger = require('../lib/ctlogger.js'),
    appModel = require('../models/appModel'),
    ctTransactionModel = require('../models/ctTransactionModel'),
    campaignModel = require('../models/campaignModel'),
    uservoiceSSO = require('../lib/uservoiceSSO');

var user = {

    // ======= For Export functionality ===============
    getUsersReport: function(req, res) {
        var ouid = req.params.ouid;
        var userAccess = req.params.userAccess;
        var userid = req.userid;

        userModel.usersList(ouid, userAccess, userid, function(err, data) {

            controller.responsify(err, data, function(response) {
                res(response);
            });
        });
    },

    setDefaultPasswordAction: function(req, callback) {
        userModel.setDefaultPassword(req, function(err, results) {
            controller.responsify(err, results, function(response) {
                callback(response);
            });
        });
    },
    getAction: function(req, res) {
        var params;
        if (req.id) {
            params = { "ct_user_id": req.id };
        } else if (req.email) {
            params = {
                "email": req.email,
                "user_status": "active"
            };
        } else {
            params = req.query;
        }
        userModel.read(params, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            });
        });
    },
    postAction_noemail: function(req, res) {
        userModel.create(req, function(err, insertedUserId) {
            if (err) { return res(err); }

            // send e-mail notification of password change
            var login = require('../models/loginModel');


            // removed creating a user from the welcome email.
            setTimeout(function() {
                login.recover_noemail(req.body.user.username, 'welcome', req.body.user.domain, function(err) {
                    if (err) { return res(err); }

                    // create log record
                    var newdata = {
                        "org_unit_id": req.ouid,
                        "ct_user_id": req.userid,
                        "log_data": req.body.user
                    };
                    ctlogger.log(newdata, 'insert', 'user', '', '', req.headers.authorization);
                    res((err || null), insertedUserId);
                });
            }, 200);
        });
    },
    postAction: function(req, res) {
        userModel.create(req, function(err, insertedUserId) {
            if (err) { return res(err); }

            // send e-mail notification of password change
            var login = require('../models/loginModel');


            // removed creating a user from the welcome email.
            setTimeout(function() {
                login.recover(req.body.user.username, 'welcome', req.body.user.domain, function(err) {
                    if (err) { return res(err); }

                    // create log record
                    var newdata = {
                        "org_unit_id": req.ouid,
                        "ct_user_id": req.userid,
                        "log_data": req.body.user
                    };
                    ctlogger.log(newdata, 'insert', 'user', '', '', req.headers.authorization);
                    res((err || null), insertedUserId);
                });
            }, 200);
        });
    },
    /*This Function will add the user to all existing campaigns at their group level and below. */
    addToCampaignsAction: function(req, res) {
        var ctTrans = new ctTransactionModel.begin(function(err) {
            if (err) {
                callback(err);
            } else {
                var campaignCtUserModel = require('../models/campaignCtUserModel');
                campaignCtUserModel.insertManyCampaigns(ctTrans, req.body.user.ct_user_id, req.camplist, function(err, data) {
                    if (err) {
                        ctTrans.rollback(function() {
                            res(err);
                        });
                    } else {
                        ctTrans.commit(function() {
                            res('', data);
                        });
                    }
                });
            }
        });
    },
    putAction: function(req, res) {
        var userStatus = req.body.user.user_status;
        var userRole = req.body.user.role_id; // not sure why this is here, it's not being passed from the front end in the users table
        if ((userStatus !== undefined && (userStatus.toLowerCase() === 'deleted' || userStatus.toLowerCase() === 'inactive')) ||
            (userRole !== undefined && userRole == 3)) {
            campaignModel.getCampaignsUserId(req.body.user.ct_user_id, function(err, data) {
                if (err) {
                    controller.responsify(err, data, function(response) {
                        res(response);
                    });
                } else if (data.length > 0) {
                    var message = 'campaign';
                    if (data.length > 1) {
                        message = 'campaigns';
                    }
                    if (data.length > 5) {
                        data = [data.length];
                    }

                    err = 'selected user is owner of ' + data.join() + ' ' + message + ' please remove it first.';
                    controller.responsify(err, data, function(response) {
                        res(response);
                    });
                } else {
                    if (userStatus.toLowerCase() === 'deleted') {
                        userModel.deleteUser(req, function(err, data) {
                            console.log("In controller");
                            controller.responsify(err, data, function(response) {
                                res(response);
                                // create log record
                                action = "delete";
                                var newdata = {
                                    'org_unit_id': req.ouid,
                                    'ct_user_id': req.userid,
                                    'log_data': req.body.user
                                };
                                ctlogger.log(newdata, action, 'user', '', '', req.headers.authorization);
                            });
                        });
                    } else {
                        userModel.update(req, function(err, data) {
                            controller.responsify(err, data, function(response) {
                                var user = req.body.user;
                                response.uservoiceSSO = uservoiceSSO.get({ email: user.username, display_name: user.first_name + " " + user.last_name, allow_forums: [388389], guid: user.ct_user_ou_id });
                                res(response);
                                // create log record
                                var action = "update";
                                var newdata = {
                                    'org_unit_id': req.ouid,
                                    'ct_user_id': req.userid,
                                    'log_data': req.body.user
                                };
                                ctlogger.log(newdata, action, 'user', '', '', req.headers.authorization);
                            });
                        });
                    }

                }
            });
        } else {
            userModel.update(req, function(err, data) {
                controller.responsify(err, data, function(response) {
                    var user = req.body.user;
                    response.uservoiceSSO = uservoiceSSO.get({ email: user.username, display_name: user.first_name + " " + user.last_name, allow_forums: [388389], guid: user.ct_user_ou_id });
                    res(response);
                    // create log record
                    var newdata = {
                        'org_unit_id': req.ouid,
                        'ct_user_id': req.userid,
                        'log_data': req.body.user
                    };
                    ctlogger.log(newdata, 'update', 'user', req.body.user.username, '', req.headers.authorization);
                });
            });
        }
    },
    getCampaignUsers: function(req, res) {
        userModel.getCampaignUsers(req.ouid, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            });
        });
    },
    getCampaignOwners: function(ouList, res) {
        userModel.getCampaignOwners(ouList, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            });
        });
    },
    getUsersByGroupAndUp: function(ouid, res) {
        userModel.usersByGroupAndUp(ouid, function(data) {
            controller.responsify(null, data, function(response) {
                res(response);
            });
        });
    },
    allowedCampaignUsers: function(ouid, res) {
        userModel.allowedCampaignUsers(ouid, function(data) {
            controller.responsify(null, data, function(response) {
                res(response);
            });
        });
    },
    getUsersByOuidAction: function(ouid, callback) {
        userModel.getUsersByOuid(ouid, function(err, results) {
            controller.responsify(err, results, function(response) {
                callback(response);
            });
        });
    },
    getmigratedUsersRole: function(data, callback) {
        userModel.getmigratedUsersRole(data, function(err, results) {
            controller.responsify(err, results, function(response) {
                callback(response);
            });
        });
    },
    getAllTopOuUsers: function(req, res) {
        userModel.getAllTopOuUsers(req, function(err, results) {
            controller.responsify(err, results, function(response) {
                res(response);
            });
        });
    },
    getAllDeletedTopOuUsers: function(req, res) {
        userModel.getAllDeletedTopOuUsers(req, function(err, results) {
            controller.responsify(err, results, function(response) {
                res(response);
            });
        });
    },
    getUsersByNamesAction: function(names, res) {
        //For Amp3
        userModel.usersByNames(names, function(err,data){
            controller.responsify(null,data,function(response){
                res(response);
            });
        });
    }, 
    getUserInformation: function(req,res){
        //For Amp3
        userModel.getUserInformation(req, function(err,data){
            controller.responsify(null,data,function(response){
                res(response);
            });
        });
    },
    getUserDataByEmailId: function(req,res){
        //// FOR AMP3 USE DO NOT CHANG
        userModel.getUserDataByEmailId(req, function(err,data){
            controller.responsify(null,data,function(response){
                res(response);
            });
        });
    },
    getUserDataBybilllingId: function(req,res){
        //// FOR AMP3 USE DO NOT CHANG
        userModel.getUserDataBybilllingId(req, function(err,data){
            controller.responsify(null,data,function(response){
                res(response);
            });
        });
    }
};

module.exports = user;
