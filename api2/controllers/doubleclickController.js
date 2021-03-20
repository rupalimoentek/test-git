/**
 * Created by davey on 4/24/15.
 */
var controller = require('./appController'),
	f = require('../functions/functions'),
	fs = require("fs"),
	doubleclickModel = require('../models/doubleclickModel'),
	ctlogger = require('../lib/ctlogger.js');

var doubleclick = {

	getAction      :function (ouid, res) {
		doubleclickModel.profile(ouid, function (err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	postAction     :function (req, res) {
		doubleclickModel.create(req.body, function (err, data) {
			if (err) { res(err); } else { res(null, data); }
			var newdata = { 'org_unit_id':req.ouid, 'ct_user_id':req.userid, 'log_data':req.body };
			ctlogger.log(newdata, 'insert', 'integration', 'DoubleClick','',req.headers.authorization);
		});
	},
	putAction      :function (req, res) {
		doubleclickModel.update(req.body, function (err, data) {
			if (err) { res(err); } else { res(null, data); }
			var newdata = { 'org_unit_id':req.ouid, 'ct_user_id':req.userid, 'log_data':req.body };
			ctlogger.log(newdata, 'update', 'integration', 'DoubleClick','',req.headers.authorization);
		});
	},
	mapPostAction  :function (req, res) {
		doubleclickModel.createMap(req.body.map, function (err, data) {
			if (err) { res(err); } else { res(null, data); }
			var newdata = { 'org_unit_id':req.ouid, 'ct_user_id':req.userid, 'log_data':req.body };
			ctlogger.log(newdata, 'update', 'integration', 'DoubleClick Metric','',req.headers.authorization);
		});
	},
	mapPutAction   :function (req, res) {
		doubleclickModel.updateMap(req.body.map, function (err, data) {
			if (err) { res(err); } else { res(null, data); }
			var newdata = { 'org_unit_id':req.ouid, 'ct_user_id':req.userid, 'log_data':req.body };
			ctlogger.log(newdata, 'update', 'integration', 'DoubleClick Metric','',req.headers.authorization);
		});
	},
	mapDeleteAction:function (req, res) {
		doubleclickModel.dropMap(req.body.map.doubleclick_id, req.body.map.dc_map_id, function (err, data) {
			if (err) { res(err); } else { res(null, data); }
			var newdata = { 'org_unit_id':req.ouid, 'ct_user_id':req.userid, 'log_data':req.body };
			ctlogger.log(newdata, 'delete', 'integration', 'DoubleClick Metric','',req.headers.authorization);
		});
	},
	getMetricAction      :function (res) {
		doubleclickModel.metricList(function (err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	getListAction      :function (res) {
		doubleclickModel.varList(function (err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	callRouteAction    :function(ouid, res) {
		doubleclickModel.callAction(ouid, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	}
};

module.exports = doubleclick;
