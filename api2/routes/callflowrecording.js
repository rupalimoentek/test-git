var express = require('express'),
    callFlowRecording = require('../controllers/callFlowRecordingController'),
    router = express.Router();

// Add headers
router.use(function (req, res, next) {

    // Website you wish to allow to connect
   // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);

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

router.post('/upload', function(req,res){
    callFlowRecording.uploadAction(req, function(data){
        res.send(data);
    });
});

router.get('/:ouid/:type', function(req,res){
    callFlowRecording.getByOuidAndTypeAction(req, function(data){
        res.send(data);
    });
});

router.get('/:ouid', function(req,res){
    callFlowRecording.getByOuidAllAudios(req, function(data){
        res.send(data);
    });
});

router.put('/delete', function(req, res){
    callFlowRecording.putDeleteAction(req, function(data){
        res.send(data);
    });
});

module.exports = router;