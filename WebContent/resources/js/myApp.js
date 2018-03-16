/**
 * 
 */
var app = angular.module("WBS", ["ngRoute", "xlsx-model", "ui.bootstrap","chart.js"]);

app.config(function($routeProvider){
	
	$routeProvider
		.when("/manageResources",{
			templateUrl : "resource.html",
			controller : "resourceController"
		})
		.when("/manageTasks",{
			templateUrl : "task.html",
			controller : "taskController"
		})
		.otherwise({
			templateUrl : "defaultView.html",
			controller: "defaultController"
		});
	
})
.run(function(Data){
	//load the app with any existing data present in browser local storage
	Data.init();
	
});