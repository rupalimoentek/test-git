var express = require('express'),
whitelabel = require('../controllers/whitelabelController'),
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

router.post('/img', function(req, res) {
	whitelabel.resizeAction(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.post('/', function(req, res) {
	whitelabel.postAction(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.put('/', function(req, res) {
	whitelabel.postAction(req, function (err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.delete('/:id', function(req, res) {
	console.log('route DELETE whitelabel');
	whitelabel.deleteAction(req.params.id, function (err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.get('/:id', function(req, res) {
	console.log('route GET whitelabel');
	whitelabel.getAction(req.params.id, function (err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

module.exports = router;