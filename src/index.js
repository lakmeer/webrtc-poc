
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
var joinVideoButton = getDom('join-video');
var joinAudioButton = getDom('join-audio');
var spectateButton  = getDom('spec');
var leaveButton     = getDom('leave');

// Options
var serverURL = location.protocol + '//' + location.hostname;
var username  = location.hash ? location.hash.replace('#', '') : 'Anon';

// Local State
var state = {
    localVideo: undefined,
    remoteVideos: {}
};


//
// Set up Room
//

var room = new P2PRoom('tivni', { signalServer: { hostname: serverURL, port: 8081 }, iceServers: [] });

room.on('peerConnected', function (peer) {

    console.debug('NEW PEER!', peer);

    switch (peer.meta.type) {
        case "audio":
        case "video":
            if (state.localVideo) {
                peer.pc.addStream(state.localVideo.stream);
            }

            var video = new Video(peer.username);
            peer.pc.onaddstream = function (event) {
              console.debug('onaddstream for peer:', peer.username, event.stream.id);
              video.attachStream(event.stream);
            };

            video.appendTo(remoteContainer);
            state.remoteVideos[peer.id] = video;

            if (peer.meta.type === 'audio') {
                video.showAudioOnly();
            }

            break;

        case "spectator":
            if (state.localVideo) {
                peer.pc.addStream(state.localVideo.stream);
            }

            var video = new Video(peer.username);
            video.showNoSignal();
            video.appendTo(remoteContainer);
            state.remoteVideos[peer.id] = video;

            break;

        default:
            console.error('Unknown peer type:', peer.meta.type);

    }

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

spectateButton.addEventListener('click', function joinRoom () {
    log('Attempting to join room as spectator...');
    room.join(username, { type: 'spectator' });
});

joinVideoButton.addEventListener('click', function joinRoom () {
    log('Requesting userMedia...');
    state.localVideo = new Video(username + ' (me)');
    state.localVideo.appendTo(getDom('local'));
    state.localVideo.markLocal();

    navigator.webkitGetUserMedia({ video: true, audio: false }, function (stream) {
        state.localVideo.attachStream(stream);
        log('Attempting to join room as broadcaster...');
        room.join(username, { type: 'video' });
    }, reportError);
});

joinAudioButton.addEventListener('click', function joinRoom () {
    log('Requesting userMedia (audio only)...');
    state.localVideo = new Video(username + ' (me)');
    state.localVideo.appendTo(getDom('local'));
    state.localVideo.markLocal();
    state.localVideo.showAudioOnly();

    navigator.webkitGetUserMedia({ video: false, audio: true }, function (stream) {
        state.localVideo.attachStream(stream);
        log('Attempting to join room as audio broadcaster...');
        room.join(username, { type: 'audio' });
    }, reportError);
});

leaveButton.addEventListener('click', function leaveRoom () {
    log('Leaving room...');
    for (var peerId in state.remoteVideos) {
      var video = state.remoteVideos[peerId];
      remoteContainer.removeChild(video.dom.main);
      delete state.remoteVideos[peerId];
    }
    if (state.localVideo) {
      state.localVideo.dom.main.parentNode.removeChild(state.localVideo.dom.main);
    }
    state.localVideo = undefined;
    room.leave();
});

