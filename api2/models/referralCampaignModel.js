var connector    = require('./appModel');
var async        = require('async');


var referral = {
	read  : function (campaignId,res) {
		//var qry = "SELECT campaign_id,referral_number,campaign_end_date FROM campaign WHERE campaign_id="+req;
	  	var qry = "SELECT pr.provisioned_route_id, c.campaign_end_date, c.campaign_id, c.referral_number,pr.referral_end_date ";
	  		qry += "FROM campaign as c ";
			qry += "JOIN campaign_provisioned_route as cpr on cpr.campaign_id = c.campaign_id ";
			qry += "JOIN provisioned_route as pr on cpr.provisioned_route_id = pr.provisioned_route_id ";
			qry += "WHERE c.referral_number IS NOT NULL AND pr.provisioned_route_status != 'deleted' AND c.campaign_id =" + campaignId;
	    connector.ctPool.query(qry, function (err, data) {
	      res(err, data);
	    });
	},
	campaignReferralData  : function (campaignId,res) {
		var qry = "SELECT campaign_id,referral_number,campaign_end_date FROM campaign WHERE campaign_id="+campaignId;
	    connector.ctPool.query(qry, function (err, data) {
	      res(err, data);
	    });
	}
}
module.exports = referral;
