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


// Upload files with tomitrescak:meteor-uploads

Meteor.startup(function () {

	UploadServer.init({
		tmpDir: Meteor.settings.uploadDir+'/tmp',
		uploadDir: Meteor.settings.uploadDir,
		checkCreateDirectories: true,
		getDirectory: function(fileInfo, formData) {

			var spaceId = formData.spaceId;
			fileInfo.spaceId = spaceId;

			var newID = new Mongo.ObjectID(); // Manually generate a new Mongo id
			var fileId = newID._str;
			fileInfo.fileId = fileId;

			if (formData.type == 'liveFeed') {
				console.log("Uploading a liveFeed file...");
				return '/'+spaceId+'/liveFeed/';
			}
			else if (formData.type == 'resource') {
				console.log("Uploading a resource...");
				return '/'+spaceId+'/resource/';
			}
			else if (formData.type == 'lesson') {
				console.log("Uploading lesson file...");
				return '/'+spaceId+'/lesson/'+fileId;
			}
			// TODO : add more security
			else if (formData.type == 'update') {
				console.log("Uploading update file");
				return '/updates';
			}
			return '/';
			
		},
		finished: function(fileInfo, formFields, formData) {

			var fileName = fileInfo.name.substr(0, fileInfo.name.lastIndexOf('.')) || fileInfo.name;
			fileInfo.fileName = fileName;
			//fileInfo.fileName = unescape(fileName); // Check why we unescape file name in getFileName method

			var fileExt = fileInfo.name.substr(fileInfo.name.lastIndexOf('.')+1).toLowerCase();
			fileInfo.fileExt = fileExt;

			if (formFields.type == 'liveFeed' || formFields.type == 'resource') {
				if (fileExt == "jpg" || fileExt == "jpeg" || fileExt == "png") {
					// Resize and auto-orient uploaded images with GraphicMagicks
					gm(Meteor.settings.uploadDir+fileInfo.path).autoOrient().resize('1200','1200').write(Meteor.settings.uploadDir+fileInfo.path,Meteor.bindEnvironment(function (error, result) {
						if (error) {
							console.log("Error when resizing :"+error);
							var errorMessage = "An error has occured."
							Files.insert({_id: fileInfo.fileId, error:errorMessage});
						} else {
							Files.insert({_id: fileInfo.fileId, fileName:fileInfo.fileName, fileExt:fileExt, filePath: fileInfo.path});
						}
					}));
				}
				else {
					Files.insert({_id: fileInfo.fileId, fileName:fileInfo.fileName, fileExt:fileExt, filePath: fileInfo.path});
				}
			}
			else if (formFields.type == 'lesson') {
				cmd = Meteor.wrapAsync(exec);
				res = cmd("unzip '"+Meteor.settings.uploadDir+fileInfo.path+"' -d '"+Meteor.settings.uploadDir+"/"+fileInfo.spaceId+"/lesson/"+fileInfo.fileId+"'", {maxBuffer : 1024 * 1024 * 64}, function(error,result){
					if (error) {
						console.log("Error when uploading a lesson : "+error);
						var errorMessage = "An error has occured."
						Files.insert({_id: fileInfo.fileId, error:errorMessage});
					} else {				
						Files.insert({_id: fileInfo.fileId, fileName:fileInfo.fileName, fileExt:fileExt, filePath: fileInfo.path})
					}
				});
				res2 = cmd("rm '"+Meteor.settings.uploadDir+fileInfo.path+"'");
			}
			else if (formFields.type == 'update') {
				cmd = Meteor.wrapAsync(exec);	
				res = cmd("tar zxvf '"+Meteor.settings.uploadDir+fileInfo.path+"' -C "+Meteor.settings.updateDir, {maxBuffer : 1024 * 1024 * 64}, function(error,result){
					if (error) {
						console.log("Error when uploading an update : "+error);
						var errorMessage = "An error has occured."
						Files.insert({_id: fileInfo.fileId, error:errorMessage});
					} else {				
						Files.insert({_id: fileInfo.fileId, fileName:fileInfo.fileName, fileExt:fileExt, filePath: fileInfo.path})
					}
				});
				res2 = cmd("rm '"+Meteor.settings.uploadDir+fileInfo.path+"'", {maxBuffer : 1024 * 1024 * 64},);
			}
		},
		getFileName: function(fileInfo, formFields, formData) { 

			var fileName = fileInfo.name;	

			//fileName = escape(fileName);
			// The file name is used to generate the file path, so we escape unicode characters
			// and then we unescape it in finished method to save it in human-readable text

			return fileName;
			// var fileExt = fileInfo.name.substr(fileInfo.name.lastIndexOf('.')+1).toLowerCase();

			// // If file is an image, set a random name
			// if (fileExt == "jpg" || fileExt == "jpeg" || fileExt == "png") {
			// 	var newName = Random.id() + '.' + fileExt;
			// 	return newName;
			// }
			// else {
			// 	var fileName = fileInfo.name;	

			// 	fileName = encodeURIComponent(fileName);

			// 	return fileName;
			// }
		},
		cacheTime: 0,
  	});
});