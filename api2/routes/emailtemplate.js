var express = require('express'),
emailTemplate = require('../controllers/emailTemplateController'),
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

router.post('/', function(req, res) {
	console.log('-----------------------------');
	emailTemplate.postAction(req, function(err, data) {
		console.log('RET DATA', data, err);
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.put('/', function(req, res) {
	emailTemplate.postAction(req, function (err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.delete('/:id', function(req, res) {
	console.log('route DELETE emailTemplate');
	emailTemplate.deleteAction(req.params.id, function (err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.get('/:ou_id/:master_id', function(req, res) {
	console.log('route GET emailTemplate');
	emailTemplate.getAction(req.params.ou_id, req.params.master_id, function (err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

module.exports = router;