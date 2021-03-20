/**
 * Created by davey on 3/31/15.
 */
var appModel = require('./appModel'),
	async = require('async'),
	userModel = require('../models/ctUserModel'),
	ctTransactionModel = require('./ctTransactionModel');

var callerPrivacy = {
	getCallerPrivacy: function (req, res) {
		if(req.params.ouid === undefined){return res('please specify ouid');}
		var org_unit_parent_id;
			async.waterfall([
				function(callback){
					var query = "SELECT og.protect_caller_id, ob.data_append, od.* from org_unit og JOIN org_data_append_setting od ON(og.org_unit_id = od.org_unit_id) JOIN org_billing ob ON(ob.org_unit_id = og.billing_id)  WHERE og.org_unit_id = "+req.params.ouid;
					appModel.ctPool.query(query, function (err, callerRecord) {
							if (err) {return callback(err);}
							callback(null,callerRecord);
						});
				},
				function(data,callback){
					if(data.length < 1){
						var query = "SELECT og.protect_caller_id, ob.data_append, od.* from org_unit og JOIN org_data_append_setting od ON(og.org_unit_parent_id = od.org_unit_id) JOIN org_billing ob ON(ob.org_unit_id = og.billing_id)  WHERE og.org_unit_id = "+req.params.ouid;
						appModel.ctPool.query(query, function (err, callerRecord) {
								if (err) {return callback(err);}
								callback(null,callerRecord);
							});
					}else {
						callback(null,data);
					}
				},
				function(data,callback){
					if(data.length < 1){
						var query = "SELECT og.protect_caller_id, ob.data_append, od.* from org_unit og JOIN org_data_append_setting od ON(og.top_ou_id = od.org_unit_id) JOIN org_billing ob ON(ob.org_unit_id = og.top_ou_id)  WHERE og.org_unit_id = "+req.params.ouid;
						appModel.ctPool.query(query, function (err, callerRecord) {
								if (err) {return callback(err);}
								callback(null,callerRecord);
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
						var query = "SELECT og.protect_caller_id, ob.data_append, od.* from org_unit og JOIN org_data_append_setting od ON(og.org_unit_id = od.org_unit_id) JOIN org_billing ob ON(ob.org_unit_id = og.top_ou_id)  WHERE og.org_unit_id = "+req.params.ouid;
						appModel.ctPool.query(query, function (err, callerRecord) {
								if (err) {return callback(err);}
								callback(null,callerRecord);
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
	setCallerPrivacy: function (req, res) {
		if(req.body.org_unit_id === undefined){ return res("please provide ouid.");}
		var callerSettings = req.body;
		var isPresent = false;
		async.waterfall([
			function(callback){
				var query = "SELECT * from org_data_append_setting WHERE org_unit_id = "+callerSettings.org_unit_id;
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
						values: callerSettings,
						where :" WHERE org_unit_id =" + callerSettings.org_unit_id
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
						values: callerSettings
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
	setCallerProtection: function (req, res) {
		if(req.body.org_unit_id === undefined){ return res("please provide ouid.");}
		var callerSettings = req.body;
		var updateData = {
			table :'org_unit',
			values: callerSettings,
			where :" WHERE org_unit_id =" + callerSettings.org_unit_id
		};
		appModel.ctPool.update(updateData, function (err, ret) {
			if (err) { res(err);
			} else {
				userModel.getProtectCallerIdByOuId(callerSettings.org_unit_id, function(err, proCallerData){
					var result = {
						protect_caller_id : proCallerData.protect_caller_id
					}
					//ctData[0].protect_caller_id = proCallerData.protect_caller_id;
					res(null, result);
				});
			}
		});
	},
	setDownloadAudioSetting: function (req, res) {
		if(req.body.org_unit_id === undefined){ return res("please provide ouid.");}
		var downloadAudioSetting = req.body;
		var isPresent = false;
		async.waterfall([
			function(callback){
				var query = "SELECT * from org_data_append_setting WHERE org_unit_id = "+downloadAudioSetting.org_unit_id;
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
						values: downloadAudioSetting,
						where :" WHERE org_unit_id =" + downloadAudioSetting.org_unit_id
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
						values: downloadAudioSetting
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
	getDownloadAudioSettingByCallId: function (callId, callback) {
		var query = "SELECT dou.download_audio_enabled as org_das, " 
		query += "tou.download_audio_enabled as top_das, pou.download_audio_enabled as parent_das FROM org_unit ou "
		query += "LEFT JOIN org_data_append_setting tou ON (tou.org_unit_id = ou.top_ou_id) "
		query += "LEFT JOIN org_data_append_setting pou ON (pou.org_unit_id = ou.org_unit_parent_id) " 
		query += "LEFT JOIN org_data_append_setting dou ON (dou.org_unit_id = ou.org_unit_id) " 
		query += "JOIN call c ON (c.org_unit_id = ou.org_unit_id) "
		query += "WHERE c.call_id ="+callId;
		appModel.ctPool.query(query, function (err, data) {
			if (err) {
                callback(null, true);
            } else {
                console.log('Retrieved Settings: ', data);
                if (data && data.length > 0) {
                    if (data[0].org_das !== null) {
                        callback(null, data[0].org_das);
                    } else if (data[0].parent_das !== null) {
                        callback(null, data[0].parent_das);
                    } else if (data[0].top_das !== null) {
                        callback(null, data[0].top_das);
                    } else {
                        callback(null, true);
                    }
                }
            }
		});
	}
};

module.exports = callerPrivacy;
