'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTenant } from '@/context/TenantContext';
import {
  Users,
  Search,
  Plus,
  Filter,
  Sparkles,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  ChevronRight,
  Upload,
  FileText,
  X,
} from 'lucide-react';
import { STAGES } from '@/lib/constants';

export default function CandidatesPage() {
  const { organization, currentUser, showToast } = useTenant();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReq, setSelectedReq] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Candidate Form
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formHeadline, setFormHeadline] = useState('');
  const [formSkills, setFormSkills] = useState('');
  const [formExperience, setFormExperience] = useState('5');
  const [formCompany, setFormCompany] = useState('');
  const [formEducation, setFormEducation] = useState('');
  const [formReqId, setFormReqId] = useState('');
  const [formResumeText, setFormResumeText] = useState('');
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCandidates = async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      let url = `/api/candidates?orgId=${organization.id}`;
      if (selectedReq !== 'ALL') url += `&requisitionId=${selectedReq}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const [candRes, reqRes] = await Promise.all([
        fetch(url),
        fetch(`/api/requisitions?orgId=${organization.id}`),
      ]);

      if (candRes.ok) {
        const data = await candRes.json();
        setCandidates(data.candidates || []);
      }
      if (reqRes.ok) {
        const rData = await reqRes.json();
        setRequisitions(rData.requisitions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [organization, selectedReq, searchQuery]);

  // Simulated AI Resume Parser helper
  const handleSimulateResumeParsing = async () => {
    if (!formResumeText && !formHeadline) {
      showToast('Resume Text Required', 'Please paste resume text or a work summary to parse.', 'warning');
      return;
    }

    setIsParsingResume(true);
    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESUME_PARSE_AND_MATCH',
          payload: { resumeText: formResumeText, jobTitle: formHeadline },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const parsed = data.result;
        setFormSkills(parsed.extractedSkills.join(', '));
        setFormExperience(parsed.experienceYears.toString());
        setFormEducation(parsed.education);
        showToast('AI Parsing Complete', `Extracted ${parsed.extractedSkills.length} competencies & qualifications!`, 'success');
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsParsingResume(false);
    }
  };

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    setIsSubmitting(true);
    try {
      const skillsArray = formSkills
        ? formSkills.split(',').map((s) => s.trim()).filter(Boolean)
        : ['Software Engineering'];

      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: organization.id,
          requisitionId: formReqId || null,
          firstName: formFirstName,
          lastName: formLastName,
          email: formEmail,
          phone: formPhone,
          location: formLocation,
          headline: formHeadline || `${formCompany ? 'Engineer at ' + formCompany : 'Technical Professional'}`,
          skills: skillsArray,
          experienceYears: parseFloat(formExperience) || 4,
          currentCompany: formCompany,
          educationLevel: formEducation,
          source: 'SOURCED',
          actorUser: currentUser,
        }),
      });

      if (res.ok) {
        showToast('Candidate Profile Created', 'Candidate profile and AI talent match score generated.', 'success');
        setIsAddModalOpen(false);
        // Reset
        setFormFirstName('');
        setFormLastName('');
        setFormEmail('');
        setFormPhone('');
        setFormHeadline('');
        setFormSkills('');
        setFormResumeText('');
        fetchCandidates();
      } else {
        const err = await res.json();
        showToast('Error', err.error || 'Failed to create candidate', 'error');
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
            <h1 className="text-2xl font-bold text-slate-900">Candidate Talent Pool</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {candidates.length} Profiles
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized talent database with parsed resumes, AI matching, and application history.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-200 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add Candidate</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate by name, email, skills, or headline..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedReq}
            onChange={(e) => setSelectedReq(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full md:w-64"
          >
            <option value="ALL">All Requisitions</option>
            {requisitions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.reqNumber}: {r.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Candidate Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {candidates.map((cand) => {
          const latestApp = cand.applications?.[0];
          const stageMeta = STAGES.find((s) => s.id === latestApp?.status);
          const skills = cand.skills ? (typeof cand.skills === 'string' ? JSON.parse(cand.skills) : cand.skills) : [];

          return (
            <div
              key={cand.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-enterprise hover:border-indigo-300 transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header: Name, Score, Avatar */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {cand.firstName[0]}{cand.lastName[0]}
                    </div>
                    <div>
                      <Link
                        href={`/candidates/${cand.id}`}
                        className="text-base font-bold text-slate-900 hover:text-indigo-600 transition"
                      >
                        {cand.firstName} {cand.lastName}
                      </Link>
                      <p className="text-xs text-slate-500">{cand.headline || 'Software Engineering Professional'}</p>
                    </div>
                  </div>

                  {cand.aiMatchScore && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shrink-0">
                      <Sparkles className="h-3 w-3 text-emerald-600" />
                      {cand.aiMatchScore}% Match
                    </span>
                  )}
                </div>

                {/* Contact and Meta details */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{cand.email}</span>
                  </div>
                  {cand.location && (
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{cand.location}</span>
                    </div>
                  )}
                  {cand.experienceYears && (
                    <div className="text-slate-600">
                      Experience: <span className="font-semibold text-slate-800">{cand.experienceYears} yrs</span>
                    </div>
                  )}
                  {cand.currentCompany && (
                    <div className="text-slate-600">
                      Company: <span className="font-semibold text-slate-800">{cand.currentCompany}</span>
                    </div>
                  )}
                </div>

                {/* Skills tags */}
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {skills.slice(0, 5).map((sk: string, i: number) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                        {sk}
                      </span>
                    ))}
                    {skills.length > 5 && (
                      <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                        +{skills.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer: Active Application Stage and 360 link */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                {latestApp ? (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Stage:</span>
                    <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] border ${stageMeta?.color || 'bg-slate-100'}`}>
                      {stageMeta?.label || latestApp.status}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-400">In Talent Pool</span>
                )}

                <Link
                  href={`/candidates/${cand.id}`}
                  className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <span>Candidate 360</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Candidate Modal with AI Resume Parser simulation */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add Candidate Profile</h2>
                <p className="text-xs text-slate-500">Manual entry or simulated AI Resume extraction</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* AI Resume Parser Quick Action */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  Instant AI Resume Parser
                </span>
                <button
                  type="button"
                  onClick={handleSimulateResumeParsing}
                  disabled={isParsingResume}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {isParsingResume ? 'Analyzing...' : 'Parse Resume Text'}
                </button>
              </div>
              <textarea
                rows={2}
                placeholder="Paste candidate resume text or LinkedIn summary here to auto-extract skills, education, and experience..."
                value={formResumeText}
                onChange={(e) => setFormResumeText(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-slate-900"
              />
            </div>

            <form onSubmit={handleCreateCandidate} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Professional Headline</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Backend Engineer"
                    value={formHeadline}
                    onChange={(e) => setFormHeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Target Requisition</label>
                  <select
                    value={formReqId}
                    onChange={(e) => setFormReqId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  >
                    <option value="">General Talent Pool (No Req)</option>
                    {requisitions.map((r) => (
                      <option key={r.id} value={r.id}>{r.reqNumber}: {r.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Extracted Skills & Competencies (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Go, Distributed Systems, Kafka, Kubernetes, AWS"
                  value={formSkills}
                  onChange={(e) => setFormSkills(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Years Experience</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formExperience}
                    onChange={(e) => setFormExperience(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Current Company</label>
                  <input
                    type="text"
                    placeholder="e.g. Stripe"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. San Francisco, CA"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-200 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Candidate Profile'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
