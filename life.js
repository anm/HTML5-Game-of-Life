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

Grid.prototype = new Array(); // Inherit from Array
Grid.prototype.constructor = Grid; // Set the "class" back to Grid

// The constructor
function Grid(numColumns, numRows) {
    this.numColumns = numColumns;
    this.numRows    = numRows;

    this.length = numColumns;
    for (var x = 0; x < numColumns; ++x) {
        this[x] = new Array(numRows);
    }
}

var grid = new Grid(numColumns, numRows);

function init() {
    var body = document.getElementsByTagName("body")[0];	
    
    var button = document.createElement('button');	
    var label = document.createTextNode('Tick');
    button.appendChild(label);
    body.appendChild(button);

    var start = document.createElement('button');	
    start.appendChild(document.createTextNode('Start'));
    body.appendChild(start);

    var stop = document.createElement('button');	
    stop.appendChild(document.createTextNode('Stop'));
    body.appendChild(stop);

    var gen_text = document.createElement('div');
    gen_text.id = 'generationLabel';
    gen_text.appendChild(document.createTextNode('Generation: '));
    var gen = document.createElement('span');
    gen_text.appendChild(gen);
    gen.id = 'generation';
    body.appendChild(gen_text);

//    var speed = document.createElement('text');

    var display = make_table('1', grid);
    var tick_curry = curry(tick, grid);

    clock = new Clock(tick, 500);
    
    var stopped = document.createTextNode("Stopped");
    stopped.id = "stopped";
    var running = document.createTextNode("Running");
    running.id = "Running"

    body.appendChild(stopped);
    
    start.onclick = function() { clock.start();
                                 body.removeChild(stopped);
                                 body.appendChild(running); };

    stop.onclick  = function() { clock.stop();
                                 body.removeChild(running);
                                 body.appendChild(stopped);  };

    button.onclick = tick;
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

/* Compute and display the next generation of grid. */
function tick() {
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
    var body = document.getElementsByTagName("body")[0];
    
    // Build the tables
    var tbl     = document.createElement("table");
    var tblBody = document.createElement("tbody");
    
    for (var y = 0; y < grid.numRows; y++) {
	var row = document.createElement("tr");
	for (var x = 0; x < grid.numColumns; ++x) {
	    var cell = document.createElement("td");
	    cell.className = "dead";
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
    body.appendChild(tbl);
    
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
    display(grid);
}
