/**
 * Created by davey on 11/11/15.
 */
var appModel = require('./appModel'),
	f = require('../functions/functions.js'),
	fs = require("fs"),
	yaml = require("js-yaml"),
	e = yaml.load(fs.readFileSync("config/database.yml")),
	async = require('async'),	
	s3yml = yaml.load(fs.readFileSync("config/s3.yml")),
	envVar = process.env.NODE_ENV,
	aws = require('aws-sdk'),
	_ = require('underscore'),
	http = require('http'),
	gm = require('gm').subClass({imageMagick: true}),
	table = 'org_white_label';

var whitelabel = {
	resizeimg: function (data, res) {
		if (isNaN(data.body.org_unit_id) || data.body.org_unit_id < 1) { 
			return res('You must pass an org_unit_id');
		}

		if (!data.files || !data.files.file || !data.files.file.path) {
			return res("No file attached");
		}

		gm(data.files.file.path).size(function (err, size) {
			// logic to decide whether we resize by height or width while maintaining ratio to
			// make the image fit the top left logo container
			var LOGO_CONTAINER_HEIGHT = 100;
			var LOGO_CONTAINER_WIDTH = 300; // in PX
			var CONTAINER_RATIO = LOGO_CONTAINER_HEIGHT / LOGO_CONTAINER_WIDTH;
			var resizeWidth, resizeHeight;
			if (CONTAINER_RATIO > (size.height/size.width)) {
				// resize by height
				resizeWidth = LOGO_CONTAINER_WIDTH;
				resizeHeight = null;
			} else {
				// resize by width
				resizeWidth = null;
				resizeHeight = LOGO_CONTAINER_HEIGHT;
			}
			

			gm(data.files.file.path).resize(resizeWidth, resizeHeight).gravity('Center').write(data.files.file.path, function(err) {
				if (err) { return res(err); }
				fs.readFile(data.files.file.path, {encoding: 'base64'}, function(err, base64data) {
				   if (err) { return res(err); }
				   res(null, "data:image/png;base64," + base64data);

				});
				// fs.unlink(data.files.file.path, function (err) {
				// 	if (err) { return callback(err); }

				// 	console.log('successfully deleted uploaded file');
				// 	callback(null);
				// });
			});
		})
	},
	create_update: function(data, res) {
		//console.log(data.body);
		
		if (isNaN(data.body.org_unit_id) || data.body.org_unit_id < 1) { 
			res('You must pass an org_unit_id');
			return;
		}		
		//async series to handle uploaded file first if one is uploaded then write to db.
		var s3url = null;
		async.series([
			function(callback){
				if (data.files.file) {
					gm(data.files.file.path).size(function (err, size) {
						// logic to decide whether we resize by height or width while maintaining ratio to
						// make the image fit the top left logo container

						var LOGO_CONTAINER_HEIGHT = 100;
						var LOGO_CONTAINER_WIDTH = 300; // in PX
						var CONTAINER_RATIO = LOGO_CONTAINER_HEIGHT / LOGO_CONTAINER_WIDTH;
						var resizeWidth, resizeHeight;
						if (CONTAINER_RATIO > (size.height/size.width)) {
							// resize by height
							resizeWidth = LOGO_CONTAINER_WIDTH;
							resizeHeight = null;
						} else {
							// resize by width
							resizeWidth = null;
							resizeHeight = LOGO_CONTAINER_HEIGHT;
						}
						

						gm(data.files.file.path).resize(resizeWidth, resizeHeight).gravity('Center').write(data.files.file.path, function(err) {
							if (err) { return callback(err); }

							//after resize upload to S3
							aws.config.loadFromPath('config/aws.json');
							var fileBuffer = fs.readFileSync(data.files.file.path);
							var s3 = new aws.S3();
							s3.putObject({
								Bucket: s3yml[envVar].whitelabel_bucket,
								Key: data.files.file.name,
								Body: fileBuffer
							},
							function(err) {
								if (err) { return callback(err); }

								var params = {Bucket: s3yml[envVar].whitelabel_bucket, Key: data.files.file.name ,Expires: 86400*365};
								s3.getSignedUrl('getObject', params, function (err, url) {
									if (err) { return callback(err); }

									s3url = url;
									//delete file
									fs.unlink(data.files.file.path, function (err) {
										if (err) { return callback(err); }

										console.log('successfully deleted uploaded file');
										callback(null);
									});
									
								});
							});
						});
					});
				} else {
					console.log('file not passed');
					callback(null);
				}
			},
			function(callback){
				if (s3url !== null) { data.body.org_logo = s3url; }
				if(data.body.domain_name) data.body.domain_name = data.body.domain_name.toLowerCase(); // force all domains to be lowercase for duplication enforcement

				var qry = "SELECT * FROM org_white_label WHERE org_unit_id=" + data.body.org_unit_id;
				appModel.ctPool.query(qry, function(err, ouResult) {
					if (err) { return res(err); }
					//console.log(ouResult);
					//check to see if record exists and if so update, else insert
					if (ouResult.length > 0) {
						var updateData = {
							table : table,
							values: data.body,
							where: " WHERE org_unit_id=" + data.body.org_unit_id
						};
						console.log('****** Update Data', updateData.org_logo);
						appModel.ctPool.update(updateData, function(err, ret) {
							if (err) { 
								callback('Problem saving whitelabel settings: '+err);
							} else {
								callback(null);
							}
						});
					} else {
						var insertData = {
							table : table,
							values: data.body
						};
						console.log('****** Insert Data', insertData.org_logo);
						appModel.ctPool.insert(insertData, function(err, ret) {
							if (err) { 
								callback('Problem saving whitelabel settings: '+err);
							} else {
								callback(null);
							}
						});	
					}
				});
			}
		],
		// optional callback
		function(err, results){
			if (err) { return res(err); }

			//console.log(s3url);
			res(null,'Whitelabel settings saved.');
			// results is now equal to ['one', 'two']
		});
	},
	delete: function(id, res) {
		var actionids = [];
		if (!isNaN(id) && id > 0) {
			qry = "DELETE FROM org_white_label WHERE org_unit_id = "+id;			
				appModel.ctPool.query(qry, function (err, data) {
					if (err) { 
						res(err); 
						return; 
					}else{
						res(null, 'Whitelabel setting deleted.');
					}	
				});	
		} else {
			res('Invalid whitelabel ID submitted');
		}
	},
	get: function(id, res) {
		if (!isNaN(id) && id > 0) {
			var qry = "SELECT * FROM org_white_label WHERE org_unit_id=" + id;
			appModel.ctPool.query(qry, function(err, data) {
				if (err) { res(err); return; }
				res(null, data);
			});
		} else {
			res('Invalid whitelabel ID submitted');
		}
	}
};

module.exports = whitelabel;