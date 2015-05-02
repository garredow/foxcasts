enyo.kind({
	name: "SubscriptionTile",
	classes: "podcast-tile",
	published: {
		icon: "",
		label: "",
		dbData: ""
	},
	components:[
		{kind: "Image", src: "", style: "width: 100%;"}
	],
	create: function() {
		this.inherited(arguments);
		this.$.image.setSrc(this.icon);
	}
});