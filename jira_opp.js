var OPPModel = Backbone.Model.extend({
	defaults: function() {
		return {
			id: 0,
			title: "Default OPP Title",
			assignee: "Default Assignee",
			status: "Default Status",
			url: "",
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
	
	statusToLabel: function(status) {
		switch(status.toUpperCase()) {
		case "BACKLOG":
			return "success";
			break;
		case "SUBMITTED TO PM":
			return "success";
			break;
		case "FUNCTIONAL DESIGN IN PROGRESS":
			return "success";
			break;
		case "FUNCTIONAL DESIGN REVIEW":
			return "success";
			break;
		case "READY FOR TECHNICAL APPROACH":
			return "success";
			break;
		case "TECHNICAL APPROACH IN PROGRESS":
			return "warning";
			break;
		case "TECHNICAL APPROACH REVIEW":
			return "warning";
			break;
		case "READY FOR TECHNICAL DESIGN":
			return "warning";
			break;
		case "TECHNICAL DESIGN IN PROGRESS":
			return "warning";
			break;
		case "TECHNICAL DESIGN REVIEW":
			return "warning";
			break;
		case "READY TO BE SCHEDULED":
			return "warning";
			break;
		case "SCHEDULED":
			return "danger";
			break;	
		case "READY FOR UAT":
			return "danger";
			break;
		case "COMPLETE":
			return "danger";
			break;
		case "DECLINED":
			return "danger";
			break;
		case "DEFERRED":
			return "danger";
			break;
		default:
			return "default"
			break;
		}
	},
	
	holdForRemoveTimeout: undefined,
	holdForRemoveIndicatorTimeout: undefined,
	
	setHoldRemoveTimeout: function() {
		var ctx = this;
		
		this.holdForRemoveTimeout = setTimeout(function() {
			console.debug("Mouse held to remove " + [ctx.model.id, ctx.model.get("title")].join('/') + " from rank");
			ctx.trigger("opp_remove", ctx.model);
			ctx.holdForRemoveTimeout = undefined;
		}, 750);
		
		this.holdForRemoveIndicatorTimeout = setTimeout(function() {
			ctx.$el.addClass("remove-imminent");
		}, 250);
	},
	
	clearHoldRemoveTimeout: function() {
		clearTimeout(this.holdForRemoveTimeout);
		clearTimeout(this.holdForRemoveIndicatorTimeout);
		
		this.holdForRemoveTimeout = undefined;
		this.holdForRemoveIndicatorTimeout = undefined;
		
		this.$el.removeClass("remove-imminent");
	},
	
	render: function() {
		var model = this.model;
		var ctx = this;
		
		this.$el.append('<div class="opp_insert"></div>');
		this.$el.append('<div class="opp_row"></div>');
		var row = this.$el.find("div.opp_row");
		
		row.append('<div class="opp_cell opp_key opp_textual">' + model.id + '</div>');
		row.append('<div class="opp_cell opp_name opp_textual">' + model.get("title") + '</div>');
		row.append('<div class="opp_cell opp_status"><span class="label">' + model.get("status") + '</span></div>');
		row.append('<div class="opp_cell opp_tools" id="tools"></div>');

		// Set title tooltip
		row.find("div.opp_name").tooltip({
			placement: "bottom",
			title: model.get("title"),
			trigger: "hover",
			delay: {show: 1000, hide: 0}
		});

		// Adjust status label color
		var el_status = row.find("div.opp_status > span.label");
		el_status.addClass("label-" + this.statusToLabel(model.get("status")));
		
		var tools = row.find('div#tools');
		
		if (this.add_button) {
			this.$el.click(function (evt) {
				console.debug("Want to add " + [model.id, model.get("title")].join('/') + " to rank");
				ctx.trigger("opp_add", model);
			});
		}
		
		if (this.rank_buttons) {
			this.$el.attr("draggable", "true");
			
			this.el.ondragstart = function(event) {
				console.debug("Dragging " + model.id);
				event.dataTransfer.setData("text/plain", model.id);
				ctx.trigger("opp_dragstart");
				
				// Cancel and reset any pending remove action
				ctx.clearHoldRemoveTimeout();
			};
			
			this.el.ondragenter = function(event) {
				$(event.target).find("div.opp_insert").show();
				event.preventDefault();
			};

			this.el.ondragover = function(event) {
				$(event.target).find("div.opp_insert").show();
				event.preventDefault();
			};
			
			this.el.ondragleave = function(event) {
				$(event.target).find("div.opp_insert").hide();
				event.preventDefault();
			}
			
			this.el.ondrop = function(event) {
				var dropOpp = event.dataTransfer.getData("text/plain");
				console.debug("Dropping " + dropOpp + " on " + model.id);
				ctx.trigger("opp_insertbefore", dropOpp, model.id);
				$(event.target).find("div.opp_insert").hide();
				
				event.preventDefault();
			};
			
			this.el.ondragend = function(event) {
				ctx.trigger("opp_dragend");
				event.preventDefault();
			}
			
			this.el.onmousedown = function(event) {
				if (event.buttons === 1) {
					console.debug("Mouse down on " + model.id);
					ctx.setHoldRemoveTimeout();
				}
			}
			
			this.el.onmouseup = function(event) {
				if (ctx.holdForRemoveTimeout != undefined) {
					ctx.clearHoldRemoveTimeout();
				}
			}
		}

		return this;
	}
});

var OPPCollection = Backbone.Collection.extend({
	model: OPPModel
});

function rankFieldBloodhound(rankFieldCollection) {
	var rankFieldSuggestions = [];
	rankFieldCollection.forEach(function(rankFieldModel, idx, list) {
		rankFieldSuggestions.push({suggestionType: "rank", data: rankFieldModel});
	});
	
	return new Bloodhound({
		local: rankFieldSuggestions,
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		datumTokenizer: function(rankFieldSuggestion) { return rankFieldSuggestion.data.get("name").split(' ') }
	});
}

var OPPInputView = Backbone.View.extend({
	el: $("input#opp_input_key"),
	
	lastTime: undefined,
	
	rankFieldCollection: undefined,
	
	makeOPPModel: function(jiraIssue) {
		return new OPPModel({
			id: jiraIssue.key,
			title: jiraIssue.fields.summary,
			assignee: jiraIssue.fields.assignee != undefined ? jiraIssue.fields.assignee.name : "Unassigned",
			status: jiraIssue.fields.status.name,
			url: jiraIssue.self			
		});
	},
	
	getInputOPP: function() {
		var oppkey = this.$el.val();
		this.trigger('opp_search_changed', oppkey);
		
		if (oppkey === "") {
			this.model.reset();
			return;
		}
		
		var model = this.model;
		var ctx = this;

		var opts = undefined;
		if (Number.isInteger(parseInt(oppkey, 10))) {
			$.ajax({
				type: 'GET',
				url: 'http://jira.freewheel.tv/rest/api/2/issue/OPP-' + oppkey,
				contentType: 'application/json'
			}).done(function(issueData) {
				model.reset([ctx.makeOPPModel(issueData)]);
			}).fail(function(xhr, status, error) {
				console.log("Failed with status " + xhr.status);
				model.reset();
			});
		} else {
			var postData = {
				"jql": 'project=OPP and (description~"' + oppkey + '" or summary~"' + oppkey + '") and status not in ("Scheduled", "Ready to be Scheduled", "Declined", "Deferred", "Complete") order by createdDate desc'
			}
			
			$.ajax({
				type: 'POST',
				url: 'http://jira.freewheel.tv/rest/api/2/search',
				contentType: 'application/json',
				data: JSON.stringify(postData)
			}).done(function(issueResults) {
				var opps = [];
				for (var i = 0; i < issueResults.issues.length; ++i) {
					var issueData = issueResults.issues[i];
					opps.push(ctx.makeOPPModel(issueData));
				}

				model.reset(opps);
			}).fail(function(xhr, status, error) {
				console.log("Failed with status " + xhr.status);
				model.reset();
			});
		}
	},
	
	setupTypeahead: function(rankFieldCollection) {
		this.$el.typeahead({
			minLength: 1,
			hint: false
		},
		{
			name: 'rank-fields',
			async: false,
			source: rankFieldBloodhound(rankFieldCollection),
			display: function(rankFieldSuggestion) { return rankFieldSuggestion.data.get("name").substring(7); },
			templates: {
				header: 'Rank Fields',
			}
		},
		{
			name: 'jira-search',
			async: false,
			source: function(query, syncResults) {
				syncResults([{suggestionType: "textSearch", data: query}]);
			},
			display: function(querySuggestion) { return querySuggestion.data },
			templates: {
				header: 'Jira Search'
			}
		}
		);		
	},
	
	initialize: function() {
		// this.listenTo(this.rankFieldCollection, 'reset', this.setupTypeahead);
		
		var ctx = this;
		this.$el.bind('typeahead:select', function(evt, suggestion) {
			console.log(suggestion);
			
			switch(suggestion.suggestionType) {
			case "textSearch":
				ctx.getInputOPP();
				break;
			}
		});
	},
});

OPPCandidateListView = Backbone.View.extend({
	oppkey: "",
	
	render: function() {
		list = this.$el.find("div#list");
		
		if (this.oppkey === "") {
			list.hide();
		}
		else if (this.model.length === 0) {
			list.html("No results").show();
		} else {
			list.html("").show();

			for (var i = 0; i < this.model.length; ++i) {
				var oppview = new OPPView({model: this.model.at(i)});
				oppview.add_button = true;
			
				list.append(oppview.render().el);
			
				oppview.on('opp_add', function(opp_model) {
					this.trigger('opp_add', opp_model);
				}, this);
			}
		}
	},
	
	initialize: function() {
		var list = this.$el.find("div#list");
		list.hide();
				
		this.listenTo(this.model, "reset", function() {
			console.debug("opp candidate collection reset");
			this.render();
		});
		
		this.listenTo(this.model, "add", function(oppmodel) {
			console.debug("opp added to candidate collection");
			var oppview = new OPPView({model: oppmodel});
			oppview.add_button = true;
			
			this.$el.find("div#list").append(oppview.render().el).show();
			
			oppview.on('opp_add', function(opp_model) {
				this.trigger('opp_add', opp_model);
			}, this)
		});
	},
});


