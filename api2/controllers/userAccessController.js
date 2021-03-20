var controller = require('./appController'),
	f = require('../functions/functions'),
	async = require('async'),
	appModel = require('../models/appModel'),
	_ = require('underscore');

var userAccess = {
	getAction: function(user_id, res) {
		async.parallel([
		  function(callback) {
		    var qry = "SELECT sc.component_threshold_max, oa.threshold_max, s.scope_code, ra.permission, ra.record_req, "+
		    "c.component_table, c.table_primary_key, occ.count_total "+
		    "FROM scope s, ct_user u,org_account oa "+
		    "LEFT JOIN subscription_component sc ON (oa.subscription_id=sc.subscription_id) " +
		    "LEFT JOIN component c ON (sc.component_id=c.component_id) ,role_access ra " +
		    "LEFT JOIN org_component_count occ ON (ra.component_id=occ.component_id) " +
		    "WHERE u.ct_user_id="+user_id+" AND u.ct_user_ou_id=oa.org_unit_id AND u.role_id=ra.role_id " +
		    "AND ra.component_id=c.component_id AND ra.scope_id=s.scope_id AND (oa.org_unit_id=occ.org_unit_id OR occ.org_unit_id IS NULL) ORDER BY ra.component_id ASC ";
		      appModel.ctPool.query(qry, function(err, data) {
		        if (err) { return callback('Failed to execute query for user permissions'+err); }
		        //console.log('permission query results', data);
		        callback(null,data)
		        });
		  },
		  function(callback) {
		    var qry = "SELECT s.scope_code, cc.component_table AS component_table2,ra.permission, ra.record_req "+
		              ",cc.table_primary_key AS table_primary_key2, occ.count_total	FROM scope s, ct_user u,org_account oa " +
		              "JOIN org_unit ou ON (ou.org_unit_id = oa.org_unit_id)	JOIN org_account obu ON (obu.org_unit_id = ou.billing_id) " +
		              "LEFT JOIN component cc ON (obu.component_id=cc.component_id), role_access ra " +
		              "LEFT JOIN org_component_count occ ON (ra.component_id=occ.component_id) " +
		              "WHERE u.ct_user_id="+user_id+" AND u.ct_user_ou_id=oa.org_unit_id AND u.role_id=ra.role_id "+
		              "AND ra.component_id=cc.component_id	AND ra.scope_id=s.scope_id AND (obu.org_unit_id=occ.org_unit_id OR occ.org_unit_id IS NULL) ORDER BY ra.component_id ASC ";
		      	console.log(qry);
		      appModel.ctPool.query(qry, function(err, data) {
		        if (err) { return callback('Failed to execute query for external user permissions'+err); }
		        //console.log('permission query results', data);

							callback(null,data)
		        });
		  }
		],
		function(err, results) {
			results = [].concat.apply([], results);
			if (err) { return res('Failed to parse permissions' + err); }
			parseAccess(results, function(error, result) {
				if (error) { return res('Failed to parse permissions' + error); }
				//console.log('permissions returned', result);
				res(null, result);
			});
		});
	},
	adminAction: function(user_id, res) {
		var qry = "SELECT ra.permission, s.scope_code FROM ct_user u, role r, role_access ra, scope s WHERE u.ct_user_id=" + user_id +
			" AND u.role_id=r.role_id AND r.role_id=ra.role_id AND ra.scope_id=s.scope_id";
		appModel.ctPool.query(qry, function(err, data) {
			if (err) { return res('Failed to retrieve permissions. ' + err); }
			parseAccess(data, function(error, result) {
				if (error) { return res('Failed to parse permissions' + error); }
				//console.log('permissions returned', result);
				res(null, result);
			});
		});
	},
	// retrieves white label CSS styling for the OUID specified or any parent OU to that OU
	stylingAction: function(ouid, res) {
		// since parents must exist before children, ordering by org_unit_id will automatically control the level hierarchy
		var qry = "SELECT owl.* FROM org_unit o, org_white_label owl WHERE o.org_unit_id="+ouid+" AND " +
				"(o.org_unit_id=owl.org_unit_id OR o.org_unit_parent_id=owl.org_unit_id OR o.top_ou_id=owl.org_unit_id) AND owl.white_label_active=true "+
				"ORDER BY owl.org_unit_id DESC";

		appModel.ctPool.query(qry, function(err, data) {
			if (err) { return res('Failed to execute lookup for custom styling. '+err); }

			if (data.length > 0) {
				// now figure out which logo needs to be used if re-branding is in use
				//whitelabel logo inheritance now works the same as the rest of the whitelabel settings.
				if (data[0] !== undefined && (data[0].org_logo === null || data[0].org_logo === '')) {
					if (data[1] !== undefined && data[1].org_logo !== null && data[1].org_logo !== '' && data[1].white_label_active) {
						data[0].org_logo = data[1].org_logo;
					} else if (data[2] !== undefined && data[2].org_logo !== '' && data[2].white_label_active) {
						data[0].org_logo = data[2].org_logo;
					}
				}
				//console.log('CSS styling', data[0]);
				res(null, data[0]);
			} else {
				res(null, {});
			}
		});
	},
	orgList: function(ouid, res) {
		var qry = "SELECT org_unit_id FROM org_unit WHERE (org_unit_id = " + ouid + " OR org_unit_parent_id = " + ouid + " ";
		qry += " OR org_unit_parent_id IN (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id = " + ouid + " AND org_unit_status='active')) AND org_unit_status='active'";
		//console.log(qry);
		appModel.ctPool.query(qry, function (err, data) {
			if (err) { return res('Failed to retrieve list of authorized org units. ' + err); }
			var ouList = [];
			if (data.length > 0) {
				for (var key in data) {
					ouList.push(data[key].org_unit_id);
				}
			}
			res(null, ouList);
		});
	},
	campaignList: function(userid, ouids, role, res) {
		if (parseInt(role) === 1 || parseInt(role) === 4) {
			var qry = "SELECT campaign_id FROM campaign WHERE campaign_ou_id IN ("+ouids+")";

		} else {
			var qry = "SELECT c.campaign_id FROM campaign c LEFT JOIN campaign_ct_user cu ON (c.campaign_id=cu.campaign_id AND cu.ct_user_id="+userid+
				") WHERE c.campaign_owner_user_id="+userid+" OR cu.ct_user_id="+userid;
		}
		appModel.ctPool.query(qry, function (err, data) {
			if (err) { return res('Failed to retrieve list of authorized campaigns. ' + err); }
			var campaignList = [];
			if (data.length > 0) {
				for (var key in data) {
					campaignList.push(data[key].campaign_id);
				}
			}
			res(null, campaignList);
		});
	}
};

module.exports = userAccess;

function parseAccess(data, res){
	var returnJson = {};
	var count = {};
	var tot = data.length;
	var cnt = 0;
	_.each(data, function(record) {
		cnt++;
		var value = record.permission;
		if (record.record_req == 1) {
			value = record.permission + ':' + (record.component_table ? record.component_table : record.component_table2) + ':' + (record.table_primary_key ? record.table_primary_key : record.table_primary_key2);
		}
		if (record.component_threshold_max > 0 || record.threshold_max > 0) { // entry is a threshold type
			if (count.scope !== record.scope_code && count.scope !== undefined) { // have new threshold record - add previous record and reset
				returnJson[count.scope] = count.perm + ':' + count.total + ':' + count.threshold;
				count = {}; // reset for new threshold scope
			}
			if (count.scope === undefined) { // create place-holder values
				count.scope = record.scope_code;
				count.perm = value;
				count.total = (record.count_total ? record.count_total : 0);
				count.threshold = (record.component_threshold_max ? record.component_threshold_max : record.threshold_max);
			} else if (count.scope === record.scope_code) { // add another threshold amount
				count.threshold += (record.component_threshold_max ? record.component_threshold_max : record.threshold_max);
			}
			if (cnt == tot) { // check if record is last record in data set - add it if it is
				// change permission to read-only if over or at limit and reformat to include total and threshold
				returnJson[count.scope] = count.perm + ':' + count.total + ':' + count.threshold;
				count = {}; // reset for new threshold scope
			}

		} else if (count.scope !== undefined) { // need to add defined threshold record from prior loop and reset
			// change permission to read-only if over or at limit and reformat to include total and threshold
			returnJson[count.scope] = count.perm + ':' + count.total + ':' + count.threshold;
			count = {}; // reset for new threshold scope
			returnJson[record.scope_code] = value; // add scope from this iteration loop

		} else {
			returnJson[record.scope_code] = value;
		}
	});

	res(null, returnJson);
}
