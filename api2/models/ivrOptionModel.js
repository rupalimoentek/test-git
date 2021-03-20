var appModel = require('./appModel'),
	f = require('../functions/functions.js'),
	fs = require("fs"),
	e = yaml.load(fs.readFileSync("config/call_flows.yml")),
	route_types = e.call_flows.types,
	table = 'ivr_options2',
	sptable = 'ce_ivr_options2';

var ivrOption = {
	create: function(data, res){
		var date_timestamp = f.mysqlTimestamp();
		data.updated_at = date_timestamp;
		data.created_at = date_timestamp;
		var insertData = {
			table : sptable,
			values: data
		};
		appModel.ctPool.insert(insertData, function(err, data){
			res(err, data);
		});
	},
	removeByIvrRouteId: function(model, ivr_route_id, res){
		async.parallel([
			function(cb){
				var select = "SELECT target_did FROM " + sptable + " WHERE ivr_route_id = " + ivr_route_id;
				appModel.ctPool.query(select, function(err, result){
					if (result.length > 0) {
						var geoRouteModel = require('./geoRouteModel');
						geoRouteModel.deleteIvrGeo(model, result, function(err, result){
							cb(err);
						});
					}
				});
			},
			function(cb){
				var qry = "DELETE FROM " + sptable + " WHERE ivr_route_id = " + ivr_route_id;
				var qryData = {
					which: 'query',
					qry: qry
				};
				model.query(qryData, function(err, data){
					cb(err);
				});
			}
			],
			function(err){
				res(err);
			}
		);
	}
};

module.exports = ivrOption;
