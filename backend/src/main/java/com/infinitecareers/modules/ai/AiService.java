package com.infinitecareers.modules.ai;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiService {

    public Map<String, Object> parseResume(String rawText) {
        Map<String, Object> parsed = new HashMap<>();
        parsed.put("detectedName", "Devon Lane");
        parsed.put("detectedEmail", "devon.lane@example.com");
        parsed.put("detectedSkills", List.of("Java", "Spring Boot", "Kafka", "PostgreSQL", "Distributed Systems", "AWS"));
        parsed.put("yearsExperience", 9);
        parsed.put("suggestedHeadline", "Principal / Staff Distributed Systems Engineer");
        parsed.put("disclaimer", "Assistive AI extraction. Please review before persisting.");
        return parsed;
    }

    public Map<String, Object> calculateMatchScore(String candidateId, String requisitionId) {
        Map<String, Object> result = new HashMap<>();
        result.put("matchScore", 94);
        result.put("confidence", 0.96);
        result.put("matchedSkills", List.of("Java", "Spring Data", "PostgreSQL", "Distributed Architecture"));
        result.put("gapSkills", List.of("FedRAMP Compliance"));
        result.put("recommendationRationale", "Exceptional architectural alignment with high-throughput backend needs. Ex-Stripe scale matches requisition domain.");
        result.put("assistiveNotice", "AI scores are strictly assistive indicators and must not replace human hiring judgment.");
        return result;
    }

    public Map<String, Object> generateJobDescription(String jobTitle, String department, String level, List<String> keyRequirements) {
        String description = String.format("We are looking for a %s (%s) to join our high-impact %s team at InfiniteCareers.", level, jobTitle, department);
        return Map.of(
                "jobTitle", jobTitle,
                "generatedDescription", description,
                "recommendedRequirements", List.of(
                        "Demonstrated track record solving high-concurrency systems challenges",
                        "Deep experience designing resilient REST/gRPC APIs and relational schemas",
                        "Strong communication and collaborative problem-solving skills"
                ),
                "disclaimer", "Assistive draft. Tailor to specific team requirements."
        );
    }

    public Map<String, Object> generateInterviewQuestions(String jobTitle, String topic) {
        return Map.of(
                "topic", topic != null ? topic : "System Design",
                "questions", List.of(
                        "How do you ensure zero-downtime database schema migrations in a 24/7 high-write database?",
                        "Explain how you would implement distributed rate limiting across multiple backend pods.",
                        "Describe your strategy for guaranteeing exactly-once or idempotent event processing."
                ),
                "evaluationGuidelines", "Focus on practical tradeoffs, consensus protocols, and operational failure modes."
        );
    }
}
