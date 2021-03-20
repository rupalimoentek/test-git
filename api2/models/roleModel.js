var transaction = require('./ctTransactionModel'),
	table = 'role';
var role = {
	getAll: function(callback){
		var trans = new transaction.begin(function(err){
			if (err) {
				callback(err);
				return;
			}
			var qry = "SELECT role_id, role_name FROM "+table;
			trans.select(qry, function(err, data){
				callback(err, data);
				trans.close(function(err){});
			});
		});
	}
};
module.exports = role;
