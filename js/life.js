/* Using module pattern. Everything is contained within this
 * variable. */
var life = function () {

    var log = log4javascript.getLogger();
    log.addAppender(new log4javascript.BrowserConsoleAppender());

    var config = {
        width               : 25,
        height              : 30,
        minAutoWidth        : 3,
        minAutoHeight       : 3,
        maxWidth            : 50,
        maxHeight           : 50,
        period              : 200,
        cell_size           : 20, //px
        max_cell_size       : 50,
        track_n_generations : 3, // Must be > 0.
        max_generations     : 10,
        wraparound          : true,

        g_colour            : ['#000', // dead
                               '#8A9B0F', // g1
                               '#F8CA00',
                               '#E97F02',
                               '#BD1550',
                               '#490A3D',
                               '#0f0',
                               '#ff0',
                               '#f00',
                               '#0ff',
                               '#00f' // g10
                              ],
        border_colour      : '#444',
        border_width       : 1
    };

    /* Global State */
    var clock;
    var model;
    var view;

    // State for drawing functions
    var drawing = {};

    /* *********************** Controller ******************* */

    function haveLocalStorage() {
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    }

    function load() {
        clock = new Clock(tick, config.period);

        if (haveLocalStorage()) {
            var model_string = localStorage.getItem("model");
            if (model_string !== null) {
                model = Model.deSerialize(model_string);
            } else {
                model = new Model();
            }

            var config_string = localStorage.getItem("config");
            if (config_string !== null) {
                config = JSON.parse(config_string);
            }
        } else {
            model = new Model();
        }

        if (document.createElement('canvas').getContext) {
            view  = new CanvasView(model.grid());
        } else {
            view  = new TableView(model.grid());
        }

        view.display();

//        run_qunit_tests();
    }

    function saveState() {
        localStorage.setItem("model", Model.serialize(model));
        localStorage.setItem("config", JSON.stringify(config));
    }

    if (haveLocalStorage()) {
        window.addEventListener('unload', saveState, false);
    }

    function reset() {
        clock.stop();
        model.reset();
        view.status("Stopped");
        view.generation(model.generation());
        view.grid(model.grid());
        view.refreshGrid();
    }

    /* Compute and display the next generation of grid. */
    function tick() {
        model.tick();

        view.generation(model.generation());
        view.grid(model.grid());
        view.refreshGrid();
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

    function setGridWidth(x) {
        model.setWidth(x);
        view.grid(model.grid());
        view.refreshGrid();
    }

    function setGridHeight(y) {
        model.setHeight(y);
        view.grid(model.grid());
        view.refreshGrid();
    }

    function setCellSize (px) {
        view.setCellSize(px);
    }

    /* generation 0 means dead cells. */
    function setGenerationColour (generation, colour) {
        config.g_colour[generation] = colour;
        view.updateColours();
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

        /* Make cells slightly bigger on iPad because touch interface
         * is less precise than cursor. Not doing it on iPod or other
         * mobiles because their screens are so small that bigger
         * cells would make grid too much smaller I think.
         *
         * The logic should really be: if touchscreen and resolution greater
         * than e. but I don't think it's possible to generically test for
         * touch screen.
         */
        if (/iPad/.test(navigator.userAgent)) {
            log.debug("On iPad");
            config.cell_size += 2;
        }

        function Cell(x, y) {
            this.x = x;
            this.y = y;
        }
        Cell.prototype.toString = function () {return '(' + this.x + ',' + this.y + ')';};

        /* Returns the cell index as an object with fields x and y.
         * Returns null if the position is outside the grid.
         * toString returns (x,y)
         */
        function getCellAtEventPosition (event) {
            // Get click position relative to top left of the
            // element clicked on (the grid)
            var grid = $('#grid');
            var px = (event.pageX - grid.offset().left);
            var py = (event.pageY - grid.offset().top);

            var cellOffset = config.cell_size + config.border_width;

            // Determine which cell this is in
            var x = Math.floor(px / cellOffset);
            var y = Math.floor(py / cellOffset);

            // Check for outside grid
            if ((x < 0) || (y < 0) ||
                (x >= config.width) || (y >= config.height)) {
                return null;
            }

            return new Cell(x, y);
        }

        /* Drawing Functions */
        function gridMouseDown (event) {
            var cell = getCellAtEventPosition(event);

            if (cell === null) {
                // In the grid container div but not in the grid
                // Do nothing
                return true;
            }
            // Start Drawing

            // Bind to document to capture moving outside the grid
            $(document).bind('mousemove', gridMouseMove);

            life.drawing.incell = cell;

            if (model.cell(cell.x, cell.y)) {
                life.drawing.drawmode = 0;
            } else {
                life.drawing.drawmode = 1;
            }

            toggle_cell(cell.x, cell.y);

            // Prevent browser trying to select stuff
            return false;
        }

        function gridMouseUp (event) {
            $(document).unbind('mousemove');
        }

        function gridMouseMove (event) {
            var cell = getCellAtEventPosition(event);

            // If moved outside grid, stop drawing
            if (cell === null) {
                gridMouseUp();
                return false;
            }

            if (cell.toString() !== life.drawing.incell.toString()) {
                // Pointer moved into another cell
                life.drawing.incell = cell;

                // Draw cell
                model.cell(cell.x, cell.y, life.drawing.drawmode);
                view.grid(model.grid());
                view.refreshCell(cell.x, cell.y);
            }
            return false;
        }

        /* Build the UI */
        this.display = function () {
            $("#tick").click(life.tick);
            $("#start").click(life.start);
            $("#stop").click(life.stop);
            $("#reset").click(life.reset);

            $("#speed-val").text(config.period + "ms");

            $('#width-display').text(config.width);
            $('#height-display').text(config.height);

            $("#status").html(this.d_status);
            $('#generation').text(this.d_generation);

            $("#speed-slider").slider(
                {
                    range: "min", // Coloured bar from
                    // min or max to
                    // pointer
                    value: config.period,
                    min: 10,
                    max: 1000,
                    slide: function (event, ui) {
                        config.period = ui.value;
                        $("#speed-val").text(ui.value + "ms");
                        clock.setPeriod(ui.value);
                    }
                });

            $("#width-slider").slider({
                                          range: "min",
                                          value: config.width,
                                          min: 1,
                                          max: config.maxWidth,
                                          slide: function (event, ui) {
                                              $("#width-display").text(ui.value);
                                              config.width = ui.value;
                                              setGridWidth(config.width);
                                          }
                                      });
            $("#height-slider").slider({
                                          range: "min",
                                          value: config.height,
                                          min: 1,
                                          max: config.maxHeight,
                                          slide: function (event, ui) {
                                              $("#height-display").text(ui.value);
                                              config.height = ui.value;
                                              setGridHeight(config.height);
                                          }
                                      });

            $("#cellSize-slider").slider({
                                          range: "min",
                                          value: config.cell_size,
                                          min: 2,
                                          max: config.max_cell_size,
                                          slide: function (event, ui) {
                                              config.cell_size = ui.value;
                                              setCellSize(config.cell_size);
                                          }
                                      });



            /* I found by experiment that I could not set the sizes of
             * components with these UI elements applied using CSS
             * because the javascript mucks around with
             * them. Therefore it seems I need to set things up in
             * here. */
            function onDialogOpen () {
                $('#panels > div, #panels').css('overflow', 'hidden');
                $('#colour-panel').css('height', '350px');
                $('.ui-dialog').css('width', '380px');
                $('.ui-accordion').css('padding', '0');
                $('.ui-dialog').css('padding', '0');
            }

            $("#panels").accordion().dialog({autoOpen: false, open: onDialogOpen});

            $("#show-settings").click(function () {
                                          if ($("#panels").dialog('isOpen')) {
                                              $("#panels").dialog('close');
                                          } else {
                                              $("#panels").dialog('open');
                                          }
                                      });

            $('#grid-div').bind('mousedown', gridMouseDown);
            $('#grid-div').bind('mouseup'  , gridMouseUp);

            /**** Colours ****/

            function set_generation_css_colour (generation, colour) {
                $('#g' + generation).html('.g' + generation
                                          + ' {background-color: ' + colour + '}');
            }

            function bind_selector_to_generation(generation) {
                $.farbtastic('#colour-picker').linkTo(
                    function (colour) {
                        set_generation_css_colour(generation, colour);
                        setGenerationColour(generation, colour);
                    });

                try {
                    $.farbtastic('#colour-picker').setColor(
                        colour_to_hex($('.g' + generation).css('background-color')));
                } catch (e) {
                    /* It's not a big deal if this doesn't work. It
                     * just means that when a swatch is selected the
                     * colour picker won't change to show the current
                     * colour. */
                    log.error("Error setting colour for generation "
                              + generation + ": " + e);
                }
            }

            var i;
            for (i = 1; i <= config.max_generations; ++i) {
                // Create style tag for custom colour
                $('head').append('<style id="g' + i + '" type="text/css"></style>');

                // Set initial colour (from config)
                set_generation_css_colour(i, config.g_colour[i]);

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
                var i;
                for (i = 1; i <= config.track_n_generations; ++i) {
                    $('#colour-and-label-' + i).css('visibility', 'visible');
                }
                for (i = config.track_n_generations + 1; i <= config.max_generations; ++i) {
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

        function autoConfigSize () {
            // Get available space
            // Divide by cell offset (size + border) for number of cells
            // Subtract one cell to give some border (and because it
            // was too big for some unknown reason)

            var left = $("#grid-div").get(0).offsetLeft;
            var top  = $("#grid-div").get(0).offsetTop;

            var width = Math.floor(($(window).width() - left) /
                                   (config.cell_size + config.border_width)) - 1;

            var height = Math.floor(($(window).height() - top) /
                                    (config.cell_size + config.border_width)) - 1;

            var minWidth  = config.minAutoWidth;
            var minHeight = config.minAutoHeight;
            var maxWidth  = config.maxWidth;
            var maxHeight = config.maxHeight;

            if (width < minWidth) {
                width = minWidth;
            } else if (width > maxWidth) {
                width = maxWidth;
            }
            config.width = width;

            if (height < minHeight) {
                height = minHeight;
            } else if (height > maxHeight) {
                height = maxHeight;
            }
            config.height = height;
        }

        autoConfigSize();

        /* For iOS.
         * Recalculate grid size when device is rotated.
         */
        window.onorientationchange = function () {
            autoConfigSize();
            setGridWidth(config.width);
            setGridHeight(config.height);
        };

        this.refreshGrid = function () {
            alert("View is an abstract class."
                  + "You have called a method that must be overridden.");
        };
    }

    TableView.prototype = new View();
    TableView.prototype.constructor = TableView;
    function TableView (grid, cellSize) {
        var self = this;
        this.d_grid       = grid;

        // this.displayed_grid is a cache of the currently displayed
        // grid. It's used to optimise drawing by only drawing what has
        // changed.

        this.cellSize = cellSize || config.cell_size || 20;

        this.display = function () {
            TableView.prototype.display();
            var table = make_table('grid', this.d_grid);

            $('head').append('<style type="text/css">#grid-div table {border-color: '
                             + config.border_colour + ';}</style>');

            $("#grid-div").append(table);
            this.displayed_grid = this.d_grid.copy();
        };

        this.setCellSize = function (px) {
            this.cellSize = px;
            $('#1').get(0).setAttribute("cellpadding", this.cellSize / 2 + "px");
        };

        this.updateColours = function () {
            // A noop, as css is already set by the selector
        };

        function make_table(id, grid) {
            // Build the table
            var tbl     = document.createElement("table");
            var tblBody = document.createElement("tbody");

            var y, row, x, cell;
            for (y = 0; y < grid.height; y++) {
                row = document.createElement("tr");
                for (x = 0; x < grid.width; ++x) {
                    cell = document.createElement("td");

                    if (grid[x][y]) {
                        cell.className = "live " + "g" + grid[x][y];
                    } else {
                        cell.className = "dead";
                    }
                    row.appendChild(cell);
                }
                tblBody.appendChild(row);
            }
            tbl.appendChild(tblBody);

            tbl.setAttribute("border", config.border_width);
            tbl.setAttribute("rules", "all");
            tbl.setAttribute("cellpadding", self.cellSize / 2 + "px");
            tbl.setAttribute("id", id);

            return tbl;
        }

        this.refreshGrid = function () {
            var table = document.getElementById("grid");
            var grid_tbody = table.getElementsByTagName("tbody")[0];

            if (this.d_grid.size() !== this.displayed_grid.size()) {
                // Grid size has changed. Redraw table.
                table.parentNode.replaceChild(make_table('grid', this.d_grid), table);
                this.displayed_grid = this.d_grid.copy();
            }
            else {
                // Grid size the same. Do an incremental update.
                var x, y;
                for (x = 0; x < this.d_grid.width; x++) {
                    for (y = 0; y < this.d_grid.height; y++) {

                        // If there is a difference from current display, update
                        if ((this.d_grid[x][y]) !== (this.displayed_grid[x][y])) {
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
            var table      = document.getElementById("grid");
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

    CanvasView.prototype = new View();
    CanvasView.prototype.constructor = CanvasView;
    function CanvasView (grid, cellSize) {
        var self = this;

        self.d_grid         = grid;

        self.cellSize = cellSize || config.cell_size || 20;

        var border_width  = config.border_width; // between cells and on edges.
        var border_colour = config.border_colour;

        function drawCell(x, y) {
            var d      = self.draw;
            var offset = self.cellSize + border_width;

            d.fillStyle = config.g_colour[self.d_grid[x][y] || 0];

            d.fillRect(border_width + x * offset,
                       border_width + y * offset,
                       self.cellSize, self.cellSize);
        }

        // Full redraw if full true, else incremental update
        function drawGrid(full) {
            // If there is a difference from current display, update

            for (x = 0; x < self.d_grid.width; ++x) {
                for (y = 0; y < self.d_grid.height; ++y) {
                    if (full || (self.d_grid[x][y]) !== (self.displayed_grid[x][y])) {
                        // Update displayed_grid cache.
                        self.displayed_grid[x][y] = self.d_grid[x][y];

                        drawCell(x, y);
                    }
                }
            }
        }

        function makeCanvas () {
            var canvas = $('<canvas id="grid">');
            self.draw = canvas.get(0).getContext('2d');
            self.canvas = canvas.get(0);
        }

        function clearCanvas () {
            self.draw.fillStyle = border_colour;
            self.draw.fillRect(0, 0, self.c_width, self.c_height);
        }

        function setCanvasSize () {
            self.c_width  = border_width + self.d_grid.width  * (self.cellSize + border_width);
            self.c_height = border_width + self.d_grid.height * (self.cellSize + border_width);
            var canvas = self.canvas;
            canvas.setAttribute("width",  self.c_width);
            canvas.setAttribute("height", self.c_height);

            // It seems that resizing the cavas clears it so need to
            // redraw the background always
            clearCanvas();
        }

        self.display = function () {
            CanvasView.prototype.display();

            makeCanvas();
            setCanvasSize();

            self.displayed_grid = grid.copy();
            drawGrid(true);

            $("#grid-div").append(self.canvas);
        };

        self.setCellSize = function (px) {
            self.cellSize = px;
            setCanvasSize();

            drawGrid(true);
        };

        self.refreshGrid = function () {
            if (self.displayed_grid.size() !== self.d_grid.size()) {
                self.displayed_grid = self.d_grid.copy();
                setCanvasSize();
                drawGrid(true);
            }
            drawGrid();
        };

        self.refreshCell = function (x, y) {
            // Update displayed_grid cache.
            self.displayed_grid[x][y] = self.d_grid[x][y];
            drawCell(x, y);
        };

        self.updateColours = function () {
            if (self.canvas) {
                drawGrid(true);
            }
        };
    }


    /* ************************* Model *********************** */

    /* Grid Class */
    Grid.prototype = []; // Inherit from Array
    Grid.prototype.constructor = Grid; // Set the "class" back to Grid

    Grid.prototype.copy = function () {
        var n = new Grid(this.width, this.height);
        var x, y;
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

    Grid.prototype.setWidth = function (x) {
        if (x < this.width) {
            // Shrink
            this.length = x; // trunkate
        }
        if (x > this.width) {
            // Grow
            var i;
            for (i = this.width; i < x; ++i) {
                this[i] = new Array(this.height);
            }
        }

        this.width = x;
    };

    Grid.prototype.setHeight = function (y) {
        if (y < this.height) {
            var i;
            for (i = 0; i < this.width; ++i) {
                this[i].length = y;
            }
        }
        this.height = y;
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
        var x;
        for (x = 0; x < width; ++x) {
            this[x] = new Array(height);
        }
    }

    /* Model Class */

    /* Check whether the non-standard __proto__ facility is available.
     * Return true if so, false otherwise.
     */
    function protoSupported() {
        function Test(){}
        Test.prototype = "aoeu";
        var test = new Test();
        if (test.__proto__ = "aoeu") {
            // Read OK
            log.debug("__proto__ read OK");
        } else {
            log.debug("__proto__ read NOT OK");
            return false;
        }

        var test2 = new Test();
        test2.__proto__ = [];
        if (test2 instanceof Array) {
            // Write OK
            log.debug("__proto__ write OK");
        } else {
            log.debug("__proto__ write NOT OK");
            return false;
        }
        return true;
    }

    /* If there is __proto__ support, reconstituting the object is
    * easy.  Otherwise the much slower and messier method of copying
    * over all properties to a new object will be used.
    */
    if (protoSupported()) {
        Model.deSerialize = function (data) {
            var m = JSON.parse(data);
            m.__proto__ = Model.prototype;
            m.d_grid.__proto__ = Grid.prototype;

            return m;
        };
    } else {
        Model.deSerialize = function (data) {
            log.debug("Model using object reconstitution fallback.");
            var d = JSON.parse(data);
            log.debug(d);
            var m = new Model();
            m.d_grid = new Grid(d.d_grid.width, d.d_grid.height);

            for (p in d.d_grid) {
                // Should preferably test and only copy needed stuff
                m.d_grid[p] = d.d_grid[p];
            }
            for (p in d) {
                if (p !== 'd_grid') {
                    m[p] = d[p];
                }
            }

            m.__proto__ = Model.prototype;
            m.d_grid.__proto__ = Grid.prototype;

            return m;
        };
    }

    Model.serialize = function (model) {
        return JSON.stringify(model);
    };

    Model.prototype.grid = function () {
        return this.d_grid;
    };

    Model.prototype.generation = function () {
        return this.d_generation;
    };

    Model.prototype.cell = function (x, y, generation) {
        if (!(x >= 0 &&
              y >= 0)) {
            throw new Error("Model.point: must specify x and y coords");
        }

        if (typeof generation !== 'undefined') {
            this.d_grid[x][y] = generation;
        }
        return this.d_grid[x][y] || 0;
    };

    Model.prototype.reset = function () {
        this.init();
    };

    Model.prototype.tick = function () {
        this.d_grid = this.nextGeneration();
        ++this.d_generation;
    };

    Model.prototype.setWidth = function (x) {
        this.d_grid.setWidth(x);
    };

    Model.prototype.setHeight = function (y) {
        this.d_grid.setHeight(y);
    };

    Model.prototype.init = function () {
        this.d_grid       = new Grid(config.width, config.height);
        this.d_generation = 0;
    };

    /* Takes a Grid.
     * Returns a Grid for the next generation of the supplied Grid.
     */

    Model.prototype.nextGeneration = function() {
        var ng = new Grid(this.d_grid.width, this.d_grid.height);

        var y, x, sum, prev;
        for (y = 0; y < ng.height; y++) {
            for (x = 0; x < ng.width; x++) {
                sum = this.area_sum(x, y);

                prev = this.d_grid[x][y] || 0;
                if (this.live_p(prev, sum)) {
                    // Add one to the survival time but stop at a max
                    // limit to avoid rollover.
                    ng[x][y] = prev < config.track_n_generations ? prev + 1 : prev;
                }
            }
        }
        return ng;
    };

    /* Take the generation number of a cell and the number of neighbours it has.
     * Return true if the cell is to live in the next generation.
     */
    Model.prototype.live_p = function (generation, count) {
        if (generation) {
            // If alive
            if (count === 2 || count === 3) {
                // Stay alive
                return true;
            }
        } else {
            if (count === 3) {
                return true;
            }
        }
        return false;
    };

    /* Return the number of living cells that surround the given point
     */
    Model.prototype.area_sum = function (point_x, point_y) {
        var sum = 0;
        var grid = this.d_grid; // for convenience
        var row, column;
        var nrow, ncolumn;

        // The three cells in the rows above and below the given cell
        for (row = point_y - 1; row <= point_y + 1; row = row + 2) {
            for (column = point_x - 1; column <= (point_x + 1); column++) {
                nrow    = row;
                ncolumn = column;

                if (config.wraparound) {
                    if (row < 0) {
                        nrow = grid.height - 1;
                    }
                    else if (row === grid.height) {
                        nrow = 0;
                    }

                    if (column < 0) {
                        ncolumn = grid.width - 1;
                    }
                    else if (column === grid.width) {
                        ncolumn = 0;
                    }
                } else {
                    if( row < 0        || column < 0 ||
                        row === grid.height || column === grid.width) {
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
            ncolumn = column;
            if (config.wraparound) {
                if (ncolumn < 0) {
                    ncolumn = grid.width - 1;
                } else if (ncolumn === grid.width) {
                    ncolumn = 0;
                }
            } else {
                if (column < 0 || column === grid.width) {
                    continue;
                }
            }

            if (grid[ncolumn][row]) {
                ++sum;
            }
        }
        return sum;
    };

    function Model() {
        this.init();
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

    /* Attempts to convert a colour in some unknown format to hex
     * format (#xxxxxx or #xxx).
     *
     * This is necessary because browsers return the calculated value
     * of a colour in various different formats. e.g. Firefox gives
     * rgb and Opera give hex. I read IE can even give colour names
     * but I'm not going to try and deal with that for the moment at
     * least. */
    function colour_to_hex(string) {
        var hex = /#(?:[0-9a-fA-F]{3}){1,2}/.exec(string);
        if (hex && hex.length === 1) {
            return hex[0];
        }

        if (/rgb\((\d{0,3}), (\d{0,3}), (\d{0,3})\)/.test(string)) {
            return rgb_to_hex(string);
        }

        throw new Error("colour_to_hex: failed to match hex or rgb. "
                        + "It's probably a named colour which I can't deal "
                        + "with. Given string: \"" + string + '"');
    }

    /* Convert string of form "rgb(r, g, b)", as returned by css methods,
     to #xxxxxx formx */
    function rgb_to_hex(string) {
        var regex = /^rgb\((\d{0,3}), (\d{0,3}), (\d{0,3})\)$/;
        var captures  = regex.exec(string);
        if (!captures || captures.length != 4) {
            throw new Error(
                "rgb_to_hex: string did not match expected pattern");
        }

        var hex = "#";
        var i, s;
        for (i = 1; i < 4; ++i) {
            s = Number(captures[i]).toString(16);
            if (s.length === 1) {
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
            if (this.timer !== null) {
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
        toggle_cell: toggle_cell,

        // For testing
        Grid: Grid,
        Model: Model,
        View: View,
        TableView: TableView,
        CanvasView: CanvasView,
        view: view,
        model: model,
        clock: clock,
        config: config,
        drawing: drawing,

        rgb_to_hex: rgb_to_hex,
        test: run_qunit_tests
    };
}();

window.onload = life.load;
