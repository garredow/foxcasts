var DownloadManager = {};

DownloadManager.download = function(_this, sender) {
	console.log("DownloadManager.download(): " + sender.episode.title);
	console.log(sender.episode);

	var lastPercent = 0;
	var xhr = new XMLHttpRequest({mozSystem: true});
	xhr.onprogress = function(response) {
		var percent = parseInt(response.loaded / response.total * 100);
		// We don't need to update the UI every time onprogress fires
		if (percent > lastPercent || percent == 100) {
			// console.log("Downloading... " + percent + "%");
			_this.$[sender.name].setDownloadProgress(percent);
			lastPercent = percent;
		}
	};
	xhr.onreadystatechange = function(response) {
		var res = response.target;
		// console.log(res);
		if (res.readyState == 4 && res.status == 200) {
			console.log(response);
			console.log("Download finished!");

			StorageManager.store(_this, sender, res.response);
		}
	};
	xhr.open('GET', sender.episode.fileUrl);
	xhr.responseType = 'blob';
	xhr.send();
};

DownloadManager.pause = function(id) {
	console.log("DownloadManager.pause(): " + id);
};

DownloadManager.cancel = function(id) {
	console.log("DownloadManager.cancel(): " + id);
};

var StorageManager = [];

StorageManager.store = function(_this, sender, blob) {
	console.log("ready to store file...");
	console.log(sender);

	var storage, name;

	if (sender.episode.type == "video/mp4") {
		storage = navigator.getDeviceStorage("videos");
		console.log(storage);
		name = sender.episode.name + sender.episode.date + ".mp4";
	} else {
		storage = navigator.getDeviceStorage("music");
		console.log(storage);
		name = sender.episode.name + sender.episode.date + ".mp3";
	}
	

	var request = storage.addNamed(blob, name);

	request.onsuccess = function (response) {
		// var name = this.result;
		console.log(response);
		console.log('File "' + name + '" successfully wrote on the sdcard storage area');
		PodcastManager.updateEpisode(_this, "download", sender, name);
	};

	// An error typically occur if a file with the same name already exist
	request.onerror = function (e) {
		console.log(e);
		console.warn('Unable to write the file');
		alert("Unable to write file. A file with the same name may already exist.");
	};
};

StorageManager.get = function(_this, episode) {
	console.log("ready to get file...");
	
	var storage;

	if (episode.type == "video/mp4") {
		storage = navigator.getDeviceStorage("videos");
	} else {
		storage = navigator.getDeviceStorage("music");
	}

	var request = storage.get(episode.localUrl);

	request.onsuccess = function () {
		var file = this.result;
		console.log(file);
		// console.log("Get the file: " + file.name);
		var url = URL.createObjectURL(file);
		_this.startEpisode(url);
	};

	request.onerror = function () {
		console.warn("Unable to get the file: " + this.error);
		alert("Unable to locate file. Did you change the default media storage location?");
	};
};

StorageManager.delete = function(_this, sender) {
	console.log("ready to delete file...");
	var name = sender.episode.localUrl;
	
	if (typeof name === "string") {
		var storage = navigator.getDeviceStorage('music');
		console.log(storage);

		var request = storage.delete(name);

		request.onsuccess = function () {
			console.log(name + " successfully deleted");
			PodcastManager.updateEpisode(_this, "download", sender, null);
		};

		request.onerror = function () {
			console.log("Unable to delete the file: " + this.error);
			alert("Unable to locate file. Did you change the default media storage location?");
		};
	} else {
		// This episode is stored in the old format (blob) and must be deleted a different way
		PodcastManager.updateEpisode(_this, "download", sender, null);
	}
};

var PodcastManager = {};
var DB;

PodcastManager.initialize = function(name, version) {
	console.log("PodcastManager.initialize(): " + name + ", " + version);
	if (!name) {
		console.log("No database name specified. Abort.");
		return;
	}

	var request;
	if (version) {
		request = window.indexedDB.open(name, version);
	} else {
		request = window.indexedDB.open(name);
	}
	
	request.onerror = function(event) {
		// Do something with request.errorCode!
	};
	
	request.onsuccess = function(event) {
		console.log("PodcastManager.initialize(): Success");
		DB = request.result;

		// Let it be known that the database is ready
		enyo.Signals.send("onDatabaseReady");

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
		};
		
		var episodes = DB.createObjectStore("episodes", {autoIncrement : true});
		episodes.createIndex("name", ["name", "date"], {unique: false});
		episodes.transaction.oncomplete = function(event) {
			// console.log(event);
		};
		
		episodes.createIndex("played", ["played", "date"], {unique: false});
		episodes.transaction.oncomplete = function(event) {
			// console.log(event);
		};
		
		episodes.createIndex("downloaded", ["downloaded", "date"], {unique: false});
		episodes.transaction.oncomplete = function(event) {
			// console.log(event);
		};
		
		episodes.createIndex("inprogress", ["inprogress", "date"], {unique: false});
		episodes.transaction.oncomplete = function(event) {
			// console.log(event);
		};
		
		episodes.createIndex("date", "date", {unique: false});
		episodes.transaction.oncomplete = function(event) {
			// console.log(event);
		};
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

	store = null; // TODO: Do we need to do this?

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

	console.log(episodes);
	store = trans.objectStore("episodes");
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
	store = DB.transaction(["episodes"], "readwrite").objectStore("episodes");
	index = store.index("name");
	// var key = IDBKeyRange.only(podcast.name);
	key = IDBKeyRange.bound([podcast.name, 0], [podcast.name, 99999999999999999999999]); // TODO: Find a better way to do this
	var episodeCount = 0;
	index.openCursor(key).onsuccess = function(event) {
		var cursor = event.target.result;
		// console.log(cursor);
		if (cursor) {
			// console.log(cursor);
			var request = store.delete(cursor.primaryKey);
			request.onerror = function(event) {
				console.log("Error deleting episode.");
				console.log(event);
			};
			request.onsuccess = function(event) {
				// console.log("Successfully deleted episode.");
				episodeCount++;
			};
			cursor.continue();
		} else {
			console.log("Successfully deleted " + episodeCount + " " + podcast.name + " episodes.");
		}
	};

	// Depending on the sender, we might need to perform special actions
	if (_this.name == "podcastDetail") {
		_this.doPodcastDeleted({command: "subscriptions"});
	}
};

PodcastManager.checkIfSubscribed = function(_this, name) {
	// console.log("PodcastManager.checkIfSubscribed(): Fired");

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
	// console.log("PodcastManager.getAllPodcasts(): Fired");
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
	// console.log("PodcastManager.getAllEpisodes(): Fired");
	var episodes = [];

	// var keyRange = IDBKeyRange.lowerBound([podcast,0]);
	var lowerBound = [podcast,0];
	var upperBound = [podcast,2000000000000];
	var range = IDBKeyRange.bound(lowerBound, upperBound);
	
	var store = DB.transaction("episodes").objectStore("episodes");
	var index = store.index("name");
	// var key = IDBKeyRange.bound(range);
	var i = 0;
	var limit = 50; // TODO: Remove this limit
	index.openCursor(range, "prev").onsuccess = function(event) {
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

PodcastManager.getSomeEpisodes = function(_this, filter) {
	console.log("PodcastManager.getSomeEpisodes(): " + filter);
	var episodes = [];

	// var keyRange = IDBKeyRange.lowerBound(0);
	var store = DB.transaction("episodes").objectStore("episodes");

	switch(filter) {
		case "downloaded":
			var index = store.index(filter);
			var key = IDBKeyRange.lowerBound(["true", 0]);
			break;
		case "inprogress":
			var index = store.index(filter);
			var key = IDBKeyRange.lowerBound(["true", 0]);
			break;
		case "recent":
			var index = store.index("date");
			var key = IDBKeyRange.lowerBound(0);
			break;
	}
			
	var i = 0;
	var limit = 50; // TODO: Remove this limit
	index.openCursor(key, "prev").onsuccess = function(event) {
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

var podcastUpdateList = [];
var podcastUpdatePosition = 0;

PodcastManager.updateAllPodcasts = function(_this, podcasts) {
	if (podcasts.length === 0) {
		return;
	}
	
	podcastUpdateList = podcasts;
	podcastUpdatePosition = 0;

	var status = (podcastUpdatePosition+1) + " of " + podcastUpdateList.length;
	enyo.Signals.send("onPodcastsUpdateProgress", {status: status});

	console.log("Updating podcast " + status);
	PodcastManager.requestPodcastRefresh(_this, podcastUpdateList[podcastUpdatePosition]);
};

PodcastManager.updateNextPodcast = function() {
	podcastUpdatePosition++;

	if (podcastUpdatePosition > podcastUpdateList.length - 1) {
		enyo.Signals.send("onPodcastsUpdated");
		return;
	}

	var status = (podcastUpdatePosition+1) + " of " + podcastUpdateList.length;
	enyo.Signals.send("onPodcastsUpdateProgress", {status: status});
	console.log("Updating podcast " + status);
	PodcastManager.requestPodcastRefresh(null, podcastUpdateList[podcastUpdatePosition]);
};

PodcastManager.requestPodcastRefresh = function(_this, podcast) {
	console.log("PodcastManager.requestPodcastRefresh(): Event = " + podcast.name);
    
    if (enyo.platform.firefoxOS) {
        var xmlhttp = new XMLHttpRequest({mozSystem: true});
        xmlhttp.open("GET", podcast.feedUrl, true);
        xmlhttp.responseType = "xml";
        xmlhttp.onreadystatechange = enyo.bind(this, function (response) {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                // console.log(xmlhttp);
                var parser = new DOMParser();
                var xml = parser.parseFromString(xmlhttp.response, "text/xml");
                // this.gotEpisodes(xml, 'xml');
                PodcastManager.processPodcastRefresh(_this, podcast, xml);
            }
        });
        xmlhttp.send();
    } else {
        console.log('Not FxOS');
        var request = new enyo.XmlpRequest({
            url: podcast.feedUrl
        });
        request.response(enyo.bind(this, function(inRequest, inResponse) {
            console.log(inResponse);
            // this.gotEpisodes(inResponse, 'json');
            PodcastManager.processPodcastRefresh(_this, podcast, inResponse);
        }));
        request.go();
    }
};

PodcastManager.processPodcastRefresh = function(_this, podcast, data) {
	console.log("PodcastManager.processPodcastRefresh(): Event = " + podcast.name);
    
	var episodes = ParseFeed(data, podcast, podcast.latest);

	// No new episodes
	if (episodes.length === 0) {
		console.log("No new episodes...");
		PodcastManager.updateNextPodcast();
		return;
	}
	
	console.log("Found new episodes!");
	console.log(episodes);

	// Now let's add the new episodes to the database
	var store = DB.transaction(["episodes"], "readwrite").objectStore("episodes");
	for (i=0; i<episodes.length; i++) {
		store.add(episodes[i]);
	}

	// Finally, update the 'most recent' date for the podcast
	PodcastManager.updatePodcast(null, "latest", podcast, episodes[0].date);
};

PodcastManager.updatePodcast = function(_this, action, podcast, data) {
	console.log("PodcastManager.updatePodcast(): Event = " + action);
	console.log(data);

	var store = DB.transaction(["podcasts"], "readwrite").objectStore("podcasts");
	var index = store.index("name");
	var key = IDBKeyRange.only(podcast.name);
	index.openCursor(key).onsuccess = function(event) {
		var cursor = event.target.result;
		if (cursor) {
			var pod = cursor.value;

			switch (action) {
				case "latest":
					pod.latest = data;
					break;
				default:
					console.log("No action taken.");
			}

			var update = store.put(pod, cursor.primaryKey);
			update.onerror = function(event) {
				console.log("error");
				console.log(event);
			};
			update.onsuccess = function(event) {
				console.log("Successfully updated " + podcast.name);

				PodcastManager.updateNextPodcast();
			};

			cursor.continue();
		}
	};
};

PodcastManager.updateEpisode = function(_this, event, sender, data) {
	// console.log("PodcastManager.updateEpisode(): Event = " + event);
	// console.log(data);

	var episode = sender.episode;
	// console.log(episode);

	var store = DB.transaction(["episodes"], "readwrite").objectStore("episodes");
	store.get(episode.dbKey).onsuccess = function(response) {
		// console.log(response);
		var ep = response.target.result;


		switch (event) {
			case "download":
				if (data) {
					// console.log("Saving blob to db.");
					ep.downloaded = "true";
					ep.localUrl = data;
				} else {
					// console.log("Deleting blob from db.");
					ep.downloaded = "false";
					ep.localUrl = "";
				}
				break;
			case "played":
				if (data === true) {
					ep.played = "true";
					ep.inprogress = "false";
				} else {
					ep.played = "false";
					ep.inprogress = "false";
				}
				break;
			case "progress":
				ep.progress = data.current;
				ep.duration = data.duration;

				if (data.current/data.duration*100 >= 98) {
					ep.played = "true";
					ep.inprogress = "false";
				} else {
					ep.played = "false";
					ep.inprogress = "true";
				}
				break;
			default:
				console.log("No action taken.");
		}

		var updatedEpisode = enyo.mixin(episode, ep);
		// console.log(updatedEpisode);

		var update = store.put(ep, episode.dbKey);
		update.onerror = function(response) {
			console.log("error");
			console.log(response);
		};
		update.onsuccess = function(response) {
			console.log("Successfully updated podcast db entry. Title = " + episode.title);
			// console.log(_this.name);

			if (_this.name == "filteredList" || _this.name == "podcastDetail") {
				// _this.refreshList();
				// console.log(_this.$[sender.name]);
				_this.$[sender.name].setEpisode(updatedEpisode);
				_this.$[sender.name].processEpisode();
			}
		};
	};
};












