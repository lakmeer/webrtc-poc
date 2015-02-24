
// Require
var _ = require('../helpers');
var Video = require('./widgets/video');
var P2PRoom = require('./p2pRoom');


// Local State

var remoteContainer = document.getElementById('remote');
var serverURL = location.protocol + '//' + location.hostname;
var state = {
    localVideo: new Video('me'),
    room: new P2PRoom('tivni', serverURL + ":8081")
};

state.room.join(location.hash);

//Create local video
state.localVideo.appendTo(document.body);

// Get user media
/*navigator.webkitGetUserMedia({ video: true, audio: true }, function (stream) {
    state.localVideo.attachStream(stream);
    state.pc.addStream(stream);
}, _.reportError);*/


// TODO: Bind video-related stuff to the room peer callback

/*
 state.pc.onaddstream = function (event) {
 if (!event) {
 _.log('Blank event!', event);
 return;
 }

 _.log('Remote stream received:', event.stream);
 var video = new Video('something', event.stream);
 video.appendTo(remoteContainer);
 };

 */
