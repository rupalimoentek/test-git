var appModel = require('./appModel'),
	table = 'indicator_score';

var indicatorScore = {
	getByCallId: function(call_id, res){
		var qry = "SELECT ind.indicator_name AS name";
		qry += ", isc.score_value AS score";
		qry += " FROM "+table+" AS isc";
		qry += " JOIN indicator AS ind ON ind.indicator_id = isc.indicator_id";
		qry += " WHERE isc.call_id = " + call_id;
		appModel.ctPool.query(qry, function(err, result){
			res(err, result);
		});
	},
	getByCallIds: function(call_ids, res){
		var qry = "SELECT ind.indicator_name AS name";
		qry += ", isc.call_id AS call_id, isc.score_value AS score";
		qry += " FROM "+table+" AS isc";
		qry += " JOIN indicator AS ind ON ind.indicator_id = isc.indicator_id";
		qry += " WHERE isc.call_id in (" + call_ids.join(',') + ")";
		appModel.ctPool.query(qry, function(err, result){
			var r = {};
			if (!result){ res(err, r);return;}
			var call_ids = [];
			for (var i = result.length - 1; i >= 0; i--) {
				if (call_ids.indexOf(result[i].call_id) < 0) {
					call_ids.push(result[i].call_id);
					r[result[i].call_id] = [];
				}
				r[result[i].call_id].push({
					name: result[i].name,
					score: result[i].score
				});
			}
			res(err, r);
		});
	}
};

module.exports = indicatorScore;