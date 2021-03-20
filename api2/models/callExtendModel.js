var appModel = require('./appModel'),
	table = 'call_extend';

var callExtend = {
	getByCallIds: function(call_ids, res){
		var qry = "SELECT call_id, call_data";
		qry += " FROM "+table;
		qry += " WHERE call_id in (" + call_ids.join(',') + ")";
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
					call_data: result[i].call_data
				});
			}
			res(err, r);
		});
	}
};

module.exports = callExtend;