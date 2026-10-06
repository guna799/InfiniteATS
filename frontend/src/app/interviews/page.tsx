'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTenant } from '@/context/TenantContext';
import {
  Calendar,
  Plus,
  Clock,
  Video,
  UserCheck,
  CheckCircle2,
  FileText,
  Sparkles,
  Star,
  Users,
  ChevronRight,
  X,
} from 'lucide-react';
import { SCORECARD_RECOMMENDATIONS } from '@/lib/constants';

export default function InterviewsPage() {
  const { organization, currentUser, users, showToast } = useTenant();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Schedule Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [interviewTitle, setInterviewTitle] = useState('Technical Architecture & System Design');
  const [interviewType, setInterviewType] = useState('SYSTEM_DESIGN');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedInterviewerId, setSelectedInterviewerId] = useState('');

  // Scorecard Modal State
  const [isScorecardModalOpen, setIsScorecardModalOpen] = useState(false);
  const [activeInterviewForScorecard, setActiveInterviewForScorecard] = useState<any>(null);
  const [overallRec, setOverallRec] = useState('STRONG_YES');
  const [overallFeedback, setOverallFeedback] = useState('');
  const [scoreComp1, setScoreComp1] = useState('5');
  const [scoreComp2, setScoreComp2] = useState('4');
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInterviews = async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      const [ivRes, appRes] = await Promise.all([
        fetch(`/api/interviews?orgId=${organization.id}`),
        fetch(`/api/applications?orgId=${organization.id}`),
      ]);

      if (ivRes.ok) {
        const data = await ivRes.json();
        setInterviews(data.interviews || []);
      }
      if (appRes.ok) {
        const aData = await appRes.json();
        setApplications(aData.applications || []);
        if (aData.applications?.length > 0) {
          setSelectedAppId(aData.applications[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
    // Default times
    const now = new Date();
    now.setHours(now.getHours() + 2);
    now.setMinutes(0);
    setStartTime(now.toISOString().slice(0, 16));
    const later = new Date(now.getTime() + 3600000);
    setEndTime(later.toISOString().slice(0, 16));
  }, [organization]);

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !selectedAppId) return;

    const targetApp = applications.find((a) => a.id === selectedAppId);
    if (!targetApp) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: organization.id,
          applicationId: selectedAppId,
          requisitionId: targetApp.requisitionId,
          title: interviewTitle,
          interviewType,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          interviewers: [{ id: selectedInterviewerId || currentUser?.id, name: currentUser?.name }],
          actorUser: currentUser,
        }),
      });

      if (res.ok) {
        showToast('Interview Scheduled', 'Calendar invites and video conference link created.', 'success');
        setIsScheduleModalOpen(false);
        fetchInterviews();
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitScorecard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInterviewForScorecard || !currentUser || !organization) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/scorecards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: organization.id,
          interviewScheduleId: activeInterviewForScorecard.id,
          applicationId: activeInterviewForScorecard.applicationId,
          interviewerId: currentUser.id,
          overallRecommendation: overallRec,
          overallFeedback,
          competencyScores: [
            { competency: 'Technical Execution & Problem Solving', score: parseInt(scoreComp1) },
            { competency: 'System Architecture & Communication', score: parseInt(scoreComp2) },
          ],
          strengths,
          weaknesses,
          actorUser: currentUser,
        }),
      });

      if (res.ok) {
        showToast('Scorecard Submitted', 'Structured evaluation and ratings recorded.', 'success');
        setIsScorecardModalOpen(false);
        fetchInterviews();
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Interview Command Center</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {interviews.length} Scheduled
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Orchestrate structured candidate interviews, video meeting links, and blind scorecards.
          </p>
        </div>

        <button
          onClick={() => setIsScheduleModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-200 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Schedule Interview</span>
        </button>
      </div>

      {/* Interviews List */}
      <div className="space-y-4">
        {interviews.map((iv) => {
          const cand = iv.application?.candidate;
          const req = iv.application?.requisition;
          const scorecards = iv.scorecards || [];

          return (
            <div
              key={iv.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-enterprise space-y-4 hover:border-indigo-300 transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {iv.interviewType}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        iv.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {iv.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{iv.title}</h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">
                      Candidate: {cand?.firstName} {cand?.lastName}
                    </span>
                    <span>•</span>
                    <span>Role: {req?.title}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(iv.startTime).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:self-center">
                  {iv.locationOrMeetingUrl && (
                    <a
                      href={iv.locationOrMeetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Video className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Join Video Link</span>
                    </a>
                  )}

                  <button
                    onClick={() => {
                      setActiveInterviewForScorecard(iv);
                      setIsScorecardModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Submit Scorecard</span>
                  </button>
                </div>

              </div>

              {/* Scorecard summary if submitted */}
              {scorecards.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <p className="font-bold text-slate-700">Submitted Feedback & Consensus:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {scorecards.map((sc: any) => {
                      const recMeta = SCORECARD_RECOMMENDATIONS.find((r) => r.id === sc.overallRecommendation);

                      return (
                        <div key={sc.id} className="p-3 rounded-xl bg-slate-50 border space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{sc.interviewer?.name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${recMeta?.badgeColor || 'bg-slate-200'}`}>
                              {recMeta?.label || sc.overallRecommendation}
                            </span>
                          </div>
                          <p className="text-slate-600 italic">"{sc.overallFeedback}"</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Schedule Interview Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900">Schedule Candidate Interview</h2>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleInterview} className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Candidate & Application *</label>
                <select
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                >
                  {applications.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.candidate?.firstName} {a.candidate?.lastName} — {a.requisition?.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Interview Title *</label>
                <input
                  type="text"
                  required
                  value={interviewTitle}
                  onChange={(e) => setInterviewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Interview Type</label>
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  >
                    <option value="PHONE_SCREEN">Phone Screen</option>
                    <option value="TECHNICAL">Technical Deep-Dive</option>
                    <option value="SYSTEM_DESIGN">System Architecture Design</option>
                    <option value="BEHAVIORAL">Behavioral & Leadership</option>
                    <option value="PANEL">Onsite Panel</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Lead Interviewer</label>
                  <select
                    value={selectedInterviewerId}
                    onChange={(e) => setSelectedInterviewerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role.replace('_', ' ')})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Start Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">End Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Scheduling...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Structured Scorecard Modal */}
      {isScorecardModalOpen && activeInterviewForScorecard && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Structured Interview Scorecard</h2>
                <p className="text-slate-500">
                  {activeInterviewForScorecard.title} — {activeInterviewForScorecard.application?.candidate?.firstName}{' '}
                  {activeInterviewForScorecard.application?.candidate?.lastName}
                </p>
              </div>
              <button onClick={() => setIsScorecardModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitScorecard} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">Overall Recommendation *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SCORECARD_RECOMMENDATIONS.map((rec) => (
                    <button
                      type="button"
                      key={rec.id}
                      onClick={() => setOverallRec(rec.id)}
                      className={`p-2.5 rounded-xl text-center font-bold border transition ${
                        overallRec === rec.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {rec.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Technical Execution (1-5)</label>
                  <select
                    value={scoreComp1}
                    onChange={(e) => setScoreComp1(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900 font-bold"
                  >
                    <option value="5">5 - Exceptional / Mastery</option>
                    <option value="4">4 - Strong / Exceeds Bar</option>
                    <option value="3">3 - Meets Expectations</option>
                    <option value="2">2 - Needs Improvement</option>
                    <option value="1">1 - Deficient</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">System Design (1-5)</label>
                  <select
                    value={scoreComp2}
                    onChange={(e) => setScoreComp2(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900 font-bold"
                  >
                    <option value="5">5 - Exceptional / Mastery</option>
                    <option value="4">4 - Strong / Exceeds Bar</option>
                    <option value="3">3 - Meets Expectations</option>
                    <option value="2">2 - Needs Improvement</option>
                    <option value="1">1 - Deficient</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Overall Feedback & Evidence *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail candidate performance, trade-offs discussed, code quality, and specific answers..."
                  value={overallFeedback}
                  onChange={(e) => setOverallFeedback(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Key Strengths</label>
                  <textarea
                    rows={2}
                    placeholder="Clear communication, distributed algorithms..."
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Areas of Concern</label>
                  <textarea
                    rows={2}
                    placeholder="Edge cases missed, testing depth..."
                    value={weaknesses}
                    onChange={(e) => setWeaknesses(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsScorecardModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
