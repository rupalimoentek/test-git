var appModel = require('./appModel'),
	f = require('../functions/functions.js'),
    fs = require("fs"),
	yaml = require("js-yaml"),
    envVar = process.env.NODE_ENV,
    geoCoder = require('../lib/geoCoder'),
	async = require('async'),
	ctlogger    = require('../lib/ctlogger.js'),
	_ = require('underscore'),
    ctTransactionModel = require('./ctTransactionModel'),
    toll_frees = require('../config/toll_free.json');
    
var numberPool = {
    getByBillingOuid: function(req,callback){
        //// FOR AMP3 USE DO NOT CHANGE
        var billingOuid = req.params.ouid;

        var trans = new ctTransactionModel.begin(function(err){
            if (err) {
                return callback(err);
            }

            var qry = "SELECT *"; 
            qry += " FROM phone_pool AS pp";
            qry += " JOIN phone_pool_number AS ppn ON ppn.pool_id = pp.pool_id";
            qry += " WHERE pp.org_unit_id IN (";
            qry += " SELECT org_unit_id FROM org_unit WHERE billing_id = "+billingOuid;
            qry += " )";

            trans.query(qry,function(err,data){
                trans.close(function(er){
                    callback(err,data);
                });
            });

        });

    },
    read: function(data, res){
        var keys =  _.keys(data); 
        var qury = "SELECT * FROM phone_pool WHERE " +  keys + " = "+ data[keys] ;
		appModel.ctPool.query(qury, function(err, data){
			res(err, data);
		});
    },
    read_phone_pool_number : function(data, res){
    	var keys =  _.keys(data);        
	var qury = "SELECT * FROM phone_pool_number WHERE " +  keys + " = "+ data[keys] ;
		appModel.ctPool.query(qury, function(err, data){
			res(err, data);
		});
    },
	write: function(poolData, res){
        var date_timestamp = 'CURRENT_TIMESTAMP';
        poolData.number_count = poolData.phone_number.length;
        if(poolData.number_count == undefined || poolData.number_count == null){
            poolData.number_count = 1;
        }
        if(poolData.keep_alive_mins == null || poolData.keep_alive_mins == undefined){
            poolData.keep_alive_mins = 5;
        }
        var poolD = {
            org_unit_id : poolData.org_unit_id,
            provisioned_route_id : poolData.provisioned_route_id,
            pool_name : poolData.pool_name,
            keep_alive_mins : poolData.keep_alive_mins,
            number_count : poolData.number_count,
            pool_created :  date_timestamp
        };
        var insertData = {
            table: 'phone_pool',
            values: poolD   
        };
        appModel.ctPool.insert(insertData, function(err, result){
            if (err) {return res(err);}
            var pool_id = result.insertId;
            if (poolData.isFromCqm === undefined) {
                async.each(poolData.phone_number, function(phone_number, cb){
                    var npa = phone_number.number.substr(0, 3);
                    var number_type = 'did';
                    var resporg_id = '';
                    if (toll_frees && toll_frees.npa && toll_frees.npa.indexOf(parseInt(npa)) > -1) {
                        number_type = 'tfn';
                        resporg_id = 'CHP01';
                    }
                    var qry = " INSERT INTO phone_pool_number (pool_id,last_used,phone_number,vendor_id,number_type,resporg_id) values " ;
                        qry += "(" +pool_id + "," + phone_number.last_used + ","+ phone_number.number + ","+ phone_number.vendor_id + ",'" + number_type + "','" + resporg_id + "') ";
                    appModel.ctPool.query(qry, function(err){
                        cb(err);
                    });
                },
                function(err){
                    var poolRes = [{
                        pool_id: pool_id
                    }]
                    res(err, poolRes);
                });
            } else {
                //// THIS IS FOR AMP3 CQM POOL MIGRATIONS
                console.log("!!!!! This is a cqm number pool !!!!");
                async.eachSeries(poolData.phone_number,function(number,cb){
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
                    var qry = " INSERT INTO phone_pool_number (pool_id,last_used,phone_number,number_type,resporg_id) values (" ;
                    qry += "" + pool_id + "," + lastUsed + ","+ number.number + ",'" + did_type + "','" + resporg_id +  "') ";
                    appModel.ctPool.query(qry, function(err, data){
                        cb(err);
                    });
                },
                function(err){
                    var poolRes = [{
                        pool_id: pool_id
                    }]
                    res(err, poolRes);
                });
            }
        });        
	},
	update: function(poolData, model, res){
		var updateData = {
            which: 'update',
            table : 'phone_pool',
            values: poolData,
            where: " WHERE pool_id = " + poolData.pool_id
        };
        var qry = " UPDATE  phone_pool SET provisioned_route_id ="+ poolData.provisioned_route_id + ", " + "status ="; 
            qry +="'"+ poolData.status + "' " + "WHERE pool_id ="+ poolData.pool_id;
            model.update(updateData, function(err, data){
                res(err, data);
            });
    },
    updateApp: function(poolData, res){
	var updateData = {
            which: 'update',
            table : 'phone_pool',
            values: poolData,
            where: " WHERE pool_id = " + poolData.pool_id
        };
        appModel.ctPool.update(updateData, function(err, data){
            res(err, data);
		});
	}
};


module.exports = numberPool;
