var moment = require('moment');

var timestampTransition = {
    convertToSec: function(data){
        var checkDurationFormat = data.split(":");
        var defaultFormat = data;
        if (checkDurationFormat.length == 2 && data != undefined){
            defaultFormat = moment.duration('00:'+defaultFormat).asSeconds();
        }
        if (checkDurationFormat.length == 3 && data != undefined){
            defaultFormat = moment.duration(defaultFormat).asSeconds();
        }
        data = moment.utc(defaultFormat * 1000).format("HH:mm:ss");
        return data;
    }

};

module.exports = timestampTransition;