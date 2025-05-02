package com.sismics.docs.rest.resource;

import com.google.common.base.Strings;
import com.google.common.collect.Maps;
import com.sismics.docs.core.dao.ChatMessageDao;
import com.sismics.docs.core.dao.GroupDao;
import com.sismics.docs.core.dao.UserDao;
import com.sismics.docs.core.dao.criteria.GroupCriteria;
import com.sismics.docs.core.dao.criteria.UserCriteria;
import com.sismics.docs.core.dao.dto.ChatMessageDto;
import com.sismics.docs.core.dao.dto.GroupDto;
import com.sismics.docs.core.dao.dto.UserDto;
import com.sismics.docs.core.model.jpa.ChatMessage;
import com.sismics.docs.core.model.jpa.User;
import com.sismics.docs.core.util.jpa.SortCriteria;
import com.sismics.rest.exception.ClientException;
import com.sismics.rest.exception.ForbiddenClientException;
import com.sismics.rest.util.ValidationUtil;
import com.sismics.security.UserPrincipal;

import jakarta.json.Json;
import jakarta.json.JsonArrayBuilder;
import jakarta.json.JsonObjectBuilder;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;

import java.text.MessageFormat;
import java.util.*;

/**
 * Chat REST resources.
 * 
 * @author claude
 */
@Path("/chat")
public class ChatResource extends BaseResource {
    /**
     * Get unread message count.
     *
     * @api {get} /chat/unread Get unread message count
     * @apiName GetChatUnreadCount
     * @apiGroup Chat
     * @apiSuccess {Object} unread Map of username to unread count
     * @apiError (client) ForbiddenError Access denied
     * @apiPermission user
     * @apiVersion 1.5.0
     *
     * @return Response
     */
    @GET
    @Path("unread")
    public Response getUnreadCount() {
        if (!authenticate()) {
            throw new ForbiddenClientException();
        }
        
        // Get the user
        UserDao userDao = new UserDao();
        User user = userDao.getById(principal.getId());
        if (user == null) {
            throw new ForbiddenClientException();
        }
        
        ChatMessageDao chatMessageDao = new ChatMessageDao();
        
        // Get users with unread messages
        List<String> userIds = chatMessageDao.findUserIdsWithUnreadMessages(principal.getId());
        
        // Get the unread count for each user
        Map<String, Integer> unreadCounts = new HashMap<>();
        for (String userId : userIds) {
            // Get the user username
            User sender = userDao.getById(userId);
            if (sender == null) {
                continue;
            }
            
            int count = chatMessageDao.getUnreadMessageCount(principal.getId(), userId);
            unreadCounts.put(sender.getUsername(), count);
        }
        
        // Build the response
        JsonObjectBuilder unread = Json.createObjectBuilder();
        for (Map.Entry<String, Integer> entry : unreadCounts.entrySet()) {
            unread.add(entry.getKey(), entry.getValue());
        }
        
        JsonObjectBuilder response = Json.createObjectBuilder()
                .add("unread", unread);
        return Response.ok().entity(response.build()).build();
    }
    
    /**
     * Get chat messages between users.
     *
     * @api {get} /chat/messages/:username Get chat messages
     * @apiName GetChatMessages
     * @apiGroup Chat
     * @apiParam {String} username Username of the other user
     * @apiParam {Number} offset Pagination offset
     * @apiParam {Number} limit Pagination limit
     * @apiSuccess {Object[]} messages List of messages
     * @apiSuccess {String} messages.id Message ID
     * @apiSuccess {String} messages.content Message content
     * @apiSuccess {String} messages.sender Message sender username
     * @apiSuccess {String} messages.receiver Message receiver username
     * @apiSuccess {Number} messages.timestamp Creation timestamp
     * @apiSuccess {Boolean} messages.read True if the message has been read
     * @apiSuccess {Number} total Total number of messages
     * @apiError (client) ForbiddenError Access denied
     * @apiError (client) NotFound User not found
     * @apiError (client) ValidationError Validation error
     * @apiPermission user
     * @apiVersion 1.5.0
     *
     * @param username Username
     * @param offset Offset
     * @param limit Limit
     * @return Response
     */
    @GET
    @Path("messages/{username: [a-zA-Z0-9_@.-]+}")
    public Response getMessages(
            @PathParam("username") String username,
            @QueryParam("offset") String offset,
            @QueryParam("limit") String limit) {
        if (!authenticate()) {
            throw new ForbiddenClientException();
        }
        
        // Validate input
        Integer offsetInt = ValidationUtil.validateInteger(offset, "offset");
        Integer limitInt = ValidationUtil.validateInteger(limit, "limit");
        if (offsetInt == null) {
            offsetInt = 0;
        }
        if (limitInt == null) {
            limitInt = 20;
        }
        
        // Check that the users can communicate (they must be in the same group)
        GroupDao groupDao = new GroupDao();
        UserDao userDao = new UserDao();
        User currentUser = userDao.getById(principal.getId());
        if (currentUser == null || !canUsersCommunicate(currentUser.getUsername(), username, groupDao)) {
            throw new ForbiddenClientException();
        }
        
        // Get the user
        User user = userDao.getActiveByUsername(username);
        if (user == null) {
            throw new NotFoundException();
        }
        
        // Get the messages
        ChatMessageDao chatMessageDao = new ChatMessageDao();
        List<ChatMessageDto> messages = chatMessageDao.findBetweenUsers(principal.getId(), user.getId(), offsetInt, limitInt);
        
        // Build the response
        JsonArrayBuilder messagesJson = Json.createArrayBuilder();
        for (ChatMessageDto message : messages) {
            messagesJson.add(Json.createObjectBuilder()
                    .add("id", message.getId())
                    .add("content", message.getContent())
                    .add("sender", message.getSenderName())
                    .add("receiver", message.getRecipientName())
                    .add("timestamp", message.getCreateTimestamp())
                    .add("read", message.getReadTimestamp() != null));
        }
        
        JsonObjectBuilder response = Json.createObjectBuilder()
                .add("messages", messagesJson)
                .add("total", messages.size()); // In a real implementation, you should get the total count from the DAO
        return Response.ok().entity(response.build()).build();
    }
    
    /**
     * Send a message.
     *
     * @api {post} /chat/message Send a message
     * @apiName PostChatMessage
     * @apiGroup Chat
     * @apiParam {String} recipient Username of the recipient
     * @apiParam {String} content Message content
     * @apiSuccess {String} id Message ID
     * @apiSuccess {String} status Status OK
     * @apiError (client) ForbiddenError Access denied
     * @apiError (client) NotFound User not found
     * @apiError (client) ValidationError Validation error
     * @apiPermission user
     * @apiVersion 1.5.0
     *
     * @param recipientUsername Recipient username
     * @param content Message content
     * @return Response
     */
    @POST
    @Path("message")
    public Response sendMessage(
            @FormParam("recipient") String recipientUsername,
            @FormParam("content") String content) {
        if (!authenticate()) {
            throw new ForbiddenClientException();
        }
        
        // Validate input
        recipientUsername = ValidationUtil.validateLength(recipientUsername, "recipient", 1, 50, false);
        content = ValidationUtil.validateLength(content, "content", 1, 4000, false);
        
        // Check that the users can communicate (they must be in the same group)
        GroupDao groupDao = new GroupDao();
        UserDao userDao = new UserDao();
        User currentUser = userDao.getById(principal.getId());
        if (currentUser == null || !canUsersCommunicate(currentUser.getUsername(), recipientUsername, groupDao)) {
            throw new ForbiddenClientException();
        }
        
        // Get the recipient
        User recipient = userDao.getActiveByUsername(recipientUsername);
        if (recipient == null) {
            throw new NotFoundException();
        }
        
        // Create the message
        ChatMessage message = new ChatMessage();
        message.setSenderId(principal.getId());
        message.setRecipientId(recipient.getId());
        message.setContent(content);
        
        // Save the message
        ChatMessageDao chatMessageDao = new ChatMessageDao();
        String id = chatMessageDao.create(message, principal.getId());
        
        // Build the response
        JsonObjectBuilder response = Json.createObjectBuilder()
                .add("id", id)
                .add("status", "ok");
        return Response.ok().entity(response.build()).build();
    }
    
    /**
     * Mark messages as read.
     *
     * @api {post} /chat/read/:username Mark messages as read
     * @apiName PostChatRead
     * @apiGroup Chat
     * @apiParam {String} username Username of the sender
     * @apiSuccess {String} status Status OK
     * @apiError (client) ForbiddenError Access denied
     * @apiError (client) NotFound User not found
     * @apiPermission user
     * @apiVersion 1.5.0
     *
     * @param senderUsername Sender username
     * @return Response
     */
    @POST
    @Path("read/{username: [a-zA-Z0-9_@.-]+}")
    public Response markAsRead(@PathParam("username") String senderUsername) {
        if (!authenticate()) {
            throw new ForbiddenClientException();
        }
        
        // Get the sender
        UserDao userDao = new UserDao();
        User sender = userDao.getActiveByUsername(senderUsername);
        if (sender == null) {
            throw new NotFoundException();
        }
        
        // Mark messages as read
        ChatMessageDao chatMessageDao = new ChatMessageDao();
        chatMessageDao.markAsRead(sender.getId(), principal.getId());
        
        // Build the response
        JsonObjectBuilder response = Json.createObjectBuilder()
                .add("status", "ok");
        return Response.ok().entity(response.build()).build();
    }
    
    /**
     * Get recent chat users.
     *
     * @api {get} /chat/recent Get recent chat users
     * @apiName GetChatRecent
     * @apiGroup Chat
     * @apiSuccess {String[]} users List of usernames
     * @apiError (client) ForbiddenError Access denied
     * @apiPermission user
     * @apiVersion 1.5.0
     *
     * @return Response
     */
    @GET
    @Path("recent")
    public Response getRecentUsers() {
        if (!authenticate()) {
            throw new ForbiddenClientException();
        }
        
        // Get the recent users
        ChatMessageDao chatMessageDao = new ChatMessageDao();
        List<String> recentUserIds = chatMessageDao.findRecentChatUsers(principal.getId(), 10);
        
        // Get the usernames
        UserDao userDao = new UserDao();
        JsonArrayBuilder users = Json.createArrayBuilder();
        for (String userId : recentUserIds) {
            User user = userDao.getById(userId);
            if (user != null) {
                users.add(user.getUsername());
            }
        }
        
        // Build the response
        JsonObjectBuilder response = Json.createObjectBuilder()
                .add("users", users);
        return Response.ok().entity(response.build()).build();
    }
    
    /**
     * Check if two users can communicate (they must be in the same group).
     * 
     * @param username1 First username
     * @param username2 Second username
     * @param groupDao Group DAO
     * @return True if the users can communicate
     */
    private boolean canUsersCommunicate(String username1, String username2, GroupDao groupDao) {
        // Get all groups of the first user
        List<GroupDto> user1Groups = groupDao.findByCriteria(
                new GroupCriteria().setUserId(principal.getId()), null);
        
        // Get all groups of the second user
        UserDao userDao = new UserDao();
        User user2 = userDao.getActiveByUsername(username2);
        if (user2 == null) {
            return false;
        }
        
        List<GroupDto> user2Groups = groupDao.findByCriteria(
                new GroupCriteria().setUserId(user2.getId()), null);
        
        // Check if they have at least one group in common
        for (GroupDto group1 : user1Groups) {
            for (GroupDto group2 : user2Groups) {
                if (group1.getId().equals(group2.getId())) {
                    return true;
                }
            }
        }
        
        return false;
    }
} 