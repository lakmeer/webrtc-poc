
// Require

var socket = require('socket.io');
//   http = require('http');


// Helpers

function log () {
  console.log.apply(console, arguments);
}


// Socket server

var io = socket(8081);

io.on('connection', function (socket) {
  console.log('Client connected.');

  socket.on('offer', function onOffer (sdp) {
    log('Received offer.', sdp.sdp.replace("\r\n", '').substring(0, 10));
    socket.broadcast.emit('offer', sdp);
  });

  socket.on('answer', function onAnswer (sdp) {
    log('Received answer.', sdp.sdp.replace("\r\n", '').substring(0, 10));
    socket.broadcast.emit('answer', sdp);
  });

  socket.on('candidate', function onCand (candidate) {
    log('Candidate:', candidate);
    socket.broadcast.emit('candidate', candidate);
  });
});


