var Game = {
    create: function() {
        this.cells = [
            '################################',
            '#..............................#',
            '#..............................#',
            '#..............................#',
            '#..............................#',
            '#..............................#',
            '#..............................#',
            '#...........###................#',
            '#............###...............#',
            '#..............................#',
            '#........##.........###........#',
            '#..............................#',
            '#....#####.....................#',
            '#..............##..............#',
            '#.....................#####....#',
            '#..............................#',
            '#..............................#',
            '#.......####...................#',
            '#..............................#',
            '#..............................#',
            '#...............####...........#',
            '#..............................#',
            '#.####..##...........#####.....#',
            '################################',
        ];
        this.player = {
            x: 2,
            y: 2,
            width: 0.9,
            height: 0.9,
            vx: 0,
            vy: 0,
            onGround: false,
            jumps: 2,
        };
        this.oldUp = false;
    },

    step: function(dt) {
        var dx = 0;
        if (this.app.keyboard.keys.a || this.app.keyboard.keys.left) dx -= 1;
        if (this.app.keyboard.keys.d || this.app.keyboard.keys.right) dx += 1;
        this.player.vx = dx * 10;

        var up = false;
        if (this.app.keyboard.keys.w || this.app.keyboard.keys.up) up = true;
        if (up && !this.oldUp && this.player.jumps > 0) {
            this.player.jumps -= 1;
            this.player.vy = -20;
            this.app.sound.play('jump');
        }
        this.oldUp = up;

        this.player.vy += dt * 60;
        this.move(this.player, dt);

        if (this.player.onGround)
            this.player.jumps = 2;
    },

    move: function(thing, dt) {
        var hdist = Math.abs(thing.vx) * dt;
        if (thing.vx < 0) {
            if (!this.moveLeft(thing, hdist))
                thing.vx = 0;
        } else if (thing.vx > 0) {
            if (!this.moveRight(thing, hdist))
                thing.vx = 0;
        }

        thing.onGround = false;
        var vdist = Math.abs(thing.vy) * dt;
        if (thing.vy < 0) {
            if (!this.moveUp(thing, vdist))
                thing.vy = 0;
        } else if (thing.vy > 0) {
            if (!this.moveDown(thing, vdist)) {
                thing.vy = 0;
                thing.onGround = true;
            }
        }
    },

    moveDown: function(thing, dist) {
        var left = Math.floor(thing.x + 0.00001);
        var right = Math.ceil(thing.x + thing.width - 0.00001);
        var bottom = Math.floor(thing.y + thing.height - 0.00001);
        var nextBottom = Math.floor(thing.y + thing.height + dist);
        for (var y = bottom; y <= nextBottom; y++) {
            for (var x = left; x < right; x++) {
                if (this.isSolid(x, y)) {
                    thing.y = y - thing.height;
                    return false;
                }
            }
        }
        thing.y += dist;
        return true;
    },

    moveLeft: function(thing, dist) {
        var top = Math.floor(thing.y + 0.00001);
        var bottom = Math.ceil(thing.y + thing.height - 0.00001);
        var left = Math.floor(thing.x - 0.00001);
        var nextLeft = Math.floor(thing.x - dist);
        for (var x = left; x >= nextLeft; x--) {
            for (var y = top; y < bottom; y++) {
                if (this.isSolid(x, y)) {
                    thing.x = x + 1;
                    return false;
                }
            }
        }
        thing.x -= dist;
        return true;
    },

    moveRight: function(thing, dist) {
        var top = Math.floor(thing.y + 0.00001);
        var bottom = Math.ceil(thing.y + thing.height - 0.00001);
        var right = Math.floor(thing.x + thing.width - 0.00001);
        var nextRight = Math.floor(thing.x + thing.width + dist);
        for (var x = right; x <= nextRight; x++) {
            for (var y = top; y < bottom; y++) {
                if (this.isSolid(x, y)) {
                    thing.x = x - thing.width;
                    return false;
                }
            }
        }
        thing.x += dist;
        return true;
    },

    moveUp: function(thing, dist) {
        var left = Math.floor(thing.x + 0.00001);
        var right = Math.ceil(thing.x + thing.width - 0.00001);
        var top = Math.floor(thing.y - 0.00001);
        var nextTop = Math.floor(thing.y - dist);
        for (var y = top; y >= nextTop; y--) {
            for (var x = left; x < right; x++) {
                if (this.isSolid(x, y)) {
                    thing.y = y + 1;
                    return false;
                }
            }
        }
        thing.y -= dist;
        return true;
    },

    isSolid: function(x, y) {
        return x < 0 || y < 0 || x >= 32 || y >= 24 || this.cells[y][x] == '#';
    },

    render: function() {
        var app = this.app;
        var layer = this.app.layer;

        layer.clear('#ccc');
        for (var x = 0; x < 32; x++) {
            for (var y = 0; y < 24; y++) {
                if (this.isSolid(x, y))
                    layer
                        .fillStyle('#555')
                        .fillRect(x * 10, y * 10, 10, 10);
            }
        }
        var playerX = Math.round(this.player.x * 10);
        var playerY = Math.round(this.player.y * 10);
        layer
            .fillStyle('#44b')
            .fillRect(playerX, playerY, 9, 9);
    }
};
