var DownloadManager = {};

DownloadManager.download = function(_this, sender, episode) {
	console.log("DownloadManager.download(): " + episode.title);

	var lastPercent = 0;
	var xhr = new XMLHttpRequest({mozSystem: true});
	xhr.onprogress = function(response) {
		var percent = parseInt(response.loaded / response.total * 100);
		// We don't need to update the UI every time onprogress fires
		if (percent >= lastPercent + 5 || percent == 100) {
			// console.log("Downloading... " + percent + "%");
			_this.activeEpisode.setDownloadProgress(percent);
			lastPercent = percent;
		}
	};
	xhr.onreadystatechange = function(response) {
		var res = response.target;
		// console.log(res);
		if (res.readyState == 4 && res.status == 200) {
			console.log(response);
			console.log("Download finished!");

			_this.activeEpisode.episode.downloaded = "true";
			_this.activeEpisode.episode.localUrl = res.response;

			PodcastManager.updateEpisode(_this, "download", episode, res.response);
			// this.stream("", episode);
		}
	};
	xhr.open('GET', episode.fileUrl);
	xhr.responseType = 'blob';
	xhr.send();
};

DownloadManager.pause = function(id) {
	console.log("DownloadManager.pause(): " + id);
};

DownloadManager.cancel = function(id) {
	console.log("DownloadManager.cancel(): " + id);
};

var PodcastManager = {};
var DB;

PodcastManager.initialize = function(name, version) {
	console.log("PodcastManager.initialize(): " + name + ", " + version);
	if (!name) {
		console.log("No database name specified. Abort.");
		return;
	}

	if (version) {
		var request = window.indexedDB.open(name, version);
	} else {
		var request = window.indexedDB.open(name);
	}
	
	request.onerror = function(event) {
		// Do something with request.errorCode!
	};
	request.onsuccess = function(event) {
		console.log("PodcastManager.initialize(): Success");
		DB = request.result;

		DB.onerror = function(event) {
			console.log("Database error: " + event.target.errorCode);
		};
	};
	request.onupgradeneeded = function(event) {
		console.log("PodcastManager.initialize(): onUpgradeNeeded");
		DB = event.target.result;

		// Cleanse
		var stores = DB.objectStoreNames;
		console.log(stores);
		for (var i=0; i<stores.length; i++) {
			var remove = DB.deleteObjectStore(stores[i]);
		}

		var podcasts = DB.createObjectStore("podcasts", {autoIncrement : true});
		podcasts.createIndex("name", "name", {unique: true});
		podcasts.transaction.oncomplete = function(event) {
			// console.log(event);
		}
		var episodes = DB.createObjectStore("episodes", {autoIncrement : true});
		episodes.createIndex("name", "name", {unique: false});
		episodes.transaction.oncomplete = function(event) {
			// console.log(event);
		}
		episodes.createIndex("played", "played", {unique: false});
		episodes.transaction.oncomplete = function(event) {
			// console.log(event);
		}
		episodes.createIndex("downloaded", "downloaded", {unique: false});
		episodes.transaction.oncomplete = function(event) {
			// console.log(event);
		}
		episodes.createIndex("date", "date", {unique: false});
		episodes.transaction.oncomplete = function(event) {
			// console.log(event);
		}
	};
};

PodcastManager.subscribe = function(_this, podcast, episodes) {
	console.log("PodcastManager.subscribe(): " + podcast.collectionName);

	// Add the podcast to our database
	var store = DB.transaction(["podcasts"], "readwrite").objectStore("podcasts");
	store.onerror = function(event) {
		console.log("Subscription error! (Podcast)");
		console.log(event);
	};

	var p = podcast;
	var data = {
		name: p.collectionName,
		artist: p.artistName,
		summary: podcast.summary || "",
		logo30: p.artworkUrl30,
		logo60: p.artworkUrl60,
		logo100: p.artworkUrl100,
		logo600: p.artworkUrl600,
		feedUrl: p.feedUrl,
		latest: episodes[0].date
	};
	store.add(data);

	var store = null; // TODO: Do we need to do this?

	// Add the episodes to our database
	var trans = DB.transaction(["episodes"], "readwrite");
	trans.oncomplete = enyo.bind(this, function(event) {
		console.log("Subscription completed! (Episodes)");
		// console.log(event);
		_this.$.btnSubscribe.setDisabled(true);
		_this.$.btnSubscribe.setContent("Subscribed!");
	});
	trans.onerror = function(event) {
		console.log("Subscription error! (Episodes)");
		console.log(event);
	};

	var store = trans.objectStore("episodes");
	for (var i=0; i<episodes.length; i++) {
		store.add(episodes[i]);
	}
};

PodcastManager.unsubscribe = function(_this, podcast) {
	console.log("PodcastManager.unsubscribe(): " + podcast.name);
	console.log(podcast);

	// Delete the podcast from the database
	var store = DB.transaction(["podcasts"]).objectStore("podcasts");
	var index = store.index("name");
	var key = IDBKeyRange.only(podcast.name);

	index.getKey(podcast.name).onsuccess = function(event) {
		// console.log(event.target.result);

		// TODO: Do I really need to open a new transaction?
		var store2 = DB.transaction(["podcasts"], "readwrite").objectStore("podcasts");
		var request = store2.delete(event.target.result);
		request.onerror = function(event) {
			console.log("error");
			console.log(event);
		};
		request.onsuccess = function(event) {
			console.log("Successfully deleted " + podcast.name);
		};
	};

	store = null; // TODO: Do we need to do this?
	index = null; // TODO: Do we need to do this?
	key = null; // TODO: Do we need to do this?

	// Delete all the episodes from the database
	var store = DB.transaction(["episodes"], "readwrite").objectStore("episodes");
	var index = store.index("name");
	var key = IDBKeyRange.only(podcast.name);
	index.openCursor(key).onsuccess = function(event) {
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
			console.log("Successfully deleted " + podcast.name + " episodes.");
		}
	};

	// Depending on the sender, we might need to perform special actions
	if (_this.name == "podcastDetail") {
		_this.doPodcastDeleted({command: "subscriptions"});
	}
};

PodcastManager.checkIfSubscribed = function(_this, name) {
	console.log("PodcastManager.checkIfSubscribed(): Fired");
	// console.log(this);
	// return;

	var store = DB.transaction("podcasts").objectStore("podcasts");

	var index = store.index("name");
	index.get(name).onsuccess =  function(event) {
		if (!event.target.result) {
			// We're not subscribed to this podcast. Enable Subscribe button.
			_this.checkedSubscription(false);
		} else {
			// We're already subscribed to this podcast. Disable Subscribe button.
			console.log("Already subscribed to this podcast!");
			_this.checkedSubscription(true);
		}
	};
};

PodcastManager.getAllPodcasts = function(_this) {
	console.log("PodcastManager.getAllPodcasts(): Fired");
	var podcasts = [];

	var keyRange = IDBKeyRange.lowerBound(0);
	var store = DB.transaction("podcasts").objectStore("podcasts");
	store.openCursor().onsuccess = function(event) {
		var cursor = event.target.result;
		if (cursor) {
			podcasts.push(cursor.value);
			cursor.continue();
		} else {
			_this.renderPodcasts(podcasts);
		}
	};
};

PodcastManager.getAllEpisodes = function(_this, podcast) {
	console.log("PodcastManager.getAllEpisodes(): Fired");
	var episodes = [];

	var keyRange = IDBKeyRange.lowerBound(0);
	var store = DB.transaction("episodes").objectStore("episodes");
	var index = store.index("name");
	var key = IDBKeyRange.only(podcast);
	var i = 0;
	var limit = 50; // TODO: Remove this limit
	index.openCursor(key).onsuccess = function(event) {
		var cursor = event.target.result;
		if (cursor && i < limit) {
			var episode = cursor.value;
			episode.dbKey = cursor.primaryKey;
			episodes.push(episode);

			i++;
			cursor.continue();
		} else {
			_this.renderEpisodes(episodes);
		}
	};
};

PodcastManager.updateEpisode = function(_this, event, episode, data) {
	console.log("PodcastManager.updateEpisode(): Event = " + event);
	console.log(data);

	var store = DB.transaction(["episodes"], "readwrite").objectStore("episodes");
	store.get(episode.dbKey).onsuccess = function(response) {
		console.log(response);
		var ep = response.target.result;

		switch (event) {
			case "download":
				if (data) {
					console.log("Saving blob to db.");
					ep.downloaded = "true";
					ep.localUrl = data;
				} else {
					console.log("Deleting blob from db.");
					ep.downloaded = "false";
					ep.localUrl = "";
				}
				break;
			case "played":
				if (data === true) {
					ep.played = "true";
				} else {
					ep.played = "false";
				}
				break;
			case "progress":
				ep.progress = data.current;
				ep.duration = data.duration;

				if (data.current/data.duration*100 >= 97) {
					ep.played = "true";
				} else {
					ep.played = "false";
				}
				break;
			default:
				console.log("No action taken.");
		}

		var update = store.put(ep, episode.dbKey);
		update.onerror = function(response) {
			console.log("error");
			console.log(response);
		};
		update.onsuccess = function(response) {
			console.log("Successfully updated podcast db entry. Title = " + episode.title);
			if (ep.downloaded == "false") {
				// this.podcastChanged();
			}
		};
	};
};












