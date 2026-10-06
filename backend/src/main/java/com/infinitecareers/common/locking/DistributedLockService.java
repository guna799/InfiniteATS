package com.infinitecareers.common.locking;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.Callable;

@Service
public class DistributedLockService {

    private final StringRedisTemplate redisTemplate;

    public DistributedLockService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public String acquireLock(String lockKey, Duration leaseTime) {
        String token = UUID.randomUUID().toString();
        Boolean success = redisTemplate.opsForValue().setIfAbsent(lockKey, token, leaseTime);
        if (Boolean.TRUE.equals(success)) {
            return token;
        }
        return null;
    }

    public boolean releaseLock(String lockKey, String token) {
        String currentToken = redisTemplate.opsForValue().get(lockKey);
        if (token != null && token.equals(currentToken)) {
            redisTemplate.delete(lockKey);
            return true;
        }
        return false;
    }

    public <T> T executeWithLock(String lockKey, Duration leaseTime, Callable<T> task) throws Exception {
        String token = acquireLock(lockKey, leaseTime);
        if (token == null) {
            throw new IllegalStateException("Could not acquire distributed lock for key: " + lockKey + ". Another process is executing.");
        }
        try {
            return task.call();
        } finally {
            releaseLock(lockKey, token);
        }
    }
}
