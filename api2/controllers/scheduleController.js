/**
 * Created by davey on 3/31/15.
 */
var scheduleModel = require('../models/schedulePlansModel');

var schedule = {
	// adds a new webhook record
	getSchedulePlans: function(req, res) {
		scheduleModel.getSchedulePlans(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
  sendSchedulePlan: function(req, res) {
		scheduleModel.sendSchedulePlan(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
  deleteSchedulePlan: function(req, res) {
		scheduleModel.deleteSchedulePlan(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	}
};

module.exports = schedule;
