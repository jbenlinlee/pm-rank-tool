$(function() {	
	var user = new UserModel();
	var userview = new UserView({model:user});
	
	var oppCandidates = new OPPCollection();
	var oppCandidatesView = new OPPCandidateListView({model: oppCandidates, el: $("div#opp_candidates")});
	var oppInputView = new OPPInputView({model: oppCandidates});
	
	var oppRanks = new OPPCollection();
	var oppRanksView = new OPPRankListView({model: oppRanks, el: $("div#opp_rank")});
	
	var rankfields = new RankFieldCollection();
	var rankfieldSelectView = new RankFieldSelectView({model: rankfields, el: $("div#opp_rank_tools")});
		
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
		
		clearRanksHelper: function(rankfield_model, rankedopp_collection, currRanks) {
			if (currRanks.length > 0) {
				var issueToClear = currRanks.shift();
				var ctx = this;
				
				var reqObj = {update:{}};
				reqObj.update[rankfield_model.id] = [{"set":null}];
				
				console.log('Clearing ' + issueToClear.key);
				$.ajax({
					type: 'PUT',
					url: issueToClear.self,
					contentType: 'application/json',
					data: JSON.stringify(reqObj)
				}).done(function(resp) {
					console.debug('Successfully cleared ' + issueToClear.key);
					ctx.clearRanksHelper(rankfield_model, rankedopp_collection, currRanks);
				});				
			} else {
				console.log("All current ranks cleared");
			}
		},
		
		saveRanks: function(rankfield_model, rankedopp_collection) {
			console.debug("Getting current ranks " + rankfield_model.id + "/" + rankfield_model.get("name"));
			var ctx = this;
			
			var currentRank_req = $.ajax({
					type: 'POST',
					url: 'http://jira.freewheel.tv/rest/api/2/search',
					contentType: 'application/json',
					data: JSON.stringify({jql: 'project=OPP and ' + rankfield_model.get("queryid") + ' is not EMPTY'})
				}).done(function(searchResponse) {
					var issuesToClear = [];
					for (var i = 0; i < searchResponse.issues.length; ++i) {
						var issue = searchResponse.issues[i];
						issuesToClear.push(issue);
					}
					
					ctx.clearRanksHelper(rankfield_model, rankedopp_collection, issuesToClear);
				}).fail(function(xhr, status, error) {
					console.error("Failure while getting issues to clear")
				});
			
			console.debug("Clearing ranks " + rankfield_model.id + "/" + rankfield_model.get("name"));
			console.debug("Setting ranks " + rankfield_model.id + "/" + rankfield_model.get("name"));
		},
		
		initialize: function() {
			this.listenTo(user, "change", this.checkUserValidation);

			oppCandidatesView.listenTo(oppInputView, 'opp_search_changed', function(oppkey) {
				this.oppkey = oppkey;
			});

			oppCandidatesView.on('opp_add', this.registerCandidateOpp, this);

			var ctx = this;
			var modal = $("div#save_confirm_modal");
			modal.modal({show: false});
			
			this.listenTo(rankfieldSelectView, "rank_save", function(rankfield_model) {
				var modal_text = modal.find("div.modal-body");
				modal_text.html("Committing your rank to <strong>" + rankfield_model.get("name") + "</strong> will clear all existing ranks in that field and replace them with your ranks. Are you sure that's a great idea?");
				
				var modal_confirm = modal.find("button#confirmRank");
				modal_confirm.unbind("click");
				
				modal_confirm.click(function(evt) {
					console.debug("Confirm save ranks to " + rankfield_model.id + "/" + rankfield_model.get("name"));
					modal.modal('hide');
					ctx.saveRanks(rankfield_model, oppRanks);
				});
				
				modal.modal('show');
			});
			
			user.validate();

		},
	});

	var app = new AppView();
    });