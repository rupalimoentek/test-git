var controller = require('./appController'),
	f = require('../functions/functions'),
	sessions = require('../lib/session');

var session = {
	putAction: function(req, res){
		var id = req.headers['x-access-token'];
		var values = req.body.session;
		sessions.update(id, values, function(err, result){
			res('Session updated.');
		});
	},
	getAction: function(req, res){
		var id = req.headers['x-access-token'];
		sessions.get(id, function(err, data){
			res(data);
		});
	},
	deleteAction: function(req, res){
		var id = req.headers['x-access-token'];
		sessions.delete(id, function(err, result){
			res(result);
		});
	},
	resetOuAction: function(req, res){
		var id = req.headers['x-access-token'];
		sessions.get(id, function(err, data){
			var values = {
				ou_id: data.session.tl_id,
				ou_name: data.session.tl_name
			};
			sessions.update(id, values, function(err, result){
				sessions.get(id, function(err, data){
					res(data);
				});
			});
		});
	}
};

module.exports = session;