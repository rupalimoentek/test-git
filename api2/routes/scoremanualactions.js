var express = require('express'),
    scoremanualactionController = require('../controllers/scoreManualActionController'),
    router = express.Router();

// Add headers
router.use(function(req, res, next) {

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


// this expects to get manual score action detail by score card action id
router.get('/:id', function(req, res) {
    scoremanualactionController.getScoreManualActions(req, function(data) {
        res.send(data);
    });
});


// this expects to get manual score action detail by user id
router.get('/user/:id', function(req, res) {
    scoremanualactionController.getScoreManualActionsByUserID(req, function(data) {
        res.send(data);
    });
});

// this expects to save new manual score action detail
router.post('/', function(req, res) {
    scoremanualactionController.saveScoreManualActions(req, function(data) {
        res.send(data);
    });
});

// this expects to save bulk of new manual score action detail
router.post('/:id', function(req, res) {
    scoremanualactionController.createBulkScoreAction(req, function(data) {
        res.send(data);
    });
});

// this expects to save new manual score action detail
router.put('/', function(req, res) {
    scoremanualactionController.updateScoreManualActions(req, function(data) {
        res.send(data);
    });
});

// this expects to save new manual score action detail
router.delete('/:id', function(req, res) {
    scoremanualactionController.deleteScoreManualActions(req, function(data) {
        res.send(data);
    });
});

module.exports = router;