/**
 * Created by davey on 5/15/15.
 */
"use strict";

var express = require('express'),
	billing = require('../controllers/billingController'),
	router = express.Router();

// to add a subscription to an org unit - expects in body: org_unit_id, subscription_external_id, ext_billing_id
router.post('/subscription', function(req, res) {
	billing.addSubscriptionAction(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

// to remove a subscription for an org unit - expects in body: org_unit_id, ext_billing_id
router.delete('/subscription', function(req, res) {
	console.log('drop subscription router');
	billing.dropSubscriptionAction(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

// this will return all account information for active subscription and components
router.get('/account/:ouid', function(req, res) {
	billing.getAccountAction(req.params.ouid, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

// this will return a list of billing OU's that need to be billed on supplied date (or today if omitted)
router.get('/billList', function(req, res) {
	billing.billListAction(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

/* This returns the count totals for all subscribed to components for the given OU
	NOTE: if the OU is a billing node, then it will return the count totals for the sum of all children and itself */
router.get('/count/:ouid', function(req, res) {
	billing.countAction(req.params.ouid, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

/* This returns the usage count totals for all subscribed to components for the given OU
	NOTE: if the OU is a billing node, then it will return the count totals for the sum of all children and itself */
router.get('/usagecount/:ouid', function(req, res) {
	billing.usageCountAction(req.params.ouid, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});


/*  This will reset the counters to zero and then get the current count for the timestamp provided (and NOW() on some) and returns the starting count totals for each component
	 NOTE: it will count the current active/inactive campaigns, phone numbers, and users to set starting totals
	 Also this will only reset the supplied OU count totals, unless it's a billing node, in which case all children are processed as well */
router.put('/reset', function(req, res) {
	billing.resetAction(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});


router.put('/resetlog', function(req, res) {
	billing.resetAndSaveLog(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

/* Wrapper function that will do 'count' and 'reset' in a single call.  Return value will include count totals and reset totals for each component
	NOTE: if the OU is a billing node, the return result set will be an array of object - one for each child OU */
router.get('/usage/:ouid', function(req, res) {
	billing.usageAction(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

/* This allows values to be restored or overwritten with a supplied total.  It will take into account the count it currently has and add that to the value supplied
	for some components.  Users, campaigns, and phone numbers are excluded - since current count must reflect current state.  */
router.put('/overwrite', function(req, res) {
	billing.overwriteAction(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.get('/:ouid', function(req, res) {
	billing.getAction(req.params.ouid, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.post('/', function(req, res) {
	billing.postAction(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.post('/component', function(req, res) {
	billing.createComponent(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.post('/invoice', function(req, res) {
	billing.invoicePosted(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.delete('/component', function(req, res) {
	billing.deleteComponent(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.delete('/:ouid', function(req, res) {
	console.log('delete billing');
	billing.dropAction(req, req.params.ouid, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.put('/', function(req, res) {
	billing.putAction(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

// will traverse up the tree from the supplied OU until a billing node is found
router.get('/billingNode/:ouid', function(req, res) {
	billing.getBillingNodeAction(req.params.ouid, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

// to get OU by Zuora account id
router.get('/getOuByZuoraAccountId/:id', function(req, res) {
	billing.getOuByZuoraAccountId(req.params.id, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

// to update ext_billing_id in subscription
router.put('/updateSubscriptionExtBillingId', function(req, res) {
	billing.updateSubscriptionExtBillingId(req, req.body, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

// will traverse up the tree from the supplied OU until a billing node is found
router.get('/summary/:ouid', function(req, res) {
	billing.summaryAction(req.params.ouid, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});


router.get('/migrationAccount/:id', function(req, res) {
	billing.migrationAccount(req.params.id, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

module.exports = router;