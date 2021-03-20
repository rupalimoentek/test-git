var vp = require('../lib/validateParams'),
	f = require('../functions/functions.js'),
	Filename = 'ivr',
	Param = 'ivr',
	async = require('async');

var validate = {
	begin: function(is_endpoint, extended, action, validateData, files, res){
		console.log('ivrs validator');
		var ivrs_filename = Filename;
		if (is_endpoint) {
			ivrs_filename = Filename + '_endpoint';
		}

		var validateObj = require('./jsonFiles/' + ivrs_filename + '.json');
		async.parallel([
			function(callback){
				var mainParams = JSON.parse(JSON.stringify(validateObj.params));
				switch (parseInt(validateData.message_enabled)) {
					case 1:
						mainParams.message_type.values = ['text', 'file'];
						mainParams.message_type.allow_empty = false;
						mainParams.message.allow_empty = false;
						if (action == 'update') {
							mainParams.message_type.required[action] = true;
							mainParams.message.required[action] = true;
						}
					break;
				}
				switch (validateData.whisper_type) {
					case 'text':
						mainParams.whisper_message.allow_empty = false;
					break;
				}

				if (validateData[Param].route_type){
					mainParams.target_did.ignore = true;
					mainParams.route_type.ignore = false;
				}


				vp.validateParams.validate(action, validateData[Param], mainParams, function(result){
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
				var data = f.removeJsonNode(validateData, Param);
				if (!validateObj.extended_params) {
					callback(null);
					return;
				}
				if (extended) {
					var extended_params = JSON.parse(JSON.stringify(validateObj.extended_params));
					if (validateObj.extended_params){
						if (!validateData[Param].target_did) {
							extended_params.geo_route.ignore = false;
							extended_params.geo_options.ignore = false;
						}
						vp.validateParams.validate(action, data, extended_params, function(result){
							if (result.length > 0) {
								var r = {};
								r[Param + '_extended'] = result;
								callback(null, r);
							} else {
								callback(null);
							}
						});
					} else {
						callback(null);
					}
				} else {
					var r = [];
					for (var key in data) {
						r.push(key);
					}
					if (r.length > 0){
						callback(null, {invalid_params: r});
					} else {
						callback(null);
					}
				}
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
					res();
				}
			}
		);
	}
};

module.exports = validate;