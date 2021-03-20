var Memcached = require('memcached'),
    fs = require('fs'),
    yaml = require('js-yaml'),
    socket_io = require("socket.io"),
    io = socket_io(),
    _ = require('underscore'),
    conf = yaml.load(fs.readFileSync('config/config.yml'));
//consumeSms = require('./consumeSms');

var memcached = new Memcached(conf[envVar].memcached.server + ':' + conf[envVar].memcached.port, { retries: 10, retry: 10000 });
// Set io in the app to pass it to the bin/www to attach server instance
var socketApi = { io: io };

var socketConnections = [];
if (conf[envVar].SOCKET_CONN_ALLOWED_ORIGINS) {
    origins = conf[envVar].SOCKET_CONN_ALLOWED_ORIGINS.split(',');
    io.origins(origins);
}

if (conf[envVar].PROCESS_SMS) {
    // socket.io connection
    io.on("connection", function (socket) {
        console.log("Socket connected id: ", socket.id);
        socket.on("conversation:init", function (conversations) {
            //Find index if socket already added in the list 
            var socketIdIndex = _.findIndex(socketConnections, { socketId: socket.id });
            if (socketIdIndex === -1) {
                // Add socket id and tracking details if socket not added yet
                socketConnections.push({ socketId: socket.id, conversations: conversations });
            } else {
                // Update tracking details if socket id already present
                socketConnections[socketIdIndex] = { socketId: socket.id, conversations: conversations };
            }
            console.log('Socket connections', socketConnections);
        });
        // Handle socket disconnect event and remove socket from socketConnections list
        socket.on('disconnect', function () {
            var socketIdIndex = _.findIndex(socketConnections, { socketId: socket.id });
            console.log('disconnect socket connection: ', socket.id);
            if (socketIdIndex !== -1) {
                socketConnections.splice(socketIdIndex, 1);
            }
        });
    });
}

if (conf[envVar].PROCESS_SMS) {
    setInterval(function () {
        var conversationIds = _.map(socketConnections, function (conn) { return conn.conversations });
        var conversationIds = _.flatten(conversationIds);
        conversationIds.join().split(',');
        memcached.getMulti(conversationIds, function (err, data) {
            console.log('retrived Data', data);
            _.forEach(conversationIds, function (conversationId) {
                if (data[conversationId]) {
                    var smsList = data[String(conversationId)].split('@sep@');
                    _.forEach(smsList, function (sms) {
                        var smsDetails = JSON.parse(sms);
                        sendSmsToSocketConnections(conversationId, smsDetails);
                    })
                }
            })
        });
    }, 10000);
}

function sendSmsToSocketConnections(conversation_id, smsDetails) {
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
        io.to(socket.socketId).emit('conversation:receive-sms', smsDetails);
        console.log('Sms sent through socket with conversation_id: ', smsDetails.conversation_id);
    });
}

// Added consumer to receive sms and io reference passed for sending event
//consumeSms.connect(io, socketConnections);
module.exports = socketApi;