/**
 ** Created by Dumbo Pravin on 05/15/2019.
 */
var appModel = require('./appModel'),
	table = 'user_permissions_log',
	async = require('async');

var userPermissionsLog = {
	createLog: function(ct_user_id, ct_user_ou_id, logUser, internal_request, res) {
		var logData = {
            'ct_user_id' : parseInt(logUser.ct_user_id),
            'user_permissions_log_ou_id':parseInt(ct_user_ou_id) ,
            'action_type' : 'added',
            'current_permissions' : JSON.stringify(logUser.current_permissions),
            'created_by': parseInt(ct_user_id),
            'created_on': 'CURRENT_TIMESTAMP',
            'internal_request': internal_request
        };
		var insertData = {
			table : table,
			values: logData
		};
		
		appModel.userPermissionQuery.insert(insertData, function(err, ret) {
			if (err) { res(err); return; } else { res(null, ret); }
		});
	},
	updateLog: function(ct_user_id, ct_user_ou_id, logUser, internal_request, res) {
        var logData = {
            'ct_user_id' : parseInt(logUser.ct_user_id),
            'user_permissions_log_ou_id': parseInt(ct_user_ou_id),
            'action_type' : 'updated',
            'current_permissions' : JSON.stringify(logUser.current_permissions),
            'updated_permissions' : JSON.stringify(logUser.updated_permissions),
            'updated_by': parseInt(ct_user_id),
            'updated_on': 'CURRENT_TIMESTAMP',
            'internal_request': internal_request
        };
		var insertData = {
			table : table,
			values: logData
		};
		appModel.userPermissionQuery.insert(insertData, function(err, ret) {
			if (err) { res(err); return; } else { res(null, ret); }
		});
	},
	addNewGroupToUsersLog: function(hostUser, groupId, users, res){
		var insertQuery =' INSERT INTO user_permissions_log (ct_user_id, user_permissions_log_ou_id, action_type, current_permissions, updated_permissions,updated_by, updated_on, internal_request) VALUES ';
		var values = [];
		async.eachSeries(users, function(user, callback){
			var query = '( ';
			var logData = {
				'ct_user_id' : user
			};
			query += user +", ";
			query += hostUser.ou_id +", ";
			query += "'updated', ";  
			async.waterfall([
				function(cb){
					var query = 'SELECT * FROM user_permissions WHERE ct_user_id = '+user+' LIMIT 1';
					appModel.userPermissionQuery.query(query, function(err, ret) {
						if (err) { cb(err); } else {
							ret[0].groups_list = arrayRemove(ret[0].groups_list, groupId);
							cb(null, ret); 
						}
					});
				},
				function(result, cb){
					var oldgroups = JSON.parse(JSON.stringify(result[0].groups_list));
					result[0].groups_list.push(groupId);
					var newGroups = result[0].groups_list;
					logData.current_permissions = {
						'groups_list': oldgroups,
						'reports_list': result[0].reports_list,
						'score_call':result[0].score_call,
						'access_audio': result[0].access_audio
					};
					logData.updated_permissions = {
						'groups_list': newGroups,
						'reports_list': result[0].reports_list,
						'score_call':result[0].score_call,
						'access_audio': result[0].access_audio
					};
					query += "'"+JSON.stringify(logData.current_permissions)+"', ";
					query += "'"+JSON.stringify(logData.updated_permissions)+"', ";
					query += hostUser.user_id +", ";
					query += " CURRENT_TIMESTAMP, ";
					query += " false )";					
					cb(null);
				}
			],function(err){
				values.push(query);
				callback(err);
			});
		},function(err){
			if (err) { res(err); return; } else {
				insertQuery += values.join(", ");
				appModel.userPermissionQuery.query(insertQuery, function(err, ret) {
					if (err) { res(err); return; } else { res(null, ret); }
				});
			}			
		});
	}
};

function arrayRemove(arr, value) {
	return arr.filter(function(ele){
		return ele != value;
	}); 
 }
 
 module.exports = userPermissionsLog;
