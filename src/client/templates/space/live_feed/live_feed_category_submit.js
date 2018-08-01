Template.liveFeedPostSubmit.onRendered(function() {

	$(".live-feed-category-submit--form").validate({
        rules: {
            categoryName: {
                required: true,
                minlength: 1,
                maxlength: 20
            }
        }
    }); 

    Session.set('numChars', 0); // Count the number of characters
});


Template.liveFeedCategorySubmit.events({

	'submit form': function(e, template) {
		 e.preventDefault();

		var spaceId = template.data.space._id;

		var categoryName = $('#categoryName').val().trim();
		Meteor.call('categoryInsert', categoryName, spaceId, function(error) {
			if (error)
				alert(TAPi18n.__('error-message')+error.message);
			else {
				$('#liveFeedCategorySubmit').modal('hide');
				$('[name=categorySelect]').val(categoryName);
			}
		});
		$('#categoryName').val('');
		Session.set('numChars', 0); // Count the number of characters
	},
	'click .live-feed-category-submit--button-submit': function(e) {
		e.preventDefault();
		$('#live-feed-category-submit--form').submit();
	},
	'input #categoryName': function(){
    	Session.set('numChars', $('#categoryName').val().length);
  	}
});


Template.liveFeedCategorySubmit.helpers({

	'numChars': function(menuItemId) {
		return Session.get('numChars');
	},
});