var controller = require('./appController'),
    dniSettingModel = require('../models/dniSettingModel'),
    ctlogger = require('../lib/ctlogger.js'),
    ctTransactionModel = require('../models/ctTransactionModel');

var dniSetting = {
    getAction: function(req, res) {
        dniSettingModel.read(req.params.ouid, req.params.prov_id, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            });
        }, req.params.user_access, req.userid);
    },

    getDNI: function(req, res) {
        dniSettingModel.getDniByID(req.params.ouid, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            });
        });
    },

     getDNICode: function(req, res) {
        dniSettingModel.getDNICode(req.params.ouid, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            });
        });
    },
    

    postAction: function(req, res) {
        console.log('dnisetting ' + JSON.stringify(req.body.dniSetting));
        var ctTrans = new ctTransactionModel.begin(function(err) {
            if (err) {
                res(err);
                return;
            }
            dniSettingModel.create(ctTrans, req.body.dniSetting, function(err, data) {
                if (err) {
                    ctTrans.rollback(function() {
                        controller.responsify(err, null, function(response) {
                            res(response);
                        });
                    });
                } else {
                    ctTrans.commit(function() {
                        controller.responsify(err, data, function(response) {
                            res(response);
                        });
                    });
                }

            });
        });
    },

    putAction: function(req, res) {
        console.log(req.body.dniSetting);
        dniSettingModel.updateDNISetting(req.body.dniSetting, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            });
        });
    },

    deleteAction: function(dni_setting_id, res) {
        var appModel = require('../models/appModel');
        dniSettingModel.deleteDNISetting(dni_setting_id, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            });
        }, appModel.ctPool);
    }
};

module.exports = dniSetting;