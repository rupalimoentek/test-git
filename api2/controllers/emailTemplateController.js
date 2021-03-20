/**
 * Created by Aaron on 11/11/15.
 */
var controller = require('./appController'),
	f = require('../functions/functions'),
	fs = require("fs"),
	emailTemplateModel = require('../models/emailTemplateModel'),
	ctlogger = require('../lib/ctlogger.js');

var emailTemplate = {
	// adds a new emailTemplate record
	postAction: function(req, res) {
		emailTemplateModel.create(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
			//var newdata = { 'org_unit_id':req.ouid, 'ct_user_id':req.userid, 'org_unit_id':data.insertId, 'log_data':req.body };
			//ctlogger.log(newdata, 'insert', 'emailTemplate');
		});
	},
	// updates a emailTemplate record
	putAction: function(req, res) {
		emailTemplateModel.create(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
			//var newdata = { 'org_unit_id':req.ouid, 'ct_user_id':req.userid, 'webhook_id':req.body.webhook_id, 'log_data':req.body };
			//ctlogger.log(newdata, 'update', 'emailTemplate');
		});
	},	
	// deletes a emailTemplate record and all associated mappings
	deleteAction: function(id, res) {
		emailTemplateModel.delete(id, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
			//var newdata = { 'org_unit_id':id, 'ct_user_id':req.userid, 'log_data':req.body };
			//ctlogger.log(newdata, 'delete', 'emailTemplate');
		});
	},
	getAction: function(ou_id, master_id, res) {
		emailTemplateModel.get(ou_id, master_id, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	}
};

module.exports = emailTemplate;