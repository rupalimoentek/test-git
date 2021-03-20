var connector = require('./appModel'),
	table = 'campaign_ct_user';

var campaignCtUser = {
	create: function(data, res){
		var insertData = {
			table : table,
			values: data
		};
		connector.ctPool.insert(insertData, function(err, data){
			res(err, data);
		});
	},
	insertMany: function(user_ids, campaign_id, res){
		var values = [];
		for (var i = user_ids.length - 1; i >= 0; i--) {
			values.push('(' + campaign_id + ',' + user_ids[i] + ')');
		}
		var qry = 'INSERT INTO ' + table + ' (campaign_id, ct_user_id) VALUES ' + values.join(',');
		connector.ctPool.query(qry, function(err, data){
			res(data);
		});
	},
	insertManyCampaigns: function(ctTrans,user_id, campaign_ids, res){
		var values = [];
		for (var i = campaign_ids.length - 1; i >= 0; i--) {
			values.push('(' + campaign_ids[i] + ',' + user_id + ')');
		}
		if(values.length > 0) {
			// var qry = 'INSERT INTO ' + table + '(campaign_id, ct_user_id) VALUES ' + values.join(',');
			var qry = 'INSERT INTO ' + table + '(campaign_id, ct_user_id) ';
			qry +=  'SELECT DISTINCT ON (campaign_id, ct_user_id) val.campaign_id, val.ct_user_id FROM ( VALUES ' + values.join(',') +') ';
			qry += 'val (campaign_id, ct_user_id) ';
			qry += 'LEFT JOIN campaign_ct_user ctu USING (campaign_id, ct_user_id) ';
			qry += 'WHERE ctu.campaign_id IS NULL';
			var insertData= {
				which: 'query',
				qry: qry
			};
			ctTrans.query(insertData,function(err, data){
				res(err,data);
			});
		} else {
			res('','Nothing to update');
		}
	},
	deleteAll: function(campaign_id, res) {
		var qry = 'DELETE FROM ' + table + ' WHERE campaign_id = ' + campaign_id;
		connector.ctPool.query(qry, function(err,data){
			res(data);
		});
	}
};

module.exports = campaignCtUser;