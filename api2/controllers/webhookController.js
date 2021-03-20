/**
 * Created by davey on 3/31/15.
 */
var controller = require('./appController'),
	f = require('../functions/functions'),
	fs = require("fs"),
	webhookModel = require('../models/webhookModel'),
	ctlogger = require('../lib/ctlogger.js');

var webhook = {
	// adds a new webhook record
	postAction: function(req, res) {
		webhookModel.create(req.body, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
			var newdata = { 'org_unit_id':req.ouid, 'ct_user_id':req.userid, 'webhook_id':data.insertId, 'log_data':req.body };
			ctlogger.log(newdata, 'insert', 'webhook','','',req.headers.authorization);
		});
	},
	// updates a webhook record
	putAction: function(req, res) {
		webhookModel.update(req.body, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
			var newdata = { 'org_unit_id':req.ouid, 'ct_user_id':req.userid, 'webhook_id':req.body.webhook_id, 'log_data':req.body };
			ctlogger.log(newdata, 'update', 'webhook','','',req.headers.authorization);
		});
	},
	// tests a webhook
	postActionTest: function(req, res) {
		console.log("inside put action test");
		webhookModel.test(req.body, function(err, data) {
			console.log('data from model was :' + data);
			if (err) { res(err); } else { res(null, data); }

		});
	},
	// deletes a webhook record and all associated mappings
	deleteAction: function(req, webhookid, res) {
		webhookModel.drop(webhookid, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
			var newdata = { 'org_unit_id':req.ouid, 'ct_user_id':req.userid, 'webhook_id':webhookid, 'log_data':req.body };
			ctlogger.log(newdata, 'delete', 'webhook','','',req.headers.authorization);
		});
	},
	getAction: function(req, res) {
		webhookModel.lookup(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	getTargetByIdAction: function(req, res) {
		webhookModel.getTargetById(req.params.webhookid, function(err, data) {
			controller.responsify(err,data,function(response){
				res(response);
			});
		});
	},
	// adds a new mapping record to a webhook
	mapPostAction: function(req, res) {
		webhookModel.mapCreate(req.body, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
			console.log(data);
			var newdata = { 'org_unit_id':req.ouid, 'ct_user_id':req.userid, 'webhook_id':data.insertIid, 'log_data':req.body };
			ctlogger.log(newdata, 'insert', 'webhook', 'static field','',req.headers.authorization);
		});
	},
	// updates a mapping record to a webhook
	mapPutAction: function(req, res) {
		webhookModel.mapUpdate(req.body, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
			var newdata = { 'org_unit_id':req.ouid, 'ct_user_id':req.userid, 'webhook_id':req.body.webhook_id, 'log_data':req.body };
			ctlogger.log(newdata, 'update', 'webhook', 'static field','',req.headers.authorization);
		});
	},
	// deletes a mapping record to a webhook
	mapDeleteAction: function(req, mapid, res) {
		webhookModel.mapDrop(mapid, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
			var newdata = { 'org_unit_id':req.ouid, 'ct_user_id':req.userid, 'webhook_id':data.webhook_id, 'log_data':{'webhook_map_id':mapid} };
			ctlogger.log(newdata, 'delete', 'webhook', 'static field','',req.headers.authorization);
		});
	},
	// retrieves a list of active webhooks for the given org_unit_id
	listAction: function(ouid, res) {
		webhookModel.list(ouid, function(err, data) {
			if (err) { res(err); } else {res(null, data); }
		});
	},
	// retrieves a list of active webhooks for the given org_unit_id
	getWebhookList: function(ouid, res) {
		webhookModel.getWebhookList(ouid, function(err, data) {
			if (err) { res(err); } else {res(null, data); }
		});
	},
	getWebhooksByOuid: function(ouid, res) {
		//For internal AMP3
		webhookModel.getWebhookList(ouid, function(err, data) {
			controller.responsify(err,data,function(response){
				res(response);
			});
		});
	},
	getRouteAction: function(webhookid, res) {
		webhookModel.webhookRoute(webhookid, function(err, data) {
			if (err) { res(err); } else {res(null, data); }
		});
	}

	/* These function are not being used with the current use of webhooks


	// adds the fields for a group (payload) to a webhook record
	payloadPutAction: function(req, webhookid, triggerid, group, res) {
		console.log('starting payload POST action');
		console.log('webhook ID:' + webhookid + ' trigger ID:' + triggerid + ' group:' + group);
		webhookModel.payloadAdd(webhookid, triggerid, group, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
			req.body.trigger_id = triggerid;
			req.body.payload = group;
			var newdata = { 'webhook_id':webhookid, 'log_data':req.body };
			ctlogger.log(newdata, 'insert', 'webhook', 'payload');
		})
	},
	// gets a list of groups (payload) and all the fields contained within each
	payloadGetAction: function(triggerid, res) {
		console.log('starting payload GET action');
		webhookModel.payloadList(triggerid, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	// returns a list of active triggers and all payloads available for each
	triggerAction: function(req, res) {
		webhookModel.triggerList(function(err, data) {
			if (err) { res(err); } else {res(null, data); }
		});
	},
	// returns a list of all fields available for given trigger
	fieldListAction: function(triggerid, res) {
		console.log('controller');
		webhookModel.fieldList(triggerid, function(err, data) {
			if (err) { res(err); } else {res(null, data); }
		});
	}
	*/
};

module.exports = webhook;
