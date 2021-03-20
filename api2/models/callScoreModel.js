/**
 * Created by davey on 3/31/15.
 */
var appModel = require('./appModel'),
	f = require('../functions/functions.js'),
	fs = require("fs"),
	yaml = require("js-yaml"),
	e = yaml.load(fs.readFileSync("config/database.yml")),
	async = require('async'),
	_ = require('underscore'),
	ctTransactionModel = require('./ctTransactionModel'),
	table = 'webhook';

var callScore = {
	getCallScoreReport : function(req,res){
		var query = "SELECT call.call_id, pr.provisioned_route_name, ou.org_unit_name, csc.call_score_card_id, csc.score_card_id, csc.score, ";
							+= "csc.user_id,csc.call_score_status, call.call_started, cd.recording_file ";
							+= "FROM call call ";
							+= "LEFT JOIN call_detail cd ON (cd.call_id =call.call_id ) ";
							+= "LEFT JOIN provisioned_route pr ON pr.provisioned_route_id = call.provisioned_route_id ";
							+= "LEFT JOIN org_unit ou ON (ou.org_unit_id =call.org_unit_id ) ";
							+= "LEFT JOIN call_score_card csc ON (csc.call_id =call.call_id ) ";
							+= "WHERE ou.org_unit_id = 8 OR ou.org_unit_parent_id = 8 OR ou.top_ou_id = 8 AND call.call_started BETWEEN ";
		appModel.ctPool.query(query, function (err, result) {
				if (err) {return res(err);}
				return res(null, result);
		});
	}
};

module.exports = callScore;
