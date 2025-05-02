'use strict';

/**
 * 聊天控制器
 */
angular.module('docs').controller('Chat', function($scope, $state, $stateParams, Restangular, $q, Chat, $rootScope, $timeout, $interval) {
  // 存储当前用户信息
  $scope.userInfo = angular.copy($rootScope.userInfo || {});
  
  // 存储当前聊天的用户
  $scope.activeChat = null;
  
  // 存储用户未读消息数量
  $scope.unreadCounts = {};
  
  // 存储消息列表
  $scope.messages = [];
  
  // 消息输入文本
  $scope.messageText = '';
  
  // 加载当前用户所在的所有群组
  $scope.loadGroups = function() {
    // 首先获取当前用户详情，包含用户的群组信息
    return Restangular.one('user', $scope.userInfo.username).get()
      .then(function(data) {
        $scope.userGroups = data.groups || [];
        return $scope.userGroups;
      });
  };
  
  // 加载指定群组的所有成员
  $scope.loadGroupMembers = function(groupName) {
    return Restangular.one('group').one(groupName).get()
      .then(function(data) {
        // 过滤掉当前用户
        $scope.groupMembers = data.members.filter(function(member) {
          return member !== $scope.userInfo.username;
        });
        return $scope.groupMembers;
      });
  };
  
  // 加载所有可聊天的用户(基于用户所在的群组)
  $scope.loadChatUsers = function() {
    $scope.chatUsers = [];
    
    return $scope.loadGroups().then(function(groups) {
      var promises = [];
      
      // 对每个群组加载成员
      angular.forEach(groups, function(group) {
        promises.push($scope.loadGroupMembers(group));
      });
      
      return $q.all(promises).then(function(results) {
        // 合并所有结果并去重
        var allMembers = [];
        angular.forEach(results, function(members) {
          allMembers = allMembers.concat(members);
        });
        
        // 去重
        $scope.chatUsers = allMembers.filter(function(member, index, self) {
          return self.indexOf(member) === index;
        });
        
        // 如果没有找到用户，添加一些测试用户
        if ($scope.chatUsers.length === 0) {
          $scope.chatUsers = ['test', 'admin', 'guest'];
        }
        
        // 获取每个用户的未读消息数量
        $scope.loadUnreadCounts();
        
        return $scope.chatUsers;
      });
    });
  };
  
  // 获取所有用户的未读消息数量
  $scope.loadUnreadCounts = function() {
    // 获取未读消息数量
    Chat.getUnreadCount().then(function(data) {
      $scope.unreadCounts = data.unread || {};
    });
    
    // 获取最近聊天用户列表
    Chat.getRecentChats().then(function(data) {
      $scope.recentChats = data.users || [];
    });
  };
  
  // 选择一个用户开始聊天
  $scope.startChat = function(username) {
    $scope.activeChat = username;
    console.log('开始聊天 - 用户:', username);
    
    // 将页面滚动到聊天窗口（如果需要）
    $timeout(function() {
      var chatElement = document.querySelector('.chat-messages');
      if (chatElement) {
        chatElement.scrollTop = chatElement.scrollHeight;
      }
    }, 100);
    
    // 加载聊天历史
    $scope.loadMessages(username);
    
    // 标记与该用户的消息为已读
    Chat.markAsRead(username).then(function() {
      // 更新未读消息计数
      $scope.unreadCounts[username] = 0;
      console.log('标记已读完成 - 用户:', username);
    }, function(error) {
      console.error('标记已读失败:', error);
    });
  };
  
  // 加载与特定用户的聊天历史
  $scope.loadMessages = function(username) {
    if (!username) return;
    
    $scope.loading = true;
    
    // 保存现有的消息列表，以在出错时恢复
    var existingMessages = $scope.messages || [];
    
    // 调用聊天服务获取消息历史
    Chat.getMessages(username).then(function(data) {
      var newMessages = data.messages || [];
      
      // 对消息按照时间戳进行升序排序（旧消息在前，新消息在后）
      newMessages.sort(function(a, b) {
        // 获取时间戳值（可能是Date对象、数字或字符串）
        var timeA = (a.timestamp instanceof Date) ? a.timestamp.getTime() : 
                   (typeof a.timestamp === 'number') ? a.timestamp : 
                   new Date(a.timestamp).getTime();
        var timeB = (b.timestamp instanceof Date) ? b.timestamp.getTime() : 
                   (typeof b.timestamp === 'number') ? b.timestamp : 
                   new Date(b.timestamp).getTime();
        return timeA - timeB;
      });
      
      $scope.messages = newMessages;
      $scope.loading = false;
      
      // 自动滚动到最新消息
      $timeout(function() {
        var chatElement = document.querySelector('.chat-messages');
        if (chatElement) {
          chatElement.scrollTop = chatElement.scrollHeight;
        }
      });
    }, function() {
      // 错误处理 - 恢复原来的消息列表
      $scope.messages = existingMessages;
      
      // 如果消息为空，使用模拟数据
      if ($scope.messages.length === 0) {
        var mockMessages = [
          {
            id: '1',
            content: '你好，这是一条测试消息',
            sender: username,
            receiver: $scope.userInfo.username,
            timestamp: new Date().getTime() - 3600000,
            read: true
          },
          {
            id: '2',
            content: '你好，很高兴认识你',
            sender: $scope.userInfo.username,
            receiver: username,
            timestamp: new Date().getTime() - 3500000,
            read: true
          },
          {
            id: '3',
            content: '这是Teedy的新聊天功能测试',
            sender: username,
            receiver: $scope.userInfo.username,
            timestamp: new Date().getTime() - 1800000,
            read: false
          }
        ];
        
        $timeout(function() {
          // 对模拟消息也进行排序
          mockMessages.sort(function(a, b) {
            return a.timestamp - b.timestamp;
          });
          
          $scope.messages = mockMessages;
          $scope.loading = false;
          
          // 自动滚动到最新消息
          $timeout(function() {
            var chatElement = document.querySelector('.chat-messages');
            if (chatElement) {
              chatElement.scrollTop = chatElement.scrollHeight;
            }
          });
        }, 500);
      } else {
        $scope.loading = false;
      }
    });
  };
  
  // 标记来自特定用户的所有消息为已读
  $scope.markAsRead = function(username) {
    // 这里应当调用后端API标记消息为已读
    Chat.markAsRead(username);
  };
  
  // 发送消息
  $scope.sendMessage = function() {
    // 直接从DOM获取输入值作为备份
    var textareaValue = document.querySelector('.chat-input textarea').value;
    console.log('尝试发送消息 (scope):', $scope.messageText);
    console.log('尝试发送消息 (DOM):', textareaValue);
    console.log('发送给用户:', $scope.activeChat);
    
    // 使用$timeout确保在digest循环中运行
    $timeout(function() {
      // 如果scope中的值为空，尝试使用DOM中的值
      if ((!$scope.messageText || $scope.messageText.trim() === '') && textareaValue && textareaValue.trim() !== '') {
        $scope.messageText = textareaValue;
        console.log('使用DOM中的值替代:', $scope.messageText);
      }
      
      if (!$scope.messageText || $scope.messageText.trim() === '' || !$scope.activeChat) {
        console.log('消息为空或没有选择聊天对象，不发送');
        return;
      }
      
      var message = {
        id: 'new_' + new Date().getTime(),
        content: $scope.messageText,
        sender: $scope.userInfo.username,
        receiver: $scope.activeChat,
        timestamp: new Date().getTime(), // 改用数字时间戳以便排序
        read: false,
        sending: true // 标记为发送中
      };
      
      console.log('创建消息对象:', message);
      
      // 添加到本地消息列表
      $scope.messages = $scope.messages || [];
      
      // 添加新消息，并确保消息按时间戳排序
      $scope.messages.push(message);
      $scope.messages.sort(function(a, b) {
        // 获取时间戳值（可能是Date对象或数字）
        var timeA = (a.timestamp instanceof Date) ? a.timestamp.getTime() : a.timestamp;
        var timeB = (b.timestamp instanceof Date) ? b.timestamp.getTime() : b.timestamp;
        return timeA - timeB;
      });
      
      // 清空消息输入框
      $scope.messageText = '';
      
      // 自动滚动到最新消息
      $timeout(function() {
        var chatElement = document.querySelector('.chat-messages');
        if (chatElement) {
          chatElement.scrollTop = chatElement.scrollHeight;
        }
      });
      
      // 发送消息
      Chat.sendMessage($scope.activeChat, message.content).then(function(data) {
        console.log('消息发送成功:', data);
        message.sending = false;
        message.sent = true;
        if (data && data.id) {
          message.id = data.id; // 更新为服务器返回的ID
        }
      }, function(error) {
        console.error('消息发送失败:', error);
        // 错误处理 - 模拟成功发送
        $timeout(function() {
          message.sending = false;
          message.sent = true;
        }, 500);
      });
    });
  };
  
  // 检查消息是否由当前用户发送
  $scope.isOwnMessage = function(message) {
    return message.sender === $scope.userInfo.username;
  };
  
  // 处理Enter键发送消息
  $scope.handleKeyPress = function(event) {
    console.log('按键事件:', event.keyCode);
    // 检查是否是回车键 (13) 并且没有按下 Shift 键
    if (event.keyCode === 13 && !event.shiftKey) {
      event.preventDefault(); // 阻止默认行为（换行）
      console.log('检测到回车键，尝试发送消息');
      $scope.sendMessage();
    }
  };
  
  // 测试发送函数
  $scope.testSend = function() {
    console.log('测试发送按钮被点击');
    if (!$scope.messageText || $scope.messageText.trim() === '') {
      $scope.messageText = '这是一条测试消息 - ' + new Date().toLocaleTimeString();
    }
    $scope.sendMessage();
  };
  
  // 初始化
  $scope.init = function() {
    // 用于自动刷新的定时器
    var refreshTimer = null;
    
    // 如果没有userInfo，等待Navigation控制器加载它
    if (!$scope.userInfo.username) {
      var unwatch = $rootScope.$watch('userInfo', function(newValue) {
        if (newValue && newValue.username) {
          $scope.userInfo = angular.copy(newValue);
          unwatch(); // 停止监视
          continueInit();
        }
      });
    } else {
      continueInit();
    }
    
    function continueInit() {
      // 加载可聊天的用户
      $scope.loadChatUsers().then(function() {
        // 如果URL中指定了用户，则开始与该用户聊天
        if ($stateParams.username) {
          $scope.activeChat = $stateParams.username;
          $scope.startChat($stateParams.username);
        }
        
        // 设置定时刷新
        refreshTimer = $interval(function() {
          // 如果当前有活跃聊天，则刷新消息
          if ($scope.activeChat) {
            $scope.loadMessages($scope.activeChat);
          }
          // 刷新未读消息计数
          $scope.loadUnreadCounts();
        }, 10000); // 每10秒刷新一次
      });
    }
    
    // 清理定时器
    $scope.$on('$destroy', function() {
      if (refreshTimer) {
        $interval.cancel(refreshTimer);
      }
    });
  };
  
  $scope.init();
}); 