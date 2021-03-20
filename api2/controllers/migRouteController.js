var Controller = require('./appController'),
	model = require('../models/migRouteModel');

var mig = {
	postAction: function(req,callback){
		model.post(req,function(err,results){
			Controller.responsify(err,results,function(response){
				callback(response);
			});
		});
	},
	getUsersByOuidAction: function(ouid,callback){
		model.getUsersByOuidAction(ouid,function(err,results){
			Controller.responsify(err,results,function(response){
				callback(response);
			});
		});
	},
	getLocations: function(ouid, callback){
		model.locations(ouid,function(err,results){
			Controller.responsify(err,results,function(response){
				callback(response);
			});
		});
	}
};

module.exports = mig;