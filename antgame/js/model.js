var model = (function () {

var exports = {};
/**
 * Ant
 * This function returns an object which represents an ant in our simulation.
 * @param id the unique id number of the ant
 * @param color the color of the ant. Should be either red or black
 * @param brain the list of instruction functions which act upon the ant
 * @param world the world in which this ant will be deployed
 */
function Ant(id, color, brain, world) {

	// initialise variables
	this.color = color;
	this.otherColor = color === "red" ? "black" : "red";
	this.id = id;
	this.state = 0;
	this.dir = 0;
	this.resting = 0;
	this.food = 0;
	this.alive = true;
	this.cell = null;

	/**
	 * Kills the ant, deposits food
	 */
	this.kill = function () {
		this.cell.depositFood(3 + this.food);
		this.cell.removeAnt();
		this.alive = false;
		this.step = function () {};
	};


	/**
	 * Returns true if the ant is carrying food
	 */
	this.hasFood = function () {
		return this.food === 1; 
	};


	var count, d;
	/**
	 * Checks adjacent cells for enemies. If there are 5 or 6, kills this ant.
	 */
	this.checkForDeath = function () {
		count = 0; // count number of cells not containing enemies
		// iterate over directions
		for (d = 0; d < 6; d++) {
			if (!this.cell.adjacentCells[d].containsAntOfColor(this.otherColor)) {
				count++;
				// if we've seen two cells with no enemies, just return
				if (count > 1) {
					return;
				}
			}
		}
		// at least 5 enemies adjacent to this ant, so death.
		this.kill();
	};

	var enemies = [null, null, null, null, null, null];
	var enemyPointer = -1;
	var i = 0;

	/**
	 * Iterates over adjacent cells and checks for enemy deaths
	 * also checks this ant for death in the process
	 */
	this.checkForAdjacentDeaths = function () {
		enemyPointer = -1;
		d = 6;
		while (d--) {
			if (this.cell.adjacentCells[d].containsAntOfColor(this.otherColor)) {
				enemies[++enemyPointer] = this.cell.adjacentCells[d].getAnt();
			}
		}
		if (enemyPointer > 3) {
			this.kill();
		} else {
			enemyPointer++;
			while (enemyPointer--) {
				enemies[enemyPointer].checkForDeath();
			}
		}
		
	};


	/**
	 * Causes the ant to rest for 14 iterations
	 */
	this.rest = function () {
		this.resting = 14;
		this.step = function () {
			if (--this.resting === 0) {
				this.step = execute;
			}
		};
	};

	// execute next instrction
	var execute = function () {
		brain[this.state](this);
	};

	/**
	 * Causes the ant to do whatever it is supposed to do for this
	 * particular iteration.
	 */
	this.step = execute;

	/**
	 * Returns a string represenation of the ant
	 */
	this.toString = function () {
		return this.color + " ant of id " + this.id + ", dir " + 
		       this.dir + ", food " + this.food + ", state " + 
		       this.state + ", resting " + this.resting;
	};
}
exports.Ant = Ant;
/**
 * AntBrain
 * This function returns a numbered list of instruction functions which act 
 * upon an ant, causing it to do things.
 * @param states An object representing the various instructions to be 
 *        compiled.
 * @param color The color of the ant. Should be either red or black.
 * @param rng The pseudo-random number generator the ant should use to make 
 *        flip choices.
 * @param foodCallback (optional) The callback to execute when food is picked 
 *        up or dropped. Takes parameters (row, col, food)
 *        @param row The row of the cell concerned
 *        @param col The column of the cell concerned
 *        @param food The amount of food currently in the cell concerned
 * @param markCallback (optional) The callback to execute when a marker is 
 *        placed. Takes parameters (row, col, color, marker)
 *        @param row The row of the cell concerned
 *        @param col The column of the cell concerned
 *        @param color The color of the ant concerned
 *        @param marker The id of the marker placed
 * @param unmarkCallback (optional) The callback to execute when a marker is 
 *        removed. Takes parameters (row, col, color, marker)
 *        @param row The row of the cell concerned
 *        @param col The column of the cell concerned
 *        @param color The color of the ant concerned
 *        @param marker The id of the marker removed
 */
function AntBrain(states, color, rng, foodCallback, markCallback, unmarkCallback) {
	var otherColor = color === "red" ? "black" : "red";

	// These so-called "sense condition evaluators" are functions which take
	// a particular world cell as parameter and return true or false based
	// on whether that cell satisfies a particular condition. The conditions
	// are those available for use in the 'sense' instruction of the ant brain 
	// language
	var senseConditionEvaluators = {
		"friend": function (senseCell) {
			return senseCell.containsAntOfColor(color); 
		},
		"foe": function (senseCell) {
			return senseCell.containsAntOfColor(otherColor); 
		},
		"friendwithfood": function (senseCell) {
			return senseCell.containsAntOfColorWithFood(color); 
		},
		"foewithfood": function (senseCell) {
			return senseCell.containsAntOfColorWithFood(otherColor); 
		},
		"food": function (senseCell) {
			return senseCell.hasFood(); 
		},
		"rock": function (senseCell) {
			return senseCell.type === "rock"; 
		},
		"marker": function (senseCell, marker) {
			return senseCell.hasMarker(color, marker); 
		},
		"foemarker": function (senseCell) {
			return senseCell.hasMarker(otherColor);
		},
		"home": function (senseCell) {
			return senseCell.type === color + " hill"; 
		},
		"foehome": function (senseCell) {
			return senseCell.type === otherColor + " hill"; 
		}
	};

	// These so-called "sense cell finders" are functions which take as 
	// parameter the ant concerned, and return a nearby cell for use in
	// a sense condition evaluator. The cells returned are relative to the
	// ant's current position and are selected by the second "direction"
	// parameter in the 'sense' instruction of the ant brain language.
	var senseCellFinders = {
		"here": function (ant) { return ant.cell; },
		"ahead": function (ant) { return ant.cell.adjacentCells[ant.dir]; },
		"leftahead": function (ant) {
			return ant.cell.adjacentCells[(ant.dir + 5) % 6];
		},
		"rightahead": function (ant) {
			return ant.cell.adjacentCells[(ant.dir + 1) % 6]; 
		}
	};

	// These so-called "instructions" are functions which return functions.
	// That might sound crazy to a java programmer. The functions they
	// return carry out the necessary actions upon an ant as specified by
	// the individual states in the source code of an ant brain. The 
	// functions take an state definition object as parameter, and the returned
	// functions take an ant as parameter.
	var instructions = {
		"sense": function (state) {
			var getSenseCell = senseCellFinders[state.dir];
			var senseSuccess = senseConditionEvaluators[state.condition];
			/**
			 * Abstract 'Sense' instruction
			 * if some condition is true in some cell, set the ant's state
			 * to st1, otherwise set it to st2
			 * @param ant The ant
			 */
			return function (ant) {
				if (senseSuccess(getSenseCell(ant), state.marker)) {
					ant.state = state.st1;
				} else {
					ant.state = state.st2;
				}
			};
		},
		"mark": function (state) {
			/**
			 * Abstract 'Mark' instruction
			 * Add a marker to the ant's current cell and go to st
			 * @param ant The ant
			 */
			return function (ant) {
				ant.cell.addMarker(ant.color, state.marker);
				ant.state = state.st;
				markCallback && markCallback(ant.cell.row, ant.cell.col, ant.color, state.marker);
			};
		},
		"unmark": function (state) {
			/**
			 * Abstract 'Unmark' instruction
			 * Remove a marker from the ant's current cell and go to st
			 * @param ant The ant
			 */
			return function (ant) {
				ant.cell.removeMarker(ant.color, state.marker);
				ant.state = state.st;
				unmarkCallback && unmarkCallback(ant.cell.row, ant.cell.col, ant.color, state.marker);
			};
		},
		"pickup": function (state) {
			/**
			 * Abstract 'PickUp' instruction
			 * If the ant can pick up food, make it pick up the food, and go to
			 * st1, otherwise go to st2
			 * @param ant The ant
			 */
			return function (ant) {
				if (ant.cell.hasFood() && !ant.hasFood()) {
					ant.cell.removeFood();
					ant.food = 1;
					ant.state = state.st1;
					foodCallback && foodCallback(ant.cell.row, ant.cell.col, ant.cell.getFood());
				} else {
					ant.state = state.st2;
				}
			};
		},
		"drop": function (state) {
			/**
			 * Abstract 'drop' instruction
			 * If the ant has food, drop it in it's current cell
			 * @param ant The ant
			 */
			return function (ant) {
				if (ant.food === 1) {
					ant.cell.depositFood();
					ant.food = 0;
					foodCallback && foodCallback(ant.cell.row, ant.cell.col, ant.cell.getFood());
				}
				ant.state = state.st;
			};
		},
		"turn": function (state) {
			var turnAnt;
			if (state.dir === "left") {
				turnAnt = function (ant) { ant.dir = (ant.dir + 5) % 6; };
			} else {
				turnAnt = function (ant) { ant.dir = (ant.dir + 1) % 6; };
			}
			/**
			 * Abstract 'turn' instruction
			 * Turn the ant and go to st
			 * @param ant The ant
			 */
			return function (ant) {
				turnAnt(ant);
				ant.state = state.st;
			};
		},
		"move": function (state) {
			var ncell;
			/**
			 * Abstract 'move' instruction
			 * If the can move, move it and go to st1, otherwise go to st2.
			 * @param ant The ant
			 */
			return function (ant) {
				ncell = ant.cell.adjacentCells[ant.dir];
				if (ncell.isAvailable()) {
					ant.cell.removeAnt();
					ncell.setAnt(ant);
					ant.state = state.st1;
					ant.rest();
					ant.checkForAdjacentDeaths();
				} else {
					ant.state = state.st2;
				}
			};
		},
		"flip": function (state) {
			/**
			 * Abstract 'flip' instruction
			 * Get a random number < p. If it's 0, go to st1, otherwise go to
			 * st2
			 * @param ant The ant
			 */
			return function (ant) {
				if (rng.next(state.p) === 0) {
					ant.state = state.st1;
				} else {
					ant.state = state.st2;
				}
			};
		}
	};

	// construct list of instruction functions
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
instrParsers['se'] = function (line) {
	var match = line.match(/^sense (ahead|leftahead|rightahead|here) (\d+) (\d+) (friend|foe|friendwithfood|foewithfood|food|rock|foemarker|home|foehome|marker \d)$/);
	if (match) {
		var condition = match[4];
		var marker = -1;
		// if the sense condition is 'Marker', we need to extract the
		// relevant marker id
		if (condition.indexOf("marker") === 0) {
			marker = _parseInt(condition.substr(7, 1));
			condition = "marker";
		}
		return {
			type: "sense",
			dir: match[1],
			condition: condition,
			marker: marker,
			st1: _parseInt(match[2]),
			st2: _parseInt(match[3])
		};
	} 
};

// Mark/Unmark instructions
instrParsers['un'] = instrParsers['ma'] = function (line) {
	var match = line.match(/^(mark|unmark) (\d+) (\d+)$/);
	if (match) {
		return {
			type: match[1],
			st: _parseInt(match[3]),
			marker: _parseInt(match[2])
		};
	} 
};

// PickUp/Move instructions
instrParsers['pi'] = instrParsers['mo'] = function (line) {
	var match = line.match(/^(pickup|move) (\d+) (\d+)$/);
	if (match) {
		return {
			type: match[1],
			st1: _parseInt(match[2]),
			st2: _parseInt(match[3])
		};
	}
};

// Drop instructions
instrParsers['dr'] = function (line) {
	var match = line.match(/^drop (\d+)$/);
	if (match) {
		return {
			type: "drop",
			st: _parseInt(match[1])
		};
	}
};

// Turn instructions
instrParsers['tu'] = function (line) {
	var match = line.match(/^turn (left|right) (\d+)$/);
	if (match) {
		return {
			type: "turn",
			dir: match[1],
			st: _parseInt(match[2])
		};
	}
};

// Flip instructions
instrParsers['fl'] = function (line) {
	var match = line.match(/^flip (\d+) (\d+) (\d+)$/);
	if (match) {
		return { 
			type: "flip",
			p: _parseInt(match[1]),
			st1: _parseInt(match[2]),
			st2: _parseInt(match[3])
		};
	}
};

function _parseLine(line) {
	var firstTwoChars = line.substr(0, 2);
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

	// remove comments and trim
	for (var i = lines.length - 1; i >= 0; i--) {
		lines[i] = lines[i].replace(/;.*$/, "").trim().toLowerCase();
	}

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
		if (states.length > 10000) {
			throw new BrainParseError("Too many states. Limit is 10000.", i + 1);
		}
	}

	if (states.length === 0) {
		throw new BrainParseError("No states given", 1);
	}

	// we need to check if there are too many states or if there are any
	// instructions which point to nonexistent states or any marker ids > 5
	var highestStateIndex = states.length - 1;
	// iterate over states
	for (var i = 0; i <= highestStateIndex; i++) {
		// get maximum state referenced by this instruction
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
/**
 * AntGame objects represent a match between two ant brains on a specific
 * world.
 * @param redBrain the brain of the ants on the red team
 * @param blackBrain the brain of the ants on the black team
 * @param world the world in which the ants compete
 */
function AntGame(redBrain, blackBrain, world) {
	var red_hill_cells = [];
	var black_hill_cells = [];
	var ants = [];
	var id = 0; // to assign ants with unique ids
	// populate world with ants
	for (var row = 0; row < world.height; row++) {
		for (var col = 0; col < world.width; col++) {
			var cell = world.getCell(row, col);
			if (cell.type === "black hill") {
				black_hill_cells.push(cell);
				var ant = new Ant(id++, "black", blackBrain, world);
				ants.push(ant);
				cell.setAnt(ant);
			} else if (cell.type === "red hill") {
				red_hill_cells.push(cell);
				var ant = new Ant(id++, "red", redBrain, world);
				ants.push(ant);
				cell.setAnt(ant);
			}
		}
	}
	var numAnts = ants.length;

	/**
	 * Runs the game in a tight loop for the given number of iterations
	 * @param iterations the number of iterations to run the game for
	 */
	var run = function (iterations) {
		for (var i = 0; i < iterations; i++) {
			for (var id = 0; id < numAnts; id++) {
				ants[id].step();
			}
		}
	};

	/**
	 * Returns an object containing the scores of the two teams
	 * Also how many dead ants there are.
	 * @returns the team scores and number of dead ants
	 */
	var getScore = function () {
		var score = {
			red: {
				food: 0,
				deaths: 0
			},
			black: {
				food: 0,
				deaths: 0
			}
		};

		//iterate over hill cells and add food to score
		for (var i = black_hill_cells.length - 1; i >= 0; i--) {
			score.black.food += black_hill_cells[i].getFood();
		}
		for (var i = red_hill_cells.length - 1; i >= 0; i--) {
			score.red.food += red_hill_cells[i].getFood();
		}

		// iterate over ants and check for deaths
		for (var i = ants.length - 1; i >= 0; i--) {
			if (ants[i].alive === false) {
				score[ants[i].color].deaths += 1;
			}
		}

		return score;
	};

	/**
	 * iterates over the live ants in the world and calls callback
	 * @param callback the callback. takes the ant as parameter
	 */
	var withAnts = function (callback) {
		for (var i = ants.length - 1; i >= 0; i--) {
			callback(ants[i]);
		}
	};

	return {
		run: run,
		getScore: getScore,
		withAnts: withAnts
	};
}
exports.AntGame = AntGame;
/**
 * AntWorld
 * This function returns an object which provides access to a hexagonal grid of
 * WorldCell objects.
 * @param parsedGrid A grid of objects representing the cells to be placed in
 *        the world. I.E. The result of a successful call to parseAntWorld.
 */
function AntWorld(parsedGrid) {
	// copy world dimensions
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

	/**
	 * Returns a string representation of the world
	 * @returns a string representation of the world
	 */
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

	// Each function in this list returns a cell adjacent to the one specified
	// by the (row, col) parameters. The index of the function in the array
	// determines the direction of the cell returned relative to the position
	// of the one at (row, col);
	var adjacentGetters = [
		function (row, col) { return grid[row][col + 1]; },
		function (row, col) { return grid[row + 1][col + 1 * (row % 2)]; },
		function (row, col) { return grid[row + 1][col + 1 * ((row % 2) - 1)]; },
		function (row, col) { return grid[row][col - 1]; },
		function (row, col) { return grid[row - 1][col + 1 * ((row % 2) - 1)]; },
		function (row, col) { return grid[row - 1][col + 1 * (row % 2)]; }
	];
	
	/**
	 * Returns the cell adjacent to the one at (row, col) in direction dir
	 * @param row The row of the base cell
	 * @param col The column of the base cell
	 * @param dir The direction in which the cell to be returned lies relative
	 *        to the base cell
	 * @returns the desired adjacent cell, or null if none exists.
	 */
	function getAdjacentCell(row, col, dir) {
		try {
			return adjacentGetters[dir](row, col);
		} catch (err) {
			return null;
		}
	}

	/**
	 * Returns all cells surrounding the one at (row, col)
	 * @param row The row of the base cell
	 * @param col The column of the base cell
	 * @returns a list of length 6, where the index represents the direction
	 *          in which the cell lies relative to the base cell. List elements
	 *          will be null if no cell lies in the relevant direction.
	 */
	function getAllAdjacentCells(row, col) {
		var cells = [];
		for (var dir = 0; dir < 6; dir++) {
			cells.push(getAdjacentCell(row, col, dir));
		}
		return cells;
	}

	/**
	 * Returns the cell at (row, col)
	 * @param row The row of the cell
	 * @param col The column of the cell
	 */
	function getCell(row, col) {
		return grid[row][col];
	}


	// cache adjacent cells
	for (var row = 0; row < height; row++) {
		for (var col = 0; col < width; col++) {
			grid[row][col].adjacentCells = getAllAdjacentCells(row, col);
		}
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
		throw new Error("The ant world must contain at least one red hill");
	}
	if (!_gridContains(grid, "-")) {
		throw new Error("The ant world must contain at least one black hill");
	}
	if (!_gridContains(grid, "f")) {
		throw new Error("The ant world must contain at least one source of food");
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

/**
 * private function to parse a single line
 * @param line The text of the particular line
 * @param oddLine Should be true if the number of the line is odd
 * @supposedWidth The expected number of elements on the line
 * @returns a list of objects indicating the types of cells on the line
 */
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

/**
 * private function to check that there are no gaps around the edges of the
 * grid
 * @param grid The grid
 * @returns true if no gaps, false otherwise
 */
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

/**
 * private function to search the grid for a particular cell type
 * @param grid The grid
 * @param targetType the type to search for
 * @returns true if target type found, false otherwise
 */
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

/*****************************************************************************/
/******* OK. Shit gets a bit crazy from here on in. Hold onto your hat *******/
/*****************************************************************************/

/**
 * Private function
 * Returns a list of 2D arrays which represent the shape of elements of the
 * specified target type. An 'element' here is a contiguous region of one
 * particular cell type.
 * @param grid The grid
 * @param targetType
 * @returns a list of elements
 */
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


/**
 * Private function
 * Takes a list of coordinates and places them in a 2D boolean array, or "box",
 * bounding them in the process.
 * @coords the coordinates to bound and box
 * @returns the box
 */
function _getElementBox(coords) {
	// find min and max rows and cols
	var minRow = coords[0].row,
		maxRow = coords[0].row,
		minCol = coords[0].col,
		maxCol = coords[0].col;

	for (var i = 0, len = coords.length; i < len; i++) {
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


/**
 * private function
 * Gets all the coordinates which comrpise an element by taking the coords of a
 * starting cell, and recrusing outwards towards the bounds of the element.
 * As a secondary goal, this function checks whether or not ant hills are 
 * directly next to rocks or other ant hills. Yeah it's kinda ugly to mix 
 * functionality like that, but this was a perfect place to just drop in the code
 * and I couldn't figure out how to neatly abstract the recursive exploration
 * stuff. Plus its private so whatever.
 * @param grid The grid
 * @param row The row of the starting cell
 * @param col The column of the starting cell
 */
function _getElementCoords(grid, row, col) {
	var targetType = grid.cells[row][col].type;
	var visitedCells = [];
	var elementCoords = [];

	/**
	 * do the recursive exploration
	 */
	function visitCell(row, col) {
		// if there is a cell here and we haven't seen it before
		if (row >= 0 && row < grid.height && 
		    col >= 0 && col < grid.width &&
		    visitedCells.indexOf(grid.cells[row][col]) === -1) {

			// push this cell to visitedCells
			visitedCells.push(grid.cells[row][col]);

			if (grid.cells[row][col].type === targetType) {
				// this cell is part of the element so note its
				// coords
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

/**
 * private function
 * Gets the coords of the cell adjacent to the cell at (row, col) in the
 * specified direction
 * @param row The row of the starting cell
 * @param col The column of the starting cell
 * @param direction The direction
 */
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

/*****************************************************************************/
/******* Stuffs to check for things being the right shape and whatnot ********/
/************************* shit gets even crazier ****************************/
/*****************************************************************************/

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

/**** EVEN ONES FIRST ****/
// xxxxx  
// xxxxx  
//  xxxxx 
//  xxxxx 
//   xxxxx
foodOverlays[0][0].push([true, true, true, true, true, false, false]);
foodOverlays[0][0].push([true, true, true, true, true, false, false]);
foodOverlays[0][0].push([false, true, true, true, true, true, false]);
foodOverlays[0][0].push([false, true, true, true, true, true, false]);
foodOverlays[0][0].push([false, false, true, true, true, true, true]);
//   xxxxx
//  xxxxx 
//  xxxxx 
// xxxxx  
// xxxxx  
foodOverlays[0][1].push([false, false, true, true, true, true, true]);
foodOverlays[0][1].push([false, true, true, true, true, true, false]);
foodOverlays[0][1].push([false, true, true, true, true, true, false]);
foodOverlays[0][1].push([true, true, true, true, true, false, false]);
foodOverlays[0][1].push([true, true, true, true, true, false, false]);
//   x  
//  xx  
//  xxx 
// xxxx 
// xxxxx
// xxxx 
//  xxx 
//  xx  
//   x  
foodOverlays[0][2].push([false, false, true, false, false]);
foodOverlays[0][2].push([false, true, true, false, false]);
foodOverlays[0][2].push([false, true, true, true, false]);
foodOverlays[0][2].push([true, true, true, true, false]);
foodOverlays[0][2].push([true, true, true, true, true]);
foodOverlays[0][2].push([true, true, true, true, false]);
foodOverlays[0][2].push([false, true, true, true, false]);
foodOverlays[0][2].push([false, true, true, false, false]);
foodOverlays[0][2].push([false, false, true, false, false]);

/**** NOW ODD ONES ****/
// xxxxx  
//  xxxxx 
//  xxxxx 
//   xxxxx
//   xxxxx
foodOverlays[1][0].push([true, true, true, true, true, false, false]);
foodOverlays[1][0].push([false, true, true, true, true, true, false]);
foodOverlays[1][0].push([false, true, true, true, true, true, false]);
foodOverlays[1][0].push([false, false, true, true, true, true, true]);
foodOverlays[1][0].push([false, false, true, true, true, true, true]);
//   xxxxx
//   xxxxx
//  xxxxx 
//  xxxxx 
// xxxxx  
foodOverlays[1][1].push([false, false, true, true, true, true, true]);
foodOverlays[1][1].push([false, false, true, true, true, true, true]);
foodOverlays[1][1].push([false, true, true, true, true, true, false]);
foodOverlays[1][1].push([false, true, true, true, true, true, false]);
foodOverlays[1][1].push([true, true, true, true, true, false, false]);
//   x  
//   xx 
//  xxx 
//  xxxx
// xxxxx
//  xxxx
//  xxx 
//   xx 
//   x  
foodOverlays[1][2].push([false, false, true, false, false]);
foodOverlays[1][2].push([false, false, true, true, false]);
foodOverlays[1][2].push([false, true, true, true, false]);
foodOverlays[1][2].push([false, true, true, true, true]);
foodOverlays[1][2].push([true, true, true, true, true]);
foodOverlays[1][2].push([false, true, true, true, true]);
foodOverlays[1][2].push([false, true, true, true, false]);
foodOverlays[1][2].push([false, false, true, true, false]);
foodOverlays[1][2].push([false, false, true, false, false]);

/**
 * private function
 * determines whether a "box" (boolean grid) represents shapes which are legal
 * food blobs.
 * @param box
 * @returns true if shapes are legal, false otherwise
 */
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

/**
 * private function
 * attempts to overlay a shape onto the box. if it succeeds, the matched area
 * is falsified and the box is cropped before being returned
 * @param box The box
 * @param overlay The shape to attempt to overlay
 * @returns cropped box on success, undefined on failure.
 */
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

/**
 * private function
 * clones a box
 * @param box The box to clone
 * @returns the clone
 */
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

/**
 * private function
 * crops a box such that there is no padding of falses
 * @param box The box to crop
 * @returns a copy of the box but cropped
 */
function _cropBox(box) {
	box = _cloneBox(box);
	// returns true if box contains stuff
	function boxHasDimensions() {
		return box.config.length > 0 && box.config[0].length > 0;
	}
	// returns true if a particular column of the box is empty
	// @param n The column id
	function colIsEmpty(n) {
		for (var row = 0; row < box.config.length; row++) {
			if (box.config[row][n]) {
				return false;
			}
		}
		return true;
	}
	// returns true if a particular row of the box is empty
	// @param n The row id
	function rowIsEmpty(n) {
		for (var col = 0; col < box.config[n].length; col++) {
			if (box.config[n][col]) {
				return false;
			}
		}
		return true;
	}
	// deletes a column from the box
	// @param n The id of the column to delete
	function deleteCol(n) {
		for (var row = 0; row < box.config.length; row++) {
			box.config[row].splice(n, 1);
		}
	}
	// deletes a row from the box
	// @param n The id of the row to delete
	function deleteRow(n) {
		box.config.splice(n, 1);
	}
	// now this following stuff is hella easy to read
	while (boxHasDimensions() && rowIsEmpty(0)) {
		deleteRow(0);
		box.topRow++; // boxes need to know the id of the top row for odd/even
		              // row distinction
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

/**
 * private function
 * determines if the shape in the box represents a legal hill
 * @param box The box
 * @returns true if legal hill, false otherwise
 */
function _isLegalHill(box) {
	// we can check the dimensions of the box first
	if (box.config.length !== 13 ||
		box.config[0].length !== 13) {
		return false;
	}
	// decides if a particular row is legal
	// @param n The row to check
	function isLegalRow(n) {
		// yeah... this stuff is a bit hard to read.
		// it basically figures out how many cells should be on the given row,
		// and at which index they should first appear, then checks if they are
		// all there.
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

// that was pretty difficult
/**
 * RandomNumberGenerator
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

exports.RandomNumberGenerator = RandomNumberGenerator;
exports.test_only = exports.test_only || {};

/**
 * Generates pseudo-random worlds in the form of source code
 * @returns the source code of a pseudo-random world which is contest legal
 */
function generateRandomWorld() {
	// make blank grid with rocks around the edges
	var grid = [];
	grid[0] = [];
	grid[149] = [];
	// do top and bottom rows first. full of them rocks!
	for (var i = 0; i < 150; i++) {
		grid[0].push("#");
		grid[149].push("#");
	}
	// now all the other rows
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


	// the bits of code that look the bit below this do two things:
	//     1. Get some random coords
	//     2. Try to put something at those coords
	// They do this until they succeed, or until the safety counter gets to 0.
	// if that happens, a recursive call is made in the hopes that it won't 
	// happen again

	
	// red hill	
	do {
		if (!(safetyCounter--)) { return generateRandomWorld(); }
		randCol = Math.floor(Math.random() * 150);
		randRow = Math.floor(Math.random() * 150);
	} while (!_superimpose(grid, hillShape, randRow, randCol, "+"));

	// black hill
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

/**
 * private function
 * Draws a random rock shape onto the grid
 * @param grid The grid
 */
function _drawRandomRock(grid) {
	var shape = rockShapes[Math.floor(Math.random() * rockShapes.length)];
	var row, col;
	var paintDirection = Math.floor(Math.random() * 6);
	var paintOperations = 30 + Math.floor(Math.random() * 50);
	var lastTurn = -1;

	// chooses the next paint direction at random
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

	// moves the paintbrush in the current direction with respect to 
	// odd and even rows
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

	
	// we had to use "t" for "temp" instead of hashes when painting so...
	// replace "t"s with "#"s.
	for (row = 0; row < 150; row++) {
		for (col = 0; col < 150; col++) {
			if (grid[row][col] === "t") {
				grid[row][col] = "#";
			}
		}
	}

	// all done.
}

/**
 * private funciton
 * attempts to superimpose a shape onto the grid
 * @param grid The grid
 * @param shape The shape
 * @param row The row at which to position the top of the shape
 * @param col The column at which to position the left edge of the shape
 * @param type The type of cell to place if a superimposition is possible.
 *        Think of it like a color of paint.
 */
function _superimpose(grid, shape, row, col, type) {
	var oddRow = row % 2 === 1;
	// check that there's enough room on the grid
	if (row < 0 || col < 0 ||
		150 - row < shape.length ||
		150 - col < shape[0].length ||
		!oddRow && col === 0) {
		return false;
	}

	// check that there's nothing of import underneath
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

// in the following shapes, the "*"s act as padding so that we don't get things
// next to each other that shouldn't be next to each other.

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
/**
 * private function
 * @returns false
 */
function _returnFalse() { return false; }

/**
 * WorldCell
 * This funciton returns an object which represents a hexagonal cell in the ant
 * world.
 * @param cell A cell object from a parsed ant world (something like {type: "."})
 * @param row The row at which the cell will be found
 * @param col The column at which the cell will be found
 * @returns the WorldCell object.
 */
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
			red: [false, false, false, false, false, false],
			black: [false, false, false, false, false, false]
		},
		markerCounts = {
			red: 0,
			black: 0
		};

	
	/***** update type *****/
	var type = cell.type === "+" ? "red hill"
			: cell.type === "-" ? "black hill"
			: "clear";
	
	/**
	 * @returns a string representation of the cell
	 */
	var toString = function () {
		var s = "";
		// food comes first
		if (food > 0) { s += food + " food; "; }
		// then color of hill if hill
		if (type !== "clear") { s += type + "; "; }
		// then red markers
		if (markerCounts.red > 0) {
			s += "red marks: ";
			for (var i = 0; i < markers.red.length; i++) {
				if (markers.red[i]) {
					s += i;
				}
			}
			s += "; ";
		}
		// black markers
		if (markerCounts.black > 0) {
			s += "black marks: ";
			for (var i = 0; i < markers.black.length; i++) {
				if (markers.black[i]) {
					s += i;
				}
			}
			s += "; ";
		}
		// finally the ant if there is one
		if (!!ant) { s += ant.toString(); }
		return s.trim();
	};

	/**
	 * add a marker to the cell
	 * @param color The color of the ant who placed the marker
	 * @param num The marker id
	 */
	var addMarker = function (color, num) {
		if (!markers[color][num]) {
			markers[color][num] = true;
			markerCounts[color]++;
		}
	};

	/**
	 * Checks whether a particular marker is in this cell
	 * @param color The color of the marker to check for
	 * @param num (optional) The marker id.
	 * @returns true if the specified marker is in the cell. If num is not
	 *          included, returns true if the cell contains any marker of the
	 *          specified color. False otherwise.
	 */
	var hasMarker = function (color, num) {
		if (typeof num === 'undefined') {
			return markerCounts[color] > 0;
		} else {
			return markers[color][num];
		}
	};

	/**
	 * removes a marker from this cell
	 * @param color The color of the marker to remove
	 * @param num The marker id.
	 */
	var removeMarker = function (color, num) {
		if (markers[color][num]) {
			markers[color][num] = false;
			markerCounts[color]--;
		}
	};

	/**
	 * checks whether this cell contains an ant of a particular color
	 * @param color The color to check for
	 * @returns true if the cell contains an ant of color color. false otherwise
	 */
	var containsAntOfColor = function (color) {
		return !!ant && ant.color === color;
	};

	/**
	 * checks whether this cell contains an ant of a parituclar color who is
	 * carrying food.
	 * @param color The color to check for
	 * @returns true if the cell contains an ant of color color carrying food. 
	 *          false otherwise
	 */
	var containsAntOfColorWithFood = function (color) {
		return containsAntOfColor(color) && ant.hasFood();
	};

	/**
	 * Puts some amount of food in this cell
	 * @param num The amount of food to put in this cell
	 */
	var depositFood = function (num) {
		if (typeof num === 'undefined') {
			food++;
		} else {
			food += num;
		}
	};

	/**
	 * checks whether this cell contains food
	 * @returns true if food, false otherwise
	 */
	var hasFood = function () { return food > 0; };

	/**
	 * removes one food particle from the cell, if there is any to remove
	 */
	var removeFood = function () {
		if (hasFood()) { food--; }
	};

	/**
	 * Checks whether this cell is available (i.e. there is no ant here)
	 * @returns true if no ant, false otherwise
	 */
	var isAvailable = function () { return !ant; };

	/**
	 * removes the ant from this cell
	 */
	var removeAnt = function () { ant = null; };

	/**
	 * sets an ant to be in this cell
	 * @param newAnt the ant to put in this cell
	 */
	var setAnt = function (newAnt) {
		ant = newAnt;
		ant.cell = this;
	};

	/**
	 * gets the ant currently in this cell
	 * @returns the ant currently in this cell
	 */
	var getAnt = function () { return ant; };

	/**
	 * gets the amount of food currently in this cell
	 * @returns the amount of food currently in this cell
	 */
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
		removeAnt: removeAnt,
		setAnt: setAnt
	};
}
exports.WorldCell = WorldCell;

delete exports.test_only;
return exports;
})();