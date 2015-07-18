var PAPER = Raphael("container")
            .setViewBox(0, 0, 700, 700, true)
            .setSize('100%', '130%');

var HARDCORE = true;
var GRID;
var BACKGROUND_SLOTS;
var IMAGES;
var CURRENT_DISC;
var CURRENT_COLUMN = 3;


const DISC_X_INC = 101;


function createGrid() {
    GRID = new Array(7);
    var range = HARDCORE ? 7 : 8;

    for (var i = 0; i < GRID.length; i++) {
        var column = new Array(7);
        var min = 6 - Math.floor(Math.random() * 4);
        for (var j = 6; j > min; j--) {
            column[j] = Math.floor(Math.random() * range);
        }
        GRID[i] = column;
    }
}

function columnHoverIn(column, index) {
    CURRENT_COLUMN = index;
    column.attr({fill: '#262626', opacity: 1.0});
    if (CURRENT_DISC != null) {
        CURRENT_DISC.image.animate({'x': 3 + 100 * index}, 75);
    }
}

function columnHoverOut(column, index) {
    column.attr({fill: '#000', opacity: 0.0});
}

function columnClick(column, index) {
    console.log("clicked " + index);

    if (CURRENT_DISC == null)
        return;

    var dropped = CURRENT_DISC;
    CURRENT_DISC = null;

    var y = 0;
    for (y = 0; y < GRID[index].length && GRID[index][y] === undefined; y++);
    y--;
    if (y < 0) {
        return;
    }

    dropped.image.animate({x: 101 * index, y: 101 * y}, 400);

    GRID[index][y] = dropped.number;
}

function drawBoard() {
    BACKGROUND_SLOTS = new Array(7);
    for (var i = 0; i <= 6; i++) {
        BACKGROUND_SLOTS[i] = new Array(7);
        for (var j = 0; j <= 6; j++) {
            var rect = PAPER.rect(i * 100, j * 100, 100, 100)
                .attr('fill', '#000');

            BACKGROUND_SLOTS[i][j] = rect;
        }

        col = PAPER.rect(i * 100, 0, 100, 700)
            .attr('fill', '#000')
            .attr('opacity', 0.0);

        (function (c, idx) {

            c.hover(function() {
                columnHoverIn(c, idx);
            }, function() {
                columnHoverOut(c, idx);
            });

            c.click(function() {
                columnClick(c, idx);
            })
        })(col, i);
    }

    for (var i = 1; i <= 6; i++) {
        var px = i * 100;
        var pathString = "M"+px+",0L"+px+",700";
        var path = PAPER.path(pathString);
        path.attr({"stroke": "#666666", "stroke-width": 2});

        var pathString = "M0,"+px+"L700,"+px;
        var path = PAPER.path(pathString);
        path.attr({"stroke": "#666666", "stroke-width": 2});
    }
}

function drawDiscs() {
    IMAGES = new Array(7);
    for (var x = 0; x < GRID.length; x++) {
        IMAGES[x] = new Array(7);
        for (var y = 0; y < GRID[x].length; y++) {
            var slot = GRID[x][y];
            if (slot !== undefined) {
                var url = "svg/disc" + (slot + 1) + ".svg";
                var image = PAPER.image(url, 100.8 * x, 100.5 * y, 95, 95);
                IMAGES[x][y] = image;
            }
        }
    }
}

function addDisc() {
    var number  = Math.floor(Math.random() * 7);
    var xPos    = 3 * DISC_X_INC;
    if (CURRENT_DISC !== undefined) {
        xPos = CURRENT_DISC.image.attr('x');
    }

    var imageURL = "svg/disc" + (number + 1) + ".svg";
    var image    = PAPER.image(imageURL, xPos, -100, 95, 95);

    CURRENT_DISC = {number: number, image: image};
}

function testDisc1Disappearing(grid, x, y) {
    var xNeighbors = (x - 1 < 0 || grid[x - 1][y] === undefined) &&
            (x + 1 > 6 || grid[x + 1][y] === undefined);

    var yNeighbors = (y + 1 > 6) && (grid[x][y - 1] === undefined);
    return xNeighbors || yNeighbors;
}

// finds the discs which should disappear
//
// | | | | | | |1|
// | | | | | |2|2|
// | | | | |3|3|3|
// | | | |4|4|4|4|
// | | |5|5|5|5|5|
// | |6|6|6|6|6|6|
// |7|7|7|7|7|7|7|
//
// sweeps from left to right, top to bottom
//
function getDisappearing() {
    var ret = {};

    var lastHSweepX;
    var highestHSweepY;
    for (var x = 0; x < GRID.length; x++) {
        var y = 0;
        // get "peak"
        for (; y < GRID[0].length && GRID[x][y] === undefined; y++);

        if (y == GRID[0].length)
            continue;

        for (var y2 = GRID.length - 1; y2 >= y; y2--) {
            var disc = GRID[x][y2];
            if (disc == 0 && testDisc1Disappearing(GRID, x, y2)) {
                var key = packCoordinate(x, y2, x, y2);
                ret[key] = [[x, y2]];
            } else if (disc == 6 - y) {
                var key = packCoordinate(x, y, x, GRID[0].length - 1);
                var v   = [x, y2];
                ret[key] ? ret[key].push(v) : (ret[key] = [v]);
            }

            if (y2 >= highestHSweepY && lastHSweepX == x - 1) {
                continue;
            }

            var lenX = 1;
            for (var x2 = x + 1; x2 < GRID.length; x2++) {
                if (GRID[x2][y2] === undefined) {
                    break;
                } else {
                    lenX++;
                }
            }

            if (lenX > 1 && lastHSweepX != x) {
                lastHSweepX = x;
                highestHSweepY = y2;
            }

            for (var x2 = x; x2 < x + lenX; x2++) {
                if (GRID[x2][y2] != 0 && GRID[x2][y2] == lenX - 1) {
                    var key = packCoordinate(x, y2, x + lenX - 1, y2);
                    var v   = [x2, y2];
                    ret[key] ? ret[key].push(v) : (ret[key] = [v]);
                }
            }
        }
        if (y <= highestHSweepY && x - 1 == lastHSweepX) {
            highestHSweepY = y;
            lastHSweepX++;
        }
    }
    return ret;
}

function findRows(grid) {
    var any = false;
    for (var x = 0; x < grid.length; x++) {
        for (var y = 0; y < grid[x].length; y++) {
            if (testSlot(grid, x, y)) {
                any = true;
                grid[x][y] = undefined;
            }
        }
    }
    return any;
}

function printGrid(grid) {
    for (var y = 0; y < grid[0].length; y++) {
        var str = "";
        for (var x = 0; x < grid.length; x++) {
            var part = grid[x][y] === undefined ? " " : grid[x][y];
            str += part + " ";
        }
        console.log(str);
    }
}

function testSlot(grid, x, y) {
    var slot = grid[x][y];
    if (slot === undefined || slot > 6) {
        return false;
    }
    slot++;
    if (slot == 1) {
        var xNeighbors = (x - 1 < 0 || grid[x - 1][y] === undefined) &&
                         (x + 1 > 6 || grid[x + 1][y] === undefined);
        var yNeighbors = (y + 1 > 6) && (grid[x][y - 1] === undefined);
        return xNeighbors || yNeighbors;
    }

    lenY = 0;
    // go up

    for (var y2 = 6; y2 >= 0; y2--) {
        if (grid[x][y2] === undefined) {
            break;
        } else {
            lenY++;
        }
    }
    if (lenY == slot) {
        return true;
    }

    lenX = 1;
    for (var x2 = x + 1; x2 < 7; x2++) {
        if (grid[x2][y] === undefined) {
            break;
        } else {
            lenX++;
        }
    }
    for (var x2 = x - 1; x2 >= 0; x2--) {
        if (grid[x2][y] === undefined) {
            break;
        } else {
            lenX++;
        }
    }

    return lenX == slot;
}

function applyGravity() {
    for (var x = 0; x < GRID.length; x++) {
        var offset = 0;
        for (var y = GRID[x].length - 1; y >= 0; y--) {
            var slot = GRID[x][y];
            if (slot === undefined) {
                offset++;
            } else {
                GRID[x][y] = undefined;
                GRID[x][y + offset] = slot;
            }
        }
    }
}

function populatePaper(grid, paper) {
    var images = new Array(7);
    for (var x = 0; x < grid.length; x++) {
        images[x] = new Array(7);
        for (var y = 0; y < grid[x].length; y++) {
            var slot = grid[x][y];
            if (slot !== undefined) {
                var url = "svg/disc" + (slot + 1) + ".svg";
                var image = paper.image(url, 100.8 * x, 100.5 * y, 95, 95);
                images[x][y] = image;
            }
        }
    }
    return images;
}

function columnClicked(idx, hoverInFunc) {
    var oldX = currentDiscImg.attr('x');
    var targetY = 0;
    for (; targetY < grid[0].length; targetY++) {
        if (grid[idx][targetY] !== undefined) {
            break;
        }
    }
    targetY--;

    currentDiscImg.animate({y: 100.5 * targetY}, 400, "ease-in", function() {
        currentDisc = Math.floor(Math.random() * 7);
        var url = "svg/disc" + (currentDisc + 1) + ".svg"
        currentDiscImg = paper.image(url, oldX, -100, 95, 95);

        findRows(grid);
        // applyGravity(grid);
        hoverInFunc();
    });

    images[idx][targetY] = currentDiscImg;
    grid[idx][targetY] = currentDisc;
    currentDiscImg = null;
}

/*************
 * UTILITIES *
 *************/

// 0 <= all args < 7
function packCoordinate(x1, y1, x2, y2) {
    return x1 | (y1 << 3) | (x2 << 6) | (y2 << 9);
}

// return [x1, y2, x2, y2];
function unpackCoordinate(packed) {
    return [packed & 7, (packed >> 3) & 7, (packed >> 6) & 7, packed >> 9];
}



// driver

function simulateGrid() {
    var obj = getDisappearing();

    while (Object.keys(obj).length > 0) {
        Object.keys(obj).forEach(function(k) {
            obj[k].forEach(function(pair) {
                var x = pair[0], y = pair[1];
                GRID[x][y] = undefined;
            });
        });

        applyGravity();

        obj = getDisappearing();
    }
}

function game() {
    createGrid();
    simulateGrid();
    drawBoard();
    drawDiscs();

    addDisc();
}

game();
