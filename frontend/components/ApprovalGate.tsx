'use client';

import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, MessageSquare, Star, Send, Loader2 } from 'lucide-react';
import { getAuthHeader } from '../lib/api';
import { getBackendUrl } from '../lib/config';

export interface ApprovalGateProps {
  advisoryId: string;
  headline?: string;
  approvalState?: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'DISPATCHED';
  approvedBy?: string | null;
  onApprove?: () => void;
  onReject?: (reason: string) => void;
  className?: string;
}

export const ApprovalGate: React.FC<ApprovalGateProps> = ({
  advisoryId,
  headline = 'Anticipatory Cyclone Advisory',
  approvalState = 'PENDING_APPROVAL',
  approvedBy,
  onApprove,
  onReject,
  className = '',
}) => {
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [clarityScore, setClarityScore] = useState<number>(5);
  const [didModify, setDidModify] = useState<boolean>(false);
  const [modificationDiff, setModificationDiff] = useState<string>('');
  const [trustScore, setTrustScore] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  const handleApproveClick = async () => {
    if (onApprove) {
      onApprove();
    }
    // Show feedback capture modal after approval
    setShowFeedbackModal(true);
  };

  const submitFeedback = async () => {
    setIsSubmitting(true);
    const backendUrl = getBackendUrl();
    try {
      const authHeader = await getAuthHeader();
      await fetch(`${backendUrl}/api/advisories/${advisoryId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({
          clarity_score: clarityScore,
          modified: didModify,
          modification_diff: didModify ? modificationDiff : null,
          trust_score: trustScore,
        }),
      });
      setFeedbackSubmitted(true);
      setTimeout(() => setShowFeedbackModal(false), 1200);
    } catch {
      setFeedbackSubmitted(true);
      setTimeout(() => setShowFeedbackModal(false), 1200);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`rounded-lg border font-mono text-xs ${className}`}>
      {/* Pending Approval Banner */}
      {approvalState === 'PENDING_APPROVAL' && (
        <div className="bg-amber-950/40 border border-amber-600/60 p-3 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>OFFICER APPROVAL GATE</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-200 border border-amber-700">
              PENDING REVIEW
            </span>
          </div>

          <div className="text-[11px] font-sans text-amber-100/90 leading-relaxed">
            AI-generated advisory requires operational sign-off by a designated disaster manager before multi-channel radio/SMS dispatch.
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleApproveClick}
              className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve & Dispatch
            </button>
            <button
              onClick={() => onReject && onReject('Operator requested revisions')}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Approved / Dispatched State */}
      {(approvalState === 'APPROVED' || approvalState === 'DISPATCHED') && (
        <div className="bg-emerald-950/40 border border-emerald-500/50 p-3 rounded-lg flex items-center justify-between text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-emerald-300">AUTHORIZED & DISPATCHED</div>
              <div className="text-[10px] text-emerald-400/80">
                {approvedBy ? `Signed off by ${approvedBy}` : 'Signed off by Duty Dispatcher'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="text-[10px] underline text-emerald-400 hover:text-emerald-300 cursor-pointer"
          >
            Operator Feedback
          </button>
        </div>
      )}

      {/* Post-Approval 3-Question Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl font-sans text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 font-mono">
              <div className="flex items-center gap-2 text-cyan-400">
                <MessageSquare className="w-4 h-4" />
                <span className="font-bold text-xs uppercase tracking-wider">Operator Validation Survey</span>
              </div>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            {feedbackSubmitted ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
                <div className="font-bold text-sm text-emerald-300">Feedback Recorded</div>
                <div className="text-xs text-slate-400">Thank you for validating this anticipatory action advisory.</div>
              </div>
            ) : (
              <div className="space-y-3.5 text-xs">
                {/* Question 1: Clarity */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">
                    1. Was the advisory clear and actionable? (1–5)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setClarityScore(score)}
                        className={`flex-1 py-1.5 rounded font-mono font-bold transition-all ${
                          clarityScore === score
                            ? 'bg-cyan-600 text-white ring-1 ring-cyan-300'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question 2: Modification */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">
                    2. Did you modify the text before approving?
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDidModify(false)}
                      className={`flex-1 py-1.5 rounded font-mono font-semibold transition-all ${
                        !didModify
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      No (Approved As-Is)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDidModify(true)}
                      className={`flex-1 py-1.5 rounded font-mono font-semibold transition-all ${
                        didModify
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      Yes (Modified)
                    </button>
                  </div>

                  {didModify && (
                    <textarea
                      value={modificationDiff}
                      onChange={(e) => setModificationDiff(e.target.value)}
                      placeholder="Briefly describe what was changed (e.g. refined shelter capacity, adjusted evacuation timing)..."
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 min-h-[60px]"
                    />
                  )}
                </div>

                {/* Question 3: Real Storm Trust */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">
                    3. Would you trust this advisory in a real storm? (1–5)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setTrustScore(score)}
                        className={`flex-1 py-1.5 rounded font-mono font-bold transition-all ${
                          trustScore === score
                            ? 'bg-emerald-600 text-white ring-1 ring-emerald-300'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(false)}
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 font-medium"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={submitFeedback}
                    disabled={isSubmitting}
                    className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Submit Feedback
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalGate;
