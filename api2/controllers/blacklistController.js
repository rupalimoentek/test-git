var blacklistModel = require('../models/blacklistModel'),
	oldblacklistModel = require('../models/oldBlacklistModel'),
	controller         = require('./appController'),
	async = require('async'),
	controller = require('./appController'),
	token = require('../lib/token');

var blacklist = {
	bulkInsert: function (req, res) {
		blacklistModel.bulkInsert(req, function (err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	getSearchCallerID: function (req, res) {
		blacklistModel.getSearchCallerID(req.params.id, function (err, data) {
			controller.responsify(err, data, function (response) {
				res(response);
			});
		});
	},
	getAllBlacknumberAction: function (req,queryInfo, res) {
		blacklistModel.getAllBlacklistNumbers(req, queryInfo.page, queryInfo.search, function (err, data) {
			controller.responsify(err, data, function (response) {
				res(response);
			});
		});
	},
	getOrgOfBlockedNumbers: function (req, res) {
		blacklistModel.getOrgOfBlockedNumbers(req, function (err, data) {
			controller.responsify(err, data, function (response) {
				res(response);
			});
		});
	},
	deleteCallerID: function (req, res) {
		blacklistModel.deleteCallerID(req, function (err, data) {
			controller.responsify(err, data, function(result){
				res(result);
			});
		});
	}
};

module.exports = blacklist;
