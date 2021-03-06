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


// ###### General router configuration ######

Router.configure({
	loadingTemplate: 'loading',
	notFoundTemplate: 'notFound',
	trackPageView: true
});


Router.configureBodyParsers = function() {
	Router.onBeforeAction(Iron.Router.bodyParser.urlencoded({
		extended: true,
		limit: '50mb'
	}));
};


// Auto-close slide menu on route stop (when navigating to a new route)
Router.onStop(function () {
	if (typeof slideout != 'undefined')
		slideout.close();
});


// ###### Router security hooks ######

var requireLogin = function() {
		if (! Meteor.user()) {
				if (Meteor.loggingIn()) {
						this.render(this.loadingTemplate);
				} else {
						this.render('accessDenied');
				}
		} else {
				this.next();
		}
}

var requireAdmin = function() {
		if (! Roles.userIsInRole(Meteor.user(), 'admin')) {
				if (Meteor.loggingIn()) {
						this.render(this.loadingTemplate);
				} else {
					this.render('spacesHeader', {to: 'layout--header'});
					this.render('accessDenied');
				}
		} else {
				this.next();
		}
}

Router.onBeforeAction(requireLogin, {only: 'settings'});

var pathsRequireAdmin;
if (Meteor.settings.public.isBox === "true")
	pathsRequireAdmin = ['admin','register','update'];
else
	pathsRequireAdmin = ['admin','update'];

Router.onBeforeAction(requireAdmin, {only: pathsRequireAdmin});


// ###### Routes without controller ######

Router.route('/not-found', {
	name: 'notFound',
	fastRender: true
});

Router.route('/privacy', {
	name: 'privacy',
	fastRender: true
});

Router.route('/login', {
	name: 'login',
	fastRender: true
});

Router.route('/register', {
	name: 'register',
	fastRender: true
});

Router.route('/update', {
	name: 'update',
	fastRender: true
});


// ###### Routes with controller ######

Router.route('/user', {
	name: 'userSettings',
	controller: 'UserSettingsController',
	fastRender: true
});

Router.route('/admin', {
	name: 'admin', 
	controller: 'AdminController' 
});

Router.route('/', {
	name: 'indexStudent',
	controller: 'IndexStudentController'
});

Router.route('/teacher', {
	name: 'indexTeacher',
	controller: 'IndexTeacherController'
});

Router.route('/lesson/:_id', {
	name: 'lessonsFrame',
	controller: 'LessonsFrameController'
});

Router.route('/space/:_id', {
	name: 'space',
	controller: 'SpaceController'
});

Router.route('/space/:_id/settings', {
	name: 'settings',
	controller: 'SettingsController'
});

Router.route('/space/:_id/users', {
	name: 'spaceUsers',
	controller: 'SpaceUsersController'
});

Router.route('/space/:_id/first-connection', {
	name: 'spaceUsersFirstConnection',
	controller: 'SpaceFirstConnectionController'
});

Router.route('/reset-password/:token', {
	name: 'resetPassword',
	controller: 'ResetPasswordController'
});