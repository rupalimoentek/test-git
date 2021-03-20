"use strict";

var express     = require('express'),
    apistatus   = require('../controllers/api_statusController'),
    router      = express.Router();

router.get('/', function(req,res) {
    console.log("got to route");
    apistatus.getStatus(req, function(err, data) {
        if (err) {
            res.send('false');
        } else {
            res.send('true');
        }
    });
});

module.exports = router;