'use strict';

ld39.states.Menu = {
    buttons: [],

    create: function() {
        this.buffer = cq(ld39.gameWidth * 8, ld39.gameHeight * 8);
    },

    enter: function() {
        this.buffer = cq(ld39.gameWidth * 8, ld39.gameHeight * 8);
        this.buttons = [];
        for (var i = 0; i < 9; i++) {
            var x = 56 + 32 * (i % 3);
            var y = 64 + 32 * Math.floor(i / 3);
            this.buttons.push({
                x: x,
                y: y,
                levelNumber: i <= ld39.util.lastUnlocked ? i : -1,
            });
        }
    },

    step: function(dt) {
        
    },

    mousedown: function(data) {
        var x = this.app.mouse.x;
        var y = this.app.mouse.y;
        for (var i = 0; i < this.buttons.length; i++) {
            var b = this.buttons[i];
            if (x >= b.x && y >= b.y && x < b.x + 16 && y < b.y + 16 && b.levelNumber != -1) {
                ld39.states.Game.currentLevel = b.levelNumber;
                this.app.setState(ld39.states.Game);
                break;
            }
        }
    },

    render: function() {
        var app = this.app;
        var layer = this.app.layer;
        this.buffer
            .fillStyle('#ccc')
            .fillRect(0, 0, ld39.gameWidth * 8, ld39.gameHeight * 8)
            .drawImage(this.app.images.tiles, 0, 192, 112, 16, 40, 16, 112, 16);
        var mx = this.app.mouse.x;
        var my = this.app.mouse.y;
        for (var i = 0; i < this.buttons.length; i++) {
            var b = this.buttons[i];
            var hover = false;
            if (mx >= b.x && my >= b.y && mx < b.x + 16 && my < b.y + 16) {
                hover = true;
            }
            var srcx = hover ? 16 : 0;
            this.buffer.drawImage(this.app.images.tiles, srcx, 144, 16, 16, b.x, b.y, 16, 16);
            var sx, sy;
            if (b.levelNumber === -1) {
                sx = 80;
                sy = 160;
            } else {
                sx = 32 + 16 * (b.levelNumber % 6);
                sy = 144 + 16 * Math.floor(b.levelNumber / 6);
            }
            this.buffer.drawImage(this.app.images.tiles, sx, sy, 16, 16, b.x, b.y, 16, 16);
        }
        layer.drawImage(this.buffer.canvas, 0, 0, ld39.gameWidth * 8, ld39.gameHeight * 8);
    }
};
