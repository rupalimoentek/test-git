var jwt = require('jwt-simple'),
	secret = require('../config/secret.js')();

var tokenizer = {
	fetchOuId: function(req){
		var decoded = decoder(req);
		return decoded.ouid;
	},
	fetchUserId:  function(req) {
		var decoded = decoder(req);
		return decoded.userid;
	}
};

module.exports = tokenizer;

function decoder(req) {
	var token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];
	var decoded = [];
	if (token) {
		decoded = jwt.decode(token, secret);
	}
	return decoded;
}