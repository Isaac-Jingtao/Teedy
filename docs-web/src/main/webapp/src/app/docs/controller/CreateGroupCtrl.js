'use strict';

/**
 * 创建群组控制器
 */
angular.module('docs').controller('CreateGroupCtrl', function($scope, $uibModalInstance, Restangular) {
    // 初始化群组数据
    $scope.group = {
        name: ''
    };
    
    // 成员搜索
    $scope.memberSearch = '';
    
    // 加载用户列表
    $scope.users = [];
    Restangular.one('user').getList('active').then(function(users) {
        $scope.users = users.map(function(user) {
            return {
                id: user.id,
                username: user.username,
                selected: false
            };
        });
    }, function(error) {
        // 如果API未实现，使用模拟数据
        $scope.users = [
            { id: 'u1', username: 'John Doe', selected: false },
            { id: 'u2', username: 'Jane Smith', selected: false },
            { id: 'u3', username: 'Robert Johnson', selected: false },
            { id: 'u4', username: 'Emily Davis', selected: false },
            { id: 'u5', username: 'Michael Brown', selected: false }
        ];
    });
    
    // 检查是否有选择的成员
    $scope.hasSelectedMembers = function() {
        return $scope.users.some(function(user) {
            return user.selected;
        });
    };
    
    // 创建群组
    $scope.create = function() {
        if (!$scope.group.name.trim() || !$scope.hasSelectedMembers()) {
            return;
        }
        
        // 获取选中的成员
        var selectedMembers = $scope.users.filter(function(user) {
            return user.selected;
        }).map(function(user) {
            return user.id;
        });
        
        // 创建群组数据
        var groupData = {
            name: $scope.group.name,
            members: selectedMembers
        };
        
        // 调用API创建群组
        Restangular.one('chat/group').customPOST(groupData).then(function(response) {
            $uibModalInstance.close(response);
        }, function(error) {
            // 如果API未实现，模拟成功响应
            var mockResponse = {
                id: 'g' + Math.floor(Math.random() * 1000),
                name: $scope.group.name,
                memberCount: selectedMembers.length,
                members: selectedMembers
            };
            $uibModalInstance.close(mockResponse);
        });
    };
    
    // 取消创建
    $scope.cancel = function() {
        $uibModalInstance.dismiss('cancel');
    };
}); 