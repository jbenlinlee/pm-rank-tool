$(function() {	
	var user = new UserModel();
	var userview = new UserView({model:user});
	
	var oppCandidates = new OPPCollection();
	var oppCandidatesView = new OPPCandidateListView({model: oppCandidates, el: $("div#opp_candidates")});
	
	var oppRanks = new OPPCollection();
	var oppRanksView = new OPPRankListView({model: oppRanks, el: $("div#opp_rank")});
	
	var rankfields = new RankFieldCollection();
	var rankfieldSelectView = new RankFieldSelectView({model: rankfields, el: $("div#opp_rank_tools")});
	
	var favoriteFilters = new JiraFilterCollection();

	var oppInputView = new OPPInputView({model: oppCandidates});
		
	var AppView = Backbone.View.extend({
		el: $('#ranktoolapp'),
		
		getCustomFields: function() {
			// Fetch custom fields and add PM rank fields to our collectino
			$.ajax({
				type: 'GET',
				url: 'http://jira.freewheel.tv/rest/api/2/field',
				contentType: 'application/json'
			}).done(function(fieldarr) {
				var fieldModels = [];

				for (var i = 0; i < fieldarr.length; ++i) {
					var fieldrec = fieldarr[i];
					
					if (fieldrec.name.startsWith("Rank - ")) {
						console.debug("Got rank field " + fieldrec.name);
						fieldModels.push(new RankField({id:fieldrec.id, queryid:fieldrec.clauseNames[0], name:fieldrec.name}));
					}
				}
				
				rankfields.reset(fieldModels);
			});
		},
		
		getFavoriteFilters: function() {
			$.ajax({
				type: 'GET',
				url: 'http://jira.freewheel.tv/rest/api/2/filter/favourite',
				contentType: 'application/json'
			}).done(function(filterArray) {
				var filterModels = [];
				
				for (var i = 0; i < filterArray.length; ++i) {
					var filter = filterArray[i];
					
					console.debug("Got favorite filter " + filter.name);
					filterModels.push(new JiraFilter({id:filter.id, url:filter.self, jql:filter.jql, name:filter.name, description:filter.description}));
				}
				
				favoriteFilters.reset(filterModels);
			});
		},
		
		checkUserValidation: function() {
			if (user.hasChanged("validated") && user.get("validated")) {
				console.log("User is validated!");
				userview.render();
				this.getCustomFields();
				this.getFavoriteFilters();
			}
		},
		
		registerCandidateOpp: function(opp_model_array) {
			var currentRanks = oppRanks.models;
		
			for (var i = 0; i < opp_model_array.length; ++i) {
				var opp_model = opp_model_array[i];
				console.log('Got add request for ' + [opp_model.id, opp_model.get("title")].join('/'));
				currentRanks.push(opp_model);
			}
			
			oppRanks.reset(currentRanks);
		},
		
		setRanksHelper: function(rankfield_model, rankedOpps, nextRank, numRanksToSet) {
			var ctx = this;
			
			if (rankedOpps.length > 0) {
				var oppToRank = rankedOpps.shift();
				
				var reqObj = {update:{}};
				reqObj.update[rankfield_model.id] = [{"set": nextRank}];
				
				console.log('Setting ' + oppToRank.id + ' to rank ' + nextRank);
				$.ajax({
					type: 'PUT',
					url: oppToRank.get("url"),
					contentType: 'application/json',
					data: JSON.stringify(reqObj)
				}).done(function(resp) {
					console.debug('Successfully set rank on ' + oppToRank.id);
					
					var progress = (0.5 + (0.5 * (numRanksToSet - rankedOpps.length) / numRanksToSet)) * 100 + "%"
					console.debug('Progress: ' + progress);
					$("div#clearset_progress").css("width", progress);
					
					ctx.setRanksHelper(rankfield_model, rankedOpps, nextRank + 1, numRanksToSet);
				}).fail(function(xhr, status, error) {
					console.warn('Failed to set rank on ' + oppToRank.id);
				});
			} else {
				$("div#clearset_progress").css("width", "100%");
				setTimeout(function() {
					$("div#work_progress").hide();
				}, 3000);
			}
		},
		
		clearRanksHelper: function(rankfield_model, rankedopp_collection, currRanks, numRanksToClear) {			
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
					
					var progress = (0.5 * (numRanksToClear - currRanks.length) / numRanksToClear) * 100 + "%";
					console.debug('Progress: ' + progress);
					$("div#work_clear").css("width", progress);
					
					ctx.clearRanksHelper(rankfield_model, rankedopp_collection, currRanks, numRanksToClear);
				}).fail(function(xhr, status, error) {
					console.warn('Failed to clear rank on ' + issueToClear.key);
				});				
			} else {
				console.log("All current ranks cleared");
				$("div#clearset_progress").css("width", "50%");
				var opps = [];
				for (var i = 0; i < rankedopp_collection.length; ++i) {
					opps.push(rankedopp_collection.at(i));
				}
				
				this.setRanksHelper(rankfield_model, opps, 1, opps.length);
			}
		},
		
		saveRanks: function(rankfield_model, rankedopp_collection) {
			console.debug("Getting current ranks " + rankfield_model.id + "/" + rankfield_model.get("name"));
			
			var progress = $("div#work_progress");
			progress.find("div#clearset_progress").css("width", "0%");
			progress.show();
			
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
					
					ctx.clearRanksHelper(rankfield_model, rankedopp_collection, issuesToClear, issuesToClear.length);
				}).fail(function(xhr, status, error) {
					console.error("Failure while getting issues to clear")
				});
		},
		
		initialize: function() {
			this.listenTo(user, "change", this.checkUserValidation);

			oppCandidatesView.listenTo(oppInputView, 'opp_search_changed', function(oppkey) {
				this.oppkey = oppkey;
			});

			oppCandidatesView.on('opp_add', this.registerCandidateOpp, this);
			oppInputView.on('opp_add', this.registerCandidateOpp, this);
			
			oppInputView.rankFieldsCollection = rankfields;
			oppInputView.listenTo(rankfields, 'reset', function() {
				oppInputView.setupTypeahead(rankfields, favoriteFilters);
			});
			oppInputView.listenTo(favoriteFilters, 'reset', function() {
				oppInputView.setupTypeahead(rankfields, favoriteFilters);
			})

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
			
			this.listenTo(rankfieldSelectView, "rank_clear", function() {
				console.debug("Clearing ranks");
				oppRanks.reset();
			});
			
			user.validate();

		},
	});

	var app = new AppView();
    });