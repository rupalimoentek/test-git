var connector = require('./appModel'),
	table = 'call_flow_recording',
	async = require('async'),
	fs = require('fs'),
	yaml = require("js-yaml");
	s3yml = yaml.load(fs.readFileSync("config/s3.yml")),
	envVar = process.env.NODE_ENV,
	ctTransactionModel = require('../models/ctTransactionModel'),
	ceTransactionModel = require('./ceTransactionModel'),
	orgUnitModel = require('./orgUnitModel'),
	aws = require('aws-sdk');

var callFlowRecording = {
	create: function(data, res){
		var insertData = {
			table : table,
			values: data
		};
		connector.ctPool.insert(insertData, function(err, data){
			res(null,data);
		});
	},
	delete: function(id, res){
		var qry = "DELETE FROM " + table + " WHERE call_flow_recording_id = '" + id + "'";
		connector.ctPool.query(qry, function(err, data){
			res(err, data);
		});
	},
	getById: function(id, res){
		var qry = "SELECT call_flow_recording_filename FROM " + table + " WHERE call_flow_recording_id = '" + id + "'";
		connector.ctPool.query(qry, function(err, data){
			res(err, data);
		});
	},
	getByOuIds: function(ou_ids, type, res){
		var qry = "SELECT call_flow_recording_id, call_flow_recording_name FROM " + table + " WHERE call_flow_recording_ou_id in (" + ou_ids + ") AND call_flow_recording_type = '" + type + "'";
		connector.ctPool.query(qry, function(err, data){
			res(err, data);
		});
	},
	getByOuidAllAudios: function (req, res) {
		
		async.waterfall([
			function getPrompts(callback){
				var r = {};
				
				var qry = "SELECT call_flow_recording_id, call_flow_recording_filename, call_flow_recording_name, call_flow_recording_type FROM call_flow_recording WHERE call_flow_recording_ou_id in (" + req.params.ouid + ") AND call_flow_recording_type = 'prompt'";
        		connector.ctPool.query(qry, function(err, data) {
					var prompts = [];
                	if(data.length > 0){
                    	async.each(data, function (d) {
                        	aws.config.loadFromPath('config/aws-shoutpoint.json');
                        	var s3 = new aws.S3();
                        
                        	key = s3yml[envVar].prompt_message_key;
                    
                        	var params = { Bucket: s3yml[envVar].sp_message_bucket, Key: key + "/" + d.call_flow_recording_filename + '.wav', Expires: 86400 * 7 };
                        	s3.getSignedUrl('getObject', params, function (err, url) {
                            	if (!err) {
                                	prompts.push({
                                    	id: d.call_flow_recording_id,
                                    	name: d.call_flow_recording_name,
                                    	filename: d.call_flow_recording_filename,
                                    	type: d.call_flow_recording_type,
                                		url: url
                                	});
                            	}
                        	});
						});
						r['prompts'] = prompts;
                        callback(null,r);
                	}else{
                    	callback(null,r);
                	}
                
                	
				});
			},
			function(r,callback){
				var qry = "SELECT call_flow_recording_id, call_flow_recording_filename, call_flow_recording_name, call_flow_recording_type FROM call_flow_recording WHERE call_flow_recording_ou_id in (" + req.params.ouid + ") AND call_flow_recording_type = 'whisper'";
        		connector.ctPool.query(qry, function(err, data) {
            	var whispers = [];
            	if(data.length > 0){
               
					async.each(data, function (d) {
						aws.config.loadFromPath('config/aws-shoutpoint.json');
						var s3 = new aws.S3();
					
						key = s3yml[envVar].whisper_message_key;

						var params = { Bucket: s3yml[envVar].sp_message_bucket, Key: key + "/" + d.call_flow_recording_filename + '.wav', Expires: 86400 * 7 };
						s3.getSignedUrl('getObject', params, function (err, url) {
							if (!err) {
								whispers.push({
									id: d.call_flow_recording_id,
									name: d.call_flow_recording_name,
									filename: d.call_flow_recording_filename,
									type: d.call_flow_recording_type,
									url: url
                            	});
                        	}
						});
					});
					r['whispers'] = whispers;
					callback(null,r);
            	}else{
                	callback(null,r);
            	}
            
        		});					
			},
			function getVoicemails(r,callback){
				var qry = "SELECT call_flow_recording_id, call_flow_recording_filename, call_flow_recording_name, call_flow_recording_type FROM call_flow_recording WHERE call_flow_recording_ou_id in (" + req.params.ouid + ") AND call_flow_recording_type = 'voicemail'";
        		connector.ctPool.query(qry, function(err, data) {
            	var voicemails = [];
            	if(data.length > 0){
                	async.each(data, function (d) {
						aws.config.loadFromPath('config/aws-shoutpoint.json');
						var s3 = new aws.S3();
				
						key = s3yml[envVar].voicemail_message_key;
					
						var params = { Bucket: s3yml[envVar].sp_message_bucket, Key: key + "/" + d.call_flow_recording_filename + '.wav', Expires: 86400 * 7 };
						s3.getSignedUrl('getObject', params, function (err, url) {
							if (!err) {
								voicemails.push({
									id: d.call_flow_recording_id,
									name: d.call_flow_recording_name,
									filename: d.call_flow_recording_filename,
									type: d.call_flow_recording_type,
									url: url
                            	});
                        	}
						});
					});
					r['voicemails']=voicemails;
					callback(null, r);
            	}else{
                	callback(null,r);
            	}
            
            	});				
			}
		],function(err,result){
			res(err,result);
		})	
	},
	getByOuidAndType: function (req, res) {
		orgUnitModel.getAllParentOuIds(req.params.ouid, function (result) {
			result += ',' + req.params.ouid;
			var qry = "SELECT call_flow_recording_id, call_flow_recording_filename, call_flow_recording_name, call_flow_recording_type FROM " + table + " WHERE call_flow_recording_ou_id in (" + result + ") AND call_flow_recording_type = '" + req.params.type + "' AND recording_active = true";
			connector.ctPool.query(qry, function (err, data) {
				var r = [];
				async.each(data, function (d, cb) {
					aws.config.loadFromPath('config/aws-shoutpoint.json');
					var s3 = new aws.S3();
					switch (req.params.type) {
						case 'prompt':
							key = s3yml[envVar].prompt_message_key;
							break;
						case 'whisper':
							key = s3yml[envVar].whisper_message_key;

							break;
						case 'voicemail':
							key = s3yml[envVar].voicemail_message_key;
							break;
					}
					var params = { Bucket: s3yml[envVar].sp_message_bucket, Key: key + "/" + d.call_flow_recording_filename + '.wav', Expires: 86400 * 7 };
					s3.getSignedUrl('getObject', params, function (err, url) {
						if (err) {
							cb(err);
							return;
						} else {
							r.push({
								id: d.call_flow_recording_id,
								name: d.call_flow_recording_name,
								filename: d.call_flow_recording_filename,
								type: d.call_flow_recording_type,
								url: url
							});
							cb();
						}
					});
				},
					function (err) {
						res(err, r);
					});
			});
		});
	},
	deleteCallRecording: function(data, res){
		var ctTrans = new ctTransactionModel.begin(function(err){
			var qry = "UPDATE " + table + " SET recording_active=false WHERE call_flow_recording_id = " + data.id;
			var qryData = {
				which: 'query',
				qry: qry
			};
			ctTrans.query(qryData, function(err){
				if (err) {
					ctTrans.rollback(function(){
						res(err);
					});
				} else {
					ctTrans.commit(function(){
						res();
					});
				}
			});
		});
	},
	linkCallFlowRecording: function(data, res){
		var ctTrans = new ctTransactionModel.begin(function(err){
		if (err) { return res(err); }

		async.eachSeries(data.call_flows, function(call_flow, cb) {
			async.waterfall([					
				function(cb1) {
					if(call_flow.call_flow_recording_filename && call_flow.call_flow_recording_filename !== ""){
						var qry = "SELECT call_flow_recording_id FROM " + table + " WHERE call_flow_recording_filename = '" + call_flow.call_flow_recording_filename + "'";
						connector.ctPool.query(qry, function(err, data){
							if(err){
								return res(err);
							}
							if(data.length > 0){
								var values = [];
								values.push("(" + call_flow.provisioned_route_id + "," + data[0].call_flow_recording_id + ")");
								
								var qry = 'INSERT INTO call_flow_route_link (provisioned_route_id, call_flow_recording_id) VALUES ' + values.join(',');
								var qryData = {
										which: 'query',
										qry: qry
									};
								ctTrans.query(qryData, function(err){
									call_flow.call_flow_recording_id = data[0].call_flow_recording_id;
									cb1(err);
								});
							} else {
								cb1("Filename not found in call_flow_recording table:"+call_flow.call_flow_recording_filename);
							}
						});
					} else {
						cb1(null);
					}
				},
				function(cb1){
					var callFlowData = {};
					var whisper_message = 'blank://';
					switch (call_flow.whisper_type) {
						case 'text':
							whisper_message = 'tts://' + call_flow.whisper_message;
						break;
						case 'file':
							if(call_flow.type === 'whisper')
								whisper_message = call_flow.whisper_message + '.wav';
							else
								whisper_message = call_flow.message + '.wav';
						break;
					}
					if(call_flow.type === 'whisper'){
						callFlowData.whisper_enabled = call_flow.whisper_enabled;
						callFlowData.whisper_message = whisper_message;
					} else {
						callFlowData.message_enabled = call_flow.whisper_enabled;
						callFlowData.message = whisper_message;
					}
					var updateData = {
						which: 'update',
						table : 'ce_call_flows',
						values: callFlowData,
						where: " WHERE provisioned_route_id = " + call_flow.provisioned_route_id
					};
					ctTrans.query(updateData, function(err, data){
						cb1(err);
					});
				}
			],
			function(err){
				cb(err);
			});// async waterfall cb
		},
		function(err){
			if (err) {
				ctTrans.rollback(function(){
					res(err);
				});
			} else {
				ctTrans.commit(function(){
					res(null);
				});
			}
		});//async each
		});//ct transaction begin
		
	},
	accountCallFlowRecordings: function(req, res){
		//// FOR AMP3 USE, DO NOT CHANGE
		var qry = "SELECT *";
		qry += " FROM call_flow_recording";
		qry += " WHERE call_flow_recording_ou_id in "; 
		qry += "(SELECT org_unit_id FROM org_unit WHERE billing_id = "
		qry += " (SELECT billing_id FROM org_unit WHERE org_unit_id = "+req.params.ouid+"))";
		if (req.params.type !== undefined && req.params.type !== '') {
			qry += " AND call_flow_recording_type = '"+req.params.type+"'";
		}
		qry += " AND recording_active = true";
		connector.ctPool.query(qry, function(err, data){
			res(err, data);
		});
	},
	getCallFlowRecordingByOuId: function(req, res){
		//// FOR AMP3 USE, DO NOT CHANGE
		orgUnitModel.getAllParentOuIds(req.params.ouid, function (result) {
			result += ',' + req.params.ouid;
			var qry = "SELECT call_flow_recording_id, call_flow_recording_filename, call_flow_recording_name, call_flow_recording_type FROM " + table + " WHERE call_flow_recording_ou_id in (" + result + ") AND call_flow_recording_type = '" + req.params.type + "' AND recording_active = true";
			connector.ctPool.query(qry, function (err, data) {
				res(err, data);
			});
		});
	}
};

module.exports = callFlowRecording;
