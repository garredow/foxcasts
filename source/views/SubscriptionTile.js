enyo.kind({
	name: "SubscriptionTile",
	classes: "podcast-tile",
	published: {
		icon: "",
		label: "",
		dbData: ""
	},
	components:[
		{kind: "Image", src: "https://gpodder.net//logo//64//ebe//ebed669e001a2acbc52569effbbc211f01ce606d", style: "width: 100%;"}
	],
	create: function() {
		this.inherited(arguments);
		this.$.image.setSrc(this.icon);
	}
});