var OPPModel = Backbone.Model.extend({
	defaults: function() {
		return {
			id: 0,
			title: "Default OPP Title",
			assignee: "Default Assignee",
			status: "Default Status",
			release_target: 0.0
		}
	}
});

/*
var OPPView = Backbone.View.extend({
	tagName: "div",
	template: _.template("opp-<%= id =%> | <%= title =%> | <%= status =%>"),
	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
	}
});
*/

var OPPCollection = Backbone.Collection.extend({
	model: OPPModel
});

var OPPInputView = Backbone.View.extend({
	el: $("input#opp_input_key"),
	
	lastTime: undefined,
	
	getInputOPP: function() {
		if (this.lastTime) {
			clearTimeout(this.lastTime);
		}
	
		var oppkey = this.$el.val();

		this.lastTime = setTimeout(function() {
			var opts = undefined;
			if (Number.isInteger(oppkey)) {
				$.ajax({
					type: 'GET',
					url: 'http://jira.freewheel.tv/rest/api/2/issue/OPP-' + oppkey,
					contentType: 'application/json'
				}).done(function(issueData) {
					console.log(issueData);
				}).fail(function(xhr, status, error) {
					console.log("Failed with status " + xhr.status);
				});
			} else {
				var postData = {
					"jql": 'project=OPP and (description~"' + oppkey + '" or summary~"' + oppkey + '")'
				}
				
				$.ajax({
					type: 'POST',
					url: 'http://jira.freewheel.tv/rest/api/2/search',
					contentType: 'application/json',
					data: JSON.stringify(postData)
				}).done(function(issueResults) {
					console.log(issueResults);
				}).fail(function(xhr, status, error) {
					console.log("Failed with status " + xhr.status);
				})
			}
		}, 500);
		
	},
	
	events: {
		"input": "getInputOPP"
	}
});
