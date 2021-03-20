/**
 * Created by davey on 3/31/15.
 */
var express = require('express'),
looker = require('../controllers/lookerAPIController'),
blacklist = require('../controllers/blacklistController'),
call = require('../controllers/callController'),
lookerAuth          = require('../lib/lookerAuth'),
appModel = require('../models/appModel'),
orgUnitModel = require('../models/orgUnitModel'),
async = require('async'),
fs = require("fs"),
router = express.Router(),
yaml = require("js-yaml"),
s3yml = yaml.load(fs.readFileSync("config/s3.yml")),
envVar = process.env.NODE_ENV,
AWS = require('aws-sdk');


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

// ############Tag#############
router.post('/tag', function(req, res) {
	lookerAuth.getAccessLooker(req,function(err,request){
		if(err){ return res.send({result: (err ? 'error' : 'success'),err: err});}
			get_call_info(parseInt(req.body.data.value),function(err,d){
				if(err){ return res.send({result: (err ? 'error' : 'success'),err: err});}
				req.body['org_unit_id']=d[0].org_unit_id;
				looker.postTagAction(req, function(err, data) {
					res.send({
						result: (err ? 'error' : 'success'),
						err: err,
						json: data
					});
				});
			})
		});
});

router.post('/edittag', function(req, res) {
	lookerAuth.getAccessLooker(req,function(err,request){
		if(err){ return res.send({result: (err ? 'error' : 'success'),err: err});}
			looker.putTagAction(req, function(err, data) {
				res.send({
					result: (err ? 'error' : 'success'),
					err: err,
					json: data
				});
			});
	});
});
router.post('/deletetag', function(req,res){
	lookerAuth.getAccessLooker(req,function(err,request){
		if(err){ return res.send({result: (err ? 'error' : 'success'),err: err});}
		looker.deleteTagAction(req, function(err,data){
			res.send({
				result: (err ? 'error' : 'success'),
				err: err,
				json: data
			});
		});
	});
});

router.post('/comment', function(req, res) {
	lookerAuth.getAccessLooker(req,function(err,request){
		if(err){ return res.send({result: (err ? 'error' : 'success'),err: err});}
		get_call_info(parseInt(req.body.data.value),function(err,d){
			req.body['org_unit_id']=d[0].org_unit_id;
			looker.postComment(req, function(err, data) {
				res.send({
					result: (err ? 'error' : 'success'),
					err: err,
					json: data
				});
			});			
		});
	});
});

router.post('/user/:id', function(req, res) {
	lookerAuth.getAccessLooker(req,function(err,request){
		if(err){ return res.send({result: (err ? 'error' : 'success'),err: err});}
		looker.addUser(req, function(err, data) {
			res.send({
				result: (err ? 'error' : 'success'),
				err: err,
				json: data
			});
		});	
	});
});

router.post('/getUsers/:id/:call_id', function(req, res) {
	looker.getUsers(req, function(err, data) {
		res.send(data);
	});	
});

router.post('/editcomment', function(req,res){
	lookerAuth.getAccessLooker(req,function(err,request){
		if(err){ return res.send({result: (err ? 'error' : 'success'),err: err});}
		looker.putComment(req, function(err,data){
			res.send({
				result: (err ? 'error' : 'success'),
				err: err,
				json: data
			});
		});
	});
});

router.post('/deletecomment', function(req, res) {
	lookerAuth.getAccessLooker(req,function(err,request){
		if(err){ return res.send({result: (err ? 'error' : 'success'),err: err});}
		looker.deleteComment(req, function(err, data) {
			res.send({
				result: (err ? 'error' : 'success'),
				err: err,
				json: data
			});
		});
	});
});

router.post('/block', function(req, res) {
	lookerAuth.getAccessLooker(req,function(err,request){
		var data = JSON.parse(req.body.data.value);
		var action = data.block_action == 'YES'? true : false;
		req.body['blacklist'] = {};
		req.body.blacklist['source'] = data.block_number;
		req.body.blacklist['numbers'] = data.blacklist_numbers;
		req.body.blacklist['org_unit_id'] = data.org_unit_id;

		if(action){
			if(data.blacklist_numbers.split(',').length > 0 && data.blacklist_numbers.length > 0){
				blacklist.appendAction(req, function(err,data){
					res.send({
						result: (err ? 'error' : 'success'),
						err: err,
						json: data
					});
				});
			} else {
				blacklist.postAction(req, function(err,data){
					res.send({
						result: (err ? 'error' : 'success'),
						err: err,
						json: data
					});
				});
			}
		}else{
			blacklist.putDeleteAction(req, function(err,data){
				res.send({
					result: (err ? 'error' : 'success'),
					err: err,
					json: data
				});
			});
		}

	});
})


router.post('/email', function(req, res){
	lookerAuth.getAccessLooker(req,function(err,request){
		var data = JSON.parse(req.body.data.value);		
		req.body['email'] = {};
		async.waterfall([
			function(callback){
				get_call_info(parseInt(data),function(err, d){
					if (err) {return callback(err);};
					if(d.length < 1) {return callback('No data found');};
					req.body.email['org_unit_id'] = d[0].org_unit_id;
					callback(null, d[0].s3_url);
				});
			},
		    function(s3_url,callback) {
		    	if (s3_url.trim() === ""){
		    		callback(null,s3_url);						    		
		    	} else {
		    		AWS.config.update({accessKeyId: s3yml[envVar].access_key_id, secretAccessKey: s3yml[envVar].secret_access_key});
					var file = s3_url +".mp3" ;
					var s3url;
					var s3 = new AWS.S3();
					orgUnitModel.fetchS3ExpireValue(req.body.email['org_unit_id'], function(err, s3_expire){
						var expireValue = (s3_expire) ? s3_expire : 86400*7;
						var params = {Bucket: s3yml[envVar].bucket, Key: "call_recordings/" + file , Expires: expireValue};
						s3.getSignedUrl('getObject', params, function (err, url) {
							if (err) return callback(err);
							s3url = url;
							callback(null,s3url);
						});
					});						
		    	}
			},
			function(s3url,callback) {
				req.body.email['name'] = req.user.first_name + ' ' +req.user.last_name;	
				req.body.email['s3URL'] = s3url;	
				req.body.email['message'] = req.body.form_params.message;
				req.body.email['to'] = req.body.form_params.email_id;
				get_user_access_permission(req.user.user_id,function(err,data){
					req.body.email['user_authorised'] = data[0].access_audio;
					call.emailRecording(req, function(data){
						console.log("data",data);
						res.send(data);
					});
				});
			}
		], function (error) {
		    if ( error ) { 
            	console.warn('Error occured during performing email operation JSON.',error);
            	res.send(error)
			} else {
			    res.send('Successfully completed operation.')
			}
		});
	});
	
});

function get_call_info (call_id, cb) {
	var qry = "select org_unit_id, recording_file AS s3_url from call c join call_detail cd ON c.call_id = cd.call_id where c.call_id ="+call_id;
	appModel.ctPool.query(qry, function(err, d){
		if (err) return cb(err);
		console.log(d);
		cb(err, d);
	});	
}

function get_user_access_permission (ct_user_id, cb) {
	var qry = "select access_audio from user_permissions where ct_user_id ="+ct_user_id;
	appModel.ctPool.query(qry, function(err, d){
		if (err) return cb(err);
		console.log(d);
		cb(err, d);
	});	
}


module.exports = router;


