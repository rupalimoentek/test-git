var connector 			= require('./appModel'),
	ctTransactionModel	= require('./ctTransactionModel'),
	appModel			= require('./appModel'),
	table				= 'mig_group',
	async				= require('async');

var mig = {
	getByCustomerId: function(req,callback){
		var qry = "SELECT cfa_ouid FROM "+table+" WHERE customer_id = "+req.params.customer_id+" AND status = 'migrated';";
		appModel.ctPool.query(qry,function(err,results){
			callback(err,results);
		});
	},
	post: function(req,callback){
		async.eachSeries(req.body.data,function(group,cb){
			var sets = ['account_id','customer_id','session_id','cfa_ouid','status'];
			var values = [group.account_id,group.customer_id,group.session_id,group.cfa_ouid,group.status,];
			if(group.msg){
				sets.push('msg');
				values.push(group.msg);
			}
			sets.push('created');
			var qry = "INSERT INTO "+table+" ("+sets.join(',')+") VALUES ('"+values.join("','")+"',NOW());";
			var trans = new ctTransactionModel.begin(function(err){
				data = {
					which: 'query',
					qry: qry
				};
				trans.query(data, function(err, data){
					if (err) {
						trans.rollback(function(){
							cb(err);
						});
					} else {
						trans.commit(function(){
							cb(null);
						});
					}
				});
			});
		},
		function(err){
			callback(err);
		});
	}
};

module.exports = mig;