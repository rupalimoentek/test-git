var Memcached = require('memcached'),
	yaml = require("js-yaml"),
	fs = require("fs"),
	envVar = process.env.NODE_ENV,
	e = yaml.load(fs.readFileSync("config/config.yml")),
	//lifetime = e[envVar].memcached.lifetime,
	//memcached = new Memcached(e[envVar].memcached.server + ':' + e[envVar].memcached.port),
	async = require('async');


var session = {
// 	set: function(id, data, res){
// 		memcached.set(id, data, lifetime, function(err, result){
// 			if (err) console.log('Memecached error: ' + err);
// 			res(null,result);
// 		});
// 	},
// 	get:  function(id, res) {
// 		memcached.get(id, function(err, result){
// 			var r = {missing: 'No Session.'};
// 			if (result) {
// 				r = result;
// 			}
// 			if (err) console.log('Memecached error: ' + err);
// 			res(null,r);
// 		});
// 	},
// 	update: function(id, values, res) {
// 		async.waterfall([
// 			function(cb){
// 				memcachedGet(id, function(err, result){
// 					cb(err, result);
// 				});
// 			},
// 			function(result,cb){
// 				for(var key in values){
// 					result.session[key] = values[key];
// 					// result.session.ou_id = 45;
// 					// result.session.ou_name = 'Walter White';
// 				}
// 				memcachedReplace(id, result, lifetime, function(err, r){
// 					cb(r);
// 				});
// 			}
// 			],
// 			function(err){
// 				res();
// 			});
// 	},
// 	delete: function(id, res){
// 		memcached.del(id, function(err){
// 			res(null, 'Session deleted.');
// 		});
// 	}
// };

// function memcachedGet(id, callback){
// 	memcached.get(id, function(err, result){
// 		callback(err,result);
// 	});
// }

// function memcachedReplace(id, result, lifetime, callback){
// 	console.log('result is ' + JSON.stringify(result))
//     memcached.replace(id, result, lifetime, function(err, r){
// 	    	callback(err,r);
// 		});

}

module.exports = session;