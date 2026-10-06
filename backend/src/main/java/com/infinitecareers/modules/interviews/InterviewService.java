package com.infinitecareers.modules.interviews;

import com.infinitecareers.common.TenantContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final InterviewScorecardRepository scorecardRepository;

    public InterviewService(InterviewRepository interviewRepository, InterviewScorecardRepository scorecardRepository) {
        this.interviewRepository = interviewRepository;
        this.scorecardRepository = scorecardRepository;
    }

    public List<Interview> getInterviews(String applicationId) {
        String tenantId = TenantContextHolder.getTenantId();
        if (applicationId != null && !applicationId.trim().isEmpty()) {
            return interviewRepository.findByTenantIdAndApplicationId(tenantId, applicationId);
        }
        return interviewRepository.findByTenantId(tenantId);
    }

    public Interview getInterviewById(String id) {
        return interviewRepository.findByIdAndTenantId(id, TenantContextHolder.getTenantId())
                .orElseThrow(() -> new NoSuchElementException("Interview not found: " + id));
    }

    @Transactional
    public Interview scheduleInterview(Interview interview) {
        interview.setTenantId(TenantContextHolder.getTenantId());
        interview.setStatus("SCHEDULED");
        return interviewRepository.save(interview);
    }

    @Transactional
    public Interview updateInterview(String id, Interview updates) {
        Interview existing = getInterviewById(id);
        if (updates.getTitle() != null) existing.setTitle(updates.getTitle());
        if (updates.getScheduledStart() != null) existing.setScheduledStart(updates.getScheduledStart());
        if (updates.getScheduledEnd() != null) existing.setScheduledEnd(updates.getScheduledEnd());
        if (updates.getTimeZone() != null) existing.setTimeZone(updates.getTimeZone());
        if (updates.getLocation() != null) existing.setLocation(updates.getLocation());
        if (updates.getMeetingLink() != null) existing.setMeetingLink(updates.getMeetingLink());
        if (updates.getStatus() != null) existing.setStatus(updates.getStatus());
        if (updates.getFeedbackNotes() != null) existing.setFeedbackNotes(updates.getFeedbackNotes());
        return interviewRepository.save(existing);
    }

    @Transactional
    public InterviewScorecard submitScorecard(String interviewId, InterviewScorecard scorecard) {
        Interview interview = getInterviewById(interviewId);
        scorecard.setTenantId(interview.getTenantId());
        scorecard.setInterviewId(interview.getId());
        scorecard.setSubmittedBy(TenantContextHolder.getUserId() != null ? TenantContextHolder.getUserId() : "evaluator");
        
        interview.setStatus("COMPLETED");
        interviewRepository.save(interview);

        return scorecardRepository.save(scorecard);
    }

    public List<InterviewScorecard> getScorecards(String interviewId) {
        return scorecardRepository.findByTenantIdAndInterviewId(TenantContextHolder.getTenantId(), interviewId);
    }
}
