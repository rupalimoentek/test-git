var controller = require('./appController'),
    f = require('../functions/functions'),
    callActionModel = require('../models/callActionModel'),
    ctlogger = require('../lib/ctlogger.js');

var callAction = {
	bulkInsert: function(req, res) {
		callActionModel.bulkInsert(req.body, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
			var newdata = { 'org_unit_id': req.ouid, 'ct_user_id': req.userid, 'action_id': data.insertId, 'log_data': req.body };
			ctlogger.log(newdata, 'insert', 'call_action','','',req.headers.authorization);
		});
	},
	postAction: function(req, res) {
		callActionModel.create(req.body, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
			var newdata = { 'org_unit_id': req.ouid, 'ct_user_id': req.userid, 'action_id': data.insertId, 'log_data': req.body };
			ctlogger.log(newdata, 'insert', 'call_action','','',req.headers.authorization);
		});
	},
	changeTargetAction: function(req, res) {
		//For internal amp3
		async.eachSeries(req.body.callactions,function(callAction,callback){
			var d = {action_id: callAction.callActionId,action_target: callAction.newTarget};

			callActionModel.changeTarget(d, function(err, data) {
				callback(err);
			});
		},
		function(err){
			controller.responsify(err,null,function(response){
				res(response);
			})
		});//async eachSeries callback
	},
	putAction: function(req, res) {
		delete req.body.org_unit_id;
		delete req.body.ct_user_id;

		var up = req.body;
		var rules = req.body.rules;
		delete up.rules;

		// TODO: This should be refactored to something more efficient, as this adds a good load to the database each time
		// this updates the action record, then deletes all rules, and then adds new rules for the action
		async.series([
			function(cb) {
				callActionModel.update(req.body, function(err) {
					if (err) { return cb(err); }
					cb(null, 'updated');
				});
			},
			function(cb) {
				callActionModel.dropRules(req.body.action_id, function(err) {
					if (err) { return cb(err); }
					cb(null, 'deleted rules');
				});
			},
			function(cb) {
				callActionModel.createRules(rules, req.body.action_id, function(err) {
					if (err) { return cb(err); }
					cb(null, 'created rules');

					// var newdata = { 'org_unit_id':req.ouid, 'ct_user_id':req.userid, 'action_id':req.body.action_id, 'log_data':rules };
					// ctlogger.log(newdata, 'update', 'call_action', 'rules');
				});
			}
		],
		function(err, ret) {
			console.log('completed', err, ret);
			if (err) { return res('Failed to complete update ' + err); }
			res(null, req.body.action_id);

			var newdata = { 'org_unit_id':req.ouid, 'ct_user_id':req.userid, 'action_id':req.body.action_id, 'log_data':up };
			ctlogger.log(newdata, 'update', 'call_action','','',req.headers.authorization);
		});

	},
	getAction: function(req, actionid,  res) {
		callActionModel.read(actionid, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	deleteAction: function(req, actionid, res) {
		callActionModel.remove(actionid, function(err, data) {
			if (err) { return res(err); }
			res(null, data);

			var newdata = { 'org_unit_id':req.ouid, 'ct_user_id':req.userid, 'action_id':actionid, 'log_data':req.body };
			ctlogger.log(newdata, 'delete', 'call_action','','',req.headers.authorization);
		});
	},
	byRouteAction: function(req, routeid, res) {
		callActionModel.byNumber(routeid, function(err, data) {
			console.log('controller data');
			console.log(data);
			//console.log(err);
			res(err, data);
		});
	}

};

module.exports = callAction;