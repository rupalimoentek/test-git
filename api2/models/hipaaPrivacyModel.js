/**
 * Created by davey on 3/31/15.
 */
var appModel = require('./appModel'),
	async = require('async'),
	ctTransactionModel = require('./ctTransactionModel');

var hipaaPrivacy = {
	getHipaaPrivacy: function (req, res) {
				if(req.params.ouid === undefined){return res('please specify ouid');}
				var org_unit_parent_id;
							async.waterfall([
								function(callback){
									var query = "SELECT org_unit_parent_id from org_unit WHERE org_unit_id = "+req.params.ouid;
									appModel.ctPool.query(query, function (err, ous) {
											if (err) {return callback(err);}
											if(ous.length < 1){return callback("inValid Ou Od");}
											org_unit_parent_id = ous[0].org_unit_parent_id;
											callback(null);
										});
								},
								function(callback){
									var query = "SELECT og.protect_caller_id, ob.data_append, od.* from org_unit og JOIN org_data_append_setting od ON(og.org_unit_id = od.org_unit_id) JOIN org_billing ob ON(ob.org_unit_id = og.billing_id)  WHERE og.org_unit_id = "+req.params.ouid;
									appModel.ctPool.query(query, function (err, hipaaRecord) {
											if (err) {return callback(err);}
											callback(null,hipaaRecord);
										});
								},
								function(data,callback){
									if(data.length < 1){
										var query = "SELECT og.protect_caller_id, ob.data_append, od.* from org_unit og JOIN org_data_append_setting od ON(og.org_unit_parent_id = od.org_unit_id) JOIN org_billing ob ON(ob.org_unit_id = og.billing_id)  WHERE og.org_unit_id = "+req.params.ouid;
										appModel.ctPool.query(query, function (err, hipaaRecord) {
												if (err) {return callback(err);}
												callback(null,hipaaRecord);
											});
									}else {
										callback(null,data);
									}
								},
								function(data,callback){
									if(data.length < 1){
										var query = "INSERT INTO org_data_append_setting (org_unit_id,is_caller_name,is_company_name,is_address,is_city,is_state,is_zip,is_line_type)";
												query	+="VALUES("+req.params.ouid+",true,true,true,true,true,true,true)";
										appModel.ctPool.query(query, function (err) {
												if (err) {return callback(err);}
												callback(null,data);
										});
									}else{
										callback(null,data);
									}
								},
								function(data,callback){
									if(data.length < 1){
										var query = "SELECT og.protect_caller_id, ob.data_append, od.* from org_unit og JOIN org_data_append_setting od ON(og.top_ou_id = od.org_unit_id) JOIN org_billing ob ON(ob.org_unit_id = og.top_ou_id)  WHERE og.org_unit_id = "+req.params.ouid;
										appModel.ctPool.query(query, function (err, hipaaRecord) {
												if (err) {return callback(err);}
												callback(null,hipaaRecord);
											});
									}else {
										callback(null,data);
									}
								}
							], function (err, result) {
								if (err) {return res(err);}
								res(null,result);
							});
		},
	setHipaaPrivacy: function (req, res) {
		if(req.body.org_unit_id === undefined){ return res("please provide ouid.");}
		var hipaaSettings = req.body;
		var isPresent = false;
		async.waterfall([
			function(callback){
				var query = "SELECT * from org_data_append_setting WHERE org_unit_id = "+hipaaSettings.org_unit_id;
				appModel.ctPool.query(query, function (err, setting) {
						if (err) {return callback(err);}
						if(setting.length > 0){
							isPresent = true;
						}
						callback(null);
					});
			},
			function(callback){
				if(isPresent){
					var updateData = {
						table :'org_data_append_setting',
						values: hipaaSettings,
						where :" WHERE org_unit_id =" + hipaaSettings.org_unit_id
					};
					appModel.ctPool.update(updateData, function (err, ret) {
						if (err) { return callback(err);} else { callback(null); }
					});
				}else {
					callback(null);
				}
			},
			function(callback){
				if(!isPresent){
					var insertData = {
						table :'org_data_append_setting',
						values: hipaaSettings
					};
					appModel.ctPool.insert(insertData, function (err, ret) {
						if (err) { return callback(err); } else { callback(null); }
					});
				}else {
					callback(null);
				}
			}
		], function (err) {
			if (err) {return res(err);}
			res(null,true);
		});



	},
	setHipaaProtection: function (req, res) {
		if(req.body.org_unit_id === undefined){ return res("please provide ouid.");}
		var hipaaSettings = req.body;
		var updateData = {
			table :'org_unit',
			values: hipaaSettings,
			where :" WHERE org_unit_id =" + hipaaSettings.org_unit_id
		};
		appModel.ctPool.update(updateData, function (err, ret) {
			if (err) { res(err); } else { res(null, ret); }
		});
	}
};

module.exports = hipaaPrivacy;
