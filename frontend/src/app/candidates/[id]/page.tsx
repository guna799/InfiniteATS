'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTenant } from '@/context/TenantContext';
import {
  Users,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Sparkles,
  ArrowLeft,
  Calendar,
  FileCheck2,
  CheckCircle2,
  Clock,
  Briefcase,
  Star,
  MessageSquare,
  FileText,
  UserCheck,
  ShieldCheck,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { STAGES, SCORECARD_RECOMMENDATIONS } from '@/lib/constants';

export default function CandidateDetailPage() {
  const params = useParams();
  const { currentUser, showToast } = useTenant();
  const [candidate, setCandidate] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'APPLICATIONS' | 'INTERVIEWS' | 'NOTES' | 'OFFER'>('OVERVIEW');
  const [isLoading, setIsLoading] = useState(true);

  // New Note state
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isNotePrivate, setIsNotePrivate] = useState(false);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const fetchCandidate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/candidates/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setCandidate(data.candidate);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchCandidate();
    }
  }, [params.id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !currentUser) return;

    setIsSubmittingNote(true);
    try {
      const res = await fetch(`/api/candidates/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: candidate.applications?.[0]?.id || '',
          authorId: currentUser.id,
          authorName: currentUser.name,
          content: newNoteContent,
          isPrivate: isNotePrivate,
        }),
      });

      if (res.ok) {
        showToast('Note Added', 'Recruiter note recorded to candidate timeline.', 'success');
        setNewNoteContent('');
        fetchCandidate();
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  if (isLoading || !candidate) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-semibold text-slate-500">Loading Candidate 360 profile...</p>
      </div>
    );
  }

  const latestApp = candidate.applications?.[0];
  const stageMeta = STAGES.find((s) => s.id === latestApp?.status);
  const skills = candidate.skills ? (typeof candidate.skills === 'string' ? JSON.parse(candidate.skills) : candidate.skills) : [];
  const parsedData = candidate.resumeParsedData ? (typeof candidate.resumeParsedData === 'string' ? JSON.parse(candidate.resumeParsedData) : candidate.resumeParsedData) : null;
  const aiEvaluation = latestApp?.aiEvaluation ? (typeof latestApp.aiEvaluation === 'string' ? JSON.parse(latestApp.aiEvaluation) : latestApp.aiEvaluation) : null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/candidates"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Candidate Pool</span>
        </Link>

        {latestApp && (
          <div className="flex items-center gap-2">
            <Link
              href={`/interviews?applicationId=${latestApp.id}`}
              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-semibold border border-indigo-200 flex items-center gap-1.5 transition"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Schedule Interview</span>
            </Link>
            <Link
              href={`/offers?candidateId=${candidate.id}`}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-semibold border border-emerald-200 flex items-center gap-1.5 transition"
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>Manage Offer</span>
            </Link>
          </div>
        )}
      </div>

      {/* Candidate Profile Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-enterprise space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 text-white font-bold text-xl flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
              {candidate.firstName[0]}{candidate.lastName[0]}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900">
                  {candidate.firstName} {candidate.lastName}
                </h1>
                {candidate.aiMatchScore && (
                  <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    {candidate.aiMatchScore}% AI Match
                  </span>
                )}
                {stageMeta && (
                  <span className={`text-xs font-bold px-3 py-0.5 rounded-full border ${stageMeta.color}`}>
                    {stageMeta.label}
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-600 font-medium">{candidate.headline || 'Senior Software Specialist'}</p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  {candidate.email}
                </span>
                {candidate.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {candidate.phone}
                  </span>
                )}
                {candidate.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {candidate.location}
                  </span>
                )}
                {candidate.linkedinUrl && (
                  <a
                    href={candidate.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-indigo-600 hover:underline"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                    LinkedIn
                  </a>
                )}
                {candidate.accountId && parsedData?.resumeFileName && (
                  <a
                    href={`/api/resumes/${candidate.id}`}
                    className="flex items-center gap-1 text-indigo-600 hover:underline"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Resume
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Quick Target Requisition Card */}
          {latestApp && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 lg:max-w-xs w-full text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Application</span>
              <p className="font-bold text-slate-900 truncate">{latestApp.requisition?.title}</p>
              <p className="text-slate-500">{latestApp.requisition?.department?.name} • {latestApp.requisition?.location?.name}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          { id: 'OVERVIEW', label: 'Overview & Parsed Resume' },
          { id: 'APPLICATIONS', label: `Applications (${candidate.applications?.length || 0})` },
          { id: 'INTERVIEWS', label: `Interviews & Scorecards (${latestApp?.interviews?.length || 0})` },
          { id: 'NOTES', label: `Recruiter Notes (${candidate.notes?.length || 0})` },
          { id: 'OFFER', label: 'Offer & Preboarding' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition -mb-px ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          
          <div className="lg:col-span-2 space-y-6">
            
            {/* AI Fit Evaluation Box if available */}
            {aiEvaluation && (
              <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-5 rounded-2xl border border-indigo-200 shadow-enterprise space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <h3 className="font-bold text-sm text-indigo-950">AI Talent Match Assessment</h3>
                </div>
                <p className="text-slate-700 leading-relaxed">{aiEvaluation.summary}</p>
                {aiEvaluation.strengths && (
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">Key Strengths:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                      {aiEvaluation.strengths.map((str: string, i: number) => (
                        <li key={i}>{str}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Work History */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-enterprise space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Experience & Work History</h3>
              {parsedData?.workHistory ? (
                <div className="space-y-4">
                  {parsedData.workHistory.map((job: any, i: number) => (
                    <div key={i} className="border-l-2 border-indigo-500 pl-4 space-y-1">
                      <p className="font-bold text-slate-900">{job.role}</p>
                      <p className="text-indigo-600 font-semibold">{job.company} • {job.period}</p>
                      <p className="text-slate-600">{job.highlights}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">
                  {candidate.summary || 'Summary not provided.'}
                </p>
              )}
            </div>

            {/* Education */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-enterprise space-y-2">
              <h3 className="font-bold text-sm text-slate-900">Education & Degrees</h3>
              {parsedData?.education?.length ? (
                <div className="space-y-2">
                  {parsedData.education.map((ed: any, i: number) => (
                    <div key={i}>
                      <p className="font-semibold text-slate-900">
                        {ed.degree}
                        {ed.field ? `, ${ed.field}` : ''}
                      </p>
                      <p className="text-slate-600">
                        {ed.institution}
                        {ed.startYear || ed.endYear ? ` • ${ed.startYear || ''}–${ed.endYear || ''}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-700 font-medium">
                  {candidate.educationLevel || 'Degree in Computer Science / Engineering'}
                </p>
              )}
            </div>

          </div>

          {/* Right Column: Skills & Tags */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-enterprise space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Extracted Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((sk: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-medium font-mono text-[11px] border border-indigo-100">
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-enterprise space-y-2 text-slate-600">
              <h3 className="font-bold text-sm text-slate-900">Sourcing Details</h3>
              <p>Source: <span className="font-semibold text-slate-800">{candidate.source}</span></p>
              {candidate.referredBy && (
                <p>Referred by: <span className="font-semibold text-slate-800">{candidate.referredBy}</span></p>
              )}
              <p>Profile Created: <span className="font-semibold text-slate-800">{new Date(candidate.createdAt).toLocaleDateString()}</span></p>
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Applications */}
      {activeTab === 'APPLICATIONS' && (
        <div className="space-y-4">
          {candidate.applications?.map((app: any) => {
            const sMeta = STAGES.find((s) => s.id === app.status);

            return (
              <div key={app.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-enterprise flex items-center justify-between">
                <div>
                  <Link href={`/requisitions/${app.requisitionId}`} className="text-base font-bold text-slate-900 hover:text-indigo-600">
                    {app.requisition?.title}
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {app.requisition?.department?.name} • Req: {app.requisition?.reqNumber} • Applied on {new Date(app.appliedDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${sMeta?.color}`}>
                    {sMeta?.label || app.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Interviews & Scorecards */}
      {activeTab === 'INTERVIEWS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Interview Schedules & Scorecards</h3>
            {latestApp && (
              <Link
                href={`/interviews?applicationId=${latestApp.id}`}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                Schedule New Interview
              </Link>
            )}
          </div>

          {latestApp?.interviews?.map((iv: any) => (
            <div key={iv.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-enterprise space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{iv.title}</h4>
                  <p className="text-xs text-slate-500">
                    {new Date(iv.startTime).toLocaleString()} • Type: {iv.interviewType}
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {iv.status}
                </span>
              </div>

              {/* Submitted Scorecards */}
              {iv.scorecards?.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-700">Interviewer Scorecards:</p>
                  {iv.scorecards.map((sc: any) => {
                    const recMeta = SCORECARD_RECOMMENDATIONS.find((r) => r.id === sc.overallRecommendation);
                    const compScores = sc.competencyScores ? (typeof sc.competencyScores === 'string' ? JSON.parse(sc.competencyScores) : sc.competencyScores) : [];

                    return (
                      <div key={sc.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900">{sc.interviewer?.name || 'Interviewer'}</span>
                            <span className="text-slate-400 ml-2">({sc.interviewer?.title || 'Engineer'})</span>
                          </div>
                          <span className={`font-bold px-2.5 py-0.5 rounded-full ${recMeta?.badgeColor || 'bg-slate-200'}`}>
                            {recMeta?.label || sc.overallRecommendation}
                          </span>
                        </div>

                        <p className="text-slate-700 italic bg-white p-3 rounded-lg border">"{sc.overallFeedback}"</p>

                        {compScores.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {compScores.map((c: any, i: number) => (
                              <div key={i} className="p-2 bg-white rounded border flex items-center justify-between">
                                <span className="font-medium text-slate-700 truncate">{c.competency}</span>
                                <span className="font-bold text-indigo-600 ml-2 shrink-0">{c.score} / 5</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Recruiter Notes */}
      {activeTab === 'NOTES' && (
        <div className="space-y-6">
          <form onSubmit={handleAddNote} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-enterprise space-y-3 text-xs">
            <h3 className="font-bold text-sm text-slate-900">Add Recruiter Note</h3>
            <textarea
              rows={3}
              required
              placeholder="Record notes from phone call, interview debrief, compensation requirements, or manager comments..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
            />
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={isNotePrivate}
                  onChange={(e) => setIsNotePrivate(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <span>Private Note (visible only to Talent Acquisition team)</span>
              </label>

              <button
                type="submit"
                disabled={isSubmittingNote}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition disabled:opacity-50"
              >
                {isSubmittingNote ? 'Saving...' : 'Post Note'}
              </button>
            </div>
          </form>

          {/* Notes list */}
          <div className="space-y-3">
            {candidate.notes?.map((note: any) => (
              <div key={note.id} className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{note.authorName}</span>
                  <span className="text-slate-400 text-[10px]">{new Date(note.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                {note.isPrivate && (
                  <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200">
                    Private
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Offer & Preboarding */}
      {activeTab === 'OFFER' && (
        <div className="space-y-6 text-xs">
          {latestApp?.offers?.length > 0 ? (
            latestApp.offers.map((off: any) => (
              <div key={off.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-enterprise space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {off.offerNumber}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{off.title}</h3>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    {off.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border">
                  <div>
                    <span className="text-slate-400">Base Salary</span>
                    <p className="text-base font-bold text-slate-900">${off.baseSalary?.toLocaleString()} USD</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Target Bonus</span>
                    <p className="text-base font-bold text-slate-900">{off.targetBonusPercentage}%</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Sign-on Bonus</span>
                    <p className="text-base font-bold text-slate-900">${off.signingBonus?.toLocaleString()} USD</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Equity Shares</span>
                    <p className="text-base font-bold text-slate-900">{off.equityShares?.toLocaleString()} ISOs</p>
                  </div>
                </div>

                {off.signatureData && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Digitally signed and accepted on {new Date(off.signedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
              <FileCheck2 className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-800 text-sm">No Formal Offer Extended Yet</p>
              <p className="text-slate-500">Draft a compensation package and submit for approval.</p>
              <Link
                href={`/offers?candidateId=${candidate.id}`}
                className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm"
              >
                Create Compensation Offer
              </Link>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
