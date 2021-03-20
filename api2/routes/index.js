var express = require('express');
var router = express.Router();
var fs = require("fs");
var	yaml = require("js-yaml");
var s3yml = yaml.load(fs.readFileSync("config/s3.yml"));
var AWS = require('aws-sdk');
//var logger = require('/var/www/restapi/logger');
var envVar = process.env.NODE_ENV;
var callerPrivacy = require('../controllers/callerPrivacyController');
/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});
/* GET Userlist page. */
// router.get('/userlist', function(req, res) {
    // var db = req.db;
    // var collection = db.get('usercollection');
    // collection.find({},{},function(e,docs){
        // res.render('userlist', {
            // "userlist" : docs
        // });
    // });
// });
/* GET Userlist page. */
router.get('/userlist', function(req, res) {
    var db = req.db;
    var collection = db.get('dailystoresummary');
    collection.find({},{},function(e,docs){
        res.render('userlist', {
            "userlist" : docs
        });
    });
});
router.get('/playcall', function(req, res) {

// here we get passed a file and need to get it from aws 
AWS.config.update({accessKeyId: s3yml[envVar].access_key_id, secretAccessKey: s3yml[envVar].secret_access_key});
    var data = req.query.file ;
    var callIdBase64 = req.query.call_id ;
    var buff = new Buffer(data, 'base64');
    var callIdBuff = new Buffer(callIdBase64, 'base64');
    var file = buff.toString('ascii') + ".mp3";
    var callId = callIdBuff.toString('ascii');
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
      var download_audio_enabled = true
    callerPrivacy.getDownloadAudioSettingByCallId(callId, function (err, download_audio_setting) {
        download_audio_enabled = download_audio_setting;
        res.render('playcall', {
            "s3url": s3url,
            "file": file,
            "downloadSetting": (download_audio_enabled === false) ? 'nodownload' : ''
        });
    });
//
	//	s3url = "/audio/call.mp3";
    //    res.render('playcall', {
    //       "s3url" : s3url,
	// 	  "file" : file,
	// 	  "downloadSetting": (download_audio_enabled === false) ? 'nodownload' : '' 
    //     });
});
module.exports = router;
