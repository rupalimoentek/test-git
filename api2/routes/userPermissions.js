
var express = require('express'),
userPermission = require('../controllers/userPermissionController'),
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

router.get('/reportslist/ouid/:ouid', function(req,res){
    userPermission.getReportsByOuid(req, function(err,data){
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
    });
});

router.get('/oulist/ouid/:ouid/topid/:topid/userOULevel/:userOULevel/currentOULevel/:currentOULevel', function(req,res){
    userPermission.getOusByOuid(req, function(err,data){
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
    });
});

router.get('/userOulist/topouid/:topouid/ouid/:ouid/uid/:uid', function(req,res){
    userPermission.getOusByUserid(req, function(err,data){
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
    });
});

router.get('/ouid/:ouid', function(req,res){
    userPermission.getDataAppend(req, function(err,data){
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
    });
});

router.post('/', function(req,res){
    userPermission.saveUserPermissions(req, function(err,data){
        res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
        //res.send(data);
    });
});

router.delete('/', function(req, res) {
	userPermission.removeUserPermissions(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.get('/userid/:userid', function(req,res){
    userPermission.getOuListByUserId(req, function(err, data){
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
    });
});

router.post('/moveuser', function(req,res){
    userPermission.moveUser(req, function(err,data){
        res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
    });
});

module.exports = router;
