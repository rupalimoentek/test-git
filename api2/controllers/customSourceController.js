var ctTransactionModel = require('../models/ctTransactionModel');
var controller = require('./appController'),
    customSourceModel = require('../models/customSourceModel');

var customSource = {
    putDeleteAction: function(req, res) {
        var ctTrans = new ctTransactionModel.begin(function(err) {
            if (err) { return res(err); }

            customSourceModel.deleteCustomSource(req.body.customSource.id, function(err, data) {
                if (err) {
                    ctTrans.rollback(function() {
                        controller.responsify(err, data, function(response) {
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
            }, ctTrans);
        });
    },

    read: function(req, res) {
        customSourceModel.read(req.params.ouid, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            });
        });
    },

    //putDeleteAction: function (req,res) {
    //	console.log(req.body);
    //	customSourceModel.deleteCustomSource(req.body.custom_source.id, function(err){
    //		controller.responsify(err, 'custom_source Deleted.', function(response){
    //			res(response);
    //		});
    //	});
    //},
    postAction: function(req, res) {
        customSourceModel.create(req.body.customSource, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            });
        });
    },
    getByOuidAction: function(req, res) {
        customSourceModel.getByOuid(req, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            });
        });
    },
    getCustomSources: function(req, res) {
        customSourceModel.getCustomSources(req, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            });
        });
    },
    getCustomSourcesByUserId: function(req, res) {
        customSourceModel.getCustomSourcesByUserId(req, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            });
        });
    }
};

module.exports = customSource;