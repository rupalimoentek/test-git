var connector = require('../models/appModel'),
	moment = require('moment'),
    f = require('../functions/functions.js');
	var token = require('../lib/token');

var ctlogger = {
	/* NOTE:
		data => { key: val } of all data
		action => insert / update / delete
		logsrc => which table to log to (ex. user, campaign)
		note => optional note that can be any text
	*/
	log: function(data, action, logsrc, note, res, oauthToken) {
		//console.log('action: ' + action + ' logsrc: ' + logsrc + ' note: ' + note);

		var newdata = { 'log_date':'CURRENT_TIMESTAMP' }; // set timestamp
		if(data.created_by){
			newdata.created_by = data.created_by;
			delete data.created_by;
		}

		if(data.updated_by){
			newdata.updated_by = data.updated_by;
			delete data.updated_by;
		}

		if (logsrc !== 'user' && data[logsrc + '_id']) {
			newdata[logsrc + '_id'] = data[logsrc + '_id']; // default pri key for log
		}
		// set optional PostgreSQL column data
		if (data.ct_user_id) { newdata.ct_user_id = data.ct_user_id; }
		if (data.org_unit_id) { newdata.org_unit_id = data.org_unit_id; }
		// set the flat json data to be saved
		var json = {
			'created': moment().format('YYYY-MM-DD HH:mm:ss z'),
			'ct_user_id': (data.ct_user_id ? data.ct_user_id : ''),
			'org_unit_id': (data.org_unit_id ? data.org_unit_id : ''),
			'action': action,
			'fields': data,
			'note': note
		};
		newdata.log_data = JSON.stringify(json);

		var supportAdminData = null;
		getSupportAdminTokenData(oauthToken, function(result){
			supportAdminData = result;
			data.ct_user_id = supportAdminData === null ? (data.ct_user_id  ? newdata.ct_user_id = data.ct_user_id : ''): supportAdminData.user_id;
			newdata.ct_user_id = supportAdminData === null ? newdata.ct_user_id  : supportAdminData.user_id;
			data.org_unit_id =  supportAdminData === null ? (data.org_unit_id ? newdata.org_unit_id = data.org_unit_id : '' ): supportAdminData.org_unit_id;
			// set the flat json data to be saved
			var json = {
				'created': moment().format('YYYY-MM-DD HH:mm:ss z'),
				'ct_user_id': data.ct_user_id ,
				'org_unit_id': data.org_unit_id,
				'action': action,
				'fields': data,
				'note': note
			};
			newdata.log_data = JSON.stringify(json);
			var insertData = {
				table : 'log_' + logsrc,
				values: newdata
			};
			connector.ctPool.insert(insertData, function(err, data) {
				if (err) { return err; } else { return true; }
			});
		});
	}
};

getSupportAdminTokenData = function(oauthToken, callback) {
	var responseData = {};
	if(oauthToken !== "" && oauthToken !== undefined) {
		oauthToken = oauthToken.split(" ")[1];
		token.findAccess(oauthToken, function(err, data) {
			if(data.data.support_token !== undefined)
			{
				token.findAccess(data.data.support_token, function(err, data) {
					if(err)
						callback(null);
					else{		
						var responseData = {
							user_id : data.data.user_id,
							org_unit_id : data.data.ou_id
						}
						//console.log("responseData",responseData);	
						callback(responseData);
					}
				});
			}	
			else{
				callback(null);
			}
		});
	} else {

		callback(null);
	}
}


module.exports = ctlogger;
