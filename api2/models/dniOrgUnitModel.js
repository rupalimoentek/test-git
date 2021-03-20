var mysql   = require('mysql'),
	appModel = require('./appModel'),
	yaml = require("js-yaml"),
	f = require('../functions/functions.js'),
	fs = require("fs"),
	e = yaml.load(fs.readFileSync("config/database.yml")),
	envVar = process.env.NODE_ENV,
	async = require('async'),
	geoCoder = require('../lib/geoCoder'),
	crypto = require('crypto'),
	table = 'dni_org_unit';

var dniOrgUnit = {
	create: function(data, res){
		//ues md5 hash of org_unit_id as dni code
		data.dni_code = crypto.createHash('md5').update(data.org_unit_id.toString()).digest('hex');
		
		var insertData = {
			table : table,
			values: data
		};
		//console.log(insertData);
		//save data
		appModel.ctPool.insert(insertData, function(err, retData){
			res(err, retData);
			//res(null, 'done');
		});
	},
	update: function(data, res){
        var selectQry = "SELECT org_unit_id from " + table + " where org_unit_id = " + data.org_unit_id;
        appModel.ctPool.query(selectQry, function(err, ret) {
            if (err) {
                cb(err);
            } else {
                if (ret.length > 0 && ret[0].org_unit_id) {
                	var insertData = {
                		org_unit_id: data.org_unit_id,
                		dni_code: crypto.createHash('md5').update(data.org_unit_id.toString()).digest('hex'),
                		custom_params: data.custom_params
                	}
					var updateData = {
						table : table,
						values: data,
						where: " WHERE org_unit_id = "+data.org_unit_id
					};
					//console.log(insertData);
					appModel.ctPool.update(updateData, function(err, retData){
						res(err, retData);
					});
                } else {
                    var insertData = {
						table : table,
						values: data
					};
					appModel.ctPool.insert(insertData, function(err, retData){
						res(err, retData);
						//res(null, 'done');
					});
                }
            }
        });
	},
	create_for_cqm: function(data, res){
		var sql = "SELECT org_unit_id from dni_org_unit where org_unit_id = "+data.org_unit_id;
		appModel.ctPool.query(sql, function(err, result){
			console.log("Creating dni code");
			if(result.length == 0){// create dni code if its not exist
				var insertData = {
					table : table,
					values: data
				};
				appModel.ctPool.insert(insertData, function(err, retData){
					res(err, retData);
				});
			} else {
				res(err, "Already Exist.");
			}
		});
	}
};


module.exports = dniOrgUnit;