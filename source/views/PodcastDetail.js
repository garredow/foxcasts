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
			{name: "title", classes: "podcast-title", ontap: ""},
			{name: "author", classes: "podcast-author"},
			{name: "description", classes: "podcast-description"},
			{name: "spinnerContainer", style: "text-align: center;", components: [
				{kind: "onyx.Spinner", showing: true},
			]},
			{name: "episodes", style: "text-align: center;"}
		]},
		{kind: "onyx.Popup", classes: "episode-action-popup", centered: true, modal: true, floating: true, scrim: true, onShow: "popupShown", onHide: "popupHidden", components: [
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
	workingEpisode: {},
	refreshList: function() {
		// this.podcastChanged();
	},
	podcastChanged: function() {
		var p = this.podcast;
		this.$.logo.setSrc(p.logo600);
		this.$.title.setContent(p.name);
		this.$.author.setContent("by " + p.artist);

		this.$.scroller.scrollToTop();
		this.$.episodes.destroyClientControls();
		this.$.spinner.setShowing(true);

		PodcastManager.getAllEpisodes(this, p.name);
	},
	checkForNewEpisodes: function() {
		PodcastManager.requestPodcastRefresh(this, this.podcast);
	},
	renderEpisodes: function(episodes) {
		// this.log(episodes);

		for (var i=0; i<episodes.length; i++) {
			var date = new Date(episodes[i].date);
			date = date.toDateString() + " " + date.toLocaleTimeString();

			this.$.episodes.createComponent({kind: "EpisodeItem", title: episodes[i].title, subTitle: date, episode: episodes[i], onShowPopup: "showPopup", onStreamEp: "stream", onDownloadEp: "download", onResumeEp: "resume", owner: this});
		}

		this.$.spinner.setShowing(false);
		this.$.episodes.createComponent({kind: "onyx.Button", content: "Unsubscribe", style: "margin: 20px 10px 10px 0;", classes: "onyx-negative", ontap: "unsubscribe", owner: this});
		this.$.episodes.createComponent({kind: "onyx.Button", content: "Refresh", style: "margin: 20px 0 10px 0;", classes: "onyx-dark", ontap: "checkForNewEpisodes", owner: this});
		this.$.episodes.render();
	},
	stream: function(inSender, inEvent) {
        this.log("activeEpisode", this.activeEpisode.episode);

		this.doStream(this.activeEpisode.episode);
		this.$.popup.hide();
	},
	resume: function(inSender, episode) {
		var working = this.findWorkingEpisode();

		this.doResume(working.episode);
		this.$.popup.hide();
	},
	download: function(inSender, episode) {
		var working = this.findWorkingEpisode();

		DownloadManager.download(this, working);
		this.$.popup.hide();
	},
	deleteEpisode: function(inSender, episode) {
		var working = this.findWorkingEpisode();

		StorageManager.delete(this, working);
		this.$.popup.hide();
	},
	markEpisode: function(inSender) {
		var played = (inSender.name == "btnMarkPlayed") ? true : false;
		var working = this.findWorkingEpisode();

		PodcastManager.updateEpisode(this, "played", working, played);
		this.$.popup.hide();
	},
	findWorkingEpisode: function() {
		var e = {
			name: this.activeEpisode.name,
			episode: this.activeEpisode.episode
		};

		return(e);
	},
	showPopup: function(inSender, inEvent) {
		this.activeEpisode = inSender;
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
	unsubscribe: function() {
		PodcastManager.unsubscribe(this, this.podcast);
	},
	makeTimePretty: function(totalSec) {
		var hours = parseInt( totalSec / 3600 ) % 24;
		var minutes = parseInt( totalSec / 60 ) % 60;
		var seconds = totalSec % 60;

		if (minutes < 10) { minutes = "0" + minutes; }
		if (seconds < 10) { seconds = "0" + seconds; }

		var time = hours + ":" + minutes + ":" + seconds;
		return time;
    }
});