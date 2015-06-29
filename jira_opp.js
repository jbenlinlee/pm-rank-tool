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
	tagName: "div",
	attributes: {"class": "opp"},
	add_button: false,
	remove_button: false,
	rank_buttons: false,
	rank: 0,
	
	render: function() {
		var model = this.model;
		var ctx = this;
		
		this.$el.append('<div class="opp_cell opp_key">' + model.id + '</div>');
		this.$el.append('<div class="opp_cell opp_name">' + model.get("title") + '</div>');
		this.$el.append('<div class="opp_cell opp_status"><span class="label">' + model.get("status") + '</span></div>');
		this.$el.append('<div class="opp_cell opp_tools" id="tools"></div>');

		// Set title tooltip
		this.$el.find("div.opp_name").tooltip({
			placement: "bottom",
			title: model.get("title"),
			trigger: "hover",
			delay: {show: 1000, hide: 0}
		});

		// Adjust status label color
		var el_status = this.$el.find("div.opp_status > span.label");
		
		switch(model.get("status").toUpperCase()) {
		case "BACKLOG":
			break;
		case "SUBMITTED TO PM":
			break;
		case "FUNCTIONAL DESIGN IN PROGRESS":
			break;
		case "FUNCTIONAL DESIGN REVIEW":
			el_status.addClass("label-info");
			break;
		case "READY FOR TECHNICAL APPROACH":
			el_status.addClass("label-info");
			break;
		case "TECHNICAL APPROACH IN PROGRESS":
			el_status.addClass("label-info");
			break;
		case "TECHNICAL APPROACH REVIEW":
			el_status.addClass("label-info");
			break;
		case "READY FOR TECHNICAL DESIGN":
			el_status.addClass("label-info");
			break;
		case "TECHNICAL DESIGN IN PROGRESS":
			el_status.addClass("label-info");
			break;
		case "TECHNICAL DESIGN REVIEW":
			el_status.addClass("label-info");
			break;
		case "READY TO BE SCHEDULED":
			el_status.addClass("label-success");
			break;
		case "SCHEDULED":
			el_status.addClass("label-success");
			break;			
		case "COMPLETE":
			el_status.addClass("label-success");
			break;
		case "DECLINED":
			el_status.addClass("label-important");
			break;
		case "DEFERRED":
			el_status.addClass("label-important");
			break;
		}
		
		var tools = this.$el.find('div#tools');
		
		if (this.add_button) {
			this.$el.click(function (evt) {
				console.debug("Want to add " + [model.id, model.get("title")].join('/') + " to rank");
				ctx.trigger("opp_add", model);
			});
		}
		
		if (this.remove_button) {
			tools.append('<i id="remove" class="icon-remove"></i>');
			this.$el.find('i#remove').click(function (evt) {
				console.debug("Want to remove " + [model.id, model.get("title")].join('/') + " from rank");
				ctx.trigger("opp_remove", model);
			});
		}
		
		if (this.rank_buttons) {
			tools.append('<i class="icon-chevron-up" id="moveup"></i> <i class="icon-chevron-down" id="movedown"></i>');
			
			this.$el.find('i#moveup').click(function (evt) {
				console.debug("Move up " + [model.id, model.get("title")].join('/'));
				ctx.trigger("opp_moveup", model);
			});
			
			this.$el.find('i#movedown').click(function (evt) {
				console.debug("Move down " + [model.id, model.get("title")].join('/'));
				ctx.trigger("opp_movedown", model);
			})
		}

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
		if (oppkey === "") {
			this.model.reset();
			return;
		}
		
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
			this.$el.find("div#list").html("");
		});
		
		this.listenTo(this.model, "add", function(oppmodel) {
			console.debug("opp added to candidate collection");
			var oppview = new OPPView({model: oppmodel});
			oppview.add_button = true;
			
			this.$el.find("div#list").append(oppview.render().el);
			oppview.on('opp_add', function(opp_model) {
				this.trigger('opp_add', opp_model);
			}, this)
		});
	},
});

OPPRankListView = Backbone.View.extend({
	render: function() {
		var list_elem = this.$el.find("div#list");
		list_elem.html("");
		
		var oppcollection = this.model;
		
		this.model.forEach(function(elem, idx, list) {
			var oppview = new OPPView({model: elem});
			oppview.remove_button = true;
			oppview.rank_buttons = true;
			
			list_elem.append(oppview.render().el);
			oppview.on('opp_remove', function(opp_model) {
				oppcollection.remove(opp_model);
			}, this);
			
			oppview.on('opp_moveup', function(opp_model) {
				console.debug("Got move up command for " + opp_model.id + " at idx " + idx);
				if (idx > 0) {
					var opparr = oppcollection.models;
					opparr[idx] = opparr[idx - 1];
					opparr[idx - 1] = opp_model;
					oppcollection.reset(opparr);
				}
			});
			
			oppview.on('opp_movedown', function(opp_model) {
				console.debug("Got move down command for " + opp_model.id + " at idx " + idx);
				if (idx < oppcollection.length - 1) {
					var opparr = oppcollection.models;
					opparr[idx] = opparr[idx + 1];
					opparr[idx + 1] = opp_model;
					oppcollection.reset(opparr);
				}
			})
		})
	},
	
	initialize: function() {
		this.listenTo(this.model, "add", function(oppmodel) {
			console.debug("opp " + oppmodel.id + " added to rank");
			this.render();
		});
		
		this.listenTo(this.model, "remove", function(oppmodel) {
			this.render();
		});
		
		this.listenTo(this.model, "reset", function(oppmodel) {
			console.debug("rank list model reset");
			this.render();
		});
	}
})
