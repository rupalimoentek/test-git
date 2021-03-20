var vp = require('../lib/validateParams'),
	f = require('../functions/functions.js'),
	Filename = 'location_route',
	Param = 'location_route',
	async = require('async');

var validate = {
	begin: function(is_endpoint, extended, action, validateData, files, res){
		var data;
		if (action == 'import') {
			data = validateData;
			filename = 'location_route_import';

		} else {
			data = validateData[Param];
			filename = 'location_route';
		}
		var validateObj = require('./jsonFiles/' + filename + '.json');
		var mainParams = JSON.parse(JSON.stringify(validateObj.params));
		if (is_endpoint) {
			mainParams.location_id.ignore = false;
		}

		if(is_endpoint && mainParams.location_ivr_route_id){
			mainParams.location_ivr_route_id.ignore = false;
		}
		async.parallel([
			function(callback){
				vp.validateParams.validate(action, data, mainParams, function(result){
					if (result.length > 0) {
						var r = {};
						r[Param] = result;
						callback(null, r);
					} else {
						callback(null);
					}
				});
			},
			function(callback){
				if (!validateObj.extended_params) {
					callback(null);
					return;
				}
				if (extended) {
					var data = f.removeJsonNode(data, Param);
					if (validateObj.extended_params){
						vp.validateParams.validate(action, data, validateObj.extended_params, function(result){
							if (result.length > 0) {
								var r = {};
								r.other_params = result;
								callback(null, r);
							} else {
								callback(null);
							}
						});
					} else {
						callback(null);
					}
				} else {
					callback(null);
				}
			},
			function(callback){
				if (!validateObj.multipart) {
					callback(null);
					return;
				}
				vp.validateParams.validate(action, files, validateObj.multipart, function(result){
					if (result.length > 0) {
						var r = {};
						r.other_params = result;
						callback(null, r);
					} else {
						callback(null);
					}
				});
			}
			],
			function(err, results){
				var r = [];
				for (var i = results.length - 1; i >= 0; i--) {
					if (results[i]) r.push(results[i]);
				}
				if (r.length > 0) {
					res(r);
				} else {
					res(null);
				}
			}
		);
	}
};

module.exports = validate;
