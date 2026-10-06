package com.infinitecareers.common;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ApiResponse<T> {

    private T data;
    private Map<String, Object> meta;
    private List<ApiError> errors;

    public ApiResponse() {
        this.meta = new HashMap<>();
        this.meta.put("timestamp", Instant.now().toString());
        this.errors = new ArrayList<>();
    }

    public ApiResponse(T data) {
        this();
        this.data = data;
    }

    public ApiResponse(T data, Map<String, Object> meta) {
        this();
        this.data = data;
        if (meta != null) {
            this.meta.putAll(meta);
        }
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(data);
    }

    public static <T> ApiResponse<T> success(T data, Map<String, Object> meta) {
        return new ApiResponse<>(data, meta);
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        ApiResponse<T> res = new ApiResponse<>();
        res.addError(new ApiError(code, message));
        return res;
    }

    public static <T> ApiResponse<T> error(List<ApiError> errors) {
        ApiResponse<T> res = new ApiResponse<>();
        res.setErrors(errors);
        return res;
    }

    public void addError(ApiError error) {
        if (this.errors == null) {
            this.errors = new ArrayList<>();
        }
        this.errors.add(error);
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public Map<String, Object> getMeta() {
        return meta;
    }

    public void setMeta(Map<String, Object> meta) {
        this.meta = meta;
    }

    public List<ApiError> getErrors() {
        return errors;
    }

    public void setErrors(List<ApiError> errors) {
        this.errors = errors;
    }
}
