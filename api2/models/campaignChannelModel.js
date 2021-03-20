var connector = require('./appModel'),
	table = 'campaign_channel';

var campaignsChannels = {
	create: function(data, res){
		var insertData = {
			table : 'campaigns_channels',
			values: data
		};
		connector.ctPool.insert(insertData, function(err, data){
			res(err, data);
		});
	},
	deleteAll: function(campaign_id, res) {
		var qry = 'DELETE FROM ' + table + ' WHERE campaign_id = ' + campaign_id;
		console.log('qry is ' + qry);
		connector.ctPool.query(qry, function(err, data){
			res(data);
		});
	}
};

module.exports = campaignsChannels;