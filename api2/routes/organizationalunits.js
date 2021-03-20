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
    //res.setHeader('Access-Control-Allow-Origin', req.headers.origin);

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

    connectionpool.getConnection(function(err, connection) {
        if (err) {
            console.error('CONNECTION error: ',err);
            res.statusCode = 503;
            res.send({
                result: 'error',
                err:    err.code
            });
        } else {
		
            connection.query('SELECT * FROM organizational_units ', function(err, rows, fields) {
			if (err) {
                    console.error(err);
                    res.statusCode = 500;
                    res.send({
                        result: 'error',
                        err:    err.code
                    });
                }
				
				//res.setHeader({ 'Content-Type': 'application/json'});	
                res.send({
                    result: 'success',
                    err:    '',
                   // fields: fields,
                    json:   rows,
                   // length: rows.length
                });
                connection.release();
            });
        }
    });

});
router.get('/:id', function(req,res){

    connectionpool.getConnection(function(err, connection) {
        if (err) {
            console.error('CONNECTION error: ',err);
            res.statusCode = 503;
            res.send({
                result: 'error',
                err:    err.code
            });
        } else {
		
            connection.query('SELECT * FROM organizational_units WHERE id=' + req.params.id, req.params.id, function(err, rows, fields) {
			if (err) {
                    console.error(err);
                    res.statusCode = 500;
                    res.send({
                        result: 'error',
                        err:    err.code
                    });
                }
				
				//res.setHeader({ 'Content-Type': 'application/json'});	
                res.send({
                    result: 'success',
                    err:    '',
                   // fields: fields,
                    json:   rows,
                   // length: rows.length
                });
                connection.release();
            });
        }
    });

});

module.exports = router;
