function mysqlTimestamp() {
	Number.prototype.padLeft = function(base,chr){
	   var  len = (String(base || 10).length - String(this).length)+1;
	   return len > 0? new Array(len).join(chr || '0')+this : this;
	};

	var d = new Date(),
		dformat = [ d.getFullYear(),
					(d.getMonth()+1).padLeft(),
					d.getDate().padLeft()].join('-')+
					' ' +
				  [ d.getHours().padLeft(),
					d.getMinutes().padLeft(),
					d.getSeconds().padLeft()].join(':');

		return dformat;
}

function formatDateTime(dt) {
	Number.prototype.padLeft = function(base,chr){
	   var  len = (String(base || 10).length - String(this).length)+1;
	   return len > 0? new Array(len).join(chr || '0')+this : this;
	};

	var d = new Date(dt),
		dformat = [ d.getFullYear(),
					(d.getMonth()+1).padLeft(),
					d.getDate().padLeft()].join('-')+
					' ' +
				  [ d.getHours().padLeft(),
					d.getMinutes().padLeft(),
					d.getSeconds().padLeft()].join(':');

	return dformat;
}

function prettyPhoneNumber(number){
	if (number === null || number.length !== 10) {
		return number;
	} else {
		var phoneNumber = number.replace(/(\d\d\d)(\d\d\d)(\d\d\d\d)/, "($1) $2-$3");
		return phoneNumber;
	}
}

function inDateRange(start, end, dte){
	start_date = null;
	if (start) {
		start_date = new Date(start);
	}
	var end_date = null;
	if (end) {
		end_date = new Date(end);
	}
	var chk_date = new Date(dte);
	if ((start_date <= chk_date || !start_date) && (chk_date <= end_date || !end_date)) {
		return true;
	} else {
		return false;
	}
}

function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function diffArray(a, b) {
	var seen = [], diff = [];
	for ( var i = 0; i < b.length; i++)
		seen[b[i]] = true;
	for ( var j = 0; j < a.length; j++)
		if (!seen[a[j]])
		diff.push(a[j]);
	return diff;
}

function removeJsonNode(obj, node){
	var r = {};
	for (var key in obj){
		if (key != node) {
			r[key] = obj[key];
		}
	}
	return r;
}

function pg_escape_string (str) {
	str = str.replace(/'/g,"''");
	return (str + '').replace(/[\\"()@!-*_,$%^\xAE]/g,'\\$&').replace(/\u0000/g, '\\0');
}

function replace_Hash(str){
	str = str.replace(/\\/g, ""); 
	str = str.replace(/#/g, ","); 
	return str;
}

function pg_escape_bracket (str) {
	str = str.replace("'","''");
  	return (str + '').replace(/[\\"@#!*$%^]/g,'\\$&').replace(/\u0000/g, '\\0');
}

function pg_escape_bracket1 (str) {
	return (str + '').replace(/[\\"@#!*$%^]/g,'\\$&').replace(/\u0000/g, '\\0');
}

function pg_escape_doublestash (str) {
	str = str.replace(/\\/g, '\\');
  	return str;
}

function pg_escape_str (str) {
	str = str.replace(/'/g, '"');
  	return str;
}

function pg_escape_str1 (str) {
	str = str.replace(/'/g, "''");
  	return str;
}

function empty(e) {

	if (typeof e == 'object') {
		return JSON.stringify(e) === '{}';
	}

	switch (e) {
	case "":
	case 0:
	case "0":
	case null:
	case false:
	case typeof this == "undefined":
		return true;
	default:
		return false;
	}
}

function stringConversionRouteType(str){
	str = str != undefined ? str.toLowerCase().replace(/\s+/g,"") : str;
	console.log("------------------------str---------------",str)
	switch(str){
		case 'local': str = 'SimpleRoute';
					  break;
		case 'ivr': str = 'IvrRoute2';
					  break;
		case 'percentage': str = 'PercentageBasedRoute';
					  break;
		case 'geo route': str = 'GeoRoute';
					  break;
		case 'yes': str = true;
					  break;
		case 'no': str = false;
					  break;			  			  
	}
	return str;
}

function stringConversionHuntType(str){
	str = str != undefined ? str.toLowerCase().replace(/\s+/g,"") : str;
	switch(str){
		case 'rollover': str = 'rollover';
					  break;
		case 'overflow': str = 'overflow';
					  break;
		case 'simultaneousring': str = 'simultaneous';
					  break;			  			  
	}
	return str;
}
function pg_escape_string (str) {
	str = str.replace(/'/g,"''");
	return (str + '').replace(/[\\"()@!-*_,$%^\xAE]/g,'\\$&').replace(/\u0000/g, '\\0');
}

function pg_escape_string1 (str) {
	return (str + '').replace(/[\\"()@!-*_,$%^\xAE]/g,'\\$&').replace(/\u0000/g, '\\0');
}

function pg_specialCharacter(str){
	if (str.length == 1 && (typeof(str)== "string")){
		if (str.indexOf('_') > -1 || str.indexOf("'") > -1 || str.indexOf('%') > -1){
			switch(str){
				case '_': 
				str = str.indexOf("_") > -1 ? pg_escape_string(str): str;
						break;
				case "'": 
				str = str.length > 1 ? pg_escape_string(str) : str.replace("'","''")  ;
						break;		
				case '%': 
				
				str = str.indexOf("%") > -1 ? pg_escape_string(str) : str;
						break;
				default : str = str;
						break;		
			}
		}
	}else{
		if(typeof(str)== "string"){
			str =  str.indexOf("'") > -1 ? pg_escape_string1(str).replace(/'/g,"''") : pg_escape_string(str);
		}
	}
	return str;
}

function reportFullDate(date){
	var dateStr = date.split(' ')[0];
	var dateArr = dateStr.split('-');
	var timeStr = date.split(' ')[1];
	var fDate = '';
	var timeArr = timeStr.split(':');
	console.log(timeArr[2][1]);
	if(timeStr === "00:00:00"){
		fDate = new Date(dateArr[0],parseInt(dateArr[1]-1),parseInt(dateArr[2]),23,59,59);
	}else if(timeArr[1] === "00" && timeArr[2] === "00"){
		fDate = new Date(dateArr[0],parseInt(dateArr[1]-1),parseInt(dateArr[2]),timeArr[0],59,59);
	}else if(timeArr[2] === "00"){
		fDate = new Date(dateArr[0],parseInt(dateArr[1]-1),parseInt(dateArr[2]),timeArr[0],timeArr[1],59);
	}else if(timeArr[2][1] === "0"){
		var temp = timeArr[2][0] + "9"
		fDate = new Date(dateArr[0],parseInt(dateArr[1]-1),parseInt(dateArr[2]),timeArr[0],timeArr[1], temp);
	}else{
		fDate = new Date(dateArr[0],parseInt(dateArr[1]-1),parseInt(dateArr[2]),timeArr[0],timeArr[1], timeArr[2]);
	}

	return formatDateTime(fDate);
}

function fullDate(date,toEnd){
	var dateStr = date.split(' ')[0];
	var dateArr = dateStr.split('-');
	var timeStr = date.split(' ')[1];
	var fDate = '';

	if (!timeStr) {
		switch(dateArr.length){
			case 1:
				if(toEnd){
					fDate = new Date(dateArr[0], 11, 31,23,59,59);
				} else {
					fDate = new Date(dateArr[0], 0, 1,0,0,0);
				}
			break;
			case 2:
				if (toEnd) {
					fDate = new Date(dateArr[0],parseInt(dateArr[1]),0,23,59,59);
				}else{
					fDate = new Date(dateArr[0],parseInt(dateArr[1]-1),1,0,0,0);
				}
			break;
			case 3:
				if (toEnd) {
					fDate = new Date(dateArr[0],parseInt(dateArr[1]-1),parseInt(dateArr[2]),23,59,59);
				}else{
					fDate = new Date(dateArr[0],parseInt(dateArr[1]-1),parseInt(dateArr[2]),0,0,0);
				}
			break;
		}
	} else {
		var timeArr = timeStr.split(':');
		switch(timeArr.length){
			case 1:
				if(toEnd){
					fDate = new Date(dateArr[0],parseInt(dateArr[1]-1),parseInt(dateArr[2]),timeArr[0],59,59);
				} else {
					fDate = new Date(dateArr[0],parseInt(dateArr[1]-1),parseInt(dateArr[2]),timeArr[0],0,0);
				}
			break;
			case 2:
				if (toEnd) {
					fDate = new Date(dateArr[0],parseInt(dateArr[1]-1),parseInt(dateArr[2]),timeArr[0],timeArr[1],59);
				}else{
					fDate = new Date(dateArr[0],parseInt(dateArr[1]-1),parseInt(dateArr[2]),timeArr[0],timeArr[1],0);
				}
			break;
			case 3:
				fDate = new Date(dateArr[0],parseInt(dateArr[1]-1),parseInt(dateArr[2]),timeArr[0],timeArr[1],timeArr[2]);
			break;
		}
	}
	return formatDateTime(fDate);
}

module.exports = {
	mysqlTimestamp: mysqlTimestamp,
	prettyPhoneNumber: prettyPhoneNumber,
	inDateRange: inDateRange,
	toTitleCase: toTitleCase,
	diffArray: diffArray,
	removeJsonNode: removeJsonNode,
	fullDate: fullDate,
	reportFullDate: reportFullDate,
	empty: empty,
	pg_escape_string:pg_escape_string,
	pg_escape_string1:pg_escape_string1,
	pg_escape_bracket1:pg_escape_bracket1,
	pg_escape_str:pg_escape_str,
	pg_escape_bracket:pg_escape_bracket,
	pg_escape_str1:pg_escape_str1,
	replace_Hash:replace_Hash,
	pg_specialCharacter:pg_specialCharacter,
	stringConversionRouteType:stringConversionRouteType,
	pg_escape_doublestash:pg_escape_doublestash,
	stringConversionHuntType: stringConversionHuntType
};
