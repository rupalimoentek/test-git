var express = require('express'),
    analytic = require('../controllers/analyticController'),
    router = express.Router();

// Add headers
router.use(function (req, res, next) {

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

router.post('/', function(req,res){
    analytic.postAction(req, function(data){
        res.send(data);
    });
});

router.put('/', function(req,res){
    analytic.putAction(req, function(data){
        res.send(data);
    });
});

router.get('/ouid/:ouid/includeParentAnalytics/:includeParentAnalytics', function(req,res){
    analytic.getByOuidAction(req.params.ouid,req.params.includeParentAnalytics, function(data){
        res.send(data);
    });
});

module.exports = router;