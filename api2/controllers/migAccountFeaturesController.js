var Controller = require('./appController'),
	model = require('../models/migAccountFeaturesModel');

var mig = {
	postDataAction: function(req,callback){
		model.postData(req,function(err,results){
			Controller.responsify(err,results,function(response){
				callback(response);
			});
		});
	},
	getByIdAction: function(req,callback){
		model.getById(req,function(err,results){
			Controller.responsify(err,results,function(response){
				callback(response);
			});
		});
	},
	getSessionsAction: function(req,callback){
		model.getSessions(req,function(err,results){
			Controller.responsify(err,results,function(response){
				callback(response);
			});
		});
	}
};

module.exports = mig;