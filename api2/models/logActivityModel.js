"use strict";

var connector = require('./appModel'),
    async = require('async'),
	_ = require('underscore');


/*
	NOTE: this previously used the offset to grab the correct record set, but has been adjusted to use the 'begin' that forces the record set to start at the offset is set right
 */
var logActivity = {
	stream: function(body, res) {
		if (body.org_unit_id === null || body.org_unit_id === undefined) { return res('No Org Unit ID specified'); }
		if (!body.start_date || !body.end_date) { return res('Missing a start and/or end timestamp'); }

		// list of log files to query against
		var dblist = ['log_billing', 'log_campaign', 'log_call_action', 'log_call_flow', 'log_integration', 'log_ivr', 'log_tag', 'log_user', 'log_webhook', 'log_distribution_list','log_schedule'];
		if (body.log) { dblist = [body.log]; } // change to just the one section
		var qrylist = [];
		var limit = (body.limit ? body.limit : 25);
		var offset = (body.offset ? body.offset : 0);
		var zone = (body.timezone ? body.timezone : 'EST');

        var qry;
		//for (var n = 0; n < dblist.length; n++) {
		_.each(dblist, function(db) {
			//console.log('currently processing ' + n + ' -- ' + dblist[n]);
			qry = "(SELECT '" + db +"' AS log_name, l.org_unit_id, l.ct_user_id, TO_CHAR(l.log_date AT TIME ZONE '" + zone + "', 'YYYY-MM-DD HH:MI:SS AM') as timezone, EXTRACT(EPOCH FROM l.log_date) as epotm, l.log_data, " +
					"to_char(l.log_date, 'YYYYMMDDHHMISS.US') AS date, o.org_unit_name, u.first_name, u.last_name, u.username FROM " + db + " l " +
				"LEFT JOIN org_unit o ON (l.org_unit_id=o.org_unit_id) LEFT JOIN ct_user u ON (l.ct_user_id=u.ct_user_id AND l.ct_user_id IS NOT NULL) " +
				"WHERE l.org_unit_id=" + body.org_unit_id + " AND l.log_date BETWEEN '" + body.start_date + " " + zone + "' AND '" + body.end_date + " " + zone + "'";
			if (body.ct_user_id) { qry += " AND l.ct_user_id=" + body.ct_user_id; }
			qry += " ORDER BY epotm DESC LIMIT " + (offset ? (offset / limit) * limit : limit);
			if (dblist.length < 2) { qry += " OFFSET " + offset; }
			qry += ")";
			qrylist.push(qry);
		});

		qry = qrylist.join(" UNION ALL ");
		connector.ctPool.query(qry, function(err, data) {
			if (err) { res(err); return; }
			if (dblist.length < 2) { res(null, data); } // just return the data for only one log record

			// sort the data set by date
			var dataret = _.sortBy(data, 'epotm').reverse();
			if(body.last_date) {
				var ret = []; 
				_.each(dataret, function(retdt) {
					if(retdt.epotm < body.last_date && retdt.epotm != body.last_date)
						ret.push(retdt)
		});
			} else {
				var ret =  dataret;
	}

			res(null, ret.slice(offset, offset+limit));
		});
	}
	// pretty much the same as 'stream' only this is for a specific log record 'logname' (exclude the prefix of 'log_')

	/* NOTE: this should be depricated as the above function is capable of doing things by section
	getSection: function(body, logname, res) {
		//data is not defined so I set data = req.
		if (!body.org_unit_id) { res('No Org Unit ID specified'); }
		if (!body.start_date || !body.end_date) { res('Missing a start and/or end timestamp'); }
		var limit = (body.limit ? body.limit : 5);
		var offset = (body.offset ? body.offset : 0);
		var zone = (body.timezone ? body.timezone : 'EST');
		// use the "begin" start time if provided, which will automatically adjust the offset to be the beginning
		if (body.begin !== undefined) {
			body.start_date = body.begin;
			offset = 0;
		}
        var qry = "SELECT '" + logname +"' AS log_name, l.org_unit_id, l.ct_user_id, TO_CHAR(l.log_date AT TIME ZONE '" + zone + "', 'YYYY-MM-DD HH:MI:SS.MS') AS log_date, l.log_data, " +
				"to_char(l.log_date, 'YYYYMMDDHHMISS.MS') AS date, o.org_unit_name, u.first_name, u.last_name, u.username FROM " + logname + " l " +
				"LEFT JOIN org_unit o ON (l.org_unit_id=o.org_unit_id) LEFT JOIN ct_user u ON (l.ct_user_id=u.ct_user_id AND l.ct_user_id IS NOT NULL) " +
				"WHERE l.org_unit_id=" + body.org_unit_id + " AND l.log_date BETWEEN '" + body.start_date + " " + zone + "' AND '" + body.end_date + " " + zone + "'";
		if (body.ct_user_id) { qry += " AND l.ct_user_id=" + body.ct_user_id; }
		qry += " ORDER BY l.log_date DESC LIMIT " + limit + " OFFSET " + offset;

		connector.ctPool.query(qry, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	}
	*/
};

module.exports = logActivity;