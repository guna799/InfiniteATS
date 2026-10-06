-- =========================================================================
-- INFINITECAREERS ENTERPRISE POSTGRESQL SEED DATA (INDIAN ENTERPRISE WORKFORCE)
-- Telugu, Kannada, and Hindi names representation
-- =========================================================================

BEGIN;

-- Clean existing data
TRUNCATE tenants CASCADE;
TRUNCATE users CASCADE;
TRUNCATE permissions CASCADE;
TRUNCATE roles CASCADE;

-- 1. TENANTS
INSERT INTO tenants (id, name, slug, tier, status, logo_url, primary_color) VALUES
('a0000000-0000-0000-0000-000000000001', 'Acme Technologies India', 'acme-tech', 'ENTERPRISE', 'ACTIVE', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80', '#4F46E5'),
('a0000000-0000-0000-0000-000000000002', 'Nexus Health & AI Labs', 'nexus-health', 'ENTERPRISE', 'ACTIVE', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=128&q=80', '#0284C7');

-- 2. TENANT SUBSCRIPTIONS
INSERT INTO tenant_subscriptions (id, tenant_id, plan_name, seat_limit, candidate_limit, starts_at, billing_email, status) VALUES
('a1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Enterprise Unlimited', 100, 250000, CURRENT_TIMESTAMP, 'billing@acme.in', 'ACTIVE'),
('a1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Growth Tier', 50, 100000, CURRENT_TIMESTAMP, 'finance@nexushealth.in', 'ACTIVE');

-- 3. PERMISSIONS
INSERT INTO permissions (id, code, resource_name, action, description) VALUES
('b0000000-0000-0000-0000-000000000001', 'CANDIDATE_READ', 'CANDIDATE', 'READ', 'View candidates and candidate profiles'),
('b0000000-0000-0000-0000-000000000002', 'CANDIDATE_CREATE', 'CANDIDATE', 'CREATE', 'Create candidate records and import resumes'),
('b0000000-0000-0000-0000-000000000003', 'CANDIDATE_UPDATE', 'CANDIDATE', 'UPDATE', 'Update candidate profiles and tags'),
('b0000000-0000-0000-0000-000000000004', 'CANDIDATE_DELETE', 'CANDIDATE', 'DELETE', 'Delete or archive candidate records'),
('b0000000-0000-0000-0000-000000000005', 'REQUISITION_READ', 'REQUISITION', 'READ', 'View job requisitions and postings'),
('b0000000-0000-0000-0000-000000000006', 'REQUISITION_CREATE', 'REQUISITION', 'CREATE', 'Create new job requisitions'),
('b0000000-0000-0000-0000-000000000007', 'REQUISITION_APPROVE', 'REQUISITION', 'APPROVE', 'Approve or reject job requisitions'),
('b0000000-0000-0000-0000-000000000008', 'APPLICATION_READ', 'APPLICATION', 'READ', 'View job applications and pipeline status'),
('b0000000-0000-0000-0000-000000000009', 'APPLICATION_UPDATE', 'APPLICATION', 'UPDATE', 'Move applications across stages'),
('b0000000-0000-0000-0000-000000000010', 'INTERVIEW_READ', 'INTERVIEW', 'READ', 'View scheduled interviews and scorecards'),
('b0000000-0000-0000-0000-000000000011', 'INTERVIEW_CREATE', 'INTERVIEW', 'CREATE', 'Schedule interviews and submit scorecards'),
('b0000000-0000-0000-0000-000000000012', 'OFFER_READ', 'OFFER', 'READ', 'View candidate offers'),
('b0000000-0000-0000-0000-000000000013', 'OFFER_CREATE', 'OFFER', 'CREATE', 'Draft and generate offer letters'),
('b0000000-0000-0000-0000-000000000014', 'OFFER_APPROVE', 'OFFER', 'APPROVE', 'Approve executive/compensation offers'),
('b0000000-0000-0000-0000-000000000015', 'ONBOARDING_READ', 'ONBOARDING', 'READ', 'View onboarding tasks and preboarding progress'),
('b0000000-0000-0000-0000-000000000016', 'ONBOARDING_UPDATE', 'ONBOARDING', 'UPDATE', 'Manage onboarding tasks and verify documents'),
('b0000000-0000-0000-0000-000000000017', 'EMPLOYEE_READ', 'EMPLOYEE', 'READ', 'View employee directory and org charts'),
('b0000000-0000-0000-0000-000000000018', 'EMPLOYEE_UPDATE', 'EMPLOYEE', 'UPDATE', 'Update employee profiles and positions'),
('b0000000-0000-0000-0000-000000000019', 'AUDIT_READ', 'AUDIT', 'READ', 'View immutable audit trail logs'),
('b0000000-0000-0000-0000-000000000020', 'WORKFLOW_MANAGE', 'WORKFLOW', 'MANAGE', 'Build and execute automated workflows');

-- 4. ROLES
INSERT INTO roles (id, tenant_id, name, description, is_system_role) VALUES
('c0000000-0000-0000-0000-000000000001', NULL, 'SUPER_ADMIN', 'Full tenant platform administration', TRUE),
('c0000000-0000-0000-0000-000000000002', NULL, 'RECRUITER', 'Recruiter managing pipelines and interviews', TRUE),
('c0000000-0000-0000-0000-000000000003', NULL, 'HIRING_MANAGER', 'Hiring manager evaluating candidates', TRUE),
('c0000000-0000-0000-0000-000000000004', NULL, 'HR_OPS', 'HR Operations managing offers and onboarding', TRUE);

-- Map permissions to SUPER_ADMIN role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'c0000000-0000-0000-0000-000000000001', id FROM permissions;

-- 5. USERS & CREDENTIALS (Telugu, Kannada, Hindi Names)
-- Password for all seed users: Password123! ($2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a)
INSERT INTO users (id, email, first_name, last_name, phone_number, avatar_url, timezone, is_active) VALUES
('d0000000-0000-0000-0000-000000000001', 'admin@infinitecareers.com', 'Gunavardhan', 'Mandala', '+91-98490-12345', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&q=80', 'Asia/Kolkata', TRUE),
('d0000000-0000-0000-0000-000000000002', 'ananya.rao@acme.in', 'Ananya', 'Rao', '+91-98860-23456', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=128&q=80', 'Asia/Kolkata', TRUE),
('d0000000-0000-0000-0000-000000000003', 'sai.charan@acme.in', 'Sai Charan', 'Reddy', '+91-98480-34567', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&q=80', 'Asia/Kolkata', TRUE),
('d0000000-0000-0000-0000-000000000004', 'prajwal.gowda@acme.in', 'Prajwal', 'Gowda', '+91-99000-45678', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&q=80', 'Asia/Kolkata', TRUE),
('d0000000-0000-0000-0000-000000000005', 'spandana.hegde@acme.in', 'Spandana', 'Hegde', '+91-99800-56789', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=128&q=80', 'Asia/Kolkata', TRUE),
('d0000000-0000-0000-0000-000000000006', 'rohan.sharma@nexushealth.in', 'Rohan', 'Sharma', '+91-98110-67890', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=128&q=80', 'Asia/Kolkata', TRUE),
('d0000000-0000-0000-0000-000000000007', 'priya.verma@nexushealth.in', 'Priya', 'Verma', '+91-98100-78901', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&q=80', 'Asia/Kolkata', TRUE),
('d0000000-0000-0000-0000-000000000008', 'tejaswi.naidu@acme.in', 'Tejaswi', 'Naidu', '+91-98499-89012', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=128&q=80', 'Asia/Kolkata', TRUE);

INSERT INTO user_credentials (user_id, password_hash) VALUES
('d0000000-0000-0000-0000-000000000001', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a'),
('d0000000-0000-0000-0000-000000000002', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a'),
('d0000000-0000-0000-0000-000000000003', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a'),
('d0000000-0000-0000-0000-000000000004', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a'),
('d0000000-0000-0000-0000-000000000005', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a'),
('d0000000-0000-0000-0000-000000000006', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a'),
('d0000000-0000-0000-0000-000000000007', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a'),
('d0000000-0000-0000-0000-000000000008', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a');

-- Tenant Memberships
INSERT INTO tenant_memberships (id, tenant_id, user_id, data_scope, status) VALUES
('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'TENANT', 'ACTIVE'),
('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'TENANT', 'ACTIVE'),
('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'DEPARTMENT', 'ACTIVE'),
('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'DEPARTMENT', 'ACTIVE'),
('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 'DEPARTMENT', 'ACTIVE'),
('e0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000006', 'TENANT', 'ACTIVE'),
('e0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000007', 'TENANT', 'ACTIVE'),
('e0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000008', 'TENANT', 'ACTIVE');

INSERT INTO user_roles (membership_id, role_id) VALUES
('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001'),
('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002'),
('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003'),
('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003'),
('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002'),
('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001'),
('e0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000002'),
('e0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000004');

-- 6. ORGANIZATION STRUCTURE (Hyderabad, Bengaluru, Pune, Gurugram)
INSERT INTO legal_entities (id, tenant_id, name, code, country_code, currency) VALUES
('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Acme Technologies India Pvt Ltd', 'ACME-IN', 'IN', 'INR'),
('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Nexus AI Systems India Pvt Ltd', 'NEXUS-IN', 'IN', 'INR');

INSERT INTO departments (id, tenant_id, name, code) VALUES
('f1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Engineering & Platform', 'ENG'),
('f1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Product & Design', 'PROD'),
('f1000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Enterprise Sales & Growth', 'SALES'),
('f1000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'AI & Clinical Informatics', 'AI-MED');

INSERT INTO locations (id, tenant_id, name, code, city, state_province, country_code, is_remote) VALUES
('f2000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Hyderabad Tech Park (HITEC City)', 'HYD-01', 'Hyderabad', 'Telangana', 'IN', FALSE),
('f2000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Bengaluru Innovation Center (Koramangala)', 'BLR-01', 'Bengaluru', 'Karnataka', 'IN', FALSE),
('f2000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'India Remote', 'IN-REMOTE', 'Remote', 'India', 'IN', TRUE),
('f2000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'Pune Cyber City', 'PUN-01', 'Pune', 'Maharashtra', 'IN', FALSE);

-- 7. APPLICATION STAGES
INSERT INTO application_stages (id, tenant_id, name, stage_type, order_index, is_system_stage) VALUES
('11000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Application Review', 'SCREENING', 1, TRUE),
('11000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Technical Screening', 'SCREENING', 2, TRUE),
('11000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'System Design & Coding', 'INTERVIEW', 3, TRUE),
('11000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Leadership & Bar Raiser', 'INTERVIEW', 4, TRUE),
('11000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Offer & Negotiation', 'OFFER', 5, TRUE),
('11000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Hired & Preboarding', 'HIRED', 6, TRUE);

-- 8. JOB REQUISITIONS & POSTINGS
INSERT INTO job_requisitions (id, tenant_id, req_number, title, department_id, location_id, hiring_manager_id, recruiter_id, min_salary, max_salary, currency, status, description, requirements) VALUES
('12000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'REQ-HYD-2026-101', 'Principal Distributed Systems Engineer', 'f1000000-0000-0000-0000-000000000001', 'f2000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 4500000.00, 6500000.00, 'INR', 'OPEN', 'Lead core transactional systems in Hyderabad campus.', '10+ years Java/Go, PostgreSQL, Kafka, distributed consensus.'),
('12000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'REQ-BLR-2026-102', 'Staff Product Designer', 'f1000000-0000-0000-0000-000000000002', 'f2000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 3800000.00, 5200000.00, 'INR', 'OPEN', 'Craft enterprise-grade B2B SaaS workflows in Bengaluru.', '7+ years Figma, design systems, data table UX.'),
('12000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'REQ-REM-2026-103', 'Lead Security & Cloud Architect', 'f1000000-0000-0000-0000-000000000001', 'f2000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 4000000.00, 5800000.00, 'INR', 'APPROVED', 'Drive Zero Trust, SOC2, and cloud infrastructure security across India.', '8+ years AWS, IAM, OAuth2, and Kubernetes security.');

INSERT INTO job_postings (id, tenant_id, requisition_id, posting_type, status, slug, seo_title, published_at) VALUES
('13000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001', 'EXTERNAL', 'PUBLISHED', 'principal-distributed-systems-engineer-hyderabad', 'Principal Distributed Systems Engineer | Acme Careers Hyderabad', CURRENT_TIMESTAMP),
('13000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', '12000000-0000-0000-0000-000000000002', 'EXTERNAL', 'PUBLISHED', 'staff-product-designer-bengaluru', 'Staff Product Designer | Acme Careers Bengaluru', CURRENT_TIMESTAMP);

-- 9. CANDIDATES & APPLICATIONS (Telugu, Kannada, Hindi Candidates)
INSERT INTO candidates (id, tenant_id, first_name, last_name, primary_email, primary_phone, headline, summary, status) VALUES
('20000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Venkata Karthik', 'Guntupalli', 'karthik.guntupalli@example.com', '+91-98480-11223', 'Staff Backend Architect | Ex-Swiggy, Flipkart', 'Specialist in high-throughput payment pipelines, Cassandra, Kafka, and PostgreSQL scaling.', 'ACTIVE'),
('20000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Rakshitha', 'Shetty', 'rakshitha.shetty@example.com', '+91-99800-22334', 'Senior Product Designer | Ex-Razorpay', '8 years crafting enterprise fintech and SaaS UI component libraries in Bengaluru.', 'ACTIVE'),
('20000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Harini', 'Chowdary', 'harini.chowdary@example.com', '+91-98490-33445', 'Senior Cloud Security Engineer', 'Certified AWS Security Specialist with deep expertise in IAM and FedRAMP compliance.', 'ACTIVE'),
('20000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Manjunath', 'Bhat', 'manjunath.bhat@example.com', '+91-99000-44556', 'DevOps & Site Reliability Lead', 'Kubernetes, Terraform, Prometheus, and multi-region infrastructure expert.', 'ACTIVE'),
('20000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Aditya', 'Kapoor', 'aditya.kapoor@example.com', '+91-98110-55667', 'Lead QA Automation Architect', 'Playwright, Cypress, JUnit 5, and distributed testing pipeline specialist.', 'ACTIVE');

-- Candidate Skills
INSERT INTO candidate_skills (id, tenant_id, candidate_id, skill_name, years_experience) VALUES
('21000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Java', 10),
('21000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Distributed Systems', 9),
('21000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'PostgreSQL', 8),
('21000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Figma', 8),
('21000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Design Systems', 7);

-- Applications
INSERT INTO applications (id, tenant_id, candidate_id, requisition_id, current_stage_id, recruiter_id, status, rating) VALUES
('30000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', 5),
('30000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '12000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', 4),
('30000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '12000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', 4);

-- Stage History
INSERT INTO application_stage_history (id, tenant_id, application_id, from_stage_id, to_stage_id, changed_by_user_id, reason, notes) VALUES
('31000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', NULL, '11000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Applied via LinkedIn', 'Profile matches high concurrency requirements.'),
('31000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 'Screening passed', 'Deep knowledge of distributed caching and Kafka.'),
('31000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000003', 'Unanimous Strong Hire', 'Top rating in architecture deep dive.');

-- 10. INTERVIEWS & SCORECARDS
INSERT INTO interviews (id, tenant_id, application_id, title, scheduled_start_utc, scheduled_end_utc, local_timezone, location_type, meeting_link, status) VALUES
('32000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Distributed Consensus & Architecture Deep Dive', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '1 hour', 'Asia/Kolkata', 'VIRTUAL', 'https://meet.google.com/hyd-arch-eval', 'COMPLETED'),
('32000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Portfolio Review & Enterprise Design Systems', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '1 hour', 'Asia/Kolkata', 'VIRTUAL', 'https://meet.google.com/blr-ux-eval', 'SCHEDULED');

INSERT INTO interview_scorecards (id, tenant_id, interview_id, interviewer_user_id, recommendation, overall_rating, strengths_summary, weaknesses_summary) VALUES
('33000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '32000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'STRONG_HIRE', 5, 'World-class clarity on Raft consensus, partitioned multi-tenant databases, and zero-downtime migrations.', 'None noted.');

-- 11. OFFERS & PREBOARDING
INSERT INTO offers (id, tenant_id, application_id, base_salary, currency, target_start_date, offer_expiration_date, status) VALUES
('40000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 5800000.00, 'INR', CURRENT_DATE + INTERVAL '25 days', CURRENT_DATE + INTERVAL '10 days', 'APPROVED');

INSERT INTO offer_components (id, tenant_id, offer_id, component_type, name, amount, currency) VALUES
('41000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'SIGNING_BONUS', 'Sign-on Joining Bonus', 600000.00, 'INR'),
('41000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'ANNUAL_BONUS', 'Performance Bonus Target', 800000.00, 'INR');

-- 12. ONBOARDING & TASKS
INSERT INTO onboarding_instances (id, tenant_id, application_id, candidate_id, target_start_date, status, completion_percentage) VALUES
('50000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', CURRENT_DATE + INTERVAL '25 days', 'PREBOARDING', 40);

INSERT INTO onboarding_tasks (id, tenant_id, onboarding_instance_id, title, description, assigned_role, due_date, status, order_index) VALUES
('51000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'Execute Digital Appointment Letter & NDA', 'Digital e-signature verification', 'CANDIDATE', CURRENT_DATE + INTERVAL '5 days', 'COMPLETED', 1),
('51000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'Aadhaar, PAN & Provident Fund (EPFO) Verification', 'Upload identity & tax documents', 'CANDIDATE', CURRENT_DATE + INTERVAL '12 days', 'IN_PROGRESS', 2),
('51000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'IT Hardware & YubiKey Dispatch to Hyderabad Home', 'Dispatch Apple MacBook Pro M3 Max', 'IT', CURRENT_DATE + INTERVAL '18 days', 'NOT_STARTED', 3),
('51000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'Direct Salary Account Setup (HDFC/ICICI)', 'Banking details verification', 'FINANCE', CURRENT_DATE + INTERVAL '20 days', 'NOT_STARTED', 4);

-- 13. EMPLOYEES DIRECTORY
INSERT INTO employees (id, tenant_id, user_id, employee_number, legal_first_name, legal_last_name, work_email, hire_date, employment_status) VALUES
('60000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'EMP-HYD-00101', 'Sai Charan', 'Reddy', 'sai.charan@acme.in', DATE '2021-06-01', 'ACTIVE'),
('60000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'EMP-HYD-00102', 'Ananya', 'Rao', 'ananya.rao@acme.in', DATE '2021-08-15', 'ACTIVE'),
('60000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'EMP-BLR-00103', 'Prajwal', 'Gowda', 'prajwal.gowda@acme.in', DATE '2022-01-10', 'ACTIVE'),
('60000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000008', 'EMP-HYD-00104', 'Tejaswi', 'Naidu', 'tejaswi.naidu@acme.in', DATE '2022-04-01', 'ACTIVE');

-- 14. AUDIT TRAIL
INSERT INTO audit_events (tenant_id, actor_user_id, actor_email, action, resource_type, resource_id, before_state, after_state, ip_address) VALUES
('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'ananya.rao@acme.in', 'OFFER_EXTENDED', 'OFFER', '40000000-0000-0000-0000-000000000001', '{"status":"PENDING_APPROVAL","candidate":"Venkata Karthik Guntupalli"}', '{"status":"APPROVED","ctc":"₹58,00,000"}', '127.0.0.1');

COMMIT;
