var connector 			= require('./appModel'),
	ctTransactionModel	= require('./ctTransactionModel'),
	appModel			= require('./appModel'),
	table				= 'mig_campaign_provisioning';

var mig = {
	postData: function(req,callback){
		var qry = "INSERT INTO "+req.body.data.table+" (\""+req.body.data.keys.join('","')+"\") VALUES ("+req.body.data.values.join(',')+");";
		appModel.ctPool.query(qry,function(err,results){
			console.log('err ',err,' results ',results)
			callback(err,results);
		});
	},
	getCampaigns: function(req,callback){
		var qry = "SELECT DISTINCT ON (cp.campaign_id) cp.id,cp.session_id,cp.account_id,cp.customer_id,cp.customer_name,cp.campaign_id,cp.campaign_name,cp.tracking_number,cp.target_number,cp.status";
		qry += ",mc.cfa_campaign_id AS cfa_campaign_id";
		qry += ",mr.cfa_route_id AS cfa_route_id";
		qry += " FROM mig_campaign_provisioning AS cp";
		qry += " LEFT JOIN mig_campaign AS mc ON mc.cs_campaign_id::INTEGER = cp.campaign_id AND mc.status = 'migrated'";
		qry += " LEFT JOIN mig_route AS mr ON mr.cs_campaign_id::INTEGER = cp.campaign_id AND mr.status = 'migrated'";
		qry += " WHERE cp.session_id = '"+req.params.session_id+"'";
		qry +=  " AND cp.account_id = "+req.params.account_id+";";
		appModel.ctPool.query(qry,function(err,results){
			callback(err,results);
		});
	}
};

module.exports = mig;