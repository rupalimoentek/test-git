'use strict';
var conversationModel = require('../models/conversationModel'),
    controller = require('./appController'),
    sms = require('../lib/liveSms');

var conversation = {
    label: function (req, res) {
        conversationModel.label(req.body, function (err, data) {
            controller.responsify(err, data, function (response) {
                res(response);
            });
        });
    },
    statusAction: function (req, res) {
        conversationModel.setStatus(req.body, function (err, data) {
            controller.responsify(err, data, function (response) {
                res(response);
            });
        });
    },
    getAllConversation: function (req, res) {
        conversationModel.getAllConversation(req, function (err, data) {
            controller.responsify(err, data, function (response) {
                res(response);
            });
        });
    },
    getBadgeCount: function (req, res) {
        conversationModel.getBadgeCount(req, function (err, data) {
            controller.responsify(err, data, function (response) {
                res(response);
            });
        });
    },
    sendSMS: function (req, res) {
        conversationModel.postSMS(req, function (err, data) {
            controller.responsify(err, data, function (response) {
                res(response);
            });
        });
    },
    getChatHistory: function (req, res) {
        conversationModel.getChatHistory(req, function (err, data) {
            controller.responsify(err, data, function (response) {
                res(response);
            });
        });
    },
    getLiveSms: function (req, res) {
        sms.getMessages(req, function (err, data) {
            controller.responsify(err, data, function (response) {
                res(response);
            });
        });
    }
};

module.exports = conversation;
