enyo.kind({
	name: "Settings",
	kind: "FittableRows",
	fit: true,
	published: {
		headerText: "Settings"
	},
	events: {
		onChangePanel: "",
		onRefreshAll: ""
	},
	components:[
		{kind: "enyo.Scroller", fit: true, touch: true, thumb: false, components: [
			{kind: "FittableRows", classes: "settings-row", components: [
				{kind: "FittableColumns", components: [
					{name: "labelTheme", content: "Theme", classes: "label", fit: true, ontap: "toggleDescription"},
					{kind: "onyx.PickerDecorator", components: [
						{name: "prefUnitsButton", kind: "onyx.PickerButton", content: "Units", classes: "custom-picker"},
						{name: "pickTheme", kind: "onyx.Picker", onChange: "saveAppPrefs", floating: true, components: [
							{content: "Dark", name: "theme-dark", active: true},
							{content: "Light", name: "theme-light"},
							{content: "Firefox OS", name: "firefox-dark"},
							{content: "Firefox OS Light", name: "firefox-light"}
						]}
					]},
				]},
				{name: "drawerTheme", kind: "onyx.Drawer", open: false, components: [
					{classes: "setting-description", allowHtml: true, content: "Choose which theme you'd like used. Not much to pick from yet..."}
				]}
			]},
			{kind: "FittableRows", classes: "settings-row", components: [
				{kind: "FittableColumns", components: [
					{name: "labelNotification", content: "Notification", classes: "label", fit: true, ontap: "toggleDescription"},
					{kind: "onyx.PickerDecorator", components: [
						{name: "prefNotification", kind: "onyx.PickerButton", content: "Units", classes: "custom-picker"},
						{name: "pickNotification", kind: "onyx.Picker", onChange: "saveAppPrefs", floating: true, components: [
							{content: "None", name: "none", active: true},
							{content: "Simple", name: "simple"},
							{content: "Dynamic", name: "dynamic"}
						]}
					]}
				]},
				{name: "drawerNotification", kind: "onyx.Drawer", open: false, components: [
					{classes: "setting-description", allowHtml: true, content: "Choose if you want a notification to be displayed when you play an episode. You can tap this notification to toggle between play and pause.<br><br><u>None</u>: No notification.<br><br><u>Simple</u>: A notification is created when you first start playing an episode. It does not show episode information.<br><br><u>Dynamic</u>: A notification is created (or updated if one is already created) every time you start a new episode. Album art and episode title are shown.<br><br>The default alert is played every time a notification is created or updated."}
				]}
			]},
			{kind: "FittableRows", classes: "settings-row", components: [
				{kind: "FittableColumns", components: [
					{name: "labelCoverControls", content: "Cover Controls", classes: "label", fit: true, ontap: "toggleDescription"},
					{kind: "onyx.PickerDecorator", components: [
						{name: "prefCoverControls", kind: "onyx.PickerButton", content: "Units", classes: "custom-picker"},
						{name: "pickCoverControls", kind: "onyx.Picker", onChange: "saveAppPrefs", floating: true, components: [
							{content: "Off", name: "off", active: true},
							{content: "On", name: "on"}
						]}
					]}
				]},
				{name: "drawerCoverControls", kind: "onyx.Drawer", open: false, components: [
					{classes: "setting-description", allowHtml: true, content: "Turning Cover Controls on will allow you to control playback by taping on the album art in the Player. Tapping different areas will perform different actions.<br><br><u>Top Half</u>: Toggle between play and pause.<br><br><u>Bottom Left</u>: Jump back 10 seconds.<br><br><u>Bottom Right</u>: Jump forward 30 seconds."}
				]}
			]},
			{kind: "FittableRows", classes: "settings-row", components: [
				{kind: "FittableColumns", components: [
					{name: "labelStorage", content: "Storage Location", classes: "label", fit: true, ontap: "toggleDescription"},
					{kind: "onyx.PickerDecorator", components: [
						{name: "prefStorage", kind: "onyx.PickerButton", content: "Units", classes: "custom-picker"},
						{name: "pickStorage", kind: "onyx.Picker", onChange: "saveAppPrefs", floating: true, components: [
							{content: "Default", name: "default", active: true},
							// {content: "Internal", name: "internal", active: true},
							// {content: "External", name: "external"}
						]}
					]}
				]},
				{name: "drawerStorage", kind: "onyx.Drawer", open: false, components: [
					{classes: "setting-description", allowHtml: true, content: "FoxCasts uses the global system setting for media storage defined in the Settings app.<br><br>Please note: If you change this setting after downloading an episode, FoxCasts will not be able to locate the file since it'll be looking in the wrong place."}
				]}
			]}
		]}
	],
	prefsLoaded: false,
	create: function() {
		this.inherited(arguments);
		this.loadAppPrefs();
	},
	saveAppPrefs: function(sender) {
		if (!this.prefsLoaded) {
			return;
		}

		console.log("Saving prefs");
		PREFS.theme = this.$.pickTheme.getSelected().name;
		PREFS.notification = this.$.pickNotification.getSelected().name;
		PREFS.coverControls = this.$.pickCoverControls.getSelected().name;
		PREFS.storage = this.$.pickStorage.getSelected().name;

		this.log(PREFS);

		window.localStorage.appPrefs = enyo.json.stringify(PREFS);

		if (sender.name == "pickTheme") {
			this.applyTheme();
		}
	},
	loadAppPrefs: function() {
		PREFS = {
			theme         : "theme-dark",
			notification  : "none",
			coverControls : "off",
			storage       : "default"
		};
		if (window.localStorage.appPrefs) {
			PREFS = enyo.mixin(PREFS, enyo.json.parse(window.localStorage.appPrefs));
		}
		else {
			window.localStorage.appPrefs = enyo.json.stringify(PREFS);
		}

		this.log(PREFS);

		this.$.pickTheme.setSelected(this.$[PREFS.theme]);
		this.$.pickNotification.setSelected(this.$[PREFS.notification]);
		this.$.pickCoverControls.setSelected(this.$[PREFS.coverControls]);
		this.$.pickStorage.setSelected(this.$[PREFS.storage]);

		this.prefsLoaded = true;
		this.applyTheme();
	},
	applyTheme: function(sender) {
		var theme = PREFS.theme;
		var head = document.getElementsByTagName("head")[0];

		// Remove any other theme stylesheets
		var themeList = ["theme-light", "theme-dark", "firefox-dark", "firefox-light"];
		var appsheets = document.getElementsByTagName("link");
		var foundTheme;

		for (i=0; i < appsheets.length; i++) {
			var sheet = appsheets[i];
			for (a=0; a<themeList.length; a++) {
				var findTheme = sheet.href.search(themeList[a]);
				if (findTheme > -1 && theme != themeList[a]) {
					console.log("Removing theme: " + themeList[a]);
					foundTheme = themeList[a];
					head.removeChild(sheet);
				}
			}
		}

		if (theme != "theme-dark" && theme != foundTheme) {
			// Add the new theme stylesheet
			console.log("Applying new theme stylesheet: " + theme);
			var e = document.createElement("link");
			e.setAttribute("rel", "stylesheet");
			e.setAttribute("type", "text/css");
			e.setAttribute("href", "assets/" + theme + ".css");

			head.appendChild(e);
		} else {
			// this.log("Nothing to do.");
		}
	},
	toggleDescription: function(sender) {
		var drawer;
		switch (sender.name) {
			case "labelTheme":
				drawer = "drawerTheme";
				break;
			case "labelNotification":
				drawer = "drawerNotification";
				break;
			case "labelCoverControls":
				drawer = "drawerCoverControls";
				break;
			case "labelStorage":
				drawer = "drawerStorage";
				break;
		}

		if (this.$[drawer].open) {
			this.$[drawer].setOpen(false);
		} else {
			this.$[drawer].setOpen(true);
		}
	}
});