var express = require('express'),
    customSource = require('../controllers/customSourceController'),
    router = express.Router();

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
    customSource.postAction(req, function(data){
        res.send(data);
    });
});

router.get('/ouid/:ouid/userAccess/:user_access_id', function(req,res){
    customSource.getByOuidAction(req, function(data){
        res.send(data);
    });
});

router.get('/:ouid', function(req,res){
    customSource.read(req, function(data){
        res.send(data);
    });
});

router.get('/userAccess/:user_id', function(req,res){
    customSource.getCustomSourcesByUserId(req, function(data){
        res.send(data);
    });
});

router.get('/ouid/:ouid/userAccess/:user_access_id/isFromCustomSources/:isFromCustomSources', function(req,res){
    customSource.getCustomSources(req, function(data){
        res.send(data);
    });
});

router.put('/delete', function(req,res){
    customSource.putDeleteAction(req, function(data){
        res.send(data);
    });
});



module.exports = router;
