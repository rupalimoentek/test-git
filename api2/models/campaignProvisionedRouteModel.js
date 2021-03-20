var connector = require('./appModel'),
	table = 'campaign_provisioned_route';

var campaignsProvisionedRoutes = {
	create: function(data, res){
		var insertData = {
			table : table,
			values: data
		};
		connector.ctPool.insert(insertData, function(err, data){
			res(err, data);
		});
	},
	getProvisionedRoutes: function(campaign_id, res){
		var qry = "SELECT cpr.provisioned_route_id FROM " + table + " as cpr"
			qry += " JOIN provisioned_route as pr on cpr.provisioned_route_id = pr.provisioned_route_id AND provisioned_route_status !='deleted'";
			qry += " WHERE campaign_id = " + campaign_id;
		connector.ctPool.query(qry, function(err, data){
			res(err, data);
		});
	}
};

module.exports = campaignsProvisionedRoutes;