var vp = require('../lib/validateParams'),
	f = require('../functions/functions.js'),
	Filename = 'phone_number',
	Param = 'phone_number',
	async = require('async');

var validate = {
	begin: function(is_endpoint, extended, action, validateData, files, res){
		var validateObj = require('./jsonFiles/' + Filename + '.json');
		async.parallel([
			function(callback){
				var mainParams = JSON.parse(JSON.stringify(validateObj.params));
				switch(parseInt(validateData.vendor_id)){
					case 2:
						mainParams.id.ignore = false;
						mainParams.number.ignore = false;

					break;
					case 7:
						mainParams.id.ignore = false;
						mainParams.number.ignore = false;

						break;
					case 10001:
						mainParams.id.ignore = false;
						mainParams.number.ignore = false;

						break;
					default:
						mainParams.id.ignore = false;
						mainParams.number.ignore = true;
				}
				vp.validateParams.validate(action, validateData, mainParams, function(result){
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
					callback();
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