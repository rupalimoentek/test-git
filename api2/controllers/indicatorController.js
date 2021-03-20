var controller = require('./appController'),
	indicatorModel = require('../models/indicatorModel'),
	ctlogger = require('../lib/ctlogger.js');

var indicator = {
	updateIndicator: function(req, res){
		indicatorModel.updateIndicators(function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	}
};

module.exports = indicator;