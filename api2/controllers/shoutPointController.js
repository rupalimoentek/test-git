'use strict';

var controller = require('./appController'),
	shoutPointModel = require('../models/shoutPointModel');

var shoutpoint = {
	rcStateAction: function(rc, state, res) {
		shoutPointModel.rcState(rc, state, function (err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	npaAction: function(npa, res) {
		shoutPointModel.npa(npa, function (err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	npanxxAction: function(npanxx, res) {
		shoutPointModel.npanxx(npanxx, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	orderAction: function(req, res) {
		shoutPointModel.orderNumber(req.body.did, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	}
};

module.exports = shoutpoint;
