var express = require('express'),
    subscription = require('../controllers/subscriptionController'),
    router = express.Router();

// Add headers
router.use(function (req, res, next) {

	// Website you wish to allow to connect
	// res.setHeader('Access-Control-Allow-Origin', req.headers.origin);

	// Request methods you wish to allow
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

	// Request headers you wish to allow
	res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,content-type,Accept, Authorization');

	// Set to true if you need the website to include cookies in the requests
	// sent
	// to the API (e.g. in case you use sessions)
	res.setHeader('Access-Control-Allow-Credentials', true);

	// Pass to next layer of middleware
	next();
});



router.get('/getAllCounts/:ouId', function(req, res){
	console.log('calling getAllCounts');
	subscription.getAllCounts({'ouId': req.params.ouId}, function(data){
		res.send({
	        result: 'success',
			err: '',
	        json: data
        });
	});
});

router.get('/getCampaignsCounts/:ouId', function(req, res){
	console.log('calling getCampaignsCounts');
	subscription.getCampaignsCounts({'ouId': req.params.ouId}, function(data){
		res.send({
	        result: 'success',
			err: '',
	        json: data
        });
	});
});

router.get('/getTrackingNumbersCounts/:ouId', function(req,res){
	console.log('calling getTrackingNumbersCounts');
	subscription.getTrackingNumbersCounts({'ouId': req.params.ouId}, function(data){
		res.send({
	        result: 'success',
			err: '',
	        json: data
        });
	});
});

router.get('/getMinutesUsed/:ouId', function(req,res){
	console.log('calling getMinutesUsed');
	subscription.getMinutesUsed({'ouId': req.params.ouId}, function(data){
		res.send({
	        result: 'success',
			err: '',
	        json: data
        });
	});
});

router.get('/getUserUsed/:ouId', function(req,res){
	console.log('calling getUserUsed');
	subscription.getUserUsed({'ouId': req.params.ouId}, function(data){
		res.send({
	        result: 'success',
			err: '',
	        json: data
        });
	});
});

/*router.get('/getCallActions/', function(req,res){
	console.log('calling getCallActions');
	subscription.getCallActions({'ouId': req.params.ouId, 'from': req.params.from}, function(data){
		res.send({
	        result: 'success',
			err: '',
	        json: data
        });
	});
});*/

module.exports = router;
