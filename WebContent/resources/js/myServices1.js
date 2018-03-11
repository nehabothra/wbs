app.factory("Data",function(){
	
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
		  ]        
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
				
			}else{
				console.log("local storage not supported");
			}			
			
		},
		
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


app.factory("utility", function($filter, $http, wbsConstants){

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
		var pos = -1;
		for(var i=0 ;i< list.length; i++){
			if(list[i].id === tid)
				{
				pos = i;
				break;
				}
		}
		return pos;
	} ;
	
	//get maximum id of elements in input list
	/*******************HAS BEEN EDITED**************************/
	utility.getMaxId = function(taskList){
		var max = 0;
		for(var i=0; i<taskList.length; i++){
			if(max < taskList[i].id){
				max = taskList[i].id;
			}
		}
		
		return max+1;
	};
	
	utility.updatePidForClonedTasks = function(tasks, start, end, pid, plevel){
		for(var i= start; i<=end; i++){
			if(tasks[i].level - plevel === 1){
				tasks[i].parentTask = pid;
			}else if (tasks[i].level - plevel > 1 && tasks[i].level - tasks[i-1].level === 0){
				tasks[i].parentTask = tasks[i-1].parentTask;
			}else if (tasks[i].level - plevel > 1 && tasks[i].level - tasks[i-1].level === 1){
				tasks[i].parentTask = tasks[i-1].id;
			}
		}
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
	utility.getParentTaskId = function(list, level, index){
		var pid = -1;
		if(index > 0){
			for(var i = index-1; i>=0 ; i--){
				if(list[i].level === level){
					pid = list[i].parentTask;
					break;
				}
				else if(level-list[i].level === 1 && level > 0){
					pid = list[i].id;
					break;
				}
			}
		}
		return pid;
	};

	utility.ExcelDateToJSDate = function(serial){
        var utc_days = Math.floor(serial - 25569);
        var utc_value = utc_days * 86400;
        var date_info = new Date(utc_value * 1000);

        return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), 0, 0, 0);
		
	};
	
	utility.updateTotalSubtasks = function(tasks, id, increment){
		if(id !== -1){
			var task = $filter("filter")(tasks, {id : id}, true);
			task[0].totalSubtasks += increment;
			utility.updateTotalSubtasks(tasks, task[0].parentTask, increment);
		}
	};
	
	utility.isHoliday = function(checkDate, hl){
						if (checkDate.getDay() != 0
								&& checkDate.getDay() != 6
								&& utility.indexOfDateInList(hl, checkDate) == -1
								&& utility.indexOfDateInList(publicHolidays,
										checkDate) == -1) {
							return false;
						}
							return true;
	};
	
	return utility;
});


