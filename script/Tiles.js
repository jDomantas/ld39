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

ld39.tiles.Letter = function(letter) {
    this.allowLight = false;
    this.alwaysLit = false;
    this.connectToWall = true;
    this.walkable = false;
    this.letter = letter;
}

ld39.tiles.Letter.prototype.drawBack = function(layer, game, x, y) {
    ld39.util.drawConnecting(layer, game, x, y, 'connectToWall', 0, 16, false);
    var index = "ABCDEFGHIJKLMNOPQRSTUVWXYZ -+?".indexOf(this.letter);
    if (index === -1) index = 29;
    var srcx = 72 + index % 7 * 8;
    var srcy = 88 + Math.floor(index / 7) * 8;
    layer.drawImage(game.app.images.tiles, srcx, srcy, 8, 8, x * 8, y * 8, 8, 8);
}

ld39.tiles.Generator = function(power, priority, icon, display, on) {
    this.power = power;
    this.availablePower = 0;
    this.displayedPower = 0;
    this.connectToFloor = true;
    this.allowLight = true;
    this.alwaysLit = on;
    this.priority = priority;
    this.walkable = false;
    this.display = display;
    this.icon = icon;
    this.powerupProgress = on ? 1 : 0;
    this.isGenerator = true;
}

ld39.tiles.Generator.prototype.update = function(game, dt, x, y) {
    if (!this.alwaysLit) {
        var player = game.getPlayer();
        if (player !== null) {
            var dx = Math.abs((x + 0.5) - player.x);
            var dy = Math.abs((y + 0.5) - player.y);
            if (dx <= 1.5 && dy <= 1.5) {
                // power up the generator
                this.alwaysLit = true;
                if (x > 0 && game.tiles[y][x - 1].isGenerator) {
                    game.tiles[y][x - 1].alwaysLit = true;
                }
                if (x < game.width - 1 && game.tiles[y][x + 1].isGenerator) {
                    game.tiles[y][x + 1].alwaysLit = true;
                }
                game.app.sound.play('powerup');
                game.recalcPower();
            }
        }
        return;
    }
    if (this.alwaysLit && this.powerupProgress < 1) {
        this.powerupProgress += dt;
    }
    if (this.display) {
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
}

ld39.tiles.Generator.prototype.drawBack = function(layer, game, x, y) {
    ld39.util.drawConnecting(layer, game, x, y, 'connectToFloor', 0, 0, false);
}

ld39.tiles.Generator.prototype.draw = function(layer, game, x, y) {
    var icon = Math.ceil(this.powerupProgress * 3 - 0.01);
    if (icon > 3) icon = 3;
    icon = this.icon + icon * 3;
    layer.drawImage(game.app.images.tiles, icon * 8, 24, 8, 8, x * 8, y * 8, 8, 8);
}

ld39.tiles.Display = function(icon) {
    this.display = null;
    this.allowLight = false;
    this.alwaysLit = false;
    this.walkable = false;
    this.connectToFloor = true;
    this.icon = icon;
}

ld39.tiles.Display.prototype.drawBack = function(layer, game, x, y) {
    ld39.util.drawConnecting(layer, game, x, y, 'connectToFloor', 0, 0, false);
    layer.drawImage(game.app.images.tiles, 40 + this.icon * 8, 16, 8, 8, x * 8, y * 8, 8, 8);
}

ld39.tiles.Display.prototype.draw = function(layer, game, x, y) {
    var yy = 32;
    if (game.alertTimer[y][x] > 0) {
        var doAlert = Math.floor(game.alertTimer[y][x] * 4) % 2 === 1;
        if (doAlert) {
            yy = 40;
        }
    }
    if (this.display !== null) {
        x = x * 8;
        y = y * 8;
        if (this.icon === 0) x++;
        else if (this.icon === 1) x--;
        layer.drawImage(game.app.images.tiles, this.display * 8, yy, 8, 8, x, y, 8, 8);
    }
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
    game.app.sound.play('door');
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
        layer.drawImage(game.app.images.tiles, srcx, 64, 8, 24, x * 8, y * 8 - 8, 8, 24);
    }
}

ld39.tiles.KeycardDoor = function(horizontal) {
    this.allowLight = false;
    this.alwaysLit = false;
    this.connectToFloor = true;
    this.horizontal = horizontal;
    this.open = false;
    this.openProgress = 0;
    this.walkable = false;
}

ld39.tiles.KeycardDoor.prototype.update = function(game, dt, x, y) {
    var openTarget = this.open ? 1 : 0;
    var openDelta = dt * 2;
    if (this.openProgress > openTarget) {
        this.openProgress = Math.max(openTarget, this.openProgress - openDelta);
    } else {
        this.openProgress = Math.min(openTarget, this.openProgress + openDelta);
    }
    var player = game.getPlayer();
    if (player !== null && player.hasKeycard && !this.open) {
        var dx = player.x - (x + 0.5);
        var dy = player.y - (y + 0.5);
        if (Math.abs(dx) <= 1.5 && Math.abs(dy) <= 1.5) {
            this.open = true;
            this.walkable = true;
            this.allowLight = true;
            game.app.sound.play('door');
        }
    }
}

ld39.tiles.KeycardDoor.prototype.drawBack = function(layer, game, x, y) {
    ld39.tiles.Floor.prototype.drawBack(layer, game, x, y);
}

ld39.tiles.KeycardDoor.prototype.draw = function(layer, game, x, y) {
    ld39.tiles.Floor.prototype.draw(layer, game, x, y);
    var frame = Math.round(this.openProgress * 3);
    if (this.horizontal) {
        var srcy = 8 + frame * 8;
        layer.drawImage(game.app.images.tiles, 104, srcy, 24, 8, x * 8 - 8, y * 8, 24, 8);
    } else {
        var srcx = 96 + frame * 8;
        layer.drawImage(game.app.images.tiles, srcx, 40, 8, 24, x * 8, y * 8 - 8, 8, 24);
    }
}

ld39.tiles.Teleporter = function(isEnd) {
    this.allowLight = false;
    this.alwaysLit = false;
    this.connectToFloor = true;
    this.isEnd = isEnd;
    this.walkable = true;
    this.animation = Math.random();
}

ld39.tiles.Teleporter.prototype.update = function(game, dt, x, y) {
    this.animation += dt;
    if (this.isEnd) {
        var player = game.getPlayer();
        if (player !== null) {
            var dx = player.x - (x + 0.5);
            var dy = player.y - (y + 0.5);
            if (Math.abs(dx) <= 0.3 && Math.abs(dy) <= 0.3) {
                player.vulnerable = false;
                player.teleportOutAnimation = 1;
                game.victoryTimer = 2;
                game.app.sound.play('transporter');
                // to prevent from timer getting stuck at 1
                this.isEnd = false;
            }
        }
    }
}

ld39.tiles.Teleporter.prototype.drawBack = function(layer, game, x, y) {
    ld39.util.drawConnecting(layer, game, x, y, 'connectToFloor', 0, 0, false);
}

ld39.tiles.Teleporter.prototype.draw = function(layer, game, x, y) {
    var icon = Math.floor(this.animation * 4) % 4;
    layer.drawImage(game.app.images.tiles, icon * 8, 8, 8, 8, x * 8, y * 8, 8, 8);
}

ld39.tiles.Turret = function() {
    this.allowLight = true;
    this.alwaysLit = false;
    this.connectToFloor = true;
    this.dir = Math.floor(Math.random() * 8);
    this.turnTimer = 0.2;
    this.fireTimer = 0.8;
    this.isTurret = true;
    this.wasOn = false;
}

ld39.tiles.Turret.prototype.update = function(game, dt, x, y) {
    if (this.wasOn !== game.tileLit[y][x]) {
        game.app.sound.play(this.wasOn ? 'turretOff' : 'turretOn');
        this.wasOn = game.tileLit[y][x];
    }
    if (!game.tileLit[y][x]) {
        this.turnTimer = 0.2;
        this.fireTimer = 1.2;
        return;
    }
    var target = null, targetDist = 10000000;
    for (var i = 0; i < game.entities.length; i++) {
        var e = game.entities[i];
        if (!e.vulnerable) {
            continue;
        }
        var d = (x + 0.5 - e.x) * (x + 0.5 - e.x) + (y + 0.5 - e.y) * (y + 0.5 - e.y);
        if (d > 6 * 6) {
            continue;
        }
        if (game.raycastHit(x + 0.5, y + 0.5, e.x, e.y, true)) {
            continue;
        }
        if (d < targetDist) {
            target = e;
            targetDist = d;
        }
    }
    if (target !== null) {
        var dx = target.x - (x + 0.5);
        var dy = target.y - (y + 0.5);
        var dir = 0;
        var sin225 = 0.3826834323650897717284599840304;
        if (dy < 0 && Math.abs(dx) < sin225 * Math.abs(dy)) {
            dir = 0;
        } else if (dx > 0 && Math.abs(dy) < sin225 * Math.abs(dx)) {
            dir = 2;
        } else if (dy > 0 && Math.abs(dx) < sin225 * Math.abs(dy)) {
            dir = 4;
        } else if (dx < 0 && Math.abs(dy) < sin225 * Math.abs(dx)) {
            dir = 6;
        } else if (dx > 0 && dy < 0) {
            dir = 1;
        } else if (dx > 0 && dy > 0) {
            dir = 3;
        } else if (dx < 0 && dy > 0) {
            dir = 5;
        } else {
            dir = 7;
        }
        var stepsCw = (dir + 8 - this.dir) % 8;
        var stepsCcw = (this.dir + 8 - dir) % 8;
        var steps = Math.min(stepsCcw, stepsCw);
        if (steps <= 1) {
            this.fireTimer -= dt;
            if (this.fireTimer <= 0) {
                this.fireTimer = 1.2;
                game.app.sound.play('shoot');
                target.incomingFire.push({
                    x: x + 0.5,
                    y: y + 0.2,
                    dir: 4,
                    moveTime: 0
                });
            }
        }
        if (steps === 0) {
            this.turnTimer = 0.2;
        } else {
            this.turnTimer -= dt;
            if (this.turnTimer <= 0) {
                this.turnTimer = 0.2;
                if (stepsCw < stepsCcw) {
                    this.dir = (this.dir + 1) % 8;
                } else {
                    this.dir = (this.dir + 7) % 8;
                }
            }
        }
    } else {
        //console.log('no target');
        this.turnTimer = 0.2;
        this.fireTimer = 1.2;
    }
}

ld39.tiles.Turret.prototype.drawBack = function(layer, game, x, y) {
    ld39.util.drawConnecting(layer, game, x, y, 'connectToFloor', 0, 0, false);
}

ld39.tiles.Turret.prototype.draw = function(layer, game, x, y) {
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
    var icon = this.dir % 4;
    if (game.tileLit[y][x]) icon += 4;
    layer.drawImage(game.app.images.tiles, 32 + icon * 8, 8, 8, 8, x * 8, y * 8, 8, 8);
}
