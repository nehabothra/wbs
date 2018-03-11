/**
 * 
 */
var app = angular.module("WBS", ["ngRoute", "xlsx-model", "ui.bootstrap"]);

app.config(function($routeProvider){
	
	$routeProvider
		.when("/",{
			templateUrl : "defaultView.html"
		})
		.when("/manageResources",{
			templateUrl : "resource.html",
			controller : "resourceController"
		})
		.when("/manageTasks",{
			templateUrl : "task.html",
			controller : "taskController"
		});
	
})
.run(function(Data){
	
	Data.init();
	
});