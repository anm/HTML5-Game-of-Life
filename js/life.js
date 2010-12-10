var numRows = 25;
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

window.onload = load;

var grid      = new Grid(numColumns, numRows);
var prev_grid = new Grid(numColumns, numRows);
var period    = 100;
var clock     = new Clock(tick, period);
var default_period = 200;
var cell_size = 20; //px
var track_n_generations = 3; // Must be > 0.
var max_generations = 10;
var wraparound = false;

function load() {
    make_ui();
//    run_qunit_tests();
}

function reset() {
    clock.stop();
    $('#status').html("Stopped");
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

function make_ui() {
    $("#tick").click(this.tick);
    $("#start").click(function() { clock.start();
                                   $('#status').html('Running')});
    $("#stop").click(function() { clock.stop();
                                  $('#status').html('Stopped');});

    $("#reset").click(this.reset);

    $("#speed").text(default_period);

    $(function() {
        $( "#speed-slider" ).slider({
            range: "min", // Coloured bar from min or max to pointer
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

    /* Colours */
    for (var i = 1; i <= max_generations; ++i) {
        $('head').append('<style id="g' + i + '" type="text/css"></style>')

        $('#colour-pickers table').append(
            '<tr id="colour-and-label-' + i + '"><td>G' + i + '</td><td id="colour-' + i
                + '" class="swatch g' + i + '"></td></tr>'
        );

        set_swatch_visibility();


        function set_generation_colour(generation, colour) {
            $('#g' + generation).html('.g' + generation + ' {background-color: ' + colour + '}')
        }

        function bind_selector_to_generation(generation) {
            $.farbtastic('#colour-picker').linkTo(
                function(colour) {set_generation_colour(generation, colour)}
            );
            $.farbtastic('#colour-picker').setColor(
                rgb_to_hex($('.g' + generation).css('background-color')));
        }


        function make_click_handler() {
            var j = i;
            return function () {
                bind_selector_to_generation(j);
            }
        }

//        $(bleh).css('background-color'); // == rgb(...)
        var click_handler = make_click_handler();

        $('#colour-' + i).click(click_handler);      
    }

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
}

function show_generation() {
    $('#generation').text(generation);
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
