var express = require('express'),
    router  = express.Router(),
    t       = require('../lib/tokenizer');

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


// router.post('/', function(req,res){
    
// });

router.get('/', function(req,res){
    var data = [
      {id: 1, text: 'Admin'},
      {id: 2, text: 'Standard'},
      {id: 3, text: 'Read-Only'},
      {id: 8, text: 'Identified-only'}
    ];
    
    res.send({
        result: 'success',
        err: '',
        json: data
    });
});

// router.get('/:id', function(req,res){
// });

// router.put('/', function(req,res){
// });

// router.delete('/:id', function(req,res){
// });

module.exports = router;
