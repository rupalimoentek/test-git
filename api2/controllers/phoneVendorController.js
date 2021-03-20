var controller = require('./appController'),
	phoneVendorModel = require('../models/phoneVendorModel');

var phoneVendor = {
	getIdByNameAction: function(req,callback){
		phoneVendorModel.getIdByName(req.params.name,function(err, data){
			controller.responsify(err,data,function(response){
				callback(response);
			});
		});
	}
}

module.exports = phoneVendor;
