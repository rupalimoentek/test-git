var Controller = require('./appController'),
	model = require('../models/migCampaignModel'),
	appModel = require('../models/appModel'),
	async    = require('async')
	token 	 = require('../lib/token');

var mig = {
	postAction: function(req,callback){
		model.post(req,function(err,results){
			Controller.responsify(err,results,function(response){
				callback(response);
			});
		});
	},
	getBillingNodeAction: function(ouid, res) {
		model.getBillingNode(ouid, function(err, data) {
			Controller.responsify(err, data, function (response) {
				res(response);
			});
		});
	},
	getCampaignByOuidAction: function(req, res){
		//This is for AMP 3, DO NOT CHNAGE
    	model.getCampaignByOuid(req, function(err, data){
    		Controller.responsify(err, data, function(response){
    			res(response);
    		});
    	});
    },
    getCampaignsByOuidAction: function(req, res){
		//This is for AMP 3, DO NOT CHNAGE
    	model.getCampaignsByOuid(req, function(err, data){
    		Controller.responsify(err, data, function(response){
    			res(response);
    		});
    	});
    },
	getCampaignByCamapignIdAction: function(campaignId, res){
    	model.getCampaignByCamapignId(campaignId, function(err, data){
    		Controller.responsify(err, data, function(response){
    			res(response);
    		});
    	});
    },
	postMigrateCampaignAction: function(req,res){
		model.moveCampaignToOu(req.body, function(err,data){
			Controller.responsify(err, data, function (response) {
				res(response);
			});
		});
	}	
};

module.exports = mig;