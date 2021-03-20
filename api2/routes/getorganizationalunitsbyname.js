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
router.get('/:firstname/:lastname', function(req,res){

    connectionpool.getConnection(function(err, connection) {
        first_name = req.params.firstname;
        last_name = req.params.lastname;
        if (err) {
            console.error('CONNECTION error: ',err);
            res.statusCode = 503;
            res.send({
                result: 'error',
                err:    err.code
            });
        } else {
            var qry_result = [];
            var userQuery = "SELECT user.organizational_unit_id, user.username FROM users AS user WHERE user.first_name = '" + first_name + "' AND user.last_name = '" + last_name + "' LIMIT 1";
            connection.query(userQuery,function(err, rows, fields) {
    			if (err) {
                    console.error(err);
                    res.statusCode = 500;
                    res.send({
                        result: 'error',
                        err:    err.code
                    });
                }
                qry_result.push({userEmail: rows[0].username});
                var organizational_unit_id = rows[0].organizational_unit_id;
                var ouQuery = "SELECT ou.id FROM organizational_units AS ou WHERE ou.lft >= (SELECT ou.lft FROM organizational_units AS ou WHERE ou.id = " + organizational_unit_id + ") AND ou.rght <= (SELECT ou.rght FROM organizational_units AS ou WHERE ou.id = " + organizational_unit_id + ") AND ou.status = 'active';";
				connection.query(ouQuery, function(err2, rows2, field2) {
                    if (err) {
                        console.error(err);
                        res.statusCode = 500;
                        res.send({
                            result: 'error',
                            err:    err.code
                        });
                    }
                    var ou_ids = [];
                    for (var i in rows2) {
                        ou_ids.push({id: rows2[i].id});
                     }
                    qry_result.push({ous: ou_ids});
                    res.send({
                        result: 'success',
                        err:    '',
                       // fields: fields,
                        json:   qry_result,
                       // length: rows.length
                    });
                    connection.release();
                });
            });
        }
    });

});

module.exports = router;
