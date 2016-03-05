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
        {kind: 'choorp.Video', name: 'videoPlayer'},
		{name: "title", classes: "title", content: "Title"},
        {kind: "FittableRows", name: "audioPlayer", fit: true, components: [
            {name: "logo", kind: "FittableRows", classes: "logo", fit: true, components :[
                {name: "coverPlay", classes: "cover-play", ontap: "coverTapped"},
                {kind: "FittableColumns", style: "height: 50%;", components: [
                    {name: "coverRewind", classes: "cover-rewind", ontap: "coverTapped"},
                    {name: "coverForward", classes: "cover-forward", ontap: "coverTapped"}
                ]}
            ]},
            {kind: "onyx.Slider", value: 0, onChange: "positionChanged", onChanging: "positionChanging", style: "margin-top: 20px; margin-bottom: 20px;", onmousedown: "scrubSlider"},
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
	create: function() {
		this.inherited(arguments);
		this.$.audio.hasNode().preload = "none";
		this.$.audio.hasNode().mozAudioChannelType = "content";
	},
	episodeChanged: function() {
		this.log(this.episode);
		this.$.title.setContent(this.episode.title);
		this.$.logo.hasNode().style.backgroundImage = "url('" + this.episode.logo600 + "')";

        if (this.episode.type == "video/mp4") {
            this.$.audioPlayer.setShowing(false);
            this.$.videoPlayer.setShowing(true);
        } else {
            this.$.videoPlayer.setShowing(false);
            this.$.audioPlayer.setShowing(true);
        }

		if (this.episode.downloaded == "true") {
			this.log("Playing local file.");
			if (typeof this.episode.localUrl == "string") {
				StorageManager.get(this, this.episode.localUrl);
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
        
        if (this.episode.type == 'video/mp4') {
            this.$.videoPlayer.setSrc(source);
            this.$.videoPlayer.play();
        } else {
            this.$.audio.hasNode().mozAudioChannelType = "content";
            this.updateNotification();

            this.$.audio.setSrc(source);
            this.playAudio();
        }

		// var options = {
		// 	contentTitle: this.episode.title,
		// 	contentUri: source,
		// 	imageUri: this.episode.logo600
		// };
		// blackberry.invoke.card.invokeMediaPlayer(options, "", "", "");
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
		this.log(inSender);
		var current = inSender.eventNode.currentTime;
		var duration = inSender.eventNode.duration;
		this.log("Current: " + current);
		this.log("Duration: " + duration);

		this.$.slider.setValue(0);
		if (this.playbackType == "resume" && this.episode.progress > 0) {
			this.$.audio.hasNode().currentTime = this.episode.progress;
			this.$.slider.setValue(this.episode.progress / this.episode.duration * 100);
			this.updateTimes(this.episode.progress, this.episode.duration);
		} else {
			this.updateTimes(current, duration);
		}
		
		this.$.audio.hasNode().title = this.episode.title;
		this.$.audio.hasNode().contentTitle = this.episode.title;
	},
	timeChanged: function(inSender, inEvent) {
		// this.log(inSender);
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
		this.$.btnPlay.addRemoveClass("play", false);
		this.$.btnPlay.addRemoveClass("pause", true);
	},
	pauseAudio: function() {
		this.$.audio.pause();
		this.$.btnPlay.addRemoveClass("pause", false);
		this.$.btnPlay.addRemoveClass("play", true);
	},
	togglePlay: function(inSender, inResponse) {
		if (this.$.audio.getPaused()) {
			this.playAudio();
		} else {
			this.pauseAudio();
		}
	},
	jumpBack: function() {
		this.$.audio.set("jumpSec", 10);
		this.$.audio.jumpBackward();
	},
	jumpForward: function() {
		this.$.audio.set("jumpSec", 30);
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