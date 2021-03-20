var connector   = require('./appModel'),
    async       = require('async'),
    yaml        = require("js-yaml"),
    fs          = require("fs"),
    envVar      = process.env.NODE_ENV,
    me          = yaml.load(fs.readFileSync("config/mongodb.yml"));

var api_status = {
    getStatus2:function (req, res) {
        async.parallel([
            function(cb){
                var query = "SELECT channel_id as id FROM channel LIMIT 1";
                connector.ctPool.query(query, function (err) {
                    if (err ) {
                        console.log('Failed to ping PostgreSQL test. '+err);
                        return res('false') ;
                    }
                    console.log("Ping called PG success");
                    cb(null);
                });
            },
            function (cb){
                var query = "SELECT id FROM call_flows WHERE 1 LIMIT 1";
                connector.cePool.query(query, function (err) {
                    if (err ) {
                        console.log('Failed to ping CE test. ' + err);
                        return res('false');
                    }
                    console.log("Ping called CE success");
                    cb(null);
                });
            },
            function (cb) {
                var mongo = {
                    collection: 'phone_number_pools',
                    sort: { "_id": -1 },
                    limit: 1
                };
                connector.mongoPool.query(mongo, function(err) {
                    if (err) {
                        console.log('Failed on ping test to MongoDB. '+err);
                        return res('false');
                    }
                    console.log("Ping called Mongo success");
                    cb(null);
                });
            }
        ],
        function (err) {
            if (err) {
                console.log('Failed the ping check. '+err);
                return res(err);
            }
            console.log('all done');
            res(null, true);
        });
    },
	getStatus:function(req, res) {
		return res(null, true);
	}
};

module.exports = api_status;