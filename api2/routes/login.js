"use strict";

var express = require('express'),
    login = require('../controllers/loginController'),
    router = express.Router();

//require('../lib/auth');
//console.log('login router');

/*router.post('/', function(req, res) {
	login.loginAction(req, function(err, data) {
		if (err) {
			res.send({
				result: 'error',
				status: 'error',
				message: 'Login failed.' + err
			});
		} else {
			res.json(data);
		}
	});
});
*/


router.post('/recover_noemail', function(req, res) {
        login.recoverAction_noemail(req.body, function(err, data) {
                res.send({
                        result: (err ? 'error' : 'success'),
                        err: err,
                        json: data
                });
        });
});


router.post('/recover', function(req, res) {
	login.recoverAction(req.body, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.post('/welcome', function(req, res) {
	login.welcomeAction(req.body, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.post('/reset', function(req, res) {
	login.resetAction(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.get('/resetCheck/:token', function(req, res) {
	login.resetCheckAction(req.params.token, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.post('/logout', function(req, res) {
	login.logoutAction(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});


module.exports = router;
