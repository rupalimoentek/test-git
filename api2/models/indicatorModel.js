var mysql   = require('mysql'),
	appModel = require('./appModel'),
	yaml = require("js-yaml"),
	f = require('../functions/functions.js'),
	fs = require("fs"),
	e = yaml.load(fs.readFileSync("config/database.yml")),
	envVar = process.env.NODE_ENV,
	async = require('async'),
	table = 'indicator',
	querystring = require('querystring'),
	http = require('http'),
	cm = yaml.load(fs.readFileSync("config/callMiner.yml"));

var indicator = {
	updateIndicators: function(res){
		getToken(function(token) {
			//console.log(token);
			token = token.replace(/"/g, '');
			//get most recent indicator score result to check latest list of indicators
			var qry = "SELECT recording_file FROM call_detail WHERE call_mine_status IN('mined') ORDER BY call_id DESC LIMIT 1";
			appModel.ctPool.query(qry, function(err, data){
				//console.log(data);
				getScores(token, data[0].recording_file, function(callScores) {
					//console.log(callScores[0].Scores);
					async.each(callScores[0].Scores, function( indicator, callback) {
						var indNameParts = indicator.ScoreName.split('|');
						var indId = indNameParts[0];
						//Make sure we only import indicators that have an integer as the first pipe separated value.
						if(indId%1 === 0 ) {
							var qry2 = "SELECT * FROM indicator WHERE indicator_id = "+indId;
							appModel.ctPool.query(qry2, function(err, data2){
								if(err) callback(err);
								else {
									var indName = indNameParts[3];
									var indStatus = indNameParts[4];
									var indStatusInsertValue = false;
									if(indStatus == 'A') indStatusInsertValue = true;
									if(data2.length > 0) {
										var upQry = "UPDATE indicator SET indicator_name = '"+indName+"', indicator_active = '"+indStatusInsertValue+"' WHERE indicator_id = "+indId;
										appModel.ctPool.query(upQry, function(err, data3){
											callback(err);
										});
									}
									else { //indicator does not yet exist
										var insQry = "INSERT INTO indicator (indicator_id, indicator_name, indicator_active) VALUES("+indId+",'"+indName+"',"+indStatusInsertValue+")";
										//console.log(insQry);
										appModel.ctPool.query(insQry, function(err, data3){
											callback(err);
										});
									}
								}
							});
						}
						else {
							callback();
						}

					}, function(err) {
						res(err,'Done updating the indicator table.');
					});

				});
			});

		});


	}
};

function getScores(token, fileNames, callback) {
	console.log(fileNames);
	var options = {
	  hostname: cm[envVar].host,
	  port: 8080,
	  path: '/ral/searchbyclientids?clientIds='+fileNames,
	  method: 'GET',
	  headers: {
		'Content-Type': 'text/plain',
		'Authorization' : 'JWT '+token
	  }
	};
	//console.log(options);
	var req = http.request(options, function(res) {
	  //console.log('STATUS: ' + res.statusCode);
	  //console.log('HEADERS: ' + JSON.stringify(res.headers));
	  res.setEncoding('utf8');
	  var response = '';
	  res.on('data', function (chunk) {
		//console.log('BODY: ' + chunk);
		response += chunk;
	  });
	  res.on('end', function(data) {
			response = JSON.parse(response);
			//console.log(response);
			callback(response);
		});
	});

	// write data to request body
	//req.write(postData);
	req.on('error', function(e) {
	  console.log('problem with request: ' + e.message);
	});
	req.end();
}

function getToken(callback) {
	//get token
	var postData = querystring.stringify({'apiKey' : cm[envVar].shared_key,'username': cm[envVar].username,'password': cm[envVar].password});
	//console.log(postData);

	var options = {
	  hostname: cm[envVar].host,
	  port: 8080,
	  path: '/security/getToken',
	  method: 'POST',
	  headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
		'Content-Length': postData.length
	  }
	};
	//console.log(options);
	var req = http.request(options, function(res) {
	  //console.log('STATUS: ' + res.statusCode);
	  //console.log('HEADERS: ' + JSON.stringify(res.headers));
	  res.setEncoding('utf8');
	  res.on('data', function (chunk) {
		//console.log('BODY: ' + chunk);

		callback(chunk);
	  });
	});
	// write data to request body
	req.write(postData);
	req.on('error', function(e) {
	  console.log('problem with request: ' + e.message);
	});
	req.end();
}


module.exports = indicator;