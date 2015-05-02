enyo.kind({
	name: "EpisodeItem",
	kind: "FittableRows",
	classes: "episode-item",
	published: {
		title: "",
		subTitle: "",
		episode: "",
		downloadProgress: "",
		preview: false
	},
	events: {
		onShowPopup: ""
	},
	components:[
		{kind: "FittableColumns", components: [
			{name: "header", kind: "FittableRows", ontap: "toggleDrawer", classes: "episode-header", style: "margin-right: 40px;", components: [
				{name: "line1", classes: "line1"},
				{kind: "FittableColumns", components: [
					{name: "iconDownloaded", kind: "Image", classes: "icon-downloaded", src: "assets/icons/downloaded.png", showing: false},
					{name: "line2", classes: "line2"}
				]},
			]},
			{name: "btnMenu", classes: "overflow-button", ontap: "doShowPopup"}
		]},
		{name: "drawer", kind: "onyx.Drawer", open: false, components: [
			{name: "summary", style: "padding-top: 10px; padding-left: 15px;", allowHtml: true, content: ""}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.processEpisode();
	},
	processEpisode: function() {
		var e = this.episode;

		this.$.line1.setContent(this.title);
		this.$.line2.setContent(this.subTitle);

		if (this.preview) {
			this.$.btnMenu.setShowing(false);
			return;
		}

		if (e.played == "true") {
			this.applyStyle("opacity", .4);
		} else {
			this.applyStyle("opacity", 1);
		}

		if (e.downloaded == "true") {
			this.$.iconDownloaded.setShowing(true);
		} else {
			this.$.iconDownloaded.setShowing(false);
		}

		// this.render();
	},
	episodeChanged: function() {
		this.log(this.episode);
		this.processEpisode();
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
		if (this.downloadProgress == 100) {
			this.$.line2.setContent("Download finished.");
		} else {
			this.$.line2.setContent("Downloading... " + this.downloadProgress + "%");
		}
	}
});