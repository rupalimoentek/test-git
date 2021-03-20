/**
 * Created by Ashutosh Jagtap on 14/10/2017.
 */
var	f = require('../functions/functions'),
	fs = require("fs"),
	callScoreModel = require('../models/callScoreModel');

var callScore = {
	// adds a new webhook record
	getCallScoreReport: function(req, res) {
		callScoreModel.getCallScoreReport(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	}
};

module.exports = callScore;
