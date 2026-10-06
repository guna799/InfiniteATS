package com.infinitecareers.common.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.infinitecareers.common.events.DomainEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

import java.nio.charset.StandardCharsets;

/**
 * Multi-replica delivery: the replica that claimed an outbox event publishes it to a Redis channel, and every
 * replica (including itself) relays it to its own STOMP clients.
 */
@Configuration
@ConditionalOnProperty(name = "app.realtime.fanout", havingValue = "redis")
public class RedisRealtimeFanout implements RealtimeFanout {

    static final String CHANNEL = "infinitecareers:realtime-events";
    private static final Logger log = LoggerFactory.getLogger(RedisRealtimeFanout.class);

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;

    public RedisRealtimeFanout(StringRedisTemplate redis, ObjectMapper objectMapper) {
        this.redis = redis;
        this.objectMapper = objectMapper;
    }

    @Override
    public void publish(DomainEvent event) {
        try {
            redis.convertAndSend(CHANNEL, objectMapper.writeValueAsString(event));
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException("Cannot serialize event " + event.eventId(), e);
        }
    }

    @Bean
    RedisMessageListenerContainer realtimeEventListener(RedisConnectionFactory connectionFactory,
                                                        RealtimeEventPublisher publisher) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener((message, pattern) -> {
            try {
                DomainEvent event = objectMapper.readValue(
                        new String(message.getBody(), StandardCharsets.UTF_8), DomainEvent.class);
                publisher.broadcastTenantEvent(event);
            } catch (Exception e) {
                log.warn("Dropping malformed realtime event from Redis: {}", e.getMessage());
            }
        }, new ChannelTopic(CHANNEL));
        return container;
    }
}
