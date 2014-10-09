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
			{name: "btnDelete", kind: "onyx.Button", content: "Delete", classes: "popup-button onyx-dark", ontap: "deleteEp", showing: false},
			{style: "height: 20px;"},
			{name: "btnMarkPlayed", kind: "onyx.Button", content: "Mark as Played", classes: "popup-button onyx-dark", ontap: "markEpisode"},
			{name: "btnMarkUnplayed", kind: "onyx.Button", content: "Mark as Unplayed", classes: "popup-button last onyx-dark", ontap: "markEpisode"},
		]}
	],
	db: "",
	podcastChanged: function() {
		// this.inherited(arguments);
		var p = this.podcast;
		this.$.logo.setSrc(p.logo600);
		this.$.title.setContent(p.name);
		this.$.author.setContent("by " + p.artist);

		this.$.spinner.setShowing(true);
		this.$.episodes.destroyClientControls();

		var request = window.indexedDB.open("MyTestDatabase1");
		request.onerror = function(event) {
			// Do something with request.errorCode!
		};
		request.onsuccess = enyo.bind(this, function(event) {
			// console.log("PodcastDetail: DB Success");
			this.db = request.result;

			var keyRange = IDBKeyRange.lowerBound(0);
			var trans = this.db.transaction("episodes");
			var store = trans.objectStore("episodes");
			var index = store.index("name");
			// index.get(p.name).onsuccess = function(event) {
			// 	console.log(event.target.result);
			// };
			var key = IDBKeyRange.only(p.name);
			var i = 0;
			var limit = 50; // TODO: Remove this limit
			index.openCursor(key).onsuccess = enyo.bind(this, function(event) {
				var cursor = event.target.result;
				if (cursor && i < limit) {
					// console.log(cursor.primaryKey);
					var episode = cursor.value;
					episode.dbKey = cursor.primaryKey;
					this.$.episodes.createComponent({kind: "EpisodeItem", episode: episode, downloadProgress: 0, onShowPopup: "showPopup", onStreamEp: "stream", onDownloadEp: "download", onResumeEp: "resume", owner: this});
					i++;
					cursor.continue();
				} else {
					this.$.spinner.setShowing(false);
					this.$.episodes.createComponent({kind: "onyx.Button", content: "Unsubscribe", style: "margin-top: 20px;", classes: "onyx-negative", ontap: "unsubscribe", owner: this});
					this.$.episodes.render();
				}
			});
		});
	},
	updateEpisodeItem: function(episode, blob) {
		// this.log(episode);
		if (!this.db) {
			return;
		}

		var store = this.db.transaction(["episodes"], "readwrite").objectStore("episodes");
		store.get(episode.dbKey).onsuccess = enyo.bind(this, function(event) {
			console.log(event);
			var data = event.target.result;

			if (blob) {
				console.log("Saving blob to db.");
				data.downloaded = "true";
				data.localUrl = blob;
			} else {
				console.log("Deleting blob from db.");
				data.downloaded = "false";
				data.localUrl = "";
			}
			

			var update = store.put(data, episode.dbKey);
			update.onerror = function(event) {
				console.log("error");
				console.log(event);
			};
			update.onsuccess = enyo.bind(this, function(event) {
				console.log("Successfully updated podcast db entry. Title = " + episode.title);
				if (data.downloaded == "false") {
					this.podcastChanged();
				}
			});
		});
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
		// this.log(episode);

		if (inSender && inSender.parent.kind == "onyx.Popup") {
			episode = this.activeEpisode.episode;
		}
		// this.log(episode);

		var lastPercent = 0;
		var xhr = new XMLHttpRequest({mozSystem: true});
		xhr.onprogress = enyo.bind(this, function(response) {
			var percent = parseInt(response.loaded / response.total * 100);
			// We don't need to update the UI every time onprogress fires
			if (percent >= lastPercent + 5 || percent == 100) {
				console.log("Downloading... " + percent + "%");
				// this.activeEpisode.applyStyle("background-size", this.downloadProgress + "% 100%");
				this.activeEpisode.setDownloadProgress(percent);
				lastPercent = percent;
			}
		});
		xhr.onreadystatechange = enyo.bind(this, function(response) {
			var res = response.target;
			// console.log(res);
			if (res.readyState == 4 && res.status == 200) {
				// console.log(xhr);
				console.log(response);
				console.log("Download finished!");
				// console.log(res.response);
				this.activeEpisode.episode.downloaded = "true";
				this.activeEpisode.episode.localUrl = res.response;
				this.updateEpisodeItem(episode, res.response);
				// this.stream("", episode);
			}
		});
		xhr.open('GET', episode.fileUrl);
		xhr.responseType = 'blob';
		xhr.send();

		this.$.popup.hide();
	},
	deleteEp: function(inSender, episode) {
		episode = this.activeEpisode.episode;
		this.log(episode);

		this.updateEpisodeItem(episode, "");
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
	getEpisodes: function(subscribe) {
		
	},
	gotEpisodes: function(xml, subscribe) {
		
	},
	subscribe: function() {
		// this.getEpisodes(true);
	},
	markEpisode: function(inSender) {
		if (!this.db) {
			return;
		}

		var played = "false";
		if (inSender.name == "btnMarkPlayed") {
			played = "true";
		}

		var store = this.db.transaction(["episodes"], "readwrite").objectStore("episodes");
		store.get(this.activeEpisode.episode.dbKey).onsuccess = enyo.bind(this, function(event) {
			var data = event.target.result;
			data.played = played;

			var update = store.put(data, this.activeEpisode.episode.dbKey);
			update.onerror = function(event) {
				console.log("error");
				console.log(event);
			};
			update.onsuccess = enyo.bind(this, function(event) {
				console.log("Successfully updated podcast db entry. Played = " + played);
				this.podcastChanged();
			});
		});
	},
	unsubscribe: function() {
		// Delete the podcast from the database
		var trans = this.db.transaction(["podcasts"]);
		var store = trans.objectStore("podcasts");
		var index = store.index("name");
		var key = IDBKeyRange.only(this.podcast.name);
		index.getKey(this.podcast.name).onsuccess = enyo.bind(this, function(event) {
			// console.log(event.target.result);

			// TODO: Do I really need to open a new transaction?
			var store2 = this.db.transaction(["podcasts"], "readwrite").objectStore("podcasts");
			var request = store2.delete(event.target.result);
			request.onerror = function(event) {
				console.log("error");
				console.log(event);
			};
			request.onsuccess = function(event) {
				console.log("Successfully deleted podcast db entry.");
			};
		});

		trans = null; // TODO: Do we need to do this?
		store = null; // TODO: Do we need to do this?
		index = null; // TODO: Do we need to do this?
		key = null; // TODO: Do we need to do this?

		// Delete all the episodes from the database
		var trans = this.db.transaction(["episodes"], "readwrite");
		var store = trans.objectStore("episodes");
		var index = store.index("name");
		var key = IDBKeyRange.only(this.podcast.name);
		index.openCursor(key).onsuccess = enyo.bind(this, function(event) {
			var cursor = event.target.result;
			if (cursor) {
				var request = store.delete(cursor.primaryKey);
				request.onerror = function(event) {
					console.log("Error deleting episode.");
					console.log(event);
				};
				request.onsuccess = function(event) {
					// console.log("Successfully deleted episode.");
				};
				cursor.continue();
			} else {
				console.log("Finished deleting episodes.")
			}
		});

		this.doPodcastDeleted({command: "subscriptions"});
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

enyo.kind({
	name: "EpisodeItem",
	kind: "FittableRows",
	classes: "episode-item",
	published: {
		episode: "",
		downloadProgress: ""
	},
	events: {
		onShowPopup: ""
	},
	components:[
		{kind: "FittableColumns", components: [
			{name: "header", kind: "FittableRows", ontap: "toggleDrawer", classes: "episode-header", style: "margin-right: 40px;", components: [
				{name: "title", classes: "episode-title"},
				{name: "date", classes: "episode-date"},
			]},
			{classes: "overflow-button", ontap: "doShowPopup"}
		]},
		{name: "drawer", kind: "onyx.Drawer", open: false, components: [
			{name: "summary", allowHtml: true, content: ""}
		]}
	],
	create: function() {
		this.inherited(arguments);

		var e = this.episode;
		var date = new Date(e.date);
		date = date.toDateString() + " " + date.toLocaleTimeString();
		this.$.title.setContent(e.title);
		this.$.date.setContent(date);

		if (e.played == "true") {
			this.applyStyle("opacity", .4);
		}
	},
	toggleDrawer: function() {
		if (this.$.drawer.open) {
			this.$.drawer.setOpen(false);
			this.applyStyle("background-color", null);
		} else {
			if (this.$.summary.getContent() == "") {
				this.$.summary.setContent(this.episode.description);
			}
			this.$.drawer.setOpen(true);
			this.applyStyle("background-color", "#333");
		}
	},
	openMenu: function() {
		this.$.popup.show();
	},
	downloadProgressChanged: function() {
		// this.log(this.downloadProgress);
		// this.applyStyle("background-size", this.downloadProgress + "% 100%");
		this.$.date.setContent("Downloading... " + this.downloadProgress + "%");
	}
});