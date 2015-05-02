enyo.kind({
	name: "Menu",
	kind: "FittableRows",
	fit: true,
	published: {
		headerText: "FoxCasts"
	},
	events: {
		onChangePanel: "",
		onRefreshAll: ""
	},
	components:[
		{kind: "enyo.Scroller", fit: true, thumb: false, components: [
			{kind: "MenuItem", icon: "subscriptions", label: "Subscriptions", command: "subscriptions", ontap: "changePanel"},
			{kind: "MenuItem", icon: "player", label: "Player", command: "player", ontap: "changePanel"},
			{kind: "MenuItem", icon: "search", label: "Search", command: "search", ontap: "changePanel"},
			{classes: "menu-divider", content: "Lists"},
			{kind: "MenuItem", icon: "playlists", label: "Most Recent", command: "filter-recent", ontap: "changePanel"},
			{kind: "MenuItem", icon: "playlists", label: "In Progress", command: "filter-inprogress", ontap: "changePanel"},
			{kind: "MenuItem", icon: "playlists", label: "Downloaded", command: "filter-downloaded", ontap: "changePanel"},
			{classes: "menu-divider", content: "System"},
			{name: "btnRefresh", kind: "MenuItem", icon: "refresh", label: "Refresh All", command: "refresh-all", ontap: "doRefreshAll"},
			{kind: "MenuItem", icon: "settings", label: "Settings", command: "settings", ontap: "changePanel"},
		]},
		{style: "height: 1px;"},
		
		{kind: "Signals", onPodcastsUpdateStart: "podcastsUpdateStart", onPodcastsUpdateProgress: "podcastsUpdateProgress", onPodcastsUpdated: "podcastsUpdated"}
	],
	create: function() {
		this.inherited(arguments);
	},
	changePanel: function(inSender) {
		this.doChangePanel({command: inSender.command});
	},
	podcastsUpdateStart: function(inSender, inEvent) {
		this.$.btnRefresh.setLabel("Updating " + inEvent.status);
	},
	podcastsUpdateProgress: function(inSender, inEvent) {
		this.$.btnRefresh.setLabel("Updating " + inEvent.status);
	},
	podcastsUpdated: function(inSender, inEvent) {
		this.$.btnRefresh.setLabel("Refresh All");
	}
});