
'use strict';

var appModel = require('./appModel'),
    f = require('../functions/functions'),
    http = require('http'),
	parseString = require('xml2js').parseString,
	async = require('async'),
	_ = require('underscore');

var options = {
	hostname:'www.localcallingguide.com',
	port    :80,
	method  :'GET'
};


var localcallingguide = {
	// sends all requests to third party end-point and parses the result to return or error if one occurred
	sendReq: function(options, cb) {
		http.get(options, function (res) {
			var data = '';
			var ret = [];

			res.on('data', function (chunk) {
				data += chunk;
				//console.log(data);
			});

			res.on('end', function () {
				//console.log('RAW RESPONSE');
				//console.log(data);

				parseString(data, function (err, result) {
					if (err) { cb('Failed to parse response'); return; }
					// console.log('RESULT:');
					// console.log(result);
					cb(null,result);

					// if (result.content.status !== undefined) {
					// 	if (result.content.status[0] !== 'ok') {
					// 		var extra = '';
					// 		if (result.content.error !== undefined) { extra = result.content.error[0]; }
					// 		cb(result.content.status[0] + ' ' + extra); return;
					// 	} else {
					// 		cb(null, result); return;
					// 	}
					// } else if (result.content.numbers !== undefined) {
					// 	if (result.content.numbers[0].response[0] === 'unavailable') {
					// 		cb("unavailable"); return;
					// 	}
					// }
					// console.log('sending result');
					// cb(null, result);
				});
			});
		}).on('error', function (e) {
			cb('Received error making request: ' + e.message);
		}).end();
	},
	rate_center: function(npa,nxx,cb){
		options.path = '/xmlprefix.php?npa='+ npa + '&nxx='+ nxx;
		localcallingguide.sendReq(options, function(err, result){
			if (err) { cb(err); return; }
			var rc = '';
			_.each(result.root.prefixdata, function(block){
				rc = block.rc[0];
			});
			cb(err,rc);
		});
	},
	nparc: function(npa,nxx,cb) {
		//http://www.localcallingguide.com/xmllocalprefix.php?npa=435&nxx=654&dir=2
		options.path = '/xmllocalprefix.php?npa='+ npa + '&nxx='+ nxx + '&dir=2';
		//options.path = '/xmllocalprefix.php?npa=435&nxx=654&dir=2';
		//console.log(JSON.stringify(options));
		localcallingguide.sendReq(options, function(err, result) {
			if (err) { cb(err); return; }

			var ret = [];
			//console.log(result.root["lca-data"][0]['prefix'][0]);
			_.each(result.root["lca-data"][0]['prefix'], function (block) {
			//	console.log("HERE: " + block.rc);
					var number = {
						'npanxx':block.npa[0] + block.nxx[0],
						'rc':block.rc[0]

					};
					ret.push(number);
				});
			//console.log(JSON.stringify(ret));
			cb( ret);
		});
	},
	nparcstate: function(npa,nxx,cb) {
	// JAW CT-7416a: added support for required items for bandwidth to include rc and state when needed
	//
		//http://www.localcallingguide.com/xmllocalprefix.php?npa=435&nxx=654&dir=2
		options.path = '/xmllocalprefix.php?npa='+ npa + '&nxx='+ nxx + '&dir=2';
		//options.path = '/xmllocalprefix.php?npa=435&nxx=654&dir=2';
		//console.log(JSON.stringify(options));
		localcallingguide.sendReq(options, function(err, result) {
			if (err) { cb(err); return; }

			var ret = [];
			//console.log(result.root["lca-data"][0]['prefix'][0]);
			_.each(result.root["lca-data"][0]['prefix'], function (block) {
			//	console.log("HERE: " + block.rc);
					var number = {
						'npanxx':block.npa[0] + block.nxx[0],
						'rc':block.rc[0],
						'state':block.region[0],
						'region':block.region[0]
					};
					ret.push(number);
				});
			//console.log(JSON.stringify(ret));
			cb( null,ret);
		});		
	},
	nparcstatelata: function(npa,nxx,cb) {
	// JAW CT-7416a: added support for required items for bandwidth to include rc, state and lata when needed
	//
		//http://www.localcallingguide.com/xmllocalprefix.php?npa=435&nxx=654
		options.path = '/xmlprefix.php?npa='+ npa + '&nxx='+ nxx;
		//options.path = '/xmlprefix.php?npa=435&nxx=654';
		//console.log(JSON.stringify(options));
		localcallingguide.sendReq(options, function(err, result) {
			if (err) { cb(err); return; }

			var ret = [];
			console.log(result.root["prefixdata"]);
			_.each(result.root['prefixdata'], function (block) {
			//	console.log("HERE: " + block.rc);
					var xnumber = {
						'npanxx':block.npa[0] + block.nxx[0],
						'npa':block.npa[0],
						'nxx':block.nxx[0],
						'rc':block.rc[0],
						'lata':block.lata[0],
						'state':block.region[0],
						'region':block.region[0]
					};
					ret.push(xnumber);
				});
			console.log(JSON.stringify(ret));
			cb( null,ret);
		});		
	}	

};

module.exports = localcallingguide;
