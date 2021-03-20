var controller = require('./appController'),
	dniOrgUnitModel = require('../models/dniOrgUnitModel'),
	ctlogger = require('../lib/ctlogger.js');

var dniOrgUnit = {
	postAction: function(req, res){
		//console.log(req.body.dniOrgUnit);
		dniOrgUnitModel.create(req.body.dniOrgUnit, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	putAction: function(req, res){
		//console.log(req.body.dniOrgUnit);
		dniOrgUnitModel.update(req.body.dniOrgUnit, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	postActionForCqm: function(req, res){
		console.log(req.body);
		dniOrgUnitModel.create_for_cqm(req.body, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	}
};

module.exports = dniOrgUnit;