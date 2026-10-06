'use client';

import React, { useState } from 'react';
import {
  Type,
  AlignLeft,
  Hash,
  DollarSign,
  Calendar,
  Clock,
  List,
  CheckSquare,
  Radio,
  FileUp,
  FileSignature,
  MapPin,
  Phone,
  Mail,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Save,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

export type FormFieldType =
  | 'TEXT'
  | 'LONG_TEXT'
  | 'NUMBER'
  | 'CURRENCY'
  | 'DATE'
  | 'DATETIME'
  | 'DROPDOWN'
  | 'MULTI_SELECT'
  | 'RADIO'
  | 'CHECKBOX'
  | 'FILE'
  | 'SIGNATURE'
  | 'ADDRESS'
  | 'PHONE'
  | 'EMAIL';

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: string[];
  defaultValue?: string;
}

export function VisualFormBuilder({
  formName = 'Custom Application & Screening Form',
  onSave,
}: {
  formName?: string;
  onSave?: (fields: FormField[]) => void;
}) {
  const [fields, setFields] = useState<FormField[]>([
    {
      id: 'field-1',
      type: 'TEXT',
      label: 'Full Legal Name',
      placeholder: 'First and Last Name',
      required: true,
      helpText: 'As it appears on government identification',
    },
    {
      id: 'field-2',
      type: 'EMAIL',
      label: 'Primary Work Email',
      placeholder: 'name@domain.com',
      required: true,
    },
    {
      id: 'field-3',
      type: 'PHONE',
      label: 'Direct Phone Number',
      placeholder: '+1 (555) 000-0000',
      required: true,
    },
    {
      id: 'field-4',
      type: 'DROPDOWN',
      label: 'Years of Production Distributed Systems Experience',
      required: true,
      options: ['1-3 years', '4-7 years', '8-10 years', '10+ years'],
    },
    {
      id: 'field-5',
      type: 'CURRENCY',
      label: 'Target Base Annual Compensation Expectation (USD)',
      placeholder: '220,000',
      required: false,
    },
    {
      id: 'field-6',
      type: 'SIGNATURE',
      label: 'Applicant Digital Attestation & Signature',
      required: true,
      helpText: 'Type your full name to verify accuracy of submitted materials',
    },
  ]);

  const [previewMode, setPreviewMode] = useState(false);
  const [selectedFieldType, setSelectedFieldType] = useState<FormFieldType>('TEXT');

  const fieldTypeMeta: Record<FormFieldType, { label: string; icon: any }> = {
    TEXT: { label: 'Short Text', icon: Type },
    LONG_TEXT: { label: 'Long Text / Paragraph', icon: AlignLeft },
    NUMBER: { label: 'Numeric', icon: Hash },
    CURRENCY: { label: 'Currency ($)', icon: DollarSign },
    DATE: { label: 'Date', icon: Calendar },
    DATETIME: { label: 'Date & Time', icon: Clock },
    DROPDOWN: { label: 'Dropdown Select', icon: List },
    MULTI_SELECT: { label: 'Multi-Select', icon: CheckSquare },
    RADIO: { label: 'Radio Buttons', icon: Radio },
    CHECKBOX: { label: 'Single Checkbox', icon: CheckSquare },
    FILE: { label: 'File Upload', icon: FileUp },
    SIGNATURE: { label: 'Digital E-Signature', icon: FileSignature },
    ADDRESS: { label: 'Street Address', icon: MapPin },
    PHONE: { label: 'Phone Number', icon: Phone },
    EMAIL: { label: 'Email Address', icon: Mail },
  };

  const handleAddField = () => {
    const meta = fieldTypeMeta[selectedFieldType];
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: selectedFieldType,
      label: `New ${meta.label} Field`,
      placeholder: '',
      required: false,
      options: selectedFieldType === 'DROPDOWN' || selectedFieldType === 'RADIO' ? ['Option 1', 'Option 2'] : undefined,
    };
    setFields([...fields, newField]);
  };

  const handleDeleteField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;
    const updated = [...fields];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setFields(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-enterprise">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">{formName}</h2>
            <Badge variant="brand">{fields.length} Fields Configured</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configurable enterprise form designer with validations, dynamic types, and preview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={previewMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? 'Exit Preview' : 'Preview Form'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Save className="h-3.5 w-3.5" />}
            onClick={() => onSave && onSave(fields)}
          >
            Save Form Schema
          </Button>
        </div>
      </div>

      {/* Main Builder Grid */}
      {!previewMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Form Fields List & Configuration */}
          <div className="lg:col-span-2 space-y-4">
            {fields.map((field, idx) => {
              const Icon = fieldTypeMeta[field.type]?.icon || Type;

              return (
                <div
                  key={field.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-enterprise space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">
                          Field #{idx + 1} • {field.type}
                        </span>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => {
                            const updated = fields.map((f) =>
                              f.id === field.id ? { ...f, label: e.target.value } : f
                            );
                            setFields(updated);
                          }}
                          className="font-bold text-sm text-slate-900 block bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30"
                      >
                        <MoveUp className="h-3.5 w-3.5 text-slate-500" />
                      </button>
                      <button
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === fields.length - 1}
                        className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30"
                      >
                        <MoveDown className="h-3.5 w-3.5 text-slate-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteField(field.id)}
                        className="p-1 rounded-lg hover:bg-rose-50 text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                    <Input
                      label="Placeholder Text"
                      value={field.placeholder || ''}
                      onChange={(e) => {
                        const updated = fields.map((f) =>
                          f.id === field.id ? { ...f, placeholder: e.target.value } : f
                        );
                        setFields(updated);
                      }}
                    />
                    <Input
                      label="Help Text / Subtitle"
                      value={field.helpText || ''}
                      onChange={(e) => {
                        const updated = fields.map((f) =>
                          f.id === field.id ? { ...f, helpText: e.target.value } : f
                        );
                        setFields(updated);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => {
                          const updated = fields.map((f) =>
                            f.id === field.id ? { ...f, required: e.target.checked } : f
                          );
                          setFields(updated);
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Mandatory Required Field</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right 1 Col: Add New Field Toolbox */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-enterprise space-y-4 text-xs h-fit sticky top-24">
            <h3 className="font-bold text-sm text-slate-900">Add Field Component</h3>
            <p className="text-slate-500">Select an enterprise field primitive to insert into this form.</p>

            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(fieldTypeMeta) as FormFieldType[]).map((type) => {
                const meta = fieldTypeMeta[type];
                const Icon = meta.icon;
                const isSelected = selectedFieldType === type;

                return (
                  <button
                    key={type}
                    onClick={() => setSelectedFieldType(type)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 text-indigo-600" />
                    <span className="truncate text-[11px]">{meta.label}</span>
                  </button>
                );
              })}
            </div>

            <Button size="sm" className="w-full" leftIcon={<Plus className="h-4 w-4" />} onClick={handleAddField}>
              Insert {fieldTypeMeta[selectedFieldType].label} Field
            </Button>
          </div>

        </div>
      ) : (
        /* Preview Mode Render */
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-enterprise max-w-2xl mx-auto space-y-6">
          <div className="border-b pb-4">
            <Badge variant="brand" className="mb-2">Form Preview</Badge>
            <h2 className="text-xl font-bold text-slate-900">{formName}</h2>
          </div>

          <form className="space-y-4 text-xs" onSubmit={(e) => e.preventDefault()}>
            {fields.map((f) => (
              <div key={f.id} className="space-y-1 text-left">
                <label className="font-semibold text-slate-800 block">
                  {f.label} {f.required && <span className="text-rose-500">*</span>}
                </label>
                {f.type === 'LONG_TEXT' ? (
                  <textarea rows={3} placeholder={f.placeholder} className="w-full p-3 bg-slate-50 border rounded-xl" />
                ) : f.type === 'DROPDOWN' ? (
                  <select className="w-full px-3 py-2 bg-slate-50 border rounded-xl">
                    {f.options?.map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : f.type === 'SIGNATURE' ? (
                  <input type="text" placeholder="Type full name as e-signature" className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-serif italic" />
                ) : (
                  <input type={f.type === 'EMAIL' ? 'email' : f.type === 'NUMBER' || f.type === 'CURRENCY' ? 'number' : 'text'} placeholder={f.placeholder} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                )}
                {f.helpText && <p className="text-[11px] text-slate-400">{f.helpText}</p>}
              </div>
            ))}

            <div className="pt-4 border-t">
              <Button type="button" size="md" className="w-full">
                Submit Form
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
