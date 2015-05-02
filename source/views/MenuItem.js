enyo.kind({
	name: "MenuItem",
	kind: "FittableColumns",
	classes: "menu-item",
	published: {
		icon: "",
		label: "",
		command: ""
	},
	handlers: {
		onmousedown: "highlight",
		ontouchstart: "highlight",
		ontouchenter: "highlight",
		ontouchend: "removeHighlight",
		ontouchleave: "removeHighlight",
		onmouseup: "removeHighlight",
		onmouseout: "removeHighlight"
	},
	components:[
		{name: "icon", classes: "menu-item-icon"},
		{name: "label", classes: "menu-item-label", fit: true}
	],
	create: function() {
		this.inherited(arguments);
		if (this.icon) {
			this.$.icon.addRemoveClass(this.icon, true);
			// this.$.icon.applyStyle("background-image", "url('assets/icons/" + this.icon + ".png')");
		}
		this.$.label.setContent(this.label);
	},
	labelChanged: function() {
		this.$.label.setContent(this.label);
	},
	highlight: function(e) {
		this.addRemoveClass("highlight-primary-item", true);
	},
	removeHighlight: function(e) {
		this.addRemoveClass("highlight-primary-item", false);
	}
});