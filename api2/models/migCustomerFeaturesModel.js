var connector 			= require('./appModel'),
	ctTransactionModel	= require('./ctTransactionModel'),
	appModel			= require('./appModel'),
	table				= 'mig_customer_features';

var mig = {
	postData: function(req,callback){
		var qry = "INSERT INTO "+req.body.data.table+" (\""+req.body.data.keys.join('","')+"\") VALUES ("+req.body.data.values.join(',')+");";
		appModel.ctPool.query(qry,function(err,results){
			callback(err,results);
		});
	},
	getCustomers: function(req,callback){
		var qry = "SELECT DISTINCT ON (cf.customer_id) cf.session_id,cf.account_name,cf.account_id,cf.location___customer_name,cf.customer_id,cf.phone,cf.city,cf.zip,cf.state_province"; 
		qry += ",mg.id AS mig_group_id";
		qry += " FROM "+table+" AS cf";
		qry += " LEFT JOIN mig_group AS mg ON mg.customer_id = cf.customer_id AND mg.status = 'migrated'";
		qry += " WHERE cf.session_id = '"+req.params.session_id+"'";
		qry +=  " AND cf.account_id = "+req.params.account_id+";";
		appModel.ctPool.query(qry,function(err,results){
			callback(err,results);
		});
	}
};

module.exports = mig;