var appModel = require('./appModel'),
	f = require('../functions/functions.js'),
	fs = require("fs"),
	e = yaml.load(fs.readFileSync("config/call_flows.yml")),
	route_types = e.call_flows.types,
	table = 'percentage_route_options',
	_     = require('underscore'),
	sptable = 'ce_percentage_route_options';

var percentageRouteOption = {
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
	removeByPercentageRouteId: function (model, routable_id, res){
		async.waterfall([
			function(cb2){
				var qry = "DELETE FROM ce_percentage_route WHERE id = " + routable_id;
				var deleteData = {
					which: 'query',
					qry: qry
				};
				model.query(deleteData, function(err, result) {
					if (err) { console.log('ERROR in deleteCallFlows deleting ce_percentage_route '+err); }
					cb2(err);
				});
			},
			function(cb2){
				var qry = "SELECT DISTINCT(ce_hunt_type_id) FROM ce_percentage_route_options WHERE percentage_route_id = '"
				qry += routable_id +"';"

				var percentageRouteData = {
					which: 'query',
					qry: qry
				};
				model.query(percentageRouteData, function(err, result) {
					if (err) { console.log('ERROR while fetching data from ce_percentage_route_options '+err); }
					cb2(err, result);
				});
			},
			function(result,cb2){
				// delete data from ce_scheduled_options.schedule_route_id-routableId
				var qry="delete from ce_percentage_route_options where percentage_route_id =" 
				qry += routable_id +";"

				var scheduleOptionData = {
					which: 'query',
					qry: qry
				};
				model.query(scheduleOptionData, function(err, scresult) {
					if (err) { console.log('ERROR while deleting data from schedule options '+err); }
					cb2(err, result);
				});
			},
			function(result, cb2){
				if(result && result.length > 0){
					console.log(result);
					var hunt_ids = []
					_.each(result, function(res){
						if(res.ce_hunt_type_id)
							hunt_ids.push(res.ce_hunt_type_id);
					});

					if(hunt_ids.length > 0){
						var qry = "DELETE FROM ce_hunt_types WHERE id IN(" + hunt_ids.join(',') +");"
						var huntTypesData = {
							which: 'query',
							qry: qry
						};
						model.query(huntTypesData, function(err) {
							if (err) { console.log('ERROR while removing hunt types '+err); }
							cb2(err, hunt_ids);
						});
					}else{
						cb2(null, hunt_ids);
					}
					
				}else
					cb2(null, result);
			

			},

			function(result, cb2){
				// delete data from ce_hunt_options.hunt_route_id
				if(result && result.length > 0){
					var qry = "DELETE FROM ce_hunt_options WHERE hunt_route_id IN(" + result.join(',') +");"
					var huntOptionData = {
						which: 'query',
						qry: qry
					};
					model.query(huntOptionData, function(err, result) {
						if (err) { console.log('ERROR while removing data from hunt options '+err); }
						cb2(err);
					});
				}else
					cb2(null);
			}
		],
		function(err){
			res(err)
		});
	}	
};
module.exports = percentageRouteOption;
