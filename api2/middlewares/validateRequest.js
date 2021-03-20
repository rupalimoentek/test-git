var jwt = require('jwt-simple');

module.exports = function(req, res, next){
	var route = req.url.split('/')[2];
	if (route == 'login') {
		next();
		return;
	}
	console.log(req.method.toUpperCase());
	     if (req.method.toUpperCase() === "OPTIONS"){

			console.log("inside OPTIONS");
            // Echo back the Origin (calling domain) so that the
            // client is granted access to make subsequent requests
            // to the API.
			var origin = (req.headers.origin || "*");
			console.log(origin);
            res.writeHead(
                "204",
                "No Content",
                {
                    "access-control-allow-origin": origin,
                    "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "access-control-allow-headers": "content-type, accept,x-access-token",
                    "access-control-max-age": 10, // Seconds.
                    "content-length": 0
                }
            );

		console.log("resp head = " + JSON.stringify(res.head));
            // End the response - we're not sending back any content.
            return( res.end() );


        }
	var token = req.headers['x-access-token'];
	if (token) {
		try{
			var decoded = jwt.decode(token, require('../config/secret.js')());
			if (decoded.exp <= Date.now()) {
				res.status(400);
				res.json({
					"status": 400,
					"message": "Token Expired"
				});
				return;
			}else{
				req.ouid = decoded.ouid;
				req.userid = decoded.userid;
				next();
			}
		}catch (err){
			res.status(500);
			res.json({
				"status": 500,
				"message": "Oops something went wrong",
				"error": err
			});
		}
	}else{
		res.status(401);
		res.json({
			"status": 401,
			"message": "Unauthorized"
		});
		return;
	}
};