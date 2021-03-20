var connector = require('./appModel')

    var ProvisionedRoutesByLocation = function(locationId, res){
        var qry = "SELECT ccf.provisioned_route_id FROM location_route as lr ";
					qry += "JOIN location as loc on loc.location_id = lr.location_id ";
					qry += "JOIN ce_geo_routes as cgr on cgr.location_id = loc.location_id ";
					qry += "LEFT JOIN ce_call_flows ccf on ccf.routable_id = cgr.id ";
					qry += "WHERE lr.location_route_id = "+locationId+ " AND ccf.app_id = 'CT'";
		connector.ctPool.query(qry, function(err, data){
			res(err, data);
		});
	};


module.exports = ProvisionedRoutesByLocation;