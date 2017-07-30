'use strict';

ld39.loadLevel = function(game, level) {
    function drawText(x, y, text) {
        for (var i = 0; i < text.length; i++) {
            game.tiles[y][x + i] = new ld39.tiles.Letter(text[i]);
        }
    }
    var levelData = game.app.data.levels.levels[level];
    var tiles = [];
    var t = ld39.tiles;
    var nextPriority = 10;
    var prevWall = false;
    for (var y = 0; y < ld39.gameHeight; y++) {
        tiles.push([]);
        for (var x = 0; x < ld39.gameWidth; x++) {
            var ch = levelData[y][x];
            var tile;
            if (ch === '.') {
                tile = new t.Floor();
                prevWall = false;
            } else if (ch === '#') {
                tile = new t.Wall();
                prevWall = true;
            } else if (ch === '%') {
                tile = new t.KeycardDoor(prevWall);
                prevWall = false;
            } else if (ch === '!') {
                tile = new t.Floor();
                prevWall = false;
                game.entities.push(new ld39.entities.Keycard(x + 0.5, y + 0.5));
            } else if (ch === '+') {
                tile = new t.Door(prevWall);
                prevWall = false;
            } else if (ch === '$') {
                tile = new t.Floor();
                prevWall = false;
                var xx = x + Math.floor(Math.random() * 2) / 4 + 0.375;
                var yy = y + Math.floor(Math.random() * 2) / 4 + 0.375;
                game.entities.push(new ld39.entities.Enemy(xx, yy));
            } else if (ch === '@') {
                tile = new t.Teleporter(false);
                prevWall = false;
                game.entities.push(new ld39.entities.Player(x + 0.5, y + 0.5));
            } else if (ch === '>') {
                tile = new t.Teleporter(true);
                prevWall = false;
            } else if (ch === 'X') {
                tile = new t.Turret();
                prevWall = false;
            } else {
                console.log('bad tile at (' + x + '; ' + y + '), ch = ' + ch);
                tile = new t.Floor();
                prevWall = false;
            }
            tiles[y].push(tile);
        }
    }
    game.tiles = tiles;
    if (level === 0) {
        game.getPlayer().teleportInAnimation = 0;
        game.getPlayer().fresh = false;
        game.tiles[6][18] = new t.Floor();
        drawText(2, 2, "USE MOUSE TO MOVE");
        drawText(3, 17, "WALK TO THE");
        drawText(10, 18, "TRANSPORTER");
    } else if (level === 1) {
        drawText(5, 2, "KEYCARDS OPEN");
        drawText(8, 3, "LOCKED DOORS");
    } else if (level === 2) {
        game.tiles[9][8] = new t.Generator(1, 1, 0, false, true);
        game.tiles[9][9] = new t.Generator(21, 2, 1, true, true);
        game.tiles[8][8] = new t.Display(0);
        game.tiles[8][9] = new t.Display(1);
        drawText(2, 1, "HOLD SPACE TO CONTROL");
        drawText(5, 2, "POWER GRID");
        drawText(2, 3, "LEFT-CLICK");
        drawText(5, 4, "TO POWER TILES");
        drawText(2, 5, "RIGHT-CLICK");
        drawText(5, 6, "TO UNPOWER TILES");
        drawText(2, 16, "CLICK POWERED DOOR");
        drawText(3, 17, "TO OPEN OR CLOSE IT");
    } else if (level === 3) {
        game.tiles[9][5] = new t.Generator(1, 1, 0, false, true);
        game.tiles[9][6] = new t.Generator(13, 3, 1, true, true);
        game.tiles[8][5] = new t.Display(0);
        game.tiles[8][6] = new t.Display(1);
        game.tiles[5][21] = new t.Generator(7, 2, 2, true, false);
        game.tiles[4][21] = new t.Display(2);
        drawText(8, 14, "STAND NEXT TO A");
        drawText(8, 15, "GENERATOR TO");
        drawText(8, 16, "TURN IT ON");
    } else if (level === 4) {
        game.tiles[14][19] = new t.Generator(1, 1, 0, false, false);
        game.tiles[14][20] = new t.Generator(14, 5, 1, true, false);
        game.tiles[13][19] = new t.Display(0);
        game.tiles[13][20] = new t.Display(1);
        game.tiles[7][3] = new t.Generator(8, 2, 2, true, false);
        game.tiles[6][3] = new t.Display(2);
        game.tiles[7][11] = new t.Generator(8, 3, 2, true, false);
        game.tiles[6][11] = new t.Display(2);
    } else if (level === 5) {
        game.tiles[11][3] = new t.Generator(1, 1, 0, false, false);
        game.tiles[11][4] = new t.Generator(16, 5, 1, true, false);
        game.tiles[10][3] = new t.Display(0);
        game.tiles[10][4] = new t.Display(1);
        game.tiles[8][19] = new t.Generator(10, 2, 2, true, false);
        game.tiles[7][19] = new t.Display(2);
        drawText(2, 7, "AVOID");
        drawText(0, 8, "ENEMIES");
        drawText(12, 16, "PRESS R TO");
        drawText(11, 17, "RETRY LEVEL");
    } else if (level === 6) {
        game.tiles[15][11] = new t.Generator(1, 4, 0, false, false);
        game.tiles[15][12] = new t.Generator(26, 5, 1, true, false);
        game.tiles[14][11] = new t.Display(0);
        game.tiles[14][12] = new t.Display(1);
        game.tiles[12][19] = new t.Generator(1, 2, 0, false, false);
        game.tiles[12][20] = new t.Generator(21, 3, 1, true, false);
        game.tiles[11][19] = new t.Display(0);
        game.tiles[11][20] = new t.Display(1);
    } else if (level === 7) {
        game.tiles[16][15] = new t.Generator(1, 4, 0, false, false);
        game.tiles[16][16] = new t.Generator(26, 5, 1, true, false);
        game.tiles[15][15] = new t.Display(0);
        game.tiles[15][16] = new t.Display(1);
        drawText(15, 8, "TURRETS");
        drawText(15, 9, "SHOOT");
        drawText(15, 10, "WHEN");
        drawText(15, 11, "POWERED");
    }
}
