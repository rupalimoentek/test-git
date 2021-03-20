var express = require('express'),
    industry = require('../controllers/industryController'),
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


router.get('/', function(req,res){
    industry.getAction(req, function(data){
        res.send({
            result: 'success',
            err: '',
            json: data
        });
    });
});

router.get('/:id', function(req,res){
    industry.getAction(req.params, function(data){
        res.send({
            result: 'success',
            err: '',
            json: data
        });
    });
});


module.exports = router;