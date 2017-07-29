'use strict';

window.ld39 = {
    states: {},
    tiles: {},
    entities: {},
    util: {},
    gameWidth: 24,
    gameHeight: 20,
};

ld39.onLoad = function() {
    var width = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;

    var height = window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight;

    var container = document.getElementById('container');

    var pixelWidth = ld39.gameWidth * 8;
    var pixelHeight = ld39.gameHeight * 8;

    var widthScale = Math.floor(width / pixelWidth);
    var heightScale = Math.floor((height - 20) / pixelHeight);
    var scale = Math.max(1, Math.min(widthScale, heightScale));
    container.style.width = (scale * pixelWidth) + 'px';
    container.style.height = (scale * pixelHeight) + 'px';

    ld39.app = new PLAYGROUND.Application({
        smoothing: false,
        scale: scale,
        width: pixelWidth,
        height: pixelHeight,
        container: '#container',
        preferedAudioFormat: 'mp3',

        create: function() {
            this.loadImages('tiles', 'levels/level1');
        },

        ready: function() {
            this.setState(ld39.states.Game);
        }
    });
}
