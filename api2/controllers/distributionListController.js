var controller = require('./appController'),
	distributionListModel = require('../models/distributionListModel');

var distributionList = {
	getList: function(req, res) {
		distributionListModel.list(req.params.ouid, req.user.user_id, req.user.role_id, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	getDistributionListData: function(req, res){
		distributionListModel.getListById(req, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	createDistributionList: function(req, res){
		if(req.body.distributionlist) {
			distributionListModel.create(req.body, req.user.user_id, req.user.ou_id, function(err, data){
				controller.responsify(err, data, function(response){
					res(response);
				});
			});
		} else {
			var response = {
	            result: 'error',
	            err: 'Invalid parameters passed.',
	            json: {}
	        };
	        res(response);
		}
	},
	updateDistributionList: function(req, res){
		distributionListModel.update(req.body, req.user.user_id, req.user.ou_id, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	deleteDistributionList: function(req, res){
		distributionListModel.delete(req, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	campaignAndAssignedUser: function(req, res){
		distributionListModel.campaignAndAssignedUser(req.params.ouid, req.user.user_id, req.user.role_id, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	campaignUsers: function(req, res){
		distributionListModel.campaignUsers(req.query.ouid, req.user.user_id, req.user.role_id, req.query.campaignId, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},

	selectList: function(req, res) {
		distributionListModel.recipientList(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	}
};

module.exports = distributionList;
