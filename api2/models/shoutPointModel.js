'use strict';
/**
 * shoutpointModel.js
 * Created by ddapello on 2/24/16.
 */

var appModel    = require('./appModel'),
    f           = require('../functions/functions'),
    https       = require('https'),
	xml2js      = require('xml2js'),
	async       = require('async'),
	_           = require('underscore'),
	envVar      = process.env.NODE_ENV,
	yaml        = require("js-yaml"),
	fs          = require("fs"),
	e           = yaml.load(fs.readFileSync("config/shoutpoint.yml")),
	config           = yaml.load(fs.readFileSync("config/config.yml")),
	rabbit = yaml.load(fs.readFileSync("./config/rabbit.yml")),
	ctTransactionModel = require('./ctTransactionModel'),
	url = 'amqp://'+rabbit[envVar].user+':'+rabbit[envVar].password+'@'+rabbit[envVar].host+':'+rabbit[envVar].port+'/'+rabbit[envVar].vhost,
	toll_frees = require('../config/toll_free.json');


var options = {
	hostname: e[envVar].hostname,
	path : '',
	method  :'GET',
	headers :{
        'x-api-key': e[envVar].Key 
    }
};
var path = e[envVar].path;
var vendor_id = 10001;              // this will identify the vendor the phone number came from
var vendor_name = 'shoutpoint';   // this is the name of the vendor from which the number came from

var shoutpoint = {
	// sends all requests to third party end-point and parses the result to return or error if one occurred
	sendGet: function(options, cb) {
		options.method = 'GET';
       
		//delete options.headers;
		https.get(options, function (res) {
			var data = '';
			var ret = [];

			res.on('data', function (chunk) {
				data += chunk;
			});

			res.on('end', function () {
				JSON.stringify(data, function (err, result) {
					if (err) { return cb('Failed to parse response'); }
					if ((result !== null && result.phone_numbers !== undefined) ) {
						return cb(result.phone_numbers);
					}
					if (result !== null && result.error !== undefined ) {
						return cb(result.error);
					}
					cb(null, result);
				});
			});
		}).on('error', function (e) {
			cb('Received error making request: ' + e.message);
		}).end();
	},
	sendPost: function(options, postData, cb) {
		options.method = 'POST';
		options.headers = {
			'Content-Type': 'application/json',
			//'Content-Length':postData.length,
			'x-api-key': e[envVar].Key 
		    
		};

		var req = https.request(options, function (res) {
			var data = '';
			var ret = [];

			res.on('data', function (chunk) {
				data += chunk;
			});
			res.on('end', function () {
				JSON.stringify(data, function (err, result) {
					if (err) { cb('Failed to parse response',data); return; }
					if ( result.error !== undefined) {
						return cb(result.error);
					}
					cb(null, result);
				});

			});
			req.on('error', function (e) {
				cb('Received error making request: ' + e.message);
			});
		});
		postData = JSON.stringify(postData);
		
		req.write(postData);
		req.end();
	},
	sendPut: function(options, postData, cb) {
		options.method = 'PUT';
		options.headers = {
			'Content-Type': 'application/json',
			//'Content-Length':postData.length,
			'x-api-key': e[envVar].Key 
		    
		};

		var req = https.request(options, function (res) {
			var data = '';
			var ret = [];

			res.on('data', function (chunk) {
				data += chunk;
			});
			res.on('end', function () {
				JSON.stringify(data, function (err, result) {
					if (err) { cb('Failed to parse response',data); return; }
					if ( result.error !== undefined) {
						return cb(result.error);
					}
					cb(null, result);
				});

			});
			req.on('error', function (e) {
				cb('Received error making request: ' + e.message);
			});
		});
		postData = JSON.stringify(postData);
		
		req.write(postData);
		req.end();
	},
	rcState: function(rc, state, cb) {
		state = state.toUpperCase();
		rc = decodeURIComponent(rc);
		rc = rc.toUpperCase();

        
		options.path = path + 'PhoneNumbers/Available?capabilities=voice&search_by=rate-center&state&search_on=' + encodeURIComponent(rc) + ',' + state +"&max_results=200";
		shoutpoint.sendGet(options, function(err, result) {
			if (err) { return cb(err); }
			var result = JSON.parse(result);
			if (result == null || result.phone_numbers == undefined ) { return cb('Failed on call to vendor'); }
			if (result.phone_numbers.length < 1) { return cb('No results returned.'); }
			var ret = [];
			
			async.eachSeries(result.phone_numbers, function(row, cb2) {
				var numberActivationTime = new Date(row.estimated_active_date);
					numberActivationTime = moment(numberActivationTime).format("YYYY-MM-DD HH:mm:ss");
				var	currentTime = moment(new Date).format("YYYY-MM-DD HH:mm:ss");

				var number = {
					'number':row.no.slice(2,12),
					'number_id':row.no.slice(2,12),
					'pretty_number':row.formatted,
					'vendor_id': vendor_id,
					'source':vendor_name
				};
				if(numberActivationTime <= currentTime)
					ret.push(number);
				else
					console.log(number, "  Number is Not yet activated");

				cb2(null);

			}, function(err) {
				if (err) { return cb(err); }
				cb(null, ret);
			});
		});
	},
	npa: function(npa, cb) {
		options.path = path + 'PhoneNumbers/Available?capabilities=voice&search_by=prefixes&search_on=' + npa;

		shoutpoint.sendGet(options, function(err, result) {
			if (err) { return cb(err); }
			var result = JSON.parse(result);
			if (result == null || result.phone_numbers == undefined ) { return cb('Failed on call to vendor'); }
			if (result.phone_numbers.length < 1) { return cb('No results returned.'); }
			var ret = [];

			async.eachSeries(result.phone_numbers, function(row, cb2) {
					var number = {
						'number':row.no,
						'number_id':row.no,
						'pretty_number':row.no,
						'vendor_id': vendor_id,
						'source':vendor_name
					
					};
					ret.push(number);
					cb2(null);

			}, function(err) {
				if (err) { return cb(err); }
				cb(null, ret);
			});
		});
	},
	npanxx: function(npanxx, cb) {
		options.path = path + 'PhoneNumbers/Available?capabilities=voice&search_by=region&search_on=' + npanxx ;
		
		shoutpoint.sendGet(options, function(err, result) {
			if (err) { return cb(err); }
			var result = JSON.parse(result);
			if (result == null || result.phone_numbers == undefined ) { return cb('Failed on call to vendor'); }
			if (result.phone_numbers.length < 1) { return cb('No results returned.'); }
			var ret = [];
			
			async.eachSeries(result.phone_numbers, function(row, cb2) {
					var number = {
						'number':row.no,
						'number_id':row.no,
						'pretty_number':row.no,
						'vendor_id': vendor_id,
						'source':vendor_name
					
					};
					ret.push(number);
					cb2(null);

			}, function(err) {
				if (err) { return cb(err); }
				cb(null, ret);
			});
		});
	},
	// used for ordering phone numbers (dids must be an array - containing any amount of phone numbers)
	orderNumber: function(dids, ctTrans, isPool, cb) {
		if (dids.length < 1) { cb('Invalid number of entries or format for ordering numbers'); return; }
		options.path = path + 'PhoneNumbers/CallFlows';
		var ret = {};
		var numbers = [];
		_.each(dids, function(ph_number) {
			numbers.push({"no" : "+1" + ph_number});
		});
		var orderobj = {
			'phone_numbers': numbers
		};
		shoutpoint.sendPost(options, orderobj, function(err, result) {
			if (err) { return cb(err); }
			result = JSON.parse(result);
			if(result["phone_numbers"]){
				if(result["phone_numbers"][0]["status"] === "error") {
					return cb("Not able to create route with this number.Please contact customer service at 855-889-3939 for assistance.");
				}
			}
			async.each(numbers, function(phoneNumber, cb1) {
				var did = phoneNumber.no;
				if(!isPool){
					shoutpoint.insertNumber(did, ctTrans, function (err, id) {
						if (err) { return cb1('Failed to insert phone number ' + did + ' to database'); }
						did = did.substring(2,12);
						ret[did] = {result:'ok'};
						ret[did].id = id;
						cb1(null);
					});	
				}else{
					did = did.substring(2,12);
					ret[did] = {result:'ok'};
					cb1(null);
				}
			}, function(err){
				cb(err, ret);
			});
		});
	},	
	insertNumber: function(did,ctTrans, callback) {
			var num = did.toString();
			// add number into the DB	
			// JAW add into to fill out phone_number properly
			var xqry = "SELECT rc, city, state, zipcode, lata FROM npanxx_city WHERE npa='" + num.substr(2,3) + "' AND nxx='" + num.substr(5,3) + "' LIMIT 1";
			ctTrans.select(xqry , function(xerr, xresult){
				console.log(xresult , '----------');
				
				if (xerr) { return callback('Failed to execute rate center lookup for phone number ' + did + ' from table npanxx_city'); }
				if (xresult.length < 1) { 
					xresult[0] = {'rc':null, 'state':null, 'city':null, 'zipcode':null, 'lata':null}
					//return callback('Failed retrieve rate center record for phone number ' + did + ' from table npanxx_city'); 				
				}
				var npa = num.substr(2, 3);
				var did_type = 'did';
				var resporg_id = null;
				if (toll_frees && toll_frees.npa && toll_frees.npa.indexOf(parseInt(npa)) > -1) {
					did_type = 'tfn';
					resporg_id = 'CHP01';
				}
				
				if(xresult[0].rc) xresult[0].rc.replace(/'/g, "''");
				if(xresult[0].city) xresult[0].city.replace(/'/g, "''");
				
				
				
				var insertData = {
					which: 'insert',
					table : 'phone_number',
					values: {
						'number'          : did.slice(2,12),
						'number_str'      : num.slice(2,12),
						'rate_center'     : xresult[0].rc,
						'number_type'     : did_type,
						'number_status'   : 'reserved',
						'npa'             : num.substr(2, 3),
						'nxx'	          : num.substr(5, 3),
						'ocn'             : num.substr(8,4)
					}
				};
				var current_date = f.mysqlTimestamp();
				var tdata = {
					'lata'      : xresult[0].lata,
					'tier':0,
					'resporg_id': resporg_id,
					'state'     : xresult[0].state,
					'city'      : xresult[0].city,
					'zip'       : xresult[0].zipcode,
					'number_updated' : current_date,
					'app_id'	: 'CT'
				};
				ctTrans.queryRet(insertData , function(err , result){
					if (err) { return callback('Failed to insert phone number ' + did + ' to database'); }
					tdata.number_id = result.insertId;
					// JAW CT-7416a:add phone_detail //did, ou_id, pr_id, lata, tier, new_id, callback
					shoutpoint.insertPhoneDetail(did, ctTrans, tdata, result.insertId, function(err) {
						if( err ) { return callback( 'Failed to insert phone_detail ' + did + ' to database' ); }
							callback(null, result.insertId);
						});
				})
			})
	 
		// appModel.ctPool.query( xqry, function(xerr, xresult) {
		// 	appModel.ctPool.insert(insertData, function(err, result) {
		// 		console.log("insertData ******************" , insertData);
		// 		});
	    // });
	},	
	insertPhoneDetail: function(did, ctTrans, data, numid, callback) {
		// add phone_detail into the DB
			var insertData = {
				which: 'insert',
				table : 'phone_detail',
				values: data
			};
			ctTrans.queryRet(insertData , function(err , result){
				if (err) { return callback('Failed to insert phone detail ' + did + ' to database'); }
				callback(null);
			})
		
		// appModel.ctPool.insert(insertData, function(err) {
		// });
	},
	updateCallflowConfig: function(number, ou_id, callback){
		console.log("--------updateCallflowConfig number: "+number)
		var ou_id = parseInt(ou_id);
		var query = "SELECT billing_id FROM org_unit WHERE org_unit_id = " + ou_id ;		
		var billing_id;
		appModel.ctPool.query(query , function(err , result){
			if(err){ return callback(err); }
			billing_id = result[0].billing_id;
			if (number.length < 1) { 
				console.log('Updating Configuration Error : Invalid Number'); 
				return callback('Updating Configuration Error : Invalid Number'); 
			}

			var options = {
				hostname: e[envVar].hostname,
				path : '/v1/CallFlows/Configurations/PhoneNumbers/%2B1'+number,
				method  :'PUT',
				headers :{
					'x-api-key': e[envVar].Key 
				}
			};
			
			var orderObj = {
				'callback':{
					"method": "POST", 
					"url": e[envVar].point_url, 
					"content_type": "application/json" 
				},
				'answer_on_ring':0,
				'custom_data':{
					"org_unit_id": ou_id,
					"billing_id": billing_id
				}
			};

			var cont = true;
			var cntr = 0;
			var postError = true;

			async.whilst(
				function () {return (cont && cntr < 5);},
				function (cb1) {
					cntr++;
					console.log("--------updateCallflowConfig number: "+number+" pass: "+cntr);
					var req = https.request(options, function (res) {
						var body = '';
						res.on('data', function (chunk) {
							body = body + chunk;
						});

						res.on('end',function(){
							var status = res.statusCode;
							console.log("--------updateCallflowConfig number: " + number + " body: " + body);
							console.log("--------updateCallflowConfig number: " + number + " status: " + status);

							if (status == 423) { //// 423 means too many requests
								console.log("--------updateCallflowConfig number: " + number + " TRY AGAIN in 5 seconds");
								setTimeout(function(){ cb1(null) }, 5000);
							} else {
								cont = false;
								if (status != 200){
									cb1(body.message)
								} else {
									postError = false
									cb1(null);
								}
							}
						});
					});
					req.write(JSON.stringify(orderObj));
					req.end();
				},
				function(err){
					if (postError || err) {
						callback('SP updateCallflowConfig error',false);
					} else {
						callback(null,true);
					}
				}
			);
			// shoutpoint.sendPut(options, orderobj, function(err, result) {
			// 	console.log("updateCallflowConfig number: "+number+" result: "+JSON.stringify(result));
			// 	var result = JSON.parse(result);
			// 	if(result.message == 'Not Found'){
			// 		return callback(null, false); 
			// 	}
			// 	if (err) { 
			// 			callback('Updating Configuration Result : '+err); 
			// 		}else{
			// 			callback(null, true); 
			// 		}			
			// });
		});
	},
	postSIPNumberToSP: function(number, callback){
		console.log("--------postSIPNumberToSP number: "+number)
		
		var options = {
			hostname: e[envVar].hostname,
			path : '/v1/PhoneNumbers/Move/CallFlows',
			method  :'PUT',
			headers :{
				'x-api-key': e[envVar].Key 
			}
		};
	
		var orderObj = {
			"app_id" : "863ddcdd-37e8-4145-b087-6cad4a4be4e8",
			"phone_numbers":[{
				"no": "+1" + number
			}]
		};
		
		var cont = true;
		var cntr = 0;
		var postError = true;

		async.whilst(
			function () {return (cont && cntr < 5);},
			function (cb1) {
				cntr++;
				console.log("--------postSIPNumberToSP number: "+number+" pass: "+cntr);
				var req = https.request(options, function (res) {
					var body = '';
					res.on('data', function (chunk) {
						body = body + chunk;
					});

					res.on('end',function(){
						var status = res.statusCode;
						console.log("--------postSIPNumberToSP number: " + number + " body: " + body);
						console.log("--------postSIPNumberToSP number: " + number + " status: " + status);

						if (status == 423) { //// 423 means too many requests
							console.log("--------postSIPNumberToSP number: " + number + " TRY AGAIN in 5 seconds");
							setTimeout(function(){ cb1(null) }, 5000);
						} else {
							cont = false;
							if (status != 200) {
								cb1(body.message);
							} else {
								JSON.stringify(body, function (err, result) {
									if (err) { return cb1('Failed to parse response',body); }
									shoutpoint.sendToQueueForReProcess(number, JSON.parse(result));
									postError = false
									cb1(null);
								});
							}
						}
					});
				});
				req.write(JSON.stringify(orderObj));
				req.end();
			},
			function(err){
				if (postError) {err = 'SP postSIPNumberToSP error'}
				callback(err);
			}
		);
	},
	checkSMSFeature: function(data, is_delete,  callback){
		if((data.old_status !== data.new_status) || is_delete){
			async.waterfall([
				function(cb){
					options.path = path + 'PhoneNumbers/+1' + data.did;
					shoutpoint.sendGet(options, function(err, result) {
						if (err) { return cb(err); }
						var result = JSON.parse(result);
						console.log("IS SMS Feature Present? ", result.capabilities);
						if (result == null || result.capabilities == undefined || result.capabilities.length < 1) { 
							cb('Failed on call to vendor for phone number details'); 
						}else{
							if(result.capabilities.length > 0 && result.capabilities.indexOf('sms_inbound') > -1 && result.capabilities.indexOf('sms_outbound')){
								cb(null, true);
							}else{
								cb(null, false);
							}
						}
					});
				},function(sms_enabled, cb){
					var msg = "Turn OFF SMS feature on "+ data.did;
					if(!is_delete){
						//waiting endpoints from voxology till then sending support tickets
						if(data.old_status && !data.new_status){
							msg = "Turn OFF SMS feature on "+ data.did;
							shoutpoint.sendSupportTicketForSMSFeature(data, msg, function(err){
								cb(err);
							});
						}else if(!data.old_status && data.new_status){
							msg = "Turn ON SMS feature on "+ data.did;
							shoutpoint.sendSupportTicketForSMSFeature(data, msg, function(err){
								cb(err);
							});
						}else{
							console.log("No need to send Dev ticket, no changes in SMS feature");
							cb(null);
						}
					}else if(is_delete && sms_enabled){
						msg = "Turn OFF SMS feature on " + data.did +" tracking is deleted.";
						shoutpoint.sendSupportTicketForSMSFeature(data, msg, function(err){
							cb(err);
						});
					}else{
						console.log("No need to send Dev ticket, no changes in SMS feature");
						cb(null);
					}
				}
			],
			function(err){
				callback(err);
			});
		}else{
			callback(null);
		}
	},
	sendSupportTicketForSMSFeature: function(data, text, callback){
		console.log("SMS email Info : ", data);
		var email = require('../lib/email');
		var status = "FALSE";
		if(data.new_status){
			status = "TRUE";
		}
		var query = "UPDATE phone_detail SET sms_enabled = "+status+" FROM phone_number WHERE phone_number.number_id = phone_detail.number_id AND phone_number.number_str = '"+ data.did +"';"
		var subject = '[Dev Support] '+text;
		var msg = "Hello Dev Support,<br/>"
		msg += "Please find following details to changes SMS feature activation/de-activation<br/><br/>"
		msg += "<table style='border-collapse: collapse;width: 100%;border:1px solid black'><tr>"
		msg += "<th style='text-align: left;padding: 8px; border:1px solid black'>Provisioned route id</th>"
		msg += "<th style='text-align: left;padding: 8px; border:1px solid black'>Org unit id</th>"
		msg += "<th style='text-align: left;padding: 8px; border:1px solid black'>Phone Number</th>"
		msg += "<th style='text-align: left;padding: 8px; border:1px solid black'>Old Status</th>"
		msg += "<th style='text-align: left;padding: 8px; border:1px solid black'>New Status</th>"
		msg += "<th style='text-align: left;padding: 8px; border:1px solid black'>Message</th>"
		msg += "<th style='text-align: left;padding: 8px; border:1px solid black'>Query(Update inventory after voxology's responce)</th>"
		msg += "</tr><tr>"
		msg += "<td style='text-align: left;padding: 8px; border:1px solid black'>"+ data.provisioned_route_id +"</td>"
		msg += "<td style='text-align: left;padding: 8px; border:1px solid black'>"+ data.org_unit_id +"</td>"
		msg += "<td style='text-align: left;padding: 8px; border:1px solid black'>"+ data.did +"</td>"
		msg += "<td style='text-align: left;padding: 8px; border:1px solid black'>"+ data.old_status +"</td>"
		msg += "<td style='text-align: left;padding: 8px; border:1px solid black'>"+ data.new_status +"</td>"
		msg += "<td style='text-align: left;padding: 8px; border:1px solid black'>"+ text +"</td>"
		msg += "<td style='text-align: left;padding: 8px; border:1px solid black'>"+ query +"</td>"
		msg += "</tr></table><br/>"
		msg += "Thanks"

		email.sendSupportEmail(subject, msg, config[envVar].DEV_EMAIL , data.email, function(err){
			if (err) { return callback('Failed to send dev support email'); }
			console.log("Sent Dev ticket for SMS Feature");
			callback(null);
		});
	},
	sendToQueueForReProcess: function(number, responce){
		amqp.connect(url).then(function(conn) {
			return when(conn.createChannel().then(function(ch) {
			  var q = rabbit[envVar].port_number_queue;
			  var ok = ch.assertQueue(q, {durable: true});		  
			  return ok.then(function() {
				var msg = {
				  number: number,
				  responce: responce,
				  time : new Date(),
				  attempt : 1
				};
				ch.sendToQueue(q, new Buffer(JSON.stringify(msg)), {deliveryMode: true});
				console.log("Number Data sent For Porting ", JSON.stringify(msg));
				return ch.close();
			  });
			})).ensure(function() { conn.close();});
		  }).then(null, console.warn);
	}	
};

module.exports = shoutpoint;
