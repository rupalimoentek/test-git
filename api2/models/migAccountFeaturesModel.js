var connector 			= require('./appModel'),
	ctTransactionModel	= require('./ctTransactionModel'),
	appModel			= require('./appModel'),
	table				= 'mig_account_features';

var mig = {
	postData: function(req,callback){
		var qry = "INSERT INTO "+req.body.data.table+" (\""+req.body.data.keys.join('","')+"\") VALUES ("+req.body.data.values.join(',')+");";
		appModel.ctPool.query(qry,function(err,results){
			callback(err,results);
		});
	},
	getById: function(req,callback){
		var qry = "SELECT id,account_name FROM "+table+" WHERE account_id = "+req.params.id+" ORDER BY id DESC LIMIT 1;";
		appModel.ctPool.query(qry,function(err,results){
			callback(err,results);
		});
	},
	getSessions: function(req,callback){
		var qry = "SELECT DISTINCT (session_id)::int FROM "+table+" ORDER BY session_id DESC;";
		appModel.ctPool.query(qry,function(err,results){
			callback(err,results);
		});
	}
};

module.exports = mig;