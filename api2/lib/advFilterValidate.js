var timeStampToSec = require('../models/convertTimestampToSec'),
momentTimezone = require('moment-timezone'),
f = require('../functions/functions.js'),
_ = require('underscore');
var timezone = "";
var opratorUser = ["","","","","",""];
var advFilterValidate = {
    finalFilterValue : function(req, data){
        var orFlag = true;
				var flag = false;
				var filterValue = [];
				var finalAdvFilter = [];
                var i=0;
                var filterValue = [];
                var ar1=[];
                var ar2=[];
                var advFilterValue = req.query.filter.split(",");
                var flagOperator = true;
                timezone = req.query.timezone;
                var afterFilterValue = _.without(advFilterValue,"NONE","AND");
                var advTemp = afterFilterValue;
                var countOp = 0;
                var excludeSameOP = 0;
                var advTemp = afterFilterValue;
                var phoneFlag = "";
                if (data.filtertype == 'a' || advFilterValue.length>4 || data.filtertype == 'ha'){// get all column name for Query
					if(advTemp.length>2 || data.filtertype == 'a'){
						for ( var t = 0; t< advTemp.length ; t++){
							filterValue.push(advTemp[t]);
                            t = t+2;
                            excludeSameOP  = excludeSameOP +2;
						}
                    }
                    _.each(_.uniq(filterValue),function(j){
                        for (var t =0 ; t<advTemp.length;t++){

								if (j == advTemp[t]){
                                    if (orFlag){
										ar1.push("(");
                                        advFilterValidate.validateFilterValue(ar1, advTemp[t],advTemp[t+2], advTemp[t+1]);
                                        if(advTemp[t] == 'pn.number' || advTemp[t] == 'pn.number_str'){// exclude for tracking number is not working for numberpool
                                            if(advTemp[t+1] == '!=' || advTemp[t+1] == 'NOT ILIKE'){
                                                phoneFlag = "pn.number";
                                            }else{
                                                phoneFlag = '';
                                            }
                                        }
                                        orFlag = false
                                        countOp++ ;
									}else {
                                        // if(excludeSameOP >= 6){
                                        //    if(advTemp[1] != advTemp[t+1]){
                                        //         if(flagOperator){
                                        //             countOp++ ;
                                        //             ar2.push("(");
                                        //             advFilterValidate.validateFilterValue(ar2, advTemp[t],advTemp[t+2], advTemp[t+1]);
                                        //             flagOperator = false;
                                                    
                                        //         }else{
                                        //             ar2.push(" OR ");
                                        //             advFilterValidate.validateFilterValue(ar2, advTemp[t],advTemp[t+2], advTemp[t+1]);
                                        //             //ar2.push(")")
                                        //         }
                                                
                                        //     }else{
                                        //         ar1.push(" OR ")
                                        //         advFilterValidate.validateFilterValue(ar1, advTemp[t],advTemp[t+2], advTemp[t+1]);
                                                
                                        //     }
                                        //     //ar2.push(")")
                                        // }else{
                                            //console.log("======advTemp[t+2]========================cccccccccccc================",advTemp[t+1])
                                            if(advTemp[t] == 'pn.number' || advTemp[t] == 'pn.number_str'){// exclude for tracking number is not working for numberpool
                                                if(advTemp[t+1] == '!=' || advTemp[t+1] == 'NOT ILIKE'){
                                                    phoneFlag = "pn.number";
                                                }else{
                                                    phoneFlag = '';
                                                }
                                            }
                                                ar1.push(" OR ")
                                            

                                            advFilterValidate.validateFilterValue(ar1, advTemp[t],advTemp[t+2], advTemp[t+1]);
                                       // }
                                        
                                       
                                       //console.log("------------",phoneFlag);
                                    }
                                    
								}else{
                                    phoneFlag = ''; 
                                }
                                if(phoneFlag == 'pn.number'){
                                    ar1.push(" OR pn.number_str IS NULL");
                                }
                        }
                            ar1.push(")")
                           ar1.push(" AND ")
                            
                             
                            //
                            flagOperator = true;
                            orFlag = true
                            
                    })
                    
                    ar1.pop();// remove "AND" from ar1 array
                    ar1.unshift("AND ");
                    //finalAdvFilter = excludeSameOP >= 6 ? ar1.toString().replace(/,/g, "")+ ar2.toString().replace(/,/g, "")+" AND ": " AND "+ar1.toString().replace(/,/g, "");
                    finalAdvFilter = ar1.toString().replace(/,/g, "");
                    console.log(finalAdvFilter)
                    excludeSameOP = 0;
                    //kklk
                    excludeSameOP = 0;
                    //finalAdvFilter = finalAdvFilter.replace(/,/g, "");
                    flag = true;
                }
                data.order = (data.order !== undefined && data.order !== '' ? data.order : 'call_started');
                if (data.exportData === true) {
                    data.limit = 10000;
                    data.offset = 0;
                }
                
                if (data.filterRule !== undefined && data.filterRule.split(" ")[3] === 'NONE') {
                    data.filterRule = data.filterRule.replace("NONE", "");
                }
                if(flag === true){
                    finalAdvFilter = finalAdvFilter;
                }else{
                    data.filterRule =  data.filterRule != undefined ? data.filterRule.replace(/\\/g, '\\'): data.filterRule;
                    finalAdvFilter = (data.filterRule ? data.filterRule+' ' : '')
                    flag = false;
                }
    return finalAdvFilter ;

    },
    valPushToFilterArray : function(arrName,data,checkValType){
        var dataFilter = data;
        dataFilter.filterVal = f.pg_specialCharacter(dataFilter.filterVal);
        dataFilter.filterVal = dataFilter.filterVal.length > 2 ? dataFilter.filterVal.replace(/\\/g,"") : dataFilter.filterVal; 
        
            if(dataFilter.opUSE == 'ILIKE' || dataFilter.opUSE == 'NOT ILIKE' ){
                if(data.colName == 'pn.number' &&  dataFilter.opUSE == 'NOT ILIKE'){
                    arrName.push(dataFilter.colName +" "+dataFilter.opUSE+" '%"+ dataFilter.filterVal +"%'");
                }else{
                    arrName.push(dataFilter.colName +" "+dataFilter.opUSE+" '%"+ dataFilter.filterVal +"%'");
                }  
                
            }else if(checkValType == "true" || checkValType == "false"){
                arrName.push(dataFilter.colName +" "+dataFilter.opUSE+" %"+ dataFilter.filterVal +"%");
            }else if(dataFilter.opUSE == "NOT BETWEEN" || dataFilter.opUSE == "BETWEEN"){
                dataFilter.filterVal =dataFilter.filterVal.split("AND");
                dataFilter.filterVal = "'"+dataFilter.filterVal[0] + "' AND '" + dataFilter.filterVal[1]+ "'";
                dataFilter.filterVal = dataFilter.filterVal.replace(/,/g, "") 
                arrName.push(dataFilter.colName +" "+dataFilter.opUSE+" "+ dataFilter.filterVal +"");
            }else if(dataFilter.opUSE == "IS NOT NULL" || dataFilter.opUSE == "IS NULL"){
                console.log("======ddddddddddddddddddddddd===============")
                arrName.push(dataFilter.colName +" "+dataFilter.opUSE);
            }else{
                if(data.colName == 'pn.number' && dataFilter.opUSE == '!='){
                    arrName.push(dataFilter.colName +" "+dataFilter.opUSE+" '"+ dataFilter.filterVal +"'" );
                }else if(data.colName == 'sc.score_card_id'){
                        if(dataFilter.filterVal == 'unassigned'){
                            if(dataFilter.opUSE == '!='){
                                arrName.push("scc.score_card_call_status IS NOT NULL ");
                            }else{
                                arrName.push("CASE 	WHEN scc.score_card_call_status IS NULL THEN 'needs_scorecard' ELSE scc.score_card_call_status END IN('needs_scorecard')");
                            }
                            
                        }else{
                            arrName.push(dataFilter.colName +" "+dataFilter.opUSE+" "+ dataFilter.filterVal +"" );
                        }
                   
                }else if(dataFilter.opUSE == '!='){
                    arrName.push(dataFilter.colName +" "+dataFilter.opUSE+" '"+ dataFilter.filterVal +"'" );
                }else{
                    arrName.push(dataFilter.colName +" "+dataFilter.opUSE+" '"+ dataFilter.filterVal +"'" + dataFilter.extraColVal);
                }
            }
        
    },
    validateFilterValue : function(arrName,colName,filterVal,opUSE){
        var data = "";
        var colUse = colName.indexOf("COUNT") == 0 ? "COUNT" :colName;
        var colVal = filterVal;
        var oprator = opUSE;
        var extraColVal = '';
        var checkValFlag = "";    
        switch (colUse) {
            case "cext.call_data.name":
                colUse = "cext.call_data->'belongs_to'->0->>'name'";
                break;
            case "cext.call_data.address":
                colUse = "cext.call_data->'current_addresses'->0->>'street_line_1'";
                break;
            case "cext.call_data.city":
                colUse = "cext.call_data->'current_addresses'->0->>'city'";
                break;
            case "cext.call_data.state":
                colUse = "cext.call_data->'current_addresses'->0->>'state_code'";
                break;
            case "cext.call_data.zip":
                colUse = "cext.call_data->'current_addresses'->0->>'postal_code'";
                break;
            case "cext.call_data.line":
                colUse = "cext.call_data->>'line_type'";
                break;
            case "call.duration" :
                var tmp = timeStampToSec.convertToSec(colVal);
                    tmp = parseInt(moment.duration(tmp).asSeconds());
                    colVal = tmp;
                break;
            case "call.call_started" : 
                if ( oprator == '<=' || oprator == '>='){
                    colVal = oprator === "<=" ? f.fullDate(colVal, true) +" "+ timezone :f.fullDate(colVal, false) +" "+ timezone ;
                    colUse = colUse;
                    oprator = oprator; 
                    
                }else if(oprator == '!='){
                    colUse = colUse;
                    colVal = f.fullDate(colVal, false)+" "+ timezone +" AND "+ f.fullDate(colVal, true) +" "+ timezone +"";
                    oprator = "NOT BETWEEN";
                    //ar1.push(colUse+" NOT BETWEEN ' "+ f.fullDate(colVal, false)+" "+timezone +"' AND '"+ f.fullDate(colVal, true) +" "+ timezone +"'");
                }else{
                    colUse = colUse;
                    colVal = f.fullDate(colVal, false)+" "+ timezone +" AND "+ f.fullDate(colVal, true) +" "+ timezone;
                    oprator = "BETWEEN";
                    // ar1.push(colUse+" BETWEEN ' "+ f.fullDate(colVal, false)+" "+timezone +"' AND '"+ f.fullDate(colVal, true) +" "+ timezone +"'");
                }
                break;
            case "SUM( cd.bill_second)" :
                colUse = "COALESCE("+colUse+"/60::int`0) ";
                colVal = colVal;
                oprator =  oprator;
                break;
             case "cf.routable_type" :
                colUse = colUse;
                colVal = colVal;
                if(colVal === 'Hangup'){
                    colUse = 'cf.default_ringto';
                    colVal = 'hangup';
                } else if(colVal == 'number_pool'){
                    extraColVal = ' OR pn.number_str IS NULL';
                } else if(colVal == 'Toll_free'){
                    colUse = 'pn.number_type';
                    colVal = 'tfn';
                } else if(colVal === 'GeoRoute-claimedState'){
                    colUse = 'cf.routable_type';
                    colVal = 'GeoRoute';
                    extraColVal = " AND ce_gre.strategy = 'claimedState' ";
                } else if(colVal === 'GeoRoute-Claimed'){
                    colUse = 'cf.routable_type';
                    colVal = 'GeoRoute';
                    extraColVal = " AND ce_gre.strategy = 'Claimed' ";
                } else if(colVal === 'GeoRoute-Npa'){
                    colUse = 'cf.routable_type';
                    colVal = 'GeoRoute';
                    extraColVal = " AND ce_gre.strategy = 'Npa' ";
                } else if(colVal === 'GeoRoute-Zipcode'){
                    colUse = 'cf.routable_type';
                    colVal = 'GeoRoute';
                    extraColVal = " AND ce_gre.strategy = 'Zipcode' ";
                }

                oprator =  oprator;
                break;    
            case "SUM( cd.call_value)" :
                colUse = "COALESCE("+colUse+"::int`0) ";
                colVal = colVal;
                oprator =  oprator;
                break;
            case "COUNT" :
                colUse = "COALESCE("+colName+"`0) ";
                colVal = colVal;
                oprator =  oprator;
                break;
            case "pn.number_str" :
                colUse = colUse;
                colVal = colVal;
                //colVal = oprator == '!=' ? colVal + "' OR pn.number_str IS NULL" : colVal;
                oprator =  oprator;
                //console.log(colUse,"===============ph===========",colVal)
                break;            
            case "scc.final_score" :
                colUse = colUse+"::Int";
                colVal = colVal;
                oprator =  oprator;
                break;
            case "c.ct_user_id" :
                colUse = colUse;
                 oprator = (colVal=='unassigned')? (oprator == '!=') ? 'IS NOT NULL': 'IS NULL':oprator;
                break;  
            case "cf.record_until" :
                colUse = colUse;
                 oprator = ( colVal != 'true')? 'IS NOT NULL': 'IS NULL';
                break;      
            case "pcir.call_id" :
                colUse = colUse;
                 oprator = ( colVal == 'true')? 'IS NOT NULL': 'IS NULL';
                break;
            default:
                colUse = colUse;
                //colVal = colVal.indexOf("'") > -1 ? f.pg_escape_string1(colVal).replace(/\'/g,"'") : colVal;
                colVal = (colVal);
                oprator = oprator;
                extraColVal = '';
                break;         


        }
        //console.log(colVal.length)
       data = {
            "colName" : colUse,
            "filterVal" : colVal,
            "opUSE" : oprator,
            "extraColVal":extraColVal 
        }
        checkValType = "string";
        advFilterValidate.valPushToFilterArray(arrName,data,checkValFlag);

        

    },
    sortFilterValueOnOP : function(){

    },
    checkAndReplaceHash : function(str){
        if (typeof(str) == "string"){
            var idx =  str.indexOf("`");
            if (idx > -1 ){
                str = str.replace(/`/g,",");
            }
            
        }
    
        return str;
    
    },
    reverseReplaceHash : function(str){
        if (typeof(str) == "string"){
            var idx =  str.indexOf(",");
            if (idx > -1 ){
                str = str.replace(/,/g,"`");
            }
            
        }
    
        return str;
    
    }

};
module.exports = advFilterValidate;

 
