var appModel = require('./appModel'),
	table = 'tag',
	ctlogger           = require('../lib/ctlogger.js'),
	ctTransactionModel = require('./ctTransactionModel'),
	_ = require("underscore");


var tag = {
	getByOuid: function(req, res){
		var ouModel = require('./orgUnitModel');
		var ous = [];
		ous.push(parseInt(req.params.ouid));
		var user_access_id = req.params.user_access_id;
		var tag_ous = [];
		var new_ouid = req.params.ouid;
		var include_parent_id = true;
		async.series([
			function(cb){
				if(user_access_id == 7){
					var qry = "SELECT org_unit_parent_id FROM org_unit WHERE org_unit_id ="+req.params.ouid;
					appModel.ctPool.query(qry, function(err, data){
						if (!err) {
							if(data[0].org_unit_parent_id !== null){
								new_ouid = data[0].org_unit_parent_id;
								include_parent_id = false;
							}
						}
						cb(err);
					});
				}else{
					cb(null);
				}
			},
			function(cb){
				ouModel.ouAndDescendents(new_ouid, function(ous1){
					if (ous === '') {
						res('Invalid ouid.');
						return;
					}

					//tag_ous = ous1.split(",");
					tag_ous = ous1.split(",");
					ous = tag_ous;
					if(!include_parent_id){
						var index = tag_ous.indexOf(new_ouid.toString());
						if (index > -1) {
						    tag_ous.splice(index, 1);
						}
					}
					cb(null);
				});
			},
			function(cb){
				ouModel.getAllParentOuIds(req.params.ouid, function(ous2){
					if (ous === '') {
						res('Invalid ouid.');
						return;
					}
					ous2 = ous2.split(",");
					ous = _.union(ous,ous2);
					ous = ous.map(function(ou){
						return parseInt(ou);
					});
					ous = _.intersection(ous,req.user.orglist);
					if(ous.length < 1){
						ous = req.params.ouid;
					}
					var qry = "SELECT tag_id, tag_name, org_unit_id FROM " + table + " WHERE org_unit_id in (select org_unit_id from org_unit where billing_id = (SELECT billing_id FROM org_unit WHERE org_unit_id ="+req.params.ouid+" )) AND tag_active=true ORDER BY tag_name ASC";
					appModel.ctPool.query(qry, function(err, data){
						jsonGetTags(data, req.params.ouid);
						res(err,data);
					});
				});
			}
			]
		);
	},
	create: function(req,res){
		var tag_data = req.body.tag;
		console.log("sdfvsfvds",req.body);
		console.log("dzsmnvflkdv",tag_data);
		isMatch(tag_data, function(err, isMatch){
			if (!isMatch) {
				var ctTrans = new ctTransactionModel.begin(function(err){
					if (err) {
						res(err);
						return;
					}
					var insertData = {
						which: 'insert',
						table: table,
						values: tag_data
					};

					ctTrans.queryRet(insertData, function(err, data){
						console.log('data is ' + JSON.stringify(data));
						if (err) {
							ctTrans.rollback(function(){
								res(err);
							});
						} else {
							ctTrans.commit(function(){
								var j = {
									tag_id: data.insertId
								};
								tag_data.tag_id = data.insertId;
								tag_data.ct_user_id = req.userid;
			                    ctlogger.log(tag_data, 'insert', 'tag','','',req.headers.authorization);
								res(null, j);
							});
						}
					});
				});
			} else {
				res("This Tag is already exists");
			}
		});
	}
	//deleteTag: function(data, res){
	//	ctTransactionModel.begin(function(err){
	//		console.log('data is ' + JSON.stringify(data));
	//		var qry = "UPDATE " + table + " SET tag_active=false WHERE tag_id in (" + data.join(',') + ")";
	//		var qryData = {
	//			which: 'query',
	//			qry: qry
	//		};
	//		ctTransactionModel.query(qryData, function(err){
	//			if (err) {
     //               console.log("ERR in delete tags");
	//				ctTransactionModel.rollback(function(){
	//					res(err);
	//				});
	//			} else {
     //               console.log("deleted tags OK!");
	//				ctTransactionModel.commit(function(){
	//					res();
	//				});
	//			}
	//		});
	//	});
	//}
};






tag.deleteTag = function(req, res, ctTransactPassedDown) {
	if( req.tags != undefined){
		var arrTagIds = req.tags;
	    var qry = "UPDATE " + table + " SET tag_active=false WHERE tag_id in (" + arrTagIds.join(',') + ")";
	}else{		
		var arrTagIds = req.body.tag.id;
	    var qry = "UPDATE " + table + " SET tag_active=false WHERE tag_id in (" + arrTagIds.join(',') + ")";
	}
    ctTransactPassedDown.query(qry, function(err) {
        if (err) {
			return res(err, "error on deleteTag model query");
		} else {
			var tag_data = {
				tag_id: arrTagIds,
				org_unit_id: req.ouid,
				ct_user_id: req.userid
			};
			if( req.tags === undefined){
				ctlogger.log(tag_data, 'delete', 'tag','','',req.headers.authorization);
			}
            return res(null, "successful delete tag");
        }
    });
};


function jsonGetTags(tags, ous) {
	var response = [];
	console.log("ous => ",ous);
	for (var i = 0; i < tags.length; i++) {
		console.log("ous.indexOf(tags[i].org_unit_id.toString() => ",ous.indexOf(tags[i].org_unit_id.toString()),"ous => ",ous," tags[i].org_unit_id ",tags[i].org_unit_id," tagname => ",tags[i].tag_name);
		if(ous.indexOf(tags[i].org_unit_id.toString()) > -1){
			tags[i].editable = true;
			response.push(tags[i]);
		}else{
			tags[i].editable = false;
			response.push(tags[i]);
		}
	}
	console.log("resposen => ",response);
	return(response);
}

function isMatch (data, cb) {
	var ouModel = require('./orgUnitModel');
	async.waterfall([
		function(cb1){
				ouModel.getById(data.org_unit_id, function(err, ou){
					cb1(err, ou[0].top_ou_id);
				});
		},
		function(top_ou, cb1){
			ouModel.ouAndDescendents(top_ou, function(ous){
				cb1(null, ous);
			});
		},
		function(ous, cb1){
			console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@",data.tag_name);
			var qry = "SELECT count(*) FROM " + table + " WHERE LOWER(tag_name) = LOWER('" + data.tag_name + "') And org_unit_id in ("+ous+") AND tag_active=true";
			appModel.ctPool.query(qry, function(err, d){
				cb1(err, d);
			});
		}
	],
	function(err, results){
		console.log("asdasdsad",parseInt(results[0].count));
		cb(err, parseInt(results[0].count));
	});


}

module.exports = tag;
