var express = require('express'),
    phoneNumbers = require('../controllers/phoneNumberController'),
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

router.get('/zip/:zip', function(req,res){
    phoneNumbers.zipAction(req.params.zip, function(data){
        res.send({
            result: 'success',
            err: '',
            json: data
        });
    });
});

router.get('/npa/:npa', function(req,res){
    phoneNumbers.npaAction(req.params.npa, function(data){
        res.send({
            result: 'success',
            err: '',
            json: data
        });
    });
});

router.get('/number/:number', function(req,res){
    phoneNumbers.numberAction(req.params.number, function(data){
        res.send({
            result: 'success',
            err: '',
            json: data
        });
    });
});

router.get('/city/:city/state/:state', function(req,res){
    phoneNumbers.cityStateAction(req.params.city, req.params.state, function(data){
        res.send({
            result: 'success',
            err: '',
            json: data
        });
    });
});

router.get('/city/:city/state/:state/npa/:npa', function(req, res) {
    phoneNumbers.cityStateNpaAction(req.params.city, req.params.state, req.params.npa, req.is_migrated, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.get('/reserved/:ouid', function(req, res) {
    console.log('@@@@@@@@@ Getting reserved numbers for OUID:', req.params.ouid);
    phoneNumbers.reservedNumbers(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

module.exports = router;