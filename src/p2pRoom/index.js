/**
 * Created by ghoststreet on 2/24/15.
 */

var io = require('socket.io-client');
var _ = require('../../helpers');

var Peer = function (id, username, pc) {
    this.id = id;
    this.username = username;
    this.pc = pc;
};

var P2PRoom = function (name, serverURL) {
    this.name = name;
    this.serverURL = serverURL;
    this.peers = [];
    this.socket = io.connect(serverURL);
    this.onNewPeer = _.id;
};

function createPeerConnection(socket) {
    var pc = new webkitRTCPeerConnection({ iceServers: [] });

    pc.onicecandidate = function onLocalICE (event) {
        // _.log('Local candidate:', event.candidate);
        if (!event || !event.candidate) {
            // _._._.reportError(('No ICE candidate:', event);
        } else {
            socket.emit('candidate', event.candidate);
        }
    };

    return pc;
}

P2PRoom.prototype.join = function (username, onNewPeer) {
    var self = this;
    this.socket.emit('join', username);
    this.onNewPeer = onNewPeer;

    _.log('joining as ', username);

    this.socket.on('peerList', function(list) {
        _.log('got peerList', list);;
        list.forEach(function (peerInfo) {
            var pc = createPeerConnection(self.socket);
            var peer = new Peer(peerInfo.id, peerInfo.username, pc);
            self.createOffer(pc);
            self.peers.push(peer);
        });
    });
};

P2PRoom.prototype.createOffer = function (pc) {
    _.log('createOffer for ', pc);

    var self = this;

    pc.createOffer(function (sessionDescription) {
        pc.setLocalDescription(sessionDescription);
        self.socket.emit('offer', sessionDescription);
    }, _.reportError, {
        mandatory: {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true
        }
    });
};

P2PRoom.prototype.getPeerConnection = function (peerInfo) {
    var matches = this.peers.filter(function (peer) {
        return peer.id === peerInfo.id;
    });
    return matches.length ? matches[0] : null;
};

P2PRoom.prototype.listen = function () {
    this.socket.on('offer', this.answerOffer);
    this.socket.on('answer', this.saveRemoteDescription);
    this.socket.on('candidate', this.saveIceCandidate);
};

P2PRoom.prototype.answerOffer = function answerOffer (peerInfo, offerSdp) {
    //create a new peer connection for the offer
    var pc = createPeerConnection(this.socket);
    var self = this;
    this.peers.push(new Peer(peerInfo.id, peerInfo.username, pc));

    _.log('answerOffer:', offerSdp, pc);

    pc.setRemoteDescription( new RTCSessionDescription(offerSdp), function () {
        _.log('Creating set remote desc...');
        pc.createAnswer(function (sessionDescription) {
            pc.setLocalDescription(sessionDescription);
            _.log('Creating answer...', sessionDescription);
            self.socket.emit('answer', sessionDescription);
        }, _.reportError, {
            mandatory: {
                OfferToReceiveAudio: true,
                OfferToReceiveVideo: true
            }
        });
    }, _.reportError);
};

P2PRoom.prototype.saveRemoteDescription = function (peerInfo, answerSdp) {
    var pc = this.getPeerConnection(peerInfo);
    if (pc) {
        pc.setRemoteDescription(new RTCSessionDescription(answerSdp));
    }
};

P2PRoom.prototype.saveIceCandidate = function (peerInfo, candidate) {
    var pc = this.getPeerConnection(peerInfo);
    //_.log('Received remote candidate:', candidate);
    if (pc) {
        pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
};

module.exports = P2PRoom;
