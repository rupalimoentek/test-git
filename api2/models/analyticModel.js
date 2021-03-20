var connector = require('./appModel'),
	ctTransactionModel = require('./ctTransactionModel'),
	table = 'analytic',
	k = require('../config/analytic.json'),
	qb = require('../lib/queryBuilder'),
	f = require('../functions/functions.js'),
	appModel = require('./appModel');

var analytic = {
	create: function(data, res){
		var ctTrans = new ctTransactionModel.begin(function(err){
			if (err) {
				res(err);
				return;
			}
			var qry = "INSERT INTO " + table + " (org_unit_id, duration, tracking_id, all_routes, all_calls, analytic_status) VALUES (";
			qry += data.analytic.org_unit_id + "," + data.analytic.duration + ",'" + data.analytic.tracking_id + "'," + data.analytic.all_routes;
			qry += "," + data.analytic.all_calls + ",'" + data.analytic.status + "')";
			var insertData = {
				which: 'query',
				qry: qry
			};
			ctTrans.query(insertData, function(err, result){
				if (err){
					ctTrans.rollback(function(){
						res(err);
					});
				} else {
					ctTrans.commit(function(err){
						res(err, 'Analytic created.');
					});
				}
			});
		});
	},
	update: function(data, res){
		var ctTrans = new ctTransactionModel.begin(function(err){
			if (err) {
				res(err);
				return;
			}
			var values = {};
			for (var key in data.analytic) {
				values[k.map[key]] = data.analytic[key];
			}
			values.analytic_modified = f.mysqlTimestamp();
			var WHERE = " WHERE org_unit_id = " + data.analytic.id;
			var build = {
				which: 'update',
				table: table,
				values: values,
				where : WHERE
			};
			var qry = qb.build(build);

			var updateData = {
				which: 'query',
				qry: qry
			};

			ctTrans.query(updateData, function(err, result){
				if (err){
					ctTrans.rollback(function(){
						res(err);
					});
				} else {
					ctTrans.commit(function(err){
						res(err, 'Analytic updates.');
					});
				}
			});
		});
	},
	getByOuid: function(ouid, res){
		var qry = "SELECT * FROM " + table + " WHERE org_unit_id = " + ouid;
		appModel.ctPool.query(qry, function(err, result){
			res(err, result);
		});
	},
	getByOuAndParentSetting: function(ouid, res){
		var nxt = true;
		var setting = null;
		if(nxt) {
			async.whilst(
				function () { return nxt; },
				function (callback) {
					var qry = "SELECT * FROM " + table + " WHERE org_unit_id = " + ouid;
					appModel.ctPool.query(qry, function(err, analytic_data) {
						var qry = "SELECT * FROM org_unit WHERE org_unit_id = " + ouid;
						appModel.ctPool.query(qry, function(err, org_result){
							if((analytic_data.length < 0) || (ouid == org_result[0]['top_ou_id'] )){
								setting = analytic_data;
								nxt = false;
							}else{
								nxt = true;
								ouid = org_result[0]['org_unit_parent_id'];
							}
						});
						callback();
					});
				},
				function (err) {
					if(err) {
						console.log(err);
						return;
					}
					res(null, setting);
				}
			);
		}
	}
};

module.exports = analytic;
