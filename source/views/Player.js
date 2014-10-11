enyo.kind({
	name: "Player",
	kind: "FittableRows",
	fit: true,
	classes: "player",
	published: {
		headerText: "Player",
		episode: "",
		playbackType: ""
	},
	events: {
		onOpenPodcast: ""
	},
	components:[
		{kind: "enyo.Audio", src: "", ontimeupdate: "timeChanged", onLoadedMetaData: "metaDataLoaded"},
		{name: "title", classes: "title", content: "Title"},
		{name: "logo", kind: "Image", src: "assets/blank-cover.png", classes: "logo", fit: true},
		{kind: "onyx.Slider", value: 0, onChange: "positionChanged", onChanging: "positionChanging", style: "margin-top: 20px; margin-bottom: 20px;", onmousedown: "scrubSlider"},
		{name: "controlsBox", kind: "FittableColumns", style: "text-align: center; padding-bottom: 10px; width: 100%;", components: [
			{name: "timeCurrent", classes: "time-label current", content: "0:00:00"},
			{name: "btnBack", kind: "Image", src: "assets/icons/icon-rew.png",  ontap: "jumpBack"},
			{name: "btnPlay", kind: "Image", src: "assets/icons/icon-play.png", style: "margin: 0 20px;", ontap: "togglePlay"},
			{name: "btnForward", kind: "Image", src: "assets/icons/icon-ff.png", ontap: "jumpForward"},
			{name: "timeDuration", classes: "time-label duration", content: "0:00:00"},
		]}
	],
	sliderManual: false,
	lastUpdate: 0,
	create: function() {
		this.inherited(arguments);
		this.$.audio.hasNode().preload = "none";
		this.$.audio.hasNode().mozAudioChannelType = "content";
		// this.log(this.$.audio.hasNode());
		
	},
	episodeChanged: function() {
		this.log(this.episode);
		this.$.title.setContent(this.episode.title);
		this.$.logo.setSrc(this.episode.logo600);

		if (this.episode.downloaded == "true") {
			this.log("Playing local file.");
			var audio = URL.createObjectURL(this.episode.localUrl);
			this.$.audio.setSrc(audio);
		} else {
			this.log("Streaming remote file.");
			this.$.audio.setSrc(this.episode.fileUrl);
		}

		this.$.audio.hasNode().mozAudioChannelType = "content";

		// this.playAudio();
	},
	metaDataLoaded: function(inSender, inEvent) {
		this.log(inSender);
		var current = inSender.eventNode.currentTime;
		var duration = inSender.eventNode.duration;
		// this.log("Current: " + current);
		// this.log("Duration: " + duration);

		this.$.slider.setValue(0);
		if (this.playbackType == "resume" && this.episode.progress > 0) {
			this.$.audio.hasNode().currentTime = this.episode.progress;
			this.$.slider.setValue(this.episode.progress / this.episode.duration * 100);
			this.updateTimes(this.episode.progress, this.episode.duration);
		} else {
			this.updateTimes(current, duration);
		}
		
	},
	timeChanged: function(inSender, inEvent) {
		// this.log(inEvent);
		var current = Math.floor(inEvent.currentTime);
		if (current == this.lastUpdate) {
			return;
		}
		var duration = Math.floor(inEvent.duration);
		var percent = parseInt(current / duration * 100);
		if (!this.sliderManual) {
			this.$.slider.animateTo(percent);
		}

		this.updateTimes(current, duration);

		if (current % 5 == 0) {
			this.saveTrackPosition(current, duration);
		}

		this.lastUpdate = current;
	},
	positionChanged: function() {
		var percent = this.$.slider.getValue();
		// this.log(percent);

		if (this.episode.progress && this.episode.duration) {
			// this.log("Changing current position...");
			var stopped = this.$.audio.getPaused();
			var newPos = (percent / 100) * this.episode.duration;
			// this.log("Duration: " + this.episode.duration);
			// this.log("New Position: " + newPos);
			this.$.audio.hasNode().currentTime = newPos;

			this.updateTimes(newPos);
			if (!stopped) {
				this.$.audio.play();
			}
		}

		this.sliderManual = false;
	},
	positionChanging: function() {
		var current = this.$.slider.getValue();
		// this.log(current);
	},
	scrubSlider: function(inSender, inEvent) {
		// this.log(inSender);
		// this.log(inEvent);
		this.sliderManual = true;
	},
	playAudio: function() {
		this.$.audio.play();
		this.$.btnPlay.setSrc("assets/icons/icon-pause.png");
	},
	pauseAudio: function() {
		this.$.audio.pause();
		this.$.btnPlay.setSrc("assets/icons/icon-play.png");
	},
	togglePlay: function(inSender, inResponse) {
		if (this.$.audio.getPaused()) {
			this.playAudio();
		} else {
			this.pauseAudio();
		}
	},
	jumpBack: function() {
		this.$.audio.jumpBackward();
	},
	jumpForward: function() {
		this.$.audio.jumpForward();
	},
	updateTimes: function(current, duration) {
		// if (current) {
			this.episode.progress = current;
			var c = this.makeTimePretty(Math.floor(current));
			this.$.timeCurrent.setContent(c);
		// }

		if (duration) {
			this.episode.duration = duration;
			var d = this.makeTimePretty(Math.floor(duration));
			this.$.timeDuration.setContent(d);
		}
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
	},
	saveTrackPosition: function(current, duration) {
		PodcastManager.updateEpisode(this, "progress", this.episode, {current: current, duration: duration});
	}
});