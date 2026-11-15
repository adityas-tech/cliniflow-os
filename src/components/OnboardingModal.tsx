import React from "react";
import { ArrowRight, BookOpen, CheckCircle2, Play, Sparkles, X } from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { FEATURE_TUTORIALS, ROLE_QUICK_PATHS } from "../data/tutorialsData";
import { PageId, UserRole } from "../types/clinic";

interface OnboardingModalProps {
  open: boolean;
  mode: "welcome" | "page-help";
  onClose: () => void;
  onStartTour: (startPage?: PageId) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ open, mode, onClose, onStartTour }) => {
  const { state, activePage, setActivePage, setRole } = useClinic();

  if (!open) return null;

  const pageTutorial = FEATURE_TUTORIALS.find((t) => t.id === activePage) || FEATURE_TUTORIALS[0];
  const rolePath = ROLE_QUICK_PATHS[state.activeRole];

  if (mode === "page-help") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-xs p-4" onClick={onClose}>
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="px-5 py-4 bg-gradient-to-r from-teal-700 to-cyan-700 text-white flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-teal-100">
                Module {pageTutorial.number} Guide • {pageTutorial.estimatedMin}
              </div>
              <h3 className="text-base font-bold mt-0.5">{pageTutorial.title}</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/15"><X className="w-4 h-4" /></button>
          </div>

          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            <p className="text-xs text-slate-600">{pageTutorial.tagline}</p>

            <div className="space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Step-by-Step Workflow</div>
              {pageTutorial.steps.map((st, idx) => (
                <div key={st.title} className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="text-xs">
                    <div className="font-bold text-slate-900">{st.title}</div>
                    <div className="text-slate-600 mt-0.5">{st.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
              <div className="font-bold text-amber-900 mb-0.5">Try It Live Right Now</div>
              <div className="text-amber-800">{pageTutorial.tryItLive}</div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  onClose();
                  setActivePage("tutorials");
                }}
                className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5" /> View All 12 Feature Tutorials
              </button>
              <button
                onClick={() => {
                  onClose();
                  onStartTour(activePage);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold"
              >
                <Play className="w-3.5 h-3.5" /> Start Guided Tour Here
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 text-white p-6 flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Welcome to CliniFlow AI OS
            </div>
            <h2 className="text-xl font-bold">End-to-End Clinic Management & AI Onboarding</h2>
            <p className="text-xs text-teal-100 mt-1">
              One connected flow from Voice AI & WhatsApp booking → Queue → EMR 360 → Pharmacy POS → Billing & Reviews.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/15"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Choose Role Perspective */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">1. Pick Your Role to Personalize Onboarding</div>
            <div className="flex flex-wrap gap-1.5">
              {([
                { id: "owner", label: "Clinic Owner / Admin" },
                { id: "doctor", label: "Doctor / Specialist" },
                { id: "reception", label: "Front Desk" },
                { id: "pharmacist", label: "Pharmacist / POS" },
                { id: "patient", label: "Patient Portal" },
              ] as Array<{ id: UserRole; label: string }>).map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    state.activeRole === r.id
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Role Checklist */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div>
              <div className="text-sm font-bold text-slate-900">{rolePath.title}</div>
              <div className="text-xs text-slate-500">{rolePath.subtitle}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {rolePath.steps.map((s, idx) => (
                <button
                  key={s.label}
                  onClick={() => {
                    setActivePage(s.page);
                    onClose();
                  }}
                  className="text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-teal-500 transition group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>{idx + 1}. {s.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600" />
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{s.why}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                onClose();
                setActivePage("tutorials");
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <BookOpen className="w-4 h-4 text-teal-600" /> Open Feature Tutorials Academy
            </button>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100">
                Explore Freely
              </button>
              <button
                onClick={() => {
                  onClose();
                  onStartTour("dashboard");
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" /> Start Interactive 12-Step Tour
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
