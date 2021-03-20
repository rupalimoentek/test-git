var controller = require('../controllers/zuoraController'),
	subscribtionDetails = require('../config/zuora_signup_details.json'),
	CryptoJS = require("crypto-js"),
	fs     = require('fs'),
	conf   = yaml.load(fs.readFileSync('config/config.yml')),
	connector = require('../models/appModel'),
	envVar = process.env.NODE_ENV,
	_ = require("underscore");

var signup = {

	postAction: function (req,res) {
		  var action = "accounts", method = "POST";
			var free_trial = req.body.subscriptionData.free_trial;
			var subscription_id = req.body.subscriptionData.subscription_id;
			var data = req.body.userData;
			data.creditCard.cardNumber      				= signup.getDecryptData(data.creditCard.cardNumber).toString(CryptoJS.enc.Utf8),
			data.creditCard.expirationMonth 			 	= signup.getDecryptData(data.creditCard.expirationMonth).toString(CryptoJS.enc.Utf8),
			data.creditCard.expirationYear  			 	= signup.getDecryptData(data.creditCard.expirationYear).toString(CryptoJS.enc.Utf8),
			data.creditCard.securityCode  			 	        = signup.getDecryptData(data.creditCard.securityCode).toString(CryptoJS.enc.Utf8),
			data.creditCard.cardHolderInfo.cardHolderName   = signup.getDecryptData(data.creditCard.cardHolderInfo.cardHolderName).toString(CryptoJS.enc.Utf8);
			controller.post(action, data, method, function(result){
			if(result.success === false){
 	  		   return res(result.reasons[0]["message"]);
			}
 	  		else {
			    signup.subscription(result, free_trial, subscription_id, function(response){
		  		  return res(response);
		  	  })
			 }
	 	});
    	return res;
	},

	subscription: function (data, free_trial, subscription_id, res) {
		var action = "subscriptions", method = "POST";
		var activationDate = new Date();
	 	var numberOfDaysToAdd = 1;
	 	var contractEffectiveDate = new Date();
		var productRatePlanId;
		
		activationDate.setDate(activationDate.getDate() + numberOfDaysToAdd);
		
		if(free_trial === true){
			activationDate.setMonth(activationDate.getMonth() + 1);
			contractEffectiveDate.setMonth(contractEffectiveDate.getMonth() + 1);
		}
		
		subscribtionData = _.where(subscribtionDetails[envVar].subscriptions, {subscriptionId: subscription_id});
		if(subscribtionData.length < 1){
			return res("Oops! It looks like we encountered an error. Please contact our team at support@convirza.com for assistance.");
		}
		var subscribeData = {
			 "accountKey": data.accountNumber,
			 "termType": subscribtionDetails[envVar].termType,
			 "serviceActivationDate" : activationDate,
			 "subscribeToRatePlans": [{
					 "productRatePlanId": subscribtionData[0].productRatePlanId, // productRatePlanId for 4201011 Standard
					 "chargeOverrides": [{
							 "productRatePlanChargeId": subscribtionData[0].productRatePlanChargeId // Working ID productRatePlanChargeId for 4201011 Platform Fee
					 }]
				 }],
			 "contractEffectiveDate": contractEffectiveDate,
			 "collect": subscribtionDetails[envVar].collect,
		 }
		 controller.post(action, subscribeData, method, function(response){
			 if(response.success === false)
				return res(response.reasons[0]["message"]);
		 	 else
					 return res(response);
	 	});
	},

	getDecryptData: function (data) {
		return CryptoJS.AES.decrypt(data.toString(), conf[envVar].encryptionKey);
	},

	npanxxNpa: function(npa, res){
		var qry = "SELECT COUNT(*) FROM ce_geo_lookup WHERE npa = '" + npa + "'";
		connector.ctPool.query(qry, function(err, data){
			res(data);
		});
	}
};

module.exports = signup;
