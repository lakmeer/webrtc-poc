
//
// Require
//

import { log, getDom, reportError } from '../common/helpers';
import Video   from './widgets/video';
import P2PRoom from './p2pRoom';


//
// Setup
//

// DOM Cache
var remoteContainer = getDom('remote');
var joinButton      = getDom('join');
var leaveButton     = getDom('leave');

// Options
var serverURL = location.protocol + '//' + location.hostname;
var username  = location.hash ? location.hash.replace('#', '') : 'Anon';

// Local State
var state = {
    localVideo: undefined,
    remoteVideos: {}
}


//
// Set up Room
//

var room = new P2PRoom('tivni', serverURL + ":8081")

room.on('peerConnected', function (peer) {
    console.debug('NEW PEER!', peer);
    var video = new Video(peer.username);
    log(state.localVideo);
    peer.pc.addStream(state.localVideo.stream);
    peer.pc.onaddstream = function (event) {
      console.debug('onaddstream for peer:', peer.username, event.stream.id);
      video.attachStream(event.stream);
    };
    video.appendTo(remoteContainer);
    state.remoteVideos[peer.id] = video;
});

room.on('peerDisconnected', function (peer) {
    console.debug('PEER LOST', peer);
    var video = state.remoteVideos[peer.id];
    if (!video) { return; }
    delete state.remoteVideos[peer.id];
    remoteContainer.removeChild(video.dom.main);
});


//
// Listeners
//

joinButton.addEventListener('click', function joinRoom () {
    log('Requesting userMedia...');
    state.localVideo = new Video(username + ' (me)');
    state.localVideo.appendTo(getDom('local'));
    state.localVideo.markLocal();

    navigator.webkitGetUserMedia({ video: true, audio: false }, function (stream) {
        state.localVideo.attachStream(stream);
        log('Attempting to join room...');
        room.join(username);
    }, reportError);
});

leaveButton.addEventListener('click', function leaveRoom () {
    log('Leaving room...');
    for (var peerId in state.remoteVideos) {
      var video = state.remoteVideos[peerId];
      remoteContainer.removeChild(video.dom.main);
      delete state.remoteVideos[peerId];
    }
    state.localVideo.dom.main.parentNode.removeChild(state.localVideo.dom.main);
    room.leave();
});

