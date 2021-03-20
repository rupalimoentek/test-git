var appModel = require('./appModel'),
	fs = require("fs"),
	envVar = process.env.NODE_ENV,
	me = yaml.load(fs.readFileSync("config/mongodb.yml"));

var dniLog = {
	getById: function(id, res){
		var ObjectID = require('mongodb').ObjectID;
		var obj_id = new ObjectID(id);
		var mongo = {
			"qry" : {
				"_id" : obj_id
			},
			"projection" : {
				"data.session_id" : 1,
				"data.custom_params" : 1,
				"data.ref_param" : 1,
				"data.referring" : 1,
				"data.referring_type" : 1,
				"data.ip_host" : 1,
				"data.search_words" : 1,
				"data.first_page" : 1,
				"data.last_page" : 1,
				"data.location_details.city" : 1,
				"data.location_details.region_code" : 1
			},
			"collection" : "ct_dni_logs"
		};
		appModel.mongoPool.query(mongo, function(err, data){
			if (err){
				res(err);
				return;
			}
			res(null, data[0]);
		});
	},
	getByIds: function(ids, res){
		var ObjectID = require('mongodb').ObjectID;
		var obj_ids = [];
		for (var i = ids.length - 1; i >= 0; i--) {
			obj_ids.push(new ObjectID(ids[i]));
		}
		var mongo = {
			"qry" : {
				"_id" : {
					$in: obj_ids
				}
			},
			"projection" : {
				"data.browser" : 1,
				"data.created_at" : 1,
				"data.custom_params" : 1,
				"data.first_page" : 1,
				"data.ip_host" : 1,
				"data.last_page" : 1,
				"data.location_details" : 1,
				"data.log_date" : 1,
				"data.ref_param" : 1,
				"data.referring" : 1,
				"data.referring_type" : 1,
				"data.search_words" : 1,
				"data.session_id" : 1,
				"data.updated_at" : 1
			},
			"collection" : "ct_dni_logs"
		};
		appModel.mongoPool.query(mongo, function(err, data){
			if (err){
				res(err);
				return;
			}
			res(null, data);
		});
	},
	getPhoneDetailsByKeyValue: function(key,value,res){
		var mongo = {
			qry:{},
			projection:{"data" : 1},
			collection: 'ct_dni_logs'
		};
		mongo.qry['data.'+key] = value;
		mongo.projection = {
			"data.phone_number_details" : 1
		}
		appModel.mongoPool.query(mongo, function(err,data){
			res(err,data);
		});
	},
	custom: function(qry,projection, res){
		var mongo = {
			qry: qry,
			projection: projection,
			collection: 'ct_dni_logs'
		};

		appModel.mongoPool.query(mongo, function(err,data){
			res(err,data);
		});
	}
};

module.exports = dniLog;
