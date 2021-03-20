'use strict';

var controller = require('./appController'),
	bandwidthModel = require('../models/bandwidthModel');

var bandwidth = {
	rcStateAction: function(rc, state, res) {
		bandwidthModel.rcState(rc, state, function (err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	npaAction: function(npa, res) {
		bandwidthModel.npa(npa, function (err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	npanxxAction: function(npanxx, res) {
		bandwidthModel.npanxx(npanxx, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	orderAction: function(req, res) {
		bandwidthModel.orderNumber(req.body.did, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	removeAction: function(req, res) {
		bandwidthModel.removeNumber(req.body.did, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	}
};

module.exports = bandwidth;
