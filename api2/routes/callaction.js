var express = require('express'),
    router = express.Router(),
    call_action = require('../controllers/callActionController');

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
router.post('/', function(req, res){
	call_action.postAction(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.post('/bulk', function(req, res){
	call_action.bulkInsert(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.put('/', function(req, res){
	call_action.putAction(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.get('/:actionid', function(req, res) {
	call_action.getAction(req, req.params.actionid, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.delete('/:actionid', function(req, res) {
	call_action.deleteAction(req, req.params.actionid, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.get('/byRoute/:routeid', function(req, res) {
	call_action.byRouteAction(req, req.params.routeid, function(err, data) {
		console.log(data);
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

module.exports = router;