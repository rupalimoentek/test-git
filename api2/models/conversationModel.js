const { ctPool } = require('./appModel');

var connector       = require('./appModel'),
    f               = require('../functions/functions.js'),
    moment = require('moment'),
    NON_REPLIED_STATUS = "'read','unread'",
    REPLIED_STATUS = 'replied',
    yaml   			= require("js-yaml"),
    fs              = require("fs"),
    ctTransactionModel = require('./ctTransactionModel'),
    rabbit          = yaml.load(fs.readFileSync("./config/rabbit.yml")),
    when            = require('when'),
    envVar          = process.env.NODE_ENV,
    host = rabbit[envVar].SMS_AMQP_HOST,
    sms_queue = rabbit[envVar].SMS_AMQP_ROUTING_KEY,
    user = rabbit[envVar].SMS_AMQP_USER,
    pass = rabbit[envVar].SMS_AMQP_PASSWORD,
    vhostsms = rabbit[envVar].SMS_AMQP_VIRTUAL_HOST,
    port = rabbit[envVar].SMS_AMQP_PORT;
    smsQ = "amqp://" + user + ":" + pass + "@" + host + ":" + port + "/" + vhostsms,
    amqp = require('amqplib'),
    TABLE = 'sms_conversation';

var conversationModel = {
    getAllConversation : function(req,res){
        var getConversation = {}
        var qryLimit = " LIMIT "+req.query.limit+" OFFSET "+req.query.offset
            async.waterfall([
                function(cb){
                    //common query for fetching active or inactive conversations
                    var qry = "SELECT c.* ,ou.org_unit_name, ou.org_unit_ext_id, cp.campaign_name, cp.campaign_ext_id, cu.user_status, cu.first_name || ' ' || cu.last_name as agent_name , cu.username as agent_email_id FROM sms_conversation c "
                        qry +="LEFT JOIN org_unit ou ON (c.org_unit_id=ou.org_unit_id) "
                        qry +="LEFT JOIN campaign cp ON (c.campaign_id=cp.campaign_id) "
                        qry +="LEFT JOIN provisioned_route pr ON (c.provisioned_route_id=pr.provisioned_route_id) "
                        qry +="LEFT JOIN ct_user cu ON (c.ct_user_id=cu.ct_user_id) "
                        qry +="WHERE c.org_unit_id IN ("+req.user.orglist+") " 
                        cb(null,qry);
                },
                function(qry,cb){
                    if(req.query.status != undefined && req.query.status === "read,unread"){
                        //if fetch-request if for active conversation - then fetch active convo.
                        getNonRepliedConversation(req , qry, NON_REPLIED_STATUS, qryLimit, function(err,data){
                            if(err){
                                cb(err)
                            }else{
                                //if user_status is deleted then set Deleted in email_id
                                _.forEach(data,function(user){
                                    user.conversation_started = moment.utc(user.conversation_started).tz(req.user.timezone).format('MM-DD-YY HH:mm:ss');
                                    user.conversation_ended = moment.utc(user.conversation_ended).tz(req.user.timezone).format('MM-DD-YY HH:mm:ss');
                                    if(user.user_status == 'deleted'){
                                        user.agent_email_id = 'Deleted'
                                    }
                                })
                              getConversation.conversation = data
                                getConversation.total_record = req.activeConversationCount;
                                cb(null)
                            }
                        })
                    }else{
                        //else request if for fetching inactive conversation
                        getRepliedConversation(req , qry, REPLIED_STATUS, qryLimit ,function(err,data){
                            if(err){
                                cb(err)
                            }else{
                                //if user_status is deleted then set Deleted in email_id
                                _.forEach(data,function(user){
                                    user.conversation_started = moment.utc(user.conversation_started).tz(req.user.timezone).format('MM-DD-YY HH:mm:ss');
                                    user.conversation_ended = moment.utc(user.conversation_ended).tz(req.user.timezone).format('MM-DD-YY HH:mm:ss');
                                    if(user.user_status == 'deleted'){
                                        user.agent_email_id = 'Deleted'
                                    }
                                })
                                getConversation.conversation = data
                                getConversation.total_record = req.inactiveConversationCount;
                                cb(null)
                            }
                        })
                    }
                }
            ],function(err,data){
                if(err){
                    console.log("Failed to fetch conversations")
                    res(err);
                }else{
                    console.log("Successfull in fetching conversations")
                    res(null,getConversation)
                }
            });
    },
    label: function(data, res) {
        var labelData = {
            label  : data.label
        };
        var updateData = {
            which: 'update',
            table : TABLE,
            values: labelData,
            where: ' WHERE conversation_id = ' + data.conversation_id
        };
        connector.ctPool.update(updateData, function(err, ret) {
            if (err) { return res('Failed to update label ' + err); }
            res(null, ret);
        });
    },
   badgeUpdation : function(req,res){
        // badge updation
        // by-default active conversation count will be zero
           var qry = "SELECT count(*) FROM sms_conversation WHERE conversation_status='unread' AND org_unit_id IN ("+req.user_permissions_ou_list+")"
           connector.ctPool.query(qry ,function(err, data){
               if(err){
                   return res(err);
               }else{
                   if(data.length > 0){
                       req.badge = parseInt(data[0].count);
                       return res(null);
                   }else{
                       req.badge = 0;
                       return res(null);
                   }
               }
           }) 
    },
    getBadgeCount : function(req, res){
        var qry = "SELECT count(*) FROM sms_conversation WHERE conversation_status='unread' AND org_unit_id IN ("+req.user.orglist+")"
        connector.ctPool.query(qry ,function(err, data){
            if(err){
                return res(err);
            }else{
                if(data.length > 0){
                    var badge = parseInt(data[0].count);
                    res(null, badge);
                }else{
                    return res(null, 0);
                }
            }
        });
    },
    setStatus: function (data, res) {
        var allowedStatus = ['deleted', 'read', 'unread', 'replied']
        //check if the conversation id is present
        if (data.conversation_id && allowedStatus.includes(data.conversation_status)) {
            var qry = "SELECT conversation_status from sms_conversation where conversation_id = " + data.conversation_id;
            connector.ctPool.query(qry, function (err, retData) {
                if (err) {
                    return res('Failed to update status ' + err);
                }
                if (retData.length === 0) {
                    return res('This conversation does not exist');
                }
                else if (retData.length > 0) {
                    //check if the status is already deleted
                    if (retData[0].conversation_status === 'deleted' && data.conversation_status === 'deleted') {
                        return res('This conversation is already archived')
                    }
                    else {
                        var statusData = {
                            conversation_status: data.conversation_status,
                            conversation_ended: 'CURRENT_TIMESTAMP'
                        };
                        //Update conversation status
                        var updateData = {
                            which: 'update',
                            table: TABLE,
                            values: statusData,
                            where: ' WHERE conversation_id = ' + data.conversation_id
                        };
                        connector.ctPool.update(updateData, function (err, ret) {
                            if (err) { return res('Failed to update status ' + err); }
                            res(null, ret);
                        });
                    }
                }
            })
        } else {
            return res('please provide valid status')
        }
    },
    postSMS: function(req, res){
        if(req.user.role_id == 1 || req.user.role_id == 2){
            var smsData = req.body;
            async.waterfall([
                function(cb){
                    //fetching conversations and updating conversation table 
                    var qry = "SELECT sc.conversation_status, ccf.status as call_flow_status, ccf.sms_enabled FROM sms_conversation as sc" 
                    qry += " JOIN ce_call_flows as ccf ON sc.tracking = ccf.dnis"
                    qry += " WHERE sc.conversation_id="+parseInt(smsData.conversation_id);
                    ctPool.query(qry, function(err, data){
                        if(err){
                            cb("Failed to send message");
                        }else{
                            if(data.length > 0){
                                var qry = "UPDATE sms_conversation SET conversation_ended = Now()"
                                var qryWhere = " WHERE conversation_id="+parseInt(smsData.conversation_id)
                                //updating active conversation as inactive
                                if(data[0].call_flow_status !=='active' || !data[0].sms_enabled){
                                    res("Failed to send message. Please make sure tracking number is an active and sms toggle is on.");
                                } else if(data[0].conversation_status == 'read' || data[0].conversation_status == 'unread'){
                                    qry += " ,conversation_status='replied' ,ct_user_id="+parseInt(smsData.ct_user_id)
                                    qry += qryWhere
                                    ctPool.query(qry, function(err, data){
                                        if(err){
                                            cb("Failed to send message");
                                        }else{
                                            cb(null);
                                        }
                                    })
                                }else if(data[0].conversation_status == 'deleted'){
                                    //replying to deleted conversation
                                    cb("This conversation is deleted. You can not reply to this conversation anymore.")
                                }else if(data[0].conversation_status == 'replied'){
                                    //replying to inactive conversation
                                    qry += qryWhere
                                    ctPool.query(qry, function(err, data){
                                        if(err){
                                            cb("Failed to send message");
                                        }else{
                                            cb(null);
                                        }
                                    })
                                }
                            }else{
                                cb("conversation not exist");
                            }  
                        }
                    })
                },
                function(cb){
                    //query for insertion in sms_message table
                    smsData.message = smsData.message.replace(/'/g, "''");
                    var qry="INSERT INTO sms_message (conversation_id,message,sms_type,ct_user_id,delivery_status) VALUES ("+parseInt(smsData.conversation_id)+",'"+smsData.message+"','outgoing',"+smsData.ct_user_id+",'pending')"
                    ctPool.query(qry, function(err,retData){
                        if(err){
                            cb("Failed to send message")
                        }else{
                            if(retData.length > 0){
                                smsData.sms_id = parseInt(retData[0].sms_id);
                                cb(null);
                            }else{
                                cb("Error in inserting message data.")
                            }
                        }
                    })
                }
            ],function(err){
                if(err){
                    res("Failed to send message");
                }else{
                        console.log('Transaction completed successfully')
                        //sending in queue to shout-point
                        var msg = {
                            "api_no": smsData.tracking_number,
                            "caller_no": smsData.caller_id,
                            "text_message": smsData.message,
                            "external_id": smsData.sms_id,
                            "external_group_id": "24651",
                            "status_webhook": {
                            "url": "dummyWebhookURL.com"
                            }
                        }
                        sendingToSMSq(msg,function(err, data){
                            if(err){
                                res(err);
                            }
                            res(null);
                        });
                }
            })
        }else{
            return res('You are not authorised to reply to this conversation');
        }
    },
    getChatHistory : function(req, res){
        var ctTrans = new ctTransactionModel.begin(function(err){
            if(err){return res(err)}
            async.waterfall([
                function(cb){
                    var qry = "SELECT conversation_status FROM sms_conversation "+
                        "WHERE conversation_id="+req.params.conversations_id;
                    ctTrans.query(qry , function(err , ret){
                        if(err){
                            cb(err);
                        }else if(ret && ret.length > 0){
                            if(ret[0].conversation_status == 'deleted'){
                                cb("Conversation is already archived.");
                            }else if(ret[0].conversation_status == 'unread'){
                                var updateQry = "UPDATE sms_conversation SET conversation_status='read' WHERE conversation_id="+req.params.conversations_id;
                                ctTrans.query(updateQry , function(err , res){
                                    if(err){
                                        cb(err);
                                    }else{
                                        cb(null);
                                    }
                                })
                            }else{
                                cb(null);
                            }
                        }else{
                            cb("Conversation is already archived.");
                        }
                    })
                },
                function(cb){
                    var qry = "SELECT sm.sms_id, sm.message, sm.sms_type as type, sm.sms_time as time from sms_message sm "+
                        "JOIN sms_conversation sc "+
                        "ON (sm.conversation_id=sc.conversation_id) "+
                        "WHERE sc.conversation_id="+req.params.conversations_id+" "+
                        "ORDER BY sm.sms_id"
                    ctTrans.query(qry , function(err , retData){
                        if(err){
                            cb(err)
                        }else if(retData && retData.length > 0){
                            _.forEach(retData,function(user){
                                user.time = moment.utc(user.time).tz(req.user.timezone).format('MM-DD-YY hh:mm A');
                            })
                            cb(null,retData)
                        }else{
                            cb("Conversation is already archived.")
                        }
                    })
                },
            ], function(err,data){
                if(err){
                    ctTrans.rollback(function(){
                        console.log('Failed to fetching chat history',err);
						res(err);
                    })
                }else{
                    ctTrans.commit(function(){
                        res(null , data);
                    })
                }
            })
        })
    }
}

module.exports = conversationModel;

function getNonRepliedConversation(req ,qry ,active, qryLimit, cb1){ 
    var qryMain = "AND c.conversation_status in ("+active+")" 
    async.waterfall([
        function(cb){
            //appending the main query with appropriate filter query chunks
            simplyFilterOut(req , qry ,qryMain, active ,function(err , appendedQry){
                if(err){
                    cb(err);
                }else{
                    cb(null,appendedQry);
                }
            })
        },
        function(qry,cb){
            //firing the query for count which consists of filter chunks and main query
            connector.ctPool.query(qry , function(err, retData){
                if(err){
                    cb(err)
                }else{
                    req.activeConversationCount = retData.length;
                    cb(null,qry);
                }
            })
        },
        function(qry,cb){
            //fetching the actual result
            qry += qryLimit;
            connector.ctPool.query(qry , function(err , retData){
                if(err){
                    cb(err)
                }else{
                    cb(null,retData);
                }
            });
        }
    ],function(err,retData){
        if(err){
            cb1(err);
        }else{
            cb1(null,retData);
        }
    })
}

function getRepliedConversation(req ,qry ,inactive, qryLimit, cb2){
    var qryMain = "AND c.conversation_status='"+inactive+"'"
    async.waterfall([
        function(cb){
            //appending the main query with appropriate filter query chunks
            simplyFilterOut(req , qry ,qryMain ,inactive, function(err , appendedQry){
                if(err){
                    cb(err);
                }else{
                    cb(null,appendedQry);
                }
            })
        },
        function(qry,cb){
            //firing the query for count which consists of filter chunks and main query
            connector.ctPool.query(qry , function(err,retData){
                if(err){
                    cb(err);
                }else{
                    req.inactiveConversationCount = retData.length;
                    cb(null,qry)
                }
            })

        },
        function(qry,cb){
            //fetching the actual result
            qry += qryLimit;
            connector.ctPool.query(qry , function(err , retData){
                if(err){
                    cb(err)
                }else{
                    cb(null,retData);
                }
            });
        }
    ],function(err,retData){
        if(err){
            cb2(err);
        }else{
            cb2(null,retData);
        }
    })
}

function simplyFilterOut(req , qry ,qryMain, status, cb3){
    var qryDateRange
    var qryOrderBy
    var cq = [] //comparing query columns
    var word
    async.waterfall([
        function(cb1){
            //comparision for basic filter
            var d = new Date(word);
            if(req.query !== undefined && req.query !== '' && req.query.filtertype === 's' && req.query.filter !== ''){
                //basic filter stuff
                word = f.pg_specialCharacter(req.query.filter)
                cq.push("ou.org_unit_name ILIKE '%" + (word) + "%'");
                cq.push("ou.org_unit_id::text ILIKE '%" + word + "%'");
                cq.push("ou.org_unit_ext_id ILIKE '%" + word + "%'");
                cq.push("cp.campaign_id::text ILIKE '%" + word +"%'");
                cq.push("cp.campaign_ext_id::text ILIKE '%" + word +"%'");
                cq.push("cp.campaign_name ILIKE '%" + (word) + "%'");
                cq.push("c.source ILIKE '%" + (word) + "%'");
                cq.push("c.label ILIKE '%" + (word) + "%'");
                cq.push("c.tracking ILIKE '%" + (word) + "%'");
                cq.push("cu.first_name ILIKE '%" + (word) + "%'");
                cq.push("cu.first_name || ' ' || cu.last_name ILIKE '%" + (word) + "%'");
                cq.push("cu.last_name ILIKE '%" + (word) + "%'");
                cq.push("cu.username ILIKE '%" + (word) + "%'");
                if (moment(word).isValid()) { //it's a date
                    var tempDate = moment(word).format("YYYY-MM-DD HH:mm:ss");
                    var simpleFilterDate = moment.tz(tempDate, req.user.timezone).utc().format("YYYY-MM-DD HH:mm:ss");
                    if (moment(word, 'MM-DD-YY', true).isValid()) {
                        var tempEndDate = moment.utc(simpleFilterDate).add(24, 'hours').format('YYYY-MM-DD HH:mm:ss');
                        cq.push("c.conversation_started BETWEEN '" + simpleFilterDate + "' AND '" + tempEndDate + "' ");
                        cq.push("c.conversation_ended BETWEEN '" + simpleFilterDate + "' AND '" + tempEndDate + "' ");
                    } else {
                        cq.push("c.conversation_started BETWEEN '" + simpleFilterDate + "' AND '" + f.reportFullDate(simpleFilterDate) + "' ");
                        cq.push("c.conversation_ended BETWEEN '" + simpleFilterDate + "' AND '" + f.reportFullDate(simpleFilterDate) + "' ");
                    }
                }
                cb1(null);
            }else{
                cb1(null);
            }
        },
        function(cb1){
            //date filter stuff
            //only to be applied for inactive conversations
            if(req.query.status != undefined && req.query.status === "read,unread" ){
                qryOrderBy =" ORDER BY c.conversation_status desc, c.conversation_ended desc";
                cb1(null);
            }else{
                qryOrderBy =" ORDER BY c.conversation_ended desc";
                var temp_start_date = moment(req.query.start_date).format("YYYY-MM-DD HH:mm:ss");
                var temp_end_date = moment(req.query.end_date).add(23, 'hours').add(59, 'minutes').add(59, 'seconds').format("YYYY-MM-DD HH:mm:ss");
                temp_start_date = moment.tz(temp_start_date, req.user.timezone).utc().format("YYYY-MM-DD HH:mm:ss");
                temp_end_date = moment.tz(temp_end_date, req.user.timezone).utc().format("YYYY-MM-DD HH:mm:ss");
                //var start_date = moment.utc(req.query.start_date).format('YYYY-MM-DD 00:00:00');
                //var end_date = moment.utc(req.query.end_date).format('YYYY-MM-DD 23:59:59');
                qryDateRange = " AND c.conversation_started BETWEEN '" + temp_start_date + "' AND '" + temp_end_date+"'"
                console.log('start', temp_start_date, 'end', temp_end_date);
                cb1(null);
            }
        },
        function(cb1){
            //appending the query chunks in to main query
            if(cq.length > 0){
                qry += qryMain 
                qry += ' AND (' + cq.join(' OR ') + ')';
                if(req.query.status == undefined){
                    qry += qryDateRange;
                }
                qry += qryOrderBy
                cb1(null,qry);
            }else{
                qry += qryMain
                if(req.query.status == undefined){
                    qry += qryDateRange;
                }
                qry += qryOrderBy
                cb1(null,qry);
            }
        }
    ],function(err,qry){
        if(err){
            cb3(err)
        }else{
            cb3(null,qry);
        }
    })
}

function sendingToSMSq(msg,res){
    //sending smsData to queue
    console.log("smsQ",smsQ)
    msg = JSON.stringify(msg)
        amqp.connect(smsQ).then(function (conn) {
            return when(conn.createChannel().then(function (ch) {
                var ok = ch.assertQueue(sms_queue, { durable: true });
                return ok.then(function () {
                    ch.sendToQueue(sms_queue, new Buffer(msg), { deliveryMode: true });
                    console.log(" [x] Sent '%s'", JSON.stringify(msg));
                   var cl =  ch.close();
                return cl;		 
               }, function (err) {
                    if(err){
                        console.log('err ' + err);
                        res(err)
                    }
                });
            }, function (err) {
               if(err){
                   console.log('Error making conn ' + err);
                   res(err);
                }
                res(null)
            })).ensure(function () { 
                console.log('mq closed***');conn.close(); 
                res(null);
            });
        }).then(null, console.warn);
}
