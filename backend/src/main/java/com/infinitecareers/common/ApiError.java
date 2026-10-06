package com.infinitecareers.common;

import java.util.Map;

public class ApiError {
    private String code;
    private String message;
    private String field;
    private Map<String, Object> details;

    public ApiError() {}

    public ApiError(String code, String message) {
        this.code = code;
        this.message = message;
    }

    public ApiError(String code, String message, String field) {
        this.code = code;
        this.message = message;
        this.field = field;
    }

    public ApiError(String code, String message, String field, Map<String, Object> details) {
        this.code = code;
        this.message = message;
        this.field = field;
        this.details = details;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getField() {
        return field;
    }

    public void setField(String field) {
        this.field = field;
    }

    public Map<String, Object> getDetails() {
        return details;
    }

    public void setDetails(Map<String, Object> details) {
        this.details = details;
    }
}
