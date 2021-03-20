var controller = require('./appController'),
	f = require('../functions/functions'),
	fs = require("fs"),
	yaml = require("js-yaml"),
	http = require('http'),
	conf   = yaml.load(fs.readFileSync('config/config.yml')),
	envVar = process.env.NODE_ENV,
	callFlowModel = require('../models/callFlowModel'),
	ttsModel = require('../models/ttsModel');	

var callFlow = {
	getByProvisionedRouteAction: function(req, provisioned_route_id,migrated, res){
		callFlowModel.getByProvisionedRoute(provisioned_route_id,migrated, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	getOutboundCallerIDs: function(req, provisioned_route_id, res){
		callFlowModel.getOutboundCallerIDsList(req, provisioned_route_id, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	getLocationAction: function(req, ouid, res){
		var orgUnitModel = require('../models/orgUnitModel');
		orgUnitModel.ouLocations(ouid, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},

	getMedia: function(req, msg, cb){
		ttsModel.getMediaFromTTS(msg, function(err, data){
			controller.responsify(err, data,function(response){
				cb(response);
			})
		});
	},
	//Needs to review
	deleteByIdAction: function(id,callback){
		//var ceTransactionModel = require('../models/ceTrans');
		var ctTransactionModel = require('../models/ctTransactionModel');
		var ctTrans = new ctTransactionModel.begin(function(err){
			if (err) {
				controller.responsify(err,null,function(response){
					callback(response);
				});
				return;
			}
			callFlowModel.deleteById(ctTrans,id,null, function(err, data){
				if(err){
					ctTrans.rollback(function(){});
				}else{
					ctTrans.commit(function(){});
				}
				controller.responsify(err,data,function(response){
					callback(response);
				})
			})
		});
	},
	validate_csv_data: function(csv_data,callback){
		callFlowModel.validate_csv_data(csv_data, function(err, data){
			controller.responsify(err,data,function(response){
				callback(response);
			})
		})
	},
	createCallFlowByCsv: function(csv_data,callback){
		callFlowModel.createCallFlowByCsv(csv_data, function(err, data){
			if(err){
				callback(err);
			}
			callback(data);
		})
	}
};

module.exports = callFlow;
