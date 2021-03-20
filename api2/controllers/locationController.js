var controller = require('./appController'),
	locationModel = require('../models/locationModel'),
	yaml = require("js-yaml"),
	fs = require("fs"),
	d = yaml.load(fs.readFileSync('./config/directories.yml'));

var location = {
	getByIdAction: function(id,pageinfo,timezone, res){
    locationModel.getById(id,pageinfo.page,timezone, function(err, data){
			controller.responsify(err,data,function(response){
				res(response);
			});
		});
	},
	getByOuidAction: function(req, res){
		locationModel.getByOuid(req, function(err, data){
			controller.responsify(err,data,function(response){
				res(response);
			});
		});
	},
	getByOuidAction1: function(req, res){
		locationModel.getByOuid1(req, function(err, data){
			controller.responsify(err,data,function(response){
				res(response);
			});
		});
	},	
	createAction: function(req, res){
		locationModel.create(req.body, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	updateAction: function(req, res){
		locationModel.update(req.body, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	deleteAction: function(req, res){
		locationModel.delete(req.body, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	deleteLocationAction: function(id, res){
		locationModel.delete_location(id, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	saveLocationIVR: function(req, res){
		locationModel.saveLocationIVR(req, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	getIvrBylocationIvrId: function(id, res){
			locationModel.getIvrBylocationIvrId(id, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	deleteIvrBylocationIvrId: function(id, res){
		locationModel.deleteIvrBylocationIvrId(id, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	}
};

module.exports = location;
