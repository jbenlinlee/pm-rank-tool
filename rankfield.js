var RankField = Backbone.Model.extend({
	defaults: function() {
		return {
			id: undefined,
			queryid: undefined,
			name: ""
		}
	}
});

var RankFieldCollection = Backbone.Collection.extend({
	model: RankField
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