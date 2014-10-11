enyo.kind({
	name: "PodcastDetail",
	kind: "FittableRows",
	fit: true,
	style: "padding: 0 0 0 0;",
	classes: "podcast-detail",
	published: {
		headerText: "More Info",
		podcast: "",
		activeEpisode: ""
	},
	events: {
		onStream: "",
		onResume: "",
		onPodcastDeleted: ""
	},
	components:[
		{kind: "enyo.Scroller", fit: true, touch: true, thumb: false, components: [
			{name: "logo", kind: "Image", classes: "podcast-logo", ontap: "openPopup"},
			{name: "title", classes: "podcast-title"},
			{name: "author", classes: "podcast-author"},
			{name: "description", classes: "podcast-description"},
			{name: "spinnerContainer", style: "text-align: center;", components: [
				{kind: "onyx.Spinner", showing: true},
			]},
			{name: "episodes"}
		]},
		{kind: "onyx.Popup", classes: "episode-action-popup", centered: true, modal: true, floating: false, scrim: false, onShow: "popupShown", onHide: "popupHidden", components: [
			{name: "episodeTitle", classes: "popup-title"},
			{name: "btnStream", kind: "onyx.Button", content: "Stream", classes: "popup-button onyx-dark", ontap: "stream"},
			{name: "btnResume", kind: "onyx.Button", content: "Resume", classes: "popup-button onyx-dark", ontap: "resume", showing: false},
			{name: "btnDownload", kind: "onyx.Button", content: "Download", classes: "popup-button onyx-dark", ontap: "download"},
			{name: "btnDelete", kind: "onyx.Button", content: "Delete", classes: "popup-button onyx-dark", ontap: "deleteEpisode", showing: false},
			{style: "height: 20px;"},
			{name: "btnMarkPlayed", kind: "onyx.Button", content: "Mark as Played", classes: "popup-button onyx-dark", ontap: "markEpisode"},
			{name: "btnMarkUnplayed", kind: "onyx.Button", content: "Mark as Unplayed", classes: "popup-button last onyx-dark", ontap: "markEpisode"},
		]}
	],
	podcastChanged: function() {
		// this.inherited(arguments);
		var p = this.podcast;
		this.$.logo.setSrc(p.logo600);
		this.$.title.setContent(p.name);
		this.$.author.setContent("by " + p.artist);

		this.$.spinner.setShowing(true);

		PodcastManager.getAllEpisodes(this, p.name);
	},
	renderEpisodes: function(episodes) {
		// this.log(episodes);

		this.$.episodes.destroyClientControls();

		for (var i=0; i<episodes.length; i++) {
			var date = new Date(episodes[i].date);
			date = date.toDateString() + " " + date.toLocaleTimeString();

			this.$.episodes.createComponent({kind: "EpisodeItem", title: episodes[i].title, subTitle: date, episode: episodes[i], onShowPopup: "showPopup", onStreamEp: "stream", onDownloadEp: "download", onResumeEp: "resume", owner: this});
		}

		this.$.spinner.setShowing(false);
		this.$.episodes.createComponent({kind: "onyx.Button", content: "Unsubscribe", style: "margin-top: 20px;", classes: "onyx-negative", ontap: "unsubscribe", owner: this});
		this.$.episodes.render();
	},
	stream: function(inSender, episode) {
		this.log(inSender);
		// this.log(inEvent);
		// this.log(episode);
		if (inSender && inSender.parent.kind == "onyx.Popup") {
			episode = this.activeEpisode.episode;
		}

		episode.logo100 = this.podcast.logo100;
		episode.logo600 = this.podcast.logo600;
		this.doStream(episode);
		// this.activePodcast = inSender.episode;
	},
	resume: function(inSender, episode) {
		// this.log(inSender);
		// this.log(inEvent);
		// this.log(episode);
		if (inSender.parent.kind == "onyx.Popup") {
			episode = this.activeEpisode.episode;
		}
		episode.logo100 = this.podcast.logo100;
		episode.logo600 = this.podcast.logo600;
		this.doResume(episode);
		// this.activePodcast = inSender.episode;
	},
	download: function(inSender, episode) {
		// this.log(inSender);

		if (inSender && inSender.parent.kind == "onyx.Popup") {
			episode = this.activeEpisode.episode;
		}
		// this.log(episode);

		DownloadManager.download(this, inSender, episode);
		this.$.popup.hide();
	},
	deleteEpisode: function(inSender, episode) {
		episode = this.activeEpisode.episode;
		this.log(episode);

		PodcastManager.updateEpisode(this, "download", this.activeEpisode.episode);
		this.$.popup.hide();
		// this.podcastChanged();
	},
	showPopup: function(inSender, inEvent) {
		this.activeEpisode = inSender;
		// this.log(this.activeEpisode);
		var e = this.activeEpisode.episode;
		this.$.episodeTitle.setContent(e.title);
		
		this.$.btnResume.setShowing(false);
		if (e.progress > 0 && e.duration > 0) {
			var percent = Math.floor(e.progress / e.duration * 100);
			this.$.btnResume.setShowing(true);
			this.$.btnResume.setContent("Resume from " + this.makeTimePretty(e.progress));
		}

		if (e.downloaded == "true") {
			this.$.btnStream.setContent("Play");
			this.$.btnDelete.setShowing(true);
			this.$.btnDownload.setShowing(false);
		} else {
			this.$.btnStream.setContent("Stream");
			this.$.btnDelete.setShowing(false);
			this.$.btnDownload.setShowing(true);
		}

		this.$.popup.show();
	},
	markEpisode: function(inSender) {
		var played = false;
		if (inSender.name == "btnMarkPlayed") {
			played = true;
		}

		PodcastManager.updateEpisode(this, "played", this.activeEpisode.episode, played);
	},
	unsubscribe: function() {
		PodcastManager.unsubscribe(this, this.podcast);
	},
	makeTimePretty: function(totalSec) {
		var hours = parseInt( totalSec / 3600 ) % 24;
		var minutes = parseInt( totalSec / 60 ) % 60;
		var seconds = totalSec % 60;

		// if (hours < 10) { hours = "0" + hours; }
		if (minutes < 10) { minutes = "0" + minutes; }
		if (seconds < 10) { seconds = "0" + seconds; }

		var time = hours + ":" + minutes + ":" + seconds;
		return time;
	}
});