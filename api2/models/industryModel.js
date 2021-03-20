var mysql   = require('mysql'),
	connector = require('./appModel'),
	yaml = require("js-yaml"),
	f = require('../functions/functions.js'),
	fs = require("fs"),
	e = yaml.load(fs.readFileSync("config/database.yml")),
	table = 'industry';

var industry = {
	read: function(data, res){
		//TODO: validate and sanitize data before running query.
		var whereClause = 'where 1=1';
		console.log(data);
		if (data.industry_name) whereClause += " and industry_name = '"+data.industry_name+"' ";
		if (data.industry_id) whereClause += " and industry_id = '"+data.industry_id+"' ";

		var query = "SELECT * FROM " + table + " ";
		query+=  whereClause;
		query+= " ORDER BY industry_group ";
		//console.log(query);
		connector.ctPool.query(query, function(err, data){
			res(data);

		});
	}
};


module.exports = industry;