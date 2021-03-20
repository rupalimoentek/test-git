var express = require('express'),
    defgroupsetting = require('../controllers/defaultGroupSettingsController'),
    router = express.Router(),
    t = require('../lib/tokenizer');

// Add headers
router.use(function(req, res, next) {

    // Website you wish to allow to connect
    //res.setHeader('Access-Control-Allow-Origin', req.headers.origin);

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,content-type,Accept, Authorization');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

//get data
router.get('/callAction/:id', function(req, res) {
    defgroupsetting.callAction.getAction(req, function(data) {
        res.send(data);
    })
});

router.get('/callAction/action/:id', function(req, res) {
    defgroupsetting.callAction.getActionByActionId(req, function(data) {
        res.send(data);
    })
});

router.delete('/callAction/:id/:ouid', function(req, res) {
    defgroupsetting.callAction.deleteAction(req.params.id, req.params.ouid, function(data) {
        res.send(data);
    })
});

router.post('/callAction', function(req, res) {
    defgroupsetting.callAction.postAction(req, function(data) {
        res.send(data);
    })
});

router.put('/callAction', function(req, res) {
    defgroupsetting.callAction.putAction(req, function(data) {
        res.send(data);
    })
});

router.get('/feature/:id', function(req, res) {
    defgroupsetting.feature.getAction(req.params.id, function(data) {
        res.send(data);
    })
});

router.get('/feature/shareDni/:id', function(req, res) {
    defgroupsetting.feature.getShareDni(req.params.id, function(data) {
        res.send(data);
    })
});

// router.get('/feature/customParams/:id', function(req, res) {
//     defgroupsetting.feature.getCustomParamsAction(req.params.id, function(data) {
//         res.send(data);
//     })
// });

// router.post('/feature/customParams/', function(req, res) {
//     defgroupsetting.feature.putCustomParamsAction(req, function(data) {
//         res.send(data);
//     })
// });

// router.get('/feature/customParams/populate/:id', function(req, res) {
//     defgroupsetting.feature.populateCustomParams(req.params.id, function(data) {
//         res.send(data);
//     })
// });





//Create Data
router.post('/feature', function(req, res) {
    defgroupsetting.feature.postAction(req, function(data) {
        res.send(data);
    })
});

router.get('/CustomSource/:id', function(req, res) {
    defgroupsetting.customSource.getAction(req.params.id, function(data) {
        res.send(data);
    })
});


router.get('/CallFlow/:id', function(req, res) {
    defgroupsetting.callFlow.getAction(req, function(data) {
        res.send(data);
    })
});

router.get('/CallFlow/customParams/:id', function(req, res) {
    defgroupsetting.callFlow.getCustomParamsAction(req.params.id, function(data) {
        res.send(data);
    })
});

router.get('/CallFlow/customParams/populate/:id', function(req, res) {
    defgroupsetting.callFlow.populateCustomParams(req.params.id, function(data) {
        res.send(data);
    })
});

router.post('/CallFlow/customParams/', function(req, res) {
    defgroupsetting.callFlow.putCustomParamsAction(req, function(data) {
        res.send(data);
    })
});


router.get('/CAStatus/:id', function(req, res) {
    defgroupsetting.orgunitdetail.getAction(req, function(data) {
        res.send(data);
    })
});

//get data
router.get('/populatecallflow/:id', function(req, res) {
    defgroupsetting.commondata.getAction(req, function(data) {
        res.send(data);
    })
});

router.get('/SpamStatus/:id', function(req, res) {
    defgroupsetting.spamGuardDetail.getAction(req, function(data) {
        res.send(data);
    })
});

router.put('/CallFlow', function(req, res) {
    defgroupsetting.callFlow.putAction(req, function(data) {
        res.send(data);
    })
});

router.put('/CustomSource', function(req, res) {
    defgroupsetting.customSource.putAction(req, function(data) {
        res.send(data);
    })
});


router.put('/CAStatus', function(req, res) {
    defgroupsetting.orgunitdetail.putAction(req, function(data) {
        res.send(data);
    })
});

router.put('/SpamStatus', function(req, res) {
    defgroupsetting.spamGuardDetail.putAction(req, function(data) {
        res.send(data);
    })
});




router.post('/CustomSource', function(req, res) {
    defgroupsetting.customSource.postAction(req, function(data) {
        res.send(data);
    })
});

router.post('/CallFlow', function(req, res) {
    defgroupsetting.callFlow.postAction(req, function(data) {
        res.send(data);
    });
});

router.post('/CAStatus', function(req, res) {
    defgroupsetting.orgunitdetail.postAction(req, function(data) {
        res.send(data);
    });
});

router.post('/SpamStatus', function(req, res) {
    defgroupsetting.spamGuardDetail.postAction(req, function(data) {
        res.send(data);
    });
});


router.delete('/CallFlow/:id', function(req, res) {
    console.log(req);
    defgroupsetting.callFlow.deleteAction(req.params.id, function(data) {
        res.send(data);
    })
});

router.delete('/CustomSource/:id', function(req, res) {
    defgroupsetting.callFlow.deleteActionForCustomSource(req.params.id, function(data) {
        res.send(data);
    })
});


module.exports = router;