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

//reuqire needed module files
const functions = require("firebase-functions");
const firebaseAdmin = require("firebase-admin");
const firebase = require("firebase");

const calendarAPI = require("./calendar.js");

//startup firebase connection
firebaseAdmin.initializeApp(functions.config().firebase, "Champlain Compass Functions");

/**********************************************
Other exported functions for interface
**********************************************/

exports.newCurrentTheme = functions.database.ref('/Orientation/{pushId}').onWrite(event => {
	const theme = event.data.val();
	console.log(theme);

	if (theme.Is_Current) {
		return getOrientationThemes().then(themes => {
			for (key in themes.keys) {
				if (themes[key].Is_Current && themes[key].Semester !== theme.Semester) {
					var updatedTheme = themes[key];
					updatedTheme.Is_Current = false;
					return updateOrientationTheme(key, updatedTheme);
				}
			}
			return;
		});
	}
});

exports.calendarEvent = functions.database.ref('/Events/{pushId}').onWrite(event => {
	const eventData = event.data.val();
	console.log(event);

	var calendarEvent = {
		'summary': eventData.Name,
		'description': eventData.Description,
		'location': eventData.Location,
		'start': {
			'dateTime': eventData.Start_Time,
			'timeZone': 'America/New_Tork'
		},
		'end': {
			'dateTime': eventData.End_Time,
			'timeZone': 'America/New_Tork'
		}
	}

	calendar.events.insert({
		auth: auth,
		calendarId: "nlr0rl2lqgkmjsjj69i5rbb5b8@group.calendar.google.com",
		resource: calendarEvent
	},
	function(err, event) {
	  if (err) {
	    console.log('There was an error contacting the Calendar service: ' + err);
	    return;
	  }
	  console.log('Event created: %s', event.htmlLink);
	});
});

