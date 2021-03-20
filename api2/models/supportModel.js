/**
 * Created by bschermerhorn on 7/9/15.
 */

var appModel = require('./appModel');
var _        = require('underscore');
var async    = require("async");
var q        = require("q");
var f = require('../functions/functions.js');
var orgUnitModel = require('./orgUnitModel');
var fs = require("fs");
var yaml = require("js-yaml");
var envVar = process.env.NODE_ENV;
var config = yaml.load(fs.readFileSync("config/config.yml")); 


var support = {
	getBillingNodesToView: function(adminType, user_id, callback) {
	    if (typeof callback !== "function") {
	        throw "incorrect parameter type for support.getBillingNodesToView";
	    }		
		if(adminType == 'partner') {
			var qry = "SELECT ob.org_unit_id, ob.allow_admin, ou.org_unit_name FROM org_billing ob JOIN org_unit ou ON ou.org_unit_id = ob.org_unit_id ";
			qry += "JOIN partner_admin_user as pau ON ob.org_unit_id = pau.billing_ou_id WHERE ou.org_unit_status = 'active' and pau.partner_admin_ct_user_id = "+user_id;
			console.log(qry);
			appModel.ctPool.query(qry, function (err, data) {
				if (err) {
					return callback(err);
				} else {
					return callback(null, data);
				}
			});
		}
		else {
			var qry = "SELECT ob.org_unit_id, ob.allow_admin, ou.org_unit_name FROM org_billing ob JOIN org_unit ou ON ou.org_unit_id = ob.org_unit_id WHERE ou.org_unit_status = 'active'";
			appModel.ctPool.query(qry, function (err, data) {
				if (err) {
					return callback(err);
				} else {
					return callback(null, data);
				}
			});
		}
	},
	getAdminList: function(ouid, res) {
		orgUnitModel.ouAndDescendents(ouid, function(ouids){
			var qry = "SELECT first_name, last_name, ct_user_id FROM ct_user WHERE ct_user_ou_id in ("+ouids+") AND user_status='active' ORDER BY first_name ASC, last_name ASC";
			appModel.ctPool.query(qry, function (err, data) {
				if (err) { return res('Failed to retrieve list of admin users. '+err); }
				res(null, data);
			});
		});
	},
	getParnterAdminUser: function(ouid, user_id, res) {
		var qry = "SELECT cu.first_name, cu.last_name, cu.ct_user_id FROM ct_user as cu join partner_admin_user as pau on pau.ct_user_id = cu.ct_user_id ";
		qry += " WHERE pau.billing_ou_id  = "+ouid+" and pau.partner_admin_ct_user_id = "+user_id+" AND user_status='active' Limit 1";
		appModel.ctPool.query(qry, function (err, data) {
			if (err) { return res('Failed to retrieve list of admin users. '+err); }
			res(null, data);
		});
		
	},
	globalSearch: function(req, res) {
		getfilterRule(req.params.category, req.params.searchText, req.params.adminType, function(qry, countQry){
			if(qry && countQry){
				if(req.params.adminType == 'partner'){
					qry += " AND pau.partner_admin_ct_user_id = "+req.params.user_id;
					countQry +=" AND pau.partner_admin_ct_user_id = "+req.params.user_id;
				}

				if(req.params.limit && req.params.offset){
					qry +=" LIMIT " +req.params.limit+ " OFFSET " +req.params.offset;
				}
				var results = {};
				appModel.ctPool.query(countQry, function (err, countData) {
					if (err) { return res('Failed to retrieve list of search results. '+err); }
					appModel.ctPool.query(qry, function (err, data) {
						if (err) { return res('Failed to retrieve list of search results. '+err); }
						results.total = countData[0].count;
						async.map(data, function(search, callback){
							search.searchresult = search.searchresult.length < 30 ? search.searchresult : search.searchresult + '...';
							search.account_name = search.account_name.length < 30 ? search.account_name : search.account_name + '...';
							if(req.params.adminType != 'partner'){
								support.getAdminList(search.billing_id, function(err, userList){
									if (err) { callback('Failed to retrieve list of Users. '+err); }
									search.users = userList;
									callback(null);
								});
							}else{
								search.users = [];
								callback(null);
							}							
						},function(err){
							results.data = data;
							res(err, results);
						});
					});
				});
			}else{
				res('Invalid category found');
			}
		});
	},	
	saveTicket: function(ticketInfo, billing_id, res) {
		var email = require('../lib/email');
		ticketInfo.phone_number = ticketInfo.phone_number === undefined ? "" : ticketInfo.phone_number;
		var msg = "Hello Support,<br/>"
		msg += "Please find following details<br/><br/>"
		msg += "<table style='border-collapse: collapse;width: 100%;border:1px solid black'><tr>"
		msg += "<th style='text-align: left;padding: 8px; border:1px solid black'>Name</th>"
		msg += "<th style='text-align: left;padding: 8px; border:1px solid black'>Email</th>"
		msg += "<th style='text-align: left;padding: 8px; border:1px solid black'>Message</th>"
		msg += "<th style='text-align: left;padding: 8px; border:1px solid black'>Account Id</th>"
		msg += "<th style='text-align: left;padding: 8px; border:1px solid black'>Phone Number</th>"
		msg += "</tr><tr>"
		msg += "<td style='text-align: left;padding: 8px; border:1px solid black'>"+ ticketInfo.name +"</td>"
		msg += "<td style='text-align: left;padding: 8px; border:1px solid black'>"+ ticketInfo.email +"</td>"
		msg += "<td style='text-align: left;padding: 8px; border:1px solid black'>"+ ticketInfo.message +"</td>"
		msg += "<td style='text-align: left;padding: 8px; border:1px solid black'>"+ ticketInfo.account_id +"</td>"
		msg += "<td style='text-align: left;padding: 8px; border:1px solid black'>"+ ticketInfo.phone_number +"</td>"
		msg += "</tr></table><br/>"
		msg += "Thanks"

		var insertData = {
			table:  'support_tickets',
		 	values: ticketInfo
		};
		appModel.ctPool.insert(insertData, function (err, supportRes) {
			if (err) { return res('Failed to insert support Ticket. '+err); }
			var subject = "Ticket for Support - " + billing_id + " - " + supportRes.insertId
			email.sendSupportEmail(subject, msg, config[envVar].SUPPORT_EMAIL ,ticketInfo.email, function(err){
				if (err) { return res('Failed to send email'); }
				res(null);
			});
		});	
		
	}
};

function getfilterRule(category, searchText, adminType, callback){
	searchText = f.pg_escape_bracket(searchText);
	switch(category){
		case 'account_name':
			var query = "SELECT LEFT(ou.org_unit_name , 30) AS searchresult, LEFT(ou.org_unit_name,30) AS account_name, ou.org_unit_id AS billing_id from org_unit ou ";
				query += " JOIN org_billing ob ON ob.org_unit_id = ou.org_unit_id AND ou.org_unit_status = 'active'";
				if(adminType == 'partner'){
					query += " JOIN partner_admin_user pau ON pau.billing_ou_id = ob.org_unit_id";
				}
				query += " WHERE ou.org_unit_name ILIKE '%"+searchText+"%' AND ou.org_unit_id = ou.billing_id";
			var countQuery = "SELECT COUNT(ou.org_unit_name) as count from org_unit ou ";
				countQuery += " JOIN org_billing ob ON ob.org_unit_id = ou.org_unit_id AND ou.org_unit_status = 'active'";
				if(adminType == 'partner'){
					countQuery += " JOIN partner_admin_user pau ON pau.billing_ou_id = ob.org_unit_id";
				}
				countQuery += " WHERE ou.org_unit_name ILIKE '%"+searchText+"%' AND ou.org_unit_id = ou.billing_id";
			callback(query, countQuery);
			break;
		case 'group_name':
			var query =  "SELECT LEFT(ou.org_unit_name , 30) as searchresult, LEFT(ou2.org_unit_name, 30) as account_name, ou2.org_unit_id AS billing_id from org_unit ou";
				query += " JOIN org_unit ou2 on(ou.billing_id = ou2.org_unit_id AND ou2.org_unit_status = 'active')";
				query += " JOIN org_billing ob on(ou2.org_unit_id = ob.org_unit_id)";
				if(adminType == 'partner'){
					query += " JOIN partner_admin_user pau ON pau.billing_ou_id = ou2.org_unit_id";
				}
				query += " WHERE ou.org_unit_name ilike '%"+searchText+"%'";
			var countQuery =  "SELECT COUNT(ou.org_unit_name) as count from org_unit ou";
				countQuery += " JOIN org_unit ou2 on(ou.billing_id = ou2.org_unit_id AND ou2.org_unit_status = 'active')";
				countQuery += " JOIN org_billing ob on(ou2.org_unit_id = ob.org_unit_id)";
				if(adminType == 'partner'){
					countQuery += " JOIN partner_admin_user pau ON pau.billing_ou_id = ou2.org_unit_id";
				}
				countQuery += " WHERE ou.org_unit_name ilike '%"+searchText+"%'";
			callback(query, countQuery);
			break;
		case 'org_unit_ext_id':
			var query =  "SELECT LEFT(ou.org_unit_name , 30) as searchresult, LEFT(ou2.org_unit_name, 30) as account_name, ou2.org_unit_id AS billing_id from org_unit ou";
				query += " JOIN org_unit ou2 on(ou.billing_id = ou2.org_unit_id AND ou2.org_unit_status = 'active')";
				query += " JOIN org_billing ob on(ou2.org_unit_id = ob.org_unit_id)";
				if(adminType == 'partner'){
					query += " JOIN partner_admin_user pau ON pau.billing_ou_id = ou2.org_unit_id";
				}
				query += " WHERE ou.org_unit_ext_id ilike '%"+searchText+"%'";
			var countQuery =  "SELECT COUNT(ou.org_unit_name) as count from org_unit ou";
				countQuery += " JOIN org_unit ou2 on(ou.billing_id = ou2.org_unit_id AND ou2.org_unit_status = 'active')";
				countQuery += " JOIN org_billing ob on(ou2.org_unit_id = ob.org_unit_id)";
				if(adminType == 'partner'){
					countQuery += " JOIN partner_admin_user pau ON pau.billing_ou_id = ou2.org_unit_id";
				}
				countQuery += " WHERE ou.org_unit_ext_id ilike '%"+searchText+"%'";
			callback(query, countQuery);
			break;
		case 'tracking_number':
			var query = "SELECT ccf.dnis as searchresult, LEFT(ou2.org_unit_name, 30) as account_name, ou2.org_unit_id AS billing_id  FROM ce_call_flows ccf ";
				query += " join org_unit ou on ccf.ouid = ou.org_unit_id AND ou.org_unit_status = 'active'";
				query += " join org_unit ou2 on ou2.org_unit_id = ou.billing_id AND ou2.org_unit_status = 'active'";
				if(adminType == 'partner'){
					query += " JOIN partner_admin_user pau ON pau.billing_ou_id = ou2.org_unit_id";
				}
				query += " where ccf.dnis ilike '%"+searchText+"%'";
			var countQuery = "SELECT COUNT(ccf.dnis) as count FROM ce_call_flows ccf ";
				countQuery += " join org_unit ou on ccf.ouid = ou.org_unit_id AND ou.org_unit_status = 'active'";
				countQuery += " join org_unit ou2 on ou2.org_unit_id = ou.billing_id AND ou2.org_unit_status = 'active'";
				if(adminType == 'partner'){
					countQuery += " JOIN partner_admin_user pau ON pau.billing_ou_id = ou2.org_unit_id";
				}
				countQuery += " where ccf.dnis ilike '%"+searchText+"%'";
			callback(query, countQuery);
			break;
		case 'tracking_number_name':
			var query = "SELECT LEFT(pr.provisioned_route_name, 30) as searchresult, LEFT(ou2.org_unit_name, 30) as account_name, ou2.org_unit_id AS billing_id  FROM provisioned_route pr ";
				query += " join org_unit ou on pr.provisioned_route_ou_id = ou.org_unit_id AND ou.org_unit_status = 'active'";
				query += " join org_unit ou2 on ou2.org_unit_id = ou.billing_id AND ou2.org_unit_status = 'active'";
				if(adminType == 'partner'){
					query += " JOIN partner_admin_user pau ON pau.billing_ou_id = ou2.org_unit_id";
				}
				query += " where pr.provisioned_route_name ilike '%"+searchText+"%'";
			var countQuery = "SELECT COUNT(pr.provisioned_route_name) as count FROM provisioned_route pr ";
				countQuery += " join org_unit ou on pr.provisioned_route_ou_id = ou.org_unit_id AND ou.org_unit_status = 'active'";
				countQuery += " join org_unit ou2 on ou2.org_unit_id = ou.billing_id AND ou2.org_unit_status = 'active'";
				if(adminType == 'partner'){
					countQuery += " JOIN partner_admin_user pau ON pau.billing_ou_id = ou2.org_unit_id";
				}
				countQuery += " where pr.provisioned_route_name ilike '%"+searchText+"%'";
			callback(query, countQuery);
			break;
		case 'ring_to_number':
			var query = "SELECT distinct pr.provisioned_route_id , LEFT(pr.provisioned_route_name, 30) as searchresult, LEFT(ou2.org_unit_name, 30) as account_name, ou2.org_unit_id AS billing_id FROM ce_call_flows ccf ";
				query += " JOIN provisioned_route pr ON pr.provisioned_route_id = ccf.provisioned_route_id ";
				query += " JOIN org_unit ou ON ou.org_unit_id = pr.provisioned_route_ou_id AND ou.org_unit_status = 'active'";
				query += " JOIN org_unit ou2 ON ou2.org_unit_id = ou.billing_id AND ou2.org_unit_status = 'active'";
				if(adminType == 'partner'){
					query += " JOIN partner_admin_user pau ON pau.billing_ou_id = ou2.org_unit_id";
				}
				query += " LEFT JOIN ce_hunt_types cht ON cht.id = ccf.hunt_option "; 
				query += " LEFT JOIN ce_hunt_options cho ON cho.hunt_route_id = cht.id "; 
				query += " LEFT JOIN ce_geo_routes cgr ON cgr.id = ccf.routable_id ";
				query += " LEFT JOIN ce_ivr_routes cir ON cir.id = ccf.routable_id ";
				query += " LEFT JOIN ce_ivr_options2 cio ON cio.ivr_route_id = cir.id ";
				query += " LEFT JOIN ce_percentage_route cpr ON cpr.id = ccf.routable_id "; 
				query += " LEFT JOIN ce_percentage_route_options cpro ON cpro.percentage_route_id = cpr.id";
				query += " LEFT JOIN ce_hunt_types cht2 ON cht2.id = cpro.ce_hunt_type_id ";
				query += " LEFT JOIN ce_hunt_options cho2 ON cho2.hunt_route_id = cht2.id ";
				query += " LEFT JOIN ce_schedule_routes csr ON csr.id = ccf.routable_id";
				query += " LEFT JOIN ce_schedule_options cso ON cso.schedule_route_id = csr.id";
				query += " WHERE ccf.default_ringto ilike '%"+searchText+"%' or cho.target_did ilike '%"+searchText+"%' or cgr.default_ringto ilike '%"+searchText+"%'";
				query += " or cio.target_did ilike '%"+searchText+"%' or cpro.target_did ilike '%"+searchText+"%' or cho2.target_did ilike '%"+searchText+"%' or csr.default_ringto ilike '%"+searchText+"%' or cso.target_did ilike '%"+searchText+"%'";
			var countQuery = "SELECT COUNT (distinct pr.provisioned_route_id) as count FROM ce_call_flows ccf ";
				countQuery += " JOIN provisioned_route pr ON pr.provisioned_route_id = ccf.provisioned_route_id ";
				countQuery += " JOIN org_unit ou ON ou.org_unit_id = pr.provisioned_route_ou_id AND ou.org_unit_status = 'active'";
				countQuery += " JOIN org_unit ou2 ON ou2.org_unit_id = ou.billing_id AND ou2.org_unit_status = 'active'";
				if(adminType == 'partner'){
					countQuery += " JOIN partner_admin_user pau ON pau.billing_ou_id = ou2.org_unit_id";
				}
				countQuery += " LEFT JOIN ce_hunt_types cht ON cht.id = ccf.hunt_option "; 
				countQuery += " LEFT JOIN ce_hunt_options cho ON cho.hunt_route_id = cht.id "; 
				countQuery += " LEFT JOIN ce_geo_routes cgr ON cgr.id = ccf.routable_id ";
				countQuery += " LEFT JOIN ce_ivr_routes cir ON cir.id = ccf.routable_id ";
				countQuery += " LEFT JOIN ce_ivr_options2 cio ON cio.ivr_route_id = cir.id ";
				countQuery += " LEFT JOIN ce_percentage_route cpr ON cpr.id = ccf.routable_id "; 
				countQuery += " LEFT JOIN ce_percentage_route_options cpro ON cpro.percentage_route_id = cpr.id";
				countQuery += " LEFT JOIN ce_hunt_types cht2 ON cht2.id = cpro.ce_hunt_type_id ";
				countQuery += " LEFT JOIN ce_hunt_options cho2 ON cho2.hunt_route_id = cht2.id ";
				countQuery += " LEFT JOIN ce_schedule_routes csr ON csr.id = ccf.routable_id";
				countQuery += " LEFT JOIN ce_schedule_options cso ON cso.schedule_route_id = csr.id";
				countQuery += " WHERE ccf.default_ringto ilike '%"+searchText+"%' or cho.target_did ilike '%"+searchText+"%' or cgr.default_ringto ilike '%"+searchText+"%'";
				countQuery += " or cio.target_did ilike '%"+searchText+"%' or cpro.target_did ilike '%"+searchText+"%' or cho2.target_did ilike '%"+searchText+"%' or csr.default_ringto ilike '%"+searchText+"%' or cso.target_did ilike '%"+searchText+"%'";
			callback(query, countQuery);
			break;
		case 'user_name':
			var query = "SELECT CONCAT(cu.first_name, ' ', cu.last_name, '(', cu.username, ')') as searchresult, LEFT(ou2.org_unit_name, 30) as account_name, ou2.org_unit_id AS billing_id ";
				query += " FROM ct_user cu  ";
				query += " JOIN org_unit ou on cu.ct_user_ou_id = ou.org_unit_id AND ou.org_unit_status = 'active' ";
				query += " JOIN org_unit ou2 on ou2.org_unit_id = ou.billing_id AND ou2.org_unit_status = 'active' ";
				if(adminType == 'partner'){
					query += " JOIN partner_admin_user pau ON pau.billing_ou_id = ou2.org_unit_id";
				}
				query += " WHERE cu.first_name ilike '%"+searchText+"%' or cu.last_name ilike '%"+searchText+"%'";
			var countQuery = "SELECT COUNT(cu.first_name) as count";
				countQuery += " FROM ct_user cu  ";
				countQuery += " JOIN org_unit ou on cu.ct_user_ou_id = ou.org_unit_id AND ou.org_unit_status = 'active' ";
				countQuery += " JOIN org_unit ou2 on ou2.org_unit_id = ou.billing_id AND ou2.org_unit_status = 'active' ";
				if(adminType == 'partner'){
					countQuery += " JOIN partner_admin_user pau ON pau.billing_ou_id = ou2.org_unit_id";
				}
				countQuery += " WHERE cu.first_name ilike '%"+searchText+"%' or cu.last_name ilike '%"+searchText+"%'";
			callback(query, countQuery);
			break;
		case 'user_ext_id':
				var query = "SELECT CONCAT(cu.first_name, ' ', cu.last_name, '(', cu.username, ')') as searchresult, LEFT(ou2.org_unit_name, 30) as account_name, ou2.org_unit_id AS billing_id ";
					query += " FROM ct_user cu  ";
					query += " JOIN org_unit ou on cu.ct_user_ou_id = ou.org_unit_id AND ou.org_unit_status = 'active' ";
					query += " JOIN org_unit ou2 on ou2.org_unit_id = ou.billing_id AND ou2.org_unit_status = 'active' ";
					if(adminType == 'partner'){
						query += " JOIN partner_admin_user pau ON pau.billing_ou_id = ou2.org_unit_id";
					}
					query += " WHERE cu.user_ext_id ilike '%"+searchText+"%'";
				var countQuery = "SELECT COUNT(cu.first_name) as count";
					countQuery += " FROM ct_user cu  ";
					countQuery += " JOIN org_unit ou on cu.ct_user_ou_id = ou.org_unit_id AND ou.org_unit_status = 'active' ";
					countQuery += " JOIN org_unit ou2 on ou2.org_unit_id = ou.billing_id AND ou2.org_unit_status = 'active' ";
					if(adminType == 'partner'){
						countQuery += " JOIN partner_admin_user pau ON pau.billing_ou_id = ou2.org_unit_id";
					}
					countQuery += " WHERE cu.user_ext_id ilike '%"+searchText+"%'";
				callback(query, countQuery);
				break;
		case 'email':
			var query = "SELECT CONCAT(cu.first_name, ' ', cu.last_name, '(', cu.username, ')') as searchresult, LEFT(ou2.org_unit_name, 30) as account_name, ou2.org_unit_id AS billing_id ";
				query += " FROM ct_user cu  ";
				query += " JOIN org_unit ou on cu.ct_user_ou_id = ou.org_unit_id AND ou.org_unit_status = 'active' ";
				query += " JOIN org_unit ou2 on ou2.org_unit_id = ou.billing_id AND ou2.org_unit_status = 'active' ";
				if(adminType == 'partner'){
					query += " JOIN partner_admin_user pau ON pau.billing_ou_id = ou2.org_unit_id";
				}
				query += " WHERE cu.username ilike '%"+searchText+"%'";
			var countQuery = "SELECT COUNT(cu.username) As count";
				countQuery += " FROM ct_user cu  ";
				countQuery += " JOIN org_unit ou on cu.ct_user_ou_id = ou.org_unit_id AND ou.org_unit_status = 'active' ";
				countQuery += " JOIN org_unit ou2 on ou2.org_unit_id = ou.billing_id AND ou2.org_unit_status = 'active' ";
				if(adminType == 'partner'){
					countQuery += " JOIN partner_admin_user pau ON pau.billing_ou_id = ou2.org_unit_id";
				}
				countQuery += " WHERE cu.username ilike '%"+searchText+"%'";
			callback(query, countQuery);
			break;
		case 'campaign_name':
			var query = "SELECT LEFT(c.campaign_name, 30) as searchresult, LEFT(ou2.org_unit_name, 30) as account_name, ou2.org_unit_id AS billing_id";
				query += " FROM campaign c";
				query += " JOIN org_unit ou on c.campaign_ou_id = ou.org_unit_id AND ou.org_unit_status = 'active'";
				query += " JOIN org_unit ou2 on ou2.org_unit_id = ou.billing_id AND ou2.org_unit_status = 'active'";
				if(adminType == 'partner'){
					query += " JOIN partner_admin_user pau ON pau.billing_ou_id = ou2.org_unit_id";
				}
				query += " WHERE c.campaign_name ilike '%"+searchText+"%'";
			var countQuery = "SELECT COUNT(c.campaign_name) AS count";
				countQuery += " FROM campaign c";
				countQuery += " JOIN org_unit ou on c.campaign_ou_id = ou.org_unit_id AND ou.org_unit_status = 'active'";
				countQuery += " JOIN org_unit ou2 on ou2.org_unit_id = ou.billing_id AND ou2.org_unit_status = 'active'";
				if(adminType == 'partner'){
					countQuery += " JOIN partner_admin_user pau ON pau.billing_ou_id = ou2.org_unit_id";
				}
				countQuery += " WHERE c.campaign_name ilike '%"+searchText+"%'";
			callback(query, countQuery);
			break;
		default:
			callback(false, false);
	}
}

module.exports = support;
