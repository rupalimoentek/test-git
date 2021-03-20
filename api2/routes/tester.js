var express = require('express'),
    router = express.Router();
// Add headers
router.use(function (req, res, next) {

    // Website you wish to allow to connect
    //res.setHeader('Access-Control-Allow-Origin', req.headers.origin);

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

router.get('/:date/:toEnd', function(req,res){
    var newDate = req.params.date;
    console.log('new date is ' + newDate);
    var end;
    if (req.params.toEnd == 't'){
        end = true;
    }else{
        end = false;
    }
    var fun = require('../functions/functions');
    res.send(fun.fullDate(newDate,end));
});

// router.get('/:firstname/:lastname', function(req,res){
// 	var users = require('../models/users');
// 	var user = users.getByFirstnameLastname(req.params.firstname, req.params.lastname, function(data){
// 		console.log('data is ' + data);
// 		res.send({
// 		    status: 'success',
// 		    message: 'This is the testerxcv endpoint.',
// 		    data: data
// 		});
// 	});
// });
module.exports = router;