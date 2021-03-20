/**
 * Created by davey on 3/31/15.
 */
var lookerModel = require('../models/lookerAPIModel');

var looker = {
	// adds a new webhook record
	postTagAction: function(req, res) {
		lookerModel.postTag(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	putTagAction: function(req, res) {
		lookerModel.putTag(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	deleteTagAction:function(req, res){
		lookerModel.deleteTag(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
  postComment:function(req, res){
		lookerModel.postComment(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	  putComment:function(req, res){
		lookerModel.putComment(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
  deleteComment:function(req, res){
		lookerModel.deleteComment(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	getUsers:function(req, res){
		lookerModel.getUsers(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
	addUser:function(req, res){
		lookerModel.addUser(req, function(err, data) {
			if (err) { res(err); } else { res(null, data); }
		});
	},
  validate:function(req, res){
		lookerModel.lookerAuthValidate(req, function(err) {
			if (err) { res(err); } else { res(null); }
		});
	}
};

module.exports = looker;
