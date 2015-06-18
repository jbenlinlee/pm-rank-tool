$(function() {	
	var user = new UserModel();
	var userview = new UserView({model:user});
	var versions = new VersionCollection();
		
	var AppView = Backbone.View.extend({
		el: $('#ranktoolapp'),
		
		getVersions: function() {
			$.ajax({
				type: 'GET',
				url: 'http://jira.freewheel.tv/rest/api/2/project/OPP/versions',
				contentType: 'application/json',
			}).done(function(data) {
				var foundVersions = [];
				
				for (var i = 0; i < data.length; ++i) {
					var jVersion = data[i];
					var arr = jVersion.name.split('.', 3);
					var ver_major = arr[0];
					var ver_minor = arr[1];
					var ver_point = arr[2] || 0;
					var start = moment(jVersion.startDate);
					var end = moment(jVersion.releaseDate);
					
					if (ver_point == 0) {
						foundVersions.push(new VersionModel({
							major: ver_major,
							minor: ver_minor,
							point: ver_point,
							date_start: start,
							date_end: end
						}));
					
						console.debug("Got ver: " + ver_major + "." + ver_minor + "." + ver_point);
					}
				}
				
				versions.add(foundVersions);
			});
		},
		
		getCustomFields: function() {
			$.ajax({
				type: 'GET',
				url: 'http://jira.freewheel.tv/rest/api/2/field',
				contentType: 'application/json'
			}).done(function(data) {
				var allFields = JSON.parse(data);
				for (var fieldRec in allFields) {
					console.log(fieldRec.name);
				}
			});
		},
		
		initialize: function() {
			// Get custom fields

			user.on("change", function() {
				if (user.hasChanged("validated") && user.get("validated")) {
					console.log("User is validated!");
					userview.render();
					this.getVersions();
				}
			}, this);
			
			user.validate();
		},
	});

	var app = new AppView();
    });