var Controller = require('./appController'),
	model = require('../models/migCampaignProvisioningModel');

var mig = {
	postDataAction: function(req,callback){
		model.postData(req,function(err,results){
			Controller.responsify(err,results,function(response){
				callback(response);
			});
		});
	},
	getCampaignsAction: function(req,callback){
		model.getCampaigns(req,function(err,results){
			Controller.responsify(err,results,function(response){
				callback(response);
			});
		});
	}
};

module.exports = mig;