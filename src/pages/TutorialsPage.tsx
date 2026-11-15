import React, { useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, ChevronDown, ChevronUp, Play, RotateCcw, Search, Sparkles } from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { FEATURE_TUTORIALS, ROLE_QUICK_PATHS } from "../data/tutorialsData";
import { PageId, UserRole } from "../types/clinic";

export const TutorialsPage: React.FC = () => {
  const {
    state,
    setActivePage,
    setRole,
    completedTutorials: completedIds,
    toggleTutorialDone: onToggleComplete,
    resetTutorials: onResetProgress,
    startTour: onStartTour,
  } = useClinic();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<PageId>("dashboard");

  const pct = Math.round((completedIds.length / FEATURE_TUTORIALS.length) * 100);
  const rolePath = ROLE_QUICK_PATHS[state.activeRole];

  const filtered = FEATURE_TUTORIALS.filter(
    (t) =>
      !search.trim() ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.tagline.toLowerCase().includes(search.toLowerCase()) ||
      t.whatItCovers.some((c) => c.toLowerCase().includes(search.toLowerCase()))
  );

  const flowNodes: Array<{ step: string; label: string; page: PageId }> = [
    { step: "1", label: "Voice AI / WhatsApp / Lead", page: "voice-whatsapp" },
    { step: "2", label: "Calendar & Telehealth", page: "calendar" },
    { step: "3", label: "Waiting Room Queue", page: "queue" },
    { step: "4", label: "EMR 360 & e-Rx", page: "patients" },
    { step: "5", label: "Pharmacy POS & Stock", page: "pharmacy" },
    { step: "6", label: "Billing & Membership", page: "billing" },
    { step: "7", label: "Patient Portal & Reviews", page: "patient-portal" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Banner & Progress */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 text-white rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-semibold">
            <BookOpen className="w-3.5 h-3.5" /> CliniFlow OS Academy & Guided Onboarding
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Learn Every Feature in 12 Interactive Steps</h1>
          <p className="text-xs text-teal-100 max-w-2xl">
            Follow a role-based quick start, explore the end-to-end patient journey, or launch any module's live hands-on tutorial.
          </p>
        </div>

        <div className="bg-white/10 border border-white/20 rounded-2xl p-4 min-w-[260px] space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>Onboarding Progress</span>
            <span>{completedIds.length} / {FEATURE_TUTORIALS.length} ({pct}%)</span>
          </div>
          <div className="h-2 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full bg-amber-300 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={() => onStartTour("dashboard")}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-teal-800 text-xs font-bold hover:bg-teal-50"
            >
              <Play className="w-3.5 h-3.5" /> Start Guided Tour
            </button>
            <button
              onClick={onResetProgress}
              className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white"
              title="Reset Tutorial Progress"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* End-to-End Flow Map */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">End-to-End Clinic Flow ("One Software. One Flow.")</h2>
            <p className="text-xs text-slate-500">Click any stage below to jump directly into that live module</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {flowNodes.map((n) => (
            <button
              key={n.step}
              onClick={() => setActivePage(n.page)}
              className="p-3 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-400 text-left transition group"
            >
              <span className="inline-block px-1.5 py-0.5 rounded bg-teal-600 text-white text-[10px] font-bold">Step {n.step}</span>
              <div className="text-xs font-bold text-slate-900 mt-1.5 group-hover:text-teal-800">{n.label}</div>
              <div className="text-[10px] text-teal-600 font-semibold mt-1">Open →</div>
            </button>
          ))}
        </div>
      </div>

      {/* Role-Based Quick Start */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{rolePath.title}</h2>
            <p className="text-xs text-slate-500">{rolePath.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["owner", "doctor", "reception", "pharmacist", "patient"] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize border ${
                  state.activeRole === r ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {rolePath.steps.map((s, idx) => (
            <button
              key={s.label}
              onClick={() => setActivePage(s.page)}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-teal-500 text-left transition"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span>{idx + 1}. {s.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{s.why}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Search + All 12 Feature Tutorials */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900">Complete Feature Tutorials ({filtered.length})</h2>
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search feature tutorial (e.g. Voice AI, POS, SOAP)..."
              className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((tut) => {
            const isOpen = expandedId === tut.id;
            const isDone = completedIds.includes(tut.id);
            return (
              <div key={tut.id} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
                <div
                  onClick={() => setExpandedId(isOpen ? ("" as PageId) : tut.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70"
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-8 h-8 rounded-xl text-xs font-bold flex items-center justify-center shrink-0 ${
                      isDone ? "bg-emerald-100 text-emerald-700" : "bg-teal-50 text-teal-700 border border-teal-200"
                    }`}>
                      {isDone ? "✓" : tut.number}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{tut.title}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{tut.estimatedMin}</span>
                        {tut.roles.map((role) => (
                          <span key={role} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                            {role}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{tut.tagline}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleComplete(tut.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border ${
                        isDone ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {isDone ? "Completed ✓" : "Mark Done"}
                    </button>
                    <button
                      onClick={() => setActivePage(tut.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold"
                    >
                      Open Module <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setExpandedId(isOpen ? ("" as PageId) : tut.id)}
                      className="p-1.5 text-slate-400"
                    >
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="px-4 pb-5 pt-2 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-50/40">
                    <div className="lg:col-span-5 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">What This Module Covers</div>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {tut.whatItCovers.map((c) => (
                          <li key={c} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="lg:col-span-7 space-y-2.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Step-by-Step Walkthrough</div>
                      {tut.steps.map((st, idx) => (
                        <div key={st.title} className="p-3 rounded-xl bg-white border border-slate-200/80 flex gap-2.5 text-xs">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900">{st.title}</div>
                            <div className="text-slate-600 mt-0.5">{st.detail}</div>
                          </div>
                        </div>
                      ))}

                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-amber-950 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Hands-On Exercise
                          </div>
                          <div className="text-amber-900 mt-0.5">{tut.tryItLive}</div>
                        </div>
                        <button
                          onClick={() => onStartTour(tut.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-semibold shrink-0"
                        >
                          Launch Guided Tour →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
