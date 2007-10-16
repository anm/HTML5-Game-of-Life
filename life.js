var numRows = 30;
var numColumns = 30;

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

    var display = make_table('1', numRows, numColumns);
    if (display == null) { alert("Error: Could not make table"); }
    var working = make_table('2', numRows, numColumns);		
    working.style.display = "none"; // Does not display the table. It does not use any space in the browser window - contrast visibility which uses space

    var tick_curry = curry(tick, display, working);

    clock = new Clock(tick_curry, 500);
    
    var stopped = document.createTextNode("Stopped");
    stopped.id = "stopped";
    var running = document.createTextNode("Running");
    running.id = "Running"

    body.appendChild(stopped);
    
    start.onclick = function() { clock.start(); body.removeChild(stopped); body.appendChild(running); };
    stop.onclick  = function() { clock.stop(); body.removeChild(running); body.appendChild(stopped);  };
    button.onclick = tick_curry;
}

function tick(grid, temp) {
    // Calculate the next generation and create updated grid table

    var temp_tbody = temp.getElementsByTagName("tbody")[0];
    var grid_tbody = grid.getElementsByTagName("tbody")[0];
    var y, x;
    for (y=1; y< numRows -1; y++) {
	for (x=1; x < numColumns -1; x++) {
	    var sum = area_sum(grid, x, y);
	    if (sum < 2 || sum > 4) { // Die of lonelyness or overcrowding
		temp_tbody.childNodes[y].childNodes[x].style.backgroundColor = "#fff";
	    } else { // Stay alive / be born
		temp_tbody.childNodes[y].childNodes[x].style.backgroundColor = "#000";
	    }
	}
    }
    // Copy temp to grid
    
    for(y=0; y<numRows; y++) {
	for(x=0; x<numColumns; x++) {
	    if (grid_tbody.childNodes[y].childNodes[x].style.backgroundColor == "rgb(0, f, 0)" ){ grid_tbody.childNodes[y].childNodes[x].style.backgroundColor = "#000"; }
            if (grid_tbody.childNodes[y].childNodes[x].style.backgroundColor != temp_tbody.childNodes[y].childNodes[x].style.backgroundColor.toString()) {
                if (temp_tbody.childNodes[y].childNodes[x].style.backgroundColor.toString() == "rgb(0, 0, 0)") {
		    grid_tbody.childNodes[y].childNodes[x].style.backgroundColor = "#00ff00";
		} else
		{ grid_tbody.childNodes[y].childNodes[x].style.backgroundColor = rgb(0,0,0); }
            }
	}
    }
}


function area_sum(grid, point_x, point_y) {
  //  alert("Called area sum on:" + point_x + ", " + point_y );
    // Return the sum of black (alive) cells that surround the given point

    var table_body = grid.getElementsByTagName("tbody")[0];
    var sum = 0;
    var row;
    var column;

    //alert( table_body );
    for (row = (point_y -1); row <= point_y + 1; row = row + 2) {
	for (column = (point_x -1); column <= (point_x + 1); column++) {
	    if( row < 0 || column < 0 || row == numRows || column == numColumns) {
		alert(row + " " +  column);
	    }
	    var cell = table_body.childNodes[row].childNodes[column];

//	    alert( typeof cell);


	    sum += (cell.style.backgroundColor.toString() == "rgb(0, 0, 0)" || (cell.style.backgroundColor.toString() == "rgb(0, f, 0)") ) ? 1 : 0;
	}
    }
    
//    alert("done first part");
    row = point_y;
    for (column = (point_x -1); column <= (point_x +1); column += 2) {
	var cell = table_body.childNodes[row].childNodes[column];
	sum += (cell.style.backgroundColor.toString() == "rgb(0, 0, 0)" || (cell.style.backgroundColor.toString() == "rgb(0, f, 0)") ) ? 1 : 0;
    }
    return sum;
}


function make_table(id, numRows, numColumns) {
    var body = document.getElementsByTagName("body")[0];
    
    // Build the tables
    var tbl     = document.createElement("table");
    var tblBody = document.createElement("tbody");
    
    for (i = 0; i < numRows; i++) {
	var row = document.createElement("tr");
	for (j = 0; j < numColumns; ++j) {
	    var cell = document.createElement("td");
	    cell.style.backgroundColor = "#fff";
	    cell.onclick = toggle_cell;
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

function toggle_cell() {
	cell = this;
	if (cell.style.backgroundColor.toString() == "rgb(255, 255, 255)") {
		cell.style.backgroundColor = "#000";
	} else {
		cell.style.backgroundColor = "#fff";
	}
}
