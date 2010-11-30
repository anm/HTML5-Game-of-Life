var numRows = 30;
var numColumns = 30;
var generation = 0;

function curry(method) {
    var curried = [];
    for (var i = 1; i < arguments.length; i++) {
        curried.push(arguments[i]);
    }
    return function() {
        var args = [];
        for (var i = 0; i < curried.length; i++) {
            args.push(curried[i]);
        }
        for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        return method.apply(null, args);
    }
}

/* A clock in the electronics sense.
* Calls func every period ms.
*/
function Clock(func, period) {
    this.timer = null;
    this.func = func;
    this.period = period;

    this.setPeriod = function (period) {
        this.period = period;
        if (this.timer !== null) {
            this.stop();
            this.start();
        }
    }
        
    this.start = function () {
        if (this.timer === null) {
            this.timer = setInterval(this.func, this.period);
        }
    };

    this.stop = function () {
        if (!(this.timer === null)) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    };
}

/* Grid Class */
Grid.prototype = new Array(); // Inherit from Array
Grid.prototype.constructor = Grid; // Set the "class" back to Grid
// The constructor
function Grid(numColumns, numRows) {
    if (isNaN(Number(numColumns)) ||
        isNaN(Number(numRows))) {
        throw new Error(
            "Grid constructor requires two numerical dimensions");
    }

    this.numColumns = numColumns;
    this.numRows    = numRows;

    this.length = numColumns;
    for (var x = 0; x < numColumns; ++x) {
        this[x] = new Array(numRows);
    }
}

var grid = new Grid(numColumns, numRows);
var prev_grid = new Grid(numColumns, numRows);
var period = 100;
var clock = new Clock(tick, period);
var default_period = 200;
var cell_size = 20; //px

window.onload = load;

function load() {
//    alert(window.location.search);
        make_ui();
}

function reset() {
    clock.stop();
    generation = 0;
    show_generation();
    grid = new Grid(numColumns, numRows);
    prev_grid = new Grid(numColumns, numRows);

    var table = document.getElementById("1");
    table.parentNode.replaceChild(make_table("1", grid), table);
}

function run_qunit_tests() {
    $("head").append('<link rel="stylesheet" type="text/css" href="test/qunit.css"></style>');
    $("body").prepend(
        '<div><h1 id="qunit-header">QUnit example</h1>'
            +'<h2 id="qunit-banner"></h2>'
            + '<h2 id="qunit-userAgent"></h2>'
            + '<ol id="qunit-tests"></ol></div><br><br><br>'
    );
    $(document).ready(function () {
        alert("ready");
//        $("body").append(
    });
}

function make_ui() {
    $("#tick").click(this.tick);
    $("#start").click(function() { clock.start();
                                   status.innerHTML = 'Running';});
    $("#stop").click(function() { clock.stop();
                                  status.innerHTML = 'Stopped';});
    $("#reset").click(this.reset);

    $("#speed").text(default_period);

    $(function() {
        $( "#speed-slider" ).slider({
            range: "min",
            value: default_period,
            min: 10,
            max: 1000,
            slide: function( event, ui ) {
                $( "#speed" ).text(ui.value);
                clock.setPeriod(ui.value);
            }
        })
    });
    
    show_generation();

    var table = make_table('1', grid);
    $("#grid").append(table);

    $("#panels").accordion();

    run_qunit_tests();
}

function show_generation() {
    $('#generation').text(generation);
}

/* Takes a Grid.
 * Returns a Grid for the next generation of the supplied Grid.
 */
function nextGeneration(grid) {
    var ng = new Grid(grid.numRows, grid.numColumns);

    for (var y = 1; y < grid.numRows - 1; y++) {
        for (var x = 1; x < grid.numColumns - 1; x++) {
            var sum = area_sum(grid, x, y);

            var prev = grid[x][y] || 0;
            if (live_p(prev, sum)) {
                // Add one to the survival time but stop at a max
                // limit to avoid rollover.
                ng[x][y] = prev < 2 ? prev + 1 : prev;
            }
        }
    }
    return ng;
}

/* Take the generation number of a cell and the number of neighbours it has.
   * Return true if the cell is to live in the next generation.
*/
function live_p(generation, count) {
    if (generation) {
        // If alive
        if (count == 2 || count == 3) {
            // Stay alive
            return true;
        }
    } else {
        if (count == 3) {
            return true;
        }
    }
    return false;
}

//   var canvasContext = document.getElementById("canvas").getContext("2d");

// canvasContext.fillRect(250, 25, 150, 100);

function display(grid) {
    var table = document.getElementById("1");
    var grid_tbody = table.getElementsByTagName("tbody")[0];

    for (var x = 0; x < grid.numColumns; x++) {
        for (var y = 0; y < grid.numRows; y++) {
            if ((grid[x][y]) != (prev_grid[x][y])) {
                if (grid[x][y]) {
                    grid_tbody.childNodes[y].childNodes[x]
                        .className = "live " + "g" + grid[x][y];
                } else {
                    grid_tbody.childNodes[y].childNodes[x]
                        .className = "dead";
                }
            }
        }
    }
}

function display_point(grid, x, y) {
    var table = document.getElementById("1");
    var grid_tbody = table.getElementsByTagName("tbody")[0];

    if (grid[x][y]) {
        grid_tbody.childNodes[y].childNodes[x]
            .className = "live " + "g" + grid[x][y];
    } else {
        grid_tbody.childNodes[y].childNodes[x]
            .className = "dead";
    }
}

/* Compute and display the next generation of grid. */
function tick() {
    prev_grid = grid;
    grid = nextGeneration(grid);
    display(grid);
    ++generation;
    show_generation();
}

/* Return the number of living cells that surround the given point
 */
function area_sum(grid, point_x, point_y) {
    var sum = 0;
    var row;
    var column;

    // The three cells in the rows above and below the given cell
    for (row = point_y - 1; row <= point_y + 1; row = row + 2) {
        for (column = point_x - 1; column <= (point_x + 1); column++) {
            if( row < 0        || column < 0 ||
                row == grid.numRows || column == grid.numColumns) {
                // Off the edge
                alert(row + " " +  column);
            }

            if (grid[column][row]) {
                ++sum;
            }
        }
    }
        
    // The two cells to either side of the given cell
    row = point_y;
    for (column = point_x - 1; column <= (point_x + 1); column += 2) {
        if (grid[column][row]) { 
            ++sum;
        }
    }
    return sum;
}

function make_table(id, grid) {
    // Build the table
    var tbl     = document.createElement("table");
    var tblBody = document.createElement("tbody");
    
    for (var y = 0; y < grid.numRows; y++) {
        var row = document.createElement("tr");
        for (var x = 0; x < grid.numColumns; ++x) {
            var cell = document.createElement("td");

            if (grid[x][y]) {
                cell.className = "live " + "g" + grid[x][y];
            } else {
                cell.className = "dead";
            }

            (function () {var my_x = x;
                          var my_y = y;

                          cell.onclick = function(){
                              toggle_cell(my_x,my_y)
                          };})();

            row.appendChild(cell);
        }
        tblBody.appendChild(row);
    }
    tbl.appendChild(tblBody);
    
    tbl.setAttribute("border", "2");
    tbl.setAttribute("rules", "all");
    tbl.setAttribute("cellpadding", cell_size / 2 + "px");
    tbl.setAttribute("id", id);

    return tbl;
}

function toggle_cell(x, y) {
    if (grid[x][y]) {
        grid[x][y] = 0;
    } else {
        grid[x][y] = 1;
    }
    display_point(grid, x, y);
}