var mysql           = require('mysql'),
	connector       = require('./appModel'),
	appModel        = require('./appModel'),
	ctTransactionModel = require('./ctTransactionModel'),
	yaml            = require("js-yaml"),
	f               = require('../functions/functions.js'),
	fs              = require("fs"),
	e               = yaml.load(fs.readFileSync("config/database.yml")),
	async           = require('async'),
	envVar          = process.env.NODE_ENV;
var timezone = 'UTC';

var report = {
	/*groupActivitySummary: function(data, ouId, res){
		if (data.timezone) { timezone = data.timezone; }
		var subQuery = "select org_unit_id from org_unit where org_unit_id = " + ouId + " or org_unit_parent_id = " + ouId + " or org_unit_parent_id IN(select org_unit_id from org_unit where org_unit_parent_id = " + ouId + ")"
		
		var query = "SELECT count(cd.call_id) AS total_calls,";
			query += "COALESCE(SUM(cdd.call_value),0) AS call_value,"
			query += "COUNT(CASE WHEN cd.repeat_call = false THEN 1 END) AS unique_calls,";
			query += "COUNT(CASE WHEN cd.disposition = 'ANSWERED' THEN 1 END) AS Answered,";
			query += "COUNT(CASE WHEN cd.disposition = 'NO ANSWER' THEN 1 END) AS voicemail,";
			query += "COUNT(CASE WHEN conversion.score_value > 50 THEN 1 END) AS conversion, ";
			query += "COUNT(CASE WHEN lead_score.score_value > 50 THEN 1 END) AS total_leads, ";
			query += "COALESCE(SUM(cdd.bill_second)::float/60,0) AS bill_minutes ";
			query += "FROM campaign as camp ";
			query += "JOIN org_unit AS ou ON camp.campaign_ou_id = ou.org_unit_id ";
			query += "JOIN campaign_provisioned_route cpr ON camp.campaign_id = cpr.campaign_id ";
			query += "JOIN provisioned_route pr ON cpr.provisioned_route_id = pr.provisioned_route_id AND pr.provisioned_route_id IS NOT NULL ";
			query += "LEFT JOIN provisioned_route_number prn ON pr.provisioned_route_id=prn.provisioned_route_id ";
			query += "LEFT JOIN phone_number pn ON (prn.phone_number_id=pn.number_id) ";
			query += "LEFT JOIN call AS cd ON cd.provisioned_route_id = pr.provisioned_route_id ";
			if(data.start_date && data.end_date) {
				if(data.end_date.length <= 10) data.end_date += ' 23:59:59';
				query += " AND cd.call_started BETWEEN '" + data.start_date +" "+timezone+"' AND '" + data.end_date +" "+timezone+"' ";
			}
			query += "LEFT JOIN call_detail AS cdd ON cdd.call_id = cd.call_id ";
			query += "LEFT JOIN indicator_score AS conversion ON conversion.call_id = cd.call_id AND conversion.indicator_id = 18 ";
			query += "LEFT JOIN indicator_score AS lead_score ON lead_score.call_id = cd.call_id AND lead_score.indicator_id = 51 ";
			query += "LEFT JOIN campaign_ct_user ccu ON (camp.campaign_id = ccu.campaign_id AND ccu.ct_user_id = "+ data.user_id + ") " ;
			//query += "WHERE pr.provisioned_route_id IS NOT NULL ";

			//query += "AND camp.campaign_ou_id IN ("+subQuery+") ";

			query += "WHERE ";
			if(data.role == 1) 
				query += "camp.campaign_ou_id IN(" + subQuery + ")";
			else if(data.role == 2) //stadard user
				query += "(ccu.ct_user_id = '"+ data.user_id + "' OR camp.campaign_owner_user_id = '"+ data.user_id + "') ";
			else if(data.role == 3) //Read-Only user
				query += "ccu.ct_user_id = '"+ data.user_id + "' ";


			connector.ctPool.query(query, function(err, data){
				if(err){
					return res(err);
				}
				return res(err, data);
			});
	},
	getGroupActivities: function(req, res) {
		var data = req.query;
		data.order = (data.order ? data.order : 'ou.org_unit_name');

		var groupBy = '';
		var qryPre = "SELECT COUNT(cd.call_id) AS total_calls, COALESCE(SUM(cdd.call_value),0) AS call_value, "+
			"COUNT(CASE WHEN cd.repeat_call = false THEN 1 END) AS unique_calls, "+
			"COUNT(CASE WHEN cd.disposition = 'ANSWERED' THEN 1 END) AS answered, "+
			"COUNT(CASE WHEN cd.disposition = 'NO ANSWER' THEN 1 END) AS voicemail, "+
			"COUNT(CASE WHEN conversion.score_value > 50 THEN 1 END) AS conversion, "+
			"COALESCE(SUM(cdd.bill_second),0)::float/60 AS billable_mintes, "+
			"COUNT(CASE WHEN lead_score.score_value > 50 THEN 1 END) AS leads, COUNT(*) OVER () AS TotalRecords, ou.org_unit_name, ou.org_unit_id, ou.org_unit_ext_id";
		if (data.secondary === "call.provisioned_route_id") {
			qryPre += ", pr.provisioned_route_name AS call_flow, pn.number AS tracking_number, pr.provisioned_route_id";
			groupBy = 'pr.provisioned_route_name, pn.number, pr.provisioned_route_id';
			data.order += ", pr.provisioned_route_name";
		} else if (data.secondary === 'c.campaign_id') {
			qryPre += ", c.campaign_name, c.campaign_ext_id, c.campaign_id";
			groupBy += "c.campaign_name, c.campaign_id, c.campaign_ext_id";
			data.order += ", c.campaign_name";
		}

		var qryCnt = "SELECT COUNT(call.call_id) AS total_calls, " +
			"COALESCE(SUM(cd.call_value),0) AS call_value, " +
			"COUNT(CASE WHEN call.repeat_call = false THEN 1 END) AS unique_calls, " +
			"COUNT(CASE WHEN call.disposition = 'ANSWERED' THEN 1 END) AS answered, " +
			"COUNT(CASE WHEN call.disposition = 'NO ANSWER' THEN 1 END) AS voicemail, " +
			"COUNT(CASE WHEN conversion.score_value > 50 THEN 1 END) AS conversion, " +
			"COUNT(CASE WHEN lead_score.score_value > 50 THEN 1 END) AS total_leads, " +
			"COALESCE(SUM(cd.bill_second)::float/60,0) AS bill_minutes";

		var qry = " FROM campaign AS c JOIN org_unit AS ou ON (c.campaign_ou_id=ou.org_unit_id) "+
			"JOIN campaign_provisioned_route AS cpr ON (c.campaign_id=cpr.campaign_id) "+
			"JOIN provisioned_route AS pr ON (cpr.provisioned_route_id=pr.provisioned_route_id) "+
			"LEFT JOIN provisioned_route_number AS prn ON (pr.provisioned_route_id=prn.provisioned_route_id) "+
			"LEFT JOIN phone_number pn ON (prn.phone_number_id=pn.number_id) "+
			"LEFT JOIN call ON (pr.provisioned_route_id=call.provisioned_route_id) "+
			"LEFT JOIN call_detail AS cd ON (call.call_id=cd.call_id) "+
			"LEFT JOIN indicator_score AS conversion ON (cd.call_id=conversion.call_id AND conversion.indicator_id=18) "+
			"LEFT JOIN indicator_score AS lead_score ON (cd.call_id=lead_score.call_id AND lead_score.indicator_id=51) "+
			"LEFT JOIN campaign_ct_user AS ccu ON (camp.campaign_id=ccu.campaign_id AND ccu.ct_user_id="+data.user_id+") "+
			"WHERE pr.provisioned_route_id IS NOT NULL AND (pr.provisioned_route_status='active' OR pr.provisioned_route_status='inactive') AND c.campaign_ou_id="+data.org_unit_id;
		if (data.start_date && data.end_date) {
			if (data.end_date.length <= 10) data.end_date += ' 23:59:59'; //if not time specified
			qry += " AND cd.call_started BETWEEN '"+data.start_date+" "+data.timezone+"' AND '"+data.end_date+" "+data.timezone+"'";
		}
		if (req.user.role === 2) { qry += " AND (ccu.ct_user_id='"+req.userid+"' OR c.campaign_owner_user_id='"+req.userid+"')"; }
		qry += data.filterRule+" GROUP BY ou.org_unit_name, ou.org_unit_id"+groupBy+" ORDER BY "+data.order+" ASC";
		if (data.exportData !== "true") { qry += " LIMIT "+data.limit+" OFFSET "+data.offset; }

		// execute the query
		var query = (data.count !== undefined && data.count === 'true' ? qryCnt+qry : qryPre+qry);
		connector.ctPool.query(query, function(err, retData) {
			if (err) { return res('Failed to execute group activity query. '+err); }
			res(null, retData);
		});
	}
	*/
};

function buildAdvancedFilterQry(filterArray, qryArray){
	filterArray	= filterArray.split(",");
	var flength = filterArray[0];
	filterArray.shift();

	var advancedFields = {
		ouid: 			     { "dbField": "ou.org_unit_id", "type": "where" , "typeOf" : "int"},
		group: 			     { "dbField": "ou.org_unit_id", "type": "where" , "typeOf" : "int"},
		ext_id: 			 { "dbField": "ou.org_unit_ext_id", "type": "where", "typeOf" : "txt"},
		call_flow: 		 	 { "dbField": "pr.provisioned_route_name", "type": "where", "typeOf" : "txt"},
		tracking_num: 	     { "dbField": "pn.number", "type": "where", "typeOf" : "int"},
		leads: 			 	 { "dbField": "COUNT(CASE WHEN lead_score.score_value > 50 THEN 1 END)", "type": "having", "typeOf" : "int"},
		campaign: 			 { "dbField": "camp.campaign_name", "type": "where", "typeOf" : "txt"},
		camp_ext_id: 	     { "dbField": "camp.campaign_ext_id", "type": "where", "typeOf" : "txt"},
		calls: 			 	 { "dbField": "count(cd.call_id)", "type": "having", "typeOf" : "int"},
		call_value: 		 { "dbField": "COALESCE(SUM(cdd.call_value),0)", "type": "having", "typeOf" : "int"},
		unique: 			 { "dbField": "COUNT(CASE WHEN cd.repeat_call = false THEN 1 END)", "type": "having", "typeOf" : "int"},
		voice_mail: 		 { "dbField": "COUNT(CASE WHEN cd.disposition = 'NO ANSWER' THEN 1 END)", "type": "having", "typeOf" : "int"},
		answered: 			 { "dbField": "COUNT(CASE WHEN cd.disposition = 'ANSWERED' THEN 1 END)", "type": "having", "typeOf" : "int"},
		billable_mintes: 	 { "dbField": "COALESCE(SUM(cdd.bill_second),0)::float/60", "type": "having", "typeOf" : "int"},
		conversion: 		 { "dbField": "COUNT(CASE WHEN conversion.score_value > 50 THEN 1 END)", "type": "having", "typeOf" : "int"}
	}

	var operators = {
		eq:  "=",
	    gt:  ">",
	    lt: "<",
	    include: "",
	    exclude: "NOT ",
	    contains: "ILIKE"

	}

	for (var i = 0; i < flength; i++) {
		var column = filterArray[0 + (i * 4)];
		var operator = filterArray[1 + (i * 4)];
		var include = filterArray[2 + (i * 4)];
		var text = filterArray[3 + (i * 4)];
		var opSym = "";
		operator = operators[operator];
		if(operators[include] === "NOT ")
			operator = convertOperator(operator);

		
		var adField = advancedFields[column];
		if (qryArray[adField["type"]].length > 0) qryArray[adField["type"]] = qryArray[adField["type"]] + "AND ";
		
		if(adField["typeOf"] === "txt"){
			opSym = "'";
			text = text.replace(/([\.\?\-\$\*\(\)\{\}\[\]\:\\)])/g, function rep(x) { return "\\"+x; });
			if (text.indexOf("'") > -1) // add escape character to single quotes
				text = text.replace(/'/g, "''");
		}
		
		if ((operator === 'ILIKE' || operator === 'NOT ILIKE') && column !== "tracking_num")
			text = "%" + text + "%";

		if(column === "tracking_num"){
			var adData = trackingNumberAdvancedFilter(operator, text, adField["dbField"], operators[include])
			if(adData.length > 0)
				qryArray[adField["type"]] = qryArray[adField["type"]] +" " + adData;
		}else{
			qryArray[adField["type"]] = qryArray[adField["type"]] +" "+ adField["dbField"] +" "+ operator +" "+ opSym + text + opSym + " ";	
		}
	}

	return qryArray;
}

function trackingNumberAdvancedFilter(operator, text, dbField, include){
	var advancedFilterVal;
	if(text.match(/^\d+$/)){
		if (include === "NOT "){
			operator = "!=";
			advancedFilterVal = "(" + dbField +" "+ operator +" "+ text + " OR pn.number IS NULL" + ")";
		}
		else{
			operator = "=";
			advancedFilterVal = dbField +" "+ operator +" "+ text;
		}
		return advancedFilterVal;
	}else{
		if (include === "NOT ") 
			dbField = dbField + " IS NOT NULL";
		else
			dbField = dbField + " IS NULL";

		if((operator === "=" || operator === "!=") && text === "Number Pool")
			return dbField;
		else if(operator === "!=")
			return "";

		if((operator === "ILIKE" || operator === "NOT ILIKE") && "Number Pool".toLowerCase().indexOf(text.toLowerCase()) > -1)
			return dbField;
		else if(operator === "NOT ILIKE")
			return "";
		
		return "pn.number = 1";
	}
}

function buildBasicFilterQry(search, groupingName, havingVariables){
	var havingCondition = "";
	//var num = search.match(/^\d+$/);
	var num = search.match(/^\d+(\.\d+)?$/);
	search = search.replace(/([\?\-\$\*\(\)\{\}\[\]\:\\)])/g, function rep(x) { return "\\"+x; });
	if (search.indexOf("'") > -1) // add escape character to single quotes
		search = search.replace(/'/g, "''");
	
	var basicHavingQry = "";
	var wh = "ou.org_unit_ext_id~* '.*?"+search+".*'";
	if(num){
		_.mapObject(havingVariables, function(val, key) {				
			if(key  === Object.keys(havingVariables)[Object.keys(havingVariables).length - 1])
				havingCondition = havingCondition +  havingVariables[key] + "=" + search;
			else
				havingCondition = havingCondition +  havingVariables[key] + "=" + search + " " + "OR ";
		});
	}else{
		wh += " OR ou.org_unit_name ~* '.*?"+search+".*'";
	}	

	var secondGroupingQryArray = [{
			"name" : "call_flow",
			"having": "pr.provisioned_route_name ~* '.*?"+search+".*'" + ((search.match(/^\d+$/) && search.length === 10) ? "OR pn.number= "+search : "") 
		},{
			"name" : "campaign",
			"having": "camp.campaign_name ~* '.*?"+search+".*'" + " OR camp.campaign_ext_id ~* '.*?"+search+".*'"
		}
	];

	if(search.toLowerCase() === "number pool")
		wh += " OR pn.number is NULL";

	var secondingGroup = [];

	if(groupingName !== "none") {
		secondingGroup = _.find(secondGroupingQryArray, function(grouping){ return grouping["name"] === groupingName; });
		basicHavingQry = (havingCondition !== "" ? havingCondition + " OR " : "") + secondingGroup['having'] + " OR " + wh;
	} else {
		basicHavingQry = (havingCondition !== "" ? havingCondition + " OR " : "") + wh;
	}
	return basicHavingQry;
}

function convertOperator(operator){
	mapped_keys = {
        "=": "!=",
        "<": ">=",
        ">": "<=",
        "ILIKE": "NOT ILIKE"
    };
    operator = mapped_keys[operator];
    return operator;
}

module.exports = report;
