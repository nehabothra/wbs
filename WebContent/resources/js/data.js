/**
 *  service that stores and syncs the data used within the application.
 *  If any data is present in the browser's local storage then it is loaded during app init.
 */
app.factory("Data",function(wbsConstants){
	
	var data = {
			resources : [],
          
		   resourceAllocation : [	
 		                         	{
			id : 1,
			taskDescription : "",
			name : "",
			effort : 0,
			startDate : "",
			endDate : "",
			parentTask : -1,
			level : 0,
			isParent : false,
			totalSubtasks : 0,
			prcntComplete : "",
			status : "",
			jiraid : "",
			comment : ""
		}
		  ],
		  
		  gsheetNameResource : wbsConstants.BLANK,
		  gsheetidResource : wbsConstants.BLANK,
		  gsheetNameTask : wbsConstants.BLANK,
		  gsheetidTask : wbsConstants.BLANK
	};
	
	return {
		
		init : function(){
			
			//initialization
			if(typeof(Storage) !== "undefined"){
				
				//init for resources
				var rlist = angular.fromJson(localStorage.getItem("resources"));
				if(rlist !== null){
					for(var i=0; i< rlist.length; i++){
						rlist[i].jd = new Date(rlist[i].jd);
						rlist[i].nextAvailableOn = new Date(rlist[i].nextAvailableOn);
						var hlList = [];
						for(var j=0; j< rlist[i].holidayList.length; j++){
							hlList[j] = new Date(rlist[i].holidayList[j]);
						}
						rlist[i].holidayList = hlList;
					}
					data.resources = rlist;
				}				
				
				//init for tasks
				var list = angular.fromJson(localStorage.getItem("resourceAllocation"));
				if(list !== null){
					for(var i=0;i< list.length; i++){
						list[i].startDate = new Date(list[i].startDate);
						list[i].endDate = new Date(list[i].endDate);
					}
					data.resourceAllocation = list;
				}
				
				data.gsheetNameResource = localStorage.getItem("gsheetNameResource") != null ? localStorage.getItem("gsheetNameResource") : wbsConstants.BLANK;
				data.gsheetNameTask =  localStorage.getItem("gsheetNameTask") != null ? localStorage.getItem("gsheetNameTask") : wbsConstants.BLANK;
				data.gsheetidTask = localStorage.getItem("gsheetidTask") != null ? localStorage.getItem("gsheetidTask") : wbsConstants.BLANK;
				data.gsheetidResource = localStorage.getItem("gsheetidResource") != null ? localStorage.getItem("gsheetidResource") : wbsConstants.BLANK;
				
			}else{
				console.log("local storage not supported");
			}			
			
		},
		
		/*
		saveToLocalStorage : function(){
			
			if(typeof(Storage) !== "undefined"){
				
			//cache details
			localStorage.setItem("resourceAllocation",angular.toJson(data.resourceAllocation));
			localStorage.setItem("resources",angular.toJson(data.resources));
			
			}else{
				console.log("local storage not supported");
			}
			
		},*/
		
		getResources : function(){
			return data.resources;
		},
		
		setResources : function(updatedResources){
			data.resources   = updatedResources;
		},
		
		getResourceAllocation : function(){
			return data.resourceAllocation;
		},	
		
		setResourceAllocation : function(updatedResourceAllocation){
			data.resourceAllocation = updatedResourceAllocation;
		},
		
		resetTasks : function(){
			   data.resourceAllocation = []; 
		},
		
		resetResources : function(){
			data.resources = [];
		},
		
		getGsheetIdResource : function(){
			return data.gsheetidResource; 
		},

		setGsheetIdResource : function(sheetid){
			data.gsheetidResource = sheetid; 
		},		

		getGsheetIdTask : function(){
			return data.gsheetidTask; 
		},

		setGsheetIdTask : function(sheetid){
			data.gsheetidTask = sheetid; 
		},			
		
		getGsheetNameResource : function(){
			return data.gsheetNameResource; 
		},
		
		setGsheetNameResource : function(sheetname){
			data.gsheetNameResource  = sheetname; 
		},
		
		getGsheetNameTask : function(){
			return data.gsheetNameTask;
		},
		
		setGsheetNameTask : function(sheetname){
			data.gsheetNameTask = sheetname; 
			}		
	};
});