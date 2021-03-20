var controller = require('./appController'),
	reportModel = require('../models/reportModel'),
	callModel = require('../models/callModel');
	groupActivityModel = require('../models/groupActivityModel');

var report = {	
	getReport: function(req, res){
		var params = req.query;
		//if (params.timezone === 'undefined') { params.timezone = 'America/New_York'; }
		console.log(params);
		if (params.report == 'acq_callflow') {
			reportModel.acqCallFlowReport(req, function(err, data) {
				if (err) { return res(err); }
				res(null, data);
			});
		} else if (params.report == 'acq_campaign') {
			reportModel.acqCampaignReport(req, function(err, data) {
				if (err) { return res(err); }
				res(null, data);
			});
		} else if (params.report == 'acq_group') {
			reportModel.acqGroupReport(req, function(err, data) {
				if (err) { return res(err); }
				res(null, data);
			});
		} else if (params.report == 'home') {
			reportModel.homeReport(req, function(err, data) {
				if (err) { return res(err); }
				res(null, data);
			});
		} else if (params.report == 'acq_keyword') {
			reportModel.acqKeywordReport(req, function(err, data) {
				if (err) { return res(err); }
				res(null, data);
			});
		} else if (params.report == 'acq_source') {
			reportModel.acqSourceReport(req, function(err, data) {
				if (err) { return res(err); }
				res(null, data);
			});
		}
	},
	buildCallFlowReport: function(req, res){
		reportModel.buildCallFlowReport(req, function(data){
			res('done building report');
		});
	},
	getCallDetails: function(req, res) {
		reportModel.callDetails(req, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	/*getCallSummary: function(req, res) {
		var params = req.query;
		callModel.callSummary(params, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},*/
	getCampaignSettings: function(req, res) {
		var params = req.params.filter;
		var userData = req.user;
		reportModel.campaignSettings(params, userData, function(err, data) {
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	getCallFlowSettings: function(req, res) {
		reportModel.callFlowSettings(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	getIvrSettings: function(req, res) {
		reportModel.ivrSettings(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	getPercentSettings: function(req, res) {
		reportModel.percentSettings(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	/*getGroupActivitySummary: function(req, res) {
		if(req.query.timezone === 'undefined')
			req.query.timezone = 'America/New_York';
		groupActivityModel.groupActivitySummary(req.query, req.user.ou_id, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},*/
	getGroupActivities: function(req, res) {
		reportModel.getGroupActivities(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	getOuList: function(req, res) {
		reportModel.ouList(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	getCampaignList: function(req, res) {
		reportModel.campaignList(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	getChannelList: function(req, res) {
		reportModel.channelList(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	getReportByOuidAction(req,callback){
		//// FOR AMP3 DO NOT CHANGE ////
		reportModel.getReportByOuid(req,function(err,data){
			controller.responsify(err, data, function(response){
				callback(response);
			});
		});
	},
	// =================== SCHEDULE REPORTS ===========================================

	postFilterAction: function(req, res) {
		reportModel.setFilter(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	postFilterRuleAction: function(req, res) {
		reportModel.setFilterRule(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	postReport: function(req, res) {
		reportModel.setReport(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	postSchedule: function(req, res) {
		reportModel.setSchedule(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	/*getSchedule: function(req, res) {
		reportModel.readSchedule(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	*/
	getScheduleList: function(req, res) {
		reportModel.readScheduleList(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	getScheduleReport: function(req, res) {
		reportModel.getReport(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	getReportReport: function(req, res) {
		reportModel.getReportReport(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	/*getFilterAction: function(req, res) {
		reportModel.getFilter(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	getFilterRules: function(req, res) {
		reportModel.getFilterRules(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	*/
	getFilter: function(req, res) {
		reportModel.getFilter(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	/*
	getReportSchedules: function(req, res) {
		reportModel.getReportSchedules(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	getReportById: function(req, res) {
		reportModel.getReportById(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	*/
	deleteSchedule: function(req, res) {
		reportModel.deleteSchedule(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	deleteReport: function(req, res) {
		reportModel.deleteReport(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	postCookie: function(req, res) {
		console.log('cookie controller');
		reportModel.setCookie(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	postHistory: function(req, res) {
		reportModel.setHistory(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	sendScheduleReport: function(req, res) {
		reportModel.sendScheduleReport(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	authorizeReport: function(req, res) {
		reportModel.authorizeReport(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	}
};

module.exports = report;