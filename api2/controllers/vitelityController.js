'use strict';

var controller = require('./appController'),
	vitelityModel = require('../models/vitelityModel');

var vitelity = {
	rcStateAction: function(rc, state, res) {
		vitelityModel.rcState(rc, state, function (err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	npaAction: function(npa, res) {
		vitelityModel.npa(npa, function (err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	npanxxAction: function(npanxx, res) {
		vitelityModel.npanxx(npanxx, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	orderAction: function(req, res) {
		vitelityModel.orderNumber(req.body.did, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	removeAction: function(req, res) {
		vitelityModel.removeNumber(req.body.did, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	}
};

module.exports = vitelity;
