var controller = require('./appController'),
    f = require('../functions/functions'),
    ctTransactionModel = require('../models/ctTransactionModel'),
    defaultCallActionModel = require('../models/defaultCallActionModel'),
    defaultCallFlowModel = require('../models/defaultCallFlowModel'),
    defaultOldCallFlowModel = require('../models/defaultOldCallFlowModel'),

    defaultFeatureSettings = require('../models/defaultfeatureModel');


var callAction = {
    postAction: function(req, res) {
        defaultCallActionModel.create(req.body, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            });
        });
    },

    putAction: function(req, res) {
        var up = req.body;
        var rules = req.body.rules;
        delete up.rules;

        async.series([
                function(cb) {
                    defaultCallActionModel.update(req.body, function(err) {
                        if (err) { return cb(err); }
                        cb(null, 'updated');
                    });
                },
                function(cb) {
                    defaultCallActionModel.dropRules(req.body.default_action_id, function(err) {
                        if (err) { return cb(err); }
                        cb(null, 'deleted rules');
                    });
                },
                function(cb) {
                    defaultCallActionModel.createRules(rules, req.body.default_action_id, function(err) {
                        if (err) { return cb(err); }
                        cb(null, 'created rules');
                    });
                }
            ],
            function(err, ret) {
                controller.responsify(err, ret, function(response) {
                    res(response);
                });
            });

    },

    getActionByActionId: function(req, res) {
        defaultCallActionModel.readByActionId(req.params.id, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            });
        });
    },

    getAction: function(req, res) {
        defaultCallActionModel.read(req.params.id, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            });
        });
    },

    deleteAction: function(action_id, ouid, res) {
        console.log("action_id: " + action_id);
        defaultCallActionModel.remove(action_id, ouid, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            });
        });
    }
};

var feature = {
    getAction: function(ouid, res) {
        defaultFeatureSettings.read(ouid, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            })
        });
    },

    getShareDni: function(ouid, res) {
        defaultFeatureSettings.getShareDni(ouid, "dni", function(err, disable_share_dni, share_group_name) {
            var data = {
                disable_share_dni: disable_share_dni,
                share_group_name: share_group_name
            }
            controller.responsify(err, data, function(response) {
                res(response);
            })
        });
    },

    // populateCustomParams: function(ouid, res) {
    //     defaultFeatureSettings.populateCustomParams(ouid, function(err, data) {
    //         controller.responsify(err, data, function(response) {
    //             res(response);
    //         })
    //     });
    // },

    // getCustomParamsAction: function(ouid, res) {
    //     defaultFeatureSettings.readCustomParams(ouid, function(err, data) {
    //         controller.responsify(err, data, function(response) {
    //             res(response);
    //         })
    //     });
    // },

    postAction: function(req, res) {
        // defaultFeatureSettings.create(req.body, false, '', function(err, data) {
        defaultFeatureSettings.create(req.body, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            })

        });
    },

    // putCustomParamsAction: function(req, res) {
    //     defaultFeatureSettings.createCustomParams(req.body, function(err, data) {
    //         controller.responsify(err, data, function(response) {
    //             res(response);
    //         })

    //     });
    // }
};

//Call Flow setting
var callFlow = {
    getAction: function(req, res) {
        console.log(req.params);
        var model = defaultCallFlowModel;
        if(req.is_migrated === false){
            model = defaultOldCallFlowModel;
            model.defaultCallFlow.read(req.params.id, function(err, data) {
                controller.responsify(err, data, function(response) {
                    res(response);
                })
            });
        }
        else{
            model.defaultCallFlow.read(req.params.id, function(err, data) {
                controller.responsify(err, data, function(response) {
                    res(response);
                })
            });
        }
    },

    populateCustomParams: function(ouid, res) {
        defaultCallFlowModel.defaultCallFlow.populateCustomParams(ouid, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            })
        });
    },

    getCustomParamsAction: function(ouid, res) {
        defaultCallFlowModel.defaultCallFlow.readCustomParams(ouid, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            })
        });
    },

    putCustomParamsAction: function(req, res) {
        defaultCallFlowModel.defaultCallFlow.createCustomParams(req.body,req.userid, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            })

        });
    },

    postAction: function(req, res) {
        var model = defaultCallFlowModel;
        if(req.is_migrated === false){
            model = defaultOldCallFlowModel;
            model.defaultCallFlow.create(req, false, '', function(err, data) {
                controller.responsify(err, data, function(response) {
                    res(response);
                });
            })
        }
        else{
            var data = req.body;
            data.callFlowData.userid = req.userid;
            data.callFlowData.is_migrated = req.is_migrated;
            model.defaultCallFlow.create(data, false, '', function(err, data) {
                controller.responsify(err, data, function(response) {
                    res(response);
                });
            })
        }
    },

    putAction: function(req, res) {
        var model = defaultCallFlowModel;
        if(req.is_migrated === false){
            model = defaultOldCallFlowModel;
            model.defaultCallFlow.update(req.body, function(err, data) {
                controller.responsify(err, data, function(response) {
                    res(response);
                });
            })
        }
        else{
            model.defaultCallFlow.update(req.body, function(err, data) {
                controller.responsify(err, data, function(response) {
                    res(response);
                });
            })
        }
    },

    deleteAction: function(org_unit_id, res) {
        var appModel = require('../models/appModel');
        defaultCallFlowModel.defaultCallFlow.delete(org_unit_id, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            });
        }, appModel.ctPool);
    },

    deleteActionForCustomSource: function(customsourceid, res) {
        var appModel = require('../models/appModel');
        defaultCallFlowModel.defaultCallFlow.deleteCustomSourceByID(customsourceid, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            });
        }, appModel.ctPool);
    }
};

var commondata = {
    getAction: function(req, res) {
        defaultCallFlowModel.commonModel.read(req.params.id, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            })
        });
    }
};



//module.exports = callFlow;
module.exports = {
    callAction: callAction,
    callFlow: callFlow,
    feature: feature,
    commondata: commondata
}