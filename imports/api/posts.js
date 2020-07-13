import { Mongo } from 'meteor/mongo';
 
import { Authors } from './authors.js';
import { Spaces } from './spaces.js';
import { Categories } from './categories.js';
import { Files } from './files.js';


export const Posts = new Mongo.Collection('live-posts');


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

Meteor.publish('post', function(postId) {
	check(postId, String);
	return Posts.find({_id: postId});
});

Meteor.publish('homePosts', function(spaceId) {
	check(spaceId, String);
	return Posts.find({spaceId: spaceId, type:"home"},{sort: {submitted: 1}});
});

Meteor.publish('liveFeedPosts', function(spaceId) {
	check(spaceId, String);
	return Posts.find({spaceId: spaceId, type:"liveFeed"},{sort: {submitted: -1}});
});

Meteor.publish('resourcesPosts', function(spaceId) {
	check(spaceId, String);
	return Posts.find({spaceId: spaceId, type:"resources"});
});

Meteor.publish('posts', function(filters, skip = 0, limit = 0) {
	return Posts.find(filters, {sort: {submitted:1},skip:skip,limit:limit});
});



	Meteor.publish("count-all-live-feed", function (spaceId) {
	var self = this;
	var liveFeedCounts = 0;
	var initializing = true;

	var handle = Posts.find({spaceId: spaceId, type:'liveFeed'}).observeChanges({
		added: function (doc, idx) {
			liveFeedCounts++;
			if (!initializing) {
				self.changed("liveFeedCounts", spaceId, {count: liveFeedCounts});  // "counts" is the published collection name
			}
		},
		removed: function (doc, idx) {
			liveFeedCounts--;
			self.changed("liveFeedCounts", spaceId, {count: liveFeedCounts});  // Same published collection, "counts"
		}
	});

	initializing = false;

	// publish the initial count. `observeChanges` guaranteed not to return
	// until the initial set of `added` callbacks have run, so the `count`
	// variable is up to date.
	self.added("liveFeedCounts", spaceId, {count: liveFeedCounts});

	// and signal that the initial document set is now available on the client
	self.ready();

	// turn off observe when client unsubscribes
	self.onStop(function () {
		handle.stop();
	});
});
}

// if(Meteor.isServer) {

// 	Posts.before.insert(function (userId, doc) {
// 		// change modified date
// 		Spaces.update(doc.spaceId, {$set: {modified: Date.now()}});
// 		doc.version =  1;
// 		//doc.modified = Date.now();
// 		/*
// 		var versionning = {};
// 		_.extend(versionning, doc, {modifiedBy: userId});
// 		Meteor.call('addPostVersion', versionning);
// 		*/
// 	});


// 	// Copy post in postVersion before updated
// 	// TODO : refactoring
// 	Posts.before.update(function (userId, doc, fieldNames, modifier, options) {



// 		// var versionning = {};
// 		// _.extend(versionning, doc, {modifiedBy: userId});
// 		// Meteor.call('addPostVersion', versionning);

// 		// var newInc = doc.version+1;
// 		// if (!modifier.$set) modifier.$set = {};
// 		// modifier.$set.version = newInc;
// 		// modifier.$set.modified = Date.now();
// 	});


// 	Posts.before.remove(function (userId, doc) { 


// 		// var deletionTime = Date.now();

// 		// Meteor.call('tagsEdit', {spaceId: doc.spaceId, newTags: [], oldTags: doc.tags}, function(error) { // Decrement tags nRefs
// 		// 	if (error) {
// 		// 		throwError(error.reason);
// 		// 	}
//  	// 	});

// 		// var file = Files.findOne({'metadata.postId': doc.fileId}); // Remove file
// 		// if (file){
// 		// 	 // TODO : remove file (not only from collection)
// 		// 	Files.remove(file._id);
// 		// }

// 		// Delete the file if exists
// 		var fileId = doc.fileId;
// 		var fileExt = doc.fileExt;
// 		if (fileId) {
// 			Files.remove({fileId:fileId});
// 			Meteor.call('deleteFile',doc);
// 		}

// 		if (doc.type == 'home') { // Update post order
// 			var post = doc;

// 			var postsDown = Posts.find({spaceId:doc.spaceId, type:'home', order:{$gt:post.order}}).fetch();

// 			for (var i=0; i<postsDown.length; i++) {
// 				console.log("id : "+postsDown[i]._id);
// 				var currentPost = postsDown[i];
// 				Posts.update({_id:currentPost._id},{$set:{order:currentPost.order-1}});
// 			}
// 		}

// 		if (doc.type == 'liveFeed') {
// 			var author = Authors.findOne({spaceId: doc.spaceId, name: doc.author});
// 			Authors.update(author._id, {$inc: {nRefs: -1}}); // Decrement author nRefs

// 			if (doc.category) {
// 				var category = Categories.findOne({spaceId: doc.spaceId, type:"liveFeed", name: doc.category});
// 				if (category)
// 					Categories.update(category._id, {$inc: {nRefs: -1}}); // Decrement category nRefs
// 			}
// 		}

// 		if (doc.type == 'resource') {
// 			if (doc.category) {
// 				var category = Categories.findOne({spaceId: doc.spaceId, type:"resource", name: doc.category});
// 				if (category)
// 					Categories.update(category._id, {$inc: {nRefs: -1}}); // Decrement category nRefs
// 			}
// 		}
// 		// // Add post to posts versions
// 		// // TODO : refactoring
// 		// var space = Spaces.findOne(doc.spaceId);
// 		// // var oldPosts = [];
// 		// // if (space.oldPosts !== undefined) {
// 		// // 	oldPosts = space.oldPosts;
// 		// // }
// 		// // oldPosts.push(doc._id);
// 		// //Spaces.update(doc.spaceId, {$set: {oldPosts: oldPosts, modified: Date.now()}});
// 		// Spaces.update(doc.spaceId, {$set: {modified: Date.now()}});

// 		// doc.version =  doc.version++;
// 		// doc.modified = Date.now();
// 		// var versionning = {};
// 		// _.extend(versionning, doc, {modifiedBy: userId, last: true});
// 		// Meteor.call('addPostVersion', versionning);
// 	});
// }

if(Meteor.isServer) {

	Posts.after.remove(function (userId, doc) { 
			
			// Delete the file if exists
			var fileId = doc.fileId;
			var fileExt = doc.fileExt;
			if (fileId) {
				Files.remove({fileId:fileId});
				Meteor.call('deleteFile',doc);
			}

			// Remove author count and decrease category count
			if (doc.type == 'liveFeed') {
			var author = Authors.findOne({spaceId: doc.spaceId, name: doc.author});
			Authors.update(author._id, {$inc: {nRefs: -1}}); // Decrement author nRefs

			if (doc.category) {
				var category = Categories.findOne({spaceId: doc.spaceId, type:"liveFeed", name: doc.category});
				if (category)
					Categories.update(category._id, {$inc: {nRefs: -1}}); // Decrement category nRefs
			}
		}
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