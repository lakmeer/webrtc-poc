/**
 * Created by ghoststreet on 2/24/15.
 */

var io = require('socket.io-client');
var _ = require('../../common/helpers');


// Helper functions

function createPeerConnection(socket) {
    var pc = new webkitRTCPeerConnection({ iceServers: [] });

    pc.onicecandidate = function onLocalICE (event) {
        if (!event || !event.candidate) {
            // _.reportError(('No ICE candidate:', event);
        } else {
            //_.log('Local candidate:', event.candidate.sdpMLineIndex, event.candidate.sdpMid);
            _.log('Room::createPeerConnection - Local candidate generated');
            socket.emit('candidate', event.candidate);
        }
    };

    return pc;
}


// Helper Classes

class Peer {
    constructor (id, username, pc) {
        this.id = id;
        this.username = username;
        this.pc = pc;
    }
}


//
// P2PRoom Class
//

export default class P2PRoom {
    constructor (name, serverURL) {
        this.name = name;
        this.serverURL = serverURL;
        this.peers = [];
        this.socket = io.connect(serverURL);
        this.onNewPeer = _.id;
    }

    join (username, peerCb, errorCB) {
        var self = this;

        this.peerCb  = peerCb || _.id;
        this.errorCB = errorCB || _.id;

        _.log('Room::joining as', username);

        this.socket.emit('join', username);

        this.socket.on('offer',      this.answerOffer.bind(this));
        this.socket.on('answer',     this.saveRemoteDescription.bind(this));
        this.socket.on('candidate',  this.saveIceCandidate.bind(this));
        this.socket.on('join-error', this.errorCB);
        this.socket.on('peerList', function(list) {
            if (list.length === 0) {
              _.log('Room::join - no-one is here :(  Wait for new peers.');
            } else {
              _.log('Room::join -', list.length, 'peers found!', list);
            }

            list.forEach(function (peerInfo) {
                var pc = createPeerConnection(self.socket);
                var peer = new Peer(peerInfo.id, peerInfo.username, pc);
                self.createOffer(peer);
                self.addPeer(peer);
            });
        });
    }

    addPeer (peer) {
        this.peers.push(peer);
        this.peerCb(peer);
    }

    createOffer (peer) {
        _.log('Room::createOffer - new offer for', peer.username);

        var self = this;
        var pc = peer.pc;

        pc.createOffer(function (sessionDescription) {
            pc.setLocalDescription(sessionDescription);
            self.socket.emit('offer', peer, sessionDescription);
        }, _.reportError, {
            mandatory: {
                OfferToReceiveAudio: true,
                OfferToReceiveVideo: true
            }
        });
    }

    answerOffer (peerInfo, offerSdp) {
        var pc = createPeerConnection(this.socket);
        var self = this;

        _.log('Room::answerOffer - answering offer from', peerInfo.username);

        this.addPeer(new Peer(peerInfo.id, peerInfo.username, pc));

        pc.setRemoteDescription( new RTCSessionDescription(offerSdp), function () {
            _.log('Creating set remote desc...');
            pc.createAnswer(function (sessionDescription) {
                pc.setLocalDescription(sessionDescription);
                _.log('Creating answer...', sessionDescription);
                self.socket.emit('answer', peerInfo, sessionDescription);
            }, _.reportError, {
                mandatory: {
                    OfferToReceiveAudio: true,
                    OfferToReceiveVideo: true
                }
            });
        }, _.reportError);
    }

    getPeerConnection (peerInfo) {
        var matches = this.peers.filter(function (peer) {
            return peer.id === peerInfo.id;
        });
        return matches.length ? matches[0].pc : null;
    }

    saveRemoteDescription (peerInfo, answerSdp) {
        var pc = this.getPeerConnection(peerInfo);
        if (pc) {
            pc.setRemoteDescription(new RTCSessionDescription(answerSdp));
        }
    }

    saveIceCandidate (peerInfo, candidate) {
        //_.log('saveIceCandidate', peerInfo, candidate);
        var pc = this.getPeerConnection(peerInfo);
        if (pc) {
            try {
                pc.addIceCandidate(new RTCIceCandidate(candidate));
                console.debug("Saved candidate", candidate);
            } catch (ex) {
                console.error("Candidate failed to be added:", candidate);
            }
        }
    }

    onNewPeer (λ) {
        this.peerCb = λ;
    }
}

