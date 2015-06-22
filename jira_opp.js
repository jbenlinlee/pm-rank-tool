var OPPModel = Backbone.Model.extend({
	defaults: function() {
		return {
			id: 0,
			title: "Default OPP Title",
			assignee: "Default Assignee",
			status: "Default Status",
			release_target: "0.0"
		}
	}
});

var OPPView = Backbone.View.extend({
	tagName: "li",
	render: function() {
		this.$el.html([this.model.id, this.model.get("title"), this.model.get("status")].join(' | '));
		return this;
	}
});

var OPPCollection = Backbone.Collection.extend({
	model: OPPModel
});

var OPPInputView = Backbone.View.extend({
	el: $("input#opp_input_key"),
	
	lastTime: undefined,
	
	makeOPPModel: function(jiraIssue) {
		return new OPPModel({
			id: jiraIssue.key,
			title: jiraIssue.fields.summary,
			assignee: jiraIssue.fields.assignee.name,
			status: jiraIssue.fields.status.name			
		});
	},
	
	getInputOPP: function() {
		if (this.lastTime) {
			clearTimeout(this.lastTime);
		}
	
		var oppkey = this.$el.val();
		var model = this.model;
		var ctx = this;

		this.lastTime = setTimeout(function() {
			var opts = undefined;
			if (Number.isInteger(parseInt(oppkey, 10))) {
				$.ajax({
					type: 'GET',
					url: 'http://jira.freewheel.tv/rest/api/2/issue/OPP-' + oppkey,
					contentType: 'application/json'
				}).done(function(issueData) {
					model.reset();
					model.add(ctx.makeOPPModel(issueData));
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
					model.reset();
					for (var i = 0; i < issueResults.issues.length; ++i) {
						var issueData = issueResults.issues[i];
						model.add(ctx.makeOPPModel(issueData));
					}
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

OPPCandidateListView = Backbone.View.extend({
	initialize: function() {
		this.listenTo(this.model, "reset", function() {
			console.debug("opp candidate collection reset");
			this.$el.find("ul#list").html("");
		});
		
		this.listenTo(this.model, "add", function(oppmodel) {
			console.debug("opp added to candidate collection");
			var oppview = new OPPView({model: oppmodel});
			this.$el.find("ul#list").append(oppview.render().el);
		});
	},
})
