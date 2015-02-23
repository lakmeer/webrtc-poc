
// Require

var io = require('socket.io-client');
var serverURL = location.protocol + '//' + location.hostname;
var socket = io.connect(serverURL + ":8081");


// Helpers

function log () {
  console.log.apply(console, arguments);
}

function reportError (error) {
  console.error('Error:', error);
}

function addNewVideo (container) {
  var video = document.createElement('video');
  container.appendChild(video);
  return video;
}


// Local State

var remoteContainer = document.getElementById('remote');

var state = {
  pc: new webkitRTCPeerConnection({ iceServers: [] }),
  localVideo: document.getElementById('local')
};


// Handle peer connection events

state.pc.onaddstream = function (event) {

  if (!event) {
    log('Blank event!', event)
    return;
  }


  log('Remote stream received:', event.stream);
  var remoteVideo = addNewVideo(remoteContainer)
  remoteVideo.src = URL.createObjectURL(event.stream);


  function waitUntilReady () {
    if (!(remoteVideo.readyState <= HTMLMediaElement.HAVE_CURRENT_DATA)) {
    //  || remoteVideo.paused || remoteVideo.currentTime <= 0)) {
        log('Remote stream is ready??', remoteVideo.readyState);
        remoteVideo.play();
    } else {
      log('Not yet ready to play:',
          remoteVideo.readyState,
          remoteVideo.currentTime,
          remoteVideo.paused
         );

      setTimeout(waitUntilReady, 50);
    }
  }

  waitUntilReady();
};

state.pc.onicecandidate = function onLocalICE (event) {
  // log('Local candidate:', event.candidate);
  if (!event || !event.candidate) {
   // reportError('No ICE candidate:', event);
  } else {
    socket.emit('candidate', event.candidate);
  }
};


// Get user media

function attachToVideo (element) {
 return function attachToSpecificVideo (stream) {
    element.src = URL.createObjectURL(stream);
    element.play();
    state.pc.addStream(stream);
  };
}

// Answer incoming offers

function answerOffer (offerSdp) {
  log('answerOffer:', offerSdp);
  log(state.pc);
  state.pc.setRemoteDescription( new RTCSessionDescription(offerSdp), function () {
    log('Creating set remote desc...');
    state.pc.createAnswer(function (sessionDescription) {
      state.pc.setLocalDescription(sessionDescription);
      log('Creating answer...', sessionDescription);
      socket.emit('answer', sessionDescription);
    }, reportError, {
      mandatory: {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true
      }
    });
  }, reportError);
}



// Begin

socket.on('offer', answerOffer);
socket.on('answer', function (answerSdp) {
  state.pc.setRemoteDescription(new RTCSessionDescription(answerSdp));
});

socket.on('candidate', function (candidate) {
  //log('Received remote candidate:', candidate);
  state.pc.addIceCandidate(new RTCIceCandidate(candidate));
});

navigator.webkitGetUserMedia({ video: true, audio: true },
                             attachToVideo(state.localVideo),
                             reportError);


// UI Events

document.getElementById('offer').addEventListener('click', function (event) {
  state.pc.createOffer(function (sessionDescription) {
    state.pc.setLocalDescription(sessionDescription);
    socket.emit('offer', sessionDescription);
  }, reportError, {
    mandatory: {
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: true
    }
  });
}, false);

