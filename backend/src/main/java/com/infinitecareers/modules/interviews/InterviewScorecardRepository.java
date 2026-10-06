package com.infinitecareers.modules.interviews;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewScorecardRepository extends JpaRepository<InterviewScorecard, String> {
    List<InterviewScorecard> findByTenantIdAndInterviewId(String tenantId, String interviewId);
}
