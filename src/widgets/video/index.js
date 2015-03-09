
import { log } from '../../../common/helpers';
import template from './template';

export default class Video {
    constructor (name, stream) {

        var host = template(name);

        this.dom = {
            main : host,
            video: host.querySelector('video')
        };

        if (stream) {
            this.attachStream(stream);
        }
        // Listeners
        this.dom.main.addEventListener('click', this.onClick.bind(this));
        this.waitUntilReady();
    }

    attachStream (stream) {
        log(stream);
        this.stream = stream;
        this.dom.video.src = URL.createObjectURL(stream);
    }

    onClick (event) {
        var video = this.dom.video;
        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    }

    reverseOutput () {
        this.dom.video.style.transform = 'scale(-1, 1)';
    }

    appendTo (host) {
        host.appendChild(this.dom.main);
    }

    waitUntilReady () {
        var videoElement = this.dom.video;
        function waitUntilReady () {
            if (!(videoElement.readyState <= HTMLMediaElement.HAVE_CURRENT_DATA)) {
                // log('Remote stream is ready??', videoElement.readyState);
                videoElement.play();
            } else {
                // log('Not yet ready to play:', videoElement.readyState, videoElement.currentTime, videoElement.paused);
                setTimeout(waitUntilReady, 50);
            }
        }
        waitUntilReady();
    }
}

