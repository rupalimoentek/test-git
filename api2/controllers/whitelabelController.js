/**
 * Created by Aaron on 11/11/15.
 */
var controller = require('./appController'),
	f = require('../functions/functions'),
	fs = require("fs"),
	whitelabelModel = require('../models/whitelabelModel'),
	ctlogger = require('../lib/ctlogger.js');

var whitelabel = {
	// resizes an image
	resizeAction: function(req, res) {
		whitelabelModel.resizeimg(req, function(err, data) {
			if (err) { console.log("err.. error at controller");res(err); } else { res(null, data); }
			var newdata = { 'org_unit_id':req.ouid, 'ct_user_id':req.userid, 'log_data':req.body };
			ctlogger.log(newdata, 'insert', 'integration', 'White Label logo','',req.headers.authorization);
		});
	},
	// adds or updates a whitelabel record
	postAction: function(req, res) {
		whitelabelModel.create_update(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
			var newdata = { 'org_unit_id':req.ouid, 'ct_user_id':req.userid, 'log_data':req.body };
			ctlogger.log(newdata, 'insert', 'integration', 'White Label','',req.headers.authorization);
		});
	},
	// deletes a whitelabel record and all associated mappings
	deleteAction: function(id, res) {
		whitelabelModel.delete(id, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
			var newdata = { 'org_unit_id':id, 'ct_user_id':req.userid, 'log_data':req.body };
			ctlogger.log(newdata, 'delete', 'integration', 'White Label','',req.headers.authorization);
		});
	},
	getAction: function(id, res) {
		whitelabelModel.get(id, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	}
};

module.exports = whitelabel;