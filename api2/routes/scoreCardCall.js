var express = require('express'),
	scoreCardCall = require('../controllers/scoreCardCallController'),
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


router.get('/retriveScoreCardCalls', function(req,res){
    scoreCardCall.getCallDetails(req, function(data){
        res.send(data);
    });
});

router.post('/saveComment/callID/:callID', function(req,res){
    scoreCardCall.saveComment(req, function(data){
        res.send(data);
    });
});

router.post('/saveCallCriteria/callID/:callID', function(req,res){
    scoreCardCall.saveCallCriteria(req, function(data){
        res.send(data);
    });
});


router.get('/getCallAudioFile/callID/:callID', function(req,res){
    scoreCardCall.getCallAudioFile(req, function(data){
        res.send(data);
    });
});

router.get('/checkifuservalid/userid/:userId/callgroup/:callGroup', function(req,res){
    scoreCardCall.checkIfUserValid(req, function(data){
        res.send(data);
    });
});

router.get('/getCallsTags/callID/:callID', function(req,res){
    scoreCardCall.getCallsTags(req, function(data){
        res.send(data);
    });
});
router.get('/getScoreCards', function(req,res){
    scoreCardCall.getScoreCards(req, function(data){
        res.send(data);
    });
});

router.post('/', function(req,res){
    scoreCardCall.addScoreCallDetail(req, function(data){
        res.send(data);
    });
});
router.put('/', function(req,res){
    scoreCardCall.updateScoreCallDetail(req, function(data){
        res.send(data);
    });
});

router.get('/updateScoreStatus/callScorecardId/:callScorecardId/callScoreStatus/:callScoreStatus', function(req,res){
    scoreCardCall.updateScoreStatus(req, function(data){
        res.send(data);
    });
});

//Amrita - fetch Active Score Cards
router.get('/retriveActiveScoreCards/:ouid', function(req,res){
    scoreCardCall.getActiveScoreCards(req, function(data){
        res.send(data);
    });
});
router.get('/getIdentifyUsers/:callID', function(req,res){
    scoreCardCall.getIdentifyUsers(req, function(data){
        res.send(data);
    });
});

//Amrita - Update Agent (ct_user_id) in call table.
router.post('/agent/:scoreCardCallId/:ctUserId', function(req, res) {
    scorecard.saveAgent(req.params, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});


router.get('/AdvancedActiveScoreCards/:ouid', function(req,res){
    scoreCardCall.getAdvancedActiveScoreCards(req, function(data){
        res.send(data);
    });
});


module.exports = router;
