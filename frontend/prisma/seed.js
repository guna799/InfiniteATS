const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for InfiniteCareers ATS platform (Indian Enterprise Workforce)...');

  // Clean existing records in correct dependency order
  await prisma.auditLog.deleteMany();
  await prisma.onboardingTask.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.interviewScorecard.deleteMany();
  await prisma.interviewSchedule.deleteMany();
  await prisma.candidateNote.deleteMany();
  await prisma.approvalChain.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.application.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.jobRequisition.deleteMany();
  await prisma.jobProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.location.deleteMany();
  await prisma.businessUnit.deleteMany();
  await prisma.department.deleteMany();
  await prisma.customFieldDefinition.deleteMany();
  await prisma.webhookEndpoint.deleteMany();
  await prisma.organization.deleteMany();

  // 1. Create Organization: Acme Technologies India
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Technologies India',
      slug: 'acme-tech',
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
      domain: 'acme.in',
      primaryColor: '#4f46e5',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      subscriptionTier: 'ENTERPRISE',
      seatLimit: 250,
      settings: JSON.stringify({
        ssoEnabled: true,
        mfaRequired: true,
        autoArchiveDays: 90,
        blindScorecards: true,
        aiAssistedScreening: true,
        emailSenderName: 'Acme India Talent Team',
        emailSenderAddress: 'careers@acme.in',
        slackNotificationsEnabled: true,
      }),
    },
  });

  // Second Org for multi-tenancy demonstration: Nexus Health & AI Labs
  const org2 = await prisma.organization.create({
    data: {
      name: 'Nexus Health & AI Labs',
      slug: 'nexus-health',
      logoUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=128&auto=format&fit=crop&q=80',
      domain: 'nexushealth.in',
      primaryColor: '#059669',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      subscriptionTier: 'GROWTH',
      seatLimit: 75,
      settings: JSON.stringify({
        ssoEnabled: true,
        mfaRequired: false,
        autoArchiveDays: 60,
        blindScorecards: false,
        aiAssistedScreening: true,
      }),
    },
  });

  console.log(`Created Organizations: ${org.name}, ${org2.name}`);

  // 2. Create Departments
  const deptEng = await prisma.department.create({
    data: { orgId: org.id, name: 'Engineering & Architecture', code: 'ENG' },
  });
  const deptProd = await prisma.department.create({
    data: { orgId: org.id, name: 'Product & Design', code: 'PROD' },
  });
  const deptPeople = await prisma.department.create({
    data: { orgId: org.id, name: 'People Operations & Talent', code: 'PEOPLE' },
  });
  const deptSales = await prisma.department.create({
    data: { orgId: org.id, name: 'Enterprise Sales & GTM', code: 'SALES' },
  });
  const deptFinance = await prisma.department.create({
    data: { orgId: org.id, name: 'Finance, Legal & Operations', code: 'FIN' },
  });

  // 3. Create Business Units
  const buCloud = await prisma.businessUnit.create({
    data: { orgId: org.id, name: 'Cloud Infrastructure & Platform', code: 'BU-CLOUD' },
  });
  const buAI = await prisma.businessUnit.create({
    data: { orgId: org.id, name: 'AI & Machine Intelligence', code: 'BU-AI' },
  });
  const buEnterprise = await prisma.businessUnit.create({
    data: { orgId: org.id, name: 'Enterprise Core Products', code: 'BU-ENT' },
  });

  // 4. Create Locations (Hyderabad, Bengaluru, Pune, Remote)
  const locHQ = await prisma.location.create({
    data: {
      orgId: org.id,
      name: 'Hyderabad HITEC City HQ',
      type: 'OFFICE',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      address: 'Mindspace IT Park, Building 12B, HITEC City',
      isHQ: true,
    },
  });
  const locBLR = await prisma.location.create({
    data: {
      orgId: org.id,
      name: 'Bengaluru Innovation Center',
      type: 'OFFICE',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      address: 'Koramangala 4th Block, 80 Feet Road',
      isHQ: false,
    },
  });
  const locPune = await prisma.location.create({
    data: {
      orgId: org.id,
      name: 'Pune Cyber City Hub',
      type: 'HYBRID',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      address: 'Magarpatta Cybercity, Tower 7',
      isHQ: false,
    },
  });
  const locRemoteIN = await prisma.location.create({
    data: {
      orgId: org.id,
      name: 'India Remote Hub',
      type: 'REMOTE',
      city: 'Remote',
      state: 'All India',
      country: 'India',
      isHQ: false,
    },
  });

  // 5. Create Users (Telugu, Kannada, Hindi Names)
  // Super Admin (Telugu)
  const userAdmin = await prisma.user.create({
    data: {
      orgId: org.id,
      email: 'gunavardhan.mandala@acme.in',
      name: 'Gunavardhan Mandala',
      role: 'SUPER_ADMIN',
      title: 'Chief Technology Officer & Head of People',
      departmentId: deptPeople.id,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80',
    },
  });

  // Recruiting Director (Kannada)
  const userRecruiterLead = await prisma.user.create({
    data: {
      orgId: org.id,
      email: 'ananya.rao@acme.in',
      name: 'Ananya Rao',
      role: 'RECRUITING_ADMIN',
      title: 'Director of Talent Acquisition',
      departmentId: deptPeople.id,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=128&auto=format&fit=crop&q=80',
    },
  });

  // Technical Recruiter (Telugu)
  const userRecruiter = await prisma.user.create({
    data: {
      orgId: org.id,
      email: 'sravanthi.allu@acme.in',
      name: 'Sravanthi Allu',
      role: 'RECRUITER',
      title: 'Senior Technical Recruiter',
      departmentId: deptPeople.id,
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=128&auto=format&fit=crop&q=80',
    },
  });

  // VP of Engineering / Hiring Manager (Telugu)
  const userHM1 = await prisma.user.create({
    data: {
      orgId: org.id,
      email: 'sai.charan@acme.in',
      name: 'Sai Charan Reddy',
      role: 'HIRING_MANAGER',
      title: 'VP of Engineering & Architecture',
      departmentId: deptEng.id,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&auto=format&fit=crop&q=80',
    },
  });

  // Head of Enterprise Product / Hiring Manager (Hindi)
  const userHM2 = await prisma.user.create({
    data: {
      orgId: org.id,
      email: 'priya.verma@acme.in',
      name: 'Priya Verma',
      role: 'HIRING_MANAGER',
      title: 'Head of Enterprise Product',
      departmentId: deptProd.id,
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=128&auto=format&fit=crop&q=80',
    },
  });

  // Principal Architect / Interviewer (Kannada)
  const userInterviewer1 = await prisma.user.create({
    data: {
      orgId: org.id,
      email: 'prajwal.gowda@acme.in',
      name: 'Prajwal Gowda',
      role: 'INTERVIEWER',
      title: 'Principal Distributed Systems Architect',
      departmentId: deptEng.id,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&auto=format&fit=crop&q=80',
    },
  });

  // Staff AI Infrastructure / Interviewer (Hindi)
  const userInterviewer2 = await prisma.user.create({
    data: {
      orgId: org.id,
      email: 'rohan.sharma@acme.in',
      name: 'Rohan Sharma',
      role: 'INTERVIEWER',
      title: 'Staff AI Infrastructure Lead',
      departmentId: deptEng.id,
      avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=128&auto=format&fit=crop&q=80',
    },
  });

  // People Operations & Onboarding Lead (Telugu)
  const userHROps = await prisma.user.create({
    data: {
      orgId: org.id,
      email: 'tejaswi.naidu@acme.in',
      name: 'Tejaswi Naidu',
      role: 'HR_OPS',
      title: 'Lead People Operations & Preboarding Specialist',
      departmentId: deptPeople.id,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80',
    },
  });

  // 6. Create Job Profiles
  const profileDistSys = await prisma.jobProfile.create({
    data: {
      orgId: org.id,
      code: 'JP-ENG-05',
      title: 'Principal Distributed Systems Engineer',
      jobFamily: 'Engineering',
      level: 'IC5',
      band: 'L7',
      minSalary: 4500000,
      maxSalary: 6500000,
      description: 'Lead the architecture and implementation of hyper-scale distributed state machines, consensus protocols, and low-latency replication engines in Hyderabad.',
      competencies: JSON.stringify(['Distributed Systems Architecture', 'Go/Rust/Java', 'Concurrency & Consensus', 'System Reliability', 'Mentorship']),
    },
  });

  const profileML = await prisma.jobProfile.create({
    data: {
      orgId: org.id,
      code: 'JP-AI-04',
      title: 'Staff AI / ML Infrastructure Engineer',
      jobFamily: 'Engineering',
      level: 'IC4',
      band: 'L6',
      minSalary: 3800000,
      maxSalary: 5500000,
      description: 'Design and optimize large-scale ML training clusters, distributed inference pipelines, and model serving infrastructure in Bengaluru.',
      competencies: JSON.stringify(['PyTorch/vLLM', 'Distributed GPU Clusters', 'Kubernetes/Triton', 'Performance Profiling', 'Python/CUDA']),
    },
  });

  const profilePM = await prisma.jobProfile.create({
    data: {
      orgId: org.id,
      code: 'JP-PROD-04',
      title: 'Lead Product Manager - Enterprise Platform',
      jobFamily: 'Product',
      level: 'IC4',
      band: 'L6',
      minSalary: 3500000,
      maxSalary: 4800000,
      description: 'Drive the product vision, roadmap, and delivery of enterprise platform integrations, developer APIs, and security administration.',
      competencies: JSON.stringify(['Enterprise SaaS Product Strategy', 'API Design & Developer Experience', 'Customer Discovery', 'Data-Driven Roadmap']),
    },
  });

  const profileDesign = await prisma.jobProfile.create({
    data: {
      orgId: org.id,
      code: 'JP-DES-03',
      title: 'Senior Product Designer - Design Systems',
      jobFamily: 'Design',
      level: 'IC3',
      band: 'L5',
      minSalary: 2800000,
      maxSalary: 4200000,
      description: 'Craft elegant, accessible design systems and cohesive micro-interactions across web and mobile surfaces.',
      competencies: JSON.stringify(['Figma Component Systems', 'Accessibility (WCAG AAA)', 'Prototyping', 'Design Tokens']),
    },
  });

  // 7. Create Job Requisitions
  const req1 = await prisma.jobRequisition.create({
    data: {
      orgId: org.id,
      reqNumber: 'REQ-HYD-2026-101',
      title: 'Principal Distributed Systems Engineer',
      departmentId: deptEng.id,
      businessUnitId: buCloud.id,
      locationId: locHQ.id,
      jobProfileId: profileDistSys.id,
      hiringManagerId: userHM1.id,
      recruiterId: userRecruiter.id,
      headcountType: 'NEW_HEADCOUNT',
      employmentType: 'FULL_TIME',
      workplaceType: 'HYBRID',
      targetStartDate: new Date('2026-11-15'),
      minSalary: 4800000,
      maxSalary: 6200000,
      currency: 'INR',
      status: 'OPEN',
      priority: 'URGENT',
      openingsCount: 1,
      filledCount: 0,
      isPublished: true,
      description: 'We are seeking a visionary Principal Distributed Systems Engineer to spearhead our next-generation streaming event fabric and global consensus layer in our Hyderabad campus.',
      requirements: '- 8+ years architecting high-throughput, low-latency distributed systems\n- Deep mastery of Go, Java, or Rust with lock-free data structures\n- Hands-on expertise with Raft, Paxos, Kafka, and distributed storage engines\n- Proven track record of mentoring senior staff engineers',
      benefits: '- Premium family health insurance (₹20 Lakh coverage)\n- Attractive equity & stock option plan\n- Annual learning & conference budget (₹2,50,000)\n- Flexible hybrid setup (2 days in-office, 3 days flexible)\n- Relocation assistance to Hyderabad',
    },
  });

  const req2 = await prisma.jobRequisition.create({
    data: {
      orgId: org.id,
      reqNumber: 'REQ-BLR-2026-102',
      title: 'Staff AI / ML Infrastructure Engineer',
      departmentId: deptEng.id,
      businessUnitId: buAI.id,
      locationId: locBLR.id,
      jobProfileId: profileML.id,
      hiringManagerId: userHM1.id,
      recruiterId: userRecruiter.id,
      headcountType: 'NEW_HEADCOUNT',
      employmentType: 'FULL_TIME',
      workplaceType: 'HYBRID',
      targetStartDate: new Date('2026-12-01'),
      minSalary: 4000000,
      maxSalary: 5600000,
      currency: 'INR',
      status: 'OPEN',
      priority: 'HIGH',
      openingsCount: 2,
      filledCount: 1,
      isPublished: true,
      description: 'Join our Bengaluru AI Core team to build the high-performance training orchestration and low-latency inference engines that power our intelligent enterprise automation agents.',
      requirements: '- 6+ years in ML infrastructure, GPU cluster management, and distributed training\n- Deep expertise in PyTorch, Triton Inference Server, CUDA, and vLLM\n- Experience managing Kubernetes clusters with NVIDIA A100/H100 GPUs\n- Strong background in Python, C++, and Linux kernel tuning',
      benefits: '- Comprehensive health and wellness coverage\n- Substantial equity grant\n- Generous parental leave (26 weeks paid)\n- Home office setup allowance (₹1,50,000)',
    },
  });

  const req3 = await prisma.jobRequisition.create({
    data: {
      orgId: org.id,
      reqNumber: 'REQ-REM-2026-103',
      title: 'Lead Product Manager - Enterprise Platform',
      departmentId: deptProd.id,
      businessUnitId: buEnterprise.id,
      locationId: locRemoteIN.id,
      jobProfileId: profilePM.id,
      hiringManagerId: userHM2.id,
      recruiterId: userRecruiterLead.id,
      headcountType: 'NEW_HEADCOUNT',
      employmentType: 'FULL_TIME',
      workplaceType: 'REMOTE',
      targetStartDate: new Date('2026-11-30'),
      minSalary: 3600000,
      maxSalary: 4800000,
      currency: 'INR',
      status: 'OPEN',
      priority: 'MEDIUM',
      openingsCount: 1,
      filledCount: 0,
      isPublished: true,
      description: 'Define and execute the roadmap for our enterprise governance, audit logging, multi-tenant RBAC, and developer API ecosystem.',
      requirements: '- 5+ years of PM experience in B2B SaaS enterprise platforms\n- Strong technical fluency with REST/GraphQL APIs and security protocols (SAML, OAuth2, SCIM)\n- Demonstrated success scaling products from 10k to 500k+ active users',
      benefits: '- 100% remote-first flexibility across India\n- Competitive compensation + annual performance bonus\n- Full medical, wellness, and ergonomics allowance',
    },
  });

  const req4 = await prisma.jobRequisition.create({
    data: {
      orgId: org.id,
      reqNumber: 'REQ-BLR-2026-104',
      title: 'Senior Product Designer - Design Systems',
      departmentId: deptProd.id,
      businessUnitId: buEnterprise.id,
      locationId: locBLR.id,
      jobProfileId: profileDesign.id,
      hiringManagerId: userHM2.id,
      recruiterId: userRecruiter.id,
      headcountType: 'BACKFILL',
      employmentType: 'FULL_TIME',
      workplaceType: 'HYBRID',
      targetStartDate: new Date('2026-12-15'),
      minSalary: 2800000,
      maxSalary: 4000000,
      currency: 'INR',
      status: 'PENDING_APPROVAL',
      priority: 'MEDIUM',
      openingsCount: 1,
      filledCount: 0,
      isPublished: false,
      description: 'Lead our unified design language, accessible token system, and multi-platform component library.',
      requirements: '- 5+ years crafting enterprise design systems at scale in Figma\n- Deep understanding of WCAG 2.2 AA/AAA accessibility and responsive design\n- Ability to pair with frontend engineers in React / Tailwind tokens',
      benefits: '- Generous base salary + equity\n- Annual continuous learning budget\n- Top-tier benefits package',
    },
  });

  // 8. Requisition Approval Chains
  await prisma.approvalChain.create({
    data: {
      requisitionId: req4.id,
      entityType: 'REQUISITION',
      stepNumber: 1,
      approverId: userHM2.id,
      status: 'APPROVED',
      comments: 'Essential backfill to unify our product design system across new SaaS modules.',
      approvedAt: new Date(Date.now() - 86400000 * 2),
    },
  });
  await prisma.approvalChain.create({
    data: {
      requisitionId: req4.id,
      entityType: 'REQUISITION',
      stepNumber: 2,
      approverId: userAdmin.id,
      status: 'PENDING',
      comments: null,
    },
  });

  // 9. Create Realistic Candidates (Telugu, Kannada, Hindi Names)
  // Candidate 1: Venkata Karthik Guntupalli (Telugu)
  const candKarthik = await prisma.candidate.create({
    data: {
      orgId: org.id,
      firstName: 'Venkata Karthik',
      lastName: 'Guntupalli',
      email: 'karthik.guntupalli@gmail.com',
      phone: '+91-98480-11223',
      location: 'Hyderabad, Telangana',
      headline: 'Staff Distributed Systems Engineer | Ex-Swiggy, Flipkart & AWS',
      summary: '10+ years specializing in distributed consensus, low-latency streaming infrastructure, and high-availability database engines. Led Swiggy core ordering event fabric handling millions of orders per day.',
      resumeUrl: 'https://cdn.infinitecareers.io/resumes/karthik-guntupalli-cv.pdf',
      aiMatchScore: 96,
      skills: JSON.stringify(['Go', 'Java', 'Raft Consensus', 'Distributed Systems', 'Kafka', 'gRPC', 'Kubernetes', 'High Throughput']),
      experienceYears: 10.5,
      currentCompany: 'Swiggy',
      currentTitle: 'Staff Infrastructure Architect',
      educationLevel: 'B.Tech & M.Tech (Dual Degree) Computer Science, IIT Hyderabad',
      linkedinUrl: 'https://linkedin.com/in/karthik-guntupalli-sys',
      githubUrl: 'https://github.com/karthik-guntupalli',
      portfolioUrl: 'https://karthikguntupalli.dev',
      source: 'SOURCED',
      referredBy: 'Prajwal Gowda',
      tags: JSON.stringify(['High Match', 'Ex-Swiggy', 'Urgent Offer', 'Referral']),
      resumeParsedData: JSON.stringify({
        summary: 'Karthik is an accomplished staff distributed systems architect with 10.5 years experience at Swiggy, Flipkart, and AWS.',
        workHistory: [
          { company: 'Swiggy', role: 'Staff Infrastructure Architect', period: '2021 - Present', highlights: 'Architected global event streaming pipeline with 99.999% SLA during IPL peak traffic.' },
          { company: 'Flipkart', role: 'Lead Software Engineer', period: '2017 - 2021', highlights: 'Contributed to Paxos consensus optimization and inventory partition management.' },
        ],
        education: [{ institution: 'IIT Hyderabad', degree: 'B.Tech & M.Tech Computer Science', year: '2015' }],
        keySkills: ['Distributed Consensus', 'Go', 'Java', 'Low Latency', 'System Architecture'],
      }),
    },
  });

  // Candidate 2: Rakshitha Shetty (Kannada)
  const candRakshitha = await prisma.candidate.create({
    data: {
      orgId: org.id,
      firstName: 'Rakshitha',
      lastName: 'Shetty',
      email: 'rakshitha.shetty@iisc.ac.in',
      phone: '+91-99800-22334',
      location: 'Bengaluru, Karnataka',
      headline: 'Staff ML Infrastructure Engineer | IISc Bengaluru PhD | Ex-Meta AI',
      summary: 'Machine Learning Infrastructure specialist with PhD in Distributed Deep Learning from IISc Bengaluru. Architected large-scale distributed PyTorch training clusters and Triton inference optimizations.',
      resumeUrl: 'https://cdn.infinitecareers.io/resumes/rakshitha-shetty-cv.pdf',
      aiMatchScore: 98,
      skills: JSON.stringify(['PyTorch', 'Distributed GPU Systems', 'CUDA', 'Triton Inference Server', 'vLLM', 'Kubernetes', 'Python', 'C++']),
      experienceYears: 8.5,
      currentCompany: 'Meta AI',
      currentTitle: 'Senior Research Infrastructure Engineer',
      educationLevel: 'Ph.D. Computer Science, IISc Bengaluru',
      linkedinUrl: 'https://linkedin.com/in/rakshitha-shetty-ml',
      githubUrl: 'https://github.com/rakshithashetty',
      source: 'LINKEDIN',
      tags: JSON.stringify(['PhD', 'Ex-Meta', 'Top Tier', 'Accepted Offer']),
      resumeParsedData: JSON.stringify({
        summary: 'Rakshitha has 8.5 years specializing in high-performance GPU orchestration and LLM inference engines.',
        workHistory: [
          { company: 'Meta AI', role: 'Senior Research Infrastructure Engineer', period: '2022 - Present', highlights: 'Optimized multi-node LLaMA fine-tuning and inference pipelines.' },
          { company: 'NVIDIA India', role: 'ML Systems Engineer', period: '2019 - 2022', highlights: 'Engineered TensorRT and Triton inference plugins for vision and language models.' },
        ],
        education: [{ institution: 'IISc Bengaluru', degree: 'Ph.D. Computer Science (Distributed AI)', year: '2019' }],
      }),
    },
  });

  // Candidate 3: Aditya Kapoor (Hindi)
  const candAditya = await prisma.candidate.create({
    data: {
      orgId: org.id,
      firstName: 'Aditya',
      lastName: 'Kapoor',
      email: 'aditya.kapoor.pm@gmail.com',
      phone: '+91-98110-33445',
      location: 'Bengaluru, Karnataka (Remote)',
      headline: 'Lead Enterprise Product Manager | Ex-Razorpay & Microsoft',
      summary: 'Strategic B2B SaaS Product Leader with 7+ years building enterprise developer platforms, RBAC security, and integration marketplaces.',
      resumeUrl: 'https://cdn.infinitecareers.io/resumes/aditya-kapoor-cv.pdf',
      aiMatchScore: 93,
      skills: JSON.stringify(['Enterprise SaaS', 'API Strategy', 'OAuth2/SAML/SCIM', 'Roadmap Prioritization', 'Developer Experience', 'Metrics & Analytics']),
      experienceYears: 7.5,
      currentCompany: 'Razorpay',
      currentTitle: 'Senior Product Manager - Platform Ecosystem',
      educationLevel: 'B.Tech Electrical & Computer Engineering, BITS Pilani',
      linkedinUrl: 'https://linkedin.com/in/aditya-kapoor-pm',
      source: 'CAREER_SITE',
      tags: JSON.stringify(['Technical PM', 'Ex-Razorpay', 'Strong Communicator']),
    },
  });

  // Candidate 4: Harini Chowdary (Telugu)
  const candHarini = await prisma.candidate.create({
    data: {
      orgId: org.id,
      firstName: 'Harini',
      lastName: 'Chowdary',
      email: 'harini.chowdary.design@outlook.com',
      phone: '+91-98490-44556',
      location: 'Hyderabad, Telangana',
      headline: 'Senior Product Designer & Design Systems Lead | Ex-CRED & Swiggy',
      summary: 'Design systems architect with 6 years experience building modular, accessible token systems and enterprise web application interfaces.',
      resumeUrl: 'https://cdn.infinitecareers.io/resumes/harini-chowdary-design.pdf',
      aiMatchScore: 94,
      skills: JSON.stringify(['Design Systems', 'Figma', 'WCAG AAA', 'Tailwind CSS', 'Design Tokens', 'User Research']),
      experienceYears: 6.0,
      currentCompany: 'CRED',
      currentTitle: 'Senior Design Systems Lead',
      educationLevel: 'B.Des Industrial & Interaction Design, NID Ahmedabad',
      linkedinUrl: 'https://linkedin.com/in/harini-chowdary-design',
      portfolioUrl: 'https://harinichowdary.design',
      source: 'REFERRAL',
      referredBy: 'Priya Verma',
      tags: JSON.stringify(['Design System Expert', 'Referral', 'Portfolio Star']),
    },
  });

  // Candidate 5: Manjunath Bhat (Kannada)
  const candManjunath = await prisma.candidate.create({
    data: {
      orgId: org.id,
      firstName: 'Manjunath',
      lastName: 'Bhat',
      email: 'manjunath.bhat.dev@proton.me',
      phone: '+91-99000-55667',
      location: 'Bengaluru, Karnataka',
      headline: 'Senior Cloud Security & SRE Engineer | Ex-Flipkart & PhonePe',
      summary: 'Specialist in high-availability backend microservices, Kubernetes security, and zero-trust cloud network architecture.',
      resumeUrl: 'https://cdn.infinitecareers.io/resumes/manjunath-bhat.pdf',
      aiMatchScore: 89,
      skills: JSON.stringify(['Go', 'PostgreSQL', 'Redis', 'Kafka', 'Docker', 'Kubernetes', 'Terraform']),
      experienceYears: 6.5,
      currentCompany: 'PhonePe',
      currentTitle: 'Senior Infrastructure Engineer',
      educationLevel: 'B.E. Computer Science, RV College of Engineering (RVCE)',
      source: 'LINKEDIN',
      tags: JSON.stringify(['Solid Backend', 'Screening Passed']),
    },
  });

  // Candidate 6: Sneha Kulkarni (Kannada/Hindi)
  const candSneha = await prisma.candidate.create({
    data: {
      orgId: org.id,
      firstName: 'Sneha',
      lastName: 'Kulkarni',
      email: 'sneha.kulkarni@techcorp.in',
      phone: '+91-98220-66778',
      location: 'Pune, Maharashtra',
      headline: 'Distributed Systems & Cloud Storage Engineer | Ex-Veritas',
      summary: 'Focus on cloud storage durability, erasure coding, and distributed Raft consensus.',
      aiMatchScore: 90,
      skills: JSON.stringify(['Rust', 'C++', 'Distributed Storage', 'Consensus Algorithms']),
      experienceYears: 5.0,
      source: 'CAREER_SITE',
      tags: JSON.stringify(['Applied']),
    },
  });

  // 10. Create Candidate Applications
  // Application 1: Venkata Karthik Guntupalli -> REQ-HYD-2026-101 (Stage: OFFER_EXTENDED)
  const appKarthik = await prisma.application.create({
    data: {
      orgId: org.id,
      requisitionId: req1.id,
      candidateId: candKarthik.id,
      status: 'OFFER_EXTENDED',
      stageOrder: 7,
      appliedDate: new Date(Date.now() - 86400000 * 20),
      source: 'SOURCED',
      aiEvaluation: JSON.stringify({
        matchScore: 96,
        strengths: ['World-class distributed systems pedigree at Swiggy, Flipkart, and AWS', 'Deep hands-on Raft/Paxos and low-latency storage experience', 'Exceptional system architecture clarity in panel interviews'],
        concerns: ['High market compensation expectation (₹55L+ base CTC)', 'Competing offers from Google India and Uber Tech Center'],
        summary: 'Exceptional top 1% candidate who will raise the bar for our Hyderabad core infrastructure team. Immediate hire recommendation.',
      }),
    },
  });

  // Application 2: Rakshitha Shetty -> REQ-BLR-2026-102 (Stage: ONBOARDED / ACTIVE EMPLOYEE)
  const appRakshitha = await prisma.application.create({
    data: {
      orgId: org.id,
      requisitionId: req2.id,
      candidateId: candRakshitha.id,
      status: 'ONBOARDED',
      stageOrder: 10,
      appliedDate: new Date(Date.now() - 86400000 * 45),
      source: 'LINKEDIN',
      aiEvaluation: JSON.stringify({
        matchScore: 98,
        strengths: ['PhD in Distributed Deep Learning from IISc Bengaluru', 'Built multi-node GPU cluster scheduler at Meta AI', 'Published papers at NeurIPS and OSDI'],
        concerns: ['None identified.'],
        summary: 'Dream hire for Staff AI Infrastructure. Unanimous Strong Yes across all 4 interview rounds.',
      }),
    },
  });

  // Application 3: Aditya Kapoor -> REQ-REM-2026-103 (Stage: TECHNICAL_INTERVIEW)
  const appAditya = await prisma.application.create({
    data: {
      orgId: org.id,
      requisitionId: req3.id,
      candidateId: candAditya.id,
      status: 'TECHNICAL_INTERVIEW',
      stageOrder: 4,
      appliedDate: new Date(Date.now() - 86400000 * 10),
      source: 'CAREER_SITE',
      aiEvaluation: JSON.stringify({
        matchScore: 93,
        strengths: ['Solid enterprise B2B PM track record at Razorpay and Microsoft', 'Strong understanding of developer APIs and security compliance'],
        concerns: ['Needs verification on technical architectural depth during panel round'],
      }),
    },
  });

  // Application 4: Harini Chowdary -> REQ-BLR-2026-104 (Stage: PHONE_SCREEN)
  const appHarini = await prisma.application.create({
    data: {
      orgId: org.id,
      requisitionId: req4.id,
      candidateId: candHarini.id,
      status: 'PHONE_SCREEN',
      stageOrder: 3,
      appliedDate: new Date(Date.now() - 86400000 * 5),
      source: 'REFERRAL',
      aiEvaluation: JSON.stringify({
        matchScore: 94,
        strengths: ['Pioneered CRED design system tokens', 'Excellent design systems and WCAG accessibility depth'],
      }),
    },
  });

  // Application 5: Manjunath Bhat -> REQ-HYD-2026-101 (Stage: SCREENING)
  const appManjunath = await prisma.application.create({
    data: {
      orgId: org.id,
      requisitionId: req1.id,
      candidateId: candManjunath.id,
      status: 'SCREENING',
      stageOrder: 2,
      appliedDate: new Date(Date.now() - 86400000 * 3),
      source: 'LINKEDIN',
    },
  });

  // Application 6: Sneha Kulkarni -> REQ-HYD-2026-101 (Stage: APPLIED)
  const appSneha = await prisma.application.create({
    data: {
      orgId: org.id,
      requisitionId: req1.id,
      candidateId: candSneha.id,
      status: 'APPLIED',
      stageOrder: 1,
      appliedDate: new Date(Date.now() - 86400000 * 1),
      source: 'CAREER_SITE',
    },
  });

  // 11. Recruiter Notes
  await prisma.candidateNote.create({
    data: {
      applicationId: appKarthik.id,
      candidateId: candKarthik.id,
      authorId: userRecruiter.id,
      authorName: 'Sravanthi Allu',
      content: 'Karthik completed the on-site architecture panel with unanimous Strong Yes ratings. He is very excited about our multi-region replication challenges. Prepared compensation package of ₹55,00,000 base CTC + 15% target bonus + ₹6,00,000 joining bonus + 25,000 stock units.',
      isPrivate: false,
    },
  });

  await prisma.candidateNote.create({
    data: {
      applicationId: appKarthik.id,
      candidateId: candKarthik.id,
      authorId: userHM1.id,
      authorName: 'Sai Charan Reddy',
      content: 'Karthik is exactly the technical leader we need to architect our next decade of data streaming in Hyderabad. Approved offer request immediately.',
      isPrivate: false,
    },
  });

  // 12. Interview Schedules & Scorecards for Karthik Guntupalli
  const interview1 = await prisma.interviewSchedule.create({
    data: {
      orgId: org.id,
      applicationId: appKarthik.id,
      requisitionId: req1.id,
      title: 'Distributed System Architecture & Consensus',
      interviewType: 'SYSTEM_DESIGN',
      startTime: new Date(Date.now() - 86400000 * 7),
      endTime: new Date(Date.now() - 86400000 * 7 + 3600000),
      timezone: 'Asia/Kolkata',
      locationOrMeetingUrl: 'https://meet.infinitecareers.io/interview/sys-karthik-101',
      status: 'COMPLETED',
      interviewers: JSON.stringify([{ id: userInterviewer1.id, name: userInterviewer1.name, email: userInterviewer1.email }]),
      notes: 'Focus on distributed consensus, split-brain recovery, and high throughput write optimizations.',
    },
  });

  await prisma.interviewScorecard.create({
    data: {
      orgId: org.id,
      interviewScheduleId: interview1.id,
      applicationId: appKarthik.id,
      interviewerId: userInterviewer1.id,
      overallRecommendation: 'STRONG_YES',
      overallFeedback: 'Karthik demonstrated masterful depth in distributed consensus protocols. When asked to design a globally replicated ledger with strict serializability, he flawlessly compared Raft log replication with Multi-Paxos variants and proposed a novel epoch-based pipeline that reduced lock contention by 40%. Absolutely top tier.',
      competencyScores: JSON.stringify([
        { competency: 'System Design & Architecture', score: 5, comment: 'Flawless design, proactive trade-off analysis and failure mode mitigation.' },
        { competency: 'Concurrency & Distributed State', score: 5, comment: 'Deep mastery of lock-free data structures and Raft edge cases.' },
        { competency: 'Communication & Technical Clarity', score: 5, comment: 'Articulate, patient, and exceptional diagramming skills.' },
        { competency: 'Cultural Alignment', score: 5, comment: 'Humble, highly collaborative, growth mindset.' },
      ]),
      culturalAddScore: 5,
      strengths: 'Peerless distributed consensus depth, pragmatic trade-off communication, calm under pressure.',
      weaknesses: 'None detected in this domain.',
      isSubmitted: true,
      submittedAt: new Date(Date.now() - 86400000 * 7 + 7200000),
    },
  });

  // 13. Active Extended Offer for Karthik Guntupalli
  const offerKarthik = await prisma.offer.create({
    data: {
      orgId: org.id,
      applicationId: appKarthik.id,
      candidateId: candKarthik.id,
      requisitionId: req1.id,
      offerNumber: 'OFF-2026-088',
      title: 'Principal Distributed Systems Engineer',
      departmentId: deptEng.id,
      locationId: locHQ.id,
      baseSalary: 5500000,
      targetBonusPercentage: 15.0,
      signingBonus: 600000,
      equityShares: 25000,
      equityVestingSchedule: '4-year vesting with 1-year cliff (25% at 1 year, quarterly thereafter)',
      currency: 'INR',
      startDate: new Date('2026-11-15'),
      expirationDate: new Date(Date.now() + 86400000 * 7),
      status: 'EXTENDED',
      offerLetterContent: `
# Formal Offer of Employment
**Acme Technologies India Pvt Ltd**
Date: October 5, 2026

Dear Venkata Karthik Guntupalli,

On behalf of Acme Technologies India, we are thrilled to extend this formal offer for the position of **Principal Distributed Systems Engineer**, reporting to **Sai Charan Reddy (VP of Engineering & Architecture)** at our Hyderabad Campus.

### Compensation & Equity Details
- **Base Annual Gross Salary (CTC):** ₹55,00,000.00 INR (paid monthly)
- **Target Annual Performance Bonus:** 15% (₹8,25,000.00 INR target)
- **Joining Bonus:** ₹6,00,000.00 INR (payable on first pay cycle)
- **Equity Incentive:** 25,000 Incentive Stock Options (ISO), subject to board approval and standard 4-year vesting schedule with a 1-year cliff.
- **Target Start Date:** November 15, 2026
- **Workplace Location:** Hyderabad HITEC City Campus (Hybrid: 2 days in-office, 3 days flexible)

### Comprehensive Benefits
You are eligible for Acme's comprehensive enterprise benefits, including ₹20,00,000 corporate group health coverage for you and your family, Provident Fund (PF) & Gratuity, unlimited flexible paid time off, and an annual ₹2,50,000 executive learning stipend.

We look forward to building the future of hyper-scale cloud platforms with you!

Sincerely,
**Gunavardhan Mandala**
Chief Technology Officer & Head of People
Acme Technologies India Pvt Ltd
      `.trim(),
    },
  });

  // 14. Accepted Offer, Employee Record, and Preboarding/Onboarding for Rakshitha Shetty
  const offerRakshitha = await prisma.offer.create({
    data: {
      orgId: org.id,
      applicationId: appRakshitha.id,
      candidateId: candRakshitha.id,
      requisitionId: req2.id,
      offerNumber: 'OFF-2026-074',
      title: 'Staff AI / ML Infrastructure Engineer',
      departmentId: deptEng.id,
      locationId: locBLR.id,
      baseSalary: 4800000,
      targetBonusPercentage: 15.0,
      signingBonus: 500000,
      equityShares: 22000,
      currency: 'INR',
      startDate: new Date('2026-10-01'),
      status: 'ACCEPTED',
      signatureData: JSON.stringify({
        signatureType: 'DIGITAL_TYPED',
        signatureValue: 'Rakshitha Shetty',
        ipAddress: '49.207.210.35',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: new Date(Date.now() - 86400000 * 20).toISOString(),
        verificationHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      }),
      signedAt: new Date(Date.now() - 86400000 * 20),
    },
  });

  // Create Employee Record for Rakshitha
  const empRakshitha = await prisma.employee.create({
    data: {
      orgId: org.id,
      candidateId: candRakshitha.id,
      applicationId: appRakshitha.id,
      employeeNumber: 'EMP-1089',
      firstName: 'Rakshitha',
      lastName: 'Shetty',
      email: 'rakshitha.shetty@iisc.ac.in',
      workEmail: 'rakshitha.shetty@acme.in',
      phone: '+91-99800-22334',
      title: 'Staff AI / ML Infrastructure Engineer',
      departmentId: deptEng.id,
      businessUnitId: buAI.id,
      locationId: locBLR.id,
      managerId: userHM1.id,
      hireDate: new Date('2026-10-01'),
      startDate: new Date('2026-10-01'),
      employmentStatus: 'FULL_TIME',
      status: 'ACTIVE',
      salary: 4800000,
      currency: 'INR',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=128&auto=format&fit=crop&q=80',
      emergencyContact: JSON.stringify({ name: 'Suresh Shetty', relationship: 'Parent', phone: '+91-99800-99887' }),
      bio: 'Staff ML Infrastructure Engineer specializing in distributed PyTorch training clusters, Triton model serving, and GPU resource scheduling.',
      skills: JSON.stringify(['PyTorch', 'Distributed GPU Clusters', 'Triton', 'CUDA', 'Python', 'Kubernetes']),
    },
  });

  // Create Onboarding Tasks for Rakshitha
  await prisma.onboardingTask.createMany({
    data: [
      {
        orgId: org.id,
        employeeId: empRakshitha.id,
        applicationId: appRakshitha.id,
        title: 'Provision MacBook Pro M3 Max & Hardware Kit',
        description: 'Configure and ship 16" MacBook Pro M3 Max (64GB RAM, 2TB SSD) with YubiKey 5C NFC and 4K display setup to Bengaluru office.',
        category: 'IT_SETUP',
        assignedToId: userHROps.id,
        assignedRole: 'IT_ADMIN',
        dueDate: new Date(Date.now() - 86400000 * 15),
        status: 'COMPLETED',
        completedAt: new Date(Date.now() - 86400000 * 14),
      },
      {
        orgId: org.id,
        employeeId: empRakshitha.id,
        applicationId: appRakshitha.id,
        title: 'Aadhaar & PAN Identity Verification',
        description: 'Complete online document verification and present Aadhaar / PAN for background screening.',
        category: 'HR_COMPLIANCE',
        assignedToId: userHROps.id,
        assignedRole: 'CANDIDATE',
        signatureRequired: true,
        isSigned: true,
        signedAt: new Date(Date.now() - 86400000 * 16),
        status: 'COMPLETED',
        completedAt: new Date(Date.now() - 86400000 * 16),
      },
      {
        orgId: org.id,
        employeeId: empRakshitha.id,
        applicationId: appRakshitha.id,
        title: 'Confidential Information and Inventions Assignment Agreement (NDA)',
        description: 'Review and e-sign standard proprietary information and inventions agreement.',
        category: 'HR_COMPLIANCE',
        assignedToId: userHROps.id,
        assignedRole: 'CANDIDATE',
        signatureRequired: true,
        isSigned: true,
        signedAt: new Date(Date.now() - 86400000 * 18),
        status: 'COMPLETED',
        completedAt: new Date(Date.now() - 86400000 * 18),
      },
      {
        orgId: org.id,
        employeeId: empRakshitha.id,
        applicationId: appRakshitha.id,
        title: 'AI Cluster & Cloud VPC Access Provisioning',
        description: 'Grant scoped IAM roles for Kubernetes GPU cluster staging and production Triton inference endpoints.',
        category: 'IT_SETUP',
        assignedToId: userInterviewer1.id,
        assignedRole: 'IT_ADMIN',
        status: 'COMPLETED',
        completedAt: new Date(Date.now() - 86400000 * 10),
      },
      {
        orgId: org.id,
        employeeId: empRakshitha.id,
        applicationId: appRakshitha.id,
        title: 'Manager 30-60-90 Day Goal Alignment & Buddy Welcome',
        description: 'Schedule kickoff 1:1 with Sai Charan Reddy and introduce onboarding buddy Prajwal Gowda.',
        category: 'TEAM_INTRO',
        assignedToId: userHM1.id,
        assignedRole: 'MANAGER',
        status: 'COMPLETED',
        completedAt: new Date(Date.now() - 86400000 * 5),
      },
      {
        orgId: org.id,
        employeeId: empRakshitha.id,
        applicationId: appRakshitha.id,
        title: 'Salary Direct Deposit & Provident Fund (EPF) Setup',
        description: 'Configure bank account IFSC and UAN for automated payroll deposit in HR portal.',
        category: 'BENEFITS',
        assignedRole: 'CANDIDATE',
        status: 'COMPLETED',
        completedAt: new Date(Date.now() - 86400000 * 8),
      },
    ],
  });

  // Additional team members for Org Chart
  const empSai = await prisma.employee.create({
    data: {
      orgId: org.id,
      employeeNumber: 'EMP-1002',
      firstName: 'Sai Charan',
      lastName: 'Reddy',
      email: 'sai.charan@gmail.com',
      workEmail: 'sai.charan@acme.in',
      phone: '+91-98480-34567',
      title: 'VP of Engineering & Architecture',
      departmentId: deptEng.id,
      businessUnitId: buCloud.id,
      locationId: locHQ.id,
      hireDate: new Date('2022-03-15'),
      startDate: new Date('2022-03-15'),
      status: 'ACTIVE',
      salary: 6800000,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&auto=format&fit=crop&q=80',
    },
  });

  const empPrajwal = await prisma.employee.create({
    data: {
      orgId: org.id,
      employeeNumber: 'EMP-1025',
      firstName: 'Prajwal',
      lastName: 'Gowda',
      email: 'prajwal.gowda@gmail.com',
      workEmail: 'prajwal.gowda@acme.in',
      phone: '+91-99000-45678',
      title: 'Principal Distributed Systems Architect',
      departmentId: deptEng.id,
      businessUnitId: buCloud.id,
      locationId: locHQ.id,
      managerId: userHM1.id,
      hireDate: new Date('2023-01-10'),
      startDate: new Date('2023-01-10'),
      status: 'ACTIVE',
      salary: 5800000,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&auto=format&fit=crop&q=80',
    },
  });

  const empRohan = await prisma.employee.create({
    data: {
      orgId: org.id,
      employeeNumber: 'EMP-1048',
      firstName: 'Rohan',
      lastName: 'Sharma',
      email: 'rohan.sharma@gmail.com',
      workEmail: 'rohan.sharma@acme.in',
      phone: '+91-98110-67890',
      title: 'Staff AI Infrastructure Lead',
      departmentId: deptEng.id,
      businessUnitId: buAI.id,
      locationId: locBLR.id,
      managerId: userHM1.id,
      hireDate: new Date('2023-08-01'),
      startDate: new Date('2023-08-01'),
      status: 'ACTIVE',
      salary: 5200000,
      avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=128&auto=format&fit=crop&q=80',
    },
  });

  const empPriya = await prisma.employee.create({
    data: {
      orgId: org.id,
      employeeNumber: 'EMP-1052',
      firstName: 'Priya',
      lastName: 'Verma',
      email: 'priya.verma@gmail.com',
      workEmail: 'priya.verma@acme.in',
      phone: '+91-98100-78901',
      title: 'Head of Enterprise Product',
      departmentId: deptProd.id,
      businessUnitId: buEnterprise.id,
      locationId: locBLR.id,
      hireDate: new Date('2023-02-15'),
      startDate: new Date('2023-02-15'),
      status: 'ACTIVE',
      salary: 5000000,
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=128&auto=format&fit=crop&q=80',
    },
  });

  const empTejaswi = await prisma.employee.create({
    data: {
      orgId: org.id,
      employeeNumber: 'EMP-1060',
      firstName: 'Tejaswi',
      lastName: 'Naidu',
      email: 'tejaswi.naidu@gmail.com',
      workEmail: 'tejaswi.naidu@acme.in',
      phone: '+91-98499-89012',
      title: 'Lead People Operations Specialist',
      departmentId: deptPeople.id,
      locationId: locHQ.id,
      hireDate: new Date('2023-05-01'),
      startDate: new Date('2023-05-01'),
      status: 'ACTIVE',
      salary: 3200000,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80',
    },
  });

  // 15. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        orgId: org.id,
        actorId: userAdmin.id,
        actorName: 'Gunavardhan Mandala',
        actorEmail: 'gunavardhan.mandala@acme.in',
        action: 'REQUISITION_APPROVED',
        entityType: 'REQUISITION',
        entityId: req1.id,
        newState: JSON.stringify({ status: 'OPEN', priority: 'URGENT' }),
        createdAt: new Date(Date.now() - 86400000 * 22),
      },
      {
        orgId: org.id,
        actorId: userRecruiter.id,
        actorName: 'Sravanthi Allu',
        actorEmail: 'sravanthi.allu@acme.in',
        action: 'CANDIDATE_APPLICATION_CREATED',
        entityType: 'APPLICATION',
        entityId: appKarthik.id,
        newState: JSON.stringify({ candidateName: 'Venkata Karthik Guntupalli', requisition: 'REQ-HYD-2026-101' }),
        createdAt: new Date(Date.now() - 86400000 * 20),
      },
      {
        orgId: org.id,
        actorId: userInterviewer1.id,
        actorName: 'Prajwal Gowda',
        actorEmail: 'prajwal.gowda@acme.in',
        action: 'INTERVIEW_SCORECARD_SUBMITTED',
        entityType: 'SCORECARD',
        entityId: interview1.id,
        newState: JSON.stringify({ rating: 'STRONG_YES', candidate: 'Venkata Karthik Guntupalli' }),
        createdAt: new Date(Date.now() - 86400000 * 7),
      },
      {
        orgId: org.id,
        actorId: userRecruiterLead.id,
        actorName: 'Ananya Rao',
        actorEmail: 'ananya.rao@acme.in',
        action: 'OFFER_EXTENDED',
        entityType: 'OFFER',
        entityId: offerKarthik.id,
        newState: JSON.stringify({ offerNumber: 'OFF-2026-088', baseSalary: 5500000, recipient: 'Venkata Karthik Guntupalli' }),
        createdAt: new Date(Date.now() - 86400000 * 2),
      },
      {
        orgId: org.id,
        actorId: userAdmin.id,
        actorName: 'Gunavardhan Mandala',
        actorEmail: 'gunavardhan.mandala@acme.in',
        action: 'EMPLOYEE_ONBOARDING_COMPLETED',
        entityType: 'EMPLOYEE',
        entityId: empRakshitha.id,
        newState: JSON.stringify({ employeeNumber: 'EMP-1089', name: 'Rakshitha Shetty', status: 'ACTIVE' }),
        createdAt: new Date(Date.now() - 86400000 * 1),
      },
    ],
  });

  // 16. Custom Fields
  await prisma.customFieldDefinition.createMany({
    data: [
      {
        orgId: org.id,
        entityType: 'REQUISITION',
        fieldName: 'cost_center_code',
        fieldLabel: 'Cost Center Code',
        fieldType: 'TEXT',
        isRequired: true,
      },
      {
        orgId: org.id,
        entityType: 'CANDIDATE',
        fieldName: 'notice_period_days',
        fieldLabel: 'Notice Period (Days)',
        fieldType: 'SELECT',
        options: JSON.stringify(['Immediate', '15 Days', '30 Days', '60 Days', '90 Days']),
        isRequired: false,
      },
      {
        orgId: org.id,
        entityType: 'OFFER',
        fieldName: 'relocation_allowance_inr',
        fieldLabel: 'Relocation Assistance (₹)',
        fieldType: 'NUMBER',
        isRequired: false,
      },
    ],
  });

  // 17. Webhook Endpoints
  await prisma.webhookEndpoint.create({
    data: {
      orgId: org.id,
      name: 'Darwinbox / Workday Core HR Sync',
      url: 'https://api.darwinbox.in/service/custom/acme_hr/hire_event_listener',
      events: JSON.stringify(['OFFER_ACCEPTED', 'EMPLOYEE_CREATED', 'ONBOARDING_COMPLETED']),
      secret: 'whsec_enterprise_live_99a8b7c6d5e4f3a2',
      isActive: true,
      lastTriggeredAt: new Date(Date.now() - 86400000 * 1),
    },
  });

  await prisma.webhookEndpoint.create({
    data: {
      orgId: org.id,
      name: 'Slack #talent-announcements Bot',
      url: 'https://api.infinitecareers.internal/webhooks/slack-sample',
      events: JSON.stringify(['OFFER_EXTENDED', 'OFFER_ACCEPTED', 'REQUISITION_OPENED']),
      secret: 'whsec_slack_webhook_token_1234',
      isActive: true,
      lastTriggeredAt: new Date(Date.now() - 86400000 * 2),
    },
  });

  console.log('✅ Authentic Indian enterprise workforce seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
