enyo.kind({
	name: "SubscriptionsGrid",
	kind: "FittableColumns",
	fit: true,
	published: {
		headerText: "Subscriptions"
	},
	events: {
		onOpenPodcast: ""
	},
	components:[
		{kind: "Signals", onDatabaseReady: "updateList"},
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
			this.$.grid.createComponent({kind: "SubscriptionTile", icon: podcasts[i].logo600, dbData: podcasts[i], ontap: "openPodcast", owner: this});
		}

		if (podcasts.length === 0) {
			this.$.grid.createComponent({classes: "empty-list-text", allowHtml: true, content: "It looks like you aren't subscribed to any podcasts yet. Why don't you use the Search to find some? I'm sure you'll find something you'll like!<br><br>(Swipe right)"});
		}

		this.$.grid.render();
	},
	openPodcast: function(inSender) {
		this.doOpenPodcast(inSender.dbData);
	}
});