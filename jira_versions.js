var VersionModel = Backbone.Model.extend({
	defaults: function() {
		return {
			major: 0,
			minor: 0,
			point: 0,
			date_start: undefined,
			date_end: undefined
		};
	}
});

var VersionCollection = Backbone.Collection.extend({
	model: VersionModel,
});