var fs = require('fs'),
	v = require('validator');

var validateParams = {
	validate: function(action, data, validateObj, res){
		console.log('Validating: ' + JSON.stringify(data));
		var vObj = JSON.parse(JSON.stringify(validateObj));
		var r = [];
		var missingParams = [];
		var errors = [];
		var validParams = [];
		var ZIP_REGEXP = /^[a-z0-9 ]+$/i;
		for(var key in vObj){
			if (!(vObj[key].required[action] === true || vObj[key].required[action] === false)) continue;
			if (vObj[key].ignore) continue;
			if (validParams.indexOf(key) < 0) {
				if (vObj[key].required[action] === true || vObj[key].required[action] === false){
					validParams.push(key);
				}
			}
			if (vObj[key].required[action] && !data.hasOwnProperty(key)) {
				if (!vObj[key].allow_empty == true) {
					missingParams.push(key);
				}
			}
			if (vObj[key].allow_empty && data[key] === '') {
				continue;
			} else if (vObj[key].allow_empty === false && data[key] === '') {
				missingParams.push(key);
			}
			switch (vObj[key].type){
				case 'string':
					if (data[key]) {
						if (vObj[key].byte_length){
							if (Buffer.byteLength(data[key], 'utf8') != vObj[key].byte_length){
								errors.push(data[key] + ' must be a string of 12 bytes.');
							}
						}
						if (vObj[key].max_length){
							if (data[key].length > vObj[key].max_length){
								errors.push(data[key] + ' is too long.');
							}
						}
						if (vObj[key].min_length){
							if (data[key].length < vObj[key].max_length){
								errors.push(data[key] + ' is too short.');
							}
						}
					}
				break;
				case 'stateabbr':
					if (data[key]) {
						var alpha = /^[a-zA-Z]*$/;
						if (!alpha.test(data[key])) {
							errors.push(data[key] + ' is not a valid state.');
						}
						if (vObj[key].byte_length){
							if (Buffer.byteLength(data[key], 'utf8') != vObj[key].byte_length){
								errors.push(data[key] + ' must be a string of 12 bytes.');
							}
						}
						if (vObj[key].max_length){
							if (data[key].length > vObj[key].max_length){
								errors.push(data[key] + ' is too long.');
							}
						}
						if (vObj[key].min_length){
							if (data[key].length < vObj[key].max_length){
								errors.push(data[key] + ' is too short.');
							}
						}
					}
				break;
				case 'integer':
					if (data[key]) {
						if (!v.isInt(data[key])) {
							errors.push(data[key] + ' is not a valid integer.');
						}
					}
				break;
				case 'currency':
					if (data[key]) {
						if (!v.isCurrency(data[key])) {
							errors.push(data[key] + ' is not a valid cash amount.');
						}
					}
					break;
				case 'datetime':
					if (data[key]){
						if (isNaN(Date.parse(data[key]))) {
							if (!data[key].match(/^\d{4}\-\d\d\-\d\d\s\d\d\:\d\d\:\d\d\s\w+\/w+$/)) {
								errors.push(data[key] + ' is not a valid date.');
							}
						}
					}
				break;
				case 'call_flow_phone_number':
									
					if (data[key] !== '' && data[key]) {
						if (data[key] == 'hangup') break;
						if (!v.isInt(data[key])) {
							errors.push(data[key] + ' is not a valid phone number.');
						} else if (data[key].length != 10){
							errors.push(data[key] + ' is not a ten digit number.');
						}
					}
				break;
				case 'zip':
					if (data[key]) {
						if (!ZIP_REGEXP.test(data[key])) {
							errors.push(data[key] + ' is not a valid zip code.');
						}
					}
				break;
				case 'phone_number':
					
					if (data[key]) {
						if (!v.isInt(data[key])) {
							errors.push(data[key] + ' is not a valid phone number.');
						} else if (data[key].length != 10){
							errors.push(data[key] + ' is not a ten digit number.');
						}
					}
				break;
				case 'get_call_detail_phone_number':
					if (data[key]) {
						if (!v.isInt(data[key])) {
							errors.push(data[key] + ' is not a valid phone number.');
						}
						if (vObj[key].max_length){
							if (data[key].length > vObj[key].max_length){
								errors.push(data[key] + ' is too long.');
							}
						}
						if (vObj[key].min_length){
							if (data[key].length < vObj[key].min_length){
								errors.push(data[key] + ' is too short.');
							}
						}
					}
				break;
				case 'email':
					if (data[key]) {
						if (!v.isEmail(data[key])) {
							errors.push(data[key] + ' is not a valid email address.');
						}
					}
				break;
				case 'boolean':
					var vParams = ['0', '1', 'true', 'false', 't', 'f', 'y', 'n', 'yes', 'no'];
					if (data[key]) {
						if (vParams.indexOf(data[key].toString()) < 0){
							errors.push(key + ' must be 0 ,1, true, or false.');
						}
					}
				break;
				case 'get_call_detail_date':
					var dateReg = /^((199\d)|([2-9]\d{3}))(\-((0[1-9])|(1[0-2]))(\-((0[1-9])|([1,2][0-9])|([3][0,1]))(\s(([0,1]\d)|(2[0-3]))(\:[0-5][0-9](\:[0-5][0-9])?)?)?)?)?$/;
					if (data[key]) {
						if (!dateReg.test(data[key])) {
							errors.push(data[key] + ' is not a valid date.');
						}
					}
				break;
				case 'array':
					if (data[key]) {
						if (!Array.isArray(data[key])) {
							errors.push(data[key] + ' is not an array.');
						} else {
							if (vObj[key].min_length) {
								if (data[key].length < vObj[key].min_length) {
									errors.push(data[key] + ' is less then minimum elements allowed.');
								}
							}
							if (vObj[key].max_length) {
								if (data[key].length > vObj[key].max_length) {
									errors.push(data[key] + ' is greater then maximum elements allowed.');
								}
							}
							var otherErrors = [];
							for (var i = data[key].length - 1; i >= 0; i--) {
								switch (vObj[key].array_element_type) {
									case 'integer':
										if (isNaN(data[key][i])) {
											errors.push(data[key] + ':' + data[key][i] + ' is not an integer.');
										}
									break;
								}
								if (vObj[key].validator) {
									var validator = require("../validations/" + vObj[key].validator + "Validator.js");
									validator.begin(false, true, action, data[key][i], '', function(err){
										if (err) {
											otherErrors.push(err);
										}
									});
								}
								if (vObj[key].filename) {
									var jsonObj = require('../validations/jsonFiles/' + vObj[key].filename + '.json');
									this.validate(action, data[key][i], jsonObj.params, function(result){
										if (result && result.length > 0){
											var r = {};
											r[key] = result;
											errors.push(r);
										}
									});
								}
							}
							if (otherErrors.length > 0) {
								errors.push(otherErrors);
							}
						}
					}
				break;
				case 'json':
					if (data[key]) {
						var jsonErrors = [];
						if (vObj[key].filename) {
							var jsonObj = require('../validations/jsonFiles/' + vObj[key].filename + '.json');
							this.validate(action, data[key], jsonObj.params, function(result){
								if (result && result.length > 0){
									var r = {};
									r[key] = result;
									errors.push(r);
								}
							});
						}
						if (vObj[key].validator) {
							var validator = require("../validations/" + vObj[key].validator + "Validator.js");
							validator.begin(false, true, action, data[key], '', function(err){
								if (err) {
									jsonErrors.push(err);
								}
							});
						}
						if (jsonErrors.length > 0) {
							errors.push(jsonErrors);
						}
					}
				break;
				case 'commaSeparatedPhone':
					if (data[key]) {
						var numbers = data[key].split(',');
						for (var i = numbers.length - 1; i >= 0; i--) {
							if (numbers[i] != '0000000000' && !v.isInt(numbers[i])) {
								errors.push(numbers[i] + ' is not a valid phone number.');
							} else if (numbers[i].length != 10){
								errors.push(numbers[i] + ' is not a ten digit number.');
							}
						}
					}
				break;
				case 'commaSeparatedString':
					if (data[key]) {
						var tags = data[key].split(',');
						for (var i = tags.length - 1; i >= 0; i--) {
							if (vObj[key].max_length){
								if (tags[i].length > vObj[key].max_length){
									errors.push(tags[i] + ' is too long.');
								}
							}
							if (vObj[key].min_length){
								if (tags[i].length < vObj[key].min_length){
									errors.push(tags[i] + ' is too short.');
								}
							}
						}
					}
				break;
				case 'commaSeparatedZip':
					if (data[key]) {
						var numbers = data[key].split(',');
						for (var l = numbers.length - 1; l >= 0; l--) {
							if (!ZIP_REGEXP.test(numbers[l])) {
								errors.push(numbers[l] + ' is not a valid zip code.');
							}
						}
					}
				break;
				case 'pipeSeparatedZip':
					if (data[key]) {
						var numbers = data[key].split('|');
						for (var m = numbers.length - 1; m >= 0; m--) {
							if (!ZIP_REGEXP.test(numbers[m])) {
								errors.push(numbers[m] + ' is not a valid zip code.');
							}
						}
					}
				break;
				case 'multipart':
					if (data[key]){
						if (vObj[key].file_types && vObj[key].file_types.length > 0){
							if (vObj[key].file_types.indexOf(data[key].mimetype) < 0) {
								errors.push(data[key].mimetype + ' is not a valid file types.');
							}
						}
					}
				break;
			}

			if (data[key] && vObj[key].values && vObj[key].values.length > 0) {
				var val = data[key];
				if (vObj[key].type === 'integer') {
					val = parseInt(data[key]);
				}
				if (vObj[key].values.indexOf(val) < 0) {
					errors.push(data[key] + ': ' + val + ' is not a valid value.');
				}
			}
		}
		// console.log("*******************************************",validParams);
		for (var k in data) {
			if (validParams.indexOf(k) < 0) {
				errors.push(k + ' is not a valid param.');
			}
		}
		if (missingParams.length > 0) {
			r.push({missing_params: missingParams});
		}
		if (errors.length > 0){
			r.push({errors: errors});
		}
		console.log('errors for : ' +  JSON.stringify(data) + '\n' + JSON.stringify(r));
		var returnJson = r;
		if (r.length > 0) {
			res(returnJson);
		} else {
			res([]);
		}
	}
};

module.exports = {
	validateParams: validateParams
};
