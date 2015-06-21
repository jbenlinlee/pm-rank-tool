var RankField = Backbone.Model.extend({
	defaults: function() {
		return {
			id: undefined,
			queryid: undefined,
			name: ""
		}
	}
});

var RankFieldCollection = Backbone.Collection.extend({
	model: RankField
});

