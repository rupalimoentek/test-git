var Controller = require('./appController'),
	model = require('../models/migGroupModel');

var mig = {
	getByCustomerIdAction: function(req,callback){
		model.getByCustomerId(req,function(err,results){
			Controller.responsify(err,results,function(response){
				callback(response);
			});
		});
	},
	postAction: function(req,callback){
		model.post(req,function(err,results){
			Controller.responsify(err,results,function(response){
				callback(response);
			});
		});
	}
};

module.exports = mig;