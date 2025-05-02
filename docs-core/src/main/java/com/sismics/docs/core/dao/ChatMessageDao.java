package com.sismics.docs.core.dao;

import com.google.common.collect.Lists;
import com.sismics.docs.core.constant.AuditLogType;
import com.sismics.docs.core.dao.dto.ChatMessageDto;
import com.sismics.docs.core.model.jpa.ChatMessage;
import com.sismics.docs.core.util.AuditLogUtil;
import com.sismics.docs.core.util.jpa.QueryParam;
import com.sismics.docs.core.util.jpa.QueryUtil;
import com.sismics.docs.core.util.jpa.SortCriteria;
import com.sismics.util.context.ThreadLocalContext;

import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.Query;

import java.sql.Timestamp;
import java.util.*;

/**
 * Chat message DAO.
 * 
 * @author claude
 */
public class ChatMessageDao {
    /**
     * Creates a new chat message.
     * 
     * @param chatMessage Chat message
     * @param userId User ID
     * @return New ID
     */
    public String create(ChatMessage chatMessage, String userId) {
        // Create the UUID
        chatMessage.setId(UUID.randomUUID().toString());
        
        // Create the chat message
        EntityManager em = ThreadLocalContext.get().getEntityManager();
        chatMessage.setCreateDate(new Date());
        em.persist(chatMessage);
        
        // Create audit log
        AuditLogUtil.create(chatMessage, AuditLogType.CREATE, userId);
        
        return chatMessage.getId();
    }
    
    /**
     * Returns the list of all messages between two users.
     * 
     * @param userId1 First user ID
     * @param userId2 Second user ID
     * @param offset Offset
     * @param limit Limit
     * @return List of messages
     */
    public List<ChatMessageDto> findBetweenUsers(String userId1, String userId2, int offset, int limit) {
        EntityManager em = ThreadLocalContext.get().getEntityManager();
        StringBuilder sb = new StringBuilder("select c.MSG_ID_C, c.CHM_IDSENDER_C, c.CHM_IDRECIPIENT_C, c.CHM_CONTENT_C, c.CHM_CREATEDATE_D, c.CHM_READDATE_D, u.USE_USERNAME_C, ur.USE_USERNAME_C ");
        sb.append(" from T_CHAT_MESSAGE c ");
        sb.append(" join T_USER u on u.USE_ID_C = c.CHM_IDSENDER_C ");
        sb.append(" join T_USER ur on ur.USE_ID_C = c.CHM_IDRECIPIENT_C ");
        sb.append(" where c.CHM_DELETEDATE_D is null ");
        sb.append(" and ((c.CHM_IDSENDER_C = :userId1 and c.CHM_IDRECIPIENT_C = :userId2) ");
        sb.append(" or (c.CHM_IDSENDER_C = :userId2 and c.CHM_IDRECIPIENT_C = :userId1)) ");
        sb.append(" order by c.CHM_CREATEDATE_D desc ");
        
        // Perform the query
        Query q = em.createNativeQuery(sb.toString());
        q.setParameter("userId1", userId1);
        q.setParameter("userId2", userId2);
        q.setFirstResult(offset);
        q.setMaxResults(limit);
        @SuppressWarnings("unchecked")
        List<Object[]> l = q.getResultList();
        
        // Assemble results
        List<ChatMessageDto> messages = new ArrayList<>();
        for (Object[] o : l) {
            int i = 0;
            ChatMessageDto message = new ChatMessageDto();
            message.setId((String) o[i++]);
            message.setSenderId((String) o[i++]);
            message.setRecipientId((String) o[i++]);
            message.setContent((String) o[i++]);
            message.setCreateTimestamp(((Timestamp) o[i++]).getTime());
            Timestamp readTimestamp = (Timestamp) o[i++];
            if (readTimestamp != null) {
                message.setReadTimestamp(readTimestamp.getTime());
            }
            message.setSenderName((String) o[i++]);
            message.setRecipientName((String) o[i]);
            messages.add(message);
        }
        
        return messages;
    }
    
    /**
     * Returns the number of unread messages for a user from another user.
     * 
     * @param recipientId Recipient user ID
     * @param senderId Sender user ID (optional)
     * @return Number of unread messages
     */
    public int getUnreadMessageCount(String recipientId, String senderId) {
        EntityManager em = ThreadLocalContext.get().getEntityManager();
        StringBuilder sb = new StringBuilder("select count(c.MSG_ID_C) ");
        sb.append(" from T_CHAT_MESSAGE c ");
        sb.append(" where c.CHM_DELETEDATE_D is null ");
        sb.append(" and c.CHM_READDATE_D is null ");
        sb.append(" and c.CHM_IDRECIPIENT_C = :recipientId ");
        if (senderId != null) {
            sb.append(" and c.CHM_IDSENDER_C = :senderId ");
        }
        
        // Perform the query
        Query q = em.createNativeQuery(sb.toString());
        q.setParameter("recipientId", recipientId);
        if (senderId != null) {
            q.setParameter("senderId", senderId);
        }
        
        return ((Number) q.getSingleResult()).intValue();
    }
    
    /**
     * Returns the list of users with unread messages for a given recipient.
     * 
     * @param recipientId Recipient user ID
     * @return List of user IDs with unread messages
     */
    public List<String> findUserIdsWithUnreadMessages(String recipientId) {
        EntityManager em = ThreadLocalContext.get().getEntityManager();
        StringBuilder sb = new StringBuilder("select distinct c.CHM_IDSENDER_C ");
        sb.append(" from T_CHAT_MESSAGE c ");
        sb.append(" where c.CHM_DELETEDATE_D is null ");
        sb.append(" and c.CHM_READDATE_D is null ");
        sb.append(" and c.CHM_IDRECIPIENT_C = :recipientId ");
        
        // Perform the query
        Query q = em.createNativeQuery(sb.toString());
        q.setParameter("recipientId", recipientId);
        
        @SuppressWarnings("unchecked")
        List<String> l = q.getResultList();
        return l;
    }
    
    /**
     * Returns the list of recent chatting users.
     * 
     * @param userId User ID
     * @param limit Maximum number of users to return
     * @return List of recent users
     */
    public List<String> findRecentChatUsers(String userId, int limit) {
        EntityManager em = ThreadLocalContext.get().getEntityManager();
        
        // 使用子查询获取每个对话者的最后消息时间
        StringBuilder sb = new StringBuilder();
        sb.append("select other_user_id from (");
        sb.append("  select ");
        sb.append("    case when c.CHM_IDSENDER_C = :userId then c.CHM_IDRECIPIENT_C else c.CHM_IDSENDER_C end as other_user_id, ");
        sb.append("    max(c.CHM_CREATEDATE_D) as last_message_date ");
        sb.append("  from T_CHAT_MESSAGE c ");
        sb.append("  where c.CHM_DELETEDATE_D is null ");
        sb.append("  and (c.CHM_IDSENDER_C = :userId or c.CHM_IDRECIPIENT_C = :userId) ");
        sb.append("  group by other_user_id ");
        sb.append(") as conversations ");
        sb.append("order by last_message_date desc ");
        sb.append("limit :limit");
        
        // Perform the query
        Query q = em.createNativeQuery(sb.toString());
        q.setParameter("userId", userId);
        q.setParameter("limit", limit);
        
        @SuppressWarnings("unchecked")
        List<String> l = q.getResultList();
        return l;
    }
    
    /**
     * Marks all messages from a sender to a recipient as read.
     * 
     * @param senderId Sender user ID
     * @param recipientId Recipient user ID
     */
    public void markAsRead(String senderId, String recipientId) {
        EntityManager em = ThreadLocalContext.get().getEntityManager();
        Query q = em.createNativeQuery("update T_CHAT_MESSAGE set CHM_READDATE_D = :readDate " +
                " where CHM_IDSENDER_C = :senderId " +
                " and CHM_IDRECIPIENT_C = :recipientId " +
                " and CHM_READDATE_D is null " +
                " and CHM_DELETEDATE_D is null ");
        q.setParameter("readDate", new Date());
        q.setParameter("senderId", senderId);
        q.setParameter("recipientId", recipientId);
        q.executeUpdate();
    }
} 