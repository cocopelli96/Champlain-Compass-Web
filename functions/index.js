//	Copyright 2018 Travis Spinelli
//
//	Licensed under the Apache License, Version 2.0 (the "License");
//	you may not use this file except in compliance with the License.  
//	You may obtain a copy of the License at
// 
//	http://www.apache.org/licenses/LICENSE-2.0
//
//	Unless required by applicable law or agreed to in writing, software
//	distributed under the License is distributed on an "AS IS" BASIS,
//	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//	See the License for the specific language governing permissions and
//	limitations under the License.

//Include modules for use in the file
const express = require('express');
const session = require('express-session');
const fileUpload =  require("express-fileupload");
const firebaseStore = require('connect-session-firebase')(session);
const app = express();
const errorhandler = require('errorhandler');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const admin = require("firebase-admin");
const engines = require("consolidate");
const functions = require("firebase-functions");
const firebase = require("firebase");
const cookieParser = require("cookie-parser");
const path = require("path");
const url = require("url");
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

//prepare the app
app.use(express.static('public'));
app.use(fileUpload());
app.use(cookieParser());
app.use(morgan('dev'));
app.engine('hbs', engines.handlebars);
app.set('views', './views');
app.set('view engine', 'hbs');

//grab path to service account file
var serviceAccount = require("./service_accounts/ChamplainCompass-55e6e3c60769.json");

//start the firebase app
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://champlain-compass.firebaseio.com",
  storageBucket: "gs://champlain-compass.appspot.com"
});

//set sesssion for web app
app.use(session({
	secret: "ReH7ijy27VWtgdk1289BHJE",
	resave: true,
	saveUninitialized: false,
	store: new firebaseStore({
		database: admin.database()
	}),
	cookie: {
		maxAge: 6 * 60 * 60 * 1000,
		secure: false,
		path: "/"
	}
}));

/******************************
Prepare Firebase references for use
******************************/
var db = admin.database();
var storageRef = admin.storage().bucket();

//does file exist
function fileDoesExist(fileName) {
	const file = storageRef.child(fileName);
	if (file.name) {
		return true;
	} else {
		return false;
	}
}

//upload file
function uploadFile(file, options) {
	return storageRef.upload(file, options);
}

//get the list of files in a single folder
function getFiles(path) {
	if (path) {
		return storageRef.getFiles({ delimiter: "/", prefix: path});
	} else {
		return storageRef.getFiles({ delimiter: "/" });
	}
}

//get the list of all files
function getAllFiles() {
	return storageRef.getFiles();
}

//get the admin login information
function getAdmin() {
	const adminRef = db.ref("admin");
	return adminRef.once('value').then(snap => snap.val());
}

//get list of buildings
function getBuildings() {
	const buildingsRef = db.ref("Building");
	return buildingsRef.once('value').then(snap => snap.val());
}

//get a building by Id
function getBuilding(buildingId) {
	const buildingsRef = db.ref("Building");
	return buildingsRef.child(buildingId).once('value').then(snap => snap.val());
}

//get number of buidlings in database
function getBuildingsCount() {
	const countRef = db.ref("Counter");
	return countRef.child("Buildings").once('value').then(snap => snap.val());
}

//push new building to list
function pushBuilding(building) {
	const buildingsRef = db.ref("Building");
	return buildingsRef.push(building);
}

//update building
function updateBuilding(buildingId, building) {
	const buildingsRef = db.ref("Building");
	return buildingsRef.child(buildingId).update(building);
}

//delete building
function deleteBuilding(buildingId) {
	const buildingsRef = db.ref("Building");
	return buildingsRef.child(buildingId).set(null);
}

//get list of events
function getEvents() {
	const eventsRef = db.ref("Events");
	return eventsRef.once('value').then(snap => snap.val());
}

//get a event by Id
function getEvent(eventId) {
	const eventsRef = db.ref("Events");
	return eventsRef.child(eventId).once('value').then(snap => snap.val());
}

//get number of events in database
function getEventsCount() {
	const countRef = db.ref("Counter");
	return countRef.child("Events").once('value').then(snap => snap.val());
}

//push new event to list
function pushEvent(event) {
	const eventsRef = db.ref("Events");
	return eventsRef.push(event);
}

//update event
function updateEvent(eventId, event) {
	const eventsRef = db.ref("Events");
	return eventsRef.child(eventId).update(event);
}

//delete event
function deleteEvent(eventId) {
	const eventsRef = db.ref("Events");
	return eventsRef.child(eventId).set(null);
}

//get list of orientation themes
function getOrientationThemes() {
	const orientationRef = db.ref("Orientation");
	return orientationRef.once('value').then(snap => snap.val());
}

//get a orientation theme by Id
function getOrientationTheme(themeId) {
	const orientationRef = db.ref("Orientation");
	return orientationRef.child(themeId).once('value').then(snap => snap.val());
}

//get number of orientation themes in database
function getOrientationThemesCount() {
	const countRef = db.ref("Counter");
	return countRef.child("Themes").once('value').then(snap => snap.val());
}

//push new orientation theme to list
function pushOrientationTheme(theme) {
	const orientationRef = db.ref("Orientation");
	var themeId = theme.Semester.replace(" ", "").toUpperCase();
	return orientationRef.child(themeId).set(theme);
}

//update orientation theme
function updateOrientationTheme(themeId, theme) {
	const orientationRef = db.ref("Orientation");
	return orientationRef.child(themeId).update(theme);
}

//delete orientation theme
function deleteOrientationTheme(themeId) {
	const orientationRef = db.ref("Orientation");
	return orientationRef.child(themeId).set(null);
}

//get list of presenters
function getPresenters() {
	const presentersRef = db.ref("Presenters");
	return presentersRef.once('value').then(snap => snap.val());
}

//get a presenter by Id
function getPresenter(presenterId) {
	const presentersRef = db.ref("Presenters");
	return presentersRef.child(presenterId).once('value').then(snap => snap.val());
}

//get number of presenters in database
function getPresentersCount() {
	const countRef = db.ref("Counter");
	return countRef.child("Presenters").once('value').then(snap => snap.val());
}

//push new presenter to list
function pushPresenter(presenter) {
	const presentersRef = db.ref("Presenters");
	return presentersRef.push(presenter);
}

//update presenter
function updatePresenter(presenterId, presenter) {
	const presentersRef = db.ref("Presenters");
	return presentersRef.child(presenterId).update(presenter);
}

//delete presenter
function deletePresenter(presenterId) {
	const presentersRef = db.ref("Presenters");
	return presentersRef.child(presenterId).set(null);
}

//get list of questions
function getQuestions() {
	const faqRef = db.ref("Frequently_Asked_Questions");
	return faqRef.once('value').then(snap => snap.val());
}

//get a question by Id
function getQuestion(questionId) {
	const faqRef = db.ref("Frequently_Asked_Questions");
	return faqRef.child(questionId).once('value').then(snap => snap.val());
}

//get number of questions in database
function getQuestionsCount() {
	const countRef = db.ref("Counter");
	return countRef.child("Questions").once('value').then(snap => snap.val());
}

//push new question to list
function pushQuestion(question) {
	const faqRef = db.ref("Frequently_Asked_Questions");
	var questionId = getQuestionsCount();
	return faqRef.push(question);
}

//update question
function updateQuestion(questionId, question) {
	const faqRef = db.ref("Frequently_Asked_Questions");
	return faqRef.child(questionId).update(question);
}

//delete question
function deleteQuestion(questionId) {
	const faqRef = db.ref("Frequently_Asked_Questions");
	return faqRef.child(questionId).set(null);
}

//get list of resources
function getResources() {
	const resourcesRef = db.ref("Resources");
	return resourcesRef.once('value').then(snap => snap.val());
}

//get a resource by Id
function getResource(resourceId) {
	const resourcesRef = db.ref("Resources");
	return resourcesRef.child(resourceId).once('value').then(snap => snap.val());
}

//get number of resources in database
function getResourcesCount() {
	const countRef = db.ref("Counter");
	return countRef.child("Resources").once('value').then(snap => snap.val());
}

//push new resource to list
function pushResource(resource) {
	const resourcesRef = db.ref("Resources");
	return resourcesRef.push(resource);
}

//update resource
function updateResource(resourceId, resource) {
	const resourcesRef = db.ref("Resources");
	return resourcesRef.child(resourceId).update(resource);
}

//delete resource
function deleteResource(resourceId) {
	const resourcesRef = db.ref("Resources");
	return resourcesRef.child(resourceId).set(null);
}

//get list of sessions
function getSessions() {
	const sessionRef = db.ref("sessions");
	return sessionRef.once('value').then(snap => snap.val());
}

//delete session
function deleteSession(sessionId) {
	const sessionRef = db.ref("sessions");
	return sessionRef.child(sessionId).set(null);
}

/**************************************
Load and Export Trigger Functions
**************************************/

//const myFunctions = require('./functions.js');
//exports.newCurrentTheme = myFunctions.newCurrentTheme;
//exports.calendarEvent = myFunctions.calendarEvent;

/***************************************
Setup any needed middleware functions
***************************************/

//middleware function to check authentication of the user
const authenticate = (req, res, next) => {
	var sessionId = req.params.sessionId;

	getSessions().then(sessions => {
		if (sessions[sessionId]) {
			return next();
		}
		return res.redirect("/index.html");
	}).catch(error => {
		res.redirect("/index.html");
	});
}

/***************************************
Date adjustment functions
***************************************/

//function to place zero infront of a single digit number
function toDoubleDigit(number) {
	if (number < 10) {
		return "0" + number;
	}
	return String(number);
}

//function to convert date to string
function dateToString(date) {
	if (!date) {
		return null
	}

	var dateString = date.getFullYear() + "-";
	dateString += toDoubleDigit(date.getMonth() + 1) + "-";
	dateString += date.getDate() + " " + date.toLocaleTimeString('en-US', { timeZone: 'GMT' });
	return dateString;
}

//function to convert date string to date time local string
function toDateTimeLocalString(dateString) {
	if (!dateString) {
		return null
	}

	var date = new Date(Date.parse(dateString));
	var string = date.getFullYear() + "-";
	string += toDoubleDigit(date.getMonth() + 1) + "-";
	string += toDoubleDigit(date.getDate()) + "T";
	string += toDoubleDigit(date.getHours()) + ":";
	string += toDoubleDigit(date.getMinutes()) + ":";
	string += toDoubleDigit(date.getSeconds()) + ".";
	string += toDoubleDigit(date.getMilliseconds());
	return string;
}

/*****************************************
Set paths for the app
*****************************************/

//initial login path
app.post("/login", (req, res, next) => {
	var userName = req.body.userName;
	var pass = req.body.pass;

	getAdmin().then(adminData => {
		if (adminData[userName] === pass) {
			req.session.auth = true;
			res.redirect("/index/" + req.session.id);
		} else {
			res.redirect("/htm/login_fail.html");
		}
		return;
	}).catch(error => {
		res.redirect("/404.html");
	});
});

//logout of the web app
app.get("/logout/:sessionId", (req, res, next) => {
	var sessionId = req.params.sessionId;
	
	deleteSession(sessionId).then(session => {
		return res.redirect("/index.html");
	}).catch(error => {
		res.status(400).send("Failed to logout.");
	})
});

//after login redirect
app.get("/index/:sessionId", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;

	res.render("home", { sessionId: sessionId });
});

//building list path
app.get("/buildings/:sessionId", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;

	getBuildings().then(buildings => {
		return res.render('buildings/index', { buildings: buildings, sessionId: sessionId });
	}).catch(error => {
		res.status(400).send("Buildings not found." + error.message);
	});
});

//building get create path
app.get("/buildings/:sessionId/create", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;

	res.render('buildings/create', { sessionId: sessionId });
});

//building post create path
app.post("/buildings/:sessionId/create", authenticate, [
		body('name', 'Name is a required field.').isLength({ min: 1 }),
		body('address', 'Address is a required field.').isLength({ min: 1 }), 
		sanitizeBody('*').trim().escape()
	], (req, res, next) => {
		var sessionId = req.params.sessionId;

		const errors = validationResult(req);

		var building = {
			Name: req.body.name,
			Address: req.body.address,
			Is_Active: req.body.is_active === "on"
		}

		if (!errors.isEmpty()) {
			res.render('buildings/create', { sessionId: sessionId, building: building, errors: errors.mapped() });
		} else {
			pushBuilding(building).then(newBuilding => {
				if(newBuilding) {
					return res.redirect("/buildings/" + sessionId);
				} else {
					return res.status(400).send("Failed to add building.");
				}
			}).catch(error => {
				res.status(400).send("Failed to add building.");
			});
		}
});

//building get edit path
app.get("/buildings/:sessionId/edit/:buildingId", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;
	var buildingId = req.params.buildingId;

	getBuilding(buildingId).then(building => {
		return res.render('buildings/edit', { sessionId: sessionId, building: building, buildingId: buildingId });
	}).catch(error => {
		res.status(400).send("Building not found.");
	});
});

//building post edit path
app.post("/buildings/:sessionId/edit", authenticate, [
		body('name', 'Name is a required field.').isLength({ min: 1 }),
		body('address', 'Address is a required field.').isLength({ min: 1 }), 
		sanitizeBody('*').trim().escape()
	], (req, res, next) => {
		var sessionId = req.params.sessionId;
		var buildingId = req.body.buildingId;

		const errors = validationResult(req);

		var building = {
			Name: req.body.name,
			Address: req.body.address,
			Is_Active: req.body.is_active === "on"
		}

		if (!errors.isEmpty()) {
			res.render('buildings/edit', { sessionId: sessionId, building: building, buildingId: buildingId, errors: errors.mapped() });
		} else {
			updateBuilding(buildingId, building).then(updatedBuilding => {
				return res.redirect("/buildings/" + sessionId);
			}).catch(error => {
				res.status(400).send("Failed to update building.");
			});
		}
});

//building delete path
app.post("/buildings/:sessionId/delete", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;
	var buildingId = req.body.buildingId;

	deleteBuilding(buildingId).then(building => {
		return res.redirect("/buildings/" + sessionId);
	}).catch(error => {
		res.status(400).send("Failed to delete building.");
	});
});

//events list path
app.get("/events/:sessionId", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;

	getEvents().then(events => {
		return res.render('events/index', { events: events, sessionId: sessionId });
	}).catch(error => {
		res.status(400).send("Events not found." + error.message);
	});
});

//event get create path
app.get("/events/:sessionId/create", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;

	getPresenters().then(presenters => {
		var presenterList = presenters.map(function(presenter) {
			return { text: presenter.Name, value: presenter.Name };
		});
		presenterList.splice(0, 0, { text: "Select Presenter", value: ""});
		presenterList.splice(1, 0, { text: "None", value: "None"});
		
		return res.render('events/create', { sessionId: sessionId, presenters: presenterList });
	}).catch(error => {
		res.status(400).send("Failed to grab presenters for events." + error.message);
	});
});

//event post create path
app.post("/events/:sessionId/create", authenticate, [
		body('name', 'Name is a required field.').isLength({ min: 1 }),
		body('description', 'Description is a required field.').isLength({ min: 1 }),
		body('presenter', 'Presenter is a required field.').isLength({ min: 1 }),
		body('location', 'Location is a required field.').isLength({ min: 1 }), 
		body('start_time', 'Start Time is a required field.').isLength({ min: 1 }),
		body('end_time', 'End Time is a required field.').isLength({ min: 1 }),
		sanitizeBody('*').trim(),
		sanitizeBody('start_time').toDate(),
		sanitizeBody('end_time').toDate()
	], (req, res, next) => {
		var sessionId = req.params.sessionId;

		const errors = validationResult(req);

		var groups = [];
		var checkedGroups = {
			family: false,
			residential: false,
			commuter: false
		}
		if (req.body.groups_family === "on") {
			groups.push("Family & Friends");
			checkedGroups.family = true;
		}
		if (req.body.groups_res_students === "on") {
			groups.push("Residential Students");
			checkedGroups.residential = true;
		}
		if (req.body.groups_com_students === "on") {
			groups.push("Commuter Students");
			checkedGroups.commuter = true;
		}

		var event = {
			Name: req.body.name,
			Description: req.body.description,
			Presenter: req.body.presenter,
			Location: req.body.location,
			Groups: groups,
			CheckedGroups: checkedGroups,
			Start_Time: dateToString(req.body.start_time),
			End_Time: dateToString(req.body.end_time)
		}

		if (!errors.isEmpty()) {
			event.Start_Time = toDateTimeLocalString(event.Start_Time);
			event.End_Time = toDateTimeLocalString(event.End_Time);

			getPresenters().then(presenters => {
				var presenterList = presenters.map(function(presenter) {
					return { text: presenter.Name, value: presenter.Name };
				});
				presenterList.splice(0, 0, { text: "Select Presenter", value: ""});
				presenterList.splice(1, 0, { text: "None", value: "None"});
				
				return res.render('events/create', { sessionId: sessionId, event: event, errors: errors.mapped(), presenters: presenterList });
			}).catch(error => {
				res.status(400).send("Failed to grab presenters for events." + error.message);
			});
		} else {
			pushEvent(event).then(newEvent => {
				if(newEvent) {
					return res.redirect("/events/" + sessionId);
				} else {
					return res.status(400).send("Failed to add event.");
				}
			}).catch(error => {
				res.status(400).send("Failed to add event.");
			});
		}
});

//event get edit path
app.get("/events/:sessionId/edit/:eventId", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;
	var eventId = req.params.eventId;

	getEvent(eventId).then(event => {
		var checkedGroups = {
			family: false,
			residential: false,
			commuter: false
		}
		if (event.Groups.indexOf("Family & Friends") !== -1) {
			checkedGroups.family = true;
		}
		if (event.Groups.indexOf("Residential Students") !== -1) {
			checkedGroups.residential = true;
		}
		if (event.Groups.indexOf("Commuter Students") !== -1) {
			checkedGroups.commuter = true;
		}
		event.CheckedGroups = checkedGroups;

		event.Start_Time = toDateTimeLocalString(event.Start_Time);
		event.End_Time = toDateTimeLocalString(event.End_Time);

		return getPresenters().then(presenters => {
			var presenterList = presenters.map(function(presenter) {
				return { text: presenter.Name, value: presenter.Name };
			});
			presenterList.splice(0, 0, { text: "Select Presenter", value: ""});
			presenterList.splice(1, 0, { text: "None", value: "None"});
			
			return res.render('events/edit', { sessionId: sessionId, event: event, eventId: eventId, presenters: presenterList });
		}).catch(error => {
			res.status(400).send("Failed to grab presenters for events." + error.message);
		});
	}).catch(error => {
		res.status(400).send("Event not found.");
	});
});

//event post edit path
app.post("/events/:sessionId/edit", authenticate, [
		body('name', 'Name is a required field.').isLength({ min: 1 }),
		body('description', 'Description is a required field.').isLength({ min: 1 }),
		body('presenter', 'Presenter is a required field.').isLength({ min: 1 }),
		body('location', 'Location is a required field.').isLength({ min: 1 }), 
		body('start_time', 'Start Time is a required field.').isLength({ min: 1 }),
		body('end_time', 'End Time is a required field.').isLength({ min: 1 }),
		sanitizeBody('*').trim(),
		sanitizeBody('start_time').toDate(),
		sanitizeBody('end_time').toDate()
	], (req, res, next) => {
		var sessionId = req.params.sessionId;
		var eventId = req.body.eventId;

		const errors = validationResult(req);

		var groups = [];
		var checkedGroups = {
			family: false,
			residential: false,
			commuter: false
		}
		if (req.body.groups_family === "on") {
			groups.push("Family & Friends");
			checkedGroups.family = true;
		}
		if (req.body.groups_res_students === "on") {
			groups.push("Residential Students");
			checkedGroups.residential = true;
		}
		if (req.body.groups_com_students === "on") {
			groups.push("Commuter Students");
			checkedGroups.commuter = true;
		}

		var event = {
			Name: req.body.name,
			Description: req.body.description,
			Presenter: req.body.presenter,
			Location: req.body.location,
			Groups: groups,
			CheckedGroups: checkedGroups,
			Start_Time: dateToString(req.body.start_time),
			End_Time: dateToString(req.body.end_time)
		}

		if (!errors.isEmpty()) {
			event.Start_Time = toDateTimeLocalString(event.Start_Time);
			event.End_Time = toDateTimeLocalString(event.End_Time);
			
			getPresenters().then(presenters => {
				var presenterList = presenters.map(function(presenter) {
					return { text: presenter.Name, value: presenter.Name };
				});
				presenterList.splice(0, 0, { text: "Select Presenter", value: ""});
				presenterList.splice(1, 0, { text: "None", value: "None"});
				
				return res.render('events/edit', { sessionId: sessionId, event: event, eventId: eventId, errors: errors.mapped(), presenters: presenterList });
			}).catch(error => {
				res.status(400).send("Failed to grab presenters for events." + error.message);
			});
		} else {
			updateEvent(eventId, event).then(updatedEvent => {
				return res.redirect("/events/" + sessionId);
			}).catch(error => {
				res.status(400).send("Failed to update event.");
			});
		}
});

//event delete path
app.post("/events/:sessionId/delete", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;
	var eventId = req.body.eventId;

	deleteEvent(eventId).then(event => {
		return res.redirect("/events/" + sessionId);
	}).catch(error => {
		res.status(400).send("Failed to delete event.");
	});
});

//questions list path
app.get("/faqs/:sessionId", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;

	getQuestions().then(questions => {
		return res.render('faqs/index', { questions: questions, sessionId: sessionId });
	}).catch(error => {
		res.status(400).send("Questions not found." + error.message);
	});
});

//questions get create path
app.get("/faqs/:sessionId/create", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;

	res.render('faqs/create', { sessionId: sessionId });
});

//questions post create path
app.post("/faqs/:sessionId/create", authenticate, [ 
		body('question', 'Question is a required field.').isLength({ min: 1 }),
		body('answer', 'Answer is a required field.').isLength({ min: 1 }), 
		sanitizeBody('*').trim().escape()
	], (req, res, next) => {
		var sessionId = req.params.sessionId;

		const errors = validationResult(req);

		var question = {
			Question: req.body.question,
			Answer: req.body.answer,
			Is_Active: req.body.is_active === "on"
		}

		if (!errors.isEmpty()) {
			res.render('faqs/create', { sessionId: sessionId, question: question, errors: errors.mapped() });
		} else {
			pushQuestion(question).then(newQuestion => {
				if(newQuestion) {
					return res.redirect("/faqs/" + sessionId);
				} else {
					return res.status(400).send("Failed to add question.");
				}
			}).catch(error => {
				res.status(400).send("Failed to add question.");
			});
		}
});

//questions get edit path
app.get("/faqs/:sessionId/edit/:questionId", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;
	var questionId = req.params.questionId;

	getQuestion(questionId).then(question => {
		return res.render('faqs/edit', { sessionId: sessionId, question: question, questionId: questionId });
	}).catch(error => {
		res.status(400).send("Question not found.");
	});
});

//question post edit path
app.post("/faqs/:sessionId/edit", authenticate, [ 
		body('question', 'Question is a required field.').isLength({ min: 1 }),
		body('answer', 'Answer is a required field.').isLength({ min: 1 }), 
		sanitizeBody('*').trim().escape()
	], (req, res, next) => {
		var sessionId = req.params.sessionId;
		var questionId = req.body.questionId;

		const errors = validationResult(req);

		var question = {
			Question: req.body.question,
			Answer: req.body.answer,
			Is_Active: req.body.is_active === "on"
		}

		if (!errors.isEmpty()) {
			res.render('faqs/edit', { sessionId: sessionId, question: question, questionId: questionId, errors: errors.mapped() });
		} else {
			updateQuestion(questionId, question).then(updatedQuestion => {
				return res.redirect("/faqs/" + sessionId);
			}).catch(error => {
				res.status(400).send("Failed to update question.");
			});
		}
});

//question delete path
app.post("/faqs/:sessionId/delete", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;
	var questionId = req.body.questionId;

	deleteQuestion(questionId).then(question => {
		return res.redirect("/faqs/" + sessionId);
	}).catch(error => {
		res.status(400).send("Failed to delete question.");
	});
});

//file list path
app.get("/files/:sessionId", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;

	return res.redirect('/files/' + sessionId + '/logos');
});

//file list path
app.get("/files/:sessionId/logos", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;

	getFiles().then(files => {
		return res.render('files/index', { files: files[0], sessionId: sessionId, title: 'Logo Files' });
	}).catch(error => {
		res.status(400).send("Files not found." + error.message);
	});
});

//file list path
app.get("/files/:sessionId/resources", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;

	getFiles('Resources/').then(files => {
		var fileList = Array();
		files[0].forEach(file => {
			if (file.name !== "Resources/") {
				fileList.push(file);
			}
		});
		return res.render('files/index', { files: fileList, sessionId: sessionId, title: 'Resource Files', path: 'Resources/' });
	}).catch(error => {
		res.status(400).send("Files not found." + error.message);
	});
});

app.post("/files/:sessionId/create", authenticate, [
		body('file_name', 'File Name is a required field.').isLength({ min: 1 }),
		sanitizeBody('*').trim().escape()
	], (req, res, next) => {
		var sessionId = req.params.sessionId;

		var file = req.files.file;
		var path = "/tmp/" + req.body.file_name;

		file.mv(path, (err) => {
			if (err) {
				return res.status(500).send("Failed to upload file. Error: " + err);
			}

			uploadFile(path).then(() => {
				return res.redirect("/files/" + sessionId);
			}).catch(error => {
				console.log("error: " + error.message);
				res.status(400).send("Failed to add resource.");
			});
			
		});
});

app.post("/files/:sessionId/resources/create", authenticate, [
		body('file_name', 'File Name is a required field.').isLength({ min: 1 }),
		sanitizeBody('*').trim().escape()
	], (req, res, next) => {
		var sessionId = req.params.sessionId;

		var file = req.files.file;
		var path = "/tmp/" + req.body.file_name;
		var destination = "Resources/" + req.body.file_name;

		file.mv(path, (err) => {
			if (err) {
				return res.status(500).send("Failed to upload file. Error: " + err);
			}
console.log(destination);
			uploadFile(path, { destination: destination }).then(() => {
				return res.redirect("/files/" + sessionId + "/resources");
			}).catch(error => {
				console.log("error: " + error.message);
				res.status(400).send("Failed to add resource.");
			});
			
		});
});

//file delete path
app.post("/files/:sessionId/delete", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;
	var fileId = req.body.fileId;
	var path = req.body.path;
	path = path.substring(0, path.length -1);

	getAllFiles().then(files => {
		files[0].forEach(file => {
			if (file.id === fileId) {
				return file.delete().then(file => {
					return res.redirect('/files/' + sessionId + "/" + path);
				}).catch(error => {
					res.status(400).send("Failed to delete file.");
				});
			}
		});
		return;
	}).catch(error => {
		res.status(400).send("Failed to delete file.");
	});
});

//presenters list path
app.get("/presenters/:sessionId", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;

	getPresenters().then(presenters => {
		return res.render('presenters/index', { presenters: presenters, sessionId: sessionId });
	}).catch(error => {
		res.status(400).send("Presenters not found." + error.message);
	});
});

//presenter get create path
app.get("/presenters/:sessionId/create", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;

	res.render('presenters/create', { sessionId: sessionId });
});

//presenter post create path
app.post("/presenters/:sessionId/create", authenticate, [
		body('name', 'Name is a required field.').isLength({ min: 1 }),
		body('job_title', 'Job Title is a required field.').isLength({ min: 1 }),
		body('bio', 'Bio is a required field.').isLength({ min: 1 }),
		sanitizeBody('*').trim().escape()
	], (req, res, next) => {
		var sessionId = req.params.sessionId;

		const errors = validationResult(req);

		var presenter = {
			Name: req.body.name,
			Job_Title: req.body.job_title,
			Bio: req.body.bio
		}

		if (!errors.isEmpty()) {
			res.render('presenters/create', { sessionId: sessionId, presenter: presenter, errors: errors.mapped() });
		} else {
			pushPresenter(presenter).then(newPresenter => {
				if(newPresenter) {
					return res.redirect("/presenters/" + sessionId);
				} else {
					return res.status(400).send("Failed to add presenter.");
				}
			}).catch(error => {
				res.status(400).send("Failed to add presenter.");
			});
		}
});

//presenter get edit path
app.get("/presenters/:sessionId/edit/:presenterId", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;
	var presenterId = req.params.presenterId;

	getPresenter(presenterId).then(presenter => {
		return res.render('presenters/edit', { sessionId: sessionId, presenter: presenter, presenterId: presenterId });
	}).catch(error => {
		res.status(400).send("Presenter not found.");
	});
});

//presenter post edit path
app.post("/presenters/:sessionId/edit", authenticate, [
		body('name', 'Name is a required field.').isLength({ min: 1 }),
		body('job_title', 'Job Title is a required field.').isLength({ min: 1 }),
		body('bio', 'Bio is a required field.').isLength({ min: 1 }),
		sanitizeBody('*').trim().escape()
	], (req, res, next) => {
		var sessionId = req.params.sessionId;
		var presenterId = req.body.presenterId;

		const errors = validationResult(req);

		var presenter = {
			Name: req.body.name,
			Job_Title: req.body.job_title,
			Bio: req.body.bio
		}

		if (!errors.isEmpty()) {
			res.render('presenters/edit', { sessionId: sessionId, presenter: presenter, presenterId: presenterId, errors: errors.mapped() });
		} else {
			updatePresenter(presenterId, presenter).then(updatedPresenter => {
				return res.redirect("/presenters/" + sessionId);
			}).catch(error => {
				res.status(400).send("Failed to update presenter.");
			});
		}
});

//presenter delete path
app.post("/presenters/:sessionId/delete", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;
	var presenterId = req.body.presenterId;

	deletePresenter(presenterId).then(resource => {
		return res.redirect("/presenters/" + sessionId);
	}).catch(error => {
		res.status(400).send("Failed to delete presenter.");
	});
});

//resources list path
app.get("/resources/:sessionId", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;

	getResources().then(resources => {
		return res.render('resources/index', { resources: resources, sessionId: sessionId });
	}).catch(error => {
		res.status(400).send("Resources not found." + error.message);
	});
});

//resource get create path
app.get("/resources/:sessionId/create", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;

	res.render('resources/create', { sessionId: sessionId });
});

//resource post create path
app.post("/resources/:sessionId/create", authenticate, [
		body('name', 'Name is a required field.').isLength({ min: 1 }),
		body('description', 'Description is a required field.').isLength({ min: 1 }),
		body('file_name', 'File Name is a required field.').isLength({ min: 1 }),
		body('file_type', 'File Type is a required field.').isLength({ min: 1 }),
		sanitizeBody('*').trim().escape()
	], (req, res, next) => {
		var sessionId = req.params.sessionId;

		const errors = validationResult(req);

		var resource = {
			Name: req.body.name,
			Description: req.body.description,
			File_Name: req.body.file_name,
			File_Type: req.body.file_type,
			Is_Active: req.body.is_active === "on"
		}

		if (!errors.isEmpty()) {
			res.render('resources/create', { sessionId: sessionId, resource: resource, errors: errors.mapped() });
		} else {
			pushResource(resource).then(newResource => {
				if(newResource) {
					return res.redirect("/resources/" + sessionId);
				} else {
					return res.status(400).send("Failed to add resource.");
				}
			}).catch(error => {
				res.status(400).send("Failed to add resource.");
			});
		}
});

//resource get edit path
app.get("/resources/:sessionId/edit/:resourceId", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;
	var resourceId = req.params.resourceId;

	getResource(resourceId).then(resource => {
		return res.render('resources/edit', { sessionId: sessionId, resource: resource, resourceId: resourceId });
	}).catch(error => {
		res.status(400).send("Resource not found.");
	});
});

//resource post edit path
app.post("/resources/:sessionId/edit", authenticate, [
		body('name', 'Name is a required field.').isLength({ min: 1 }),
		body('description', 'Description is a required field.').isLength({ min: 1 }),
		body('file_name', 'File Name is a required field.').isLength({ min: 1 }),
		body('file_type', 'File Type is a required field.').isLength({ min: 1 }),
		sanitizeBody('*').trim().escape()
	], (req, res, next) => {
		var sessionId = req.params.sessionId;
		var resourceId = req.body.resourceId;

		const errors = validationResult(req);

		var resource = {
			Name: req.body.name,
			Description: req.body.description,
			File_Name: req.body.file_name,
			File_Type: req.body.file_type,
			Is_Active: req.body.is_active === "on"
		}

		if (!errors.isEmpty()) {
			res.render('resources/edit', { sessionId: sessionId, resource: resource, resourceId: resourceId, errors: errors.mapped() });
		} else {
			updateResource(resourceId, resource).then(updatedResource => {
				return res.redirect("/resources/" + sessionId);
			}).catch(error => {
				res.status(400).send("Failed to update resource.");
			});
		}
});

//resource delete path
app.post("/resources/:sessionId/delete", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;
	var resourceId = req.body.resourceId;

	deleteResource(resourceId).then(resource => {
		return res.redirect("/resources/" + sessionId);
	}).catch(error => {
		res.status(400).send("Failed to delete resource.");
	});
});

//orientation themes list path
app.get("/themes/:sessionId", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;

	getOrientationThemes().then(themes => {
		return res.render('themes/index', { themes: themes, sessionId: sessionId });
	}).catch(error => {
		res.status(400).send("Orientation themes not found." + error.message);
	});
});

//theme get create path
app.get("/themes/:sessionId/create", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;

	res.render('themes/create', { sessionId: sessionId });
});

//theme post create path
app.post("/themes/:sessionId/create", authenticate, [
		body('theme_name', 'Theme Name is a required field.').isLength({ min: 1 }),
		body('description', 'Description is a required field.').isLength({ min: 1 }),
		body('semester', 'Semester is a required field.').isLength({ min: 1 }),
		body('logo_file_name', 'Logo File Name is a required field.').isLength({ min: 1 }),
		body('logo_description', 'Logo Description is a required field.').isLength({ min: 1 }),
		body('theme_colors_primary').isLength({ min: 1 }).withMessage('Primary Theme Color is a required field.').isHexColor().withMessage('Must be a hexadecimal color.'),
		body('theme_colors_secondary').isLength({ min: 1 }).withMessage('Secondary Theme Color is a required field.').isHexColor().withMessage('Must be a hexadecimal color.'),
		body('theme_colors_title').isLength({ min: 1 }).withMessage('Title Theme Color is a required field.').isHexColor().withMessage('Must be a hexadecimal color.'),
		body('theme_colors_text').isLength({ min: 1 }).withMessage('Text Theme Color is a required field.').isHexColor().withMessage('Must be a hexadecimal color.'),
		body('theme_colors_shadow').isLength({ min: 1 }).withMessage('Shadow Theme Color is a required field.').isHexColor().withMessage('Must be a hexadecimal color.'),
		body('theme_colors_text_secondary').isLength({ min: 1 }).withMessage('Secondary Text Theme Color is a required field.').isHexColor().withMessage('Must be a hexadecimal color.'),
		body('theme_colors_text_click').isLength({ min: 1 }).withMessage('Click Text Theme Color is a required field.').isHexColor().withMessage('Must be a hexadecimal color.'),
		sanitizeBody('*').trim().escape()
	], (req, res, next) => {
		var sessionId = req.params.sessionId;

		const errors = validationResult(req);

		var theme = {
			Theme_Name: req.body.theme_name,
			Description: req.body.description,
			Semester: req.body.semester,
			Logo: { 
				File_Name: req.body.logo_file_name,
				Description: req.body.logo_description
			},
			Theme_Colors: { 
				Primary: req.body.theme_colors_primary,
				Secondary: req.body.theme_colors_secondary,
				Title: req.body.theme_colors_title,
				Text: req.body.theme_colors_text,
				Text_Secondary: req.body.theme_colors_text_secondary,
				Shadow: req.body.theme_colors_shadow,
				Text_Click: req.body.theme_colors_text_click
			},
			Is_Current: req.body.is_current === "on"
		}

		if (!errors.isEmpty()) {
			res.render('themes/create', { sessionId: sessionId, theme: theme, errors: errors.mapped() });
		} else {
			pushOrientationTheme(theme).then(newTheme => {
				return res.redirect("/themes/" + sessionId);
			}).catch(error => {
				res.status(400).send("Failed to add theme.");
			});
		}
});

//theme get edit path
app.get("/themes/:sessionId/edit/:themeId", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;
	var themeId = req.params.themeId;

	getOrientationTheme(themeId).then(theme => {
		return res.render('themes/edit', { sessionId: sessionId, theme: theme, themeId: themeId });
	}).catch(error => {
		res.status(400).send("Theme not found.");
	});
});

//theme post edit path
app.post("/themes/:sessionId/edit", authenticate, [
		body('theme_name', 'Theme Name is a required field.').isLength({ min: 1 }),
		body('description', 'Description is a required field.').isLength({ min: 1 }),
		body('semester', 'Semester is a required field.').isLength({ min: 1 }),
		body('logo_file_name', 'Logo File Name is a required field.').isLength({ min: 1 }),
		body('logo_description', 'Logo Description is a required field.').isLength({ min: 1 }),
		body('theme_colors_primary').isLength({ min: 1 }).withMessage('Primary Theme Color is a required field.').isHexColor().withMessage('Must be a hexadecimal color.'),
		body('theme_colors_secondary').isLength({ min: 1 }).withMessage('Secondary Theme Color is a required field.').isHexColor().withMessage('Must be a hexadecimal color.'),
		body('theme_colors_title').isLength({ min: 1 }).withMessage('Title Theme Color is a required field.').isHexColor().withMessage('Must be a hexadecimal color.'),
		body('theme_colors_text').isLength({ min: 1 }).withMessage('Text Theme Color is a required field.').isHexColor().withMessage('Must be a hexadecimal color.'),
		body('theme_colors_shadow').isLength({ min: 1 }).withMessage('Shadow Theme Color is a required field.').isHexColor().withMessage('Must be a hexadecimal color.'),
		body('theme_colors_text_secondary').isLength({ min: 1 }).withMessage('Secondary Text Theme Color is a required field.').isHexColor().withMessage('Must be a hexadecimal color.'),
		body('theme_colors_text_click').isLength({ min: 1 }).withMessage('Click Text Theme Color is a required field.').isHexColor().withMessage('Must be a hexadecimal color.'),
		sanitizeBody('*').trim().escape()
	], (req, res, next) => {
		var sessionId = req.params.sessionId;
		var themeId = req.body.themeId;

		const errors = validationResult(req);

		var theme = {
			Theme_Name: req.body.theme_name,
			Description: req.body.description,
			Semester: req.body.semester,
			Logo: { 
				File_Name: req.body.logo_file_name,
				Description: req.body.logo_description
			},
			Theme_Colors: { 
				Primary: req.body.theme_colors_primary,
				Secondary: req.body.theme_colors_secondary,
				Title: req.body.theme_colors_title,
				Text: req.body.theme_colors_text,
				Text_Secondary: req.body.theme_colors_text_secondary,
				Shadow: req.body.theme_colors_shadow,
				Text_Click: req.body.theme_colors_text_click
			},
			Is_Current: req.body.is_current === "on"
		}

		if (!errors.isEmpty()) {
			res.render('themes/edit', { sessionId: sessionId, theme: theme, themeId: themeId, errors: errors.mapped() });
		} else {
			updateOrientationTheme(themeId, theme).then(updatedTheme => {
				return res.redirect("/themes/" + sessionId);
			}).catch(error => {
				res.status(400).send("Failed to update theme.");
			});
		}
});

//theme delete path
app.post("/themes/:sessionId/delete", authenticate, (req, res, next) => {
	var sessionId = req.params.sessionId;
	var themeId = req.body.themeId;

	deleteOrientationTheme(themeId).then(theme => {
		return res.redirect("/themes/" + sessionId);
	}).catch(error => {
		res.status(400).send("Failed to delete theme.");
	});
});

//finish preparing the app
exports.app = functions.https.onRequest(app);



