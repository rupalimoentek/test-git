var controller = require('./appController'),
	f = require('../functions/functions'),
	numberPoolModel = require('../models/newNumberPoolModel'),
	appModel = require('../models/appModel'),
	ctTransactionModel = require('../models/ctTransactionModel'),
	phoneNumberModel = require('../models/phoneNumberModel'),
	//vitelityModel = require('../models/vitelityModel'),
	//bandwidthModel = require('../models/bandwidthModel'),
	shoutPointModel = require('../models/shoutPointModel'),
	dniSettingModel = require('../models/dniSettingModel'),
    	orgComponentCountModel = require('../models/orgComponentCountModel'),
    	toll_frees = require('../config/toll_free.json'),
	_ = require('underscore');
var vendor_id = 7;

var numberPools = {
    getByBillingOuid: function(req,callback){
        //// THIS IS FOR AMP3 DO NOT CHANGE
        numberPoolModel.getByBillingOuid(req,function(err,data){
            controller.responsify(null,data, function(response){
			    callback(response);
			});
        });
    },
	getAction: function(req, res){
		var orgUnitModel = require('../models/orgUnitModel');
		orgUnitModel.topOuId(req.ouid, function(err, top_ou_id){
			var qry = {
				org_unit_id: top_ou_id
			};
			numberPoolModel.read(qry, function(err,data){
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
		numberPoolModel.read(qry, function(data){
			controller.responsify(null,data, function(response){
			    res(response);
			});
		});
	},
	updateAction: function(req,callback){
		numberPoolModel.updateApp(req.body, function(err,data){
			controller.responsify(err, data, function(response){
				callback(response);
			});
		});
	},
	postAction: function(req, resPost){
        // check duplicate DNI settings if available.
        var ctTrans = new ctTransactionModel.begin(function(err){
            if(err){
                console.log("Err in connecting with database");
                    controller.responsify(err, '', function(response){
                        resPost(response);
                    });
            }
            if(req.body.dni_setting !== undefined && req.body.dni_setting !== '') {
                dniSettingModel.checkDuplicate(req.body.dni_setting,function(err,dniResponse){
                    if(err) {
                        controller.responsify(err, '', function(response){
                            ctTrans.rollback(function(){
                                console.log(response);
                                resPost(response);
                            });
                        });
                    } else {
                        numberPools.createNumberPool(req, ctTrans , function(createResponse) {
                            ctTrans.commit(function(){
                                resPost(createResponse);
                            });
                        });
                    }
                });
                }else{
                numberPools.createNumberPool(req, ctTrans, function(createResponse) {
                    ctTrans.commit(function(){
                        resPost(createResponse);
                    })
                });
            }
        });
	},
	createNumberPool: function(req, ctTrans, res) {
		var poolData = {
			pool_name : req.body.name,
			keep_alive_mins: req.body.keep_alive_minutes,
			provisioned_route_id: req.body.provisioned_route_id,
			phone_number: req.body.phone_number,
			org_unit_id: req.body.organizational_unit_id,
            //state: req.body.state,
            number_count:req.body.number_quantity,
			//rate_center : req.body.rate_center,
			pool_created: new Date(),
			pool_updated: new Date(),
			status: 'active'
        };
        if(req.body.pool_src === 'vendor'){
			var arrNumbers = []; 
			_.each(req.body.phone_number, function(ph_number) {
				arrNumbers.push(ph_number.number);
            });
            var poolNums = arrNumbers.toString();
            var qry = "SELECT pool_id FROM phone_pool_number where phone_number IN ("+poolNums+")";
            ctTrans.select(qry, function(err, row){
                if(err) {
                    controller.responsify(err, '', function(response){
                        res(response);
                    });
                }else if(row.length > 0){
                    controller.responsify('Something went wrong. Please create the number pool again. ', '', function(response){
                        res(response);
                    });
                }else{
                    numberPools.orderNumberFromShoutpoint(arrNumbers, poolData.org_unit_id, ctTrans, function(err, responce){
                        if(err){
                            controller.responsify(err, '', function(response){
                                res(response);
                            });
                        }else{
                            numberPoolModel.write(poolData, function(err, data){
                                var result = {
                                    pool_id: poolData.pool_id
                                };
                                poolData.ouid = req.body.organizational_unit_id;
                                controller.responsify(err, data, function(response){
                                    res(response);
                                });
                            });
                        }
                    });
                }
            });
        } else if (req.body.pool_src === 'cqm'){
            //// This is a migrated pool from cqm
            poolData.isFromCqm =true;
            numberPoolModel.write(poolData, function(err,data){
                var result = {
                    pool_id: data[0].pool_id
                };
                controller.responsify(err, result, function(response){
                    res(response);
                });
            });
        } else{
			// from inventory number so dont order numbers
			var tollFreeNumbers = [];
			_.each(req.body.phone_number, function(ph_number) {
				tollFreeNumbers.push(ph_number["number"]);
			});
			var tollFreeQuery = "DELETE FROM phone_number  WHERE number IN (" + tollFreeNumbers.join(',') + ")";
			ctTrans.query(tollFreeQuery,function(err,data){
				if(err) {
					controller.responsify(err, '', function(response){
						res(response);
					});
				}else{
                    var poolId = null;
                    numberPoolModel.write(poolData, function(err, data){
                        if(err) {
                            controller.responsify(err, '', function(response){
                                res(response);
                            });
                        }
                        poolId = data[0].pool_id;
                        async.eachSeries(req.body.phone_number, function(phone_number, cb){
                            if (phone_number.vendor_id !== undefined && phone_number.vendor_id == '10001') {
                                return cb(null)
                            }
                            var phoneNumber = phone_number.number;
                            console.log("moving from sip to sp: "+phoneNumber)
                            shoutPointModel.postSIPNumberToSP(phoneNumber, function(err){
                                if(err){return cb("Number is not available for provisioning number: "+phoneNumber);}
                                shoutPointModel.updateCallflowConfig(phoneNumber, poolData.org_unit_id, function(err, res){
                                    if(err){return cb("Not able to update sp config for provisioning number: "+phoneNumber);}
                                    var data = {vendor_id: 10001}
                                    var updateData = {
                                        which: 'update',
                                        table : 'phone_pool_number',
                                        values: data,
                                        where: " WHERE phone_number = " + phoneNumber
                                    };
                                    ctTrans.queryRet(updateData, function(err){
                                        cb(err);
                                    });
                                });
                            });
                        },
                        function(err){
                            var result = [{
                                pool_id: poolId
                            }];
                            controller.responsify(err, result, function(response){
                                res(response);
                            });
                        });
                    });
				}
			});
		}
	},
    orderNumberFromShoutpoint: function(numbers, org_unit_id, ctTrans, callback){
        let chunked = []
        let size = 20;
        for (let i = 0;  i < numbers.length; i += size) {
            chunked.push(numbers.slice(i, i + size))
        }
        async.eachSeries(chunked, function (batch, cb) {
            shoutPointModel.orderNumber(batch, ctTrans , true, function(err, response) {
                if(err){
                    cb(err);
                }else{
                    async.each(batch, function(phone_number, cb){
                        shoutPointModel.updateCallflowConfig(phone_number, org_unit_id, function(err, spResult){
                            cb(err);
                        });
                    },
                    function(err){
                        cb(err);
                    });
                }
            });
        }, function (err) {
            callback(err);
        });
    },
	putAction: function(req, resPut) {
     var ctTrans = new ctTransactionModel.begin(function(err){
        if (err){
            console.log("Err in connecting with database");
            controller.responsify(err, '', function(response){
                res(response);
            });
        }
        // check duplicate dni settings
		if(req.body.dni_setting !== undefined && req.body.dni_setting !== '') {
			dniSettingModel.checkDuplicate(req.body.dni_setting,function(err,dniResponse){
				if(err){
					controller.responsify(err, '', function(response){
                        ctTrans.rollback(function(){
                            resPut(response);
                        })
					});
				} else {
					numberPools.updateNumberPool(req, ctTrans , function(err, updateResponse) {
                        if(err){
                            controller.responsify(err, '', function(response){
                                ctTrans.rollback(function(){
                                    resPut(response);
                                })
                            });
                        }else{
                            ctTrans.commit(function(){
                                controller.responsify(err, updateResponse, function(response){
                                    resPut(response);
                                });
                            });
                        }
					});		
				}
			});
		} else {
			numberPools.updateNumberPool(req, ctTrans , function(err, updateResponse) {
                if(err){
                    controller.responsify(err, '', function(response){
                        ctTrans.rollback(function(){
                            resPut(response);
                        })
					});
                }else{
                    ctTrans.commit(function(){
                        controller.responsify(err, updateResponse, function(response){
                            resPut(response);
                        });
                    })
                }
			});
		}
     })
	},

	updateNumberPool: function(req, ctTrans , res) {
		var keepAliveMinutes;
		var pool_id = parseInt(req.params.id);
		var qry = {
			pool_id : pool_id
		};
		var newNumbers = req.body.newNumbers;
		var quantity = req.body.quantity;
		var type = req.body.type;
		var name = req.body.name;
		var phone_number, org_unit_id, provisioned_route_id, rate_center ;

		numberPoolModel.read(qry, function(err,data){
			if(err) {
                res(err);
            } 
            else {
				keepAliveMinutes = data[0].keep_alive_mins;
				org_unit_id = data[0].org_unit_id;
				provisioned_route_id = data[0].provisioned_route_id;
				//rate_center = data[0].rate_center.toString();
				var newPhNumbers = [];
				numberPoolModel.read_phone_pool_number(qry, function(err, data){
                    if(err) {
                        res(err);
                    }
                    else{
                        phone_numbers = data;
                        if(type === "add"){
                            _.each(newNumbers, function(ph_number) {
                                newPhNumbers.push(ph_number["number"]);
                            });

                            if(req.body.pool_src === 'inventory'){
                                var tollFreeQuery = "DELETE FROM phone_number WHERE number IN (" + newPhNumbers.join(',') + ")";
                                ctTrans.query(tollFreeQuery,function(err,data){
                                    if(err) {
                                        res(err);
                                    }else{
                                        async.series([
                                            function(cb1){
                                                addNumbersToPool(ctTrans, newNumbers, pool_id, function(err){
                                                    if(err){cb1(err);}else{
                                                        cb1(null);
                                                    }
                                                });
                                            },
                                            function (cb1) {
                                                var poolData = {
                                                    pool_id : pool_id,
                                                    number_count : phone_numbers.length + newNumbers.length,
                                                    pool_name: name 
                                                };
                                                numberPoolModel.updateApp(poolData, function(err,data){
                                                    if(err){
                                                        return cb1(err);
                                                    }
                                                    cb1(null);
                                                });
                                            },
                                            function (cb1) {
                                                orgComponentCountModel.increment(ctTrans, 18, org_unit_id, newNumbers.length, function (err) {
                                                    if(err){
                                                        return cb1(err);
                                                    }
                                                    cb1(null);
                                                });
                                            },
                                            function (cb1) {
                                                async.eachSeries(newNumbers, function(phone_number, cb){
                                                    if (phone_number.vendor_id !== undefined && phone_number.vendor_id == '10001') {
                                                        return cb(null)
                                                    }
                                                    var phoneNumber = phone_number.number;
                                                    console.log("moving from sip to sp: "+phoneNumber)
                                                    shoutPointModel.postSIPNumberToSP(phoneNumber, function(err){
                                                        if(err){return cb("Number is not available for provisioning number: "+phoneNumber);}
                                                        shoutPointModel.updateCallflowConfig(phoneNumber, org_unit_id, function(err, res){
                                                            if(err){return cb("Not able to update sp config for provisioning number: "+phoneNumber);}
                                                            var data = {vendor_id: 10001}
                                                            var updateData = {
                                                                which: 'update',
                                                                table : 'phone_pool_number',
                                                                values: data,
                                                                where: " WHERE phone_number = " + phoneNumber
                                                            };
                                                            ctTrans.queryRet(updateData, function(err){
                                                                cb(err);
                                                            });
                                                        });
                                                    });
                                                },
                                                function(err){
                                                    cb1(err);
                                                });
                                            }
                                            ],function(err) {
                                                if (err) { 
                                                    res(err);
                                                }else{
                                                    res(err, 'Pool Updated Successfully');
                                                }
                                        });
                                    }
                                });
                            }else{
                                shoutPointModel.orderNumber(newPhNumbers, ctTrans , true, function(err, response) {
                                    if(err) {
                                        res(err);
                                    }else{
                                        async.series([
                                            function(cb1){
                                                addNumbersToPool(ctTrans, newNumbers, pool_id, function(err){
                                                    if(err){cb1(err);}else{
                                                        cb1(null);
                                                    }
                                                });
                                            },
                                            function (cb1) {
                                                var poolData = {
                                                    pool_id : pool_id,
                                                    number_count : phone_numbers.length + newNumbers.length,
                                                    pool_name: name 
                                                };
                                                numberPoolModel.updateApp(poolData, function(err,data){
                                                    if(err){
                                                        return cb1(err);
                                                    }
                                                    cb1(null);
                                                });
                                            },
                                            function (cb1) {
                                                orgComponentCountModel.increment(ctTrans, 18, org_unit_id, newNumbers.length, function (err) {
                                                    if(err){
                                                        return cb1(err);
                                                    }
                                                    cb1(null);
                                                });
                                            },
                                            function (cb1) {
                                                async.each(newNumbers, function(phone_number, cb){
                                                    shoutPointModel.updateCallflowConfig(phone_number.number, org_unit_id, function(err, spResult){
                                                        cb(err);
                                                    });
                                                },
                                                function(err){
                                                    cb1(err)
                                                });
                                            }
                                            ],function(err) {
                                                if (err) { 
                                                    res(err);
                                                }else{
                                                    res(err, 'Pool Updated Successfully');
                                                }
                                        });
                                    }
                                });
                            }
                        }
                        else{
                            var nonExpiredNumbers = checkForExpiredNumbers(phone_numbers, quantity, keepAliveMinutes);
                            var error = "Cannot reduce pool size. These numbers are currently in use. Please try again later."
                            // console.log(nonExpiredNumbers);
                            if(nonExpiredNumbers.length === 0){
                                    res(error);
                            }else{
                                async.series([
                                    function(cb1){
                                        updatePoolDataDetils(ctTrans, nonExpiredNumbers, org_unit_id, function(err){
                                            if(err){cb1(err);}else{
                                                cb1(null);
                                            }
                                        });
                                    },
                                    function(cb1){
                                        async.each(nonExpiredNumbers, function(number, cb){
                                            var qry = "DELETE FROM phone_pool_number WHERE pool_id = "+ pool_id + " AND phone_number = "+ number.phone_number;
                                            ctTrans.query(qry, function(err){
                                                cb(err)
                                            });
                                        },
                                        function(err){
                                            cb1(err);
                                        });
                                    },
                                    function (cb1) {
                                        var poolData = {
                                            pool_id : pool_id,
                                            number_count : phone_numbers.length - nonExpiredNumbers.length,
                                            pool_name: name 
                                        };
                                        numberPoolModel.updateApp(poolData, function(err,data){
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
                                            res(err);
                                        }else{
                                            res(err, 'Pool Updated Successfully');
                                        }
                                });
                            }
                        }
                    }
                });
			}

		});	
	},
	getLMCPoolsByOuid: function(ouid, callback){
		var orgUnitModel = require('../models/orgUnitModel');
		var qry = {
			org_unit_id: parseInt(ouid)
		};
		
		numberPoolModel.read(qry, function(err,data){
			controller.responsify(err,data,function(response){
				callback(response);
			});
		});
	},
	getLMCPoolsByProvisionedRouteIdAction: function(prid, res){
		var qry = {
			provisioned_route_id: parseInt(prid),
			
		};
		
		numberPoolModel.read(qry, function(err,data){
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

            numberPoolModel.write(poolData, function(err,data){
                var result = {
                    pool_id: data.result.pool_id
                };
                controller.responsify(err, result, function(response){
                    res(response);
                });
            });
	}
};

function checkForExpiredNumbers(phone_numbers, quantity, keepAliveMinutes){
    var nonExpiredNumbers = _.filter(phone_numbers, function(number){ return number['last_used'] === null || moment.utc(number['last_used']).add(keepAliveMinutes,'minutes').isBefore(moment.utc()) });
	if(nonExpiredNumbers.length === 0)
		return nonExpiredNumbers;
	else if(nonExpiredNumbers.length < quantity)
		return [];
	else
		return nonExpiredNumbers.slice(0,quantity);
}

function updatePoolDataDetils(model, data,ouid,res){
	var phoneErr = null;
	var values = [];
 	var number_id,id_count;
	var fields = ["number", "number_status", "number_str", "npa", "nxx","ocn","rate_center","number_type"];
	var phoneDetailValues = [];
    var phoneDetailFields = ["number_id","lata","app_id","provisioned_route_id","org_unit_id","vendor_id","number_updated","resporg_id", "state"];
    var state = '';
	if(data.length >0){
		async.series([
			function (cb1) {
				async.each(data,function(number, cb){
							var ph_number = number['phone_number']; 
							var xqry = "SELECT state, rc FROM npanxx_city WHERE npa='" + ph_number.substr(0, 3) + "' AND nxx='" + ph_number.substr(3, 3) + "' LIMIT 1";
									model.query(xqry,function(err,ratecenter){
										if(err){return cb(err);}
										var rateCenter = null;
										if(ratecenter.length >0 ) {
                                            						rateCenter = ratecenter[0].rc;
                                    							state = ratecenter[0].state;
										}
										var tempString = "(";
										var tempValues = [ph_number, 'suspended', ph_number.toString(), ph_number.substr(0, 3), ph_number.substr(3, 3), ph_number.substr(6, 4),rateCenter,number['number_type']];
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
										cb(null);
							});
						
						
				},function(err){
						if(err){return cb1(err);}
						else{
							if(values.length){
								var qry  = "INSERT INTO phone_number (" + fields.join(',') + ") VALUES " + values.join(',');
								model.query(qry,function(err,result){
										if(err){
												return cb1(err);
										}
										number_id = result[0].number_id;
										id_count = result.length;
										cb1(null);
								});
							}
							else{
								cb1(null);
							}
						}
				});
					
			},
			function (cb1) {
                async.each(data,function(number,callback){
                var numIndex = data.indexOf(number); 
                var vendor_id = number.vendor_id;
                var tempString = "(";
                var current_date = f.mysqlTimestamp();
                var tempValues = [number_id, 0, null, null, null, vendor_id, current_date,number['resporg_id'], state];
                if(!isNaN(number_id)){
                        _.each(tempValues, function(tempValue, index){
                            if(index === 0){
                                    tempValue =  tempValue - numIndex;
                                    tempString += tempValue;
                            }
                            else if (typeof tempValue === 'string')
                                    tempString += ",'" + tempValue + "'";
                            else
                                    tempString += "," + tempValue;
                    });
                    tempString += ")";
                    phoneDetailValues.push(tempString);
                    callback(null);
                }
                else{callback("Not able to remove non expired numbers, Please contact customer support.");}
                },function(err){
                    if(err){return cb1(err);}
                    else{
                        if(phoneDetailValues.length){
                            var qry  = "INSERT INTO phone_detail (" + phoneDetailFields.join(',') + ") VALUES " + phoneDetailValues.join(",");
                            model.query(qry,function(err,data){
                                    if(err){
                                            return cb1(err);
                                    }
                                    cb1(null);
                            });
                        }
                        else{cb1(null);}
                    }
                });	
			},
		],function(err) {
			if (err) { 
				res(err);
			}else{
				res(null);
			}
		});
	}
	else{res(null);}	
}

function addNumbersToPool(model, data, pool_id, res){
    async.each(data, function(number, cb){
        var npa = number.number.substr(0, 3);
        var did_type = 'did';
        var resporg_id = '';
        if (toll_frees && toll_frees.npa && toll_frees.npa.indexOf(parseInt(npa)) > -1) {
            resporg_id = 'CHP01';
        }
        var lastUsed = number.last_used;
        if (lastUsed !== undefined && lastUsed !== null && lastUsed !== '' ) {
            lastUsed = "'"+number.last_used+"'"
        }
        var qry = " INSERT INTO phone_pool_number (pool_id, last_used,phone_number,number_type,resporg_id, vendor_id) values (" ;
        qry += "" + pool_id + "," + lastUsed + ","+ number.number + ",'" + did_type + "','" + resporg_id +  "', 10001) ";
        model.query(qry, function(err, data){
            cb(err);
        });
    },
    function(err){
        res(err);
    });
}

module.exports = numberPools;
