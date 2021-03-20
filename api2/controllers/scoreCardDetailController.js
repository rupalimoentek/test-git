var controller = require('./appController'),
	scoreDetailModel = require('../models/scoreCardDetailModel'),
	callModel = require('../models/callModel');

var scoreDetail = {
  getCallDetails: function(req, res) {
		scoreDetailModel.callDetailScorecard(req, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
 getIdentifyUsers: function(req, res) {
		scoreDetailModel.getIdentifyUsers(req, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
 getCallAudioFile: function(req, res) {
		 scoreDetailModel.getCallAudioFile(req, function(err, data) {
			 controller.responsify(err, data, function(response){
				 res(response);
			 });
		 });
	},
 getCallsTags: function(req, res) {
		 scoreDetailModel.getCallsTags(req, function(err, data) {
			 controller.responsify(err, data, function(response){
				 res(response);
			 });
		 });
	},//new
	addTagByCallId:function(req,res){
		scoreDetailModel.addTagByCallId(req, function(err, data) {
			 controller.responsify(err, data, function(response){
				 res(response);
			 });
		 });
	},
	deleteTagByCallId:function(req,res){
		scoreDetailModel.deleteTagByCallId(req, function(err, data) {
			 controller.responsify(err, data, function(response){
				 res(response);
			 });
		 });
	},
	addScoreCallDetail: function(req, res) {
		scoreDetailModel.addScoreCallDetail(req, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	updateScoreCallDetail: function(req, res) {
		scoreDetailModel.updateScoreCallDetail(req, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	updateScoreStatus: function(req, res) {
		scoreDetailModel.updateScoreStatus(req, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	addCommentRespons:function(req,res){
		console.log("inside controller addCommentRespons..........................................")
		scoreDetailModel.addCommentRespons(req, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	getCommentResponses:function(req,res){
		console.log("inside controller getCommentResponses..........................................")
		scoreDetailModel.getCommentResponses(req, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},

//sarika - delete comments.
	deleteComment: function(req, res) {
		scoreDetailModel.deleteComment(req, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	//sarika - delete Response.
	deleteCommentResponse: function(req, res) {
		console.log("in controller req.params=",req.params)
		scoreDetailModel.deleteCommentResponse(req, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},	

	getAllComments:function(req,res){
		console.log("inside controller getAllComments..........................................")
		scoreDetailModel.getAllComments(req, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	}


};

module.exports = scoreDetail;
