/**
 * Created by davey on 4/21/15.
 */
'use strict';

var appModel        = require('./appModel'),
	session         = require('../lib/session'),
	jwt             = require('jwt-simple'),
	_               = require('underscore'),
	yaml        = require("js-yaml"),
	fs          = require("fs"),
	envVar      = process.env.NODE_ENV,
	schedulePlansModel = require('./schedulePlansModel'),
	conf          = yaml.load(fs.readFileSync("config/config.yml"));

var login = {

	// NOTE: This method should no longer be in use
	/*auth: function(req, res) {
		var ctUserModel = require('../models/ctUserModel');
		var hash = ctUserModel.getHash(req.body.password);

		ctUserModel.getByUsernamePassword(req.body.username, hash, function(err, data) {
			if (err) { res(err); return; }
			if (data.length > 0) {
				var user_ou_level = null;
				//set ou level at which the user resides (0-2)
				if (data[0].tl_org_unit_id === data[0].org_unit_id) {
					user_ou_level = 0;
				} else if (data[0].tl_org_unit_id === data[0].org_unit_parent_id) {
					user_ou_level = 1;
				} else {
					user_ou_level = 2;
				}
				var expires = login.expiresIn(7);
				var token = login.genToken(data, expires);
				var lifetime = 86400; //24hrs
				var sessionData = {
					session:{
						user_id        :data[0].user_id,
						user_first_name:data[0].user_first_name,
						user_last_name :data[0].user_last_name,
						username       :data[0].username,
						tl_id          :data[0].tl_org_unit_id,
						tl_name        :data[0].tl_org_unit_name,
						ou_id          :data[0].org_unit_id,
						ou_name        :data[0].org_unit_name,
						timezone       :data[0].timezone,
						user_ou_level  :user_ou_level
					}
				};
				//console.log(sessionData);
				session.set(token, sessionData, function (err, result) {
					if (err) {
						res(err);
					} else {
						var ret = {
							status  : 'success',
							result  : 'success',
							token   : token,
							expires : expires,
							user    : {
								first_name  : data[0].user_first_name,
								last_name   : data[0].user_last_name
							},
							timezone : data[0].timezone
						};
						res(null, ret);
					}
				});
			} else {
				res('Failed to find user record');
			}
		});
	},

	// NOTE: This method is also deprecated and OAuth2 is now being used
	genToken: function(data, expires) {
		var token = jwt.encode({
			exp     : expires,
			userid  : data[0].user_id,
			ouid    : data[0].org_unit_id
		}, require('../config/secret')());
		return(token);
	},

	// NOTE: Also deprecated in favor of using OAuth2
	expiresIn: function(numDays) {
		var dateObj = new Date();
		return( dateObj.setDate(dateObj.getDate() + numDays) );
	},
	*/

	recover:function (username, template, domain, res) {
		var email = require('../lib/email');
		console.log("username: " + username + ' template: ' + template);
		var qry = "SELECT u.ct_user_id, u.ct_user_ou_id, u.first_name, u.last_name, u.username, owl.domain_name AS domain " +
			"FROM ct_user u LEFT JOIN org_white_label owl ON (u.ct_user_ou_id=owl.org_unit_id AND owl.white_label_active=true) WHERE u.username='" + username + "'";
		appModel.ctPool.query(qry, function(err, data) {
			if (err) { res(err); return; }
			if (data.length < 1) { res('No matching user account found for e-mail address ' + username); return; }

			var token = login.randString(32);
			//if (domain !== '' && data[0].domain !== domain) { console.log('Have a domain setting conflict with two values.'); }
			// (domain !== undefined && domain !== '' ? domain : conf[envVar]['cthost']);
			//domain = data[0].domain;
			if (data[0].domain === '' || data[0].domain === null) { data[0].domain = conf[envVar]['cthost']; } // set a value for domain if not defined
			data[0].url = "/#/resetpassword?token=" + token;

			email.send(template, data[0], username, data[0].ct_user_ou_id, function(err, ret) {
				if (err) { return res(err); }

				qry = "UPDATE ct_user_detail SET pass_recover='" + token + "' WHERE ct_user_id=" + data[0].ct_user_id;
				appModel.ctPool.query(qry, function(err) {
					if (err) { return res(err); }
					res(null, ret);
				});
			});
		});
	},
        recover_noemail:function (username, template, domain, res) {
//                var email = require('../lib/email');
       console.log( "calling recover_noemail...." );
                console.log("username: " + username + ' template: ' + template);
                var qry = "SELECT u.ct_user_id, u.ct_user_ou_id, u.first_name, u.last_name, u.username, owl.domain_name AS domain " +
                        "FROM ct_user u LEFT JOIN org_white_label owl ON (u.ct_user_ou_id=owl.org_unit_id AND owl.white_label_active=true) WHERE u.username='" + username + "'";
                appModel.ctPool.query(qry, function(err, data) {
                        if (err) { res(err); return; }
                        if (data.length < 1) { res('No matching user account found for e-mail address ' + username); return; }

                        var token = login.randString(32);
                        //if (domain !== '' && data[0].domain !== domain) { console.log('Have a domain setting conflict with two values.'); }
                        // (domain !== undefined && domain !== '' ? domain : conf[envVar]['cthost']);
                        //domain = data[0].domain;
                        if (data[0].domain === '' || data[0].domain === null) { data[0].domain = conf[envVar]['cthost']; } // set a value for domain if not defined
                        data[0].url = "/#/resetpassword?token=" + token;


                                qry = "UPDATE ct_user_detail SET pass_recover='" + token + "' WHERE ct_user_id=" + data[0].ct_user_id;
                                appModel.ctPool.query(qry, function(err) {
                                        if (err) { return res(err); }
                                        res(null, "created account with noemail");

                        });
                });
        },
	randString: function(cnt) {
		var str = "";
		while (str.length < cnt && cnt > 0) {
			var r = Math.random();
			str += (r < 0.1 ? Math.floor(r * 100) : String.fromCharCode(Math.floor(r * 26) + (r > 0.5 ? 97 : 65)));
		}
		return(str);
	},
	resetPass: function(req, res) {
		var qry = "SELECT d.ct_user_id, u.ct_user_ou_id FROM ct_user_detail d, ct_user u WHERE d.pass_recover='" + req.body.token + "' AND d.ct_user_id=u.ct_user_id AND u.username='" + req.body.username + "'";
		appModel.ctPool.query(qry, function(err, data) {
			if (err) { res(err); return; }

			var ctUserModel = require('../models/ctUserModel');
			var hash = ctUserModel.getHash(req.body.password);

			// update user profile with new password
			qry = "UPDATE ct_user SET password='" + hash + "' WHERE ct_user_id=" + data[0].ct_user_id;
			appModel.ctPool.query(qry, function(err, data2) {
				if (err) { res(err); return; }

				// remove the temporary password token
				qry = "UPDATE ct_user_detail SET pass_recover=NULL WHERE ct_user_id=" + data[0].ct_user_id;
				appModel.ctPool.query(qry, function(err, data3) {
					if (err) { res(err); } else { res(null, data[0]); }
				});
			});

		});
	},
	resetCheck: function(req, res) {
		var qry = "SELECT d.ct_user_id, u.username, u.first_name, u.last_name FROM ct_user_detail d, ct_user u WHERE d.pass_recover='" + req + "' AND d.ct_user_id=u.ct_user_id";
		appModel.ctPool.query(qry, function(err, data) {
			if (err) { res(err); return; }
			if (data.length < 1) { res('No matching account found for temporary password token.'); return; }
			res(null, data[0]);
		});
	},
	logout: function(req, res) {
		var token = require('../lib/token');
		token.deleteAccess(req.body.access_token, function(err, ret) {
			if (err) { return res('Failed to remove access token record'); }
			console.log('return values', ret);
			res(null, ret);
			// schedulePlansModel.lookerLogout(function(err,data){
			// 	if (err) { return res('Failed to remove access token record'); }
			// });
		});
	}
};

module.exports = login;
