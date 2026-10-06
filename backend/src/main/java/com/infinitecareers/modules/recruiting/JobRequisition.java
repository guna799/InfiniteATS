package com.infinitecareers.modules.recruiting;

import com.infinitecareers.common.BaseTenantEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "job_requisitions")
public class JobRequisition extends BaseTenantEntity {

    @Column(name = "req_number", nullable = false)
    private String reqNumber;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "department_id")
    private String departmentId;

    @Column(name = "location_id")
    private String locationId;

    @Column(name = "job_profile_id")
    private String jobProfileId;

    @Column(name = "position_id")
    private String positionId;

    @Column(name = "hiring_manager_id")
    private String hiringManagerId;

    @Column(name = "recruiter_id")
    private String recruiterId;

    @Column(name = "employment_type")
    private String employmentType = "FULL_TIME";

    @Column(name = "headcount")
    private Integer headcount = 1;

    @Column(name = "min_salary", precision = 15, scale = 2)
    private BigDecimal minSalary;

    @Column(name = "max_salary", precision = 15, scale = 2)
    private BigDecimal maxSalary;

    @Column(name = "currency")
    private String currency = "USD";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private RequisitionState status = RequisitionState.DRAFT;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "requirements", columnDefinition = "TEXT")
    private String requirements;

    @Column(name = "benefits", columnDefinition = "TEXT")
    private String benefits;

    @Column(name = "target_start_date")
    private LocalDate targetStartDate;

    @Column(name = "created_by")
    private String createdBy;

    public String getReqNumber() { return reqNumber; }
    public void setReqNumber(String reqNumber) { this.reqNumber = reqNumber; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }
    public String getLocationId() { return locationId; }
    public void setLocationId(String locationId) { this.locationId = locationId; }
    public String getJobProfileId() { return jobProfileId; }
    public void setJobProfileId(String jobProfileId) { this.jobProfileId = jobProfileId; }
    public String getPositionId() { return positionId; }
    public void setPositionId(String positionId) { this.positionId = positionId; }
    public String getHiringManagerId() { return hiringManagerId; }
    public void setHiringManagerId(String hiringManagerId) { this.hiringManagerId = hiringManagerId; }
    public String getRecruiterId() { return recruiterId; }
    public void setRecruiterId(String recruiterId) { this.recruiterId = recruiterId; }
    public String getEmploymentType() { return employmentType; }
    public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }
    public Integer getHeadcount() { return headcount; }
    public void setHeadcount(Integer headcount) { this.headcount = headcount; }
    public BigDecimal getMinSalary() { return minSalary; }
    public void setMinSalary(BigDecimal minSalary) { this.minSalary = minSalary; }
    public BigDecimal getMaxSalary() { return maxSalary; }
    public void setMaxSalary(BigDecimal maxSalary) { this.maxSalary = maxSalary; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public RequisitionState getStatus() { return status; }
    public void setStatus(RequisitionState status) { this.status = status; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getRequirements() { return requirements; }
    public void setRequirements(String requirements) { this.requirements = requirements; }
    public String getBenefits() { return benefits; }
    public void setBenefits(String benefits) { this.benefits = benefits; }
    public LocalDate getTargetStartDate() { return targetStartDate; }
    public void setTargetStartDate(LocalDate targetStartDate) { this.targetStartDate = targetStartDate; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}
