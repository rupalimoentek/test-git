var express = require('express'),
    orgUnit = require('../controllers/orgUnitController'),
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

// ======= For Export functionality ===============

router.get('/groups/ouId/:ouid/userAccess/:userAccess', function(req, res){
    orgUnit.getGroupsReport(req, function(data) {
        res.send(data);
    });
});

router.post('/', function(req,res){
    orgUnit.postAction(req, function(data){
        res.send(data);
    });
});

router.get('/all', function(req,res){
    orgUnit.getAllAction(req, function(data){
        res.send(data);
    });
});

router.get('/getGroupsByAccessLevel', function(req, res) {
    orgUnit.getGroupsByAccessLevel(req, function(data) {
        res.send(data);
    });
});

router.get('/', function(req,res){
    orgUnit.getAction(req, function(data){
        res.send({
            result: 'success',
            err: '',
            json: data
        });
    });
});

router.get('/:id', function(req,res) {
    orgUnit.getAction(req, function(data) {
      res.send({
          result: 'success',
          err: '',
          json: data
      });
    });
});

router.get('/info/:id', function(req, res) {
    orgUnit.getInfoAction(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

// should not be used on a top level ID since it's not recursive
router.get('/linked/:id', function(req,res){
    // get quantity of users, campaigns, call flows

    orgUnit.getSelfAndChildrenMeta(req.params.id, function(err, data){
        res.send({
            result: (err ? "error": "success"),
            err:    err,
            json:   data
        });
    });
});
router.delete('/customsources', function(req, res){ // check the way this is written?
    console.log("router. delete reqreq.body=",req.body)
    orgUnit.deleteCustomSource(req, function(data){
        return res.send(data)
       
    });
});


// should not be used on a top level ID since it's not recursive
router.get('/level/:id', function(req, res){
    // get quantity of users, campaigns, call flows
    orgUnit.ouLevel(req, function(err, data){
        console.log("this is teh dataz");
        console.log(data);
        res.send({
            result: (err ? "error": "success"),
            err:    err,
            json:   data
        });
    });
});

router.put('/', function(req,res){
    orgUnit.putAction(req, function(err,data){
        res.send({
            result: (err ? "error": "success"),
            err: err,
            json: data
        });
    });
});

router.delete('/:id/:parent_ou', function(req,res){
    orgUnit.deleteAction(req, function(err, data){
        res.send({
            result: (err ? "error": "success"),
            err:    err,
            json:   data
        });
    });
});

router.get('/userList/:id', function(req, res) {
	orgUnit.userListAction(req.params.id, function(err, data) {
		res.send({
            result: (err ? "error": "success"),
            err:    err,
            json:   data
        });
	});
});

//for testing models
router.get("/blah/blah", function(req, res) {
    var campaignModel = require("../models/campaignModel");

    //var dataStructureSetStatusRequires = {
    //    campaign: {
    //        id: 494,
    //        status:'deleted'
    //    }
    //};
    //
    //
    //campaignModel.setStatus(dataStructureSetStatusRequires, function (err, blah) {
    //    res.json({err:err, data:blah});
    //});


    campaignModel.getCampaignIdsByOrgUnitIds([1, 32, 9, 10]).then(function (errAndResult) {
        console.log("yayyyy blah blah");
        return res.send(errAndResult)
    });
});


module.exports = router;