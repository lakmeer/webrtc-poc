
import { id, log, reportError } from '../../common/helpers';


//
// Peer Class
//

export default class Peer {
    constructor (info, iceConfig, λ) {
        this.id = info.id;
        this.username = info.username;
        this.meta = info.meta || {};
        this.pc = new webkitRTCPeerConnection(iceConfig);

        // Send any candidates we find to whom it may concern
        this.pc.onicecandidate = (event) => {
            if (!event || !event.candidate) {
                // reportError(('No ICE candidate:', event);
            } else {
                //log('Local candidate:', event.candidate.sdpMLineIndex, event.candidate.sdpMid);
                log('Peer::constructor - Local candidate generated');
                λ(event.candidate);
            }
        };
    }

    getInfo () {
        return {
            id: this.id,
            username: this.username,
            meta: this.meta
        };
    }

    saveIceCandidate (candidate) {
        // Candidates must only be acknowledged if remoteDescription is set
        if (this.pc && this.pc.remoteDescription) {
            try {
                this.pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error(this.pc);
                throw e;
            }
        }
    }

    setRemoteDescription (sdp, λ) {
        if (this.pc) {
            this.pc.setRemoteDescription(new RTCSessionDescription(sdp), λ);
        }
    }

    dispatchOffer (λ) {
        this.pc.createOffer(sessionDescription => {
            this.pc.setLocalDescription(sessionDescription);
            λ(sessionDescription);
        }, reportError, {
            mandatory: {
                OfferToReceiveAudio: true,
                OfferToReceiveVideo: true
            }
        });
    }

    dispatchAnswer (sdp, λ) {
        this.setRemoteDescription(sdp, () => {
            log('Creating set remote desc...');
            this.pc.createAnswer(sessionDescription => {
                this.pc.setLocalDescription(sessionDescription);
                log('Creating answer...', sessionDescription);
                λ(sessionDescription);
            }, reportError, {
                mandatory: {
                    OfferToReceiveAudio: true,
                    OfferToReceiveVideo: true
                }
            });
        }, reportError);
    }

    static Zero () {
        return {
            id: "0",
            username: 'ZeroUser',
            isZeroUser: true,
            saveIceCandidate: id,
            setRemoteDescription: id
        };
    }
}

