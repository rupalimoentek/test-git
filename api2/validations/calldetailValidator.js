//Basic validator example
//The file name for the validator needs to be <endpoint name>Validator.js
//For a basic validator only need to set Filename and Param to the name of the endpoint.
//A json file needs to be created and added to restapi/validations/jsonfiles directory.
//The filename for the json should be <whatever Filename is>.json

var vp = require('../lib/validateParams'),
	f = require('../functions/functions.js'),
	Filename = 'call_detail',
	Param = 'call_detail',
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