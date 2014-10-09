enyo.kind({
	name: "PodcastPreview",
	kind: "FittableRows",
	fit: true,
	style: "padding: 10px 10px;",
	classes: "podcast-detail",
	published: {
		headerText: "More Info",
		podcast: ""
	},
	events: {
		onShowDetail: ""
	},
	components:[
		{kind: "enyo.Scroller", fit: true, touch: true, thumb: false, components: [
			{name: "logo", kind: "Image", classes: "podcast-logo"},
			{name: "title", classes: "podcast-title"},
			{name: "author", classes: "podcast-author"},
			{name: "description", classes: "podcast-description"},
			{name: "spinnerContainer", style: "text-align: center;", components: [
				{kind: "onyx.Spinner", showing: true},
			]},
			{name: "episodes"}
		]},
		{name: "btnSubscribe", kind: "onyx.Button", content: "Subscribe", style: "width: 100%; margin-top: 5px;", classes: "onyx-affirmative", disabled: true, ontap: "subscribe"}
	],
	db: "",
	episodes: [],
	podcastChanged: function() {
		// this.log(this.podcast);

		// Start things fresh
		if (this.db) {
			this.db.close();
		}
		this.episodes = [];

		// Fill in the basic info
		var p = this.podcast;
		this.$.logo.setSrc(p.artworkUrl600);
		this.$.title.setContent(p.collectionName);
		this.$.author.setContent("by " + p.artistName);

		// Reset Subscribe button to disabled
		this.$.btnSubscribe.setContent("Subscribe");
		this.$.btnSubscribe.setDisabled(true);

		// Check if already subscribed
		var request = window.indexedDB.open("MyTestDatabase1");
		request.onerror = function(event) {
			console.log("PodcastPreview: Error when opening the database.")
		};
		request.onsuccess = enyo.bind(this, function(event) {
			this.db = request.result;

			var trans = this.db.transaction("podcasts");
			var store = trans.objectStore("podcasts");
			var index = store.index("name");
			index.get(p.collectionName).onsuccess = enyo.bind(this, function(event) {
				// console.log(event.target.result);
				if (!event.target.result) {
					// We're not subscribed to this podcast. Enable Subscribe button.
					this.$.btnSubscribe.setContent("Subscribe");
					this.$.btnSubscribe.setDisabled(false);
				} else {
					// We're alrready subscribed to this podcast. Disable Subscribe button.
					console.log("Already subscribed to ths podcast!");
					this.$.btnSubscribe.setContent("Subscribed!");
					this.$.btnSubscribe.setDisabled(true);
				}
			});
		});

		// Fetch available episodes
		this.getEpisodes();
	},
	getEpisodes: function() {
		this.$.episodes.destroyClientControls();
		this.$.spinner.setShowing(true);

		var xmlhttp = new XMLHttpRequest({mozSystem: true});
		xmlhttp.open("GET", this.podcast.feedUrl, true);
		xmlhttp.responseType = "xml";
		xmlhttp.onreadystatechange = enyo.bind(this, function(response) {
			if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
				// console.log(xmlhttp);
		        // console.log(xmlhttp.responseText);
		        var parser = new DOMParser();
				var xml = parser.parseFromString(xmlhttp.response, "text/xml");
		        this.gotEpisodes(xml);
		    }
		});
		xmlhttp.send();
	},
	gotEpisodes: function(xml) {
		// Try to get the summary
		var summary = xml.getElementsByTagName("summary");
		if (summary.length > 0) {
			this.podcast.summary = summary[0].textContent;
		} else {
			this.podcast.summary = "No summary available.";
		}

		this.episodes = ParseFeed(xml, this.podcast);
		this.log("Found " + this.episodes.length + " episodes.");

		// this.log(this.episodes[0]);
		for (var i=0; i< this.episodes.length; i++) {
			var title = this.episodes[i].title;
			var date = this.episodes[i].date;
			date = new Date(date);
			date = date.toDateString() + ", " + date.toLocaleTimeString();
			this.$.episodes.createComponent({classes: "episode-title", content: title});
			this.$.episodes.createComponent({classes: "episode-date", content: date});
		}
		this.$.spinner.setShowing(false);
		this.$.episodes.render();

		// Now that we have the episodes, we can enable the Subscribe button
		this.$.btnSubscribe.setDisabled(false);
	},
	subscribe: function() {
		this.log("Adding " + this.podcast.collectionName + " to database. (" + this.episodes.length + " episodes)");

		// Add the podcast to our database
		var trans = this.db.transaction(["podcasts"], "readwrite");
		trans.onerror = function(event) {
			console.log("Subscription error! (Podcast)");
			console.log(event);
		};
		var store = trans.objectStore("podcasts");
		var p = this.podcast;
		var podcast = {
			name: p.collectionName,
			artist: p.artistName,
			summary: this.podcast.summary || "",
			logo30: p.artworkUrl30,
			logo60: p.artworkUrl60,
			logo100: p.artworkUrl100,
			logo600: p.artworkUrl600,
			feedUrl: p.feedUrl,
			latest: this.episodes[0].date
		};
		store.add(podcast);

		var trans = null; // TODO: Do we need to do this?
		var store = null; // TODO: Do we need to do this?

		// Add the episodes to our database
		var trans = this.db.transaction(["episodes"], "readwrite");
		trans.oncomplete = enyo.bind(this, function(event) {
			console.log("Subscription completed! (Episodes)");
			// console.log(event);
			this.$.btnSubscribe.setDisabled(true);
			this.$.btnSubscribe.setContent("Subscribed!");
		});
		trans.onerror = function(event) {
			console.log("Subscription error! (Episodes)");
			console.log(event);
		};
		var store = trans.objectStore("episodes");
		for (var i=0; i<this.episodes.length; i++) {
			store.add(this.episodes[i]);
		}

		// After we're subscribed, there's nothing left to do here
		this.db.close();
	}
});