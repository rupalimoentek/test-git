    var express = require('express'),
    call = require('../controllers/callController'),
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


router.get('/info/:id', function(req,res){
    call.getInfo(req.params, function(data){
		//console.log(req.params);
        res.send(data);
    });
});

router.get('/comment/:id', function(req,res){
    req.params.timezone = req.query.timezone;
    call.getComment(req.params, function(data){
        res.send(data);
    });
});

router.post('/comment/', function(req,res){
    call.postComment(req, function(data){
        res.send(data);
    });
});

router.delete('/comment/:id', function(req,res){
    call.deleteComment(req, function(data){
        res.send(data);
    });
});

router.get('/tag/:id', function(req,res){
    req.params.orglist = req.orglist;
    call.getTag(req.params, function(data){
        res.send(data);
    });
});

router.post('/tag/', function(req,res){
    call.postTag(req, function(data){
        res.send(data);
    });
});

router.post('/email/', function(req,res){
    call.emailRecording(req, function(data){
        res.send(data);
    });
});



module.exports = router;
