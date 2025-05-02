package com.sismics.util.jpa.filter;

import java.util.HashMap;
import java.util.Map;

/**
 * Base class for filter criteria.
 * 
 * @author jtremeaux
 */
public abstract class FilterCriteria {
    private Map<String, Object> parameterMap = new HashMap<>();

    public Map<String, Object> getParameterMap() {
        return parameterMap;
    }

    public void setParameterMap(Map<String, Object> parameterMap) {
        this.parameterMap = parameterMap;
    }

    public abstract String getCriteriaString();
} 