package com.sismics.util.jpa;

import com.sismics.util.context.ThreadLocalContext;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

import java.util.List;

/**
 * Base DAO class.
 * 
 * @author jtremeaux
 */
public abstract class BaseDao<T> {
    protected EntityManager getEntityManager() {
        return ThreadLocalContext.get().getEntityManager();
    }

    protected Query createQuery(String query) {
        return getEntityManager().createQuery(query);
    }

    protected List<T> getResultList(Query query) {
        return query.getResultList();
    }

    protected T getSingleResult(Query query) {
        return (T) query.getSingleResult();
    }
} 