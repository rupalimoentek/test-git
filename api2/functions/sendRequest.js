var request = {
	http: function(data, cb){
		var url = require('url'),
			parsedUrl = url.parse(data.url),
			https = require('https'),
			http = require('http'),
			protocol = http,
			secure = false,
			qs = require('qs');

		var out_text = data.payload;

		var options = {
			host: parsedUrl.hostname,
		  	port: parsedUrl.port,
			path: parsedUrl.path,
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.110 Safari/537.36',
				'Referer': parsedUrl.protocol + '//' + parsedUrl.hostname
			}
		};

		if (parsedUrl.protocol === 'https:') {
			options.rejectUnauthorized = false;
			protocol = https;
		}

		switch(data.format.toLowerCase()){
			
			case 'json':
				options.headers['Content-Type'] = 'application/json';
				out_text = out_text = JSON.stringify(data.payload);
				options.headers['Content-Length'] = out_text.length;
				break;
			case 'form-urlencoded':
				options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
				out_text = qs.stringify(JSON.parse(data.payload));
				console.log(out_text);
				options.headers['Content-Length'] = out_text.length;
				break;
			case 'xml':
				var xmlParser = require("js2xmlparser");
				var xmlParser = require("jstoxml");//Changed to jstoxml because j2xmlparser url encodes the s3 link.
				out_text = xmlParser.toXML(data.payload);
				options.headers['Content-Type'] = 'text/xml';
            	options.headers['Content-Length'] = Buffer.byteLength(out_text);
				break;
			case 'xml_new':
				var async = require('async');
				var xmlParser = require("js2xmlparser");
				var temp_payload = {};				
				out_text = xmlParser("Webhook-Data", data.payload);
				var processed_text = '';
				var inside_tag = false;
				//loop over entire text string searching for spaces in tag names and replacing with dashes
				for (var i = 0; i < out_text.length; i++) {					
					if(out_text.charAt(i) == '<') inside_tag = true; //tag starting
					if(out_text.charAt(i) == '>' || out_text.charAt(i) == '?') inside_tag = false; //tag ending and skipping first line
					if(inside_tag && out_text.charAt(i) == ' '){
						processed_text+= "-";
					}
					else {
						processed_text+= out_text.charAt(i);
					}
				}
				out_text = processed_text;
				options.headers['Content-Type'] = 'text/xml';
            	options.headers['Content-Length'] = Buffer.byteLength(out_text);
				break;
		}

		switch(data.method.toLowerCase()){
			case 'post':
				options.method = 'POST';
				break;
			case 'put':
				options.method = 'PUT';
				break;
			case 'get':
				options.method = 'GET';
				// str = qs.escape(JSON.stringify(data.payload));
				// options.path = parsedUrl.path+'?'+str;
				break;
		}

		  
		var buffer = '';
		var request = protocol.request(options, function (response) {
			var data ='';
			response.setEncoding('utf8');
			console.log(response.statusCode);
			response.on('data', function (chunk) {	
			 	console.log('BODY: ' + chunk);
				data +=chunk;
				if(response.statusCode == 200 || response.statusCode == 302) {
					cb(null,data);
				} else {
					cb('could not connect.',data);
				}
		  });

		});

		request.on('error', function (e) {
				console.log('problem with request: ');
				console.log(e);
				cb(e.message,null);
		});

		request.write(out_text);
		request.end();
	}
};

module.exports = request;