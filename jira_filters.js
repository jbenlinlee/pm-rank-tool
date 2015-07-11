var JiraFilter = Backbone.Model.extend({
	defaults: function() {
		return {
			id: 0,
			url: undefined,
			jql: undefined,
			name: undefined,
			description: undefined
		}
	}
});

var JiraFilterCollection = Backbone.Collection.extend({
	model: JiraFilter
});