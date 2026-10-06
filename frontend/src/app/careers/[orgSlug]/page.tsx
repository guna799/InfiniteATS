'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export const dynamic = 'force-dynamic';
import {
  Briefcase,
  Search,
  MapPin,
  Building2,
  DollarSign,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Upload,
  X,
  FileText,
} from 'lucide-react';

export default function PublicCareersPortal() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || 'acme-tech';

  const [org, setOrg] = useState<any>(null);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Application Modal
  const [activeJobForApply, setActiveJobForApply] = useState<any>(null);
  const [applicantFirstName, setApplicantFirstName] = useState('');
  const [applicantLastName, setApplicantLastName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantResumeText, setApplicantResumeText] = useState('');
  const [applicantLinkedin, setApplicantLinkedin] = useState('');
  const [applicantGithub, setApplicantGithub] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState<any>(null);

  useEffect(() => {
    const fetchCareers = async () => {
      setIsLoading(true);
      try {
        const sessionRes = await fetch(`/api/auth/session?orgSlug=${orgSlug}`);
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setOrg(sessionData.organization);

          // Fetch open published requisitions for this org
          const reqRes = await fetch(`/api/requisitions?orgId=${sessionData.organization.id}&publishedOnly=true`);
          if (reqRes.ok) {
            const rData = await reqRes.json();
            setRequisitions(rData.requisitions || []);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCareers();
  }, [orgSlug]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org || !activeJobForApply) return;

    setIsApplying(true);
    try {
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: org.id,
          requisitionId: activeJobForApply.id,
          firstName: applicantFirstName,
          lastName: applicantLastName,
          email: applicantEmail,
          phone: applicantPhone,
          linkedinUrl: applicantLinkedin,
          githubUrl: applicantGithub,
          summary: applicantResumeText || 'Candidate application via public career site.',
          skills: ['Software Engineering', 'System Design', 'Communication'],
          source: 'CAREER_SITE',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setApplicationSuccess({
          candidateName: `${applicantFirstName} ${applicantLastName}`,
          jobTitle: activeJobForApply.title,
          applicationId: data.application?.id,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsApplying(false);
    }
  };

  const filteredReqs = requisitions.filter((r) => {
    if (selectedDept !== 'ALL' && r.departmentId !== selectedDept) return false;
    if (selectedLocation !== 'ALL' && r.locationId !== selectedLocation) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Careers Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900">{org?.name || 'Careers'}</span>
              <span className="text-[11px] text-slate-500 block font-medium">Careers & Opportunities</span>
            </div>
          </div>

          <Link
            href="/"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition text-slate-700"
          >
            ATS Admin Portal ↗
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-900 text-white py-16 px-6 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-4 relative z-10">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            We are hiring top-tier builders
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Build the Future of Enterprise Systems
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Join our mission to power mission-critical software at global scale. Competitive compensation, comprehensive benefits, and world-class teammates.
          </p>
        </div>
      </section>

      {/* Search & Filter Bar */}
      <div className="max-w-5xl mx-auto px-6 -mt-8 relative z-20 w-full">
        <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by role or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-700 font-medium"
            >
              <option value="ALL">All Departments</option>
              {org?.departments?.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-700 font-medium"
            >
              <option value="ALL">All Locations</option>
              {org?.locations?.map((loc: any) => (
                <option key={loc.id} value={loc.id}>{loc.name} ({loc.type})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Open Requisitions List */}
      <main className="max-w-5xl mx-auto px-6 py-12 flex-1 w-full space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">
            Open Positions ({filteredReqs.length})
          </h2>
        </div>

        <div className="space-y-4">
          {filteredReqs.map((req) => (
            <div
              key={req.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-enterprise hover:border-indigo-400 hover:shadow-glow transition space-y-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    {req.department?.name}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {req.workplaceType}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{req.title}</h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {req.location?.name}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                    ${(req.minSalary / 1000).toFixed(0)}k - ${(req.maxSalary / 1000).toFixed(0)}k {req.currency}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveJobForApply(req);
                  setApplicationSuccess(null);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition shrink-0 flex items-center gap-2 self-start sm:self-center"
              >
                <span>Apply Now</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}

          {filteredReqs.length === 0 && !isLoading && (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-800 text-sm">No matching positions found</p>
              <p className="text-xs text-slate-500">Try adjusting your keyword search or department filter.</p>
            </div>
          )}
        </div>
      </main>

      {/* Application Modal */}
      {activeJobForApply && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            
            {applicationSuccess ? (
              <div className="text-center py-8 space-y-4">
                <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Application Submitted!</h3>
                <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{applicationSuccess.candidateName}</strong>. Your application for <strong>{applicationSuccess.jobTitle}</strong> has been received and routed to our hiring team.
                </p>

                {applicationSuccess.applicationId && (
                  <div className="pt-2">
                    <Link
                      href={`/portal/candidate/${applicationSuccess.applicationId}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-md"
                    >
                      <span>Go to Candidate Self-Service Portal</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}

                <button
                  onClick={() => setActiveJobForApply(null)}
                  className="block mx-auto text-slate-500 hover:underline pt-2"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Application Form</span>
                    <h2 className="text-base font-bold text-slate-900">{activeJobForApply.title}</h2>
                  </div>
                  <button onClick={() => setActiveJobForApply(null)} className="text-slate-400 hover:text-slate-700">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleApply} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">First Name *</label>
                      <input
                        type="text"
                        required
                        value={applicantFirstName}
                        onChange={(e) => setApplicantFirstName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={applicantLastName}
                        onChange={(e) => setApplicantLastName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={applicantEmail}
                        onChange={(e) => setApplicantEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Phone</label>
                      <input
                        type="text"
                        value={applicantPhone}
                        onChange={(e) => setApplicantPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">LinkedIn Profile URL</label>
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/username"
                        value={applicantLinkedin}
                        onChange={(e) => setApplicantLinkedin(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">GitHub / Portfolio URL</label>
                      <input
                        type="url"
                        placeholder="https://github.com/username"
                        value={applicantGithub}
                        onChange={(e) => setApplicantGithub(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Resume & Experience Summary *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Paste your resume highlights, key skills, and past companies..."
                      value={applicantResumeText}
                      onChange={(e) => setApplicantResumeText(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setActiveJobForApply(null)}
                      className="px-4 py-2 rounded-xl border text-slate-700 hover:bg-slate-50 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isApplying}
                      className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-200 transition disabled:opacity-50"
                    >
                      {isApplying ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </div>
                </form>
              </>
            )}

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 {org?.name || 'Acme Global Technologies'}. Powered by InfiniteCareers Intelligent ATS.</p>
      </footer>

    </div>
  );
}
