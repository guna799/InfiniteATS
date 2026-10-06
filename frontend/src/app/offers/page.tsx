'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTenant } from '@/context/TenantContext';

export const dynamic = 'force-dynamic';
import {
  FileCheck2,
  Plus,
  DollarSign,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  X,
  FileText,
  Building2,
} from 'lucide-react';
import { OFFER_STATUSES } from '@/lib/constants';

function OffersContent() {
  const searchParams = useSearchParams();
  const initialCandidateId = searchParams.get('candidateId');
  const { organization, currentUser, showToast } = useTenant();

  const [offers, setOffers] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Draft Offer Modal
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState(initialCandidateId || '');
  const [selectedReqId, setSelectedReqId] = useState('');
  const [offerTitle, setOfferTitle] = useState('Principal Distributed Systems Engineer');
  const [baseSalary, setBaseSalary] = useState('245000');
  const [targetBonus, setTargetBonus] = useState('15');
  const [signingBonus, setSigningBonus] = useState('35000');
  const [equityShares, setEquityShares] = useState('25000');
  const [vestingSchedule, setVestingSchedule] = useState('4-year standard with 1-year cliff');
  const [startDate, setStartDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Offer Letter Preview Modal
  const [viewingOffer, setViewingOffer] = useState<any>(null);

  const fetchOffers = async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      const [offerRes, candRes, reqRes] = await Promise.all([
        fetch(`/api/offers?orgId=${organization.id}`),
        fetch(`/api/candidates?orgId=${organization.id}`),
        fetch(`/api/requisitions?orgId=${organization.id}`),
      ]);

      if (offerRes.ok) {
        const data = await offerRes.json();
        setOffers(data.offers || []);
      }
      if (candRes.ok) {
        const cData = await candRes.json();
        setCandidates(cData.candidates || []);
        if (cData.candidates?.length > 0 && !selectedCandidateId) {
          setSelectedCandidateId(cData.candidates[0].id);
        }
      }
      if (reqRes.ok) {
        const rData = await reqRes.json();
        setRequisitions(rData.requisitions || []);
        if (rData.requisitions?.length > 0) {
          setSelectedReqId(rData.requisitions[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    setStartDate(nextMonth.toISOString().slice(0, 10));
  }, [organization]);

  const handleDraftOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !selectedCandidateId || !selectedReqId) return;

    const targetCand = candidates.find((c) => c.id === selectedCandidateId);
    const targetApp = targetCand?.applications?.[0];

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: organization.id,
          candidateId: selectedCandidateId,
          requisitionId: selectedReqId,
          applicationId: targetApp?.id || 'app-default',
          title: offerTitle,
          baseSalary: parseFloat(baseSalary),
          targetBonusPercentage: parseFloat(targetBonus),
          signingBonus: parseFloat(signingBonus),
          equityShares: parseInt(equityShares),
          equityVestingSchedule: vestingSchedule,
          startDate: new Date(startDate),
          actorUser: currentUser,
        }),
      });

      if (res.ok) {
        showToast('Offer Package Created', 'Offer package submitted for approval and ready to extend.', 'success');
        setIsDraftModalOpen(false);
        fetchOffers();
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExtendOffer = async (offerId: string) => {
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EXTEND',
          actorUser: currentUser,
        }),
      });

      if (res.ok) {
        showToast('Offer Extended', 'Candidate notified with portal link to review and e-sign.', 'success');
        fetchOffers();
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);

  const handleGeneratePdfLetter = async (offerId: string) => {
    setIsGeneratingPdf(offerId);
    try {
      const res = await fetch(`/api/offers/${offerId}/generate-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorId: currentUser?.id || 'admin' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          'Official Offer PDF Generated & Stored in S3',
          `Version ${data.document.version} • SHA-256: ${data.document.sha256Hash?.slice(0, 16)}...`,
          'success'
        );
        fetchOffers();
      } else {
        showToast('Generation Failed', data.error || 'Could not generate offer PDF', 'error');
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsGeneratingPdf(null);
    }
  };

  const handleDownloadPresignedDocument = async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}/download`);
      const data = await res.json();
      if (res.ok && data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      } else {
        showToast('Download Error', data.error || 'Failed to generate signed download URL', 'error');
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Offers & Compensation</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {offers.length} Total Offers
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Build competitive compensation packages, manage executive approval chains, and capture digital e-signatures.
          </p>
        </div>

        <button
          onClick={() => setIsDraftModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-200 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Draft Offer Package</span>
        </button>
      </div>

      {/* Offers Grid */}
      <div className="space-y-4">
        {offers.map((off) => {
          const statusMeta = OFFER_STATUSES.find((s) => s.id === off.status);
          const sigData = off.signatureData ? (typeof off.signatureData === 'string' ? JSON.parse(off.signatureData) : off.signatureData) : null;

          return (
            <div
              key={off.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-enterprise space-y-4 hover:border-indigo-300 transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
                      {off.offerNumber}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${statusMeta?.color || 'bg-slate-100'}`}>
                      {statusMeta?.label || off.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{off.title}</h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="font-semibold text-slate-900">
                      Candidate: {off.candidate?.firstName} {off.candidate?.lastName}
                    </span>
                    <span>•</span>
                    <span>Requisition: {off.requisition?.reqNumber} ({off.requisition?.department?.name})</span>
                    <span>•</span>
                    <span>Target Start: {new Date(off.startDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 lg:self-center">
                  <button
                    onClick={() => setViewingOffer(off)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>View Letter Text</span>
                  </button>

                  <button
                    onClick={() => handleGeneratePdfLetter(off.id)}
                    disabled={isGeneratingPdf === off.id}
                    className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{isGeneratingPdf === off.id ? 'Generating S3 PDF...' : 'Generate S3 PDF'}</span>
                  </button>

                  {off.documents && off.documents.length > 0 && (
                    <button
                      onClick={() => handleDownloadPresignedDocument(off.documents[off.documents.length - 1].id)}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
                    >
                      <FileCheck2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Download S3 PDF (v{off.documents[off.documents.length - 1].version})</span>
                    </button>
                  )}

                  {off.status === 'APPROVED' && (
                    <button
                      onClick={() => handleExtendOffer(off.id)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Extend to Candidate</span>
                    </button>
                  )}

                  {off.status === 'EXTENDED' && (
                    <Link
                      href={`/portal/candidate/${off.applicationId}`}
                      target="_blank"
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
                    >
                      <span>Candidate Portal & E-Sign</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>

              </div>

              {/* S3 Document Integrity Badge if Document Generated */}
              {off.documents && off.documents.length > 0 && (
                <div className="p-3 bg-violet-50/70 border border-violet-200 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-violet-600" />
                    <span className="font-bold text-violet-950">AWS S3 Official Offer Document:</span>
                    <span className="text-violet-800 font-mono text-[11px]">{off.documents[off.documents.length - 1].s3Key}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-200 text-violet-900">
                      Version {off.documents[off.documents.length - 1].version}
                    </span>
                    <span className="text-[10px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border">
                      SHA-256: {off.documents[off.documents.length - 1].sha256Hash?.slice(0, 16)}...
                    </span>
                  </div>
                </div>
              )}

              {/* Compensation Breakdown Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400">Base Annual Salary</span>
                  <p className="text-base font-bold text-slate-900">${off.baseSalary?.toLocaleString()} USD</p>
                </div>
                <div>
                  <span className="text-slate-400">Target Bonus</span>
                  <p className="text-base font-bold text-slate-900">{off.targetBonusPercentage}% (${((off.baseSalary * off.targetBonusPercentage) / 100).toLocaleString()})</p>
                </div>
                <div>
                  <span className="text-slate-400">Sign-on Bonus</span>
                  <p className="text-base font-bold text-slate-900">${off.signingBonus?.toLocaleString()} USD</p>
                </div>
                <div>
                  <span className="text-slate-400">Equity Grant</span>
                  <p className="text-base font-bold text-slate-900">{off.equityShares?.toLocaleString()} ISOs</p>
                </div>
              </div>

              {/* E-Signature Certificate Banner if Signed */}
              {sigData && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold">Digital E-Signature Verified: </span>
                      <span>Signed by {sigData.signatureValue} on {new Date(off.signedAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded border border-emerald-300">
                    Hash: {sigData.verificationHash?.slice(0, 16)}...
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Draft Offer Modal */}
      {isDraftModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900">Draft Compensation Offer</h2>
              <button onClick={() => setIsDraftModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDraftOffer} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Candidate *</label>
                  <select
                    value={selectedCandidateId}
                    onChange={(e) => setSelectedCandidateId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  >
                    {candidates.map((c) => (
                      <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Requisition *</label>
                  <select
                    value={selectedReqId}
                    onChange={(e) => setSelectedReqId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  >
                    {requisitions.map((r) => (
                      <option key={r.id} value={r.id}>{r.reqNumber}: {r.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Official Position Title *</label>
                <input
                  type="text"
                  required
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Base Salary (USD) *</label>
                  <input
                    type="number"
                    required
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Bonus %</label>
                  <input
                    type="number"
                    value={targetBonus}
                    onChange={(e) => setTargetBonus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Sign-on Bonus</label>
                  <input
                    type="number"
                    value={signingBonus}
                    onChange={(e) => setSigningBonus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Equity Stock Options (Units)</label>
                  <input
                    type="number"
                    value={equityShares}
                    onChange={(e) => setEquityShares(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Target Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsDraftModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save & Submit Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offer Letter Preview Modal */}
      {viewingOffer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900">Offer Letter Preview ({viewingOffer.offerNumber})</h2>
              <button onClick={() => setViewingOffer(null)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border font-serif text-slate-800 text-xs leading-relaxed whitespace-pre-wrap">
              {viewingOffer.offerLetterContent}
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={() => setViewingOffer(null)}
                className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-xl text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function OffersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Offers...</div>}>
      <OffersContent />
    </Suspense>
  );
}
