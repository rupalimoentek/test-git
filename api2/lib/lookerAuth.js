/**
+ * Created by Ashutosh J
+ */
	var oauthToken          = require('../lib/token');

	var lookerToken = {
		getAccessLooker: function(req, res) {
			if(req.body.data.access_token === undefined || req.body.data.access_token === ''){return res("Unauthorized access");}else{
				var accessToken = req.body.data.access_token;
				oauthToken.findAccess(accessToken,function(err,result){
					if(err){return res(err);}
					else if(result === undefined || result === null){return res("Unauthorized access");}
					else{
						req.userId = result.userId;
						req.clientId = result.clientId;
						req.scope = result.scope;
						req.user = result.data;
						res(err,req);
					}
				});
			}
		}
	};

module.exports = lookerToken;
