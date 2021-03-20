var controller = require('./appController'), f = require('../functions/functions'), https = require('https'),
/* parseString = require('xml2js').parseString, */
async = require('async'), fs = require("fs"), yaml = require("js-yaml");

var zuora = {
	customer: {},
	subscription: {},
	catalogue: {},
	ratePlan: {},
	ratePlanCharges: {},
	invoices: {},
	payments: {},
	summary: {},
	jsonResponse: {},
	post: function(action, data, method, resCallBack) {
		conf = yaml.load(fs.readFileSync('config/config.yml'));
		envVar = process.env.NODE_ENV;
		
		var body = JSON.stringify(data);
	
		var options = {
			hostname: conf[envVar].ZUORA_HOST,
			/* port: 80, */
			method: method,
			path: '/rest/v1/' + action,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
				'Zuora-version':196,
				/* "Content-Length": Buffer.byteLength(body), */
				'apiAccessKeyId': conf[envVar].ZUORA_KEY,
				'apiSecretAccessKey': conf[envVar].ZUORA_SECRET_KEY
			}
		};


		var req = https.request(options, function(res) {
			var data = '';

			res.on('data', function(chunk) {
				// console.log(chunk);
				data += chunk;
			});

			res.on('end', function() {
				this.jsonResponse = JSON.parse(data);
				resCallBack(this.jsonResponse);
			});
		});

		req.on('error', function(e) {
			console.log('Got error making request: ' + e.message);
		});

		if (body.length > 0) req.write(body);
		req.end();
	},
	apiRest: function(action, data, method, resCallBack) {
		conf = yaml.load(fs.readFileSync('config/config.yml'));
		envVar = process.env.NODE_ENV;

		var body = JSON.stringify(data);

		var options = {
			hostname: conf[envVar].ZUORA_REST_HOST,
			/* port: 80, */
			method: method,
			path: '/v1/' + action,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
				'Zuora-version':196,
				/* "Content-Length": Buffer.byteLength(body), */
				'apiAccessKeyId': conf[envVar].ZUORA_KEY,
				'apiSecretAccessKey': conf[envVar].ZUORA_SECRET_KEY
			}
		};

		var req = https.request(options, function(res) {
			var data = '';

			res.on('data', function(chunk) {
				// console.log(chunk);
				data += chunk;
			});

			res.on('end', function() {
				console.log(data);
				this.jsonResponse = JSON.parse(data);
				resCallBack(this.jsonResponse);
			});
		});

		req.on('error', function(e) {
			console.log('Got error making request: ' + e.message);
		});

		if (body.length > 0) req.write(body);
		req.end();
	},

	getCutomer: function(id, callBack) {
		action = 'accounts/' + id;
		data = {};
		method = 'GET';
		this.post(action, data, method, function(res) {
			if (res.success) {
				this.customer = res;
				callBack(res);
			} else {
				console.log(JSON.stringify(res));
			}
		});
	},
	getSubscription: function(id, callBack) {
		action = 'subscriptions/' + id;
		data = {};
		method = 'GET';
		this.post(action, data, method, function(res) {
			if (res.success) {
				this.subscription = res;
				callBack(res);
			} else {
				console.log(JSON.stringify(res));
			}
		});
	},
	getSubscriptionByAccount: function(id, callBack) {
		action = 'subscriptions/accounts/' + id;
		data = {};
		method = 'GET';
		this.post(action, data, method, function(res) {
			if (res.success) {
				this.subscription = res;
				callBack(res);
			} else {
				callBack("Error: Issue with get subscription by accountId");
			}
		});
	},
	getCatalogue: function(callBack) {
		action = 'catalog/products/';
		data = {};
		method = 'GET';
		this.post(action, data, method, function(res) {
			if (res.success) {
				this.catalogue = res;
				callBack(res);
			} else {
				console.log(JSON.stringify(res));
			}
		});
	},
	getInvoices: function(id, callBack) {
		action = 'transactions/invoices/accounts/' + id;
		data = {};
		method = 'GET';
		this.post(action, data, method, function(res) {
			if (res.success) {
				this.invoices = res;
				callBack(res);
			} else {
				console.log(JSON.stringify(res));
			}
		});
	},
	getPayments: function(id) {
		action = 'transactions/payments/accounts/' + id;
		data = {};
		method = 'GET';
		this.post(action, data, method, function(res) {
			if (res.success) {
				this.payments = res;
			} else {
				console.log(JSON.stringify(tres));
			}
		});
	},
	getAccountSummary: function(id, callBack) {
		action = 'accounts/' + id + '/summary';
		data = {};
		method = 'GET';
		this.post(action, data, method, function(res) {
			if (res.success) {
				this.summary = res;
				callBack(res);
			} else {
				console.log(JSON.stringify(res));
			}
		});
	},
	getInvoiceFileAction: function(urlPath, response) {
		conf = yaml.load(fs.readFileSync('config/config.yml'));
		envVar = process.env.NODE_ENV;

		var urlFile = new Buffer(urlPath, 'base64').toString('ascii');
		console.log(urlFile);
		var url = require('url');
		var urlInf = url.parse(urlFile);
		var options = {
			hostname: urlInf.host,
			//port: 80,
			method: 'GET',
			path: urlInf.pathname,
			headers: {
				'Content-Type': 'text/pdf',
				'Accept': 'text/pdf',
				'apiAccessKeyId': conf[envVar].ZUORA_KEY,
				'apiSecretAccessKey': conf[envVar].ZUORA_SECRET_KEY,
			}
		};

		var chunks = [];
		var req = https.request(options, function(res) {
			res.on('data', function(chunk) {
				chunks.push(chunk);
			});

			res.on('end', function() {
				var buffer = Buffer.concat(chunks);
				//console.log(data);
				response(buffer);

			});
		}).on('error', function(e) {
			console.log('Got error making request: ' + e.message);
		}).end();

	},
	/*getProductFromCatalogue: function(field, value) {
		for ( var key in this.catalogue.products) {
			var product = this.catalogue.products[key];
			for ( var subKey in product.productRatePlans) {
				prp = product.productRatePlans[subKey];
				if (prp[field] == value) {
					this.ratePlan = product;
					return this.ratePlan;
				}
			}
		}
	},
	getProductFromSubscription: function(field, value) {
		for ( var key in this.subscription.ratePlans) {
			var product = this.subscription.ratePlans[key];
			if (product[field] == value) {
				this.ratePlan = product;
				return this.ratePlan;
			}
		}
	},
	getAddonFromCatalogue: function(field, value) {
		for ( var key in this.catalogue.products) {
			var product = this.catalogue.products[key];
			for ( var subKey in product.productRatePlans) {
				var prp = product.productRatePlans[subKey];
				for ( var subSubKey in prp.ratePlanCharges) {
					var prpc = prp.ratePlanCharges[subSubKey];
					if (prpc[field] == value) {
						this.ratePlanCharge = prpc;
						return this.ratePlanCharge;
					}
				}
			}
		}
	},
	getAddonFromSubcription: function(rpField, rpValue, field, value) {
		for ( var key in this.subscription.ratePlans) {
			var product = this.subscription.ratePlans[key];
			if (product[rpField] == rpValue) {
				for ( var subKey in product.ratePlanCharges) {
					var rpc = product.ratePlanCharges[subKey]
					if (rpc[field] == value) {
						this.ratePlanCharges = rpc;
						return this.ratePlanCharges;
					}
				}
			}
		}
	},*/
	getBillingHistoryAction: function(accountId, res) {
		this.getInvoices(accountId, function(response) {
			if (f.empty(response)) res(response);

			var invoices = [];
			var monthNames = [
			"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
			];
			for ( var key in response) {
				for (var subKey in response[key]) {
					var invoice = response[key][subKey];
					var invoiceDate = new Date(invoice.invoiceDate);
					invoices.push({
						'number': invoice.invoiceNumber,
						'date': monthNames[invoiceDate.getMonth()] + ' ' + invoiceDate
						        .getDate() + ', ' + invoiceDate.getFullYear(),
						'amount': invoice.amount,
						'file': new Buffer(invoice.invoiceFiles[0].pdfFileUrl).toString('base64')
					});
				}
			}

			res(invoices);
		});
	},
	getSubscriptionInformationAction: function(accountId, res) {
		this.getAccountSummary(accountId, function(response) {
			console.log(JSON.stringify(response));

			var paidAmount = 0;
			if (f.empty(response)) res(response);

			for ( var key in response.payments[0].paidInvoices) {
				var item = response.payments[0].paidInvoices[key];
				paidAmount += item.appliedPaymentAmount;
			}

			var nextBillingDate = new Date();
			nextBillingDate.setDate(response.basicInfo.billCycleDay);

			var currentTime = new Date();
			if (nextBillingDate < currentTime) {
				nextBillingDate.setMonth(currentTime.getMonth() + 1);
			}

			var activationDate = new Date(response.subscriptions[0].subscriptionStartDate);
			var lastInvoiceDate = new Date(response.invoices[0].invoiceDate);
			var lastPaymentDate = new Date(response.payments[0].effectiveDate);

			var monthNames = [
				"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
			];

			var subsInformation = {
			'accountNumber': response.basicInfo.accountNumber,
			'accountName': response.basicInfo.name,
			'subscriptionNumber': response.subscriptions[0].subscriptionNumber,
			'subscriptionName': response.subscriptions[0].ratePlans[0].ratePlanName,
			'activationDate': monthNames[activationDate.getMonth()] + ' ' + activationDate
			        .getDate() + ', ' + activationDate.getFullYear(),
			'lastInvoiceDate': monthNames[lastInvoiceDate.getMonth()] + ' ' + lastInvoiceDate
			        .getDate() + ', ' + lastInvoiceDate.getFullYear(),
			'lastPaymentDate': monthNames[lastPaymentDate.getMonth()] + ' ' + lastPaymentDate
			        .getDate() + ', ' + lastPaymentDate.getFullYear(),
			'lastPaymentAmount': paidAmount,
			'nextBillingDate': monthNames[nextBillingDate.getMonth()] + ' ' + nextBillingDate
			        .getDate() + ', ' + nextBillingDate.getFullYear()
			};

			res(subsInformation);
		});
	},
	createAmendment: function(data,callBack) {
		action = 'object/amendment/';
		method = 'POST';
		this.apiRest(action, data, method, function(res) {
			if (res.Success) {
				this.amendment = res;
				callBack(res);
			} else {
				callBack("Error: Issue with create amendment");
			}
		});
	},
	createRatePlan: function(data,callBack) {
		action = 'object/rate-plan/';
		method = 'POST';
		this.apiRest(action, data, method, function(res) {
			if (res.Success) {
				this.ratePlan = res;
				callBack(res);
			} else {
				callBack("Error: Issue with create Rate Plan");
			}
		});
	},
	updateAmendment: function(data,callBack) {
		action = 'object/amendment/'+data.Id;
		method = 'PUT';

		this.apiRest(action, data, method, function(res) {
			if (res.Success) {
				this.updateAmendment = res;
				callBack(res);
			} else {
				callBack("Error: Issue with update amendment");
			}
		});
	},
	updateCutomer: function(id, callBack) {
		action = 'accounts/' + id;
		data = {
			'cqm_to_cfa_migrated__c':"true" 
		};
		method = 'PUT';
		this.post(action, data, method, function(res) {
			if (res.success) {
				this.customer = res;
				callBack(res);
			} else {
				console.log(JSON.stringify(res));
			}
		});
	}
};

module.exports = zuora;
