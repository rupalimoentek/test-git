var express = require('express'),
    dniSetting = require('../controllers/dniSettingController'),
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


router.get('/:ouid/:prov_id/:user_access', function(req,res){
	//console.log(req);
    dniSetting.getAction(req, function(data){
        res.send(data);
    });
});

router.get('/code/:ouid/', function(req,res){
    //console.log(req);
    dniSetting.getDNICode(req, function(data){
        res.send(data);
    });
});

router.put('/', function(req,res){
	//console.log(req);
    dniSetting.putAction(req, function(data){
        res.send(data);
    });
});

router.post('/', function(req,res){
	//console.log(req);
    dniSetting.postAction(req, function(data){
        res.send(data);
    });
});

router.delete('/:id', function(req,res){
   dniSetting.deleteAction(req.params.id, function(data){
        res.send(data);
    });
});



module.exports = router;