import React, { useState } from "react";
import { Bot, CheckCircle2, FileSearch, MessageSquare, Mic, Send, Sparkles, Utensils } from "lucide-react";
import { useClinic } from "../context/ClinicContext";

export const AiAgentsPage: React.FC = () => {
  const { state, addClinicalNote, addDietPlan, notify } = useClinic();
  const [activeAgent, setActiveAgent] = useState<"medquery" | "meddoc" | "voicecmd" | "nutriplan">("medquery");

  // MedQuery State
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "bot"; text: string }>>([
    {
      role: "bot",
      text: "Hello! I am MedQuery Agent (24/7 Clinic Assistant). Ask me about doctor availability, HbA1c test prep, Ayurveda Prakriti packages, or booking slots.",
    },
  ]);

  // MedDoc State
  const [rawReport, setRawReport] = useState(
    "PATIENT LAB REPORT: HbA1c = 7.4% (Ref <5.7%), Fasting Blood Glucose = 148 mg/dL (Ref 70-99), Vitamin D (25-OH) = 19 ng/mL (Ref 30-100), Serum Creatinine = 0.92 mg/dL (Normal)."
  );
  const [docSummary, setDocSummary] = useState<{ flags: string[]; summary: string } | null>(null);

  // VoiceCmd State
  const [voiceTranscript, setVoiceTranscript] = useState(
    "Patient Aarav came in for diabetes and blood pressure follow-up. Morning sugars are 130 mg/dL. BP today is 128/82. Continue Metformin and Telma, add Vitamin D3 weekly, and schedule nutrition review in 2 weeks."
  );
  const [voicePatientId, setVoicePatientId] = useState(state.patients[0]?.id || "");
  const [parsedSoap, setParsedSoap] = useState<{ cc: string; s: string; o: string; a: string; p: string } | null>(null);

  // NutriPlan State
  const [nutriPatientId, setNutriPatientId] = useState(state.patients[0]?.id || "");
  const [nutriGoal, setNutriGoal] = useState("Glycemic Control & Sustainable Fat Loss");
  const [nutriRegion, setNutriRegion] = useState("South Indian Vegetarian");

  const handleSendQuery = (text?: string) => {
    const q = (text ?? chatInput).trim();
    if (!q) return;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    if (!text) setChatInput("");

    setTimeout(() => {
      const lower = q.toLowerCase();
      let reply =
        "Our Koramangala & Indiranagar branches are open Mon–Sat 8:30 AM to 7:00 PM. Would you like me to reserve a slot with Dr. Ananya Rao?";
      if (lower.includes("hba1c") || lower.includes("fasting") || lower.includes("prep")) {
        reply =
          "For Fasting Glucose & Lipid Profile, an 8–10 hour overnight fast (water permitted) is recommended. HbA1c alone does not require fasting. Cost: ₹1,250 with report in 6 hours via WhatsApp.";
      } else if (lower.includes("ayurveda") || lower.includes("shirodhara")) {
        reply =
          "Dr. Vikramaditya Nair conducts Prakriti assessments and Shirodhara/Panchakarma daily (9 AM – 6 PM). Our 6-session Rejuvenation Pack is ₹6,500 (15% pharmacy discount included).";
      } else if (lower.includes("slot") || lower.includes("book") || lower.includes("ananya")) {
        reply =
          "Dr. Ananya Rao (General Medicine, ₹700) has open slots today at 12:30 PM (In-Person) and 4:00 PM (Video Telehealth). Use the '+ Book Appointment' button above to confirm immediately!";
      }
      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
    }, 350);
  };

  const runMedDocExtract = () => {
    const flags: string[] = [];
    if (rawReport.includes("7.4%") || rawReport.toLowerCase().includes("hba1c")) flags.push("HbA1c 7.4% — Elevated (Target < 6.5–7.0%)");
    if (rawReport.includes("148") || rawReport.toLowerCase().includes("glucose")) flags.push("Fasting Glucose 148 mg/dL — Above Reference Range");
    if (rawReport.includes("19 ng/mL") || rawReport.toLowerCase().includes("vitamin d")) flags.push("Vitamin D 19 ng/mL — Deficient (< 30 ng/mL)");
    if (flags.length === 0) flags.push("No critical out-of-range biomarkers detected");
    setDocSummary({
      flags,
      summary:
        "MedDoc AI Synthesis: Report indicates suboptimal glycemic control and Vitamin D deficiency with preserved renal function (Creatinine 0.92 mg/dL). Suggested actions: Vitamin D3 60K weekly x 8 weeks + Low-GI NutriPlan adjustment.",
    });
    notify("MedDoc AI extracted structured biomarkers");
  };

  const runVoiceCmdParse = () => {
    setParsedSoap({
      cc: "Diabetes & Hypertension Follow-up",
      s: "Morning fasting glucose ~130 mg/dL. Compliant with ongoing therapy.",
      o: "Clinic BP 128/82 mmHg. Vitals stable.",
      a: "Type 2 Diabetes & Mild HTN — improving glycemic trend.",
      p: "Continue Metformin + Telmisartan, initiate Vitamin D3 60K weekly, nutrition review in 14 days.",
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-600" />
          Autonomous Healthcare AI Agents Hub
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          LYFnGO-inspired Agentic AI workforce: MedQuery, MedDoc, VoiceCmd & NutriPlan — connected directly to Patient EMR
        </p>
      </div>

      {/* Agent Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {[
          { id: "medquery", name: "MedQuery Agent", desc: "24/7 Patient triage, FAQ & booking assistant", icon: MessageSquare, color: "text-teal-600 bg-teal-50" },
          { id: "meddoc", name: "MedDoc Agent", desc: "Extracts biomarkers & summarizes lab PDFs", icon: FileSearch, color: "text-indigo-600 bg-indigo-50" },
          { id: "voicecmd", name: "VoiceCmd Agent", desc: "Dictation -> structured SOAP note & tasks", icon: Mic, color: "text-violet-600 bg-violet-50" },
          { id: "nutriplan", name: "NutriPlan Agent", desc: "Pathology-aware regional diet plan builder", icon: Utensils, color: "text-emerald-600 bg-emerald-50" },
        ].map((ag) => (
          <button
            key={ag.id}
            onClick={() => setActiveAgent(ag.id as typeof activeAgent)}
            className={`text-left p-4 rounded-2xl border transition ${
              activeAgent === ag.id
                ? "bg-white border-violet-500 ring-2 ring-violet-500/15 shadow-xs"
                : "bg-white border-slate-200/80 hover:border-slate-300"
            }`}
          >
            <div className={`w-9 h-9 rounded-xl ${ag.color} flex items-center justify-center mb-2.5`}>
              <ag.icon className="w-4 h-4" />
            </div>
            <div className="text-sm font-bold text-slate-900">{ag.name}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{ag.desc}</div>
          </button>
        ))}
      </div>

      {/* Agent Workspaces */}
      {activeAgent === "medquery" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">MedQuery Knowledge Hub & Patient Assistant</h2>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["HbA1c fasting prep?", "Dr. Ananya slots today", "Ayurveda Shirodhara details"].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSendQuery(prompt)}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-[11px] font-medium text-slate-700"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 overflow-y-auto p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-lg px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    m.role === "user" ? "bg-teal-600 text-white" : "bg-white border border-slate-200 text-slate-800"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery();
            }}
            className="flex gap-2"
          >
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask MedQuery anything about clinic hours, lab prep, memberships..."
              className="flex-1 px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl"
            />
            <button type="submit" className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" /> Ask
            </button>
          </form>
        </div>
      )}

      {activeAgent === "meddoc" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900">MedDoc Report Extractor (PDF / Pathology Text)</h2>
            <textarea
              rows={6}
              value={rawReport}
              onChange={(e) => setRawReport(e.target.value)}
              className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50"
            />
            <button onClick={runMedDocExtract} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold">
              Extract & Summarize Biomarkers
            </button>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-800">Structured Clinical Extraction</h3>
            {docSummary ? (
              <>
                <div className="space-y-1.5">
                  {docSummary.flags.map((f) => (
                    <div key={f} className="p-2 rounded-lg bg-white border border-indigo-100 text-xs font-semibold text-rose-700">
                      • {f}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{docSummary.summary}</p>
              </>
            ) : (
              <div className="text-xs text-slate-400 py-8 text-center">Click "Extract & Summarize Biomarkers" to analyze report.</div>
            )}
          </div>
        </div>
      )}

      {activeAgent === "voicecmd" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900">VoiceCmd Consultation Transcript → SOAP</h2>
            <select value={voicePatientId} onChange={(e) => setVoicePatientId(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
              {state.patients.map((p) => <option key={p.id} value={p.id}>Target Patient: {p.name} ({p.mrn})</option>)}
            </select>
            <textarea rows={5} value={voiceTranscript} onChange={(e) => setVoiceTranscript(e.target.value)} className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50" />
            <button onClick={runVoiceCmdParse} className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold">
              Parse Transcript to SOAP Note
            </button>
          </div>

          <div className="p-4 rounded-xl bg-violet-50/50 border border-violet-200 space-y-2.5 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-violet-800">Structured SOAP Output</h3>
            {parsedSoap ? (
              <>
                <div><strong>Chief Complaint:</strong> {parsedSoap.cc}</div>
                <div><strong>S:</strong> {parsedSoap.s}</div>
                <div><strong>O:</strong> {parsedSoap.o}</div>
                <div><strong>A:</strong> {parsedSoap.a}</div>
                <div><strong>P:</strong> {parsedSoap.p}</div>
                <button
                  onClick={() =>
                    addClinicalNote({
                      patientId: voicePatientId,
                      doctorId: state.staff.find((s) => s.role === "doctor")?.id || "doc-1",
                      templateType: "SOAP",
                      chiefComplaint: parsedSoap.cc,
                      symptoms: [parsedSoap.cc],
                      subjective: parsedSoap.s,
                      objective: parsedSoap.o,
                      assessment: parsedSoap.a,
                      plan: parsedSoap.p,
                      aiGenerated: true,
                    })
                  }
                  className="mt-2 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 text-white font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Save Directly to Patient EMR
                </button>
              </>
            ) : (
              <div className="text-slate-400 py-8 text-center">Click "Parse Transcript to SOAP Note" to generate structured chart.</div>
            )}
          </div>
        </div>
      )}

      {activeAgent === "nutriplan" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">NutriPlan AI — Pathology & Regional Diet Generator</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={nutriPatientId} onChange={(e) => setNutriPatientId(e.target.value)} className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
              {state.patients.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.chronicConditions.join(", ") || p.specialtyTag}</option>)}
            </select>
            <input value={nutriGoal} onChange={(e) => setNutriGoal(e.target.value)} placeholder="Wellness Goal" className="px-3 py-2 text-xs border border-slate-200 rounded-xl" />
            <select value={nutriRegion} onChange={(e) => setNutriRegion(e.target.value)} className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
              <option value="South Indian Vegetarian">South Indian Vegetarian</option>
              <option value="North Indian High-Protein">North Indian High-Protein</option>
              <option value="Mediterranean Anti-Inflammatory">Mediterranean Anti-Inflammatory</option>
              <option value="Ayurveda Sattvic Pitta-Pacifying">Ayurveda Sattvic Pitta-Pacifying</option>
            </select>
          </div>
          <button
            onClick={() => {
              const pat = state.patients.find((p) => p.id === nutriPatientId);
              if (!pat) return;
              addDietPlan({
                patientId: pat.id,
                title: `NutriPlan AI: ${nutriRegion}`,
                goal: nutriGoal,
                caloriesTarget: 1750,
                expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
                aiGenerated: true,
                restrictions: pat.allergies.filter((a) => a !== "None Known"),
                meals: [
                  { slot: "Early Morning", items: "Warm Jeera-Methi infusion + 5 soaked almonds", calories: 95, macros: "3g P / 4g C / 7g F" },
                  { slot: "Breakfast", items: "2 Millet/Ragi Idlis + Sambar + Paneer bhurji (80g)", calories: 410, macros: "22g P / 50g C / 12g F" },
                  { slot: "Mid-Morning", items: "1 Apple + Roasted flaxseeds (1 tbsp)", calories: 130, macros: "3g P / 22g C / 4g F" },
                  { slot: "Lunch", items: "1 cup Hand-pounded Brown Rice + Dal + Stir-fried Greens + Curd", calories: 560, macros: "21g P / 72g C / 14g F" },
                  { slot: "Evening Snack", items: "Unsweetened Green Tea + Roasted Makhana (30g)", calories: 125, macros: "4g P / 20g C / 3g F" },
                  { slot: "Dinner", items: "2 Multigrain Rotis + Palak Tofu + Cucumber Salad", calories: 430, macros: "20g P / 44g C / 14g F" },
                ],
              });
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" /> Generate & Assign to Patient Healthboard
          </button>
        </div>
      )}
    </div>
  );
};
