/*
 * Controller for the resource page
 * 
 */
app.controller("resourceController", function($scope, $filter, utility, Data, commonHelper, importFromExcel, $http, $timeout, gService, wbsConstants, modalService){
	
	//initialize with local cached data if available.
	Data.init();
	$scope.resources = Data.getResources();
	$scope.resourceAllocation = Data.getResourceAllocation();
	$scope.importedData = [];
	$scope.gsheetname = localStorage.getItem("gsheetname");
	$scope.gsheetid = localStorage.getItem("gsheetid");
	
	angular.element(document.querySelector("#task")).removeClass("active");
	angular.element(document.querySelector("#resource")).addClass("active");

	/*
	 * Called when a new resource is added to the list
	 */
	$scope.addResourceToList = function(newName, newJd){
		//check if the input resource-name already exists in the list 
		if($filter("filter")($scope.resources, {name : newName}).length === 0){
			var nextAvailableOnDate = utility.isHoliday(newJd, []) ? utility.getWorkDays(newJd, 1, []) : newJd;
			var resource = {
				name : newName,
				jd : newJd,
				holidayList : [],
				tmpFrom : wbsConstants.BLANK,
				tmpTo : wbsConstants.BLANK,
				nextAvailableOn : nextAvailableOnDate
			};
			
			$scope.resources.push(resource);
			$scope.newName=wbsConstants.BLANK;
			$scope.newJd=wbsConstants.BLANK;
			$scope.newHolidayList = [];
			
		}else{
				modalService.callModal("The Resource " + newName
						+ " already exists !", null, null, {
						//modal params : which buttons to display
						ok : true,
						cancel : false,
						yes : false,
						no : false
				});
		}
	};

	/*
	 * Called when a resource is removed from the list. 
	 */
	$scope.removeResourceFromList = function(index){
		

			modalService
			.callModal(
					"Are you sure you want to remove resource "
							+ $scope.resources[index].name + " ?",
					function() {
						/*
						 * Since the task is being removed,
						 * the related tasks will now have
						 * no start and end date till a new
						 * resource is assigned to those
						 * tasks.
						 */
						var assignedTasks = utility
								.getAllAssignedTasksAsc(
										$scope.resourceAllocation,
										$scope.resources[index].name,
										"id");
						angular
								.forEach(
										assignedTasks,
										function(obj, i) {

											assignedTasks[i].startDate = wbsConstants.BLANK;
											assignedTasks[i].endDate = wbsConstants.BLANK;

										});

						//remove resource from the list
						$scope.resources.splice(index, 1);

						modalService
						.callModal(
								"Please note start-end dates of the deleted resource has been reset.",
								null, null, {
									ok : true,
									cancel : false,
									yes : false,
									no : false
								});
					}, null, {
						ok : false,
						cancel : false,
						yes : true,
						no : true
					});
		
	};
	
	
	/*
	 * Called when the details of a resource,
	 * i.e, the joining date and/or the holiday list
	 * are modified or updated.
	 * 
	 * The tasks already allocated to the resource are updated
	 * as per the modified details
	 * 
	 */
	$scope.editResourceDetails = function(index){

				//ask user if the tasks should be updated with the new resource details.
				$scope.shouldUpdateTheDependantTasks($scope.resources[index], $scope.resourceAllocation);
		
	};

	/*
	 *  Add another date to the list of holidays for
	 *  a particular resource 
	 */
	$scope.addHolidayToList = function(index){
		
		if(angular.isDefined($scope.resources[index].tmpFrom) && $scope.resources[index].tmpFrom !== ''
			&& angular.isDefined($scope.resources[index].tmpTo) && $scope.resources[index].tmpTo !== ''){
			
			//Create range of dates :			
			var newHolidayFrom = new Date($scope.resources[index].tmpFrom);
			var newHolidayTo = new Date($scope.resources[index].tmpTo);
			
			if(newHolidayFrom.getTime() <= newHolidayTo.getTime()){
				
				var tmp = newHolidayFrom;
				while(tmp.getTime() <= newHolidayTo.getTime()){
					//Add the date to the list if not already present.
					if(utility.indexOfDateInList(tmp, $scope.resources[index].holidayList) === -1){
						$scope.resources[index].holidayList.push(tmp);
					}
					tmp = utility.addDays(tmp,1);
				}
				
				//ask user if the tasks should be updated with the new resource details.
				$scope.shouldUpdateTheDependantTasks($scope.resources[index], $scope.resourceAllocation);
				
			}else{
				modalService.callModal("Please enter a valid date range !!!", null, null,{ok:true, cancel: false, yes:false, no:false});
			}
		}else{
			modalService.callModal("Please enter a valid From and To dates !!!", null, null,{ok:true, cancel: false, yes:false, no:false});
		}
	};
	
	
	$scope.shouldUpdateTheDependantTasks = function(resource, taskList){
		//ask user if the tasks should be updated with the new resource details.
		modalService.callModal("Update the start-end dates for " + resource.name + "'s assigned tasks ?"
				+"\n It may result in incorrect output otherwise.",function(){
			
			var tempStartDate = utility.isHoliday(
					resource.jd,
					resource.holidayList) ? utility.getWorkDays(
					resource.jd, 1,
					resource.holidayList)
					: resource.jd;					
			//Update the start and end date for the tasks to which the current resource is allocated 
			commonHelper.updateDependentTasks(resource.name, -1, tempStartDate);
			//update the next available date for the resource:
			$scope.resources[index].nextAvailableOn = commonHelper
					.getNextAvailableDate(
							resource.name,
							taskList.length,
							resource,
							taskList);					
			
		}, null, {ok:false, cancel:false, yes:true, no:true});
	};
	
	
	/*
	 * Remove a date from the list of holiday for a resource  
	 */
	$scope.removeHolidayFromList = function(resourceName,date){
		var resource = $filter("filter")($scope.resources, {name : resourceName})[0];
		var i = utility.indexOfDateInList(resource.holidayList, date);
		if(i !== -1){
			resource.holidayList.splice(i, 1);
		}
		
		$scope.shouldUpdateTheDependantTasks(resource, $scope.resourceAllocation);
		
	};
	
	//To reset the resources
	$scope.resetResources = function(){

			modalService
					.callModal(
							"Are you sure you want to remove all resources?",
							function() {
								Data.resetResources();
								$scope.resources = Data
										.getResources();
							}, null, {
								ok : false,
								cancel : false,
								yes : true,
								no : true
							});
	};	

	 $scope.exportData = function () {
		//format the list of dates to a particular format
		 alasql.fn.formatdatelist = function(datelist){
			 var hl = [];
    		 angular.forEach(datelist, function(val, i){
    			 hl.push(utility.changeDateFormat(val,'MM/dd/yyyy'));
    		 });
			 return hl.join();
		 };
		 
			//format the list of dates to a particular format
		 alasql.fn.formatdatejd = function(val){
			 return utility.changeDateFormat(val,'MM/dd/yyyy');
		 };		 
		 
		 alasql('SELECT '
				+ 'name AS [Resource Name], '
				+ 'formatdatejd(jd) AS [Joining Date], '
				+ 'formatdatelist(holidayList) AS [Holiday List] '
				+ 'INTO XLSX("wbs_resources.xlsx",{sheetid:"resources",headers:true}) '
				+ 'FROM ?',
				[$scope.resources]);
		 
			localStorage.setItem("resources",angular.toJson($scope.resources));
			//console.log(list);
	 
	 }; 
	
		$scope.storeDateToImportTmp = function(event){
			if(document.querySelector("#fileImport").files.length > 0){
				$scope.uploadEvent = event;	
			}
			};
		
		/*
		 * This API imports the resources data from an excel sheet to
		 * loads it in the resources model
		 * 
		 */
		$scope.importDataFromExcel = function(){
			var sheetid = document.querySelector("#localSheetName").value;
			if(sheetid.trim() !== wbsConstants.BLANK){
			
				alasql('SELECT * FROM FILE(?, {sheetid:"' + sheetid + '", headers:true})',[$scope.uploadEvent], function(data){
			        $scope.importedData = data;
					//console.log(data);
					//console.log($scope.importedData.length);
					
					if($scope.importedData.length > 0){
						
						var data = [];
						var row={};
						var error = false;
						var errorMessage = wbsConstants.BLANK;
						for(var i=0; i<$scope.importedData.length; i++){
							//angular.forEach($scope.importedData, function(row, i){
							row = $scope.importedData[i];
							//create a task with default setting.
							var resource = {name:wbsConstants.BLANK, jd: wbsConstants.BLANK, holidayList: [], 
									tmpFrom: wbsConstants.BLANK, tmpFrom: wbsConstants.BLANK};
							error = false;
							angular.forEach(row, function(value, key){
								switch(key){
								case "Resource Name": 
									if(value.trim() === wbsConstants.BLANK){
										error = true;
										errorMessage = "Resource name is missing in data row[" + (i+1) + "]!!!\n Please correct data.";
									}else if($filter("filter")(data, {name : value.trim()}).length !== 0){
										error = true;
										errorMessage = "Multiple Resource with same name found.\n Please correct data.";
									}else{
										resource.name = value.trim();
									}
									break;
								case "Joining Date":
									if(!error && value !== wbsConstants.BLANK && value !== null){
										var tmp = value + wbsConstants.BLANK;
										var list = tmp.split(wbsConstants.COMMA_SEPERATOR);
										if(list.length > 1){
											error = true;
											errorMessage = "Multiple Joining dates specified in data row[" + (i+1) + "].\n" +
											"Please correct the data";
										}else{
											resource.jd = utility.ExcelDateToJSDate(value);
										}
									}
									break;
								case "Holiday List":
									var tmp = value + wbsConstants.BLANK; 
									if(!error){
										var list = tmp.split(wbsConstants.COMMA_SEPERATOR);
										if(list.length === 1 && list[0].trim() === wbsConstants.BLANK){
											break;
										}else if(list.length === 1 && list[0].trim() !== wbsConstants.BLANK){
											resource.holidayList.push(new Date(value));
										}else{
											for(var z = 0; z<list.length; z++){
												resource.holidayList.push(new Date(list[z]));
											}}
									}
									break;
								}
							});
							//If duplicate found then discard data.
							if(error){
								modalService.callModal(errorMessage,
										null,null,{ok:true, cancel:false, yes:false, no:false});
								break;
							}else{
								resource.nextAvailableOn = utility
										.isHoliday(
												resource.jd,
												resource.holidayList) ? utility
										.getWorkDays(
												resource.jd,
												1,
												resource.holidayList)
										: resource.jd;
								data.push(resource);
							}
						}
						//);
						if(!error){
							$scope.resources = data;
							Data.setResources(data);
							$scope.importedData = [];
							
							//cache resource details
							localStorage.setItem("resources",angular.toJson($scope.resources));
							
							//ask if tasks should be reset/cleared
							modalService
							.callModal(
									"Resource details have been modified. Reset tasks ?",
									function() {
										Data.resetTasks();
									}, null, {
										ok : false,
										cancel : false,
										yes : true,
										no : true
									});
						}
					}else{
						//add modal stating the sheet is empty
						modalService.callModal(
								"Data not found !!!", null,
								null, {
									ok : true,
									cancel : false,
									yes : false,
									no : false
								});				
					}
			    });
				$scope.uploadEvent = wbsConstants.BLANK;
				document.querySelector("#fileImport").value = wbsConstants.BLANK;
				document.querySelector("#localSheetName").value = wbsConstants.BLANK;
				
			}else{
				modalService.callModal("Please enter the sheet name.",
						null, null, {ok:true, cancel:false, yes:false, no:false});
			}
			
		};
		
	      //Write to google spreadsheet
	      $scope.sendRequestToWriteToGsheet = function(){
	    	  
	    	  var spreadsheetId = document.querySelector("#gsheetId").value.trim();  			
	    	  var sheetName = document.querySelector("#gsheetName").value;

	    	  if(spreadsheetId === wbsConstants.BLANK || sheetName === wbsConstants.BLANK){
			    		modalService.callModal("Please provide both Spreadsheet id and sheet name !!!",
							    				null,
						    				null,
							    				{ok:true, cancel:false, yes:false, no:false}); 
			    	 }else{    	  
	    	  
	    	  gService.handleClientLoad(writeCallback);

							function writeCallback() {
								var accesstoken = gService.getAccessToken();

								if (accesstoken === '') {
									console.log("error");
								} else {
									var data = $scope.getResourceDetails();
									var range = $scope.resources.length + 1;
									var startofRange = wbsConstants.G_START_RANGE;
									var endofRange = "C" + range;
									// console.log(startofRange + ":" +
									// endofRange);

									var params = {
										spreadsheetId : spreadsheetId,
										range : sheetName
										+ "!"
										+ startofRange
										+ ":"
										+ "C"
									};
									// First clear the sheet
									var requestToClearSheet = gapi.client.sheets.spreadsheets.values
											.clear(params, {});
									requestToClearSheet
											.then(
													function(response) {
														console
																.log(response.result);
														params = {
															spreadsheetId : spreadsheetId,
															range : sheetName
																	+ "!"
																	+ startofRange
																	+ ":"
																	+ endofRange,
															valueInputOption : wbsConstants.G_VALUE_RENDER_OPTION_WRITE,
															"alt" : "json",
															"bearer_token" : accesstoken
														};
														var valueRangeBody = {
															"range" : sheetName
																	+ "!"
																	+ startofRange
																	+ ":"
																	+ endofRange,
															"majorDimension" : wbsConstants.G_MAJOR_DIMENSION,
															"values" : data
														};
														// Update the sheet
														var requestToWrite = gapi.client.sheets.spreadsheets.values
																.update(params,
																		valueRangeBody);
														requestToWrite
																.then(
																		function(
																				response) {
																			// console.log(response.result);
																			localStorage.setItem("resourceAllocation",angular.toJson($scope.resourceAllocation));
																			//cache the gheet id & sheet name
																			localStorage.setItem("gsheetid", spreadsheetId);
																			localStorage.setItem("gsheetname", sheetName);
																			
																			
																			modalService
																					.callModal(
																							"Spreadsheet has been updated successfully.",
																							null,
																							null,
																							{
																								ok : true,
																								cancel : false,
																								yes : false,
																								no : false
																							});

																		},
																		function(
																				reason) {
																			// console.error('error:
																			// ' +
																			// reason.result.error.message);
																			modalService
																					.callModal(
																							"Some error occurred while updating the Spreadsheet !!!",
																							null,
																							null,
																							{
																								ok : true,
																								cancel : false,
																								yes : false,
																								no : false
																							});
																		});
													},
													function(reason) {
														// console.error('error:
														// ' +
														// reason.result.error.message);
														var message = "";
														if (reason.result.error.code === 400) {
															message = "The specified sheet name is invalid !!!";
														} else if (reason.result.error.code === 404) {
															message = "The specified spreadsheet id was not found !!!";
														} else {
															message = "Some error occured while updating the spreadsheet."
																	+ "\n Please check the sheet id and sheet name provided.";
														}

														modalService
																.callModal(
																		message,
																		null,
																		null,
																		{
																			ok : true,
																			cancel : false,
																			yes : false,
																			no : false
																		});
													});
								}
							}
			    	 }
	      };
	
	     $scope.getResourceDetails = function(){
	    	 var data = [];
	    	 var header = ['Resource Name','Joining Date','Holiday List'];
	    	 data.push(header);
	    	 angular.forEach($scope.resources, function(value, i){
	    		 var row = [];
	    		 row.push(value.name);
	    		 row.push(utility.changeDateFormat(value.jd,'MM/dd/yyyy'));
	    		 var hl = [];
	    		 angular.forEach(value.holidayList, function(val, i){
	    			 hl.push(utility.changeDateFormat(val,'MM/dd/yyyy'));
	    		 });
	    		 row.push(hl.join());
	    		 data.push(row);
	    	 });
	    	 return data;
	     } ;
	      
	     //Read from google spreadsheet
	     $scope.sendRequestToReadFromGsheet = function(){
	    	 
	    	 var spreadsheetId = document.querySelector("#gsheetId").value.trim();  			
	    	 var sheetName = document.querySelector("#gsheetName").value;

	    	 if(spreadsheetId === wbsConstants.BLANK || sheetName === wbsConstants.BLANK){
	    		modalService.callModal("Please provide both Spreadsheet id and sheet name !!!",
					    				null,
					    				null,
					    				{ok:true, cancel:false, yes:false, no:false}); 
	    	 }else{
	    		 
	    	  gService.handleClientLoad(readCallback);
	    	  
	    	  function readCallback(){
	    		var accesstoken = gService.getAccessToken();
	  			if(accesstoken === ''){
	  				console.log("error");
	  			}else{
  				
		  		    var params = {
		  		            spreadsheetId: spreadsheetId, 
		  		            range: sheetName + wbsConstants.G_READ_RANGE,
		  		            majorDimension : wbsConstants.G_MAJOR_DIMENSION,
		  		            valueRenderOption: wbsConstants.G_VALUE_RENDER_OPTION_READ
		  		          };
	  				
	  				var requestToReadSheet = gapi.client.sheets.spreadsheets.values.get(params);
	  				requestToReadSheet.then(function(response) {
	  					//console.log(response.result);
	  					$scope.setResourceDetails(response.result.values);
	  					
						//cache task details
						localStorage.setItem("resources",angular.toJson($scope.resourceAllocation));
						//cache the gheet id & sheet name
						localStorage.setItem("gsheetid", spreadsheetId);
						localStorage.setItem("gsheetname", sheetName);
	  					
		  				}, function(reason) {
		  					console.error('error: ' + reason.result.error.message);
							var message="";
							if(reason.result.error.code === 400){
								message="The specified sheet name is invalid !!!";
							}else if(reason.result.error.code === 404){
								message="The specified spreadsheet id was not found !!!";
							}else{
								message="Some error occured while reading the spreadsheet."+
											"\n Please check the sheet id and sheet name provided.";
							}
							
							modalService
							.callModal(
									message,
									null,
									null,
									{
										ok : true,
										cancel : false,
										yes : false,
										no : false
									});						
	  				});	  					
	  			}
	    		
	    	  }	 
	    	  
	    	 }
	     };
	     
	     //Format data read from google spreadsheet
	     $scope.setResourceDetails = function(gdata){
	    	 var data = [];
	    	 //var header = ['Resource Name','Joining Date','Holiday List'];
	    	 //Match the headers:
	    	 //$scope.matchHeaders();
	    	 //data.push(header);
	    	 gdata.splice(0,1);
	    	 
	    	 for(var i = 0; i<gdata.length; i++){
	    		 var value = gdata[i];
	    		 var rname = value[0] != null ? value[0].trim() : wbsConstants.BLANK;
	    		 if(rname === wbsConstants.BLANK){
	    			 //should throw error
	    			 modalService.callModal("Resource Name missing in data row [" + (i+1) +"] !!!\n Please correct the data.",
	    					 null,
	    					 null,
	    					 {ok: true, cancel:false, yes:false, no:false});
	    			 break;
	    		 }else{
	    			 var rjd = value[1] != null ? new Date(value[1].trim()) : wbsConstants.BLANK;
	    			 var hlString="";
	    			 var hl = [];
	    			 if(value[2] != null && value[2].trim().indexOf(wbsConstants.COMMA_SEPERATOR) > -1){
	    				 hlString = value[2].trim().split(wbsConstants.COMMA_SEPERATOR);
	    				 angular.forEach(hlString, function(val, i){
	    					 var time = Date.parse(val); 
	    					 hl.push(new Date(time));
	    				 });
	    				 
	    			 }else if(value[2] != null && value[2].trim().indexOf(wbsConstants.COMMA_SEPERATOR) === -1){
	    				 hl.push(new Date(value[2].trim()));
	    			 }else{
	    				 hl = [];
	    			 }
	    			 

					row = {
						name : rname,
						jd : rjd,
						holidayList : hl,
						tmpFrom : wbsConstants.BLANK,
						tmpTo : wbsConstants.BLANK,
						nextAvailableOn : utility.isHoliday(rjd, hl) ? utility.getWorkDays(rjd, 1, hl) : rjd
								};
	    			 data.push(row);
	    		 }	    		 
	    	 }

	    	 //console.log(data);
	    	 $scope.resources = data;
	    	 Data.setResources(data);
	    	 $scope.$apply();
	     } ;     

});