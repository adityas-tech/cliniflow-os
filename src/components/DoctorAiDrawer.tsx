import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  ChevronRight,
  FlaskConical,
  Lock,
  PanelRightClose,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { answerDoctorMedicalQuery, DoctorChatResponse, INVESTIGATION_CATALOG } from "../data/medicalKnowledge";

interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  text?: string;
  structured?: DoctorChatResponse;
  timestamp: string;
}

export const DoctorAiDrawer: React.FC = () => {
  const {
    state,
    selectedPatientId,
    setSelectedPatientId,
    setRole,
    doctorAiOpen,
    setDoctorAiOpen,
    pushToConsultation,
    addLabOrder,
    notify,
  } = useClinic();

  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      id: "init-1",
      role: "assistant",
      timestamp: "Ready",
      structured: {
        title: "Doctor-Only Medical AI Copilot (Chat & Clinical Search)",
        answerSections: [
          {
            heading: "How I Assist During Consultations",
            bullets: [
              "Search evidence-based differentials, CURB-65 / STOP-BANG criteria, PFT & Sleep Study guidelines, and drug dosing.",
              "Every answer automatically checks the selected patient's vitals, chronic conditions, and documented allergies.",
              "Insert suggested plans, ICD-10 codes, or lab orders directly into the patient's chart in 1 click.",
            ],
          },
        ],
        references: ["GINA 2025", "GOLD COPD", "AASM OSA", "ADA 2026", "IDSA"],
      },
    },
  ]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const patient = state.patients.find((p) => p.id === selectedPatientId) || state.patients[0];
  const latestVitals = patient?.vitals[patient.vitals.length - 1];
  const recentLab = state.labOrders.find((l) => l.patientId === patient?.id && l.resultsSummary);
  const isDoctorAuthorized = state.activeRole === "doctor" || state.activeRole === "owner";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns, doctorAiOpen]);

  const askQuery = (raw?: string) => {
    const q = (raw ?? input).trim();
    if (!q) return;
    if (!raw) setInput("");

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userTurn: ChatTurn = { id: `u-${Date.now()}`, role: "user", text: q, timestamp: time };
    const response = answerDoctorMedicalQuery({
      query: q,
      patient,
      vitals: latestVitals,
      recentLabsSummary: recentLab?.resultsSummary,
    });
    const botTurn: ChatTurn = {
      id: `a-${Date.now() + 1}`,
      role: "assistant",
      structured: response,
      timestamp: time,
    };
    setTurns((prev) => [...prev, userTurn, botTurn]);
  };

  const quickPrompts = [
    "Differential & workup for current patient",
    "Allergy-safe antibiotics & drug check",
    "Hospitalization / CURB-65 red flags",
    "OSA Sleep Study & CPAP guide",
    "Asthma / COPD inhaler step-up & PFT",
  ];

  // Collapsed Floating Right Tab
  if (!doctorAiOpen) {
    return (
      <button
        onClick={() => setDoctorAiOpen(true)}
        className="no-print fixed right-0 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1.5 px-2.5 py-3 rounded-l-2xl bg-slate-900 hover:bg-teal-700 text-white shadow-lg border border-r-0 border-slate-700 transition group"
        title="Open Doctor-Only AI Diagnostic & Search Copilot"
      >
        <Sparkles className="w-4 h-4 text-teal-300" />
        <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-bold tracking-wide">
          Doctor AI Copilot
        </span>
      </button>
    );
  }

  return (
    <aside className="no-print fixed top-16 right-0 bottom-0 z-30 w-full sm:w-[410px] xl:w-[430px] bg-white border-l border-slate-200 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-violet-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-1.5">
              Doctor AI Copilot
              <span className="px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 text-[9px] font-bold uppercase">
                MD Only
              </span>
            </div>
            <div className="text-[10px] text-slate-400">Medical Search, Differentials & Plan Chat</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setTurns((prev) => prev.slice(0, 1))}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            title="New Medical Search Thread"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDoctorAiOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 text-[11px]"
            title="Collapse Panel"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isDoctorAuthorized ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div className="text-sm font-bold text-slate-900">Doctor-Only Clinical AI Assistant</div>
          <p className="text-xs text-slate-500">
            Medical search, differential diagnosis, and clinical prescribing recommendations are restricted to Doctors / Medical Directors.
          </p>
          <button
            onClick={() => setRole("doctor")}
            className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold"
          >
            Switch to Doctor Role
          </button>
        </div>
      ) : (
        <>
          {/* Active Patient Medical Context Pill */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 space-y-1.5 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Stethoscope className="w-3 h-3 text-teal-600" /> Medical Context
              </span>
              <select
                value={patient?.id}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="text-[11px] font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1 max-w-[210px]"
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

          {/* ChatGPT / Gemini Feed */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
            {turns.map((turn) => {
              if (turn.role === "user") {
                return (
                  <div key={turn.id} className="flex justify-end">
                    <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm bg-slate-900 text-white text-xs leading-relaxed shadow-2xs">
                      {turn.text}
                    </div>
                  </div>
                );
              }

              const res = turn.structured;
              if (!res) return null;

              return (
                <div key={turn.id} className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 leading-snug">{res.title}</div>
                    </div>
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

                  {/* Clinical Guidelines Badges */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {res.references.map((ref) => (
                      <span key={ref} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium">
                        {ref}
                      </span>
                    ))}
                  </div>

                  {/* Direct 1-Click Actions to Patient Chart */}
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

          {/* Prompt Suggestions + Input */}
          <div className="p-3 bg-white border-t border-slate-200 space-y-2.5 shrink-0">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {quickPrompts.map((qp) => (
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
                placeholder="Ask medical AI (differentials, drug safety, CURB-65, OSA)..."
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-slate-900 hover:bg-teal-600 text-white transition"
                title="Send Medical Query"
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
