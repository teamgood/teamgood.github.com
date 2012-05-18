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
	},
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
	sm_pick_brain: {
		prerequisites: ["root","single_match"],
		description: "Pick Brain",
		selector: ".ag-bl"
	},
	sm_pick_world: {
		prerequisites: ["root","single_match"],
		description: "Pick World",
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
			$("#ag-sm-go").click(callback);
		}
	},
	{
		name: "vis_off",
		binder: function (callback) {
			$("#ag-sm-vis-on").click(function () {
				$("#ag-sm-vis-on").hide();
				$("#ag-sm-vis-off").show();
				callback("off");
			});
		}
	},
	{
		name: "vis_on",
		binder: function (callback) {
			$("#ag-sm-vis-off").click(function () {
				$("#ag-sm-vis-off").hide();
				$("#ag-sm-vis-on").show();
				callback("on");
			});
		}
	}
];

var textElems = {
	red_name: {
		get: function () { return $("#ag-sm-red-name").text(); },
		set: function (text) { $("#ag-sm-red-name").text(text); }
	},
	black_name: {
		get: function () { return $("#ag-sm-black-name").text(); },
		set: function (text) { $("#ag-sm-black-name").text(text); }
	},
	world_name: {
		get: function () { return $("#ag-sm-world-name").text(); },
		set: function (text) { $("#ag-sm-world-name").text(text); }
	},
	rounds: {
		get: function () { return $("#ag-sm-rounds").attr("value"); },
		set: function (text) { $("#ag-sm-rounds").attr("value", text); }
	}
};

exports.single_match = new LogicalGroup(events, textElems);

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
exports.init = function () {
	this.menu.init();
	this.single_match.init();
	this.brain_list.init();
	this.world_list.init();
	this.edit.init();
	this.single_match.init();
	$("#loading-bg").hide();
};
return exports;
})();