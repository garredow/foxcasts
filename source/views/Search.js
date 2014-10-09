enyo.kind({
	name: "Search",
	kind: "FittableRows",
	fit: true,
	style: "padding: 10px 10px;",
	published: {
		headerText: "Search"
	},
	events: {
		onShowDetail: ""
	},
	components:[
		{kind: "onyx.InputDecorator", alwaysLooksFocused: true, style: "width: 100%; margin-bottom: 10px;", components: [
			{kind: "onyx.Input", name: "query", placeholder: "Search term", defaultFocus: true, onchange:"search"},
			{kind: "Image", src: "assets/icons/search-input-search.png", style: "float: right;"}
		]},
		{name: "spinnerContainer", style: "text-align: center;", components: [
			{kind: "onyx.Spinner", showing: false},
		]},
		{name: "list", kind: "List", count: 0, multiSelect: false, fit: true, onSetupItem: "setupItem", components: [
			{name: "item", kind: "FittableColumns", classes: "search-result", ontap: "openDetails", components: [
				{name: "logo", classes: "result-logo"},
				{kind: "FittableRows", components: [
					{name: "title", classes: "result-title"},
					{name: "description", classes: "result-description"}
				]}
				
			]}
		]}
	],
	results: [],
	create: function() {
		this.inherited(arguments);
	},
	focusSearchBox: function() {
		if (this.$.list.getCount() == 0) {
			this.$.query.focus();
		}
	},
	search: function(inSender) {
		var query = this.$.query.getValue();
		// this.log(query);

		this.$.spinner.setShowing(true);

		var xmlhttp = new XMLHttpRequest({mozSystem: true});
		xmlhttp.open("GET", "https://itunes.apple.com/search?media=podcast&term=" + query, true);
		xmlhttp.setRequestHeader("Content-type", "application/json");
		xmlhttp.responseType = "json";
		xmlhttp.onreadystatechange = enyo.bind(this, function(response) {
			if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
				console.log(xmlhttp);
		        // console.log(xmlhttp.responseText);
		        this.gotResults(xmlhttp.response);
		    }
		});
		xmlhttp.send();
	},
	gotResults: function(response) {
		// this.log(response);
		this.$.spinner.setShowing(false);

		this.results = response.results;

		this.$.list.setCount(this.results.length);
		this.$.list.reset();
	},
	setupItem: function(inSender, inEvent) {
		var i = inEvent.index;
		var r = this.results[i];

		this.$.logo.applyStyle("background-image", "url('"+ r.artworkUrl100 + "')");
		this.$.title.setContent(r.collectionName);
		this.$.description.setContent(r.artistName);

		return true;
	},
	openDetails: function(inSender, inEvent) {
		// this.log(inSender);
		// this.log(inEvent);
		var item = this.results[inEvent.index];
		this.log(item.collectionName);
		this.doShowDetail(item);
	}
});