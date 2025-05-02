package com.sismics.docs.core.model.jpa;

import java.util.Date;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import com.google.common.base.MoreObjects;

/**
 * Chat message entity.
 * 
 * @author claude
 */
@Entity
@Table(name = "T_CHAT_MESSAGE")
public class ChatMessage implements Loggable {
    /**
     * Message ID.
     */
    @Id
    @Column(name = "MSG_ID_C", length = 36)
    private String id;
    
    /**
     * Sender user ID.
     */
    @Column(name = "CHM_IDSENDER_C", length = 36, nullable = false)
    private String senderId;
    
    /**
     * Recipient user ID.
     */
    @Column(name = "CHM_IDRECIPIENT_C", length = 36, nullable = false)
    private String recipientId;
    
    /**
     * Message content.
     */
    @Column(name = "CHM_CONTENT_C", nullable = false, length = 4000)
    private String content;
    
    /**
     * Creation date.
     */
    @Column(name = "CHM_CREATEDATE_D", nullable = false)
    private Date createDate;

    /**
     * Read date.
     */
    @Column(name = "CHM_READDATE_D")
    private Date readDate;
    
    /**
     * Deletion date.
     */
    @Column(name = "CHM_DELETEDATE_D")
    private Date deleteDate;
    
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
    
    public String getRecipientId() {
        return recipientId;
    }

    public void setRecipientId(String recipientId) {
        this.recipientId = recipientId;
    }
    
    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
    
    public Date getCreateDate() {
        return createDate;
    }

    public void setCreateDate(Date createDate) {
        this.createDate = createDate;
    }
    
    public Date getReadDate() {
        return readDate;
    }

    public void setReadDate(Date readDate) {
        this.readDate = readDate;
    }

    @Override
    public Date getDeleteDate() {
        return deleteDate;
    }

    public void setDeleteDate(Date deleteDate) {
        this.deleteDate = deleteDate;
    }

    @Override
    public String toString() {
        return MoreObjects.toStringHelper(this)
                .add("id", id)
                .add("senderId", senderId)
                .add("recipientId", recipientId)
                .toString();
    }

    @Override
    public String toMessage() {
        return content;
    }
} 