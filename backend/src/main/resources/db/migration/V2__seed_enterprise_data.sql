-- =========================================================================
-- INFINITECAREERS ENTERPRISE SEED DATA - V2 (INDIAN WORKFORCE)
-- Telugu, Kannada, and Hindi names representation
-- =========================================================================

-- 1. TENANTS
INSERT INTO tenants (id, name, slug, tier, status, logo_url, primary_color) VALUES
('tenant-acme-tech', 'Acme Technologies India', 'acme-tech', 'ENTERPRISE', 'ACTIVE', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80', '#4F46E5'),
('tenant-nexus-health', 'Nexus Health & AI Labs', 'nexus-health', 'ENTERPRISE', 'ACTIVE', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=128&q=80', '#0284C7');

-- 2. PERMISSIONS
INSERT INTO permissions (id, name, resource_name, action, description) VALUES
('perm-cand-read', 'CANDIDATE_READ', 'CANDIDATE', 'READ', 'View candidates and candidate profiles'),
('perm-cand-create', 'CANDIDATE_CREATE', 'CANDIDATE', 'CREATE', 'Create candidate records and import resumes'),
('perm-cand-update', 'CANDIDATE_UPDATE', 'CANDIDATE', 'UPDATE', 'Update candidate profiles and tags'),
('perm-cand-delete', 'CANDIDATE_DELETE', 'CANDIDATE', 'DELETE', 'Delete or archive candidate records'),
('perm-req-read', 'REQUISITION_READ', 'REQUISITION', 'READ', 'View job requisitions and postings'),
('perm-req-create', 'REQUISITION_CREATE', 'REQUISITION', 'CREATE', 'Create new job requisitions'),
('perm-req-approve', 'REQUISITION_APPROVE', 'REQUISITION', 'APPROVE', 'Approve or reject job requisitions'),
('perm-app-read', 'APPLICATION_READ', 'APPLICATION', 'READ', 'View job applications and pipeline status'),
('perm-app-update', 'APPLICATION_UPDATE', 'APPLICATION', 'UPDATE', 'Move applications across stages'),
('perm-int-read', 'INTERVIEW_READ', 'INTERVIEW', 'READ', 'View scheduled interviews and scorecards'),
('perm-int-create', 'INTERVIEW_CREATE', 'INTERVIEW', 'CREATE', 'Schedule interviews and submit scorecards'),
('perm-off-read', 'OFFER_READ', 'OFFER', 'READ', 'View candidate offers'),
('perm-off-create', 'OFFER_CREATE', 'OFFER', 'CREATE', 'Draft and generate offer letters'),
('perm-off-approve', 'OFFER_APPROVE', 'OFFER', 'APPROVE', 'Approve executive/compensation offers'),
('perm-onb-read', 'ONBOARDING_READ', 'ONBOARDING', 'READ', 'View onboarding tasks and preboarding progress'),
('perm-onb-update', 'ONBOARDING_UPDATE', 'ONBOARDING', 'UPDATE', 'Manage onboarding tasks and verify documents'),
('perm-emp-read', 'EMPLOYEE_READ', 'EMPLOYEE', 'READ', 'View employee directory and org charts'),
('perm-emp-update', 'EMPLOYEE_UPDATE', 'EMPLOYEE', 'UPDATE', 'Update employee profiles and positions'),
('perm-audit-read', 'AUDIT_READ', 'AUDIT', 'READ', 'View immutable audit trail logs'),
('perm-wf-manage', 'WORKFLOW_MANAGE', 'WORKFLOW', 'MANAGE', 'Build and execute automated workflows');

-- 3. SYSTEM ROLES
INSERT INTO roles (id, tenant_id, name, description, is_system_role) VALUES
('role-tenant-admin', NULL, 'SUPER_ADMIN', 'Full tenant platform administration', TRUE),
('role-recruiter', NULL, 'RECRUITER', 'Recruiter managing candidate pipelines and interviews', TRUE),
('role-hiring-manager', NULL, 'HIRING_MANAGER', 'Hiring manager evaluating candidates and approving requisitions', TRUE),
('role-interviewer', NULL, 'INTERVIEWER', 'Interviewer conducting sessions and submitting scorecards', TRUE),
('role-hr-ops', NULL, 'HR_OPS', 'HR Operations managing offers, preboarding, and onboarding', TRUE);

-- Map permissions to roles
INSERT INTO role_permissions (role_id, permission_id) VALUES
('role-tenant-admin', 'perm-cand-read'), ('role-tenant-admin', 'perm-cand-create'), ('role-tenant-admin', 'perm-cand-update'), ('role-tenant-admin', 'perm-cand-delete'),
('role-tenant-admin', 'perm-req-read'), ('role-tenant-admin', 'perm-req-create'), ('role-tenant-admin', 'perm-req-approve'),
('role-tenant-admin', 'perm-app-read'), ('role-tenant-admin', 'perm-app-update'),
('role-tenant-admin', 'perm-int-read'), ('role-tenant-admin', 'perm-int-create'),
('role-tenant-admin', 'perm-off-read'), ('role-tenant-admin', 'perm-off-create'), ('role-tenant-admin', 'perm-off-approve'),
('role-tenant-admin', 'perm-onb-read'), ('role-tenant-admin', 'perm-onb-update'),
('role-tenant-admin', 'perm-emp-read'), ('role-tenant-admin', 'perm-emp-update'),
('role-tenant-admin', 'perm-audit-read'), ('role-tenant-admin', 'perm-wf-manage'),
('role-recruiter', 'perm-cand-read'), ('role-recruiter', 'perm-cand-create'), ('role-recruiter', 'perm-cand-update'),
('role-recruiter', 'perm-req-read'), ('role-recruiter', 'perm-req-create'),
('role-recruiter', 'perm-app-read'), ('role-recruiter', 'perm-app-update'),
('role-recruiter', 'perm-int-read'), ('role-recruiter', 'perm-int-create'),
('role-recruiter', 'perm-off-read'), ('role-recruiter', 'perm-off-create'),
('role-recruiter', 'perm-onb-read'),
('role-hiring-manager', 'perm-cand-read'), ('role-hiring-manager', 'perm-req-read'), ('role-hiring-manager', 'perm-req-create'),
('role-hiring-manager', 'perm-app-read'), ('role-hiring-manager', 'perm-app-update'),
('role-hiring-manager', 'perm-int-read'), ('role-hiring-manager', 'perm-int-create'),
('role-interviewer', 'perm-cand-read'), ('role-interviewer', 'perm-int-read'), ('role-interviewer', 'perm-int-create'),
('role-hr-ops', 'perm-off-read'), ('role-hr-ops', 'perm-off-create'), ('role-hr-ops', 'perm-off-approve'),
('role-hr-ops', 'perm-onb-read'), ('role-hr-ops', 'perm-onb-update'), ('role-hr-ops', 'perm-emp-read'), ('role-hr-ops', 'perm-emp-update');

-- 4. USERS (BCrypt password for 'Password123!': $2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a)
INSERT INTO users (id, email, password_hash, first_name, last_name, avatar_url, phone, is_active, email_verified) VALUES
('user-admin-01', 'admin@infinitecareers.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Gunavardhan', 'Mandala', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&q=80', '+91-98490-12345', TRUE, TRUE),
('user-sravanthi-allu', 'sravanthi.allu@acme.in', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Sravanthi', 'Allu', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=128&q=80', '+91-98480-23456', TRUE, TRUE),
('user-sai-charan', 'sai.charan@acme.in', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Sai Charan', 'Reddy', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&q=80', '+91-98480-34567', TRUE, TRUE),
('user-ananya-rao', 'ananya.rao@acme.in', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Ananya', 'Rao', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=128&q=80', '+91-98860-45678', TRUE, TRUE),
('user-prajwal-gowda', 'prajwal.gowda@acme.in', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Prajwal', 'Gowda', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&q=80', '+91-99000-56789', TRUE, TRUE),
('user-rohan-sharma', 'rohan.sharma@nexushealth.in', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Rohan', 'Sharma', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=128&q=80', '+91-98110-67890', TRUE, TRUE),
('user-priya-verma', 'priya.verma@nexushealth.in', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Priya', 'Verma', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=128&q=80', '+91-98100-78901', TRUE, TRUE);

-- Tenant Memberships & Roles
INSERT INTO tenant_memberships (id, tenant_id, user_id, data_scope) VALUES
('tm-admin-acme', 'tenant-acme-tech', 'user-admin-01', 'TENANT'),
('tm-sravanthi-acme', 'tenant-acme-tech', 'user-sravanthi-allu', 'TENANT'),
('tm-sai-acme', 'tenant-acme-tech', 'user-sai-charan', 'DEPARTMENT'),
('tm-ananya-acme', 'tenant-acme-tech', 'user-ananya-rao', 'TENANT'),
('tm-rohan-nexus', 'tenant-nexus-health', 'user-rohan-sharma', 'TENANT');

INSERT INTO user_roles (membership_id, role_id) VALUES
('tm-admin-acme', 'role-tenant-admin'),
('tm-sravanthi-acme', 'role-recruiter'),
('tm-sravanthi-acme', 'role-hr-ops'),
('tm-sai-acme', 'role-hiring-manager'),
('tm-ananya-acme', 'role-tenant-admin'),
('tm-rohan-nexus', 'role-tenant-admin');

-- 5. DEPARTMENTS & LOCATIONS
INSERT INTO departments (id, tenant_id, name, code) VALUES
('dept-eng-acme', 'tenant-acme-tech', 'Engineering & Platform', 'ENG'),
('dept-prod-acme', 'tenant-acme-tech', 'Product & Design', 'PROD'),
('dept-sales-acme', 'tenant-acme-tech', 'Enterprise Sales', 'SALES'),
('dept-med-nexus', 'tenant-nexus-health', 'AI Clinical Informatics', 'AI-MED');

INSERT INTO locations (id, tenant_id, name, city, state_province, country, is_remote) VALUES
('loc-hyd-acme', 'tenant-acme-tech', 'Hyderabad HITEC City HQ', 'Hyderabad', 'Telangana', 'India', FALSE),
('loc-blr-acme', 'tenant-acme-tech', 'Bengaluru Innovation Center', 'Bengaluru', 'Karnataka', 'India', FALSE),
('loc-remote-acme', 'tenant-acme-tech', 'India Remote', 'Remote', 'All India', 'India', TRUE),
('loc-pun-nexus', 'tenant-nexus-health', 'Pune Cyber City Hub', 'Pune', 'Maharashtra', 'India', FALSE);

-- 6. JOB REQUISITIONS & POSTINGS
INSERT INTO job_requisitions (id, tenant_id, req_number, title, department_id, location_id, hiring_manager_id, recruiter_id, employment_type, headcount, min_salary, max_salary, currency, status, description, requirements) VALUES
('req-eng-101', 'tenant-acme-tech', 'REQ-HYD-2026-101', 'Principal Distributed Systems Engineer', 'dept-eng-acme', 'loc-hyd-acme', 'user-sai-charan', 'user-sravanthi-allu', 'FULL_TIME', 1, 4800000.00, 6200000.00, 'INR', 'OPEN', 'Lead architecture of core transaction pipeline processing billions of daily events.', '10+ years experience in Java/Go, high-throughput distributed systems, Kafka, and Postgres.'),
('req-prod-102', 'tenant-acme-tech', 'REQ-BLR-2026-102', 'Staff Product Designer', 'dept-prod-acme', 'loc-blr-acme', 'user-sai-charan', 'user-sravanthi-allu', 'FULL_TIME', 1, 3800000.00, 5200000.00, 'INR', 'OPEN', 'Craft enterprise-grade user journeys for multi-tenant HCM platform.', '7+ years experience in Figma, design systems, complex data table UX, and B2B SaaS workflows.'),
('req-eng-103', 'tenant-acme-tech', 'REQ-REM-2026-103', 'Senior Security & Compliance Engineer', 'dept-eng-acme', 'loc-remote-acme', 'user-sai-charan', 'user-sravanthi-allu', 'FULL_TIME', 1, 4000000.00, 5600000.00, 'INR', 'PENDING_APPROVAL', 'Spearhead SOC2 Type II, FedRAMP, and Zero Trust architecture implementations.', '5+ years experience in cloud security, AWS, IAM, OAuth/OIDC, and threat modeling.');

INSERT INTO job_postings (id, tenant_id, requisition_id, posting_type, status, slug, seo_title, seo_description, published_at) VALUES
('post-101', 'tenant-acme-tech', 'req-eng-101', 'PUBLIC', 'PUBLISHED', 'principal-distributed-systems-engineer-hyderabad', 'Principal Distributed Systems Engineer | Acme Careers Hyderabad', 'Join Acme as Principal Distributed Systems Engineer in Hyderabad HQ.', CURRENT_TIMESTAMP),
('post-102', 'tenant-acme-tech', 'req-prod-102', 'PUBLIC', 'PUBLISHED', 'staff-product-designer-bengaluru', 'Staff Product Designer | Acme Careers Bengaluru', 'Shape next-generation enterprise interfaces at Acme in Bengaluru.', CURRENT_TIMESTAMP);

-- 7. CANDIDATES & APPLICATIONS (Telugu, Kannada, Hindi Candidates)
INSERT INTO candidates (id, tenant_id, first_name, last_name, email, phone, headline, summary, location, source, status) VALUES
('cand-01', 'tenant-acme-tech', 'Venkata Karthik', 'Guntupalli', 'karthik.guntupalli@example.com', '+91-98480-11223', 'Staff Backend Architect | Ex-Swiggy, Flipkart', 'Seasoned backend engineer specializing in high-concurrency microservices, gRPC, and PostgreSQL performance tuning.', 'Hyderabad, Telangana', 'LINKEDIN', 'ACTIVE'),
('cand-02', 'tenant-acme-tech', 'Rakshitha', 'Shetty', 'rakshitha.shetty@example.com', '+91-99800-22334', 'Senior Product Designer | Ex-Razorpay', 'User-centric product designer with 8 years building SaaS design systems and design tokens.', 'Bengaluru, Karnataka', 'REFERRAL', 'ACTIVE'),
('cand-03', 'tenant-acme-tech', 'Harini', 'Chowdary', 'harini.chowdary@example.com', '+91-98490-33445', 'Lead Cloud Security Architect', 'Certified CISSP and AWS Security Specialist with enterprise compliance experience.', 'Hyderabad, Telangana', 'CAREER_PAGE', 'ACTIVE');

INSERT INTO candidate_skills (id, candidate_id, skill_name, years_experience) VALUES
('cs-1', 'cand-01', 'Java', 10),
('cs-2', 'cand-01', 'Distributed Systems', 9),
('cs-3', 'cand-01', 'PostgreSQL', 8),
('cs-4', 'cand-02', 'Figma', 8),
('cs-5', 'cand-02', 'Design Systems', 7),
('cs-6', 'cand-03', 'Cybersecurity', 9),
('cs-7', 'cand-03', 'SOC2 / Compliance', 7);

INSERT INTO applications (id, tenant_id, candidate_id, requisition_id, stage, status, rating, source, recruiter_id) VALUES
('app-01', 'tenant-acme-tech', 'cand-01', 'req-eng-101', 'OFFER', 'ACTIVE', 5, 'LINKEDIN', 'user-sravanthi-allu'),
('app-02', 'tenant-acme-tech', 'cand-02', 'req-prod-102', 'INTERVIEW', 'ACTIVE', 4, 'REFERRAL', 'user-sravanthi-allu'),
('app-03', 'tenant-acme-tech', 'cand-03', 'req-eng-103', 'SCREENING', 'ACTIVE', 4, 'CAREER_PAGE', 'user-sravanthi-allu');

INSERT INTO application_stage_history (id, application_id, from_stage, to_stage, changed_by, reason, notes) VALUES
('ash-1', 'app-01', 'NEW', 'SCREENING', 'user-sravanthi-allu', 'Resume screening passed', 'Strong candidate background at Swiggy & Flipkart'),
('ash-2', 'app-01', 'SCREENING', 'INTERVIEW', 'user-sravanthi-allu', 'Screening call passed', 'Excels in systems design and communication'),
('ash-3', 'app-01', 'INTERVIEW', 'OFFER', 'user-sravanthi-allu', 'Unanimous hire recommendation', 'Top scorecard ratings across all technical sessions');

-- 8. INTERVIEWS & SCORECARDS
INSERT INTO interviews (id, tenant_id, application_id, title, stage, scheduled_start, scheduled_end, time_zone, location, meeting_link, status) VALUES
('int-01', 'tenant-acme-tech', 'app-01', 'Distributed Architecture Deep-Dive', 'TECHNICAL', TIMESTAMP '2026-10-06 14:00:00', TIMESTAMP '2026-10-06 15:00:00', 'Asia/Kolkata', 'Google Meet', 'https://meet.google.com/abc-xyz-ats', 'COMPLETED'),
('int-02', 'tenant-acme-tech', 'app-02', 'Portfolio Review & Design Systems', 'TECHNICAL', TIMESTAMP '2026-10-07 10:00:00', TIMESTAMP '2026-10-07 11:00:00', 'Asia/Kolkata', 'Zoom', 'https://zoom.us/j/987654321', 'SCHEDULED');

INSERT INTO interview_scorecards (id, tenant_id, interview_id, submitted_by, recommendation, overall_rating, technical_rating, cultural_rating, communication_rating, strengths, weaknesses) VALUES
('sc-01', 'tenant-acme-tech', 'int-01', 'user-sai-charan', 'STRONG_HIRE', 5, 5, 5, 5, 'World-class understanding of distributed consensus, Raft, Paxos, and partition resilience.', 'None noted.');

-- 9. OFFERS
INSERT INTO offers (id, tenant_id, application_id, base_salary, bonus_amount, equity_grant, currency, start_date, expiration_date, status) VALUES
('off-01', 'tenant-acme-tech', 'app-01', 5500000.00, 600000.00, '25,000 ISO Options over 4 yrs', 'INR', DATE '2026-11-15', DATE '2026-10-20', 'APPROVED');

INSERT INTO offer_components (id, offer_id, component_type, name, amount, currency, frequency) VALUES
('oc-01', 'off-01', 'BASE_SALARY', 'Base Salary', 5500000.00, 'INR', 'ANNUAL'),
('oc-02', 'off-01', 'SIGNING_BONUS', 'Joining Bonus', 600000.00, 'INR', 'ONE_TIME');

-- 10. ONBOARDING & EMPLOYEES
INSERT INTO onboarding_instances (id, tenant_id, application_id, candidate_id, status, target_start_date, completion_percentage) VALUES
('onb-01', 'tenant-acme-tech', 'app-01', 'cand-01', 'PREBOARDING', DATE '2026-11-15', 40);

INSERT INTO onboarding_tasks (id, tenant_id, onboarding_instance_id, title, description, category, assigned_role, status, due_date, order_index) VALUES
('ot-01', 'tenant-acme-tech', 'onb-01', 'Sign Offer Letter & NDA', 'Execute digital signature via candidate portal', 'DOCUMENT', 'CANDIDATE', 'COMPLETED', DATE '2026-10-15', 1),
('ot-02', 'tenant-acme-tech', 'onb-01', 'Aadhaar & PAN Identity Verification', 'Upload government ID documents', 'DOCUMENT', 'CANDIDATE', 'IN_PROGRESS', DATE '2026-10-25', 2),
('ot-03', 'tenant-acme-tech', 'onb-01', 'Provision Laptop & Security Keys', 'IT to dispatch configured MacBook Pro M3 Max and YubiKeys to Hyderabad office', 'IT', 'IT', 'NOT_STARTED', DATE '2026-10-28', 3),
('ot-04', 'tenant-acme-tech', 'onb-01', 'Setup Payroll & Direct Deposit', 'Finance setup in Darwinbox / payroll integration', 'FINANCE', 'FINANCE', 'NOT_STARTED', DATE '2026-10-30', 4);

INSERT INTO employees (id, tenant_id, employee_number, first_name, last_name, work_email, job_title, department_id, location_id, employment_type, hire_date, status) VALUES
('emp-01', 'tenant-acme-tech', 'EMP-00101', 'Sai Charan', 'Reddy', 'sai.charan@acme.in', 'VP of Engineering & Architecture', 'dept-eng-acme', 'loc-hyd-acme', 'FULL_TIME', DATE '2022-01-15', 'ACTIVE'),
('emp-02', 'tenant-acme-tech', 'EMP-00102', 'Ananya', 'Rao', 'ananya.rao@acme.in', 'Director of Talent Acquisition', 'dept-eng-acme', 'loc-hyd-acme', 'FULL_TIME', DATE '2022-03-01', 'ACTIVE');

-- 11. WORKFLOWS & DYNAMIC FORMS
INSERT INTO workflow_definitions (id, tenant_id, name, description, trigger_event, is_active) VALUES
('wf-def-offer-accept', 'tenant-acme-tech', 'Offer Acceptance & Preboarding Trigger', 'Triggers document collection, IT provisioning, and Slack welcome message upon offer signature.', 'OFFER_ACCEPTED', TRUE);

INSERT INTO form_definitions (id, tenant_id, title, slug, form_type, schema_json, is_published) VALUES
('form-eng-eval', 'tenant-acme-tech', 'Engineering Technical Evaluation Form', 'eng-tech-eval', 'INTERVIEW_SCORECARD', '{"fields":[{"id":"coding","label":"Algorithmic & Systems Problem Solving","type":"NUMBER","required":true},{"id":"notes","label":"Technical Observations","type":"TEXTAREA","required":true}]}', TRUE);

-- 12. AUDIT LOG INITIAL SEED
INSERT INTO audit_logs (id, tenant_id, actor_id, actor_email, action, resource_type, resource_id, before_state, after_state, ip_address) VALUES
('al-01', 'tenant-acme-tech', 'user-sravanthi-allu', 'sravanthi.allu@acme.in', 'APPLICATION_STAGE_CHANGED', 'APPLICATION', 'app-01', '{"stage":"INTERVIEW"}', '{"stage":"OFFER"}', '127.0.0.1');
