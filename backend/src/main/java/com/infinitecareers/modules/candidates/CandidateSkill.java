package com.infinitecareers.modules.candidates;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "candidate_skills")
public class CandidateSkill {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "candidate_id", length = 64)
    private String candidateId;

    @Column(name = "skill_name", nullable = false)
    private String skillName;

    @Column(name = "years_experience")
    private Integer yearsExperience = 0;

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCandidateId() { return candidateId; }
    public void setCandidateId(String candidateId) { this.candidateId = candidateId; }
    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }
    public Integer getYearsExperience() { return yearsExperience; }
    public void setYearsExperience(Integer yearsExperience) { this.yearsExperience = yearsExperience; }
}
