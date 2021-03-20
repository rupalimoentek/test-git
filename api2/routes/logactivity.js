"use strict";

var express = require('express'),
    logActivity = require('../controllers/logActivityController'),
    router = express.Router();

// In body can set the value for: start_date, end_date, limit, offset, org_unit_id, and ct_user_id
router.post('/stream', function(req, res) {
	logActivity.streamAction(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

// In body can set the value for: start_date, end_date, limit, offset, org_unit_id, and ct_user_id
router.post('/section/:logname', function(req, res) {
	logActivity.sectionAction(req, req.params.logname, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

module.exports = router;