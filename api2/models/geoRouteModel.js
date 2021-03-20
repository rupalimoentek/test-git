var appModel = require('./appModel'),
	f = require('../functions/functions.js'),
	table = 'ce_geo_routes';

var geoRoute = {
	create: function(data, res){
		if (!data.play_branding) {
			data.play_branding = 1;
		}
		if (!data.allow_manual_entry) {
			data.allow_manual_entry = 1;
		}
		var insertData = {
			table : table,
			values: data
		};
		appModel.cePool.insert(insertData, function(err, data){
			res(err, data);
		});
	},
	update: function(data, res){
		var updateData = {
			table : table,
			values: data,
			where: ' WHERE id = ' + data.id
		};
		appModel.cePool.update(updateData, function(err, data){
			res(err, data);
		});
	},
	deleteIvrGeo: function(tran, data, res){
		var geo_route_ids = [];
		async.each(data, function(d, cb){
			var t = d.target_did.split('://');
			switch(t[0]){
				case 'geo_route':
					geo_route_ids.push(t[1]);
				break;
			}
			cb(null);
		},
		function(err){
			async.parallel([
				function(cb1){
					if(geo_route_ids.length) {
					var qry = "DELETE FROM ce_geo_routes WHERE id in (" + geo_route_ids.join(',') + ")";
					var qryData = {
						which: 'query',
						qry: qry
					};
					tran.query(qryData, function(err){
						cb1(err);
					});
					} else {
						cb1(err);
					}
				},
				function(cb1){
					if(geo_route_ids.length) {
					var qry = "DELETE FROM ce_geo_options WHERE geo_route_id in (" + geo_route_ids.join(',') + ")";
					var qryData = {
						which: 'query',
						qry: qry
					};
					tran.query(qryData, function(err){
						cb1(err);
					});
					} else {
						cb1(err);
					}
				}
				],
				function(err){
					res(err);
				}
			);
		});
	}
};

module.exports = geoRoute;
