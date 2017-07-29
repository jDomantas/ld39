'use strict';

ld39.util.pickTile = function(h, v, d) {
    if (h && v && d) return 0;
    else if (h && v) return 3;
    else if (h) return 1;
    else if (v) return 2;
    else return 4;
}

ld39.util.connectTo = function(game, x, y, prop, requireLit) {
    if (x < 0 || y < 0 || x >= game.width || y >= game.height)
        return true;
    if (!game.tiles[y][x][prop])
        return false;
    if (requireLit && game.tileLitProgress[y][x] === 0)
        return false;
    return true;
}

ld39.util.drawConnecting = function(layer, game, x, y, prop, srcx, srcy, requireLit) {
    var connect = ld39.util.connectTo;
    var l = connect(game, x - 1, y, prop, requireLit);
    var t = connect(game, x, y - 1, prop, requireLit);
    var r = connect(game, x + 1, y, prop, requireLit);
    var b = connect(game, x, y + 1, prop, requireLit);
    var tl = connect(game, x - 1, y - 1, prop, requireLit);
    var tr = connect(game, x + 1, y - 1, prop, requireLit);
    var bl = connect(game, x - 1, y + 1, prop, requireLit);
    var br = connect(game, x + 1, y + 1, prop, requireLit);
    var c1 = ld39.util.pickTile(l, t, tl) * 8;
    var c2 = ld39.util.pickTile(r, t, tr) * 8;
    var c3 = ld39.util.pickTile(l, b, bl) * 8;
    var c4 = ld39.util.pickTile(r, b, br) * 8;
    layer.drawImage(game.app.images.tiles, srcx + c1, srcy, 4, 4, x * 8, y * 8, 4, 4);
    layer.drawImage(game.app.images.tiles, srcx + c2 + 4, srcy, 4, 4, x * 8 + 4, y * 8, 4, 4);
    layer.drawImage(game.app.images.tiles, srcx + c3, srcy + 4, 4, 4, x * 8, y * 8 + 4, 4, 4);
    layer.drawImage(game.app.images.tiles, srcx + c4 + 4, srcy + 4, 4, 4, x * 8 + 4, y * 8 + 4, 4, 4);
}

ld39.tiles.Floor = function() {
    this.allowLight = true;
    this.alwaysLit = false;
    this.connectToFloor = true;
    this.walkable = true;
}

ld39.tiles.Floor.prototype.drawBack = function(layer, game, x, y) {
    ld39.util.drawConnecting(layer, game, x, y, 'connectToFloor', 0, 0, false);
}

ld39.tiles.Floor.prototype.draw = function(layer, game, x, y) {
    if (game.tileLitProgress[y][x] > 0) {
        layer.a(game.tileLitProgress[y][x]);
        ld39.util.drawConnecting(layer, game, x, y, 'connectToFloor', 64, 0, true);
        layer.ra();
    }
    if (game.alertTimer[y][x] > 0) {
        var doAlert = Math.floor(game.alertTimer[y][x] * 4) % 2 === 1;
        if (doAlert) {
            layer
                .a(0.2)
                .drawImage(game.app.images.tiles, 0, 48, 8, 8, x * 8, y * 8, 8, 8)
                .ra();
        }
    }
}

ld39.tiles.Wall = function() {
    this.allowLight = false;
    this.alwaysLit = false;
    this.connectToWall = true;
    this.walkable = false;
}

ld39.tiles.Wall.prototype.drawBack = function(layer, game, x, y) {
    ld39.util.drawConnecting(layer, game, x, y, 'connectToWall', 0, 16, false);
}

ld39.tiles.Generator = function(power, priority) {
    this.power = power;
    this.availablePower = 0;
    this.displayedPower = 0;
    this.connectToFloor = true;
    this.allowLight = true;
    this.alwaysLit = true;
    this.priority = priority;
    this.walkable = false;
}

ld39.tiles.Generator.prototype.update = function(game, dt, x, y) {
    if (this.displayedPower < this.availablePower) {
        this.displayedPower += dt * 30;
        if (this.displayedPower > this.availablePower)
            this.displayedPower = this.availablePower;
    } else {
        this.displayedPower -= dt * 30;
        if (this.displayedPower < this.availablePower)
            this.displayedPower = this.availablePower;
    }
    var display = Math.round(this.displayedPower);
    game.tiles[y - 1][x].display = display % 10;
    game.alertTimer[y - 1][x] = game.alertTimer[y][x];
    // if generator has 10 power, it always powers its own tile,
    // and does not need to display numbers larger than 9
    if (this.power > 10) {
        game.tiles[y - 1][x - 1].display = Math.floor(display / 10);
        game.alertTimer[y - 1][x - 1] = game.alertTimer[y][x];
    }
}

ld39.tiles.Generator.prototype.drawBack = function(layer, game, x, y) {
    layer.drawImage(game.app.images.tiles, 0, 24, 8, 8, x * 8, y * 8, 8, 8);
}

ld39.tiles.Display = function() {
    this.display = 0;
    this.allowLight = false;
    this.alwaysLit = false;
    this.walkable = false;
}

ld39.tiles.Display.prototype.draw = function(layer, game, x, y) {
    var yy = 32;
    if (game.alertTimer[y][x] > 0) {
        var doAlert = Math.floor(game.alertTimer[y][x] * 4) % 2 === 1;
        if (doAlert) {
            yy = 40;
        }
    }
    layer.drawImage(game.app.images.tiles, this.display * 8, yy, 8, 8, x * 8, y * 8, 8, 8);
}

ld39.tiles.Door = function(horizontal) {
    this.allowLight = true;
    this.alwaysLit = false;
    this.connectToFloor = true;
    this.horizontal = horizontal;
    this.open = false;
    this.openProgress = 0;
    this.walkable = false;
}

ld39.tiles.Door.prototype.update = function(game, dt, x, y) {
    var openTarget = this.open ? 1 : 0;
    var openDelta = dt * 2;
    if (this.openProgress > openTarget) {
        this.openProgress = Math.max(openTarget, this.openProgress - openDelta);
    } else {
        this.openProgress = Math.min(openTarget, this.openProgress + openDelta);
    }
}

ld39.tiles.Door.prototype.click = function(game, x, y) {
    if (this.open) {
        this.walkable = false;
        for (var i = 0; i < game.entities.length; i++) {
            var e = game.entities[i];
            if (!game.canPlaceEntity(e.x, e.y, e)) {
                // entity blocks this door
                this.walkable = true;
                return;
            }
        }
    }
    this.open = !this.open;
    this.walkable = this.open;
}

ld39.tiles.Door.prototype.drawBack = function(layer, game, x, y) {
    ld39.tiles.Floor.prototype.drawBack(layer, game, x, y);
}

ld39.tiles.Door.prototype.draw = function(layer, game, x, y) {
    ld39.tiles.Floor.prototype.draw(layer, game, x, y);
    var frame = Math.round(this.openProgress * 3);
    if (this.horizontal) {
        var srcx = game.tileLit[y][x] ? 24 : 0;
        var srcy = 56 + frame * 8;
        layer.drawImage(game.app.images.tiles, srcx, srcy, 24, 8, x * 8 - 8, y * 8, 24, 8);
    } else {
        var srcx = (game.tileLit[y][x] ? 80 : 48) + frame * 8;
        layer.drawImage(game.app.images.tiles, srcx, 56, 8, 24, x * 8, y * 8 - 8, 8, 24);
    }
}
