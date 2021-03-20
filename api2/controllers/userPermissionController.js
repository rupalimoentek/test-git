var permissionModel 	= require('../models/userPermissionModel'),
	controller 			= require('./appController');

var permission = {
	// adds a new webhook record
	getReportsByOuid: function(req, res) {
		permissionModel.getReportsListByOuid(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	getOusByOuid: function(req, res) {
		permissionModel.getOuListByOuid(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	getOusByUserid: function(req, res) {
		permissionModel.getOuListByUserid(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	saveUserScorecardPermissions: function(req, res) {
		//// FOR AMP3 USE DO NOT CHANGE
		permissionModel.saveUserScorecardPermissions(req, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	setUserReportPermissionsAction: function(req, res) {
		//// FOR AMP3 USE DO NOT CHANGE
		permissionModel.setUserReportPermissions(req, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	saveUserPermissions: function(req, res) {
		permissionModel.addUserPermissions(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	removeUserPermissions: function(req, res) {
		permissionModel.deleteUserPermissions(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	getDataAppend : function (req, res) {
		permissionModel.getDataAppend(req, function(err,data){
			if (err) { res(err); } else { res(null, data); }
		});
	},
	getAccessibleOuid: function(req,callback){
		//// FOR AMP3 USE DO NOT CHANGE ////
		permissionModel.getAccessibleOuid(req,function(err,results){
			controller.responsify(err,results,function(response){
				callback(response);
			});
		});
	},
	getUserPermissions: function(req,callback){
		//// FOR AMP3 USE DO NOT CHANGE ////
		permissionModel.getUserPermissions(req,function(err,results){
			controller.responsify(err,results,function(response){
				callback(response);
			});
		});
	},
	getOuListByUserId: function(req, callback){
		permissionModel.getOuListByUserId(req, function(err,results){
			callback(err, results);
		});
	},
	moveUser: function(req, callback){
		permissionModel.moveUser(req, function(err,results){
			callback(err, results);
		});
	}
};

module.exports = permission;
