var ParseFeed = function(data, podcast, dateLimit, dataType) {
  console.log("Begin parseFeed");
  console.log(data);

  if (!dateLimit) {
    dateLimit = 0;
  }

  var episodes = [];

  // if (dataType == 'xml') {
  if (data.contentType && data.contentType == "text/xml") {
    console.log("Parsing episodes as XML");

    var items = data.getElementsByTagName("item");
    for (var i = 0; i < items.length; i++) {
      var e = items[i];
      // console.log(e);

      var date, author, title, description, abort;
      try {
        date = e.getElementsByTagName("pubDate")[0].textContent;
        date = Date.parse(date);
        // console.log("Most recent: " + podcast.mostRecent + " This Episode: " + date);
        // console.log("Datelimit: " + dateLimit);
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
          logo100: podcast.artworkUrl100,
          logo600: podcast.artworkUrl600,
          length: e.getElementsByTagName("enclosure")[0].getAttribute("length"),
          type: e.getElementsByTagName("enclosure")[0].getAttribute("type"),
          fileUrl: e.getElementsByTagName("enclosure")[0].getAttribute("url"),
          localUrl: "",
          progress: 0,
          duration: 0,
          played: "false",
          downloaded: "false",
          inprogress: "false"
        });
      }
    }
  } else {
    console.log("Parsing episodes as JSON");

    var items = data.rss.channel.item;
    for (var i = 0; i < items.length; i++) {
      var e = items[i];
      // console.log(e);

      var date, author, title, description, abort;
      try {
        date = e.pubDate;
        date = Date.parse(date);
        // console.log("Most recent: " + podcast.mostRecent + " This Episode: " + date);
        // console.log("Datelimit: " + dateLimit);
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
        author = e.author[0];
      } catch (e) {
        author = "?";
      }
      try {
        title = e.title;
      } catch (e) {
        title = "?";
      }
      try {
        description = e.description;
      } catch (e) {
        description = "?";
      }

      // Let's see if this episode is even worth keeping around
      if (!e.enclosure || !e.enclosure.url) {
        abort = true;
      } else {
        abort = false;
      }

      if (!abort) {
        episodes.push({
          name: podcast.name || podcast.collectionName,
          date: date,
          author: author,
          title: title,
          description: description,
          logo100: podcast.artworkUrl100,
          logo600: podcast.artworkUrl600,
          length: e.enclosure.length,
          type: e.enclosure.type,
          fileUrl: e.enclosure.url,
          localUrl: "",
          progress: 0,
          duration: 0,
          played: "false",
          downloaded: "false",
          inprogress: "false"
        });
      }
    }
  }

  // console.log(episodes);
  // console.log("parseFeed done.");
  return episodes;
};
