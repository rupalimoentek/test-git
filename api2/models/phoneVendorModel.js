var appModel = require('./appModel'),
	table = 'phone_vendor';
var phoneVendor = {
	getIdByName: function(name, callback){
		var qry = "SELECT vendor_id";
		qry += " FROM "+table;
		qry += " WHERE LOWER(vendor_name) = LOWER('"+name+"')";
		appModel.ctPool.query(qry, function(err, result){
			callback(err, result[0]);
		});
	}
};
module.exports = phoneVendor;
