/**
 * Created by bschermerhorn on 7/9/15.
 */

"use strict";
var fs              = require("fs"),
	controller      = require('./appController'),
    yaml            = require("js-yaml"),
    request         = require("request"),
    crypto          = require("crypto"),
    controller      = require('./appController'),
    supportModel    = require('../models/supportModel'),
    ctlogger        = require('../lib/ctlogger.js'),
    oauthToken      = require('../lib/token'),
	config          = yaml.load(fs.readFileSync('config/config.yml')),
	appModel        = require('../models/appModel'),
	envVar          = process.env.NODE_ENV;

var supportAdmin = {};

// I need to have access to session data based on token - which user is this sending me data?

supportAdmin.billingNodesAction = function(req, res) {
	supportModel.getBillingNodesToView(req.params.adminType, req.params.user_id, function (err, arrBillingNodes) {
		if (err) { return res(err); }
		return res(null, arrBillingNodes);
	});
};

supportAdmin.adminListAction = function(req, res) {
	if (!req.params || isNaN(req.params.ouid)) {
		return res("Error - missing or invalid OUID in support/adminlist request");
	}
	supportModel.getAdminList(req.params.ouid, function(err, data) {
		if (err) { return res(err); }
		res(null, data);
	});
};

supportAdmin.partnerAdminUserAction = function(req, res) {
	if (!req.params || isNaN(req.params.ouid) || isNaN(req.params.user_id)) {
		return res("Error - missing or invalid OUID or UserID in support/partneradminuser request");
	}
	supportModel.getParnterAdminUser(req.params.ouid, req.params.user_id, function(err, data) {
		if (err) { return res(err); }
		res(null, data);
	});
};

supportAdmin.globalSearch = function(req, res) {
	if (!req.params.adminType || !req.params.user_id ||!req.params || !req.params.category || !req.params.searchText) {
		return res("Error - missing or invalid searchText or category in support/search request");
	}
	supportModel.globalSearch(req, function(err, data) {
		if (err) { return res(err); }
		res(null, data);
	});
};

supportAdmin.saveTicket = function(req, res) {
	var  billing_id = 8;
	if(req.user){
		billing_id = req.user.billing_id;
	}
	supportModel.saveTicket(req.body, billing_id, function(err, data) {
		controller.responsify(err, data, function(response){
			res(response);
		});
	});
};

supportAdmin.switchToAdmin = function(req, res) {
	if (req.body.user_id === undefined) { return res("Error - invalid or missing User ID in support switchuser"); }
	if (req.body.token === undefined) { return res("Error - invalid or missing Token in support switchuser"); }
	var token = req.body.token;

	var ouAdminFlag = require("../models/supportSecret.js");
	var qry = "SELECT username, password, ct_user_ou_id FROM ct_user WHERE ct_user_id="+req.body.user_id;
	appModel.ctPool.query(qry, function (err, data) {
		if (err) { return res('Failed to retrieve selected users account information. '+err); }
		if (data.length < 1) { return res("No matching user account found in system"); }

		var bodyData = {
			grant_type:    "password",
			client_id:     "system",
			client_secret: "f558ba166258089b2ef322c340554c",
			username:      data[0].username,
			password:      data[0].password + ouAdminFlag
		};

		//req.protocol -> http or https  - req.get(host) -> "127.0.0.1:8000 or whatever it is
		//var url = req.protocol + "://" + req.get('host') + "/oauth/token";
		var url = "https://" + req.get('host') + "/oauth/token";
		var requestPostObj = {
			rejectUnauthorized: false,
			headers: { "Content-Type": "application/json" },
			url:     url,
			body:    JSON.stringify(bodyData)
		};

		request.post(requestPostObj, function (err, resp, body) {
			body = JSON.parse(body);
			if (err) { return res('An error occurred while POSTing login request. '+err); }
			if (body.session === undefined) { return res('Failed to login as user - no session data'); }

			// update the OAuth session data to include the original token
			body.session.support_token = token;
			var body2 = {
				userId: body.session.user_id,
				clientId: 'system',
				scope: body.scope,
				data: body.session,
				token: body.access_token
			};
			oauthToken.findAccess(req.body.token, function(err, tokenData) {
				if (err) { return res('Failed to retrieve session. '+err); }
				var tokenBody = {
					userId: req.body.user_id,
					clientId: 'system',
					scope: tokenData.scope,
					data: { user_id: body.session.user_id, role_id: body.session.role_id, ou_id: body.session.ou_id, prompts:body.session.prompts, whispers:body.session.whispers, voicemails:body.session.voicemails},
					token: tokenData.token

				};
				oauthToken.updateAccess(req.body.token, tokenBody, function(err) {
					oauthToken.updateAccess(body.access_token, body2, function(err) {
						if (err) { return res('Failed to update session. '+err); }
						res(null, body);
						var newdata = {'org_unit_id':data[0].ct_user_ou_id, 'ct_user_id':req.body.user_id, 'data':{} };
						ctlogger.log(newdata, 'login', 'user','','');
					});
				});
			});
		});

	});
};

supportAdmin.switchToSupport = function(req, res) {
	if (!req.body.support_token) { return res('Missing original token value'); }
	if (!req.body.user_token) { return res('Missing original user_token value'); }
	oauthToken.deleteAccess(req.body.user_token, function(err, data) {
		if (err) { return res(err); }
		oauthToken.findAccess(req.body.support_token, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	});
};

// possibilities to validate for...
// user requesting to switch is not actually an admin
// user requesting to switch is a support admin
// user requesting to switch is a super admin
/*supportAdmin.switchToCtUserAdmin = function(req, res) {
	if (!req.params || isNaN(req.params.ouid)) {
	    return res("Error in parameters in supportController supperController.js");
	}

	var ouAdminFlag = require("../models/supportSecret.js");
	var qry = "SELECT username, password FROM ct_user WHERE ct_user_ou_id = " + req.params.ouid + " AND role_id = 4";
	appModel.ctPool.query(qry, function (err, data) {
		if (err) {
			return res(err, null);
		} else {
			if (!data[0]) {
			    return res("No admin account for that org unit", null);
			}

			var password = data[0].password;
			var username = data[0].username;
			var bodyData = {
				"grant_type":    "password",
				"client_id":     "system",
				"client_secret": "f558ba166258089b2ef322c340554c",
				"username":      username,
				"password":      password + ouAdminFlag
			};

			//req.protocol -> http or https  - req.get(host) -> "127.0.0.1:8000 or whatever it is
			var url = req.protocol + "://" + req.get('host') + "/oauth/token";
			var requestPostObj = {
				headers: {
					"Content-Type": "application/json"
				},
				url:     url,
				body:    JSON.stringify(bodyData)
			};

			request.post(requestPostObj, function (err, resp, body) {
				console.log(body);

				return res(null, body);
			});
		}
	});
};//end supportAdmin.switchToCtUserAdmin
*/

module.exports = supportAdmin;
