/**
 * Created by davey on 5/15/15.
 */
"use strict";

var controller = require('./appController'),
	f = require('../functions/functions'),
	billingModel = require('../models/billingModel'),
	ctuserModel = require('../models/ctUserModel'),
	ctlogger = require('../lib/ctlogger.js'),
 	async = require('async'),
    ctTransactionModel = require('../models/ctTransactionModel'),
	orgUnit  = require('../controllers/orgUnitController'),
	zuora    = require('../controllers/zuoraController');

var logActivity = {

	countAction: function(ouid, res) {
		billingModel.count(ouid, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	usageCountAction: function(ouid, res) {
		billingModel.usageCount(ouid, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	resetAction: function(req, res) {
		billingModel.reset(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},

	resetAndSaveLog: function(req, res) {
		billingModel.resetAndSaveLog(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},

	
	usageAction: function(req, res) {
		billingModel.usage(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	overwriteAction: function(req, res) {
		billingModel.overwrite(req.body, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	invoicePosted: function(req, res) {
		billingModel.invoicePosted(req.body, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	getAction: function(ouid, res) {
		billingModel.getProfile(ouid, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	getBillingData: function(ouid, res) {
		billingModel.getProfile(ouid, function(err, data) {
			if (err) {
			 res(err);
			}else { 
				zuora.updateCutomer(data[0].billing_account_id,function(response){ // here we update cwmtocfamigration flag
			    	if(!response.success)
		        		callback('Error to update flag from zuora');
		        	else{
						res(null, data); 
					}
		        });
			}
		});
	},
	postAction: function(req, res) {

		if(req.body.billing !== undefined){
			req.body = req.body.billing;
		}

		billingModel.postProfile(req.body, function(err, data) {
			if (err) { return res(err); }
			res(null, data);

			var newdata = {'org_unit_id':req.body.org_unit_id, 'ct_user_id':req.userid, 'billing_id':req.body.billing_account_id, 'log_data':req.body };
			ctlogger.log(newdata, 'insert', 'billing', 'profile','',req.headers.authorization);
		});
	},

	deleteComponent: function(req, res) {
		billingModel.removeComponent(req.body, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	createComponent: function(req, res) {
		billingModel.addComponent(req.body, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},

	putAction: function(req, res) {

		if(req.body.billing !== undefined){
			req.body = req.body.billing;
		}

		billingModel.putProfile(req.body, function(err, data) {
			if (err) { return res(err); }
			res(null, data);

			var newdata = { 'org_unit_id':req.body.org_unit_id, 'ct_user_id':req.userid, 'billing_id':req.body.billing_account_id, 'log_data':req.body };
			ctlogger.log(newdata, 'update', 'billing', 'profile','',req.headers.authorization);
		});
	},
	dropAction: function(req, ouid, res) {
		billingModel.dropProfile(ouid, function(err, data) {
			if (err) { return res(err); }
			res(null, data);

			var newdata = {'org_unit_id':ouid, 'ct_user_id':req.userid, 'log_data':req.body };
			ctlogger.log(newdata, 'delete', 'billing', 'profile','',req.headers.authorization);
		});
	},
	getBillingNodeAction: function(ouid, res) {
		billingModel.getBillingNode(ouid, function(err, data) {
			if (err) { res(err); } else { res(null, {'billing_ou_id':data}); }
		});
	},
	addSubscriptionAction: function(req, res) {
		billingModel.addSubscription(req, req.body, function(err) {
			if (err) { return res(err); }
			res(null, {'message':'Successfully added subscription'});

			var newdata = { 'org_unit_id':req.body.org_unit_id, 'ct_user_id':req.ct_user_id, 'billing_id':req.body.subscription_id, 'log_data':req.body };
			ctlogger.log(newdata, 'insert', 'billing', 'subscription','',req.headers.authorization);
		});
	},
	dropSubscriptionAction: function(req, res) {
		console.log('dropSubscriptionAction');
		billingModel.dropSubscription(req, req.body, function(err) {
			if (err) { return res('Failed to drop subscription. ' + err); }
			res(null, {'message':'Successfully removed subscription'});

			var newdata = { 'org_unit_id':req.body.org_unit_id, 'ct_user_id':req.ct_user_id, 'log_data':req.body };
			ctlogger.log(newdata, 'insert', 'billing', 'subscription','',req.headers.authorization);
		});
	},
	getAccountAction: function(ouid, res) {
		billingModel.getAccount(ouid, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	billListAction: function(req, res) {
		var checkDate = (req.query.checkdate ? decodeURI(req.query.checkdate) : null);
		billingModel.billList(checkDate, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	getOuByZuoraAccountId: function(id, res) {
		var id = (id ? decodeURI(id) : null);
		billingModel.getOuByZuoraAccountId(id, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	updateSubscriptionExtBillingId: function(req, body, res) {
		billingModel.updateSubscriptionExtBillingId(req, body, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	summaryAction: function(ouid, res) {
		billingModel.summary(ouid, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},

	migrationAccount: function(ouid, res) {
		billingModel.migrationAccount(ouid, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},

	postMigrateBillingAccount: function(req, res) {
		req.body.orgUnit = req.body.json[0];
	    req.body.orgUnit.org_unit_ext_id=null;
	    req.body.orgUnit.org_unit_parent_id=null;
	    req.body.orgUnit.ext_billing_id = '';
	    req.body.orgUnit.org_unit_id  = '';
   	    req.body.orgUnit.billing_code  = '';
   	    req.body.user = {};
   	    req.body.user.user_id = '';
   	    var orgUnitData = {};
   	    var ctTrans = new ctTransactionModel.begin(function (error) {
			if (error) {
				return res(error);
			}
		    async.waterfall([
			    function (callback) {
			        orgUnit.postAction(req, function(orgUnitData){
			        	if(orgUnitData.err){
			        		callback(orgUnitData.err);
			        	}
			        	else{
				        	req.body.orgUnit.org_unit_id =  parseInt(orgUnitData.json.insertId);
				        	callback(null);
			        	}
			        },ctTrans);
			    },
			    function (callback) {
				    zuora.getSubscriptionByAccount(req.body.orgUnit.account_id,function(zuoraSubscriptionDetail){ // getting zuora account details
				    	if(!zuoraSubscriptionDetail.success)
			        		callback('Error to get subscriptions details from zuora');
			        	else{
							req.body.orgUnit.ext_billing_id = zuoraSubscriptionDetail.subscriptions[0].id;
							req.body.orgUnit.billing_code = zuoraSubscriptionDetail.subscriptions[0].subscriptionNumber;
							callback(null);	
						}
			         });
			    },
			    function (callback) {
				    billingModel.addSubscription(req, req.body.orgUnit, function(err, account){
				    	if(err){
				    		callback(err);
				    	}
				    	else{
				    		callback(null);
				    	}
			        },ctTrans);
			    },
			    function (callback) {
				    zuora.getCutomer(req.body.orgUnit.account_id,function(zuoraAccountDetail){ // getting zuora account details
				    	if(!zuoraAccountDetail.success)
			        		callback('Error to get account details from zuora');
			        	else{
			        		 var dataAppend_value = (req.body.orgUnit.data_append_enabled ? 't' : 'f');
				    		 orgUnitData ={
										 'org_unit_id': req.body.orgUnit.org_unit_id,
										 'activation_date': req.body.orgUnit.activation_date,
			  							 'cycle_start': req.body.orgUnit.cycle_start,
										 'cycle_end': req.body.orgUnit.cycle_end,
										 'billing_account_id':zuoraAccountDetail.basicInfo.id,
										 'billing_code':req.body.orgUnit.billing_code,
										 'account_code':zuoraAccountDetail.basicInfo.accountNumber,
										 'data_append' :dataAppend_value
					
							};
					        callback(null,orgUnitData);
					    }
		           });
			    },
			    function (orgUnitData,callback) {
				    billingModel.postProfile(orgUnitData, function(err, response){ // inserting  billing detail
				    	if(err){
				    		callback(err);
				    	}else{
				        	callback(null,orgUnitData);
				    	}

				    },ctTrans);
			    }
			], function (err, result) {
				//err = "this is a test"
				if (err) {
					ctTrans.rollback(function () {
						return res(err);
					});
				} else {
					ctTrans.commit(function () {
						return res(null,result);
					});
					// console.log("\n\n **************************************************** \nDISABLED COMMIT\n **************************************\n\n")
					// ctTrans.rollback(function () {
					// 	return res(null,result);
					// });
				}
			});
		});
	}
};

module.exports = logActivity;
