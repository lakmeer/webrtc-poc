
// Require

var socket = require('socket.io');
var fs     = require('fs');
var https  = require('https');

var Collection = require('../common/collection');
var PeerInfo   = require('../common/peerInfo');
var log        = require('../common/helpers').log;


// State

var peerInfos = new Collection();


// Socket server

var credentials = {
  key: fs.readFileSync(__dirname + '/ssl/key.pem').toString(),
  cert: fs.readFileSync(__dirname + '/ssl/cert.pem').toString(),
  passphrase: ''
};

// Handler (shouldn't be necessary)
function reqIgnorer (req, res, next) {
  log('Ignoring GET:', req.url);
  res.end("NO");
}

var server = https.createServer(credentials, reqIgnorer);
var io = socket.listen(server);
server.listen(8081);


io.on('connection', function (socket) {
    var myPeerInfo = new PeerInfo(socket.id);

    console.log('Client connected.', socket.id, '(no name until join)');

    socket.on('error', function () {
      console.log(arguments);
    });

    socket.on('join', function onJoin (username) {
        if (peerInfos.anyWith('id', socket.id)) {
          log("- Socket ID collision:", socket.id);
          socket.emit('join-error', 'Id collision: ' + socket.id);
        } else if (peerInfos.anyWith('name', username)) {
          log("- Username collision:", username);
          socket.emit('join-error', 'Username collision: ' + username);
        } else {
          log('Join:', username);
          socket.emit('peerList', peerInfos.members);
          myPeerInfo.username = username;
          peerInfos.push(myPeerInfo);
        }
    });

    socket.on('offer', function onOffer (targetPeer, sdp) {
        myPeerInfo.initiator = true;
        log('Received offer from', myPeerInfo.username, '-', sdp.sdp.replace("\r\n", '').substring(0, 12));
        socket.to(targetPeer.id).emit('offer', myPeerInfo, sdp);
    });

    socket.on('answer', function onAnswer (targetPeer, sdp) {
        log('Received answer from', myPeerInfo.username, '-', sdp.sdp.replace("\r\n", '').substring(0, 12));
        socket.to(targetPeer.id).emit('answer', myPeerInfo, sdp);
    });

    socket.on('candidate', function onCand (candidate) {
        //log('Candidate:', candidate);
        socket.broadcast.emit('candidate', myPeerInfo, candidate);
    });

    socket.on('disconnect', function () {
      log('Client disconnected:', socket.id, '(' + (myPeerInfo.username || 'no name') + ')');
      peerInfos.remove(myPeerInfo);
    });
});

