var appModel = require('./appModel'),
	f = require('../functions/functions.js'),
	fs = require("fs"),
	e = yaml.load(fs.readFileSync("config/call_flows.yml")),
	route_types = e.call_flows.types,
	table = 'percentage_route',
	sptable = 'ce_percentage_route';

var percentageRoute = {
	create: function(data, res){
		var insertData = {
			table : sptable,
			values: data
		};
		appModel.ctPool.insert(insertData, function(err, data){
			res(err, data);
		});
	},
	remove: function(model, percentage_route_id, res){
		var qry = "DELETE FROM " + sptable + " WHERE id = " + percentage_route_id;
		var qryData = {
			which: 'query',
			qry: qry
		};
		model.query(qryData, function(err){
			res(err);
		});
	}
};

module.exports = percentageRoute;
