var controller = require('./appController'),
	callFlowRecordingModel = require('../models/callFlowRecordingModel'),
	f = require('../functions/functions'),
	yaml = require("js-yaml"),
	fs = require("fs"),
	d = yaml.load(fs.readFileSync('config/directories.yml')),
	s3yml = yaml.load(fs.readFileSync("config/s3.yml")),
	envVar = process.env.NODE_ENV,
	aws = require('aws-sdk'),
	async = require('async'),
	mv = require('mv');

var callFlowRecording = {
	putDeleteAction: function(req,res){
		callFlowRecordingModel.deleteCallRecording(req.body, function(err){
			controller.responsify(err, 'Call Recording Deleted.', function(response){
				res(response);
			});
		});
	},
	status: function(req, res){
		controller.responsify('working on campaign put status', null, function(response){
			res(response);
		});
	},
	deleteAction: function(id, res){
		async.parallel([
			function(cb){
				callFlowRecordingModel.getById(id, function(err, data){
					if (data.length < 1 || err){
						cb('Error Deleting File.');
						return;
					}
					var filename = data[0].call_flow_recording_filename + '.wav';
					aws.config.loadFromPath('config/aws.json');
					var s3 = new aws.S3();
					s3.deleteObject({Bucket: s3yml[envVar].message_bucket, Key: filename}, function(err, data) {
					  cb(err);
					});
				});
			},
			function(cb){
				callFlowRecordingModel.delete(id, function(err, data){
					cb(err);
				});
			}
			],
			function(err){
				controller.responsify(err, 'Recording file deleted.', function(response){
					res(response);
				});
			});
	},
	uploadAction: function(req, res){
		var ctTransactionModel = require('../models/ctTransactionModel');
		var filename = req.files.file.name.split('.')[0];
		var oriExtArr = req.files.file.name.split('.');
		var oriLength = oriExtArr.length;
		var oriExt = oriExtArr[oriLength-1];
		var bucket;
		var ctTrans = new ctTransactionModel.begin(function(err, data){
			var src_path = req.files.file.path;
			async.series([
				function(cb0){
					if (oriExt == 'mp4') {
						var new_src_path = src_path.split('.')[0]+'.mp3';
						var ori_src_path = src_path;
						var exec = require('child_process').exec;
						var cmd = 'ffmpeg -i '+src_path+' '+new_src_path;
					    exec(cmd, function(error, stdout, stderr){
					    	src_path = new_src_path;
							if (fs.existsSync(ori_src_path)) fs.unlinkSync(ori_src_path);
							cb0(error);
						});
					} else {
						cb0(null);
					}
				},
				function(cb0){
					async.waterfall([
						function(cb){
							var file_path = '';
							switch (req.body.message_type){
								case 'prompt':
									file_path =  d.prompt_audio + filename + '.wav';
									key = s3yml[envVar].prompt_message_key;
								break;
								case 'whisper':
									file_path = d.whisper_audio + filename + '.wav';
									key = s3yml[envVar].whisper_message_key;

								break;
								case 'voicemail':
									file_path = d.whisper_audio + filename + '.wav';
									key = s3yml[envVar].voicemail_message_key;
								break;
							}
							if (file_path === '') {
								cb('File path missing.');
								if (fs.existsSync(src_path)) {
									fs.unlinkSync(src_path);
								}
								return;
							}
							var temp_path = d.temp + filename + '.wav';
							var transcoder = require('../lib/transcoder');
							var transcoderData = {
								src_path: src_path,
								dest_path: temp_path,
								newExt: 'wav',
								oriExt: oriExt
							};
							transcoder.start(transcoderData, function(err, data){
								if(err){
									cb(err);
									return;
								}
								if (fs.existsSync(src_path)) {
									fs.unlinkSync(src_path);
								}
								mv(temp_path, file_path, function(err){
									async.parallel([
										function(cb1) {
											aws.config.loadFromPath('config/aws-shoutpoint.json');
											var fileBuffer = fs.readFileSync(file_path);
											var s3 = new aws.S3();
											s3.putObject({
												Bucket: s3yml[envVar].sp_message_bucket,
												Key: key + "/" + filename + '.wav',
												Body: fileBuffer,
												ACL: 'public-read',
											},
											function(err, response){
												if (err){
													cb1(err);
													return;
												}
												var params = {Bucket: s3yml[envVar].sp_message_bucket, Key: key +"/"+ filename + '.wav' ,Expires: 86400*7};
												s3.getSignedUrl('getObject', params, function (err, url) {
													if (err) {
														cb1(err);
														return;
													}
													var r = {
														url: url,
														filename: req.files.file.originalname.split('.')[0],
														recording_name: filename
													};
													cb1(err, r);
												});
											});
											//cb1(null);
										}
									],
									function(err,result) {
										if(err){cb(err); }
										else cb(null,result);
									});
								});
							});
						},
						function(result, cb){
							var callFlowRecordingData = {
								call_flow_recording_ou_id: req.body.org_unit_id,
								call_flow_recording_filename: filename,
								call_flow_recording_name: req.files.file.originalname.split('.')[0],
								call_flow_recording_type: req.body.message_type
							};
							var insertData = {
								which: 'insert',
								table: 'call_flow_recording',
								values: callFlowRecordingData
							};
							ctTrans.query(insertData, function(err) {
								cb(err, result);
							});
						}
					],
					function(err, result){
						if (err){
							cb0(err);
						} else {
							var r = {
								call_flow_recording:
									{
									url: result
									}
								};
							cb0(null, r);
						}
					});//async parallel
				}
			],
			function(err, result){
				if (err){
					ctTrans.rollback(function(){
						controller.responsify(err, null, function(response){
							res(response);
						});
					});
				} else {
					ctTrans.commit(function(err){
						controller.responsify(err, result[1], function(response){
							res(response);
						});
					});
				}
			});//async series
		});//ct transaction begin
	},
	getByOuidAndTypeAction: function(req, res){
		var callFlowRecordingModel = require('../models/callFlowRecordingModel');
		callFlowRecordingModel.getByOuidAndType(req, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	getByOuidAllAudios: function(req, res){
		var callFlowRecordingModel = require('../models/callFlowRecordingModel');
		callFlowRecordingModel.getByOuidAllAudios(req, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	linkCallFlowRecording: function(req,res){
		callFlowRecordingModel.linkCallFlowRecording(req.body, function(err){
			controller.responsify(err, 'Call Recording Done.', function(response){
				res(response);
			});
		});
	},
	accountCallFlowRecordings: function(req, res){
		//// FOR AMP3 USE, DO NOT CHANGE
		callFlowRecordingModel.accountCallFlowRecordings(req, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	getCallFlowRecordingByOuId: function(req, res){
		//// FOR AMP3 USE, DO NOT CHANGE
		callFlowRecordingModel.getCallFlowRecordingByOuId(req, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
};

module.exports = callFlowRecording;
