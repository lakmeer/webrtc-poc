
// Require

var socket = require('socket.io');
//   http = require('http');


// Helpers

function log () {
    console.log.apply(console, arguments);
}


// Socket server

var io = socket(8081);
var peerInfos = [];

var PeerInfo = function(id, username) {
    this.id = id;
    this.username = username || null;
};

io.on('connection', function (socket) {
    console.log('Client connected.');
    var myPeerInfo = new PeerInfo(socket.id);

    socket.on('join', function onJoin(username) {
        socket.emit('peerList', peerInfos);
        myPeerInfo.username = username;
        peerInfos.push(myPeerInfo);
    });

    socket.on('offer', function onOffer (sdp) {
        log('Received offer.', sdp.sdp.replace("\r\n", '').substring(0, 10));
        socket.broadcast.emit('offer', myPeerInfo, sdp);
    });

    socket.on('answer', function onAnswer (sdp) {
        log('Received answer.', sdp.sdp.replace("\r\n", '').substring(0, 10));
        socket.broadcast.emit('answer', myPeerInfo, sdp);
    });

    socket.on('candidate', function onCand (candidate) {
        log('Candidate:', candidate);
        socket.broadcast.emit('candidate', myPeerInfo, candidate);
    });
});


