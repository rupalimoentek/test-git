var yaml = require("js-yaml"),
    fs = require("fs"),
    envVar = process.env.NODE_ENV,
    amqp = require('amqplib/callback_api'),
    _ = require('underscore'),
    rabbit = yaml.load(fs.readFileSync("./config/rabbit.yml")),
    url = 'amqp://' + rabbit[envVar].user + ':' + rabbit[envVar].password + '@' + rabbit[envVar].host + ':' + rabbit[envVar].port + '/' + rabbit[envVar].sms_vhost;

function consumeSmsQ(socketIO, socketConnections) {
    var receive_sms_queue = rabbit[envVar].receive_sms_queue;
    if (receive_sms_queue) {
        amqp.connect(url + "?heartbeat=60", (function (err, conn) {
            if (err) {
                throw err;
            } else {
                process.once('SIGINT', function () { conn.close(); });
                return conn.createChannel(function (err, ch) {
                    var q = receive_sms_queue;
                    ch.assertQueue(q, {
                        durable: true
                    });
                    ch.prefetch(1);
                    ch.consume(q, doWork, { noAck: false });
                    function doWork(msg) {
                        console.log(`Received sms : ${msg.content.toString()}`);
                        if (msg.content) {
                            try {
                                var data = JSON.parse(msg.content.toString());
                                sendSmsToSocketConnections(data.conversation_id, socketConnections, socketIO, data)
                                ch.ack(msg);
                            } catch (err) {
                                console.log('sms send err', err);
                                ch.ack(msg);
                            }
                        }
                    }
                });
            }
        }));
    }
}

//Send sms to socket connection
function sendSmsToSocketConnections(conversation_id, socketConnections, socketIO, smsDetails) {
    // Filter socket connetions for active socket connection of tracking number
    var sockets = _.filter(socketConnections, function (connection) {
        return (connection.conversations.indexOf(conversation_id) !== -1 ? true : false);
    });
    sockets = _.forEach(sockets, function (socket) {
        smsDetails.time = smsDetails.sms_time;
        smsDetails.type = smsDetails.sms_type;
        delete smsDetails.sms_time;
        delete smsDetails.sms_type;
        // send sms data to each active connection related to tracking number
        socketIO.to(socket.socketId).emit('conversation:receive-sms', smsDetails);
        console.log('Sms sent through socket with conversation_id: ', smsDetails.conversation_id);
    });
}

module.exports.connect = consumeSmsQ;