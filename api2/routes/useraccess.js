var express = require('express'),
    router = express.Router(),
    userAccessCntl = require('../controllers/userAccessController');


router.get('/style', function(req, res) {
	if (req.user[0].ou_id !== undefined) {
		console.log('retrieving style from method');
		var access = require('../controllers/userAccessController');
		access.stylingAction(req.user[0].ou_id, function (err, data2) {
			res.send({
				result:(err ? 'error' : 'success'),
				err   :err,
				json  :data2
			});
		});
	} else {
		res.send({
			result:'error',
			err   :'No active session defined with OU ID',
			json  :''
		});
	}
});

router.get('/styleou/:ouid', function(req, res) {
	var access = require('../controllers/userAccessController');
	access.stylingAction(req.params.ouid, function (err, data2) {
		res.send({
			result:(err ? 'error' : 'success'),
			err   :err,
			json  :data2
		});
	});
});

router.get('/:id', function(req,res){
	userAccessCntl.getAction(req.params.id, function(err, data){
	    res.send({
		    result: (err ? 'error' : 'success'),
		    err: err,
		    json: data
	    });
    });
});


module.exports = router;