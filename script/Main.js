'use strict';

window.ld39 = {
    states: {},
    tiles: {},
    entities: {},
    util: {},
    gameWidth: 24,
    gameHeight: 20,
};

ld39.util.unlockLevel = function(lvl) {
    if (lvl <= ld39.util.lastUnlocked)
        return;
    ld39.util.lastUnlocked = lvl;
    try {
        localStorage.setItem('lastUnlocked', lvl.toString());
    } catch(e) {}
}
ld39.onLoad = function() {
    ld39.util.lastUnlocked = 0;
    try {
        var unlock = parseInt(localStorage.getItem('lastUnlocked'));
        if (unlock >= 0) {
            ld39.util.lastUnlocked = unlock;
        }
    } catch(e) {}

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
    var heightScale = Math.floor((height - 40) / pixelHeight);
    var scale = Math.max(1, Math.min(widthScale, heightScale));
    container.style.width = (scale * pixelWidth) + 'px';
    container.style.height = (scale * pixelHeight) + 'px';

    ld39.app = new PLAYGROUND.Application({
        smoothing: false,
        scale: scale,
        width: pixelWidth,
        height: pixelHeight,
        container: '#container',

        create: function() {
            this.loadData('levels');
            this.loadImages('tiles');
            this.loadSounds('shoot', 'death', 'powerup', 'notEnoughPower',
                'turretOn', 'turretOff', 'keycard', 'transporter', 'door');
        },

        ready: function() {
            this.setState(ld39.states.Menu);
        }
    });
}
