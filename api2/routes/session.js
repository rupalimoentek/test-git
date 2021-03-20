var express = require('express'),
    router = express.Router(),
    sessions = require('../controllers/sessionController');

// Add headers
router.use(function (req, res, next) {

    // Website you wish to allow to connect
   // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

router.put('/', function(req,res){
    sessions.putAction(req, function(data){
        res.send({
            result: 'success',
            err: '',
            json: data
        });
    });
});

// replaced old session route with this new route which returns the same information as when authentication succeeds
router.get('/', function(req, res) {
    var data = {};
    data.access_token = req.headers.authorization.replace(/^bearer\s/i, '');
    if (req.user !== undefined) { data.session = req.user; }
    if (req.authInfo !== undefined) { data.scope = req.authInfo; }
    res.send({
        result: 'success',
        err: '',
        json: data
    });
});

router.get('/style/:ouid', function(req, res) {
	var access = require('../controllers/userAccessController');
    access.stylingAction(req.params.ouid, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.get('/style', function(req, res) {
   /* if (req.user !== undefined && req.user.length > 0 && req.user[0].style !== undefined) {
        console.log('found style to return');
        var data = req.user[0].style;
        res.send({
            result: 'success',
            err: '',
            json: data
        });
    } else {
    */
        if (req.user[0].ou_id !== undefined) {
            console.log('retrieving style from method');
            var access = require('../controllers/userAccessController');
            access.stylingAction(req.user[0].ou_id, function (err, data2) {
                res.send({
                    result:(err ? 'error' : 'success'),
                    err   :err,
                    json  :data2
                });
            });
        } else {
            res.send({
                result: 'error',
                err: 'No org unit ID provided',
                json: data
            });
        }
    //}
});

router.get('/resetOu', function(req,res){
    sessions.resetOuAction(req, function(data){
        res.send({
            result: 'success',
            err: '',
            json: data
        });
    });
});

router.delete('/', function(req,res){
    sessions.deleteAction(req, function(data){
        res.send({
            result: 'success',
            err: '',
            json: data
        });
    });
});

module.exports = router;
