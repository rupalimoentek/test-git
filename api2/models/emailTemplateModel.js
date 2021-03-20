/**
 * Created by davey on 11/11/15.
 */
var appModel    = require('./appModel'),
	ga          = require('./orgGoogleAnalyticModel'),
	table       = 'email_template';

var emailTemplate = {
	create: function(data, res) {
		var e = data.body.email_template;

		async.waterfall([
			function(cb) {
				if (data.body.org_google_analytic !== undefined) {
					ga.create(data.body, function(err, ret) {
						if (err) { return cb(err); }
						if (ret.insertId !== undefined) { e.ga_id = ret.insertId; }
						cb(null);
					});
				} else {
					cb(null);
				}
			},
			function(cb) {
				if (e.ga_id !== undefined && e.ga_id === '') { e.ga_id = null; }
				//var re = new RegExp("[^\d\w\s]", "g");
				//e.email_from = e.email_from.replace(re, ''); // remove all non-alphanumeric or space characters
				delete e.ga_active;

				// set data to create / update email_template record
				var qryData = {
					table : table,
					values: e
				};
				if (e.email_id !== undefined && e.email_id !== '') {
					qryData.where = " WHERE email_id="+e.email_id;
					appModel.ctPool.update(qryData, function(err, ret) {
						if (err) { return cb(err); }
						cb(null, ret);
					});
				} else {
					appModel.ctPool.insert(qryData, function(err, ret) {
						if (err) { return cb(err); }
						cb(null, ret);
					});
				}
			}
		], function(err, result) {
			if (err) { return res(err); }
			res(null, result);
		});
	},
	/*update: function(data, res) {
		if (isNaN(data.body.email_template.email_id)) { return res('You must pass an email_id'); }

		var updateData = {
			table : table,
			values: data.body.email_template,
			where: " WHERE email_id=" + data.body.email_template.email_id
		};
		appModel.ctPool.update(updateData, function(err, ret) {
			if (err) { return res(err); }
			res(null, ret);
		});
	},
	*/
	delete: function(id, res) {
		var actionids = [];
		if (!isNaN(id)) {
			qry = "DELETE FROM "+table+" WHERE email_id = "+id;
			
				appModel.ctPool.query(qry, function (err, data) {
					if (err) { 
						res(err); 
						return; 
					}else{
						res(null, 'emailTemplate setting deleted.');
					}	
				});	
		} else {
			res('Invalid emailTemplate ID submitted');
		}
	},
	get: function(ou_id, master_id, res) {
		if (isNaN(ou_id)) { return res('Invalid org unit ID submitted'); }
		if (isNaN(master_id)) { return res('Invalid master template ID submitted'); }

		var qry = "SELECT *, em.master_id FROM email_master em LEFT JOIN email_template et ON (em.master_id=et.master_id AND et.org_unit_id="+ou_id+") " +
				"LEFT JOIN org_google_analytic oga ON (et.ga_id IS NOT NULL AND et.ga_id=oga.ga_id) WHERE em.master_id="+master_id;
		appModel.ctPool.query(qry, function(err, data) {
			if (err) { return res('Failed to retrieve e-mail template settings. '+err); }
			res(null, data);
		});
	}
};

module.exports = emailTemplate;