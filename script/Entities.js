'use strict';

ld39.util.findPath = function(game, sx, sy, ex, ey) {
    game.runBfs(Math.floor(ex), Math.floor(ey), 'walkable');
    var path = [ { x: sx, y: sy } ];
    sx = Math.floor(sx);
    sy = Math.floor(sy);
    if (game.distances[sy][sx] > 100000)
        return null;
    var x = sx, y = sy;
    var dist = game.distances;
    var breakNext = false;
    while (true) {
        while (path.length >= 2) {
            var px = path[path.length - 2].x;
            var py = path[path.length - 2].y;
            var d = 0.35;
            if (!game.raycastHit(px - d, py - d, x + 0.5 - d, y + 0.5 - d) &&
                !game.raycastHit(px + d, py - d, x + 0.5 + d, y + 0.5 - d) &&
                !game.raycastHit(px - d, py + d, x + 0.5 - d, y + 0.5 + d) &&
                !game.raycastHit(px + d, py + d, x + 0.5 + d, y + 0.5 + d)) {
                path.pop();
            } else {
                break;
            }
        }
        if (breakNext)
            break;
        path.push({ x: x + 0.5, y: y + 0.5 });
        if (x > 0 && dist[y][x - 1] < dist[y][x]) {
            x -= 1;
        } else if (y > 0 && dist[y - 1][x] < dist[y][x]) {
            y -= 1;
        } else if (x < game.width - 1 && dist[y][x + 1] < dist[y][x]) {
            x += 1;
        } else if (y < game.height - 1 && dist[y + 1][x] < dist[y][x]) {
            y += 1;
        } else {
            x = ex;
            y = ey;
            breakNext = true;
        }
    }
    path.push({ x: ex, y: ey });
    path.splice(0, 1);
    return path;
}

ld39.util.moveEntity = function(game, entity, tx, ty, allowFallback) {
    var dx = tx - entity.x;
    var dy = ty - entity.y;
    var ftx, fty;
    if (Math.abs(dx) <= 0.2 && Math.abs(dy) <= 0.2) {
        return true;
    }
    if (Math.abs(dx) > Math.abs(dy)) {
        var prob = Math.abs(dy) / Math.abs(dx);
        dx = Math.sign(dx);
        dy = Math.random() < prob ? Math.sign(dy) : 0;
        ftx = 0;
        fty = Math.floor(Math.random() * 2) * 2 - 1;
        if (game.isSolidAt(entity.x + dx / 2, entity.y) &&
            game.isSolidAt(entity.x + dx / 2, entity.y + 1) &&
            game.isSolidAt(entity.x + dx / 2, entity.y - 1))
            return true;
    } else {
        var prob = Math.abs(dx) / Math.abs(dy);
        dy = Math.sign(dy);
        dx = Math.random() < prob ? Math.sign(dx) : 0;
        fty = 0;
        ftx = Math.floor(Math.random() * 2) * 2 - 1;
        if (game.isSolidAt(entity.x, entity.y + dy / 2) &&
            game.isSolidAt(entity.x + 1, entity.y + dy / 2) &&
            game.isSolidAt(entity.x - 1, entity.y + dy / 2))
            return true;
    }
    tx = entity.x + dx / 8;
    ty = entity.y + dy / 8;
    if (game.canPlaceEntity(tx, ty, entity)) {
        entity.x = tx;
        entity.y = ty;
        if (allowFallback) {
            entity.walkFails = Math.max(0, entity.walkFails - 1);
        }
    } else if (allowFallback) {
        ld39.util.moveEntity(game, entity, entity.x + ftx, entity.y + fty, false);
        entity.walkFails += 1;
        if (entity.walkFails >= 20) {
            entity.curPath = null;
            entity.pathProgress = 0;
            entity.walkFails = 0;
        }
    }
    return false;
}

ld39.util.updateEntity = function(game, dt, entity, canWalk) {
    if (entity.curPath !== null && canWalk) {
        entity.moveProgress += dt * 22;
        if (entity.moveProgress >= 1) {
            entity.moveFrame += 1;
            entity.moveFrame %= 8;
            entity.moveProgress -= 1;
            var waypoint = entity.curPath[entity.pathProgress];
            var dx = waypoint.x - entity.x;
            var dy = waypoint.y - entity.y;
            if (Math.abs(dx) > Math.abs(dy)) {
                entity.dir = dx < 0 ? 3 : 1;
            } else {
                entity.dir = dy < 0 ? 0 : 2;
            }
            if (ld39.util.moveEntity(game, entity, waypoint.x, waypoint.y, true)) {
                entity.pathProgress += 1;
                if (entity.pathProgress === entity.curPath.length) {
                    entity.curPath = null;
                    entity.pathProgress = 0;
                }
            }
        }
    } else {
        entity.moveProgress = 0;
        entity.moveFrame = 0;
    }

    for (var i = entity.incomingFire.length - 1; i >= 0; i--) {
        var b = entity.incomingFire[i];
        if (game.isSolidAt(b.x, b.y, true)) {
            entity.incomingFire.splice(i, 1);
            continue;
        }

        var dx = entity.x - b.x;
        var dy = entity.y - b.y;
        var d = dx * dx + dy * dy;
        if (d > 0.2 * 0.2) {
            b.moveTime -= dt;
            if (b.moveTime < 0) {
                b.moveTime += 0.025;
                var oldx = Math.round(b.x * 8);
                var oldy = Math.round(b.y * 8);
                d = Math.sqrt(d);
                dx /= d;
                dy /= d;
                b.x += dx / 4;
                b.y += dy / 4;
                var newx = Math.round(b.x * 8);
                var newy = Math.round(b.y * 8);
                dx = Math.sign(oldx - newx) + 1;
                dy = Math.sign(oldy - newy) + 1;
                b.dir = dx + dy * 3;
            }
        } else {
            // kill entity
            entity.incomingFire.splice(i, 1);
            if (entity.vulnerable) {
                game.app.sound.play('death');
                entity.dead = true;
            }
        }
    }
}

ld39.entities.Player = function(x, y) {
    this.x = x;
    this.y = y;
    this.curPath = null;
    this.dir = 2;
    this.pathProgress = 0;
    this.isControlled = true;
    this.moveProgress = 0;
    this.moveFrame = 0;
    this.incomingFire = [];
    this.dead = false;
    this.solid = true;
    this.hasKeycard = false;
    this.teleportInAnimation = 1;
    this.teleportOutAnimation = 0;
    this.vulnerable = false;
    this.visible = true;
    this.walkFails = 0;
    this.fresh = true;
}

ld39.entities.Player.prototype.update = function(game, dt) {
    if (this.fresh) {
        game.app.sound.play('transporter');
        this.fresh = false;
    }
    if (this.teleportInAnimation > 0) {
        this.teleportInAnimation -= dt;
        this.vulnerable = false;
    } else if (this.teleportOutAnimation > 0) {
        this.teleportOutAnimation -= dt;
        this.vulnerable = false;
        this.visible = false;
    } else {
        this.vulnerable = true;
        ld39.util.updateEntity(game, dt, this, true);
    }
}

ld39.entities.Player.prototype.command = function(game, x, y) {
    this.curPath = ld39.util.findPath(game, this.x, this.y, x, y);
    this.pathProgress = 0;
}

ld39.entities.Player.prototype.draw = function(layer, game) {
    if (this.teleportInAnimation > 0 || this.teleportOutAnimation > 0) {
        var tpFrame;
        if (this.teleportInAnimation > 0) {
            tpFrame = Math.floor(this.teleportInAnimation * 10);
        } else {
            tpFrame = 9 - Math.floor(this.teleportOutAnimation * 10);
        }
        if (tpFrame > 9) return;
        if (tpFrame < 0) tpFrame = 0;
        var x = Math.round(this.x * 8 - 4);
        var y = Math.round(this.y * 8 - 5);
        layer.drawImage(game.app.images.tiles, 16 + tpFrame * 8, 48, 8, 8, x, y, 8, 8);
    } else if (this.visible) {
        var srcx = (this.moveFrame >> 1) * 8;
        var srcy = 96 + this.dir * 8;
        var x = Math.round(this.x * 8 - 4);
        var y = Math.round(this.y * 8 - 5);
        layer.drawImage(game.app.images.tiles, srcx, srcy, 8, 8, x, y, 8, 8);
        for (var i = 0; i < this.incomingFire.length; i++) {
            var b = this.incomingFire[i];
            var x = Math.round(b.x * 8);
            var y = Math.round(b.y * 8);
            layer.drawImage(game.app.images.tiles, b.dir * 8, 88, 8, 8, x - 4, y - 4, 8, 8);
        }
    }
}

ld39.entities.Enemy = function(x, y) {
    this.x = x;
    this.y = y;
    this.curPath = null;
    this.dir = Math.floor(Math.random() * 4);
    this.pathProgress = 0;
    this.isControlled = false;
    this.moveProgress = 0;
    this.moveFrame = 0;
    this.incomingFire = [];
    this.nextShotDelay = 0;
    this.fireTimer = 0;
    this.dead = false;
    this.nextRecalc = 0;
    this.nextTurnTimer = Math.random() * 2 + 2;
    this.solid = true;
    this.vulnerable = true;
    this.walkFails = 0;
}

ld39.entities.Enemy.prototype.update = function(game, dt) {
    if (this.nextTurnTimer > 0) {
        this.nextTurnTimer -= dt;
        if (this.nextTurnTimer <= 0) {
            if (this.fireTimer <= 0 && this.curPath === null)
                this.dir = Math.floor(Math.random() * 4);
            this.nextTurnTimer = Math.random() * 2 + 2;
        }
    }
    if (this.nextShotDelay > 0)
        this.nextShotDelay -= dt;
    if (this.fireTimer > 0) {
        this.fireTimer -= dt;
        if (this.fireTimer <= 0) {
            // shoot at player
            var player = game.getPlayer();
            if (player !== null) {
                // console.log('shot!');
                game.app.sound.play('shoot');
                player.incomingFire.push({ x: this.x, y: this.y, dir: 4, moveTime: 0 });
            }
        }
    }
    if (this.nextRecalc > 0) {
        this.nextRecalc -= dt;
    } else {
        var player = game.getPlayer();
        if (player === null) {
            this.curPath = null;
            this.pathProgress = 0;
        } else if (!game.raycastHit(this.x, this.y, player.x, player.y, true)) {
            // console.log('seen');
            if (this.nextShotDelay <= 0) {
                var dx = player.x - this.x;
                var dy = player.y - this.y;
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.dir = dx < 0 ? 3 : 1;
                } else {
                    this.dir = dy < 0 ? 0 : 2;
                }
                this.nextShotDelay = 2 + Math.random() * 0.6;
                this.fireTimer = 1;
            }
            this.curPath = ld39.util.findPath(game, this.x, this.y, player.x, player.y);
            this.nextRecalc = 0.25 + Math.random() / 4;
            this.pathProgress = 0;
        }
    }
    ld39.util.updateEntity(game, dt, this, this.fireTimer <= 0);
}

ld39.entities.Enemy.prototype.draw = function(layer, game) {
    var srcx = this.fireTimer > 0 ? 64 : 32 + (this.moveFrame >> 1) * 8;
    var srcy = 96 + this.dir * 8;
    var x = Math.round(this.x * 8 - 4);
    var y = Math.round(this.y * 8 - 5);
    layer.drawImage(game.app.images.tiles, srcx, srcy, 8, 8, x, y, 8, 8);
    /*if (this.curPath !== null) {
        layer.a(0.2);
        for (var i = 0; i < this.curPath.length; i++) {
            var x = Math.round(this.curPath[i].x * 8);
            var y = Math.round(this.curPath[i].y * 8);
            layer.drawImage(game.app.images.tiles, 0, 24, 8, 8, x - 4, y - 4, 8, 8);
        }
        layer.ra();
    }*/
    for (var i = 0; i < this.incomingFire.length; i++) {
        var b = this.incomingFire[i];
        var x = Math.round(b.x * 8);
        var y = Math.round(b.y * 8);
        layer.drawImage(game.app.images.tiles, b.dir * 8, 88, 8, 8, x - 4, y - 4, 8, 8);
    }
}

ld39.entities.Keycard = function(x, y) {
    this.x = x;
    this.y = y;
    this.solid = false;
    this.wobble = 0;
    this.dead = false;
    this.vulnerable = false;
}

ld39.entities.Keycard.prototype.update = function(game, dt) {
    this.wobble += dt;
    var player = game.getPlayer();
    if (player !== null) {
        var dx = this.x - player.x;
        var dy = this.y - player.y;
        if (Math.abs(dx) <= 0.5 && Math.abs(dy) <= 0.5) {
            this.dead = true;
            player.hasKeycard = true;
            game.app.sound.play('keycard');
        }
    }
}

ld39.entities.Keycard.prototype.draw = function(layer, game) {
    var dy = Math.sin(this.wobble * 8);
    var x = Math.round(this.x * 8);
    var y = Math.round(this.y * 8 + dy);
    layer.drawImage(game.app.images.tiles, 8, 48, 8, 8, x - 4, y - 4, 8, 8);
}
