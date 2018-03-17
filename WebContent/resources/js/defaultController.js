/**
 *  Shows the charts for tasks allocated and the estimate for different tasks
 */
app.controller("defaultController", function($scope, Data, commonHelper){
	  
	$scope.getResourceText = function(){
			return 'Resource Vs Tasks';
	};
	
	$scope.getTaskText = function(){
			return 'Task Vs Estimate';
	};

	$scope.resourceDetails = commonHelper.getResourceTaskCount(Data.getResources(), Data.getResourceAllocation());
	  $scope.resourcelabels = $scope.resourceDetails[0]; 
	  $scope.resourcedata =  $scope.resourceDetails[1]; 
	  $scope.resourceoptions = {
			  "title":{
				  display : true, 
				  text: $scope.getResourceText() ,
				  fontSize : 20,
				  fontFamily :'Courier New'
					  
			  }
	  };

	  $scope.taskDetails = commonHelper.getTaskEffortEstimate(Data.getResourceAllocation());
	  $scope.tasklabels = $scope.taskDetails[0];
	  $scope.taskdata = $scope.taskDetails[1];
	  $scope.taskoptions = {
			  "title":{
				  display : true, 
				  text: $scope.getTaskText(),
				  fontSize : 20,
				  fontFamily : 'Courier New'
					  
			  }
	  };	  
	  
	  

});