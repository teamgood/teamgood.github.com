var model = (function () {

var exports = {};
function Ant(id, color, brain, world) {

	// initialise variables
	this.color = color;
	this.otherColor = color === "red" ? "black" : "red";
	this.id = id;
	this.row = 0;
	this.col = 0;
	this.state = 0;
	this.dir = 0;
	this.resting = 0;
	this.food = 0;

	this.kill = function () {
		var cell = world.getCell(this.row, this.col);
		cell.depositFood(3);
		cell.removeAnt();
		// remove from ants
		this.step = function () {};
	};


	this.hasFood = function () {
		return this.food === 1; 
	};

	this.checkForDeath = function () {
		var count = 0;
		for (var d = 0; d < 6; d++) {
			if (!world.getAdjacentCell(this.row, this.col, d).containsAntOfColor(this.otherColor)) {
				count++;
				if (count > 1) {
					return;
				}
			}
		}
		this.kill();
	};

	this.checkForAdjacentDeaths = function () {
		var adjCells = world.getAllAdjacentCells(this.row, this.col);
		var enemies = [];
		for (var i = 0; i < adjCells.length; i++) {
			if (adjCells[i].containsAntOfColor(this.otherColor)) {
				enemies.push(adjCells[i].getAnt());
			}
		}
		if (enemies.length > 4) {
			this.kill();
		} else {
			for (var i = 0; i < enemies.length; i++) {
				enemies[i].checkForDeath();
			}
		}
	};

	this.getAdjacentCell = function (dir) {
		return world.getAdjacentCell(this.row, this.col, dir);
	};

	this.getCurrentCell = function () {
		return world.getCell(this.row, this.col);
	};

	this.step = function () {
		if (this.resting > 0) {
			this.resting--;
		} else {
			brain[this.state](this);
		}
	};

	this.toString = function () {
		return this.color + " ant of id " + this.id + ", dir " + 
		       this.dir + ", food " + this.food + ", state " + 
		       this.state + ", resting " + this.resting;
	};
}
exports.Ant = Ant;
function AntBrain(states, color, rng) {
	var otherColor = color === "red" ? "black" : "red";
	var senseConditionEvaluators = {
		"Friend": function (senseCell) {
			return senseCell.containsAntOfColor(color); 
		},
		"Foe": function (senseCell) {
			return senseCell.containsAntOfColor(otherColor); 
		},
		"FriendWithFood": function (senseCell) {
			return senseCell.containsAntOfColorWithFood(color); 
		},
		"FoeWithFood": function (senseCell) {
			return senseCell.containsAntOfColorWithFood(otherColor); 
		},
		"Food": function (senseCell) {
			return senseCell.hasFood(); 
		},
		"Rock": function (senseCell) {
			return senseCell.type === "rock"; 
		},
		"Marker": function (senseCell, marker) {
			return senseCell.hasMarker(color, marker); 
		},
		"FoeMarker": function (senseCell) {
			return senseCell.hasMarker(otherColor);
		},
		"Home": function (senseCell) {
			return senseCell.type === color + " hill"; 
		},
		"FoeHome": function (senseCell) {
			return senseCell.type === otherColor + " hill"; 
		}
	};

	var senseCellFinders = {
		"Here": function (ant) { return ant.getCurrentCell(); },
		"Ahead": function (ant) { return ant.getAdjacentCell(ant.dir); },
		"LeftAhead": function (ant) {
			return ant.getAdjacentCell((ant.dir + 5) % 6); 
		},
		"RightAhead": function (ant) {
			return ant.getAdjacentCell((ant.dir + 1) % 6); 
		}
	};
	var instructions = {
		"Sense": function (state) {
			var getSenseCell = senseCellFinders[state.dir];
			var senseSuccess = senseConditionEvaluators[state.condition];
			return function (ant) {
				if (senseSuccess(getSenseCell(ant), state.marker)) {
					ant.state = state.st1;
				} else {
					ant.state = state.st2;
				}
			};
		},
		"Mark": function (state) {
			return function (ant) {
				ant.getCurrentCell().addMarker(ant.color, state.marker);
				ant.state = state.st;
			};
		},
		"Unmark": function (state) {
			return function (ant) {
				ant.getCurrentCell().removeMarker(ant.color, state.marker);
				ant.state = state.st;
			};
		},
		"PickUp": function (state) {
			return function (ant) {
				var cell = ant.getCurrentCell();
				if (cell.hasFood() && !ant.hasFood()) {
					cell.removeFood();
					ant.food = 1;
					ant.state = state.st1;
				} else {
					ant.state = state.st2;
				}
			};
		},
		"Drop": function (state) {
			return function (ant) {
				if (ant.food === 1) {
					ant.getCurrentCell().depositFood();
					ant.food = 0;
				}
				ant.state = state.st;
			};
		},
		"Turn": function (state) {
			var turnAnt;
			if (state.dir === "Left") {
				turnAnt = function (ant) { ant.dir = (ant.dir + 5) % 6; };
			} else {
				turnAnt = function (ant) { ant.dir = (ant.dir + 1) % 6; };
			}
			return function (ant) {
				turnAnt(ant);
				ant.state = state.st;
			};
		},
		"Move": function (state) {
			return function (ant) {
				var cell = ant.getAdjacentCell(ant.dir);
				if (cell.isAvailable()) {
					cell.moveAntHere(ant);
					ant.state = state.st1;
					ant.resting = 14;
					ant.checkForAdjacentDeaths();
				} else {
					ant.state = state.st2;
				}
			};
		},
		"Flip": function (state) {
			return function (ant) {
				if (rng.next(state.p) === 0) {
					ant.state = state.st1;
				} else {
					ant.state = state.st2;
				}
			};
		}
	};

	var brain = [];
	for (var i = 0; i < states.length; i++) {
		brain.push(instructions[states[i].type](states[i]));
	}
	return brain;
}

exports.AntBrain = AntBrain;
exports.test_only = exports.test_only || {};

// standard error wrapper to include line number
function BrainParseError(message, line) {  
    var err = new Error(message + " at line " + line);
    err.line = line;
    return err;
} 

/********** helper functions **********/

function _parseInt(string) {
	// strip preceding zeroes
	while (string.length > 1 && string.substr(0, 1) === "0") {
		string = string.substr(1);
	}
	return parseInt(string, 10);
}

exports.test_only._parseInt = _parseInt;

// the following functions evaluate a line and, if it represents a valid 
// instruction, return a state object. Otherwise they return undefined.
var instrParsers = {};

// Sense instructions
instrParsers['Se'] = function (line) {
	var match = line.trim().match(/^Sense (Ahead|LeftAhead|RightAhead|Here) (\d+) (\d+) (Friend|Foe|FriendWithFood|FoeWithFood|Food|Rock|FoeMarker|Home|FoeHome|Marker \d)$/);
	if (match) {
		var condition = match[4];
		var marker = -1;
		// if the sense condition is 'Marker', we need to extract the
		// relevant marker id
		if (condition.indexOf("Marker") === 0) {
			marker = _parseInt(condition.substr(7, 1));
			condition = "Marker";
		}
		return {
			type: "Sense",
			dir: match[1],
			condition: condition,
			marker: marker,
			st1: _parseInt(match[2]),
			st2: _parseInt(match[3])
		};
	} 
};

// Mark/Unmark instructions
instrParsers['Un'] = instrParsers['Ma'] = function (line) {
	var match = line.trim().match(/^(Mark|Unmark) (\d+) (\d+)$/);
	if (match) {
		return {
			type: match[1],
			st: _parseInt(match[3]),
			marker: _parseInt(match[2])
		};
	} 
};

// PickUp/Move instructions
instrParsers['Pi'] = instrParsers['Mo'] = function (line) {
	var match = line.trim().match(/^(PickUp|Move) (\d+) (\d+)$/);
	if (match) {
		return {
			type: match[1],
			st1: _parseInt(match[2]),
			st2: _parseInt(match[3])
		};
	}
};

// Drop instructions
instrParsers['Dr'] = function (line) {
	var match = line.trim().match(/^Drop (\d+)$/);
	if (match) {
		return {
			type: "Drop",
			st: _parseInt(match[1])
		};
	}
};

// Turn instructions
instrParsers['Tu'] = function (line) {
	var match = line.trim().match(/^Turn (Left|Right) (\d+)$/);
	if (match) {
		return {
			type: "Turn",
			dir: match[1],
			st: _parseInt(match[2])
		};
	}
};

// Flip instructions
instrParsers['Fl'] = function (line) {
	var match = line.trim().match(/^Flip (\d+) (\d+) (\d+)$/);
	if (match) {
		return { 
			type: "Flip",
			p: _parseInt(match[1]),
			st1: _parseInt(match[2]),
			st2: _parseInt(match[3])
		};
	}
};

function _parseLine(line) {
	var firstTwoChars = line.trim().substr(0, 2);
	return instrParsers[firstTwoChars] && instrParsers[firstTwoChars](line);
}

exports.test_only._parseLine = _parseLine;

/**
 * This function parses ant brain code and returns a list of state objects.
 *
 */
function parseAntBrain(code) {
	// replace windows and mac newlines with unix ones
	code = code.replace(/\r\n/g, "\n");
	code = code.replace(/\r/g, "\n");

	// split into lines
	var lines = code.split(/\n/g);
	var numLines = lines.length;

	// convert lines to states
	var states = [];

	// for every line
	for (var i = 0; i < numLines; i++) {
		// try and turn it into a state
		var state = _parseLine(lines[i]);
		// if we were successful, add the state to 
		// the array, otherwise error
		if (state) {
			state.line = i + 1; // for use with error checking below
			states.push(state);
		} else {
			if (lines[i].trim().length > 0) { // ignore empty lines
				var msg = "Malformed Instruction: '" + lines[i] + "'";
				throw new BrainParseError(msg, i + 1);
			}
		}
		if (states.length > 1000) {
			throw new BrainParseError("Too many states. Limit is 1000.", i + 1);
		}
	}

	if (states.length === 0) {
		throw new BrainParseError("No states given", 1);
	}

	// we need to check if there are too many states or if there are any
	// instructions which point to nonexistent states or any marker ids > 5
	var highestStateIndex = states.length - 1;
	for (var i = 0; i <= highestStateIndex; i++) {
		var x = states[i].st || 0;
		var y = states[i].st1 || 0;
		var z = states[i].st2 || 0;
		var s = Math.max(x, y, z);
		if (s > highestStateIndex) {
			var msg = "Pointer to state '" + s + "'' which doesn't exist";
			throw new BrainParseError(msg, states[i].line);
		}
		var marker = states[i].marker || 0;
		if (marker > 5) {
			var msg = "Marker id '" + marker + "' too high";
			throw new BrainParseError(msg, states[i].line);
		}
		// we don't need the 'line' property any more
		delete states[i].line;
	}

	// all good so
	return states;
}

exports.parseAntBrain = parseAntBrain;
var Ant = Ant || function () {}; // to avoid lint errors
/**
 * AntGame objects represent a match between two ant brains on a specific
 * world.
 * @param redBrain the brain of the ants on the red team
 * @param blackBrain the brain of the ants on the black team
 * @param world the world in which the ants compete
 */
function AntGame(redBrain, blackBrain, world) {
	var ants = [];
	var id = 0;
	// populate world with ants
	for (var row = 0; row < world.height; row++) {
		for (var col = 0; col < world.width; col++) {
			var cell = world.getCell(row, col);
			if (cell.type === "black hill") {
				var ant = new Ant(id++, "black", blackBrain, world);
				ants.push(ant);
				cell.setAnt(ant);
			} else if (cell.type === "red hill") {
				var ant = new Ant(id++, "red", redBrain, world);
				ants.push(ant);
				cell.setAnt(ant);
			}
		}
	}
	var numAnts = ants.length;

	var run = function (iterations) {
		for (var i = 0; i < iterations; i++) {
			for (var id = 0; id < numAnts; id++) {
				ants[id].step();
			}
		}
	};

	var getScore = function () {
		var score = {red: 0, black: 0};
		for (var row = 0; row < world.height; row++) {
			for (var col = 0; col < world.width; col++) {
				var cell = world.getCell(row, col);
				if (cell.type === "black hill") {
					score.black += cell.getFood();
				} else if (cell.type === "red hill") {
					score.red += cell.getFood();
				}
			}
		}
	};

	return {
		run: run,
		getScore: getScore
	};
}
exports.AntGame = AntGame;
var WorldCell = WorldCell || function () {}; // to avoid lint errors

function AntWorld(parsedGrid) {
	var width = parsedGrid.width,
		height = parsedGrid.height;
	// build cells
	var grid = [];
	for (var row = 0; row < height; row++) {
		grid.push([]);
		for (var col = 0; col < width; col++) {
			grid[row].push(new WorldCell(parsedGrid.cells[row][col], row, col));
		}
	}

	function toString() {
		var s = "";
		for (var row = 0; row < height; row++) {
			for (var col = 0; col < width; col++) {
				s += "cell (" + col + ", " + row + "): " + 
				     grid[row][col].toString() + "\n";
			}
		}
		return s;
	}

	var adjacentGetters = [
		function (row, col) { return grid[row][col + 1]; },
		function (row, col) { return grid[row + 1][col + 1 * (row % 2)]; },
		function (row, col) { return grid[row + 1][col + 1 * ((row % 2) - 1)]; },
		function (row, col) { return grid[row][col - 1]; },
		function (row, col) { return grid[row - 1][col + 1 * ((row % 2) - 1)]; },
		function (row, col) { return grid[row - 1][col + 1 * (row % 2)]; }
	];
	
	function getAdjacentCell(row, col, dir) {
		return adjacentGetters[dir](row, col);
	}

	function getAllAdjacentCells(row, col) {
		var cells = [];
		for (var dir = 0; dir < 6; dir++) {
			cells.push(getAdjacentCell(row, col, dir));
		}
		return cells;
	}

	function getCell(row, col) {
		return grid[row][col];
	}
	return {
		width: width,
		height: height,
		getCell: getCell,
		getAllAdjacentCells: getAllAdjacentCells,
		getAdjacentCell: getAdjacentCell,
		toString: toString
	};
}
exports.AntWorld = AntWorld;
exports.test_only = exports.test_only || {};

/** 
 * Parses ant world code and returns a grid. Throws an 
 * error if anything is amiss.
 * @param code the code to parse
 * @param contestRules (Optional) If given a truthy value,
 *        contest rules are enforced.
 */
function parseAntWorld(code, contestRules) {
	// replace windows and mac newlines with unix ones
	code = code.replace(/\r\n/g, "\n");
	code = code.replace(/\r/g, "\n");

	// split into lines
	var lines = code.split(/\n/g);
	// remove blank lines at the end
	while (lines[lines.length - 1].trim() === "") {
		lines.splice(lines.length - 1, 1);
	}
	var numLines = lines.length;

	// check we have enough lines
	if ((contestRules && numLines < 2 + 150) ||
		(!contestRules && numLines < 2 + 3)) {
		throw new Error("Too few lines");
	}

	// get grid dimensions
	var dimens = lines.splice(0, 2);
	var width = parseInt(dimens[0].trim(), 10);
	var height = parseInt(dimens[1].trim(), 10);

	// dimensions checks
	if (!width || !height) {
		throw new Error("Could not parse world dimensions");
	}
	if (contestRules && (width !== 150 || height !== 150)) {
		throw new Error("Contest grids must be 150x150");
	}

	if (height !== lines.length) {
		throw new Error("Grid height does not match specified value");
	}

	// parse lines inividually
	var grid = {cells: [], width: width, height: height};
	for (var i = 0; i < height; i++) {
		grid.cells.push(_parseGridLine(lines[i], i % 2 === 1, width));
	}

	// aight, so we've got a well-dimensioned grid
	// now do standard validity checks of grid contents
	if (!_isSurroundedByRock(grid)) {
		throw new Error("The ant world must be enclosed by rock.");
	}
	if (!_gridContains(grid, "+")) {
		throw new Error("The ant wold must contain at least one red hill");
	}
	if (!_gridContains(grid, "-")) {
		throw new Error("The ant wold must contain at least one black hill");
	}
	if (!_gridContains(grid, "f")) {
		throw new Error("The ant wold must contain at least one source of food");
	}

	if (contestRules) {
		// now check for any remaining contest rules
		// we know it's 150x150 and that rocks surround the grid

		// check that there are one of each type of ant hill
		var redHills = _getElements(grid, "+");
		if (redHills.length !== 1) {
			throw new Error("Incorrect number of red hills detected");
		}
		var blackHills = _getElements(grid, "-");
		if (blackHills.length !== 1) {
			throw new Error("Incorrect number of black hills detected");
		}
		
		// check that the hills are the right size and shape
		if (!_isLegalHill(redHills[0])) {
			throw new Error("Red hill is of illegal size and shape");
		}
		if (!_isLegalHill(blackHills[0])) {
			throw new Error("Black hill is of illegal size and shape");
		}

		// check that there are 14 rocks (not inlcuding outer edge)
		var rocks = _getElements(grid, "#");
		if (rocks.length !== 15) {
			throw new Error("There must be 14 incongruous rocky " +
			                "areas unattached to the edge");
		}

		// check that there are 11*25 food deposits and that they each have
		// quantity 5
		var numFood = 0;
		for (var row = 0; row < height; row++) {
			for (var col = 0; col < width; col++) {
				if (grid.cells[row][col].type === "f") {
					numFood++;
					if (grid.cells[row][col].quantity !== 5) {
						throw new Error("The cell at (" + row + "," + col + 
							            ") has an incorrect amount of food");
					}
				}
			}
		}
		if (numFood !== 11 * 25) {
			throw new Error("There are too few food deposits");
		}
		// now check that they are the right shape
		var foods = _getElements(grid, "f");
		for (var i = 0; i < foods.length; i++) {
			if (!_containsLegalFoodBlobs(foods[i])) {
				throw new Error("Mishapen food blobs discovered");
			}
		}
	}
	return grid;
}

exports.parseAntWorld = parseAntWorld;

function _parseGridLine(line, oddLine, supposedWidth) {
	if (oddLine) { // we're expecting a space at the start
		if (line.substr(0, 1) !== " ") {
			throw new Error("No space at start of odd line");
		}
		// remove leading space and check no other spaces exist
		line = line.substr(1);
		if (line.substr(0, 1) === " ") {
			throw new Error("Too much space at start of odd line");
		}
	} else {
		// even line so space is bad
		if (line.substr(0, 1) === " ") {
			throw new Error("Unexpected space at start of even line");
		}
	}

	// get individual chars as array. trim trailing whitespace
	var chars = line.trim().split(/ /g);
	var numChars = chars.length;
	// check for correct width
	if (numChars !== supposedWidth) {
		throw new Error("Grid width mismatch");
	}
	var cells = [];
	for (var i = 0; i < numChars; i++) {
		// check for illegal cell identifiers
		if (!chars[i].match(/[1-9\-.+#]/)) {
			throw new Error("Unrecognised cell identifier: " + chars[i]);
		}
		// append to cells list
		if (chars[i].match(/[1-9]/)) {
			// food so change type to "f" and put value in another property
			cells.push({type: "f", quantity: parseInt(chars[i], 10)});
		} else {
			cells.push({type: chars[i]});
		}
	}
	return cells;
}
exports.test_only._parseGridLine = _parseGridLine;

// checks that there are no gaps around the edges of the grid
function _isSurroundedByRock(grid) {
	// check top and bottom row
	for (var col = 0; col < grid.width; col++) {
		if (grid.cells[0][col].type !== "#" || 
			grid.cells[grid.height - 1][col].type !== "#") {
			return false;
		}
	}
	// check leftmost and rightmost columns
	for (var row = 0; row < grid.height; row++) {
		if (grid.cells[row][0].type !== "#" || 
			grid.cells[row][grid.width - 1].type !== "#") {
			return false;
		}
	}
	return true;
}
exports.test_only._isSurroundedByRock = _isSurroundedByRock;

// searches the grid for a specific cell type
function _gridContains(grid, targetType) {
	for (var row = 0; row < grid.height; row++) {
		for (var col = 0; col < grid.width; col++) {
			if (grid.cells[row][col].type === targetType) {
				return true;
			}
		}
	}
}
exports.test_only._gridContains = _gridContains;

// returns a list of 2D arrays which represent the shape of elements of the
// specified target type
// an element is a contiguous region of one particular type
function _getElements(grid, targetType) {
	var elements = [];
	var visitedCells = [];

	// for every cell
	for (var row = 0; row < grid.height; row++) {
		for (var col = 0; col < grid.width; col++) {
			var cell = grid.cells[row][col];
			// if cell not visited and correct type
			if (visitedCells.indexOf(row + ":" + col) === -1 && 
				cell.type === targetType) {
				// get coords of all cells of this element
				var coords = _getElementCoords(grid, row, col);
				// add all coords to visited
				for (var i = 0, len = coords.length; i < len; i++) {
					visitedCells.push(coords[i].row + ":" + coords[i].col);
				}
				// superimpose on box so the shape can be tested
				elements.push(_getElementBox(coords));
			}
		}
	}

	return elements;
}
exports.test_only._getElements = _getElements;


// returns a 2D array of boolean values representing the 
// shape of an element
function _getElementBox(coords) {
	// find min and max rows and cols
	var minRow = coords[0].row,
		maxRow = coords[0].row,
		minCol = coords[0].col,
		maxCol = coords[0].col;

	var len = coords.length;
	for (var i = 0; i < len; i++) {
		var c = coords[i];
		if (c.row > maxRow) { maxRow = c.row; }
		else if (c.row < minRow) { minRow = c.row; }
		
		if (c.col > maxCol) { maxCol = c.col; }
		else if (c.col < minCol) { minCol = c.col; }
	}

	// find dimensions of box
	var width = maxCol - minCol + 1;
	var height = maxRow - minRow + 1;

	// create empty box
	var box = [];
	for (var row = 0; row < height; row++) {
		box[row] = [];
		for (var col = 0; col < width; col++) {
			box[row][col] = false;
		}
	}

	// fill box
	for (var i = 0; i < len; i++) {
		var c = coords[i];
		box[c.row - minRow][c.col - minCol] = true; 
	}
	return {config: box, topRow: minRow};
}
exports.test_only._getElementBox = _getElementBox;


// gets all the coordinates which comprise an element
function _getElementCoords(grid, row, col) {
	var targetType = grid.cells[row][col].type;
	var visitedCells = [];
	var elementCoords = [];
	function visitCell(row, col) {
		if (row >= 0 && row < grid.height && 
		    col >= 0 && col < grid.width &&
		    visitedCells.indexOf(grid.cells[row][col]) === -1) {
			// this is a valid cell we haven't seen before
			visitedCells.push(grid.cells[row][col]);
			if (grid.cells[row][col].type === targetType) {
				// this cell is part of the element
				elementCoords.push({row: row, col: col});
				// explore this cell's adjacent cells
				for (var dir = 0; dir < 6; dir++) {
					var coord = _getAdjacentCoord(row, col, dir);
					visitCell(coord.row, coord.col);
				}
			} else {
				// check for rocks adjacent to ant hills and so forth
				var thisType = grid.cells[row][col].type;
				var throwError = false;
				switch (targetType) {
				case "+":
					if (thisType === "#" || thisType === "-") {
						throwError = true;
					}
					break;
				case "-":
					if (thisType === "#" || thisType === "+") {
						throwError = true;
					}
					break;
				}
				if (throwError) {
					throw new Error("An ant hill cannot be immediately adjacent" + 
					                " to a rock or to the other ant hill.");
				}
			}
		}
	}
	visitCell(row, col);
	return elementCoords;
}
exports.test_only._getElementCoords = _getElementCoords;

// gets the coordinates of the cell adjacent to the cell at
// (row, col) in the specified direction
function _getAdjacentCoord(row, col, direction) {
	direction = Math.abs(direction) % 6;
	var odd = row % 2 === 1;
	function changeRowRight() { col += odd ? 1 : 0; }
	function changeRowLeft() { col -= odd ? 0 : 1; }
	switch (direction) {
	case 0: 
		col++; 
		break;
	case 1: 
		row++; 
		changeRowRight();
		break;
	case 2: 
		row++; 
		changeRowLeft();
		break;
	case 3: 
		col--; 
		break;
	case 4: 
		row--; 
		changeRowLeft();
		break;
	case 5: 
		row--; 
		changeRowRight();
		break;
	}
	return {row: row, col: col};
}
exports.test_only._getAdjacentCoord = _getAdjacentCoord;

// food must be in 5x5 grid
// there are three possible configs, each with two possible manifestations
//   x x x x x    if top    xxxxx     if top   xxxxx  
//    x x x x x    row is   xxxxx     row is    xxxxx 
//     x x x x x    even:    xxxxx     odd      xxxxx 
//      x x x x x            xxxxx               xxxxx
//       x x x x x            xxxxx              xxxxx
//
//       x x x x x  if top    xxxxx   if top    xxxxx
//      x x x x x    row is  xxxxx    row is    xxxxx
//     x x x x x      even:  xxxxx     odd     xxxxx 
//    x x x x x             xxxxx              xxxxx 
//   x x x x x              xxxxx             xxxxx  
//
//          x                 x           x  
//         x x               xx           xx  
//        x x x              xxx         xxx     
//       x x x x            xxxx         xxxx       
//      x x x x x           xxxxx       xxxxx          
//       x x x x            xxxx         xxxx       
//        x x x              xxx         xxx     
//         x x               xx           xx  
//          x                 x           x   
//
// how best to represent this algorithmically? Can't think of a good
// way, especially when another problem is that food elements can 
// touch each other. d'oh!
// so i've opted for an ugly, brute force way of doing it
var foodOverlays = [[[], [], []], [[], [], []]];
foodOverlays[0][0].push([true, true, true, true, true, false, false]);
foodOverlays[0][0].push([true, true, true, true, true, false, false]);
foodOverlays[0][0].push([false, true, true, true, true, true, false]);
foodOverlays[0][0].push([false, true, true, true, true, true, false]);
foodOverlays[0][0].push([false, false, true, true, true, true, true]);

foodOverlays[0][1].push([false, false, true, true, true, true, true]);
foodOverlays[0][1].push([false, true, true, true, true, true, false]);
foodOverlays[0][1].push([false, true, true, true, true, true, false]);
foodOverlays[0][1].push([true, true, true, true, true, false, false]);
foodOverlays[0][1].push([true, true, true, true, true, false, false]);

foodOverlays[0][2].push([false, false, true, false, false]);
foodOverlays[0][2].push([false, true, true, false, false]);
foodOverlays[0][2].push([false, true, true, true, false]);
foodOverlays[0][2].push([true, true, true, true, false]);
foodOverlays[0][2].push([true, true, true, true, true]);
foodOverlays[0][2].push([true, true, true, true, false]);
foodOverlays[0][2].push([false, true, true, true, false]);
foodOverlays[0][2].push([false, true, true, false, false]);
foodOverlays[0][2].push([false, false, true, false, false]);

foodOverlays[1][0].push([true, true, true, true, true, false, false]);
foodOverlays[1][0].push([false, true, true, true, true, true, false]);
foodOverlays[1][0].push([false, true, true, true, true, true, false]);
foodOverlays[1][0].push([false, false, true, true, true, true, true]);
foodOverlays[1][0].push([false, false, true, true, true, true, true]);

foodOverlays[1][1].push([false, false, true, true, true, true, true]);
foodOverlays[1][1].push([false, false, true, true, true, true, true]);
foodOverlays[1][1].push([false, true, true, true, true, true, false]);
foodOverlays[1][1].push([false, true, true, true, true, true, false]);
foodOverlays[1][1].push([true, true, true, true, true, false, false]);

foodOverlays[1][2].push([false, false, true, false, false]);
foodOverlays[1][2].push([false, false, true, true, false]);
foodOverlays[1][2].push([false, true, true, true, false]);
foodOverlays[1][2].push([false, true, true, true, true]);
foodOverlays[1][2].push([true, true, true, true, true]);
foodOverlays[1][2].push([false, true, true, true, true]);
foodOverlays[1][2].push([false, true, true, true, false]);
foodOverlays[1][2].push([false, false, true, true, false]);
foodOverlays[1][2].push([false, false, true, false, false]);

function _containsLegalFoodBlobs(box) {
	var newBox = box;
	var lastGoodBox = box;
	// while we haven't gotten down to an empty box
	while (newBox.config.length > 0) {
		var good = false; // good if an intersection was found
		// for each possible food config
		for (var i = 0; i < 3; i++) {
			newBox = _attemptBoxIntersection(newBox,
			                              foodOverlays[newBox.topRow % 2][i]);
			// we get a reduced box (sans intersecting cells) if
			// successful. Otherwise undefined.
			good = !!newBox; // cast to bool
			if (good) { 
				lastGoodBox = newBox; // this box is good so remember it
				break; 
			} else {
				newBox = lastGoodBox; // the box was bad so revert
			}
		}
		if (!good) { 
			// we got through all three possible food configs and none
			// created valid intersection
			return false;
		}
	}
	return true;
}
exports.test_only._containsLegalFoodBlobs = _containsLegalFoodBlobs;

function _attemptBoxIntersection(box, overlay) {
	box = _cloneBox(box);
	var config = box.config;
	// if underneath is shorten than overlay, no intersection is possible
	if (config.length < overlay.length) {
		return undefined;
	}
	// find indices of first overlap on top row
	var ci, oi;
	for (var i = 0; i < config[0].length; i++) {
		if (config[0][i]) {
			ci = i;
			break;
		}
	}
	for (var i = 0; i < overlay[0].length; i++) {
		if (overlay[0][i]) {
			oi = i;
			break;
		}
	}
	var colOffset = ci - oi;
	// if the overlay doesn't fit within the bounds of the box config, 
	// an intersection is not possible;
	if (colOffset < 0 || colOffset + overlay[0].length > config[0].length) {
		return undefined;
	}
	// now iterate over overlay and check that &&s come out true;
	for (var row = 0; row < overlay.length; row++) {
		for (var col = 0; col < overlay[0].length; col++) {
			if (overlay[row][col]) {
				if (!config[row][col + colOffset]) {
					return undefined;
				} else {
					// blot it out
					config[row][col + colOffset] = false;
				}
			}
		}
	}
	// if we got here without returning undefined, an intersetion was
	// successfully made! hooray!
	return _cropBox(box);
}
exports.test_only._attemptBoxIntersection = _attemptBoxIntersection;

function _cloneBox(box) {
	var newConfig = [];
	for (var i = 0; i < box.config.length; i++) {
		newConfig.push([]);
		for (var j = 0; j < box.config[i].length; j++) {
			newConfig[i][j] = box.config[i][j];
		}
	}
	return {config: newConfig, topRow: box.topRow};
}
exports.test_only._cloneBox = _cloneBox;

function _cropBox(box) {
	box = _cloneBox(box);
	function boxHasDimensions() {
		return box.config.length > 0 && box.config[0].length > 0;
	}
	function colIsEmpty(n) {
		for (var row = 0; row < box.config.length; row++) {
			if (box.config[row][n]) {
				return false;
			}
		}
		return true;
	}
	function rowIsEmpty(n) {
		for (var col = 0; col < box.config[n].length; col++) {
			if (box.config[n][col]) {
				return false;
			}
		}
		return true;
	}
	function deleteCol(n) {
		for (var row = 0; row < box.config.length; row++) {
			box.config[row].splice(n, 1);
		}
	}
	function deleteRow(n) {
		box.config.splice(n, 1);
	}
	while (boxHasDimensions() && rowIsEmpty(0)) {
		deleteRow(0);
		box.topRow++;
	}
	while (boxHasDimensions() && rowIsEmpty(box.config.length - 1)) {
		deleteRow(box.config.length - 1);
	}
	while (boxHasDimensions() && colIsEmpty(0)) {
		deleteCol(0);
	}
	while (boxHasDimensions() && colIsEmpty(box.config[0].length - 1)) {
		deleteCol(box.config[0].length - 1);
	}
	return box;
}
exports.test_only._cropBox = _cropBox;



// hills must look like this:
//        x x x x x x x           xxxxxxx         xxxxxxx               
//       x x x x x x x x         xxxxxxxx         xxxxxxxx                
//      x x x x x x x x x        xxxxxxxxx       xxxxxxxxx                 
//     x x x x x x x x x x      xxxxxxxxxx       xxxxxxxxxx                   
//    x x x x x x x x x x x     xxxxxxxxxxx     xxxxxxxxxxx                    
//   x x x x x x x x x x x x   xxxxxxxxxxxx     xxxxxxxxxxxx                      
//  x x x x x x x x x x x x x  xxxxxxxxxxxxx   xxxxxxxxxxxxx                        
//   x x x x x x x x x x x x                              
//    x x x x x x x x x x x                               
//     x x x x x x x x x x                                
//      x x x x x x x x x                                 
//       x x x x x x x x                                  
//        x x x x x x x                                   
// I can do this one algorithmically

function _isLegalHill(box) {
	if (box.config.length !== 13 ||
		box.config[0].length !== 13) {
		return false;
	}
	function isLegalRow(n) {
		var numCellsOnRow = 13 - Math.abs(n - 6);
		var firstIndex = Math.floor(Math.abs(n - 6) / 2);
		if (box.topRow % 2 === 1 && n % 2 === 1) {
			firstIndex++;
		}
		for (var i = 0; i < 13; i++) {
			if (i >= firstIndex && i < firstIndex + numCellsOnRow) {
				// these cells should be hills
				if (!box.config[n][i]) {
					return false;
				}
			} else {
				// these cells should be empty
				if (box.config[n][i]) {
					return false;
				}
			}
		}
		return true;
	}

	// iterate over rows
	for (var row = 0; row < 13; row++) {
		if (!isLegalRow(row)) {
			return false;
		}
	}

	return true;
}
exports.test_only._isLegalHill = _isLegalHill;
/**
 * A simple pseudo-random number generator object
 */
function RandomNumberGenerator() {
	return {
		/**
		 * Returns a pseudo-random number between 0 and n-1 inclusive
		 * @param n
		 */
		next: function (n) {
			return Math.floor(Math.random() * n);
		}
	};
}
exports.test_only = exports.test_only || {};

// generates random worlds fit for contests
function generateRandomWorld() {
	// make blank grid
	var grid = [];
	grid[0] = [];
	grid[149] = [];
	for (var i = 0; i < 150; i++) {
		grid[0].push("#");
		grid[149].push("#");
	}
	for (var i = 1; i < 149; i++) {
		grid[i] = [];
		grid[i].push("#");
		for (var j = 1; j < 149; j++) {
			grid[i].push(".");
		}
		grid[i].push("#");
	}

	// that's the blank grid done, now to put stuff up in there!
	// rocks first
	for (var i = 0; i < 14; i++) {
		_drawRandomRock(grid);
	}

	var randCol, randRow;
	var safetyCounter = 10000;
	// hills next
	do {
		if (!(safetyCounter--)) { return generateRandomWorld(); }
		randCol = Math.floor(Math.random() * 150);
		randRow = Math.floor(Math.random() * 150);
	} while (!_superimpose(grid, hillShape, randRow, randCol, "+"));

	do {
		if (!(safetyCounter--)) { return generateRandomWorld(); }
		randCol = Math.floor(Math.random() * 150);
		randRow = Math.floor(Math.random() * 150);
	} while (!_superimpose(grid, hillShape, randRow, randCol, "-"));


	// now chuck some food in
	for (var i = 0; i < 11; i++) {
		var foodi = Math.floor(Math.random() * 3);
		do {
			if (!(safetyCounter--)) { return generateRandomWorld(); }
			randCol = Math.floor(Math.random() * 150);
			randRow = Math.floor(Math.random() * 150);
		} while (!_superimpose(grid, foodShapes[foodi], randRow, randCol, "5"));
	}

	// concatenate into string
	var string = "150\n150\n";
	for (var row = 0; row < 150; row++) {
		string += (row % 2 === 0 ? "" : " ");
		string += grid[row].join(" ");
		string += "\n";
	}
	return string;
}
exports.generateRandomWorld = generateRandomWorld;

function _drawRandomRock(grid) {
	var shape = rockShapes[Math.floor(Math.random() * rockShapes.length)];
	var row, col;
	var paintDirection = Math.floor(Math.random() * 6);
	var lastTurn = -1;
	var setNextDirection = function () {
		// 10% chance of turning.
		if (Math.random() > 0.9) {
			// 90% chance of turning the same way as last time
			if (Math.random() > 0.9) {
				lastTurn = -lastTurn;
			}
			paintDirection += lastTurn;
			paintDirection = (paintDirection + 6) % 6;
		}
	};
	var moveToNextPosition = function () {
		if (paintDirection === 0 || paintDirection === 3) {
			col += paintDirection === 0 ? 1 : -1;
			return;
		}
		if ((paintDirection + 1) % 6 > 2) {
			// going left and up/down
			col += row % 2 === 0 ? -1 : 0;
		} else {
			// going right and up/down
			col += row % 2 === 0 ? 0 : 1;
		}
		row += paintDirection < 3 ? 1 : -1;
	};
	var paintOperations = 30 + Math.floor(Math.random() * 50);

	// find initial position
	do {
		col = Math.floor(Math.random() * 150);
		row = Math.floor(Math.random() * 150);
	} while (!_superimpose(grid, shape, row, col, "t"));

	// paint some rocks

	do {
		setNextDirection();
		moveToNextPosition();
	} while (_superimpose(grid, shape, row, col, "t") && --paintOperations);

	

	// now replace "t"s with "#"s.
	for (row = 0; row < 150; row++) {
		for (col = 0; col < 150; col++) {
			if (grid[row][col] === "t") {
				grid[row][col] = "#";
			}
		}
	}

	// all done.
}

function _superimpose(grid, shape, row, col, type) {
	var oddRow = row % 2 === 1;
	// check that there's enough room on the grid
	if (row < 0 || col < 0 ||
		150 - row < shape.length ||
		150 - col < shape[0].length ||
		!oddRow && col === 0) {
		return false;
	}

	// first check that we can superimpose
	for (var r = 0; r < shape.length; r++) {
		var d = ((r % 2 === 1) && !oddRow) ? -1 : 0;
		for (var c = 0; c < shape[0].length; c++) {
			// adjust column according to odd/even rows
			if (shape[r][c] === ".") { continue; }
			var cell = grid[row + r][col + c + d];
			if (cell !== "." && cell !== "t") { return false; }
		}
	}
	// now superimpose
	for (var r = 0; r < shape.length; r++) {
		var d = ((r % 2 === 1) && !oddRow) ? -1 : 0;
		for (var c = 0; c < shape[0].length; c++) {
			// adjust column according to odd/even rows
			if (shape[r][c] === "O") {
				grid[row + r][col + c + d] = type;
			}
		}
	}
	return true;
}
exports.test_only._superimpose = _superimpose;

var hillShape = [
	[".", ".", ".", "*", "*", "*", "*", "*", "*", "*", "*", ".", ".", ".", "."],
	[".", ".", ".", "*", "O", "O", "O", "O", "O", "O", "O", "*", ".", ".", "."],
	[".", ".", "*", "O", "O", "O", "O", "O", "O", "O", "O", "*", ".", ".", "."],
	[".", ".", "*", "O", "O", "O", "O", "O", "O", "O", "O", "O", "*", ".", "."],
	[".", "*", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "*", ".", "."],
	[".", "*", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "*", "."],
	["*", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "*", "."],
	["*", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "*"],
	["*", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "*", "."],
	[".", "*", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "*", "."],
	[".", "*", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "*", ".", "."],
	[".", ".", "*", "O", "O", "O", "O", "O", "O", "O", "O", "O", "*", ".", "."],
	[".", ".", "*", "O", "O", "O", "O", "O", "O", "O", "O", "*", ".", ".", "."],
	[".", ".", ".", "*", "O", "O", "O", "O", "O", "O", "O", "*", ".", ".", "."],
	[".", ".", ".", "*", "*", "*", "*", "*", "*", "*", "*", ".", ".", ".", "."]
]; // starts on odd line

var foodShapes = [];
foodShapes.push([
	[".", ".", "O", "O", "O", "O", "O"],
	[".", ".", "O", "O", "O", "O", "O"],
	[".", "O", "O", "O", "O", "O", "."],
	[".", "O", "O", "O", "O", "O", "."],
	["O", "O", "O", "O", "O", ".", "."]
]);

foodShapes.push([
	["O", "O", "O", "O", "O", ".", "."],
	[".", "O", "O", "O", "O", "O", "."],
	[".", "O", "O", "O", "O", "O", "."],
	[".", ".", "O", "O", "O", "O", "O"],
	[".", ".", "O", "O", "O", "O", "O"]
]);

foodShapes.push([
	[".", ".", "O", ".", "."],
	[".", ".", "O", "O", "."],
	[".", "O", "O", "O", "."],
	[".", "O", "O", "O", "O"],
	["O", "O", "O", "O", "O"],
	[".", "O", "O", "O", "O"],
	[".", "O", "O", "O", "."],
	[".", ".", "O", "O", "."],
	[".", ".", "O", ".", "."]
]);

var rockShapes = [];
rockShapes.push([
	[".", "+", "+", ".", "."],
	[".", "+", "O", "+", "."],
	["+", "O", "O", "+", "."],
	[".", "+", "+", "+", "."]
]);
rockShapes.push([
	[".", "+", "+", "+", "."],
	[".", "+", "O", "O", "+"],
	["+", "O", "O", "O", "+"],
	[".", "+", "O", "O", "+"],
	[".", "+", "+", "+", "."]
]);

rockShapes.push([
	[".", "+", "+", "+", "+", ".", "."],
	[".", "+", "O", "O", "O", "+", "."],
	["+", "O", "O", "O", "O", "+", "."],
	["+", "O", "O", "O", "O", "O", "+"],
	["+", "O", "O", "O", "O", "+", "."],
	[".", "+", "O", "O", "O", "+", "."],
	[".", "+", "+", "+", "+", ".", "."]
]);
function _returnFalse() { return false; }

function WorldCell(cell, row, col) {
	// rocky cells have very limited functionality so make an exception here:
	if (cell.type === "#") {
		return {
			row: row,
			col: col,
			type: "rock",
			toString: function () { return "rock"; },
			// add marker can't be called
			hasMarker:  _returnFalse,
			// remove marker can't be called
			containsAntOfColor: _returnFalse,
			containsAntOfColorWithFood: _returnFalse,
			// depositFood can't be called
			hasFood: _returnFalse,
			// removefood can't be called
			isAvailable: _returnFalse,
			// move ant here can't be called
			// remove ant can't be called
			// set ant can't be called
			// get ant can't be called
			// get food can't be called
		};
	}

	/***** initialise cell vars *****/
	var ant = null,
		food = cell.quantity || 0,
		markers = {
			red: [],
			black: []
		};

	
	/***** update type *****/
	var type = cell.type === "+" ? "red hill"
			: cell.type === "-" ? "black hill"
			: "clear";
	
	/**** public functions ****/
	
	var toString = function () {
		var s = "";
		// food comes first
		if (food > 0) { s += food + " food; "; }
		// then color of hill if hill
		if (type !== "clear") { s += type + "; "; }
		// then red markers
		if (markers.red.length > 0) {
			s += "red marks: ";
			for (var i = 0; i < markers.red.length; i++) {
				s += markers.red[i];
			}
			s += "; ";
		}
		// black markers
		if (markers.black.length > 0) {
			s += "black marks: ";
			for (var i = 0; i < markers.black.length; i++) {
				s += markers.black[i];
			}
			s += "; ";
		}
		// finally the ant if there is one
		if (!!ant) { s += ant.toString(); }
		return s.trim();
	};

	var addMarker = function (color, num) {
		if (markers[color].indexOf(num) === -1) {
			markers[color].push(num);
			markers[color].sort();
		}
	};
	var hasMarker = function (color, num) {
		if (typeof num === 'undefined') {
			return markers[color].length > 0;
		} else {
			return markers[color].indexOf(num) > -1;
		}
	};
	var removeMarker = function (color, num) {
		var i = markers[color].indexOf(num);
		if (i > -1) {
			markers[color].splice(i, 1);
		}
	};
	var containsAntOfColor = function (color) {
		return !!ant && ant.color === color;
	};
	var containsAntOfColorWithFood = function (color) {
		return containsAntOfColor(color) && ant.hasFood();
	};
	var depositFood = function (num) {
		if (typeof num === 'undefined') {
			food++;
		} else {
			food += num;
		}
	};
	var hasFood = function () { return food > 0; };
	var removeFood = function () {
		if (hasFood()) { food--; }
	};
	var isAvailable = function () { return !ant; };
	var moveAntHere = function (newAnt) {
		// not sure about these semantics
		var oldCell = newAnt.getCurrentCell();
		oldCell.removeAnt();
		setAnt(newAnt);
	};
	var removeAnt = function () { ant = null; };
	var setAnt = function (newAnt) {
		ant = newAnt;
		ant.row = row;
		ant.col = col;
	};
	var getAnt = function () { return ant; };
	var getFood = function () { return food; };

	return {
		row: row,
		col: col,
		type: type,
		getAnt: getAnt,
		toString: toString,
		addMarker: addMarker,
		hasMarker: hasMarker,
		removeMarker: removeMarker,
		containsAntOfColor: containsAntOfColor,
		containsAntOfColorWithFood: containsAntOfColorWithFood,
		depositFood: depositFood,
		hasFood: hasFood,
		getFood: getFood,
		removeFood: removeFood,
		isAvailable: isAvailable,
		moveAntHere: moveAntHere,
		removeAnt: removeAnt,
		setAnt: setAnt
	};
}
exports.WorldCell = WorldCell;

delete exports.test_only;
return exports;
})();