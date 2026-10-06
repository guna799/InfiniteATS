import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    if (action === 'GENERATE_JD') {
      const { title, department, level, workplaceType } = payload;

      const generated = {
        title: `${title} (${level || 'Senior'})`,
        overview: `We are seeking a high-caliber ${title} to join our ${department || 'Engineering'} organization in a ${workplaceType || 'Hybrid'} capacity. In this role, you will architect foundational systems, drive technical excellence, and collaborate cross-functionally to scale our enterprise SaaS platform.`,
        responsibilities: [
          `Lead the design, architecture, and deployment of scalable, fault-tolerant enterprise services.`,
          `Partner with product management, design, and infrastructure teams to deliver high-impact roadmap milestones.`,
          `Uphold and elevate coding standards, automated testing, and CI/CD best practices.`,
          `Mentor junior and mid-level engineers through code reviews, architecture discussions, and career coaching.`,
          `Analyze telemetry, logs, and performance metrics to drive sub-second latency and 99.99% system availability.`,
        ],
        requirements: [
          `5+ years of production experience in high-scale distributed systems or modern web stacks.`,
          `Demonstrated proficiency in Go, Rust, TypeScript, Python, or modern modern cloud architectures.`,
          `Hands-on experience with cloud providers (AWS/GCP), container orchestration (Kubernetes), and relational/NoSQL databases.`,
          `Strong communication and technical writing skills with a bias for structured documentation.`,
          `B.S. or M.S. in Computer Science, or equivalent practical industry track record.`,
        ],
        competencies: [
          'System Architecture & Design',
          'Distributed Data Systems',
          'Code Quality & Testing',
          'Cross-Functional Collaboration',
          'Technical Mentorship',
        ],
      };

      return NextResponse.json({ result: generated });
    }

    if (action === 'INCLUSIVE_LANGUAGE_CHECK') {
      const { text } = payload;
      return NextResponse.json({
        score: 96,
        status: 'EXCELLENT',
        suggestions: [
          { original: 'ninja / rockstar', suggestion: 'skilled engineer / specialist', reason: 'Gender-coded & jargon-heavy' },
          { original: 'aggressive deadlines', suggestion: 'ambitious milestones', reason: 'Promotes psychological safety' },
        ],
        readabilityGrade: 'Grade 10 (Clear and Accessible)',
      });
    }

    if (action === 'RESUME_PARSE_AND_MATCH') {
      const { resumeText, jobTitle } = payload;

      const mockParsed = {
        candidateName: 'Candidate Profile',
        extractedSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'Distributed Systems', 'CI/CD'],
        experienceYears: 6.5,
        education: 'B.S. in Computer Science',
        matchScore: 92,
        keyStrengths: [
          'Strong alignment with full-stack TypeScript and cloud infrastructure requirements',
          'Demonstrated track record scaling multi-tenant SaaS architectures',
          'Extensive testing and CI/CD automation experience',
        ],
        skillGaps: ['Familiarity with GraphQL is not explicitly listed (training recommended)'],
        verdict: 'STRONG_FIT',
      };

      return NextResponse.json({ result: mockParsed });
    }

    if (action === 'INTERVIEW_QUESTIONS') {
      const { jobTitle, competencies } = payload;

      const questions = [
        {
          competency: 'System Architecture & Scalability',
          question: `Describe how you would design a high-throughput webhook dispatch system for ${jobTitle || 'an enterprise ATS'} that guarantees at-least-once delivery with automatic exponential backoff and jitter.`,
          rubric: {
            '5 (Exceptional)': 'Discusses dead-letter queues, idempotent consumer tokens, rate-limiting buckets, and partition hashing.',
            '3 (Competent)': 'Mentions message queues (Kafka/RabbitMQ) and basic retry loops with status logging.',
            '1 (Deficient)': 'Proposes synchronous HTTP loops without resilience or persistent queueing.',
          },
        },
        {
          competency: 'Fault Tolerance & Resilience',
          question: 'How do you diagnose and mitigate a cascading database connection pool exhaustion in a distributed microservices environment?',
          rubric: {
            '5 (Exceptional)': 'Covers circuit breakers, adaptive pool sizing, query timeout budgets, and connection reuse caching.',
            '3 (Competent)': 'Suggests increasing pool max size and optimizing slow queries via EXPLAIN ANALYZE.',
            '1 (Deficient)': 'Cannot articulate connection leak causes or database deadlocks.',
          },
        },
        {
          competency: 'Cross-Functional Collaboration',
          question: 'Tell me about a time you had a significant architectural disagreement with a Product Manager or Senior Architect. How did you resolve it?',
          rubric: {
            '5 (Exceptional)': 'Used objective RFC trade-off matrices, customer impact data, and prototype benchmarks to build consensus.',
            '3 (Competent)': 'Compromised through 1:1 discussions and manager mediation.',
            '1 (Deficient)': 'Shows reluctance to compromise or disregards business constraints.',
          },
        },
      ];

      return NextResponse.json({ questions });
    }

    if (action === 'SCORECARD_SYNTHESIS') {
      const { candidateName, scorecards } = payload;

      const synthesis = {
        candidateName,
        overallConsensus: 'STRONG_HIRE',
        averageScore: 4.8,
        totalInterviews: scorecards?.length || 2,
        consensusSummary: `${candidateName} has demonstrated exceptional competency in distributed system design and technical architecture. All interviewers highlighted clear communication, deep understanding of edge cases, and pragmatic trade-offs.`,
        recommendedLevel: 'IC5 (Staff / Principal)',
        suggestedOfferRange: '$235,000 - $265,000 Base + 15% Bonus',
      };

      return NextResponse.json({ synthesis });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('AI Assistant API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
