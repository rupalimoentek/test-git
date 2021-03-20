var express = require('express'),
    app     = express(),
	mongo = require('mongodb'),
	monk = require('monk');
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

 	collection = db.get('activedigests');
	collection.find({},{},function(e,docs){
			res.json(docs);
		});
});
router.get('/:id', function(req,res){
	collection = db.get('activedigests');
	var searchstring = {"ouid":parseInt(req.params.id)};
	console.log("searchstring is :"+JSON.stringify(searchstring));
	collection.find(searchstring,{},function(e,docs){
	console.error(e);
			console.log("we are done with the data");
			res.json(docs);

		});

});
router.post('/', function(req,res){

 	var searchstring = {};
    var collection = db.get('activedigests');
	// req.body = JSON.parse(req.body);
	 console.log("req.body:" + JSON.stringify(req.body));
	 // see if the ouid is already there
	 var count = 0;
	 searchstring= {"ouid":req.body.ouid};

	collection.find(searchstring,{},function(e,docs){
	//console.log(e);
			//res.json(docs);
			if(docs.length > 0)
			{
				console.log("updating req.body.ouid of:" + req.body.ouid);
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
				console.log("inserting req.body.ouid of:" + req.body.ouid);
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



});
router.post('/:id', function(req,res){

 	var searchstring = {};
    var collection = db.get('activedigests');
	// req.body = JSON.parse(req.body);
	 console.log("req.body:" + JSON.stringify(req.body));
	 // see if the ouid is already there
	 var count = 0;
	 searchstring= {"ouid":req.body.ouid};

	collection.find(searchstring,{},function(e,docs){
	//console.log(e);
			//res.json(docs);
			if(docs.length > 0)
			{
				console.log("updating req.body.ouid of:" + req.body.ouid);
				collection.remove(searchstring, function (err, doc) {
				if (err) {
					// If it failed, return error
					console.log("There was a problem deleting the information to the database.");
				}
				else
				{
					console.log("successfully UPDATED/deleted");
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
			}
			else
			{
				console.log("inserting req.body.ouid of:" + req.body.ouid);
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


});
router.delete('/:id', function(req,res){
 var searchstring= {"ouid":parseInt(req.params.id)};
	var collection = db.get('activedigests');

	console.log("searchstring is :"+JSON.stringify(searchstring));
	collection.find(searchstring,{},function(e,docs){
	console.log(JSON.stringify(docs));
			//res.json(docs);
			if(docs.length > 0)
			{
				console.log("deleting req.body.ouid of:" + req.params.id);
				collection.remove(searchstring, function (err, doc) {
				if (err) {
					// If it failed, return error
					console.error("There was a problem deleting the information to the database.");
				}
				else
				{

					logger.log('info',"successfully DELETED");

					console.log("successfully DELETED");

				}
				});
			}
			});
			res.end();
});
module.exports = router;