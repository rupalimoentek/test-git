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
var grpid = "";
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

    connectionpool.getConnection(function(err, connection) {
        if (err) {
            console.error('CONNECTION error: ',err);
            res.statusCode = 503;
            res.send({
                result: 'error',
                err:    err.code
            });
        } else {
			var sql = "select indicator_scores.organizational_unit_id as 'ou_id', count(call_details.source) as 'call_source'," +
			"sum(case when indicator_scores.indicator_id = '73' and indicator_scores.score > '0' then 1 else 0 end) as 'sales_inquiry'," +
			"sum(case when indicator_scores.indicator_id = '18' and indicator_scores.score > '0' then 1 else 0 end) as 'conversions'," +
			"sum(case when indicator_scores.indicator_id = '50' and indicator_scores.score > '51' then 1 else 0 end) as 'lead_score', " +
			"sum(case when indicator_scores.indicator_id = '93' and indicator_scores.score > '0' then 1 else 0 end) as 'missed_opportunity' " +
			"from indicator_scores left join indicators on indicators.id = indicator_scores.indicator_id " +
			"left join call_details on call_details.id = indicator_scores.call_detail_id " +
			"left join provisioned_routes on provisioned_routes.id = call_details.provisioned_route_id where indicator_scores.organizational_unit_id " +
			"IN (select organizational_units.id from organizational_units where organizational_units.is_store = '1' and organizational_units.status = 'active')" +
			"and indicators.name != 'null' group by indicator_scores.organizational_unit_id;" ;
            connection.query(sql, req.params.id, function(err, rows, fields) {
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
                    records:   rows,
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
		if (!req.query.group)
		grpid = req.params.id;
		var sql = "select lft,rght from organizational_units where id=" +req.params.id;

			//var sql = "select indicator_scores.organizational_unit_id as 'ou_id', count(call_details.source) as 'call_source',sum(case when indicator_scores.indicator_id = '73' and indicator_scores.score > '0' then 1 else 0 end) as 'sales_inquiry',sum(case when indicator_scores.indicator_id = '18' and indicator_scores.score > '0' then 1 else 0 end) as 'conversions',sum(case when indicator_scores.indicator_id = '50' and indicator_scores.score > '51' then 1 else 0 end) as 'lead_score',sum(case when indicator_scores.indicator_id = '93' and indicator_scores.score > '0' then 1 else 0 end) as 'missed_opportunity' from indicator_scores left join indicators on indicators.id = indicator_scores.indicator_id left join call_details on call_details.id = indicator_scores.call_detail_id left join provisioned_routes on provisioned_routes.id = call_details.provisioned_route_id where indicator_scores.organizational_unit_id IN (select organizational_units.id from organizational_units where organizational_units.billing_id = '" +req.params.id+ "' and organizational_units.is_store = '1' and organizational_units.status = 'active') and indicators.name != 'null' group by indicator_scores.organizational_unit_id;" 
							 if(req.query.startdate && req.query.enddate)
					{
						sql2date= " AND indicator_scores.created  between " + req.query.startdate + " and  "+ req.query.enddate;
						sampledate= req.query.startdate;
					}
			console.log(sql);
            connection.query(sql, req.params.id, function(err, rows, fields) {
			if (err)
			{
                    console.error(err);
                    res.statusCode = 500;
                    res.send({
                        result: 'error',
                        err:    err.code
                    });
            }
			
				console.log(req.query);
				
				var sql2 = "select organizational_units.id,organizational_units.name, users.username from organizational_units" + 
						    " left join provisioned_routes on provisioned_routes.organizational_unit_id = organizational_units.id" +
							" left join users on users.organizational_unit_id = organizational_units.id" +
							" where organizational_units.lft >=" + rows[0].lft+ " and  organizational_units.rght <=" + rows[0].rght + "  and provisioned_routes.status = 'active' and (users.status = 'active' or users.status is null)";

				console.log(sql2);
				connection.query(sql2, req.params.id, function(err, rows1, fields1) {
				if (err)
				{
						console.error(err);
						res.statusCode = 500;
						res.send({
							result: 'error',
							err:    err.code
						});
				}
				
					console.log(req.query);
					var sql3 = "select organizational_units.id,organizational_units.name, users.username,p.username as 'pusername' from organizational_units" + 
					" left join provisioned_routes on provisioned_routes.organizational_unit_id = organizational_units.id" +
					" left join users on users.organizational_unit_id = organizational_units.id" +
					" left join users p on p.organizational_unit_id = organizational_units.parent_id" +
					" where organizational_units.lft >=" + rows[0].lft+ " and  organizational_units.rght <=" + rows[0].rght + "  and provisioned_routes.status = 'active' and (users.status = 'active' or users.status is null) and (p.status = 'active' or p.status is null)";
					console.log(sql3);
					connection.query(sql3, req.params.id, function(err, rows2, fields2) {
					if (err)
					{
							console.error(err);
							res.statusCode = 500;
							res.send({
								result: 'error',
								err:    err.code
							});
					}
					for(var i=0;i<rows1.length;i++)
					{
						if(rows1[i].username === null)
						{
						rows1[i].username ='';
							for(var j=0;j<rows2.length;j++)
							{
								if (rows1[i].id == rows2[j].id)
								{
									rows1[i].username += rows2[j].pusername + "," ;
								}
							}
						}
					}
					
					//res.setHeader({ 'Content-Type': 'application/json'});	
					res.send({
						id : grpid,
						result: 'success',
						err:    '',
						date : sampledate,
					   // fields: fields,
						records:   rows1,
						length: rows1.length
					});
					//connection.release();
					});
				});
				//res.setHeader({ 'Content-Type': 'application/json'});	
				connection.release();
            });
        }
    });

});

module.exports = router;
