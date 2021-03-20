/**
 * Created by davey on 6/16/15.
 */
"use strict";

var passport                = require('passport'),
    BasicStrategy           = require('passport-http').BasicStrategy,
    ClientPasswordStrategy  = require('passport-oauth2-client-password').Strategy,
    BearerStrategy          = require('passport-http-bearer').Strategy,
    LocalStrategy           = require('passport-local').Strategy,
    //Client                  = require('../lib/client'),
    //AccessToken             = require('../lib/accessToken'),
    //RefreshToken            = require('../lib/refreshToken'),
    userModel               = require('../models/ctUserModel'),
    moment                  = require('moment'),
    envVar                  = process.env.NODE_ENV,
	fs                      = require('fs'),
    yaml                    = require("js-yaml"),
    conf                    = yaml.load(fs.readFileSync('config/config.yml'));


// authenticate user/pass
passport.use(new LocalStrategy(
	function (username, password, done) {
		console.log('LocalStrategy');

		userModel.getByLoginPass(username, password, function(err, user) {
			if (err) { return done(err); }
			if (!user) { return done(null, false); }
			return done(null, user);
		});
	}
));

// client login / password authentication
passport.use(new BasicStrategy(
	function(username, password, done) {
		console.log('BasicStrategy');

		userModel.getByLoginPass(username, password, function(err, user) {
			if (err) { return done(err); }
			if (!user) { return done(null, false); }

			console.log('completed BasicStrategy');
			return done(null, user);
		});
	}
));

// OAuth2 style client id/secret
passport.use(new ClientPasswordStrategy(
    function(clientId, clientSecret, done) {
	    console.log('ClientPasswordStrategy');
	    console.log('clientId:'+clientId+' clientSecret:'+clientSecret);

	    // validate credentials against settings
	    if (clientId !== conf[envVar].clientId) {
		    return done('Bad clientId given');
	    } else if (clientSecret !== conf[envVar].clientSecret) {
		    return done('Invalid clientSecret');
	    }

	    var client = {
		    'clientId': clientId,
		    'clientSecret': clientSecret,
		    'clientName': 'Convirza'
	    };
	    console.log('completed ClientPasswordStrategy');
	    return done(null, client);
    }
));

// normal token validation on API requests
passport.use(new BearerStrategy(
    function(accessToken, done) {
	    console.log('BearerStrategy', 'access_token', accessToken);
	    var oauthToken = require('../lib/token');

	    oauthToken.findAccess(accessToken, function(err, token) {
		    if (err) { return done('Failed to find access token record. '+err); }
		    if (token === undefined) { return done(null, false); }

		    oauthToken.updateAccess(accessToken, token, function(err) {
			    if (err) { return done('Failed to update access token. '+err); }
		    });
		    //console.log('tokenData', token);
		    oauthToken.closeMem();
		    console.log('completed BearerStrategy');
		    done(null, token.data, token.scope);
	    });
    }
));

/*passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  db.users.find(id, function (err, user) {
    done(err, user);
  });
});
*/