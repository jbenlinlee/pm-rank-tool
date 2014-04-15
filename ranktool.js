$(function() {
	var Fdb = Backbone.Model.extend({
		defaults: function() {
		    return {
			key: "FDB-0000",
			title: "Unknown FDB",
			order: 0
		    }
		}
	    });

	var FdbList = Backbone.Collection.extend({
		model: Fdb,
		comparator: 'order'
	    });

	var Fdbs = new FdbList();

	var FdbView = Backbone.View.extend({
		tagName: "li",
		render: function() {
		    this.$el.html(this.model.title)
		}
	    });

	var AppView = Backbone.View.extend({
		el: $('#ranktoolapp'),

		events: {
		    "click #jira_login": "hello"
		},

		render: function() {
		    
		},

		hello: function() {
		    console.log("Hello, world!");
		}
	    });

	var app = new AppView();
    });