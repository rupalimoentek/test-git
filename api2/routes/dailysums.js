var express = require('express'),
    app     = express(),
    mysql   = require('mysql'),
	yaml = require("js-yaml");

var fs = require("fs");
//var logger = require('/var/www/restapi/logger');
var e = yaml.load(fs.readFileSync("config/database.yml"));
var envVar = process.env.NODE_ENV;
 var  connectionpool = mysql.createPool({
        host     : e[envVar].host,
        user     : e[envVar].username,
        password : e[envVar].password,
        database : e[envVar].database
    });

var router = express.Router();
var sql2date= "";
var sampledate = "";
var grpid = "dailycount";
// Add headers
router.use(function (req, res, next) {

    // Website you wish to allow to connect
   // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});
router.get('/', function(req,res){
	if(req.query.startdate && req.query.enddate)
	{
	    connectionpool.getConnection(function(err, connection) {
	        if (err) {
	            console.error('CONNECTION error: ',err);
	            res.statusCode = 503;
	            res.send({
	                result: 'error',
	                err:    err.code
	            });
	        } else {	
				var sql = "select" + req.query.startdate + " as 'date'," +
				"(select count(id) from call_details where created between " + req.query.startdate + " and " + req.query.enddate + ") as 'calls'," +
				"(select count(call_mine_status) from call_details where call_mine_status = 'mined' and created between " + req.query.startdate + " and " + req.query.enddate + ") as 'callsmined'," +
				"(select count(id) from api_logs where created between " + req.query.startdate + " and " + req.query.enddate + ") as 'apicalls'," +
				"(select count(id) from provisioned_routes where created between " + req.query.startdate + " and " + req.query.enddate + ") as 'provisionedroutes'," +
				"(select count(id) from users where created between " + req.query.startdate + " and " + req.query.enddate + ") as 'userscreated'," +
				"(select count(id) from phone_numbers where created between " + req.query.startdate + " and " + req.query.enddate + ") as 'phonenumberscreated';";
	            
	            connection.query(sql, req.params.id, function(err, rows, fields) {
				if (err) {
	                    console.error(err);
	                    res.statusCode = 500;
	                    res.send({
	                        result: 'error',
	                        err:    err.code
	                    });
	                }

	                res.send({
	                    result: 'success',
	                    err:    '',
	                   // fields: fields,
	                    records:   rows,
	                   // length: rows.length
	                });
	                connection.release();
	            });
	        }
	    });
	}
	else
	{
		res.statusCode = 412;
		res.send({
			id : grpid,
			result: 'fail',
			err: 	'startdate & enddate required',
			date : sampledate,
			records:   null,
			length: 0
		});
	}
});
router.get('/:id', function(req,res){
	if(req.query.startdate && req.query.enddate)
	{
    	connectionpool.getConnection(function(err, connection) {
	        if (err) {
	            console.error('CONNECTION error: ',err);
	            res.statusCode = 503;
	            res.send({
	                result: 'error',
	                err:    err.code
	            });
	        } else {
				if (err)
				{
		                console.error(err);
		                res.statusCode = 500;
		                res.send({
		                    result: 'error',
		                    err:    err.code
		                });
		        }
		        else {
					console.log(req.query);

					var sql = "select " + req.query.startdate + " as 'date', " + req.params.id + " as 'ouid', " +
					"(select count(id) from call_details where created between " + req.query.startdate + " and " + req.query.enddate + " and organizational_unit_id = '" + req.params.id + "') as 'calls'," +
					"(select count(call_mine_status) from call_details where call_mine_status = 'mined' and created between " + req.query.startdate + " and " + req.query.enddate + " and organizational_unit_id = '" + req.params.id + "') as 'callsmined'," +
					"(select count(api.id) from api_logs api left join organizational_units ou on ou.api_key = api.api_id where api.created between " + req.query.startdate + " and " + req.query.enddate + " and ou.id = '" + req.params.id + "') as 'apicalls'," +
					"(select count(id) from provisioned_routes where created between " + req.query.startdate + " and " + req.query.enddate + " and organizational_unit_id = '" + req.params.id + "') as 'provisionedroutes'," +
					"(select count(id) from users where created between " + req.query.startdate + " and " + req.query.enddate + " and organizational_unit_id = '" + req.params.id + "') as 'userscreated'," +
					"(select count(id) from phone_numbers where created between " + req.query.startdate + " and " + req.query.enddate + " and organizational_unit_id = '" + req.params.id + "') as 'phonenumberscreated';";

					console.log(sql);
					connection.query(sql, req.params.id, function(err, rows1, fields1) {
						if (err)
						{
								console.error(err);
								res.statusCode = 500;
								res.send({
									result: 'error',
									err:    err.code
								});
						}
						else {
							console.log(req.query);
							res.send({
								id : grpid,
								result: 'success',
								err:    '',
								date : sampledate,
							   // fields: fields,
								records:   rows1,
								length: rows1.length
							});
						}
						connection.release();
					});
				}
	        }
    	});
	}
	else
	{
		res.statusCode = 412;
		res.send({
			id : grpid,
			result: 'fail',
			err: 	'startdate & enddate required',
			date : sampledate,
			records:   null,
			length: 0
		});
	}
});

module.exports = router;
