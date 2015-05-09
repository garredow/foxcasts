enyo.kind({
	name: "Search",
	kind: "FittableRows",
	fit: true,
	style: "padding: 0;",
	published: {
		headerText: "Search"
	},
	events: {
		onShowDetail: ""
	},
	components:[
		{kind: "onyx.InputDecorator", alwaysLooksFocused: true, style: "width: 100%; margin-bottom: 5px;", components: [
			{kind: "onyx.Input", name: "query", style: "width: 100%;", placeholder: "What are you looking for?", defaultFocus: true, onchange:"search"}
		]},
		{kind: "enyo.Scroller", fit: true, touch: true, thumb: false, horizontal: "hidden", components: [
			{name: "spinnerContainer", style: "text-align: center;", components: [
				{kind: "onyx.Spinner", showing: false},
			]},
			{name: "results"}
		]}
	],
	results: [],
	create: function() {
		this.inherited(arguments);
	},
	focusSearchBox: function() {
		// TODO: Make ths work
		// if (this.results.length == 0) {
		// 	this.$.query.focus();
		// }
	},
	search: function(inSender) {
		var query = this.$.query.getValue();
		// this.log(query);

		this.$.spinner.setShowing(true);

		var url = "https://itunes.apple.com/search?media=podcast&term=" + query;

		if (enyo.platform.webos) {
			var request = new enyo.JsonpRequest({
				url: url
			});
			request.response(this, "gotResults");
			request.go();
		} else {
			var xmlhttp = new XMLHttpRequest({mozSystem: true});
			xmlhttp.open("GET", url, true);
			xmlhttp.setRequestHeader("Content-type", "application/json");
			xmlhttp.responseType = "json";
			xmlhttp.onreadystatechange = enyo.bind(this, function(response) {
				if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
					console.log(xmlhttp);
			        this.gotResults(xmlhttp.response);
			    }
			});
			xmlhttp.send();
		}	
	},
	gotResults: function(response) {
		this.$.spinner.setShowing(false);

		this.log(response);
		// response = JSON.parse(response);
		// this.log(response);
		this.results = response.results;
		var r = response.results;

		this.$.results.destroyClientControls();

		for (var i=0; i<r.length; i++) {
			this.log(r[i]);
			this.$.results.createComponent({kind: "ResultItem", podcast: r[i], ontap: "openDetails", owner: this});
		}

		if (r.length == 0) {
			this.$.results.createComponent({classes: "empty-list-text", content: "No results."});
		}

		this.$.spinner.setShowing(false);
		this.$.results.render();
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
		var item = inSender.podcast;
		this.log(item.collectionName);
		this.doShowDetail(item);
	}
});

enyo.kind({
	name: "ResultItem",
	kind: "FittableColumns",
	classes: "search-result",
	published: {
		podcast: ""
	},
	handlers: {
		onmousedown: "highlight",
		ontouchstart: "highlight",
		ontouchenter: "highlight",
		ontouchend: "removeHighlight",
		ontouchleave: "removeHighlight",
		onmouseup: "removeHighlight",
		onmouseout: "removeHighlight"
	},
	components:[
		{name: "logo", classes: "result-logo"},
		{kind: "FittableRows", components: [
			{name: "title", classes: "result-title"},
			{name: "description", classes: "result-author"}
		]}
	],
	create: function() {
		this.inherited(arguments);
		var r = this.podcast;

		this.$.logo.applyStyle("background-image", "url('"+ r.artworkUrl100 + "')");
		this.$.title.setContent(r.collectionName);
		this.$.description.setContent(r.artistName);
	},
	highlight: function(e) {
		this.addRemoveClass("highlight-secondary-item", true);
	},
	removeHighlight: function(e) {
		this.addRemoveClass("highlight-secondary-item", false);
	}
});