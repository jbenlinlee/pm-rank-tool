OPPRankListView = Backbone.View.extend({
	render: function() {
		var list_elem = this.$el.find("div#list");
		list_elem.html("");
		
		var oppcollection = this.model;
		
		rankSelector = this.$el.find("div#opp_rank_tools");
		if (oppcollection.length == 0) {
			list_elem.html('<div class="list_placeholder">Empty rank list. Try search for and adding an OPP above.</div>');
		}
		
		oppcollection.forEach(function(elem, idx, list) {
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
		});
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
});

var RankFieldSelectView = Backbone.View.extend({
	render: function() {
		var select = this.$el.find("select#rank_field_select");
		select.html('<option value="" disabled selected>Select Rank Field</option>');
		this.model.forEach(function(rankfieldModel, idx, list) {
			select.append('<option id="' + rankfieldModel.id + '" value="' + rankfieldModel.id + '">' + rankfieldModel.get("name") + '</option>');
		});
	},
	
	initialize: function() {
		var select = this.$el.find("select#rank_field_select");
		var saveBtn = this.$el.find("button#saveRankBtn");
		var clearBtn = this.$el.find("button#clearRankBtn");
		
		var rankCollection = this.model;
		var selectField = undefined;

		this.listenTo(this.model, 'add', function(rankfield) {
			select.append('<option id="' + rankfield.id + '" value="' + rankfield.id + '">' + rankfield.get("name") + '</option>');
		});
		
		this.listenTo(this.model, 'reset', this.render);
		
		select.change(function(evt) {
			console.debug("Rank field selection changed to " + select.val());
			selectField = rankCollection.get(select.val());
			saveBtn.removeAttr("disabled");
		});
		
		var ctx = this;
		saveBtn.click(function(evt) {
			if (selectField != undefined) {
				ctx.trigger("rank_save", selectField);
			}
		});
		
		clearBtn.click(function(evt) {
			ctx.trigger("rank_clear");
		});
	}
});