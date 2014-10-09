enyo.kind({
	name: "Menu",
	kind: "FittableRows",
	fit: true,
	// style: "padding: 10px;",
	published: {
		headerText: "FoxCasts"
	},
	events: {
		onChangePanel: "",
		onRefreshAll: ""
	},
	components:[
		{kind: "MenuItem", icon: "subscriptions-light", label: "Subscriptions", command: "subscriptions", ontap: "doChangePanel"},
		{kind: "MenuItem", icon: "player-light", label: "Player", command: "player", ontap: "doChangePanel"},
		{kind: "MenuItem", icon: "search-light", label: "Search", command: "search", ontap: "doChangePanel"},
		{kind: "MenuItem", icon: "playlists-light", label: "Playlists", command: "playlists", ontap: "doChangePanel"},
		// {kind: "MenuItem", icon: "", label: "Downloads", command: "downloads", ontap: "doChangePanel"},
		{fit: true},
		// {kind: "MenuItem", icon: "", label: "Log In", command: "login", ontap: "doChangePanel"},
		// {kind: "MenuItem", icon: "", label: "Log Out", command: "logout", ontap: "doChangePanel"},
		{kind: "MenuItem", icon: "refresh-light", label: "Refresh All", command: "refresh-all", ontap: "doRefreshAll"},
		{kind: "MenuItem", icon: "settings-light", label: "Settings", command: "settings", ontap: "doChangePanel"},
	],
	create: function() {
		this.inherited(arguments);
		
	}
});