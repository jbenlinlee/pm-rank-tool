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
		
		this.$el.append('<div class="opp_insert"></div>');
		this.$el.append('<div class="opp_row"></div>');
		var row = this.$el.find("div.opp_row");
		
		row.append('<div class="opp_cell opp_key">' + model.id + '</div>');
		row.append('<div class="opp_cell opp_name">' + model.get("title") + '</div>');
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
		
		switch(model.get("status").toUpperCase()) {
		case "BACKLOG":
			el_status.addClass("label-default");
			break;
		case "SUBMITTED TO PM":
			el_status.addClass("label-default");
			break;
		case "FUNCTIONAL DESIGN IN PROGRESS":
			el_status.addClass("label-default");
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
		
		var tools = row.find('div#tools');
		
		if (this.add_button) {
			this.$el.click(function (evt) {
				console.debug("Want to add " + [model.id, model.get("title")].join('/') + " to rank");
				ctx.trigger("opp_add", model);
			});
		}
		
		if (this.remove_button) {
			tools.append('<span id="remove" class="glyphicon glyphicon-remove"></span>');
			this.$el.find('i#remove').click(function (evt) {
				console.debug("Want to remove " + [model.id, model.get("title")].join('/') + " from rank");
				ctx.trigger("opp_remove", model);
			});
		}
		
		if (this.rank_buttons) {
			this.$el.attr("draggable", "true");
			
			this.el.ondragstart = function(event) {
				console.debug("Dragging " + model.id);
				event.dataTransfer.setData("text/plain", model.id);
				ctx.trigger("opp_dragstart");
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
			assignee: jiraIssue.fields.assignee != undefined ? jiraIssue.fields.assignee.name : "Unassigned",
			status: jiraIssue.fields.status.name			
		});
	},
	
	getInputOPP: function() {
		if (this.lastTime) {
			clearTimeout(this.lastTime);
		}
	
		var oppkey = this.$el.val();
		this.trigger('opp_search_changed', oppkey);
		
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
		}, 500);
		
	},
	
	events: {
		"input": "getInputOPP"
	}
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

OPPRankListView = Backbone.View.extend({
	render: function() {
		var list_elem = this.$el.find("div#list");
		list_elem.html("");
		
		var oppcollection = this.model;
		
		rankSelector = this.$el.find("div#opp_rank_tools");
		if (oppcollection.length > 0) {
			rankSelector.show();
		} else {
			rankSelector.hide();
		}
		
		this.model.forEach(function(elem, idx, list) {
			var oppview = new OPPView({model: elem});
			oppview.remove_button = true;
			oppview.rank_buttons = true;
			
			list_elem.append(oppview.render().el);
			oppview.on('opp_remove', function(opp_model) {
				oppcollection.remove(opp_model);
			}, this);
			
			oppview.on('opp_insertbefore', function(sourceid, targetid) {
				if (sourceid !== targetid) {
					var opparr = oppcollection.models;
					var newopparr = [];
					var sourceopp = oppcollection.get(sourceid);
					var targetopp = oppcollection.get(targetid);
				
					for (var i = 0; i < opparr.length; ++i) {
						if (opparr[i] != sourceopp) {
							if (opparr[i] == targetopp) {
								newopparr.push(sourceopp);
							}
						
							newopparr.push(opparr[i]);
						}
					}
				
					oppcollection.reset(newopparr);
				}
			});
			
			oppview.on('opp_dragstart', function() {
				list_elem.find("div.opp").addClass("dragging");
			});
			
			oppview.on('opp_dragend', function() {
				list_elem.find("div.opp").removeClass("dragging");
			});
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
		
		this.render();
	}
})
