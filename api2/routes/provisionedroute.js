var express = require('express'),
    provisionedRoutes = require('../controllers/provisionedRouteController'),
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

router.post('/prompt', function(req,res){
    provisionedRoutes.voicePromptAction(req, function(data){
        res.send({
            result: 'success',
            err: '',
            json: data
        });
    });
});

router.post('/whisper', function(req,res){
    provisionedRoutes.whisperAction(req, function(data){
        res.send({
            result: 'success',
            err: '',
            json: data
        });
    });
});

router.get('/:id/:type', function(req,res){
    provisionedRoutes.getRecordingAction(req, req.params.id, req.params.type, function(data){
        res.send({
            result: 'success',
            err: '',
            json: data
        });
    });
});
router.get('/:id', function(req,res){
    provisionedRoutes.checkOutboundCallerId(req, req.params.id, function(data){
         res.send(data);
    });
});
router.get('/checkOutboundCallerIdByCampaignID/campaignID/:id', function(req,res){
    provisionedRoutes.checkOutboundCallerIdByCampaign(req, req.params.id, function(data){
         res.send(data);
    });
});
router.post('/', function(req,res){
    provisionedRoutes.postAction(req, function(data){
        res.send(data);
    });
});

router.put('/', function(req,res){
    provisionedRoutes.putAction(req, function(data){
        res.send(data);
    });
});
router.put('/delete', function(req,res){
    provisionedRoutes.putDeleteAction(req, function(data){
        res.send(data);
    });
});

router.delete('/:id', function(req,res){
    provisionedRoutes.deleteAction(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

module.exports = router;