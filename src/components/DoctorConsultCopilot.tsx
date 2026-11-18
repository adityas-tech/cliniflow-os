import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BedDouble,
  Bot,
  CheckCircle2,
  FlaskConical,
  Lock,
  Mic,
  MicOff,
  Pill,
  Play,
  Plus,
  Send,
  Share2,
  Sparkles,
  Square,
  Stethoscope,
  X,
} from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import {
  analyzeClinicalCase,
  COMMON_SYMPTOMS_CHIPS,
  extractEntitiesFromUtterance,
  INVESTIGATION_CATALOG,
  LIVE_MEETING_SCENARIOS,
} from "../data/medicalKnowledge";
import { ClinicalNote, ConsultationDisposition, Patient, PrescriptionItem } from "../types/clinic";

interface DoctorConsultCopilotProps {
  patient: Patient;
}

export const DoctorConsultCopilot: React.FC<DoctorConsultCopilotProps> = ({ patient }) => {
  const { state, setRole, addClinicalNote, addLabOrder, addPrescription, notify } = useClinic();
  const doctors = state.staff.filter((s) => s.role === "doctor");
  const latestVitals = patient.vitals[patient.vitals.length - 1];

  // Doctor-only gate (Doctors & Clinic Owner/MD allowed; non-clinical roles see lock notice with switch button)
  const isDoctorAuthorized = state.activeRole === "doctor" || state.activeRole === "owner";

  // Structured Clinical Consultation State
  const [templateType, setTemplateType] = useState<ClinicalNote["templateType"]>("Pulmonology & Sleep");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState("");

  // On-Examination Findings
  const [examGeneral, setExamGeneral] = useState("Alert, oriented, no pallor/icterus/cyanosis");
  const [examResp, setExamResp] = useState("");
  const [examCvs, setExamCvs] = useState("S1 S2 normal, regular rhythm");
  const [examEnt, setExamEnt] = useState("");
  const [examSystemic, setExamSystemic] = useState("");

  // Diagnosis, Plan & Disposition
  const [assessment, setAssessment] = useState("");
  const [icdCode, setIcdCode] = useState("");
  const [planOfAction, setPlanOfAction] = useState("");
  const [selectedInvestigations, setSelectedInvestigations] = useState<string[]>([]);
  const [customInv, setCustomInv] = useState("");

  // Inline Medicines Builder
  const [rxItems, setRxItems] = useState<PrescriptionItem[]>([]);
  const [selInvId, setSelInvId] = useState(state.inventory[0]?.id || "");
  const [rxFreq, setRxFreq] = useState("1-0-1");
  const [rxTiming, setRxTiming] = useState<PrescriptionItem["timing"]>("After Food");
  const [rxDays, setRxDays] = useState(7);

  // Disposition: Outpatient vs Hospitalization vs Referral
  const [disposition, setDisposition] = useState<ConsultationDisposition>("Outpatient Follow-Up");
  const [hospUrgency, setHospUrgency] = useState<"Immediate / ER" | "Elective Admission">("Immediate / ER");
  const [hospWard, setHospWard] = useState<"ICU / Respiratory HDU" | "General Ward" | "Sleep Lab Overnight">("ICU / Respiratory HDU");
  const [hospReason, setHospReason] = useState("");
  const [hospDays, setHospDays] = useState(3);

  const [refDoctor, setRefDoctor] = useState("Dr. Rishabh Kacker (ENT & Head-Neck)");
  const [refFacility, setRefFacility] = useState("Dr. Kacker's Specialty Centre — Kanpur / Lucknow");
  const [refUrgency, setRefUrgency] = useState<"Urgent" | "Routine">("Routine");
  const [refReason, setRefReason] = useState("");

  // Real-Time Recording & Meeting State
  const [isRecording, setIsRecording] = useState(false);
  const [meetingSpeaker, setMeetingSpeaker] = useState<"Doctor" | "Patient">("Patient");
  const [liveUtterance, setLiveUtterance] = useState("");
  const [transcript, setTranscript] = useState<
    Array<{ timestamp: string; speaker: "Doctor" | "Patient"; text: string; extractedTag?: string }>
  >([]);
  const streamTimerRef = useRef<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speechRecRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (streamTimerRef.current) window.clearInterval(streamTimerRef.current);
      if (speechRecRef.current) {
        try {
          speechRecRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Run Doctor-Only Medical AI Decision Support Engine continuously
  const examCombined = [examGeneral, examResp, examCvs, examEnt, examSystemic].filter(Boolean).join(". ");
  const aiAnalysis = analyzeClinicalCase({
    symptoms,
    examText: examCombined,
    chiefComplaint,
    patient,
    vitals: latestVitals,
  });

  const addSymptomUnique = (s: string) => {
    const clean = s.trim();
    if (!clean) return;
    setSymptoms((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
  };

  const toggleInvestigation = (name: string) => {
    setSelectedInvestigations((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  // Real-time Transcript Ingestion -> Extracts Symptoms, On-Exam, Labs live!
  const ingestLiveLine = (speaker: "Doctor" | "Patient", text: string) => {
    const clean = text.trim();
    if (!clean) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const extracted = extractEntitiesFromUtterance(clean);

    setTranscript((prev) => [...prev, { timestamp: now, speaker, text: clean, extractedTag: extracted.tag }]);

    extracted.symptoms.forEach((sym) => addSymptomUnique(sym));
    extracted.investigations.forEach((inv) =>
      setSelectedInvestigations((prev) => (prev.includes(inv) ? prev : [...prev, inv]))
    );
    if (extracted.examNote) {
      setExamResp((prev) => (prev ? `${prev}; ${extracted.examNote}` : extracted.examNote!));
    }
    if (!chiefComplaint && speaker === "Patient") {
      setChiefComplaint(clean.slice(0, 90));
    }
  };

  const startLiveRecording = () => {
    setIsRecording(true);
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (SpeechRec) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rec: any = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = false;
        rec.lang = "en-IN";
        rec.onresult = (evt: { results: ArrayLike<ArrayLike<{ transcript: string }>> & { length: number } }) => {
          const last = evt.results[evt.results.length - 1];
          if (last?.[0]?.transcript) {
            ingestLiveLine(meetingSpeaker, last[0].transcript);
          }
        };
        rec.onerror = () => {};
        rec.start();
        speechRecRef.current = rec;
        notify("Live consultation microphone recording started", "Speak or type lines — AI extracts symptoms & plan in real time", "info");
        return;
      } catch {
        // Fallback cleanly to manual/simulated stream
      }
    }
    notify("Real-Time Meeting Recorder Active", "Type live utterances or run a Real-Time Clinical Scenario below", "info");
  };

  const stopLiveRecording = () => {
    setIsRecording(false);
    if (streamTimerRef.current) {
      window.clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch {
        // ignore
      }
      speechRecRef.current = null;
    }
    notify("Recording stopped — review extracted symptoms & plan before saving", undefined, "info");
  };

  const runLiveScenarioStream = (scenarioId: string) => {
    const scenario = LIVE_MEETING_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return;
    if (streamTimerRef.current) window.clearInterval(streamTimerRef.current);
    setTranscript([]);
    setIsRecording(true);

    let index = 0;
    ingestLiveLine(scenario.lines[0].speaker, scenario.lines[0].text);
    index = 1;

    streamTimerRef.current = window.setInterval(() => {
      if (index >= scenario.lines.length) {
        if (streamTimerRef.current) window.clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
        setIsRecording(false);
        notify("Real-Time Meeting Transcription Complete", "AI Copilot updated diagnoses, labs & plan of action");
        return;
      }
      const line = scenario.lines[index];
      ingestLiveLine(line.speaker, line.text);
      index += 1;
    }, 950);
  };

  const applyAiToChart = () => {
    const topDx = aiAnalysis.differentials[0];
    if (topDx) {
      setAssessment(
        aiAnalysis.differentials.map((d) => `${d.condition} [${d.likelihood}]`).join(" | ")
      );
      setIcdCode(topDx.icdCode);
    }
    setPlanOfAction(aiAnalysis.recommendedPlanOfAction);
    setSelectedInvestigations((prev) => {
      const merged = new Set([...prev, ...aiAnalysis.recommendedInvestigations]);
      return Array.from(merged);
    });
    setDisposition(aiAnalysis.dispositionAdvice);
    if (aiAnalysis.dispositionAdvice === "Hospitalization Required" && !hospReason) {
      setHospReason(aiAnalysis.dispositionRationale);
    }
    if (aiAnalysis.dispositionAdvice === "Specialist Referral" && !refReason) {
      setRefReason(aiAnalysis.dispositionRationale);
    }
    notify("Doctor AI Copilot plan, differentials & investigations applied to chart");
  };

  const handleAddMedicine = () => {
    const inv = state.inventory.find((i) => i.id === selInvId);
    if (!inv) return;
    const freqCount = rxFreq === "1-0-1" ? 2 : rxFreq === "1-1-1" ? 3 : 1;
    setRxItems((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        inventoryItemId: inv.id,
        medicineName: inv.name,
        dosage: inv.unit === "Tablets" || inv.unit === "Capsules" ? "1 unit" : "As directed",
        frequency: rxFreq,
        timing: rxTiming,
        durationDays: rxDays,
        quantity: Math.max(1, freqCount * rxDays),
      },
    ]);
  };

  const handleSaveFullConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    const docId = doctors[0]?.id || "doc-1";

    addClinicalNote({
      patientId: patient.id,
      doctorId: docId,
      templateType,
      chiefComplaint: chiefComplaint.trim() || symptoms.join(", ") || "Outpatient Consultation",
      symptoms,
      onExamination: {
        general: examGeneral,
        respiratory: examResp,
        cardiovascular: examCvs,
        ent: examEnt,
        systemic: examSystemic,
      },
      subjective: `Symptoms: ${symptoms.join(", ") || chiefComplaint}`,
      objective: examCombined || "Vitals stable on exam",
      assessment: assessment || aiAnalysis.differentials[0]?.condition || "Clinical Evaluation",
      plan: planOfAction || aiAnalysis.recommendedPlanOfAction,
      icdCode: icdCode || aiAnalysis.differentials[0]?.icdCode,
      investigationsRequired: selectedInvestigations,
      medicinesSummary: rxItems.map((m) => `${m.medicineName} (${m.frequency})`),
      disposition,
      hospitalizationDetails:
        disposition === "Hospitalization Required"
          ? { urgency: hospUrgency, wardType: hospWard, admissionReason: hospReason || assessment, estimatedStayDays: hospDays }
          : undefined,
      referralDetails:
        disposition === "Specialist Referral"
          ? { referredTo: refDoctor, facility: refFacility, reason: refReason || assessment, urgency: refUrgency }
          : undefined,
      differentialDiagnoses: aiAnalysis.differentials,
      liveTranscript: transcript.length > 0 ? transcript : undefined,
      aiGenerated: transcript.length > 0 || Boolean(assessment),
    });

    // Automatically create real Lab Orders in Patient Database
    selectedInvestigations.forEach((invName) => {
      const catItem = INVESTIGATION_CATALOG.find((c) => c.name === invName);
      addLabOrder({
        patientId: patient.id,
        doctorId: docId,
        testName: invName,
        category: catItem?.cat || "Diagnostics",
        priority: disposition === "Hospitalization Required" ? "urgent" : "routine",
        cost: catItem?.cost || 850,
      });
    });

    // Automatically send Prescription to Pharmacy Queue
    if (rxItems.length > 0) {
      addPrescription({
        patientId: patient.id,
        doctorId: docId,
        diagnosis: assessment || chiefComplaint || "Clinical Consultation",
        items: rxItems,
        notes: planOfAction,
        sentViaWhatsApp: true,
      });
    }

    // Reset form
    setChiefComplaint("");
    setSymptoms([]);
    setAssessment("");
    setPlanOfAction("");
    setSelectedInvestigations([]);
    setRxItems([]);
    setTranscript([]);
    notify(
      "Full Consultation Saved to Patient Database",
      `${selectedInvestigations.length} lab orders & ${rxItems.length} Rx items synced automatically`
    );
  };

  if (!isDoctorAuthorized) {
    return (
      <div className="bg-white rounded-2xl border border-amber-200 p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Doctor-Only Clinical AI Copilot & Consultation Workbench</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Diagnostic AI decision support, real-time meeting scribing, hospitalization orders, and prescribing are restricted to licensed <strong>Doctors / Medical Directors</strong>.
        </p>
        <button
          onClick={() => setRole("doctor")}
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
        >
          Switch to Doctor / Specialist Role
        </button>
      </div>
    );
  }

  const pastNotes = state.clinicalNotes.filter((n) => n.patientId === patient.id);

  return (
    <div className="space-y-5">
      {/* Doctor-Only Clinical AI Header + Real-Time Meeting Recorder */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-900 text-white rounded-2xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-[11px] font-semibold mb-1.5">
              <Stethoscope className="w-3.5 h-3.5" /> Doctor-Only Clinical AI Copilot • Live Meeting Scribe
            </div>
            <h2 className="text-base font-bold">Real-Time Consultation Recorder & Diagnostic Helping Hand</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Captures live doctor-patient conversation, extracts symptoms, exam findings & lab needs in real time, and suggests differential diagnoses & disposition.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isRecording ? (
              <button
                type="button"
                onClick={startLiveRecording}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm"
              >
                <Mic className="w-3.5 h-3.5" /> Start Live Recording
              </button>
            ) : (
              <button
                type="button"
                onClick={stopLiveRecording}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold animate-pulse"
              >
                <Square className="w-3.5 h-3.5" /> Stop Recording
              </button>
            )}
            {LIVE_MEETING_SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => runLiveScenarioStream(sc.id)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold"
              >
                <Play className="w-3 h-3 text-teal-300" /> Simulate: {sc.id === "osa-sleep" ? "Sleep Apnea" : "HDU Triage"}
              </button>
            ))}
          </div>
        </div>

        {/* Live Transcript Feed + Manual Live Utterance Input */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-8 bg-slate-950/60 border border-slate-700/80 rounded-xl p-3 max-h-44 overflow-y-auto space-y-2">
            {transcript.length === 0 ? (
              <div className="text-xs text-slate-400 py-5 text-center">
                Click <strong>Start Live Recording</strong>, run a <strong>Simulate</strong> meeting above, or type a live patient/doctor utterance on the right.
              </div>
            ) : (
              transcript.map((line, i) => (
                <div key={i} className="flex items-start justify-between gap-2 text-xs">
                  <div>
                    <span className={`font-bold mr-1.5 ${line.speaker === "Doctor" ? "text-teal-300" : "text-amber-300"}`}>
                      [{line.timestamp}] {line.speaker}:
                    </span>
                    <span className="text-slate-200">{line.text}</span>
                  </div>
                  {line.extractedTag && (
                    <span className="px-2 py-0.5 rounded bg-violet-500/25 border border-violet-400/30 text-violet-200 text-[10px] font-semibold shrink-0">
                      AI Noted: {line.extractedTag}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="lg:col-span-4 bg-slate-950/50 border border-slate-700/80 rounded-xl p-3 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span className="font-semibold flex items-center gap-1">
                {isRecording ? <Mic className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> : <MicOff className="w-3.5 h-3.5 text-slate-400" />}
                Live Meeting Feed
              </span>
              <select
                value={meetingSpeaker}
                onChange={(e) => setMeetingSpeaker(e.target.value as "Doctor" | "Patient")}
                className="bg-slate-800 text-white border border-slate-600 rounded px-2 py-0.5 text-[11px]"
              >
                <option value="Patient">Speaker: Patient</option>
                <option value="Doctor">Speaker: Doctor</option>
              </select>
            </div>
            <textarea
              rows={2}
              value={liveUtterance}
              onChange={(e) => setLiveUtterance(e.target.value)}
              placeholder="Add real-time statement (e.g. 'Patient has loud snoring, cough and fever')..."
              className="w-full p-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={() => {
                ingestLiveLine(meetingSpeaker, liveUtterance);
                setLiveUtterance("");
              }}
              className="w-full py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-semibold flex items-center justify-center gap-1"
            >
              <Send className="w-3 h-3" /> Note in Real Time
            </button>
          </div>
        </div>
      </div>

      {/* Main Split: Structured Consultation Editor (Left) + Doctor AI Helping Hand (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <form onSubmit={handleSaveFullConsultation} className="xl:col-span-7 space-y-4">
          {/* 1. Symptoms & Chief Complaint */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">1. Chief Complaint & Symptoms</h3>
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value as ClinicalNote["templateType"])}
                className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1 bg-slate-50"
              >
                <option value="Pulmonology & Sleep">Pulmonology & Sleep</option>
                <option value="SOAP">Standard SOAP</option>
                <option value="Ayurveda Prakriti">Ayurveda Prakriti</option>
                <option value="Physiotherapy ROM">Physiotherapy ROM</option>
                <option value="Dermatology">Dermatology</option>
              </select>
            </div>

            <input
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="Chief complaint & duration (e.g., Persistent nocturnal cough & snoring for 3 months)..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />

            <div className="flex flex-wrap gap-1.5">
              {COMMON_SYMPTOMS_CHIPS.map((chip) => {
                const active = symptoms.includes(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() =>
                      setSymptoms((prev) => (prev.includes(chip) ? prev.filter((x) => x !== chip) : [...prev, chip]))
                    }
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
                      active
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {active ? "✓ " : "+ "}
                    {chip}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <input
                value={customSymptom}
                onChange={(e) => setCustomSymptom(e.target.value)}
                placeholder="Add custom symptom (e.g., Hemoptysis, Orthopnea)..."
                className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl"
              />
              <button
                type="button"
                onClick={() => {
                  addSymptomUnique(customSymptom);
                  setCustomSymptom("");
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold"
              >
                + Add
              </button>
            </div>

            {symptoms.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {symptoms.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
                    {s}
                    <button type="button" onClick={() => setSymptoms((prev) => prev.filter((x) => x !== s))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 2. On-Examination Findings */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">2. On-Examination Findings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-500">General Exam</label>
                <input value={examGeneral} onChange={(e) => setExamGeneral(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500">Respiratory / Chest Auscultation</label>
                <input value={examResp} onChange={(e) => setExamResp(e.target.value)} placeholder="e.g., Bilateral wheeze, basal crackles, SpO2..." className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500">Cardiovascular (CVS)</label>
                <input value={examCvs} onChange={(e) => setExamCvs(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500">ENT / Airway (Mallampati / Nasal)</label>
                <input value={examEnt} onChange={(e) => setExamEnt(e.target.value)} placeholder="e.g., Mallampati III, DNS, turbinate hypertrophy..." className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl" />
              </div>
            </div>
            <input value={examSystemic} onChange={(e) => setExamSystemic(e.target.value)} placeholder="Other Systemic / Neurological / Abdomen findings..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
          </div>

          {/* 3. Lab Tests & Investigations Required */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4 text-indigo-600" /> 3. Lab Tests & Investigations Required ({selectedInvestigations.length})
              </h3>
              <span className="text-[11px] text-indigo-600 font-semibold">Auto-creates Lab Orders on Save</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INVESTIGATION_CATALOG.map((inv) => {
                const checked = selectedInvestigations.includes(inv.name);
                return (
                  <label
                    key={inv.name}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                      checked ? "bg-indigo-50 border-indigo-400 text-indigo-950" : "bg-slate-50 border-slate-200/80 text-slate-700"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input type="checkbox" checked={checked} onChange={() => toggleInvestigation(inv.name)} className="rounded text-indigo-600" />
                      <span className="font-medium">{inv.name}</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">₹{inv.cost}</span>
                  </label>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input value={customInv} onChange={(e) => setCustomInv(e.target.value)} placeholder="Other investigation (e.g., Bronchoscopy, D-Dimer)..." className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl" />
              <button
                type="button"
                onClick={() => {
                  if (customInv.trim()) {
                    toggleInvestigation(customInv.trim());
                    setCustomInv("");
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold"
              >
                + Add Test
              </button>
            </div>
          </div>

          {/* 4. Medicines Prescribed */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-teal-600" /> 4. Medicines Prescribed ({rxItems.length})
              </h3>
              <span className="text-[11px] text-teal-700 font-semibold">Auto-sent to Pharmacy Queue</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <select value={selInvId} onChange={(e) => setSelInvId(e.target.value)} className="sm:col-span-5 px-2.5 py-2 text-xs border border-slate-200 rounded-xl bg-white">
                {state.inventory.map((i) => (
                  <option key={i.id} value={i.id}>{i.name} ({i.stock} left)</option>
                ))}
              </select>
              <select value={rxFreq} onChange={(e) => setRxFreq(e.target.value)} className="sm:col-span-2 px-2 py-2 text-xs border border-slate-200 rounded-xl bg-white">
                <option value="1-0-1">1-0-1</option>
                <option value="1-0-0">1-0-0</option>
                <option value="0-0-1">0-0-1</option>
                <option value="1-1-1">1-1-1</option>
                <option value="SOS">SOS</option>
              </select>
              <select value={rxTiming} onChange={(e) => setRxTiming(e.target.value as PrescriptionItem["timing"])} className="sm:col-span-2 px-2 py-2 text-xs border border-slate-200 rounded-xl bg-white">
                <option value="After Food">After Food</option>
                <option value="Before Food">Before Food</option>
                <option value="Bedtime">Bedtime</option>
              </select>
              <input type="number" min={1} value={rxDays} onChange={(e) => setRxDays(Number(e.target.value))} className="sm:col-span-1 px-2 py-2 text-xs border border-slate-200 rounded-xl" />
              <button type="button" onClick={handleAddMedicine} className="sm:col-span-2 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center justify-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {rxItems.length > 0 && (
              <div className="space-y-1.5">
                {rxItems.map((it) => (
                  <div key={it.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span><strong>{it.medicineName}</strong> • {it.frequency} ({it.timing}) x {it.durationDays}d</span>
                    <button type="button" onClick={() => setRxItems((prev) => prev.filter((x) => x.id !== it.id))} className="text-rose-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Diagnosis, Plan of Action & Hospitalization / Referral */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3.5">
            <h3 className="text-sm font-bold text-slate-900">5. Diagnosis, Plan of Action & Disposition (Hospitalization / Referral)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input value={assessment} onChange={(e) => setAssessment(e.target.value)} placeholder="Working / Final Diagnosis..." className="sm:col-span-2 px-3 py-2 text-xs border border-slate-200 rounded-xl" />
              <input value={icdCode} onChange={(e) => setIcdCode(e.target.value)} placeholder="ICD-10 (e.g. G47.33)" className="px-3 py-2 text-xs border border-slate-200 rounded-xl" />
            </div>

            <textarea
              rows={3}
              value={planOfAction}
              onChange={(e) => setPlanOfAction(e.target.value)}
              placeholder="Clinical Plan of Action, Monitoring Instructions & Red-Flag Return Advice..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />

            {/* Disposition Selector */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Care Disposition</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1.5">
                {(["Outpatient Follow-Up", "Hospitalization Required", "Specialist Referral"] as ConsultationDisposition[]).map((disp) => (
                  <button
                    key={disp}
                    type="button"
                    onClick={() => setDisposition(disp)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${
                      disposition === disp
                        ? disp === "Hospitalization Required"
                          ? "bg-rose-600 text-white border-rose-600"
                          : disp === "Specialist Referral"
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-teal-600 text-white border-teal-600"
                        : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    {disp === "Hospitalization Required" && <BedDouble className="w-3.5 h-3.5" />}
                    {disp === "Specialist Referral" && <Share2 className="w-3.5 h-3.5" />}
                    {disp}
                  </button>
                ))}
              </div>
            </div>

            {disposition === "Hospitalization Required" && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2.5 text-xs">
                <div className="font-bold text-rose-900 flex items-center gap-1.5">
                  <BedDouble className="w-4 h-4" /> Inpatient Admission Order
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select value={hospUrgency} onChange={(e) => setHospUrgency(e.target.value as typeof hospUrgency)} className="px-2.5 py-2 rounded-lg border border-rose-200 bg-white">
                    <option value="Immediate / ER">Immediate / ER Admission</option>
                    <option value="Elective Admission">Elective Admission</option>
                  </select>
                  <select value={hospWard} onChange={(e) => setHospWard(e.target.value as typeof hospWard)} className="px-2.5 py-2 rounded-lg border border-rose-200 bg-white">
                    <option value="ICU / Respiratory HDU">ICU / Respiratory HDU</option>
                    <option value="General Ward">General Medical Ward</option>
                    <option value="Sleep Lab Overnight">Overnight Sleep Lab</option>
                  </select>
                  <input type="number" min={1} value={hospDays} onChange={(e) => setHospDays(Number(e.target.value))} placeholder="Est. Days" className="px-2.5 py-2 rounded-lg border border-rose-200 bg-white" />
                </div>
                <input value={hospReason} onChange={(e) => setHospReason(e.target.value)} placeholder="Admission indication & monitoring orders (e.g., SpO2 < 90%, IV steroids, continuous pulse oximetry)..." className="w-full px-3 py-2 rounded-lg border border-rose-200 bg-white" />
              </div>
            )}

            {disposition === "Specialist Referral" && (
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2.5 text-xs">
                <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <Share2 className="w-4 h-4" /> Specialist / Higher-Center Referral
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input value={refDoctor} onChange={(e) => setRefDoctor(e.target.value)} placeholder="Referred Specialist / Dept" className="px-2.5 py-2 rounded-lg border border-indigo-200 bg-white" />
                  <input value={refFacility} onChange={(e) => setRefFacility(e.target.value)} placeholder="Hospital / Centre" className="px-2.5 py-2 rounded-lg border border-indigo-200 bg-white" />
                  <select value={refUrgency} onChange={(e) => setRefUrgency(e.target.value as typeof refUrgency)} className="px-2.5 py-2 rounded-lg border border-indigo-200 bg-white">
                    <option value="Routine">Routine Referral</option>
                    <option value="Urgent">Urgent / Same-Day</option>
                  </select>
                </div>
                <input value={refReason} onChange={(e) => setRefReason(e.target.value)} placeholder="Reason for referral & clinical summary..." className="w-full px-3 py-2 rounded-lg border border-indigo-200 bg-white" />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" /> Save Consultation, Labs, Rx & Disposition to Patient Database
            </button>
          </div>
        </form>

        {/* Right Column: Doctor AI Clinical Helping Hand + Past Saved Consultations */}
        <div className="xl:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-violet-200 p-5 space-y-4 shadow-2xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 text-[10px] font-bold">
                  <Bot className="w-3 h-3" /> DOCTOR-ONLY CLINICAL CDSS
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">AI Diagnostic & Plan Helping Hand</h3>
                <p className="text-[11px] text-slate-500">Live synthesis of symptoms, vitals, allergies & exam</p>
              </div>
              <button
                type="button"
                onClick={applyAiToChart}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" /> Apply to Chart
              </button>
            </div>

            {aiAnalysis.redFlags.length > 0 && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                <div className="text-xs font-bold text-rose-800 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Clinical Red-Flag Alerts
                </div>
                {aiAnalysis.redFlags.map((rf) => (
                  <div key={rf} className="text-[11px] text-rose-900">• {rf}</div>
                ))}
              </div>
            )}

            {/* Differential Diagnoses */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">AI Differential Diagnoses</div>
              {aiAnalysis.differentials.map((d) => (
                <div key={d.condition} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{d.condition} ({d.icdCode})</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      d.likelihood === "High" ? "bg-teal-100 text-teal-800" : d.likelihood === "Rule Out" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"
                    }`}>
                      {d.likelihood}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">{d.rationale}</div>
                </div>
              ))}
            </div>

            {/* Recommended Exam & Investigations */}
            <div className="space-y-1.5 text-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Suggested Exam & Investigations</div>
              <div className="p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-1">
                {aiAnalysis.recommendedExamChecks.map((c) => (
                  <div key={c} className="text-[11px] text-slate-700">✓ Exam: {c}</div>
                ))}
                {aiAnalysis.recommendedInvestigations.map((inv) => (
                  <div key={inv} className="text-[11px] font-semibold text-indigo-800">• Test: {inv}</div>
                ))}
              </div>
            </div>

            {/* Suggested Medications (Allergy-Checked) */}
            <div className="space-y-1.5 text-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Allergy-Checked Medication Guide</div>
              {aiAnalysis.suggestedMedicines.map((m) => (
                <div key={m.name} className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-[11px]">
                  <div className="font-bold text-slate-900">{m.name} — <span className="text-emerald-700">{m.dosage}</span></div>
                  <div className="text-slate-600">{m.rationale}</div>
                  {m.allergyWarning && <div className="text-rose-700 font-bold mt-0.5">⚠ {m.allergyWarning}</div>}
                </div>
              ))}
            </div>

            {/* Disposition Recommendation */}
            <div className={`p-3 rounded-xl border text-xs ${
              aiAnalysis.dispositionAdvice === "Hospitalization Required"
                ? "bg-rose-50 border-rose-200 text-rose-900"
                : aiAnalysis.dispositionAdvice === "Specialist Referral"
                ? "bg-indigo-50 border-indigo-200 text-indigo-900"
                : "bg-teal-50 border-teal-200 text-teal-900"
            }`}>
              <div className="font-bold">AI Disposition Recommendation: {aiAnalysis.dispositionAdvice}</div>
              <div className="text-[11px] mt-0.5">{aiAnalysis.dispositionRationale}</div>
            </div>
          </div>

          {/* Saved Consultation History in Patient Database */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-600" /> Saved Patient Consultations ({pastNotes.length})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pastNotes.map((n) => (
                <div key={n.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-[10px] font-bold">{n.templateType}</span>
                    <span className="text-[11px] text-slate-400">{n.createdAt}</span>
                  </div>
                  <div className="font-bold text-slate-900">{n.chiefComplaint}</div>
                  {n.symptoms && n.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {n.symptoms.map((s) => (
                        <span key={s} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-medium">{s}</span>
                      ))}
                    </div>
                  )}
                  <div className="text-slate-600"><strong>Assessment:</strong> {n.assessment} {n.icdCode ? `(${n.icdCode})` : ""}</div>
                  <div className="text-slate-600"><strong>Plan:</strong> {n.plan}</div>
                  {n.investigationsRequired && n.investigationsRequired.length > 0 && (
                    <div className="text-[11px] text-indigo-700"><strong>Investigations:</strong> {n.investigationsRequired.join(", ")}</div>
                  )}
                  {n.disposition && (
                    <div className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      n.disposition === "Hospitalization Required"
                        ? "bg-rose-100 text-rose-700"
                        : n.disposition === "Specialist Referral"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {n.disposition}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
