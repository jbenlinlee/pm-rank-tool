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
});

var RankFieldSelectView = Backbone.View.extend({
	initialize: function() {
		var select = this.$el.find("select#rank_field_select");

		this.listenTo(this.model, 'add', function(rankfield) {
			select.append('<option id="' + rankfield.id + '" value="' + rankfield.id + '">' + rankfield.get("name") + '</option>');
		});
		
		var saveBtn = this.$el.find("button#saveRankBtn");
		select.change(function(evt) {
			console.debug(select.val());
			saveBtn.removeAttr("disabled");
		});
	}
});