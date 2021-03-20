/**
 * Created by Aloha technology on 08/02/2017.
 */
 var    http = require('http'),
        moment             = require('moment'),
        momentTimezone      = require('moment-timezone'),
        yaml = require("js-yaml"),
      	fs = require("fs"),
        _ = require('underscore'),
        async = require('async'),
        envVar         = process.env.NODE_ENV,
        prettyCron = require('prettycron'),
        config = yaml.load(fs.readFileSync("config/config.yml"));


var lookerApiRef = require('../lib/node-looker-api');
var sessionLength = 86400;
var authApi = new lookerApiRef.ApiAuthApi();
var looker_host = config[envVar].LOOKER_HOST;
authApi.apiClient.setInstanceName(looker_host);

var schedulePlan = {
  getSchedulePlans: function(req, res){
    if(req.user.looker_user_id){
      schedulePlan.lookerLogin(req, function(err){
      if(err){return res('Error:',err);}
      var userID = {
          'userId': req.user.looker_user_id
      };
      var scheduledPlansApi = new lookerApiRef.ScheduledPlanApi();
      scheduledPlansApi.allScheduledPlans(userID, function(err,data){
        if(err){ return res('Error :',err);}
        var scheduleData = [];
        async.forEach(data, function (schedules, callback){
              var schedule = {};
              schedule.schedule_id = schedules.id;
              schedule.name = schedules.name;
              schedule.dashboard_id = schedules.dashboard_id;
              schedule.cretor = schedules.user.display_name;
              var recipients =  schedules.scheduled_plan_destination;
              var address = _.pluck(recipients,'address');			  
			  //if not found look for address in new plugin schedules location
			  if(address.length == 1 && address[0] == '') schedule.recipients = JSON.parse(_.pluck(recipients,'parameters'))['email_address'];		  
			  else schedule.recipients =address.join(',\n');
              var formate = _.pluck(recipients,'format');              
              schedule.frequency = prettyCron.toString(schedules.crontab);
              schedule.create_date = moment(schedules.created_at).tz(req.user.timezone).format('MM-DD-YYYY');
              schedule.formate = formate.toString().split("_")[1];
              var reportName= _.find(req.user.reports,{looker_id:schedules.dashboard_id});
              if(reportName){
                schedule.reportName = reportName.report_name;
                scheduleData.push(schedule);
                callback();
              }else{
                schedule.reportName = "Extended Report";
                scheduleData.push(schedule);
                callback();
              }
          }, function(err) {
            res(err,scheduleData);
          });
      });
    });
    }else{
      return res("No schedule reports found");
    }  
  },
  sendSchedulePlan: function(req, res){
      async.waterfall([
        function(cb){
          schedulePlan.lookerLogin(req,function(err,data){
          if(err){return res('Error:',err);}
          cb(null,data);
          });
        },
        function(res,cb){
          var scheduledPlansApi = new lookerApiRef.ScheduledPlanApi();
          var dashboardId = req.body.schedulePlanId;
          scheduledPlansApi.scheduledPlan(dashboardId,null, function(err,data){
            if(err){return cb('Error :',err);}
            cb(null,data);
          });
        },
        function(data,cb){
          var scheduleBody = {
            'body' : data
          };
          var scheduledPlansApi = new lookerApiRef.ScheduledPlanApi();
          scheduledPlansApi.scheduledPlanRunOnce(scheduleBody, function(err,data){
            if(err){return res('Error :',err);}
             cb(null,"Your report is being processed.");
          });
        }
      ],function(err,result){
         if(err){ return res(err);}
         res(null,result);
      });
 	},
  deleteSchedulePlan: function(req, res){
    var scheduledPlanId = req.body.schedulePlanId;
    schedulePlan.lookerLogin(req,function(err,data){
      if(err){return res('Error:',err);}
      var scheduledPlansApi = new lookerApiRef.ScheduledPlanApi();
      scheduledPlansApi.deleteScheduledPlan(scheduledPlanId,function(err,data){
        if(err){return res('Error :',err);}
         res(null,data);
      });
    });
  },
  lookerLogin:function(req, res){
    var opts = {
      'clientId': config[envVar].LOOKER_CLIENTID, // {String} client_id part of API3 Key.
      'clientSecret': config[envVar].LOOKER_SECRET // {String} client_secret part of API3 Key.
    };
    authApi.login(opts, function(error, data, response) {
      if (error) {
        return res(error);
      } else {
        authApi.apiClient.authentications = {};
        // the authentications will explicitly look for 'oauth2'
        authApi.apiClient.authentications["oauth2"] = {"type": "oauth2", "accessToken" : data.access_token};
        res(null, data);
      }
    });
  },
  lookerLogout:function(req,res){
    authApi.logout(function(error, data, response) {
      if (error) {
        return res(error);
      } else {
          res(null,"Logged out successfully");
      }
    });
  },
  deleteLookerUser:function(looker_user_id, res){
    if(looker_user_id){
      schedulePlan.lookerLogin(looker_user_id, function(err){
        if(err){return res('Error:',err);}
        var userID = looker_user_id;
        var apiInstance = new lookerApiRef.UserApi();
          apiInstance.deleteUser(userID,function(error, data, response){
            if (error) {return res(error);}
            res(null);
          });
      });
        }else{
        res(null);
      }
  }
 };
module.exports = schedulePlan;
