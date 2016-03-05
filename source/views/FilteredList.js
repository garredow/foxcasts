enyo.kind({
	name: "FilteredList",
	kind: "FittableRows",
	fit: true,
	style: "padding: 0 0 0 0;",
	classes: "podcast-detail",
	published: {
		headerText: "More Info",
		podcast: "",
		activeEpisode: "",
		filter: ""
	},
	events: {
		onStream: "",
		onResume: "",
		onPodcastDeleted: ""
	},
	components:[
		{kind: "enyo.Scroller", fit: true, touch: true, thumb: false, horizontal: "hidden", components: [
			{name: "spinnerContainer", style: "text-align: center;", components: [
				{kind: "onyx.Spinner", showing: true},
			]},
			{name: "episodes"}
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
	filterChanged: function() {
		switch (this.filter) {
			case "downloaded":
				this.headerText = "Downloaded";
				break;
			case "inprogress":
				this.headerText = "In Progress";
				break;
			case "recent":
				this.headerText = "Most Recent";
				break;
		}		
	},
	refreshList: function() {
		this.$.episodes.destroyClientControls();
		this.$.spinner.setShowing(true);

		PodcastManager.getSomeEpisodes(this, this.filter);
	},
	renderEpisodes: function(episodes) {
		// this.log(episodes);

		for (var i=0; i<episodes.length; i++) {
			var date = new Date(episodes[i].date);
			date = date.toDateString() + " " + date.toLocaleTimeString();

			this.$.episodes.createComponent({kind: "EpisodeItem", title: episodes[i].name, subTitle: episodes[i].title, episode: episodes[i], onShowPopup: "showPopup", onStreamEp: "stream", onDownloadEp: "download", onResumeEp: "resume", owner: this});
		}

		if (episodes.length === 0) {
			this.$.episodes.createComponent({classes: "empty-list-text", content: "No episodes."});
		}

		this.$.spinner.setShowing(false);
		this.$.episodes.render();
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
	stream: function(inSender, episode) {
		var working = this.findWorkingEpisode();

		this.doStream(working.episode);
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