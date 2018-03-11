/*
 * Controller for the tasks page
 */
app
		.controller(
				"taskController",
				function($scope, $filter, utility, Data, commonHelper,
						$timeout, importFromExcel, gService, wbsConstants,
						modalService) {

					$scope.resources = Data.getResources();
					$scope.resourceAllocation = Data.getResourceAllocation();

					angular.element(document.querySelector("#resource"))
							.removeClass("active");
					angular.element(document.querySelector("#task")).addClass(
							"active");

					// Called when a new task is created
					$scope.addTaskToList = function() {
						var task = {
							id : utility.getMaxId($scope.resourceAllocation,
									-1, 0),
							taskDescription : wbsConstants.BLANK,
							name : wbsConstants.BLANK,
							effort : wbsConstants.BLANK,
							startDate : wbsConstants.BLANK,
							endDate : wbsConstants.BLANK,
							parentTask : -1,
							level : 0,
							isParent : false
						};
						$scope.resourceAllocation.push(task);
						console.log($scope.resourceAllocation);
					};

					// Called when a task(and its related sub-tasks) is removed
					// from the list
					$scope.removeTaskFromList = function(index) {

						modalService
								.callModal(
										"Are you sure you want to remove this task and all of its related sub-tasks ? ",
										// successCallback
										function() {
											var effortOfTaskRemoved = $scope.resourceAllocation[index].effort;
											// Get id of parent task.
											var pId = $scope.resourceAllocation[index].parentTask;
											// Remove current task and its
											// related sub tasks.
											$scope.removeRelatedTasks(index);

											if ($scope.resourceAllocation.length > 0) {

												/*
												 * Edit the parent tasks'
												 * details if the task being
												 * removed is its parent's last
												 * sub-task : Get the list of
												 * subtasks under the parent. If
												 * it is greater than 0 do
												 * nothing else set the isParent
												 * flag to false.
												 */
												var noOfSubtasks = $filter(
														"filter")
														(
																$scope.resourceAllocation,
																{
																	parentTask : pId
																}, true).length;
												if (noOfSubtasks === 0) {
													// Following attributes will
													// be reset
													var pTask = $filter(
															"filter")
															(
																	$scope.resourceAllocation,
																	{
																		id : pId
																	}, true)[0];
													pTask.isParent = false;
													pTask.name = wbsConstants.BLANK;
													pTask.startdate = wbsConstants.BLANK;
													pTask.endDate = wbsConstants.BLANK;
												}

												if (effortOfTaskRemoved !== wbsConstants.BLANK) {
													// update the parent task's
													// effort.
													commonHelper
															.getParentEffort(
																	pId,
																	(-1)
																			* effortOfTaskRemoved);
												}
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
						var subTasks = $filter("filter")
								(
										$scope.resourceAllocation,
										{
											parentTask : $scope.resourceAllocation[index].id
										}, true);
						if (subTasks.length === 0) {
							/*
							 * If it has no subtasks, update the start and end
							 * date for the other tasks which have the same
							 * resource as the current task being removed.
							 */
							$scope.changeResource(index, wbsConstants.BLANK,
									$scope.resourceAllocation[index].name);
						} else {
							angular.forEach(subTasks, function(obj, i) {
								/*
								 * Get the row-index of the task/subtask : Logic :
								 * say we need to delete the task with id :
								 * 1.12, then in order to get the row-index of
								 * the particular task being removed we count
								 * the number of tasks which are present above
								 * it in the task list. So, there may be 3 tasks
								 * above it in the list and we know the task id
								 * for all of them will be less than the current
								 * task. So, we get the index of the current
								 * task as 3 (index count starts from 0).
								 * 
								 */
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
						task.id = utility.getMaxId($scope.resourceAllocation,
								$scope.resourceAllocation[index].parentTask,
								$scope.resourceAllocation[index].level);
						var newTaskIndex;

						if ($scope.resourceAllocation[index].parentTask === -1) {
							newTaskIndex = $scope.resourceAllocation.length;
						} else {
							// Get the position of the Parent of the current
							// task being cloned.
							var indexOfParent = utility
									.findIndexOfTask(
											$scope.resourceAllocation[index].parentTask,
											$scope.resourceAllocation);
							// Get the number of existing descendants of the
							// parent task.
							var len = utility
									.getSubTasks(
											$scope.resourceAllocation[indexOfParent].parentTask,
											$scope.resourceAllocation[index].parentTask,
											$scope.resourceAllocation).length;

							newTaskIndex = indexOfParent + len + 1;

						}
						$scope.resourceAllocation.splice(newTaskIndex, 0, task);

						var cloneTaskIndex = task.id;

						/*
						 * get all subtasks(descendants) of the task being
						 * cloned using the id value of the tasks and sort them
						 * in ascending order of their task ids, so they make be
						 * inserted as is.
						 */
						var tasks = $filter("orderBy")
								(
										utility
												.getSubTasks(
														$scope.resourceAllocation[index].parentTask,
														$scope.resourceAllocation[index].id,
														$scope.resourceAllocation),
										'id');

						/*
						 * Regex to find the id of the task being cloned and
						 * then replacing that id with the id of the new task
						 * created after cloning. The regex will vary if the
						 * task being cloned is the top-most task
						 */
						var regex, regex0;
						if (task.parentTask === -1) {
							regex = new RegExp("^"
									+ $scope.resourceAllocation[index].id
									+ "(\.[1-9]\\d*)$", "gi");
							regex0 = new RegExp("^"
									+ $scope.resourceAllocation[index].id
									+ "(\\d+)?$", "gi");
						} else {
							regex = new RegExp("^"
									+ $scope.resourceAllocation[index].id
									+ "(\\d+)?$", "gi");
						}

						// Clone the subtasks and add to the task list.
						angular
								.forEach(
										tasks,
										function(obj, i) {
											var tmp = {};
											angular.copy(obj, tmp);

											var str = wbsConstants.BLANK
													+ tmp.id;
											tmp.id = parseFloat(str.replace(
													regex, cloneTaskIndex
															+ "$1"));

											if (tmp.parentTask !== -1) {
												tmpStr = wbsConstants.BLANK
														+ tmp.parentTask;
												/*
												 * If level 0 task is cloned,
												 * then its child tasks at level
												 * 1, need their parentTask to
												 * be replaced. So, for
												 * replacing parentTask,
												 * different regex(regex0) is
												 * required.
												 */
												tmp.parentTask = tmp.level === 1 ? parseFloat(tmpStr
														.replace(regex0,
																cloneTaskIndex
																		+ "$1"))
														: parseFloat(tmpStr
																.replace(
																		regex,
																		cloneTaskIndex
																				+ "$1"));
											}
											$scope.resourceAllocation.splice(
													++newTaskIndex, 0, tmp);
										});

						// Update the effort of the Parent task(s)(ancestor
						// tasks) of the task being cloned :
						if ($scope.resourceAllocation[index].effort !== wbsConstants.BLANK) {
							commonHelper
									.getParentEffort(
											$scope.resourceAllocation[index].parentTask,
											$scope.resourceAllocation[index].effort);
						}
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
							var effort = $scope.resourceAllocation[index].effort;

							// set the isParent flag for the parent task, and
							// clear fields
							// like effort, resource name , start and end date
							// which now depends on the subtasks.
							$scope.resourceAllocation[index].isParent = true;
							$scope.resourceAllocation[index].effort = wbsConstants.BLANK;
							$scope.resourceAllocation[index].name = wbsConstants.BLANK;

							var subTaskId = utility.getMaxId(
									$scope.resourceAllocation,
									$scope.resourceAllocation[index].id,
									subTaskLevel);
							var task = {
								id : subTaskId,
								taskDescription : subTaskId,
								name : wbsConstants.BLANK,
								effort : wbsConstants.BLANK,
								startDate : wbsConstants.BLANK,
								endDate : wbsConstants.BLANK,
								parentTask : $scope.resourceAllocation[index].id,
								level : subTaskLevel,
								isParent : false
							};

							// Get the number of sub-tasks(all descendants)
							// under the parent task.
							var len = utility
									.getSubTasks(
											$scope.resourceAllocation[index].parentTask,
											$scope.resourceAllocation[index].id,
											$scope.resourceAllocation).length;
							// add sub-task at the appropriate position, below
							// the existing subtasks of the parent task.
							$scope.resourceAllocation.splice(index + len + 1,
									0, task);

							// Update the ancestor tasks only if the 1st task is
							// being added to the current task
							if (len === 0) {
								commonHelper
										.getParentEffort(
												$scope.resourceAllocation[index].parentTask,
												(-1) * effort);
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
							var idOfCurrentTask = $scope.resourceAllocation[index].id;

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

								var hl = $filter("filter")($scope.resources, {
									name : rname
								}, true)[0].holidayList;
								// get the new start date of the task = next
								// available date for the new resource.
								$scope.resourceAllocation[index].startDate = $scope
										.getStartDate(rname, index);

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
										idOfCurrentTask, tempStartDate);

							} else {
								$scope.resourceAllocation[index].startDate = wbsConstants.BLANK;
								$scope.resourceAllocation[index].endDate = wbsConstants.BLANK;
							}

							if (!angular
									.equals(oldResource, wbsConstants.BLANK)) {
								// update the dates for the dependent tasks of
								// the OLD resource
								// tasks assigned to previous resource whose id
								// is greater than that of the current task.
								commonHelper.updateDependentTasks(oldResource,
										idOfCurrentTask, oldStartDate);
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

							var rname = $scope.resourceAllocation[index].name;
							var hl = $filter("filter")($scope.resources, {
								name : rname
							}, true)[0].holidayList;
							var effort = $scope.resourceAllocation[index].effort;
							$scope.resourceAllocation[index].endDate = utility
									.getWorkDays(
											utility
													.getFormattedDate($scope.resourceAllocation[index].startDate),
											effort, hl);

							var tempStartDate = utility.getWorkDays(
									$scope.resourceAllocation[index].endDate,
									1, hl);
							var idOfCurrentTask = $scope.resourceAllocation[index].id;

							// update only the tasks following this particular
							// task
							commonHelper.updateDependentTasks(rname,
									idOfCurrentTask, tempStartDate);

						} else {
							/*
							 * Though the resources are not assigned, we still
							 * update the effort of the parent task without
							 * changing the corresponding start and end dates
							 */
							commonHelper
									.getParentEffort(
											$scope.resourceAllocation[index].parentTask,
											($scope.resourceAllocation[index].effort - oldEffort));
						}
					};

					$scope.changeStartDate = function(index) {

						var rname = $scope.resourceAllocation[index].name;
						var hl = $filter("filter")($scope.resources, {
							name : rname
						}, true)[0].holidayList;
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
						var idOfCurrentTask = $scope.resourceAllocation[index].id;

						// update only the tasks following this particular task
						commonHelper.updateDependentTasks(rname,
								idOfCurrentTask, tempStartDate);

					};

					// computes the start date for a task against a particular
					// resource of name "rname"
					$scope.getStartDate = function(rname, index) {

						// get the list of existing allocated tasks of the
						// resource
						var allTasks = utility.getAllAssignedTasksAsc(
								$scope.resourceAllocation, rname, "id");
						// get the position of current task in the list of other
						// tasks assigned to this resource
						var indexOfCurrentTask = allTasks.length > 1 ? $scope
								.findTaskInList(allTasks,
										$scope.resourceAllocation[index].id)
								: 0;
						/*
						 * If not the current task is not the 1st task in the
						 * list, compute the new start date of the task
						 * according to the others tasks. else, being the 1st
						 * task of the resource, the start date for this task
						 * will be the joining date of the resource itself.
						 * 
						 */
						if (indexOfCurrentTask > 0) {
							var hl = $filter("filter")($scope.resources, {
								name : rname
							}, true)[0].holidayList;
							var endDateOfPreviousTask = allTasks[indexOfCurrentTask - 1].endDate;
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
/*							alasql('SELECT * FROM FILE(?, {sheetid:"' + sheetid
									+ '", headers:true})', [ event ], function(
									data) {
								$scope.importedData = data;
								
							});*/
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
								console.log($scope.importedData.length);
								
								if ($scope.importedData.length > 0) {
									var data = [];
									var row={};
									//var error = false;
									//var errorMessage = wbsConstants.BLANK;
									for(var i=0; i<$scope.importedData.length; i++){
									//angular.forEach($scope.importedData, function(row,
											//i) {
										row = $scope.importedData[i];
										// create a task with default setting.
										var task = {
												id : 1,
												taskDescription : wbsConstants.BLANK,
												name : wbsConstants.BLANK,
												effort : wbsConstants.BLANK,
												startDate : wbsConstants.BLANK,
												endDate : "",
												parentTask : -1,
												level : 0,
												isParent : false
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
											case "Name":
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
											}
										});
										
/*										if(task.taskDescription === wbsConstants.BLANK){
											error= true;
											errorMesssage = "Please provide description for all the tasks and sub-tasks.";
										}
										
										if(error){
											modalService.callModal(errorMessage, 
													null,
													null,
													{ok:true, cancel:false, yes:false, no:false});
											break;
										}else{*/
										console.log(task);
										var pId = utility.getParentTaskId(data,
												task.level);
										// If this task has some parent then set the
										// isParent flag of that parent to true.
										if (pId !== -1) {
											var pTask = $filter("filter")(data, {
												id : pId
											})[0];
											pTask.isParent = true;
										}
										task.id = utility.getMaxId(data, pId,
												task.level);
										task.parentTask = pId;
										data.push(task);
										//}
									}
									//);
									// return data;
									// console.log(data);
									if(!error){
										$scope.resourceAllocation = data;
										Data.setResourceAllocation(data);
										$scope.importedData = [];
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
								}, null, {
									ok : false,
									cancel : false,
									yes : true,
									no : true
								});
					};

					$scope.exportData = function() {

						// console.log($scope.resourceAllocation);

						alasql(
								'SELECT (CASE WHEN level=0 THEN taskDescription ELSE "" END) AS [Task Description],'
										+ ' (case when level=1 then taskDescription else "" end) AS [Sub Task - 1],'
										+ ' (case when level=2 then taskDescription else "" end) AS [Sub Task - 2],'
										+ ' (case when level=3 then taskDescription else "" end) AS [Sub Task - 3],'
										+ ' (case when level=4 then taskDescription else "" end) AS [Sub Task - 4],'
										+ ' name AS [Name], '
										+ 'effort AS [Effort], '
										+ 'startDate AS [Start Date], '
										+ 'endDate AS [End Date] '
										+ 'INTO XLSX("wbs.xlsx",{sheetid:"tasks",headers:true}) '
										+ 'FROM ?',
								[ $scope.resourceAllocation ]);

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
									var endofRange = "I" + range;
									// console.log(startofRange + ":" +
									// endofRange);

									var params = {
										spreadsheetId : spreadsheetId,
										range : sheetName
												+ wbsConstants.G_READ_RANGE
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
								'Name', 'Effort', 'Start Date', 'End Date' ];
						data.push(header);
						angular
								.forEach(
										$scope.resourceAllocation,
										function(value, i) {
											var row = [];

											for (var i = 0; i <= wbsConstants.MAX_TASK_SUBLEVEL; i++) {
												if (i != value.level) {
													row.push("");
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

											data.push(row);
										});
						console.log(data);
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

					//Format data read from 
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
												isParent : false
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

											var pId = utility.getParentTaskId(
													data, task.level);
											//If this task has some parent then set the isParent flag of that parent to true.
											if (pId !== -1) {
												var pTask = $filter("filter")(
														data, {
															id : pId
														})[0];
												pTask.isParent = true;
											}
											task.id = utility.getMaxId(data,
													pId, task.level);
											task.parentTask = pId;

											data.push(task);
										});
						//console.log(data);
						$scope.resourceAllocation = data;
						Data.setResourceAllocation(data);
						$scope.$apply();
					};

				});