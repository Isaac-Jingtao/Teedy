'use strict';

/**
 * Settings user request page controller.
 */
angular.module('docs').controller('SettingsUserRequest', function($scope, $state, Restangular, $dialog, $translate) {
  // Load user requests
  $scope.loadRequests = function() {
    Restangular.one('user/request').get().then(function(data) {
      $scope.requests = data.requests;
    });
  };
  
  $scope.loadRequests();
  
  // Approve a user request
  $scope.approve = function(request) {
    var title = $translate.instant('settings.user.request.approve_title');
    var msg = $translate.instant('settings.user.request.approve_message', { username: request.username });
    var btns = [
      { result:'cancel', label: $translate.instant('cancel') },
      { result:'ok', label: $translate.instant('ok'), cssClass: 'btn-primary' }
    ];
    
    $dialog.messageBox(title, msg, btns, function(result) {
      if (result === 'ok') {
        Restangular.one('user/request/' + request.id + '/approve').post().then(function() {
          $scope.loadRequests();
        });
      }
    });
  };
  
  // Reject a user request
  $scope.reject = function(request) {
    var title = $translate.instant('settings.user.request.reject_title');
    var msg = $translate.instant('settings.user.request.reject_message', { username: request.username });
    var btns = [
      { result:'cancel', label: $translate.instant('cancel') },
      { result:'ok', label: $translate.instant('ok'), cssClass: 'btn-primary' }
    ];
    
    $dialog.messageBox(title, msg, btns, function(result) {
      if (result === 'ok') {
        Restangular.one('user/request/' + request.id + '/reject').post().then(function() {
          $scope.loadRequests();
        });
      }
    });
  };
}); 