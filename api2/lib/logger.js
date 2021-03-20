var connector = require('./appModel'),
    f = require('../functions/functions.js');

var ctlogger = {
	/* NOTE:
		data => { key: val } of all data
		action => insert / update / delete
		logsrc => which table to log to (ex. user, campaign)
		note => optional note that can be any text
	*/
	log: function(data, action, logsrc, note, res) {
		var stamp = f.mysqlTimestamp();
		var newdata = { 'log_date':stamp, logsrc + '_id':data[ logsrc + '_id' ] }; // set timestamp and default pri key for log
		// set optional PostgreSQL column data
		if (data.ct_user_id) {
			newdata['ct_user_id'] = data.ct_user_id;
		};
		if (data.org_unit_id) {
			newdata['org_unit_id'] = data.org_unit_id;
		};
		// set the flat json data to be saved
		var json = {
			'created': stamp,
			'ct_user_id': (data.ct_user_id ? data.ct_user_id : ''),
			'org_unit_id': (data.org_unit_id ? data.org_unit_id : ''),
			'action': action,
			'fields': data,
			'note': note
		};
		newdata['data'] = JSON.stringify(json);
		console.log('logging data');
		console.log(JSON.stringify(newdata));

		// prepare the query to be executed
		var field = [];
		var value = [];
		Object.keys(newdata).forEach(function(key) { // cycle through hash to set fields
			field.push(key);
			value.push("'" + newdata[key] + "'");
		});
		var query = 'INSERT INTO log_' + logsrc + '(' + field.join(',') + ') VALUES(' + value.join(',') + ')';
		console.log('SQL: ' + query);
		appModel.ctPool.query(qry, function(err, data) {
			if (err) { res(false); } else { res(true); }
		});
	}
}

module.exports = ctlogger;