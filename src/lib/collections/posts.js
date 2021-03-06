// Copyright 2016-2020 UNIVERSITY OF GENEVA (GENEVA, SWITZERLAND)

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


Posts = new Mongo.Collection('posts');

// TODO : add server-side security

Posts.allow({
	insert: function() {return true;},

	remove: function() {return true;},

	update: function() {return true;}
});

if(Meteor.isClient) {
	Counts = new Mongo.Collection("counts"); // Store post count of a space ; Allow to count them without subscribe to all posts (optimization)
	PinnedCounts = new Mongo.Collection("pinnedCounts");
	FilesCounts = new Mongo.Collection("filesCounts");
	ImagesCounts = new Mongo.Collection("imagesCounts");
	LiveFeedCounts = new Mongo.Collection("liveFeedCounts");
}

if(Meteor.isServer) {

	Posts.before.insert(function (userId, doc) {
		// change modified date
		Spaces.update(doc.spaceId, {$set: {modified: Date.now()}});
		doc.version =  1;
		//doc.modified = Date.now();
		/*
		var versionning = {};
		_.extend(versionning, doc, {modifiedBy: userId});
		Meteor.call('addPostVersion', versionning);
		*/
	});


	// Copy post in postVersion before updated
	// TODO : refactoring
	Posts.before.update(function (userId, doc, fieldNames, modifier, options) {



		// var versionning = {};
		// _.extend(versionning, doc, {modifiedBy: userId});
		// Meteor.call('addPostVersion', versionning);

		// var newInc = doc.version+1;
		// if (!modifier.$set) modifier.$set = {};
		// modifier.$set.version = newInc;
		// modifier.$set.modified = Date.now();
	});


	Posts.before.remove(function (userId, doc) { 


		// var deletionTime = Date.now();

		// Meteor.call('tagsEdit', {spaceId: doc.spaceId, newTags: [], oldTags: doc.tags}, function(error) { // Decrement tags nRefs
		// 	if (error) {
		// 		throwError(error.reason);
		// 	}
 	// 	});

		// var file = Files.findOne({'metadata.postId': doc.fileId}); // Remove file
		// if (file){
		// 	 // TODO : remove file (not only from collection)
		// 	Files.remove(file._id);
		// }

		// Delete the file if exists
		var fileId = doc.fileId;
		var fileExt = doc.fileExt;
		if (fileId) {
			Files.remove({fileId:fileId});
			Meteor.call('deleteFile',doc);
		}

		if (doc.type == 'home') { // Update post order
			var post = doc;

			var postsDown = Posts.find({spaceId:doc.spaceId, type:'home', order:{$gt:post.order}}).fetch();

			for (var i=0; i<postsDown.length; i++) {
				console.log("id : "+postsDown[i]._id);
				var currentPost = postsDown[i];
				Posts.update({_id:currentPost._id},{$set:{order:currentPost.order-1}});
			}
		}

		if (doc.type == 'liveFeed') {
			var author = Authors.findOne({spaceId: doc.spaceId, name: doc.author});
			Authors.update(author._id, {$inc: {nRefs: -1}}); // Decrement author nRefs

			if (doc.category) {
				var category = Categories.findOne({spaceId: doc.spaceId, type:"liveFeed", name: doc.category});
				if (category)
					Categories.update(category._id, {$inc: {nRefs: -1}}); // Decrement category nRefs
			}
		}

		if (doc.type == 'resource') {
			if (doc.category) {
				var category = Categories.findOne({spaceId: doc.spaceId, type:"resource", name: doc.category});
				if (category)
					Categories.update(category._id, {$inc: {nRefs: -1}}); // Decrement category nRefs
			}
		}
		// // Add post to posts versions
		// // TODO : refactoring
		// var space = Spaces.findOne(doc.spaceId);
		// // var oldPosts = [];
		// // if (space.oldPosts !== undefined) {
		// // 	oldPosts = space.oldPosts;
		// // }
		// // oldPosts.push(doc._id);
		// //Spaces.update(doc.spaceId, {$set: {oldPosts: oldPosts, modified: Date.now()}});
		// Spaces.update(doc.spaceId, {$set: {modified: Date.now()}});

		// doc.version =  doc.version++;
		// doc.modified = Date.now();
		// var versionning = {};
		// _.extend(versionning, doc, {modifiedBy: userId, last: true});
		// Meteor.call('addPostVersion', versionning);
	});
}


Meteor.methods({

	addLikeComment: function(data) {
		Posts.update({_id:data.currentPostId,"comments.id":data.currentCommentId}, {$push: {"comments.$.likes": data.author}});
	},
	removeLikeComment: function(data) {
		Posts.update({_id:data.currentPostId,"comments.id":data.currentCommentId}, {$pull: {"comments.$.likes": data.author}});
	},
	homePostInsert: function(postAttributes) {
		check(postAttributes.spaceId, String);

		//if (Meteor.settings.public)
			//var postFromCloud = !(Meteor.settings.public.isBox === "true"); // Set where post is submitted (box or cloud)

		post = _.extend(postAttributes, {
			submitted: Date.now(),
			order: Posts.find({spaceId: postAttributes.spaceId, type: postAttributes.type}).count(),
			//nb: Posts.find({spaceId: postAttributes.spaceId}).count() + 1,
			//pinned : false,
		});

		var space = Spaces.findOne(postAttributes.spaceId);
		post._id = Posts.insert(post);		
		return post._id;
	},
	postInsert: function(postAttributes) {
		check(postAttributes.spaceId, String);

		//if (Meteor.settings.public)
			//var postFromCloud = !(Meteor.settings.public.isBox === "true"); // Set where post is submitted (box or cloud)

		item = Authors.findOne({spaceId: postAttributes.spaceId, name: postAttributes.author});
		Authors.update(item, {$inc: {nRefs: 1}});
		post = _.extend(postAttributes, {
			authorId: Authors.findOne({spaceId: postAttributes.spaceId, name: postAttributes.author})._id,
			submitted: Date.now(),
			nb: Posts.find({spaceId: postAttributes.spaceId}).count() + 1,
			pinned : false,
			// postFromCloud: postFromCloud // Workaround bug sync
		});

		// Get client IP address
		if (Meteor.isServer)
			post = _.extend(postAttributes, {clientIP: this.connection.clientAddress});

		var space = Spaces.findOne(postAttributes.spaceId);

		category = Categories.findOne({spaceId: postAttributes.spaceId, name: postAttributes.category}); // Increment category nRefs
		Categories.update(category, {$inc: {nRefs: 1}});

		post._id = Posts.insert(post);		
		return post._id;
	}
});