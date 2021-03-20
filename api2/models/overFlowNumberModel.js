var table				= 'ce_hunt_options',
    async				= require('async'),
    appModel = require('./appModel');

var overflow = {
	delete: function(hunt_type_id, ctTrans, callback){
		if(hunt_type_id && hunt_type_id !== undefined ){
            var qry = "DELETE  FROM ce_hunt_options WHERE hunt_route_id =" + hunt_type_id;
                var qryData= {
                    which: 'query',
                    qry: qry
                };
                ctTrans.query(qryData, function(err,result) {
                    if(err) callback(err);
                    else {
                        callback(null);
                    }
                });	
        }
        else {callback(null)}
	},
	save: function(overflowNumbers, ouid, hunt_type, ctTrans, provisioned_route_id, callback){
        var hunt_option_id = '';
        async.waterfall([
            function(cb1){
                if(hunt_type !== undefined && hunt_type !== null){
                    var qry = "INSERT INTO ce_hunt_types (hunt_type, retry_count,provisioned_route_id) values (" ;
                        qry += "'" + hunt_type + "'," + 0 +  ",'"+provisioned_route_id+"') "
                    var insertData= {
                        which: 'query',
                        qry: qry
                    };
                    ctTrans.queryRet(insertData, function(err,result) {
                        if(err){ cb1(err); }
                        else{
                            hunt_option_id = result.insertId;
                            cb1(null,  result.insertId);
                        }
                    });
                }else{
                    cb1('Hunt Type not defined');
                }
            },function(option_id, cb1){
                var values = [];
                async.eachSeries(overflowNumbers,function(num, cb2){
                    if(num.unmaskNumber && num.unmaskNumber !== ''){
                        var	ring_delay = 18;
                        if(num.rings){
                            ring_delay = parseInt(num.rings) * 6;
                        }
                        values.push("(" + num.unmaskNumber + "," + ring_delay + "," + ouid + "," + null + "," + option_id +", "+num.overflow_order +")");
                        cb2(null);
                    }else{
                        cb2(null);
                    }
                },
                function(err){
                    cb1(err, values);
                });
            },function(values, cb1){
                if(values.length > 0){
                    var qry = "INSERT INTO ce_hunt_options (target_did, ring_delay, ouid, lastcall, hunt_route_id, overflow_order) values " + values.join(',') ;
                    var insertData= {
                        which: 'query',
                        qry: qry
                    };
                    ctTrans.queryRet(insertData, function(err,result) {
                        if(err) cb1(err);
                        else {
                            cb1(null, hunt_option_id);
                        }
                    });
                }else {cb1('No values found for overflow numbers')}
            }
        ], function (error, hunt_option_id) {
            if (error) { callback('Something is wrong!'); }
            callback(null, hunt_option_id);
        });
    },
    saveOverflowForLocatoinRoute: function(overflowNumbers, ouid, hunt_type, ctTrans, callback){
        var hunt_option_id = '';
        async.waterfall([
            function(cb1){
                if(hunt_type !== undefined && hunt_type !== null){
                    var qry = "INSERT INTO ce_hunt_types (hunt_type, retry_count) values (" ;
                        qry += "'" + hunt_type + "'," + 0 +  ") ";
                    var insertData= {
                        which: 'query',
                        qry: qry
                    };
                    ctTrans.queryRet(insertData, function(err,result) {
                        if(err){ cb1(err); }
                        else{
                            hunt_option_id = result.insertId;
                            cb1(null,  result.insertId);
                        }
                    });
                }else{
                    cb1('Hunt Type not defined');
                }
            },function(option_id, cb1){
                var values = [];
                async.eachSeries(overflowNumbers,function(num, cb2){
                    if(num.unmaskNumber && num.unmaskNumber !== ''){
                        var	ring_delay = 18;
                        if(num.rings){
                            ring_delay = parseInt(num.rings) * 6;
                        }
                        values.push("(" + num.unmaskNumber + "," + ring_delay + "," + ouid + "," + null + "," + option_id +", "+num.overflow_order +")");
                        cb2(null);
                    }else{
                        cb2(null);
                    }
                },
                function(err){
                    cb1(err, values);
                });
            },function(values, cb1){
                if(values.length > 0){
                    var qry = "INSERT INTO ce_hunt_options (target_did, ring_delay, ouid, lastcall, hunt_route_id, overflow_order) values " + values.join(',') ;
                    var insertData= {
                        which: 'query',
                        qry: qry
                    };
                    ctTrans.queryRet(insertData, function(err,result) {
                        if(err) cb1(err);
                        else {
                            cb1(null, hunt_option_id);
                        }
                    });
                }else {cb1('No values found for overflow numbers')}
            }
        ], function (error, hunt_option_id) {
            if (error) { callback('Something is wrong!'); }
            callback(null, hunt_option_id);
        });
    },
    read: function(hunt_option_id, res){
        if(!hunt_option_id)
            res('invalid hunt option id');

        var huntQry = "SELECT cho.*, ch.hunt_type from ce_hunt_types ch LEFT JOIN ce_hunt_options cho ON(ch.id = cho.hunt_route_id) WHERE cho.hunt_route_id ="+ hunt_option_id+" ORDER BY cho.overflow_order ASC";
        appModel.ctPool.query(huntQry, function(err, huntData){
            res(err, huntData);
        });
    },
    deleteByProvisionId: function(ctTransModel, pr_id, res){
        if(!pr_id){
            res('invalid hunt option id');
        }
        var huntQry = "DELETE from ce_hunt_types where provisioned_route_id ="+ pr_id;
        ctTransModel.query(huntQry, function(err, huntData){
            res(err, huntData);
        });
    }
};

module.exports = overflow;
