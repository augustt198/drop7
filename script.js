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

function columnClicked(col) {
    var targetY = 0;
    for (; targetY < grid[0].length; targetY++) {
        if (grid[col][targetY] !== undefined) {
            break;
        }
    }
    targetY--;

    currentDiscImg.animate({y: 100.5 * targetY}, 60 * targetY, undefined, function() {
        currentDisc = Math.floor(Math.random() * 7);
        var url = "svg/disc" + (currentDisc + 1) + ".svg"
        currentDiscImg = paper.image(url, 303, -100, 95, 95);

        // findRows(grid);
        // applyGravity(grid);
    });

    images[col][targetY] = currentDiscImg;
    grid[col][targetY] = currentDisc;
    console.log("set " + col + ", " + targetY + " = " + currentDisc);
    currentDiscImg = null;
}

var paper = Raphael("container");
paper.setViewBox(0, 0, 700, 700, true);
paper.setSize('100%', '130%');

var img;

var cols = {};

for (var i = 0; i <= 6; i++) {
    col = paper.rect(i * 100, 0, 100, 700)
        .attr('fill', '#000');
    (function (c, idx) {
        c.hover(function() { // hover in
            c.attr('fill', '#262626');
            if (currentDiscImg != null) {
                currentDiscImg.attr('x', 3 + 100 * idx);
            }
        }, function() { // hover out
            c.attr('fill', '#000');
        });

        c.click(function() {
            columnClicked(idx);
        })
    })(col, i);
    cols[col.id] = i;
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
