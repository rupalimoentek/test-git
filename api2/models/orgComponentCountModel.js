var mysql   = require('mysql'),
	connector = require('./appModel'),
	table = 'org_component_count';

var orgComponentCount = {
	increment: function(model, cid, ouid, value, res){
		var qry = "UPDATE " + table + " SET count_total=count_total+" + value + " WHERE component_id = " + cid + " AND org_unit_id = " + ouid;
		var qry1 = "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state='idle in transaction' AND query = '"+qry+"'";
		if (model) {
			model.query(qry1, function(err, result) {
				if(err){
					res(err);
				}else{
					model.query(qry, function(err, result){
						res(err, result);
					});
				}
			});
		} else {
			connector.ctPool.query(qry, function(err, data) {
				res(err,data);
			});
		}
	},
	decrement: function(model, cid, ouid, value, res){
		var qry = "UPDATE " + table + " SET count_total=count_total-" + value + " WHERE component_id = " + cid + " AND org_unit_id = " + ouid +" AND count_total > 0";
		var qry1 = "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state='idle in transaction' AND query = '"+qry+"'";
		if (model) {
			model.query(qry1, function(err, result) {
				if(err){
					res(err);
				}else{
					model.query(qry, function(err, result){
						res(err, result);
					});
				}
			});
		} else {
			connector.ctPool.query(qry, function(err, data){
				res(err,data);
			});
		}
	},
	incrementSubTotal: function(model, cid, ouid, value, res){
		var qry = "UPDATE " + table + " SET secondary_total=secondary_total+" + value + " WHERE component_id = " + cid + " AND org_unit_id = " + ouid;
		if (model) {
			model.query(qry, function(err, result) {
				res(err, result);
			});
		} else {
			connector.ctPool.query(qry, function(err, data) {
				res(err,data);
			});
		}
	},
	decrementSubTotal: function(model, cid, ouid, value, res) {
		var qry = "UPDATE " + table + " SET secondary_total=secondary_total-" + value + " WHERE component_id = " + cid + " AND org_unit_id = " + ouid;
		if (model) {
			//console.log("Model was true: " + qry);
			model.query(qry, function(err, result) {
				//console.log('error was : ',err);
				//console.log('result was : ',result);

				res(err, result);
			});
		} else {
			//console.log("model was false: " + qry);
			connector.ctPool.query(qry, function(err, data){
				res(err,data);
			});
		}
	},
	incrementRefTotal: function(model, cid, ouid, value, res){
		var qry = "UPDATE " + table + " SET referral_count = referral_count+" + value + " WHERE component_id = " + cid + " AND org_unit_id = " + ouid;
		if (model) {
			model.query(qry, function(err, result) {
				res(err, result);
			});
		} else {
			connector.ctPool.query(qry, function(err, data) {
				res(err,data);
			});
		}
	},
	decrementRefTotal: function(model, cid, ouid, value, res) {
		var qry = "UPDATE " + table + " SET referral_count = referral_count-" + value + " WHERE component_id = " + cid + " AND org_unit_id = " + ouid;
		if (model) {
			//console.log("Model was true: " + qry);
			model.query(qry, function(err, result) {
				//console.log('error was : ',err);
				//console.log('result was : ',result);

				res(err, result);
			});
		} else {
			//console.log("model was false: " + qry);
			connector.ctPool.query(qry, function(err, data){
				res(err,data);
			});
		}
	}
};


module.exports = orgComponentCount;
