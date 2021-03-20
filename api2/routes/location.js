var express = require('express'),
    location = require('../controllers/locationController'),
    router = express.Router(),
    t = require('../lib/tokenizer');

// Add headers
/*router.use(function (req, res, next) {

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
*/

router.post('/', function(req,res){
    location.createAction(req, function(data){
        res.send(data);
    });
});

router.post('/ivr', function(req,res){
    location.saveLocationIVR(req, function(data){
        res.send(data);
    });
});

router.put('/', function(req,res){
    location.updateAction(req, function(data){
        res.send(data);
    });
});

router.put('/delete', function(req,res){
    location.deleteAction(req, function(data){
        res.send(data);
    });
});

router.delete('/delete_location/:id', function(req,res){
    location.deleteLocationAction(req.params.id, function(data){
        res.send(data);
    });
});
router.get('/:id', function(req,res){
        location.getByIdAction(req.params.id, req.query,req.timezone,function(data){
        res.send(data);
    });
});

router.get('/ouid/:ouid/:timezone', function(req,res){
    location.getByOuidAction(req.params, function(data){
        res.send(data);
    });
});
router.get('/ouid/:ouid/:timezone/:timezone1', function(req,res){
    location.getByOuidAction1(req.params, function(data){
        res.send(data);
    });
});

router.get('/ivr/:id', function(req,res){
    location.getIvrBylocationIvrId(req.params.id, function(data){
        res.send(data);
    });
});

router.delete('/ivr/:id', function(req,res){
    location.deleteIvrBylocationIvrId(req.params.id, function(data){
        res.send(data);
    });
});

module.exports = router;
