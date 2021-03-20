'use strict';
var controller = require('./appController');
var scoreManualActionModel = require('../models/scoreManualActionModel');

var scoreManualAction = {

    getScoreManualActions: function(req, res) {
        scoreManualActionModel.readManualScoreActionById(req.params.id, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            });
        });
    },

    getScoreManualActionsByUserID: function(req, res) {
        scoreManualActionModel.readManualScoreActionByUserID(req.params.id, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            });
        });

    },

    saveScoreManualActions: function(req, res) {
        scoreManualActionModel.saveScoreManualAction(req.body, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            });
        });
    },


    createBulkScoreAction: function(req, res) {
        scoreManualActionModel.createBulkScoreAction(req.body, req.params.id, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            });
        });
    },
    updateScoreManualActions: function(req, res) {
        scoreManualActionModel.updateScoreManualActions(req.body, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            });
        });
    },

    deleteScoreManualActions: function(req, res) {
        scoreManualActionModel.deleteScoreManualActions(req.params.id, function(err, data) {
            controller.responsify(err, data, function(response) {
                res(response);
            });
        });
    }
}
module.exports = scoreManualAction;