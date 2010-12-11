/* Config */
var numRows             = 10;
var numColumns          = 10;
var period              = 200;
var cell_size           = 20; //px
var track_n_generations = 3; // Must be > 0.
var max_generations     = 10;
var wraparound          = false;

/* Global State */
var clock;
var model;
var view;


/* *********************** Controller ******************* */

window.onload = load;

function load() {
    clock = new Clock(tick, period);
    model  = new Model();
    view  = new TableView(model.grid());

    view.display();

//    run_qunit_tests();
}

function reset() {
    clock.stop();
    model.reset();
    view.status("Stopped");
    view.generation(model.generation());
    view.grid(model.grid());
    view.refresh();
}

/* Compute and display the next generation of grid. */
function tick() {
    model.tick();

    view.generation(model.generation());
    view.grid(model.grid());
    view.refresh();
}

/* N.B. start and stop function names clash with qunit */
function start() {
    clock.start();
    view.status("Running");
}

function stop() {
    clock.stop();
    view.status("Stopped");
}

function toggle_cell(x, y) {
    if (model.cell(x, y)) {
        model.cell(x, y, 0);
    } else {
        model.cell(x, y, 1);
    }

    view.grid(model.grid());
    view.refreshCell(x, y);
}

/* ********************** View ********************** */
function View() {
    this.d_generation = 0;
    this.d_status     = "Stopped";

    /* get / set */
    this.grid = function (grid) {
        if (typeof grid !== 'undefined') {
//            this.d_prev_grid = this.d_grid.copy();
            this.d_grid = grid;
        }
        return this.d_grid;
    }

    /* get / set and display */
    this.generation = function (gen) {
        if (typeof gen !== 'undefined') {
            this.d_generation = gen;
            $('#generation').text(this.d_generation);
        }
        return this.d_generation;
    }

    /* get / set and display */
    this.status = function (status) {
        if (typeof status !== 'undefined') {
            this.d_status = status;
            $('#status').html(this.d_status);
        }
        return this.d_status;
    }

    /* Build the UI */
    this.display = function () {
        $("#tick").click(tick);
        $("#start").click(start);
        $("#stop").click(stop);
        $("#reset").click(reset);

        $("#speed").text(period);
        $("#status").html(this.d_status);
        $('#generation').text(this.d_generation);

        $(function() {
            $( "#speed-slider" ).slider({
                range: "min", // Coloured bar from min or max to pointer
                value: period,
                min: 10,
                max: 1000,
                slide: function (event, ui) {
                    $("#speed").text(ui.value);
                    clock.setPeriod(ui.value);
                }
            })
        });

        $("#panels").accordion();

        /* Colours */
        for (var i = 1; i <= max_generations; ++i) {
            // Create style tag for custom colour
            $('head').append('<style id="g' + i + '" type="text/css"></style>')

            // Create swatches
            $('#colour-pickers table').append(
                '<tr id="colour-and-label-' + i + '"><td>G' + i + '</td><td id="colour-' + i
                    + '" class="swatch g' + i + '"></td></tr>'
            );

            function set_generation_colour(generation, colour) {
                $('#g' + generation).html('.g' + generation
                                          + ' {background-color: ' + colour + '}')
            }

            function bind_selector_to_generation(generation) {
                $.farbtastic('#colour-picker').linkTo(
                    function(colour) {set_generation_colour(generation, colour)}
                );

                $.farbtastic('#colour-picker').setColor(
                    rgb_to_hex($('.g' + generation).css('background-color')));
            }

            function bind_selector_to_generation_click_handler() {
                var j = i;
                return function () {
                    bind_selector_to_generation(j);
                }
            }

            $('#colour-' + i).click(bind_selector_to_generation_click_handler());
        }

        // Set initial swatch visibility to configured number of
        // generations to colour.
        set_swatch_visibility();

        $('#colour-picker').farbtastic();
        bind_selector_to_generation(1);

        $('#no-of-colours-slider').slider({
            value: track_n_generations,
            min: 1,
            max: max_generations,
            slide: function(event, ui) {
                track_n_generations = ui.value;
                // TODO: full redraw required
                /* Show colour pickers */
                set_swatch_visibility();

            }
        });

        function set_swatch_visibility() {
            for (var i = 1; i <= track_n_generations; ++i) {
                $('#colour-and-label-' + i).css('visibility', 'visible');
            }
            for (var i = track_n_generations + 1; i <= max_generations; ++i) {
                $('#colour-and-label-' + i).css('visibility', 'hidden');
            }
        }

        $('#wraparound-p').click(function () {
            if (this.checked) {
                wraparound = true;
            } else {
                wraparound = false;
            }
        }).get(0).checked = wraparound;
    };

    this.refreshGrid = function () {
        alert("View is an abstract class."
              + "You have called a method that must be overridden.");
    };

    this.refresh = function () {
        this.refreshGrid();
        // Possibly other things to go here
    };
}

TableView.prototype = new View();
TableView.prototype.constructor = TableView;
function TableView (grid) {
    this.d_grid       = grid;

    this.display = function () {
        TableView.prototype.display();
        var table = make_table('1', grid);
        $("#grid").append(table);
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

    this.refreshGrid = function () {
        var table = document.getElementById("1");
        var grid_tbody = table.getElementsByTagName("tbody")[0];

        for (var x = 0; x < this.d_grid.numColumns; x++) {
            for (var y = 0; y < this.d_grid.numRows; y++) {
//                if ((this.d_grid[x][y]) != (this.d_prev_grid[x][y])) {
                    if (this.d_grid[x][y]) {
                        grid_tbody.childNodes[y].childNodes[x]
                            .className = "live " + "g" + this.d_grid[x][y];
                    } else {
                        grid_tbody.childNodes[y].childNodes[x]
                            .className = "dead";
                    }
//                }
            }
        }
    }

    this.refreshCell = function (x, y) {
        var table      = document.getElementById("1");
        var grid_tbody = table.getElementsByTagName("tbody")[0];

        if (this.d_grid[x][y]) {
            grid_tbody.childNodes[y].childNodes[x]
                .className = "live " + "g" + this.d_grid[x][y];
        } else {
            grid_tbody.childNodes[y].childNodes[x]
                .className = "dead";
        }
    }
}


/* ************************* Model *********************** */

/* Grid Class */
Grid.prototype = new Array(); // Inherit from Array
Grid.prototype.constructor = Grid; // Set the "class" back to Grid

Grid.prototype.copy = function () {
    var n = new Grid(this.numColumns, this.numRows);
    for (x = 0; x < this.numColumns; ++x) {
        for (y = 0; y < this.numRows; ++y) {
            n[x][y] = this[x][y];
        }
    }
    return n;
}

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

function Model() {
    this.d_grid       = new Grid(numRows, numColumns);
    this.d_generation = 0;

    this.grid = function () {
        return this.d_grid;
    }

    this.generation = function () {
        return this.d_generation;
    }

    this.cell = function (x, y, generation) {
        if (!(x >= 0 &&
              y >= 0)) {
            throw new Error("Model.point: must specify x and y coords");
        }

        if (typeof generation !== 'undefined') {
            this.d_grid[x][y] = generation;
        }
        return this.d_grid[x][y] || 0;
    }

    this.reset = function () {
        this.d_grid       = new Grid(numRows, numColumns);
        this.d_generation = 0;
    }

    this.tick = function () {
        this.d_grid = nextGeneration(this.d_grid);
        ++this.d_generation;
    }
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

    /* Return the number of living cells that surround the given point
     */
    function area_sum(grid, point_x, point_y) {
        var sum = 0;
        var row;
        var column;

        // The three cells in the rows above and below the given cell
        for (row = point_y - 1; row <= point_y + 1; row = row + 2) {
            for (column = point_x - 1; column <= (point_x + 1); column++) {
                var nrow    = row;
                var ncolumn = column;

                if (wraparound) {
                    if (row < 0) {
                        nrow = grid.numRows - 1;
                    }
                    else if (row == grid.numRows) {
                        nrow = 0;
                    }

                    if (column < 0) {
                        ncolumn = grid.numColumns - 1;
                    }
                    else if (column == grid.numColumns) {
                        ncolumn = 0;
                    }
                } else {
                    if( row < 0        || column < 0 ||
                        row == grid.numRows || column == grid.numColumns) {
                        // Off the edge
                        continue;
                    }
                }

                if (grid[ncolumn][nrow]) {
                    ++sum;
                }
            }
        }

        // The two cells to either side of the given cell
        row = point_y;
        for (column = point_x - 1; column <= (point_x + 1); column += 2) {
            var ncolumn = column;
            if (wraparound) {
                if (ncolumn < 0) {
                    ncolumn = grid.numColumns - 1;
                } else if (ncolumn == grid.numColumns) {
                    ncolumn = 0;
                }
            } else {
                if (column < 0 || column == grid.numColumns) {
                    continue;
                }
            }

            if (grid[ncolumn][row]) {
                ++sum;
            }
        }
        return sum;
    }


    /* Takes a Grid.
     * Returns a Grid for the next generation of the supplied Grid.
     */
    function nextGeneration(grid) {
        var ng = new Grid(grid.numColumns, grid.numRows);

        for (var y = 0; y < grid.numRows; y++) {
            for (var x = 0; x < grid.numColumns; x++) {
                var sum = area_sum(grid, x, y);

                var prev = grid[x][y] || 0;
                if (live_p(prev, sum)) {
                    // Add one to the survival time but stop at a max
                    // limit to avoid rollover.
                    ng[x][y] = prev < track_n_generations ? prev + 1 : prev;
                }
            }
        }
        return ng;
    }





/* ****************   AUXILLIARY FUNCTIONS ************** */

function run_qunit_tests() {
    $("head").append('<link rel="stylesheet" type="text/css" href="test/qunit.css"></style>');
    $("body").prepend(
        '<div><h1 id="qunit-header">QUnit</h1>'
            +'<h2 id="qunit-banner"></h2>'
            + '<h2 id="qunit-userAgent"></h2>'
            + '<ol id="qunit-tests"></ol></div><br><br><br>'
    );
    // I wanted to add the test script here too but it wasn't working.
    // Taking too long to debug so will add it manually as required.
}

/* Convert string of form "rgb(r, g, b)", as returned by css methods,
to #xxxxxx formx */
function rgb_to_hex(string) {
    var regex = /^rgb\((\d{0,3}), (\d{0,3}), (\d{0,3})\)$/;
    var caps  = regex.exec(string);
    if (!caps || caps.length != 4) {
        throw new Error("rgb_to_hex: string did not match expected pattern");
    }

    var hex = "#";
    for (var i = 1; i < 4; ++i) {
        var s = Number(caps[i]).toString(16);
        if (s.length == 1) {
            s = '0' + s;
        }
        hex += s;
    }
    return hex;
}

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
