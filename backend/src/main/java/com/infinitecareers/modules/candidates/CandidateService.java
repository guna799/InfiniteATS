package com.infinitecareers.modules.candidates;

import com.infinitecareers.common.TenantContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class CandidateService {

    private final CandidateRepository candidateRepository;

    public CandidateService(CandidateRepository candidateRepository) {
        this.candidateRepository = candidateRepository;
    }

    public List<Candidate> getAllCandidates() {
        return candidateRepository.findByTenantId(TenantContextHolder.getTenantId());
    }

    public Page<Candidate> getCandidates(Pageable pageable) {
        return candidateRepository.findByTenantId(TenantContextHolder.getTenantId(), pageable);
    }

    public Page<Candidate> searchCandidates(String query, Pageable pageable) {
        if (query == null || query.trim().isEmpty()) {
            return getCandidates(pageable);
        }
        return candidateRepository.searchCandidates(TenantContextHolder.getTenantId(), query.trim(), pageable);
    }

    public Candidate getCandidateById(String id) {
        return candidateRepository.findByIdAndTenantId(id, TenantContextHolder.getTenantId())
                .orElseThrow(() -> new NoSuchElementException("Candidate not found: " + id));
    }

    @Transactional
    public Candidate createOrResolveCandidate(Candidate candidate) {
        String tenantId = TenantContextHolder.getTenantId();
        candidate.setTenantId(tenantId);

        // Deduplication Check by Email
        Optional<Candidate> existingOpt = candidateRepository.findByTenantIdAndEmail(tenantId, candidate.getEmail().toLowerCase().trim());
        if (existingOpt.isPresent()) {
            Candidate existing = existingOpt.get();
            if (candidate.getFirstName() != null) existing.setFirstName(candidate.getFirstName());
            if (candidate.getLastName() != null) existing.setLastName(candidate.getLastName());
            if (candidate.getPhone() != null) existing.setPhone(candidate.getPhone());
            if (candidate.getHeadline() != null) existing.setHeadline(candidate.getHeadline());
            if (candidate.getSummary() != null) existing.setSummary(candidate.getSummary());
            if (candidate.getLocation() != null) existing.setLocation(candidate.getLocation());
            if (candidate.getLinkedinUrl() != null) existing.setLinkedinUrl(candidate.getLinkedinUrl());
            if (candidate.getGithubUrl() != null) existing.setGithubUrl(candidate.getGithubUrl());
            if (candidate.getPortfolioUrl() != null) existing.setPortfolioUrl(candidate.getPortfolioUrl());
            return candidateRepository.save(existing);
        }

        candidate.setEmail(candidate.getEmail().toLowerCase().trim());
        return candidateRepository.save(candidate);
    }

    @Transactional
    public Candidate updateCandidate(String id, Candidate updates) {
        Candidate existing = getCandidateById(id);
        if (updates.getFirstName() != null) existing.setFirstName(updates.getFirstName());
        if (updates.getLastName() != null) existing.setLastName(updates.getLastName());
        if (updates.getPhone() != null) existing.setPhone(updates.getPhone());
        if (updates.getHeadline() != null) existing.setHeadline(updates.getHeadline());
        if (updates.getSummary() != null) existing.setSummary(updates.getSummary());
        if (updates.getLocation() != null) existing.setLocation(updates.getLocation());
        if (updates.getLinkedinUrl() != null) existing.setLinkedinUrl(updates.getLinkedinUrl());
        if (updates.getGithubUrl() != null) existing.setGithubUrl(updates.getGithubUrl());
        if (updates.getPortfolioUrl() != null) existing.setPortfolioUrl(updates.getPortfolioUrl());
        if (updates.getStatus() != null) existing.setStatus(updates.getStatus());
        return candidateRepository.save(existing);
    }

    @Transactional
    public void deleteCandidate(String id) {
        Candidate existing = getCandidateById(id);
        candidateRepository.delete(existing);
    }
}
