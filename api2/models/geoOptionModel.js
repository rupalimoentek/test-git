var appModel = require('./appModel'),
	f = require('../functions/functions.js'),
	table = 'geo_options',
	sptable = 'ce_geo_options';

var geoOption = {
	create: function(data, res){
		var insertData = {
			table : sptable,
			values: data
		};
		appModel.ctPool.insert(insertData, function(err, data){
			res(err, data);
		});
	},
	removeByGeoRouteId: function(model, geo_route_id, res){
		async.parallel([
			function(callback) {
				var qry = "DELETE FROM " + sptable + " WHERE geo_route_id = " + geo_route_id;
				var qryData = {
					which: 'query',
					qry: qry
				};
				model.query(qryData, function(err, data){
					callback(err);
				});				
			},
			function(callback) {
				var qry = "DELETE FROM ce_geo_claimed_zip WHERE geo_route_id = " + geo_route_id;
				var qryData = {
					which: 'query',
					qry: qry
				};
				model.query(qryData, function(err, data){
					callback(err);
				});	
			}
		],
		function(err, results) {
			res(err);
		});
		
	}
};

module.exports = geoOption;
