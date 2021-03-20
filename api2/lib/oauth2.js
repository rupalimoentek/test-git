/**
 * Created by davey on 6/16/15.
 */
'use strict';

var oauth2orize         = require('oauth2orize'),
    passport            = require('passport'),
    crypto              = require('crypto'),
    fs                  = require('fs'),
    yaml                = require('js-yaml'),
	conf                = yaml.load(fs.readFileSync('config/config.yml')),
	envVar              = process.env.NODE_ENV,
    oauthToken          = require('../lib/token'),
    userModel           = require('../models/ctUserModel'),
	access              = require('../controllers/userAccessController'),
	ctlogger            = require('../lib/ctlogger.js'),
	async               = require('async'),
	uservoiceSSO		= require('./uservoiceSSO.js');

var aserver = oauth2orize.createServer();

// Generic error handler
var errFn = function (cb, err) {
	if (err) {
		console.log('A fatal error occurred in the authentication process. '+err);
		return cb(err);
	}
};

// Destroys any old tokens and generates a new access and refresh token
var generateTokens = function (data, done) {

	// curries in `done` callback so we don't need to pass it
	var errorHandler = errFn.bind(undefined, done),
	    refreshToken,
	    refreshTokenValue,
	    token,
	    tokenValue;


	async.waterfall([
		function(cb) {
			oauthToken.getToken('access', function(err, tokenValue) {
				if (err) { return cb(err); }
				cb(null, tokenValue);
			});
		},
		function(tokenValue, cb) {
			oauthToken.getToken('refresh', function(err, refreshTokenValue) {
				if (err) { return cb(err); }
				cb(null, tokenValue, refreshTokenValue);
			});
		},
		function(tokenValue, refreshTokenValue, cb) {
			data.token = tokenValue;
			token = data;
			oauthToken.setAccess(tokenValue, token, function(err, ret) {
				if (err) {
					console.log('Failed on accessToken creation');
					return cb(err);
				}
				console.log('accessToken', tokenValue);
				cb(null, tokenValue, refreshTokenValue);
			});
		},
		function(tokenValue, refreshTokenValue, cb) {
			var refreshToken = {
				token               : refreshTokenValue,
				userId              : data.userId,
				clientId            : data.clientId
			};
			oauthToken.setRefresh(refreshTokenValue, refreshToken, function(err, ret2) {
				if (err) {
					console.log('Failed on accessToken creation');
					return cb(err);
				}
				console.log('refreshToken', refreshTokenValue);
				cb(null, tokenValue, refreshTokenValue);
			});
		}

	], function(err, tokenValue, refreshTokenValue) {
		if (err) { return done(err); }
		done(null, tokenValue, refreshTokenValue, {
			'expires_in': conf[envVar].tokenLife,
			'scope': data.scope,
			'session': data.data,
			'status': 'success'
		});
	});
};

// Register authorization code grant type
/*
aserver.grant(oauth2orize.grant.code(function(client, redirectUri, user, ares, callback) {
	// Create a new authorization code
	var code = new Code({
		value: uid(16),
		clientId: client._id,
		redirectUri: redirectUri,
		userId: user._id
	});

	// Save the auth code and check for errors
	code.save(function(err) {
		if (err) { return callback(err); }

		callback(null, code.value);
	});
}));
*/

// Exchange username & password for access token.
aserver.exchange(oauth2orize.exchange.password(function(client, username, password, scope, done) {
	console.log('exchange password');

	// validate the username/password while retrieving OU and user information
	userModel.getByLoginPass(username, password, function(err, user) {
		if (err) { return done(null, false); } //no user found

		//console.log('role', user.role_id, typeof(user.role_id));
		if (user.role_id === 5 || user.role_id === 6) {
			// retrieve admin user rights
			access.adminAction(user.user_id, function(err, userscope) {
				if (err) { return done(null, false); }
				var model = {
					userId      : user.user_id,
					clientId    : conf[envVar].clientId,
					scope       : userscope,
					data        : {
						user_id     : user.user_id,
						ou_id       : user.ou_id,
						admin       : user.admin,
						role_id     : user.role_id,
						protect_caller_id : user.protect_caller_id,
								orglist : user.user_permissions_ou_list,
								is_migrated : user.is_migrated,
								download_audio_enabled: user.download_audio_enabled,	
						reports: user.reports,
						badge    : user.badge,
						score_call : user.score_call,
						access_audio : user.access_audio,
						levelOneOus : user.levelOneOus,
						looker_user_id : user.looker_user_id,
						looker_old_ui : user.looker_old_ui
					}
				};
				generateTokens(model, done);
			});
		} else {
			async.parallel([
				function(callback) {
					access.getAction(user.user_id, function (err, userscope) {
						if (err) { return callback('Failed to retrieve user access information. '+err); }
						callback(null, userscope);
					});
				},
				function(callback) {
					access.stylingAction(user.ou_id, function(err, style) {
						if (err) { return callback('Failed to retrieve custom styling information. '+err); }
						callback(null, style);
					});
				},
				function(callback) { // retrieve org unit authorized list
					access.orgList(user.ou_id, function(err, oulist) {
						if (err) { return callback(err); }
						callback(null, oulist);
					});
				},
				function(callback) { // retrieve campaign authorized list
          user.user_permissions_ou_list = user.user_permissions_ou_list.length === 0 ? user.user_permissions_ou_list.push(user.ou_id) : user.user_permissions_ou_list;
					access.campaignList(user.user_id,user.user_permissions_ou_list, user.role_id, function(err, camplist) {
						if (err) { return callback(err); }
						callback(null, camplist);
					});
				}
			],
			function(err, result) {
				if (err) { return done(null, false); }
				var encodedSSO = uservoiceSSO.get({ email: user.email, display_name: user.first_name + " " + user.last_name, allow_forums: [388389], guid: user.ou_id});
				var model = {
					userId  :user.user_id,
					clientId:conf[envVar].clientId,
					scope   :result[0],
					data    :{
						email		 :user.email,
						user_id      :user.user_id,
						ou_id        :user.ou_id,
						ou_name      :user.ou_name,
						tl_id        :user.tl_id,
						first_name   :user.first_name,
						last_name    :user.last_name,
						timezone     :user.timezone,
						user_ou_level:user.user_ou_level,
						billing_id   :user.billing_id,
						billing_ou : user.billing_ou,
						role_id      :user.role_id,
						style        :result[1],
						camplist     :result[3],
						uservoiceSSO: encodedSSO,
						protect_caller_id : user.protect_caller_id,
					  	orglist : user.user_permissions_ou_list,
						reports: user.reports,
						badge     : user.badge,
						score_call : user.score_call,
						access_audio : user.access_audio,
						is_migrated : user.is_migrated,
						download_audio_enabled: user.download_audio_enabled,
						prompts : user.prompts,
						whispers : user.whispers,
						voicemails : user.voicemails,
						levelOneOus : user.levelOneOus,
						looker_user_id : user.looker_user_id,
						looker_old_ui : user.looker_old_ui,
						s3_expire : user.s3_expire
					}
				};
				// console.log('TOKEN INFORMATION', model);
				generateTokens(model, done);

				var newdata = { 'org_unit_id':user.ou_id, 'ct_user_id':user.user_id, 'data':model.data };
				ctlogger.log(newdata, 'login', 'user','','');
			});
		}
	});
}));

// Exchange refreshToken for access token.
// NOTE: Disabling refresh token access - due to multi-session enabled

aserver.exchange(oauth2orize.exchange.refreshToken(function(client, refreshToken, scope, done) {
	console.log('exchange refresh');

	oauthToken.findRefresh(refreshToken, function(err, token) {
		if (err) { return done(null, false); }
		if (token === undefined) { return done(null, false); }

		// retrieve OU and user information based on the user ID
		userModel.getById(token.userId, function(err, user) {
			if (err) { return done(null, false); }
			if (!user) { return done(null, false); }

			console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n",user.role_id,"\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" );
			if (user.role_id === 5 || user.role_id === 6) {
				// retrieve admin user rights
				access.adminAction(user.user_id, function(err, userscope) {
					if (err) { return done(null, false); }

					var model = {
						userId      : user.user_id,
						clientId    : conf[envVar].clientId,
						scope       : userscope,
						data        : {
							user_id     : user.user_id,
							role_id     : user.role_id,
							admin       : user.admin,
							protect_caller_id : user.protect_caller_id,
							orglist : user.user_permissions_ou_list,
  					  		reports: user.reports,
							score_call : user.score_call,
							access_audio : user.access_audio,
							levelOneOus : user.levelOneOus
						}
					};
					generateTokens(model, done);
				});
			} else {
				// restrict refresh token stradegy for normal users
				return done('Only internal administrative users are allowed to use refresh tokens');

				// retrieve the scope access for the user
				access.getAction(user.user_id, function (err, userscope) {
					if (err) { return done(null, false); }

					var model = {
						userId  :user.user_id,
						clientId:conf[envVar].clientId,
						scope   :userscope,
						data    :{
							user_id      :user.user_id,
							ou_id        :user.ou_id,
							ou_name      :user.ou_name,
							tl_id        :user.tl_id,
							first_name   :user.first_name,
							last_name    :user.last_name,
							timezone     :user.timezone,
							user_ou_level:user.user_ou_level,
							billing_id   :user.billing_id,
							protect_caller_id : user.protect_caller_id,
							orglist : user.user_permissions_ou_list,
  					  		reports: user.reports,
							score_call : user.score_call,
							access_audio : user.access_audio,
							levelOneOus : user.levelOneOus
						}
					};
					generateTokens(model, done);
				});
			}
		});
	});
}));


// token endpoint
//
// `token` middleware handles client requests to exchange authorization grants
// for access tokens.  Based on the grant type being exchanged, the above
// exchange middleware will be invoked to handle the request.  Clients must
// authenticate when making requests to this endpoint.

exports.token = [
	passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
	aserver.token(),
	aserver.errorHandler()
];
