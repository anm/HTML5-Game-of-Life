/* Simulate a user clicking on an object.
   * Should work in IE but not tested.
*/
function simulateClick(dom_object) {
    if (!dom_object) {
        throw new Error("simulateClick: dom_object is not defined");
    }

    if (dom_object instanceof jQuery) {
        throw new Error("simulateClick: Require a DOM object, you gave me a jQuery one."
                        + " Hint: use .get(0) to get DOM object from jQuery");
    }

    if (document.createEvent) { // Standard
        var e = document.createEvent('MouseEvents');
        e.initEvent('click', true, true);
            dom_object.dispatchEvent(e);
    } else if (document.createEventObject) { // for IE
        document.createEventObject();
        dom_object.fireEvent('onclick');
    }
}

function grid_difference(grid, expected_grid) {
    /* Check grids are the same. Note any differences in err string */
    if ((grid.height != expected_grid.height) ||
        (grid.width != expected_grid.width)) {
        return "Grids are different sizes";
    }

    var err = "";
    for (x = 0; x < grid.height; ++x) {
        for (y = 0; y < grid.width; ++y) {
            if (grid[x][y] !== expected_grid[x][y]) {
                err += '(' + x + ',' + y + '): '
                    + 'expect:' + expected_grid[x][y]
                    + ' got: ' + grid[x][y] + "\r\n";
            }
        }
    }
    return err;
}

test("Instantiate", 1, function () {
    equal(typeof life, "object", "life object initialised");
});

test("test_Grid_instantiation", 12, function() {
    var g = new life.Grid(10, 10);
    ok(g instanceof life.Grid, "type is Grid");
    ok(g[1][1] === undefined, "Access element ok. It's undefined.");

    g[1][1] = 3;
    equal(g[1][1], 3, "Value stored and recovered.");
    equal(g.height, 10, "height set ok");
    equal(g.length, g.height, "length == numrows");

    var g2 = new life.Grid(5, 5);
    equal(g[1][1], 3, "Value still set after second object made");
    equal(g.height, 10, "height still set ok");
    equal(g2.height, 5, "height set ok");

    raises(function() {var g3 = new life.Grid()}, "Error with no args");
    raises(function() {var g3 = new life.Grid(0)}, "Error with one arg");
    raises(function() {var g3 = new life.Grid(3, "jobby")}, "Error with string arg");

    var k = false;
    try {
        var g3 = new life.Grid(new Number(1), 3);
        k = true;
    } catch (e) {}
    ok(k, "Number object ok");
});

test("Run state text set correctly", 4, function() {
    equal($("#status").html(), "Stopped", "Initially stopped");

    simulateClick($('#start').get(0));
    equal($("#status").html(), "Running", "Status Running");

    simulateClick($('#stop').get(0));
    equal($("#status").html(), "Stopped", "Stopped again");

    simulateClick($('#start').get(0));
    simulateClick($('#reset').get(0));
    equal($("#status").html(), "Stopped", "Reset button also sets status to Stopped");
});

test("Edge wraparound on", 4, function() {
    wraparound = true;
    life.config.track_n_generations = 10;

    var m = new life.Model();
    
    /*  Box in corner */
    var g = new life.Grid(10, 10);
    g[0][0] = 1;
    g[0][1] = 1;
    g[1][0] = 1;
    g[1][1] = 1;

    // The correct new grid.
    var ngc = new life.Grid(10, 10);
    ngc[0][0] = 2;
    ngc[0][1] = 2;
    ngc[1][0] = 2;
    ngc[1][1] = 2;

    m.d_grid = g;
    m.tick();
    var ng = m.grid();

    var err = grid_difference(ng, ngc);
    ok(!err, "Box in corner preserved " + err);

    /*  Box in middle */
    var g = new life.Grid(10, 10);
    g[5][5] = 1;
    g[5][6] = 1;
    g[6][5] = 1;
    g[6][6] = 1;

    // The correct new grid.
    var ngc = new life.Grid(10, 10);
    ngc[5][5] = 2;
    ngc[5][6] = 2;
    ngc[6][5] = 2;
    ngc[6][6] = 2;

    m.d_grid = g;
    m.tick();
    var ng = m.grid();

    var err = grid_difference(ng, ngc);
    ok(!err, "Box in middle preserved " + err);

    /* Box on both joins. */
    var g = new life.Grid(10, 10);
    g[0][0] = 1;
    g[9][0] = 1;
    g[0][9] = 1;
    g[9][9] = 1;

    // The correct new grid. No change expected.
    var ngc = new life.Grid(10, 10);
    ngc[0][0] = 2;
    ngc[9][0] = 2;
    ngc[0][9] = 2;
    ngc[9][9] = 2;

    m.d_grid = g;
    m.tick();
    var ng = m.grid();
    var err = grid_difference(ng, ngc);
    ok(!err, "Box across both edges preserved " + err);

    /* Glider crosses both edges */
    var g = new life.Grid(10, 10);
    g[7][9] = 1;
    g[8][9] = 1;
    g[9][9] = 1;
    g[9][8] = 1;
    g[8][7] = 1;

    // 4 ticks to move glider
    m.d_grid = g;
    m.tick();
    m.tick();
    m.tick();
    m.tick();
    var ng = m.grid();

    // The correct new grid
    var ngc = new life.Grid(10, 10);

    // Glider
    ngc[0][0] = 1;
    ngc[8][0] = 4;
    ngc[9][0] = 3;
    ngc[0][9] = 2;
    ngc[9][8] = 1;

    var err = grid_difference(ng, ngc);
    ok(!err, "Full glider cycle ok for glider initially in corner " + err);
});

test("Edge wraparound UI", 3, function() {
    equal(life.config.wraparound, true, "Wraparound defaults true");
    simulateClick(document.getElementById("wraparound-p"));
    equal(life.config.wraparound, false,  "Wraparound off after click");
    simulateClick(document.getElementById("wraparound-p"));
    equal(life.config.wraparound, true, "Wraparound on after second click");
});


test("live_p", 14, function() {
    var live_p = life.Model.prototype.live_p;

    /* Conway's Rules */
    equals(false, live_p(0, 0));
    equals(false, live_p(0, 1));
    equals(false, live_p(0, 2));
    equals(true,  live_p(0, 3));
    equals(false, live_p(0, 4));
    equals(false, live_p(0, 5));
    equals(false, live_p(0, 6));

    equals(false, live_p(1, 0));
    equals(false, live_p(1, 1));
    equals(true,  live_p(1, 2));
    equals(true,  live_p(1, 3));
    equals(false, live_p(1, 4));
    equals(false, live_p(1, 5));
    equals(false, live_p(1, 6));

    //  Will omit these for speed.
    // // Check undefined is interpreted as 0
    // equals(false,  live_p(undefined, 2));

    // raises(function () {live_p(0, -1)}, "Negative count is error");
    // raises(function () {live_p(1, -1)}, "Negative count is error");
    // raises(function () {live_p(0, 9)}, ">8 count is error");
    // raises(function () {live_p(1, 9)}, ">8 count is error");

    // raises(function () {live_p(-1, 1)}, "-ve generation is error");
});

test("rgb_to_hex function", 4, function() {
    rgb_to_hex = life.rgb_to_hex; 
    equals(rgb_to_hex("rgb(0, 0, 0)"), '#000000', "0s work");
    equals(rgb_to_hex("rgb(255, 255, 255)"), '#ffffff', "All 255 ok");
    equals(rgb_to_hex("rgb(17, 100, 231)"), '#1164e7', "Values in correct order");
    equals(rgb_to_hex("rgb(23, 0, 16)"), '#170010', "Zero padded correctly");
});

test("View", 12, function () {
    // Generation
    var v = new life.View();
    strictEqual($('#generation').text(), "0", "Showing generation 0");
    equal(v.generation(), 0, "Generation initially 0");
    v.generation(1);
    equal($('#generation').text(), 1, "Showing generation 1");
    equal(v.generation(), 1, "Generation now 1");

    // Grid
    var g  = new life.Grid(life.config.width, life.config.height);
    ok(typeof v.grid() === 'undefined', "Get grid initially undefined");
    equal(v.grid(g), g, "Set grid returns new grid");
    equal(v.grid(), g, "Get grid returns new grid");

    // Status
    equal(v.status(), "Stopped", "Initially stopped");
    equal($("#status").html(), "Stopped", "Display initially stopped");
    equal(v.status("bob"), "bob", "Set returns new value");
    equal(v.status(), "bob", "Set worked");
    equal($("#status").html(), "bob", "Display set");
});


test("TableView", 11, function () {
    var g  = new life.Grid(life.config.width, life.config.height);
    var tv = new life.TableView(g);

    ok(tv instanceof life.TableView, "Type ok");
    equal(tv.d_grid, g, "Grid set");

    /* Really need to properly clear state between tests but will do
     * this as required for now.
     *
     * Remove existing grid so we don't end up with two when add new
     * test one.
     */
    $("#grid-div").html('');

    tv.display();

    equal($('#grid-div table').length, 1, "Table added (one table in grid div)");

    /* Refreshing */
    var tbody = document.getElementsByTagName("tbody")[0];
    
    var x = 0;
    var y = 0;

    var cell = tbody.childNodes[y].childNodes[x];

    equal(cell.className, "dead", "Initially dead");
    var g = new life.Grid(life.config.width, life.config.height);
    g[0][0] = 1;
    tv.grid(g);
    tv.refreshGrid();
    equal(cell.className, "live g1", "New grid is shown");

    var g = new life.Grid(life.config.width, life.config.height);
    g[0][0] = 0;
    tv.grid(g);
    tv.refreshGrid();
    equal(cell.className, "dead", "New grid is shown again, now with cell off");

    g[0][0] = 1;
    tv.grid(g);
    tv.refreshGrid();
    equal(cell.className, "live g1", "Modified grid is shown");

    g[0][0] = 2;
    tv.grid(g);
    tv.refreshGrid();
    equal(cell.className, "live g2", "Modified grid is shown again");

    g[0][0] = 0;
    tv.grid(g);
    tv.refreshCell(0, 0);
    equal(cell.className, "dead", "refreshCell works");

    g[0][0] = 2;
    tv.grid(g);
    tv.refreshGrid();
    equal(cell.className, "live g2", "Modified grid works after refreshCell");

    var g = new life.Grid(life.config.width, life.config.height);
    g[0][0] = 0;
    tv.grid(g);
    tv.refreshGrid();
    equal(cell.className, "dead", "New grid also works again");
});

