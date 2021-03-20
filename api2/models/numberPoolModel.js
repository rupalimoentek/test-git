var connector = require('./appModel'),
	envVar = process.env.NODE_ENV,
	yaml = require("js-yaml"),
	fs = require("fs"),
	me = yaml.load(fs.readFileSync("config/mongodb.yml"));
var mongo = {
	read: function(pool_qry, projection, res){
		var mongo = {
			dbName: me[envVar].api_db_name,
			collection: 'phone_number_pools',
			qry: pool_qry,
			projection: projection
		};
		if(pool_qry['app_id'] === undefined) {
			pool_qry['app_id'] = 'CT';
		}
		connector.mongoPool.query(mongo, function(err, data){
			res(err,data);
		});
	},
	read_last_pool: function(res){
		var mongo = {
			dbName: me[envVar].api_db_name,
			collection: 'phone_number_pools',
			sort: {
				"pool_id": -1
			},
			limit: 1
		};
		connector.mongoPool.query(mongo, function(err, data){
			res(err,data);
		});
	},
	write: function(poolData, res){
		var mongo = {
			dbName: me[envVar].api_db_name,
			collection: 'phone_number_pools',
			qry: poolData
		};
		connector.mongoPool.insert(mongo, function(err, data){
			console.log("Insdide insert ++++ ",data);
			res(err, data);
		});
	},
	update: function(poolData, res){
		var d = {
			dbName: me[envVar].api_db_name,
			collection: 'phone_number_pools',
			qry: poolData
		};
		if(poolData.condition !== undefined && poolData.condition.app_id === undefined) {
			poolData.condition.app_id = 'CT';
		}
		connector.mongoPool.update(d, function(err, data){
			console.log("MONGO ERR" + err);
			console.log("MONGO DATA", data);
			res(err, data);
		});
	}
};

module.exports = mongo;
