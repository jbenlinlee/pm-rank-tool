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
	draggingRank: undefined,
	
	statusLabelMap: {
		"BACKLOG": "success",
		"SUBMITTED TO PM": "success",
		"FUNCTIONAL DESIGN IN PROGRESS": "success",
		"FUNCTIONAL DESIGN REVIEW": "success",
		"SPEC IN PROGRESS": "success",
		"SPEC READY": "success",
		"APPROACH IN PROGRESS": "success",
		"APPROACH READY": "warning",
		"TECH DESIGN READY": "warning",
		"READY FOR TECHNICAL APPROACH": "success",
		"TECHNICAL APPROACH IN PROGRESS": "warning",
		"TECHNICAL APPROACH REVIEW": "warning",
		"READY FOR TECHNICAL DESIGN": "warning",
		"TECHNICAL DESIGN IN PROGRESS": "warning",
		"TECH DESIGN IN PROGRESS": "warning",
		"TECHNICAL DESIGN REVIEW": "warning",
		"TECH DESIGN REVIEW": "warning",
		"READY TO BE SCHEDULED": "warning",
		"SCHEDULED": "danger",
		"IN DEVELOPMENT": "danger",
		"READY FOR UAT": "danger",
		"COMPLETE": "danger",
		"DECLINED": "danger",
		"DEFERRED": "danger",
		"CLOSED": "danger"
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
		console.debug("Clearing hold to remove timeout");
		clearTimeout(this.holdForRemoveTimeout);
		clearTimeout(this.holdForRemoveIndicatorTimeout);
		
		this.holdForRemoveTimeout = undefined;
		this.holdForRemoveIndicatorTimeout = undefined;
		
		this.$el.removeClass("remove-imminent");
	},
	
	render: function() {
		var model = this.model;
		var ctx = this;
		
		this.$el.append('<div class="opp_insert" id="place_top"></div>');
		this.$el.append('<div class="opp_row"></div>');
		this.$el.append('<div class="opp_insert" id="place_bottom"></div>');
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
		el_status.addClass("label-" + (this.statusLabelMap[model.get("status").toUpperCase()] || "default"));
		
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
				ctx.trigger("opp_dragstart", ctx.model, ctx.rank);
				
				// Cancel and reset any pending remove action
				ctx.clearHoldRemoveTimeout();
			};
			
			function handleDragOver(event) {
				if (ctx.draggingRank < ctx.rank) {
					$(event.target).find("div.opp_insert#place_bottom").show();
				} else {
					$(event.target).find("div.opp_insert#place_top").show();
				}
			}
			
			this.el.ondragenter = function(event) {
				handleDragOver(event);
				event.preventDefault();
			};

			this.el.ondragover = function(event) {
				handleDragOver(event);
				event.preventDefault();
			};
			
			this.el.ondragleave = function(event) {
				$(event.target).find("div.opp_insert").hide();
				event.preventDefault();
			}
			
			this.el.ondrop = function(event) {
				var dropOpp = event.dataTransfer.getData("text/plain");
				console.debug("Dropping " + dropOpp + " on " + model.id);
				
				if (ctx.draggingRank > ctx.rank) {
					ctx.trigger("opp_insertbefore", dropOpp, model.id);
				} else {
					ctx.trigger("opp_insertafter", dropOpp, model.id);
				}
				
				$(event.target).find("div.opp_insert").hide(); // Hide *all* placeholders
				event.preventDefault();
			};
			
			this.el.ondragend = function(event) {
				ctx.trigger("opp_dragend", ctx.model, ctx.rank);
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
		datumTokenizer: function(rankFieldSuggestion) { return rankFieldSuggestion.data.get("name").split(' '); }
	});
}

function filterBloodhound(filterCollection) {
	var filterSuggestions = [];
	filterCollection.forEach(function(filterModel, idx, list) {
		filterSuggestions.push({suggestionType: "filter", data: filterModel});
	});
	
	return new Bloodhound({
		local: filterSuggestions,
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		datumTokenizer: function(filterSuggestion) { return filterSuggestion.data.get("name").split(' '); }
	});
}

function makeJQLRequest(queryText) {
	var postData = {jql: queryText};
	
	return $.ajax({
		type: 'POST',
		url: 'http://jira.freewheel.tv/rest/api/2/search',
		contentType: 'application/json',
		data: JSON.stringify(postData)
	});
}

function oppDirectSource() {
	var lastUpdateTimer = undefined;
	
	return function(query, syncResults, asyncResults) {
		if (query.search(/^(OPP-)?(\d+)$/i) != -1) {
			var queryStr = (query.search(/^OPP-/i) == - 1 ? "OPP-" : "") + query;
		
			clearTimeout(lastUpdateTimer);
			
			lastUpdateTimer = setTimeout(function() {
				makeJQLRequest("issuekey=" + queryStr).done(function(results) {
					if (results.issues.length > 0) {
						var opp = results.issues[0];
						asyncResults([{suggestionType: "direct", data: {summary: opp.fields.summary, key: opp.key}}]);
					}
				});
			}, 250);
		}
	}
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
	
	clearModelOnBlank: function() {
		this.trigger('opp_search_changed', this.$el.val());
		
		if (this.$el.val() === "") {
			this.model.reset();
		}
	},
	
	getOppsByRank: function(rankFieldModel) {
		var rankFieldQueryId = rankFieldModel.get("queryid");
		var query = 'project = OPP and ' + rankFieldQueryId + ' is not EMPTY order by ' + rankFieldQueryId + ' ASC';
		var model = this.model;
		
		var ctx = this;
		
		return makeJQLRequest(query).done(function(issueResults) {
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
	},
	
	getOppsByFilter: function(filterModel) {
		var query = filterModel.get("jql");
		var ctx = this;
		
		return makeJQLRequest(query).done(function(issueResults) {
			var opps = [];
			for (var i = 0; i < issueResults.issues.length; ++i) {
				var issueData = issueResults.issues[i];
				opps.push(ctx.makeOPPModel(issueData));
			}
			
			ctx.model.reset(opps);
		}).fail(function(xhr, status, error) {
			console.log("Failed with status " + xhr.status);
			ctx.model.reset();
		});
	},
	
	getInputOPP: function() {
		var oppkey = this.$el.val();
		
		var model = this.model;
		var ctx = this;

		var opts = undefined;
		if (Number.isInteger(parseInt(oppkey, 10))) {
			return $.ajax({
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
			var query = 'project=OPP and (description~"' + oppkey + '" or summary~"' + oppkey + '") and status not in ("Scheduled", "Ready to be Scheduled", "Declined", "Deferred", "Complete", "Closed") order by createdDate desc';

			return makeJQLRequest(query).done(function(issueResults) {
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
	
	directAddOPP: function(key) {
		var ctx = this;
		
		return $.ajax({
			type: 'GET',
				url: 'http://jira.freewheel.tv/rest/api/2/issue/' + key,
				contentType: 'application/json'
			}).done(function(issueData) {
				ctx.trigger("opp_add", [ctx.makeOPPModel(issueData)]);
			}).fail(function(xhr, status, error) {
				console.log("Failed with status " + xhr.status);
				model.reset();
			});
	},
	
	setupTypeahead: function(rankFieldCollection, filterCollection) {
		this.$el.typeahead('destroy');
		
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
				header: '<div class="tt-dataset-header"><span class="glyphicon glyphicon-sort-by-attributes-alt"></span> Rank Fields</div>',
				footer: '<div class="tt-dataset-footer"></div>'
			}
		},
		{
			name: 'filters',
			async: false,
			source: filterBloodhound(filterCollection),
			display: function(filterSuggestion) { return filterSuggestion.data.get("name"); },
			templates: {
				header: '<div class="tt-dataset-header"><span class="glyphicon glyphicon-heart"></span> Filters</div>',
				footer: '<div class="tt-dataset-footer"></div>'
			}
		},
		{
			name: 'opp-direct',
			async: true,
			source: oppDirectSource(),
			display: function(directSuggestion) { return directSuggestion.data.key + ": " + directSuggestion.data.summary; },
			templates: {
				header: '<div class="tt-dataset-header"><span class="glyphicon glyphicon-tags"></span> Jira Issue Key</div>',
				footer: '<div class="tt-dataset-footer"></div>'
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
				header: '<div class="tt-dataset-header"><span class="glyphicon glyphicon-search"></span> Jira Description and Summary Search</div>',
				footer: '<div class="tt-dataset-footer"></div>'
			}
		}
		);		
	},
	
	initialize: function() {
		// this.listenTo(this.rankFieldCollection, 'reset', this.setupTypeahead);
		
		var statusDiv = this.$el.parent().find('div#input-status');
		statusDiv.hide();
		
		var ctx = this;
		
		this.$el.bind('typeahead:select', function(evt, suggestion) {
			console.log(suggestion);
			ctx.model.reset();
			statusDiv.show();
			var action = undefined;
			
			switch(suggestion.suggestionType) {
			case "textSearch":
				action = ctx.getInputOPP();
				break;
			case "rank":
				action = ctx.getOppsByRank(suggestion.data);
				break;
			case "filter":
				action = ctx.getOppsByFilter(suggestion.data);
				break;
			case "direct":
				action = ctx.directAddOPP(suggestion.data.key);
				break;
			}
			
			var doneAction = function() {
				statusDiv.hide();
			}
			
			action.then(doneAction, doneAction);
		});
	},
	
	events: {
		"input": "clearModelOnBlank"
	}
});

OPPCandidateListView = Backbone.View.extend({
	oppkey: "",
	
	render: function() {
		list = this.$el.find("div#list");
		tools = this.$el.find("div#opp_candidates_tools");
		
		if (this.oppkey === "") {
			list.hide();
			tools.hide();
		}
		else if (this.model.length === 0) {
			list.hide();
			tools.hide();
		} else {
			list.html("").show();
			tools.show();

			for (var i = 0; i < this.model.length; ++i) {
				var oppview = new OPPView({model: this.model.at(i)});
				oppview.add_button = true;
			
				list.append(oppview.render().el);
			
				oppview.on('opp_add', function(opp_model) {
					this.trigger('opp_add', [opp_model]);
				}, this);
			}
		}
	},
	
	initialize: function() {
		var list = this.$el.find("div#list");
		var tools = this.$el.find("div#opp_candidates_tools");
		
		list.hide();
		tools.hide();
				
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
				this.trigger('opp_add', [opp_model]);
			}, this)
		});
		
		var addAllButton = tools.find("button#addAllBtn");
		var ctx = this;
		addAllButton.click(function(evt) {
			ctx.trigger('opp_add', ctx.model.models);
			ctx.model.reset();
		});
	},
});


