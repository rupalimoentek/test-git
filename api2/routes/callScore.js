/**
 * Created by Ashutosh Jagtap on 14/10/2017.
 */
var express = require('express'),
callScoreController = require('../controllers/callScoreController'),
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


router.post('/', function(req, res) {
	callScoreController.getCallScoreReport(req, function (err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});
module.exports = router;
