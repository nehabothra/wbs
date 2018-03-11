/*
 * Controller for the tasks page
 */
app
		.controller(
				"taskController1",
				function($scope, $filter, utility, Data, commonHelper,
						$timeout, importFromExcel, gService, wbsConstants,
						modalService, $parse) {

					//initialize with local cached data if available.
					Data.init();
					$scope.resources = Data.getResources();
					$scope.resourceAllocation = Data.getResourceAllocation();
					$scope.statusList = wbsConstants.statusList;
					$scope.popoverHtml = "popoverTemplate.html";
					$scope.gsheetname = localStorage.getItem("gsheetname");
					$scope.gsheetid = localStorage.getItem("gsheetid");
					
					angular.element(document.querySelector("#resource"))
							.removeClass("active");
					angular.element(document.querySelector("#task")).addClass(
							"active");

					// Called when a new task is created
					$scope.addTaskToList = function() {
						var task = {
							id : utility.getMaxId($scope.resourceAllocation),
							taskDescription : wbsConstants.BLANK,
							name : wbsConstants.BLANK,
							effort : 0,
							startDate : wbsConstants.BLANK,
							endDate : wbsConstants.BLANK,
							parentTask : -1,
							level : 0,
							isParent : false,
							totalSubtasks : 0,
							status : wbsConstants.BLANK,
							jiraid : wbsConstants.BLANK,
							prcntComplete : wbsConstants.BLANK,
							comment : wbsConstants.BLANK
						};
						$scope.resourceAllocation.push(task);
						//console.log($scope.resourceAllocation);
					};

					// Called when a task(and its related sub-tasks) is removed
					// from the list
					$scope.removeTaskFromList = function(index) {

						modalService
								.callModal(
										"Are you sure you want to remove this task and all of its related sub-tasks ? ",
										// successCallback
										function() {
											var subtasks = $scope.resourceAllocation[index].totalSubtasks;
											// Get id of parent task.
											var pId = $scope.resourceAllocation[index].parentTask;
											// Remove current task and its
											// related sub tasks.
											$scope.removeRelatedTasks(index);
											//update effort, start and end dates for parent tasks.		
											commonHelper.updateParent(pId);
											var pTask = $filter("filter")($scope.resourceAllocation,{id: pId},true)[0];
											pTask.totalSubtasks = pTask.totalSubtasks - subtasks -1;
											if(pTask.totalSubtasks === 0){
												pTask.isParent = false;
											}
											
										}, null, {
											ok : false,
											cancel : false,
											yes : true,
											no : true
										});

					};

					// This API recursively removes the selected task and its
					// corresponding sub-tasks.
					$scope.removeRelatedTasks = function(index) {

						// check if the task being deleted has any sub-tasks :
						if (!$scope.resourceAllocation[index].isParent) {
							/*
							 * If it has no subtasks, update the start and end
							 * date for the other tasks which have the same
							 * resource as the current task being removed.
							 */
							$scope.changeResource(index, wbsConstants.BLANK,
									$scope.resourceAllocation[index].name);
						} else {
							var subTasks = $filter("filter")
							(
									$scope.resourceAllocation,
									{
										parentTask : $scope.resourceAllocation[index].id
									}, true);
							
							angular.forEach(subTasks, function(obj, i) {
								
								var taskIndex = utility.findIndexOfTask(obj.id,
										$scope.resourceAllocation);
								$scope.removeRelatedTasks(taskIndex);
							});
						}
					
						// Remove the particular task.
						$scope.resourceAllocation.splice(index, 1);
					};

					/*
					 * Called when a task's details needs to be cloned/copied to
					 * create another new task. The subtasks under the task
					 * being cloned is also copied
					 */
					$scope.cloneTask = function(index) {

						// Append the new task in the end and the related
						// subtasks accordingly.
						var task = {};
						angular.copy($scope.resourceAllocation[index], task);
						task.id = utility.getMaxId($scope.resourceAllocation);
						//subtasks to copy/clone
						var countsubtasks = $scope.resourceAllocation[index].totalSubtasks;
						//get location of the cloned task 
						var position = -1;
						if($scope.resourceAllocation[index].level === 0){
							position = $scope.resourceAllocation.length;
						}else{
							position = index + countsubtasks + 1;
						}
						//insert the topmost cloned task.
						$scope.resourceAllocation.splice(position, 0, task);
						for(var i = 1; i<= countsubtasks; i++){
							var subtask = {};
							angular.copy($scope.resourceAllocation[index+i], subtask);
							subtask.id = utility.getMaxId($scope.resourceAllocation);
							$scope.resourceAllocation.splice(position+i, 0, subtask);
							//console.log(subtask.level + ":" + subtask.id);
						}
						//update the value of pid for the new task:
						utility.updatePidForClonedTasks($scope.resourceAllocation, position+1, position+countsubtasks, task.id, task.level);
						//update the total subtasks value of the parents of the cloned task.
						utility.updateTotalSubtasks($scope.resourceAllocation, $scope.resourceAllocation[index].parentTask , countsubtasks+1);
						//update the parent tasks effort, start and end date:
						commonHelper.updateParent($scope.resourceAllocation[index].parentTask);
					};

					// Called when a subtask is created for a given task.
					$scope.addSubTask = function(index) {

						var subTaskLevel = $scope.resourceAllocation[index].level + 1;

						// Allow max 4 level of nesting
						if (subTaskLevel > wbsConstants.MAX_TASK_SUBLEVEL) {
							modalService
									.callModal(
											"Maximum of 4 levels of sub-tasks are allowed!!!",
											null, null, {
												ok : true,
												cancel : false,
												yes : false,
												no : false
											});
						} else {
							var rname = $scope.resourceAllocation[index].name;
							var startdt = $scope.resourceAllocation[index].startDate;
							// set the isParent flag for the parent task, and
							// clear fields
							// like effort, resource name , start and end date
							// which now depends on the subtasks.
							$scope.resourceAllocation[index].isParent = true;
							$scope.resourceAllocation[index].name = wbsConstants.BLANK;
							$scope.resourceAllocation[index].startDate = wbsConstants.BLANK;
							$scope.resourceAllocation[index].effort = 0;
							$scope.resourceAllocation[index].endDate = wbsConstants.BLANK;
							

							// increase the no of
							// sub tasks by 1 of the
							// current tasks'parent tasks
							utility.updateTotalSubtasks($scope.resourceAllocation,
									$scope.resourceAllocation[index].parentTask, 
									1);
							
							var subTaskId = utility.getMaxId($scope.resourceAllocation);
							//sub task to be added
							var task = {
								id : subTaskId,
								taskDescription : wbsConstants.BLANK,
								name : wbsConstants.BLANK,
								effort : 0,
								startDate : wbsConstants.BLANK,
								endDate : wbsConstants.BLANK,
								parentTask : $scope.resourceAllocation[index].id,
								level : subTaskLevel,
								isParent : false,
								totalSubtasks : 0
							};

							var len = $scope.resourceAllocation[index].totalSubtasks;
							$scope.resourceAllocation.splice(index + len + 1,
									0, task);
							// Update the ancestor tasks only if the 1st task is
							// being added to the current task
								$scope.resourceAllocation[index].totalSubtasks += 1;
								commonHelper.updateParent(task.parentTask);

															
								/*
								 * if the sub task added is the parent task's
								 * first sub task and some resource was assigned
								 * to that task then update the other tasks of
								 * the same resource
								 */
								if(rname !== wbsConstants.BLANK){
									commonHelper.updateDependentTasks(rname, index, startdt);
								}
						}
					};

					// called when the resource allocated to a task is changed.
					$scope.changeResource = function(index, rname, oldResource) {

						if (angular.isDefined(rname)
								&& angular.isDefined(oldResource)
								&& !angular.equals(rname, oldResource)) {

							// this value be needed for the dependent tasks of
							// the previous resource
							var oldStartDate = $scope.resourceAllocation[index].startDate;
							var tempStartDate = "";

							/*
							 * Updating the start and end date of the current
							 * task as follows: If the NEW resource is not
							 * empty, then find the new start and end date of
							 * the task, else set the start date and end date as
							 * blank.
							 * 
							 */
							if (!angular.equals(rname, wbsConstants.BLANK)) {

								// set the min effort as 1.
								if (!angular
										.isNumber($scope.resourceAllocation[index].effort)
										|| $scope.resourceAllocation[index].effort <= 0) {
									$scope.resourceAllocation[index].effort = 1;
								}

								var resource = $filter("filter")($scope.resources, {
									name : rname
								}, true)[0]; 
								var hl = resource.holidayList;
								// get the new start date of the task = next
								// available date for the new resource.
								/************************changed in 18th feb - need to test once, using an api of common hlepr now******************/
/*								$scope.resourceAllocation[index].startDate = $scope
										.getStartDate(rname, index);*/
								
								$scope.resourceAllocation[index].startDate = commonHelper.getNextAvailableDate(rname, index, resource, $scope.resourceAllocation);

								// get the new end date of the current task as
								// per the new resource.
								$scope.resourceAllocation[index].endDate = utility
										.getWorkDays(
												utility
														.getFormattedDate($scope.resourceAllocation[index].startDate),
												$scope.resourceAllocation[index].effort,
												hl);

								// update the dates for the dependent tasks of
								// the NEW resource
								tempStartDate = utility
										.getWorkDays(
												$scope.resourceAllocation[index].endDate,
												1, hl);
								commonHelper.updateDependentTasks(rname,
										index, tempStartDate);

								//update the next available date for the new resource
								resource.nextAvailableOn = commonHelper
										.getNextAvailableDate(
												rname,
												$scope.resourceAllocation.length,
												resource,
												$scope.resourceAllocation);
								
							} else {
								//change effort to 0 and change the start and end dates also.
								$scope.resourceAllocation[index].effort = 0;
								$scope.resourceAllocation[index].startDate = wbsConstants.BLANK;
								$scope.resourceAllocation[index].endDate = wbsConstants.BLANK;
							}
							//change the effort,start and end dates for parent tasks as well
							commonHelper.updateParent($scope.resourceAllocation[index].parentTask);

							if (!angular
									.equals(oldResource, wbsConstants.BLANK)) {
								// update the dates for the dependent tasks of
								// the OLD resource
								// tasks assigned to previous resource whose id
								// is greater than that of the current task.
								commonHelper.updateDependentTasks(oldResource,
										index, oldStartDate);
								
								var oresource = $filter("filter")($scope.resources, {
									name : oldResource
								}, true)[0]; 
								//update the next available date for the old resource
								oresource.nextAvailableOn = commonHelper
										.getNextAvailableDate(
												oldResource,
												$scope.resourceAllocation.length,
												oresource,
												$scope.resourceAllocation);

							}
						}
					};

					// Called when the effort associated with a task is
					// added/modified
					$scope.changeEffort = function(index, oldEffort) {

						/*
						 * If the effort is changed and a valid resource is
						 * assigned then update the effort, start and end dates
						 * of the current task and all its ancestor tasks.
						 */
						if (angular
								.isDefined($scope.resourceAllocation[index].name)
								&& !angular.equals(
										$scope.resourceAllocation[index].name,
										wbsConstants.BLANK)) {

							if (!angular
									.isNumber($scope.resourceAllocation[index].effort)
									|| $scope.resourceAllocation[index].effort <= 0) {
								$scope.resourceAllocation[index].effort = 1;
							}
							if(!angular.equals($scope.resourceAllocation[index].startDate, wbsConstants.BLANK)){
							var rname = $scope.resourceAllocation[index].name;
							var resource = $filter("filter")($scope.resources, {
								name : rname
							}, true)[0];
							var hl = resource.holidayList;
							var effort = $scope.resourceAllocation[index].effort;
							$scope.resourceAllocation[index].endDate = utility
									.getWorkDays(
											utility
													.getFormattedDate($scope.resourceAllocation[index].startDate),
											effort, hl);

							var tempStartDate = utility.getWorkDays(
									$scope.resourceAllocation[index].endDate,
									1, hl);

							// update only the tasks following this particular
							// task
							commonHelper.updateDependentTasks(rname,
									index, tempStartDate);
						

							//update the next available date for the new resource
							resource.nextAvailableOn = commonHelper
									.getNextAvailableDate(
											resource.name,
											$scope.resourceAllocation.length,
											resource,
											$scope.resourceAllocation);
						} 
							/*
							 * Though the resources are not assigned, we still
							 * update the effort,start and end of the parent task without
							 * changing the corresponding start and end dates
							 */
							commonHelper.updateParent($scope.resourceAllocation[index].parentTask);
					}
					};

					$scope.changeStartDate = function(index) {

						var rname = $scope.resourceAllocation[index].name;
						var resource = $filter("filter")($scope.resources, {
							name : rname
						}, true)[0];
						var hl = resource.holidayList;
						var effort = $scope.resourceAllocation[index].effort;
						$scope.resourceAllocation[index].endDate = utility
								.getWorkDays(
										utility
												.getFormattedDate($scope.resourceAllocation[index].startDate),
										effort, hl);

						var tempStartDate = utility
								.getWorkDays(
										$scope.resourceAllocation[index].endDate,
										1, hl);

						// update only the tasks following this particular task
						commonHelper.updateDependentTasks(rname,
								index, tempStartDate);
						
						//update the next available date for the new resource
						resource.nextAvailableOn = commonHelper
								.getNextAvailableDate(
										resource.name,
										$scope.resourceAllocation.length,
										resource,
										$scope.resourceAllocation);
						
						//update dates for current tasks' parent tasks
						commonHelper.updateParent($scope.resourceAllocation[index].parentTask);

					};

					// computes the start date for a task against a particular
					// resource of name "rname"
					$scope.getStartDate = function(rname, index) {

						var indexOfLastTaskWithSameResource = -1;		
						angular.forEach($scope.resourceAllocation, function(obj, i){
							if(i < index && obj.name === rname){
								indexOfLastTaskWithSameResource = i;
							}
						})	;								
								
						/*
						 * If not the current task is not the 1st task in the
						 * list, compute the new start date of the task
						 * according to the others tasks. else, being the 1st
						 * task of the resource, the start date for this task
						 * will be the joining date of the resource itself.
						 * 
						 */
						if (indexOfLastTaskWithSameResource > -1) {
							var hl = $filter("filter")($scope.resources, {
								name : rname
							}, true)[0].holidayList;
							var endDateOfPreviousTask = $scope.resourceAllocation[indexOfLastTaskWithSameResource].endDate;
							return utility.getWorkDays(endDateOfPreviousTask,
									1, hl);
						} else {
							return $filter("filter")($scope.resources, {
								name : rname
							}, true)[0].jd;
						}
					};

					// get the position of current task in the list of other
					// tasks assigned to this resource
					$scope.findTaskInList = function(list, id) {
						var index = -1;
						angular.forEach(list, function(obj, i) {
							if (angular.equals(obj.id, id)) {
								index = i;
							}
						});
						return index;
					};

					$scope.storeDateToImportTmp = function(event) {
						if (document.querySelector("#fileImport").files.length > 0) {
							$scope.uploadEvent = event;
						}
					};

					/*
					 * This API imports the resource allocation data from an
					 * excel sheet to loads it in the resource allocation model
					 * 
					 */
					$scope.importDataFromExcel = function() {	
						
						var sheetid = document.querySelector("#localSheetName").value;

						if(sheetid.trim() !== wbsConstants.BLANK){
							
							alasql('SELECT * FROM FILE(?, {sheetid:"' + sheetid
									+ '", headers:true})', [$scope.uploadEvent], function(
									data) {
								$scope.importedData = data;
								//console.log($scope.importedData.length);
								
								if ($scope.importedData.length > 0) {
									var data = [];
									var row={};
									for(var i=0; i<$scope.importedData.length; i++){
										row = $scope.importedData[i];
										// create a task with default setting.
										var task = {
												id : 1,
												taskDescription : wbsConstants.BLANK,
												name : wbsConstants.BLANK,
												effort : wbsConstants.BLANK,
												startDate : wbsConstants.BLANK,
												endDate : wbsConstants.BLANK,
												parentTask : -1,
												level : 0,
												isParent : false,
												totalSubtasks : 0,
												prcntComplete : wbsConstants.BLANK,
												status : wbsConstants.BLANK,
												jiraid : wbsConstants.BLANK,
												comment : wbsConstants.BLANK
										};
										error = false;
										errorMessage = wbsConstants.BLANK; 
										angular.forEach(row, function(value, key) {
											
											switch (key) {
											case "Task Description":
												if (value !== wbsConstants.BLANK) {
													task.level = 0;
													task.taskDescription = value;
												}
												break;
											case "Sub Task - 1":
												if (value !== wbsConstants.BLANK) {
													task.level = 1;
													task.taskDescription = value;
												}
												break;
											case "Sub Task - 2":
												if (value !== wbsConstants.BLANK) {
													task.level = 2;
													task.taskDescription = value;
												}
												break;
											case "Sub Task - 3":
												if (value !== wbsConstants.BLANK) {
													task.level = 3;
													task.taskDescription = value;
												}
												break;
											case "Sub Task - 4":
												if (value !== wbsConstants.BLANK) {
													task.level = 4;
													task.taskDescription = value;
												}
												break;
											case "Resource Assigned":
												task.name = value.trim();
												break;
											case "Effort":
												task.effort = parseInt(value);
												break;
											case "Start Date":
												if (value !== wbsConstants.BLANK
														&& value !== null) {
													task.startDate = utility
													.ExcelDateToJSDate(value);
												}
												break;
											case "End Date":
												if (value !== wbsConstants.BLANK
														&& value !== null) {
													task.endDate = utility
													.ExcelDateToJSDate(value);
												}
												break;
											case "% Complete":
												task.prcntComplete = parseFloat(value);
												break;
											case "Status":
												task.status = value.trim();
												break;
											case "Jira ID":
												task.jiraid = value.trim();
												break;
											case "Comments":
												task.comment = value.trim();
												break;
											}											
										});
						
										//console.log(task);
										task.id = utility.getMaxId(data);
										var pId = utility.getParentTaskId(data,
												task.level, i);
										// If this task has some parent then set the
										// isParent flag of that parent to true.
										if (pId !== -1) {
											var pTask = $filter("filter")(data, {
												id : pId
											})[0];
											pTask.isParent = true;
											utility.updateTotalSubtasks(data,
													pId, 
													1);
										}
										task.parentTask = pId;
										
										data.push(task);
									}
									if(!error){
										$scope.resourceAllocation = data;
										Data.setResourceAllocation(data);
										
										//update the next available date for all the resources.
										var resourceList = Data.getResources();
										angular.forEach(resourceList, function(resource, i){
										resource.nextAvailableOn = commonHelper
												.getNextAvailableDate(
														resource.name,
														$scope.resourceAllocation.length,
														resource,
														$scope.resourceAllocation);
										});
										
										$scope.importedData = [];
										
										//cache task details
										localStorage.setItem("resourceAllocation",angular.toJson($scope.resourceAllocation));
										
										modalService
										.callModal(
												"Please note the new start-end dates may not be in sync with the current resource details.",
												null,
												null,
												{
													ok : true,
													cancel : false,
													yes : false,
													no : false
												});
										
										
										$scope.$apply();
									}
								} else {
									// add modal stating the sheet is empty, ask if need
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

					// To reset the tasks
					$scope.resetTasks = function() {
						modalService.callModal(
								"Are you sure you want to remove all tasks?",
								function() {
									Data.resetTasks();
									$scope.resourceAllocation = Data
											.getResourceAllocation();
									
									//update the next available date for all the resources.
									var resourceList = Data.getResources();
									angular.forEach(resourceList, function(resource, i){
										resource.nextAvailableOn = commonHelper.getNextAvailableDate(resource.name, -1, resource, []);
									});
									
								}, null, {
									ok : false,
									cancel : false,
									yes : true,
									no : true
								});
					};

					$scope.exportData = function() {

						// console.log($scope.resourceAllocation);
						alasql.fn.changeToUpperCase = function(str){return str.toUpperCase();};
						alasql(
								'SELECT (CASE WHEN level=0 THEN taskDescription ELSE "" END) AS [Task Description],'
										+ ' (case when level=1 then taskDescription else "" end) AS [Sub Task - 1],'
										+ ' (case when level=2 then taskDescription else "" end) AS [Sub Task - 2],'
										+ ' (case when level=3 then taskDescription else "" end) AS [Sub Task - 3],'
										+ ' (case when level=4 then taskDescription else "" end) AS [Sub Task - 4],'
										+ ' name AS [Resource Assigned], '
										+ 'effort AS [Effort], '
										+ 'startDate AS [Start Date], '
										+ 'endDate AS [End Date], '
										+ 'prcntComplete AS [% Complete], '
										+ 'status AS [Status], '
										+ 'changeToUpperCase(jiraid) AS [Jira ID], '
										+ 'comment AS [Comments] '
										+ 'INTO XLSX("wbs.xlsx",{sheetid:"tasks",headers:true}) '
										+ 'FROM ?',
								[ $scope.resourceAllocation ]);
						
						localStorage.setItem("resourceAllocation",angular.toJson($scope.resourceAllocation));
						console.log(localStorage.getItem("resourceAllocation"));
					};

					// Write to google spreadsheet
					$scope.sendRequestToWriteToGsheet = function() {
												
						var spreadsheetId = document.querySelector("#gsheetId").value.trim();
						var sheetName = document.querySelector("#gsheetName").value;

						if (spreadsheetId === wbsConstants.BLANK
								|| sheetName === wbsConstants.BLANK) {
							modalService
									.callModal(
											"Please provide both Spreadsheet id and sheet name !!!",
											null, null, {
												ok : true,
												cancel : false,
												yes : false,
												no : false
											});
						} else {

							gService.handleClientLoad(writeCallback);

							function writeCallback() {
								var accesstoken = gService.getAccessToken();

								if (accesstoken === '') {
									console.log("error");
								} else {
									var data = $scope
											.getResourceAllocationDetails();
									var range = $scope.resourceAllocation.length + 1;
									// Since we have only 9 columns
									var startofRange = wbsConstants.G_START_RANGE;
									var endofRange = "M" + range;
									// console.log(startofRange + ":" +
									// endofRange);

									var params = {
										spreadsheetId : spreadsheetId,
										range : sheetName
										+ "!"
										+ startofRange
										+ ":"
										+ "M"										
									};
									// First clear the sheet
									var requestToClearSheet = gapi.client.sheets.spreadsheets.values
											.clear(params, {});
									requestToClearSheet
											.then(
													function(response) {
														/*console
																.log(response.result);*/
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
																			
																			//cache task details
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
														// '+
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

					$scope.getResourceAllocationDetails = function() {
						var data = [];
						var header = [ 'Task Description', 'Sub Task - 1',
								'Sub Task - 2', 'Sub Task - 3', 'Sub Task - 4',
								'Resource Assigned', 'Effort', 'Start Date', 'End Date',
								'% Complete', 'Status', 'Jira ID', 'Comments' ];
						data.push(header);
						angular
								.forEach(
										$scope.resourceAllocation,
										function(value, i) {
											var row = [];

											for (var i = 0; i <= wbsConstants.MAX_TASK_SUBLEVEL; i++) {
												if (i != value.level) {
													row.push(wbsConstants.BLANK);
												} else {
													row
															.push(value.taskDescription);
												}
											}
											row.push(value.name);
											row.push(value.effort);
											row.push(utility.changeDateFormat(
													value.startDate,
													'MM/dd/yyyy'));
											row.push(utility
													.changeDateFormat(
															value.endDate,
															'MM/dd/yyyy'));
											row.push(value.prcntComplete);
											row.push(value.status);
											row.push((value.jiraid).toUpperCase());
											row.push(value.comment);
											
											data.push(row);
										});
						//console.log(data);
						return data;
					};

					//Read from google spreadsheet
					$scope.sendRequestToReadFromGsheet = function() {

					var spreadsheetId = document.querySelector("#gsheetId").value.trim();
						var sheetName = document.querySelector("#gsheetName").value;

						if (spreadsheetId === wbsConstants.BLANK
								|| sheetName === wbsConstants.BLANK) {
							modalService
									.callModal(
											"Please provide both Spreadsheet id and sheet name !!!",
											null, null, {
												ok : true,
												cancel : false,
												yes : false,
												no : false
											});
						} else {

							gService.handleClientLoad(readCallback);

							function readCallback() {
								var accesstoken = gService.getAccessToken();
								if (accesstoken === '') {
									console.log("error");
								} else {

									var params = {
										spreadsheetId : spreadsheetId,
										range : sheetName
												+ wbsConstants.G_READ_RANGE,
										majorDimension : wbsConstants.G_MAJOR_DIMENSION,
										valueRenderOption : wbsConstants.G_VALUE_RENDER_OPTION_READ
									};

									var requestToReadSheet = gapi.client.sheets.spreadsheets.values
											.get(params);
									requestToReadSheet
											.then(
													function(response) {
														// console.log(response.result);
														$scope
																.setResourceAllocationDetails(response.result.values);
														
														//cache task details
														localStorage.setItem("resourceAllocation",angular.toJson($scope.resourceAllocation));
														//cache the gheet id & sheet name
														localStorage.setItem("gsheetid", spreadsheetId);
														localStorage.setItem("gsheetname", sheetName);
														
														modalService
																.callModal(
																		"Please note the new start-end dates may not be in sync with the current resource details.",
																		null,
																		null,
																		{
																			ok : true,
																			cancel : false,
																			yes : false,
																			no : false
																		});
													},
													function(reason) {
														var message = "";
														if (reason.result.error.code === 400) {
															message = "The specified sheet name is invalid !!!";
														} else if (reason.result.error.code === 404) {
															message = "The specified spreadsheet id was not found !!!";
														} else {
															message = "Some error occured while reading the spreadsheet."
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

					//Format data read from gsheet.
					$scope.setResourceAllocationDetails = function(gdata) {
						var data = [];
						//var header = ['Resource Name','Joining Date','Holiday List'];
						//Match the headers:
						//$scope.matchHeaders();
						//data.push(header);
						gdata.splice(0, 1);
						angular
								.forEach(
										gdata,
										function(value, i) {
											//should throw error
											task = {
												id : 1,
												taskDescription : wbsConstants.BLANK,
												name : wbsConstants.BLANK,
												effort : wbsConstants.BLANK,
												startDate : wbsConstants.BLANK,
												endDate : wbsConstants.BLANK,
												parentTask : -1,
												level : 0,
												isParent : false,
												totalSubtasks : 0,
												prcntComplete : wbsConstants.BLANK,
												status : wbsConstants.BLANK,
												jiraid : wbsConstants.BLANK,
												comment : wbsConstants.BLANK
											};

											for (var x = 0; x <= wbsConstants.MAX_TASK_SUBLEVEL; x++) {
												if (value[x] !== wbsConstants.BLANK) {
													task.taskDescription = value[x];
													task.level = x;
													break;
												}
											}

											task.name = value[5] != null ? value[5]
													.trim()
													: wbsConstants.BLANK;
											task.effort = value[6] != null ? parseInt(value[6]
													.trim())
													: wbsConstants.BLANK;
											task.startDate = value[7] != null ? new Date(
													value[7].trim())
													: wbsConstants.BLANK;
											task.endDate = value[8] != null ? new Date(
													value[8].trim())
													: wbsConstants.BLANK;
											task.prcntComplete = value[9] != null ? parseInt(value[9]
													.trim())
													: wbsConstants.BLANK;
											task.status = value[10] != null ? value[10].trim()
													: wbsConstants.BLANK;
											task.jiraid = value[11] != null ? value[11].trim()
													: wbsConstants.BLANK;													
											task.comment = value[12] != null ? value[12].trim()
													: wbsConstants.BLANK;

											var pId = utility.getParentTaskId(
													data, task.level, i);
											//If this task has some parent then set the isParent flag of that parent to true.
											if (pId !== -1) {
												var pTask = $filter("filter")(
														data, {
															id : pId
														})[0];
												pTask.isParent = true;
												utility.updateTotalSubtasks(data,
														pId, 
														1);
											}
											task.id = utility.getMaxId(data);
											task.parentTask = pId;

											data.push(task);
										});
						//console.log(data);
						$scope.resourceAllocation = data;
						Data.setResourceAllocation(data);
						
						//update the next available date for all the resources.
						var resourceList = Data.getResources();
						angular.forEach(resourceList, function(resource, i){
						resource.nextAvailableOn = commonHelper
								.getNextAvailableDate(
										resource.name,
										$scope.resourceAllocation.length,
										resource,
										$scope.resourceAllocation);
						});						
						
						$scope.$apply();
					};

				});