'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  GitBranch,
  CheckCircle2,
  ListTodo,
  Bell,
  Mail,
  Clock,
  Webhook,
  Boxes,
  Flag,
  Plus,
  Trash2,
  Play,
  Save,
  ArrowDown,
  Settings2,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Drawer';

export type NodeType =
  | 'TRIGGER'
  | 'CONDITION'
  | 'APPROVAL'
  | 'TASK'
  | 'NOTIFICATION'
  | 'EMAIL'
  | 'WAIT'
  | 'WEBHOOK'
  | 'INTEGRATION'
  | 'END';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  title: string;
  description: string;
  config: Record<string, any>;
}

export function VisualWorkflowBuilder({
  initialNodes,
  workflowTitle = 'Enterprise Candidate-to-Employee Automation',
  onSave,
}: {
  initialNodes?: WorkflowNode[];
  workflowTitle?: string;
  onSave?: (nodes: WorkflowNode[]) => void;
}) {
  const defaultWorkflow: WorkflowNode[] = [
    {
      id: 'node-1',
      type: 'TRIGGER',
      title: 'Offer Accepted & E-Signed',
      description: 'Fires immediately when candidate signs offer letter',
      config: { event: 'OFFER_ACCEPTED' },
    },
    {
      id: 'node-2',
      type: 'TASK',
      title: 'Create Preboarding & Employee Record',
      description: 'Generates EMP-ID and initiates compliance checklist',
      config: { autoAssign: true },
    },
    {
      id: 'node-3',
      type: 'NOTIFICATION',
      title: 'Notify HR Ops & Hiring Manager',
      description: 'Sends real-time in-app and Slack notification',
      config: { channel: '#talent-hires' },
    },
    {
      id: 'node-4',
      type: 'INTEGRATION',
      title: 'Provision IT Hardware & Okta Account',
      description: 'Triggers MacBook Pro shipping and IAM role creation',
      config: { integration: 'Okta_SCIM' },
    },
    {
      id: 'node-5',
      type: 'WAIT',
      title: 'Wait for Mandatory I-9 & NDA Signatures',
      description: 'Pauses workflow until candidate completes compliance',
      config: { timeoutDays: 5 },
    },
    {
      id: 'node-6',
      type: 'WEBHOOK',
      title: 'Sync New Hire to Workday HRIS',
      description: 'Dispatches payload to Workday Employee Core API',
      config: { endpoint: 'https://api.workday.com/ccx/hire' },
    },
    {
      id: 'node-7',
      type: 'END',
      title: 'Activate Employee Status',
      description: 'Promotes employee from PREBOARDING to ACTIVE status',
      config: { status: 'ACTIVE' },
    },
  ];

  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes || defaultWorkflow);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeSimulationIndex, setActiveSimulationIndex] = useState(-1);

  const nodeTypeMeta: Record<NodeType, { label: string; icon: any; color: string; border: string }> = {
    TRIGGER: { label: 'Trigger', icon: Zap, color: 'bg-amber-50 text-amber-700', border: 'border-amber-300' },
    CONDITION: { label: 'Condition', icon: GitBranch, color: 'bg-blue-50 text-blue-700', border: 'border-blue-300' },
    APPROVAL: { label: 'Approval', icon: CheckCircle2, color: 'bg-purple-50 text-purple-700', border: 'border-purple-300' },
    TASK: { label: 'Task', icon: ListTodo, color: 'bg-indigo-50 text-indigo-700', border: 'border-indigo-300' },
    NOTIFICATION: { label: 'Notification', icon: Bell, color: 'bg-cyan-50 text-cyan-700', border: 'border-cyan-300' },
    EMAIL: { label: 'Email', icon: Mail, color: 'bg-pink-50 text-pink-700', border: 'border-pink-300' },
    WAIT: { label: 'Wait', icon: Clock, color: 'bg-slate-100 text-slate-700', border: 'border-slate-300' },
    WEBHOOK: { label: 'Webhook', icon: Webhook, color: 'bg-orange-50 text-orange-700', border: 'border-orange-300' },
    INTEGRATION: { label: 'Integration', icon: Boxes, color: 'bg-teal-50 text-teal-700', border: 'border-teal-300' },
    END: { label: 'End Flow', icon: Flag, color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-300' },
  };

  const handleAddNode = (type: NodeType, afterIndex: number) => {
    const meta = nodeTypeMeta[type];
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      title: `New ${meta.label} Step`,
      description: `Configurable automated ${meta.label.toLowerCase()} action`,
      config: {},
    };

    const updated = [...nodes];
    updated.splice(afterIndex + 1, 0, newNode);
    setNodes(updated);
    setSelectedNode(newNode);
  };

  const handleDeleteNode = (id: string) => {
    setNodes(nodes.filter((n) => n.id !== id));
    if (selectedNode?.id === id) setSelectedNode(null);
  };

  const handleSimulate = () => {
    setIsSimulating(true);
    setActiveSimulationIndex(0);
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current >= nodes.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsSimulating(false);
          setActiveSimulationIndex(-1);
        }, 1200);
      } else {
        setActiveSimulationIndex(current);
      }
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* Workflow Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-enterprise">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">{workflowTitle}</h2>
            <Badge variant="brand">{nodes.length} Nodes</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Visual workflow automation engine. Connect triggers, compliance tasks, and webhooks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Play className="h-3.5 w-3.5 text-emerald-600" />}
            onClick={handleSimulate}
            isLoading={isSimulating}
          >
            {isSimulating ? 'Simulating Execution...' : 'Simulate Workflow'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Save className="h-3.5 w-3.5" />}
            onClick={() => onSave && onSave(nodes)}
          >
            Save Workflow
          </Button>
        </div>
      </div>

      {/* Visual Canvas Node Chain */}
      <div className="flex flex-col items-center space-y-3 py-6 px-4 bg-slate-100/70 rounded-2xl border border-slate-200/80 min-h-[500px]">
        {nodes.map((node, index) => {
          const meta = nodeTypeMeta[node.type];
          const Icon = meta.icon;
          const isSelected = selectedNode?.id === node.id;
          const isSimulatingThis = isSimulating && activeSimulationIndex === index;

          return (
            <React.Fragment key={node.id}>
              {/* Node Card */}
              <div
                onClick={() => setSelectedNode(node)}
                className={`w-full max-w-lg p-4 rounded-2xl border bg-white shadow-enterprise cursor-pointer transition-all duration-300 transform hover:scale-[1.01] relative group ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-glow'
                    : isSimulatingThis
                    ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/40 shadow-glow-emerald scale-105'
                    : `${meta.border} hover:border-indigo-400`
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${meta.color} shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${meta.color}`}>
                          {meta.label}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Step {index + 1}</span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900">{node.title}</h4>
                      <p className="text-xs text-slate-500">{node.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNode(node);
                      }}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                    >
                      <Settings2 className="h-4 w-4" />
                    </button>
                    {nodes.length > 2 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNode(node.id);
                        }}
                        className="p-1 rounded-lg hover:bg-rose-50 text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Connecting Down Arrow + Quick Add Step Menu */}
              {index < nodes.length - 1 && (
                <div className="flex flex-col items-center group/btn relative">
                  <div className="w-0.5 h-6 bg-slate-300" />
                  <div className="p-1 rounded-full bg-white border border-slate-300 text-slate-400">
                    <ArrowDown className="h-3 w-3" />
                  </div>
                  <div className="w-0.5 h-6 bg-slate-300" />

                  {/* Insert Node Dropdown Button */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/btn:opacity-100 transition z-10">
                    <div className="relative group/menu">
                      <button className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md hover:bg-indigo-700">
                        <Plus className="h-3.5 w-3.5" />
                      </button>

                      {/* Dropdown list of node types */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-52 p-2 bg-white rounded-xl shadow-2xl border border-slate-200 hidden group-menu:block group-hover/menu:block z-50 text-xs space-y-1">
                        <p className="px-2 py-1 font-bold text-[10px] uppercase text-slate-400">Insert Step</p>
                        {(
                          [
                            'TASK',
                            'APPROVAL',
                            'NOTIFICATION',
                            'EMAIL',
                            'CONDITION',
                            'WAIT',
                            'WEBHOOK',
                            'INTEGRATION',
                          ] as NodeType[]
                        ).map((t) => (
                          <button
                            key={t}
                            onClick={() => handleAddNode(t, index)}
                            className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 text-slate-700 font-medium"
                          >
                            <span>{nodeTypeMeta[t].label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Node Config Drawer */}
      {selectedNode && (
        <Drawer
          isOpen={!!selectedNode}
          onClose={() => setSelectedNode(null)}
          title={`Configure ${selectedNode.type} Node`}
          description="Edit properties, parameters, and trigger constraints."
        >
          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Node Title</label>
              <input
                type="text"
                value={selectedNode.title}
                onChange={(e) => {
                  const updated = nodes.map((n) =>
                    n.id === selectedNode.id ? { ...n, title: e.target.value } : n
                  );
                  setNodes(updated);
                  setSelectedNode({ ...selectedNode, title: e.target.value });
                }}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Description</label>
              <textarea
                rows={2}
                value={selectedNode.description}
                onChange={(e) => {
                  const updated = nodes.map((n) =>
                    n.id === selectedNode.id ? { ...n, description: e.target.value } : n
                  );
                  setNodes(updated);
                  setSelectedNode({ ...selectedNode, description: e.target.value });
                }}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-slate-900"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border space-y-2">
              <span className="font-bold text-slate-800">Node Payload Config (JSON)</span>
              <pre className="text-[11px] font-mono text-slate-600 bg-white p-2.5 rounded-lg border">
                {JSON.stringify(selectedNode.config, null, 2)}
              </pre>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <Button size="sm" onClick={() => setSelectedNode(null)}>
                Apply Node Settings
              </Button>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
