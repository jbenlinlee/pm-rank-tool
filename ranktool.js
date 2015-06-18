$(function() {	
	var user = new UserModel();
	var userview = new UserView({model:user});
	var rankfields = new RankFieldCollection();
		
	var AppView = Backbone.View.extend({
		el: $('#ranktoolapp'),
		
		getCustomFields: function() {
			// Fetch custom fields and add PM rank fields to our collectino
			$.ajax({
				type: 'GET',
				url: 'http://jira.freewheel.tv/rest/api/2/field',
				contentType: 'application/json'
			}).done(function(fieldarr) {
				for (var i = 0; i < fieldarr.length; ++i) {
					var fieldrec = fieldarr[i];
					if (fieldrec.name.startsWith("Rank - ")) {
						console.debug("Got rank field " + fieldrec.name);
						rankfields.add({id:fieldrec.id, queryid:fieldrec.clauseNames[0], name:fieldrec.name});
					}
				}
			});
		},
		
		addRankField: function(rankfield) {
			var el_select = this.$el.find('select#rankfield_select');
			el_select.append('<option value="' + rankfield.get("id") + '">' + rankfield.get("name").substr(7) + '</option>');
		},
		
		initialize: function() {
			// Get custom fields

			user.on("change", function() {
				if (user.hasChanged("validated") && user.get("validated")) {
					console.log("User is validated!");
					userview.render();
					this.getCustomFields();
				}
			}, this);
			
			this.listenTo(rankfields, 'add', this.addRankField);
			
			user.validate(); // Initial validation
		},
	});

	var app = new AppView();
    });