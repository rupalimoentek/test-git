var express = require('express'),
distributionList = require('../controllers/distributionListController'),
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

router.get('/list/:ouid', function(req,res){
	distributionList.getList(req, function(data){
		res.send(data);
	});
});

router.get('/selectlist', function(req ,res) {
	distributionList.selectList(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.get('/listData/:id', function(req,res){
    distributionList.getDistributionListData(req, function(data){
        res.send(data);
    });
});

router.post('/', function(req,res){
	distributionList.createDistributionList(req, function(data){
		res.send(data);
	});
});

router.put('/', function(req,res){
	distributionList.updateDistributionList(req, function(data){
		res.send(data);
	});
});

router.get('/campaignAndAssignedUser/:ouid', function(req,res){
    distributionList.campaignAndAssignedUser(req, function(data){
        res.send(data);
    });
});

router.get('/campaignUsers', function(req,res){
    distributionList.campaignUsers(req, function(data){
        res.send(data);
    });
});


router.delete('/:id', function(req,res){
	distributionList.deleteDistributionList(req, function(data){
		res.send(data);
	});
});

module.exports = router;