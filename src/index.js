
//
// Require
//

var _ = require('../common/helpers');
var Video = require('./widgets/video');
var P2PRoom = require('./p2pRoom');


//
// Setup
//

// DOM Cache
var remoteContainer = document.getElementById('remote');
//var offerButton     = document.getElementById('offer');

// Options
var serverURL = location.protocol + '//' + location.hostname;
var username  = location.hash ? location.hash.replace('#', '') : 'Anon';

// Local State
var state = {
    localVideo: new Video(username + ' (me)'),
    room: new P2PRoom('tivni', serverURL + ":8081")
};


//
// Methods
//

function onNewPeer (peer) {
    console.debug('NEW PEER!', peer);

    var video = new Video(peer.username);

    peer.pc.onaddstream = function (event) {
      console.debug('onaddstream for peer:', peer.username, event.stream.id);
      video.attachStream(event.stream);
    };

    peer.pc.addStream(state.localVideo.stream);

    video.appendTo(remoteContainer);
}

function joinRoom () {
    _.log('Attempting to join room...');
    state.room.join(username, onNewPeer, function (err) {
        console.error('Failed to join room:', err);
    });
}


//
// Listeners
//

//offerButton.addEventListener('click', joinRoom);


//
// Init
//

//Create local video
state.localVideo.appendTo(document.body);

// Get user media
navigator.webkitGetUserMedia({ video: true, audio: false }, function (stream) {
    state.localVideo.attachStream(stream);
    state.localVideo.reverseOutput();
    joinRoom();
}, _.reportError);

// Join room automatically

