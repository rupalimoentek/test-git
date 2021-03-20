var controller = require('./appController'),
	subscriptionModel = require('../models/subscriptionModel');

var subscription = {
	
	getAllCounts: function(req, res){
		subscriptionModel.getAllCounts(req, function(data){
			res(data);
		});
	},
	getCampaignsCounts: function(req, res){
		subscriptionModel.getCampaignsCounts(req, function(data){
			res(data);
		});
	},
	getTrackingNumbersCounts: function(req, res){
		var params;
		subscriptionModel.getTrackingNumbersCounts(req, function(data){
			res(data);
		});
	},
	getMinutesUsed: function(req, res){
		var params;
		subscriptionModel.getMinutesUsed(req, function(data){
			res(data);
		});
	},
	getUserUsed: function(req, res){
		var params;
		subscriptionModel.getUserUsed(req, function(data){
			res(data);
		});
	}/*,
	getCallActions: function(req, res){
		var params
		subscriptionModel.getCallActions(req, function(data){
			res(data);
		});
	}*/
};

module.exports = subscription;
