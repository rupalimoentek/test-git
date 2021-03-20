'use strict';

var scoreModel = require('../models/scoreModel');
var ctlogger           = require('../lib/ctlogger.js');


var score = {
	save_score_card: function(req, res) {
		scoreModel.save_score_card(req, function (err, data) {
			if (err) { 
				res(null, err); 
			} else { 
				var newdata = {'org_unit_id':req.ouid, 'ct_user_id':req.userid, 'score_card_id':data.score_card_id, 'log_data': data, created_by: req.userid, updated_by: req.userid};
				ctlogger.log(newdata, 'insert', 'score_card','','',req.headers.authorization);
				res(null, data); 
			}
			
		});
	},
	update_score_card: function(req, res) {
		scoreModel.update_score_card(req, function (err, data) {
			if (err) { 
				res(null, err); 
			} else { 
				var newdata = {'org_unit_id':req.ouid, 'ct_user_id':req.userid, 'score_card_id':req.params.id, 'log_data': data, created_by: req.userid, updated_by: req.userid};
				ctlogger.log(newdata, 'update', 'score_card','','',req.headers.authorization);
				res(null, data); 
			}
		});
	},
	add_score_to_call: function(req, res) {
		scoreModel.add_score_to_call(req, function (err, data) {
			if (err) { res(err, null); } else { res(null, data); }
			
		});
	},
	attach_score_card_to_call: function(req, res) {
		scoreModel.attach_score_card_to_call(req, function (err, data) {
			if (err) { res(err, null); } else { res(null, data); }
			
		});
	},
	set_call_listened: function(req, res) {
		scoreModel.set_call_listened(req, function (err, data) {
			if (err) { res(err, null); } else { res(null, data); }
			
		});
	},
	update_score_card_call_status: function(req, res) {
		scoreModel.update_score_card_call_status(req, function (err, data) {
			if (err) { res(null, err); } else { res(null, data); }
			
		});
	},
	getGroups: function(req,res) {
		scoreModel.getGroups(req,function (err, data) {
			if (err) { res(err); }
			res(null, data);
		});
	},

	getScoreCards: function(req,res) {
		scoreModel.getScoreCards(req,function (err, data) {
			if (err) { 
				res(err); 
			}else{
				res(null, data);
			}
		});
	},
	getScoreCardsById: function(req,res) {
		scoreModel.getScoreCardsById(req,function (err, data) {
			if (err) { res(err); }
			res(null, data);
		});
	},
	archiveScorecard: function(req, res) {
		scoreModel.archiveScorecard(req.params, function (err, data) {
			if (err) { 
				res(null, err); 
			} else { 
				var newdata = {'org_unit_id':req.ouid, 'ct_user_id':req.userid, 'score_card_id':req.params.Id, 'log_data': data, created_by: req.userid, updated_by: req.userid};
				ctlogger.log(newdata, 'delete', 'score_card','','',req.headers.authorization);
				res(null, data); 
			}
		});
	},
	checkScoreCardStatus: function(req, res) {
		scoreModel.checkScoreCardStatus(req.params, function (err, data) {
			if (err) { 
				res(null, err); 
			} else { 
				// var newdata = {'org_unit_id':req.ouid, 'ct_user_id':req.userid, 'score_card_id':req.params.Id, 'log_data': data, created_by: req.userid, updated_by: req.userid};
				// ctlogger.log(newdata, 'delete', 'score_card','','',req.headers.authorization);
				res(null, data); 
			}
		});
	},
	scoreCardCall: function(req, res) {
		scoreModel.scoreCardCall(req, function (err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	scoreCardDetail: function(req, res) {
		scoreModel.scoreCardDetail(req, function (err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	getAttachedCalls: function(req, res) {
		scoreModel.getAttachedCalls(req, function (err, data) {
			if (err) { 
				res(null, err); 
			} else { 
				// var newdata = {'org_unit_id':req.ouid, 'ct_user_id':req.userid, 'score_card_id':req.params.Id, 'log_data': data, created_by: req.userid, updated_by: req.userid};
				// ctlogger.log(newdata, 'delete', 'score_card','','',req.headers.authorization);
				res(null, data); 
			}
		});
	},
	getScoreCardCriterias: function(req,res) {
		scoreModel.getScorecardCriterias(req,function (err, data) {
			if (err) { res(err); }
			res(null, data);
		});
	},
	// Assign score card and agent to call.
    assignScorecardToCall: function(req, res) {
		scoreModel.assignScorecardToCall(req, function (err, data) {
			if (err) { 
				res(err); 
			} else { 
				res(null, data); 
			}
		});
	},
	addOrUpdateCallScore: function(req, res) {
		scoreModel.addOrUpdateCallScore(req, function (err, data) {
			if (err) { 
				res(err); 
			} else { 
				res(null, data); 
			}
		});
	}

};

module.exports = score;
