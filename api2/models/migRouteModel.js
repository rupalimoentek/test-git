var connector 			= require('./appModel'),
	ctTransactionModel	= require('./ctTransactionModel'),
	appModel			= require('./appModel'),
	table				= 'mig_route',
	async				= require('async');

var mig = {
	getByCustomerId: function(req,callback){
		var qry = "SELECT cfa_ouid FROM "+table+" WHERE customer_id = "+req.params.customer_id+" AND status = 'migrated';";
		appModel.ctPool.query(qry,function(err,results){
			callback(err,results);
		});
	},
	post: function(req,callback){
		async.eachSeries(req.body.data,function(route,cb){
			var sets = ['account_id','customer_id','session_id','cs_campaign_id','status'];
			var values = [route.account_id,route.customer_id,route.session_id,route.cs_campaign_id,route.status,];
			if(route.msg){
				sets.push('msg');
				values.push(route.msg);
			}
			if(route.cfa_route_id){
				sets.push('cfa_route_id');
				values.push(route.cfa_route_id);
			}
			sets.push('created');
			var qry = "INSERT INTO "+table+" ("+sets.join(',')+") VALUES ('"+values.join("','")+"',NOW());";
			var trans = new ctTransactionModel.begin(function(err){
				data = {
					which: 'query',
					qry: qry
				};
				trans.query(data, function(err, data){
					if (err) {
						console.log('post mig route err: '+err)
						trans.rollback(function(){
							cb(err);
						});
					} else {
						trans.commit(function(){
							cb(null);
						});
					}
				});
			});
		},
		function(err){
			callback(err);
		});
	},
    getUsersByOuidAction: function(ouid, callback) {
        var ouids_sql = "select org_unit_id from org_unit";
        ouids_sql += " where org_unit_id = " + ouid + " or org_unit_id IN (select org_unit_parent_id from org_unit where org_unit_id = " + ouid + ")";
        ouids_sql += " or org_unit_id IN (select billing_id from org_unit where org_unit_id = " + ouid + ")";

        var qry = "select cd.ct_user_id, cu.username, concat(cu.first_name ,' ', cu.last_name) as full_name, ou.org_unit_name, cd.timezone";
        qry += " from ct_user_detail as cd join ct_user as cu on cu.ct_user_id = cd.ct_user_id";
        qry += " join org_unit as ou on ou.org_unit_id = cu.ct_user_ou_id where cu.ct_user_ou_id IN (" + ouids_sql + ") AND cu.user_status = 'active' AND cu.role_id < 3;";
        appModel.ctPool.query(qry, function(err, results) {
            callback(err, results);
        });
    },
	locations: function(ouid, callback){
		var qry = "SELECT location_id,location_name FROM location ";
			qry += "WHERE org_unit_id = "+ouid;
			qry += " ORDER BY location_name ASC";
		appModel.ctPool.query(qry,function(err,results){
			callback(err,results);
		});
	}
};

module.exports = mig;