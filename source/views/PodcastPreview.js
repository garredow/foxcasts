enyo.kind({
	name: "PodcastPreview",
	kind: "FittableRows",
	fit: true,
	// style: "padding: 10px 10px;",
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
		{style: "padding: 0 5px;", components: [
			{name: "btnSubscribe", kind: "onyx.Button", content: "Subscribe", style: "width: 100%; margin: 5px 0;", classes: "subscribe-button", disabled: true, ontap: "subscribe"}
		]}
		
	],
	alreadySubscribed: true,
	databaseChecked: false,
	episodesReady: false,
	episodes: [],
	podcastChanged: function() {
		// this.log(this.podcast);

		if (this.podcast) {
			// Fill in the basic info
			var p = this.podcast;
			this.$.logo.setSrc(p.artworkUrl600);
			this.$.title.setContent(p.collectionName);
			this.$.author.setContent("by " + p.artistName);

			PodcastManager.checkIfSubscribed(this, p.collectionName);
			this.getEpisodes();
		}
	},
	cleanup: function() {
		// Reset vars
		this.podcast = null;
		this.episodes = [];
		this.alreadySubscribed = true;
		this.episodesReady = false;

		// Reset the basic info
		this.$.logo.setSrc("");
		this.$.title.setContent("Podcast");
		this.$.author.setContent("by author");

		// Destroy existing episodes
		this.$.scroller.setScrollTop(0);
		this.$.episodes.destroyClientControls();

		// Reset Subscribe button to disabled
		this.$.btnSubscribe.setContent("Subscribe");
		this.$.btnSubscribe.setDisabled(true);
	},
	checkedSubscription: function(subscribed) {
		this.alreadySubscribed = subscribed;

		if (subscribed) {
			this.$.btnSubscribe.setContent("Subscribed!");
			this.$.btnSubscribe.setDisabled(true);
		} else {
			this.enableSubscribeButton();
		}
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
		for (var i=0; i<this.episodes.length; i++) {
			var e = this.episodes[i];

			var title = e.title;
			var date = e.date;
			date = new Date(date);
			date = date.toDateString() + ", " + date.toLocaleTimeString();
			this.$.episodes.createComponent({kind: "EpisodeItem", title: title, subTitle: date, episode: e, preview: true, owner: this});

			// TODO: Remove this limit
			if (i > 50) {
				break;
			}
		}
		this.$.spinner.setShowing(false);
		this.$.episodes.render();

		this.episodesReady = true;
		this.enableSubscribeButton();
	},
	enableSubscribeButton: function() {
		if (this.episodesReady && !this.alreadySubscribed) {
			this.$.btnSubscribe.setContent("Subscribe");
			this.$.btnSubscribe.setDisabled(false);
		}
	},
	subscribe: function() {
		this.log("Adding " + this.podcast.collectionName + " to database. (" + this.episodes.length + " episodes)");

		PodcastManager.subscribe(this, this.podcast, this.episodes);
	}
});