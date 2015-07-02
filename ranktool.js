$(function() {	
	var user = new UserModel();
	var userview = new UserView({model:user});
	var rankfields = new RankFieldCollection();
	
	var oppCandidates = new OPPCollection();
	var oppCandidatesView = new OPPCandidateListView({model: oppCandidates, el: $("div#opp_candidates")});
	var oppInputView = new OPPInputView({model: oppCandidates});
	
	var oppRanks = new OPPCollection();
	var oppRanksView = new OPPRankListView({model: oppRanks, el: $("div#opp_rank")});
		
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
			var el_select = this.$el.find('select#opp_input_rank');
			el_select.append('<option value="' + rankfield.get("id") + '">' + rankfield.get("name").substr(7) + '</option>');
		},
		
		checkUserValidation: function() {
			if (user.hasChanged("validated") && user.get("validated")) {
				console.log("User is validated!");
				userview.render();
				this.getCustomFields();
			}
		},
		
		registerCandidateOpp: function(opp_model) {
			console.log('Got add request for ' + [opp_model.id, opp_model.get("title")].join('/'));
			oppRanks.add(opp_model);
		},
		
		initialize: function() {
			this.listenTo(user, "change", this.checkUserValidation);
			this.listenTo(rankfields, 'add', this.addRankField);
			oppCandidatesView.listenTo(oppInputView, 'opp_search_changed', function(oppkey) {
				this.oppkey = oppkey;
			});
			
			user.validate();

			oppCandidatesView.on('opp_add', this.registerCandidateOpp, this);
		},
	});

	var app = new AppView();
    });