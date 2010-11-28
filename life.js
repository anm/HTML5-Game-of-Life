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

window.onload = load;

function load() {
    make_ui();
}

function reset() {
    clock.stop();
    generation = 0;
    show_generation();
    grid = new Grid(numColumns, numRows);
    display(grid);
    prev_grid = new Grid(numColumns, numRows);
}

function make_ui() {
    var body = document.getElementsByTagName("body")[0];        
    body.innerHTML = '';
    
    var tick = document.createElement('button');      
    tick.appendChild(document.createTextNode('Tick'));
    body.appendChild(tick);
    tick.onclick = this.tick;

    var start = document.createElement('button');       
    start.appendChild(document.createTextNode('Start'));
    body.appendChild(start);

    var stop = document.createElement('button');        
    stop.appendChild(document.createTextNode('Stop'));
    body.appendChild(stop);

    var reset = document.createElement('button');
    reset.appendChild(document.createTextNode('Reset'));
    reset.onclick = this.reset;
    body.appendChild(reset);

    var gen_text = document.createElement('div');
    gen_text.id = 'generationLabel';
    gen_text.appendChild(document.createTextNode('Generation: '));
    var gen = document.createElement('span');
    gen_text.appendChild(gen);
    gen.id = 'generation';
    body.appendChild(gen_text);
    show_generation();

    var grid_div = document.createElement('div');
    grid_div.id = 'grid';
    body.appendChild(grid_div);

    var table = make_table('1', grid);
    grid_div.appendChild(table);
    
    var status = document.createElement('div');
    status.id = 'status';
    status.innerHTML = 'Stopped';
    body.appendChild(status);
    
    start.onclick = function() { clock.start();
                                 status.innerHTML = 'Running';}

    stop.onclick  = function() { clock.stop();
                                 status.innerHTML = 'Stopped';}
}

function show_generation() {
    document.getElementById('generation').innerHTML = generation;
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
                ng[x][y] = prev < 10 ? prev + 1 : prev;
            } else {
                ng[x][y] = 0;
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
    tbl.setAttribute("cellpadding", "5px");
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
