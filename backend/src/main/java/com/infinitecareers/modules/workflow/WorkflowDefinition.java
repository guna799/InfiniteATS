package com.infinitecareers.modules.workflow;

import com.infinitecareers.common.BaseTenantEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "workflow_definitions")
public class WorkflowDefinition extends BaseTenantEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "trigger_event", nullable = false)
    private String triggerEvent;

    @Column(name = "is_active")
    private Boolean isActive = true;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getTriggerEvent() { return triggerEvent; }
    public void setTriggerEvent(String triggerEvent) { this.triggerEvent = triggerEvent; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean active) { isActive = active; }
}
