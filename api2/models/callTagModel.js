var appModel = require('./appModel'),
	table = 'call_tag';

var callTag = {
	getByCallIds: function(call_ids, res){
		var qry = "SELECT call_id, tag_id";
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
					tag_if: result[i].tag_id
				});
			}
			res(err, r);
		});
	}
};

module.exports = callTag;