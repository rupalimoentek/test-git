var controller = require('./appController'),
	roleModel = require('../models/roleModel');
var role = {
	getAllAction: function(res){
		roleModel.getAll(function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	}
}

module.exports = role;
