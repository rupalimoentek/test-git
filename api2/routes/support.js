/**
 * Created by bschermerhorn on 7/9/15.
 */

"use strict";

var support = require('../controllers/supportController'),
    express = require('express'),
    router  = express.Router();

router.post("/switchback", function(req, res) {
	support.switchToSupport(req, function(err, data) {
		console.log("RETURNING DATA FOR SUPPORT ADMIN", data);
		res.send(data);
	});
});

router.get("/billingnodes/:adminType/:user_id", function (req, res) {
	support.billingNodesAction(req, function (err, data) {
		return res.send({
			status: err ? "error" : "success",
			data:   data || []
		});
	});
});

router.get("/adminlist/:ouid", function (req, res) {
	support.adminListAction(req, function (err, data) {
		return res.send({
			status: err ? "error" : "success",
			data:   data || []
		});
	});
});

router.get("/partneradminuser/:ouid/:user_id", function (req, res) {
	support.partnerAdminUserAction(req, function (err, data) {
		return res.send({
			status: err ? "error" : "success",
			data:   data || []
		});
	});
});

router.get("/search/:adminType/:user_id/:category/:searchText/:limit/:offset", function (req, res) {
	support.globalSearch(req, function (err, data) {
		return res.send({
			status: err ? "error" : "success",
			data:   data.data || [],
			total: data.total
		});
	});
});

router.post("/switchuser", function (req, res) {
	support.switchToAdmin(req, function (err, data) {
		res.send(data);
	});
});

router.post("/ticket", function (req, res) {
	support.saveTicket(req, function(data) {
		res.send(data);
	});
});

module.exports = router;



















module.exports = router;