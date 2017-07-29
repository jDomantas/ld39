function onLoad() {
    var width = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;

    var height = window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight;

    var container = document.getElementById('container');
    var widthScale = Math.floor(width / 320);
    var heightScale = Math.floor((height - 20) / 240);
    var scale = Math.max(1, Math.min(widthScale, heightScale));
    container.style.width = (scale * 320) + 'px';
    container.style.height = (scale * 240) + 'px';

    window.app = new PLAYGROUND.Application({
        smoothing: false,
        scale: scale,
        width: 320,
        height: 240,
        container: '#container',
        preferedAudioFormat: 'mp3',

        create: function() {
            this.loadSounds('jump', 'music');
        },

        ready: function() {
            this.music.play('music', true);
            this.setState(Game);
        }
    });
}
