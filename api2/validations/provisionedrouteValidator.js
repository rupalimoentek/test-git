var vp = require('../lib/validateParams'),
	f = require('../functions/functions.js'),
	Filename = 'provisioned_route',
	Param = 'provisioned_route',
	async = require('async');

var validate = {
	begin: function(is_endpoint, extended, action, validateData, files, res){
		console.log('Provisioned Routes Validator');
		var provisioned_route_filename = Filename;
		if (is_endpoint) {
			provisioned_route_filename = Filename + '_endpoint';
		}

		var validateObj = require('./jsonFiles/' + provisioned_route_filename + '.json');
		async.parallel([
			function(callback){
				var mainParams = JSON.parse(JSON.stringify(validateObj.params));
				switch (action) {
					case 'delete':
						mainParams.ids.ignore = false;
					break;
					case 'prompt':
						callback();
                        if (true) {return;} // keeps JSHint happy to not have return as the last thing before a break
					break;
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
				if (!validateObj.extended_params) {
					callback(null);
					return;
				}
				var data = f.removeJsonNode(validateData, Param);
				if (extended) {
					var extended_params = JSON.parse(JSON.stringify(validateObj.extended_params));
					if (is_endpoint) {

					} else {

						switch (data.call_flow.route_type) {
							case 'geo':
								extended_params.geo_route.ignore = false;
								extended_params.geo_options.ignore = false;
								//extended_params.call_flow_recording.ignore = false;
							break;
							case 'ivr':
								extended_params.ivrs.ignore = false;
								extended_params.multiIvrs.ignore = false;
								// if (data.ivrs && data.ivrs.length > 0) {
								// 	for (var i = data.ivrs.length - 1; i >= 0; i--) {
								// 		if(data.ivrs[i].ivr.message_type == 'file'){
								// 			extended_params.call_flow_recording.ignore = false;
								// 		}
								// 	}
								// }
							break;
							case 'PercentageBasedRoute':
								extended_params.ringto_percentage.ignore = false;
							break;
						}
						var file_count = 0;
						if (data.call_flow.message_type && data.call_flow.message_type == 'file') {
							file_count += 1;
							//extended_params.call_flow_recording.ignore = false;
						}
						if (data.call_flow.whisper_type && data.call_flow.whisper_type == 'file') {
							file_count += 1;
							//extended_params.call_flow_recording.ignore = false;
						}
						if (data.number_pool && data.number_pool.id){
							extended_params.phone_number.ignore = true;
						}
					}

					if (extended_params){
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
					if (validateData.ringto_percentage && validateData.ringto_percentage.length > 0) {
						checkPercentageSum(validateData.ringto_percentage, function(sum){
							if (sum != 100){
								res("Ringto Percentage does not equal 100.");
							} else {
								res();
							}
						});
					}else {
						res();
					}
				}
			}
		);
	}
};

module.exports = validate;

function checkPercentageSum(data, res){
	var sum = 0;
	async.each(data, function(route, cb){
		sum += route.percentage;
		cb();
	},
	function(err){
		res(sum);
	});
}

