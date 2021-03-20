/**
 * Created by Ashutosh Jagtap on 18/07/2017.
 */
var hipaaPrivacyModel = require('../models/hipaaPrivacyModel');
var hipaaPrivacy = {
	// adds a new Hippa Privacy record
	getAction: function(req, res) {
		hipaaPrivacyModel.getHipaaPrivacy(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	postAction: function(req, res) {
		hipaaPrivacyModel.setHipaaPrivacy(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	setHipaaProtection: function(req, res) {
		hipaaPrivacyModel.setHipaaProtection(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	}
};

module.exports = hipaaPrivacy;
