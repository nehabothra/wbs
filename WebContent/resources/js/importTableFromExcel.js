app.factory("importFromExcel", function($filter, Data, utility, renderMyData){
	
	var importFromExcel = {};
	
	importFromExcel.importFile = function(efiles, attrs, callback){
		
        var readOpts = {
                type: 'binary'
            };
        var data = {};
        var headerVal = 0;
        if(attrs.getNamedItem("header").value !== null){
        	headerVal = parseInt(attrs.getNamedItem("header").value);
        }
        //var headerVal = parseInt(attrs.getNamedItem("header").value);
        var sheetName = attrs.getNamedItem("sheetName").value;
        
        var reader = new FileReader();
        reader.onload = function(
            file) {
            var wb = XLSX
                .read(
                    file.target.result,
                    readOpts);
           /* angular
                .forEach(
                    wb.SheetNames,
                    function(
                        name) {*/
            sheetName = 'Sheet1';
                        data = XLSX.utils
                            .sheet_to_json(wb.Sheets[sheetName],{header:headerVal});
                  /*  });*/
/*            modelSetter(
                scope,
                data);
            scope
                .$apply();*/
            
            callback(renderMyData.parseData(data, sheetName, headerVal)); 
            
            
        };
        return reader
            .readAsBinaryString(efiles.files[0]);
		
	};
	
	return importFromExcel;
	
});

app.factory("renderMyData", function(utility, $filter){
	
	var renderMydata = {};
	
	renderMydata.parseData = function(sheetData, sheetName, headerVal){
	
		var parsedData = {};
		if(angular.equals(sheetName, 'tasks')){
			parsedData = renderMydata.parseTasks(sheetData, headerVal);
		}else if(angular.equals(sheetName, 'resources')){
			parsedData = renderMydata.parseResources(sheetData);
		}else {
			parsedData = renderMydata.parseTasks(sheetData, headerVal);
		}
	
		return parsedData;
	};
	
	renderMydata.parseTasks = function(sheetData, headerVal){
		var data = [];
		
		angular.forEach(sheetData, function(row, i){
			
			//if(i >= headerVal){
			//create a task with default setting.
			var task = {id : 1, taskDescription : "", name: "", effort:"", startDate: "", endDate:"", parentTask : -1, level : 0, isParent : false};
			
			angular.forEach(row, function(j, index){
				
				switch(index){
					case 0: 
					case 1:
					case 2:
					case 3:
					case 4:
						
						if(row[index] !== null){
							task.level = index;
							task.taskDescription = j;
						}
						
						break;
					case 5:
						task.name = j;
						break;
					case 6:
						task.effort = parseInt(j);
						break;
					case 7:
						if(j !== "" && j !== null){
							task.startDate = new Date(j);
						}
						break;
					case 8:
						if(j !== "" && j !== null){
							task.endDate = new Date(j);
						}
						break;
				}
			});
			
				var pId = utility.getParentTaskId(data, task.level);
				//If this task has some parent then set the isParent flag of that parent to true.
				if(pId !== -1){
					var pTask = $filter("filter")(data, {id : pId})[0];
					pTask.isParent = true;
				}
				task.id = utility.getMaxId(data, pId, task.level);
				task.parentTask = pId; 
				data.push(task);
			//}
		});
		return data;
	};
	
	renderMydata.parseResources = function(sheetData){
		
		var data = [];
		
		angular.forEach(sheetData, function(row, i){
			
			if(i > 0){
				
			//create a task with default setting.
			var resource = {name:"", jd: "", holidayList: []};
			var duplicate = false;
			angular.forEach(row, function(j, index){
				switch(index){
					case 0: 
						if($filter("filter")(data, {name : j}).length === 0){
							resource.name = j;
						}else{
							duplicate = true;
						}
						break;
					case 1:
						if(j !== "" && j !== null && !duplicate){
							resource.jd = new Date(j);
						}
						break;
					case 2:
						if(!duplicate){
							var list = j.split(",");
							for(var z = 0; z<list.length; z++){
								resource.holidayList.push(new Date(list[z]));
							}
						}
						break;
				}
			});
			
			data.push(resource);
			}
		});
		return data;
	};	
	
	
	return renderMydata;
	
});