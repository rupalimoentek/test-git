/**
 * Created by Ashutosh Jagtap on 18/07/2017.
 */
var callerPrivacyModel = require('../models/callerPrivacyModel');
var callerPrivacy = {
	// adds a new caller Privacy record
	getAction: function(req, res) {
		callerPrivacyModel.getCallerPrivacy(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	postAction: function(req, res) {
		callerPrivacyModel.setCallerPrivacy(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	setCallerProtection: function(req, res) {
		callerPrivacyModel.setCallerProtection(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	setDownloadAudioSetting: function(req, res) {
		callerPrivacyModel.setDownloadAudioSetting(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	getDownloadAudioSettingByCallId: function(callId, callback) {
		callerPrivacyModel.getDownloadAudioSettingByCallId(callId, function(err, data) {
			if (err) { callback(err, null) } else { callback(null, data); }
		});
	}
};

module.exports = callerPrivacy;
