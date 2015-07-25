var PAPER = Raphael("container")
            .setViewBox(0, 0, 700, 700, true)
            .setSize('100%', '150%');

{
    var scoreNode = document.createElement("H1");
    scoreNode.setAttribute("id", "score");
    var scoreText = document.createTextNode("0");
    scoreNode.appendChild(scoreText);
    document.getElementById("container").insertBefore(scoreNode, PAPER.canvas);
}

var SCORE = 0;

var HARDCORE = true;
var GRID;
var BACKGROUND_SLOTS;
var IMAGES;
var CURRENT_DISC;
var CURRENT_COLUMN = 3;

var CHAIN_TEXT;

const DISC_X_INC = 101;

const COLOR_MAP = {
    1: "#69bd45",
    2: "#efe609",
    3: "#e78624",
    4: "#d82a26",
    5: "#b8499b",
    6: "#21bcee",
    7: "#4556a6"
};

const MOVES_PER_LEVEL   = 5;
var MOVES_LEFT          = 5;
var CURRENT_LEVEL       = 1;

var LEVEL_INDICATORS;
var LEVEL_TEXT;


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

    var y = 0;
    for (y = 0; y < GRID[index].length && GRID[index][y] === undefined; y++);
    y--;
    if (y < 0) {
        return;
    }

    var dropped = CURRENT_DISC;
    CURRENT_DISC = null;

    GRID[index][y] = dropped.number;
    IMAGES[index][y] = dropped.image;

    dropped.image.animate({x: 101 * index, y: 101 * y}, 200 + 50 * y, "easeIn", function() {
        drawUpdates(1, function() {
            if (CHAIN_TEXT !== undefined) {
                CHAIN_TEXT.animate({opacity: 0}, 2500, CHAIN_TEXT.remove);
                CHAIN_TEXT = undefined;
            }

            addDisc();

            return; // TODO fix levels
            MOVES_LEFT--;

            if (MOVES_LEFT < 1) {
                for (var x = 0; x < GRID.length; x++) {
                    for (var y = 0; y < GRID[x].length; y++) {
                        if (IMAGES[x][y] !== undefined) {
                            IMAGES[x][y].attr("y", IMAGES[x][y].attr("y") - 100.5);
                        }
                    }
                }
            }

            LEVEL_INDICATORS[MOVES_LEFT].attr("fill", "#808080");
        });
    });
}

function drawUpdates(chainLen, finishCallback) {
    var update = getDisappearing();
    console.log(update);
    if (Object.keys(update[1]).length < 1) {
        finishCallback();
        return;
    }

    var score = chainScore(chainLen);

    chainDelay(eachBgSlot(update, function(slot) {
        slot.animate({fill: 'white', opacity: 1.0}, 50);
    }), 300, function() {
        eachBgSlot(update, function(slot) {
            slot.animate({fill: 'black', opacity: 0.0}, 50);
        })();
        applyGravity();
        drawUpdates(chainLen + 1, finishCallback);
    }, 700);

    chainDelay(function() {
        Object.keys(update[0]).forEach(function(k) {
            var pair = unpackCoordinate(parseInt(k));
            var x = pair[0], y = pair[1];

            SCORE += score;
            document.getElementById("score").textContent = SCORE;

            var text = PAPER.text(x * 101 + 50, y * 101, "+" + score);
            text.attr({
                "font-size": 50,
                "font-family": "Helvetica",
                "font-weight": 700,
                "fill": COLOR_MAP[GRID[x][y] + 1]
            });

            text.animate({y: 101 * y - 150, opacity: 0}, 2500, function() {
                text.remove();
            });

            GRID[x][y] = undefined;
            IMAGES[x][y].animate({transform: 's1.1'}, 100);
            chainDelay(function() {
                IMAGES[x][y].animate({transform: 's0', opacity: 0}, 500);
            }, 180);

            if (chainLen > 1) {
                if (CHAIN_TEXT !== undefined) {
                    CHAIN_TEXT.attr("text", "CHAIN x" + chainLen);
                } else {
                    CHAIN_TEXT = PAPER.text(90, -30, "CHAIN x" + chainLen).attr({
                        "fill": "white",
                        "font-family": "Helvetica",
                        "font-size": 40,
                        "text-align": "left"
                    });
                }
            }
        });
    }, 300);
}

function drawBoard() {
    BACKGROUND_SLOTS = new Array(7);
    for (var i = 0; i <= 6; i++) {
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

        BACKGROUND_SLOTS[i] = new Array(7);
        for (var j = 0; j <= 6; j++) {
            var rect = PAPER.rect(i * 100, j * 100, 100, 100)
                .attr('fill', '#000')
                .attr('opacity', 0.0);
            rect[0].setAttribute("class", "square");

            BACKGROUND_SLOTS[i][j] = rect;
        }
    }

    for (var i = 1; i <= 6; i++) {
        var px = i * 100;
        var pathString = "M"+px+",0L"+px+",700";
        var path = PAPER.path(pathString);
        path.attr({"stroke": "#5e5e5e", "stroke-width": 2});

        var pathString = "M0,"+px+"L700,"+px;
        var path = PAPER.path(pathString);
        path.attr({"stroke": "#5e5e5e", "stroke-width": 2});
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
    var xPos    = CURRENT_COLUMN * DISC_X_INC;

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
// Returns: An array, [discs, ranges]
// * discs is an object whose keys are
// packed coordinates obtained by packCoordinate()
//
// * ranges is an object whose keys are
// packed pairs of coordinates obtained by
// packCoordinatePair()

function getDisappearing() {
    // hacky sets
    var discs  = {};
    var ranges = {};

    for (var x = 0; x < GRID.length; x++) {
        var y = 0;
        // get "peak"
        for (; y < GRID[0].length && GRID[x][y] === undefined; y++);

        if (y == GRID[0].length)
            continue;

        for (var y2 = GRID.length - 1; y2 >= y; y2--) {
            var disc = GRID[x][y2];
            if (disc == 0 && testDisc1Disappearing(GRID, x, y2)) {
                var range = packCoordinatePair(x, y2, x, y2);
                ranges[range] = true;
                var disc = packCoordinate(x, y2);
                discs[disc] = true;
            } else if (disc == 6 - y) {
                var range = packCoordinatePair(x, y, x, GRID[0].length - 1);
                ranges[range] = true;
                var disc = packCoordinate(x, y2);
                discs[disc] = true;
            }


            var lenX = 0;
            var rXbound = x;
            for (var x2 = x + 1; x2 < GRID.length && GRID[x2][y2] !== undefined; x2++) {
                lenX++;
                rXbound = x2;
            }

            var lXBound = x;
            for (var x2 = x - 1; x2 >= 0 && GRID[x2][y2] !== undefined; x2--) {
                lenX++;
                lXBound = x2;
            }

            if (disc != 0 && disc == lenX) {
                var range = packCoordinatePair(lXBound, y2, rXbound, y2);
                ranges[range] = true;
                var disc = packCoordinate(x, y2);
                discs[disc] = true;
            }
        }

    }
    return [discs, ranges];
}

function printGrid() {
    for (var y = 0; y < GRID[0].length; y++) {
        var str = "";
        for (var x = 0; x < GRID.length; x++) {
            var part = GRID[x][y] === undefined ? " " : GRID[x][y];
            str += part + " ";
        }
        console.log(str);
    }
}

function applyGravity() {
    for (var x = 0; x < GRID.length; x++) {
        var offset = 0;
        for (var y = GRID[x].length - 1; y >= 0; y--) {
            var slot = GRID[x][y];
            if (slot === undefined) {
                offset++;
            } else {
                if (offset != 0) {
                    GRID[x][y] = undefined;
                    GRID[x][y + offset] = slot;
                    if (IMAGES !== undefined) {
                        var img = IMAGES[x][y];
                        IMAGES[x][y] = undefined;
                        IMAGES[x][y + offset] = img;
                        IMAGES[x][y + offset].animate(
                            {y: 100.5 * (y + offset)}, 170 * offset
                        );
                    }
                }
            }
        }
    }
}

function drawLevelIndicators() {
    LEVEL_INDICATORS = [];
    for (var i = 0; i < MOVES_PER_LEVEL; i++) {
        var circ = PAPER.circle(i * 24 + 10, 730, 10);
        circ.attr("fill", "white");
        circ.attr("stroke", "none");
        LEVEL_INDICATORS.push(circ);
    }


    LEVEL_TEXT = PAPER.text(65, 770, "Level 1").attr({
        "font-size": 40,
        "font-family": "Helvetica",
        "font-weight": 300,
        "fill": "white"
    });
}

/*************
 * UTILITIES *
 *************/

// 0 <= all args < 7
function packCoordinatePair(x1, y1, x2, y2) {
    return x1 | (y1 << 3) | (x2 << 6) | (y2 << 9);
}

// return [x1, y2, x2, y2];
function unpackCoordinatePair(packed) {
    return [packed & 7, (packed >> 3) & 7, (packed >> 6) & 7, packed >> 9];
}

function packCoordinate(x, y) {
    return x | y << 3;
}

function unpackCoordinate(packed) {
    return [packed & 7, (packed >> 3) & 7];
}

function chainDelay() {
    var timeOffset = 0;
    for (var i = 0; i < arguments.length; i += 2) {
        var callback = arguments[i];
        var delay    = arguments[i + 1];
        setTimeout(callback, timeOffset + delay);
        timeOffset += delay;
    }
}

function chainScore(chainLen) {
    // http://programmablebrick.blogspot.com/2013/03/drop7-with-lego-mindstorms-nxt.html
    return Math.floor(7 * Math.pow(chainLen, 2.5));
}

function eachBgSlot(update, callback) {
    return function() {
        Object.keys(update[1]).forEach(function(k) {
            var arr = unpackCoordinatePair(parseInt(k));
            var x1 = arr[0], y1 = arr[1], x2 = arr[2], y2 = arr[3];
            for (var x = x1; x <= x2; x++) {
                for (var y = y1; y <= y2; y++) {
                    callback(BACKGROUND_SLOTS[x][y]);
                }
            }
        });
    };
}

// driver

function simulateGrid() {
    var discs = getDisappearing()[0];


    while (Object.keys(discs).length > 0) {
        Object.keys(discs).forEach(function(k) {
            var pair = unpackCoordinate(parseInt(k));
            var x = pair[0], y = pair[1];
            GRID[x][y] = undefined;
        });

        applyGravity();

        discs = getDisappearing()[0];
    }
}

PAPER.rect(0, 0, 700, 700).attr('fill', 'black');

function game() {
    createGrid();
    drawLevelIndicators();
    simulateGrid();
    drawBoard();
    drawDiscs();

    addDisc();
}

game();
