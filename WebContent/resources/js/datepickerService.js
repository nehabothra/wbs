/**
 * 
 */
/**
 * Service to call modals
 */
app.factory("datepickerService",function($uibModal){
	var modalService = {};
	
	modalService.callModal = function(message, successCallback, errorCallback, params){
		
	    var modalInstance = $uibModal.open({
	        animation: true,
	        ariaLabelledBy: 'modal-title',
	        ariaDescribedBy: 'modal-body',
	        templateUrl: 'resourceModal.html',
	        controller : function($uibModalInstance){
	        	var modalCtrl = this;  
	        	modalCtrl.ok = function () {
	        		    $uibModalInstance.close();
	        		  };
	        	modalCtrl.cancel = function () {
	        		    $uibModalInstance.dismiss('cancel');
	        		  };
  	        	modalCtrl.yes = function () {
	        		    $uibModalInstance.close();
	        		  };
	        	modalCtrl.no = function () {
	        		    $uibModalInstance.dismiss('cancel');
	        		  };
	        		  
	            modalCtrl.modalContent =  message;
	        	modalCtrl.okButton =  params.ok;
	        	modalCtrl.cancelButton =  params.cancel;
	        	modalCtrl.yesButton =  params.yes;
	        	modalCtrl.noButton =  params.no;
	        	modalCtrl.footerShow = modalCtrl.okButton
										|| modalCtrl.cancelButton || modalCtrl.yesButton
										|| modalCtrl.noButton;
	        	
	        },
	        controllerAs: 'modalCtrl'	        
	      });

	    modalInstance.result.then(function () {
	    	//when user clicks on ok 
	    	if(angular.isDefined(successCallback) && successCallback !== null){
	    		 successCallback();
	    		 }
        }, function () {
        	//when user clicks on cancel
	    	if(angular.isDefined(errorCallback) && errorCallback !== null){
	    		 errorCallback();
	    		 }
        });
	};
	
	return modalService;
});