const GRID = new Array(7);
for (var i = 0; i < 7; i++) {
    GRID[i] = new Array(7);
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
            img.attr('x', 3 + 100 * idx);
        }, function() { // hover out
            c.attr('fill', '#000');
        });

        c.click(function() {
            img.attr('y', 603);
        })
    })(col, i);
    cols[col.id] = i;
}

img = paper.image("svg/disc7.svg", 303, -100, 95, 95);

for (var i = 1; i <= 6; i++) {
    var px = i * 100;
    var pathString = "M"+px+",0L"+px+",700";
    var path = paper.path(pathString);
    path.attr({"stroke": "#666666", "stroke-width": 2});

    var pathString = "M0,"+px+"L700,"+px;
    var path = paper.path(pathString);
    path.attr({"stroke": "#666666", "stroke-width": 2});
}
