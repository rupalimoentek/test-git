var vp = require('../lib/validateParams'),
	f = require('../functions/functions.js'),
	Filename = 'call_flow_recording',
	Param = 'call_flow_recording',
	async = require('async');

var validate = {
	begin: function(is_endpoint, extended, action, validateData, files, res){
		var validateObj = require('./jsonFiles/' + Filename + '.json');
		async.parallel([
			function(callback){
				vp.validateParams.validate(action, validateData, validateObj.params, function(result){
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
					var data = f.removeJsonNode(validateData, Param);
					if (validateObj.extended_params){
						vp.validateParams.validate(action, data, validateObj.extended_params, function(result){
							if (result.length > 0) {
								var r = {};
								r.call_flow_recording_extended = result;
								callback(null, r);
							} else {
								callback(null);
							}
						});
					} else {
						callback(null);
					}
				} else {
					callback();
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
					res();
				}
			}
		);
	}
};

module.exports = validate;