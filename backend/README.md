# InfiniteCareers - Spring Boot Backend

Production-grade modular monolith backend for **InfiniteCareers** ATS & Employee Onboarding SaaS Platform.

## Technology Stack
- **Language & Runtime**: Java 17 (Eclipse Temurin)
- **Framework**: Spring Boot 3.3.0
- **Security**: Spring Security 6 with stateless JWT authentication & tenant isolation filter
- **Data Access**: Spring Data JPA, Hibernate 6.5
- **Database**: PostgreSQL 16
- **Database Migrations**: Flyway
- **Caching & Event Pub/Sub**: Redis 7
- **Build Tool**: Maven 3.9

## Bounded Context Modules
- `identity`: Users, passwords (BCrypt), MFA, user sessions.
- `tenancy`: Tenants, domains, subscriptions, multi-tenant isolation context.
- `recruiting`: Requisitions, job postings, hiring team management.
- `candidates`: Candidate profiles, resumes, skills taxonomy, tags.
- `applications`: Application stages, stage history, AI scoring.
- `interviews`: Scheduling, Google Meet / Zoom integration, scorecards, blind reviews.
- `offers`: Multi-component salary calculations, approval matrices, e-signatures.
- `onboarding`: Preboarding instances, checklist tasks, compliance tracking.
- `employees`: Employee directory, management hierarchy, department mapping.
- `workflow`: Process state machine, triggers, step listeners.
- `audit`: Immutable event logging and compliance trails.
- `notifications`: Multi-channel notification delivery (In-App, Email, Slack).
- `analytics`: Recruitment funnel KPIs, time-to-hire, offer acceptance ratios.
- `integrations`: Webhook listeners and external HCM sync (Darwinbox / Workday).

## Build & Test

```bash
# Run tests
mvn test

# Package JAR
mvn clean package

# Run local Spring Boot server
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Runs on `http://localhost:8080`.
OpenAPI documentation available at `http://localhost:8080/swagger-ui.html`.
