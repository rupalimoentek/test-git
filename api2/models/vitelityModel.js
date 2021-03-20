/**
 * Created by davey on 6/12/15.
 */
'use strict';

var appModel = require('./appModel'),
    f = require('../functions/functions'),
    http = require('http'),
	parseString = require('xml2js').parseString,
	async = require('async'),
	_ = require('underscore'),
	envVar = process.env.NODE_ENV,
	yaml = require("js-yaml"),
	fs = require("fs"),
	e = yaml.load(fs.readFileSync("config/vitelity.yml"));

var options = {
	hostname:'api.vitelity.net',
	port    :80,
	method  :'GET'
};

var vendor_id = 2;              // this will identify the vendor the phone number came from
var vendor_name = 'vitelity';   // this is the name of the vendor from which the number came from
var vitelity = {
	// sends all requests to third party end-point and parses the result to return or error if one occurred
	sendReq: function(options, cb) {
		http.get(options, function (res) {
			var data = '';
			var ret = [];

			res.on('data', function (chunk) {
				data += chunk;
			});

			res.on('end', function () {
				parseString(data, function (err, result) {
					if (err) { cb('Failed to parse response'); return; }

					if (result.content.status !== undefined) {
						if (result.content.status[0] !== 'ok') {
							var extra = '';
							if (result.content.error !== undefined) { extra = result.content.error[0]; }
							cb(result.content.status[0] + ' ' + extra); return;
						} else {
							cb(null, result); return;
						}
					} else if (result.content.numbers !== undefined) {
						if (result.content.numbers[0].response[0] === 'unavailable') {
							cb("unavailable"); return;
						}
					}
					console.log('sending result');
					cb(null, result);
				});
			});
		}).on('error', function (e) {
			cb('Received error making request: ' + e.message);
		}).end();
	},
	rcState: function(rc, state, cb) {
		state = state.toUpperCase();
		rc = decodeURIComponent(rc);
		rc = rc.toUpperCase();

		options.path = '/api.php?login=cont_actpoint&pass=Power1664&cmd=listlocal&xml=yes&state=' + state + '&ratecenter=' + rc;
		console.log(options.path);

		vitelity.sendReq(options, function(err, result) {
			if (err) { return cb(err); }
			//console.log('Got result', result);
			var ret = [];

			_.each(result.content.numbers[0], function (block) {
				_.each(block, function (did) {
					var number = {
						'number':did.number[0],
						'phone_number_id':did.number[0],
						'pretty_number':f.prettyPhoneNumber(did.number[0]),
						'vendor_id':vendor_id,
						'source':vendor_name
					};
					ret.push(number);
				});
			});
			cb(null, ret);
		});
	},
	npa: function(npa, cb) {
		options.path = '/api.php?login=cont_actpoint&pass=Power1664&cmd=listnpa&xml=yes&npa=' + npa;

		vitelity.sendreq(options, function(err, result) {
			if (err) { cb(err); return; }

			var ret = [];
			_.each(result.content.numbers[0], function (block) {
				_.each(block, function (did) {
					var number = {
						'number':did.number[0],
						'phone_number_id':did.number[0],
						'pretty_number':f.prettyPhoneNumber(did.number[0]),
						'vendor_id': vendor_id,
						'source':vendor_name
					};
					ret.push(number);
				});
			});
			cb(null, ret);
		});
	},
	npanxx: function(npanxx, cb) {
		options.path = '/api.php?login=cont_actpoint&pass=Power1664&cmd=listnpanxx&xml=yes&npanxx=' + npanxx;

		vitelity.sendreq(options, function(err, result) {
			if (err) { cb(err); return; }

			var ret = [];
			_.each(result.content.numbers[0], function (block) {
				_.each(block, function (did) {
					var number = {
						'number':did.number[0],
						'phone_number_id':did.number[0],
						'pretty_number':f.prettyPhoneNumber(did.number[0]),
						'vendor_id': vendor_id,
						'source':vendor_name
					};
					ret.push(number);
				});
			});
			cb(null, ret);
		});
	},
	// used for ordering phone numbers (dids must be an array - containing any amount of phone numbers)
	orderNumber: function(dids, type, cb) {
		if (dids.length < 1) { cb('Invalid number of entries or format for ordering numbers'); return; }
		var ret = {};
		var skipEnvs = ['local','development'];
		async.each(dids, function(did, callback) {
			ret[did] = {};
			////////////////////////
			//For development, skip actually ordering the number
			if (skipEnvs.indexOf(envVar) > -1){
				console.log('****Vitality won\'t be ordered.  In '+envVar+' enviroment.****');
				if (type === 'selectedNumber') {
					insertNumber(did, function(err, id){
						ret[did].id = id;
						callback(err, ret);
					});
				} else {
					callback(null, ret);
				}
			} else {
				if(e[envVar].routesip === "")
					options.path = '/api.php?&login=cont_actpoint&pass=Power1664&cmd=getlocaldid&xml=yes&type=perminute&did=' + did;
				else
					options.path = '/api.php?routesip='+e[envVar].routesip+'&login=cont_actpoint&pass=Power1664&cmd=getlocaldid&xml=yes&type=perminute&did=' + did;

				vitelity.sendReq(options, function(err, result) {
					if (err) {
						//console.log('error: ' + err);
						ret[did] = err;
						callback(err);
					} else if (result.content.status[0] !== 'ok') {
						//console.log(result.content.status[0] + ' - ' + result.content.error[0]);
						ret[did] = result.content.status[0] + ' - ' + result.content.error[0];
						callback(err);
					} else {
						//console.log(result.content.response[0]);
						ret[did].result = result.content.response[0];
						if (type === 'selectedNumber') {
							insertNumber(did, function(err, id) {
								if (err) { cb('Failed to insert phone number ' + did + ' to database'); return; }
								ret[did].id = id;
								callback(err, ret);
							});
						} else {
							callback(err, ret);
						}
					}
				});
			}
		}, function(err) {
			if (err) { return cb(err); }
			cb(null, ret);
		});
	},
	removeNumber: function(dids, cb) {
		if (dids.length < 1) { return cb('Invalid number of entries or format for ordering numbers'); }
		var ret = {};

		async.each(dids, function(did, callback) {
			options.path = '/api.php?login=cont_actpoint&pass=Power1664&cmd=removedid&xml=yes&type=perminute&did=' + did;

			vitelity.sendReq(options, function(err, result) {
				if (err) {
					//console.log('error: ' + err);
					ret[did] = err;
				} else if (result.content.status[0] !== 'ok') {
					//console.log(result.content.status[0] + ' - ' + result.content.error[0]);
					ret[did] = result.content.status[0] + ' - ' + result.content.error[0];
				} else {
					//console.log(result.content.response[0]);
					ret[did] = result.content.response[0];
					var num = did.toString();
					// add number into the DB
					var qry = "DELETE FROM phone_number WHERE number=" + did + " AND vendor_id=2";
					appModel.ctPool.query(qry, function(err) {
						if (err) { return cb('Failed to delete phone number ' + did + ' from database'); }
					});
				}
				callback(null);
			});
		}, function(err) {
			if (err) { return cb(err); }
			cb(null, ret);
		});
	}
};

function insertNumber(did, callback){
	var num = did.toString();
	// add number into the DB
	var insertData = {
		table : 'phone_number',
		values: {
			'number'                : did,
			'vendor_id'             : vendor_id,
			'phone_number_status'   : 'provisioned',
			'npa'                   : num.substr(0, 3),
			'npanxx'                : num.substr(0, 6)
		}
	};
	appModel.ctPool.insert(insertData, function(err, result) {
		if (err) { return callback('Failed to insert phone number ' + did + ' to database'); }
		callback(null, result.insertId);
	});
}

module.exports = vitelity;