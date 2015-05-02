// We need this so the back button knows what to do
var HISTORY = [1];
var PREFS = {};

enyo.kind({
	name: "FoxCasts.MainView",
	kind: "FittableRows",
	fit: true,
	components:[
		{kind: "Panels", name: "menuSlider", fit:true, classes: "", arrangerKind: "CarouselArranger", index: 1, draggable: true, narrowFit: false, onTransitionFinish: "", components: [
			{name: "menu", kind: "Menu", style: "width: 80vw;", onChangePanel: "changePanel", onRefreshAll: "checkForUpdates"},
			{kind: "Panels", fit:true, classes: "panels-container", arrangerKind: "CardArranger", index: 1, draggable: false, onTransitionFinish: "panelChanged", components: [
				{name: "player", kind: "Player"},
				{name: "subscriptionsGrid", kind: "SubscriptionsGrid", onOpenPodcast: "showPodcastDetail"},
				{name: "search", kind: "Search", onShowDetail: "showAuthorDetail"},
				{name: "podcastPreview", kind: "PodcastPreview"},
				{name: "podcastDetail", kind: "PodcastDetail", onStream: "streamEpisode", onResume: "resumeEpisode", onPodcastDeleted: "changePanel"},
				{name: "filteredList", kind: "FilteredList", onStream: "streamEpisode", onResume: "resumeEpisode", onPodcastDeleted: "changePanel"},
				{name: "settings", kind: "Settings"}
			]}
		]},
		{kind: "onyx.Toolbar", classes: "header-bar", layoutKind:"FittableColumnsLayout", components: [
			{name: "btnMenu", kind: "HeaderButton", icon: "menu", ontap: "changePanel"},
			{name: "headerTitle", content: "Subscriptions", style: "text-align: center; padding-top: 10px;", fit: true, ontap: "checkStorage"},
			{name: "btnBack", kind: "HeaderButton", icon: "back", ontap: "changePanel"}
		]},
	],
	create: function() {
		this.inherited(arguments);
		this.$.menuSlider.getAnimator().setDuration(200);
		// this.initializeDB();
		console.log(enyo.platform);
		if (enyo.platform.webos) {
			console.log("Platform: " + "webOS detected.");
			PalmSystem.stageReady();
			this.initializeDB();
		} else {
			this.initializeDB();
		}
	},
	initializeDB: function() {
		PodcastManager.initialize("Database_Production", 1);
	},
	checkStorage: function() {
		var store = navigator.getDeviceStorage("music");
		// var store = navigator.getDeviceStorages("music");
		this.log(store);
	},
	manageHistory: function (action, panel) {
		switch (action) {
			case "add":
				if (panel != HISTORY[HISTORY.length-1]) {
					HISTORY.push(panel);
				}
				break;
			case "remove":
				if (panel == "last") {
					HISTORY.pop();
				}	
				break;
		}
		// this.log(HISTORY);
	},
	changePanel: function(inSender, inEvent) {
		// this.log(inSender);
		// this.log(inEvent);

		var command;
		if (inEvent.command) {
			command = inEvent.command;
		} else {
			command = inSender.name;
		}	
		// this.log(command);

		switch (command) {
			case "btnMenu":
				if (this.$.menuSlider.getIndex() == 0) {
					this.$.menuSlider.setIndex(1);
				} else {
					this.$.menuSlider.setIndex(0);
				}
				break;
			case "btnBack":
				if (this.$.menuSlider.getIndex() == 0) {
					this.$.menuSlider.setIndex(1);
				} else {
					if (HISTORY.length > 1) {
						this.$.panels.setIndex(HISTORY[HISTORY.length-2]);
						this.manageHistory("remove", "last");
					}
				}
				break;
			// case "subscriptionsGrid":
			// 	this.$.panels.setIndex(5);
			// 	this.$.podcastDetail.setPodcast(inEvent);
			// 	this.$.podcastDetail.refresh();
			// 	break;
			case "player":
				this.$.panels.setIndex(0);
				break;
			case "subscriptions":
				this.$.panels.setIndex(1);
				break;
			case "search":
				this.$.panels.setIndex(2);
				this.$.search.focusSearchBox();
				break;
			case "podcast-preview":
				this.$.panels.setIndex(3);
				break;
			case "podcast-detail":
				this.$.panels.setIndex(4);
				break;
			case "filter-recent":
				this.$.filteredList.setFilter("recent");
				this.$.filteredList.refreshList();
				this.$.panels.setIndex(5);
				break;
			case "filter-inprogress":
				this.$.filteredList.setFilter("inprogress");
				this.$.filteredList.refreshList();
				this.$.panels.setIndex(5);
				break;
			case "filter-downloaded":
				this.$.filteredList.setFilter("downloaded");
				this.$.filteredList.refreshList();
				this.$.panels.setIndex(5);
				break;
			case "settings":
				this.$.panels.setIndex(6);
				break;
		}

		if (inSender.name == "menu") {
			this.$.menuSlider.setIndex(1);
		}

		this.updateHeaderTitle();
	},
	panelChanged: function(inSender, inEvent) {
		this.updateHeaderTitle();

		// If we're going to SubscriptionGrid, refresh the podcasts
		if (inEvent.toIndex == 1 && inEvent.fromIndex != 1) {
			this.$.subscriptionsGrid.updateList();
		}

		// If we're going from PodcastPreview to Search, clean up PodcastPreview
		if (inEvent.toIndex == 2 && inEvent.fromIndex == 3) {
			this.$.podcastPreview.cleanup();
		}

		// Update history
		this.manageHistory("add", inEvent.toIndex);
	},
	updateHeaderTitle: function() {
		var title = this.$.panels.getActive().getHeaderText();
		if (title) {
			this.$.headerTitle.setContent(title);
		}
	},
	showAuthorDetail: function(inSender, podcast) {
		this.$.podcastPreview.setPodcast(podcast);
		this.changePanel({}, {command: "podcast-preview"});
	},
	showPodcastDetail: function(inSender, podcast) {
		this.$.podcastDetail.setPodcast(podcast);
		this.changePanel({}, {command: "podcast-detail"});
	},
	streamEpisode: function(inSender, episode) {
		this.$.player.setPlaybackType("stream");
		this.$.player.setEpisode(episode);
		// this.$.player.initStream();
		this.changePanel({}, {command: "player"});
	},
	resumeEpisode: function(inSender, episode) {
		this.$.player.setPlaybackType("resume");
		this.$.player.setEpisode(episode);
		// this.$.player.initStream("resume");
		this.changePanel({}, {command: "player"});
	},
	checkForUpdates: function() {
		var podcasts = [];
		var keyRange = IDBKeyRange.lowerBound(0);
		var store = DB.transaction("podcasts").objectStore("podcasts");
		store.openCursor().onsuccess = enyo.bind(this, function(event) {
			var cursor = event.target.result;
			if (cursor) {
				podcasts.push(event.target.result.value);
				cursor.continue();
			} else {
				PodcastManager.updateAllPodcasts(null, podcasts);
			}
		});
	},
});

enyo.kind({
	name: "HeaderButton",
	kind: "FittableColumns",
	classes: "header-button",
	published: {
		icon: ""
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
	create: function() {
		this.inherited(arguments);
		switch (this.icon) {
			case "menu":
				this.addRemoveClass("menu", true);
				break;
			case "back":
				this.addRemoveClass("back", true);
				break;
		}
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