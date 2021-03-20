//TODO: Send the array of campaign ids to get the callflows
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


router.get('/', function(req,res){
    campaigns.getByOuIdCallFlowAction(req.query,function(response){   
        res.send(response);
    });
});

router.post('/all', function(req,res){
    campaigns.getAllCampaignCallflow(req,function(response){   
        res.send(response);
    });
});

module.exports = router;