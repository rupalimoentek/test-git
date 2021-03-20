var express = require('express'),
    app     = express(),
	mongo = require('mongodb'),
	monk = require('monk'),
	yaml = require("js-yaml");

var fs = require("fs");
//var logger = require('/var/www/restapi/logger');
var e = yaml.load(fs.readFileSync("config/mongodb.yml"));
var envVar = process.env.NODE_ENV;
	
var router = express.Router();
//var config = require('../config');
var db;
if (envVar == 'production')
	db = monk(e[envVar].username + ":" + e[envVar].password + "@" + e[envVar].host + ":" + e[envVar].port + "/" + e[envVar].db_name);
else
	db = monk(e[envVar].host + ":" + e[envVar].port + "/" + e[envVar].db_name);

// Add headers
router.use(function (req, res, next) {

    // Website you wish to allow to connect
    //res.setHeader('Access-Control-Allow-Origin', req.headers.origin);

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
router.get('/', function(req,res){

 	collection = db.get('dailystoresummary'+ req.params.id);
	//collection.find({date:{$gt:lastweeksearchDate,$lte:todaysearchDate}},{},function(e,docs,done){
	collection.find({},{},function(e,docs){
			res.json(docs);
		});
});
router.get('/:id', function(req,res){
	collection = db.get('dailystoresummary'+ req.params.id);
	var searchstring = {};
	console.log(req.query.startdate);
	if(req.query.startdate && req.query.enddate)
	{
		console.log(req.query.enddate);
		searchstring= {"date":{"$gte":req.query.startdate ,"$lt":req.query.enddate }};
	}
	console.log("searchstring is :"+JSON.stringify(searchstring));
	//collection.find({date:{$gt:lastweeksearchDate,$lte:todaysearchDate}},{},function(e,docs,done){
	collection.find(searchstring,{},function(e,docs){
	console.error(e);
			console.log("we are done with the data");
			res.json(docs);
			
		});
	
	//db.close();
});
router.post('/:id', function(req,res){

     var collection = db.get('dailystoresummary' + req.params.id);
	// req.body = JSON.parse(req.body);
	 console.log("req.body:" + JSON.stringify(req.body));
	     // Submit to the DB
	 var count = 0;
	 searchstring= {"date":req.body.date};

	collection.find(searchstring,{},function(e,docs){
	//console.log(e);
			//res.json(docs);
			if(docs.length > 0)
			{
				console.log("updating req.body.ouid of:" + req.params.id);
				collection.remove(searchstring, function (err, doc) {
				if (err) {
					// If it failed, return error
					console.error("There was a problem deleting the information to the database.");
				}
				else
				{
					console.log("successfully deleted");
					collection.insert(req.body, function (err, doc) {
				if (err) {
					// If it failed, return error
					console.log("There was a problem adding the information to the database.");
				}
				else
				{
					console.log("successfully added data to database");
					res.end();
				}
				});
				}
				});			
			}
			else
			{
				//console.log("inserting req.body.ouid of:" + req.body.ouid);
				collection.insert(req.body, function (err, doc) {
				if (err) {
					// If it failed, return error
					console.error("There was a problem adding the information to the database.");
				}
				else
				{
					console.log("successfully added data to database");
					res.end();
				}
				});
			}
			
		});


// // stsrt
 	// collection = db.get('dailystoresummary'+ req.params.id);
	// //collection.find({date:{$gt:lastweeksearchDate,$lte:todaysearchDate}},{},function(e,docs,done){
	// collection.find({},{},function(e,docs){
			// res.json(docs);
		// });
//
 //	
//// end

});
module.exports = router;
