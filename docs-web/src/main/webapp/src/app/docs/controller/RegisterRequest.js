'use strict';

/**
 * Register request controller.
 */
angular.module('docs').controller('RegisterRequest', function($scope, $uibModalInstance, Restangular, $dialog, $translate) {
  $scope.user = {};
  
  // Function to submit the registration request
  $scope.submitRequest = function() {
    Restangular.one('user/request').put({
      username: $scope.user.username,
      password: $scope.user.password,
      email: $scope.user.email
    }).then(function() {
      $uibModalInstance.close();
      
      // Show success message
      var title = $translate.instant('register.request.success_title');
      var msg = $translate.instant('register.request.success_message');
      var btns = [{result: 'ok', label: $translate.instant('ok'), cssClass: 'btn-primary'}];
      $dialog.messageBox(title, msg, btns);
    }, function(data) {
      // Show error message depending on the error type
      var errorKey = 'register.request.error.default';
      if (data.data.type === 'AlreadyExistingUsername') {
        errorKey = 'register.request.error.already_exists';
      } else if (data.data.type === 'ValidationError') {
        errorKey = 'register.request.error.validation';
      }
      
      var title = $translate.instant('register.request.error_title');
      var msg = $translate.instant(errorKey);
      var btns = [{result: 'ok', label: $translate.instant('ok'), cssClass: 'btn-primary'}];
      $dialog.messageBox(title, msg, btns);
    });
  };
  
  // Function to cancel the request
  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };
}); 