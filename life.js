var numRows = 50;
var numColums = 50;

function init() {
    
    var body = document.getElementsByTagName("body")[0];	
    alert(typeof body);
    
    var button = document.createElement("button");	
    var label = document.createTextNode('Tick');
    button.appendChild(label);	
    button.onclick = tick(display, working);
    body.appendChild(button);
    
    var display = make_table(50,50);
    if (display == null) { alert("Error: Could not make table"); }
    var working = make_table(50,50);		
    working.style.display = "none"; // Does not display the table. It does not use any space in the browser window - contrast visibility which uses space
}
/*
function tick(grid, temp) {
    grid = display; temp = working;
    for (y=1; y<=numColums -1; y++) {
	for (x=1; x < numRows -1; x++) {
	    var sum = area_sum(grid, x, y);
	    if (sum < 2 || sum > 4) { // Die of lonelyness or overcrowding 
		temp.getElementsByTagName("tbody").childNodes[y].childNodes[x].style.backgroundColor = "#fff"
	    } else { // Stay alive / be born
		temp.getElementsByTagName("tbody").childNodes[y].childNodes[x].style.backgroundColor = "#000";
	    }
	}
    }
    // Copy temp to grid
}
*/  
  /*  
function area_sum(grid, point_x, point_y) {
    var table_body = grid.getElementsByTagName("tbody")[0];
    var sum = 0;
    var row;
    var column;
    for (row = (point_y -1); row <= point_y + 1; row = row + 2) {
	for (column = (point_x -1); column <= (point_x + 1); column++) {
	    var cell = table_body.childNodes[row].childNodes[column];
	    sum += (cell.style.backgroundColor.toString() == "rgb(0, 0, 0)") ? 1 : 0;
	}
    }
    
    row = point_y;
    for (column = (point_x -1); column <= (point_x +1); point_x += 2) {
	var cell = table_body.childNodes[row].childNodes[column];
	sum += (cell.style.backgroundColor.toString() == "rgb(0, 0, 0)") ? 1 : 0;
    }
    return sum;
}

*/
function make_table(numRows, numColums) {
        var body = document.getElementsByTagName("body")[0];

	// Build the tables
        var tbl     = document.createElement("table");
        var tblBody = document.createElement("tbody");
	
	for (i = 0; i < numRows; i++) {
		var row = document.createElement("tr");
		for (j = 0; j < numColums; ++j) {
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
