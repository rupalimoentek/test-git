var connector = require('./appModel'),
	table = 'provisioned_route_number';

var provisionedRouteNumber = {
	// JAW fix where clause of query
	phoneIdByPrId: function(id, res){
		var qry = "SELECT phone_number_id";
		qry += " FROM "+table;
		qry += " WHERE provisioned_route_id = " +id;
		appModel.ctPool.query(qry, function(err, result){
			res(err, r);
		});
	}
};

module.exports = provisionedRouteNumber;
