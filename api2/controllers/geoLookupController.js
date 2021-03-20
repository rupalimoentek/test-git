var controller = require('./appController'),
	f = require('../functions/functions'),
	async = require('async'),
	geoLookupsModel = require('../models/geoLookupModel'),
	localCallingGuideModel = require('../models/localcallingGuideModel'),
	toll_frees = require('../config/toll_free.json');
var geoLookups = {
	getCitiesAction: function(req, str, res){
		var find = '\\*';
		var re = new RegExp(find, 'g');
		var new_str = str.replace(re, '');

		new_str = f.toTitleCase(new_str);

		if (isNaN(new_str)) {
			async.waterfall([
				function(cb){
					new_str = new_str.toUpperCase();
					geoLookupsModel.byCity(new_str, function(data){
					cb(null,data);
						});
				},
				function(data,cb){

					//////////////
					///rate centers are now in npanxx_city table
					///

					cb(null,data);
					// 1st para in async.each() is the array of items
					// async.each(data,
					//   // 2nd param is the function that each item is passed to
					//   function(d, callback){
					//   	var npanxx_str =  d.npanxx.toString();
					//   	var nxx = npanxx_str.substr(npanxx_str.length - 3);
					// 	localCallingGuideModel.rate_center(d.npa,nxx, function(err, d2){
				 //  			d.rc = d2;
				 //  			callback();
				 //  		});
					//   },
					//   function(err){
					// 	cb(err,data);
					//   }
					// );
				}

			], function (err,result)
			{
				controller.responsify(null, result, function(response){
					res(response);
				});
			});
		} else {
			if (toll_frees.npa.indexOf(parseInt(new_str)) > -1) {
				var d = [];
				d.push({
						npa: new_str,
						city: 'TOLLFREE',
						state: ''
					});
				controller.responsify(null, d, function(response){
					res(response);
				});
			} else {
				geoLookupsModel.byNpa(new_str, function(data){
					controller.responsify(null,data, function(response){
						res(response);
					});
					// async.each(data, function(d,cb1){
					// 	var npanxx_str =  d.npanxx.toString();
					//   	var nxx = npanxx_str.substr(npanxx_str.length - 3);
					// 	localCallingGuideModel.rate_center(d.npa, nxx, function(err, d2){
					// 		d.rc = d2;
					// 		cb1();
					// 	});

					// },
					// function(err){
					// 	controller.responsify(err,data, function(response){
					// 		res(response);
					// 	});
					// });
				});
			}
		}
	}
};

module.exports = geoLookups;
