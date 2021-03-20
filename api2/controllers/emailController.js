/**
 * Created by davey on 11/19/15.
 */
var controller  = require('./appController'),
    f           = require('../functions/functions'),
    fs          = require("fs"),
    emailLib    = require('../lib/email'),
    ctlogger    = require('../lib/ctlogger.js');

var email = {
	emailAction: function(req, res) {
		emailLib.send(req.body.template, req.body.dyn_data, req.body.send_to, req.body.org_unit_id, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	}
};

module.exports = email;