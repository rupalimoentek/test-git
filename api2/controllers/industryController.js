var controller = require('./appController'),
	industryModel = require('../models/industryModel');

var industry = {
	getAction: function(req, res){

        var params;
        if(req.id) {
			params = {"industry_id": req.id};
		}
		else {
			params = req.query;
		}
		industryModel.read(params, function(data){
			res(data);
		});
	}
};

module.exports = industry;