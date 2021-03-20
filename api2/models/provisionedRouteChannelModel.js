var connector = require('./appModel'),
	table = 'provisioned_route_channel',
	ctTransactionModel;

var provisionedRoutesChannels = {
	create: function(data, res) {
		var insertData = {
			table : table,
			values: data
		};
		connector.ctPool.insert(insertData, function(err, data){
			res(err, data);
		});
	},
	deleteAll: function(model, provisioned_route_id, res) {
		var qry = "DELETE FROM " + table + " WHERE provisioned_route_id = " + provisioned_route_id;
		if (model) {
			ctTransactionModel = model;
			var qryData = {
				which: 'query',
				qry: qry
			};
			ctTransactionModel.query(qryData, function(err){
				res(err);
			});
		} else {
			connector.ctPool.query(qry, function(err, data){
				res(err);
			});
		}
	}
};

module.exports = provisionedRoutesChannels;