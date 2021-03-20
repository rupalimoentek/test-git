/**
 * Created by davey on 3/31/15.
 */
var express = require('express'),
webhook = require('../controllers/webhookController'),
router = express.Router();


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


router.get('/route/:id', function(req, res) {
	webhook.getRouteAction(req.params.id, function (err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.get('/:id/ouid/:ouid', function(req, res) {
	webhook.getAction(req, function (err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.post('/map', function(req, res) {
	webhook.mapPostAction(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.put('/map', function(req, res) {
	webhook.mapPutAction(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.delete('/map/:mapid', function(req, res) {
	webhook.mapDeleteAction(req, req.params.mapid, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.get('/list/:ouid', function(req, res) {
	webhook.listAction(req.params.ouid, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});
router.get('/webhooklist/:ouid', function(req, res) {
	webhook.getWebhookList(req.params.ouid, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});
router.post('/test', function(req, res) {
	webhook.postActionTest(req, function (err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.post('/', function(req, res) {
	webhook.postAction(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.put('/', function(req, res) {
	webhook.putAction(req, function (err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.delete('/:id([0-9]+)', function(req, res) {
	webhook.deleteAction(req, req.params.id, function (err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

/* the structure changes, so these functions are no longer being used
	NOTE:  Leaving these here as if webhooks is ever rewritten properly with fields mapped, these should be used.


router.put('/payload/:webhookid/:triggerid/:group', function(req, res) {
	webhook.payloadPutAction(req, req.params.webhookid, req.params.triggerid, req.params.group, function(err, data) {
		res.send({
			result: (err ? 'failed' : 'success'),
			err: err,
			json: data
		});
	});
});

router.get('/payload/:triggerid', function(req, res) {
	webhook.payloadGetAction(req.params.triggerid, function(err, data) {
		res.send({
			result: (err ? 'failed' : 'success'),
			err: err,
			json: data
		});
	});
});


router.get('/field/:triggerid', function(req, res) {
	console.log('hit router');
	webhook.fieldListAction(req.params.triggerid, function(err, data) {
		res.send({
			result: (err ? 'failed' : 'success'),
			err: err,
			json: data
		});
	});
});
*/

module.exports = router;
