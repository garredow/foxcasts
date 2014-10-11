// We need this so the back button knows what to do
var HISTORY = [0];
// var DB;

enyo.kind({
	name: "FoxCasts.MainView",
	kind: "FittableRows",
	fit: true,
	components:[
		{kind: "onyx.Toolbar", classes: "header-bar", layoutKind:"FittableColumnsLayout", components: [
			{name: "btnMenu", classes: "header-button menu", ontap: "changePanel"},
			{name: "headerTitle", content: "FoxCasts", fit: true},
			{name: "btnBack", classes: "header-button back", ontap: "changePanel"}
		]},
		{kind: "Panels", fit:true, classes: "panels-container", arrangerKind: "CardArranger", index: 0, draggable: false, onTransitionFinish: "panelChanged", components: [
			{name: "menu", kind: "Menu", onChangePanel: "changePanel", onRefreshAll: "checkForUpdates"},
			{name: "player", kind: "Player"},
			{name: "subscriptionsGrid", kind: "SubscriptionsGrid", onOpenPodcast: "showPodcastDetail"},
			{name: "search", kind: "Search", onShowDetail: "showAuthorDetail"},
			{name: "podcastPreview", kind: "PodcastPreview"},
			{name: "podcastDetail", kind: "PodcastDetail", onStream: "streamEpisode", onResume: "resumeEpisode", onPodcastDeleted: "changePanel"},
			// {name: "filteredList", kind: "FilteredList", onStream: "streamEpisode", onResume: "resumeEpisode", onPodcastDeleted: "changePanel"}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.initializeDB();
	},
	initializeDB: function() {
		PodcastManager.initialize("MyTestDatabase1", 6);
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
				this.$.panels.setIndex(0);
				break;
			case "btnBack":
				if (HISTORY.length > 1) {
					this.$.panels.setIndex(HISTORY[HISTORY.length-2]);
					this.manageHistory("remove", "last");
				}
				break;
			// case "subscriptionsGrid":
			// 	this.$.panels.setIndex(5);
			// 	this.$.podcastDetail.setPodcast(inEvent);
			// 	this.$.podcastDetail.refresh();
			// 	break;
			case "player":
				this.$.panels.setIndex(1);
				break;
			case "subscriptions":
				this.$.panels.setIndex(2);
				break;
			case "search":
				this.$.panels.setIndex(3);
				this.$.search.focusSearchBox();
				break;
			case "podcast-preview":
				this.$.panels.setIndex(4);
				break;
			case "podcast-detail":
				this.$.panels.setIndex(5);
				break;
		}
	},
	panelChanged: function(inSender, inEvent) {
		var title = this.$.panels.getActive().getHeaderText();
		if (title) {
			this.$.headerTitle.setContent(title);
		}

		if (inEvent.toIndex == 2 && inEvent.fromIndex != 2) {
			this.$.subscriptionsGrid.updateList();
		}

		// Update history
		this.manageHistory("add", inEvent.toIndex);
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
			// this.log("openCursor success");
			// this.log(event.target.result.value);
			var cursor = event.target.result;
			if (cursor) {
				// this.log(event.target.result.value);
				podcasts.push(event.target.result.value);
				// this.log(podcasts);
				cursor.continue();
			} else {
				// this.log(podcasts);
				this.startUpdates(podcasts);
			}
		});
	},
	startUpdates: function(p) {
		// this.log(p);
		var xmlhttp = new XMLHttpRequest({mozSystem: true});
		xmlhttp.open("GET", p[0].feedUrl, true);
		xmlhttp.responseType = "xml";
		xmlhttp.onreadystatechange = enyo.bind(this, function(response) {
			// this.log(response);
			if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
		        var parser = new DOMParser();
				var xml = parser.parseFromString(xmlhttp.response, "text/xml");
		        this.gotEpisodes(xml, p[0]);
		    }
		});
		xmlhttp.send();
	},
	gotEpisodes: function(xml, podcast) {
		this.log("Refreshing feed: " + podcast.name);
		var items = xml.getElementsByTagName("item");
		var episodes = ParseFeed(xml, podcast, podcast.latest);

		// No new episodes
		if (episodes.length === 0) {
			this.log("No new episodes...");
			return;
		}
		
		this.log("Found new episodes!");
		this.log(episodes);

		// Now let's add the new episodes to the database
		var trans = DB.transaction(["episodes"], "readwrite");
		trans.onerror = function(event) {
			console.log("Couldn't open a transaction.");
			console.log(event);
		};
		var store = trans.objectStore("episodes");
		for (i=0; i<episodes.length; i++) {
			store.add(episodes[i]);
		}

		trans = null; // TODO: Do we need to do this?
		store = null; // TODO: Do we need to do this?

		// Update the podcast itself with the sate of the newest episode
		var trans = DB.transaction(["podcasts"], "readwrite");
		trans.onerror = function(event) {
			console.log("Couldn't open a transaction.");
			console.log(event);
		};
		var store = trans.objectStore("podcasts");
		var index = store.index("name");
		var key = IDBKeyRange.only(podcast.name);
		index.openCursor(key).onsuccess = enyo.bind(this, function(event) {
			var cursor = event.target.result;
			if (cursor) {
				this.log(cursor);

				var data = cursor.value;
				data.latest = episodes[0].date;
				var requestUpdate = store.put(data, cursor.primaryKey);
				requestUpdate.onerror = function(event) {
					console.log("error");
					console.log(event);
				};
				requestUpdate.onsuccess = function(event) {
					console.log("Successfully updated podcast db entry.");
				};

				cursor.continue();
			}
		});
	}
});