var qb = require('../lib/queryBuilder'),
	mysql   = require('mysql'),
	yaml = require("js-yaml"),
	fs = require("fs"),
	e = yaml.load(fs.readFileSync("config/database.yml")),
	envVar = process.env.NODE_ENV,
	connectionPool = mysql.createPool({
	    host     : e['callengine_' + envVar].host,
	    user     : e['callengine_' + envVar].username,
	    password : e['callengine_' + envVar].password,
	    database : e['callengine_' + envVar].database
	});

function begin(callback){
	var conn;
	var ident;
	connectionPool.getConnection(function(err, connection){
		conn = connection;
		ident = conn.threadId;
		if (err) {
			console.log('CE: '+ident+' Error: ' + err);
			callback(err);
			return;
		}
		conn.beginTransaction(function(err){
			console.log('CE: '+ident+' Transaction begin');
			callback(err);
		});
	});
	this.query = function(data, cb){
		//console.log('data is ' + JSON.stringify(data))
		var qry;
		if (data.which === 'query') {
			qry = data.qry;
		} else {
			qry = qb.build(data);
		}
		if (qry) {
			console.log('CE: '+ident+' Query: ' + qry);
			conn.query(qry, function(err, result){
				//console.log('\n\nquery err: ' + err + " result is " + JSON.stringify(result) + '\n\n')
				cb(err, result);
			});
		} else {
			cb('CE: '+ident+' Query is missing.');
		}
	};
	this.select = function(qry, cb){
		console.log('CE: '+ident+' Query: ' + qry);
		conn.query(qry, function(err, result){
			if (err) {
				console.log('CE: '+ident+' Transaction Query Error: ' + err);
				cb(err);
				return;
			}
			cb(null,result);
		});
	};
	this.commit = function(cb){
		conn.commit(function(err){
			conn.release();
			console.log('CE: '+ident+' Transaction Commit');
			cb(err);
		});
	};
	this.rollback = function(cb){
		conn.rollback(function(){
			conn.release();
			console.log('CE: '+ident+' Transaction Rollback');
			cb();
		});
	};
}

module.exports = {begin: begin};

function queryBuilder(type,data){
	var qry = '';
	switch(type){
		case 'insert':
			var fields = [];
			var values = '';
			var count = 0;
			for (var key in data.values) {
				count ++;
				fields.push(key);
				if (typeof data.values[key] === 'string') {
					values += "'" + data.values[key] + "'";
				} else {
					values += data.values[key];
				}
				if (count < Object.keys(data.values).length) {
					values += ",";
				}
			}
			qry = "INSERT INTO " + data.table + "(" + fields.join(',') + ") VALUES (" + values + ")";
		break;

		case 'update':
			var set = [];
			for (var field in data.values) {
				if (field == data.table + '_id' || field == 'id') continue;
				var str = "";
				str += field + " = ";
				if (typeof data.values[field] === 'string') {
					str += "'" + data.values[field] + "'";
				} else {
					str += data.values[field];
				}
				set.push(str);
			}
			qry = "UPDATE " +  data.table + " SET " + set.join(',');
			if(data.where) qry += data.where;
			else qry += " WHERE " + data.table + "_id = " + data.values[data.table + '_id'];
		break;
	}
	return qry;
}
