var express = require('express');
var router = express.Router();
var fs = require("fs");
var	yaml = require("js-yaml");
var s3yml = yaml.load(fs.readFileSync("config/s3.yml"));
var AWS = require('aws-sdk');

var envVar = process.env.NODE_ENV;

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});
router.get('/playcall', function(req, res) {
console.log('I am here');
// here we get passed a file and need to get it from aws 
AWS.config.update({accessKeyId: s3yml[envVar].access_key_id, secretAccessKey: s3yml[envVar].secret_access_key});
	// var file = req.query.file + ".mp3";
	var data = req.query.file ;
	var buff = new Buffer(data, 'base64');
	var file = buff.toString('ascii') + ".mp3";
	var s3url;
	var s3 = new AWS.S3();
//console.log("s3yml[envVar].bucket" + s3yml[envVar].bucket);
	  var params = {Bucket: s3yml[envVar].bucket, Key: "call_recordings/" + file ,Expires: 86400*7};
	 // console.log(params);
	 s3.getSignedUrl('getObject', params, function (err, url) {
	  if (err)
		 console.log(err);
	   //console.log("The URL is", url);
	   s3url = url;
	   // // console.log(gcalllink1);

	  });

//
	//	s3url = "/audio/call.mp3";
       res.render('playcall', {
          "s3url" : s3url,
		  "file" : file
		  
        });
});
module.exports = router;
