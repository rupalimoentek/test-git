var express = require('express'),
    campaigns = require('../controllers/campaignController'),
    router = express.Router(),
    t = require('../lib/tokenizer'),
    users = require('../models/ctUserModel');

// Add headers
router.use(function (req, res, next) {

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


router.post('/', function(req,res){
    campaigns.postAction(req, function(data){
        res.send(data);
    });
});
//SP
router.post('/campaignCallflow', function(req,res){
    campaigns.getByOuIdCallFlowAction(req.body.campaignIds, function(data){
        res.send(data);
    });
});
//SP
//SP Campaign Call Flow Report 
router.get('/reportData/ouid/:id/userAccess/:user_access_id/:timezone', function(req,res){
    campaigns.getReportData(req.params.id,req.userid,req.params.user_access_id,req.params.timezone, req.user.orglist, req.query.camp_id, function(data){
            res.send(data);
         });

    // campaigns.getCampaignsCallFlowReport(req.params.id,req.userid,req.params.user_access_id,req.params.timezone, function(data){
    //     res.send(data);
    // });
});
//SP

router.get('/', function(req,res){
    campaigns.getByUserIdAction(req.userid, function(data){
        res.send(data);
    });
});

router.get('/ouid/:id/userAccess/:user_access_id/:timezone', function(req,res){
    campaigns.getByOuIdAction(req.userid, req.params.id, req.ouid, req.params.user_access_id, req.user.orglist, req.params.timezone, req.query, function(data){
        res.send(data);
    });
});
router.get('/ouid/:id/userAccess/:user_access_id/:timezone/:timezone1', function(req,res){
    campaigns.getByOuIdAction1(req.userid, req.params.id, req.ouid, req.params.user_access_id, req.user.orglist, req.params.timezone,req.params.timezone1, function(data){
        res.send(data);
    });
});

router.get('/:id/:timezone', function(req,res){ 
    var campaignId = parseInt(req.params.id);
    var ouid = parseInt(req.ouid);
    if( req.camplist.indexOf(campaignId) === -1 || req.orglist.indexOf(ouid) === -1) {
          res.send({
            result: 'error',
            err: 'Unauthorized Access to the campaign',
            json: []
        });
        return;
    } else {
    campaigns.getAction(req, 'campaign', req.params.id,req.params.timezone,req.query.page, function(err, data){
        res.send({
            result: 'success',
            err: '',
            json: data
        });
    });
    }
});
router.get('/:id/:timezone/:timezone1', function(req,res){
    campaigns.getAction1(req, 'campaign', req.params.id,req.params.timezone,req.params.timezone1, function(data){
        res.send({
            result: 'success',
            err: '',
            json: data
        });
    });
});

router.get('/user/:id', function(req,res){
    campaigns.getByUserAction(req, req.params.id, function(data){
        res.send({
            result: 'success',
            err: '',
            json: data
        });
    });
});

router.put('/', function(req,res){
    campaigns.putAction(req, function(data){
        res.send(data);
    });
});

router.put('/status', function(req,res){
    campaigns.statusAction(req, function(data){
        res.send(data);
    });
});

router.delete('/:id', function(req,res){
    var campaigns = require('../models/campaignModel');
    campaigns.delete(req.params, function(err, data){
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

module.exports = router;
