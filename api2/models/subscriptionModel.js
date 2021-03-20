var appModel = require('./appModel');

var subscription = {
		getAllCounts: function(data, res) {
		//check if it is a billing ou
		var qry = "SELECT org_unit_id AS ouid, billing_id AS billingid";
		qry += " FROM org_unit WHERE org_unit_id = "+data['ouId'];


		/*TODO
		 * PROBLEM: we dont have status
		 */

		appModel.ctPool.query(qry, function(err, data) {
			if (data[0].billingid === null) {
				//if billing ou
				qry = "SELECT SUM(Counter.count_total) as totals, CONCAT(Counter.component_id, '_', Counter.campaign_status) as labelId";
				qry += " FROM org_component_count AS Counter";
				qry += " INNER JOIN org_unit as OU ON (OU.org_unit_id = Counter.org_unit_id)";
				qry += " WHERE OU.billing_id = " + data[0].ouid;
				qry += " GROUP BY labelId";
				qry += " ORDER BY labelId ASC";
			} else {
				//if is not a billing ou
				qry = "SELECT SUM(Counter.count_total) as totals FROM org_component_count AS Counter";
				qry += " WHERE Counter.org_unit_id = " + data[0].ouid;
				qry += " GROUP BY Counter.component_id, Counter.campaign_status";
				qry += " ORDER BY Counter.campaign_status ASC";
			}

			appModel.ctPool.query(qry, function(err, data) {
				console.log(JSON.parse(data));
				//parse result

			});
		});
	},
	getCampaignsCounts: function(data, res) {
		var qry = "SELECT org_unit_id AS ouid, billing_id AS billingid";
		qry += " FROM org_unit WHERE org_unit_id = "+data['ouId'];

		appModel.ctPool.query(qry, function(err, data) {
			if (data[0].billingid === null) {
				qry = "SELECT COUNT(Camp.campaign_id) as totals";
				qry += " FROM campaign AS Camp";
				qry += " INNER JOIN org_unit as OU ON (OU.org_unit_id = Camp.campaign_ou_id)";
				qry += " LEFT JOIN org_billing as OUBilling ON (OUBilling.org_unit_id = "+data[0].ouid+")";
				qry += " WHERE (OU.billing_id = " + data[0].ouid;
				qry += " OR OU.org_unit_id = " + data[0].ouid + ")";
				qry += " AND (Camp.campaign_start_date >= OUBilling.prev_invoice_date OR OUBilling.prev_invoice_date IS NULL)";
				qry += " GROUP BY Camp.campaign_status";
				qry += " ORDER BY Camp.campaign_status DESC";
			} else {
				qry = "SELECT COUNT(Camp.campaign_id) as totals";
				qry += " FROM campaign AS Camp";
				qry += " INNER JOIN org_unit as OU ON (OU.org_unit_id = Camp.campaign_ou_id)";
				qry += " LEFT JOIN org_billing as OUBilling ON (OUBilling.org_unit_id = OU.billing_id)";
				qry += " WHERE Camp.campaign_ou_id = " + data[0].ouid;
				qry += " AND (Camp.campaign_start_date >= OUBilling.prev_invoice_date OR OUBilling.prev_invoice_date IS NULL)";
				qry += " GROUP BY Camp.campaign_status";
				qry += " ORDER BY Camp.campaign_status DESC";
			}

			appModel.ctPool.query(qry, function(err, data) {
				var response = { 'total': 0, 'active': 0 };
				if (data[0] !== null && data[1] !== undefined) {
					//console.log('data[1].totals: ' + data[1].totals);
					response = {
						'total': (parseInt(data[0].totals) || 0) + (parseInt(data[1].totals) || 0),
						'active': parseInt(data[0].totals) || 0
					};
				}
				res(response);
			});
		});
	},
	getTrackingNumbersCounts: function(data, res) {
		var qry = "SELECT org_unit_id AS ouid, billing_id AS billingid";
		qry += " FROM org_unit WHERE org_unit_id = "+data['ouId'];

		appModel.ctPool.query(qry, function(err, data) {
			if (data[0].billingid === null) {
				qry = "SELECT COUNT(Pr.provisioned_route_id) as totals FROM provisioned_route AS Pr";
				qry += " INNER JOIN org_unit as OU ON (OU.org_unit_id = Pr.provisioned_route_ou_id)";
				qry += " LEFT JOIN org_billing as OUBilling ON (OUBilling.org_unit_id = "+data[0].ouid+")";
				qry += " WHERE (OU.billing_id = " + data[0].ouid;
				qry += " OR OU.org_unit_id = " + data[0].ouid + ")";
				qry += " AND Pr.provisioned_route_status IN ('active', 'inactive')";
				qry += " AND (Pr.provisioned_route_created >= OUBilling.prev_invoice_date OR OUBilling.prev_invoice_date IS NULL)";
				qry += " GROUP BY Pr.provisioned_route_status";
				qry += " ORDER BY Pr.provisioned_route_status DESC";
			} else {
				qry = "SELECT COUNT(Pr.provisioned_route_id) as totals FROM provisioned_route AS Pr";
				qry += " INNER JOIN org_unit as OU ON (OU.org_unit_id = Pr.provisioned_route_ou_id)";
				qry += " LEFT JOIN org_billing as OUBilling ON (OUBilling.org_unit_id = OU.billing_id)";
				qry += " WHERE Pr.provisioned_route_ou_id = " + data[0].ouid;
				qry += " AND Pr.provisioned_route_status IN ('active', 'inactive')";
				qry += " AND (Pr.provisioned_route_created >= OUBilling.prev_invoice_date OR OUBilling.prev_invoice_date IS NULL)";
				qry += " GROUP BY Pr.provisioned_route_status";
				qry += " ORDER BY Pr.provisioned_route_status DESC";
			}

			appModel.ctPool.query(qry, function(err, data) {
				var response = { 'total': 0, 'active': 0 };
				if(data){
					if (data[0] !== null && data[1] !== undefined ) {
					//	console.log('data[1].totals:' + data[1].totals);
						response = {
							'total': (parseInt(data[0].totals) || 0 ) + (parseInt(data[1].totals) || 0),
							'active': parseInt(data[0].totals) || 0
						};
					}
				}
				res(response);
			});
		});
	},
	getMinutesUsed: function(data, res) {
		var qry = "SELECT org_unit_id AS ouid, billing_id AS billingid";
		qry += " FROM org_unit WHERE org_unit_id = "+data.ouId;

		appModel.ctPool.query(qry, function(err, data) {
			if (data[0].billingid === null) {
				qry = "SELECT SUM(Call.duration) as totals FROM call AS Call";
				qry += " INNER JOIN org_unit as OU ON (OU.org_unit_id = Call.org_unit_id)";
				qry += " LEFT JOIN org_billing as OUBilling ON (OUBilling.org_unit_id = "+data[0].ouid+")";
				qry += " WHERE (OU.billing_id = " + data[0].ouid;
				qry += " OR OU.org_unit_id = " + data[0].ouid + ")";
				qry += " AND (Call.call_started >= OUBilling.prev_invoice_date OR OUBilling.prev_invoice_date IS NULL)";
			} else {
				qry = "SELECT SUM(Call.duration) as totals FROM call AS Call";
				qry += " INNER JOIN org_unit as OU ON (OU.org_unit_id = Call.org_unit_id)";
				qry += " LEFT JOIN org_billing as OUBilling ON (OUBilling.org_unit_id = OU.billing_id)";
				qry += " WHERE Call.org_unit_id = " + data[0].ouid;
				qry += " AND (Call.call_started >= OUBilling.prev_invoice_date OR OUBilling.prev_invoice_date IS NULL)";
			}

			appModel.ctPool.query(qry, function(err, data) {
				var response = { 'total': 0 };
				if (data[0] !== null) {
					response = {'total': parseInt(data[0].totals) || 0 };
				}
				res(response);
			});
		});
	},
	getUserUsed: function(data, res) {
		var qry = "SELECT org_unit_id AS ouid, billing_id AS billingid";
		qry += " FROM org_unit WHERE org_unit_id = "+data.ouId;

		appModel.ctPool.query(qry, function(err, data) {
			if (data[0].billingid === null) {
				qry = "SELECT count(U.ct_user_id) as totals FROM ct_user AS U";
				qry += " INNER JOIN org_unit as OU ON (OU.org_unit_id = U.ct_user_ou_id)";
				qry += " LEFT JOIN org_billing as OUBilling ON (OUBilling.org_unit_id = "+data[0].ouid+")";
				qry += " WHERE (OU.billing_id = " + data[0].ouid;
				qry += " OR OU.org_unit_id = " + data[0].ouid + ")";
				qry += " AND U.user_status = 'active'";
			} else {
				qry = "SELECT count(U.ct_user_id) as totals FROM ct_user AS U";
				qry += " WHERE U.ct_user_ou_id = " + data[0].ouid;
				qry += " AND U.user_status = 'active'";
			}

			appModel.ctPool.query(qry, function(err, data) {
				var response = { 'total': 0 };
				if (data[0] !== null) {
					response = {'total': parseInt(data[0].totals) || 0 };
				}
				res(response);
			});
		});

	},
	/*getCallActions: function(data, res) {
		var qry = "SELECT count(User.id) as totalUsers FROM ct_user AS User";
		qry += " WHERE User.ct_user_ou_id = "+data['ouId'];
		qry += " AND User.user_status = 'active'";
		//console.log(qry);
		appModel.ctPool.query(qry, function(err, data) {
			//console.log(ouList);
			res(data[0].totalUsers);
		});
		res({'total': 22});
	}*/
};

module.exports = subscription;
