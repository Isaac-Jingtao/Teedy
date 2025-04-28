'use strict';

/**
 * Chat controller.
 */
angular.module('docs').controller('Chat', function($scope, $state, Restangular, $translate, $uibModal, $window, $timeout) {
    // 初始化用户信息
    $scope.currentUser = {
        id: Restangular.one('user').get().$object.id
    };
    
    // 初始化标签页
    $scope.activeTab = 'contacts';
    $scope.setActiveTab = function(tab) {
        $scope.activeTab = tab;
    };
    
    // 聊天界面状态
    $scope.messages = [];
    $scope.messageGroups = [];
    $scope.newMessage = '';
    $scope.currentChat = null;
    $scope.contacts = [];
    $scope.groups = [];
    $scope.contactSearch = '';
    $scope.groupSearch = '';
    
    // 侧边栏控制（移动端）
    $scope.sidebarActive = false;
    $scope.toggleSidebar = function() {
        $scope.sidebarActive = !$scope.sidebarActive;
    };
    
    // 初始化WebSocket连接
    var contextPath = $window.location.pathname.split('/')[1];
    var ws = new WebSocket(
        ($window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
        $window.location.host +
        '/' + contextPath + '/ws/chat'
    );
    
    // WebSocket事件处理
    ws.onopen = function() {
        console.log('WebSocket connection established');
        
        // 获取当前用户信息和认证令牌
        var authToken = document.cookie.replace(/(?:(?:^|.*;\s*)auth_token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
        
        // 发送认证消息
        if (authToken) {
            var authMessage = {
                type: 'auth',
                token: authToken
            };
            ws.send(JSON.stringify(authMessage));
        } else {
            console.error('No authentication token found');
        }
    };
    
    ws.onmessage = function(event) {
        var message = JSON.parse(event.data);
        console.log('Received message:', message);
        
        // 处理认证响应
        if (message.type === 'auth') {
            if (message.status === 'success') {
                console.log('Authentication successful');
                // 认证成功后加载数据
                loadContacts();
                loadGroups();
            } else {
                console.error('Authentication failed:', message.message);
            }
            return;
        }
        
        handleMessage(message);
        $scope.$apply();
    };
    
    ws.onclose = function() {
        console.log('WebSocket connection closed');
    };
    
    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
    };
    
    // 处理接收的消息
    function handleMessage(message) {
        switch (message.type) {
            case 'private':
                handlePrivateMessage(message);
                break;
            case 'group':
                handleGroupMessage(message);
                break;
            default:
                console.warn('Unknown message type:', message.type);
        }
    }
    
    // 处理私人消息
    function handlePrivateMessage(message) {
        if ($scope.currentChat && 
            (($scope.currentChat.type === 'private' && 
              $scope.currentChat.id === message.senderId) ||
             ($scope.currentChat.type === 'private' && 
              $scope.currentChat.id === message.receiverId))) {
            addMessageToList(message);
        } else {
            // 更新未读消息计数
            $scope.contacts.forEach(function(contact) {
                if (contact.id === message.senderId) {
                    contact.unreadCount = (contact.unreadCount || 0) + 1;
                }
            });
        }
    }
    
    // 处理群组消息
    function handleGroupMessage(message) {
        if ($scope.currentChat && 
            $scope.currentChat.type === 'group' && 
            $scope.currentChat.id === message.receiverId) {
            addMessageToList(message);
        } else {
            // 更新未读消息计数
            $scope.groups.forEach(function(group) {
                if (group.id === message.receiverId) {
                    group.unreadCount = (group.unreadCount || 0) + 1;
                }
            });
        }
    }
    
    // 添加消息到列表并按日期分组
    function addMessageToList(message) {
        // 添加到平面消息列表
        $scope.messages.unshift(message);
        
        // 更新消息分组
        updateMessageGroups();
    }
    
    // 按日期分组消息
    function updateMessageGroups() {
        var groups = {};
        
        // 首先按日期分组
        $scope.messages.forEach(function(message) {
            var date = new Date(message.createDate);
            var dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
            
            if (!groups[dateKey]) {
                groups[dateKey] = {
                    date: new Date(dateKey),
                    messages: []
                };
            }
            
            groups[dateKey].messages.push(message);
        });
        
        // 转换为数组并按日期排序
        var groupArray = Object.values(groups);
        groupArray.sort(function(a, b) {
            return b.date - a.date; // 降序，最新的日期在前
        });
        
        // 排序每个分组中的消息
        groupArray.forEach(function(group) {
            group.messages.sort(function(a, b) {
                return new Date(a.createDate) - new Date(b.createDate); // 升序，旧消息在前
            });
        });
        
        $scope.messageGroups = groupArray;
    }
    
    // 加载联系人
    function loadContacts() {
        Restangular.one('user').getList('active').then(function(users) {
            $scope.contacts = users.map(function(user) {
                return {
                    id: user.id,
                    username: user.username,
                    online: Math.random() > 0.5, // 模拟在线状态，实际应从后端获取
                    unreadCount: 0
                };
            });
        });
    }
    
    // 加载群组
    function loadGroups() {
        Restangular.one('chat/group').getList().then(function(groups) {
            $scope.groups = groups.map(function(group) {
                return {
                    id: group.id,
                    name: group.name,
                    memberCount: group.memberCount || Math.floor(Math.random() * 10) + 2, // 模拟，实际应从后端获取
                    unreadCount: 0
                };
            });
        }, function(error) {
            // 如果API暂未实现，使用模拟数据
            $scope.groups = [
                { 
                    id: 'g1', 
                    name: 'Marketing Team', 
                    memberCount: 5,
                    unreadCount: 0
                },
                { 
                    id: 'g2', 
                    name: 'Development Team', 
                    memberCount: 8,
                    unreadCount: 0
                },
                { 
                    id: 'g3', 
                    name: 'Design Team', 
                    memberCount: 4,
                    unreadCount: 0
                }
            ];
        });
    }
    
    // 开始与用户聊天
    $scope.startChat = function(user) {
        $scope.currentChat = {
            type: 'private',
            id: user.id,
            name: user.username
        };
        
        // 重置未读消息计数
        user.unreadCount = 0;
        
        // 在移动端自动关闭侧边栏
        if ($window.innerWidth < 768) {
            $scope.sidebarActive = false;
        }
        
        loadMessages();
    };
    
    // 随机开始聊天（欢迎页面）
    $scope.startRandomChat = function() {
        if ($scope.contacts.length > 0) {
            var randomIndex = Math.floor(Math.random() * $scope.contacts.length);
            $scope.startChat($scope.contacts[randomIndex]);
        }
    };
    
    // 加入群组聊天
    $scope.joinGroup = function(group) {
        $scope.currentChat = {
            type: 'group',
            id: group.id,
            name: group.name,
            memberCount: group.memberCount
        };
        
        // 重置未读消息计数
        group.unreadCount = 0;
        
        // 在移动端自动关闭侧边栏
        if ($window.innerWidth < 768) {
            $scope.sidebarActive = false;
        }
        
        loadMessages();
    };
    
    // 加载消息历史
    function loadMessages() {
        if (!$scope.currentChat) return;
        
        var endpoint = $scope.currentChat.type === 'private' ? 
            'chat/messages/private' : 'chat/messages/group';
            
        Restangular.one(endpoint).get({
            id: $scope.currentChat.id,
            offset: 0,
            limit: 50
        }).then(function(response) {
            $scope.messages = response.data || [];
            updateMessageGroups();
        }, function(error) {
            // 如果API暂未实现，使用模拟数据
            generateMockMessages();
        });
    }
    
    // 生成模拟消息数据（仅用于演示）
    function generateMockMessages() {
        var now = new Date();
        var mockMessages = [];
        var messageCount = Math.floor(Math.random() * 15) + 5;
        var otherUser = $scope.currentChat.id;
        var otherUserName = $scope.currentChat.name;
        
        // 生成过去3天的消息
        for (var i = 0; i < messageCount; i++) {
            var timeDiff = Math.random() * 3 * 24 * 60 * 60 * 1000; // 最多3天
            var messageDate = new Date(now.getTime() - timeDiff);
            var isCurrentUser = Math.random() > 0.5;
            
            mockMessages.push({
                id: 'msg' + i,
                content: getRandomMessage(),
                senderId: isCurrentUser ? $scope.currentUser.id : otherUser,
                senderName: isCurrentUser ? 'You' : otherUserName,
                receiverId: isCurrentUser ? otherUser : $scope.currentUser.id,
                type: $scope.currentChat.type,
                createDate: messageDate,
                readDate: isCurrentUser ? messageDate : (Math.random() > 0.3 ? messageDate : null)
            });
        }
        
        // 按时间排序
        mockMessages.sort(function(a, b) {
            return new Date(a.createDate) - new Date(b.createDate);
        });
        
        $scope.messages = mockMessages;
        updateMessageGroups();
    }
    
    // 生成随机消息内容（仅用于演示）
    function getRandomMessage() {
        var messages = [
            'Hello there!',
            'How are you doing today?',
            'Did you see the latest documents?',
            'Can we schedule a meeting tomorrow?',
            'I just uploaded the new files.',
            'Please review the document when you have time.',
            'Thanks for your help!',
            'Great job on the project!',
            'Let me know if you need anything else.',
            'I have a question about the latest update.',
            'Do you have time for a quick chat?'
        ];
        
        return messages[Math.floor(Math.random() * messages.length)];
    }
    
    // 发送消息
    $scope.sendMessage = function(event) {
        if (event && event.keyCode !== 13) return;
        if (!$scope.newMessage.trim() || !$scope.currentChat) return;
        
        var messageContent = $scope.newMessage.trim();
        var chatType = $scope.currentChat.type;
        var receiverId = $scope.currentChat.id;
        
        // 创建用于显示的本地消息对象
        var localMessage = {
            type: chatType,
            content: messageContent,
            senderId: $scope.currentUser.id,
            senderName: 'You', // 实际应使用当前用户名
            receiverId: receiverId,
            createDate: new Date()
        };
        
        // 添加到本地消息列表，立即显示
        addMessageToList(localMessage);
        
        // 创建要发送到服务器的消息对象
        var serverMessage = {
            type: chatType === 'private' ? 'message' : 'group_message',
            content: messageContent,
            to: receiverId
        };
        
        // 发送到服务器
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(serverMessage));
        } else {
            console.error('WebSocket connection not open');
        }
        
        $scope.newMessage = '';
    };
    
    // 创建新群组
    $scope.createGroup = function() {
        var modalInstance = $uibModal.open({
            templateUrl: 'partial/docs/chat/creategroup.html',
            controller: 'CreateGroupCtrl',
            size: 'sm'
        });
        
        modalInstance.result.then(function(group) {
            $scope.groups.push(group);
            $scope.joinGroup(group);
        });
    };
    
    // 离开群组
    $scope.leaveGroup = function() {
        if (!$scope.currentChat || $scope.currentChat.type !== 'group') return;
        
        if (confirm($translate.instant('chat.confirm_leave_group'))) {
            // 调用API离开群组
            Restangular.one('chat/group', $scope.currentChat.id).one('leave').post().then(function() {
                // 从群组列表中移除
                var groupIndex = $scope.groups.findIndex(function(group) {
                    return group.id === $scope.currentChat.id;
                });
                
                if (groupIndex !== -1) {
                    $scope.groups.splice(groupIndex, 1);
                }
                
                $scope.currentChat = null;
            }, function(error) {
                // 如果API暂未实现，模拟操作
                var groupIndex = $scope.groups.findIndex(function(group) {
                    return group.id === $scope.currentChat.id;
                });
                
                if (groupIndex !== -1) {
                    $scope.groups.splice(groupIndex, 1);
                }
                
                $scope.currentChat = null;
            });
        }
    };
    
    // 清除聊天历史
    $scope.clearHistory = function() {
        if (!$scope.currentChat) return;
        
        if (confirm($translate.instant('chat.confirm_clear_history'))) {
            $scope.messages = [];
            $scope.messageGroups = [];
        }
    };
    
    // 添加附件
    $scope.addAttachment = function() {
        // 实际应打开文件选择器并上传
        alert($translate.instant('chat.attachment_coming_soon'));
    };
    
    // 检查用户是否在线
    $scope.isUserOnline = function(userId) {
        var contact = $scope.contacts.find(function(contact) {
            return contact.id === userId;
        });
        
        return contact && contact.online;
    };
    
    // 自动滚动到底部的指令
    function scrollToBottom() {
        $timeout(function() {
            var chatMessages = document.querySelector('.chat-messages');
            if (chatMessages) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }, 0);
    }
    
    // 监听消息变化，自动滚动
    $scope.$watch('messages.length', function() {
        scrollToBottom();
    });
    
    // 移动端控制
    $scope.showMobileSidebar = function() {
        $scope.sidebarActive = true;
    };
    
    // 应用切换到聊天页面时添加移动端侧边栏按钮
    $timeout(function() {
        if ($window.innerWidth < 768) {
            var sidebarToggle = document.createElement('button');
            sidebarToggle.className = 'chat-toggle-sidebar';
            sidebarToggle.innerHTML = '<span class="fas fa-bars"></span>';
            sidebarToggle.onclick = function() {
                $scope.$apply(function() {
                    $scope.toggleSidebar();
                });
            };
            
            document.querySelector('.chat-container').appendChild(sidebarToggle);
            
            // 添加类以标记侧边栏状态
            $scope.$watch('sidebarActive', function(newVal) {
                var sidebar = document.querySelector('.chat-sidebar');
                if (sidebar) {
                    if (newVal) {
                        sidebar.classList.add('active');
                    } else {
                        sidebar.classList.remove('active');
                    }
                }
            });
        }
    });
    
    // 在控制器销毁时关闭WebSocket连接
    $scope.$on('$destroy', function() {
        if (ws) {
            ws.close();
        }
    });
}); 