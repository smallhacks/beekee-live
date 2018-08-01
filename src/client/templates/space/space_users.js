Template.spaceUsers.events({
	
	'submit form': function(event, template) {
		event.preventDefault();

		var authorName = $('#space-users--input').val().trim();

		if (authorName != "") {
			if (Authors.findOne({name:authorName})) {
				if (confirm(TAPi18n.__('space-users--user-exist',authorName))) {
					Session.setPersistent(template.data.space._id, {author: authorName}); // Persistent to browser refresh
					Router.go('space', {_id: template.data.space._id});
				}
				else
					return;
			}
			else {
				Meteor.call('authorInsert', authorName, template.data.space._id, function(error) {
					if(error)
						alert(TAPi18n.__('error-message')+error.message);
					else {
						Session.setPersistent(template.data.space._id, {author: authorName, favorites: []});
						Router.go('space', {_id: template.data.space._id});					
					} 
				});
			}
		}
	},
	'click .space-users--button-submit-author': function(event, template) {
		event.preventDefault();
		$('#space-users--form').submit();
	}
});