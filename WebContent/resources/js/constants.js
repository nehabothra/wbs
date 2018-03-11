/**
 * Constants to be used in the app
 */
app.constant("wbsConstants",{
	// Client ID and API key from the Developer Console
	G_CLIENT_ID : '733733269136-ppfb5v2b7lsg5hns8ig8et45bvrnm20t.apps.googleusercontent.com',
	G_API_KEY : 'AIzaSyDAjammMyvWlz4cGXsBVGIr1jPsAV9tkc8',
	G_DISCOVERY_DOCS : ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
	G_SCOPES : "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets",
	G_ACCESS_TOKEN_KEY : "access_token",
	G_API_TYPE : 'client:auth2',
	G_MAJOR_DIMENSION : 'ROWS',
	G_VALUE_RENDER_OPTION_READ : "FORMATTED_VALUE",
	G_VALUE_RENDER_OPTION_WRITE : "USER_ENTERED", 	
	G_READ_RANGE : "!A1:ZZ",
	G_START_RANGE : 'A1',
	COMMA_SEPERATOR : ",",
	BLANK : "",
	MAX_TASK_SUBLEVEL : 4,
	statusList : ["",
	              "Open",
	              "In Progress",
	              "Resolved",
	              "Authorized"	              
	              ]
});