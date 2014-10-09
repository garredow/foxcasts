enyo.kind({
	name: "MenuItem",
	kind: "FittableColumns",
	classes: "menu-item",
	published: {
		icon: "",
		label: "",
		command: ""
	},
	components:[
		{name: "icon", classes: "menu-item-icon"},
		{name: "label", classes: "menu-item-label", fit: true}
	],
	create: function() {
		this.inherited(arguments);
		if (this.icon) {
			this.$.icon.applyStyle("background-image", "url('assets/icons/" + this.icon + ".png')");
		}
		this.$.label.setContent(this.label);
	}
});