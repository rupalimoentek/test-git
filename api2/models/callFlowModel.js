var appModel = require('./appModel'),
	f = require('../functions/functions.js'),
    yaml = require("js-yaml"),
	fs = require("fs"),
	yaml = require("js-yaml"),
	e = yaml.load(fs.readFileSync("config/call_flows.yml")),
	route_types = e.call_flows.types,
	fs = require("fs"),
	d = yaml.load(fs.readFileSync('config/directories.yml')),
	s3yml = yaml.load(fs.readFileSync("config/s3.yml")),
	envVar = process.env.NODE_ENV,
	async = require('async'),
	geoCoder = require('../lib/geoCoder'),
	table = 'call_flows',
	sptable = 'ce_call_flows',
	moment = require('moment'),
	outboundTable = 'ce_outbound_routes',
	ctTransModel,
	aws = require('aws-sdk'),
	async = require('async');
	ctlogger    = require('../lib/ctlogger.js'),
	_ = require('underscore'),
	unique = require('array-unique').immutable,
	amqp = require('amqplib'),
	rabbit = yaml.load(fs.readFileSync("./config/rabbit.yml")),
	url = 'amqp://'+rabbit[envVar].user+':'+rabbit[envVar].password+'@'+rabbit[envVar].host+':'+rabbit[envVar].port+'/'+rabbit[envVar].vhost;
	url1 = 'amqp://'+rabbit[envVar].user+':'+rabbit[envVar].password+'@'+rabbit[envVar].host+':'+rabbit[envVar].port+'/'+rabbit[envVar].recording_vhost;
  //url = 'amqp://localhost',
var ctTransactionModel = require('./ctTransactionModel'),
	overFlowNumberModel = require('./overFlowNumberModel');
	var oldPercentageData = [];

var callFlow = {
	orphanPathQueue : function(pr_id, callback){
		amqp.connect(url1).then(function(conn) {
			return when(conn.createChannel().then(function(ch) {
			  var q = rabbit[envVar].orphan_path_queue;
			  var ok = ch.assertQueue(q, {durable: true});		  
			  return ok.then(function() {
				var msg = {
					provisioned_route_id: pr_id
				};
				ch.sendToQueue(q, new Buffer(JSON.stringify(msg)), {deliveryMode: true});
				console.log(" [x] Sent '%s'", JSON.stringify(msg));
				return ch.close();
			  });
			})).ensure(function() { conn.close();  callback();});
		  }).then(null, console.warn);
	},
	sendForMigration: function(pr_id, callback){
		amqp.connect(url).then(function(conn) {
			return when(conn.createChannel().then(function(ch) {
			  var q = rabbit[envVar].call_flow_queue;
			  var ok = ch.assertQueue(q, {durable: true});		  
			  return ok.then(function() {
				var msg = {
				  call_flow_id: pr_id
				};
				ch.sendToQueue(q, new Buffer(JSON.stringify(msg)), {deliveryMode: true});
				console.log(" [x] Sent '%s'", JSON.stringify(msg));
				return ch.close();
			  });
			})).ensure(function() { conn.close();  callback();});
		  }).then(null, console.warn);
	},
	deleteById: function(trans,call_flow_id, provisioned_route_id, callback){
			var qry;
			if (call_flow_id) {
				qry = "SELECT routable_type, routable_id FROM "+sptable+" WHERE id="+call_flow_id+" LIMIT 1;";
			} else if (provisioned_route_id) {
				qry = "SELECT routable_type, routable_id FROM "+sptable+" WHERE provisioned_route_id="+provisioned_route_id+" LIMIT 1;";
			}
			if(!qry){
				callback('Missing id.');
				return;
			}
			trans.select(qry,function(err,data){
				if (data.length > 0) {
					async.parallel([
						function(cb) {
							switch(data[0].routable_type) {
								case 'IvrRoute':
									var qry = "DELETE FROM ce_ivr_options WHERE ivr_route_id="+data[0].routable_id;
									var deleteData = {
										which: 'query',
										qry: qry
									};
									trans.query(deleteData, function(err, data){
										cb(err,data);
									})
								break;
								case 'IvrRoute2':
									var qry = "DELETE FROM ce_ivr_options2 WHERE ivr_route_id="+data[0].routable_id;
									var deleteData = {
										which: 'query',
										qry: qry
									};
									trans.query(deleteData, function(err, data){
										cb(err,data);
									})
								break;
								case 'GeoRoute':
									var qry = "DELETE FROM ce_geo_options WHERE geo_route_id="+data[0].routable_id;
									var deleteData = {
										which: 'query',
										qry: qry
									};
									trans.query(deleteData, function(err, data){
										cb(err,data);
									})
								break;
								case 'PercentageBasedRoute':
									var qry = "DELETE FROM ce_percentage_route_options WHERE percentage_route_id="+data[0].routable_id;
									var deleteData = {
										which: 'query',
										qry: qry
									};
									trans.query(deleteData, function(err, data){
										cb(err,data);
									})
								break;
								case 'ScheduleRoute':
									var qry = "DELETE FROM ce_schedule_routes WHERE id="+data[0].routable_id;
									var deleteData = {
										which: 'query',
										qry: qry
									};
									trans.query(deleteData, function(err, data){
										cb(err,data);
									})
								break;
								default:
									cb(null);
							};
						},
						function(cb) {
							switch(data[0].routable_type) {
								case 'IvrRoute':
									var qry = "DELETE FROM ce_ivr_routes WHERE id="+data[0].routable_id+" LIMIT 1;";
									var deleteData = {
										which: 'query',
										qry: qry
									};
									trans.query(deleteData, function(err, data){
										cb(err,data);
									})
								break;
								case 'IvrRoute2':
									var qry = "DELETE FROM ce_ivr_options2 WHERE ivr_route_id="+data[0].routable_id;
									var deleteData = {
										which: 'query',
										qry: qry
									};
									trans.query(deleteData, function(err, data){
										cb(err,data);
									})
								break;
								case 'GeoRoute':
									var qry = "DELETE FROM ce_geo_routes WHERE id="+data[0].routable_id;
									var deleteData = {
										which: 'query',
										qry: qry
									};
									trans.query(deleteData, function(err, data){
										cb(err,data);
									})
								break;
								case 'PercentageBasedRoute':
									var qry = "DELETE FROM ce_percentage_route WHERE id="+data[0].routable_id;
									var deleteData = {
										which: 'query',
										qry: qry
									};
									trans.query(deleteData, function(err, data){
										cb(err,data);
									})
								break;
								default:
									cb(null);
							};
						},
						function(cb) {
							var qry;
							if(call_flow_id){
								qry = "UPDATE ce_call_flows SET status = 'suspended' WHERE id="+call_flow_id+" LIMIT 1;";
							} else if (provisioned_route_id){
								qry = "UPDATE ce_call_flows SET status = 'suspended' WHERE provisioned_route_id="+provisioned_route_id+" LIMIT 1;";
							}

							if(!qry){
								callback('Missing id.');
								return;
							}
							var deleteData = {
								which: 'query',
								qry: qry
							};
							trans.query(deleteData, function(err, data){
								cb(err,data);
							})
						}
					],
					function(err){
						callback(err);
					});//async parallel cb
				} else {
					callback(null,'Call Flow Not Found.');
				}
			})
	},
	create: function(model, data, isMigrated,loggerData, res){
		ctTransModel = model;
		var date_timestamp = f.mysqlTimestamp();
		data.created_at = date_timestamp;
		data.updated_at = date_timestamp;
		data.app_id = 'CT';
		if (data.routable_type) {
			data.routable_type = route_types[data.routable_type];
		}
		var insertData = {
			which: 'insert',
			table: sptable,
			values: data
		};

		switch (data.routable_type){
			case 'SimpleRoute':
				var note = 'Simple Route';
				if(data.default_ringto === 'hangup')
					note = 'Hangup';
					ctTransModel.query(insertData, function(err, simpleData){
					var newdata = { 'org_unit_id':loggerData.ouid, 'ct_user_id':loggerData.userid, 'call_flow_id':data['provisioned_route_id'], 'log_data':data };
					ctlogger.log(newdata, 'insert', 'call_flow',note,'',loggerData.log_auth);
					res(err, simpleData);
				});
			break;
			case 'IvrRoute2':
				//// Removing isMigrated flag to use multiIvrs method to create call flows and ivr routes
			//	isMigrated = false;

				if (data.ivrs && data.ivrs.length > 0) {
					var logIvrData =  data.ivrs;

					////callflow.message_enabled and whisper_enabled need to be set as integer in payload to pass validation, but to save to table need to be switched back to boolean.  Maybe a good idea would be to change validations to the correct value after telecom is released.
					if (data.message_enabled === 1 || data.message_enabled == '1') {
						data.message_enabled = true;
					} else {
						data.message_enabled = false;
					}

					if (data.whisper_enabled === 1) {
						data.whisper_enabled = true;
					} else {
						data.whisper_enabled = false;
					}

					////

					if(!isMigrated){
						ivrCallFlow(ctTransModel, 'insert', data, function(err, ivrData){
							var newdata = { 'org_unit_id':loggerData.ouid, 'ct_user_id':loggerData.userid, 'ivr_id':ivrData['ivr_id'], 'log_data':logIvrData };
							ctlogger.log(newdata, 'insert', 'ivr','','',loggerData.log_auth);
							res(err,ivrData);
						});
					}
					else{
						multiIVRCallFlow(ctTransModel, 'insert', data,data.provisioned_route_id, function(err, ivrData){
							if(err){res(err, ivrData);}
							delete data.ivrs;
							data.routable_id = ivrData['ivr_id'];
							ctTransModel.query(insertData, function(err, simpleData){
								var newdata = { 'org_unit_id':loggerData.ouid, 'ct_user_id':loggerData.userid, 'ivr_id':ivrData['ivr_id'], 'log_data':logIvrData };
								ctlogger.log(newdata, 'insert', 'ivr','','',loggerData.log_auth);
								res(err, ivrData);
							});
						});
					}
				} else {
					res('Missing Ivr Data.');
				}

			break;
			case 'GeoRoute':
				if (data.geo_route) {
					geoCallFlow('insert', data, function(err, geoData){
						var newdata = { 'org_unit_id':loggerData.ouid, 'ct_user_id':loggerData.userid, 'call_flow_id':data['provisioned_route_id'], 'log_data':data };
						ctlogger.log(newdata, 'insert', 'call_flow','Geo Route','',loggerData.log_auth);
						res(err, geoData);
					});
				} else {
					res('Missing Geo Data.');
				}
			break;
			case 'PercentageBasedRoute':
				if (data.ringto_percentage && data.ringto_percentage.length > 0) {
					percentageCallFlow('insert', data,data.provisioned_route_id, function(err, percentData){
						var newdata = { 'org_unit_id':loggerData.ouid, 'ct_user_id':loggerData.userid, 'call_flow_id':data['provisioned_route_id'], 'log_data':data };
						ctlogger.log(newdata, 'insert', 'call_flow','Percentage Based Route','',loggerData.log_auth);
						res(err, percentData);
					});
				} else {
					res('Missing Ringto Data.');
				}
			break;
			case 'OutboundRoute':
				if(data.outboundData.callerid !== null){
					outboundCallFlow(ctTransModel, 'insert', data, function(err, outboundData){
						var newdata = { 'org_unit_id':loggerData.ouid, 'ct_user_id':loggerData.userid, 'call_flow_id':data['provisioned_route_id'], 'log_data':data };
						ctlogger.log(newdata, 'insert', 'call_flow','Outbound Based Route','',loggerData.log_auth);
						res(err,outboundData);
					});
				}else {
					res('Missing Outbound Data.');
				}
					
			break;
			case 'VoicemailRoute':
					var note = 'Voice Mail';
					ctTransModel.query(insertData, function(err, simpleData){
					console.log(err,simpleData);
					var newdata = { 'org_unit_id':loggerData.ouid, 'ct_user_id':loggerData.userid, 'call_flow_id':data['provisioned_route_id'], 'log_data':data };
					ctlogger.log(newdata, 'insert', 'call_flow',note,'',loggerData.log_auth);
					res(err, simpleData);
					
				});
			break;
			case 'ScheduleRoute':
			if(data.schedule_data !== null && data.schedule_data!==''){
				scheduledData(ctTransModel, 'insert', data, data.provisioned_route_id,function(err, scheduleData){
					var newdata = { 'org_unit_id':loggerData.ouid, 'ct_user_id':loggerData.userid, 'call_flow_id':data['provisioned_route_id'], 'log_data':data };
					ctlogger.log(newdata, 'insert', 'call_flow','Schedule Route','',loggerData.log_auth);
					res(err,scheduleData);
				});
			}else {
				res('Missing Schedule Data.');
			}
			break;
			default:
				res('Invalid Route Type');
		}
	},
	update: function(model, data, isMigrated,loggerData,provisioned_route_id ,res){
		ctTransModel = model;
		if (data.routable_type) {
			data.routable_type = route_types[data.routable_type];
		}
		this.clearRoutings(data.id, loggerData, function(err){
			data.app_id = 'CT';
			if (err) {
				res(err);
			} else {
				switch (data.routable_type){
					case 'SimpleRoute':
						var date_timestamp = f.mysqlTimestamp();
						data.updated_at = date_timestamp;
						data.routable_id = null;
						var updateData = {
							which: 'update',
							table : sptable,
							values: data,
							where: " WHERE app_id='CT' AND id = " + data.id
						};
						var note = 'Simple Route';
						if(data.default_ringto === 'hangup')
							note = 'Hangup';
							ctTransModel.query(updateData, function(err, SimpleData){
							var newdata = { 'org_unit_id':loggerData.ouid, 'ct_user_id':loggerData.userid, 'call_flow_id':data['id'], 'log_data':data };
							ctlogger.log(newdata, 'update', 'call_flow',note,'',loggerData.log_auth);
							res(err, SimpleData);
						});
					break;
					case 'IvrRoute2':
						if (data.ivrs && data.ivrs.length > 0) {
							data.whisper_enabled = false;
							data.whisper_message = '';
							var logIvrData =  data.ivrs;
							if(!isMigrated){
								ivrCallFlow(ctTransModel, 'update', data, function(err, ivrData){
									var newdata = { 'org_unit_id':loggerData.ouid, 'ct_user_id':loggerData.userid, 'ivr_id':ivrData['ivr_id'], 'log_data':logIvrData };
									ctlogger.log(newdata, 'update', 'ivr','','',loggerData.log_auth);
									res(err,ivrData);
								});
							}
							else{
								multiIVRCallFlow(ctTransModel, 'update', data, provisioned_route_id,function(err, ivrData){
									if(err){res(err, ivrData);}
									delete data.ivrs;
									data.routable_id = ivrData['ivr_id'];
									var updateData = {
										which: 'update',
										table : sptable,
										values: data,
										where: " WHERE app_id='CT' AND id = " + data.id
									};
									ctTransModel.query(updateData, function(err){
										var newdata = { 'org_unit_id':loggerData.ouid, 'ct_user_id':loggerData.userid, 'ivr_id':ivrData['ivr_id'], 'log_data':logIvrData };
										ctlogger.log(newdata, 'update', 'ivr','','',loggerData.log_auth);
										res(err, ivrData);
									});
								});
							}
						} else {
							res('Missing Ivr Data.');
						}
					break;
					case 'GeoRoute':
						if (data.geo_route) {
							geoCallFlow('update', data, function(err, geoData){
								var newdata = { 'org_unit_id':loggerData.ouid, 'ct_user_id':loggerData.userid, 'call_flow_id':data['id'], 'log_data':data };
								ctlogger.log(newdata, 'update', 'call_flow','Geo Route','',loggerData.log_auth);
								res(err);
							});
						} else {
							res('Missing Geo Data.');
						}
					break;
					case 'PercentageBasedRoute':
						if (data.ringto_percentage && data.ringto_percentage.length > 0) {
							percentageCallFlow('update', data, provisioned_route_id,function(err, ringtoData){
								var newdata = { 'org_unit_id':loggerData.ouid, 'ct_user_id':loggerData.userid, 'call_flow_id':data['id'], 'log_data':data };
								ctlogger.log(newdata, 'update', 'call_flow','Percentage Based Route','',loggerData.log_auth);
								res(err, ringtoData);
							});
						} else {
							res('Missing Ringto Data.');
						}
					break;
					case 'OutboundRoute':
						if (data.outboundData.callerid !== null) {
							outboundCallFlow(ctTransModel, 'update', data, function(err, outboundData){
								var newdata = { 'org_unit_id':loggerData.ouid, 'ct_user_id':loggerData.userid, 'call_flow_id':data['id'], 'log_data':data };
								ctlogger.log(newdata, 'update', 'call_flow','Outbound Based Route','',loggerData.log_auth);
								res(err,outboundData);
							});
							
						} else {
							
							res('Missing Outbound Data.');
						}
					break;
					case 'VoicemailRoute':
						var date_timestamp = f.mysqlTimestamp();
						data.updated_at = date_timestamp;
						var updateData = {
							which: 'update',
							table : sptable,
							values: data,
							where: " WHERE app_id='CT' AND id = " + data.id

						};
						var note = 'Voice Mail';
						ctTransModel.query(updateData, function(err, retData){
							var newdata = { 'org_unit_id':loggerData.ouid, 'ct_user_id':loggerData.userid, 'call_flow_id': data['id'], 'log_data':data };
							ctlogger.log(newdata, 'update', 'call_flow',note,'',loggerData.log_auth);
							res(err, retData);
						});
						break;
					case 'ScheduleRoute':
					if(data.schedule_data !== null && data.schedule_data!==''){
						scheduledData(ctTransModel, 'update',data,provisioned_route_id, function(err, scheduleData){
							var newdata = { 'org_unit_id':loggerData.ouid, 'ct_user_id':loggerData.userid, 'call_flow_id':data['id'], 'log_data':data };
							ctlogger.log(newdata, 'update', 'call_flow','Outbound Based Route','',loggerData.log_auth);
							res(err,scheduleData);
						});
					}else {
						res('Missing Schedule Data.');
					}
					break;
					default:
						res('Invalid Route Type');
				}
			}
		});
	},
	spGetByProvisionedRouteId: function(prid, res){
		var qry = "SELECT id,routable_type,routable_id,hunt_option FROM " + sptable + " WHERE provisioned_route_id = " + prid + " AND app_id='CT'";
		appModel.ctPool.query(qry, function(err, data){
			res(err, data);
		});
	},
	getByProvisionedRouteId: function(prid, res){
		var qry = "SELECT id,routable_type,routable_id FROM " + table + " WHERE provisioned_route_id = " + prid + " AND app_id='CT'";
		appModel.cePool.query(qry, function(err, data){
			res(err, data);
		});
	},
	setStatusAll: function(campaignData, res){
		var campaignProvisionedRoutes = require('./campaignProvisionedRouteModel');
		campaignProvisionedRoutes.getProvisionedRoutes(campaignData.id, function(err, data){
			var provisioned_route_ids = [];
			for (var i = data.length - 1; i >= 0; i--) {
				provisioned_route_ids.push(data[i].provisioned_route_id);
			}
			if (provisioned_route_ids.length > 0) {
				var qry = "UPDATE " + table + " SET status='" + campaignData.status + "' WHERE app_id='CT' AND provisioned_route_id IN ( " + provisioned_route_ids.join(',') + ")";
				appModel.cePool.query(qry, function(err,data){
					res(err);
				});
			} else {
				res();
			}


		});

	},
	getByProvisionedRoute: function(provisioned_route_id, migrated, callback){
		console.log("********************Get callflow by id****************************");
		var jsonScheduleOptionHash = {};
		async.parallel([
			function(cb){
				async.waterfall([
					function(cb1){
						var qry = "SELECT  cf.id as call_flow_id, cf.vm_enabled,cf.dnis_as_cid, cf.ring_delay , cf.vm_message, cf.message_enabled, cf.whisper_enabled, cf.sms_enabled, cf.message, cf.whisper_message, cf.routable_id, cf.postcall_ivr_id as post_call_ivr_id, cf.postcall_ivr_enabled as post_call_ivr_enabled, cf.spam_filter_enabled as spam_active, cf.webhook_enabled as webhook_enabled, cf.whisper_enabled as whisper_enabled, cf.whisper_message as whisper_message, cf.message_enabled as message_enabled, cf.message as message,cf.routable_type as routable_type, (case when cf.default_ringto is null then '' else cf.default_ringto end) as default_ringto, cf.record_until as record_until, cf.play_disclaimer as play_disclaimer,csr.timezone, csr.timezone_name, csr.id,cf.ouid";
						qry += ", io.id as ivr_option_id, io.target_did as ivr_option_target_did, io.ouid as ivr_option_ouid, io.value as ivr_option_value, io.message as ivr_option_message, io.play_disclaimer as ivr_play_disclaimer, io.record_enabled as ivr_record_enabled, io.action_order, io.ivr_option_type";
						qry += ", gr.strategy as strategy, gr.id as geo_route_id, gr.play_branding as geo_route_play_branding, gr.radius as geo_route_radius, gr.allow_manual_entry as geo_route_allow_manual_entry, gr.default_ringto as geo_default_ringto, gr.location_id as location_id, gr.message_enabled as geo_route_message_enabled, gr.message as geo_route_message ";
						//qry += ", go.id as geo_option_id, go.ouid as geo_option_ouid, go.target_did as geo_option_target_did, go.address as geo_option_address, go.city as geo_option_city";
						qry += ", pro.id as percentage_route_options_id, pro.vm_enabled as pro_vm_enabled, pro.target_did as percentage_ringto, pro.percentage as percentage, pro.route_order as route_order";
						qry += " FROM " + sptable + " AS cf";
						qry += " LEFT JOIN ce_ivr_routes2 as ir on ir.id = cf.routable_id AND cf.routable_type = 'IvrRoute2'";
						qry += " LEFT JOIN ce_ivr_options2 as io on io.ivr_route_id = ir.id";
						qry += " LEFT JOIN ce_geo_routes as gr on gr.id = cf.routable_id AND cf.routable_type = 'GeoRoute'";
						//qry += " LEFT JOIN ce_geo_options as go on go.geo_route_id = gr.id";
						qry += " LEFT JOIN ce_percentage_route as pr on pr.id = cf.routable_id AND cf.routable_type = 'PercentageBasedRoute'";
						qry += " LEFT JOIN ce_percentage_route_options as pro on pro.percentage_route_id = pr.id";
						qry += " LEFT JOIN ce_schedule_routes as csr on csr.id=cf.routable_id AND cf.routable_type = 'ScheduleRoute'";
						qry += " WHERE provisioned_route_id = " + provisioned_route_id + " AND app_id='CT' order by action_order Asc";
						appModel.ctPool.query(qry, function(err, data){
							cb1(err,data);
						});
					},
					function(data, cb1){
						if(migrated && provisioned_route_id && data[0].sms_enabled){
							var qry = "SELECT pd.sms_enabled as sms_feature FROM provisioned_route pr";
							qry += " JOIN provisioned_route_number prn ON(prn.provisioned_route_id = pr.provisioned_route_id AND phone_number_id is not null AND pool_id is null)";
							qry += " JOIN phone_detail pd ON(pd.number_id = prn.phone_number_id)";
							qry += " WHERE pr.provisioned_route_id = "+provisioned_route_id;
							appModel.ctPool.query(qry, function(err, numberData){
								if(numberData.length > 0 && numberData[0].sms_feature){
									data[0].sms_feature = numberData[0].sms_feature;
									cb1(err,data);
								} else {
									data[0].sms_feature = false
									cb1(err,data);
								}								
							});
						}else{
							data[0].sms_feature = false;
							cb1(null, data);
						}
					},
					function(data, cb1){
						if (data[0] && data[0].routable_type === 'IvrRoute2') {
							async.waterfall([
								function(cb2){
									var qry = "SELECT ceo.* FROM ce_ivr_routes2 cer LEFT JOIN ce_ivr_options2 ceo ON(cer.id =ceo.ivr_route_id ) WHERE cer.id ="+data[0].routable_id;
									appModel.ctPool.query(qry, function(err, options){
										cb2(null, options);
									});
								},
								function(options, cb2){
									var ivrOptions = [];
									async.map(options, function(option, cboption){
										callFlow.getIVRdataByType(option, provisioned_route_id, function(err, ivr){
											if(err){cboption(err);}
											ivrOptions.push(ivr);
											cboption();
										});							
										}, function(err){
											cb2(err, ivrOptions);
										});
								},
								function(options, cb2){
									if(!migrated){
										//console.log("******",options);
										data[0].oldIvrs = options;
									}
									else{
										data[0].multiIvrs = options;
									}
									
									cb2(null, data);
								}
							],
							function(err, data){
								cb1(err, data);
							}
							);
						} else {
							cb1(null, data);
						}
					},
					function(data, cb1){
						if (data[0] && data[0].routable_type === 'ScheduleRoute') {
							async.waterfall([
								function(cb3){
									var qry ="SELECT ce_sc_ro .default_ringto as default_ringto, ce_sc_ro .vm_enabled as default_vm,ce_sc_ro .timezone_name as timezone,ce_sch_opt.id AS option_id,timezone,timezone_name, ce_hunt_type_id, ce_sch_opt.target_did as ringTo, days, from_time, " +
									"to_time, ce_sch_opt.created_at, ce_sch_opt.updated_at, ce_sch_opt.vm_enabled, hunt_type,ht.target_did, ht.ring_delay, ht.overflow_order " +
									"FROM public.ce_schedule_options ce_sch_opt " +
									"left join ce_hunt_types ce_ht on ce_ht.id=ce_sch_opt.ce_hunt_type_id " +
									"left join ce_hunt_options ht on ht.hunt_route_id=ce_sch_opt.ce_hunt_type_id " +
									"left join ce_schedule_routes ce_sc_ro on ce_sch_opt.schedule_route_id = ce_sc_ro.id " +
									"left join ce_call_flows ce on ce_sc_ro.id=ce.routable_id " +
									"where ce.provisioned_route_id = " + provisioned_route_id + " ORDER BY ce_sch_opt.id, ht.overflow_order ASC"; 
									appModel.ctPool.query(qry, function(err, options){
										cb3(null,options);
									});
								},
								function(options, cb3){
									jsonScheduleOption(options, function(err, jsonScheduleOptions){
										jsonScheduleOptionHash = jsonScheduleOptions;
										cb3(null, data);
									});
								},
								
							],
							function(err, data){
								cb1(err, data);
							}
							);
						} else {
							cb1(null, data);
						}
					}
				],
				function(err,data){
					cb(err, data);
				});
			},
			function(cb){
				var qry = "SELECT cs.custom_source_id,cs.custom_source_name, ccs.custom_source_type FROM custom_source cs JOIN callflow_custom_source ccs ON (cs.custom_source_id = ccs.custom_source_id AND cs.custom_source_active = true ) ";
				    qry	+="WHERE ccs.provisioned_route_id = " + provisioned_route_id;
				appModel.ctPool.query(qry, function(err, data){
							jsonCustomSource(data, function(err, json){
							cb(err,json);
						});
				});
			},
			function(cb){
				var qry = "SELECT pcio.post_call_ivr_option_name, pv.*, pci.provisioned_route_id FROM post_call_ivr_voice_prompts pv LEFT JOIN post_call_ivr pci ON (pv.post_call_ivr_id = pci.post_call_ivr_id) LEFT JOIN post_call_ivr_options pcio ON (pcio.post_call_ivr_option_id  = pci.post_call_ivr_option_id) ";
					qry	+="WHERE pci.provisioned_route_id = " + provisioned_route_id;
				appModel.ctPool.query(qry, function(err, data){
							jsonPostCallIVR(data, function(err, json){
							cb(err,json);
						});
				});
			}, 
			function(cb){
				async.waterfall([
					function(cb1){
						qry = "SELECT routable_id, routable_type FROM ce_call_flows WHERE provisioned_route_id = " + provisioned_route_id ;
						appModel.ctPool.query(qry, function(err, result){
							cb1(err, result);
						});
					},
					function(routeData, cb1){						
						if(routeData.length && routeData[0].routable_type == 'OutboundRoute' && routeData[0].routable_id){
							qry = "SELECT pin, callerid FROM ce_outbound_routes WHERE id = " + routeData[0].routable_id ;
							appModel.ctPool.query(qry, function(err, result){
								cb1(err, result);
							});
						}else{
							cb1(null, []);
						}							
					}], 
					function(err, data){
						cb(err, data);
				});
			}
			],
			function(err, result){
				if (err){
					callback(err);
					return;
				}

				if (result[0].length < 1){
					callback(null, {});
					return;
				}
				jsonCallFlow(result[0], migrated,function(err, json){
					json.outbound_Data = result[3];
					json.post_call_ivr = result[2];
					json.custom_sources = result[1];
					if(Object.keys(jsonScheduleOptionHash).length > 0){
						json.schedule = jsonScheduleOptionHash;
					}
					callback(err, json);
				});
		});
	},
	getIVRdataByType: function(ivr, provisioned_route_id, callback){
		switch(ivr.ivr_option_type){
			case 'simple':
			if(ivr.hunt_option_id){
				overFlowNumberModel.read(ivr.hunt_option_id, function(err, huntOptions){
					if(err){callback(err);}
					ivr.overflowNumbers = huntOptions;
					callback(err, ivr);
				});
			}else{
				callback(null, ivr);
			}			
			break;
			case 'geo':
				async.waterfall([
					function (cb) {
						if(ivr.hunt_option_id){
							overFlowNumberModel.read(ivr.hunt_option_id, function(err, huntOptions){
								if(err){cb(err);}
								ivr.overflowNumbers = huntOptions;
								cb(err);
							});
						}else{
							cb(null);
						}
					},
					function(cb){
						var geo_route_id = ivr.target_did.split('://')[1];
						qry = "SELECT * FROM ce_geo_routes WHERE id = "+ geo_route_id;
						appModel.ctPool.query(qry, function(err, result){
							if(err){cb(err);}
							if(result.length){
								ivr.target_did = result[0].default_ringto;
								ivr.radius = result[0].radius;
								ivr.location_id = result[0].location_id;
								ivr.strategy = result[0].strategy;
								cb(err);
							}else{
								cb(err);
							}								
						});			
					}
				], function (err) {
					callback(err, ivr);
				});
			break;
			case 'interactiveVoice':
				callback(null, ivr);
			break;
			case 'schedule':
				async.waterfall([
					function (cb) {
						if(ivr.hunt_option_id){
							overFlowNumberModel.read(ivr.hunt_option_id, function(err, huntOptions){
								if(err){cb(err);}
								ivr.overflowNumbers = huntOptions;
								cb(err);
							});
						}else{
							cb(null);
						}
					},
					function(cb){
						var schedule_route_id = ivr.target_did.split('://')[1];
                         qry = "SELECT csr.default_ringto as default_ringto, csr.vm_enabled as default_vm,csr.timezone_name as timezone, cso.*  FROM ce_schedule_routes csr"+
						 " JOIN ce_schedule_options cso ON (csr.id = cso.schedule_route_id) WHERE schedule_route_id = "+schedule_route_id+" ORDER BY cso.id";
						appModel.ctPool.query(qry, function(err, result){
							if(err){cb(err);}
							if(result.length > 0){
								var scheduleRoute = {};
								var schedule_route_id = result[0].schedule_route_id;
								var timezone =  result[0].timezone;
								var default_ringto = result[0].default_ringto;
								var vm_enabled = result[0].default_vm;
								var schedules = [];
								async.each(result, function(schedRoute, cb1){
									var tempDays = [];
									_.each(schedRoute.days, function(day){
										tempDays.push({
											id: day
										})
									});
									var schedule = {
										"option_id": schedRoute.id,
										"days" : tempDays,
										"fromTime" : calcuateTime(schedRoute.from_time),
										"toTime" : calcuateTime(schedRoute.to_time) === "11:59 PM" ? "End of Day" : calcuateTime(schedRoute.to_time),
										"ringTo": schedRoute.target_did,
										"activateVoicemail" : schedRoute.vm_enabled
									}
									if(schedRoute.ce_hunt_type_id){
										overFlowNumberModel.read(schedRoute.ce_hunt_type_id, function(err, huntOptions){
											if(err){cb1(err);}
											if(huntOptions.length > 0){
												var overflowObj = [];
												_.each(huntOptions, function(huntOption){
													if(huntOption.target_did){
														overflowObj.push({
															"overflowNumber": huntOption.target_did,
															"rings": huntOption.ring_delay/6,
															"overflow_order": huntOption.overflow_order
														});
														schedule.simultaneousRings =  huntOption.hunt_type === "simultaneous"|| huntOption.hunt_type === "Simultaneous" ? true: false;
													}
												});
												schedule.overflowNumbers = overflowObj;
												schedule.openOverflowBox = true;
												schedule.isAddOverflow = true;
											}else{
												schedule.overflowNumbers=[{
													"overflowNumber": "",
													"rings": 3,
													"overflow_order": 1
												}];
												schedule.openOverflowBox = false;
												schedule.isAddOverflow = false;
											}
											schedules.push(schedule);
											cb1(err);
										});
									}else{
										schedule.overflowNumbers=[{
											"overflowNumber": "",
											"rings": 3,
											"overflow_order": 1
										}];
										schedule.openOverflowBox = false;
										schedule.isAddOverflow = false;
										schedules.push(schedule);
										cb1(null);
									}
								},
								function(err){
									scheduleRoute.schedule_route_id = schedule_route_id;
									scheduleRoute.timezone = timezone;
									scheduleRoute.default_ringto = default_ringto;
									scheduleRoute.vm_enabled = vm_enabled;
									scheduleRoute.schedules = _.sortBy(schedules, 'option_id');;
									ivr.scheduleRoute = scheduleRoute;
									cb(err);
								});
						    }else{
							cb(err);
						  }
						});
					}
				],function (err) {
					callback(err, ivr);
				});
			break;
			default:
				callback(null, ivr);
		}
	},
	getOutboundCallerIDsList: function(req, provisioned_route_id, res){
				var oulist = req.user.orglist;
				var qry = "SELECT DISTINCT pn.number FROM provisioned_route pr ";
				qry += "LEFT JOIN ce_call_flows ce ON (ce.provisioned_route_id = pr.provisioned_route_id) ";
				qry += "LEFT JOIN provisioned_route_number prn ON (prn.provisioned_route_id = pr.provisioned_route_id ) ";
				qry += "LEFT JOIN phone_number pn ON (pn.number_id = prn.phone_number_id) ";
				qry += "WHERE pr.provisioned_route_ou_id IN (" + oulist + ") AND pr.provisioned_route_status = 'active' ";
				qry += "AND pn.number_status = 'provisioned' ORDER BY pn.number";
				appModel.ctPool.query(qry, function(err,data){
					var callerIDs = [];
					for(var i = 0; i < data.length; i++){
						Key = data[i].number;
						Value = data[i].number;
						if(data[i].number != null){
							var numberObj = {
								key : formatPhoneNumber(data[i].number),
								value: data[i].number
							}
							callerIDs.push(numberObj);
						}
					}
					var local_number = {
						key: "Local Number",
						value: "LOCAL_NUMBER"
					};
					var random_number = {
						key: "Random Number",
						value: "RANDOM_NUMBER"
					};
					var caller_Number = {
						key: "Caller Number",
						value: "CALLER_NUMBER"
					};
					callerIDs.unshift(local_number);
					callerIDs.unshift(random_number);
					callerIDs.unshift(caller_Number);
					res(err, callerIDs);
				});
	},
	getCallFlowIdsByProvisionedRouteIds: function(pr_ids, res){
		var qry = "SELECT cf.id FROM " + sptable + " AS cf WHERE cf.app_id='CT' AND cf.provisioned_route_id in (" + pr_ids + ")";
		appModel.ctPool.query(qry, function(err,data){
			res(err, data);
		});
	},
	getCallFlowIdsByCeProvisionedRouteIds: function(pr_ids, res){
		var qry = "SELECT cf.id FROM " + table + " AS cf WHERE cf.app_id='CT' AND cf.provisioned_route_id in (" + pr_ids + ")";
		appModel.cePool.query(qry, function(err,data){
			res(err, data);
		});
	},
	clearRoutings: function(call_flow_id, loggerData, res){
		var qry = "SELECT provisioned_route_id,routable_type, routable_id FROM " + sptable + " WHERE id = " + call_flow_id + " AND app_id='CT' ";
		appModel.ctPool.query(qry, function(err, data){
			switch (data[0].routable_type) {
				case 'IvrRoute2':
					var ivrRouteModel = require('./ivrRouteModel');
					ivrRouteModel.remove(ctTransModel, data[0].routable_id, loggerData, function(err){
						if (err) {
							res(err);
						} else {
							var ivrOptionModel = require('./ivrOptionModel');
							ivrOptionModel.removeByIvrRouteId(ctTransModel,data[0].routable_id, function(err){
									res(err);
							});
						}
					});
				break;
				case 'PercentageBasedRoute':
					var percentageRouteModel = require('./percentageRouteModel');
					oldPercentageData = [];
					var qry = " SELECT percentage, target_did,modified FROM ce_percentage_route_options WHERE percentage_route_id ="+ data[0].routable_id;
					appModel.ctPool.query(qry,function(err,percent){
						if(err){return res("There is some issue fetching existing percentage route data "+err);}
						if(percent.length>0){
							for(var i=0; i<percent.length; i++){
								oldPercentageData.push({'ring_to':percent[i].target_did, 'percentage':percent[i].percentage, 'modified':percent[i].modified});
							}
						}
						percentageRouteModel.remove(ctTransModel, data[0].routable_id, function(err){
							if (err) {
								res(err);
							} else {
								var percentageRouteOptionModel = require('./percentageRouteOptionModel');
								percentageRouteOptionModel.removeByPercentageRouteId(ctTransModel,data[0].routable_id, function(err){
									res(err);	
								});
							}
						});
					});
					
				break;
				case 'GeoRoute':
					var geoOptionModel = require('./geoOptionModel');
					geoOptionModel.removeByGeoRouteId(ctTransModel, data[0].routable_id, function(err){
						res(err);
					});
				break;
				case 'VoicemailRoute':
					res(null);
				break;
				case 'SimpleRoute':
					res(null);
				break;
				case 'OutboundRoute':
					var qry = "DELETE FROM ce_outbound_routes WHERE id = " + data[0].routable_id;
					var deleteData = {
						which: 'query',
						qry: qry
					};
					ctTransModel.query(deleteData, function(err, result) {
						if (err) { console.log('ERROR in deleteCallFlows deleting ce_scheduled_routes '+err); }
						res(null);
					});					
				break;
				case 'ScheduleRoute':
				console.log("clearing schedule routes")
				callFlow.deleteScheduleRoutes(ctTransModel,data[0].routable_id,function(err){
					res(err);
				});
				break;
				default:
					res('Unable to clear routings.');
			}

		});
	},
	validate_csv_data: function(data, res){
		var all_ou_ids = data['ou_ids'];
		var all_provisioned_route_ids = data['provisioned_route_ids'];
		var return_data = [];
		var provisioned_route_ids = unique(data['provisioned_route_ids']);
		var channel_ids = unique(data['channel_ids']);
		var ouIds = unique(data['ou_ids']);
		async.parallel([
		  	function(callback){
				var qry = "select channel_id from channel where channel_id in(" +channel_ids+ ")";
				appModel.ctPool.query(qry, function(err,data){
					if(err) callback(err);
					if(data !== undefined){
						if(data.length > 0){
							var ret_channel_ids = [];
							async.eachSeries(data, function(row, cb1) {
								ret_channel_ids.push(row.channel_id);
								cb1(null);
							}, function(err) {
								if (err) { return res(err); }
								callback(null, ret_channel_ids);
							});
						} else{
							callback(null);
						}
					}else{
						callback(null);
					}
				});
	 	 	},
		  	function(callback){
		  		var qry = "select org_unit_id from org_unit where org_unit_id in(" +ouIds+ ")";
				appModel.ctPool.query(qry, function(err,data){
					if(err) callback(err);

					if(data.length > 0){
						var ret_OuIds = [];
						async.eachSeries(data, function(row, cb1) {
							ret_OuIds.push(row.org_unit_id);
							cb1(null);
						}, function(err) {
							if (err) { return res(err); }
							callback(null, ret_OuIds);
						});
					} else{
						callback(null);
					}
				});
		  	},
		  	function(callback){
		  		var qry = "select provisioned_route_id,provisioned_route_ou_id from provisioned_route where provisioned_route_id in(" +provisioned_route_ids+ ")";
				appModel.ctPool.query(qry, function(err,data){
					if(err) callback(err);

					if(data.length > 0){
						var ret_provisioned_route_ids = {};
						async.eachSeries(data, function(row, cb1) {
							ret_provisioned_route_ids[row.provisioned_route_id] = row.provisioned_route_ou_id;
							cb1(null);
						}, function(err) {
							if (err) { return res(err); }

							callback(null, ret_provisioned_route_ids);
						});
					} else{
						callback(null);
					}
				});
		  	},
		  // 	function(callback){
		  // 		var pr_route_ou = [];
		  // 		var i = 0;

		  // 		async.eachSeries(all_provisioned_route_ids, function(prid,cb1) {
		  // 			async.eachSeries(all_ou_ids,function(ouid,cb2){
			 //  			var qry = "select provisioned_route_id, provisioned_route_ou_id from provisioned_route where provisioned_route_id =" +prid+ " and provisioned_route_ou_id=" +ouid+ " limit 1";
			 //  			appModel.ctPool.query(qry, function(err,data){
			 //  				console.log("data", data);
				// 			if(err) callback(err);
				// 			if(data.length > 0){
				// 				pr_route_ou.push({"provisioned_route_id": data[0].provisioned_route_id, "provisioned_route_ou_id": data[0].provisioned_route_ou_id});
				// 				console.log("pr_route_ou", pr_route_ou);
				// 			}
				// 			cb2(null);
				// 		});
			 //  			i++;
			 //  		},
			 //  		function(err){
			 //  			cb1(null)
			 //  		});
				// }, function(err) {
				// 	if (err) { return res(err); }
				// 	// console.log("pr_route_ou------------", pr_route_ou);
				// 	callback(null, pr_route_ou);
				// });
		  // 	}
	  	], function (err, results) {
			if(err) res(err);
			else{
		  		var result = [{"ret_channel_ids": results[0], "org_unit_id_data": results[1], "provisioned_route_id_data": results[2]}];
		  		res(null, result);
			}
		});
	},
	createCallFlowByCsv: function(row, callback){
		var ctTrans = new ctTransactionModel.begin(function(err){
			var qry = "INSERT INTO call (call_started, disposition, duration, org_unit_id, provisioned_route_id, repeat_call, ring_to, source, tracking) VALUES";
			qry += "('" +row.call_started+ "','" +row.disposition+ "'," +row.duration+ "," +row.org_unit_id+ "," +row.provisioned_route_id+ "," +row.repeat_call+ "," +row.ring_to+ "," +row.source+ "," +row.tracking +") RETURNING call_id";
			ctTrans.query(qry, function(err, data){
				if(err){return(err);}
				var call_id = data[0]['call_id'];

				qry = "INSERT INTO call_detail (call_id, bill_second, call_ended, call_mine_status, call_value, cdr_source, is_outbound, ring_to_name, dni_log_id, channel_id) VALUES";
				qry += "(" +call_id+", "+row.billing_seconds+ ",'" +row.call_ended+ "','" +row.call_mine_status+ "'," +row.call_value+ ",'" +row.cdr_source+ "'," +row.is_outbound+ ",'" +row.ring_to_name +"','" +row.dni_log_id+ "'," +row.channel_id+ ")";

				ctTrans.query(qry, function(err, data){
					if(err){
						ctTrans.rollback(function(){});
						return(err);
					}else{
						ctTrans.commit(function(){});
						callback(null, call_id);
					}
				});
			});
		});
	},
	deleteScheduleRoutes: function (model,routable_id,res){
		if(routable_id){
			var qry = "DELETE FROM ce_schedule_routes WHERE id = " + routable_id;
			var deleteData = {
				which: 'query',
				qry: qry
			};
			model.query(deleteData, function(err, result) {
				if (err) { console.log('ERROR in deleteCallFlows deleting ce_scheduled_routes '+err); }
				res(err);
			});
		}else{
			res(null);
		}
		
			
	},	
	saveMultiIVR: function(ivrs_data, model, ivr_route_id, parent_id,provisioned_route_id, callback){
		async.each(ivrs_data, function(ivr, cb){
			ivr.ivr_route_id = ivr_route_id;
			callFlow.saveMultiIvrOption(ivr, model, ivr_route_id , parent_id,provisioned_route_id,function(err, ret){
				cb(err);
			});
		}, function(err){
			callback(err);
		});
	},
	saveMultiIvrOption: function(ivr, model, ivr_route_id, parent_id,provisioned_route_id, callback){
		switch(ivr.action){
			case 'simple':
				callFlow.saveSimpleIVRRoute(ivr, model, ivr_route_id , parent_id,provisioned_route_id,function(err, ret){
					callback(err, ret);
				});
				break;
			case 'hangup':
				callFlow.saveSimpleIVRRoute(ivr, model, ivr_route_id, parent_id,provisioned_route_id, function (err, ret) {
					callback(err, ret);
				});
				break;
			case 'geo':
				callFlow.saveGeoIVRRoute(ivr, model, ivr_route_id , parent_id,provisioned_route_id,function(err, ret){
					callback(err, ret);
				});
			break;

			case 'interactiveVoice':
				callFlow.saveIVRRoute(ivr, model, ivr_route_id , parent_id,provisioned_route_id,function(err, ret){
					callback(err, ret);
				});
			break;
			case 'schedule':
				callFlow.saveScheduleIVRRoute(ivr, model, ivr_route_id , parent_id,provisioned_route_id,function(err, ret){
					callback(err, ret);
				});
			break;
			default:
				callback('Invalid Route Type');
		}
	},
	saveSimpleIVRRoute: function(ivr, model, ivr_route_id, parent_id,provisioned_route_id, callback){
		console.log("\n-----------------------------\n"+JSON.stringify(ivr)+"\n----------------------\n")
		var message = 'blank://';
		var message_enabled = false;
		var whisper_message_enabled = false;
		var whisper_message = 'blank://';
		var record_enabled = false;
		var webhook_enabled = false;
		var vm_enabled = false;
		var play_disclaimer = 'before'
		var target_did = ''
		if (ivr.whisper_enabled && ivr.whisper_message_type) {
			whisper_message_enabled = true;
			switch (ivr.whisper_message_type) {
				case 'text':
					whisper_message = 'tts://' + ivr.whisper_message;
				break;
				case 'file':
					whisper_message = 'file://'+ivr.whisper_message + '.wav';
				break;
			}
		}

		if (ivr.message_type) {
			switch (ivr.message_type) {
				case 'text':
					message = 'tts://' + ivr.message;
				break;
				case 'file':
					message = 'file://'+ivr.message + '.wav';
				break;
			}
		}
		if (ivr.message_enabled){
			message_enabled = true;
		}
		if (ivr.webhook_enabled){
			webhook_enabled = true;
		}
		if (ivr.record_enabled){
			record_enabled = true;
			play_disclaimer = ivr.play_disclaimer
		}
		if (ivr.activateVoiceMail){
			vm_enabled = true;
		}

		if (ivr.ringToData && ivr.ringToData.ringtoNum){
			target_did = ivr.ringToData.ringtoNum;
		}else{
			callback('invalid rign to number');
		}

		var ivrOptionData = {
			action_order: ivr.action_order,
			destination: ivr.destination,
			target_did: target_did,
			ouid: ivr.ouid,
			ivr_route_id: ivr_route_id,
			message_enabled: message_enabled,
			record_enabled: record_enabled,
			play_disclaimer: play_disclaimer,
			webhook_enabled: webhook_enabled,
			key_press: ivr.keypress,
			ivr_option_type: 'simple',
			vm_enabled : vm_enabled,
			whisper_enabled: whisper_message_enabled,
			whisper_message: whisper_message
		};

		if (ivr.back_press !== undefined && ivr.back_press !== null) {
			ivrOptionData.back_press = ivr.back_press;
		}
		if (ivr.message) {
			ivrOptionData.message = message;
		}
		if (parent_id) {
			ivrOptionData.parentid = parent_id;
		}

		if(ivr.ringToData && ivr.ringToData.overflowNumbers && ivr.ringToData.overflowNumbers.length > 0 && ivr.ringToData.overflowNumbers[0].overflowNumber != ''){
			var hunt_type = 'overflow';
			if(ivr.ringToData.overflowNumbers && ivr.ringToData.overflowNumbers.length > 0 && ivr.ringToData.isSimultaneousRing == true) {
				hunt_type = 'Simultaneous';
			}
			if(ivr.ringToData.overflowNumbers && ivr.ringToData.overflowNumbers.length > 0 && ivr.ringToData.isSimultaneousRing == false) {
				hunt_type = 'Rollover';
			}

			overFlowNumberModel.save(ivr.ringToData.overflowNumbers, ivr.ouid, hunt_type, ctTransModel,provisioned_route_id, function(err, hunt_option_id){
				if (hunt_option_id) {
					ivrOptionData.hunt_option_id = hunt_option_id;
				}
				var insertData = {
					which: 'insert',
					table: 'ce_ivr_options2',
					values: ivrOptionData
				};
				model.query(insertData, function(err, data){
					callback(err, data);
				});
			});
		}else{
			var insertData = {
				which: 'insert',
				table: 'ce_ivr_options2',
				values: ivrOptionData
			};
			model.query(insertData, function(err, data){
				callback(err, data);
			});
		}
	},
	saveGeoIVRRoute: function(ivr, model, ivr_route_id, parent_id,provisioned_route_id, callback){
		var geo_route = ivr.geoData.geo_rt;		
		async.waterfall([
			function(cb){
				if (!geo_route.play_branding) {
					geo_route.play_branding = true;
				}
				if (!geo_route.allow_manual_entry) {

					geo_route.allow_manual_entry = true;
				}
				if (ivr.geoData.geo_opt.location_ids) {
					geo_route.location_id = ivr.geoData.geo_opt.location_ids;
				}
				if (ivr.geoData.geo_opt.default_ringto) {
					geo_route.default_ringto = ivr.geoData.geo_opt.default_ringto;
				}
				var insertData = {
					which: 'insert',
					table: 'ce_geo_routes',
					values: geo_route
				};
				model.query(insertData,function(err, result){
					cb(err,result);
				});
			},
			function(geo_route_result, cb){
				async.parallel([
					function(cb1){
						var message = 'blank://';
						var message_enabled = false;
						var record_enabled = false;
						var webhook_enabled = false;
						var whisper_enabled = false;
						var play_disclaimer = 'before';
						var target_did = '';
						var whisper_message = 'blank://';
						var vm_enabled = false;
						if (ivr.message_type) {
							switch (ivr.message_type) {
								case 'text':
									message = 'tts://' + ivr.message;
								break;
								case 'file':
									message = 'file://'+ivr.message + '.wav';
								break;
							}
						}

						if (ivr.whisper_enabled && ivr.whisper_message_type) {
							whisper_enabled = true;
							switch (ivr.whisper_message_type) {
								case 'text':
									whisper_message = 'tts://' + ivr.whisper_message;
								break;
								case 'file':
									whisper_message = 'file://'+ivr.whisper_message + '.wav';
								break;
							}
						}			

						if (ivr.message_enabled){
							message_enabled = true;
						}
						if (ivr.webhook_enabled){
							webhook_enabled = true;
						}
						if (ivr.record_enabled){
							record_enabled = true;
							play_disclaimer = ivr.play_disclaimer;
						}

						if (ivr.activateVoiceMail){
							vm_enabled = true;
						}

						if (geo_route_result) {
							target_did = 'geo_route://' + geo_route_result[0].id;
						}else{
							cb1('Error in geo Route');
						}						
						var ivrOptionData = {
							action_order: ivr.action_order,
							destination: ivr.destination,
							target_did: target_did,
							ouid: ivr.ouid,
							ivr_route_id: ivr_route_id,
							message_enabled: message_enabled,
							record_enabled: record_enabled,
							webhook_enabled: webhook_enabled,
							play_disclaimer: play_disclaimer,
							whisper_enabled: whisper_enabled,
							whisper_message: whisper_message,
							key_press: ivr.keypress,
							ivr_option_type: 'geo',
							vm_enabled: vm_enabled
						};
						if (ivr.back_press !== undefined && ivr.back_press !== null) {
							ivrOptionData.back_press = ivr.back_press;
						}
						if (parent_id) {
							ivrOptionData.parentid = parent_id;
						}
						if (ivr.message) {
							ivrOptionData.message = message;
						}
						if(ivr.geoData && ivr.geoData.overflowNumbers && ivr.geoData.overflowNumbers.length > 0 && ivr.geoData.overflowNumbers[0].overflowNumber != ''){
							var hunt_type = 'overflow';
							if(ivr.geoData.overflowNumbers && ivr.geoData.overflowNumbers.length > 0 && ivr.geoData.isSimultaneousRing == true) {
								hunt_type = 'Simultaneous';
							}
							if(ivr.geoData.overflowNumbers && ivr.geoData.overflowNumbers.length > 0 && ivr.geoData.isSimultaneousRing == false) {
								hunt_type = 'Rollover';
							}
							overFlowNumberModel.save(ivr.geoData.overflowNumbers, ivr.ouid, hunt_type, ctTransModel, provisioned_route_id,function(err, hunt_option_id){
								if (hunt_option_id) {
									ivrOptionData.hunt_option_id = hunt_option_id;
								}
								var insertData = {
									which: 'insert',
									table: 'ce_ivr_options2',
									values: ivrOptionData
								};
								model.query(insertData, function(err, data){
									callback(err, data);
								});
							});
						}else{
							var insertData = {
								which: 'insert',
								table: 'ce_ivr_options2',
								values: ivrOptionData
							};
							model.query(insertData, function(err, data){
								callback(err, data);
							});
						}
					}
					],
					function(err){
						cb(err);
					}
				);
			}
			],
			function(err){
				callback(err, ivr_route_id);
			}
		);
	},
	saveIVRRoute: function(ivr, model, ivr_route_id, parent_id, provisioned_route_id,callback){
		var message = 'blank://';
		var whisper_message = 'blank://';
		var message_enabled = false;
		var whisper_enabled = false;
		var record_enabled = false;
		var play_disclaimer = 'before';
		var webhook_enabled = false;
		var target_did = '';
		var vm_enabled = false;
		if (ivr.message_type) {
			switch (ivr.message_type) {
				case 'text':
					message = 'tts://' + ivr.message;
				break;
				case 'file':
					message = 'file://'+ivr.message + '.wav';
				break;
			}
		}
		if (ivr.message_enabled){
			message_enabled = true;
		}
		if (ivr.webhook_enabled){
			webhook_enabled = true;
		}
		if (ivr.record_enabled){
			record_enabled = true;
			play_disclaimer = ivr.record_enabled;
		}
		if (ivr.activateVoiceMail){
			vm_enabled = true;
		}

		var ivrOptionData = {
			action_order: ivr.action_order,
			destination: ivr.destination,
			target_did: target_did,
			ouid: ivr.ouid,
			ivr_route_id: ivr_route_id,
			message_enabled: message_enabled,
			record_enabled: record_enabled,
			play_disclaimer: play_disclaimer,
			webhook_enabled: webhook_enabled,
			whisper_enabled: whisper_enabled,
			whisper_message: whisper_message,
			key_press: ivr.keypress,
			ivr_option_type: 'interactiveVoice',
			vm_enabled : vm_enabled
		};
		if (ivr.back_press !== undefined && ivr.back_press !== null) {
			ivrOptionData.back_press = ivr.back_press;
		}
		if (ivr.message) {
			ivrOptionData.message = message;
		}
		if (parent_id) {
			ivrOptionData.parentid = parent_id;
		}
		var insertData = {
			which: 'insert',
			table: 'ce_ivr_options2',
			values: ivrOptionData
		};
		model.queryRet(insertData, function(err, data){
			if(err){ callback(err);}
			if(ivr.ivrData && ivr.ivrData.length > 0){
				callFlow.saveMultiIVR(ivr.ivrData, model, ivr_route_id, data.insertId,provisioned_route_id, function(){
					callback(err, data);
				});
			}
		});
	},
	saveScheduleIVRRoute: function(ivr, model, ivr_route_id, parent_id, provisioned_route_id,callback){
	//use transaction model and also use default switch case
	var schedule_data = ivr.scheduleRoute;
	var lookerValues = [];
	var cnt =0;
	if(schedule_data.default_ringto === undefined){
		schedule_data.default_ringto = '';
	}
		async.waterfall([
			function(cb0){
				var timeZoneData = {
					timezone_name: schedule_data.timezone,
					default_ringto:schedule_data.default_ringto,
					vm_enabled:schedule_data.activate_voicemail
				}
				var insertData = {
					which: 'insert',
					table: 'ce_schedule_routes',
					values: timeZoneData
				};
				model.query(insertData, function(err, result){
					if(err){
						cb0(err)
					}else{
						console.log("+++++++++++++", result);
						data.routable_id = result[0].id;
						cb0(null, result);
					}
				});
			},
			function(schedule_ids,cb1){
					var message = 'blank://';
					var message_enabled = false;
					var record_enabled = false;
					var webhook_enabled = false;
					var whisper_enabled = false;
					var play_disclaimer = 'before';
					var target_did = '';
					var whisper_message = 'blank://';
					var vm_enabled = false;
					if (ivr.message_type) {
						switch (ivr.message_type) {
							case 'text':
								message = 'tts://' + ivr.message;
							break;
							case 'file':
								message = 'file://'+ivr.message + '.wav';
							break;
						}
					}
					if (ivr.whisper_enabled && ivr.whisper_message_type) {
						whisper_enabled = true;
						switch (ivr.whisper_message_type) {
							case 'text':
								whisper_message = 'tts://' + ivr.whisper_message;
							break;
							case 'file':
								whisper_message = 'file://'+ivr.whisper_message + '.wav';
							break;
						}
					}			
					if (ivr.message_enabled){
						message_enabled = true;
					}
					if (ivr.webhook_enabled){
						webhook_enabled = true;
					}
					if (ivr.record_enabled){
						record_enabled = true;
						play_disclaimer = ivr.play_disclaimer;
					}
					if (ivr.activateVoiceMail){
						vm_enabled = true;
					}
					if (schedule_ids) {
						target_did = 'schedule_route://' + schedule_ids[0].id;
						}else{
						cb1('Error in schedule Route');
					}						
					var ivrOptionData = {
						action_order: ivr.action_order,
						destination: ivr.destination,
						target_did: target_did,
						ouid: ivr.ouid,
						ivr_route_id: ivr_route_id,
						message_enabled: message_enabled,
						record_enabled: record_enabled,
						webhook_enabled: webhook_enabled,
						play_disclaimer: play_disclaimer,
						whisper_enabled: whisper_enabled,
						whisper_message: whisper_message,
						key_press: ivr.keypress,
						ivr_option_type: 'schedule',
						vm_enabled: vm_enabled
					};
					if (ivr.back_press !== undefined && ivr.back_press !== null) {
						ivrOptionData.back_press = ivr.back_press;
					}
					if (parent_id) {
						ivrOptionData.parentid = parent_id;
					}
					if (ivr.message) {
						ivrOptionData.message = message;
					}
					if(ivr.schedule_data && ivr.schedule_data.overflowNumbers && ivr.schedule_data.overflowNumbers.length > 0 && ivr.schedule_data.overflowNumbers[0].overflowNumber != ''){
						var hunt_type = 'overflow';
						if(ivr.schedule_data.overflowNumbers && ivr.schedule_data.overflowNumbers.length > 0 && ivr.schedule_data.isSimultaneousRing == true) {
							hunt_type = 'Simultaneous';
						}
						if(ivr.schedule_data.overflowNumbers && ivr.schedule_data.overflowNumbers.length > 0 && ivr.schedule_data.isSimultaneousRing == false) {
							hunt_type = 'Rollover';
						}
						overFlowNumberModel.save(ivr.schedule_data.overflowNumbers, ivr.ouid, hunt_type, ctTransModel, provisioned_route_id,function(err, hunt_option_id){
							if (hunt_option_id) {
								ivrOptionData.hunt_option_id = hunt_option_id;
							}
							var insertData = {
								which: 'insert',
								table: 'ce_ivr_options2',
								values: ivrOptionData
							};
							model.query(insertData, function(err, data){
								cb1(err, data);
							});
						});
					}else{
						var insertData = {
							which: 'insert',
							table: 'ce_ivr_options2',
							 values: ivrOptionData
						};
						  model.query(insertData, function(err, data){
							   if(err){
								   cb1(err)
							   }else{
								cb1(null, schedule_ids);
							   }
							
						});
					}
			},
			function(schedule_ids, cb){
				async.eachSeries(schedule_data.schedules, function(schedule, cb){
					async.waterfall([
						function(callback){
							var hunt_type = 'overflow';	
							if(schedule.overflowNumbers && schedule.overflowNumbers.length > 0 && schedule.simultaneousRings == true) {
								hunt_type = 'Simultaneous';
							}
							if(schedule.overflowNumbers && schedule.overflowNumbers.length > 0 && schedule.simultaneousRings == false) {
								hunt_type = 'Rollover';
							}
							huntTypeData = {
								hunt_type: hunt_type,
								retry_count: 0,
								provisioned_route_id:provisioned_route_id
							}
							var insertData= {
								which: 'insert',
								table: 'ce_hunt_types',
								values: huntTypeData								
							};
							model.query(insertData, function(err,result) {
								if(err){
									callback(err);
								}
								else{
									if(result.length > 0){
										schedule.hunt_type = result[0].id;
										callback(null)
									}
								}
							});	
						},function (callback) {
								// insert overflow numbers of each schedule---into--> hunt_options in db 
									if(schedule.overflowNumbers && schedule.overflowNumbers.length > 0){
										var hunt_option_result = [];
										var values =[];
										_.forEach(schedule.overflowNumbers, function(num){
											var	ring_delay =18;
											if(num.rings){
												ring_delay = parseInt(num.rings) * 6;
											}
											values.push("(" + num.unmaskNumber + "," + ring_delay + "," +  ivr.ouid+ "," + null + "," + schedule.hunt_type +","+num.overflow_order+")");
										});
										if(values.length >0){
											var qry = "INSERT INTO ce_hunt_options (target_did,ring_delay,ouid,lastcall,hunt_route_id, overflow_order) values " + values.join(',') ;
											var insertData= {
												which: 'query',
												qry: qry
											};
											model.query(insertData, function(err,result) {
												if(err){callback(err);} 
												else {
													_.each(result,function(overflowId){
														hunt_option_result.push(overflowId.id)
													})
													schedule.target_did = hunt_option_result
													callback(null)
												}
											});
										}
										else {callback(null)}
									}
									else{
										callback(null)
									}
							},
						function (callback) {
							// insert into ce_schedule_options
							var date_timestamp = f.mysqlTimestamp();
							var fromTime = moment(schedule.fromTime, ["h:mm A"]).format("HH:mm");
							if(schedule.toTime === "End of Day")
								schedule.toTime = "11:59 PM"
								var toTime = moment(schedule.toTime, ["h:mm A"]).format("HH:mm");
								var days = "{" 
									_.each(schedule.days,function(day){
										if(schedule.days.indexOf(day)==schedule.days.length-1){
											days+=day.id
										}else days+=day.id +","
								})
								days+="}"
								var qry= "INSERT INTO ce_schedule_options (schedule_route_id,ce_hunt_type_id,target_did,days,from_time,to_time,created_at,updated_at,vm_enabled) VALUES ('"+ schedule_ids[0].id+"' , '"+schedule.hunt_type+"' , '"+ schedule.ringTo+"' , '"+ days+ "' , '"+fromTime+"' , '"+toTime+"' , '"+date_timestamp+"' , '"+date_timestamp+"', '"+schedule.activateVoicemail+"');";
								var insertData= {
									which: 'query',
									qry: qry
							};
								model.query(insertData, function(err, result){
									if(err){
										callback(err)
									}
									else {
										cnt++;
										lookerValues.push("('"+  schedule_ids[0].id +"' , '"+schedule.hunt_type+"' , '"+ schedule.ringTo+"' , '"+ days+ "' , '"+fromTime+"' , '"+toTime+"' , '"+date_timestamp+"' , '"+date_timestamp+"', '"+schedule.activateVoicemail+"')");
										if(schedule_data.schedules.length == cnt ){
											if(schedule_data.default_ringto !== undefined && schedule_data.default_ringto !== '' && schedule_data.default_ringto !== null){
												var default_hunt_type = 0;
												lookerValues.push("('"+  schedule_ids[0].id +"','"+default_hunt_type+"','"+ schedule_data.default_ringto+"' , '"+ days+ "' , '"+fromTime+"' , '"+toTime+"' , '"+date_timestamp+"' , '"+date_timestamp+"', '"+schedule.activateVoicemail+"')");
											}
											var qry= 'INSERT INTO looker_schedule_options (schedule_route_id,ce_hunt_type_id,target_did,days,from_time,to_time,created_at,updated_at,vm_enabled) VALUES '+ lookerValues.join(',');
											var insertData= {
												which: 'query',
												qry: qry
											};
											model.query(insertData, function(err, result){
												if(err){
													callback(err)
												}
												else{
													callback(null);
												}	
											});		
										} else callback(null);
									}	
								});	
						}],function (err, result) {
							cb(err, result);
					});
				},function(err) {
					if (err) {
						return cb(err);
					} else {
						cb(null)
					}
			});
	   	}
	],function(err){
		callback(err, ivr_route_id);
	});
	}
};

module.exports = callFlow;

function multiIVRCallFlow (model, which, data,provisioned_route_id, res){
	var ivrs_data = data.ivrs;
	async.waterfall([
		function(cb){
			var ivrRouteData = {
				repeat_greeting: true
			};
			var insertData = {
				which: 'insert',
				table: 'ce_ivr_routes2',
				values: ivrRouteData
			};
			model.queryRet(insertData, function(err, geo_route_data){
				cb(err, geo_route_data);
			});
		},function(d, cb){
			var ivr_route_id = d.insertId;
			callFlow.saveMultiIVR(ivrs_data, model, ivr_route_id , undefined,provisioned_route_id, function(err){
				var ret = {};
				ret['ivr_id'] = ivr_route_id;
				cb(err, ret);
			});
		}
	],
	function(err, ret){
		res(err, ret);
	});
}

function geoCallFlow(which, data, res){
	if(data.geo_route.strategy) var strategy = data.geo_route.strategy;
	var ret = {};
	async.waterfall([
		function(cb){
			switch(which) {
				case 'insert':
					console.log("\n--------------------\ngeoCallFlow: "+JSON.stringify(data)+"\n-------------------\n")
					if (!data.geo_route.play_branding) {
						data.geo_route.play_branding = true;
					}
					if (!data.geo_route.allow_manual_entry) {
						data.geo_route.allow_manual_entry = true;
					}
					if (data.geo_options && data.geo_options.location_ids) {
						data.geo_route.location_id = data.geo_options.location_ids[0];
					}
					if (data.default_ringto) {
						data.geo_route.default_ringto = data.default_ringto;
					}

					if(data.geo_route.strategy !== 'claimedState' &&  data.geo_route.strategy !== 'Npa' && data.geo_route.message_enabled){
						data.geo_route.message_enabled = true;
						switch (data.geo_route.message_type) {
							case 'text':
								data.geo_route.message = 'tts://' + data.geo_route.message;
							break;
							case 'file':
								data.geo_route.message = 'file://' + data.geo_route.message + '.wav';
							break;
							default:
								data.geo_route.message = 'tts://';
						}
					}else{
						data.geo_route.message_enabled = false;
						data.geo_route.message = '';
					}
					delete data.geo_route.message_type;

					var insertData = {
						which: 'insert',
						table: 'ce_geo_routes',
						values: data.geo_route
					};
					ctTransModel.query(insertData,function(err, result){
						cb(err, result);
					});
				break;
				case 'update':
					if (data.geo_route.strategy == 'Claimed') {
						data.geo_route.radius = null;
					}
					if (data.geo_options && data.geo_options.location_ids) {
						data.geo_route.location_id = data.geo_options.location_ids[0];
					}
					if (data.default_ringto) {
						data.geo_route.default_ringto = data.default_ringto;
					}
					if(data.geo_route.strategy !== 'claimedState' &&  data.geo_route.strategy !== 'Npa' && data.geo_route.message_enabled){
						data.geo_route.message_enabled = true;
						switch (data.geo_route.message_type) {
							case 'text':
								data.geo_route.message = 'tts://' + data.geo_route.message;
							break;
							case 'file':
								data.geo_route.message = 'file://' + data.geo_route.message + '.wav';
							break;
							default:
								data.geo_route.message = 'tts://';
						}
					}else{
						data.geo_route.message_enabled = false;
						data.geo_route.message = '';
					}
					delete data.geo_route.message_type;

					var updateData;
					if(data.geo_route.id) {
						updateData = {
							which: 'update',
							table: 'ce_geo_routes',
							values: data.geo_route,
							where: ' WHERE id = ' + data.geo_route.id
						};
					} else {
						if (!data.geo_route.play_branding) {
							data.geo_route.play_branding = true;
						}
						if (!data.geo_route.allow_manual_entry) {
							data.geo_route.allow_manual_entry = true;
						}
						updateData = {
							which: 'insert',
							table: 'ce_geo_routes',
							values: data.geo_route
						};
					}
					ctTransModel.query(updateData,function(err, result){
						cb(err, result);
					});
				break;
				default:
					cb('GeoRoute Not Inserted nor Updated.');
			}

		},
		function(d, cb){
			ret = d;
			var route_id;
			async.parallel([
				function(cb1){
					switch (which) {
						case 'insert':
							route_id = d[0].id;
							data.routable_id = route_id;
							data.app_id = 'CT';
							var insertData = {
								which: 'insert',
								table : sptable,
								values: data
							};
							delete insertData.values.geo_route;
							delete insertData.values.geo_options;
							ctTransModel.query(insertData, function(err){
								cb1(err);
							});
						break;
						case 'update':
							if(data.geo_route.id) {
							route_id = data.geo_route.id;
							} else {
								route_id = d[0].id;
								data.routable_id = route_id;
							}
							var date_timestamp = f.mysqlTimestamp();
							data.updated_at = date_timestamp;
							var updateData = {
								which: 'update',
								table : sptable,
								values: data,
								where: ' WHERE id = ' + data.id + " AND app_id='CT'"
							};
							delete updateData.values.geo_route;
							delete updateData.values.geo_options;
							ctTransModel.query(updateData, function(err, data){
								cb1(err);
							});
						break;
						default:
							cb1('Call Flow Not Inserted nor Updated.');
					}
				}
				],
				function(err){
					cb(err);
				});
		}
		],
		function(err){
			res(err,ret);
		});
}

function ivrCallFlow(model, which, data, res){
	console.log("\n-------------------\nIN IvrCallFlow\n---------------------------\n")
	var ivrs_data = data.ivrs;
	var ret = {};
	async.waterfall([
		function(cb){
			var ivrRouteModel = require('./ivrRouteModel');
			var ivrRouteData = {
				repeat_greeting: true
			};
			var insertData = {
				which: 'insert',
				table: 'ce_ivr_routes2',
				values: ivrRouteData
			};
			model.query(insertData, function(err, geo_route_data){
				cb(err, geo_route_data);
			});
		},
		function(d, cb){
			ret = d;
			async.parallel([
				function(cb1){
					async.waterfall([
						function(cb3){
							var cntr = 1;
							async.eachSeries(ivrs_data,  function(ivrd, cb2){
								async.waterfall([
									function(cb4){
										if (!ivrd.geo_route){
											cb4(null, null);
											return;
										}
										if (!ivrd.geo_route.play_branding) {
											ivrd.geo_route.play_branding = true;
										}
										if (!ivrd.geo_route.allow_manual_entry) {
											ivrd.geo_route.allow_manual_entry = true;
										}
										if(ivrd.geo_options && ivrd.geo_options.location_ids){
											ivrd.geo_route.location_id = ivrd.geo_options.location_ids[0];
										}
										if(ivrd.ivr && ivrd.ivr.default_ringto){
											ivrd.geo_route.default_ringto = ivrd.ivr.default_ringto;
										}
										delete ivrd.geo_route.id
										var insertData = {
											which: 'insert',
											table: 'ce_geo_routes',
											values: ivrd.geo_route
										};
										model.query(insertData,function(err, result){
											cb4(err,result);
										});

									},
									function(geo_route_result, cb4){
										async.parallel([
											function(cb5){
												var ivr = ivrd.ivr;
												var message = 'blank://';
												var message_enabled = 0;
												var record_enabled = 0;
												var webhook_enabled = 0;
												var play_disclaimer = 'before'
												var ivr_option_type = 'simple'
												if (ivr.message_type) {
													switch (ivr.message_type) {
														case 'text':
															message = 'tts://' + ivr.message;
														break;
														case 'file':
															message = 'file://' + ivr.message + '.wav';
														break;
													}
												}
												if (ivr.message_enabled === 1){
													message_enabled = true;
												}
												else {
													message_enabled = false;
												}
												if (ivr.webhook_enabled === 1){
													webhook_enabled = true;
												}
												else{
													webhook_enabled = false;
												}
												if (ivr.record_enabled === 1){
													record_enabled = true;
													play_disclaimer = ivr.play_disclaimer;
												}
												else {
													record_enabled = false;
												}
												if (geo_route_result) {
													target_did = 'geo_route://' + geo_route_result[0].id;
													ivr_option_type = 'geo';
												}else{
													target_did = ivr.target_did;
												}
												var actionOrder = cntr;
												if (ivr.action_order !== undefined) {
													actionOrder = ivr.action_order;
												}
												var ivrOptionData = {
													action_order: actionOrder,
													destination: ivr.name,
													value: ivr.value,
													target_did: target_did,
													ouid: ivr.ouid,
													ivr_route_id: d[0].id,
													key_press: ivr.value,
													message_enabled: message_enabled,
													record_enabled: record_enabled,
													play_disclaimer: play_disclaimer,
													webhook_enabled: webhook_enabled,
													ivr_option_type: ivr_option_type
												};
												
												if (ivr.message) {
													ivrOptionData.message = message;
												}

												var insertData = {
													which: 'insert',
													table: 'ce_ivr_options2',
													values: ivrOptionData
												};
												model.query(insertData, function(err, data){
													cb5(err);
												});
											}
											],
											function(err){
												cb4(err);
											}
										);
									}
									],
									function(err){
										cntr ++;
										cb2(err);
									}
								);
							},
							function(err){
								cb3(err);
							});
						}
						],
						function(err){
							cb1(err);
						}
					);
				},
				function(cb1){
					data.routable_id = d[0].id;
					data.app_id = 'CT';
					switch (which) {
						case 'insert':
							var insertData = {
								which: 'insert',
								table: sptable,
								values: data
							};
							delete insertData.values.ivrs;
							model.query(insertData, function(err, data){
								cb1(err, data);
							});
						break;
						case 'update':
							delete data.ivrs;
							var date_timestamp = f.mysqlTimestamp();
							data.updated_at = date_timestamp;
							data.routable_id = d[0].id;
							// data.default_ringto = null;
							var updateData = {
								which: 'update',
								table: sptable,
								values: data,
								where: " WHERE app_id='CT' AND id = " + data.id
							};
							model.query(updateData, function(err, data){
								cb1(err);
							});
						break;
						default:
							cb1('Call Flow Not Inserted nor Updated.');
					}

				}
			],
			function(err){
				cb(err);
			});//async parallel
		}
	],
	function(err){
	 res(err,ret);
	});//async waterfall
}

function scheduledData(model, which, data,provisioned_route_id, res){
	//use transaction model and also use default switch case
	var schedule_data = data.schedule_data;
	var lookerValues = [];
	var cnt =0;
	if(schedule_data.default_ringto === undefined){
		schedule_data.default_ringto = '';
	}
		async.waterfall([
			function(cb0){
				// inserting timezone in ce_schedule_routes
				var timeZoneData = {
					timezone_name: schedule_data.timezone,
					default_ringto: schedule_data.default_ringto,
					vm_enabled: schedule_data.vm_enabled
				}
				var insertData = {
					which: 'insert',
					table: 'ce_schedule_routes',
					values: timeZoneData
				};

				model.query(insertData, function(err, result){
					if(err){
						res(err)
					}else{
						// data.schedule_data.schedule_route_id = result[0].id;	
						data.routable_id = result[0].id;

						cb0(null);
					}
				});
			},
			function (cb0) {
			
				async.eachSeries(data.schedule_data.schedule, function(sc, cb){
					async.waterfall([
						function(callback){
							var hunt_type = 'overflow';	
											
							if(sc.overflowNumbers && sc.overflowNumbers.length > 0 && sc.simultaneousRings == true) {
								hunt_type = 'Simultaneous';
							}
							if(sc.overflowNumbers && sc.overflowNumbers.length > 0 && sc.simultaneousRings == false) {
								hunt_type = 'Rollover';
							}
							
							huntTypeData = {
								hunt_type: hunt_type,
								retry_count: 0,
								provisioned_route_id:provisioned_route_id
							}

							var insertData= {
								which: 'insert',
								table: 'ce_hunt_types',
								values: huntTypeData								
							};
							model.query(insertData, function(err,result) {
								if(err){
									callback(err);
								}
								else{
									if(result.length > 0){
										sc.hunt_type = result[0].id;
										callback(null)
									}
								}
							});	
						},
						function (callback) {
							// insert overflow numbers of each schedule---into--> hunt_options in db 
								if(sc.overflowNumbers && sc.overflowNumbers.length > 0){
									var hunt_option_result = []
									var values =[];
									_.forEach(sc.overflowNumbers, function(num){
										var	ring_delay =18;
										if(num.rings){
											ring_delay = parseInt(num.rings) * 6;
										}
										values.push("(" + num.overflowNumber + "," + ring_delay + "," + data.ouid + "," + null + "," + sc.hunt_type +","+num.overflow_order+")");
									});
			
									if(values.length >0){
										var qry = "INSERT INTO ce_hunt_options (target_did,ring_delay,ouid,lastcall,hunt_route_id, overflow_order) values " + values.join(',') ;
										var insertData= {
											which: 'query',
											qry: qry
										};
										model.query(insertData, function(err,result) {
											if(err){callback(err);} 
											else {
												_.each(result,function(overflowId){
													hunt_option_result.push(overflowId.id)
												})
												sc.target_did = hunt_option_result
												callback(null)
											}
										});
									}
									else {callback(null)}
									
								}
								else{callback(null)}
		
						},
						function (callback) {
							// insert into ce_schedule_options
							
							var date_timestamp = f.mysqlTimestamp();						
							var fromTime = moment(sc.fromTime, ["h:mm A"]).format("HH:mm");
							if(sc.toTime === "End of Day")
								sc.toTime = "11:59 PM"
							var toTime = moment(sc.toTime, ["h:mm A"]).format("HH:mm");
							
							var days = "{" 
							_.each(sc.days,function(day){
								if(sc.days.indexOf(day)==sc.days.length-1){
									days+=day.id
								}else days+=day.id +","
							})
							days+="}"
								var qry= "INSERT INTO ce_schedule_options (schedule_route_id,ce_hunt_type_id,target_did,days,from_time,to_time,created_at,updated_at,vm_enabled) VALUES ('"+ data.routable_id +"' , '"+sc.hunt_type+"' , '"+ sc.ringTo+"' , '"+ days+ "' , '"+fromTime+"' , '"+toTime+"' , '"+date_timestamp+"' , '"+date_timestamp+"', '"+sc.activateVoicemail+"');";
								var insertData= {
									which: 'query',
									qry: qry
								};
								model.query(insertData, function(err, result){
									if(err){
										callback(err)
									}
									else{
											cnt++;
											lookerValues.push("('"+ data.routable_id +"' , '"+sc.hunt_type+"' , '"+ sc.ringTo+"' , '"+ days+ "' , '"+fromTime+"' , '"+toTime+"' , '"+date_timestamp+"' , '"+date_timestamp+"', '"+sc.activateVoicemail+"')");
											if(data.schedule_data.schedule.length == cnt ){
												if(data.default_ringto !== undefined && data.default_ringto !== '' && data.default_ringto !== null){
													var default_hunt_type = 0;
													lookerValues.push("('"+ data.routable_id +"','"+default_hunt_type+"','"+ data.default_ringto+"' , '"+ days+ "' , '"+fromTime+"' , '"+toTime+"' , '"+date_timestamp+"' , '"+date_timestamp+"', '"+sc.activateVoicemail+"')");
												}
												var qry= 'INSERT INTO looker_schedule_options (schedule_route_id,ce_hunt_type_id,target_did,days,from_time,to_time,created_at,updated_at,vm_enabled) VALUES '+ lookerValues.join(',');
												var insertData= {
													which: 'query',
													qry: qry
												};
												model.query(insertData, function(err, result){
													if(err){
														callback(err)
													}
													else{
														callback(null);
													}	
												});		
											}else callback(null);
									}	
								});	
						}
					], 
					function (err, result) {
						cb(err, result);
					});
				},
				function(err) {
					
					if (err) {
						return cb0(err);
					} else {
						cb0(null)
					}
		
				});
			},
			function (cb0) {
				switch (which) {
					case 'insert':
						delete data.schedule_data;
						delete data.vm_enabled;
						data.default_ringto = null;
						var insertData = {
							which: 'insert',
							table: sptable,
							values: data,
						};
						model.query(insertData, function(err, result){
							cb0(null, result);	
						});
					break;
					case 'update':
						delete data.schedule_data;
						delete data.vm_enabled;
						var date_timestamp = f.mysqlTimestamp();
						data.updated_at = date_timestamp;
					    data.default_ringto = null;
						var updateData = {
							which: 'update',
							table: sptable,
							values: data,
							where: " WHERE app_id='CT' AND id = " + data.id
						};
						model.query(updateData, function(err, data){
							cb0(err, data);	
						});
					break;
					default:
						console.log("unable to make entry in ce_call_flows.")
					}
				}
		],function (err, result) {
			if(err)
			res(err)
			else
				res(null);
			});
}

function outboundCallFlow(model, which, data, res){
		var outboundData = {
			pin: data.outboundData.pin,
			callerid: data.outboundData.callerid
		};
			// for outbound route default_ringto should be null
			data.default_ringto = null;
			async.waterfall([
				function(cb1){
					var insertData = {
						which: 'insert',
						table: outboundTable,
						values: outboundData
					};
					model.queryRet(insertData, function(err, outboundDataId){
						cb1(err, outboundDataId.insertId);	
					});
				},
				function(outboundDataId, cb1){
					delete data.outboundData;
					data.routable_id = outboundDataId;
					var updateCECallflowsData = {
						which: 'insert',
						table: sptable,
						values: data
					};
					if(which == 'update'){
						updateCECallflowsData.which = 'update';
						updateCECallflowsData.where = " WHERE app_id='CT' AND id = " + data.id;
					}
					model.query(updateCECallflowsData, function(err, result){
						cb1(err, result);	
					});
				}],
				function(err, result){
					if(err) console.log(err);
					res(err, result);
				});
}

function percentageCallFlow(which, data,provisioned_route_id, res){
	var ret = {};
	var modified;
	async.waterfall([
		function(cb){
			if(data.id && data.id !== undefined && oldPercentageData.length){
				var date_timestamp = "CURRENT_TIMESTAMP";
				if(data.ringto_percentage.length > oldPercentageData.length || data.ringto_percentage.length < oldPercentageData.length){ modified = date_timestamp; }
				else if(data.ringto_percentage.length === oldPercentageData.length){
					_.map(data.ringto_percentage,function(percentData){
							var index = _.findLastIndex(oldPercentageData, {
								ring_to: percentData.ringto
							});
							if(index === -1){
								modified = date_timestamp;
							}else if(percentData.percentage !== oldPercentageData[index].percentage){
								modified = date_timestamp;
							}
					});
				}
				cb(null);
			}
			else cb(null);
		},
		function(cb){
			var qry = "INSERT INTO ce_percentage_route (id) SELECT MAX(id)+1 FROM ce_percentage_route";
			var insertData = {
				which: 'query',
				qry: qry
			};
			ctTransModel.queryRet(insertData, function(err, data){
				console.log("data-------",data);
				cb(err, data);
			});
		},
		function(d, cb){
			ret = d;
			async.waterfall([
				function(cb1){
					async.eachSeries(data.ringto_percentage,  function(route, cb2){
						async.waterfall([
							function(cb3){
								if(route.overflowNumbers && route.overflowNumbers.length > 0){
									var hunt_type = 'overflow';									
									if(route.overflowNumbers && route.overflowNumbers.length > 0 && route.simultaneousRings == true) {
										hunt_type = 'Simultaneous';
									}
									if(route.overflowNumbers && route.overflowNumbers.length > 0 && route.simultaneousRings == false) {
										hunt_type = 'Rollover';
									}
									overFlowNumberModel.save(route.overflowNumbers, data.ouid, hunt_type, ctTransModel,provisioned_route_id, function(err, hunt_option_id){
										cb3(err, hunt_option_id);
									});
								}else{
									cb3(null, '');
								}		
							},
							function(hunt_option_id, cb3){
								var message = '';
								var percentageRouteOptionData = {
									percentage_route_id: d.insertId,
									percentage: route.percentage,
									target_did: route.ringto,
									route_order: route.route_order,
									vm_enabled :route.activateVoicemail
								};
								if(hunt_option_id){
									percentageRouteOptionData.ce_hunt_type_id = hunt_option_id;
								}
								if(modified && modified !== undefined){
									percentageRouteOptionData.modified = modified;
								}
								else{
									if(oldPercentageData && oldPercentageData.length){
										if(oldPercentageData[0].modified !== undefined && oldPercentageData[0].modified !==null){
											percentageRouteOptionData.modified = moment(oldPercentageData[0].modified).utc().format();
										}
									}
								
								} 
								var insertData = {
									which: 'insert',
									table: 'ce_percentage_route_options',	
									values: percentageRouteOptionData
								};
								ctTransModel.query(insertData, function(err, data){
									cb3(err);
								});
							}
						],
						function(err){
							cb2(err);
						});
					},
					function(err){
						cb1(err);
					});//async eacg
				},
				function(cb1){
					data.routable_id = d.insertId;
					data.app_id = 'CT';
					switch (which) {
						case 'insert':
							var insertData = {
								which: 'insert',
								table: sptable,
								values: data
							};
							delete insertData.values.ringto_percentage;
							ctTransModel.query(insertData, function(err, data){
								cb1(err, data);
							});
						break;
						case 'update':
							delete data.ringto_percentage;
							var date_timestamp = f.mysqlTimestamp();
							data.updated_at = date_timestamp;
							data.routable_id = d.insertId;
							data.default_ringto = null;
							var updateData = {
								which: 'update',
								table: sptable,
								values: data,
								where: " WHERE app_id='CT' AND id = " + data.id
							};
							ctTransModel.query(updateData, function(err, data){
								cb1(err);
							});
						break;
						default:
							cb1('Call Flow Not Inserted nor Updated.');
					}

				}
			],
			function(err){
				cb(err);
			});//async parallel
		}
	],
	function(err){
	 res(err,ret);
	});//async waterfall
}

function jsonIvrOption(arr, callback){
      var json = {};
	async.each(data, function(d, cb){
		json[d.ivr_option] = {
			id: d.ivr_option_id,
			name : d.option_name
		};
		cb(null);
	},
	function(err){
		callback(err,json);
	});
}
function jsonScheduleOption(data, callback){
	var schedule_data = {};
	schedule_data.timezone = data[0].timezone_name;
	schedule_data.default_ringto= data[0].default_ringto;
	schedule_data.vm_enabled = data[0].default_vm;
	schedule_data.schedule = [];
	var option_ids = [];
	_.each(data, function(schData){
		var tempDays = [];
		_.each(schData.days, function(day){
			tempDays.push({
				id: day
			})
		});

		var tempHash = {
			option_id: schData.option_id,
			days: tempDays,
			fromTime: calcuateTime(schData.from_time) ,
			toTime: calcuateTime(schData.to_time) === "11:59 PM" ? "End of Day" : calcuateTime(schData.to_time),
            ringTo: schData.ringto,
            simultaneousRings: schData.hunt_type === "simultaneous"|| schData.hunt_type === "Simultaneous" ? true: false,
            activateVoicemail: schData.vm_enabled
		}

		if(schData.target_did && schData.target_did.length>0){
			overflowObj = [{
				"overflowNumber": schData.target_did,
				"rings": schData.ring_delay/6,
				"overflow_order": schData.overflow_order
			}]
			tempHash.overflowNumbers = overflowObj;
			tempHash.openOverflowBox = true;
			tempHash.isAddOverflow = true;
		}
		else{
			tempHash.overflowNumbers=[{
				"overflowNumber": "",
				"rings": 3,
				"overflow_order": 1
			}];
			tempHash.openOverflowBox = false;
			tempHash.isAddOverflow = false;
		}
		
		if(schedule_data.schedule.length === 0 || option_ids.indexOf(schData.option_id) === -1){
			schedule_data.schedule.push(tempHash);
			option_ids.push(schData.option_id);
		}else if(option_ids.indexOf(schData.option_id) > -1){
			var optionIndex = _.findLastIndex(schedule_data.schedule, {
				option_id: schData.option_id
			});
			schedule_data.schedule[optionIndex].overflowNumbers.push({
				"overflowNumber": schData.target_did,
				"rings": schData.ring_delay/6,
				"overflow_order": schData.overflow_order
			});
		}
		
	});
	callback(null, schedule_data);
}

function calcuateTime(timStr){
	var timeArray = timStr.toString().split(":");
	var calcuateTimeString = "";
	if(timeArray[0] > 12){
		console.log(timeArray[0] -12);
		calcuateTimeString = ((timeArray[0] -12) < 10 ? ("0" + (timeArray[0] -12)) : timeArray[0] -12) + ":" + timeArray[1] + " PM"
		console.log(calcuateTimeString);
	}
	else{
		if(timeArray[0]==12){
			calcuateTimeString = timeArray[0] + ":" + timeArray[1] + " PM"
		}else if(timeArray[0]==0){
			calcuateTimeString = 12 + ":" + timeArray[1] + " AM"
		}else{
			calcuateTimeString = timeArray[0] + ":" + timeArray[1] + " AM"
		}
	}
	return calcuateTimeString;
}
function jsonCallRecording(data, res){
	var err = null;
	var recordings = [];
	aws.config.loadFromPath('config/aws.json');
	var s3 = new aws.S3();
	async.each(data, function(d, cb){
		var params = {Bucket: s3yml[envVar].sp_message_bucket, Key: d.call_flow_recording_filename + '.wav' ,Expires: 86400*7};
		s3.getSignedUrl('getObject', params, function (err, url) {
			if (err) {
				cb('error: ' + err);
				return;
			}
			recordings.push({
				id: d.call_flow_recording_id,
				filename: d.call_flow_recording_filename,
				name: d.call_flow_recording_name,
				type: d.call_flow_recording_type,
				url: url
			});
			cb();
		});
	},
	function(err){
		var returnJson = {
			call_recording: recordings
		};
		res(err, returnJson);
	});
}

function jsonCustomSource(data, res){
	var r = [];
	for (var i = data.length - 1; i >= 0; i--) {
		r.push({custom_source_id:data[i].custom_source_id,
			custom_source_type:data[i].custom_source_type});
	}
	res(null,r);
}

function jsonPostCallIVR(data, res){
	var r = [];
	for (var i = data.length - 1; i >= 0; i--) {
		r.push(data[i]);
	}
	res(null,r);
}


function jsonLocation(data, res){
	var r = [];
	for (var i = data.length - 1; i >= 0; i--) {
		r.push({
			id: data[i].location_id,
			name: data[i].location_name
		});
	}
	res(null,r);
}

function jsonCallFlow(data,migrated, res){
	var dte = new Date();
	var record_call = 0;

	if (!data[0].record_until) {
		record_call = 1;
	} else {
		if (!f.inDateRange(data[0].record_until, null, dte)) {
			record_call = 1;
		}
	}

	var vm_message = null;
	var vm_type = null;
	if (data[0].vm_message) {
		var vm_message_ary = data[0].vm_message.split('//');
		if (vm_message_ary.length > 1) {
			vm_message = vm_message_ary[1];
			switch(vm_message_ary[0]){
				case 'tts:':
					vm_type = 'text';
				break;
				case 'file:':
					vm_type = 'file';
				break;
			}
		} else {
			vm_message = vm_message_ary[0];
		}
		vm_message_ary = vm_message.split('/');
		if (vm_message_ary.length == 2) {
			vm_message = vm_message_ary[1];
		}
		vm_message_ary = vm_message.split('.');
		if (vm_message_ary.length == 2) {
			vm_message = vm_message_ary[0];
		}
	}

	var whisper_message = null;
	var whisper_type = null;
	if (data[0].whisper_message) {
		var whisper_message_ary = data[0].whisper_message.split('//');
		if (whisper_message_ary.length > 1) {
			whisper_message = whisper_message_ary[1];
			switch(whisper_message_ary[0]){
				case 'tts:':
					whisper_type = 'text';
				break;
				case 'file:':
					whisper_type = 'file';
				break;
			}
		} else {
			whisper_message = whisper_message_ary[0];
		}
		whisper_message_ary = whisper_message.split('/');
		if (whisper_message_ary.length == 2) {
			whisper_message = whisper_message_ary[1];
		}
		whisper_message_ary = whisper_message.split('.');
		if (whisper_message_ary.length == 2) {
			whisper_message = whisper_message_ary[0];
		}
	}
	var message = null;
	var message_type = null;
	if (data[0].message) {
		var message_ary = data[0].message.split('//');
			message = message_ary[message_ary.length -1];
			switch(message_ary[0]){
				case 'tts:':
					message_type = 'text';
				break;
				case 'file:':
					message_type = 'file';
					message_ary = message.split('/');
					
					if (message_ary.length == 2) {
						message = message_ary[1];
					}
					message_ary = message.split('.');
					
					if (message_ary.length == 2) {
						message = message_ary[0];
					}
				break;
			}
		

		
	}
	var returnJson = {
		call_flow: {
			id: data[0].call_flow_id,
			spam_active: data[0].spam_active,
			post_call_ivr_enabled: data[0].post_call_ivr_enabled,
			webhook_enabled: data[0].webhook_enabled,
			whisper_enabled: data[0].whisper_enabled,
			whisper_type: whisper_type,
			whisper_message: whisper_message,
			message_enabled: data[0].message_enabled,
			message_type: message_type,
			message: message,
			default_ringto: data[0].default_ringto,
			routable_type: data[0].routable_type,
			record_call: record_call,
			play_disclaimer: data[0].play_disclaimer,
			vm_enabled: data[0].vm_enabled,
			dnis_as_cid: data[0].dnis_as_cid !== undefined ? data[0].dnis_as_cid : false,	
			vm_message: vm_message,
			vm_type: vm_type,
			voicemail_rings: (data[0].ring_delay / 6 ),
			org_unit_id:data[0].ouid,
			sms_enabled : data[0].sms_enabled !== undefined ? data[0].sms_enabled : false,
			sms_feature : data[0].sms_feature !== undefined ? data[0].sms_feature : false
		},
	};
	var geo_route_ids = [];
	var percentage_route_option_id = [];
	async.each(data, function(d, cb){
		async.waterfall([
			function(cb1){
				var  huntQry = "SELECT ht.*, ho.* from ce_call_flows cf"
				huntQry += " LEFT JOIN ce_hunt_types ht on ht.id = cf.hunt_option ";
				huntQry += " LEFT JOIN ce_hunt_options ho on ho.hunt_route_id = ht.id "
				huntQry += " WHERE cf.hunt_option != 0 AND cf.id = " + data[0].call_flow_id;
				appModel.ctPool.query(huntQry, function(err, huntData){
					returnJson.hunt_options = huntData;
					cb1(err);
				});
			},
			function(cb1){
				if (percentage_route_option_id.indexOf(d.percentage_route_options_id) < 0) {
					var  huntQry = "SELECT ho.target_did AS \"overflowNumber\", ho.ring_delay / 6 AS rings, ho.overflow_order, ht.hunt_type from ce_percentage_route_options as pro "
					huntQry += " LEFT JOIN ce_hunt_types ht ON(ht.id = pro.ce_hunt_type_id) ";
					huntQry += " LEFT JOIN ce_hunt_options ho on ho.hunt_route_id = ht.id "
					huntQry += " WHERE pro.id = " + d.percentage_route_options_id;
					appModel.ctPool.query(huntQry, function(err, percentHuntData){
						if(percentHuntData.length > 0 && percentHuntData[0].overflowNumber != null){
							cb1(err, percentHuntData);
						}else{
							cb1(err, []);
						}
					});
				}else{
					cb1(err, []);
				}				
			},
			function(percentHuntData, cb1){
				var location_ids = [];
				var geo_route = {};
				var ct_qry;
				var ce_qry;
				if(d.ivr_option_target_did) {
				switch(d.ivr_option_target_did.split('://')[0]){
					case 'geo_route':
						ce_qry = "SELECT * FROM ce_geo_routes WHERE id =" + d.ivr_option_target_did.split('://')[1];
					break;
					}
				}
				async.parallel([
					function(cb2){
						if (ce_qry) {
							appModel.ctPool.query(ce_qry, function(err, data){
								geo_route = data;
								cb2(err);
							});
						} else {
							cb2(null);
						}
					}
				],
				function(err){
					cb1(err, geo_route, percentHuntData);
				}
				);//async parallel
			},
			function(geo_route, percentHuntData, cb1){
				switch (d.routable_type) {
					case 'IvrRoute2':
						if(!migrated){
							if (!returnJson.hasOwnProperty('ivrs')) {
								returnJson.ivrs = [];
							}
							var message = null;
							var message_type = null;
							var message_ary = [];
							if (d.ivr_option_message){
								message_ary = d.ivr_option_message.split('//');
							}
							if (message_ary.length > 1) {
								message = message_ary[1];
								switch(message_ary[0]){
									case 'tts:':
										message_type = 'text';
									break;
									case 'file:':
										message_type = 'file';
									break;
								}
							} else {
								message = message_ary[0];
							}
							_.forEach(data[0].oldIvrs,function(res){
									if(res.id === d.ivr_option_id){
										d.destination = res.destination;
										d.target_did = res.target_did;
									}
							});

							returnJson.ivrs.push({
								id: d.ivr_option_id,
								value: d.value,
								target_did: d.target_did,
								ivr_option_type: d.ivr_option_type,
								ouid: d.ivr_option_ouid,
								record_enabled: d.ivr_record_enabled,
								play_disclaimer: d.ivr_play_disclaimer,
								value: d.ivr_option_value  === 0 ? 10 : d.ivr_option_value,
								name : d.destination,
								message: message,
								message_type: message_type,
								ivr_option: d.ivr_option,
								geo_route: geo_route
							});
						}
						
						else returnJson.ivrs = data[0].multiIvrs;

					break;
					case 'GeoRoute':
						if (!returnJson.hasOwnProperty('geo_route')) {
							returnJson.geo_route = [];
						}
						if (geo_route_ids.indexOf(d.geo_route_id) < 0) {
							geo_route_ids.push(d.geo_route_id);
							returnJson.geo_route.push({
								id: d.geo_route_id,
								play_branding: d.geo_route_play_branding,
								radius: d.geo_route_radius,
								allow_manual_entry: d.geo_route_allow_manual_entry,
								strategy: d.strategy,
								location_id: d.location_id,
								default_ringto: d.geo_default_ringto,
								message_enabled: d.geo_route_message_enabled,
								message: d.geo_route_message
							});
						}
					break;
					case 'PercentageBasedRoute':
						if (!returnJson.hasOwnProperty('ringto_percentage')) {
								returnJson.ringto_percentage = [];
							}
						if (percentage_route_option_id.indexOf(d.percentage_route_options_id) < 0) {
							percentage_route_option_id.push(d.percentage_route_options_id);
							returnJson.ringto_percentage.push({
								id: d.percentage_route_options_id,
								ringToNum: d.percentage_ringto,
								percentage: d.percentage,
								route_order: d.route_order,
								overflowNumbers: percentHuntData,
								activateVoicemail: d.pro_vm_enabled,
								openOverflowBox: percentHuntData.length > 0 ? true : false,
								isSimultaneousRing: percentHuntData.length > 0 && percentHuntData[0].hunt_type === 'Simultaneous' ? true : false
							});
						}
					break;
				}
				cb1(null);
			}
			],
			function(err){
				cb(err);
			}
		);
	},
	function(err){
		res(err, returnJson);
	});

}

function formatPhoneNumber(phoneNumberString) {
	 var cleaned = ('' + phoneNumberString).replace(/\D/g, '') 
	 var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/) 
	 if (match) {
		  return '(' + match[1] + ') ' + match[2] + '-' + match[3]
		} 
	return null 
}
