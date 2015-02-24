/**
 * Created by ghoststreet on 2/24/15.
 */

var _ = require('../../../helpers');
var template = require('./template');

var Video = function(name, stream) {

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

};

Video.prototype.attachStream = function (stream) {
    this.stream = stream;
    this.dom.video.src = URL.createObjectURL(stream);
};

Video.prototype.onClick = function (event) {
    var video = this.dom.video;
    if (video.paused) {
        video.play();
    } else {
        video.pause();
    }
};

Video.prototype.appendTo = function (host) {
    host.appendChild(this.dom.main);
};

Video.prototype.waitUntilReady = function () {
    var videoElement = this.dom.video;
    function waitUntilReady () {
        if (!(videoElement.readyState <= HTMLMediaElement.HAVE_CURRENT_DATA)) {
            _.log('Remote stream is ready??', videoElement.readyState);
            videoElement.play();
        } else {
            _.log('Not yet ready to play:',
                videoElement.readyState,
                videoElement.currentTime,
                videoElement.paused
            );

            setTimeout(waitUntilReady, 50);
        }
    }
    waitUntilReady();

};

module.exports = Video;