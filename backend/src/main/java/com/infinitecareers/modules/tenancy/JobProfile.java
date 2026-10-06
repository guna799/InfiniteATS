package com.infinitecareers.modules.tenancy;

import com.infinitecareers.common.BaseTenantEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "job_profiles")
public class JobProfile extends BaseTenantEntity {

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "job_code", nullable = false)
    private String jobCode;

    @Column(name = "job_family")
    private String jobFamily;

    @Column(name = "level")
    private String level;

    @Column(name = "standard_description", columnDefinition = "TEXT")
    private String standardDescription;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getJobCode() { return jobCode; }
    public void setJobCode(String jobCode) { this.jobCode = jobCode; }
    public String getJobFamily() { return jobFamily; }
    public void setJobFamily(String jobFamily) { this.jobFamily = jobFamily; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public String getStandardDescription() { return standardDescription; }
    public void setStandardDescription(String standardDescription) { this.standardDescription = standardDescription; }
}
