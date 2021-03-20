var Memcached           = require('memcached'),
    fs                  = require('fs'),
    yaml                = require('js-yaml'),
    conf                = yaml.load(fs.readFileSync('config/config.yml')),
    envVar              = process.env.NODE_ENV,
    memcached   = new Memcached(conf[envVar].memcached.server+':'+conf[envVar].memcached.port, {retries:10, retry:10000});

var sms = {
	getMessages: function(req, res) {
        var conversationIds = req.query.ids;
        if(conversationIds!=='') {
            conversationIds = conversationIds.split(',');
            memcached.getMulti(conversationIds, function (err, data) {
                if (err) { res('Failed to retrieve sms. '+err); }
                console.log('retrived Data', data);
                res(null, data);
            });
        } else {
            res(null, null);
        }
	},
};

module.exports = sms;
