var ctTransactionModel = require('../models/ctTransactionModel');
var controller = require('./appController'),
	tagModel = require('../models/tagModel');

var tag = {
    putDeleteAction: function (req,res) {
        var ctTrans = new ctTransactionModel.begin(function(err){
            if (err) { return res(err); }

            tagModel.deleteTag(req, function(err, data){
                if (err) {
                    ctTrans.rollback(function () {
                        controller.responsify(err, data, function(response){
                            res(response);
                        });
                    });
                } else {
                    ctTrans.commit(function () {
                        controller.responsify(err, data, function(response){
                            res(response);
                        });
                    });
                }
            }, ctTrans);
        });
    },

	//putDeleteAction: function (req,res) {
	//	console.log(req.body);
	//	tagModel.deleteTag(req.body.tag.id, function(err){
	//		controller.responsify(err, 'Tag Deleted.', function(response){
	//			res(response);
	//		});
	//	});
	//},
	postAction: function (req, res) {
		tagModel.create(req, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	getByOuidAction: function (req, res) {
		tagModel.getByOuid(req, function(err,data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	}
};

module.exports = tag;
