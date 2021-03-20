var _ = require('underscore'),
fs = require("fs"), 
yaml = require("js-yaml")
conf = yaml.load(fs.readFileSync('config/config.yml')),
envVar = process.env.NODE_ENV,
_ = require("underscore"),
dripClient = require('drip-nodejs')({ token: conf[envVar].DRIP_TOKEN, accountId: conf[envVar].DRIP_ACCOUNT_ID });

var drip = {
	checkIfAccountExists : function(callback){
		var accountExists = false;
		dripClient.listAccounts()
		  .then((response) => {
		  	if(response.body.accounts.length > 0){
		  		_.map(response.body.accounts, function(account) {
		  			if(account.id == conf[envVar].DRIP_ACCOUNT_ID)
		  				accountExists = true;
		  		});
		  	}
		  	callback(null, accountExists);
		})
		  .catch((error) => {
		  	callback(error);
		});
	},

	fetchSubscriber : function(idOrEmail, callback) {
		var subscriberExists = false;
		var subscriberId = '';
		dripClient.fetchSubscriber(idOrEmail)
		  .then((response) => {
		    if(response.body.subscribers.length > 0){
		    	_.map(response.body.subscribers, function(subscriber) {
		  			if(subscriber.email === idOrEmail){
		  				subscriberExists = true;
		  				subscriberId 	 = subscriber.id;
		  			}
		  		});
		    }

		    callback(null, subscriberExists, subscriberId);
		})
		  .catch((error) => {
		  	//callback(error);
		  	callback(null, subscriberExists, subscriberId);
		});
	},

	createOrUpdateSubscriber : function(payload, callback) {
		dripClient.createUpdateSubscriber(payload)
		  .then((response) => {
		  	if(response.body.subscribers.length > 0){
		  		callback(null, response.body.subscribers);
		  	} else {
		  		callback("Subscriber is not created/updated properly.")
		  	}
		})
		  .catch((error) => {
		  	callback(error);
		});
	}
}	

module.exports = drip;


