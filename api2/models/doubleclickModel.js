/**
 * Created by davey on 4/24/15.
 */
var appModel = require('./appModel'),
	f       = require('../functions/functions.js'),
	fs      = require("fs"),
    yaml    = require("js-yaml"),
	e       = yaml.load(fs.readFileSync("config/database.yml")),
	async   = require('async'),
	_       = require('underscore');

var doubleclick = {
	profile: function(ouid, res) {
		if (!isNaN(ouid)) {
			var qry = "SELECT * FROM org_doubleclick WHERE org_unit_id=" + ouid+" limit 1";
			appModel.ctPool.query(qry, function(err, data) {
				if (err) { res('Failed to retrieve DoubleClick profile settings'); return; }

				if(data.length !== 0) {
					// get static parameters
					qry = "SELECT m.dc_map_id, m.map_id, m.floodlight_var, d.map_type, d.metric_display ";
					qry += "FROM org_dc_map m, doubleclick_mapping d WHERE m.doubleclick_id=" + data[0].doubleclick_id + " AND m.map_id=d.map_id";
					appModel.ctPool.query(qry, function (err, data2) {
						if (err) { res('Failed to retrieve DoubleClick metric mapping'); return; }
						data[0]['mapping'] = data2;
						res(null, data);
					});
				} else {
					res("no double click present");
				}
			});
		} else {
			res('Invalid Organization Group ID submitted');
		}
	},
	create: function(data, res) {
		//data.dc_active = 'true';
		var insertData = {
			table :'org_doubleclick',
			values:data
		};
		appModel.ctPool.insert(insertData, function (err, ret) {
			if (err) { res('Failed to insert new DoubleClick profile'); } else { res(null, ret); }
		});
	},
	update: function(data, res) {
		var updateData = {
			table :'org_doubleclick',
			values:data,
			where :" WHERE doubleclick_id=" + data.doubleclick_id
		};
		console.log(updateData);
		appModel.ctPool.update(updateData, function (err, ret) {
			if (err) { res(err); } else { res(null, ret); }
		});
	},
	createMap: function(data, res) {
		if (!data.map_id || !data.doubleclick_id) { return res('Missing doubleclick_id and/or map_id'); }
		var insertData = {
			table :'org_dc_map',
			values:data
		};
		var qry = "SELECT * FROM org_dc_map WHERE map_id=" + data.map_id +" AND doubleclick_id = "+ data.doubleclick_id;
		appModel.ctPool.query(qry, function(err, data) {
			if (err) { res('Failed to retrieve DoubleClick profile settings'); return; }
			if(data.length > 0) {
				res('Cannot insert Duplicate record.');
			} else {
		appModel.ctPool.insert(insertData, function (err, ret) {
			if (err) { res(err); } else { res(null, ret); }
				});
			}
		});
	},
	updateMap: function(data, res) {
		if (!data.dc_map_id) { return res('Missing required dc_map_id value'); }
		var updateData = {
			table :'org_dc_map',
			values:data,
			where :" WHERE dc_map_id=" + data.dc_map_id
		};
		appModel.ctPool.update(updateData, function (err, ret) {
			if (err) { res(err); } else { res(null, ret); }
		});
	},
	dropMap: function(dcid, mapid, res) {
		if (!dcid || !mapid) { return res('missing required key identifier doubleclick_id or map_id'); }
		var qry = "DELETE FROM org_dc_map WHERE dc_map_id=" + mapid + " AND doubleclick_id=" + dcid;
		appModel.ctPool.query(qry, function (err, ret) {
			if (err) { res(err); } else { res(null, ret); }
		});
	},
	metricList: function(res) {
		var qry = "SELECT * FROM doubleclick_mapping";
		appModel.ctPool.query(qry, function (err, data) {
			if (err) { return res(err); }
			var ret = { 'metric':[], 'dimension':[] };
			_.each(data, function(val, key) {
				ret[val.map_type].push({ "map_id":val.map_id, "metric_display":val.metric_display });
			});
			console.log(ret);
			res(null, ret);
		});
	},
	varList: function (res) {
		var qry = "SELECT map_id, metric_display, map_type, indicator_id FROM doubleclick_mapping";
		appModel.ctPool.query(qry, function (err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	},
	callAction: function(ouid, res) {
		var qry = "SELECT dc_active, all_call, doubleclick_id FROM org_doubleclick WHERE org_unit_id=" + ouid+" limit 1";
		var result;
		appModel.ctPool.query(qry, function (err, self) {
			if (err) { return res("Failed to lookup DoubleClick settings. " + err); }
			if(self.length !== 0){
				if(self[0].dc_active === false) {
					result = {'dc_enabled' : false};
				} else if(self[0].all_call === false) {
					result = {'dc_enabled' : true, 'doubleclick_id': self[0].doubleclick_id};
				}
			} else {
				result = {'dc_enabled' : false};
			}
			res(null, result);
		});
	}
};

module.exports = doubleclick;