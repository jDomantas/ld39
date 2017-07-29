'use strict';

ld39.loadLevel = function(game, index) {
    var image = cq(game.app.images.levels['level' + index])
        .context
        .getImageData(0, 0, ld39.gameWidth, ld39.gameHeight)
        .data;
    var tiles = [];
    var t = ld39.tiles;
    var nextPriority = 10;
    var prevWall = false;
    for (var y = 0; y < ld39.gameHeight; y++) {
        tiles.push([]);
        for (var x = 0; x < ld39.gameWidth; x++) {
            var index = y * ld39.gameWidth + x;
            var r = image[index * 4 + 0];
            var g = image[index * 4 + 1];
            var b = image[index * 4 + 2];
            var tile;
            if (r === 255 && g === 255 && b === 255) {
                tile = new t.Floor();
                prevWall = false;
            } else if (r === 0 && g === 0 && b === 0) {
                tile = new t.Wall();
                prevWall = true;
            } else if (r === 255 && g === 0 && b === 0) {
                tile = new t.Generator(21, --nextPriority);
                prevWall = false;
            } else if (r === 0 && g === 0 && b === 255) {
                tile = new t.Display;
                prevWall = false;
            } else if (r === 0 && g === 255 && b === 0) {
                tile = new t.Door(prevWall);
                prevWall = false;
            } else {
                console.log('bad color at (' + x + '; ' + y + ')');
                console.log('r = ' + r + ', g = ' + g + ', b = ' + b);
                tile = new t.Floor();
                prevWall = false;
            }
            tiles[y].push(tile);
        }
    }
    game.tiles = tiles;
}
