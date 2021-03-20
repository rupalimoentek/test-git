/**
 * Created by davey on 3/7/16.
 */
var Memcached           = require('memcached'),
    fs                  = require('fs'),
    yaml                = require('js-yaml'),
    conf                = yaml.load(fs.readFileSync('config/config.yml')),
    envVar              = process.env.NODE_ENV,
	uuid                = require('node-uuid');

var memcached   = new Memcached(conf[envVar].memcached.server+':'+conf[envVar].memcached.port, {retries:10, retry:10000});

var token = {
	getToken: function(tokenType, res) {
		var type = (tokenType === 'access' ? 'access_token-' : 'refresh_token-');
		var run = true;
		var guid = uuid.v4();

		async.whilst(
			function() { return run; },
			function(cb) {
				guid = uuid.v4();
				memcached.get(type+guid, function(err, ret) {
					if (err) {
						console.log('Got an error ', err);
						return cb('An error occurred. '+err); }
					console.log('return', ret);
					if (ret === undefined) {
						console.log('hit stop point', guid);
						run = false;
						cb(null, guid);
					}
				});
			},
			function(err, uid) {
				if (err) { console.log("ERROR: ", err); return res('Error geting UUID. '+err); }
				res(null, guid);
			}
		);
	},
	newToken: function(tokenType, data, res) {
		if (tokenType !== 'access' && tokenType !== 'refresh') { return res('Invalid token type requested.'); }

		var guid = uuid.v4();
		var newToken = (tokenType == 'access' ? 'access_token-' : 'refresh_token-')+guid;
		var newData = JSON.stringify(data);
		memcached.get(newToken, function(err, tokenData) {
			if (err) {
				console.log('Failure checking token '+newToken);
				return res('Failed to check token. '+err); }
			if (!tokenData) {
				memcached.set(newToken, newData, function(err) {
					if (err) {
						console.log('Failed to create new token record');
						return res(err); }
					res(null, guid);
				});
			} else {
				token.newToken(tokenType, data, function(err, ret) {
					if (err) { return res(err); }
					res(null, ret);
				});
			}
		});
	},
	findAccess: function(accessToken, res) {
		memcached.get('access_token-'+accessToken, function(err, data) {
			if (err) { res('Failed to retrieve token. '+err); }
			if(data){
				data = JSON.parse(data);
				res(null, data);
			}else{
				res('Failed to retrieve token data. '+err); 
			}
		});
	},
	setAccess: function(accessToken, data, res) {
		data = JSON.stringify(data); // compress the data
		memcached.set('access_token-'+accessToken, data, conf[envVar].memcached.lifetime, function(err) {
			if (err) { return res('Failed to save access token. '+err); }
			res(null, accessToken);
		});
	},
	updateAccess: function(accessToken, data, res) {
		data = JSON.stringify(data); // compress the data
		memcached.replace('access_token-'+accessToken, data, conf[envVar].memcached.lifetime, function(err) {
			if (err) { return res('Failed to update access token. '+err); }
			res(null, accessToken);
		});
	},
	updateMemcacheBlacklist: function(token, data, res) {
		data = JSON.stringify(data); // compress the data
		memcached.set(token, data, conf[envVar].memcached.refreshlife, function(err) {
			if (err) { return res('Failed to save access token. '+err); }
			res(null, token);
		});
	},
	deleteBlacklistAccess: function(accessToken, res) {
		memcached.del(accessToken, function(err) {
			if (err) { return res('Failed to delete access token. '+err); }
			res(null, 'success');
		});
	},
	deleteAccess: function(accessToken, res) {
		memcached.del('access_token-'+accessToken, function(err) {
			if (err) { return res('Failed to delete access token. '+err); }
			res(null, 'success');
		});
	},
	findRefresh: function(refreshToken, res) {
		memcached.get('refresh_token-'+refreshToken, function(err, data) {
			if (err) { res('Failed to retrieve refresh token. '+err); }
			if (data !== undefined) { data = JSON.parse(data); } // unpackage the data
			res(null, data);
		});
	},
	setRefresh: function(refreshToken, data, res) {
		data = JSON.stringify(data); // compress the data
		memcached.set('refresh_token-'+refreshToken, data, conf[envVar].memcached.refreshlife, function(err) {
			if (err) { return res('Failed to save refresh token. '+err); }
			res(null, refreshToken);
		});
	},
	closeMem: function() {
		memcached.end();
		return true;
	},
	addCampaign: function(req, campaignid, res) {
		var access = req.headers.authorization.split(' ');
		token.findAccess(access[1], function(err, tokenData) {
			if (err) { return done('Failed to find access token record. '+err); }
			if (tokenData === undefined) { return res('No session record found'); }
			if (tokenData.data.camplist.indexOf(campaignid) < 0) { // add new ID
				campId = parseInt(campaignid);
				tokenData.data.camplist.push(campId); // add to session data
				if(req.user !== undefined && req.user.camplist !== undefined)
					req.user.camplist.push(campId); // add to Node session variable
				}

			token.updateAccess(access[1], tokenData, function(err) {
				console.log(tokenData.data.camplist.toString());
				if (err) { return res('Failed to update access token. '+err); }
			
				token.closeMem();
				console.log('completed adding campaign ID to session list');
				res(null, 'success');
			});
		});
	},
  updateOuList:function(req,oulist,res){
    var access = req.headers.authorization.split(' ');
		token.findAccess(access[1], function(err, tokenData) {
			if (err) { return done('Failed to find access token record. '+err); }
			if (tokenData === undefined) { return res('No session record found'); }
      tokenData.data.orglist = oulist;
      req.user.orglist = oulist;
      token.updateAccess(access[1], tokenData, function(err) {
				if (err) { return res('Failed to update access token. '+err); }
			});
			token.closeMem();
			console.log('completed adding campaign ID to session list');
			res(null, 'success');
		});
  },
	dropCampaign: function(req, campaignid, res) {
		var access = req.headers.authorization.split(' ');
		token.findAccess(access[1], function(err, tokenData) {
			if (err) { return done('Failed to find access token record. '+err); }
			if (tokenData === undefined) { return res('No session record found'); }
			var index = tokenData.data.camplist.indexOf(campaignid); // add new ID
			if (index >= 0) { // found position
				tokenData.data.camplist.splice(index, 1); // removed entry from session data
				req.user.camplist.splice(index, 1); // remove entry from Node session variable
			}

			token.updateAccess(access[1], tokenData, function(err) {
				if (err) { return res('Failed to update access token. '+err); }
			});
			token.closeMem();
			console.log('completed removing campaign ID to session list');
			res(null, 'success');
		});
	}
};

module.exports = token;
