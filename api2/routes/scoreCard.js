var express = require('express'),
    scorecard = require('../controllers/scoreController'),
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
// this expects to save new score card detail
router.post('/', function(req, res) {
	scorecard.save_score_card(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.put('/:id', function(req, res) {
	scorecard.update_score_card(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.post('/scorecall/scoreCardCallId/:callId/scoreId/:id', function(req, res) {

	scorecard.add_score_to_call(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.post('/attchscorecard/callId/:callId', function(req, res) {
	scorecard.attach_score_card_to_call(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.post('/set-call-listened/callId/:callId', function(req, res) {
	scorecard.set_call_listened(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.put('/callstatus/callId/:callId/scoreId/:id', function(req, res) {
	scorecard.update_score_card_call_status(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.get('/getGroups', function(req, res) {
	scorecard.getGroups(req,function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.get('/getScoreCards', function(req, res) {
console.log("Inside router");
	scorecard.getScoreCards(req,function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.get('/scoreId/:id', function(req, res) {
	
		scorecard.getScoreCardsById(req,function(err, data) {
			res.send({
				result: (err ? 'error' : 'success'),
				err: err,
				json: data
			});
		});
});

router.get('/archiveScorecard/scoreId/:Id', function(req, res) {
	scorecard.archiveScorecard(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.get('/checkScoreCardStatus/scoreId/:Id', function(req, res) {
	scorecard.checkScoreCardStatus(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.get('/scoreCardDetail/scoreCardCallId/:scoreCardCallId/scoreId/:id', function(req, res) {
	scorecard.scoreCardDetail(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.get('/getAttachedCalls/scoreCardId/:Id', function(req, res) {
	scorecard.getAttachedCalls(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.get('/criterias/scorecardId/:id', function (req, res) {
	scorecard.getScoreCardCriterias(req, function (err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

// Endpoint for specific account of 'belle tire' to get criteria list of score card 
router.post('/assignScorecard/callId/:id', function(req, res) {
	scorecard.assignScorecardToCall(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});
// Endpoint for specific account of 'belle tire' to get criteria list of score card 
router.post('/scoreCall/callId/:callId/scoreCardId/:id', function(req, res) {
	scorecard.addOrUpdateCallScore(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

module.exports = router;
