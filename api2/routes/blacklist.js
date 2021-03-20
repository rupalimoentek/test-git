var express = require('express'),
    blacklist = require('../controllers/blacklistController'),
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

router.post('/bulk', function (req, res) {
    blacklist.bulkInsert(req, function (data) {
        res.send(data);
    });
});

router.get('/:id', function (req, res) {
    blacklist.getSearchCallerID(req, function (result) {
        res.send(result);
    });
});

router.get('/', function (req, res) {
    blacklist.getAllBlacknumberAction(req,req.query, function (result) {
        res.send(result);
    });
});

router.get('/org/:id', function (req, res) {
    blacklist.getOrgOfBlockedNumbers(req, function (result) {
        res.send(result);
    });
});

router.delete('/', function (req, res) {
    blacklist.deleteCallerID(req, function (result) {
        res.send(result);
    });
});

module.exports = router;
