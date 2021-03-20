var appModel = require('./appModel'),
	table = 'location',
	location_route_table = 'location_route',
	ctTransactionModel = require('./ctTransactionModel'),
	ceTransactionModel = require('./ceTransactionModel'),
	overFlowNumberModel = require('./overFlowNumberModel'),
	f = require('../functions/functions'),
	und = require('underscore');
    provisionedRouteIdbyLocation = require('./provisionedRouteIdbyLocation');
var location = {
	create: function(data, res){
		var ctTrans = new ctTransactionModel.begin(function(err){
			if (err) {
				res(err);
				return;
			}
			var locationData = {
				org_unit_id: data.location.org_unit_id,
				location_name: data.location.name
			};
			var insertData = {
				which: 'insert',
				table: table,
				values: locationData
			};
			ctTrans.queryRet(insertData, function(err, result){
				if (err) {
					ctTrans.rollback(function(){
						res(err);
					});
				} else {
					ctTrans.commit(function(err){
						var r = {
							location: {
								id: result.insertId
							}
						};
						res(err, r);
					});
				}
			});
		});
	},
	delete: function(data, res){
		var ctTrans = new ctTransactionModel.begin(function(err){
			async.each(data.location.ids, function(id, cb){
				async.waterfall([
					function(cb1){
						if (err) {
							res(err);
							return;
						}
						var qry = "SELECT count(location_id) as numroutes FROM ce_geo_routes WHERE location_id = "+id;
						appModel.ctPool.query(qry, function(err, result) {
							if(err) {
								cb1(err);
							}
							else {
								if(result[0].numroutes > 0) {
									return cb("This location is associated with the Tracking Number, Prior to deleting this location, Tracking Number settings must be modified.");
								}
								cb1(err);
							}
						});
					},
					function(cb1){
						if (err) {
							res(err);
							return;
						}
						var locationData = {
							location_id: id,
							location_active: false,
							location_modified: f.mysqlTimestamp()
						};
						var updateData = {
							which: 'update',
							table: table,
							values: locationData
						};
						ctTrans.query(updateData, function(err, result){
							cb1(err);
						});
					},
					function(cb1){
						var locationRouteData = {
							location_route_active: false,
							location_route_modified: f.mysqlTimestamp()
						};
						var where = " WHERE location_id = "+ id;
						var updateData = {
							which: 'update',
							table: location_route_table,
							values: locationRouteData,
							where: where
						};
						ctTrans.query(updateData, function(err, result){
							cb1(err);
						});

						/*var qry = "DELETE FROM location_route WHERE location_id = " + id;
						var qryData = {
							which: 'query',
							qry: qry
						};
						ctTransactionModel.query(qryData, function(err){
							cb1(err);
						});*/
					}
				],
				function(err){
					cb(err);
				});
			},
			function(err){
				if (err) {
					ctTrans.rollback(function(){
						res(err);
					});
				} else {
					ctTrans.commit(function(err){
						res(err, 'Location Deleted');
					});
				}
			});//asyn each
		});
	},
	delete_location: function(id, res){
		var ctTrans = new ctTransactionModel.begin(function(err){
			async.waterfall([
				function(callback){
					var qry = "select l.location_id from location_route lr LEFT JOIN location l ON l.location_id = lr.location_id WHERE location_route_id = " + id ;
					appModel.ctPool.query(qry, function(err, result){ 
						callback(err,result);
					});
				},
				function(result, callback){
					var qry = selectQry(" WHERE l.location_id = " + result[0].location_id ,'', '');
					appModel.ctPool.query(qry, function(err, result){ 
						callback(err,result);
					});
				},
				function(result, callback){
					var noOfLocationRoutes = result.length;
					var qry = "SELECT ccf.provisioned_route_id, lr.location_route_target, ccf.routable_id FROM location_route as lr ";
					qry += "JOIN location as loc on loc.location_id = lr.location_id ";
					qry += "JOIN ce_geo_routes as cgr on cgr.location_id = loc.location_id ";
					qry += "LEFT JOIN ce_call_flows ccf on ccf.routable_id = cgr.id ";
					qry += "WHERE lr.location_route_id = "+id+ " AND ccf.app_id = 'CT'";

					appModel.ctPool.query(qry, function(err, result){
						if(err) {
							callback(err);
						}
						else {
							if(result.length > 0) {
								if (noOfLocationRoutes == 1){
									ctTrans.rollback(function(){
										res("Location list associated with Tracking number cannot be empty.", null);
									});									
								}else{
									callback(null, null);
								}
							}
							else {
								callback(err, null);
							}
						}
					});
				},
				function(result, callback){
					var locationRouteData = {
						location_route_id: id,
						location_route_active: false,
						location_route_modified: f.mysqlTimestamp()
					};
					var updateData = {
						which: 'update',
						table: location_route_table,
						values: locationRouteData
					};
					ctTrans.query(updateData, function(err, result){
						callback(null,result);
					});
				}
			],
			function(err){
				if(err) {
					ctTrans.rollback(function(){
						res(err);
					});
				}
				else {
					ctTrans.commit(function(err){
						res(err, 'Location Deleted');
					});
				}
			});

		}); //end ct transaction
	},
	update: function(data, res){
		var CURRENT_TIMESTAMP = 'now()';
		var ctTrans = new ctTransactionModel.begin(function(err){
			if (err) {
				res(err);
				return;
			}
			var locationData = {
				location_id: data.location.id,
				location_name: data.location.name,
				location_modified: CURRENT_TIMESTAMP
				
			};
			var updateData = {
				which: 'update',
				table: table,
				values: locationData
			};
			ctTrans.query(updateData, function(err, result){
				if (err) {
					ctTrans.rollback(function(){
						res(err);
					});
				} else {
					ctTrans.commit(function(err){
						res(err, 'Location Modified.');
					});
				}
			});
		});
	},
	getById: function(id,page,timezone,res){
     	var limit = 100,
			offset = 0;
		var endQerypart = (page != 0) ? " LIMIT " + limit :"" ;
		if(page != 0 ){
				offset = (parseInt(page) - 1) * 100;	
			}
		if(page && offset){
			endQerypart +=  " OFFSET " + offset;
		}	
		var sort = " ORDER BY location DESC ";
		async.waterfall([
			function(cb1){
				var qry = selectQry(" WHERE l.location_id = " + id,sort, '') + endQerypart;
				appModel.ctPool.query(qry, function(err, data){
					if (err) {
									cb1(null,err);
					}
					else {
									data = jsonLocationRoute(data);
									cb1(null, data);
					}
				});
			},
			function(data, cb1){

				var zone = (timezone ? timezone : 'EST');
				var qry = "SELECT COUNT (*)";
					qry += " FROM " + table + " as l";
					qry += " LEFT JOIN location_route as lr on lr.location_id = l.location_id AND lr.location_route_active = true";
					qry += " WHERE l.location_id = "+ id;
					qry += " AND l.location_active = true";
					
					appModel.ctPool.query(qry, function (err, result1) {
						if (err) {
							cb1(null,err);
						}
						else {
						data.totalRows = result1[0].count;
							cb1(null, data);
						}
					});
			}
		],function(err, data){
				res(err, data);
		});	
	},
	getByOuid: function(req, res){
	  var	sort = " ORDER BY location_name DESC ";
		var qry = selectQry(" WHERE l.org_unit_id = " + req.ouid,sort, req.timezone);
		appModel.ctPool.query(qry, function(err, data){
			res(err, jsonLocationRoute(data));
		});
	},
	getByOuid1: function(req, res){
		var	sort = " ORDER BY location_name DESC ";
		var qry = selectQry(" WHERE l.org_unit_id = " + req.ouid,sort, req.timezone + '/' + req.timezone1);
		appModel.ctPool.query(qry, function(err, data){
			res(err, jsonLocationRoute(data));
		});
	},
	saveLocationIVR: function(req, res){
		if(req.body.location_id === undefined && req.body.location_id === null){
			return res('Please send valid location id');
		}else{
			var location_id = req.body.location_id;
			var ctTrans = new ctTransactionModel.begin(function(err){
				if (err) {
					ctTrans.rollback(function(){
						res(err);
					});
				} else {
					multiIVRCallFlow(ctTrans, req.body, function(err, result){
						if (err) {
							ctTrans.rollback(function(){
								res(err);
							});
						} else {
							var locationData = {
								location_ivr_route_id: result.location_ivr_route_id
							};
							var insertData = {
								which: 'update',
								table: location_route_table,
								values: locationData,
								where: ' WHERE location_route_id = '+req.body.location_id
							};
							ctTrans.query(insertData, function(err){
								if(err){
									ctTrans.rollback(function(){
									res(err);
									}); 
								} else {
									ctTrans.commit(function(err){
										provisionedRouteIdbyLocation(location_id, function(err, data){
											var provisioned_route_ids = [];
											for (var i = data.length - 1; i >= 0; i--) {
												provisioned_route_ids.push(data[i].provisioned_route_id);
											}
											if (provisioned_route_ids.length > 0) {
												var callFlowModel = require("../models/callFlowModel");
												async.each(provisioned_route_ids,function(provisioned_route_id, eachCb){
													callFlowModel.orphanPathQueue(provisioned_route_id, function(err){ 
														eachCb(err);
													})
												}, function(err){
													if(err){
														console.log(err);
													}								
												});
											} else {
												res();
											}
										});
										res(err, result);
									});
								}
							});
						}
					});
				}				
			});
		}		
	},
	saveMultiIVR: function(ivrs_data, model, location_ivr_route_id, parent_id, callback){
		async.each(ivrs_data.ivrActions, function(ivr, cb){
			ivr.location_ivr_route_id = location_ivr_route_id;
			location.saveMultiIvrOption(ivr, model, location_ivr_route_id , parent_id,function(err, ret){
				cb(err);
			});
		}, function(err){
			callback(err);
		});
	},
	saveMultiIvrOption: function(ivr, model, location_ivr_route_id, parent_id, callback){
		switch(ivr.action){
			case 'simple':
				location.saveSimpleIVRRoute(ivr, model, location_ivr_route_id , parent_id,function(err, ret){
					callback(err, ret);
				});
			break;
			case 'hangup':
				location.saveSimpleIVRRoute(ivr, model, location_ivr_route_id , parent_id,function(err, ret){
					callback(err, ret);
				});
			break;
			case 'interactiveVoice':
				location.saveIVRRoute(ivr, model, location_ivr_route_id , parent_id,function(err, ret){
					callback(err, ret);
				});
			break;
			default:
				callback('Invalid Route Type');
		}
	},
	saveSimpleIVRRoute: function(ivr, model, location_ivr_route_id, parent_id, callback){
		var message = 'blank://';
		var message_enabled = false;
		var whisper_message_enabled = false;
		var whisper_message = 'blank://';
		var record_enabled = false;
		var webhook_enabled = false;
		var vm_enabled = false;
		var target_did = ''
		if (ivr.whisper_enabled && ivr.whisper_message_type) {
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
			action_order:ivr.action_order,
			destination: ivr.destination,
			target_did: target_did,
			ouid: ivr.ouid,
			location_ivr_route_id: location_ivr_route_id,
			message_enabled: message_enabled,
			record_enabled: record_enabled,
			play_disclaimer: ivr.play_disclaimer,
			webhook_enabled: webhook_enabled,
			key_press: ivr.keypress,
			ivr_option_type: 'simple',
			vm_enabled : vm_enabled,
			whisper_enabled: ivr.whisper_enabled,
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
			overFlowNumberModel.saveOverflowForLocatoinRoute(ivr.ringToData.overflowNumbers, ivr.ouid, hunt_type, model, function(err, hunt_option_id){
				if (hunt_option_id) {
					ivrOptionData.hunt_option_id = hunt_option_id;
				}
				var insertData = {
					which: 'insert',
					table: 'location_ivr_option',
					values: ivrOptionData
				};
				model.query(insertData, function(err, data){
					callback(err, data);
				});
			});
		}else{
			var insertData = {
				which: 'insert',
				table: 'location_ivr_option',
				values: ivrOptionData
			};
			model.query(insertData, function(err, data){
				callback(err, data);
			});
		}
	},
	saveIVRRoute: function(ivr, model, location_ivr_route_id, parent_id, callback){
		var message = 'blank://';
		var message_enabled = false;
		var record_enabled = false;
		var webhook_enabled = false;
		var target_did = ''
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
		}
		if (ivr.activateVoiceMail){
			vm_enabled = true;
		}

		var ivrOptionData = {
			action_order:ivr.action_order,
			destination: ivr.destination,
			target_did: target_did,
			ouid: ivr.ouid,
			location_ivr_route_id: location_ivr_route_id,
			message_enabled: message_enabled,
			record_enabled: record_enabled,
			play_disclaimer: ivr.play_disclaimer,
			webhook_enabled: webhook_enabled,
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
			table: 'location_ivr_option',
			values: ivrOptionData
		};
		model.queryRet(insertData, function(err, data){
			if(err){ callback(err);}
			if(ivr.ivrActions && ivr.ivrActions.length > 0){
				location.saveMultiIVR(ivr, model, location_ivr_route_id, data.insertId, function(){
					callback(err, data);
				});
			}
		});
	},
	getIvrBylocationIvrId: function(id, res){
		var ivrOptions = [];
		async.waterfall([
			function(cb){
				var qry = 'SELECT lio.*,lir.message as voice_prompt_message from location_ivr_route lir LEFT JOIN location_ivr_option lio ON (lir.location_ivr_route_id = lio.location_ivr_route_id) WHERE lir.location_ivr_route_id = '+id;
				appModel.ctPool.query(qry, function(err, data){
					cb(err, data);
				});
			},function(data ,cb){
				async.map(data, function(option, cboption){
					location.getIVRdataByType(option, function(err, ivr){
						if(err){cboption(err);}
						ivrOptions.push(ivr);
						cboption();
					});							
					}, function(err){
						cb(err, ivrOptions);
					});
			}
			],
			function(err){
				res(err, ivrOptions);
			}
		);

	},
	getIVRdataByType: function(ivr, callback){
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
			case 'interactiveVoice':
				callback(null, ivr);
			break;
			default:
				callback(null, ivr);
		}
	},
	deleteIvrBylocationIvrId: function(id, res){
		var ctTrans = new ctTransactionModel.begin(function(err){
			if (err) {
				res(err);
				return;
			}else{
				async.waterfall([
					function(cb){
						var qry = "SELECT location_ivr_route_id, hunt_option_id FROM location_ivr_option WHERE location_ivr_route_id = "+id;
						var selectData = {
							which: "query",
							qry: qry
						};
						ctTrans.query(selectData, function(err, data){
							cb(err, data);
						});
					},
					function(data, cb){
						if(data && data.length){
							clearLocationIVRData(ctTrans, data, function(err){
								cb(err);
							});
						}else{
							cb(null);
						}
					},
					function(cb){
						var locationData = {
							location_ivr_route_id: null
						};
						var insertData = {
							which: 'update',
							table: location_route_table,
							values: locationData,
							where: ' WHERE location_ivr_route_id = '+id
						};
						ctTrans.query(insertData, function(err){
							cb(err);
						});
					}
				],
				function(err, ret){
					if(err){
						ctTrans.rollback(function(){
							res(err);
						}); 
					} else {
						ctTrans.commit(function(err){
							res(err, 'Deleted Successfully');
						});
					}
				});
			}
		});		
	}
};

module.exports = location;

function multiIVRCallFlow (model, data, res){
	var ivrs_data = data.ivrs;
	var location_id = data.location_id;
	async.waterfall([
		function(cb){
			var qry = "SELECT lio.location_ivr_route_id, lio.hunt_option_id FROM location_route lr LEFT JOIN  location_ivr_option lio ON(lr.location_ivr_route_id = lio.location_ivr_route_id) WHERE lr.location_route_id = "+location_id;
			var selectData = {
				which: "query",
				qry: qry
			};
			model.query(selectData, function(err, data){
				cb(err, data);
			});
		},
		function(data, cb){
			if(data && data.length){
				clearLocationIVRData(model, data, function(err){
					cb(err);
				});
			}else{
				cb(null);
			}
		},
		function(cb){
			var message = 'blank://';
			if (data.ivrs.message_type) {
				switch (data.ivrs.message_type) {
					case 'text':
						message = 'tts://' + data.ivrs.message;
					break;
					case 'file':
						message = 'file://'+data.ivrs.message + '.wav';
					break;
				}
			}
			var ivrRouteData = {
				repeat_greeting: true,
				message: message
			};
			var insertData = {
				which: 'insert',
				table: 'location_ivr_route',
				values: ivrRouteData
			};
			model.queryRet(insertData, function(err, geo_route_data){
				cb(err, geo_route_data);
			});
		},function(d, cb){
			var location_ivr_route_id = d.insertId;
			location.saveMultiIVR(ivrs_data, model, location_ivr_route_id , undefined, function(err){
				var ret={};
				ret['location_ivr_route_id'] = location_ivr_route_id;
				cb(err, ret);
			});
		}
	],
	function(err, ret){
		res(err, ret);
	});
}

function clearLocationIVRData(model, data, res){
	async.parallel([
		function(cb){
			if(data && data[0].location_ivr_route_id){
				var qry = "DELETE FROM location_ivr_option WHERE location_ivr_route_id = "+data[0].location_ivr_route_id;
				var deleteQuery = {
					which: "query",
					qry: qry
				};
				model.query(deleteQuery, function(err, data){
					cb(err);
				});
			}else{
				cb(null);
			}			
		},
		function(cb){
			var huntOptins = und.pluck(data, 'hunt_option_id');
			huntOptins = und.compact(huntOptins);
			if(data && data.length && huntOptins.length){
				var qry = "DELETE FROM ce_hunt_types WHERE id IN ("+huntOptins+")";
				var deleteQuery = {
					which: "query",
					qry: qry
				};
				model.query(deleteQuery, function(err, data){
					cb(err);
				});
			}else{
				cb(null);
			}	
		}
	],
	function(err){
		res(err);
	});
}

function selectQry(where,sort, timezone){
	var zone = (timezone ? timezone : 'EST');
	var qry = "SELECT l.location_id as location_id, l.org_unit_id as org_unit_id, l.location_name as location_name, l.location_created AT TIME ZONE '" + zone + "' as location_created, l.location_modified AT TIME ZONE '" + zone + "' as location_modified";
	qry += ",lr.location_route_id as location_route_id, lr.location_route_location as location, lr.location_route_address as address, lr.location_route_city as city, lr.location_route_state as state, lr.location_route_zip as zip, lr.location_route_target as target, lr.location_route_claimed_zip as claimed_zip , lr.location_route_claimed_states as clamied_states, lr.location_ivr_route_id as location_ivr_route_id";
	qry += " FROM " + table + " as l";
	qry += " LEFT JOIN location_route as lr on lr.location_id = l.location_id AND lr.location_route_active = true";
	qry += where;
	qry += " AND l.location_active = true";
	qry += sort;
	return qry;
}

function jsonLocationRoute(data){
var location_ids = [];
var location_list = {};
for (var i = data.length - 1; i >= 0; i--) {
	var js;
	if (location_ids.indexOf(data[i].location_id) < 0) {
		js = {
			id: data[i].location_id,
			org_unit_id: data[i].org_unit_id,
			name: data[i].location_name,
			created: data[i].location_created,
			modified: data[i].location_modified,
			count: 0,
			routes: []
		};
		location_list[data[i].location_id] = js;
		location_ids.push(data[i].location_id);
	}
	if (data[i].location_route_id) {
		location_list[data[i].location_id].count = location_list[data[i].location_id].count += 1;
		var route = {};
		route.id = data[i].location_route_id;
		route.location_ivr_route_id = data[i].location_ivr_route_id
		route.location = data[i].location;
		route.address = data[i].address;
		route.city = data[i].city;
		route.state = data[i].state;
		route.zip = data[i].zip;
		route.target = data[i].target;
		route.pretty_number = f.prettyPhoneNumber(data[i].target);
		route.clamied_states = data[i].clamied_states == null ? "" :data[i].clamied_states;
		route.claimed_zip = data[i].claimed_zip;
		location_list[data[i].location_id].routes.push(route);
	}
}
var ret = {
	locations: []
};
var keys = und.keys(location_list);
for (var k = keys.length - 1; k >= 0; k--) {
	ret.locations.push(location_list[keys[k]]);
}
ret.locations.sort(function(a,b) {return (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? -1 : 0);} );
return ret;
}
