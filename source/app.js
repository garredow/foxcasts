/**
	Define and instantiate your enyo.Application kind in this file.  Note,
	application rendering should be deferred until DOM is ready by wrapping
	it in a call to enyo.ready().
*/

enyo.kind({
	name: "FoxCasts.Application",
	kind: "enyo.Application",
	view: "FoxCasts.MainView"
});

enyo.ready(function () {
	new FoxCasts.Application({name: "app"});
});
