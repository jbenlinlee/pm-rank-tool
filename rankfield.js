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
		this.listenTo(this.model, 'add', function(rankfield) {
			this.$el.append('<option id="' + rankfield.id + '" value="' + rankfield.id + '">' + rankfield.get("name") + '</option>');
		});
		
		var select = this.$el;
		this.$el.change(function(evt) {
			console.debug(select.val());
		});
	}
});