var express = require('express'),
    shoutPoint = require('../controllers/shoutPointController'),
    router = express.Router();

// Add headers
router.use(function (req, res, next) {

	// Website you wish to allow to connect
	//res.setHeader('Access-Control-Allow-Origin', req.headers.origin);

	// Request methods you wish to allow
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

	// Request headers you wish to allow
	res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,content-type,Accept, X-Api-Key, Authorization');

	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	res.setHeader('Access-Control-Allow-Credentials', true);

	// Pass to next layer of middleware
	next();
});

router.get('/npa/:npa', function(req, res){
	shoutPoint.npaAction(req.params.npa, function(err, data){
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.get('/npanxx/:npanxx', function(req, res){
	shoutPoint.npanxxAction(req.params.npanxx, function(err, data){
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.get('/rcState/:rc/:state', function(req,res){
	console.log('calling rcState');
	shoutPoint.rcStateAction(req.params.rc, req.params.state, function(err, data){
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

// this expects an array of phone number called 'did'
router.post('/order', function(req, res) {
	console.log('calling order no');
	shoutPoint.orderAction(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

// this expects an array of phone number called 'did'
// router.delete('/', function(req, res) {
// 	shoutPoint.removeAction(req, function(err, data) {
// 		res.send({
// 			result: (err ? 'error' : 'success'),
// 			err: err,
// 			json: data
// 		});
// 	});
// });


module.exports = router;
