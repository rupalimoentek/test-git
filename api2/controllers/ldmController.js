'use strict';
var phoneNumberModel = require('../models/phoneNumberModel');

var ldm = {
    getLDMInfo: function(body, cb) {
        phoneNumberModel.getLDMInfo(body.trackingNumber, body.ringToNumbers, function(ldmInfo) {
            cb(ldmInfo);
        });
    }
}

module.exports = ldm;