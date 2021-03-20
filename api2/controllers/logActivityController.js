"use strict";

var controller = require('./appController'),
    f = require('../functions/functions'),
    logActivityModel = require('../models/logActivityModel');

var logActivity = {

	streamAction: function(req, res) {
		logActivityModel.stream(req.body, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	sectionAction: function(req, logname, res) {
		logActivityModel.getSection(req.body, logname, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	}
};

module.exports = logActivity;