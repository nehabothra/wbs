/**
 *  this is a helper class for "Task" related operations,
 *  like updating the start-end date, updating the number of subtasks and so on.
 */
app.factory("commonHelper", function(Data, utility, $filter, wbsConstants){
	
	var commonhelper = {};
	
	/*
	 * update the appropriate tasks of resource with name 'rname'
	 * Will take the index of the task modified and update the details
	 * of tasks which appear after the modified task in the task list. 
	 * 
	 */
	commonhelper.updateDependentTasks = function(rname, indexOfCurrentTask, startDate){
		
		var resourceAllocation = Data.getResourceAllocation();
		var resources = Data.getResources();
			
		var hl = $filter("filter")(resources, {name : rname}, true)[0].holidayList;
		commonhelper.updateTasks(resourceAllocation, rname, indexOfCurrentTask, startDate, hl);
		
	};

	//update the start and end dates of the tasks based on some condition.
	commonhelper.updateTasks = function(taskList, rname, index, tempStartDate, hl){

		//will hold the list of parent tasks and Modify the start and end date of its parent task :
		var parentTaskList = [];
		
		angular.forEach(taskList, function(obj, i){
			//i.e, the task has same resource and comes after the modified task(in terms of position) in the task list.
			if(obj.name === rname && i > index){

				//new start date of the task
				obj.startDate = tempStartDate;
				
				//get the end date for this task
				obj.endDate = utility.getWorkDays(utility.getFormattedDate(tempStartDate), obj.effort, hl);
				
				//get the next available working day of the resource after this task is finished.
				tempStartDate = utility.getWorkDays(obj.endDate, 1, hl);				
				
				//add the parent task id if not in the list already :
				if(obj.parentTask !== -1 && parentTaskList.indexOf(obj.parentTask) === -1) {
					parentTaskList.push(obj.parentTask); 
				}
				}
			});		
		
		//Update the dates for all the tasks present in the above list : 
		angular.forEach(parentTaskList, function(value, i){
			commonhelper.updateParent(value);
			
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
		var minStartDate = wbsConstants.BLANK;
		var maxEndDate = wbsConstants.BLANK;
		var finEffort = 0;

		angular.forEach(siblingTasks, function(obj, i){
			//For the start date
			if(obj.startDate !== wbsConstants.BLANK && (minStartDate === wbsConstants.BLANK  || obj.startDate < minStartDate )){
				minStartDate = obj.startDate;
			}
			//For the end Date
			if(obj.endDate !== wbsConstants.BLANK && (maxEndDate === wbsConstants.BLANK || obj.endDate > maxEndDate)){
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
	
	// computes the start date for a task against a particular
	// resource of name "rname"
	commonhelper.getNextAvailableDate = function(rname, index, resource, tasksList) {

		var indexOfLastTaskWithSameResource = -1;		
		angular.forEach(tasksList, function(obj, i){
			if(i < index && obj.name === rname){
				indexOfLastTaskWithSameResource = i;
			}
		})	;								
				
		/*
		 * If not the current task is not the 1st task in the
		 * list, compute the new start date of the task
		 * according to the others tasks. else, being the 1st
		 * task of the resource, the start date for this task
		 * will be the joining date(if not a holiday) of the resource itself.
		 * 
		 */
		var hl = resource.holidayList;
		if (indexOfLastTaskWithSameResource > -1) {
			var endDateOfPreviousTask = tasksList[indexOfLastTaskWithSameResource].endDate;
			return utility.getWorkDays(endDateOfPreviousTask,
					1, hl);
		} else {
			return utility.isHoliday(resource.jd, hl) ? utility.getWorkDays(resource.jd, 1, hl) : resource.jd;
		}
	};	
	
	commonhelper.getResourceNames = function(resources){
		var names = [];
		for(var i=0;i< resources.length; i++){
			names.push(resources[i].name);
		}
		return names;
	};
	
	commonhelper.getResourceTaskCount = function(resources, tasks){
		var names = commonhelper.getResourceNames(resources);
		var count = [names,[]];
		var totalCount = 0;
		for(var i=0;i<names.length;i++){
			var taskcount = $filter("filter")(tasks,{name : names[i]}, true).length;
			count[1][i]=taskcount;
			totalCount += taskcount;
		}
		if(totalCount === 0){
			count[1] = [];
		}
		return count;
	};
	
	commonhelper.getTaskNames = function(tasks){
		var names = [];
		for(var i=0;i< tasks.length; i++){
			names.push(tasks[i].taskDescription);
		}
		return names;
	};
	

	commonhelper.getTaskEffortEstimate = function(tasks){
		var parentTasks = $filter("filter")(tasks,{level : 0}, true);
		var effort = [commonhelper.getTaskNames(parentTasks),[]];
		var totalEffort = 0;
		for(var i=0;i<parentTasks.length;i++){
			var effortEstimate = parentTasks[i].effort;
			effort[1][i]=effortEstimate;
			totalEffort += effortEstimate;
		}
		if(totalEffort === 0){
			effort[1]=[];
		}
		return effort;
	};	
	
	return commonhelper;
	
});