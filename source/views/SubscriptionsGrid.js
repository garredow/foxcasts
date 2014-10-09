enyo.kind({
	name: "SubscriptionsGrid",
	kind: "FittableColumns",
	fit: true,
	// headerText: "FoxCasts",
	published: {
		headerText: "Subscriptions"
	},
	events: {
		onOpenPodcast: ""
	},
	components:[
		{kind: "Scroller", name: "grid", fit: true, touch: true, thumb: false, style: "text-align: center;", components: [

		]}
	],
	create: function() {
		this.inherited(arguments);
	},
	updateList: function() {
		this.$.grid.destroyClientControls();
		var request = window.indexedDB.open("MyTestDatabase1");
		request.onerror = function(event) {
			// Do something with request.errorCode!
		};
		request.onsuccess = enyo.bind(this, function(event) {
			// console.log("SubscriptionsGrid: DB Success");
			var db = request.result;

			var keyRange = IDBKeyRange.lowerBound(0);
			var trans = db.transaction("podcasts");
			var store = trans.objectStore("podcasts");
			store.openCursor().onsuccess = enyo.bind(this, function(event) {
				var cursor = event.target.result;
				if (cursor) {
					// console.log(cursor);
					this.$.grid.createComponent({kind: "SubscriptionTile", icon: cursor.value.logo100, dbData: cursor.value, ontap: "openPodcast", owner: this});
					cursor.continue();
				} else {
					this.$.grid.render();
				}
			});
		});
	},
	openPodcast: function(inSender) {
		// this.log(inSender);
		this.doOpenPodcast(inSender.dbData);
	}
});