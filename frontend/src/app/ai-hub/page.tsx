'use client';

import React, { useState } from 'react';
import { useTenant } from '@/context/TenantContext';
import {
  Bot,
  Sparkles,
  FileText,
  CheckCircle2,
  HelpCircle,
  BarChart,
  Copy,
  Check,
  Send,
  Wand2,
} from 'lucide-react';

export default function AiHubPage() {
  const { showToast } = useTenant();
  const [activeTool, setActiveTool] = useState<'JD_GENERATOR' | 'BIAS_SCANNER' | 'INTERVIEW_QUESTIONS' | 'DEBRIEF_SYNTHESIS'>('JD_GENERATOR');

  // Tool 1: JD Generator State
  const [jdRole, setJdRole] = useState('Staff AI Infrastructure Engineer');
  const [jdDept, setJdDept] = useState('Engineering & AI Systems');
  const [jdLevel, setJdLevel] = useState('Staff (IC4 / L6)');
  const [isGeneratingJd, setIsGeneratingJd] = useState(false);
  const [generatedJd, setGeneratedJd] = useState<any>(null);

  // Tool 2: Bias Scanner State
  const [biasInputText, setBiasInputText] = useState('We need a rockstar ninja developer who can work under aggressive deadlines to crush code.');
  const [isScanningBias, setIsScanningBias] = useState(false);
  const [biasResult, setBiasResult] = useState<any>(null);

  // Tool 3: Interview Questions State
  const [iqTitle, setIqTitle] = useState('Principal Distributed Systems Architect');
  const [isGeneratingIq, setIsGeneratingIq] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);

  // Tool 4: Debrief Synthesis
  const [candidateName, setCandidateName] = useState('Venkata Karthik Guntupalli');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisResult, setSynthesisResult] = useState<any>(null);

  const [copied, setCopied] = useState(false);

  const handleGenerateJd = async () => {
    setIsGeneratingJd(true);
    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'GENERATE_JD',
          payload: { title: jdRole, department: jdDept, level: jdLevel },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedJd(data.result);
        showToast('Job Description Generated', 'Engineered inclusive, high-converting JD.', 'success');
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsGeneratingJd(false);
    }
  };

  const handleScanBias = async () => {
    setIsScanningBias(true);
    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'INCLUSIVE_LANGUAGE_CHECK',
          payload: { text: biasInputText },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBiasResult(data);
        showToast('Analysis Complete', 'Inclusivity and readability score calculated.', 'success');
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsScanningBias(false);
    }
  };

  const handleGenerateQuestions = async () => {
    setIsGeneratingIq(true);
    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'INTERVIEW_QUESTIONS',
          payload: { jobTitle: iqTitle },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedQuestions(data.questions || []);
        showToast('Questions Created', 'Structured competency questions and rubrics generated.', 'success');
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsGeneratingIq(false);
    }
  };

  const handleSynthesizeDebrief = async () => {
    setIsSynthesizing(true);
    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SCORECARD_SYNTHESIS',
          payload: { candidateName },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSynthesisResult(data.synthesis);
        showToast('Debrief Synthesized', 'Executive hiring consensus report generated.', 'success');
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 md:p-8 rounded-2xl text-white shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            AI Talent Suite
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          AI Recruiting & Hiring Intelligence
        </h1>
        <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
          Supercharge your hiring workflows with generative job descriptions, bias detection, structured interview rubrics, and automated candidate debriefs.
        </p>
      </div>

      {/* Tool Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
        {[
          { id: 'JD_GENERATOR', label: 'JD & Competency Generator', icon: Wand2 },
          { id: 'BIAS_SCANNER', label: 'Inclusivity & Bias Scanner', icon: CheckCircle2 },
          { id: 'INTERVIEW_QUESTIONS', label: 'Competency Interview Rubrics', icon: HelpCircle },
          { id: 'DEBRIEF_SYNTHESIS', label: 'Panel Debrief Synthesizer', icon: BarChart },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTool === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTool(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition -mb-px ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tool 1: JD Generator */}
      {activeTool === 'JD_GENERATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-enterprise space-y-4">
            <h2 className="text-base font-bold text-slate-900">Job Description Generator</h2>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Position Title</label>
                <input
                  type="text"
                  value={jdRole}
                  onChange={(e) => setJdRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Department</label>
                <input
                  type="text"
                  value={jdDept}
                  onChange={(e) => setJdDept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Seniority Level</label>
                <input
                  type="text"
                  value={jdLevel}
                  onChange={(e) => setJdLevel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900"
                />
              </div>

              <button
                onClick={handleGenerateJd}
                disabled={isGeneratingJd}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-200 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Wand2 className="h-4 w-4" />
                <span>{isGeneratingJd ? 'Generating JD...' : 'Generate Description & Rubric'}</span>
              </button>
            </div>
          </div>

          {/* Generated Result Output */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-enterprise space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Generated Job Description</h3>
              {generatedJd && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(generatedJd, null, 2));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="p-1.5 rounded-lg border text-slate-600 hover:bg-slate-50 flex items-center gap-1 text-[11px]"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            {generatedJd ? (
              <div className="space-y-4 text-slate-700 max-h-[500px] overflow-y-auto pr-2">
                <div>
                  <h4 className="font-bold text-slate-900">{generatedJd.title}</h4>
                  <p className="mt-1 leading-relaxed">{generatedJd.overview}</p>
                </div>

                <div className="space-y-1">
                  <p className="font-bold text-slate-900">Key Responsibilities:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {generatedJd.responsibilities.map((r: string, i: number) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1">
                  <p className="font-bold text-slate-900">Required Qualifications:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {generatedJd.requirements.map((req: string, i: number) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400">
                Click "Generate Description" to construct a tailored enterprise JD.
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tool 2: Bias Scanner */}
      {activeTool === 'BIAS_SCANNER' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-enterprise space-y-4">
            <h2 className="text-base font-bold text-slate-900">Job Description Bias Scanner</h2>
            <p className="text-slate-500">Scan text for exclusionary terminology, gender-coded words, and aggressive idioms.</p>

            <textarea
              rows={6}
              value={biasInputText}
              onChange={(e) => setBiasInputText(e.target.value)}
              className="w-full p-3 bg-slate-50 border rounded-xl text-slate-900"
            />

            <button
              onClick={handleScanBias}
              disabled={isScanningBias}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-200 transition"
            >
              {isScanningBias ? 'Scanning...' : 'Scan for Inclusivity'}
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-enterprise space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Inclusivity Score & Recommendations</h3>
            {biasResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-900">Overall Inclusivity Rating</span>
                    <p className="text-[11px] text-emerald-700">{biasResult.readabilityGrade}</p>
                  </div>
                  <span className="text-2xl font-bold text-emerald-700">{biasResult.score}/100</span>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-slate-900">Suggested Terminology Replacements:</p>
                  {biasResult.suggestions.map((sug: any, i: number) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl border space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="line-through text-rose-600 font-semibold">{sug.original}</span>
                        <span>→</span>
                        <span className="text-emerald-700 font-bold">{sug.suggestion}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{sug.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400">
                Run scanner to calculate inclusivity score.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tool 3: Interview Questions */}
      {activeTool === 'INTERVIEW_QUESTIONS' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-enterprise space-y-6 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">Competency Interview Question & Rubric Generator</h2>
              <p className="text-slate-500">Generate calibrated behavioral and system architecture questions with 1-5 scoring rubrics.</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={iqTitle}
                onChange={(e) => setIqTitle(e.target.value)}
                className="px-3 py-2 bg-slate-50 border rounded-xl text-slate-900 w-64"
              />
              <button
                onClick={handleGenerateQuestions}
                disabled={isGeneratingIq}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition"
              >
                {isGeneratingIq ? 'Generating...' : 'Generate Rubrics'}
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {generatedQuestions.map((q, i) => (
              <div key={i} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-[10px] uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {q.competency}
                </span>
                <p className="font-bold text-sm text-slate-900">"{q.question}"</p>

                <div className="pt-2 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-white rounded-xl border">
                    <span className="font-bold text-emerald-700 block mb-1">5 (Exceptional / Strong Hire)</span>
                    <p className="text-slate-600 text-[11px]">{q.rubric['5 (Exceptional)']}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border">
                    <span className="font-bold text-blue-700 block mb-1">3 (Competent / Meets Bar)</span>
                    <p className="text-slate-600 text-[11px]">{q.rubric['3 (Competent)']}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border">
                    <span className="font-bold text-rose-700 block mb-1">1 (Deficient / No Hire)</span>
                    <p className="text-slate-600 text-[11px]">{q.rubric['1 (Deficient)']}</p>
                  </div>
                </div>
              </div>
            ))}

            {generatedQuestions.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                Click "Generate Rubrics" to build standardized evaluation questions for interview panels.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tool 4: Debrief Synthesis */}
      {activeTool === 'DEBRIEF_SYNTHESIS' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-enterprise space-y-6 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Executive Panel Debrief Synthesizer</h2>
              <p className="text-slate-500">Synthesize all interviewer scorecards into a cohesive final hiring recommendation.</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="px-3 py-2 bg-slate-50 border rounded-xl text-slate-900 w-52"
              />
              <button
                onClick={handleSynthesizeDebrief}
                disabled={isSynthesizing}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition"
              >
                {isSynthesizing ? 'Synthesizing...' : 'Run Panel Synthesis'}
              </button>
            </div>
          </div>

          {synthesisResult && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500">Candidate Evaluation Synthesis</span>
                  <h3 className="text-lg font-bold text-slate-900">{synthesisResult.candidateName}</h3>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  {synthesisResult.overallConsensus.replace(/_/g, ' ')}
                </span>
              </div>

              <p className="text-slate-700 text-sm leading-relaxed">{synthesisResult.consensusSummary}</p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-white rounded-xl border">
                  <span className="text-slate-400 block text-[10px]">Recommended Leveling</span>
                  <span className="font-bold text-slate-900 text-sm">{synthesisResult.recommendedLevel}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border">
                  <span className="text-slate-400 block text-[10px]">Benchmark Compensation Target</span>
                  <span className="font-bold text-emerald-700 text-sm">{synthesisResult.suggestedOfferRange}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
