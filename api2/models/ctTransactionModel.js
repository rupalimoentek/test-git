var qb = require('../lib/queryBuilder'),
	pg = require('pg'),
	Client = require('pg').Client,
	yaml = require("js-yaml"),
	fs = require("fs"),
	e = yaml.load(fs.readFileSync("config/database.yml")),
	envVar = process.env.NODE_ENV,
	conString = "postgres://" + e[envVar].username + ":" + e[envVar].password + "@" + e[envVar].host + ":" + e[envVar].port + "/" + e[envVar].database;

function begin(callback){
	var cl = new Client(conString);
	var ident = Math.random().toString(36).substring(7);
	cl.connect(function(err){
		if (err) return callback(err);
		cl.query('BEGIN', function(err, result){
			console.log('CT: '+ident+' Transaction Begin');
			callback(err);
		});
	});
	this.select = function(qry, res){
		console.log('CT: '+ident+' Transaction Select: ' + qry);
		cl.query(qry, function(err, result){
			if (err) {
				console.log('CT: '+ident+' Transaction Query Error: ' + err);
				res(err);
				return;
			}
			res(null,result.rows);
		});
	};
	this.query = function(data, res) {
		var qry;
			if (typeof data === "string") {
			qry = data;
		} else if (data.which === 'query') {
			qry = data.qry;
		} else {
			qry = qb.build(data);
		}
		console.log('CT: '+ident+' Transaction Query: ' + qry);
		cl.query(qry, function(err, result) {
			if (err) {
				console.log('CT: '+ident+' Transaction Query Error: ' + err);
				return res(err);
			}
			res(null, result.rows);
		});
	};
	this.queryRet = function(data, res){
		var qry;
			if (typeof data === "string") {
		qry = data;
		}
		else if (data.which === 'query') {
			qry = data.qry;
		} else {
			qry = qb.build(data);
		}
		console.log('CT: '+ident+' Transaction QueryRet: ' + qry);
		cl.query(qry, function(err, result){
			if (err) {
				console.log('CT: '+ident+' Transaction Query Error: ' + err);
				res(err);
				return;
			}
			var r = {rowCount: result.rowCount};
				if (result && result.fields.length > 0 && result.rows.length > 0) {
					var primary_key = result.fields[0].name;
					r = {
						insertId: result.rows[0][primary_key]
					};
				}
			res(err, r);
		});
	};
	this.insert = function(data, res) {
		data.which = 'insert';
		var qry = qb.build(data);
			console.log('CT: '+ident+' Transaction Insert: ' + qry);
		cl.query(qry, function(err, result){
			if (err) {
				console.log('CT: '+ident+' Transaction Query Error: ' + err);
				res(err);
				return;
			}
			var r = {rowCount: result.rowCount};
					if (result && result.fields.length > 0 && result.rows.length > 0) {
				var primary_key = result.fields[0].name;
				r = {
					insertId: result.rows[0][primary_key]
				};
			}
			res(err, r);
		});
	};
	this.update = function(data, res) {
		data.which = 'update';
		var qry = qb.build(data);
			console.log('CT: '+ident+' Transaction Update: ' + qry);
		cl.query(qry, function(err, result){
			if (err) {
				console.log('CT: '+ident+' Transaction Query Error: ' + err);
				res(err);
				return;
			}
			res(err, result);
		});
	};
	this.rollback = function(res){
		cl.query('ROLLBACK', function() {
			cl.end();
			console.log('CT: '+ident+' Transaction Rollback');
			res();
		});
	},
	this.commit = function(res){
		cl.query('COMMIT', cl.end.bind(cl));
		cl.end();
		console.log('CT: '+ident+' Transaction Commit');
		res();
	},
	this.close = function(res){
		cl.end();
		console.log('CT: '+ident+' Transaction Closed');
		res();
	}
}

module.exports = {begin: begin};
