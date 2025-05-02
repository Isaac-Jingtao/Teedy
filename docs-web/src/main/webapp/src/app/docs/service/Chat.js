'use strict';

/**
 * 聊天服务，用于处理与聊天相关的API交互
 */
angular.module('docs').factory('Chat', function(Restangular) {
  var service = {};
  
  /**
   * 获取用户未读消息数量
   * @returns {Promise}
   */
  service.getUnreadCount = function() {
    return Restangular.one('chat').one('unread').get();
  };
  
  /**
   * 获取与指定用户的聊天历史
   * @param username 用户名
   * @param offset 偏移量
   * @param limit 限制数量
   * @returns {Promise}
   */
  service.getMessages = function(username, offset, limit) {
    return Restangular.one('chat').one('messages').one(username).get({
      offset: offset || 0,
      limit: limit || 20
    });
  };
  
  /**
   * 发送消息给指定用户
   * @param username 接收者用户名
   * @param content 消息内容
   * @returns {Promise}
   */
  service.sendMessage = function(username, content) {
    return Restangular.one('chat').one('message').post('', {
      recipient: username,
      content: content
    });
  };
  
  /**
   * 标记与指定用户的所有消息为已读
   * @param username 发送者用户名
   * @returns {Promise}
   */
  service.markAsRead = function(username) {
    return Restangular.one('chat').one('read').one(username).post();
  };
  
  /**
   * 获取最近的聊天用户列表
   * @returns {Promise}
   */
  service.getRecentChats = function() {
    return Restangular.one('chat').one('recent').get();
  };
  
  return service;
}); 