/* Using module pattern. Everything is contained within this
 * variable. */
var life = function () {

    var config = {
        width               : 25,
        height              : 30,
        period              : 200,
        cell_size           : 20, //px
        track_n_generations : 3, // Must be > 0.
        max_generations     : 10,
        wraparound          : false
    };

    /* Global State */
    var clock;
    var model;
    var view;


    /* *********************** Controller ******************* */

    function load() {
        clock = new Clock(tick, config.period);
        model = new Model();
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
        };

        /* get / set and display */
        this.generation = function (gen) {
            if (typeof gen !== 'undefined') {
                this.d_generation = gen;
                $('#generation').text(this.d_generation);
            }
            return this.d_generation;
        };

        /* get / set and display */
        this.status = function (status) {
            if (typeof status !== 'undefined') {
                this.d_status = status;
                $('#status').html(this.d_status);
            }
            return this.d_status;
        };

        /* Build the UI */
        this.display = function () {
            $("#tick").click(life.tick);
            $("#start").click(life.start);
            $("#stop").click(life.stop);
            $("#reset").click(life.reset);

            $("#speed").text(config.period);
            $("#status").html(this.d_status);
            $('#generation').text(this.d_generation);

            $(function() {
                  $("#speed-slider").slider(
                      {
                          range: "min", // Coloured bar from
                          // min or max to
                          // pointer
                          value: config.period,
                          min: 10,
                          max: 1000,
                          slide: function (event, ui) {
                              $("#speed").text(ui.value);
                              clock.setPeriod(ui.value);
                          }
                      });
              });

            $("#panels").accordion();

            /**** Colours ****/

            function set_generation_colour(generation, colour) {
                $('#g' + generation).html('.g' + generation
                                          + ' {background-color: ' + colour + '}');
            }

            function bind_selector_to_generation(generation) {
                $.farbtastic('#colour-picker').linkTo(
                    function (colour) {set_generation_colour(generation, colour);}
                );

                $.farbtastic('#colour-picker').setColor(
                    rgb_to_hex($('.g' + generation).css('background-color')));
            }

            for (var i = 1; i <= config.max_generations; ++i) {
                // Create style tag for custom colour
                $('head').append('<style id="g' + i + '" type="text/css"></style>');

                // Create swatches
                $('#colour-pickers table').append(
                    '<tr id="colour-and-label-' + i + '"><td>G' + i + '</td><td id="colour-' + i
                        + '" class="swatch g' + i + '"></td></tr>'
                );

                $('#colour-' + i).click(curry(bind_selector_to_generation, i));
            }

            $('#colour-picker').farbtastic();
            bind_selector_to_generation(1);

            function set_swatch_visibility() {
                for (var i = 1; i <= config.track_n_generations; ++i) {
                    $('#colour-and-label-' + i).css('visibility', 'visible');
                }
                for (var i = config.track_n_generations + 1; i <= config.max_generations; ++i) {
                    $('#colour-and-label-' + i).css('visibility', 'hidden');
                }
            }

            // Set initial swatch visibility to configured number of
            // generations to colour.
            set_swatch_visibility();

            $('#no-of-colours-slider').slider({
                                                  value: config.track_n_generations,
                                                  min: 1,
                                                  max: config.max_generations,
                                                  slide: function(event, ui) {
                                                      config.track_n_generations = ui.value;
                                                      // TODO: full redraw required
                                                      /* Show colour pickers */
                                                      set_swatch_visibility();

                                                  }
                                              });


            $('#wraparound-p').click(function () {
                                         if (this.checked) {
                                             config.wraparound = true;
                                         } else {
                                             config.wraparound = false;
                                         }
                                     }).get(0).checked = config.wraparound;
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

        // A cache of the currently displayed grid
        // Used to optimise drawing by only drawing what has changed
        this.displayed_grid;

        this.display = function () {
            TableView.prototype.display();
            var table = make_table('1', grid);
            $("#grid").append(table);
            this.displayed_grid = grid.copy();
        };

        function make_table(id, grid) {
            // Build the table
            var tbl     = document.createElement("table");
            var tblBody = document.createElement("tbody");

            for (var y = 0; y < grid.height; y++) {
                var row = document.createElement("tr");
                for (var x = 0; x < grid.width; ++x) {
                    var cell = document.createElement("td");

                    if (grid[x][y]) {
                        cell.className = "live " + "g" + grid[x][y];
                    } else {
                        cell.className = "dead";
                    }

                    (function () {var my_x = x;
                                  var my_y = y;

                                  cell.onclick = function(){
                                      toggle_cell(my_x,my_y);
                                  };})();

                    row.appendChild(cell);
                }
                tblBody.appendChild(row);
            }
            tbl.appendChild(tblBody);

            tbl.setAttribute("border", "2");
            tbl.setAttribute("rules", "all");
            tbl.setAttribute("cellpadding", config.cell_size / 2 + "px");
            tbl.setAttribute("id", id);

            return tbl;
        }

        this.refreshGrid = function () {
            var table = document.getElementById("1");
            var grid_tbody = table.getElementsByTagName("tbody")[0];

            if (this.d_grid.size() != this.displayed_grid.size()) {
                // Grid size has changed. Redraw table.
                table.parent.replaceChild(make_table('1', this.d_grid), table);
                this.diplayed_grid = grid.copy();
            }
            else {
                // Grid size the same. Do an incremental update.
                for (var x = 0; x < this.d_grid.width; x++) {
                    for (var y = 0; y < this.d_grid.height; y++) {

                        // If there is a difference from current display, update
                        if ((this.d_grid[x][y]) != (this.displayed_grid[x][y])) {
                            // Update displayed_grid cache.
                            this.displayed_grid[x][y] = this.d_grid[x][y];
                            if (this.d_grid[x][y]) {
                                grid_tbody.childNodes[y].childNodes[x]
                                    .className = "live " + "g" + this.d_grid[x][y];
                            } else {
                                grid_tbody.childNodes[y].childNodes[x]
                                    .className = "dead";
                            }
                        }
                    }
                }
            }
        };

        this.refreshCell = function (x, y) {
            var table      = document.getElementById("1");
            var grid_tbody = table.getElementsByTagName("tbody")[0];

            // Update display cache
            this.displayed_grid[x][y] = this.d_grid[x][y];

            if (this.d_grid[x][y]) {
                grid_tbody.childNodes[y].childNodes[x]
                    .className = "live " + "g" + this.d_grid[x][y];
            } else {
                grid_tbody.childNodes[y].childNodes[x]
                    .className = "dead";
            }
        };
    }


    /* ************************* Model *********************** */

    /* Grid Class */
    Grid.prototype = new Array(); // Inherit from Array
    Grid.prototype.constructor = Grid; // Set the "class" back to Grid

    Grid.prototype.copy = function () {
        var n = new Grid(this.width, this.height);
        for (x = 0; x < this.width; ++x) {
            for (y = 0; y < this.height; ++y) {
                n[x][y] = this[x][y];
            }
        }
        return n;
    };

    Grid.prototype.size = function () {
        return "(" + this.width + ", " + this.height + ")";
    };

    // The constructor
    function Grid(width, height) {
        if (isNaN(Number(width)) ||
            isNaN(Number(height))) {
            throw new Error(
                "Grid constructor requires two numerical dimensions");
        }

        this.width  = width;
        this.height = height;

        this.length = width;
        for (var x = 0; x < width; ++x) {
            this[x] = new Array(height);
        }
    }

    function Model() {
        var that = this;
        function init() {
            that.d_grid       = new Grid(config.height, config.width);
            that.d_generation = 0;
        }

        init();

        this.grid = function () {
            return this.d_grid;
        };

        this.generation = function () {
            return this.d_generation;
        };

        this.cell = function (x, y, generation) {
            if (!(x >= 0 &&
                  y >= 0)) {
                throw new Error("Model.point: must specify x and y coords");
            }

            if (typeof generation !== 'undefined') {
                this.d_grid[x][y] = generation;
            }
            return this.d_grid[x][y] || 0;
        };

        this.reset = function () {
            init();
        };

        this.tick = function () {
            this.d_grid = nextGeneration(this.d_grid);
            ++this.d_generation;
        };
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

                if (config.wraparound) {
                    if (row < 0) {
                        nrow = grid.height - 1;
                    }
                    else if (row == grid.height) {
                        nrow = 0;
                    }

                    if (column < 0) {
                        ncolumn = grid.width - 1;
                    }
                    else if (column == grid.width) {
                        ncolumn = 0;
                    }
                } else {
                    if( row < 0        || column < 0 ||
                        row == grid.height || column == grid.width) {
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
            if (config.wraparound) {
                if (ncolumn < 0) {
                    ncolumn = grid.width - 1;
                } else if (ncolumn == grid.width) {
                    ncolumn = 0;
                }
            } else {
                if (column < 0 || column == grid.width) {
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
        var ng = new Grid(grid.width, grid.height);

        for (var y = 0; y < grid.height; y++) {
            for (var x = 0; x < grid.width; x++) {
                var sum = area_sum(grid, x, y);

                var prev = grid[x][y] || 0;
                if (live_p(prev, sum)) {
                    // Add one to the survival time but stop at a max
                    // limit to avoid rollover.
                    ng[x][y] = prev < config.track_n_generations ? prev + 1 : prev;
                }
            }
        }
        return ng;
    }





    /* ****************   AUXILLIARY FUNCTIONS ************** */

    function run_qunit_tests() {
        $("head").append('<link rel="stylesheet" type="text/css"'
                         + ' href="test/qunit.css"></style>');
        $("body").prepend(
            '<div><h1 id="qunit-header">QUnit</h1>'
                +'<h2 id="qunit-banner"></h2>'
                + '<h2 id="qunit-userAgent"></h2>'
                + '<ol id="qunit-tests"></ol></div><br><br><br>'
        );
        // I wanted to add the test script here too but it wasn't
        // working. Taking too long to debug so will add it manually
        // as required.
    }

    /* Convert string of form "rgb(r, g, b)", as returned by css methods,
     to #xxxxxx formx */
    function rgb_to_hex(string) {
        var regex = /^rgb\((\d{0,3}), (\d{0,3}), (\d{0,3})\)$/;
        var caps  = regex.exec(string);
        if (!caps || caps.length != 4) {
            throw new Error(
                "rgb_to_hex: string did not match expected pattern");
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

    /* method, arg1, arg2 ... */
    function curry(method) {
        if (! (method instanceof Function)) {
            throw new Error("curry: first argument must be a Function");
        }

        // Copy this functions arguments, excluding the first (the
        // method) to curried, the list of arguments to curry.
        var curried = Array.prototype.slice.call(arguments, 1);

        return function() {
            // The full argument list for the function will be built in args.
            var args = curried.slice(0); // Start with all the curried args.

            // Add the call time arguments
            args = args.concat(arguments);

            // .apply(this, args array)
            return method.apply(this, args);
        };
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
        };

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

    /* Public methods / properties */
    return {
        load: load,
        reset: reset,
        tick: tick,
        start: start,
        stop: stop,
        toggle_cell: toggle_cell
    };
}();

window.onload = life.load;
