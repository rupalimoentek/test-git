var controller = require('./appController'),
	scoreCardCallModel = require('../models/scoreCardCallModel'),
	callModel = require('../models/callModel');

var scoreCardCall = {
	//Amrita - fetch Score Card calls and export functionality.
	getCallDetails: function(req, res) {
		scoreCardCallModel.retriveScoreCardCalls(req, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},

	//Amrita - fetch Agents.
	getIdentifyUsers: function(req, res) {
		scoreCardCallModel.getIdentifyUsers(req, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	//Amrita - save Agents.
	saveComment: function(req, res) {
		scoreCardCallModel.saveComment(req, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},

	//Amrita - save Call criteria.
	saveCallCriteria: function(req, res) {
		scoreCardCallModel.saveCallCriteria(req, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},

	getCallAudioFile: function(req, res) {
		 scoreCardCallModel.getCallAudioFile(req, function(err, data) {
			 controller.responsify(err, data, function(response){
				 res(response);
			 });
		 });
	},

	checkIfUserValid: function(req, res) {
		scoreCardCallModel.checkIfUserValid(req, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
   },
	getCallsTags: function(req, res) {
		 scoreCardCallModel.getCallsTags(req, function(err, data) {
			 controller.responsify(err, data, function(response){
				 res(response);
			 });
		 });
	},
	addScoreCallDetail: function(req, res) {
		scoreCardCallModel.addScoreCallDetail(req, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	updateScoreCallDetail: function(req, res) {
		scoreCardCallModel.updateScoreCallDetail(req, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	updateScoreStatus: function(req, res) {
		scoreCardCallModel.updateScoreStatus(req, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},

	//Amrita - fetch Active Score Cards.
	 getActiveScoreCards: function(req, res) {
		scoreCardCallModel.retriveActiveScoreCards(req, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	
	//Amrita - save Agent - ct_user_id in call table.
	saveAgent: function(req, res) {
		scoreCardCallModel.saveAgent(req, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},

	getAdvancedActiveScoreCards: function(req, res) {
		scoreCardCallModel.retriveAdvancedFilterActiveScoreCards(req, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
};

module.exports = scoreCardCall;
