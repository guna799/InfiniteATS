import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const STAGES = [
  { id: 'APPLIED', label: 'Applied', terminal: false },
  { id: 'SCREENING', label: 'Screening', terminal: false },
  { id: 'PHONE_SCREEN', label: 'Phone Screen', terminal: false },
  { id: 'TECHNICAL_INTERVIEW', label: 'Technical Round', terminal: false },
  { id: 'HIRING_MANAGER_INTERVIEW', label: 'Manager Interview', terminal: false },
  { id: 'ONSITE_PANEL', label: 'Onsite / Panel', terminal: false },
  { id: 'EVALUATION', label: 'Evaluation / Debrief', terminal: false },
  { id: 'OFFER_EXTENDED', label: 'Offer Extended', terminal: false },
  { id: 'OFFER_ACCEPTED', label: 'Offer Accepted / Preboarding', terminal: false },
  { id: 'ONBOARDED', label: 'Hired & Active Employee', terminal: false },
  { id: 'REJECTED', label: 'Disqualified', terminal: true },
  { id: 'WITHDRAWN', label: 'Withdrawn', terminal: true },
];

export async function GET() {
  return NextResponse.json({
    data: STAGES,
  });
}
