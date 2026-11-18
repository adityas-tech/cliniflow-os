import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Check,
  ChevronRight,
  Copy,
  FlaskConical,
  Globe,
  LayoutGrid,
  Lock,
  MessageSquarePlus,
  PanelRightClose,
  Plus,
  Send,
  Sparkles,
  Stethoscope,
  User,
} from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import {
  AiChatScope,
  answerScopedAiQuery,
  DoctorChatResponse,
  INVESTIGATION_CATALOG,
} from "../data/medicalKnowledge";
import { PageId } from "../types/clinic";

interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  scope: AiChatScope;
  text?: string;
  structured?: DoctorChatResponse;
  timestamp: string;
}

interface ChatThread {
  id: string;
  title: string;
  scope: AiChatScope;
  turns: ChatTurn[];
}

const PAGE_LABELS: Record<PageId, string> = {
  dashboard: "Command Center",
  calendar: "Calendar & Telehealth",
  queue: "Front Desk Queue",
  patients: "Patients & EMR 360",
  pharmacy: "Pharmacy & POS",
  inventory: "Inventory & Vendors",
  billing: "Billing & Memberships",
  growth: "CRM & Microsite",
  "voice-whatsapp": "Voice AI & WhatsApp",
  "ai-agents": "AI Agents Hub",
  reports: "Reports & Audit",
  "patient-portal": "Patient Portal",
  tutorials: "Tutorials & Academy",
};

const INITIAL_THREAD: ChatThread = {
  id: "thr-1",
  title: "General Medical & Clinic Chat",
  scope: "general",
  turns: [
    {
      id: "init-1",
      role: "assistant",
      scope: "general",
      timestamp: "Ready",
      structured: {
        title: "CliniFlow AI Copilot — Universal, Patient & Section Modes",
        answerSections: [
          {
            heading: "Switch Context Anytime Above",
            bullets: [
              "General: Ask universal medical questions (ABG, drug dosing, fever/qSOFA, chest pain, OSA, asthma/COPD guidelines).",
              "Patient: Grounded in the selected patient's vitals, allergies & labs with 1-click Chart Insert & Lab Ordering.",
              "This Page: Live operational insights tailored to whichever clinic section you have open right now.",
            ],
          },
        ],
        references: ["GINA 2025", "GOLD", "AASM OSA", "ADA 2026", "IDSA"],
      },
    },
  ],
};

export const DoctorAiDrawer: React.FC = () => {
  const {
    state,
    activePage,
    selectedPatientId,
    setSelectedPatientId,
    setRole,
    doctorAiOpen,
    setDoctorAiOpen,
    pushToConsultation,
    addLabOrder,
    notify,
  } = useClinic();

  const [scope, setScope] = useState<AiChatScope>("general");
  const [threads, setThreads] = useState<ChatThread[]>([INITIAL_THREAD]);
  const [activeThreadId, setActiveThreadId] = useState<string>("thr-1");
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const patient = state.patients.find((p) => p.id === selectedPatientId) || state.patients[0];
  const latestVitals = patient?.vitals[patient.vitals.length - 1];
  const recentLab = state.labOrders.find((l) => l.patientId === patient?.id && l.resultsSummary);
  const isDoctorAuthorized = state.activeRole === "doctor" || state.activeRole === "owner";

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeThread?.turns.length, doctorAiOpen]);

  const startNewThread = (nextScope: AiChatScope = scope) => {
    const labelMap: Record<AiChatScope, string> = {
      general: "General Medical Chat",
      patient: `${patient?.name || "Patient"} Case`,
      section: `${PAGE_LABELS[activePage]} Ops`,
    };
    const newThr: ChatThread = {
      id: `thr-${Date.now()}`,
      title: `${labelMap[nextScope]} (${threads.length + 1})`,
      scope: nextScope,
      turns: [
        {
          id: `welcome-${Date.now()}`,
          role: "assistant",
          scope: nextScope,
          timestamp: "New Chat",
          structured: {
            title: `New ${nextScope === "general" ? "General Medical" : nextScope === "patient" ? `Patient (${patient?.name})` : PAGE_LABELS[activePage]} Conversation`,
            answerSections: [
              {
                heading: "Ready to Assist",
                bullets: [
                  nextScope === "general"
                    ? "Ask any medical, diagnostic, dosing, or guideline question."
                    : nextScope === "patient"
                    ? `Context locked to ${patient?.name} (${patient?.mrn}). Allergies & vitals will be checked automatically.`
                    : `Context locked to ${PAGE_LABELS[activePage]}. Ask for live metrics, pending items, or workflow help.`,
                ],
              },
            ],
            references: ["CliniFlow AI Copilot"],
          },
        },
      ],
    };
    setThreads((prev) => [newThr, ...prev]);
    setActiveThreadId(newThr.id);
    setScope(nextScope);
  };

  const askQuery = (raw?: string, overrideScope?: AiChatScope) => {
    const q = (raw ?? input).trim();
    if (!q) return;
    if (!raw) setInput("");

    const usedScope = overrideScope ?? scope;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userTurn: ChatTurn = {
      id: `u-${Date.now()}`,
      role: "user",
      scope: usedScope,
      text: q,
      timestamp: time,
    };

    const response = answerScopedAiQuery({
      scope: usedScope,
      query: q,
      activePage,
      state,
      patient,
      vitals: latestVitals,
      recentLabsSummary: recentLab?.resultsSummary,
    });

    const botTurn: ChatTurn = {
      id: `a-${Date.now() + 1}`,
      role: "assistant",
      scope: usedScope,
      structured: response,
      timestamp: time,
    };

    setThreads((prev) =>
      prev.map((thr) =>
        thr.id === activeThread.id
          ? {
              ...thr,
              title: thr.turns.length <= 1 ? q.slice(0, 28) + (q.length > 28 ? "…" : "") : thr.title,
              turns: [...thr.turns, userTurn, botTurn],
            }
          : thr
      )
    );
  };

  const copyResponse = (turn: ChatTurn) => {
    if (!turn.structured) return;
    const text = [
      turn.structured.title,
      ...turn.structured.answerSections.map((s) => `${s.heading}:\n${s.bullets.map((b) => `- ${b}`).join("\n")}`),
    ].join("\n\n");
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(turn.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const promptsByScope: Record<AiChatScope, string[]> = {
    general: [
      "ABG acid-base interpretation",
      "Pediatric & renal drug dosing",
      "Acute febrile illness & qSOFA",
      "Chest pain & hypertensive urgency",
      "OSA Sleep Study & CPAP guide",
    ],
    patient: [
      "Differential & workup for current patient",
      "Allergy-safe antibiotics & drug check",
      "Hospitalization / CURB-65 red flags",
      "Asthma / COPD inhaler step-up & PFT",
    ],
    section: [
      `Summarize live ${PAGE_LABELS[activePage]} status`,
      "What needs priority action right now?",
      "Show pending alerts & follow-ups",
    ],
  };

  // Collapsed Floating Right Tab
  if (!doctorAiOpen) {
    return (
      <button
        onClick={() => setDoctorAiOpen(true)}
        className="no-print fixed right-0 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1.5 px-2.5 py-3 rounded-l-2xl bg-slate-900 hover:bg-teal-700 text-white shadow-lg border border-r-0 border-slate-700 transition"
        title="Open Collapsible AI Copilot"
      >
        <Sparkles className="w-4 h-4 text-teal-300" />
        <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-bold tracking-wide">
          AI Copilot
        </span>
      </button>
    );
  }

  // Non-doctors cannot use clinical patient CDSS unless they switch role or use Section mode
  const clinicalModeLocked = !isDoctorAuthorized && scope !== "section";

  return (
    <aside className="no-print fixed top-16 right-0 bottom-0 z-30 w-full sm:w-[410px] xl:w-[430px] bg-white border-l border-slate-200 shadow-2xl flex flex-col">
      {/* Top Header + Thread Switcher */}
      <div className="px-4 py-3 bg-slate-900 text-white space-y-2.5 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-violet-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                CliniFlow AI Copilot
                <span className="px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 text-[9px] font-bold uppercase">
                  {scope === "section" ? "Clinic Ops" : "MD Search"}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">Universal, Patient & Section Assistant</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => startNewThread(scope)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold"
              title="Start New Chat"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" /> New
            </button>
            <button
              onClick={() => setDoctorAiOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white"
              title="Collapse Panel"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Saved Threads Selector */}
        {threads.length > 1 && (
          <select
            value={activeThread.id}
            onChange={(e) => {
              setActiveThreadId(e.target.value);
              const found = threads.find((t) => t.id === e.target.value);
              if (found) setScope(found.scope);
            }}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[11px] text-slate-200 outline-none"
          >
            {threads.map((t) => (
              <option key={t.id} value={t.id}>
                💬 {t.title} ({t.turns.length} msgs)
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Intuitive 3-Mode Context Scope Switcher */}
      <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200/80 space-y-2 shrink-0">
        <div className="grid grid-cols-3 gap-1 bg-slate-200/70 p-1 rounded-xl">
          {([
            { id: "general", label: "General", icon: Globe },
            { id: "patient", label: "Patient", icon: User },
            { id: "section", label: "This Page", icon: LayoutGrid },
          ] as const).map((m) => (
            <button
              key={m.id}
              onClick={() => setScope(m.id)}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                scope === m.id
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <m.icon className={`w-3.5 h-3.5 ${scope === m.id ? "text-teal-600" : "text-slate-400"}`} />
              {m.label}
            </button>
          ))}
        </div>

        {/* Context Details Bar */}
        {scope === "general" && (
          <div className="text-[11px] text-slate-600 px-1 flex items-center justify-between">
            <span>Universal medical search & clinical guidelines</span>
            <span className="text-[10px] font-semibold text-teal-700">No patient lock</span>
          </div>
        )}

        {scope === "patient" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Stethoscope className="w-3 h-3 text-teal-600" /> Patient Context
              </span>
              <select
                value={patient?.id}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="text-[11px] font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1 max-w-[215px]"
              >
                {state.patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.mrn})
                  </option>
                ))}
              </select>
            </div>
            {patient && (
              <div className="flex flex-wrap gap-1 text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-medium">
                  {patient.age}y {patient.gender}
                </span>
                {latestVitals && (
                  <span className="px-1.5 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800 font-semibold">
                    SpO2 {latestVitals.spo2}% • BP {latestVitals.bpSystolic}/{latestVitals.bpDiastolic}
                  </span>
                )}
                {patient.allergies[0] !== "None Known" && (
                  <span className="px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 font-bold">
                    Allergy: {patient.allergies.join(", ")}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {scope === "section" && (
          <div className="flex items-center justify-between text-[11px] px-1">
            <span className="text-slate-600">
              Active Section: <strong className="text-slate-900">{PAGE_LABELS[activePage]}</strong>
            </span>
            <button
              onClick={() => askQuery(`Summarize live ${PAGE_LABELS[activePage]} status`, "section")}
              className="text-[10px] font-bold text-teal-700 hover:underline"
            >
              Analyze Page →
            </button>
          </div>
        )}
      </div>

      {/* Main Chat Body */}
      {clinicalModeLocked ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div className="text-sm font-bold text-slate-900">Doctor-Only Medical Search & Clinical CDSS</div>
          <p className="text-xs text-slate-500">
            Clinical diagnosis & drug safety search are restricted to Doctors. You can switch to <strong>This Page</strong> mode for operational help, or switch to Doctor view.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setScope("section")}
              className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Use This Page Mode
            </button>
            <button
              onClick={() => setRole("doctor")}
              className="px-3.5 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold"
            >
              Switch to Doctor Role
            </button>
          </div>
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
            {activeThread.turns.map((turn) => {
              if (turn.role === "user") {
                return (
                  <div key={turn.id} className="flex flex-col items-end gap-1">
                    <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm bg-slate-900 text-white text-xs leading-relaxed shadow-2xs">
                      {turn.text}
                    </div>
                    <span className="text-[9px] text-slate-400 uppercase font-semibold px-1">
                      {turn.scope} • {turn.timestamp}
                    </span>
                  </div>
                );
              }

              const res = turn.structured;
              if (!res) return null;

              return (
                <div key={turn.id} className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 leading-snug">{res.title}</div>
                        <div className="text-[9px] uppercase font-semibold text-slate-400 mt-0.5">
                          {turn.scope} mode • {turn.timestamp}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => copyResponse(turn)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0"
                      title="Copy response"
                    >
                      {copiedId === turn.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {res.allergyAlert && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] font-semibold text-rose-800 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{res.allergyAlert}</span>
                    </div>
                  )}

                  {res.answerSections.map((sec) => (
                    <div key={sec.heading} className="space-y-1">
                      <div className="text-[11px] font-bold text-teal-800">{sec.heading}</div>
                      <ul className="space-y-1 text-[11px] text-slate-700 leading-relaxed">
                        {sec.bullets.map((b) => (
                          <li key={b} className="flex items-start gap-1.5">
                            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {res.references.map((ref) => (
                      <span key={ref} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium">
                        {ref}
                      </span>
                    ))}
                  </div>

                  {(res.suggestedPlanSnippet || (res.suggestedLabs && res.suggestedLabs.length > 0)) && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {res.suggestedPlanSnippet && (
                        <button
                          onClick={() =>
                            pushToConsultation({
                              plan: res.suggestedPlanSnippet,
                              icd: res.suggestedIcd,
                              labs: res.suggestedLabs,
                            })
                          }
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold"
                        >
                          <Plus className="w-3 h-3" /> Insert Plan & Labs to Consult
                        </button>
                      )}
                      {res.suggestedLabs && res.suggestedLabs.length > 0 && patient && (
                        <button
                          onClick={() => {
                            const docId = state.staff.find((s) => s.role === "doctor")?.id || "doc-1";
                            res.suggestedLabs!.forEach((labName) => {
                              const cat = INVESTIGATION_CATALOG.find((c) => c.name === labName);
                              addLabOrder({
                                patientId: patient.id,
                                doctorId: docId,
                                testName: labName,
                                category: cat?.cat || "Diagnostics",
                                priority: "routine",
                                cost: cat?.cost || 850,
                              });
                            });
                            notify(`Ordered ${res.suggestedLabs!.length} suggested lab tests for ${patient.name}`);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-semibold hover:bg-indigo-100"
                        >
                          <FlaskConical className="w-3 h-3" /> Order Suggested Labs
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Scope-Aware Quick Prompts + Input */}
          <div className="p-3 bg-white border-t border-slate-200 space-y-2.5 shrink-0">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {promptsByScope[scope].map((qp) => (
                <button
                  key={qp}
                  onClick={() => askQuery(qp)}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-800 border border-slate-200 text-[10px] font-semibold text-slate-700 whitespace-nowrap shrink-0"
                >
                  {qp}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                askQuery();
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  scope === "general"
                    ? "Ask any general medical question (ABG, dosing, fever, OSA)..."
                    : scope === "patient"
                    ? `Ask about ${patient?.name || "this patient"} (differentials, allergy check)...`
                    : `Ask about ${PAGE_LABELS[activePage]} (status, alerts, next steps)...`
                }
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-slate-900 hover:bg-teal-600 text-white transition"
                title="Send Query"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </aside>
  );
};
