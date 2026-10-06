package com.infinitecareers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.infinitecareers.common.JwtTokenProvider;
import com.infinitecareers.common.events.DomainEvent;
import com.infinitecareers.common.events.EventTypes;
import com.infinitecareers.common.events.OutboxEvent;
import com.infinitecareers.common.events.OutboxEventPoller;
import com.infinitecareers.common.events.OutboxEventRepository;
import com.infinitecareers.common.websocket.RealtimeFanout;
import com.infinitecareers.modules.applications.Application;
import com.infinitecareers.modules.applications.ApplicationRepository;
import com.infinitecareers.modules.applications.ApplicationStageHistoryRepository;
import com.infinitecareers.modules.audit.AuditLogRepository;
import com.infinitecareers.modules.identity.AuthDto;
import com.infinitecareers.modules.identity.AuthService;
import com.infinitecareers.modules.identity.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "app.security.allow-tenant-header=false",
        "app.outbox.poller-enabled=false" // drained explicitly so delivery is deterministic
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RealtimePipelineTest {

    private static final String PASSWORD = "Recruiter-Passw0rd!";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private AuthService authService;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private ApplicationRepository applicationRepository;
    @Autowired private ApplicationStageHistoryRepository historyRepository;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private OutboxEventRepository outboxRepository;
    @Autowired private OutboxEventPoller poller;
    @MockBean private RealtimeFanout fanout;

    private String acmeToken;
    private String nexusToken;
    private String applicationId;

    @BeforeEach
    void setUp() {
        acmeToken = loginAs("sravanthi.allu@acme.in").getAccessToken();
        nexusToken = loginAs("rohan.sharma@nexushealth.in").getAccessToken();

        Application app = new Application();
        app.setId("app-test-" + UUID.randomUUID());
        app.setTenantId("tenant-acme-tech");
        app.setCandidateId("cand-03");
        app.setRequisitionId("req-eng-103");
        app.setStage("SCREENING");
        applicationId = applicationRepository.save(app).getId();

        outboxRepository.deleteAll();
        reset(fanout);
    }

    private AuthDto.AuthResponse loginAs(String email) {
        var user = userRepository.findByEmail(email).orElseThrow();
        user.setPasswordHash(passwordEncoder.encode(PASSWORD));
        userRepository.save(user);
        AuthDto.LoginRequest req = new AuthDto.LoginRequest();
        req.setEmail(email);
        req.setPassword(PASSWORD);
        return authService.login(req);
    }

    private MockHttpServletRequestBuilder move(String stage, Long expectedVersion, String reason) throws Exception {
        var body = new java.util.HashMap<String, Object>();
        body.put("stage", stage);
        body.put("expectedVersion", expectedVersion);
        body.put("reason", reason);
        return post("/api/v1/applications/{id}/move-stage", applicationId)
                .cookie(new Cookie(JwtTokenProvider.ACCESS_COOKIE, acmeToken))
                .header("X-Requested-With", "InfiniteCareers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body));
    }

    private long currentVersion() {
        return applicationRepository.findById(applicationId).orElseThrow().getVersion();
    }

    @Test
    @DisplayName("Board is readable with the HttpOnly cookie and scoped to the caller's tenant")
    void boardWithCookieAuth() throws Exception {
        String json = mockMvc.perform(get("/api/v1/pipeline/board")
                        .cookie(new Cookie(JwtTokenProvider.ACCESS_COOKIE, acmeToken)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode cards = objectMapper.readTree(json).path("data").path("cards");
        assertTrue(cards.size() > 0);
        boolean found = false;
        for (JsonNode card : cards) {
            if (card.path("applicationId").asText().equals(applicationId)) {
                found = true;
                assertEquals("SCREENING", card.path("stage").asText());
                assertFalse(card.path("candidate").path("name").asText().isBlank());
                assertFalse(card.path("requisition").path("title").asText().isBlank());
            }
        }
        assertTrue(found, "new application should be on the board");

        // The other tenant cannot see it
        String nexus = mockMvc.perform(get("/api/v1/pipeline/board")
                        .cookie(new Cookie(JwtTokenProvider.ACCESS_COOKIE, nexusToken)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertFalse(nexus.contains(applicationId));
    }

    @Test
    @DisplayName("Cookie-authenticated writes need the CSRF header; refresh tokens are not access tokens")
    void csrfAndRefreshTokenGuards() throws Exception {
        mockMvc.perform(post("/api/v1/applications/{id}/move-stage", applicationId)
                        .cookie(new Cookie(JwtTokenProvider.ACCESS_COOKIE, acmeToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"stage\":\"PHONE_SCREEN\"}"))
                .andExpect(status().isForbidden());
        assertEquals("SCREENING", applicationRepository.findById(applicationId).orElseThrow().getStage());

        String refresh = loginAs("sravanthi.allu@acme.in").getRefreshToken();
        mockMvc.perform(get("/api/v1/pipeline/board").header("Authorization", "Bearer " + refresh))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("A stage move writes history, audit and one CANDIDATE_STAGE_CHANGED envelope, delivered exactly once")
    void moveStageEmitsEventAndDeliversOnce() throws Exception {
        long version = currentVersion();
        int historyBefore = historyRepository.findByApplicationIdOrderByCreatedAtDesc(applicationId).size();

        mockMvc.perform(move("PHONE_SCREEN", version, null).header("X-Correlation-ID", "REQ-test-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stage").value("PHONE_SCREEN"))
                .andExpect(jsonPath("$.data.version").value(version + 1));

        assertEquals(historyBefore + 1, historyRepository.findByApplicationIdOrderByCreatedAtDesc(applicationId).size());
        assertFalse(auditLogRepository.findByTenantIdAndResourceTypeAndResourceId(
                "tenant-acme-tech", "APPLICATION", applicationId).isEmpty());

        List<OutboxEvent> pending = outboxRepository.findPendingEvents(org.springframework.data.domain.PageRequest.of(0, 10));
        assertEquals(1, pending.size());
        DomainEvent stored = objectMapper.readValue(pending.get(0).getPayloadJson(), DomainEvent.class);
        assertEquals(EventTypes.CANDIDATE_STAGE_CHANGED, stored.eventType());
        assertEquals("tenant-acme-tech", stored.tenantId());
        assertEquals("APPLICATION", stored.entityType());
        assertEquals(applicationId, stored.entityId());
        assertEquals("user-sravanthi-allu", stored.actorId());
        assertEquals("REQ-test-123", stored.correlationId());
        assertEquals("SCREENING", stored.payload().get("fromStage"));
        assertEquals("PHONE_SCREEN", stored.payload().get("toStage"));
        assertNotNull(stored.payload().get("card"));

        poller.drainOnce();
        poller.drainOnce();
        ArgumentCaptor<DomainEvent> delivered = ArgumentCaptor.forClass(DomainEvent.class);
        verify(fanout, times(1)).publish(delivered.capture());
        assertEquals(stored.eventId(), delivered.getValue().eventId());
        assertEquals("PUBLISHED", outboxRepository.findById(stored.eventId()).orElseThrow().getStatus());
    }

    @Test
    @DisplayName("A move based on an outdated version is rejected with the current card")
    void staleMoveIsRejected() throws Exception {
        long version = currentVersion();
        mockMvc.perform(move("PHONE_SCREEN", version, null)).andExpect(status().isOk());

        mockMvc.perform(move("TECHNICAL_INTERVIEW", version, null))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errors[0].code").value("STALE_STATE"))
                .andExpect(jsonPath("$.errors[0].details.current.stage").value("PHONE_SCREEN"));
        assertEquals("PHONE_SCREEN", applicationRepository.findById(applicationId).orElseThrow().getStage());
    }

    @Test
    @DisplayName("Invalid stages and rejection without a reason are refused; other tenants get 404")
    void validationAndTenantIsolation() throws Exception {
        mockMvc.perform(move("NOT_A_STAGE", null, null)).andExpect(status().isBadRequest());
        mockMvc.perform(move("REJECTED", null, null)).andExpect(status().isBadRequest());
        mockMvc.perform(move("REJECTED", null, "Skills mismatch"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stage").value("REJECTED"));
        assertEquals("REJECTED", applicationRepository.findById(applicationId).orElseThrow().getStatus());

        mockMvc.perform(post("/api/v1/applications/{id}/move-stage", applicationId)
                        .header("Authorization", "Bearer " + nexusToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"stage\":\"APPLIED\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Failed deliveries are retried and give up after the retry limit; claims are exclusive")
    void retriesAndExclusiveClaims() throws Exception {
        mockMvc.perform(move("PHONE_SCREEN", null, null)).andExpect(status().isOk());
        String eventId = outboxRepository.findAll().get(0).getId();

        doThrow(new IllegalStateException("broker down")).when(fanout).publish(any());
        poller.drainOnce();
        OutboxEvent afterOne = outboxRepository.findById(eventId).orElseThrow();
        assertEquals("PENDING", afterOne.getStatus());
        assertEquals(1, afterOne.getRetryCount());

        for (int i = 0; i < 4; i++) {
            poller.drainOnce();
        }
        assertEquals("FAILED", outboxRepository.findById(eventId).orElseThrow().getStatus());

        // Exclusive claim: only the first claimer wins
        mockMvc.perform(move("TECHNICAL_INTERVIEW", null, null)).andExpect(status().isOk());
        String second = outboxRepository.findPendingEvents(org.springframework.data.domain.PageRequest.of(0, 1)).get(0).getId();
        assertEquals(1, outboxRepository.claim(second, Instant.now()));
        assertEquals(0, outboxRepository.claim(second, Instant.now()));
    }
}
