var fs = require('fs'),
	controller = require('../controllers/appController'),
	appRoot = require('app-root-path');

module.exports = function(req, res, next) {
	var url_arr = req.url.split('/');
	var endpoint;
	if (url_arr.length > 1) {
		endpoint = url_arr[2].split('?')[0];
		fs.exists(appRoot + '/validations/' + endpoint + 'Validator.js', function(exists){
			if (exists) {
				var action = '';
				var extended = true;
				switch (req.method) {
					case 'POST':
						if (req.originalUrl.split('/')[3] && req.originalUrl.split('/')[3] == 'import') {
							action = 'import';
						} else {
							action = 'insert';
						}
					break;
					case 'PUT':
						switch(req.originalUrl.split('/')[3]){
							case 'delete':
								action = 'delete';
								extended = false;
							break;
							case 'status':
								action = 'status';
								extended = false;
							break;
							default:
								action = 'update';
						}
					break;
					case 'GET':
						action = 'read';
					break;
				}
				console.log('url: ' + req.url);
				console.log('action: ' + action);
				if (action === '') {
					console.log('No action validation.');
					next();
					return;
				}
				var files = '';
				if (req.files) {
					files = req.files;
				}
				var validator = require("../validations/" + endpoint + "Validator.js");
				if (action == 'read'){
					//Ignoring get request validations for all endpoints except getcalldetials
					//this these will need to be added in later.
					if (endpoint != 'calldetail') {
						console.log('Not vaidating endpoint: '+endpoint);
						next();
						return;
					}
					data = req.query;
					if (Object.keys(data).length < 1) {
						data = req.params;
					}
				} else {
					data = req.body;
				}
				validator.begin(true, extended, action, data, files, function(err){
					if (err) {
						console.log("WARNING: Endpoint '" + endpoint + "' did not pass validations.");
						controller.responsify(err, '', function(response){
							res.send(response);
						});
					} else {
						console.log('No validation error for ' + endpoint + ' endpoint.');
						next();
					}
				});
			} else {
				console.log('No validator for ' + endpoint);
				next();
			}
		});
	} else {
		console.log('Not endpoint url for ' + endpoint);
		next();
	}
};