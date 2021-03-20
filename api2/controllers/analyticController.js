var controller = require('./appController'),
	analyticModel = require('../models/analyticModel');

var analytic = {
	postAction: function(req, res){
		analyticModel.create(req.body, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	putAction: function(req, res){
		analyticModel.update(req.body, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},

	getByOuidAction: function(ouid, includeParentAnalytics, res){
		if(includeParentAnalytics === 'true'){
			analyticModel.getByOuAndParentSetting(ouid, function(err, data){
				controller.responsify(err, data, function(response){
					res(response);
				});
			});
		}else{
			analyticModel.getByOuid(ouid, function(err, data){
				controller.responsify(err, data, function(response){
					res(response);
				});
			});
		}
	}
};

module.exports = analytic;