
import io from 'socket.io-client';
import { id, log, reportError } from '../../common/helpers';
import Collection from '../../common/collection';
import Peer from './peer';


//
// P2PRoom Class
//
// TODO:
//
// - Don't join room or dispatch callback if room already joined
// - Similarly for leaving
// - Check for duplicate peers

export default class P2PRoom {
    constructor (name, config) {
        this.options = {
            name,
            config
        };
        this.state = {
            needsSettingUp: true,
            peers: new Collection
        };
        this.callbacks = {
            peerConnected: id,
            peerDisonnected: id,
            joinError: id
        };
        this.socket = io.connect(config.signalServer.hostname + ":" + config.signalServer.port);
    }


    //
    // External methods
    //

    // On: bind callbacks to important room events
    on (event, λ) {
      this.callbacks[event] = λ;
    }

    // Join: join the room by asking signaling server for peers to talk to
    join (username, meta) {
        log('Room::joining as', username);

        this.socket.emit('join', username, meta || {});

        if (this.state.needsSettingUp) {
            this.socket.on('offer',             this.onReceivedOffer.bind(this));
            this.socket.on('answer',            this.onReceivedAnswer.bind(this));
            this.socket.on('candidate',         this.onReceivedRemoteCandidate.bind(this));
            this.socket.on('peer-list',         this.onPeerList.bind(this));
            this.socket.on('peer-disconnected', this.onPeerDisconnected.bind(this));

            this.socket.on('join-error',        this.callbacks.joinError.bind(this));

            this.state.needsSettingUp = false;
        }
    }

    // Leave: stop talking to peers (but don't disconnect from signal server)
    leave () {
        this.socket.emit('leave');
        this.state.peers.forEach(peer => peer.pc.close());
        this.state.peers.clear();
    }


    //
    // Socket event handlers
    //

    onReceivedOffer (peerInfo, offerSdp) {
        log('Room::answerOffer - answering offer from', peerInfo.username);
        // If we're getting an offer (not an answer), the connection is only
        // halfway set up, so there is no Peer object on our end yet. Make one.
        var peer = this.createNewPeer(peerInfo);
        peer.dispatchAnswer(offerSdp, sessionDescription =>
            this.socket.emit('answer', peerInfo, sessionDescription));
    }

    onReceivedAnswer (peerInfo, answerSdp) {
        this.getPeer(peerInfo).setRemoteDescription(answerSdp);
    }

    onReceivedRemoteCandidate (peerInfo, candidate) {
        this.getPeer(peerInfo).saveIceCandidate(candidate);
    }

    // onPeerDisconnected - signal server told us a peer stopped talking
    onPeerDisconnected (peerInfo) {
        this.callbacks.peerDisconnected(peerInfo);
        // Turns out we don't have to do much, because the leave() function
        // called on the other end will terminate the PC which propagates to us
        this.state.peers.remove( this.getPeer(peerInfo) );
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
            peer.dispatchOffer(sessionDescription =>
                this.socket.emit('offer', peerInfo, sessionDescription));
        });
    }


    //
    // Helper methods
    //

    createNewPeer (peerInfo) {
        var peer = new Peer(peerInfo, this.options.config, candidate => this.socket.emit('candidate', candidate));
        this.state.peers.push(peer);
        this.callbacks.peerConnected(peer);
        return peer;
    }

    getPeer (peerInfo) {
        return this.state.peers.anyWith('id', peerInfo.id) || Peer.Zero();
    }

}

