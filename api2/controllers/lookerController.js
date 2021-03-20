/**
 * Created by davey on 3/31/15.
 */
var lookerModel = require('../models/lookerModel');

var looker = {
	// adds a new webhook record
	postAction: function(req, res) {
		lookerModel.post(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	}
};

module.exports = looker;
