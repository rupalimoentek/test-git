var express = require('express'),
    locationRoute = require('../controllers/locationRouteController'),
    router = express.Router(),
    t = require('../lib/tokenizer');

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


router.post('/import', function(req,res){
    locationRoute.importAction(req, function(data){
        res.send(data);
    });
});

router.post('/', function(req,res){
    locationRoute.createAction(req, function(data){
        res.send(data);
    });
});

router.put('/', function(req,res){
    locationRoute.updateAction(req, function(data){
        res.send(data);
    });
});

router.delete('/:id', function(req,res){
    locationRoute.deleteAction(req.params.id, function(data){
        res.send(data);
    });
});

module.exports = router;