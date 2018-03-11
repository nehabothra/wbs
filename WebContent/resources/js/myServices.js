app.factory("Data",function(){
	
	var data = {
			resources : [],
          
		   resourceAllocation : [	
		                         	{id : 1, taskDescription : "", name: "", effort:"", startDate: "", endDate:"", parentTask : -1, level : 0, isParent : false}
			                       ]        
	};
	
	return {
		
		getResources : function(){
			return data.resources;
		},
		
		setResources : function(updatedResources){
			data.resources   = updatedResources;
		},
		
		addResource : function(resource){
			data.resources.push(resource);
		},
		
		removeResource : function(index){
			data.resources.splice(index,1);
		},
		
		getResourceAllocation : function(){
			return data.resourceAllocation;
		},	
		
		setResourceAllocation : function(updatedResourceAllocation){
			data.resourceAllocation = updatedResourceAllocation;
		},
		
		addTask : function(task){
			data.resourceAllocation.push(task);
		},
		
		removeTask : function(){
			data.resourceAllocation.splice(index,1);
		},
		
		resetTasks : function(){
			   data.resourceAllocation = []; 
		},
		
		resetResources : function(){
			data.resources = [];
		}
		
	};
});


app.factory("utility", function($filter, $http){

	var publicHolidays = [];
	
	//Hard coding public holidays as NRIFT list of holidays
	publicHolidays.push(new Date(2017,11,25,0,0,0,0));
	publicHolidays.push(new Date(2018,0,26,0,0,0,0));
	publicHolidays.push(new Date(2018,1,1,0,0,0,0));
	publicHolidays.push(new Date(2018,2,13,0,0,0,0));
	publicHolidays.push(new Date(2018,3,14,0,0,0,0));
	publicHolidays.push(new Date(2018,4,1,0,0,0,0));
	publicHolidays.push(new Date(2018,5,26,0,0,0,0));
	publicHolidays.push(new Date(2018,6,3,0,0,0,0));
	publicHolidays.push(new Date(2018,7,15,0,0,0,0));
	publicHolidays.push(new Date(2018,8,27,0,0,0,0));
	publicHolidays.push(new Date(2018,8,28,0,0,0,0));	
	publicHolidays.push(new Date(2018,8,29,0,0,0,0));
	publicHolidays.push(new Date(2018,9,2,0,0,0,0));
	publicHolidays.push(new Date(2018,9,20,0,0,0,0));
	publicHolidays.push(new Date(2018,11,25,0,0,0,0));	
	
/*	 $http.get("https://holidayapi.com/v1/holidays?key=80cae3f6-e58c-44d4-b43d-e7d230749dad&country=IN&year=2016&pretty=true&public=true")
	  .then(function(response) {
	      var holidayList = response.data["holidays"];
	      angular.forEach(holidayList, function(value, key){
	    	  var date = new Date(key);
	    	  date.setYear(2017);
	    	  date.setHours(0,0,0,0);
	    	  publicHolidays.push(date);
	      });
	      console.log(publicHolidays);
	  });*/
	
	var utility = {};
	
	/* Find the position of a task by its Id. All the tasks placed above it 
	 * in the list will have a numerically lesser task-id.
	 */
	/*******************HAS BEEN EDITED**************************/
	utility.findIndexOfTask = function(tid, list){
		
/*		var tasks = $filter("filter")(list, {id : tid}, function(actual, expected){
			if(actual < expected){
				return true;
			}else{
				return false;
			}
		}, true);*/
		var pos = -1;
		for(var i=0 ;i< list.length; i++){
			if(list[i].id === tid)
				{
				pos = i;
				break;
				}
		}
		return pos;
		//return tasks.length;
	} ;
	
	//get maximum id of elements in input list
	/*******************HAS BEEN EDITED**************************/
	utility.getMaxId = function(taskList, pTaskId, level){
		var max = -1;
		
/*		 get the tasks filtered as per the parent task id : pTaskId
		 * Amongst those tasks(having the same parent id), get the max id.
		 
		var tasks = $filter("filter")(taskList, {parentTask : pTaskId}, true);
		
		if(tasks.length > 0){
			angular.forEach(tasks, function(obj, i){
				if(max < obj.id){
					max = obj.id;
				}
			});
			max = parseFloat((max + 1/Math.pow(10, level)).toFixed(level)) ;
		}else{
			max = parseFloat(((pTaskId == -1 ? 0 : pTaskId) + 1/Math.pow(10, level)).toFixed(level)) ;
		}*/
		
		for(var i=0; i<taskList.length; i++){
			if(max < taskList[i].id){
				max = taskList[i].id;
			}
		}
		
		return max+1;
	};
		
	//convert the input date string(yyyy-MM-dd) into date object
	utility.formatString = function(format) {
	   
	    var day   = parseInt(format.substring(8,10));
	    var month  = parseInt(format.substring(5,7));
	    var year   = parseInt(format.substring(0,4));
	    var date = new Date(year, month-1, day);
	    return date;
	};
	
	//Change the display format of the input date to the target format.
	utility.changeDateFormat = function(date, targetFormat){
		return $filter("date")(date, targetFormat);
	};
	
	//Add days to input date object. 
	utility.addDays = function(date, days){
		var tpmDate = new Date(date);
		tpmDate.setDate(tpmDate.getDate() + days);
		return tpmDate;
	};		
	
	/*
	 * Get the list of tasks assigned to a 
	 * resource rname in asc order of id attribute 
	 */
	utility.getAllAssignedTasksAsc = function(list, rname, orderByclause){
		var taskList = $filter("filter")(list, {name : rname}, true);
		return $filter("orderBy")(taskList, orderByclause); 
		
	};
	
	/*
	 * Returns all the sub-tasks(descendants) of the task 
	 */
	/***********************has been edited************************/
	utility.getSubTasks = function(parentId, taskId, list){

		var regex;
		if(parentId === -1){
			regex = new RegExp("^" + taskId + "(\.[1-9]\\d*)$", "gi");
		}else{
			regex = new RegExp("^" + taskId + "(\\d+)$", "gi");
		}
		
		var tasks  = $filter("filter")(list, 
						{id : taskId}, function(actual, expected){
									var id = "" + actual;
									if(id.match(regex) !== null){
										return true;
									}else{
										return false;
									}
								});		
		
		return tasks;
		
	};
	
	/*
	 * Will perform whatever formatting is required on the 
	 * input date object or date string 
	 */
	utility.getFormattedDate = function(date){
		return utility.addDays(date, -1);
	};
	
	/*
	 * Returns the end date of the task based on the :
	 * 1. input start date as per the allocated resource : date 
	 * 2. the effort estimated
	 * 3. the holiday list of the resource allocated
	 * while computing the end date weekends(saturday and sunday), holidays of the resource 
	 * & public holidays are considered.
	 * 
	 */
	utility.getWorkDays = function(date, effort, hl){
		var tmp = date;
		if(effort > 0){
			
			if(angular.isUndefined(hl)){
				hl = [];
			}
			while(effort > 0){
				tmp = utility.addDays(tmp, 1);
				if(tmp.getDay() != 0 && tmp.getDay() != 6 && utility.indexOfDateInList(hl, tmp) == -1 && utility.indexOfDateInList(publicHolidays, tmp) == -1){	
					effort-- ;
				}
			}
			return tmp;
		}else{
			return utility.addDays(tmp, 1); 
		}
		
	};

	/*
	 * Returns index of a date in an 
	 * array of dates 
	 */
	utility.indexOfDateInList = function(list, date){
		var index = -1;
		for(var i = 0; i<list.length; i++){
			if(list[i].getTime() === date.getTime()){
				index = i;
				break;
			}
		}
		return index;
	};
	
	
	
	/*
	 * The new task will be added at the end of the list. So, to find its parent we   
	 * move up the array containing other rows. The nearest row having the same level will
	 * have the same parent as well. 
	 * 
	 * For e.g : 
	 * 
	 * 
	 * 
	 * 
	 */
	utility.getParentTaskId = function(list, level){
		var pid = -1;
		var len = list.length;
		if(len > 0){
			for(var i = len-1; i>=0 ; i--){
				if(list[i].level === level){
					pid = list[i].parentTask;
					break;
				}
				//Reached topmost level
				if(list[i].level === 0){
					break;
				}
			}
			if(pid === -1 && level > 0){
				pid = list[len-1].id;
			}
		}
		return pid;
	};

	utility.ExcelDateToJSDate = function(serial){
        var utc_days = Math.floor(serial - 25569);
        var utc_value = utc_days * 86400;
        var date_info = new Date(utc_value * 1000);

/*        var fractional_day = serial - Math.floor(serial) + 0.0000001;

        var total_seconds = Math.floor(86400 * fractional_day);

        var seconds = total_seconds % 60;

        total_seconds -= seconds;

        var hours = Math.floor(total_seconds / (60 * 60));
        var minutes = Math.floor(total_seconds / 60) % 60;*/

        return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), 0, 0, 0);
		
	};
	
	return utility;
});

app.factory("commonHelper", function(Data, utility, $filter){
	
	var commonhelper = {};
	
	//update the appropriate tasks of resource with name 'rname'
	commonhelper.updateDependentTasks = function(rname, idOfCurrentTask, startDate){
		
		var resourceAllocation = Data.getResourceAllocation();
		var resources = Data.getResources();
			
		var allTasks = utility.getAllAssignedTasksAsc(resourceAllocation, rname, "id"); 
		var hl = $filter("filter")(resources, {name : rname}, true)[0].holidayList;
		commonhelper.updateTasks(allTasks, idOfCurrentTask, startDate, hl);
		
	};

	//update the start and end dates of the tasks based on some condition.
	commonhelper.updateTasks = function(taskList, idOfCurrentTask, tempStartDate, hl){

		//will hold the list of parent tasks and Modify the start and end date of its parent task :
		var parentTaskList = [];
		
		angular.forEach(taskList, function(obj, i){
			if(obj.id > idOfCurrentTask){

				//new start date of the task
				obj.startDate = tempStartDate;
				
				//get the end date for this task
				obj.endDate = utility.getWorkDays(utility.getFormattedDate(tempStartDate), obj.effort, hl);
				
				//get the next available working day of the resource after this task is finished.
				tempStartDate = utility.getWorkDays(obj.endDate, 1, hl);				
				
				}
				//add the parent task id if not in the list already :
				if(parentTaskList.indexOf(obj.parentTask) === -1) {
					parentTaskList.push(obj.parentTask); 
				}
			});		
		
		//Update the dates for all the tasks present in the above list : 
		angular.forEach(parentTaskList, function(obj, i){
			commonhelper.updateParent(obj);
			
		});
		
	};	
	
	//update the start and end dates of the tasks based on some condition
	commonhelper.updateParent = function(pindex){
		var resourceAllocation = Data.getResourceAllocation();
		if(pindex !== -1){
			//1. get the parent task :
			var pTask = $filter("filter")(resourceAllocation, {id : pindex}, true)[0]; 
			//2. get all tasks having same parent task :
			var siblingTasks = $filter("filter")(resourceAllocation, {parentTask : pindex}, true); 
			//3. get the start and end date and effort for the parent task from amongst the sibling tasks :
			commonhelper.getStartEndDateForParent(pTask, siblingTasks);
			//enter recursion to update parents.
			commonhelper.updateParent(pTask.parentTask);
		}
	};	
	
	//update the start and end dates and effort of the tasks based on some condition
	commonhelper.getStartEndDateForParent = function(task, siblingTasks){
		var minStartDate = siblingTasks[0].startDate;
		var maxEndDate = siblingTasks[0].endDate;
		var finEffort = 0;

		angular.forEach(siblingTasks, function(obj, i){
			//For the start date
			if((minStartDate === "") || (obj.startDate < minStartDate && obj.startDate !== "")){
				minStartDate = obj.startDate;
			}
			//For the end Date
			if(obj.endDate > maxEndDate){
				maxEndDate = obj.endDate;
			}		
			//For effort
			finEffort = finEffort + obj.effort;
			
		});			
		
		task.startDate = minStartDate;
		task.endDate = maxEndDate;
		task.effort = finEffort;
	};
	
	
	//update the start and end dates of the tasks based on some condition
	commonhelper.getStartDateForParent = function(siblingTasks){

		var minStartDate = siblingTasks[0].startDate;
		angular.forEach(siblingTasks, function(obj, i){
				if((minStartDate === "") || (obj.startDate < minStartDate && obj.startDate !== "")){
					minStartDate = obj.startDate;
				}
			});			
		return minStartDate; 
	};
	
	//update the start and end dates of the tasks based on some condition
	commonhelper.getEndDateForParent = function(siblingTasks){

		var maxEndDate = siblingTasks[0].endDate;
		angular.forEach(siblingTasks, function(obj, i){
				if(obj.endDate > maxEndDate){
					maxEndDate = obj.endDate;
				}
			});			
		return maxEndDate; 
	};
	
	/*
	 * Update the effort of parents along a single chain of descendants.
	 * for e.g, change in the effort of task with id 1.12 will change the effort of following :
	 * 	1.12 -> 1.1 -> 1
	 * 
	 */  
	commonhelper.getParentEffort = function(pIndex, changeInEffort){
		
		if(pIndex !== -1){
		var resourceAllocation = Data.getResourceAllocation();
		var pTask =  $filter("filter")(resourceAllocation, {id : pIndex}, true)[0];
		pTask.effort = (pTask.effort === "" ? 0 : pTask.effort) + changeInEffort;
		commonhelper.getParentEffort(pTask.parentTask, changeInEffort);
		}
	};
	
	return commonhelper;
	
});
