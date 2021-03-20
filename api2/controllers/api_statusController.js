var controller      = require('./appController'),
	api_statusModel = require('../models/api_statusModel');

var apistatus = {

	getStatus: function(req, res){
		console.log("got to get status in controller");
		api_statusModel.getStatus(req, function(err, data) {
			if (err) { return res(err); }
			res(null, data);
		});
	}
};

module.exports = apistatus;