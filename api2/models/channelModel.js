var connector = require('./appModel'),
	f = require('../functions/functions.js'),
	table = 'channel';

var channel = {
	read: function(res){
		var qry = "SELECT channel_id, category, sub_category FROM " + table + " WHERE channel_status = 'active' ORDER BY category ASC, sub_category ASC";
		connector.ctPool.query(qry, function(err, data){
			res(data);
		});
	}
};

module.exports = channel;