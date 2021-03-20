var mysql   = require('mysql'),
	yaml = require("js-yaml"),
	fs = require("fs"),
	e = yaml.load(fs.readFileSync("config/database.yml")),
	me = yaml.load(fs.readFileSync("config/mongodb.yml")),
	pg = require('pg'),
	types = require('pg').types,
	envVar = process.env.NODE_ENV,
	ctConString = "postgres://" + e[envVar].username + ":" + e[envVar].password + "@" + e[envVar].host + ":" + e[envVar].port + "/" + e[envVar].database,
	csConString = "postgres://" + e["ct_script_"+envVar].username + ":" + e["ct_script_"+envVar].password + "@" + e["ct_script_"+envVar].host + ":" + e["ct_script_"+envVar].port + "/" + e["ct_script_"+envVar].database,
	ceConnectionPool = mysql.createPool({
	    host     : e['callengine_' + envVar].host,
	    user     : e['callengine_' + envVar].username,
	    password : e['callengine_' + envVar].password,
	    database : e['callengine_' + envVar].database
	}),
	Mongo = require('mongodb');
	mongoClient = Mongo.MongoClient;
	//configure pg to return dates as strings.
	types.setTypeParser(1114, function(stringValue) {
	  return stringValue;
	});

var mongoPool = {
	query: function(mongo, res){
		var connectionStr = '';
		if (envVar == 'production') {
			connectionStr = "mongodb://" + me[envVar].username + ":" + me[envVar].password + "@" + me[envVar].host + ":" + me[envVar].port + "/" + me[envVar].api_db_name;
		} else {
			connectionStr = "mongodb://" + me[envVar].host + ":" + me[envVar].port + "/" + me[envVar].api_db_name;
		}
		var projection = {};
		if (mongo.projection) {
			projection = mongo.projection;
		}
		mongoClient.connect(connectionStr, function(err, db){
			if (err) {
				res('mongo connect err: '+JSON.stringify(err),null);
			} else {
				if (mongo.qry) {
					//console.log(mongo);
					db.collection(mongo.collection).find(mongo.qry, projection).toArray(function(err, docs){
						db.close();
						res(err, docs);
					});
				} else {
					db.collection(mongo.collection).find().sort(mongo.sort).limit(mongo.limit).toArray(function(err, docs){
						db.close();
						res(err, docs);
					});
				}
			}
		});
	},
	delete: function(mongo, res) {
		if (mongo.qry === undefined) { return res('Must define record to delete')}
		var connectionStr = '';
		if (envVar == 'production') {
			connectionStr = "mongodb://" + me[envVar].username + ":" + me[envVar].password + "@" + me[envVar].host + ":" + me[envVar].port + "/" + me[envVar].api_db_name;
		} else {
			connectionStr = "mongodb://" + me[envVar].host + ":" + me[envVar].port + "/" + me[envVar].api_db_name;
		}
		mongoClient.connect(connectionStr, function(err, db) {
			if (err) { return res('mongo connect err: ' + JSON.stringify(err), null); }
			db.collection(mongo.collection).remove(mongo.qry, function(err, docs) {
				db.close();
				res(err, docs);
			});
		});
	},
	insert: function(mongo, res){
		var connectionStr = '';
		if (envVar == 'production') {
			connectionStr = "mongodb://" + me[envVar].username + ":" + me[envVar].password + "@" + me[envVar].host + ":" + me[envVar].port + "/" + me[envVar].api_db_name;
		} else {
			connectionStr = "mongodb://" + me[envVar].host + ":" + me[envVar].port + "/" + me[envVar].api_db_name;
		}

		mongoClient.connect(connectionStr, function(err, db){
			db.collection(mongo.collection).insert(mongo.qry, function(err, result){
				db.close();
				var r;
				console.log(err);
				if(err){
					res(err);
				}else{
					r = {
						result: result[0]
					};
					res(err, r);
				}
			});
		});
	},
	update: function(data, res){
		var connectionStr = '';
		// var BSON = Mongo.BSONPure;
		// var objectId = new BSON.ObjectID(data.qry.Id);
		if (envVar == 'production') {
			connectionStr = "mongodb://" + me[envVar].username + ":" + me[envVar].password + "@" + me[envVar].host + ":" + me[envVar].port + "/" + me[envVar].api_db_name;
		} else {
			connectionStr = "mongodb://" + me[envVar].host + ":" + me[envVar].port + "/" + me[envVar].api_db_name;
		}
		mongoClient.connect(connectionStr, function(err, db){
			//console.log(data);
			db.collection(data.collection).update(data.qry.condition, {$set: data.qry.values},{'multi':true,'upsert':false}, function(err, result){
				db.close();
				var r;
				if(err){
					res(err);
				}else{
					if (result < 1) err = 'Mongo Record Not Updated.';
					r = {};
					res(err, r);
				}
			});
		});
	}
};

var ctPool = {
	query: function(qry,res){
		console.log('Query: ' + qry);
		//var client = new pg.Client(ctConString);
		pg.connect(ctConString, function(err, client, done) {
			if (err) {
				console.log('Could not connect to postgress: ' + err);
				res(err);
				return;
			}
			client.query(qry, function(err, result) {
				if (err) {
					console.log('Query error.',err);
					res('Query error in ctPool.');
				}
				else {
					res(err, result.rows);
				}
				done();
			});
		});
	},
	insert: function(data, res){
		var qry = queryBuilder('insert', data);
		//var client = new pg.Client(ctConString);
		pg.connect(ctConString, function(err, client, done) {
			if (err) {
				console.log('Could not connect to postgress: ' + err);
				res(err);
				return;
			}
			client.query(qry, function(err, result) {
				if (err) {
					console.log('Query Insert error for qry: ' + qry + ' ERROR: '+ err);
				}
				var r = {};
				if (result && result.fields.length > 0) {
					var primary_key = result.fields[0].name;
					r = {
						insertId: result.rows[0][primary_key]
					};
				}
				res(err, r);
				done();
			});
		});
	},
	update: function(data, res){
		var qry = queryBuilder('update', data);
		console.log('Update: ' + qry);
		//var client = new pg.Client(ctConString);
		pg.connect(ctConString, function(err, client, done) {
			if (err) {
				console.log('Could not connect to postgress: ' + err);
				res(err);
				return;
			}
			client.query(qry, function(err, result) {

				if (err) {
					console.log('Query Update error.');
				}
				res(err, result);
				done();
			});
		});
	},
};

var userPermissionQuery = {
	query: function(qry,res){
		//var client = new pg.Client(ctConString);
		pg.connect(ctConString, function(err, client, done) {
			if (err) {
				console.log('Could not connect to postgress: ' + err);
				res(err);
				return;
			}
			client.query(qry, function(err, result) {
				if (err) {
					console.log('Query error.',err);
					res('Query error in ctPool.');
				}
				else {
					res(err, result.rows);
				}
				done();
			});
		});
	},
	insert: function(data, res){
		var qry = queryBuilder('insert', data);
		//var client = new pg.Client(ctConString);
		pg.connect(ctConString, function(err, client, done) {
			if (err) {
				console.log('Could not connect to postgress: ' + err);
				res(err);
				return;
			}
			client.query(qry, function(err, result) {
				if (err) {
					console.log('Query Insert error for qry: ' + qry);
				}
				var r = {};
				if (result && result.fields.length > 0) {
					var primary_key = result.fields[0].name;
					r = {
						insertId: result.rows[0][primary_key]
					};
				}
				res(err, r);
				done();
			});
		});
	}
};

var csPool = {
	query: function(qry,res){
		console.log('Query: ' + qry);
		//var client = new pg.Client(ctConString);
		pg.connect(csConString, function(err, client, done) {
			if (err) {
				console.log('Could not connect to postgress: ' + err);
				res(err);
				return;
			}
			client.query(qry, function(err, result) {
				if (err) {
					console.log('Query error.',err);
					res('Query error in ctPool.');
				}
				else {
					res(err, result.rows);
				}
				done();
			});
		});
	},
	insert: function(data, res){
		var qry = queryBuilder('insert', data);
		console.log('Insert: ' + qry);
		//var client = new pg.Client(ctConString);
		pg.connect(csConString, function(err, client, done) {
			if (err) {
				console.log('Could not connect to postgress: ' + err);
				res(err);
				return;
			}
			client.query(qry, function(err, result) {
				if (err) {
					console.log('Query Insert error.');
				}
				var r = {};
				if (result && result.fields.length > 0) {
					var primary_key = result.fields[0].name;
					r = {
						insertId: result.rows[0][primary_key]
					};
				}
				res(err, r);
				done();
			});
		});
	},
	update: function(data, res){
		var qry = queryBuilder('update', data);
		console.log('Update: ' + qry);
		//var client = new pg.Client(ctConString);
		pg.connect(csConString, function(err, client, done) {
			if (err) {
				console.log('Could not connect to postgress: ' + err);
				res(err);
				return;
			}
			client.query(qry, function(err, result) {

				if (err) {
					console.log('Query Update error.');
				}
				res(err, result);
				done();
			});
		});
	},
};

var cePool = {
	query: function(qry,res){
		console.log('Call Engine Query: ' + qry);
		ceConnectionPool.getConnection(function(err, connection) {
			// if (err) {
			// 	console.log('Call Engine connection error: '+err);
			// 	res(err);
			// 	return;
			// }
			connection.query(qry, function(err, rows, fields) {
				if (err) {
					console.log('Query error: ' + err);
					res(err);
				}
				connection.release();
				res(err, rows);
			});
		});
	},
	insert: function(data, res){
		var qry = queryBuilder('insert', data);
		console.log('Call Engine Insert: ' + qry);
		ceConnectionPool.getConnection(function(err, connection) {
			if (err) {
				console.log('Ce Connection error: ' + err);
			}
			connection.query(qry, function(err, rows, fields) {
				if (err) {
					console.log('Query error: ' + err);
					res(err);
				} else {
					res(null, rows);
				}
				connection.release();

			});
		});
	},
	update: function(data, res){
		var qry = queryBuilder('update', data);
		console.log('Call Engine Update: ' + qry);
		ceConnectionPool.getConnection(function(err, connection) {
			connection.query(qry, function(err, rows, fields) {
				if (err) {
					console.log('Query error: ' + err);
					res(err);
				}
				connection.release();
				res(err, rows);
			});
		});
	},
	delete: function(table, id, res){
		var qry = "DELETE FROM " + table + " WHERE id = " + id + " LIMIT 1";
		console.log('Call Engine Delete: ' + qry);
		ceConnectionPool.getConnection(function(err, connection) {
			connection.query(qry, function(err, rows, fields) {
				if (err) {
					console.log('Query error: ' + err);
					res(err);
				}
				connection.release();
				res(null, rows);
			});
		});
	}
};


module.exports = {
	ctPool: ctPool,
	cePool: cePool,
	csPool: csPool,
	mongoPool: mongoPool,
	userPermissionQuery: userPermissionQuery
};

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
				var val = data.values[key];

				if (val === 'CURRENT_TIMESTAMP' || val === 'NOW()' || val === 'NOT NULL') {
					values += val;
				} else if (val === '' || val === 'null' || val === 'NULL' || val === null) {
					values += 'NULL';
				} else if (typeof val === 'string') {
					if (val.indexOf("'") >= 0) {
						val = val.replace(/'/g, "''"); // escape single quotes
					}
					values += "'" + val + "'";
				} else {
					values += val;
				}
				if (count < Object.keys(data.values).length) {
					values += ",";
				}
			}
			qry = "INSERT INTO " + data.table + " (" + fields.join(',') + ") VALUES (" + values + ")";
		break;

		case 'update':
			var set = [];
			for (var field in data.values) {
				if (field === data.table + '_id' || field === 'id') { continue; } // skip primary key
				var val = data.values[field];
				var str = field + " = ";
				if (typeof val === 'string') {
					if (val === 'CURRENT_TIMESTAMP' || val === 'NOW()' || val === 'NOT NULL') {
						str += val;
					} else if (val === '' || val === 'null' || val === 'NULL' || val === null) {
						str += 'NULL';
					} else {
						if ((val).indexOf("\'") > -1) {
							val = (val).replace(/\'/g, "''"); // escape single quotes
						} else if ((val).indexOf("'") > -1) {
							val = (val).replace(/'/g, "''"); // escape single quotes
						}
						str += "'"+val+"'";
					}
				} else {
					str += val;
				}
				set.push(str);
			}
			qry = "UPDATE " +  data.table + " SET " + set.join(',')+(data.where ? data.where : " WHERE " + data.table + "_id = " + data.values[data.table + '_id']);
		break;
	}
	return qry;
}
