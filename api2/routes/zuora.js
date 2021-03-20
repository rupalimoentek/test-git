var express = require('express'),
    zuora = require('../controllers/zuoraController'),
    router = express.Router();

// Add headers
router.use(function (req, res, next) {

	// Website you wish to allow to connect
	//res.setHeader('Access-Control-Allow-Origin', req.headers.origin);

	// Request methods you wish to allow
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

	// Request headers you wish to allow
	res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,content-type,Accept, Authorization');

	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	res.setHeader('Access-Control-Allow-Credentials', true);

	// Pass to next layer of middleware
	next();
});

router.get('/getBillingHistoryAction/:accountId', function(req,res){
	console.log('calling getBillingHistoryAction');
	zuora.getBillingHistoryAction(req.params.accountId, function(data){
		res.send({
	        result: 'success',
			err: '',
	        json: data
        });
	});
});

router.get('/getSubscriptionInformationAction/:accountId', function(req,res){
	console.log('calling getSubscriptionInformationAction');
	zuora.getSubscriptionInformationAction(req.params.accountId, function(data){
		res.send({
	        result: 'success',
			err: '',
	        json: data
        });
	});
});
router.get('/getInvoiceFileAction/:urlPath', function(req,res){
	console.log('calling getInvoiceFileAction');
	zuora.getInvoiceFileAction(req.params.urlPath, function(data){
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "X-Requested-With");
		res.header("Content-Disposition", "attachment; filename=invoice.pdf");
		res.header('content-type', 'application/pdf');
		res.send(data);
	});
});

module.exports = router;