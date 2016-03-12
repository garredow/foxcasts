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
		{kind: "FittableRows", name: "videoContainer", fit: true, components: [
			{kind: "choorp.Video", name: "videoPlayer", ontimeupdate: "timeChanged", onLoadedMetaData: "metaDataLoaded"},
			{name: "videoTitle", classes: "title", content: "Title"},
			{kind: "enyo.Scroller", fit: true, touch: true, thumb: false, horizontal: "hidden", components: [
				{name: "description", classes: "description", allowHtml: true}
			]}
		]},
		{kind: "FittableRows", name: "audioContainer", classes: "audio-container", fit: true, components: [
			{kind: "enyo.Audio", name:"audioPlayer", src: "", ontimeupdate: "timeChanged", onLoadedMetaData: "metaDataLoaded", onplay: "updateControlsUI", onpause: "updateControlsUI"},
			{name: "audioTitle", classes: "title", content: "Title"},
			{name: "logo", kind: "FittableRows", classes: "logo", fit: true, components :[
				{name: "coverPlay", classes: "cover-play", ontap: "coverTapped"},
				{kind: "FittableColumns", style: "height: 50%;", components: [
					{name: "coverRewind", classes: "cover-rewind", ontap: "coverTapped"},
					{name: "coverForward", classes: "cover-forward", ontap: "coverTapped"}
				]}
			]},
			{kind: "onyx.Slider", value: 0, onChange: "sliderChanged", onChanging: "sliderChanging", style: "margin-top: 20px; margin-bottom: 20px;", onmousedown: "scrubSlider"},
			{name: "controlsBox", kind: "FittableColumns", style: "text-align: center; padding-bottom: 10px; width: 100%;", components: [
				{name: "timeCurrent", classes: "time-label current", content: "0:00:00"},
				{name: "btnBack", classes: "playback-button rewind", ontap: "jumpBack"},
				{name: "btnPlay", classes: "playback-button play", ontap: "togglePlay"},
				{name: "btnForward", classes: "playback-button forward", ontap: "jumpForward"},
				{name: "timeDuration", classes: "time-label duration", content: "0:00:00"}
			]}
		]}
	],
	sliderManual: false,
	lastUpdate: 0,
	notification: null,
	actionBlocked: false,
	mediaPlayer: "",
	mediaIsVideo: false,
	create: function() {
		this.inherited(arguments);
		// this.$.audioPlayer.hasNode().preload = "none";
		// this.$.audioPlayer.hasNode().mozAudioChannelType = "content";
	},
	episodeChanged: function() {
		this.log(this.episode);
        
        // Clear current episode
        this.$.videoPlayer.setSrc("");
        this.$.videoTitle.setContent("");
        this.$.description.setContent("");
        this.$.audioPlayer.setSrc("");
        this.$.audioTitle.setContent("");
        this.$.logo.hasNode().style.backgroundImage = "none";
        this.$.slider.setValue(0);

        this.mediaIsVideo = this.episode.type == "video/mp4" ? true : false;
        this.log("mediaIsVideo", this.mediaIsVideo);

		// Show and configure the proper media player
        if (this.mediaIsVideo) {
        	this.mediaPlayer = this.$.videoPlayer;

            this.$.audioContainer.setShowing(false);
            this.$.videoContainer.setShowing(true);

            this.$.videoTitle.setContent(this.episode.title);
            this.$.description.setContent(this.episode.description);
        } else {
        	this.mediaPlayer = this.$.audioPlayer;

            this.$.videoContainer.setShowing(false);
            this.$.audioContainer.setShowing(true);

            this.$.audioTitle.setContent(this.episode.title);
            this.$.logo.hasNode().style.backgroundImage = "url('" + this.episode.logo600 + "')";
        }

        // Are we streaming from a remote server or playing local content?
		if (this.episode.downloaded == "true") {
			this.log("Playing local file.");
			if (typeof this.episode.localUrl == "string") {
				StorageManager.get(this, this.episode);
			} else {
				// Handle old storage method (blob)
				this.startEpisode(this.episode.localUrl);
			}
		} else {
			this.log("Streaming remote file.");
			this.startEpisode(this.episode.fileUrl);
		}
	},
	startEpisode: function(source) {
		this.log(source);

		if (!this.mediaIsVideo) {
			this.mediaPlayer.hasNode().mozAudioChannelType = "content";
		}
        
        this.mediaPlayer.setSrc(source);

		// if (this.playbackType == "resume" && this.episode.progress > 0) {
		// 	this.mediaPlayer.hasNode().currentTime = this.episode.progress;
		// 	this.updateTimes(this.episode.progress, this.episode.duration);

		// 	if (!this.mediaIsVideo) {
		// 		this.$.slider.setValue(this.episode.progress / this.episode.duration * 100);
		// 	}
		// }

        this.mediaPlayer.play();
        
        this.updateNotification();
	},
	updateNotification: function() {
		var pref = PREFS.notification;

		if (pref == "none") {
			return;
		} else if (pref == "simple" && !this.notification) {
			var title = "Now Playing";
			var options = {
				body : "Tap to play/pause",
				icon : "app://foxcasts.com/assets/icon-64.png",
				tag  : "playback"
			};
			this.notification = new Notification(title, options);
			this.notification.onclick = enyo.bind(this, this.notificationTapped);
			this.notification.onclose = enyo.bind(this, this.notificationClosed);
		} else if (pref == "dynamic") {
			var title = "Now Playing";
			var options = {
				body : this.episode.title,
				icon : this.episode.logo100,
				tag  : "playback"
			};
			this.notification = new Notification(title, options);
			this.notification.onclick = enyo.bind(this, this.notificationTapped);
			this.notification.onclose = enyo.bind(this, this.notificationClosed);
		}
	},
	notificationTapped: function(event) {
		if (!this.actionBlocked) {
			this.log("fired");
			this.togglePlay();

			// Sometimes this even gets fired multiple times when the notif is clicked. We need to limit this to one action per click.
			// TODO: Find out why this event is being fired too many times.
			this.actionBlocked = true;
			setTimeout(enyo.bind(this, function() {
				this.actionBlocked = false;
			}), 500);
		}
		
	},
	notificationClosed: function(event) {
		this.log("fired");
		this.notification = null;
	},
	coverTapped: function(sender) {
		if (PREFS.coverControls != "on") {
			return;
		}

		switch (sender.name) {
			case "coverPlay":
				this.togglePlay();
				break;
			case "coverRewind":
				this.jumpBack();
				break;
			case "coverForward":
				this.jumpForward();
				break;
		}
	},
	metaDataLoaded: function(inSender, inEvent) {
		// this.log(inSender);
		var current = inSender.eventNode.currentTime;
		var duration = inSender.eventNode.duration;

		if (this.playbackType == "resume" && this.episode.progress > 0) {
			this.mediaPlayer.hasNode().currentTime = this.episode.progress;

			if (!this.mediaIsVideo) {
				this.$.slider.setValue(this.episode.progress / this.episode.duration * 100);
				this.updateTimes(this.episode.progress, this.episode.duration);
			}
		} else {
			this.updateTimes(current, duration);
		}
		
		// this.mediaPlayer.hasNode().title = this.episode.title;
		// this.mediaPlayer.hasNode().contentTitle = this.episode.title;
	},
	timeChanged: function(inSender, inEvent) {
		var current = Math.floor(inEvent.currentTime);
		var duration = Math.floor(inEvent.duration);

		if (current == this.lastUpdate) {
			return;
		}

		if (!this.sliderManual) {
			var percent = parseInt(current / duration * 100);
			this.$.slider.animateTo(percent);
		}

		this.updateTimes(current, duration);
		this.saveTrackPosition(current, duration);

		this.lastUpdate = current;
	},
	sliderChanged: function() {
		if (this.episode.progress && this.episode.duration) {
			// this.log("Changing current position...");
			var percent = this.$.slider.getValue();
			var newPos = (percent / 100) * this.episode.duration;

			this.mediaPlayer.hasNode().currentTime = newPos;
			this.updateTimes(newPos);

			var stopped = this.mediaPlayer.getPaused();
			if (!stopped) {
				this.$.audioPlayer.play();
			}
		}

		this.sliderManual = false;
	},
	updateControlsUI: function(inSender, inEvent) {
		if (!this.mediaIsVideo) {
			if (inEvent.type == "play") {
				this.$.btnPlay.addRemoveClass("play", false);
				this.$.btnPlay.addRemoveClass("pause", true);
			} else {
				this.$.btnPlay.addRemoveClass("pause", false);
				this.$.btnPlay.addRemoveClass("play", true);
			}
		}
	},
	sliderChanging: function() {
		// var current = this.$.slider.getValue();
		// this.log(current);
	},
	scrubSlider: function(inSender, inEvent) {
		this.sliderManual = true;
	},
	playMedia: function() {
		this.mediaPlayer.play();
	},
	togglePlay: function() {
		if (this.mediaPlayer.getPaused()) {
			this.mediaPlayer.play();
		} else {
			this.mediaPlayer.pause();
		}
	},
	jumpBack: function() {
		this.mediaPlayer.set("jumpSec", 10);
		this.mediaPlayer.jumpBackward();
	},
	jumpForward: function() {
		this.mediaPlayer.set("jumpSec", 30);
		this.mediaPlayer.jumpForward();
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

		if (minutes < 10) { minutes = "0" + minutes; }
		if (seconds < 10) { seconds = "0" + seconds; }

		var time = hours + ":" + minutes + ":" + seconds;
		return time;
	},
	saveTrackPosition: function(current, duration) {
		var working = {
			name: null,
			episode: this.episode
		};
		PodcastManager.updateEpisode(this, "progress", working, {current: current, duration: duration});
	}
});