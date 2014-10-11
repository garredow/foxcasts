enyo.kind({
	name: "SubscriptionsGrid",
	kind: "FittableColumns",
	fit: true,
	// headerText: "FoxCasts",
	published: {
		headerText: "Subscriptions"
	},
	events: {
		onOpenPodcast: ""
	},
	components:[
		{kind: "Scroller", name: "grid", fit: true, touch: true, thumb: false, style: "text-align: center;", components: [

		]}
	],
	create: function() {
		this.inherited(arguments);
	},
	updateList: function() {
		PodcastManager.getAllPodcasts(this);
	},
	renderPodcasts: function(podcasts) {
		this.$.grid.destroyClientControls();
		for (var i=0; i<podcasts.length; i++) {
			this.$.grid.createComponent({kind: "SubscriptionTile", icon: podcasts[i].logo100, dbData: podcasts[i], ontap: "openPodcast", owner: this});
		}
		this.$.grid.render();
	},
	openPodcast: function(inSender) {
		// this.log(inSender);
		this.doOpenPodcast(inSender.dbData);
	}
});