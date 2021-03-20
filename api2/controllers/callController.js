var controller = require('./appController'),
	callModel = require('../models/callModel');

var call = {
	getInfo: function(req, res){
		//console.log(req);
		if(req.id) {
			callModel.getInfo(req, function(err, data){
				controller.responsify(err, data, function(response){
					res(response);
				});
			});
		}
	},
	getComment: function(req, res){
		if(req.id) {
			callModel.getComments(req, function(err, data){
				controller.responsify(err, data, function(response){
					res(response);
				});
			});
		}
	},
	postComment: function(req, res){
		callModel.postComments(req, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	deleteComment: function(req, res){
		if(req.params.id) {
			callModel.deleteComments(req, function(err, data){
				controller.responsify(err, data, function(response){
					res(response);
				});
			});
		}
		else {
			res("Nonvalid/Nonexist ID specified!");
		}
	},
	getTag: function(req, res){
		//console.log(req);
		if(req.id) {
			callModel.getTags(req, function(err, data){
				controller.responsify(err, data, function(response){
					res(response);
				});
			});
		}
		else {
			res("Nonvalid/Nonexist ID specified!");
		}
	},
	postTag: function(req, res){
		callModel.postTags(req, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	}, 
	emailRecording: function(req, res){
		callModel.emailRecordings(req, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	}
};

module.exports = call;