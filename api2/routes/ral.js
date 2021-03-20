var express = require('express'),
    //ral = require('../controllers/ralController'),
    router = express.Router(),
    t = require('../lib/tokenizer'),
	appModel = require('../models/appModel'),
	yaml = require("js-yaml"),
	f = require('../functions/functions.js'),
	fs = require("fs"),
	e = yaml.load(fs.readFileSync("config/database.yml")),
	envVar = process.env.NODE_ENV,
	async = require('async');

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

router.get('/searchbyclientids', function(req,res){
    async.parallel([
		//get list of indicators
		function(callback) {
			var query = "SELECT * FROM indicator";
			appModel.ctPool.query(query, function(err, data){
				callback(err, data);
			});
		},
		//fetch call detail records
		function(callback) {
			var files = req.query.clientIds.split(",");
			files = "'" + files.join("','") + "'";
			var query = "SELECT call_id FROM call_detail where recording_file IN("+files+")";
			appModel.ctPool.query(query, function(err, data){
				if(err) console.log(err);
				callback(err, data);
			});
		}
	], 
	function(err, results) {
		//loop over call detail records and indicators to return scores
		//console.log(results[1]);
		//loop over calls
		var callScores = [];
		async.each(results[1], function(call, cb2) {
			var callScore = {
				"Measures": {"UDF_num_03" : call.call_id},
				"Scores": []
			};
			//callScore['Measures'] = [];
			//callScore['Measures']['UDF_num_03'] = call.call_id;
			//console.log(callScore);
			//loop over indicator scores
			async.each(results[0], function(indicator, cb3) {
				//console.log(indicator);
				var score = {
					"CallId":call.call_id, //this is actually the CM unique call key, but we don't use it so we can just pouplate it with our call id
					"ScoreId":indicator.indicator_id, //again a CM id we don't use. Populating with indicator id
					"ScoreName": indicator.indicator_id+"|1|Blah|"+indicator.indicator_name+"|A", // ex: "38|1|Etiquette|Phone Etiquette (c)|A",
					"Weight": Math.floor((Math.random() * 100) + 0)
				};
				callScore.Scores.push(score);
				cb3();
			},
			function() {
				callScores.push(callScore);
				cb2();
			});
			
		},
		function(err) {
			//console.log(callScores);
			res.send(callScores);
		});
	});
});



module.exports = router;