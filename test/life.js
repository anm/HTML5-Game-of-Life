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

test ("Initialise programme", 3, function() {
    ok(grid instanceof Grid, "grid is Grid");
    ok(prev_grid instanceof Grid, "prev_grid is Grid");
    ok(grid != prev_grid, "grid and prev_grid are not the same object");
});

test("test_Grid_instantiation", 12, function() {
    var g = new Grid(10, 10);
    ok(g instanceof Grid, "type is Grid");
    ok(g[1][1] === undefined, "Access element ok. It's undefined.");

    g[1][1] = 3;
    equal(g[1][1], 3, "Value stored and recovered.");
    equal(g.numRows, 10, "numRows set ok");
    equal(g.length, g.numRows, "length == numrows");

    var g2 = new Grid(5, 5);
    equal(g[1][1], 3, "Value still set after second object made");
    equal(g.numRows, 10, "numRows still set ok");
    equal(g2.numRows, 5, "numRows set ok");    

    raises(function() {var g3 = new Grid()}, "Error with no args");
    raises(function() {var g3 = new Grid(0)}, "Error with one arg");
    raises(function() {var g3 = new Grid(3, "jobby")}, "Error with string arg");
    
    var k = false;
    try {
        var g3 = new Grid(new Number(1), 3);
        k = true;
    } catch (e) {}
    ok(k, "Number object ok");
});

test("Test nextGeneration", 3, function() {
    wraparound = false;

    var g = new Grid(10, 10);

    // Glider
    g[5][5] = 1;
    g[6][5] = 1;
    g[7][5] = 1;
    g[7][4] = 1;
    g[6][3] = 1;

    // Point
    g[8][8] = 10;

    var ng = nextGeneration(g);
    ok(ng instanceof Grid, "Returns a Grid");
    ok(ng !== g, "Result not the same object as argument");
    
    /* The correct new grid */
    var ngc = new Grid(10,10);

    // Glider
    ngc[5][4] = 1;
    ngc[6][5] = 2;
    ngc[7][5] = 2;
    ngc[7][4] = 2;
    ngc[6][6] = 1;

    // Point
    // (undefined)

    var err = grid_difference(ng, ngc);
    ok(!err, "Next generation ok for glider and point " + err);
});

test("Edge wraparound on", 4, function() {
    wraparound = true;
    track_n_generations = 10;

    /*  Box in corner */
    var g = new Grid(10, 10);
    g[0][0] = 1;
    g[0][1] = 1;
    g[1][0] = 1;
    g[1][1] = 1;

    // The correct new grid.
    var ngc = new Grid(10, 10);
    ngc[0][0] = 2;
    ngc[0][1] = 2;
    ngc[1][0] = 2;
    ngc[1][1] = 2;

    var ng = nextGeneration(g);
    var err = grid_difference(ng, ngc);
    ok(!err, "Box in corner preserved " + err);

    /*  Box in middle */
    var g = new Grid(10, 10);
    g[5][5] = 1;
    g[5][6] = 1;
    g[6][5] = 1;
    g[6][6] = 1;

    // The correct new grid.
    var ngc = new Grid(10, 10);
    ngc[5][5] = 2;
    ngc[5][6] = 2;
    ngc[6][5] = 2;
    ngc[6][6] = 2;

    var ng = nextGeneration(g);
    var err = grid_difference(ng, ngc);
    ok(!err, "Box in middle preserved " + err);

    /* Box on both joins. */
    var g = new Grid(10, 10);
    g[0][0] = 1;
    g[9][0] = 1;
    g[0][9] = 1;
    g[9][9] = 1;

    // The correct new grid. No change expected.
    var ngc = new Grid(10, 10);
    ngc[0][0] = 2;
    ngc[9][0] = 2;
    ngc[0][9] = 2;
    ngc[9][9] = 2;

    var ng  = nextGeneration(g);
    var err = grid_difference(ng, ngc);
    ok(!err, "Box across both edges preserved " + err);

    /* Glider crosses both edges */
    var g = new Grid(10, 10);
    g[7][9] = 1;
    g[8][9] = 1;
    g[9][9] = 1;
    g[9][8] = 1;
    g[8][7] = 1;

    // 4 ticks to move glider
    var ng = nextGeneration(nextGeneration(nextGeneration(nextGeneration(g))));

    // The correct new grid
    var ngc = new Grid(10, 10);

    // Glider
    ngc[0][0] = 1;
    ngc[8][0] = 4;
    ngc[9][0] = 3;
    ngc[0][9] = 2;
    ngc[9][8] = 1;

    var err = grid_difference(ng, ngc);
    ok(!err, "Full glider cycle ok for glider initially in corner " + err);
});

test("Edge wraparound off", 3, function() {
    wraparound = false;

    /*  Box in corner */
    var g = new Grid(10, 10);
    g[0][0] = 1;
    g[0][1] = 1;
    g[1][0] = 1;
    g[1][1] = 1;

    // The correct new grid. Only change in generation incerment.
    var ngc = new Grid(10, 10);
    ngc[0][0] = 2;
    ngc[0][1] = 2;
    ngc[1][0] = 2;
    ngc[1][1] = 2;

    var ng = nextGeneration(g);
    var err = grid_difference(ng, ngc);
    ok(!err, "Box in corner preserved " + err);

    /* Box on both joins. */
    var g = new Grid(10, 10);
    g[0][0] = 1;
    g[9][0] = 1;
    g[0][9] = 1;
    g[9][9] = 1;

    // The correct new grid. All dead.
    var ngc = new Grid(10, 10);

    var ng  = nextGeneration(g);
    var err = grid_difference(ng, ngc);
    ok(!err, "Box across both edges died " + err);

    /* Glider in bottom right corner */
    var g = new Grid(10, 10);
    g[7][9] = 1;
    g[8][9] = 1;
    g[9][9] = 1;
    g[9][8] = 1;
    g[8][7] = 1;

    var ng = nextGeneration(g);

    // The correct new grid
    var ngc = new Grid(10, 10);

    // Glider
    ngc[8][9] = 2;
    ngc[9][9] = 2;
    ngc[9][8] = 2;
    ngc[7][8] = 1;

    var err = grid_difference(ng, ngc);
    ok(!err, "Glider in corner ok, parts off edge dissapear " + err);
});

test("Edge wraparound UI", 3, function() {
    equal(wraparound, false, "Wraparound defaults false");
    simulateClick(document.getElementById("wraparound-p"));
    equal(wraparound, true,  "Wraparound on after click");
    simulateClick(document.getElementById("wraparound-p"));
    equal(wraparound, false, "Wraparound off after second click");
});

function grid_difference(grid, expected_grid) {
    /* Check grids are the same. Note any differences in err string */
    var err = "";
    for (x = 0; x < grid.numRows; ++x) {
        for (y = 0; y < grid.numColumns; ++y) {
            if (grid[x][y] !== expected_grid[x][y]) {
                err += '(' + x + ',' + y + '): '
                    + 'expect:' + expected_grid[x][y]
                    + ' got: ' + grid[x][y] + "\r\n";
            }
        }
    }
    return err;
}

test("live_p", 14, function() {
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

test("Toggle cell on click", 6, function() {
    var table = document.getElementById("1");
    var grid_tbody = table.getElementsByTagName("tbody")[0];

    var x = 0;
    var y = 0;

    var cell = grid_tbody.childNodes[y].childNodes[x];

    equals(cell.className, "dead", "Initially dead");
    equals(grid[x][y] || 0, 0, "grid generation 0 (dead)");
    cell.onclick();
    equals(cell.className, "live g1", "Live and generation 1 after click");
    equals(grid[x][y], 1, "grid generation 1 (live)");
    cell.onclick();
    equals(cell.className, "dead", "Dead again after second click");
    equals(grid[x][y] || 0, 0, "grid generation 0 (dead)");
});

test("Toggle cell on click, non-square grid", 12, function() {
    /* Use a non-square grid */
    grid = new Grid(15, 5);

    var table = document.getElementById("1");
    table.parentNode.replaceChild(make_table("1", grid), table);

    var table = document.getElementById("1");
    var grid_tbody = table.getElementsByTagName("tbody")[0];

    /* Check a point that is outside the square grid of size min(x,y).
       * This is to catch a bug that occured when rows and columns
       * were interchanged. */

    var x = 5
    var y = 4;

    var cell = grid_tbody.childNodes[y].childNodes[x];

    equals(cell.className, "dead", "Initially dead");
    equals(grid[x][y] || 0, 0, "grid generation 0 (dead)");
    simulateClick(cell);
    equals(cell.className, "live g1", "Live and generation 1 after click");
    equals(grid[x][y], 1, "grid generation 1 (live)");
    simulateClick(cell);
    equals(cell.className, "dead", "Dead again after second click");
    equals(grid[x][y] || 0, 0, "grid generation 0 (dead)");

    /* Also test it after a tick */
    reset(); // In case previous tests left something
    tick();
    var table = document.getElementById("1");
    var grid_tbody = table.getElementsByTagName("tbody")[0];
    var cell = grid_tbody.childNodes[y].childNodes[x];

    equals(cell.className, "dead", "After tick: Initially dead");
    equals(grid[x][y] || 0, 0, "After tick: grid generation 0 (dead)");
    simulateClick(cell);
    equals(cell.className, "live g1", "After tick: Live and generation 1 after click");
    equals(grid[x][y], 1, "After tick: grid generation 1 (live)");
    simulateClick(cell);
    equals(cell.className, "dead", "After tick: Dead again after second click");
    equals(grid[x][y] || 0, 0, "After tick: grid generation 0 (dead)");

});


test("Reset button", 5, function () {

    /* Pollute state */
    prev_grid[0][0] = 1;
    grid[0][0] = 2;
    grid[3][3] = 1;
    display(grid);
    generation = 2;
    show_generation();

    /* Reset */
    simulateClick(document.getElementById("reset"));

    /* Test clean */
    var clean_grid = new Grid(numColumns, numRows);
    var clean_table = make_table(1, clean_grid);

    deepEqual(grid, clean_grid, "grid reset");
    deepEqual(prev_grid, clean_grid, "prev_grid reset");

    var table = document.getElementById("1");
    equal(table.innerHTML, clean_table.innerHTML, "table is clean");

    equal(generation, 0, "Generation set to 0");
    equal(document.getElementById('generation').innerHTML, 0,
          "generation label is 0");
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

test("rgb_to_hex function", 4, function() {
    equals(rgb_to_hex("rgb(0, 0, 0)"), '#000000', "0s work");
    equals(rgb_to_hex("rgb(255, 255, 255)"), '#ffffff', "All 255 ok");
    equals(rgb_to_hex("rgb(17, 100, 231)"), '#1164e7', "Values in correct order");
    equals(rgb_to_hex("rgb(23, 0, 16)"), '#170010', "Zero padded correctly");
});
