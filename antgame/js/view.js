var view = (function () {

var exports = {};
function LogicalGroup(events, textElems) {
	this.events = events;
	this.callbacks = {};
	this.textElems = textElems;

	for (var i = events.length - 1; i >= 0; i--) {
		this.callbacks[events[i].name] = [];
	};

	this.on = function (evnt, callback, overwrite) {
		if (Array.isArray(this.callbacks[evnt]) && typeof callback === "function") {
			if (overwrite) {
				this.callbacks[evnt] = [];
			}
			this.callbacks[evnt].push(callback);
		}
	};

	this.text = function (elem, text) {
		if (this.textElems[elem]) {
			if (typeof text === 'string') {
				this.textElems[elem].set(text);
			} else {
				return this.textElems[elem].get();
			}
		}
	};

	this.trigger = function (evnt, argsArray) {
		if (Array.isArray(this.callbacks[evnt])) {
			// iterate over callbacks and call them!

			for (var i = this.callbacks[evnt].length - 1; i >= 0; i--) {
				this.callbacks[evnt][i].apply(this, argsArray);
			};
		}
	};

	this.init = function () {
		var that = this;
		for (var i = this.events.length - 1; i >= 0; i--) {
			var evnt = this.events[i].name;
			this.events[i].binder((function (evnt) {
				return function () {
					// iterate over callbacks and call them!
					for (var i = that.callbacks[evnt].length - 1; i >= 0; i--) {
						that.callbacks[evnt][i].apply(this, arguments);
					};
				};
			})(evnt));
		};
	};
}
function getItemList (events, textElems, baseElem) {
	var highlighted = 0;
	var list = new LogicalGroup(events, textElems);
	list.add = function (name, id, preset) {
		// compile individual html elements
		var list_item = world_name = btn_group = edit_btn = del_btn = pick_btn = "";
		list_item  += "<li class='ag-" + baseElem + "-item' id='" + id + "'>";
		
		world_name += "<a href='#'>";
		world_name +=   name;
		
		btn_group  +=     "<div class='btn-group pull-right'>"
		
		if (!preset) { // only include delet  & edit button for custom brains
			del_btn +=      "<a class='btn btn-mini btn-danger' href='#'>";
			del_btn +=        "<i class='icon-remove-sign icon-white'></i>";
			del_btn +=      "</a>";

			edit_btn +=     "<a class='btn btn-mini btn-warning' href='#'>";
			edit_btn +=       "<i class='icon-pencil icon-white'></i>";
			edit_btn +=     "</a>";
		}
		
		pick_btn   +=       "<a class='btn btn-mini btn-success' href='#'>";
		pick_btn   +=         "use &raquo;";
		pick_btn   +=       "</a>";

		btn_group  +=     "</div>"

		world_name +=   "</a>";

		list_item  += "</li>";

		// attach the html elements to the DOM and set up events & callbacks

		var li = $(list_item).prependTo("#ag-" + baseElem + "-list");
		var a = $(world_name).appendTo(li);

		var btns = $(btn_group).appendTo(a).hide();

		var that = this;

		if (!preset) {
			var del = $(del_btn).appendTo(btns);
			del.click(function (event) { 
				event.stopPropagation();
				that.trigger("delete", [id, highlighted]); 
			});

			var edit = $(edit_btn).appendTo(btns);
			edit.click(function () { that.trigger("edit", [id]); });
		}

		var pick = $(pick_btn).appendTo(btns);
		pick.click(function (event) { 
			event.stopPropagation();
			that.trigger("pick", [id]); 
		});

		li.hover(
			function (event) {
				btns.show();
			},
			function (obj) {
				btns.hide();
			}
		);

		
		li.click(function () { that.trigger("select", [id]); });
	};

	list.highlight = function (id) {
		$(".ag-" + baseElem + "-item[id='" + highlighted + "']").removeClass("active");
		$(".ag-" + baseElem + "-item[id='" + id + "']").addClass("active");
		highlighted = id;
	};

	list.clear = function () {
		$("#ag-" + baseElem + "-list").html("");
	};

	list.remove = function (id) {
		$(".ag-" + baseElem + "-item[id='" + id + "']").remove();
	};

	list.sayEmpty = function (id) {
		$("#ag-" + baseElem + "-list").html('<li class="nav-header">empty</li>');
	};

	return list;
}

var LogicalGroup = LogicalGroup || function () {};

(function () {

var events = [
	{
		name: "add",
		binder: function (callback) {
			$("#ag-bl-add").click(callback);
		}
	},
	// these next four events are bound dynamically
	{
		name: "edit",
		binder: function () {}
	},
	{
		name: "pick",
		binder: function () {}
	},
	{
		name: "select",
		binder: function () {}
	},
	{
		name: "delete",
		binder: function () {}
	}
];

var textElems = {
	source: {
		get: function () { return $("#ag-bl-selected-source").html(); },
		set: function (text) { $("#ag-bl-selected-source").html(text); }
	}
};

exports.brain_list = getItemList(events, textElems, "bl");


})();
var getItemList = getItemList || function () {};

(function () {

var events = [
	{
		name: "add",
		binder: function (callback) {
			$("#ag-wl-add").click(callback);
		}
	},
	{
		name: "generate",
		binder: function (callback) {
			$("#ag-wl-gen").click(callback);
		}
	},
	// these next four events are bound dynamically
	{
		name: "edit",
		binder: function () {}
	},
	{
		name: "pick",
		binder: function () {}
	},
	{
		name: "select",
		binder: function () {}
	},
	{
		name: "delete",
		binder: function () {}
	}
];

exports.world_list = getItemList(events, {}, "wl");

exports.world_list.thumb = function (canvas) {
	$("#ag-wl-thumb").html("");
	$("#ag-wl-thumb").append(canvas);
};

})();



(function () {

var events = [
	{
		name: "go",
		binder: function (callback) {
			$("#ag-c-go").click(callback);
		}
	},
	{
		name: "play_all",
		binder: function (callback) {
			$("#ag-c-play-all").click(callback);
		}
	},
	{
		name: "play",
		binder: function () {} // bound dynamically
	},
	{
		name: "vis_off",
		binder: function (callback) {
			$(".ag-vis-on").click(function () {
				callback("off");
			});
		}
	},
	{
		name: "vis_on",
		binder: function (callback) {
			$(".ag-vis-off").click(function () {
				callback("on");
			});
		}
	},
	{
		name: "played_fixtures",
		binder: function (callback) {
			$("#ag-c-fix-played-link").click(callback);
		}
	},
	{
		name: "remaining_fixtures",
		binder: function (callback) {
			$("#ag-c-fix-rem-link").click(callback);
		}
	}
];

var textElems = {
	fixtures_played: {
		get: function () { $("#ag-c-fix-played-text").text(); },
		set: function (text) { $("#ag-c-fix-played-text").text(text); }
	},
	fixtures_remaining: {
		get: function () { $("#ag-c-fix-rem-text").text(); },
		set: function (text) { $("#ag-c-fix-rem-text").text(text); }
	}

};

exports.contest = new LogicalGroup(events, textElems);

exports.contest.showRemainingFixtures = function () {
	showHideFixtures("rem", "played");
	$("#ag-c-play-all").show();
};

exports.contest.showPlayedFixtures = function () {
	showHideFixtures("played", "rem");
	$("#ag-c-play-all").hide();
};

function showHideFixtures(toShow, toHide) {
	$("#ag-c-fix-" + toHide + "-link").parent().removeClass("active");
	$("#ag-c-fix-" + toHide).hide();
	$("#ag-c-fix-" + toShow + "-link").parent().addClass("active");
	$("#ag-c-fix-" + toShow).show();
}

exports.contest.populateRankings = function (rankedBrains) {
	var t = $("#ag-c-rankings");
	t.html("");
	t.append('<thead><tr><th>Rank</th><th>Brain</th><th>Played</th><th>Score</th></tr></thead>');

	var rank = 1;
	var numBrains = rankedBrains.length;
	for (var i = 0; i < numBrains; i++) {
		var row = "";
		row += "<tr>";
		row += "<td>" + rank + "</td>";
		row += "<td>" + rankedBrains[i].name + "</td>";
		row += "<td>" + rankedBrains[i].fixtures + "</td>";
		row += "<td>" + rankedBrains[i].score + "</td>";
		row += "</tr>";
		t.append(row);
		if (i < numBrains - 1 && rankedBrains[i].score !== rankedBrains[i + 1].score) {
			rank++;
		}
	}
};

exports.contest.populateRemainingFixtures = function (fixtures) {
	var numFixtures = fixtures.length;
	this.text("fixtures_remaining", numFixtures + "");
	var t = $("#ag-c-fix-rem");
	t.html("");
	t.append('<thead><tr><th>Red Brain</th><th>Black Brain</th><th>World</th></tr></thead>');
	if (numFixtures === 0) {
		t.append("<tr><td colspan='3'><span style='font-style: italic'>none</span></td></tr>")
		return;
	}

	for (var i = 0; i < numFixtures; i++) {
		var row = $("<tr></tr>").appendTo(t);
		$("<td>" + fixtures[i].red_name + "</td>").appendTo(row);
		$("<td>" + fixtures[i].black_name + "</td>").appendTo(row);
		$("<td>" + fixtures[i].world_name + "</td>").appendTo(row);
		var finalCell = $("<td style='border-left: none;'></td>").appendTo(row);
		var play_btn = $('<a class="btn btn-mini btn-primary pull-right"' + 
		                 'style="position:absolute; margin-left: -35px;">play &raquo;</a>').appendTo(finalCell).hide();

		with ({id: fixtures[i].id, that: this, pb: play_btn}) {
			play_btn.click(function () {
				that.trigger("play", [id]);
			});
			row.hover(function () { pb.show(); }, function () { pb.hide(); });
		}

	}
};

var colors = {
	win: "#A22",
	lose: "#000",
	draw: "#22A"
};

var team_colors = {
	red: {
		"0": colors["win"],
		"1": colors["draw"],
		"2": colors["lose"]
	},
	black: {
		"2": colors["win"],
		"1": colors["draw"],
		"0": colors["lose"]
	}
};

function getColoredName(color, name, outcome) {
	color = team_colors[color][outcome];
	return '<span style="color: ' + color + '">' + name + '</span>';
}

exports.contest.populatePlayedFixtures = function (fixtures) {
	var numFixtures = fixtures.length;
	this.text("fixtures_played", numFixtures + "");
	var t = $("#ag-c-fix-played");
	t.html("");
	t.append('<thead><tr><th>Red Brain</th><th>Black Brain</th><th>World</th></tr></thead>');
	if (numFixtures === 0) {
		t.append("<tr><td colspan='3'><span style='font-style: italic'>none</span></td></tr>")
		return;
	}

	for (var i = 0; i < numFixtures; i++) {
		var f = fixtures[i];
		var row = $("<tr></tr>").appendTo(t);
		var red_name = getColoredName("red", f.red_name, f.outcome);
		var black_name = getColoredName("black", f.black_name, f.outcome);
		$("<td>" + red_name + "</td>").appendTo(row);
		$("<td>" + black_name + "</td>").appendTo(row);
		$("<td>" + f.world_name + "</td>").appendTo(row);
	}
};

})();(function () {

function getContestList (baseElem) {
	var list = new LogicalGroup([
		{
			name: "add",
			binder: function (callback) {
				$("#ag-c-add-" + baseElem).click(callback);
			}
		},
		{
			name: "dismiss",
			binder: function () {}
		},
	], {});
	list.add = function (name, id) {
		// compile individual html elements
		var list_item = item_name = dismiss_btn = "";
		list_item  += "<tr class='ag-c-" + baseElem + "-item' id='" + id + "'>";
		
		item_name += "<td>";
		item_name +=   name;
		
		dismiss_btn += "<a class='btn btn-mini btn-warning pull-right rightmost' href='#'>";
		dismiss_btn +=   "dismiss &raquo;";
		dismiss_btn += "</a>";

		item_name +=   "</td>";

		list_item  += "</tr>";

		// attach the html elements to the DOM and set up events & callbacks

		var tr = $(list_item).prependTo("#ag-c-" + baseElem + "-list");
		var td = $(item_name).appendTo(tr);

		var dismiss = $(dismiss_btn).appendTo(td).hide();

		var that = this;

		dismiss.click(function (event) { 
			event.stopPropagation();
			that.trigger("dismiss", [id]); 
		});

		tr.hover(
			function (event) {
				dismiss.show();
			},
			function (obj) {
				dismiss.hide();
			}
		);
	};

	list.clear = function () {
		$("#ag-c-" + baseElem + "-list").html("");
	};

	list.remove = function (id) {
		$(".ag-c-" + baseElem + "-item[id='" + id + "']").remove();
	};

	list.sayEmpty = function (id) {
		$("#ag-c-" + baseElem + "-list").html('<tr><td><span style="font-style: italic">none selected</span></td></tr>');
	};

	return list;
}

exports.contest.worlds = getContestList("worlds");
exports.contest.brains = getContestList("brains");


})();
var LogicalGroup = LogicalGroup || function () {};

(function () {

var events = [
	{
		name: "cancel",
		binder: function (callback) {
			$(".ag-edit-close").click(callback);
		},
	},
	{
		name: "compile",
		binder: function (callback) {
			$("#ag-edit-compile").click(callback);
		}
	},
	{
		name: "name_change",
		binder: function (callback) {
			$("#ag-edit-name").change(function () {
				callback($("#ag-edit-name").val());
			});
		}
	}
];

var textElems = {
	title: {
		get: function () { return $("#ag-edit-title").html(); },
		set: function (text) { $("#ag-edit-title").html(text); }
	},
	name: {
		get: function () { return $("#ag-edit-name").attr("value"); },
		set: function (text) { $("#ag-edit-name").attr("value", text); }
	},
	code: {
		get: function () { return $("#ag-edit-code").attr("value"); },
		set: function (text) { $("#ag-edit-code").attr("value", text); }
	}
};

exports.edit = new LogicalGroup(events, textElems);

exports.edit.show = function () {
	$("#ag-edit").modal("show");
};

exports.edit.hide = function () {
	$("#ag-edit").modal("hide");
};

})();var LogicalGroup = LogicalGroup || function () {};

(function () {
	
var events = [
	{
		name: "goto_root",
		binder: function (callback) {
			$(".ag-btn-root").click(callback);
		}
	},
	{
		name: "goto_single_match",
		binder: function (callback) {
			$(".ag-btn-sm").click(callback);
		}
	},
	{
		name: "goto_contest",
		binder: function (callback) {
			$(".ag-btn-contest").click(callback);
		}
	}
];

exports.menu = new LogicalGroup(events, {});

var locations = {
	root: {
		prerequisites: [],
		description: "Main Menu",
		selector: ".ag-root"
	},
	single_match: {
		prerequisites: ["root"],
		description: "Single Match",
		selector: ".ag-sm"
	},
	run_sans: {
		prerequisites: [],
		description: "Run Without Graphics",
		selector: ".ag-run-sans"
	},
	run: {
		prerequisites: [],
		description: "Run With Graphics",
		selector: ".ag-run"
	},
	contest_setup: {
		prerequisites: ["root"],
		description: "Contest Setup",
		selector: ".ag-c"
	},
	contest: {
		prerequisites: ["root"],
		description: "Contest",
		selector: ".ag-cstats"
	},
	sm_pick_brain: {
		prerequisites: ["root","single_match"],
		description: "Pick Brain",
		selector: ".ag-bl"
	},
	sm_pick_world: {
		prerequisites: ["root","single_match"],
		description: "Pick World",
		selector: ".ag-wl"
	},
	c_pick_brain: {
		prerequisites: ["root","contest_setup"],
		description: "Pick Brains",
		selector: ".ag-bl"
	},
	c_pick_world: {
		prerequisites: ["root","contest_setup"],
		description: "Pick Worlds",
		selector: ".ag-wl"
	}
};

exports.menu.goto = function (location) {
	// if the location exists
	if (locations[location]) {
		// hide everything
		for (var loc in locations) {
			if (locations.hasOwnProperty(loc)) {
				var s = locations[loc].selector;
				$(s + ", " + s + "-bc").hide();	
			}
		}
	}
	// show this location
	$(locations[location].selector).show();
	// construct breadcrumb trail
	var preq = locations[location].prerequisites;
	for (var i = 0, len = preq.length; i < len; i++) {
		var s = locations[preq[i]].selector;
		$(s + "-bc").show();
	}
};

exports.menu.hideBreadcrumbs = function () {
	$("#ag-bread").hide();
	$("#ag-navbar").hide();
};

exports.menu.showBreadcrumbs = function () {
	$("#ag-bread").show();
	$("#ag-navbar").show();
};


})();var LogicalGroup = LogicalGroup || function () {};

(function () {

var events = [
	{
		name: "pick_red",
		binder: function (callback) {
			$("#ag-sm-pick-red").click(callback);
		}
	},
	{
		name: "pick_black",
		binder: function (callback) {
			$("#ag-sm-pick-black").click(callback);
		}
	},
	{
		name: "pick_world",
		binder: function (callback) {
			$("#ag-sm-pick-world").click(callback);
		}
	},
	{
		name: "rounds_change",
		binder: function (callback) {
			$("#ag-sm-rounds").change(function () {
				callback($("#ag-sm-rounds").attr("value"));
			});
		}
	},
	{
		name: "go",
		binder: function (callback) {
			$("#ag-sm-run").click(callback);
		}
	},
	{
		name: "vis_off",
		binder: function (callback) {
			$(".ag-vis-on").click(function () {
				$(".ag-vis-on").hide();
				$(".ag-vis-off").show();
				callback("off");
			});
		}
	},
	{
		name: "vis_on",
		binder: function (callback) {
			$(".ag-vis-off").click(function () {
				$(".ag-vis-off").hide();
				$(".ag-vis-on").show();
				callback("on");
			});
		}
	},
	{
		name: "results_close",
		binder: function (callback) {
			$("#ag-sm-results").on("hide", callback);
		}
	}
];

var textElems = {
	red_name: {
		get: function () { return $("#ag-sm-red-name").text(); },
		set: function (text) {
			$("#ag-sm-red-name").text(text); 
			$("#ag-sm-results-red-name").text(text); 
		}
	},
	black_name: {
		get: function () { return $("#ag-sm-black-name").text(); },
		set: function (text) {
			$("#ag-sm-black-name").text(text);
			$("#ag-sm-results-black-name").text(text);
		}
	},
	world_name: {
		get: function () { return $("#ag-sm-world-name").text(); },
		set: function (text) { 
			$("#ag-sm-world-name").text(text); 
		}
	},
	rounds: {
		get: function () { return $("#ag-sm-rounds").attr("value"); },
		set: function (text) { $("#ag-sm-rounds").attr("value", text); }
	},
	results_red_food: {
		get: function () {},
		set: function (text) { $("#ag-sm-results-red-food").text(text); }
	},
	results_black_food: {
		get: function () {},
		set: function (text) { $("#ag-sm-results-black-food").text(text); }
	},
	results_red_deaths: {
		get: function () {},
		set: function (text) { $("#ag-sm-results-red-deaths").text(text); }
	},
	results_black_deaths: {
		get: function () {},
		set: function (text) { $("#ag-sm-results-black-deaths").text(text); }
	}

};

exports.single_match = new LogicalGroup(events, textElems);

exports.single_match.showResults = function (results) {
	console.log(results);
	this.text("results_red_food", "" + results.red.food);
	this.text("results_black_food", "" + results.black.food);
	this.text("results_red_deaths", "" + results.red.deaths);
	this.text("results_black_deaths", "" + results.black.deaths);
	$("#ag-sm-results").modal("show");
};

})();
(function () {

var events = [
	{
		name: "cancel",
		binder: function (callback) {
			$("#ag-run-cancel").click(callback);
		}
	},
	{
		name: "speed_up",
		binder: function (callback) {
			$("#ag-run-speed-up").click(callback);
		}
	},
	{
		name: "speed_down",
		binder: function (callback) {
			$("#ag-run-speed-down").click(callback);
		}
	}
];

var textElems = {
	red_name: {
		get: function () {},
		set: function (text) { $("#ag-run-red-name").text(text); }
	},
	black_name: {
		get: function () {},
		set: function (text) { $("#ag-run-black-name").text(text); }
	},
	speed: {
		get: function () {},
		set: function (text) { $("#ag-run-speed").text(text); }
	}
};

exports.game = new LogicalGroup(events, textElems);

var maxDx = 14; // one half of the maximum horizontal width of a hexagon

var mctx; // the marker canvas context
var fctxs; // the food canvas contexts
var actx; // the ant canvas context

var foodSprites;
var antSprites;

var spriteWidth;
var spriteHeight;

var hexTopLefts;
var markerPositions;

var dx; // half the width of a hexagon
var dy; // quarter the height of a hexagon

var canvasWidth;
var canvasHeight;

var markerColors = {
	red : ["#bc7f65","#d47c62","#e28b72","#e19996","#e28b8e","#d9a0a1"],
	black : ["#a6c4b7","#97b3bc","#979dbc","#a6b7b7","#838cba","#867ca4"]
};

var markerSize;

function viewport()
{
	var e = window
	, a = 'inner';
	if (!( 'innerWidth' in window)){
		a = 'client';
		e = document.documentElement || document.body;
	}
	return { width : e[ a+'Width' ] , height : e[ a+'Height' ] }
}

exports.game.setup = function (grid) {

	var pageWidth = viewport().width - 18;

	

	// find initial dx
	dx = pageWidth / (2 * grid.width + 1);
	dx = Math.min(maxDx, dx);

	// pre-render food and ants for this zoom level
	foodSprites = [];
	for (var i = 1; i <= 5; i++) {
		foodSprites.push(this.gfx_utils.getFoodCanvas(dx, i));
	}

	spriteWidth = foodSprites[0].width;
	spriteHeight = foodSprites[0].height;

	antSprites = {
		red: [[], []],
		black: [[], []]
	};

	for (var d = 0; d < 6; d++) {
		for (var food = 0; food < 2; food++) {
			antSprites["red"][food].push(this.gfx_utils.getAntCanvas(dx, d, "#A00", food));
			antSprites["black"][food].push(this.gfx_utils.getAntCanvas(dx, d, "#000", food));
		}
	}

	// pre-compute the top-left corners of hexagons
	hexTopLefts = [];
	dy = dx * Math.tan(Math.PI / 6);
	for (var row = 0; row < grid.height; row++) {
		hexTopLefts.push([]);
		for (var col = 0; col < grid.width; col++) {
			var x = 2 * dx * col;
			if (row % 2 === 1) { x += dx; }
			hexTopLefts[row][col] = {
				x: x,
				y: 3 * dy * row
			}
		}
	}

	// pre-compute marker positions
	markerSize = Math.ceil(dx / 3);
	markerPositions = [];
	for (var row = 0; row < grid.height; row++) {
		markerPositions.push([]);
		for (var col = 0; col < grid.width; col++) {
			markerPositions[row].push({red: [], black: []});
			// get the center of the hexagon we're lookin' at
			var center = {
				x: hexTopLefts[row][col].x + dx,
				y: hexTopLefts[row][col].y + (2 * dy)
			};
			var offsets = {"red": 1, "black": -1};
			for (var color in offsets) {
				for (var k = 0; k < 6; k++) {
					// find their center positions
					var x = center.x + (Math.abs(Math.abs(k - 2.5) - 2.5) / 2.5) * 0.8 * dx * offsets[color];
					var y = center.y + (k - 2.5) / 2.5 * 2 * dy;
					// subtract half of marker size to get them in the right place
					x -= Math.ceil(markerSize / 2);
					y -= Math.ceil(markerSize / 2);
					// integerize for speed get
					x = Math.round(x);
					y = Math.round(y);
					markerPositions[row][col][color][k] = {x: x, y: y};
				}
			}
		}
	}


	// integerize hex positions for speed get

	for (var row = 0; row < grid.height; row++) {
		for (var col = 0; col < grid.width; col++) {
			var htl = hexTopLefts[row][col];
			htl.x = Math.round(htl.x);
			htl.y = Math.round(htl.y);
		}
	}

	// pre-render world sprite
	var world_sprite = this.gfx_utils.getWorldCanvas(dx, grid, false);

	
	var bcanv = document.getElementById("ag-run-canv-base");
	var mcanv = document.getElementById("ag-run-canv-marker");
	var fcanv0 = document.getElementById("ag-run-canv-food-even");
	var fcanv1 = document.getElementById("ag-run-canv-food-odd");
	var acanv = document.getElementById("ag-run-canv-ants");

	canvasWidth = world_sprite.width;
	canvasHeight = world_sprite.height;

	bcanv.width = mcanv.width = fcanv0.width = fcanv1.width = acanv.width = canvasWidth;
	bcanv.height = mcanv.height = fcanv0.height = fcanv1.height = acanv.height = canvasHeight;

	mctx = mcanv.getContext("2d");
	fctxs = [fcanv0.getContext("2d"), fcanv1.getContext("2d")];
	actx = acanv.getContext("2d");


	// draw world sprite onto base canvas
	bcanv.getContext("2d").drawImage(world_sprite, 0, 0);


	// draw initial foods
    for (var row = 0; row < grid.height; row++) {
    	for (var col = 0; col < grid.width; col++) {
    		if (grid.cells[row][col].type === "f") {
    			drawFood(row, col, grid.cells[row][col].quantity);
    		}
    	}
    }
};

var topleft;

var drawAnt = function (row, col, dir, color, food) {
	topleft = hexTopLefts[row][col];
	actx.drawImage(antSprites[color][food][dir], topleft.x, topleft.y);
};

exports.game.drawAnt = drawAnt;

var drawFood = function (row, col, num) {
	topleft = hexTopLefts[row][col];
	fctxs[row % 2].clearRect(topleft.x, topleft.y, spriteWidth, spriteHeight);
	if (num > 0) {
		fctxs[row % 2].drawImage(foodSprites[num > 4 ? 4 : num], topleft.x, topleft.y);
	}
};

exports.game.drawFood = drawFood;

var newFrame = function () {
	actx.clearRect(0, 0, canvasWidth, canvasHeight);
};

exports.game.newFrame = newFrame;

var mpos;
var mark = function (row, col, color, marker) {
	mctx.fillStyle = markerColors[color][marker];
	mpos = markerPositions[row][col][color][marker];
	mctx.fillRect(mpos.x, mpos.y, markerSize, markerSize);
};
var unmark = function (row, col, color, marker) {
	mpos = markerPositions[row][col][color][marker];
	mctx.clearRect(mpos.x, mpos.y, markerSize, markerSize);
};

exports.game.mark = mark;
exports.game.unmark = unmark;



})();exports.game = exports.game || {};

exports.game.gfx_utils = (function () {

var getFoodCanvas = function (dx, numFood) {
	var canv = document.createElement('canvas');
	canv.width = Math.ceil(2 * dx);
	var dy = dx * Math.tan(Math.PI / 6);
	canv.height =  Math.ceil(4 * dy)
	var ctx = canv.getContext("2d");
	var radius = dx / 5 * numFood * 0.87;
	ctx.fillStyle = "#008000";
	ctx.beginPath();
	ctx.arc(canv.width / 2, canv.height / 2, radius, 0, Math.PI * 2, true);
	ctx.closePath();
	ctx.fill(); 
	return canv;
};

var getWorldCanvas = function (dx, grid, drawFood) {
	var width = Math.ceil((grid.width * 2 * dx) + dx);
	var dy = dx * Math.tan(Math.PI / 6);
	var twody = 2 * dy;
	var twodx = 2 * dx;

	// get canvas height;
	var height = Math.ceil(dy * ((3 * grid.height) + 1));

	var canv = document.createElement('canvas');
	canv.width = width;
	canv.height = height;

	var ctx = canv.getContext("2d");

	function drawHex(row, col, color) {
		var x = col * (2 * dx);
		if (row % 2 === 1) { x += dx; } // account for odd rows
		var y = (row * 3 * dy) + dy;
		
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x + dx, y - dy);
		ctx.lineTo(x + twodx + twodx, y + twody);
		ctx.lineTo(x + dx, y + (5 * dy));
		ctx.lineTo(x, y + twody);
		ctx.fill();
	}

	var colors = {
		"#": "#555555",
		"f": "#008000",
		".": "#cfc399",
		"+": "#ca9971",
		"-": "#978f79"
	};

	if (!drawFood) {
		colors["f"] = colors["."];
	}

	ctx.fillStyle = colors["#"];
	ctx.fillRect(0, 0, width, height);

	for (var row = 0; row < grid.height; row++) {
		for (var col = 0; col < grid.width; col++) {
			drawHex(row, col, colors[grid.cells[row][col].type]);
		}
	}


	return canv;
};


var getWorldThumbnail = function (grid) {
	// get hexagon dimensions
	var dx = 420 / ((2 * grid.width) + 1);
	return getWorldCanvas(dx, grid, true);
};



var getAntCanvas = function (dx, d, color) {
	var dy = dx * Math.tan(Math.PI / 6);
	var width = Math.ceil(dx * 2);
	var height = Math.ceil(dy * 4);

	var canv = document.createElement("canvas");
	canv.width = width;
	canv.height = height;

	var ctx = canv.getContext("2d");

	drawAntFunctions[d](ctx, 0.2 * dx, color);
	return canv;
};

var drawAntFunctions = [];

drawAntFunctions[0] = function(ctx, scale, color) {
	ctx.lineCap = 'butt';
	ctx.fillStyle = color;
	ctx.lineJoin = 'miter';
	ctx.miterLimit = 4;
	ctx.beginPath();
	ctx.moveTo(1.929 * scale,7.381 * scale);
	ctx.bezierCurveTo(2.7110000000000003 * scale,7.381 * scale,3.402 * scale,6.203 * scale,3.402 * scale,6.203 * scale);
	ctx.lineTo(3.698 * scale,6.37 * scale);
	ctx.lineTo(2.731 * scale,7.93 * scale);
	ctx.lineTo(0.008 * scale,9.175 * scale);
	ctx.lineTo(2.901 * scale,8.133000000000001 * scale);
	ctx.lineTo(3.904 * scale,6.457000000000001 * scale);
	ctx.lineTo(4.494 * scale,6.684000000000001 * scale);
	ctx.lineTo(3.861 * scale,8.103 * scale);
	ctx.lineTo(2.129 * scale,9.186 * scale);
	ctx.lineTo(4.13 * scale,8.229 * scale);
	ctx.lineTo(4.718999999999999 * scale,6.728999999999999 * scale);
	ctx.lineTo(5.221 * scale,6.59 * scale);
	ctx.lineTo(6.146 * scale,8.321 * scale);
	ctx.lineTo(8.04 * scale,8.676 * scale);
	ctx.lineTo(6.29 * scale,8.139 * scale);
	ctx.bezierCurveTo(6.29 * scale,8.139 * scale,5.448 * scale,6.40 * scale,5.457 * scale,6.385 * scale);
	ctx.bezierCurveTo(5.603 * scale,6.27 * scale,5.697 * scale,6.18 * scale,5.697 * scale,6.18 * scale);
	ctx.bezierCurveTo(5.697 * scale,6.18 * scale,5.9510000000000005 * scale,6.904 * scale,6.918 * scale,6.928 * scale);
	ctx.bezierCurveTo(7.457 * scale,6.944 * scale,7.86 * scale,6.588 * scale,8.121 * scale,6.272 * scale);
	ctx.bezierCurveTo(8.129 * scale,6.256 * scale,8.702 * scale,7.355 * scale,8.702 * scale,7.355 * scale);
	ctx.lineTo(9.96 * scale,7.153 * scale);
	ctx.lineTo(8.764 * scale,7.176 * scale);
	ctx.bezierCurveTo(8.764 * scale,7.176 * scale,8.206999999999999 * scale,6.149 * scale,8.222999999999999 * scale,6.126 * scale);
	ctx.bezierCurveTo(8.361999999999998 * scale,5.931 * scale,8.424999999999999 * scale,5.777 * scale,8.424999999999999 * scale,5.777 * scale);
	ctx.bezierCurveTo(8.424999999999999 * scale,5.777 * scale,8.361999999999998 * scale,5.623 * scale,8.223999999999998 * scale,5.437 * scale);
	ctx.bezierCurveTo(8.208 * scale,5.413 * scale,8.765 * scale,4.385 * scale,8.765 * scale,4.385 * scale);
	ctx.lineTo(9.962 * scale,4.401 * scale);
	ctx.lineTo(8.703 * scale,4.2 * scale);
	ctx.bezierCurveTo(8.703 * scale,4.2 * scale,8.129999999999999 * scale,5.300000000000001 * scale,8.122 * scale,5.283 * scale);
	ctx.bezierCurveTo(7.862 * scale,4.966 * scale,7.458 * scale,4.61 * scale,6.93 * scale,4.627 * scale);
	ctx.bezierCurveTo(5.959 * scale,4.652 * scale,5.706 * scale,5.374 * scale,5.706 * scale,5.374 * scale);
	ctx.bezierCurveTo(5.706 * scale,5.374 * scale,5.603 * scale,5.282 * scale,5.465 * scale,5.177 * scale);
	ctx.bezierCurveTo(5.451 * scale,5.152 * scale,6.29 * scale,3.413 * scale,6.29 * scale,3.413 * scale);
	ctx.lineTo(8.046 * scale,2.88 * scale);
	ctx.lineTo(6.153 * scale,3.244 * scale);
	ctx.lineTo(5.22 * scale,4.967 * scale);
	ctx.lineTo(4.71 * scale,4.827 * scale);
	ctx.lineTo(4.121 * scale,3.327 * scale);
	ctx.lineTo(2.1210000000000004 * scale,2.37 * scale);
	ctx.lineTo(3.8510000000000004 * scale,3.4530000000000003 * scale);
	ctx.lineTo(4.476000000000001 * scale,4.864000000000001 * scale);
	ctx.lineTo(3.883 * scale,5.089 * scale);
	ctx.lineTo(2.88 * scale,3.413 * scale);
	ctx.lineTo(0.008 * scale,2.378 * scale);
	ctx.lineTo(2.731 * scale,3.622 * scale);
	ctx.lineTo(3.698 * scale,5.192 * scale);
	ctx.lineTo(3.402 * scale,5.358 * scale);
	ctx.bezierCurveTo(3.402 * scale,5.358 * scale,2.7110000000000003 * scale,4.180999999999999 * scale,1.929 * scale,4.180999999999999 * scale);
	ctx.bezierCurveTo(0.518 * scale,4.180999999999999 * scale,0.399 * scale,5.697999999999999 * scale,0.399 * scale,5.778999999999999 * scale);
	ctx.bezierCurveTo(0.399 * scale,5.777 * scale,0.518 * scale,7.381 * scale,1.929 * scale,7.381 * scale);
	ctx.fill();
	ctx.restore();
};

drawAntFunctions[1] = function(ctx, scale, color) {
	ctx.lineCap = 'butt';
	ctx.fillStyle = color;
	ctx.lineJoin = 'miter';
	ctx.miterLimit = 4;
	ctx.beginPath();
	ctx.moveTo(2.068 * scale,3.933 * scale);
	ctx.bezierCurveTo(2.459 * scale,4.61 * scale,3.825 * scale,4.62 * scale,3.825 * scale,4.62 * scale);
	ctx.lineTo(3.8280000000000003 * scale,4.96 * scale);
	ctx.lineTo(1.994 * scale,4.902 * scale);
	ctx.lineTo(-0.44599999999999995 * scale,3.1660000000000004 * scale);
	ctx.lineTo(1.903 * scale,5.15 * scale);
	ctx.lineTo(3.856 * scale,5.181 * scale);
	ctx.lineTo(3.955 * scale,5.805 * scale);
	ctx.lineTo(2.409 * scale,5.967 * scale);
	ctx.lineTo(0.606 * scale,5.008 * scale);
	ctx.lineTo(2.435 * scale,6.263 * scale);
	ctx.lineTo(4.029 * scale,6.022 * scale);
	ctx.lineTo(4.4 * scale,6.388 * scale);
	ctx.lineTo(3.363 * scale,8.055 * scale);
	ctx.lineTo(4.002 * scale,9.872 * scale);
	ctx.lineTo(3.5919999999999996 * scale,8.088 * scale);
	ctx.bezierCurveTo(3.5919999999999996 * scale,8.088 * scale,4.677 * scale,6.488999999999999 * scale,4.694 * scale,6.488999999999999 * scale);
	ctx.bezierCurveTo(4.867 * scale,6.557999999999999 * scale,4.992 * scale,6.594999999999999 * scale,4.992 * scale,6.594999999999999 * scale);
	ctx.bezierCurveTo(4.992 * scale,6.594999999999999 * scale,4.492 * scale,7.176999999999999 * scale,4.955 * scale,8.026 * scale);
	ctx.bezierCurveTo(5.21 * scale,8.501 * scale,5.72 * scale,8.672 * scale,6.125 * scale,8.74 * scale);
	ctx.bezierCurveTo(6.143 * scale,8.739 * scale,5.478 * scale,9.784 * scale,5.478 * scale,9.784 * scale);
	ctx.lineTo(6.282 * scale,10.774000000000001 * scale);
	ctx.lineTo(5.663 * scale,9.75 * scale);
	ctx.bezierCurveTo(5.663 * scale,9.75 * scale,6.274 * scale,8.754 * scale,6.3020000000000005 * scale,8.756 * scale);
	ctx.bezierCurveTo(6.541 * scale,8.778 * scale,6.705 * scale,8.757 * scale,6.705 * scale,8.757 * scale);
	ctx.bezierCurveTo(6.705 * scale,8.757 * scale,6.807 * scale,8.625 * scale,6.9 * scale,8.413 * scale);
	ctx.bezierCurveTo(6.913 * scale,8.387 * scale,8.081 * scale,8.355 * scale,8.081 * scale,8.355 * scale);
	ctx.lineTo(8.666 * scale,9.4 * scale);
	ctx.lineTo(8.21 * scale,8.208 * scale);
	ctx.bezierCurveTo(8.21 * scale,8.208 * scale,6.971000000000001 * scale,8.261000000000001 * scale,6.981000000000001 * scale,8.246 * scale);
	ctx.bezierCurveTo(7.126 * scale,7.863 * scale,7.231000000000001 * scale,7.335000000000001 * scale,6.953000000000001 * scale,6.886 * scale);
	ctx.bezierCurveTo(6.447 * scale,6.058 * scale,5.695 * scale,6.2 * scale,5.695 * scale,6.2 * scale);
	ctx.bezierCurveTo(5.695 * scale,6.2 * scale,5.724 * scale,6.064 * scale,5.745 * scale,5.892 * scale);
	ctx.bezierCurveTo(5.76 * scale,5.868 * scale,7.6850000000000005 * scale,5.7250000000000005 * scale,7.6850000000000005 * scale,5.7250000000000005 * scale);
	ctx.lineTo(9.024000000000001 * scale,6.979000000000001 * scale);
	ctx.lineTo(7.763 * scale,5.522 * scale);
	ctx.lineTo(5.804 * scale,5.576 * scale);
	ctx.lineTo(5.67 * scale,5.064 * scale);
	ctx.lineTo(6.6739999999999995 * scale,3.803 * scale);
	ctx.lineTo(6.503 * scale,1.593 * scale);
	ctx.lineTo(6.431 * scale,3.633 * scale);
	ctx.lineTo(5.521 * scale,4.879 * scale);
	ctx.lineTo(5.03 * scale,4.479 * scale);
	ctx.lineTo(5.98 * scale,2.773 * scale);
	ctx.lineTo(5.44 * scale,-0.232 * scale);
	ctx.lineTo(5.724 * scale,2.7479999999999998 * scale);
	ctx.lineTo(4.848 * scale,4.371 * scale);
	ctx.lineTo(4.557 * scale,4.197 * scale);
	ctx.bezierCurveTo(4.557 * scale,4.197 * scale,5.231000000000001 * scale,3.01 * scale,4.840000000000001 * scale,2.333 * scale);
	ctx.bezierCurveTo(4.135 * scale,1.11 * scale,2.761 * scale,1.766 * scale,2.691 * scale,1.807 * scale);
	ctx.bezierCurveTo(2.692 * scale,1.806 * scale,1.363 * scale,2.711 * scale,2.068 * scale,3.933 * scale);
	ctx.fill();
	ctx.restore();
};

drawAntFunctions[2] = function(ctx, scale, color) {
	ctx.lineCap = 'butt';
	ctx.fillStyle = color;
	ctx.lineJoin = 'miter';
	ctx.miterLimit = 4;
	ctx.beginPath();
	ctx.moveTo(5.125 * scale,2.329 * scale);
	ctx.bezierCurveTo(4.734 * scale,3.007 * scale,5.409 * scale,4.194 * scale,5.409 * scale,4.194 * scale);
	ctx.lineTo(5.116 * scale,4.367 * scale);
	ctx.lineTo(4.249 * scale,2.75 * scale);
	ctx.lineTo(4.532 * scale,-0.23099999999999987 * scale);
	ctx.lineTo(3.988 * scale,2.795 * scale);
	ctx.lineTo(4.938 * scale,4.502 * scale);
	ctx.lineTo(4.447 * scale,4.899 * scale);
	ctx.lineTo(3.534 * scale,3.642 * scale);
	ctx.lineTo(3.463 * scale,1.601 * scale);
	ctx.lineTo(3.291 * scale,3.812 * scale);
	ctx.lineTo(4.295999999999999 * scale,5.072 * scale);
	ctx.lineTo(4.165 * scale,5.576 * scale);
	ctx.lineTo(2.203 * scale,5.511 * scale);
	ctx.lineTo(0.949 * scale,6.974 * scale);
	ctx.lineTo(2.289 * scale,5.727 * scale);
	ctx.bezierCurveTo(2.289 * scale,5.727 * scale,4.216 * scale,5.867 * scale,4.225 * scale,5.882000000000001 * scale);
	ctx.bezierCurveTo(4.252 * scale,6.066000000000001 * scale,4.2829999999999995 * scale,6.1930000000000005 * scale,4.2829999999999995 * scale,6.1930000000000005 * scale);
	ctx.bezierCurveTo(4.2829999999999995 * scale,6.1930000000000005 * scale,3.528 * scale,6.052 * scale,3.023 * scale,6.877 * scale);
	ctx.bezierCurveTo(2.74 * scale,7.335 * scale,2.847 * scale,7.862 * scale,2.99 * scale,8.246 * scale);
	ctx.bezierCurveTo(3,8.261 * scale,1.762 * scale,8.207 * scale,1.762 * scale,8.207 * scale);
	ctx.lineTo(1.308 * scale,9.398 * scale);
	ctx.lineTo(1.8860000000000001 * scale,8.350999999999999 * scale);
	ctx.bezierCurveTo(1.8860000000000001 * scale,8.350999999999999 * scale,3.0540000000000003 * scale,8.382 * scale,3.066 * scale,8.408 * scale);
	ctx.bezierCurveTo(3.166 * scale,8.626 * scale,3.267 * scale,8.758 * scale,3.267 * scale,8.758 * scale);
	ctx.bezierCurveTo(3.267 * scale,8.758 * scale,3.432 * scale,8.78 * scale,3.662 * scale,8.754 * scale);
	ctx.bezierCurveTo(3.69 * scale,8.751 * scale,4.302 * scale,9.748 * scale,4.302 * scale,9.748 * scale);
	ctx.lineTo(3.6889999999999996 * scale,10.777 * scale);
	ctx.lineTo(4.492999999999999 * scale,9.786999999999999 * scale);
	ctx.bezierCurveTo(4.492999999999999 * scale,9.786999999999999 * scale,3.8269999999999995 * scale,8.741 * scale,3.845999999999999 * scale,8.741999999999999 * scale);
	ctx.bezierCurveTo(4.25 * scale,8.675 * scale,4.76 * scale,8.503 * scale,5.01 * scale,8.037 * scale);
	ctx.bezierCurveTo(5.474 * scale,7.184000000000001 * scale,4.975 * scale,6.604000000000001 * scale,4.975 * scale,6.604000000000001 * scale);
	ctx.bezierCurveTo(4.975 * scale,6.604000000000001 * scale,5.106999999999999 * scale,6.561000000000001 * scale,5.266 * scale,6.493000000000001 * scale);
	ctx.bezierCurveTo(5.295 * scale,6.493000000000001 * scale,6.381 * scale,8.090000000000002 * scale,6.381 * scale,8.090000000000002 * scale);
	ctx.lineTo(5.965 * scale,9.877 * scale);
	ctx.lineTo(6.5969999999999995 * scale,8.056000000000001 * scale);
	ctx.lineTo(5.57 * scale,6.387 * scale);
	ctx.lineTo(5.946000000000001 * scale,6.015 * scale);
	ctx.lineTo(7.540000000000001 * scale,6.255 * scale);
	ctx.lineTo(9.369 * scale,5);
	ctx.lineTo(7.566 * scale,5.957 * scale);
	ctx.lineTo(6.032 * scale,5.793 * scale);
	ctx.lineTo(6.134 * scale,5.168 * scale);
	ctx.lineTo(8.087 * scale,5.138 * scale);
	ctx.lineTo(10.42 * scale,3.168 * scale);
	ctx.lineTo(7.979 * scale,4.903 * scale);
	ctx.lineTo(6.136 * scale,4.956 * scale);
	ctx.lineTo(6.141 * scale,4.617 * scale);
	ctx.bezierCurveTo(6.141 * scale,4.617 * scale,7.506 * scale,4.607 * scale,7.897 * scale,3.93 * scale);
	ctx.bezierCurveTo(8.603 * scale,2.7079999999999997 * scale,7.348 * scale,1.8469999999999995 * scale,7.2780000000000005 * scale,1.8059999999999996 * scale);
	ctx.bezierCurveTo(7.279 * scale,1.807 * scale,5.831 * scale,1.107 * scale,5.125 * scale,2.329 * scale);
	ctx.fill();
	ctx.restore();
};

drawAntFunctions[3] = function(ctx, scale, color) {
	ctx.lineCap = 'butt';
	ctx.fillStyle = color;
	ctx.lineJoin = 'miter';
	ctx.miterLimit = 4;
	ctx.beginPath();
	ctx.moveTo(8.042 * scale,4.174 * scale);
	ctx.bezierCurveTo(7.26 * scale,4.174 * scale,6.569 * scale,5.352 * scale,6.569 * scale,5.352 * scale);
	ctx.lineTo(6.272 * scale,5.185 * scale);
	ctx.lineTo(7.24 * scale,3.625 * scale);
	ctx.lineTo(9.963 * scale,2.38 * scale);
	ctx.lineTo(7.07 * scale,3.422 * scale);
	ctx.lineTo(6.066 * scale,5.098 * scale);
	ctx.lineTo(5.476 * scale,4.8709999999999996 * scale);
	ctx.lineTo(6.109 * scale,3.4519999999999995 * scale);
	ctx.lineTo(7.841 * scale,2.37 * scale);
	ctx.lineTo(5.84 * scale,3.327 * scale);
	ctx.lineTo(5.2509999999999994 * scale,4.827 * scale);
	ctx.lineTo(4.75 * scale,4.965 * scale);
	ctx.lineTo(3.825 * scale,3.234 * scale);
	ctx.lineTo(1.931 * scale,2.879 * scale);
	ctx.lineTo(3.681 * scale,3.416 * scale);
	ctx.bezierCurveTo(3.681 * scale,3.416 * scale,4.523 * scale,5.155 * scale,4.514 * scale,5.17 * scale);
	ctx.bezierCurveTo(4.368 * scale,5.286 * scale,4.273 * scale,5.375 * scale,4.273 * scale,5.375 * scale);
	ctx.bezierCurveTo(4.273 * scale,5.375 * scale,4.019 * scale,4.652 * scale,3.052 * scale,4.628 * scale);
	ctx.bezierCurveTo(2.514 * scale,4.611 * scale,2.111 * scale,4.967 * scale,1.85 * scale,5.284 * scale);
	ctx.bezierCurveTo(1.842 * scale,5.3 * scale,1.27 * scale,4.201 * scale,1.27 * scale,4.201 * scale);
	ctx.lineTo(0.011 * scale,4.402 * scale);
	ctx.lineTo(1.2069999999999999 * scale,4.3790000000000004 * scale);
	ctx.bezierCurveTo(1.2069999999999999 * scale,4.3790000000000004 * scale,1.7639999999999998 * scale,5.406000000000001 * scale,1.7479999999999998 * scale,5.429 * scale);
	ctx.bezierCurveTo(1.609 * scale,5.625 * scale,1.545 * scale,5.778 * scale,1.545 * scale,5.778 * scale);
	ctx.bezierCurveTo(1.545 * scale,5.778 * scale,1.6079999999999999 * scale,5.9319999999999995 * scale,1.746 * scale,6.117999999999999 * scale);
	ctx.bezierCurveTo(1.762 * scale,6.143 * scale,1.206 * scale,7.17 * scale,1.206 * scale,7.17 * scale);
	ctx.lineTo(0.008 * scale,7.154 * scale);
	ctx.lineTo(1.267 * scale,7.356 * scale);
	ctx.bezierCurveTo(1.267 * scale,7.356 * scale,1.84 * scale,6.256 * scale,1.8479999999999999 * scale,6.273 * scale);
	ctx.bezierCurveTo(2.1079999999999997 * scale,6.5889999999999995 * scale,2.512 * scale,6.944999999999999 * scale,3.04 * scale,6.928 * scale);
	ctx.bezierCurveTo(4.011 * scale,6.904 * scale,4.264 * scale,6.181 * scale,4.264 * scale,6.181 * scale);
	ctx.bezierCurveTo(4.264 * scale,6.181 * scale,4.367 * scale,6.273 * scale,4.505 * scale,6.378 * scale);
	ctx.bezierCurveTo(4.52 * scale,6.403 * scale,3.681 * scale,8.143 * scale,3.681 * scale,8.143 * scale);
	ctx.lineTo(1.925 * scale,8.675 * scale);
	ctx.lineTo(3.818 * scale,8.311 * scale);
	ctx.lineTo(4.75 * scale,6.588 * scale);
	ctx.lineTo(5.26 * scale,6.728 * scale);
	ctx.lineTo(5.849 * scale,8.228 * scale);
	ctx.lineTo(7.849 * scale,9.185 * scale);
	ctx.lineTo(6.12 * scale,8.102 * scale);
	ctx.lineTo(5.495 * scale,6.691 * scale);
	ctx.lineTo(6.088 * scale,6.466 * scale);
	ctx.lineTo(7.09 * scale,8.143 * scale);
	ctx.lineTo(9.963000000000001 * scale,9.178 * scale);
	ctx.lineTo(7.24 * scale,7.933 * scale);
	ctx.lineTo(6.273000000000001 * scale,6.3629999999999995 * scale);
	ctx.lineTo(6.569000000000001 * scale,6.1979999999999995 * scale);
	ctx.bezierCurveTo(6.569000000000001 * scale,6.1979999999999995 * scale,7.260000000000001 * scale,7.375 * scale,8.042000000000002 * scale,7.375 * scale);
	ctx.bezierCurveTo(9.453000000000001 * scale,7.375 * scale,9.572000000000001 * scale,5.8580000000000005 * scale,9.572000000000001 * scale,5.777 * scale);
	ctx.bezierCurveTo(9.571 * scale,5.778 * scale,9.453 * scale,4.174 * scale,8.042 * scale,4.174 * scale);
	ctx.fill();
	ctx.restore();
};

drawAntFunctions[4] = function(ctx, scale, color) {
	ctx.lineCap = 'butt';
	ctx.fillStyle = color;
	ctx.lineJoin = 'miter';
	ctx.miterLimit = 4;
	ctx.beginPath();
	ctx.moveTo(7.902 * scale,7.623 * scale);
	ctx.bezierCurveTo(7.511 * scale,6.945 * scale,6.146 * scale,6.936 * scale,6.146 * scale,6.936 * scale);
	ctx.lineTo(6.143 * scale,6.596 * scale);
	ctx.lineTo(7.977 * scale,6.654 * scale);
	ctx.lineTo(10.417 * scale,8.39 * scale);
	ctx.lineTo(8.067 * scale,6.405 * scale);
	ctx.lineTo(6.114 * scale,6.374 * scale);
	ctx.lineTo(6.016 * scale,5.75 * scale);
	ctx.lineTo(7.561 * scale,5.589 * scale);
	ctx.lineTo(9.364 * scale,6.547000000000001 * scale);
	ctx.lineTo(7.536 * scale,5.292 * scale);
	ctx.lineTo(5.941 * scale,5.533 * scale);
	ctx.lineTo(5.571 * scale,5.167 * scale);
	ctx.lineTo(6.608 * scale,3.5 * scale);
	ctx.lineTo(5.968 * scale,1.684 * scale);
	ctx.lineTo(6.378 * scale,3.468 * scale);
	ctx.bezierCurveTo(6.378 * scale,3.468 * scale,5.293 * scale,5.067 * scale,5.276 * scale,5.067 * scale);
	ctx.bezierCurveTo(5.103 * scale,4.997 * scale,4.978 * scale,4.96 * scale,4.978 * scale,4.96 * scale);
	ctx.bezierCurveTo(4.978 * scale,4.96 * scale,5.478 * scale,4.378 * scale,5.015 * scale,3.529 * scale);
	ctx.bezierCurveTo(4.76 * scale,3.054 * scale,4.25 * scale,2.883 * scale,3.846 * scale,2.815 * scale);
	ctx.bezierCurveTo(3.828 * scale,2.817 * scale,4.493 * scale,1.771 * scale,4.493 * scale,1.771 * scale);
	ctx.lineTo(3.689 * scale,0.7809999999999999 * scale);
	ctx.lineTo(4.307 * scale,1.805 * scale);
	ctx.bezierCurveTo(4.307 * scale,1.805 * scale,3.6960000000000006 * scale,2.801 * scale,3.668 * scale,2.799 * scale);
	ctx.bezierCurveTo(3.429 * scale,2.777 * scale,3.265 * scale,2.799 * scale,3.265 * scale,2.799 * scale);
	ctx.bezierCurveTo(3.265 * scale,2.799 * scale,3.164 * scale,2.931 * scale,3.07 * scale,3.143 * scale);
	ctx.bezierCurveTo(3.058 * scale,3.169 * scale,1.889 * scale,3.201 * scale,1.889 * scale,3.201 * scale);
	ctx.lineTo(1.305 * scale,2.156 * scale);
	ctx.lineTo(1.76 * scale,3.347 * scale);
	ctx.bezierCurveTo(1.76 * scale,3.347 * scale,2.999 * scale,3.294 * scale,2.989 * scale,3.309 * scale);
	ctx.bezierCurveTo(2.844 * scale,3.692 * scale,2.739 * scale,4.220000000000001 * scale,3.017 * scale,4.6690000000000005 * scale);
	ctx.bezierCurveTo(3.524 * scale,5.497000000000001 * scale,4.276 * scale,5.355 * scale,4.276 * scale,5.355 * scale);
	ctx.bezierCurveTo(4.276 * scale,5.355 * scale,4.247 * scale,5.4910000000000005 * scale,4.226 * scale,5.663 * scale);
	ctx.bezierCurveTo(4.211 * scale,5.687 * scale,2.286 * scale,5.83 * scale,2.286 * scale,5.83 * scale);
	ctx.lineTo(0.946 * scale,4.576 * scale);
	ctx.lineTo(2.207 * scale,6.034 * scale);
	ctx.lineTo(4.166 * scale,5.98 * scale);
	ctx.lineTo(4.3 * scale,6.491 * scale);
	ctx.lineTo(3.295 * scale,7.752 * scale);
	ctx.lineTo(3.467 * scale,9.963 * scale);
	ctx.lineTo(3.539 * scale,7.922999999999999 * scale);
	ctx.lineTo(4.448 * scale,6.675999999999999 * scale);
	ctx.lineTo(4.94 * scale,7.077 * scale);
	ctx.lineTo(3.99 * scale,8.783 * scale);
	ctx.lineTo(4.53 * scale,11.788 * scale);
	ctx.lineTo(4.246 * scale,8.808 * scale);
	ctx.lineTo(5.122000000000001 * scale,7.185 * scale);
	ctx.lineTo(5.413000000000001 * scale,7.359 * scale);
	ctx.bezierCurveTo(5.413000000000001 * scale,7.359 * scale,4.739000000000001 * scale,8.546 * scale,5.130000000000001 * scale,9.223 * scale);
	ctx.bezierCurveTo(5.836 * scale,10.445 * scale,7.209000000000001 * scale,9.789000000000001 * scale,7.279000000000001 * scale,9.749 * scale);
	ctx.bezierCurveTo(7.278 * scale,9.75 * scale,8.607 * scale,8.845 * scale,7.902 * scale,7.623 * scale);
	ctx.fill();
	ctx.restore();
};

drawAntFunctions[5] = function(ctx, scale, color) {
	ctx.lineCap = 'butt';
	ctx.fillStyle = color;
	ctx.lineJoin = 'miter';
	ctx.miterLimit = 4;
	ctx.beginPath();
	ctx.moveTo(4.846 * scale,9.227 * scale);
	ctx.bezierCurveTo(5.237 * scale,8.549 * scale,4.562 * scale,7.362 * scale,4.562 * scale,7.362 * scale);
	ctx.lineTo(4.855 * scale,7.189 * scale);
	ctx.lineTo(5.722 * scale,8.806000000000001 * scale);
	ctx.lineTo(5.439 * scale,11.787 * scale);
	ctx.lineTo(5.9830000000000005 * scale,8.761000000000001 * scale);
	ctx.lineTo(5.034 * scale,7.054 * scale);
	ctx.lineTo(5.5249999999999995 * scale,6.657 * scale);
	ctx.lineTo(6.436999999999999 * scale,7.915 * scale);
	ctx.lineTo(6.5089999999999995 * scale,9.956 * scale);
	ctx.lineTo(6.680999999999999 * scale,7.744999999999999 * scale);
	ctx.lineTo(5.675999999999999 * scale,6.484999999999999 * scale);
	ctx.lineTo(5.807 * scale,5.98 * scale);
	ctx.lineTo(7.768000000000001 * scale,6.0440000000000005 * scale);
	ctx.lineTo(9.022 * scale,4.582000000000001 * scale);
	ctx.lineTo(7.682 * scale,5.829000000000001 * scale);
	ctx.bezierCurveTo(7.682 * scale,5.829000000000001 * scale,5.755000000000001 * scale,5.689000000000001 * scale,5.746 * scale,5.674 * scale);
	ctx.bezierCurveTo(5.721 * scale,5.489 * scale,5.69 * scale,5.362 * scale,5.69 * scale,5.362 * scale);
	ctx.bezierCurveTo(5.69 * scale,5.362 * scale,6.444000000000001 * scale,5.5040000000000004 * scale,6.948 * scale,4.678 * scale);
	ctx.bezierCurveTo(7.231 * scale,4.221 * scale,7.125 * scale,3.694 * scale,6.981 * scale,3.31 * scale);
	ctx.bezierCurveTo(6.971 * scale,3.295 * scale,8.209 * scale,3.349 * scale,8.209 * scale,3.349 * scale);
	ctx.lineTo(8.664 * scale,2.1580000000000004 * scale);
	ctx.lineTo(8.086 * scale,3.205 * scale);
	ctx.bezierCurveTo(8.086 * scale,3.205 * scale,6.918 * scale,3.174 * scale,6.906000000000001 * scale,3.148 * scale);
	ctx.bezierCurveTo(6.806000000000001 * scale,2.93 * scale,6.705000000000001 * scale,2.798 * scale,6.705000000000001 * scale,2.798 * scale);
	ctx.bezierCurveTo(6.705000000000001 * scale,2.798 * scale,6.54 * scale,2.776 * scale,6.31 * scale,2.802 * scale);
	ctx.bezierCurveTo(6.281 * scale,2.804 * scale,5.669 * scale,1.808 * scale,5.669 * scale,1.808 * scale);
	ctx.lineTo(6.281 * scale,0.7790000000000001 * scale);
	ctx.lineTo(5.476999999999999 * scale,1.7690000000000001 * scale);
	ctx.bezierCurveTo(5.476999999999999 * scale,1.7690000000000001 * scale,6.143 * scale,2.8150000000000004 * scale,6.124 * scale,2.814 * scale);
	ctx.bezierCurveTo(5.721 * scale,2.88 * scale,5.211 * scale,3.052 * scale,4.961 * scale,3.519 * scale);
	ctx.bezierCurveTo(4.497 * scale,4.372 * scale,4.996 * scale,4.952 * scale,4.996 * scale,4.952 * scale);
	ctx.bezierCurveTo(4.996 * scale,4.952 * scale,4.865 * scale,4.995 * scale,4.705 * scale,5.063 * scale);
	ctx.bezierCurveTo(4.676 * scale,5.063 * scale,3.59 * scale,3.4659999999999997 * scale,3.59 * scale,3.4659999999999997 * scale);
	ctx.lineTo(4.007 * scale,1.6789999999999998 * scale);
	ctx.lineTo(3.375 * scale,3.5 * scale);
	ctx.lineTo(4.401 * scale,5.1690000000000005 * scale);
	ctx.lineTo(4.025 * scale,5.541 * scale);
	ctx.lineTo(2.431 * scale,5.301 * scale);
	ctx.lineTo(0.602 * scale,6.556 * scale);
	ctx.lineTo(2.405 * scale,5.599 * scale);
	ctx.lineTo(3.939 * scale,5.763 * scale);
	ctx.lineTo(3.837 * scale,6.388 * scale);
	ctx.lineTo(1.8850000000000002 * scale,6.418 * scale);
	ctx.lineTo(-0.44799999999999995 * scale,8.388 * scale);
	ctx.lineTo(1.991 * scale,6.652 * scale);
	ctx.lineTo(3.835 * scale,6.6 * scale);
	ctx.lineTo(3.83 * scale,6.939 * scale);
	ctx.bezierCurveTo(3.83 * scale,6.939 * scale,2.465 * scale,6.949 * scale,2.074 * scale,7.626 * scale);
	ctx.bezierCurveTo(1.369 * scale,8.848 * scale,2.623 * scale,9.709 * scale,2.693 * scale,9.75 * scale);
	ctx.bezierCurveTo(2.692 * scale,9.749 * scale,4.141 * scale,10.448 * scale,4.846 * scale,9.227 * scale);
	ctx.fill();
	ctx.restore();
};

return {
	getAntCanvas: getAntCanvas,
	getFoodCanvas: getFoodCanvas,
	getWorldCanvas: getWorldCanvas,
	getWorldThumbnail: getWorldThumbnail
}
})();
(function () {

var events = [
	{
		name: "cancel",
		binder: function (callback) {
			$("#ag-run-sans-cancel").click(callback);
		}
	}
];

var textElems = {
	red_name: {
		get: function () { return $("#ag-run-sans-red").text(); },
		set: function (text) { $("#ag-run-sans-red").text(text); }
	},
	black_name: {
		get: function () { return $("#ag-run-sans-black").text(); },
		set: function (text) { $("#ag-run-sans-black").text(text); }
	},
	world_name: {
		get: function () { return $("#ag-run-sans-world").text(); },
		set: function (text) { $("#ag-run-sans-world").text(text); }
	},
	progress: {
		get: function () {},
		set: function (percent) {
			$("#ag-run-sans-progress").attr("style", "width: " + percent);
		}
	}
};

exports.run_sans = new LogicalGroup(events, textElems);

})();exports.init = function () {
	this.menu.init();
	this.single_match.init();
	this.brain_list.init();
	this.world_list.init();
	this.edit.init();
	this.contest.init();
	this.contest.brains.init();
	this.contest.worlds.init();
	this.run_sans.init();
	this.game.init();
	$("#loading-bg").hide();
};
return exports;
})();