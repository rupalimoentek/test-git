var connector = require('./models/appModel'),
 		mysql               = require('mysql'),
	f = require('./functions/functions.js'),
	fs = require("fs"),
	yaml = require("js-yaml"),
	config = yaml.load(fs.readFileSync('config/config.yml')),
	crypto = require('crypto'),
	envVar = process.env.NODE_ENV,
	async = require('async'),
	q = require("q"),
	_ = require("underscore"),
	appModel = require('./models/appModel'),
	ctTransactionModel = require('./models/ctTransactionModel');
	var	rabbit = yaml.load(fs.readFileSync("./config/rabbit.yml"));
	var timezone = 'UTC';
	var  url = 'amqp://'+rabbit[envVar].user+':'+rabbit[envVar].password+'@'+rabbit[envVar].host+':'+rabbit[envVar].port+'/'+rabbit[envVar].vhost;


	var ctTrans = new ctTransactionModel.begin(function(err){
		var reportIDs = [];
		var filterIDS = [];
		if (err) { return res(err); }
				async.waterfall([
						function(callback){
							var selectQry = {
							which: "query",
							qry: "select filter_id from filter where report_used !='call_detail' AND report_used !='callflow_setting' AND report_used !='group_activity'"
						};
						ctTrans.query(selectQry, function (err, selectfilterResult) {
							filterIDS = _.pluck(selectfilterResult,'filter_id');
							callback(err, filterIDS);
						});
					},
					function(filter, callback){
						var selectQry = {
						which: "query",
						qry: "select report_id from report_sched where filter_id IN ("+filter+")"
					};
					ctTrans.query(selectQry, function (err, selectreportResult) {
						reportIDs = _.pluck(selectreportResult,'report_id');
						callback(err, reportIDs);
					});
				},
					function(report, callback){

						var updateQry = {
						which: "query",
						qry: "UPDATE report_sched SET report_status='deleted' WHERE report_id IN ("+report+")"
					};
					ctTrans.query(updateQry, function (err, selectreportResult) {
						callback(err, report);
					});
					},
					function(report, callback){
						var selectQry = {
						which: "query",
						qry: "select schedule_id from schedule where report_id IN ("+report+")"
					};
					ctTrans.query(selectQry, function (err, selectscheduleResult) {
							var scheduleIds = _.pluck(selectscheduleResult,'schedule_id');
						callback(err, scheduleIds);
					});
				},
				function(schedule, callback){
						var updateQry = {
							which: "query",
							qry: "UPDATE schedule SET schedule_status='deleted' WHERE schedule_id IN ("+schedule+")"
						};
					ctTrans.query(updateQry, function (err, data) {
						callback(err, schedule);
					});
				}
				],
				function(err, results){
						if(err){
							console.log("In err");
							ctTrans.rollback(function(){
								console.log("In err",err);
						});
					} else {
						console.log("In commit");
						var updateQry ="DELETE FROM schedule WHERE task_type='schedule_report' AND task_data IN('"+ results.join("','") +"')";
						appModel.csPool.query(updateQry, function(err) {
							if (err) { console.log('Failed to delete scripts schedule record. '+err); }

						});
						ctTrans.commit(function(){
								console.log("successfully Deleted");
						});
						}
				});
			});
