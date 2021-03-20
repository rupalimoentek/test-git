var controller = require('./appController'),
	f = require('../functions/functions'),
	channelsModel = require('../models/channelModel');

var channels = {
	getAction: function(req, res){
		channelsModel.read(function(data){
			res(data);
		});
	}
};

module.exports = channels;