package com.sismics.docs.core.model.jpa;

import java.util.Date;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * User registration request entity.
 * 
 * @author jtremeaux
 */
@Entity
@Table(name = "T_USER_REQUEST")
public class UserRequest {
    /**
     * Request ID.
     */
    @Id
    @Column(name = "URQ_ID_C", length = 36)
    private String id;
    
    /**
     * Username.
     */
    @Column(name = "URQ_USERNAME_C", nullable = false, length = 50)
    private String username;
    
    /**
     * Password (encrypted).
     */
    @Column(name = "URQ_PASSWORD_C", nullable = false, length = 100)
    private String password;
    
    /**
     * Email address.
     */
    @Column(name = "URQ_EMAIL_C", nullable = false, length = 100)
    private String email;
    
    /**
     * Storage quota requested.
     */
    @Column(name = "URQ_STORAGEQUOTA_N", nullable = false)
    private Long storageQuota;
    
    /**
     * Request date.
     */
    @Column(name = "URQ_CREATEDATE_D", nullable = false)
    private Date createDate;
    
    /**
     * Processing date.
     */
    @Column(name = "URQ_PROCESSDATE_D")
    private Date processDate;
    
    /**
     * Request status (PENDING, APPROVED, REJECTED).
     */
    @Column(name = "URQ_STATUS_C", nullable = false, length = 10)
    private String status;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Long getStorageQuota() {
        return storageQuota;
    }

    public void setStorageQuota(Long storageQuota) {
        this.storageQuota = storageQuota;
    }

    public Date getCreateDate() {
        return createDate;
    }

    public void setCreateDate(Date createDate) {
        this.createDate = createDate;
    }

    public Date getProcessDate() {
        return processDate;
    }

    public void setProcessDate(Date processDate) {
        this.processDate = processDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
} 