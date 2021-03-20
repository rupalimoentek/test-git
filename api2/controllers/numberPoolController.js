var controller = require('./appController'),
	f = require('../functions/functions'),
	numberPoolModel = require('../models/numberPoolModel'),
	appModel = require('../models/appModel'),
	ctTransactionModel = require('../models/ctTransactionModel'),
	phoneNumberModel = require('../models/phoneNumberModel'),
	//vitelityModel = require('../models/vitelityModel'),
	bandwidthModel = require('../models/bandwidthModel'),
	shoutPointModel = require('../models/shoutPointModel'),
	dniSettingModel = require('../models/dniSettingModel'),
	orgComponentCountModel = require('../models/orgComponentCountModel'),
	_ = require('underscore');
var vendor_id = 7;

var numberPools = {
	getAction: function(req, res){
		var orgUnitModel = require('../models/orgUnitModel');
		orgUnitModel.topOuId(req.ouid, function(err, top_ou_id){
			var qry = {
				organizational_unit_id: top_ou_id
			};
			var projection = {
				name: true
			};
			numberPoolModel.read(qry, projection, function(err,data){
				if(err) {
					res(err);
				} else {
				res(data);
				}
			});
		});
	},

	getByProvisionedRouteIdAction: function(prid, res){
		var qry = {
			provisioned_route_id: parseInt(prid)
		};
		var projection = {};
		numberPoolModel.read(qry, projection, function(data){
			controller.responsify(null,data, function(response){
			    res(response);
			});
		});
	},
	updateAction: function(req,callback){
		numberPoolModel.update(req.body, function(err,data){
			controller.responsify(err, data, function(response){
				callback(response);
			});
		});
	},
	postAction: function(req, resPost){
		// check duplicate DNI settings if available.
		if(req.body.dni_setting !== undefined && req.body.dni_setting !== '') {
			dniSettingModel.checkDuplicate(req.body.dni_setting,function(err,dniResponse){
				if(err) {
					controller.responsify(err, '', function(response){
						resPost(response);
					});
				} else {
					numberPools.createNumberPool(req, function(createResponse) {
						resPost(createResponse);
					});
				}
			});
		}else{
			numberPools.createNumberPool(req, function(createResponse) {
				resPost(createResponse);
				});
				}
	},

	createNumberPool: function(req, res) {
		var last_pool_id;
		var poolData = {
			name : req.body.name,
			keep_alive_minutes: req.body.keep_alive_minutes,
			provisioned_route_id: req.body.provisioned_route_id,
			phone_number: req.body.phone_number,
			organizational_unit_id: req.body.organizational_unit_id,
			app_id :"CT",
			state: req.body.state,
			rate_center : req.body.rate_center,
			created_at: new Date(),
			updated_at: new Date(),
			status: 'active'
		};

		if(req.body.pool_src === 'vendor'){
			var arrNumbers = []; 

			_.each(req.body.phone_number, function(ph_number) {
				arrNumbers.push(ph_number.number);
			});
			
			shoutPointModel.orderNumber(arrNumbers,true, function(err,response) {
				console.log("order response ===",response[arrNumbers].id);
				if(err) {
					controller.responsify(err, '', function(response){
						res(response);
					});
				} else {
					numberPoolModel.read_last_pool(function(err,data){
						
						if(err) {
							controller.responsify(err, '', function(response){
								res(response);
							});
						} 
						else {
							if(data !== null && data.length > 0) {
								last_pool_id = data[0].pool_id;
								poolData.pool_id = data[0].pool_id + 1;
								if(poolData.pool_id === '' || poolData.pool_id === undefined) {
									poolData.pool_id = 1;
								}
							} 
							else {
								poolData.pool_id = 1;
							}
							numberPoolModel.write(poolData, function(err,data){
								var result = {
									pool_id: poolData.pool_id
								};
																
								poolData.ouid = req.user.ou_id;
								shoutPointModel.updateCallflowConfig(poolData.phone_number[0].number, poolData.ouid,function(err, spResult){
									controller.responsify(err, result, function(response){
										res(response);
									});
								});
							});
						}
					});
				}
			});
		}else{
			// from inventory number so dont order numbers
			var tollFreeNumbers = [];
			_.each(req.body.phone_number, function(ph_number) {
				tollFreeNumbers.push(ph_number["number"]);
			});
			var tollFreeQuery = "DELETE FROM phone_number  WHERE number IN (" + tollFreeNumbers.join(',') + ")";
			appModel.ctPool.query(tollFreeQuery,function(err,data){
				if(err) {
					controller.responsify(err, '', function(response){
						res(response);
					});
				}else{
					numberPoolModel.read_last_pool(function(err,data){
						if(err) {
							controller.responsify(err, '', function(response){
								res(response);
							});
						} else {
							last_pool_id = data[0].pool_id;
							poolData.pool_id = data[0].pool_id + 1;
							numberPoolModel.write(poolData, function(err,data){
								var result = {
									pool_id: data.result.pool_id
								};
								controller.responsify(err, result, function(response){
									res(response);
								});
							});
						}
					});
				}
			});
		}
	},

	putAction: function(req, resPut) {
		// check duplicate dni settings
		if(req.body.dni_setting !== undefined && req.body.dni_setting !== '') {
			dniSettingModel.checkDuplicate(req.body.dni_setting,function(err,dniResponse){
				if(err){
					controller.responsify(err, '', function(response){
						resPut(response);
					});
				} else {
					numberPools.updateNumberPool(req, function(updateResponse) {
						resPut(updateResponse);
					});		
				}
			});
		} else {
			numberPools.updateNumberPool(req, function(updateResponse) {
				resPut(updateResponse);
			});
		}
	},

	updateNumberPool: function(req, res) {
		var keepAliveMinutes;
		var pool_id = parseInt(req.params.id);
		var qry = {
			pool_id : pool_id
		};
		var newNumbers = req.body.newNumbers;
		var quantity = req.body.quantity;
		var type = req.body.type;
		var name = req.body.name;
		var phone_number, org_unit_id, provisioned_route_id,rate_center ;

		numberPoolModel.read(qry,{}, function(err,data){
			if(err) {
				controller.responsify(err, '', function(response){
					res(response);
				});
			} else {
				keepAliveMinutes = data[0].keep_alive_minutes;
				phone_numbers = data[0].phone_number;
				org_unit_id = data[0].organizational_unit_id;
				provisioned_route_id = data[0].provisioned_route_id;
				rate_center = data[0].rate_center.toString();
				var newPhNumbers = [];
				if(type === "add"){
					var poolData = {
						condition : { pool_id : pool_id},
						values : { phone_number : phone_numbers.concat(newNumbers), name: name }
					};
					_.each(newNumbers, function(ph_number) {
						newPhNumbers.push(ph_number["number"]);
					});

					if(req.body.pool_src === 'inventory'){
						var tollFreeQuery = "DELETE FROM phone_number WHERE number IN (" + newPhNumbers.join(',') + ")";
						appModel.ctPool.query(tollFreeQuery,function(err,data){
							if(err) {
								controller.responsify(err, '', function(response){
									res(response);
								});
							}else{
								numberPoolModel.update(poolData, function(err,data){
									orgComponentCountModel.increment(null, 18, org_unit_id, newPhNumbers.length, function (err) {
										controller.responsify(err, data, function(response){
											res(response);
										});
									});	
								});
							}
						});
					}else{
						shoutPointModel.orderNumber(newPhNumbers, function(err,response) {
							if(err) {
								controller.responsify(err, '', function(response){
									res(response);
								});
							}else{
								numberPoolModel.update(poolData, function(err,data){
									orgComponentCountModel.increment(null, 18, org_unit_id, newPhNumbers.length, function (err) {
										controller.responsify(err, data, function(response){
											res(response);
										});
									});
								});
							}
						});
					}
				}else{
					var nonExpiredNumbers = checkForExpiredNumbers(phone_numbers, quantity, keepAliveMinutes);
					var error = "Cannot reduce pool size. These numbers are currently in use. Please try again later."
					// console.log(nonExpiredNumbers);
					if(nonExpiredNumbers.length === 0){
						controller.responsify(error, '', function(response){
							res(response);
						});	
					}else{
						var phoneErr = null;
						var values = [];
						var number_id,id_count;
						var fields = ["number", "number_status", "number_str", "npa", "nxx","ocn","rate_center"];
						var phoneDetailValues = [];
						var phoneDetailFields = ["number_id","lata","app_id","provisioned_route_id","org_unit_id","vendor_id","number_updated"];
						ctTrans = new ctTransactionModel.begin(function(err){
							if (err){
								console.log("Err in connecting with database");
								controller.responsify(err, '', function(response){
									res(response);
								});
							}
							async.series([
							    function (cb1) {
							       	_.each(nonExpiredNumbers, function(number){
										var ph_number = number['number'];
										var tempString = "(";
										var tempValues = [ph_number, 'suspended',ph_number.toString(), ph_number.substr(0, 3), ph_number.substr(3, 3), ph_number.substr(6, 4),rate_center];
										_.each(tempValues, function(tempValue, index){
											if(index === 0)
												tempString += tempValue;
											else if (typeof tempValue === 'string')
												tempString += ",'" + tempValue + "'";
											else
												tempString += "," + tempValue;
										});	
										tempString += ")";
							       		values.push(tempString);
									});	

							       	var qry  = "INSERT INTO phone_number (" + fields.join(',') + ") VALUES " + values.join(",");
									ctTrans.query(qry,function(err,data){
										if(err){
											return cb1(err);
										}
										number_id = data[0].number_id;
										id_count = data.length;
										cb1(null);
									});
						        },
						        
						        function (cb1) {
							       	_.each(nonExpiredNumbers, function(number, numIndex){
										var ph_number = number['number'];
										var tempString = "(";
										var current_date = f.mysqlTimestamp();
										var tempValues = [number_id, 0, null, null, null, vendor_id, current_date];
										console.log(tempValues);
										_.each(tempValues, function(tempValue, index){
											if(index === 0){
												tempValue =  tempValue - numIndex;
												console.log(tempValue, numIndex);
												tempString += tempValue;
											}
											else if (typeof tempValue === 'string')
												tempString += ",'" + tempValue + "'";
											else
												tempString += "," + tempValue;
										});	
										tempString += ")";
							       		phoneDetailValues.push(tempString);
									});	

							       	var qry  = "INSERT INTO phone_detail (" + phoneDetailFields.join(',') + ") VALUES " + phoneDetailValues.join(",");
									ctTrans.query(qry,function(err,data){
										if(err){
											return cb1(err);
										}
										cb1(null);
									});
						        },
						        function (cb1) {
							       	var poolData = {
										condition : { pool_id : pool_id},
										values : { phone_number : _.difference(phone_numbers, nonExpiredNumbers), name: name }
									};
									numberPoolModel.update(poolData, function(err,data){
										if(err){
											return cb1(err);
										}
										cb1(null);
									});
						        },

						        function (cb1) {
									orgComponentCountModel.decrement(ctTrans, 18, org_unit_id, nonExpiredNumbers.length, function (err) {
										if(err){
											return cb1(err);
										}
										cb1(null);
									});
						        },	
							],function(err) {
					            if (err) { 
					            	ctTrans.rollback(function(){
						            	controller.responsify(err, '', function(response){
											res(response);
										});
									});
					            }else{
						            ctTrans.commit(function(err){
										controller.responsify(null, "Pool updated Successfully", function(response){
											res(response);
										});
									});
					            }
					        });
						});
					}
				}
			}

		});	
	},
	getLMCPoolsByOuid: function(ouid, callback){
		var orgUnitModel = require('../models/orgUnitModel');
		var qry = {
			organizational_unit_id: parseInt(ouid),
			app_id: "LMC"
		};
		var projection = {};
		numberPoolModel.read(qry, projection, function(err,data){
			controller.responsify(err,data,function(response){
				callback(response);
			});
		});
	},
	getLMCPoolsByProvisionedRouteIdAction: function(prid, res){
		var qry = {
			provisioned_route_id: parseInt(prid),
			app_id: "LMC"
		};
		var projection = {};
		numberPoolModel.read(qry, projection, function(err,data){
			controller.responsify(err,data, function(response){
			    res(response);
			});
		});
	},
	internaleCreateNumberPool: function(req, res) {
		var last_pool_id;
		var arrNumbers = [];
		var d = req.body;
		var poolData = {
			name : d.name,
			keep_alive_minutes: d.keep_alive_minutes,
			provisioned_route_id: (data.provisioned_route_id !== undefined ? data.provisioned_route_id : ''),
			phone_number: d.phone_number,
			organizational_unit_id: d.organizational_unit_id,
			app_id :"CT",
			state: (data.state !== undefined ? data.state : null),
			rate_center : (data.rate_center !== undefined ? data.rate_center : null),
			created_at: ((d.created_at !== undefined && d.created_at !== "" && d.created_at !== null) ? new Date(d.created_at) : new Date()),
			updated_at: ((d.updated_at !== undefined && d.updated_at !== "" && d.updated_at !== null) ? new Date(d.updated_at) : new Date()),			
			status: 'active'
		};

		_.each(data.phone_number, function(ph_number) {
				arrNumbers.push(ph_number.number);
			});

		numberPoolModel.read_last_pool(function(err,data){
			if(err) {
				controller.responsify(err, '', function(response){
					res(response);
				});
			} else {
				console.log("==========Saving number pool data:", poolData);
				poolData.pool_id = data[0].pool_id + 1;
				numberPoolModel.write(poolData, function(err,data){
					var result = {
						pool_id: data.result.pool_id
					};
					controller.responsify(err, result, function(response){
						res(response);
					});
				});
			}
		});
	}
};

function checkForExpiredNumbers(phone_numbers, quantity, keepAliveMinutes){
	var nonExpiredNumbers = _.filter(phone_numbers, function(number){ return number['last_used'] === null || moment.utc(number['last_used']).add(keepAliveMinutes,'minutes').isBefore(moment.utc()) })
	if(nonExpiredNumbers.length === 0)
		return nonExpiredNumbers;
	else if(nonExpiredNumbers.length < quantity)
		return [];
	else
		return nonExpiredNumbers.slice(0,quantity);
}

module.exports = numberPools;
