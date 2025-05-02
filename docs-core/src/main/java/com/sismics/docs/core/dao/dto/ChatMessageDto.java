package com.sismics.docs.core.dao.dto;

/**
 * Chat message DTO.
 *
 * @author claude
 */
public class ChatMessageDto {
    /**
     * Message ID.
     */
    private String id;
    
    /**
     * Sender user ID.
     */
    private String senderId;
    
    /**
     * Sender username.
     */
    private String senderName;
    
    /**
     * Recipient user ID.
     */
    private String recipientId;
    
    /**
     * Recipient username.
     */
    private String recipientName;
    
    /**
     * Message content.
     */
    private String content;
    
    /**
     * Creation timestamp.
     */
    private Long createTimestamp;
    
    /**
     * Read timestamp.
     */
    private Long readTimestamp;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getRecipientId() {
        return recipientId;
    }

    public void setRecipientId(String recipientId) {
        this.recipientId = recipientId;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Long getCreateTimestamp() {
        return createTimestamp;
    }

    public void setCreateTimestamp(Long createTimestamp) {
        this.createTimestamp = createTimestamp;
    }

    public Long getReadTimestamp() {
        return readTimestamp;
    }

    public void setReadTimestamp(Long readTimestamp) {
        this.readTimestamp = readTimestamp;
    }
} 