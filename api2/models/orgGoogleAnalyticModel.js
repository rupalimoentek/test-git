/**
 * Created by davey on 12/9/15.
 */
var appModel = require('./appModel');

var orgGA = {
	create: function(body, res) {
		if (body.org_google_analytic === undefined) { return res(null, 'No Google Analytics defined'); }
		var data = body.org_google_analytic;
		console.log('GA_ACTIVE', data.ga_active);
		if (data.ga_active !== undefined && data.ga_active === 'false') {
			console.log('GA_ACTIVE is false');
			if (data.ga_id !== undefined && data.ga_id !== '') {
				orgGA.drop(body.org_google_analytic.ga_id, data.org_unit_id, function (err, ret) {
					if (err) { return res(err); }
					return res(null, 'Deleted Google Analytic record entry');
				});
			}
			return res(null, 'Skipping inactive GA record definition');
		} else {
			console.log('GA_ACTIVE is true');
		}

		// delete data.ga_active;
		var qryData = {
		    'table':'org_google_analytic',
		    'values':data
	    };
		if (data.ga_id !== undefined && data.ga_id !== '') {
			qryData.where = ' WHERE ga_id='+data.ga_id;
			appModel.ctPool.update(qryData, function(err, ret) {
				if (err) { return res('Failed to update Google Analytics'); }
				res(null, ret);
			});
		} else {
			appModel.ctPool.insert(qryData, function(err, ret) {
				if (err) { return res('Failed to insert Google Analytics'); }
				res(null, ret);
			});
		}
	},
	drop: function(gaid, ouid, res) {
		var qry = "DELETE FROM org_google_analytic WHERE ga_id="+gaid+" AND org_unit_id="+ouid;
		appModel.ctPool.query(qry, function(err, ret) {
			if (err) { return res('Failed to remove Google Analytics record'); }
			res(null, ret);
		});
	}
};

module.exports = orgGA;