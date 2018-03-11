/**
 * Google Login service. Whenever, the user wants to read/write to google spreadsheet, 
 * the service checks if the user is already logged-in. If yes, then his/her access token is fetched and used.
 * Else the user is prompted to login to his/her gAccount
 * 
 */
app.factory("gService", function(wbsConstants, modalService){
	
	var access_token = "";
	var gService = {};
		
    /**
     *  On load, called to load the auth2 library and API client library.
     *  operation : read/write 
     *  
     */
	gService.handleClientLoad = function(callback) {
		gapi.load(wbsConstants.G_API_TYPE,{
      		callback : function(){
      			gService.initClient(callback);
      		},
      		onerror : function(){
      			alert("Error inSignIn");
      		},
      		timeout : 5000,
      		ontimeout : function(){
      			alert("Timeout!!!");
      		}
      	} );
    };
    
    /**
     *  Initializes the API client library and sets up sign-in state
     *  listeners.
     */
    gService.initClient = function(callback) {
  	  
    
  	  gapi.client.init({
          apiKey: wbsConstants.G_API_KEY,
          clientId: wbsConstants.G_CLIENT_ID,
          discoveryDocs: wbsConstants.G_DISCOVERY_DOCS,
          scope: wbsConstants.G_SCOPES  
      }).then(function () {
      	var isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
      	if(!isSignedIn){
      		gapi.auth2.getAuthInstance().signIn().then(function(){
      			access_token = gapi.client.getToken()[wbsConstants.G_ACCESS_TOKEN_KEY];
      			callback(access_token);
      		},
            function(){
      			modalService
				.callModal(
						"Popups are blocked !!!\n Unable to SignIn to your Google Account.",
						null,
						null,
						{
							ok : true,
							cancel : false,
							yes : false,
							no : false
						});
            });
      	}else{
      		access_token = gapi.client.getToken()[wbsConstants.G_ACCESS_TOKEN_KEY];
      		callback(access_token);
      	}
      });
    };
     
    gService.getAccessToken = function(){
    	return access_token;
    };
    
    return gService;
	
});