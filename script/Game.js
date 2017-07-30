'use strict';

ld39.states.Game = {
    width: ld39.gameWidth,
    height: ld39.gameHeight,
    initialAlertTime: 1,
    victoryTimer: 0,
    currentLevel: 0,

    create: function() {
        this.buffer = cq(this.width * 8, this.height * 8);
        this.floorBuffer = cq(this.width * 8, this.height * 8);
        this.visit = [];
        this.tileLit = [];
        this.tileLitProgress = [];
        this.tileLight = [];
        this.tileEnergy = [];
        this.distances = [];
        this.alertTimer = [];
        for (var y = 0; y < this.height; y++) {
            this.visit.push([]);
            this.tileLit.push([]);
            this.tileLitProgress.push([]);
            this.tileLight.push([]);
            this.tileEnergy.push([]);
            this.distances.push([]);
            this.alertTimer.push([]);
            for (var x = 0; x < this.width; x++) {
                this.visit[y].push(false);
                this.tileLit[y].push(false);
                this.tileLitProgress[y].push(0);
                this.tileLight[y].push(0);
                this.tileEnergy[y].push(0);
                this.distances[y].push(0);
                this.alertTimer[y].push(0);
            }
        }

        this.loadLevel(0);
    },

    loadLevel: function(level) {
        this.currentLevel = level;
        this.entities = [];
        this.victoryTimer = 0;
        ld39.loadLevel(this, level);
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                this.tileLit[y][x] = false;
                this.tileLitProgress[y][x] = 0;
                this.tileLight[y][x] = 0;
                this.tileEnergy[y][x] = 0;
                this.distances[y][x] = 0;
                this.alertTimer[y][x] = 0;
                if (this.tiles[y][x].alwaysLit) {
                    this.tileLit[y][x] = true;
                    this.tileLitProgress[y][x] = 1;
                }
                if (this.tiles[y][x].drawBack)
                    this.tiles[y][x].drawBack(this.floorBuffer, this, x, y);
            }
        }
        this.recalcPower();
    },

    enter: function() {
        
    },

    step: function(dt) {
        if (this.victoryTimer > 0) {
            this.victoryTimer -= dt;
            if (this.victoryTimer <= 0) {
                // victory, go to next level
                var level = this.currentLevel + 1;
                if (level === 300) {
                    // show victory screen
                } else {
                    this.loadLevel(level);
                }
            }
        }

        var lightSpeed = 2; // :D
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                if (this.tiles[y][x].update) {
                    this.tiles[y][x].update(this, dt, x, y);
                }
                if (this.tileLit[y][x]) {
                    this.tileLitProgress[y][x] = Math.min(
                        1,
                        this.tileLitProgress[y][x] + dt * lightSpeed);
                } else {
                    this.tileLitProgress[y][x] = Math.max(
                        0,
                        this.tileLitProgress[y][x] - dt * lightSpeed);
                }
                this.alertTimer[y][x] = Math.max(this.alertTimer[y][x] - dt, 0);
            }
        }
        for (var i = 0; i < this.entities.length; i++)
            this.entities[i].update(this, dt);
        for (var i = this.entities.length - 1; i >= 0; i--) {
            if (this.entities[i].dead) {
                // add particles?
                this.entities.splice(i, 1);
            }
        }

        var tileX = Math.floor(this.app.mouse.x / 8);
        var tileY = Math.floor(this.app.mouse.y / 8);
        if (this.app.keyboard.keys.space) {
            if (!this.oldPressed) {
                if (this.app.mouse.left) {
                    if (this.tileLit[tileY][tileX]) {
                        if (this.tiles[tileY][tileX].click)
                            this.tiles[tileY][tileX].click(this, tileX, tileY);
                    } else {
                        this.powerTile(tileX, tileY);
                    }
                } else if (this.app.mouse.right) {
                    this.unpowerTile(tileX, tileY);
                }
            }
        } else {
            if (!this.oldPressed) {
                var player = this.getPlayer();
                var x = Math.round(this.app.mouse.x) / 8;
                var y = Math.round(this.app.mouse.y) / 8;
                if (this.app.mouse.left) {
                    if (this.tileLit[tileY][tileX]) {
                        if (this.tiles[tileY][tileX].click)
                            this.tiles[tileY][tileX].click(this, tileX, tileY);
                        else if (player !== null)
                            player.command(this, x, y);
                    } else if (player !== null) {
                        player.command(this, x, y);
                    }
                }
            }
        }
        if (!this.oldPressedR && this.app.keyboard.keys.r) {
            this.loadLevel(this.currentLevel);
        }
        this.oldPressed = this.app.mouse.left || this.app.mouse.right;
        this.oldPressedR = this.app.keyboard.keys.r;
    },

    powerTile: function(x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height)
            return;
        if (this.tileLit[y][x] || !this.tiles[y][x].allowLight)
            return;
        // recalculate tile energy
        for (var xx = 0; xx < this.width; xx++) {
            for (var yy = 0; yy < this.height; yy++) {
                this.tileEnergy[yy][xx] = 0;
            }
        }
        for (var xx = 0; xx < this.width; xx++) {
            for (var yy = 0; yy < this.height; yy++) {
                var t = this.tiles[yy][xx];
                if (t.alwaysLit && t.availablePower > 0) {
                    this.addEnergy(xx, yy, t.availablePower);
                }
            }
        }
        // find distances to selected tile
        this.runBfs(x, y, 'allowLight');
        // find best tile to connect to
        var bestX = 0, bestY = -1, bestDif = -2000000000;
        for (var xx = 0; xx < this.width; xx++) {
            for (var yy = 0; yy < this.height; yy++) {
                if (!this.tileLit[yy][xx])
                    continue;
                var dif = this.tileEnergy[yy][xx] - this.distances[yy][xx];
                if (dif > bestDif) {
                    bestDif = dif;
                    bestX = xx;
                    bestY = yy;
                }
            }
        }
        
        // bestDif >= 0 means that energy >= distace
        if (bestDif < 0) {
            // cannot light this tile
            if (bestY >= 0) {
                // mark alert path and generators
                for (var xx = 0; xx < this.width; xx++) {
                    for (var yy = 0; yy < this.height; yy++) {
                        this.visit[yy][xx] = false;
                    }
                }
                this.alertGenerators(bestX, bestY);
                var markSteps = this.tileEnergy[bestY][bestX] + 1;
                this.alertPath(bestX, bestY, markSteps);
            } else {
                // no path
            }
            this.app.sound.play('notEnoughPower');
        } else {
            this.lightPath(bestX, bestY);
            this.recalcPower();
        }
    },

    runBfs: function(startX, startY, prop) {
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                this.distances[y][x] = 1000000000;
            }
        }
        this.distances[startY][startX] = 0;
        var q = [startX + (startY << 10)];
        var next = 0;
        while (next < q.length) {
            var x = q[next] & ((1 << 10) - 1);
            var y = q[next] >> 10;
            next += 1;
            var d = this.distances[y][x] + 1;
            if (x > 0 && this.distances[y][x - 1] > d && this.tiles[y][x - 1][prop]) {
                this.distances[y][x - 1] = d;
                q.push((x - 1) + (y << 10));
            }
            if (x < this.width - 1 && this.distances[y][x + 1] > d && this.tiles[y][x + 1][prop]) {
                this.distances[y][x + 1] = d;
                q.push((x + 1) + (y << 10));
            }
            if (y > 0 && this.distances[y - 1][x] > d && this.tiles[y - 1][x][prop]) {
                this.distances[y - 1][x] = d;
                q.push(x + ((y - 1) << 10));
            }
            if (y < this.height - 1 && this.distances[y + 1][x] > d && this.tiles[y + 1][x][prop]) {
                this.distances[y + 1][x] = d;
                q.push(x + ((y + 1) << 10));
            }
        }
    },

    addEnergy: function(x, y, val) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height)
            return;
        if (!this.tileLit[y][x] || this.tileEnergy[y][x] !== 0)
            return;
        this.tileEnergy[y][x] = val;
        this.addEnergy(x - 1, y, val);
        this.addEnergy(x + 1, y, val);
        this.addEnergy(x, y - 1, val);
        this.addEnergy(x, y + 1, val);
    },

    alertGenerators: function(x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height)
            return;
        if (this.visit[y][x] || !this.tileLit[y][x])
            return;
        this.visit[y][x] = true;
        if (this.tiles[y][x].alwaysLit) {
            this.alertTimer[y][x] = this.initialAlertTime;
        }
        this.alertGenerators(x - 1, y);
        this.alertGenerators(x + 1, y);
        this.alertGenerators(x, y - 1);
        this.alertGenerators(x, y + 1);
    },

    alertPath: function(x, y, steps) {
        if (steps <= 0)
            return;
        if (!this.tileLit[y][x])
            this.alertTimer[y][x] = this.initialAlertTime;
        if (x > 0 && this.distances[y][x - 1] < this.distances[y][x])
            this.alertPath(x - 1, y, steps - 1);
        else if (y > 0 && this.distances[y - 1][x] < this.distances[y][x])
            this.alertPath(x, y - 1, steps - 1);
        else if (x < this.width && this.distances[y][x + 1] < this.distances[y][x])
            this.alertPath(x + 1, y, steps - 1);
        else if (y < this.height && this.distances[y + 1][x] < this.distances[y][x])
            this.alertPath(x, y + 1, steps - 1);
    },

    lightPath: function(x, y) {
        this.tileLit[y][x] = true;
        if (x > 0 && this.distances[y][x - 1] < this.distances[y][x])
            this.lightPath(x - 1, y);
        else if (y > 0 && this.distances[y - 1][x] < this.distances[y][x])
            this.lightPath(x, y - 1);
        else if (x < this.width && this.distances[y][x + 1] < this.distances[y][x])
            this.lightPath(x + 1, y);
        else if (y < this.height && this.distances[y + 1][x] < this.distances[y][x])
            this.lightPath(x, y + 1);
    },

    unpowerTile: function(x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height)
            return;
        if (!this.tileLit[y][x] || this.tiles[y][x].alwaysLit)
            return;
        this.tileLit[y][x] = false;
        this.recalcPower();
    },

    visitReachableLit: function(x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height)
            return 0;
        if (this.visit[y][x] || !this.tileLit[y][x])
            return 0;
        this.visit[y][x] = true;
        var score = 1;
        score += this.visitReachableLit(x - 1, y);
        score += this.visitReachableLit(x + 1, y);
        score += this.visitReachableLit(x, y - 1);
        score += this.visitReachableLit(x, y + 1);
        if (this.tiles[y][x].alwaysLit) {
            if (this.tiles[y][x].priority > this.generatorsFound.bestPriority) {
                this.generatorsFound.bestPriority = this.tiles[y][x].priority;
                this.generatorsFound.bestX = x;
                this.generatorsFound.bestY = y;
            }
            this.generatorsFound.amount += 1;
            this.generatorsFound.totalPower += this.tiles[y][x].power;
            this.tiles[y][x].availablePower = 0;
        }
        return score;
    },

    clearLitGroup: function(x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height)
            return 0;
        if (this.tileLit[y][x]) {
            this.tileLit[y][x] = false;
            this.clearLitGroup(x - 1, y);
            this.clearLitGroup(x + 1, y);
            this.clearLitGroup(x, y - 1);
            this.clearLitGroup(x, y + 1);
        }
    },

    recalcPower: function() {
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                this.visit[y][x] = false;
                if (this.tiles[y][x].alwaysLit)
                    this.tileLit[y][x] = true;
            }
        }
        var needRecalc = false;
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                if (this.tileLit[y][x] && !this.visit[y][x]) {
                    // calculate lit tile count
                    // calculate total generator power
                    // if generator power <= tile count, unpower all tiles
                    // otherwise, use up all generators,
                    // give primary generator the leftovers
                    this.generatorsFound = {
                        amount: 0,
                        totalPower: 0,
                        bestPriority: 0,
                        bestX: 0,
                        bestY: 0,
                    };
                    var litTileCount = this.visitReachableLit(x, y);
                    if (litTileCount > this.generatorsFound.totalPower) {
                        this.clearLitGroup(x, y);
                        needRecalc = true;
                    } else {
                        var xx = this.generatorsFound.bestX;
                        var yy = this.generatorsFound.bestY;
                        var power = this.generatorsFound.totalPower - litTileCount;
                        this.tiles[yy][xx].availablePower = power;
                    }
                }
            }
        }
        if (needRecalc) {
            this.recalcPower();
        }
    },

    raycastHit: function(sx, sy, ex, ey, ignoreTurrets) {
        if (sx < 0 || sx >= this.width || sy < 0 || sy >= this.height)
            return true;
        if (ex < 0 || ex >= this.width || ey < 0 || ey >= this.height)
            return true;
        // poor man's raycast :)
        for (var i = 0; i < 50; i++) {
            var p = i / 50;
            var x = Math.floor(sx * p + ex * (1 - p));
            var y = Math.floor(sy * p + ey * (1 - p));
            if (!this.tiles[y][x].walkable && (!ignoreTurrets || !this.tiles[y][x].isTurret))
                return true;
        }
        return false;
    },

    isSolidAt: function(x, y, ignoreTurrets) {
        x = Math.floor(x);
        y = Math.floor(y);
        if (x < 0 || x >= this.width || y < 0 || y >= this.height)
            return true;
        return !this.tiles[y][x].walkable && (!ignoreTurrets || !this.tiles[y][x].isTurret);
    },

    canPlaceEntity: function(x, y, ignore) {
        var can = true;
        can &= !this.isSolidAt(x - 0.25, y - 0.25);
        can &= !this.isSolidAt(x - 0.25, y + 0.25 - 0.001);
        can &= !this.isSolidAt(x + 0.25 - 0.001, y - 0.25);
        can &= !this.isSolidAt(x + 0.25 - 0.001, y + 0.25 - 0.001);
        if (!can)
            return false;
        for (var i = 0; i < this.entities.length; i++) {
            if (this.entities[i] === ignore || !this.entities[i].solid)
                continue;
            var dx = x - this.entities[i].x;
            var dy = y - this.entities[i].y;
            if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5)
                return false;
        }
        return true;
    },

    getPlayer: function() {
        for (var i = 0; i < this.entities.length; i++)
            if (this.entities[i].isControlled)
                return this.entities[i];
        return null;
    },

    render: function() {
        var app = this.app;
        var layer = this.app.layer;
        this.buffer.clearRect(0, 0, this.width * 8, this.height * 8);
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                if (this.tiles[y][x].draw)
                    this.tiles[y][x].draw(this.buffer, this, x, y);
            }
        }
        for (var i = 0; i < this.entities.length; i++) {
            this.entities[i].draw(this.buffer, this);
        }
        layer.drawImage(this.floorBuffer.canvas, 0, 0, this.width * 8, this.height * 8);
        layer.drawImage(this.buffer.canvas, 0, 0, this.width * 8, this.height * 8);
    }
};
