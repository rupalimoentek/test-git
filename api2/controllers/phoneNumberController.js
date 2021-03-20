var controller = require('./appController'),
	f = require('../functions/functions'),
	phoneNumbersModel = require('../models/phoneNumberModel'),
	geoLookupsModel = require('../models/geoLookupModel'),
	localCallingGuideModel = require('../models/localcallingGuideModel'),
	async = require('async'),
	toll_frees = require('../config/toll_free.json');

var phoneNumbers = {
	unprovisionByIdAction: function(req,callback){
		phoneNumbersModel.unprovisionById(req,function(err,results){	
			controller.responsify(err,results,function(response){
				callback(response);
			});
		});
	},
	getPhoneByNumberAction: function(req,callback){
		//// FOR AMP3 USE DO NOT CHANGE ////
		phoneNumbersModel.getPhoneByNumber(req,function(err,results){	
			controller.responsify(err,results,function(response){
				callback(response);
			});
		});
	},
	getRateCenterStateAction: function(req,callback){
		//// FOR AMP3 DO NOT CHANGE ////
		phoneNumbersModel.getRateCenterState(req,function(err,results){	
			controller.responsify(err,results,function(response){
				callback(response);
			});
		});
	},
	getAction: function(req, str, res){
		// phoneNumbersModel.read(str, function(data){
		// 	res(data);
		// });

		res('Still working on get phone numbers endpoint.');
	},
	numberAction: function(number, res) {
		phoneNumbersModel.idByNumber(number, function(data){
			res(data);
		});
	},
	numberVendorAction: function(number, res) {
		//FOR AMP3 USE DO NOT CHANGE
		phoneNumbersModel.vendorIdByNumber(number, function(data){
			res(data);
		});
	},
	cityStateAction: function(city, state, res) {
		city = f.toTitleCase(city);
		state = state.toUpperCase();
		async.waterfall([
			function(callback){
				geoLookupsModel.npanxxCityState(city, state, function(data){
					callback(null, data);
				});
			},
			function(data, callback) {
				phoneNumbersModel.numberByNpanxx(data, function(data){
					callback(null,data);
				});
			}
			],function(err, data){
				res(data);
				//res('Still working on get phone numbers by city and state endpoint. ' + city + ', ' + state);
			}
		);

	},
	reservedNumbers: function(req, res) {
		phoneNumbersModel.getReserved(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	cityStateNpaAction: function(city, state, npa, is_migrated, res) {
		//// THIS IS USED BY AMP MAKE SURE AMP GETS UPDATED IF CHANGES ARE MADE HERE
		if (toll_frees.npa.indexOf(parseInt(npa)) > -1){
			phoneNumbersModel.numberByNpa(npa, function(err, data) {
				if (err) { return res(err); }
				res(null, data);
			});
		} else {
			phoneNumbersModel.numberByCityStateNpa(city, state, npa, is_migrated, function(err, data) {
				if (err) { return res(err); }
				res(null, data);
			});

			/*async.waterfall([
				function(callback){
					geoLookupsModel.npanxxCityStateNpa(city, state, npa, function(data){
						console.log('geoLookups', data);
						callback(null, data);
					});
				},
				function(data,callback){
					//console.log('before calling localcalling guide: ' + JSON.stringify(data));
					if (data.length < 1) {
						callback(null, data);
					} else {
						var npanxx_str =  data[0].npanxx.toString();
						var nxx = npanxx_str.substr(npanxx_str.length - 3);
						//	console.log('nxx: ' + nxx);
						//	console.log('npa: ' + npa);
						localCallingGuideModel.nparc(npa, nxx, function(data) {
							console.log('localCallingGuide', data);
							callback(null, data);
						});
					}

				},
				function(data, callback) {
				//	console.log('before calling phonenumbersModel');
					if (data.length > 0) {
						//console.log('about to call phone numbers table with data');
						//console.log(JSON.stringify(data));
						phoneNumbersModel.numberByNpanxx(data, function(data){
							console.log('phoneNumbers', data);
							callback(null,data);
						});
					} else {
						callback(null, {});
					}

				}
				],function(err, data){
					res(data);
					//res('Still working on get phone numbers by city and state endpoint. ' + city + ', ' + state);
				}
			);
			*/
		}
	},
	zipAction: function(zip, res) {
		async.waterfall([
			function(callback){
				geoLookupsModel.npanxxZip(zip, function(data){
					callback(null, data);
				});
			},
			function(data, callback){
				if (data.length > 0) {
					phoneNumbersModel.numberByNpanxx(data, function(data){
						callback(null,data);
					});
				} else {
					callback('No records', null);
				}
			}
			],function(err, data){
				res(data);
			});
	},
	npaAction: function(npa, res) {
		async.waterfall([
			function(callback){
				geoLookupsModel.npanxxNpa(npa, function(data){
					callback(null, data);
				});
			},
			function(data, callback){
				if (data.length > 0) {
					phoneNumbersModel.numberByNpanxx(data, function(data){
						callback(null,data);
					});
				} else {
					callback('No records', null);
				}
			}
			],function(err, data){
				res(data);
			});
	},
	postAction: function(req, callback){
		phoneNumbersModel.post(req.body.phone_number, function(err,data){
			controller.responsify(err, data, function(response){
				callback(response);
			});
		});
	},
	updateLmcReferanceAction: function(req, res) {
		console.log("in updateLmcReferanceAction function:",req.body.phone_number);
		phoneNumbersModel.unsetLmcReferanceByNumberId(req.body.phone_number.id, function(data){
			res(data);
		});
	},
	updateStatusAction: function(req, res){
		phoneNumbersModel.updateStatus(req,function(err,results){
			controller.responsify(err,results,function(response){
				res(response);
			});
		});
	},
	getPhoneDataByNumberAction: function(req,callback){
		//// FOR AMP3 USE DO NOT CHANGE ////
		phoneNumbersModel.getPhoneDataByNumber(req,function(err,results){	
			controller.responsify(err,results,function(response){
				callback(response);
			});
		});
	},
	phoneNumbersByBillingOuid: function(req,callback){
		//// FOR AMP3 USE DO NOT CHANGE ////
		phoneNumbersModel.phoneNumbersByBillingOuid(req,function(err,results){	
			controller.responsify(err,results,function(response){
				callback(response);
			});
		});
	},
};

module.exports = phoneNumbers;
