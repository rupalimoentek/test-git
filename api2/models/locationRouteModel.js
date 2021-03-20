var appModel = require('./appModel'),
	table = 'location_route',
	ctTransactionModel = require('./ctTransactionModel'),
	ceTransactionModel = require('./ceTransactionModel'),
	appModel = require('./appModel'),
	locationRoute = require('../config/location_route.json'),
	geoCoder = require('../lib/geoCoder'),
	f = require('../functions/functions');

var location = {
	getByLocationIds: function(ids, res){
		var qry = "SELECT lr.location_route_target as target, lr.location_route_latitude as latitude, lr.location_route_longitude as longitude, lr.location_route_address as address, lr.location_route_city as city, location_route_claimed_zip ";
		qry += ", l.org_unit_id as ouid";
		qry += " FROM " + table + " AS lr";
		qry += " LEFT JOIN location as l on l.location_id = lr.location_id";
		qry += " WHERE lr.location_id in (" + ids.join(',') + ") AND lr.location_route_active = TRUE";
		appModel.ctPool.query(qry, function(err, result){
			res(err,result);
		});
	},
	create: function(data, res){
		var d = data.location_route;
		//do npa blacklist lookup
		var npa = '000';
		if(d.phone && d.phone.length > 0) npa = d.phone.substring(0,3);
		var qry = "SELECT * FROM npa_blacklist as nb WHERE nb.npa = "+npa;
		appModel.ctPool.query(qry, function(err, result) {
			if(err) { res(err); return; }
			
			if(result[0] && result[0].npa) { res("The specified phone number area code "+result[0].npa+" is not allowed. Please contact customer service at 855-889-3939 for assistance."); return; }
			
			var ctTrans = new ctTransactionModel.begin(function(err){
				async.series([
					function(cb1){
						qry = "SELECT avg(latitude::decimal) AS latitude,avg(longitude::decimal) AS longitude FROM npanxx_city WHERE zipcode = '"+d.zip+"' GROUP BY zipcode";
						ctTrans.query(qry,function(err,geo_data){
							if (err) {return cb1(err);}
							if (geo_data.length < 1) {return cb1("Zip:"+d.zip+" not found")}
							d.latitude = geo_data[0].latitude;
							d.longitude = geo_data[0].longitude;
							cb1(null);
						})

						// geoCoder.geocode(d, function(err, geo_data){
						// 	if (err) { return res(err); }
						// 	if(geo_data.length > 0 && ((parseInt(geo_data[0].zipcode) === parseInt(d.zip)) || geo_data[0].countryCode === 'CA')){
						// 		d.latitude = geo_data[0].latitude;
						// 		d.longitude = geo_data[0].longitude;
						// 		//d.address = (d.address).replace(/'/g, "''");
						// 		cb1(null);
						// 	} else {
						// 		res("Zip:"+d.zip+" doesn't match with the entered City:" + d.city + " or State:" + d.state);	
						// 	}
						// });
					},
					function(cb1){

						var locationRouteData = {};
						for (var key in d){
							locationRouteData[locationRoute.key_map[key]] = d[key];
						}
						var insertData = {
							which: 'insert',
							table: table,
							values: locationRouteData
						};
						ctTrans.query(insertData, function(err, result){
							cb1(err);
						});

					},
					function(cb1){
						var qry = "SELECT prll.provisioned_route_id FROM location AS loc ";
						qry += "JOIN provisioned_route_location_link AS prll on prll.location_id = loc.location_id ";
						qry += "WHERE loc.location_id = "+d.location_id;
						//console.log(qry);

						appModel.ctPool.query(qry, function(err, result){
							if(err) {
								cb1(err);
							}
							else {
								//console.log(result);
								var route_ids = [];
								//could be more than one route using this geo location. Loop over them and create an array
								for(var x in result) {
									route_ids.push(result[x].provisioned_route_id);
								}
								// check length for route ids
								if(route_ids.length > 0) {
								var qry2 = "SELECT cf.routable_id, cf.provisioned_route_id, cf.ouid, gor.strategy FROM ce_call_flows AS cf ";
								qry2 += "JOIN ce_geo_routes AS gor ON gor.id = cf.routable_id ";
								qry2 += "WHERE cf.provisioned_route_id IN("+route_ids.join(",")+") AND cf.app_id='CT'";
								//console.log(qry2);
								var select2 = {
									which: "query",
									qry: qry2
								};
								ctTrans.query(select2, function(err, result2){
									//console.log(result2);
										if(err){
											cb1(err);
										}
									else {
										if(route_ids.length > 0) {
											//loop and build insert statements
											var insert_geo_options = "INSERT INTO ce_geo_options (geo_route_id, target_did, ouid, latitude, longitude, address, city, created_at, updated_at) VALUES";
											var IGO_value_clauses = [];
											var insert_geo_claimed = "INSERT INTO ce_geo_claimed_zip (geo_route_id, target_did, zipcode, city, address, ouid) VALUES";
											var IGC_value_clauses = [];
											var zips = d.claimed_zip.split(","); //turn claimed zips into array
											//console.log(zips);
											d.address = (d.address).replace(/'/g, "''");
											for(var x in result2) {
												//console.log(result2[x]);
												if(result2[x].strategy == 'Claimed') {
													for(var y in zips) {
														IGC_value_clauses.push("("+result2[x].routable_id+","+d.phone+",'"+zips[y].trim()+"', '"+d.city+"','"+d.address+"',"+result2[x].ouid+")");
													}
												}
												else {
													IGO_value_clauses.push("("+result2[x].routable_id+","+d.phone+","+result2[x].ouid+", "+d.latitude+","+d.longitude+",'"+d.address+"','"+d.city+"',NOW(), NOW())");
												}
											}
											insert_geo_options += IGO_value_clauses.join(",");
											insert_geo_claimed += IGC_value_clauses.join(",");
											//console.log(insert_geo_options);
											//console.log(insert_geo_claimed);
											async.parallel([
												function(callback) {
													var insertGO = {
														which: "query",
														qry: insert_geo_options
													};
													if(IGO_value_clauses.length > 0 ) {
														ctTrans.query(insertGO, function(err, data){
															console.log(err);
															callback(err);
														});
													} else {
														callback();
													}
												},
												function(callback) {
													var insertGC = {
														which: "query",
														qry: insert_geo_claimed
													};
													if(IGC_value_clauses.length > 0) {
														ctTrans.query(insertGC, function(err, data){
															console.log(err);
															callback(err);
														});
													} else {
														callback();
													}
												}

											],
												function(err, results) {
													cb1(err);
												}
											);

										} else {
											cb1();
										}
									}
								});

								} else {
									cb1();
								}
							}
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
							res(err, 'Location Route Created.');
						});
					}
				});
			}); //end ct transaction
		});
		//---------------------------------
	},
	update: function(req, res) {
		var is_migrated = req.is_migrated;
		var data = req.body;
		var d = data.location_route;
		var location_id = '';
		var orig = {};
		var proRoutes = [];
		//do npa blacklist lookup
		var npa = '000';
		if(d.phone && d.phone.length > 0) npa = d.phone.substring(0,3);
		 
		var qry = "SELECT * FROM npa_blacklist as nb WHERE nb.npa = "+npa;
		//console.log(qry);
		appModel.ctPool.query(qry, function(err, result) {
			if(err) { res(err); return; }
			//console.log(result);
			if(result[0] && result[0].npa) { res("The specified phone number area code "+result[0].npa+" is not allowed. Please contact customer service at 855-889-3939 for assistance."); return; }
			
			var ctTrans = new ctTransactionModel.begin(function(err) {
				if (err) { return res(err); }
				async.series([
					function(callback) {							
						// geoCoder.geocode(d, function(err, geo_data){
						// 	if (err) { return res(err); }								
						// 	if(geo_data.length > 0 && ((parseInt(geo_data[0].zipcode) === parseInt(d.zip)) || geo_data[0].countryCode === 'CA')){									
						// 		d.latitude = geo_data[0].latitude;
						// 		d.longitude = geo_data[0].longitude;
						// 		callback(null);
						// 	} else {
						// 		res("For zip "+d.zip+" may be Location, Address, City or State is incorrect. Please enter valid details.");									
						// 	}
						// });

						qry = "SELECT avg(latitude::decimal) AS latitude,avg(longitude::decimal) AS longitude FROM npanxx_city WHERE zipcode = '"+d.zip+"' GROUP BY zipcode";
						ctTrans.query(qry,function(err,geo_data){
							if (err) {return callback(err);}
							if (geo_data.length < 1) {return callback("Zip:"+d.zip+" not found")}
							d.latitude = geo_data[0].latitude;
							d.longitude = geo_data[0].longitude;
							callback(null);
						})
					},
					function(callback) {
						// select the original record so we can carry the creation date
						var qry = "SELECT * FROM location_route WHERE location_route_id = " + d.id;
						appModel.ctPool.query(qry, function(err, result) {
							if (err) { return callback('Failed to find location_route record. '+err); }
							orig = result[0];
							callback(null);
						});
					},
					function(callback) {
						// delete the record (update is not allowed on distributed tables)
						var qry = "DELETE FROM location_route WHERE location_route_id = " + d.id;
						ctTrans.query(qry, function(err) {
							if (err) { return callback('Failed to delete location_route record. '+err); }
							callback(null);
						});
					},
					function(callback) {
						// insert a replacement record using the same location_route_id
						var locationRouteData = {
							'location_route_id'             :d.id,
							'location_route_created'        :orig.location_route_created,
							'location_route_modified'       :'CURRENT_TIMESTAMP',
							'location_route_latitude'       :d.latitude,
							'location_route_longitude'      :d.longitude
						};
						for (var key in d){
							locationRouteData[locationRoute.key_map[key]] = d[key];
						}
						var insertData = {
							which: 'insert',
							table: table,
							values: locationRouteData
						};
						ctTrans.query(insertData, function(err) {
							if (err) { return callback('Failed to insert location_route record. '+err); }
							location_id = locationRouteData.location_id;
							callback(null);
						});
					}
					// function(callback){
					// 	if(!is_migrated && location_id){
					// 		var qry = "SELECT ccf.provisioned_route_id FROM ce_call_flows  ccf ";
					// 		qry += "LEFT JOIN ce_geo_routes cgr ON (ccf.routable_id = cgr.id ) ";
					// 		qry += "WHERE cgr.location_id = "+location_id;
					// 		ctTrans.query(qry, function(err, routes) {
					// 			if (err) { return callback('Failed to insert location_route record. '+err); }
					// 			if(routes.length){
					// 				proRoutes = routes;
					// 			}
					// 			callback(null);								
					// 		});
					// 	}else{
					// 		callback(null);
					// 	}
					// },
					// function(callback){
					// 	if(!is_migrated){
					// 		var callFlowModel = require('./callFlowModel');
					// 		async.each(proRoutes, function(route_id, cb){
					// 			callFlowModel.sendForMigration(route_id, function(err){
					// 				cb();
					// 			});
					// 		}, function(err){
					// 			callback(err);
					// 		});
					// 	}else{
					// 		callback(null);
					// 	}
					// }
				],
				function(err) {
					if (err) {
						console.log('Error Updating Location Routes: '+err);
						ctTrans.rollback(function(){});
						res(err);
					} else {
						console.log('Location Routes Updated.');
						ctTrans.commit(function(){});
						res(null, 'Location Route Updated.');
					}
				});//async series
			});// ct transaction begin
		});
	},
	import: function(data, res){
		data.fields.push('latitude');
		data.fields.push('longitude');
		data.fields.push('location_id');
		//do npa blacklist lookup for provided numbers
		var npas = [];
		var uniqueRoutes = [];
		var uniqueIdsArray = [];
		for(var x in data.routes) {
			data.routes[x].state = data.routes[x].state.trim();
			data.routes[x].phone = data.routes[x].phone.replace(/\D/g, "");
			npas.push(data.routes[x].phone.substring(0,3));
			if(data.routes[x].claimed_zip !== undefined){
				data.routes[x].claimed_zip = data.routes[x].claimed_zip.replace(/\s/g,'');
				if(data.routes[x].claimed_zip.length > 0){
					var pre_claimed_zip_array = data.routes[x].claimed_zip.split(',');
					var post_claimed_zip_array = [];
					for (var y in pre_claimed_zip_array) {
						if(pre_claimed_zip_array[y] !== ''){
							//Adding leading 0 to the 4 digits claimed zip codes
							if(pre_claimed_zip_array[y].length === 4)
								pre_claimed_zip_array[y] = "0" + pre_claimed_zip_array[y];
							post_claimed_zip_array.push(pre_claimed_zip_array[y]);
						}
					};
					data.routes[x].claimed_zip = post_claimed_zip_array.join();
				} else {
					//Adding leading 0 to the 4 digits claimed zip code
					if(data.routes[x].claimed_zip.length === 4)
						data.routes[x].claimed_zip = "0"+data.routes[x].claimed_zip;
				}
			}
			//Adding leading 0 to the 4 digits zip codes
			if(data.routes[x].zip.length === 4){
				data.routes[x].zip = "0"+data.routes[x].zip;
			}
			var uniqueId = createUniqueId(data.routes[x]);
			data.routes[x].uniqueKey = uniqueId;
			if(_.indexOf(uniqueIdsArray, uniqueId) === -1) { // if uniqueId not found
				uniqueRoutes.push(data.routes[x]);
				uniqueIdsArray.push(uniqueId);
			}
		}
		console.log("UniqueRecords Length:",uniqueRoutes.length);
		//console.log(npas);
		var qry = "SELECT * FROM npa_blacklist as nb WHERE nb.npa IN("+npas+")";
		if(uniqueRoutes.length > 0){
			appModel.ctPool.query(qry, function(err, result) {
				//console.log(result);
				if(err) { console.log(err); res({0:err}); return; }
				
				if(result[0] && result[0].npa) { res({0:"The specified phone number area code "+result[0].npa+" is not allowed. Please contact customer service at 855-889-3939 for assistance."}); return; }
				
				var ctTrans = new ctTransactionModel.begin(function(err){
					if (err) {
						res(err);
						return;
					}
					//var validator = require("../validations/locationrouteValidator.js");
					var errors = [];
					var values = [];
					var retryRoutes = {
						fields:data.fields,
						routes:[]
					};

					async.series([
						function(cb){
							var validationStatus = columnValidations(data.routes);
							console.log("validationStatus:",validationStatus);		
							if(validationStatus.isErrorFound){
								var err = {"status":"error","err":[validationStatus.description]};
								res(err);
								return;
							}
							cb(null);						
						},
						function(cb){
							async.eachSeries(uniqueRoutes,function(route,cb1){
								qry = "SELECT avg(latitude::decimal) AS latitude,avg(longitude::decimal) AS longitude FROM npanxx_city WHERE zipcode = '"+route.zip+"' GROUP BY zipcode";
								ctTrans.query(qry,function(err,geo_data){
									if (err) {return cb1({status: 'error',err: err});}
									if (geo_data.length < 1) {return cb1({status: 'error',err:"Zip:"+route.zip+" not found"})}
									latitude = geo_data[0].latitude;
									longitude = geo_data[0].longitude;
									values = createDbFormatedValues(data,route,latitude,longitude,values);
									cb1(null);
								})
							},
							function(err){
								cb(err);
							});						

						},
						// function(cb){						
						// 	if(uniqueRoutes.length >= 50)
						// 	{
						// 		geoCoder.batchGeocode(uniqueRoutes, function (err, batchData) {
						// 			console.log("uniqus reoure ad")
						// 			var index = 0;					  
						// 		  	async.each(uniqueRoutes, function(route, cb2){
						// 				if(batchData[index].error !== null){
						// 					console.log(index, batchData[index].error.name+ ":"+batchData[index].error.message);
						// 					//google api error										
						// 					var err = {"status":"error","err":[batchData[index].error.name+ ":"+batchData[index].error.message]};
						// 					//return res(err);
						// 					retryRoutes.routes.push(route);
						// 					index++;
						// 					return cb2(null)
						// 				}
						// 				if(batchData[index].error == null && batchData[index].value.length == 0){
						// 					var err = {"status":"error","err":["Invalid Zip:"+route.zip]};
						// 					index++;
						// 					return cb(err);
						// 				}
						// 				if(parseInt(batchData[index].value[0].zipcode) !== parseInt(route.zip)) {
						// 					console.log("Data from CSV:",JSON.stringify(route));
						// 					console.log("Google Responce:",JSON.stringify(batchData[index]));
						// 					var err = {"status":"error","err":["For zip "+route.zip+" may be Location, Address, City or State is incorrect. Please enter valid details."]};
						// 					index++;
						// 					return cb(err);
						// 				}
						// 				var latitude = batchData[index].value[0].latitude;
						// 				var longitude = batchData[index].value[0].longitude;
						// 				values = createDbFormatedValues(data,route,latitude,longitude,values);
						// 				index++;
						// 				cb2(null);
						// 			},
						// 			function(err){
						// 				console.log("retryRoutes LENGTH:",retryRoutes.routes.length);
						// 				console.log("values LENGTH:",values.length);
						// 				console.log("==========================Done");
						// 				cb(null);
						// 			});
						// 		});
						// 	} else {
						// 		cb(null);
						// 	}	
						// },
						// function(cb){						
						// 	if(retryRoutes.routes.length>0)
						// 	{
						// 		console.log("Retrying data............");
						// 		async.eachSeries(retryRoutes.routes, function(route, cb4){
						// 			geoCoder.geocode(route, function(err, geo_data){
						// 				if (err){
						// 					errors.push(err);
						// 					cb(errors);
						// 				} else {
						// 					if(parseInt(geo_data[0].zipcode) !== parseInt(route.zip) || geo_data[0].countryCode === 'CA') {
						// 						console.log("Data from CSV:",JSON.stringify(route));
						// 						console.log("Google Responce:",JSON.stringify(geo_data));
						// 						var err = {"status":"error","err":["For zip "+route.zip+" may be Location, Address, City or State is incorrect. Please enter valid details."]};
						// 						return cb(err);
						// 					}
						// 					var latitude = geo_data[0].latitude;
						// 					var longitude = geo_data[0].longitude;
						// 					values = createDbFormatedValues(data,route,latitude,longitude,values);																			
						// 					cb4(err);
						// 				}
						// 			});
						// 		},function(err){
						// 			console.log("LAST value lenth:",values.length);
						// 			cb(null);
						// 		});
						// 	} else {
						// 		cb(null);
						// 	}	
						// },
						// function(cb){
						// 	if(uniqueRoutes.length < 50){
						// 		async.eachSeries(uniqueRoutes, function(route, cb3){
						// 			geoCoder.geocode(route, function(err, geo_data){
						// 				if (err){
						// 					errors.push(err);
						// 					cb(errors);
						// 				} else {
						// 					if(parseInt(geo_data[0].zipcode) !== parseInt(route.zip) || geo_data[0].countryCode === 'CA') {
						// 						console.log("Data from CSV:",JSON.stringify(route));
						// 						console.log("Google Responce:",JSON.stringify(geo_data));
						// 						var err = {"status":"error","err":["For zip "+route.zip+" may be Location, Address, City or State is incorrect. Please enter valid details."]};
						// 						return cb(err);
						// 					}
						// 					var latitude = geo_data[0].latitude;
						// 					var longitude = geo_data[0].longitude;
						// 					values = createDbFormatedValues(data,route,latitude,longitude,values);
						// 					cb3(err);
						// 				}
						// 			});
						// 		},function(err){
						// 			cb(null);
						// 		});	
						// 	} else {
						// 		cb(null);
						// 	}
						// },
						function(cb){
							var sets = [];
							for (var i = data.fields.length - 1; i >= 0; i--) {
								if(locationRoute.key_map[data.fields[i].toLowerCase().replace(" ","_")])
									sets.push(locationRoute.key_map[data.fields[i].toLowerCase().replace(" ","_")]);
							}

							async.series([
								/*function(cb){
									// remove all existing locations if any as per the new requirement CT-1837
									var removeQry = "DELETE FROM location_route WHERE location_id = " + data.location_id;
									var removeQryData = {
										which: 'query',
										qry: removeQry
									};
									ctTrans.query(removeQryData, function(err){
										if(err) {
											cb(err);
										} else {
											cb(null);
										}
									});
								},*/
								function(cb){
									var qry = "INSERT INTO location_route (" + sets.join(',') + ") VALUES " + values.join(',');
									var qryData = {
										which: 'query',
										qry: qry
									};

									ctTrans.query(qryData, function(err){
										if(err) {
											cb(err);
										} else {
											cb(null);
										}
									});
								}
							],
							function(err){
								if (err) {
									ctTrans.rollback(function(){
										var error = 'Error Importing Location Routes for location: '+data.location_id+'.';
										console.log(error);
										res(error);
									});
									//return;
								}else{
									ctTrans.commit(function(){
										console.log('Location Routes Successfully Imported for location: '+data.location_id+'.');
										res(null, 'Processing CSV File');
									});
								}
							});
						}
					],
					function(err){
						if (err) {
							res(err);
						} else {
							res(null, 'CSV data saved Successfully');
						}
					}
					);
				});
			});
		}else{
			var err = {"status":"error","err": ["No data found in selected file"]};
			res(err);
		}
	},
	delete: function(id, res){
		var ctTrans = new ctTransactionModel.begin(function(err){
			if (err) {
				res(err);
				return;
			}
			var qry = "DELETE FROM " + table + " WHERE location_route_id = " + id;
			qryData = {
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
						res(null, 'Location Route Deleted.');
					});
				}
			});
		});
	}
};

function customizeErrors(data, errors){
	var err = errors[0]["location_route"];
	var temp_erros = [];
	var error_string;
	for(var i = 0; i < err.length; i++){
       if(err[i]["errors"] !== undefined){
            for(var j = 0; j < err[i]["errors"].length; j++){
                error_string = "";
                temp_data = err[i]["errors"][j].toString().substring(0, err[i]["errors"][j].indexOf(" "));
                for(var key in data) {
				    if(data[key] === temp_data) {
				       error_string = key + " is invalid";
				    }
				}
				if(error_string.length === 0){
					error_string = temp_data + " is invalid";
				}
				temp_erros.push(error_string);
            }
            var index = errors[0]["location_route"].indexOf(err["errors"]);
        	errors[0]["location_route"].splice(index, 1);
        	errors[0]["location_route"].push({
        		"errors" : temp_erros
        	});
        }
    }
    return errors;
}

function columnValidations(data){
	var statusJson = {};
	var errorsFound ;
	for(var x in data) {
		if(data[x].phone.length !== 10){
			errorsFound = "'"+data[x].phone+"' from phone must be 10 digit long from row "+(parseInt(x)+2)+".";
			break;
		} else if(data[x].zip.length > 5 && data[x].zip.length < 4){
			errorsFound = "'"+data[x].zip+"' from zip must be 4 or 5 digit long from row "+(parseInt(x)+2)+".";
			break;
		} else if(data[x].location.length > 99){
			errorsFound = "'"+data[x].location+"' from location must be less than 100 characters from row "+(parseInt(x)+2)+".";
			break;
		} else if(data[x].address.length > 99){
			errorsFound = "'"+data[x].address+"' from address must be less than 100 characters from row "+(parseInt(x)+2)+".";
			break;
		}else if(data[x].city.length > 99){	
			errorsFound = "'"+data[x].city+"' from city must be less than 100 characters from row "+(parseInt(x)+2)+".";
			break;
		}else if(data[x].state.length != 2){
			errorsFound = "'"+data[x].state+"' from State/Province must be equal to 2 characters from row "+(parseInt(x)+2)+".";
			break;
		}else{
			if(data[x].claimed_states ){
				var states = [];
				states = data[x].claimed_states.split(',');
				for (var s in states){
					if(states[s].length != 2) {
						errorsFound = "'"+data[x].claimed_states+"' from Claimed State/Province must be in 2 letter abbreviated form from row "+(parseInt(x)+2)+".";
						break;
					}  
				}
			}
			if(data[x].claimed_zip && data[x].claimed_zip.length > 0){
				var claimed_zip = data[x].claimed_zip.split(',');
				var CLAIMED_REGEXP = /^[0-9][0-9][0-9][0-9][0-9]$/;
				for (var i = 0; i < claimed_zip.length; i++) {
					if (!CLAIMED_REGEXP.test(claimed_zip[i])) {
						errorsFound = "'"+claimed_zip[i]+"' from claimed_zip must be 5 digit long from row "+(parseInt(x)+2)+".";					
						break;
					};
				};
				if(errorsFound)	break;
			}
			if(data[x].claimed_zip && data[x].claimed_zip.length > 255){
				errorsFound = "claimed_zips must be less than 255 characters from row "+(parseInt(x)+2);
				break;
			}
		}
	}
	if(errorsFound){
		statusJson['isErrorFound'] = true;
		statusJson['description'] = errorsFound;		
	}
	return statusJson;
}
module.exports = location;
function createUniqueId(row) {
	var location = row.location.replace(/'/g, "");
	var address = row.address.replace(/'/g, "");
	var city = row.city.replace(/'/g, "");
	var state = row.state;
	var zip = row.zip;
	return (location+""+address+""+city+""+state+""+zip).replace(/ /g,'');
}

function createDbFormatedValues(data,route,latitude,longitude,values){
	var duplicateRoutes = _.filter(data.routes, function(obj) {
		return obj.uniqueKey === route.uniqueKey;
	});
	
	_.each(duplicateRoutes, function(dRoute){
		var v = [];
		for (var i = data.fields.length - 1; i >= 0; i--) {
			switch (data.fields[i]){
				case 'latitude':
					v.push(latitude);
				break;
				case 'longitude':
					v.push(longitude);
				break;
				case 'location_id':
					v.push(data.location_id);
				break;
				default:
					var s = dRoute[data.fields[i].toLowerCase().replace(" ","_")];
					if(s !== undefined){
						s = s.replace(/'/g, "''");
						v.push("'" + s.toString().replace(/\|/g, ',') + "'");
					}else{
						v.push("''");
					}
			}
		}
		values.push("(" + v.join(',') + ")");
	});
	return values;
}
