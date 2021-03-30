// Copyright 2016-2021 VINCENT WIDMER

// This file is part of Beekee Live.
    
// Beekee Live is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Beekee Live is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
//  along with Beekee Live.  If not, see <https://www.gnu.org/licenses/>.

//**************************************************************************


Template.liveFeedDeleteComment.events({

	'click .live-feed--delete-comment--confirm': function(e) {
		e.preventDefault();

		var currentPostId = Template.parentData(1)._id;
		var currentCommentId = this.id;
		
		Posts.update(currentPostId, {$pull: {comments: {id:currentCommentId}}}, function(error) {
			if (error) {
				alert(TAPi18n.__('error-message')+error.message);
			} else {		
				$('#liveFeedDeleteComment-'+currentCommentId).modal('hide');
			}
		});
	}
});
