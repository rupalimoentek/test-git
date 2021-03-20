	var vp = require('../lib/validateParams'),
	f = require('../functions/functions.js'),
	Filename = 'call_flow',
	Param = 'call_flow',
	async = require('async');

var validate = {
	begin: function(is_endpoint, extended, action, validateData, files, res){
		console.log('Call Flow Validator');
		if (action == 'read') {
			if (validateData['0']){
				var dataArr = validateData['0'].split('/');
				switch(dataArr[1]){
					case 'location':
						validateData = {
							id: dataArr[2]
						};
					break;
				}
			}
		}
		var call_flow_filename = Filename;
		if (is_endpoint) {
			call_flow_filename = Filename + '_endpoint';
		}

		var validateObj = require('./jsonFiles/' + call_flow_filename + '.json');
		async.parallel([
			function(callback){
				var mainParams = JSON.parse(JSON.stringify(validateObj.params));
				switch (validateData.route_type){
					case 'ivr':
						mainParams.ringto.required[action] = false;
					break;
				}
				if (validateData.number_pool) {
					mainParams.tracking_number.ignore = true;
				}
				if (validateData.tracking_number) {
					mainParams.number_quantity.ignore = true;
				}

				if (validateData.whisper_message) {
					mainParams.whisper_type.required[action] = true;
					mainParams.whisper_type.values = ['text', 'file'];
				}
				switch (validateData.whisper_type) {
					case 'text':
						mainParams.whisper_message.allow_empty = false;
					break;
					case 'file':
						mainParams.whisper_message.allow_empty = false;
					break;
				}
				if (validateData.message) {
					mainParams.message_type.required[action] = true;
					mainParams.message_type.values = ['text', 'file'];
				}
				switch (validateData.message_type) {
					case 'text':
						mainParams.message.allow_empty = false;
					break;
					case 'file':
						mainParams.message.allow_empty = false;
					break;
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
				var data = f.removeJsonNode(validateData, Param);
				if (!validateObj.extended_params) {
					callback(null);
					return;
				}
				if (extended) {
					var extended_params = JSON.parse(JSON.stringify(validateObj.extended_params));
					if (validateObj.extended_params){
						vp.validateParams.validate(action, data, extended_params, function(result){
							if (result.length > 0) {
								var r = {};
								r.call_flow_extended = result;
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