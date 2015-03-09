
import io from 'socket.io-client';
import { id, log, reportError } from '../../common/helpers';
import Collection from '../../common/collection';


//
// Helper Classes
//

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
// TODO:
//
// - Don't join room or dispatch callback if room already joined
// - Similarly for leaving
// - Check for duplicate peers

export default class P2PRoom {
    constructor (name, serverURL) {
        this.options = {
            name,
            serverURL
        };
        this.state = {
            peers: new Collection
        };
        this.callbacks = {
            peerConnected: id,
            peerDisonnected: id,
            joinError: id
        };
        this.socket = io.connect(serverURL);
    }


    //
    // External methods
    //

    // On: bind callbacks to important room events
    on (event, λ) {
      this.callbacks[event] = λ;
    }

    // Join: join the room by asking signaling server for peers to talk to
    join (username) {
        log('Room::joining as', username);

        this.socket.emit('join', username);

        this.socket.on('offer',             this.onReceivedOffer.bind(this)); //answerOffer.bind(this));
        this.socket.on('answer',            this.onReceivedAnswer.bind(this));
        this.socket.on('candidate',         this.onReceivedRemoteCandidate.bind(this)); //saveIceCandidate.bind(this));
        this.socket.on('peer-list',         this.onPeerList.bind(this));
        this.socket.on('peer-disconnected', this.onPeerDisconnected.bind(this));

        this.socket.on('join-error',        this.callbacks.joinError.bind(this));
    }

    // Leave: stop talking to peers (but don't disconnect from signal server)
    leave () {
        this.socket.emit('leave');
        this.state.peers.forEach(peer => peer.pc.close());
    }


    //
    // Socket event handlers
    //

    onReceivedOffer (peerInfo, offerSdp) {
        this.dispatchAnswer(peerInfo, offerSdp);
    }

    onReceivedAnswer (peerInfo, answerSdp) {
        var pc = this.getPeerConnection(peerInfo);

        if (pc) {
            pc.setRemoteDescription(new RTCSessionDescription(answerSdp));
        }
    }

    onReceivedRemoteCandidate (peerInfo, candidate) {
        this.saveIceCandidate(peerInfo, candidate);
    }

    // onPeerDisconnected - signal server told us a peer stopped talking
    onPeerDisconnected (peerInfo) {
        this.callbacks.peerDisconnected(peerInfo);
        // Turns out we don't have to do much, because the leave() function
        // called on the other end will terminate the PC which propagates to us
    }

    // onPeerList - signal server told us all the peers we can send offers to
    onPeerList (peerList) {
        if (peerList.length === 0) {
          log('Room::join - no-one is here :(  Wait for new peers.');
        } else {
          log('Room::join -', peerList.length, 'peers found!', peerList);
        }

        peerList.forEach(peerInfo => {
            var peer = this.createNewPeer(peerInfo);
            this.dispatchOffer(peer);
        });
    }


    //
    // Socket event dispatchers
    //

    // dispatchOffer - send offer sdp to a remote peer via the signal server
    dispatchOffer (peer) {
        peer.pc.createOffer(sessionDescription => {
            peer.pc.setLocalDescription(sessionDescription);
            this.socket.emit('offer', peer, sessionDescription);
        }, reportError, {
            mandatory: {
                OfferToReceiveAudio: true,
                OfferToReceiveVideo: true
            }
        });
    }

    dispatchAnswer (peerInfo, offerSdp) {
        log('Room::answerOffer - answering offer from', peerInfo.username);
        var peer = this.createNewPeer(peerInfo);

        peer.pc.setRemoteDescription( new RTCSessionDescription(offerSdp), () => {
            log('Creating set remote desc...');
            peer.pc.createAnswer(sessionDescription => {
                peer.pc.setLocalDescription(sessionDescription);
                log('Creating answer...', sessionDescription);
                this.socket.emit('answer', peerInfo, sessionDescription);
            }, reportError, {
                mandatory: {
                    OfferToReceiveAudio: true,
                    OfferToReceiveVideo: true
                }
            });
        }, reportError);
    }


    //
    // Helper methods
    //

    createNewPeer (peerInfo) {
        var peer = new Peer(peerInfo.id, peerInfo.username, this.createPeerConnection());
        this.state.peers.push(peer);
        this.callbacks.peerConnected(peer);
        return peer;
    }

    getPeerConnection (peerInfo) {
        var match = this.state.peers.anyWith('id', peerInfo.id);
        return match ? match.pc : undefined;
    }

    saveIceCandidate (peerInfo, candidate) {
        var pc = this.getPeerConnection(peerInfo);

        // Candidates must only be acknowledged if remoteDescription is set
        if (pc && pc.remoteDescription) {
          try {
            pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error(pc);
            throw e;
          }
        }
    }

    createPeerConnection (socket) {
        var pc = new webkitRTCPeerConnection({ iceServers: [] });

        // For any new PC created, start spamming ICE candidates
        pc.onicecandidate =  event => {
            if (!event || !event.candidate) {
                // reportError(('No ICE candidate:', event);
            } else {
                //log('Local candidate:', event.candidate.sdpMLineIndex, event.candidate.sdpMid);
                log('Room::createPeerConnection - Local candidate generated');
                this.socket.emit('candidate', event.candidate);
            }
        };

        return pc;
    }

}

