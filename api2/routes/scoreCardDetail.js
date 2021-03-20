var express = require('express'),
	scoreDetail = require('../controllers/scoreCardDetailController'),
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


router.get('/callDetailScorecard', function(req,res){
    scoreDetail.getCallDetails(req, function(data){
        res.send(data);
    });
});

router.get('/getIdentifyUsers', function(req,res){
    scoreDetail.getIdentifyUsers(req, function(data){
        res.send(data);
    });
});
router.get('/getCallAudioFile/callID/:callID', function(req,res){
    scoreDetail.getCallAudioFile(req, function(data){
        res.send(data);
    });
});

router.get('/getCallsTags/callID/:callID', function(req,res){
    scoreDetail.getCallsTags(req, function(data){
        res.send(data);
    });
});

router.post('/addTagByCallId/callID/:callID', function(req,res){

    console.log("\n\n\n\n addTagByCallId",req.body)
    scoreDetail.addTagByCallId(req, function(data){
        res.send(data);
    });
});
router.delete('/deleteTagByCallId/callID/:callID/tagId/:tagId', function(req,res){
    scoreDetail.deleteTagByCallId(req, function(data){
        res.send(data);
    });
});

router.get('/getScoreCards', function(req,res){
    scoreDetail.getScoreCards(req, function(data){
        res.send(data);
    });
});

router.post('/', function(req,res){
    scoreDetail.addScoreCallDetail(req, function(data){
        res.send(data);
    });
});
router.put('/', function(req,res){
    scoreDetail.updateScoreCallDetail(req, function(data){
        res.send(data);
    });
});

router.get('/updateScoreStatus/callScorecardId/:callScorecardId/callScoreStatus/:callScoreStatus', function(req,res){
    scoreDetail.updateScoreStatus(req, function(data){
        res.send(data);
    });
});
router.get('/getAllComments/callID/:callID', function(req,res){
    scoreDetail.getAllComments(req, function(data){
        res.send(data);
    });
});
router.post('/addCommentRespons/commentID/:commentID', function(req,res){
    //console.log("in side route file...")
    scoreDetail.addCommentRespons(req, function(data){
        res.send(data);
    });
});
router.get('/getCommentResponses/commentID/:commentID', function(req,res){
    scoreDetail.getCommentResponses(req, function(data){
        res.send(data);
    });
});
router.delete('/deleteComment/commentID/:commentID', function(req,res){
    scoreDetail.deleteComment(req, function(data){
        res.send(data);
    });
});

router.delete('/deleteCommentResponse/responseID/:responseID', function(req,res){
    scoreDetail.deleteCommentResponse(req, function(data){
        res.send(data);
    });
});
module.exports = router;
