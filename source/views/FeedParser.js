var ParseFeed = function(xml, podcast, dateLimit) {
	// console.log("Begin parseFeed");

	if (!dateLimit) {
		dateLimit = 0;
	}

	var items = xml.getElementsByTagName("item");
	var episodes = [];

	for (var i=0; i< items.length; i++) {
		var e = items[i];

		var date, author, title, description, abort;
		try {
			date = e.getElementsByTagName("pubDate")[0].textContent;
			date = Date.parse(date);
			// console.log("Most recent: " + podcast.mostRecent + " This Episode: " + date);
			if (date <= dateLimit) {
				console.log("Episode " + i + " is not new. Stopping.");
				break;
			} else {
				// console.log("Episode " + i + " is new. Continuing.");
			}
		} catch (e) {
			date = "?";
			abort = true;
		}
		try {
			author = e.getElementsByTagName("author")[0].textContent;
		} catch (e) {
			author = "?";
		}
		try {
			title = e.getElementsByTagName("title")[0].textContent;
		} catch (e) {
			title = "?";
		}
		try {
			description = e.getElementsByTagName("description")[0].textContent;
		} catch (e) {
			description = "?";
		}

		// Let's see if this episode is even worth keeping around
		try {
			enclosure = e.getElementsByTagName("enclosure")[0].getAttribute("url");
			abort = false;
		} catch (e) {
			abort = true;
		}

		if (!abort) {
			episodes.push({
				name: podcast.name || podcast.collectionName,
				date: date,
				author: author,
				title: title,
				description: description,
				length: e.getElementsByTagName("enclosure")[0].getAttribute("length"),
				type: e.getElementsByTagName("enclosure")[0].getAttribute("type"),
				fileUrl: e.getElementsByTagName("enclosure")[0].getAttribute("url"),
				localUrl: "",
				progress: 0,
				duration: 0,
				played: "false",
				downloaded: "false"
			});
		}
	}

	// console.log(episodes);
	// console.log("parseFeed done.");
	return(episodes);
}