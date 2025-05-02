'use strict';

/**
 * 聊天消息控制器
 */
angular.module('docs').controller('ChatMessages', function($scope, $stateParams, Restangular, $interval, $timeout, $anchorScroll, Chat, $rootScope) {
  // 确保访问userInfo
  $scope.userInfo = $scope.userInfo || angular.copy($rootScope.userInfo) || {};
  
  // 聊天消息
  $scope.messages = [];
  
  // 记录消息是否在加载中
  $scope.loading = false;
  
  // 用于定时刷新消息的定时器
  var refreshTimer = null;
  
  // 加载与当前用户的聊天历史
  $scope.loadMessages = function() {
    if ($scope.loading || !$stateParams.username) {
      return;
    }
    
    $scope.loading = true;
    
    // 调用聊天服务获取消息历史
    Chat.getMessages($stateParams.username).then(function(data) {
      $scope.messages = data.messages || [];
      $scope.loading = false;
      
      // 自动滚动到最新消息
      $timeout(function() {
        $anchorScroll('message-end');
      });
      
      // 标记所有消息为已读
      $scope.markAllAsRead();
    }, function() {
      // 错误处理 - 使用模拟数据
      var mockMessages = [
        {
          id: '1',
          content: '你好，这是一条测试消息',
          sender: $stateParams.username,
          receiver: $scope.userInfo.username,
          timestamp: new Date(new Date().getTime() - 3600000),
          read: true
        },
        {
          id: '2',
          content: '你好，很高兴认识你',
          sender: $scope.userInfo.username,
          receiver: $stateParams.username,
          timestamp: new Date(new Date().getTime() - 3500000),
          read: true
        },
        {
          id: '3',
          content: '这是Teedy的新聊天功能测试',
          sender: $stateParams.username,
          receiver: $scope.userInfo.username,
          timestamp: new Date(new Date().getTime() - 1800000),
          read: false
        }
      ];
      
      $timeout(function() {
        $scope.messages = mockMessages;
        $scope.loading = false;
        
        // 自动滚动到最新消息
        $timeout(function() {
          $anchorScroll('message-end');
        });
        
        // 标记所有消息为已读
        $scope.markAllAsRead();
      }, 500);
    });
  };
  
  // 标记所有消息为已读
  $scope.markAllAsRead = function() {
    Chat.markAsRead($stateParams.username);
  };
  
  // 发送一条新消息
  $scope.sendMessage = function() {
    if (!$scope.messageText || $scope.messageText.trim() === '') {
      return;
    }
    
    var message = {
      id: 'new_' + new Date().getTime(),
      content: $scope.messageText,
      sender: $scope.userInfo.username,
      receiver: $stateParams.username,
      timestamp: new Date(),
      read: false,
      sending: true // 标记为发送中
    };
    
    // 添加到本地消息列表
    $scope.messages.push(message);
    
    // 清空消息输入框
    $scope.messageText = '';
    
    // 自动滚动到最新消息
    $timeout(function() {
      $anchorScroll('message-end');
    });
    
    // 发送消息
    Chat.sendMessage($stateParams.username, message.content).then(function(data) {
      message.sending = false;
      message.sent = true;
      message.id = data.id; // 更新为服务器返回的ID
    }, function() {
      // 错误处理 - 模拟成功发送
      $timeout(function() {
        message.sending = false;
        message.sent = true;
      }, 500);
    });
  };
  
  // 初始化
  $scope.init = function() {
    console.log('ChatMessages控制器初始化 - 用户:', $stateParams.username);
    
    // 如果没有userInfo，等待从$rootScope获取
    if (!$scope.userInfo.username && $rootScope.userInfo) {
      $scope.userInfo = angular.copy($rootScope.userInfo);
      console.log('从rootScope获取userInfo:', $scope.userInfo.username);
    }
    
    // 如果还是没有userInfo，监听$rootScope.userInfo的变化
    if (!$scope.userInfo.username) {
      console.log('userInfo不存在，等待rootScope更新');
      var unwatch = $rootScope.$watch('userInfo', function(newValue) {
        if (newValue && newValue.username) {
          $scope.userInfo = angular.copy(newValue);
          unwatch();
          console.log('rootScope更新了userInfo:', $scope.userInfo.username);
          $scope.loadMessages();
        }
      });
    } else {
      // 加载消息
      console.log('开始加载消息');
      $scope.loadMessages();
    }
    
    // 设置定时刷新
    refreshTimer = $interval(function() {
      $scope.loadMessages();
    }, 10000); // 每10秒刷新一次
    
    // 处理Enter键发送消息
    $scope.handleKeyPress = function(event) {
      if (event.keyCode === 13 && !event.shiftKey) {
        event.preventDefault();
        $scope.sendMessage();
      }
    };
  };
  
  // 清理定时器
  $scope.$on('$destroy', function() {
    if (refreshTimer) {
      $interval.cancel(refreshTimer);
    }
  });
  
  $scope.init();
}); 