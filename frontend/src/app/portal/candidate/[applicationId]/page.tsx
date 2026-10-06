'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export const dynamic = 'force-dynamic';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  FileCheck2,
  Lock,
  Building2,
  FileSignature,
  DollarSign,
  Briefcase,
  AlertCircle,
  Calendar,
  Laptop,
  UploadCloud,
  FileText,
  Download,
  ShieldCheck,
  Ban,
  Check,
  RefreshCw,
} from 'lucide-react';

const REQUIRED_ONBOARDING_DOCS = [
  {
    type: 'PAN',
    category: 'IDENTITY',
    title: 'PAN Card',
    description: 'Permanent Account Number card for Indian Income Tax compliance.',
    required: true,
  },
  {
    type: 'AADHAAR',
    category: 'IDENTITY',
    title: 'Aadhaar Card',
    description: 'UIDAI identity document for identity verification and PF/ESI linking.',
    required: true,
  },
  {
    type: 'HIGHEST_EDUCATION_CERTIFICATE',
    category: 'EDUCATION',
    title: 'Highest Degree Certificate',
    description: 'Final degree certificate, provisional certificate or transcript.',
    required: true,
  },
  {
    type: 'EXPERIENCE_LETTER',
    category: 'EXPERIENCE',
    title: 'Previous Experience / Relieving Letter',
    description: 'Relieving letter or service certificate from your immediate prior employer.',
    required: true,
  },
  {
    type: 'BANK_PROOF',
    category: 'BANKING',
    title: 'Bank Proof / Cancelled Cheque',
    description: 'Cancelled cheque or bank statement showing your name, account number & IFSC.',
    required: true,
  },
  {
    type: 'FORM_11',
    category: 'STATUTORY',
    title: 'Form 11 (Statutory Declaration)',
    description: 'EPFO Form 11 declaration for Provident Fund continuation.',
    required: false,
  },
];

export default function CandidatePortalPage() {
  const params = useParams();
  const applicationId = params?.applicationId as string;

  const [application, setApplication] = useState<any>(null);
  const [candidate, setCandidate] = useState<any>(null);
  const [offer, setOffer] = useState<any>(null);
  const [candidateDocs, setCandidateDocs] = useState<any[]>([]);
  const [onboardingTasks, setOnboardingTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // E-Signature state
  const [typedSignature, setTypedSignature] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isCelebration, setIsCelebration] = useState(false);

  // Uploading state
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);

  const fetchApplicationDetails = async () => {
    setIsLoading(true);
    try {
      const candRes = await fetch(`/api/candidates`);
      if (candRes.ok) {
        const data = await candRes.json();
        const allCandidates = data.candidates || [];
        for (const c of allCandidates) {
          const app = c.applications?.find((a: any) => a.id === applicationId);
          if (app) {
            setCandidate(c);
            setApplication(app);
            if (app.offers?.length > 0) {
              setOffer(app.offers[0]);
            }
            // Fetch candidate documents
            const docRes = await fetch(`/api/documents?candidateId=${c.id}`);
            if (docRes.ok) {
              const dData = await docRes.json();
              setCandidateDocs(dData.documents || []);
            }
            break;
          }
        }
      }

      // Also check onboarding tasks
      const onbRes = await fetch(`/api/onboarding?applicationId=${applicationId}`);
      if (onbRes.ok) {
        const oData = await onbRes.json();
        setOnboardingTasks(oData.tasks || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (applicationId) {
      fetchApplicationDetails();
    }
  }, [applicationId]);

  const handleSignOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offer || !typedSignature.trim() || !agreeTerms) return;

    setIsSigning(true);
    try {
      const res = await fetch(`/api/offers/${offer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ACCEPT',
          signatureData: {
            signatureType: 'DIGITAL_TYPED',
            signatureValue: typedSignature,
          },
        }),
      });

      if (res.ok) {
        setIsCelebration(true);
        fetchApplicationDetails();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSigning(false);
    }
  };

  const handleCandidateFileUpload = async (docType: string, category: string, file: File) => {
    if (!candidate || !application) return;
    setUploadingDocType(docType);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('orgId', application.organizationId || application.requisition?.organizationId || 'tenant-acme-tech');
      formData.append('candidateId', candidate.id);
      formData.append('documentType', docType);
      formData.append('category', category);

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        await fetchApplicationDetails();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to upload document');
      }
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploadingDocType(null);
    }
  };

  const handleDownloadDoc = async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}/download`);
      const data = await res.json();
      if (res.ok && data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      } else {
        alert(data.error || 'Could not download document');
      }
    } catch (err: any) {
      alert(err.message || 'Download failed');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm font-semibold text-slate-500">Loading Candidate Portal...</p>
      </div>
    );
  }

  const isOfferExtended = offer && offer.status === 'EXTENDED';
  const isOfferAccepted = offer && offer.status === 'ACCEPTED';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-900">InfiniteCareers Candidate Portal</span>
              <span className="text-[11px] text-slate-500 block">Candidate Self-Service, Offer E-Sign & Onboarding Vault</span>
            </div>
          </div>

          <Link href="/" className="text-xs font-semibold text-slate-600 hover:text-indigo-600">
            Back to Dashboard ↗
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-8 space-y-8">
        
        {/* Welcome Banner */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-enterprise space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
            Candidate Application Status
          </span>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {candidate?.firstName} {candidate?.lastName}
          </h1>
          <p className="text-xs text-slate-600">
            Application for <strong>{application?.requisition?.title || 'Open Position'}</strong> ({application?.requisition?.reqNumber})
          </p>
        </div>

        {/* Progress Timeline */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-enterprise space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Application Journey</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mb-1" />
              <span className="font-bold block">1. Applied</span>
              <span className="text-[10px] text-emerald-700">Resume parsed</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mb-1" />
              <span className="font-bold block">2. Interviews</span>
              <span className="text-[10px] text-emerald-700">Panel completed</span>
            </div>

            <div className={`p-3 rounded-xl border ${isOfferExtended || isOfferAccepted ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mb-1" />
              <span className="font-bold block">3. Offer Letter</span>
              <span className="text-[10px] text-emerald-700">{isOfferAccepted ? 'Accepted & Signed' : isOfferExtended ? 'Ready for E-Sign' : 'In Review'}</span>
            </div>

            <div className={`p-3 rounded-xl border ${isOfferAccepted ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              <Laptop className="h-4 w-4 text-indigo-600 mb-1" />
              <span className="font-bold block">4. Preboarding</span>
              <span className="text-[10px] text-indigo-600">{isOfferAccepted ? 'Active Tasks' : 'Upcoming'}</span>
            </div>
          </div>
        </div>

        {/* Offer Letter Review & E-Signature Ceremony Box */}
        {offer && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-enterprise space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {offer.offerNumber}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">Employment Offer Package</h2>
              </div>

              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  isOfferAccepted ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                }`}
              >
                {offer.status}
              </span>
            </div>

            {/* Compensation Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Base Annual Salary</span>
                <span className="text-base font-bold text-slate-900">${offer.baseSalary?.toLocaleString()} USD</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Target Bonus</span>
                <span className="text-base font-bold text-slate-900">{offer.targetBonusPercentage}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Sign-on Bonus</span>
                <span className="text-base font-bold text-slate-900">${offer.signingBonus?.toLocaleString()} USD</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Equity Grant</span>
                <span className="text-base font-bold text-slate-900">{offer.equityShares?.toLocaleString()} ISOs</span>
              </div>
            </div>

            {/* Formal Offer Letter Document Preview */}
            <div className="bg-slate-50 p-6 rounded-xl border font-serif text-slate-800 text-xs leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
              {offer.offerLetterContent}
            </div>

            {/* Digital E-Signature Form if Pending Signing */}
            {isOfferExtended && (
              <form onSubmit={handleSignOffer} className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-4 text-xs">
                <div className="flex items-center gap-2 text-indigo-950 font-bold text-sm">
                  <FileSignature className="h-4 w-4 text-indigo-600" />
                  <span>Digital E-Signature Verification</span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Type Your Full Legal Name to Sign *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Venkata Karthik Guntupalli"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    className="w-full px-3 py-2 bg-white border rounded-xl text-slate-900 font-serif italic text-base"
                  />
                </div>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span>I agree and accept the terms of this offer letter and confirm my start date.</span>
                </label>

                <button
                  type="submit"
                  disabled={isSigning || !agreeTerms || !typedSignature.trim()}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span>{isSigning ? 'Verifying E-Signature...' : 'Accept & Electronically Sign Offer'}</span>
                </button>
              </form>
            )}

            {/* Signed State */}
            {isOfferAccepted && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Offer Successfully Accepted & Digitally Signed!</span>
                </div>
                <p className="text-emerald-800">
                  Congratulations! Your employee onboarding workspace has been initiated. Complete your document checklist below.
                </p>
              </div>
            )}
          </div>
        )}

        {/* CANDIDATE ONBOARDING DOCUMENT CHECKLIST (AWS S3 VAULT) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-enterprise space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-violet-600" />
                <h2 className="text-base font-bold text-slate-900">Onboarding Document Checklist (S3 Vault)</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload your statutory identity, educational and banking proofs. Files are stored securely in AWS S3.
              </p>
            </div>
            <button
              onClick={fetchApplicationDetails}
              className="p-2 text-slate-400 hover:text-slate-600 transition"
              title="Refresh status"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {REQUIRED_ONBOARDING_DOCS.map((reqDoc) => {
              const submittedDoc = candidateDocs.find((d) => d.documentType === reqDoc.type);
              const isUploading = uploadingDocType === reqDoc.type;

              return (
                <div key={reqDoc.type} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{reqDoc.title}</span>
                      {reqDoc.required ? (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">Required</span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">Optional</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">{reqDoc.description}</p>
                    
                    {submittedDoc && (
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                        <span className="font-mono text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-200">
                          {submittedDoc.originalFilename} ({(submittedDoc.fileSize / 1024).toFixed(1)} KB)
                        </span>
                        <span className="font-mono text-slate-500">
                          SHA-256: {submittedDoc.sha256Hash?.slice(0, 12)}...
                        </span>
                      </div>
                    )}

                    {submittedDoc?.status === 'REJECTED' && (
                      <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] flex items-center gap-1.5 mt-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                        <span>Rejection Reason: {submittedDoc.rejectionReason || 'Document illegible or invalid.'} Please re-upload.</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {submittedDoc ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            submittedDoc.status === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : submittedDoc.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {submittedDoc.status === 'VERIFIED' ? '✓ Verified' : submittedDoc.status === 'REJECTED' ? '✕ Rejected' : '⟳ Submitted (In Review)'}
                        </span>

                        <button
                          onClick={() => handleDownloadDoc(submittedDoc.id)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                          title="Download Submitted Copy"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>

                        {(submittedDoc.status === 'REJECTED' || submittedDoc.status === 'PENDING_VERIFICATION') && (
                          <label className="cursor-pointer px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition">
                            <UploadCloud className="h-3.5 w-3.5" />
                            <span>{isUploading ? 'Uploading...' : 'Replace'}</span>
                            <input
                              type="file"
                              disabled={isUploading}
                              className="hidden"
                              accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleCandidateFileUpload(reqDoc.type, reqDoc.category, file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    ) : (
                      <label className="cursor-pointer px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition">
                        <UploadCloud className="h-4 w-4" />
                        <span>{isUploading ? 'Uploading to S3...' : 'Upload Document'}</span>
                        <input
                          type="file"
                          disabled={isUploading}
                          className="hidden"
                          accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleCandidateFileUpload(reqDoc.type, reqDoc.category, file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Preboarding Tasks Checklist */}
        {isOfferAccepted && onboardingTasks.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-enterprise space-y-4 text-xs">
            <h2 className="text-base font-bold text-slate-900">Your First-Day Preboarding Checklist</h2>
            <p className="text-slate-500">Please review and complete the following preparatory steps:</p>

            <div className="divide-y divide-slate-100">
              {onboardingTasks.map((t) => (
                <div key={t.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className={`h-4 w-4 ${t.status === 'COMPLETED' ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <div>
                      <p className={`font-bold text-slate-900 ${t.status === 'COMPLETED' ? 'line-through text-slate-400' : ''}`}>
                        {t.title}
                      </p>
                      <p className="text-slate-500 text-[11px]">{t.description}</p>
                    </div>
                  </div>

                  <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
