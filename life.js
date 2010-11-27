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

function Clock(func, period) {
    // Constructor for Clock "Class"

    // Private
    this.timer = "";
    this.func = func;

    // Public
    this.period = period;

    this.start = Clock_start;
    this.stop = Clock_stop;
}

function Clock_start() {
    var job = this.func; // This is required to get around namespace problem.
                         // If didn't do this then this.method actually referes to window.method, or at least some object that we don't want - I think window.

    if (this.timer == "") {
	this.timer = setInterval(job, this.period);
//	alert("Clock started. Period: " + this.period);
    }
    else {
	// Timer has been started already
	// alert( "Timer already started");
    }
}

function Clock_stop() {
    if (this.timer != "") {
	clearTimeout(this.timer);
	this.timer = "";
	//    alert("Clock stopped");    
    }
}

Grid.prototype = new Array(); // Inherit from Array
Grid.prototype.constructor = Grid; // Set the "class" back to Grid

// The constructor
function Grid(numRows, numColumns) {
    this.numRows    = numRows;
    this.numColumns = numColumns;

    this.length = numColumns;
    for (var x = 0; x < numColumns; ++x) {
        this[x] = new Array(numRows);
    }
}

var grid = new Grid(numRows, numColumns);

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
    
//    var speed = document.createElement('text');

    var display = make_table('1', grid);
    var tick_curry = curry(tick, grid);

    clock = new Clock("grid = tick(grid)", 500);
    
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

    button.onclick = "grid = tick(grid)";
}

/* Takes a Grid.
 * Returns a Grid for the next generation of the supplied Grid.
 */
function nextGeneration(grid) {
    var ng = new Grid(grid.numRows, grid.numColumns);

    for (var y = 1; y < grid.numRows - 1; y++) {
	for (var x = 1; x < grid.numColumns - 1; x++) {
	    var sum = area_sum(grid, x, y);
	    if (sum < 2 || sum > 4) { // Die of lonelyness or overcrowding
		ng[x][y] = 0;
	    } else { // Stay alive / be born

                // Add one to the survival time but stop at a max
                // limit to avoid rollover.
                var prev = grid[x][y];
		ng[x][y] = prev < 10 ? prev + 1 : prev;
	    }
        }
    }
    
    return ng;
}

function display(grid) {
    var table = document.getElementById("1");
    var grid_tbody = table.getElementsByTagName("tbody")[0];

    for (var y = 0; y < grid.numRows; y++) {
	for (var x = 0; x < grid.numColumns; x++) {
            if (grid[x][y]) {
                grid_tbody.childNodes[y].childNodes[x]
                    .style.backgroundColor = '#000';
            } else {
                grid_tbody.childNodes[y].childNodes[x]
                    .style.backgroundColor = '#fff';
            }
        }
    }
}

/* Compute and display the next generation of grid. */
function tick(grid) {
    grid = nextGeneration(grid);
    display(grid);
    return grid;
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
                row == numRows || column == numColumns) {
                // Off the edge
		alert(row + " " +  column);
	    }

            if (grid[row][column]) {
                ++sum;
            }
        }
    }
        
    // The two cells to either side of the given cell
    row = point_y;
    for (column = point_x - 1; column <= (point_x + 1); column += 2) {
        if (grid[row][column]) { 
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
	    cell.style.backgroundColor = "#fff";
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
