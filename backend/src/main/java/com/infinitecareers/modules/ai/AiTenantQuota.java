package com.infinitecareers.modules.ai;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "ai_tenant_quotas")
public class AiTenantQuota {

    @Id
    private String id;

    @Column(name = "tenant_id", nullable = false, unique = true)
    private String tenantId;

    @Column(name = "monthly_token_limit", nullable = false)
    private Long monthlyTokenLimit = 1000000L;

    @Column(name = "daily_request_limit", nullable = false)
    private Integer dailyRequestLimit = 1000;

    @Column(name = "current_month_tokens_used", nullable = false)
    private Long currentMonthTokensUsed = 0L;

    @Column(name = "today_requests_used", nullable = false)
    private Integer todayRequestsUsed = 0;

    @Column(name = "quota_reset_at", nullable = false)
    private Instant quotaResetAt = Instant.now().plusSeconds(86400 * 30);

    @Column(name = "is_hard_capped", nullable = false)
    private Boolean isHardCapped = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public Long getMonthlyTokenLimit() { return monthlyTokenLimit; }
    public void setMonthlyTokenLimit(Long monthlyTokenLimit) { this.monthlyTokenLimit = monthlyTokenLimit; }
    public Integer getDailyRequestLimit() { return dailyRequestLimit; }
    public void setDailyRequestLimit(Integer dailyRequestLimit) { this.dailyRequestLimit = dailyRequestLimit; }
    public Long getCurrentMonthTokensUsed() { return currentMonthTokensUsed; }
    public void setCurrentMonthTokensUsed(Long currentMonthTokensUsed) { this.currentMonthTokensUsed = currentMonthTokensUsed; }
    public Integer getTodayRequestsUsed() { return todayRequestsUsed; }
    public void setTodayRequestsUsed(Integer todayRequestsUsed) { this.todayRequestsUsed = todayRequestsUsed; }
    public Instant getQuotaResetAt() { return quotaResetAt; }
    public void setQuotaResetAt(Instant quotaResetAt) { this.quotaResetAt = quotaResetAt; }
    public Boolean getIsHardCapped() { return isHardCapped; }
    public void setIsHardCapped(Boolean isHardCapped) { this.isHardCapped = isHardCapped; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
