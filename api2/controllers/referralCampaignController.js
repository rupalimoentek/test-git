var ctTransactionModel = require('../models/ctTransactionModel');
var controller         = require('./appController');
var f                  = require('../functions/functions');
var referralModel      = require('../models/referralCampaignModel');
var appModel           = require('../models/appModel');
var ctlogger           = require('../lib/ctlogger.js');
var async              = require('async');

var referral = {
    getAction : function(req,res){
        referralModel.read(req, function(err, data) {
            controller.responsify(err, data, function(response){
    			res(response);
    		});
        });
    },
    updateStatus: function(req, res) {
        console.log("req.body.................",req.body);
        if (req.body.campaign === undefined) {
          return res('No campaign data provided');
        }
        var returnJson = {};
        var provisionedRouteModel = require("../models/provisionedRouteModel");
        var callFlowModel = require("../models/callFlowModel");
        var referral_end_date = null;
        var status = '';
        if (req.body.campaign.referral_phone_number.length === 10) {
            status = req.body.campaign.status;
        }
        var logAdded = false;
        if (status !== '') {
            var pr_statusData = {
                provisioned_route:{
                    campaign_id     :req.body.campaign.id,
                    status          :req.body.campaign.status,
                    referal_add_or_remove : true,
                    referral_phone_number: req.body.campaign.referral_phone_number,
                    campaign_end_date: req.body.campaign.campaign_end_date,
                    referral_end_date: req.body.campaign.referral_end_date
                }
            };
            provisionedRouteModel.setStatusAll(null, pr_statusData, req, function (err, data) {                
                if(err){
                    console.log("****** ERROR WHILE UPDATING PROVISIONS ROUTES *************");
                    controller.responsify(err, data, function (response) {
                        res(response);
                    });    
                } else {
                    var campaignModel = require('../models/campaignModel');
                    var campaignData = {
                        campaign:{
                            status:req.body.campaign.campaignStatus,
                            id: req.body.campaign.id,
                            date_changed: false
                        }
                    };
                    campaignModel.setCampaignStatus(campaignData, function (err, data) {
                        console.log("****** CAMPAIGN STATUS UPDATED *************");
                        controller.responsify(err, data, function (response) {
                            res(response);
                        });
                    }); 
                }
            });
        }
    }

};

module.exports = referral;
