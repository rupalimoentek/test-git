var connector 			= require('./appModel'),
	ctTransactionModel	= require('./ctTransactionModel'),
	appModel			= require('./appModel'),
	table				= 'mig_campaign',
    moment              = require('moment'),
	async				= require('async');

var mig = {
	getByCustomerId: function(req,callback){
		var qry = "SELECT cfa_ouid FROM "+table+" WHERE customer_id = "+req.params.customer_id+" AND status = 'migrated';";
		appModel.ctPool.query(qry,function(err,results){
			callback(err,results);
		});
	},
	post: function(req,callback){
		async.eachSeries(req.body.data,function(campaign,cb){
			var sets = ['account_id','customer_id','session_id','cs_campaign_id','status'];
			var values = [campaign.account_id,campaign.customer_id,campaign.session_id,campaign.cs_campaign_id,campaign.status,];
			if(campaign.msg){
				sets.push('msg');
				values.push(campaign.msg);
			}
			if(campaign.cfa_campaign_id){
				sets.push('cfa_campaign_id');
				values.push(campaign.cfa_campaign_id);
			}
			sets.push('created');
			var qry = "INSERT INTO "+table+" ("+sets.join(',')+") VALUES ('"+values.join("','")+"',NOW());";
			var trans = new ctTransactionModel.begin(function(err){
				data = {
					which: 'query',
					qry: qry
				};
				trans.query(data, function(err, data){
					if (err) {
						console.log('post mig campaign err: '+err)
						trans.rollback(function(){
							cb(err);
						});
					} else {
						trans.commit(function(){
							cb(null);
						});
					}
				});
			});
		},
		function(err){
			callback(err);
		});
	},
    getBillingNode: function(ouid, res) {
		if ((!ouid || ouid === null)) { return res('OUID is require.'); }

		var qry = "SELECT a.billing_id AS node1, b.billing_id AS node2, c.billing_id AS node3 ";
		qry += "FROM org_unit a LEFT JOIN org_unit b ON (a.org_unit_parent_id=b.org_unit_id AND a.org_unit_parent_id IS NOT NULL) ";
		qry += "LEFT JOIN org_unit c ON (b.org_unit_parent_id=c.org_unit_id AND b.org_unit_parent_id IS NOT NULL) WHERE a.org_unit_id=" + (ouid ? ouid : parentid);
		appModel.ctPool.query(qry, function (err, data) {
			if (err) { res('Failed to execute query to lookup billing node'); return; }
			if(data.length == 0) {
                return res(null,{"billing_id":null});
            }
			console.log(data);
			if (data[0].node1) {
				res(null, {"billing_id":data[0].node1});
			} else if (data[0].node2) {
				res(null, {"billing_id":data[0].node2});
			} else if (data[0].node3) {
				res(null, {"billing_id":data[0].node3});
			} else {
				res('Failed to find billing node. ');
			}
		});
	},
    getCampaignByCamapignId: function (camapignId, callback) {
        var selQry = "";
            selQry += "SELECT campaign_id, campaign_name";
            selQry += " FROM campaign";
            selQry += " WHERE campaign_id = "+camapignId;
            selQry += " AND campaign_status = 'active'"

            connector.ctPool.query(selQry, function (err, campaignResultSet) {
                callback(err, campaignResultSet);
            });
    },
	getCampaignByOuid: function (req, callback) {
        //This is for AMP 3, DO NOT CHANGE
        console.log(JSON.stringify(req.query))
        var ouid = req.query.id;

        var selQry = "";
            selQry += "SELECT DISTINCT c.campaign_id, c.campaign_name,c.campaign_ou_id";
            selQry += ",ou.org_unit_id,ou.org_unit_name";
            selQry += " FROM campaign AS c";
            selQry += " JOIN org_unit AS ou ON ou.org_unit_id = c.campaign_ou_id";

            if (req.query.forCallaction === 'true') {
                selQry += " JOIN campaign_provisioned_route AS cpr ON cpr.campaign_id = c.campaign_id";
                selQry += " JOIN call_action AS ca ON ca.provisioned_route_id = cpr.provisioned_route_id"; 
                selQry += " JOIN provisioned_route AS pr ON pr.provisioned_route_id = cpr.provisioned_route_id";              
            }

            selQry += " WHERE c.campaign_ou_id IN";
            selQry += " (SELECT org_unit_id FROM org_unit WHERE billing_id = "+ouid+" AND org_unit_status = 'active')";
            selQry += " AND c.campaign_status != 'deleted'";

            if (req.query.forCallaction === 'true') {
                var action;

                switch(req.query.target){
                    case 'email':
                        action = 'email_alert';
                        break;
                    case 'webhook':
                        action = 'webhook';
                        break;
                }

                if (action !== undefined) {
                    selQry += " AND ca.action = '"+action+"'";
                }

                selQry += " AND pr.provisioned_route_status != 'deleted'";

            }

            selQry += " ORDER BY c.campaign_name ASC";

            connector.ctPool.query(selQry, function (err, campaignResultSet) {
                if (req.query.forCallaction === 'false') {
                    //// Need to check if campaign has dni route

                    async.eachSeries(campaignResultSet,function(campaign,cb){
                        campaign.hasDni = false;
                        qry = "SELECT *"; 
                        qry += " FROM campaign_provisioned_route AS cpr";
                        qry += " JOIN dni_setting AS ds ON ds.provisioned_route_id = cpr.provisioned_route_id";
                        qry += " WHERE cpr.campaign_id = "+campaign.campaign_id;
                        connector.ctPool.query(qry, function (err,results) {
                            if (results.length > 0) {
                                campaign.hasDni = true;
                            }
                            cb(err);
                        });
                    },function(err){
                        callback(err,campaignResultSet);
                    });

                } else {
                    callback(err, campaignResultSet);
                }
            });
    },
    getCampaignsByOuid: function (req, callback) {
        //This is for AMP 3, DO NOT CHANGE

        var ouid = req.query.ouid;

        var selQry = "";
        selQry += "SELECT campaign_id, campaign_name, campaign_ou_id";
        selQry += " FROM campaign";
        selQry += " WHERE campaign_ou_id = "+ouid;
        selQry += " ORDER BY campaign_name ASC";

        connector.ctPool.query(selQry, function (err, campaignResultSet) {
            callback(err, campaignResultSet);
        });
    },
    moveCampaignToOu: function (data,res){
        var qrys = [];
         var resData = {
            campaignId: [],
            firstCallProcessed: null
        };

        async.eachSeries(data.campaigns,function(campaign,callback){
            var campId = campaign.id;
            var oldCampOuid = campaign.ouid;
            var newCampOuid = campaign.newOuid;
            var prIds = [];
            var numberIds = [];

            async.series([
                function(cb) {
                    //// First check if campaign has dni routes
                    qry = "SELECT *"; 
                    qry += " FROM campaign_provisioned_route AS cpr";
                    qry += " JOIN dni_setting AS ds ON ds.provisioned_route_id = cpr.provisioned_route_id";
                    qry += " WHERE cpr.campaign_id = "+campId;
                    connector.ctPool.query(qry, function (err,results) {
                        if (results.length > 0) {
                            console.log("This campaign has dni route, can not move it");
                            return cb("not moving campaign");
                        }
                        cb(err);
                    });
                },
                function(cb){
                    //update campaign
                    qrys.push("UPDATE campaign SET campaign_ou_id = "+newCampOuid+" where campaign_id = "+campId+";");
                    cb(null);
                },
                function(cb){
                    //update provisioned route
                    resData.campaignId.push(campId);

                    var qry = "SELECT *";
                    qry += " FROM campaign_provisioned_route";
                    qry += " WHERE campaign_id = "+campId;

                    connector.ctPool.query(qry, function (err, results) {
                        async.eachSeries(results,function(result,cb1){
                            prIds.push(result.provisioned_route_id);
                            cb1(err);
                        },
                        function(err){
                            if (prIds.length > 0) {
                                qrys.push("UPDATE provisioned_route SET provisioned_route_ou_id = "+newCampOuid+" WHERE provisioned_route_id IN ("+prIds.join(',')+");");
                            }
                            cb(null);
                        });//async.eachSeried cb1               
                    });                    
                },
                function(cb){
                    //update call flows
                    if (prIds.length > 0) {
                        qrys.push("UPDATE call_flows SET ouid = "+newCampOuid+" WHERE app_id = 'CT' AND provisioned_route_id IN ("+prIds.join(',')+");");
                    }
                    cb(null);
                },
                function(cb){
                    //update ce call flows
                    if (prIds.length > 0) {
                        qrys.push("UPDATE ce_call_flows SET ouid = "+newCampOuid+" WHERE app_id = 'CT' AND provisioned_route_id IN ("+prIds.join(',')+");");
                    }
                    cb(null);
                },
                function(cb){
                    //update phone detail

                    if (prIds.length < 1) {return cb(null);}
                    var qry = "SELECT *";
                    qry += " FROM provisioned_route_number";
                    qry += " WHERE provisioned_route_id IN ("+prIds.join(',')+");";

                    connector.ctPool.query(qry, function (err, results) {
                        async.eachSeries(results,function(result,cb1){
                            if(result.phone_number_id){ numberIds.push(result.phone_number_id)};
                            cb1(err);
                        },
                        function(err){
                            if (numberIds.length > 0) {
                                console.log("Number Ids: "+JSON.stringify(numberIds))
                                qrys.push("UPDATE phone_detail SET org_unit_id = "+newCampOuid+" WHERE number_id IN("+numberIds.join(',')+") AND app_id = 'CT';");
                            }
                            cb();
                        });//async.eachSeried cb1               
                    }); 
                },
                function(cb){
                    //update call detail if callHistory is true             
                    if (prIds.length > 0 && campaign.callHistory) {
                        async.series([
                            function(cb2){
                                //Get oldest call date
                                var qry = "SELECT cd.call_id,cd.call_created FROM call AS c";
                                qry += " JOIN call_detail AS cd on cd.call_id = c.call_id";
                                qry += " WHERE org_unit_id = "+oldCampOuid;
                                qry += " AND provisioned_route_id IN ("+prIds.join(',')+") ORDER BY call_created ASC LIMIT 1;";
                                
                                connector.ctPool.query(qry, function (err, results) {
                                    console.log("First Call Processed: "+JSON.stringify(results))
                                    if (err) {return cb2(err);}
                                    if(results.length < 1){return cb2(null);}

                                    console.log("++++ Checking Call Start: "+results[0].call_created)
                                    if (resData.firstCallProcessed === null || resData.firstCallProcessed === '') {
                                        resData.firstCallProcessed = results[0].call_created;
                                    } else {
                                        var callDate = moment(new Date(results[0].call_created));
                                        var checkDate = moment(new Date(resData.firstCallProcessed));
                                        var diff = checkDate.diff(callDate);
                                        console.log("++++ CheckDate: "+resData.firstCallProcessed);
                                        console.log('++++ Diff: '+diff);
                                        if (diff > 0) {
                                            resData.firstCallProcessed = results[0].call_created;
                                        }
                                    }
                                    cb2(null);            
                                }); 
                            },
                            function(cb2){
                                //update call detail
                                qrys.push("UPDATE call SET org_unit_id = "+newCampOuid+" WHERE org_unit_id = "+oldCampOuid+" AND provisioned_route_id IN ("+prIds.join(',')+");");
                                cb2(null)
                            }
                        ],
                        function(err){
                            cb(null);
                        });//async.parallel cb2
                        
                    } else {
                        cb(null);
                    }
                }
            ],
            function(err){
                //// Not sending error in call back because using that to stop campaign from moving
                callback();
            });//async.parallel cb
        },
        function(err){
            var ctTrans = new ctTransactionModel.begin(function(err){
                async.eachSeries(qrys,function(qry,callback){
                    ctTrans.query(qry, function(err, data){
                       callback(err); 
                    });
                },
                function(err){
                    console.log("Move campaign to ou response data: "+JSON.stringify(data));
                    if (err) {
                        ctTrans.rollback(function(){
                            res(err);
                        });
                    } else {
                        ctTrans.commit(function(){
                            res(null,resData);
                        });
                    }
                });
            });
            
        });//async.eachSeries callback
        
    },
    migrateCampaign: function (data, res) {
        var migrateFromOuid = data.cfaouid;
        var migrateToOuid = data.cfaMigrateToOuid;

        console.log("data:",data);
        //return res(null, "Campaigns migrated successfully.");
        var migrationData = {
            "campaignIds" : data.campaignIds,
            "provisionedRouteIds" : [],
            "callFlowIds" : [],
            "phoneDetailIds": []
        };
        var campaignIds = data.campaignIds.join(",");
        
        async.series([
            function (cb) {
                //Check campaigns
                var qry = "SELECT count(campaign_id) as num_campaign FROM campaign WHERE campaign_id IN ("+campaignIds+")";
                connector.ctPool.query(qry, function (err, res) {
                    if(err){ return cb(err);}
                    if(res[0].num_campaign == data.campaignIds.length){
                        cb(null);
                    } else{
                        cb("Invalid campaing ids");
                    }
                });
            },
            function (cb) {
                var callFlowIds = [];
                var phoneDetailIds = [];
                var provisionedRouteIds = [];
            
                var qry = "SELECT cp.provisioned_route_id,cf.id as call_flow_id, pd.number_id FROM campaign_provisioned_route cp "
                    +"JOIN call_flows cf ON cp.provisioned_route_id = cf.provisioned_route_id "
                    +"JOIN phone_detail pd ON cp.provisioned_route_id = pd.provisioned_route_id "
                    +"WHERE cp.campaign_id IN ("+campaignIds+") AND cf.app_id = 'CT'";
                connector.ctPool.query(qry, function (err, routes) {
                    if(err){ return cb(err);}
                    if(routes.length > 0) {
                        console.log("campaign_provision_res:",routes);
                        async.each(routes, function(route, callback){
                            callFlowIds.push(route.call_flow_id);
                            phoneDetailIds.push(route.number_id);
                            provisionedRouteIds.push(route.provisioned_route_id);
                            callback(null);
                        }, function(err){
                            if(err){
                                console.log("Error while retriving data.");
                                return cb(err);
                            }
                            migrationData.callFlowIds = callFlowIds;
                            migrationData.phoneDetailIds = phoneDetailIds;
                            migrationData.provisionedRouteIds = provisionedRouteIds;
                            cb(null);
                        });
                    } else {
                        cb(null);        
                    }
                }); 
            },
            function (cb) {
                var ctTrans = new ctTransactionModel.begin(function(err) {
                async.waterfall([
                        function(callback){
                            //update campaign ouid
                            if(migrationData.campaignIds.length > 0) {
                                var updateData = {
                                    table : 'campaign',
                                    values: {'campaign_ou_id' : migrateToOuid},
                                    where: " WHERE campaign_id IN(" + migrationData.campaignIds.join(',') +") AND campaign_ou_id = "+ migrateFromOuid
                                };
                                connector.ctPool .update(updateData, function(err, ret) {
                                    if (err) { callback(err); return; } else { callback(null); }
                                });
                            } else {
                                cb("No campaigns provided to migrate.");
                            }
                        },
                        function(callback){
                            //update call flows
                            if(migrationData.callFlowIds.length > 0) {
                                var updateData = {
                                    table : 'call_flows',
                                    values: {'ouid' : migrateToOuid},
                                    where: " WHERE id IN(" + migrationData.callFlowIds.join(',') +") AND ouid = "+ migrateFromOuid
                                };
                                connector.ctPool .update(updateData, function(err, ret) {
                                    if (err) { callback(err); return; } else { callback(null); }
                                });
                            } else {
                                callback(null);
                            }
                        },
                        function(callback){
                            //update provisioned_route
                            if(migrationData.provisionedRouteIds.length > 0) {
                                var updateData = {
                                    table : 'provisioned_route',
                                    values: {'provisioned_route_ou_id' : migrateToOuid},
                                    where: " WHERE provisioned_route_id IN(" + migrationData.provisionedRouteIds.join(',') +") AND provisioned_route_ou_id = "+ migrateFromOuid
                                };
                                connector.ctPool .update(updateData, function(err, ret) {
                                    if (err) { callback(err); return; } else { callback(null); }
                                });
                            } else {
                                callback(null);
                            }
                        },
                        function(callback){
                            //update phone number details
                            if(migrationData.phoneDetailIds.length > 0) {
                                var updateData = {
                                    table : 'phone_detail',
                                    values: {'org_unit_id' : migrateToOuid},
                                    where: " WHERE number_id IN(" + migrationData.phoneDetailIds.join(',') +") AND org_unit_id = "+ migrateFromOuid
                                };
                                connector.ctPool .update(updateData, function(err, ret) {
                                    if (err) { callback(err); return; } else { callback(null); }
                                });
                            } else {
                                callback(null);
                            }
                        }
                    ],function (err) {
                        if (err) {
                            ctTrans.rollback(function(){
                                cb(err);
                            });
                        } else {
                            ctTrans.commit(function(){
                                cb(null);
                            });
                        }
                    });// End of watrfall
                }); // End of transact model
            }
        ],
        function(err) {
            if (err) { return res(err); }
            res(null, migrationData);
        });
    }
};

module.exports = mig;