package com.sismics.docs.core.dao;

import com.sismics.docs.core.constant.Constants;
import com.sismics.docs.core.model.jpa.UserRequest;
import com.sismics.util.context.ThreadLocalContext;

import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.Query;

import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * User request DAO.
 * 
 * @author jtremeaux
 */
public class UserRequestDao {
    /**
     * Creates a new user request.
     * 
     * @param userRequest User request to create
     * @return User request ID
     */
    public String create(UserRequest userRequest) {
        // Set the ID
        userRequest.setId(UUID.randomUUID().toString());
        
        // Set creation date
        userRequest.setCreateDate(new Date());
        
        // Set status to pending
        userRequest.setStatus(Constants.USER_REQUEST_STATUS_PENDING);
        
        // Create the user request
        EntityManager em = ThreadLocalContext.get().getEntityManager();
        em.persist(userRequest);
        
        return userRequest.getId();
    }
    
    /**
     * Returns an active user request by ID.
     * 
     * @param id User request ID
     * @return User request
     */
    public UserRequest getById(String id) {
        EntityManager em = ThreadLocalContext.get().getEntityManager();
        try {
            return em.find(UserRequest.class, id);
        } catch (NoResultException e) {
            return null;
        }
    }
    
    /**
     * Returns an active user request by username.
     * 
     * @param username Username
     * @return User request
     */
    public UserRequest getByUsername(String username) {
        EntityManager em = ThreadLocalContext.get().getEntityManager();
        try {
            Query q = em.createQuery("select ur from UserRequest ur where ur.username = :username and ur.status = :status");
            q.setParameter("username", username);
            q.setParameter("status", Constants.USER_REQUEST_STATUS_PENDING);
            return (UserRequest) q.getSingleResult();
        } catch (NoResultException e) {
            return null;
        }
    }
    
    /**
     * Update a user request.
     * 
     * @param userRequest User request to update
     * @return Updated user request
     */
    public UserRequest update(UserRequest userRequest) {
        EntityManager em = ThreadLocalContext.get().getEntityManager();
        return em.merge(userRequest);
    }
    
    /**
     * Returns all pending user requests.
     * 
     * @return List of user requests
     */
    @SuppressWarnings("unchecked")
    public List<UserRequest> findPendingRequests() {
        EntityManager em = ThreadLocalContext.get().getEntityManager();
        Query q = em.createQuery("select ur from UserRequest ur where ur.status = :status order by ur.createDate asc");
        q.setParameter("status", Constants.USER_REQUEST_STATUS_PENDING);
        return q.getResultList();
    }
} 