var Controller = require('./appController'),
	model = require('../models/migCustomerFeaturesModel');

var mig = {
	postDataAction: function(req,callback){
		model.postData(req,function(err,results){
			Controller.responsify(err,results,function(response){
				callback(response);
			});
		});
	},
	getCustomersAction: function(req,callback){
		model.getCustomers(req,function(err,results){
			Controller.responsify(err,results,function(response){
				callback(response);
			});
		});
	}
};

module.exports = mig;