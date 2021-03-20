var express = require('express'),
    conversationController = require('../controllers/conversationController'),
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

router.put('/label', function(req,res){
    conversationController.label(req, function(data){
      res.send(data);
    });
 });
  
router.get('/', function(req, res){
    conversationController.getAllConversation(req, function(data){
        res.send(data);
    });
});

router.put('/status', function(req,res){
    conversationController.statusAction(req, function(data){
        res.send(data);
    });
});

router.get('/badge', function(req, res){
    conversationController.getBadgeCount(req, function(data){
      res.send(data);
    });
 });

router.post('/sendMessage', function(req, res){
    conversationController.sendSMS(req, function(data){
        res.send(data);
    });
});
router.get('/chatHistory/:conversations_id', function(req, res){
    conversationController.getChatHistory(req, function(data){
      res.send(data);
    });
 });
 router.get('/live-sms', function(req, res){
    conversationController.getLiveSms(req, function(data){
      res.send(data);
    });
 });

module.exports = router;
