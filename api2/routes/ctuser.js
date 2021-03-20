var express = require('express'),
    user = require('../controllers/ctUserController'),
    router = express.Router(),
    ctlogger = require('../lib/ctlogger.js'),
    t = require('../lib/tokenizer');

// Add headers
/*router.use(function (req, res, next) {

    // Website you wish to allow to connect
   // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);

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
*/
// ======= For Export functionality ===============

router.get('/users/ouId/:ouid/userAccess/:userAccess', function(req, res) {

    user.getUsersReport(req, function(data) {
        res.send(data);
    });
});

router.post('/noemail', function(req, res) {
    var user = require('../controllers/ctUserController');
    user.postAction_noemail(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.post('/', function(req, res) {
    user.postAction(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.put('/add_user_to_camapains', function(req, res) {
    user.addToCampaignsAction(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.get('/', function(req, res) {
    user.getAction(req, function(data) {
        res.send(data);
    });
});

router.get('/:id', function(req, res) {
    //console.log(req.params);
    user.getAction(req.params, function(data) {
        res.send(data);
    });
});

router.get('/campaignUser/:ouid', function(req, res) {
    //console.log(req.params);
    user.getCampaignUsers(req.params, function(data) {
        res.send(data);
    });
});

router.get('/campaignOwner/:ouid/:campId', function(req, res) {
    //console.log(req.params);
    user.getCampaignOwners(req.user.orglist, function(data) {
        res.send(data);
    });
});

router.put('/', function(req, res) {
    //added role id for checking only admin can update password
    if (req.body.user.password && (req.body.user.role_id !== undefined)) {
        if (parseInt(req.body.user.role_id) === 1) {
            user.putAction(req, function(data) {
                res.send(data);
            });
        } else {
            res.status("err").send("You dont have permission to update password");
        }

    } else {
        user.putAction(req, function(data) {
            res.send(data);
        });
    }
});

router.delete("/blahblah", function(req, res) {


    var ctTransModel = require("../models/ctTransactionModel.js");
    var webhookModel = require("../models/webhookModel.js");
    var campaignModel = require("../models/campaignModel.js");

    var dataStructureSetStatusRequires = {
        campaign: {
            id: 686,
            status: 'deleted'
        }
    };

    ctTransModel.begin(function(err) {
        campaignModel.setStatus(dataStructureSetStatusRequires, function(errr) {
            if (errr) {
                ctTransModel.rollback(function() {
                    return res.send(errr);
                });
            } else {
                ctTransModel.commit(function() {
                    res.send("yay commited");

                    var newdata = { "org_unit_id": req.ouid, "ct_user_id": data.insertId, "log_data": req.body };
                    ctlogger.log(newdata, 'delete', 'user', '', '', req.headers.authorization);

                });
            }
        }, ctTransModel);
    });
});

router.get('/groups/:id', function(req, res) {
    user.getAllTopOuUsers(req, function(data) {
        res.send(data);
    });
});

//Get all active and inactive users
router.get('/deleted/:id', function(req, res) {
    user.getAllDeletedTopOuUsers(req, function(data) {
        res.send(data);
    });
});

module.exports = router;