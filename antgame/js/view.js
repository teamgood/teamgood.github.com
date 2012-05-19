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
};

exports.menu.showBreadcrumbs = function () {
	$("#ag-bread").show();
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

var width = 420; 

exports.getWorldThumbnail = function (grid) {
	// get hexagon dimensions
	var dx = width / ((2 * grid.width) + 1);
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

	ctx.fillStyle = colors["#"];
	ctx.fillRect(0, 0, width, height);

	for (var row = 0; row < grid.height; row++) {
		for (var col = 0; col < grid.width; col++) {
			drawHex(row, col, colors[grid.cells[row][col].type]);
		}
	}


	return canv;

};

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
			$("#ag-run-sans-progress").css("width", percent);
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
	$("#loading-bg").hide();
};
return exports;
})();