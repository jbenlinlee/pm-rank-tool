var UserModel = Backbone.Model.extend({
	defaults: function() {
		return {
			username: "user",
			password: "pass",
			validated: false
		};
	},
	
	validate: function() {
		var auth = btoa(this.get("username") + ":" + this.get("password"));
		var user = this;
		
		$.ajax({
			type: 'GET',
			url: "http://jira.freewheel.tv/rest/api/2/myself", 
			contentType: "application/json",
			headers: {
				"Authorization": "Basic " + auth
			},
			xhrFields: {
				withCredentials: false
			}
		}).done(function(data, status, jqxhr) {
			console.log(data);
			user.set("validated", true);
		}).fail(function(xhr, status, error) {
			user.set("validated", false);
		});
	}
});

var UserView = Backbone.View.extend({
	el: $('div#jira_credentials'),
	
	render: function() {
		if (this.model.get("validated")) {
			this.$el.hide();
		} else {
			this.$el.show();
		}
		
		return this;
	},
	
	initialize: function() {
		this.listenTo(this.model, "change", function() {
			this.render();
		});
	},
	
	lastTime: undefined,
	
	validateUser: function() {
		if (this.lastTime) {
			clearTimeout(this.lastTime);
		}
		
		var user = this.model;
		
		if (this.$("#jira_user").val() !== "" && this.$("#jira_pass").val() !== "") {
			user.set("username", this.$("#jira_user").val());
			user.set("password", this.$("#jira_pass").val());
			this.lastTime = setTimeout(function() {
				user.validate();
			}, 500);
		}
	},
	
	events: {
		"input #jira_user": "validateUser",
		"input #jira_pass": "validateUser"
	}
});