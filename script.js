var grid;
var currentDisc = Math.floor(Math.random() * 7);
var currentDiscImg;

function createGrid(hardcore) {
    var grid = new Array(7);
    var range = hardcore ? 7 : 8;

    for (var i = 0; i < grid.length; i++) {
        var column = new Array(7);
        var min = 6 - Math.floor(Math.random() * 4);
        for (var j = 6; j > min; j--) {
            column[j] = Math.floor(Math.random() * range);
        }
        grid[i] = column;
    }

    return grid;
}

function testDisc1Disappearing(grid, x, y) {
    var xNeighbors = (x - 1 < 0 || grid[x - 1][y] === undefined) &&
            (x + 1 > 6 || grid[x + 1][y] === undefined);

    var yNeighbors = (y + 1 > 6) && (grid[x][y - 1] === undefined);
    return xNeighbors || yNeighbors;
}

function getDisappearing(grid) {
    var ret = {};
    for (var x = 0; x < grid.length; x++) {
        var y = 0;
        // get "peek"
        for (; y < grid[0].length && grid[x][y] === undefined; y++);

        if (y == grid[0].length)
            continue;

        for (var y2 = y; y2 < grid.length; y2++) {
            var disc = grid[x][y2];
            // console.log("got disc " + disc);
            if (disc == 0 && testDisc1Disappearing(grid, x, y2)) {
                var key = x+","+y2+"-"+x+","+y2;
                ret[key] = [[x, y2]];
            } else if (disc == 6 - y) {
                var key = x+","+y+"-"+x+","+(grid[0].length-1);
                var v   = [[x, y2]];
                ret[key] ? ret[key].push(v) : (ret[key] = v);
            }

            var lX = 0;
            // TODO
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

function applyGravity(grid) {
    for (var x = 0; x < grid.length; x++) {
        var offset = 0;
        for (var y = grid[x].length - 1; y >= 0; y--) {
            var slot = grid[x][y];
            if (slot === undefined) {
                offset++;
            } else {
                grid[x][y] = undefined;
                grid[x][y + offset] = slot;
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
    console.log("set " + idx + ", " + targetY + " = " + currentDisc);
    currentDiscImg = null;
}

var paper = Raphael("container");
paper.setViewBox(0, 0, 700, 700, true);
paper.setSize('100%', '130%');

var img;
var backgroundSlots     = new Array(7);
var backgroundColumns   = new Array(7);


for (var i = 0; i <= 6; i++) {
    backgroundSlots[i] = new Array(7);
    for (var j = 0; j <= 6; j++) {
        var rect = paper.rect(i * 100, j * 100, 100, 100)
            .attr('fill', '#000');

        backgroundSlots[i][j] = rect;
    }

    col = paper.rect(i * 100, 0, 100, 700)
        .attr('fill', '#000')
        .attr('opacity', 0.0);

    (function (c, idx) {
        var hoverOut = function() { // hover out
            c.attr('fill', '#000').attr('opacity', 0.0);
        };
        var hoverIn = function() {
            c.attr('fill', '#262626').attr('opacity', 1.0);
            if (currentDiscImg != null) {
                currentDiscImg.animate({'x': 3 + 100 * idx}, 75);
            }
        }

        c.hover(hoverIn, hoverOut);

        c.click(function() {
            hoverOut();
            columnClicked(idx, hoverIn);
        })
    })(col, i);
}

for (var i = 1; i <= 6; i++) {
    var px = i * 100;
    var pathString = "M"+px+",0L"+px+",700";
    var path = paper.path(pathString);
    path.attr({"stroke": "#666666", "stroke-width": 2});

    var pathString = "M0,"+px+"L700,"+px;
    var path = paper.path(pathString);
    path.attr({"stroke": "#666666", "stroke-width": 2});
}

var url = "svg/disc" + (currentDisc + 1) + ".svg"
currentDiscImg = paper.image(url, 303, -100, 95, 95);

grid = createGrid(true);
while (findRows(grid)) {
    applyGravity(grid);
}
var images = populatePaper(grid, paper);
