var express = require('express'),
	router = express.Router(),
	call_flow = require('../controllers/callFlowController');

// Add headers
router.use(function (req, res, next) {

	// Website you wish to allow to connect
	//res.setHeader('Access-Control-Allow-Origin', req.headers.origin);

	// Request methods you wish to allow
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

	// Request headers you wish to allow
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	res.setHeader('Access-Control-Allow-Credentials', true);

	// Pass to next layer of middleware
	next();
});
router.get('/provisionedroute/:id', function(req,res){
	call_flow.getByProvisionedRouteAction(req, req.params.id,req.is_migrated, function(data){
		res.send(data);
	});
});

router.get('/provisionedroutecallerIDs', function(req,res){
	call_flow.getOutboundCallerIDs(req, req.params.id, function(data){
		res.send(data);
	});
});


router.get('/getmedia/:message', function(req,res){
	call_flow.getMedia(req, req.params.message, function(data){
		res.send(data);
	});
});

router.get('/:id/:timezone', function(req,res){
	console.log("sdsd");
    call_flow.getAction1(req, 'campaign', req.params.id,req.params.timezone,req.params.timezone1, function(data){
        res.send({
            result: 'success',
            err: '',
            json: data
        });
    });
});


router.get('/location/:ouid', function(req,res){
	call_flow.getLocationAction(req, req.params.ouid, function(data){
		res.send(data);
	});
});

module.exports = router;
