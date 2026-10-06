'use client';

import React, { useState } from 'react';
import {
  User,
  Mail,
  FileText,
  Briefcase,
  GraduationCap,
  Sparkles,
  HelpCircle,
  FolderUp,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Save,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

export function CandidateApplicationWizard({
  jobTitle,
  requisitionId,
  orgId,
  onSubmitSuccess,
  onCancel,
}: {
  jobTitle: string;
  requisitionId: string;
  orgId: string;
  onSubmitSuccess: (applicationId: string) => void;
  onCancel: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal
    firstName: '',
    lastName: '',
    preferredName: '',
    // Step 2: Contact
    email: '',
    phone: '',
    location: '',
    linkedinUrl: '',
    githubUrl: '',
    // Step 3: Resume
    resumeText: '',
    resumeFileName: '',
    // Step 4: Work Experience
    currentCompany: '',
    currentTitle: '',
    experienceYears: '5',
    workSummary: '',
    // Step 5: Education
    highestDegree: 'B.S. in Computer Science',
    institution: 'University',
    gradYear: '2020',
    // Step 6: Skills
    skills: 'Distributed Systems, Go, TypeScript, PostgreSQL, Kubernetes',
    // Step 7: Screening Questions
    requiresSponsorship: 'No',
    noticePeriodWeeks: '2',
    compensationExpectation: '240,000',
    // Step 8: Additional Docs
    coverNote: '',
    portfolioUrl: '',
    // Step 9: Attestation
    agreeTerms: true,
  });

  const steps = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Contact', icon: Mail },
    { number: 3, title: 'Resume', icon: FileText },
    { number: 4, title: 'Experience', icon: Briefcase },
    { number: 5, title: 'Education', icon: GraduationCap },
    { number: 6, title: 'Skills', icon: Sparkles },
    { number: 7, title: 'Screening', icon: HelpCircle },
    { number: 8, title: 'Documents', icon: FolderUp },
    { number: 9, title: 'Review', icon: CheckCircle2 },
    { number: 10, title: 'Submit', icon: ArrowRight },
  ];

  const handleSaveDraft = () => {
    localStorage.setItem(`app_draft_${requisitionId}`, JSON.stringify(formData));
    setDraftSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  const handleNext = () => {
    if (currentStep < 10) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const skillsArray = formData.skills.split(',').map((s) => s.trim()).filter(Boolean);

      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          requisitionId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          headline: `${formData.currentTitle || 'Engineer'} ${formData.currentCompany ? 'at ' + formData.currentCompany : ''}`,
          skills: skillsArray,
          experienceYears: parseFloat(formData.experienceYears) || 4,
          currentCompany: formData.currentCompany,
          currentTitle: formData.currentTitle,
          educationLevel: formData.highestDegree,
          linkedinUrl: formData.linkedinUrl,
          githubUrl: formData.githubUrl,
          portfolioUrl: formData.portfolioUrl,
          source: 'CAREER_SITE',
          summary: formData.workSummary || formData.resumeText,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onSubmitSuccess(data.application?.id || 'app-new');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-enterprise overflow-hidden max-w-3xl mx-auto">
      {/* Wizard Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
            Step {currentStep} of {steps.length} • {steps[currentStep - 1].title}
          </span>
          <h2 className="text-lg font-bold text-slate-900">{jobTitle}</h2>
        </div>

        <div className="flex items-center gap-2">
          {draftSavedTime && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Draft saved at {draftSavedTime}
            </span>
          )}
          <Button variant="outline" size="xs" leftIcon={<Save className="h-3 w-3" />} onClick={handleSaveDraft}>
            Save Draft
          </Button>
        </div>
      </div>

      {/* Progress Bar Indicator */}
      <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
        <div
          className="bg-indigo-600 h-1.5 transition-all duration-300"
          style={{ width: `${(currentStep / steps.length) * 100}%` }}
        />
      </div>

      {/* Step Form Body */}
      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 text-xs text-left">
        
        {/* Step 1: Personal Info */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-slate-900">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name *"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
              <Input
                label="Last Name *"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <Input
              label="Preferred Name (Optional)"
              value={formData.preferredName}
              onChange={(e) => setFormData({ ...formData, preferredName: e.target.value })}
            />
          </div>
        )}

        {/* Step 2: Contact */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-slate-900">Contact & Social Profiles</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Email Address *"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label="Phone Number *"
                required
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <Input
              label="Location (City, State / Country) *"
              required
              placeholder="e.g. San Francisco, CA"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="LinkedIn Profile URL"
                placeholder="https://linkedin.com/in/username"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
              />
              <Input
                label="GitHub / Portfolio URL"
                placeholder="https://github.com/username"
                value={formData.githubUrl}
                onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Step 3: Resume */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-slate-900">Resume & Curriculum Vitae</h3>
            <div className="p-6 border-2 border-dashed border-indigo-200 rounded-2xl bg-indigo-50/40 text-center space-y-2">
              <FileText className="h-8 w-8 text-indigo-600 mx-auto" />
              <p className="font-bold text-slate-800">Paste Resume Text or Upload CV</p>
              <p className="text-[11px] text-slate-500">Instant AI parser will automatically extract your competencies</p>
            </div>
            <Textarea
              label="Paste Resume Text Highlights *"
              rows={6}
              required
              placeholder="Paste your past positions, technologies, and achievements..."
              value={formData.resumeText}
              onChange={(e) => setFormData({ ...formData, resumeText: e.target.value })}
            />
          </div>
        )}

        {/* Step 4: Experience */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-slate-900">Work Experience</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Current / Most Recent Company"
                placeholder="e.g. Stripe"
                value={formData.currentCompany}
                onChange={(e) => setFormData({ ...formData, currentCompany: e.target.value })}
              />
              <Input
                label="Current Title"
                placeholder="e.g. Senior Software Engineer"
                value={formData.currentTitle}
                onChange={(e) => setFormData({ ...formData, currentTitle: e.target.value })}
              />
            </div>
            <Input
              label="Total Years of Relevant Experience"
              type="number"
              value={formData.experienceYears}
              onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
            />
            <Textarea
              label="Notable Projects & Impact"
              rows={3}
              value={formData.workSummary}
              onChange={(e) => setFormData({ ...formData, workSummary: e.target.value })}
            />
          </div>
        )}

        {/* Step 5: Education */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-slate-900">Education & Degrees</h3>
            <Input
              label="Highest Degree Earned"
              value={formData.highestDegree}
              onChange={(e) => setFormData({ ...formData, highestDegree: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="University / Institution"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              />
              <Input
                label="Graduation Year"
                value={formData.gradYear}
                onChange={(e) => setFormData({ ...formData, gradYear: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Step 6: Skills */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-slate-900">Technical Skills & Competencies</h3>
            <Textarea
              label="Key Skills (Comma-Separated) *"
              rows={3}
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {formData.skills.split(',').map((s, i) => (
                <span key={i} className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-mono text-[10px] border border-indigo-200">
                  {s.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Step 7: Screening */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-slate-900">Screening Questions</h3>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Will you now or in the future require visa sponsorship?</label>
              <select
                value={formData.requiresSponsorship}
                onChange={(e) => setFormData({ ...formData, requiresSponsorship: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
              >
                <option value="No">No, I am authorized to work in the country</option>
                <option value="Yes">Yes, I will require sponsorship (H1-B, TN, etc.)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Notice Period (Weeks)"
                type="number"
                value={formData.noticePeriodWeeks}
                onChange={(e) => setFormData({ ...formData, noticePeriodWeeks: e.target.value })}
              />
              <Input
                label="Target Annual Base Salary (USD)"
                value={formData.compensationExpectation}
                onChange={(e) => setFormData({ ...formData, compensationExpectation: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Step 8: Additional Documents */}
        {currentStep === 8 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-slate-900">Additional Materials & Portfolio</h3>
            <Input
              label="Portfolio / Website URL"
              placeholder="https://mywork.dev"
              value={formData.portfolioUrl}
              onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
            />
            <Textarea
              label="Cover Note to Hiring Manager (Optional)"
              rows={3}
              placeholder="Why are you excited about this specific role?"
              value={formData.coverNote}
              onChange={(e) => setFormData({ ...formData, coverNote: e.target.value })}
            />
          </div>
        )}

        {/* Step 9: Review */}
        {currentStep === 9 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-slate-900">Review Application</h3>
            <div className="bg-slate-50 p-4 rounded-xl border space-y-2 text-xs">
              <p><strong>Candidate:</strong> {formData.firstName} {formData.lastName}</p>
              <p><strong>Email:</strong> {formData.email}</p>
              <p><strong>Phone:</strong> {formData.phone}</p>
              <p><strong>Experience:</strong> {formData.experienceYears} years ({formData.currentTitle})</p>
              <p><strong>Skills:</strong> {formData.skills}</p>
            </div>
            <label className="flex items-center gap-2 text-slate-700 cursor-pointer pt-2">
              <input
                type="checkbox"
                required
                checked={formData.agreeTerms}
                onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600"
              />
              <span>I confirm all submitted information is accurate and truthful.</span>
            </label>
          </div>
        )}

        {/* Step 10: Submit */}
        {currentStep === 10 && (
          <div className="text-center py-6 space-y-4">
            <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Ready to Submit!</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              Your application for <strong>{jobTitle}</strong> is ready. Click below to submit directly to our talent acquisition team.
            </p>
            <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full max-w-xs mx-auto">
              Submit Application
            </Button>
          </div>
        )}

        {/* Wizard Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={currentStep === 1 ? onCancel : handlePrev}
            leftIcon={currentStep > 1 ? <ArrowLeft className="h-3.5 w-3.5" /> : undefined}
          >
            {currentStep === 1 ? 'Cancel' : 'Previous Step'}
          </Button>

          {currentStep < 10 && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleNext}
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              Next Step
            </Button>
          )}
        </div>

      </form>
    </div>
  );
}
