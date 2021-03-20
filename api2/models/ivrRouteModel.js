var appModel = require('./appModel'),
	f = require('../functions/functions.js'),
	fs = require("fs"),
	e = yaml.load(fs.readFileSync("config/call_flows.yml")),
	route_types = e.call_flows.types,
	table = 'ivr_routes2',
	sptable = 'ce_ivr_routes2',
	ctlogger    = require('../lib/ctlogger.js');

var ivrRoute = {
	create: function(data, res){
		var insertData = {
			table : sptable,
			values: data
		};
		appModel.ctPool.insert(insertData, function(err, data){
			res(err, data);
		});
	},
	remove: function(model, ivr_route_id, loggerData, res){
		var qry = "DELETE FROM " + sptable + " WHERE id = " + ivr_route_id;
		var qryData = {
			which: 'query',
			qry: qry
		};
		model.query(qryData, function(err){
			// var newdata = { 'org_unit_id':loggerData.ouid, 'ct_user_id':loggerData.userid, 'ivr_id':ivr_route_id, 'log_data':{'ivr_route_id':ivr_route_id} };
			// ctlogger.log(newdata, 'delete', 'ivr');
			res(err);
		});
	}
};

module.exports = ivrRoute;
