/**
 * Created by davey on 4/21/15.
 */
var controller  = require('./appController'),
	f           = require('../functions/functions'),
	fs          = require("fs"),
	loginModel  = require('../models/loginModel'),
	ctlogger    = require('../lib/ctlogger.js');

var login = {

	loginAction: function(req, res) {
		loginModel.auth(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},

	recoverAction: function(req, res) {
		console.log('domain', req);
		loginModel.recover(req.username, 'recover', req.domain, function(err, data) {
			if (err) { return res(err); }
			res(null, data);

			var newdata = {'org_unit_id':data.ct_user_ou_id, 'ct_user_id':data.ct_user_id, 'log_data':data};
			ctlogger.log(newdata, 'update', 'user', 'password recovery','',req.headers.authorization);
		});
	},
        recoverAction_noemail: function(req, res) {
                console.log('domain', req);
                loginModel.recover_noemail(req.username, 'recover', req.domain, function(err, data) {
                        if (err) { return res(err); }
                        res(null, data);

                        var newdata = {'org_unit_id':data.ct_user_ou_id, 'ct_user_id':data.ct_user_id, 'log_data':data};
                        ctlogger.log(newdata, 'update', 'user', 'password recovery','',req.headers.authorization);
                });
        },

	welcomeAction: function(req, res) {
		console.log('controller welcomeAction');
		loginModel.recover(req.username, 'welcome', '',  function(err, data) {
			if (err) { return res(err); }
			res(null, data);

			var newdata = {'org_unit_id':data.ct_user_ou_id, 'ct_user_id':data.ct_user_id, 'log_data':data};
			ctlogger.log(newdata, 'update', 'user', 'welcome email','',req.headers.authorization);
		});
	},

	resetAction: function(req, res) {
		//console.log('controller resetAction');
		loginModel.resetPass(req, function(err, data) {
			if (err) { return res(err); }

			/* This works and will log the user in, but decided to separate into two actions
			loginModel.auth(req, function(err, data2) {
				if (err) { res(err); } else { res(null, data2); }
			});
			*/
			res(null, data);

			// log the action taken
			var newdata = {'org_unit_id':data.ct_user_ou_id, 'ct_user_id':data.ct_user_id, 'log_data':data};
			ctlogger.log(newdata, 'update', 'user', 'password reset','',req.headers.authorization);

		});
	},

	resetCheckAction: function(token, res) {
		//console.log('resetCheck controller - token:' + token);
		loginModel.resetCheck(token, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},

	logoutAction: function(req, res) {
		loginModel.logout(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);

			//var newdata = { 'org_unit_id':data.org_unit_id, 'ct_user_id':data.ct_user_id, 'data':req.body };
			//ctlogger.log(newdata, 'logout', 'user');
		});
	}

};

module.exports = login;