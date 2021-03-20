'use strict';
/**
 * bandwidthModel.js
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
	e           = yaml.load(fs.readFileSync("config/bandwidth.yml"));


var options = {
	hostname: e[envVar].hostname,
	path : '',
	method  :'GET',
	auth: e[envVar].username + ':' + e[envVar].password
};
var path = e[envVar].path;
var vendor_id = 7;              // this will identify the vendor the phone number came from
var vendor_name = 'bandwidth';   // this is the name of the vendor from which the number came from


/*var qry = "SELECT * FROM phone_vendor WHERE vendor_name='Bandwidth'";
var query = appModel.ctPool.query(qry, function(err, result) {
	if (err) { return false; }
	if (result.length < 1) { return false; }
});

query.on('row', function(row) {
	// set the endpoint and credentials to use
	if (envVar === 'local' || envVar === 'development') {
		var host = row.sandbox_api;
		var user = row.sandbox_login;
		var pass = row.sandbox_passwd;
	} else {
		var host = row.vendor_api;
		var user = row.sandbox_login;
		var pass = row.sandbox_passwd;
	}
	var vendor_id = row.vendor_id;
	var vendor_name = row.vendor_name;
	var options = {
		hostname: host,
		path : '',
		method  :'GET',
		auth: user + ':' + pass
	}
});
*/


var bandwidth = {
	// sends all requests to third party end-point and parses the result to return or error if one occurred
	sendGet: function(options, cb) {
		options.method = 'GET';
		delete options.headers;
		console.log(options);
		https.get(options, function (res) {
			var data = '';
			var ret = [];

			res.on('data', function (chunk) {
				data += chunk;
			});

			res.on('end', function () {
				xml2js.parseString(data, function (err, result) {

					if (err) { return cb('Failed to parse response'); }
					//console.log('RESULT', result);
					if ((result !== null && result.SearchResult !== undefined) && result.SearchResult.Error !== undefined) {
						return cb(result.SearchResult.Error[0].Description[0]);
					}
					if (result !== null && result.ErrorResponse !== undefined && result.ErrorResponse.irisStatus !== undefined) {
						return cb(result.ErrorResponse.irisStatus[0].Description[0]);
					}

					console.log('sending result');
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
		    'Content-Type': 'application/xml',
		    'Content-Length': postData.length
		};

		var req = https.request(options, function (res) {
			var data = '';
			var ret = [];

			res.on('data', function (chunk) {
				data += chunk;
			});
			res.on('end', function () {
				xml2js.parseString(data, function (err, result) {
					if (err) { cb('Failed to parse response',data); return; }

					if (result.SearchResult !== undefined && result.SearchResult.Error !== undefined) {
						return cb(result.SearchResult.Error[0].Description[0]);
					}
					//console.log('sending result');
					cb(null, result);
				});

			});
			req.on('error', function (e) {
				cb('Received error making request: ' + e.message);
			});
		});
		req.write(postData);
		req.end();
	},	
	rcState: function(rc, state, cb) {
		state = state.toUpperCase();
		rc = decodeURIComponent(rc);
		rc = rc.toUpperCase();

		

		options.path = path + 'availableNumbers?LCA=true&state=' + state + '&rateCenter=' + encodeURIComponent(rc);
		console.log("OPTIONS PATH", options.path);

		bandwidth.sendGet(options, function(err, result) {
			if (err) { return cb(err); }
			if (result === null || result.SearchResult === undefined || result.SearchResult.TelephoneNumberList === undefined) { return cb('Failed on call to vendor'); }
			if (result.SearchResult.TelephoneNumberList.length < 1) { return cb('No results returned.'); }
			var ret = [];
			
			/*
			_.each(result.SearchResult.TelephoneNumberList, function (block) {
				_.each(block.TelephoneNumber, function (did) {
					//JAW CT-7416a:fix phone_number_id
					console.log(did);
					var number = {
						'number':did,
						'number_id':did,
						'pretty_number':f.prettyPhoneNumber(did),
						'vendor_id': vendor_id,
						'source':vendor_name
					};
					ret.push(number);					
				});
				
			});
			cb(null, ret);
			*/
			
			async.eachSeries(result.SearchResult.TelephoneNumberList, function(row, cb2) {
				async.eachSeries(row.TelephoneNumber, function(did, cb3) {
					//console.log(did);
					var number = {
						'number':did,
						'number_id':did,
						'pretty_number':f.prettyPhoneNumber(did),
						'vendor_id': vendor_id,
						'source':vendor_name
					};
					ret.push(number);
					cb3(null);

				}, function(err) {
					if (err) { return cb2(err); }
					cb2(null);
				});

			}, function(err) {
				if (err) { return cb(err); }
				cb(null, ret);
			});
		});
	},
	npa: function(npa, cb) {
		options.path = path + 'availableNumbers?areaCode=' + npa;

		bandwidth.sendGet(options, function(err, result) {
			if (err) { return cb(err); }
			var ret = [];

			/*
			_.each(result.SearchResult.TelephoneNumberList, function (block) {
				_.each(block.TelephoneNumber, function (did) {
					//JAW CT-716a: fix phone_number_id
					console.log(did);
					var number = {
						'number':did,
						'number_id':did,
						'pretty_number':f.prettyPhoneNumber(did),
						'vendor_id': vendor_id,
						'source':vendor_name
					};
					ret.push(number);					
				});
			});
			cb(null, ret);
			*/
			async.each(result.SearchResult.TelephoneNumberList, function(block, cb2) {
				async.each(block.TelephoneNumber, function(did, cb3) {
					console.log(did);
					var number = {
						number: did,
						number_id: did,
						pretty_number: f.prettyPhoneNumber(did),
						vendor_id: vendor_id,
						source: vendor_name
					};
					ret.push(number);
					cb3(null);
				}, function(err) {
					if (err) { return cb2(err); }
					cb2(null);
				});
			}, function(err) {
				if (err) { return cb(err); }
				cb(null, ret);
			});
		});
	},
	npanxx: function(npanxx, cb) {
		options.path = path + 'availableNumbers?npaNxx=' + npanxx + '&LCA=yes';
		
		bandwidth.sendGet(options, function(err, result) {
			if (err) { return cb(err); }
			var ret = [];
			/*
			_.each(result.SearchResult.TelephoneNumberList, function (block) {
				_.each(block.TelephoneNumber, function (did) {
					//JAW CT-7416a:fix phone_number_id
					console.log(did);
					var number = {
						'number':did,
						'number_id':did,
						'pretty_number':f.prettyPhoneNumber(did),
						'vendor_id': vendor_id,
						'source':vendor_name
					};
					ret.push(number);					
				});
				
			});
			cb(null, ret);
			*/
			async.each(result.SearchResult.TelephoneNumberList, function(block, cb2) {
				async.each(block.TelephoneNumber, function(did, cb3) {
					console.log(did);
					var number = {
						number: did,
						number_id: did,
						pretty_number: f.prettyPhoneNumber(did),
						vendor_id: vendor_id,
						source: vendor_name
					};
					ret.push(number);
					cb3(null);
				}, function(err) {
					if (err) { return cb2(err); }
					cb2(null);
				});
			}, function(err) {
				if (err) { return cb(err); }
				cb(null, ret);
			});
		});
	},
	// used for ordering phone numbers (dids must be an array - containing any amount of phone numbers)
	orderNumber: function(dids, type, cb) {
		if (dids.length < 1) { cb('Invalid number of entries or format for ordering numbers'); return; }
		options.path = path + 'orders';
		
		var orderobj = {
			Order : {
				Quantity : (type === 'selectedNumber' ? 1 : dids.length),
				PartialAllowed: false,
				name : 'Available Telephone Number order',
				SiteId : e[envVar].site_id,
				//CustomerOrderId : '0123',
		        ExistingTelephoneNumberOrderType : {
			        TelephoneNumberList : { TelephoneNumber : dids }
	            }
			}			
		};

		var builder = new xml2js.Builder();
		var xml = builder.buildObject(orderobj);
		console.log('FORMATTED XML', xml);

		var ret = {};
		bandwidth.sendPost(options, xml, function(err, result) {
			if (err) { return cb(err); }
			console.log('orders POST RESULT', result);
			var order_id = result.OrderResponse.Order[0].id[0];

			var retry = 0;
			bandwidth.getOrderStatus(order_id, retry, function(err, completedNumbers) {
				if (err) { return cb(err); }
				console.log('completedNumbers', completedNumbers);

				if (dids.length === 1) { // handle single number return
					var did = completedNumbers[0];
					ret[did] = {result:'ok'};
					if(type === 'selectedNumber'){
						bandwidth.insertNumber(did, function (err, id) {
							if (err) { return cb('Failed to insert phone number ' + did + ' to database'); }
							ret[did].id = id;
							cb(null, ret);
						});						
					}else{
						cb(null, ret);
					}
				} else { // handle multiple number return
					console.log('cycling through to add each returned number');

					async.eachSeries(completedNumbers, function (did, callback) {
						console.log('adding number', did);
						ret[did] = {result:'ok'};
						if(type === 'selectedNumber'){
							bandwidth.insertNumber(did, function (err, id) {
								if (err) { return cb('Failed to insert phone number ' + did + ' to database'); }
								ret[did].id = id;
								callback(null);
							});
						}else{
							cb(null, ret);
						}
					}, function(err) {
						if (err) { return cb(err); }
						cb(null, ret);
					});
				}
			});
		});
	},
	getOrderStatus: function(orderId, retry, cb) {
		options.path = e[envVar].path + 'orders/' + orderId;
		
		bandwidth.sendGet(options, function(err, result) {
			if (err) { cb(err); return; }
			var ret = [];

			//console.log('getOrderStatus result', result);
			//console.log('ORDER STATUS', result.OrderResponse.OrderStatus[0]);
			//console.log('ERROR LIST', result.OrderResponse.ErrorList[0].Error);
			//console.log('ORDER', result.OrderResponse.Order);
			/*
			_.each(result.OrderResponse.CompletedNumbers, function (block) {
				_.each(block.TelephoneNumber, function (did) {
					ret.push(did.FullNumber[0]);					
				});
			});
			*/
			if(result.OrderResponse.ErrorList[0].Error !== undefined && retry <= 10) {
				retry++;
				console.log("re-connecting to bw api to check the order status....",retry);
				setTimeout(function() {
					bandwidth.getOrderStatus(orderId, retry, cb);
				}, 10000);
			} else {
				async.eachSeries(result.OrderResponse.CompletedNumbers, function(block, callback) {
					async.eachSeries(block.TelephoneNumber, function(did, callback2) {
						ret.push(did.FullNumber[0]);
						callback2(null);
				
					}, function(err) {
						if (err) { return callback(err); }
						callback(null);
					});
				}, function(err) {
					if (err) { return cb(err); }
					cb(null, ret);
				});
			}		
		});		
	},
	removeNumber: function(dids, cb) {
		if (dids.length < 1) { return cb('Invalid number of entries or format for ordering numbers'); }
		var ret = {};

		// cycle through each number in the list of numbers
		async.eachSeries(dids, function(did, callback) {
			// need to lookup the phone number to get the current provisioned_route
			var qry = "SELECT pn.number_id, pd.provisioned_route_id, prn.route_number_id, prn.pool_id " +
				"FROM phone_number pn, phone_detail pd LEFT JOIN provisioned_route_number prn ON (pd.provisioned_route_id=prn.provisioned_route_id) " +
				"WHERE pn.number_id=pd.number_id AND pn.number="+did;
			appModel.ctPool.query(qry, function(err, phone) {
				if (err) { return callback('Failed to execute lookup of phone number record for '+did+'. '+err); }
				if (phone.length < 1) { return callback('Failed to find matching phone number record for '+did); }
				if (phone[0].route_number_id === null) { return callback('Phone record does not match the provisioned route record.'); }

				// update the necessary phone related records
				async.parallel([
					function(cb2) {
						// for single number remove number from provisioned_route_number
						if (phone[0].pool_id === null) {
							var qryData = {
								table: 'provisioned_route_number',
								values: {
									date_removed: 'NOW()',
									assign_active: false
								},
								where: "route_number_id="+phone[0].route_number_id
							};
							appModel.ctPool.update(qryData, function(err) {
								if (err) { return cb2('Failed to update provisioned_route_number record for '+did+'. '+err); }
								cb2(null);
							});
						} else {
							cb2(null);
						}
					},
				    function(cb2) {
					    // update the phone_detail record
					    var current_date = f.mysqlTimestamp();
					    var qry = "UPDATE phone_detail SET provisioned_route_id=NULL, org_unit_id=NULL, app_id=NULL, number_updated='"+current_date+"' WHERE number_id="+phone[0].number_id;
					    appModel.ctPool.query(qry, function(err) {
						    if (err) { return cb2('Failed to update the phone_detail record for '+did+'. '+err); }
						    cb2(null);
					    });
				    },
				    function(cb2) {
					    var qry = "UPDATE phone_number SET number_status='suspended' WHERE number_id="+phone[0].number_id;
					    appModel.ctPool.query(qry, function(err) {
						    if (err) { return cb2('Failed to update the phone_detail record for '+did+'. '+err); }
						    ret[did] = phone[0].number_id;
						    cb2(null);
					    });
				    }

				], function(err) {
					if (err) { return callback(err); }
					callback(null);
				});
			});

		}, function(err) {
			if (err) { return cb(err); }
			cb(null, ret);
		});
	},
	removeNumber2: function(dids, cb) {
		if (dids.length < 1) { return cb('Invalid number of entries or format for ordering numbers'); }
		var ret = {};

		var disconnectOrderObj = {
			DisconnectTelephoneNumberOrder : {
				name : 'disconnect order from cfa',
		        DisconnectTelephoneNumberOrderType : {
	                TelephoneNumberList : { TelephoneNumber : dids }
		        }
		    }			
		};		

		var builder = new xml2js.Builder();
		var xml = builder.buildObject(disconnectOrderObj);

		options.path = e[envVar].path + 'disconnects';

		bandwidth.sendPost(options, xml, function(err, result) {

			var disconnectOrderStatus = '';

			if (result.DisconnectTelephoneNumberOrderResponse.OrderStatus !== undefined) {
				console.log(result.DisconnectTelephoneNumberOrderResponse.OrderStatus);
				disconnectOrderStatus = result.DisconnectTelephoneNumberOrderResponse.OrderStatus;
			} else if(result.DisconnectTelephoneNumberOrderResponse.ErrorList) {
				cb(result.DisconnectTelephoneNumberOrderResponse.ErrorList[0].Error[0].Description[0]); return;
			} else {
				cb('Unknown error'); return;
			}

			if (disconnectOrderStatus === 'RECEIVED') {

				_.each(result.DisconnectTelephoneNumberOrderResponse.orderRequest[0].DisconnectTelephoneNumberOrderType[0].TelephoneNumberList[0].TelephoneNumber, function (did) {							

					ret[did] = {};

					ret[did] = 'did';
					var num = did.toString();
					// add number into the DB
					var qry = 'DELETE FROM phone_number WHERE number=' + did + ' AND vendor_id=' + vendor_id;
					//console.log(qry);
					
					appModel.ctPool.query(qry, function(err) {
						if (err) { return cb('Failed to delete phone number ' + did + ' from database'); }
					});					

				});
			}
			cb(null, ret);
		});
	},
	insertNumber: function(did, callback) {
		var num = did.toString();
		// add number into the DB
	
		// JAW add into to fill out phone_number properly
		var xqry = "SELECT rc, city, state, zipcode, lata FROM npanxx_city WHERE npa='" + num.substr(0,3) + "' AND nxx='" + num.substr(3,3) + "' LIMIT 1";
		appModel.ctPool.query( xqry, function(xerr, xresult) {
			if (xerr) { return callback('Failed to execute rate center lookup for phone number ' + did + ' from table npanxx_city'); }
			if (xresult.length < 1) { return callback('Failed retrieve rate center record for phone number ' + did + ' from table npanxx_city'); }

			var tollfree = ['888', '877', '866', '855', '844', '800'];
			var npa = num.substr(0, 3);
			var did_type = 'did';
			var resporg_id = null;
			if (tollfree.indexOf(npa) > 0) {
				did_type = 'tfn';
				resporg_id = 'CHP01';
			}
			xresult[0].rc.replace(/'/g, "''");
			xresult[0].city.replace(/'/g, "''");

			// xresult has query result from npanxx_city
			var insertData = {
				table : 'phone_number',
				values: {
					'number'          : did,
					'number_str'      : num,
					'rate_center'     : xresult[0].rc,
					'number_type'     : did_type,
					'number_status'   : 'reserved',
					'npa'             : num.substr(0, 3),
					'nxx'	          : num.substr(3, 3),
					'ocn'             : num.substr(6,4)
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
				'number_updated' : current_date
			};

			appModel.ctPool.insert(insertData, function(err, result) {
				if (err) { return callback('Failed to insert phone number ' + did + ' to database'); }
				tdata.number_id = result.insertId;

				// JAW CT-7416a:add phone_detail //did, ou_id, pr_id, lata, tier, new_id, callback
				bandwidth.insertPhoneDetail(did, tdata, result.insertId, function(err) {
				if( err ) { return callback( 'Failed to insert phone_detail ' + did + ' to database' ); }
					callback(null, result.insertId);
				});
			});
	    });
	},
	insertPhoneDetail: function(did, data, numid, callback) {
		// add phone_detail into the DB
		var insertData = {
			table : 'phone_detail',
			values: data
		};

		appModel.ctPool.insert(insertData, function(err) {
			if (err) { return callback('Failed to insert phone detail ' + did + ' to database'); }
			callback(null);
		});
}
};

module.exports = bandwidth;
