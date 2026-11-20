import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpDown,
  Bold,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Eraser,
  FileText,
  FlaskConical,
  Globe,
  History,
  Italic,
  List,
  Lock,
  Mic,
  MicOff,
  PenTool,
  Pill,
  Play,
  Plus,
  Printer,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  Stethoscope,
  Unlock,
  UploadCloud,
  Video,
  X,
} from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import {
  ADVICE_CHIPS,
  extractEntitiesFromUtterance,
  FREQUENT_DIAGNOSES,
  FREQUENT_LAB_TESTS,
  FREQUENT_MEDICATIONS,
  FREQUENT_SYMPTOMS,
  LIVE_MEETING_SCENARIOS,
  MEDICAL_HISTORY_CHIPS,
  translateInstructionToHindi,
} from "../data/medicalKnowledge";
import { PrescriptionDraft, RxDraftMedication } from "../types/clinic";

type PadMode = "overview" | "pad" | "canvas" | "records";
type DrawerTab = "past-visits" | "history" | "vitals";
type DropdownType = "symptoms" | "diagnosis" | "medications" | "labs" | null;

export const PrescriptionPadPage: React.FC = () => {
  const {
    state,
    activeRxId,
    setActivePage,
    openPatientVisitHub,
    savePrescriptionDraft,
    pushPrescriptionUpdates,
    finishPrescription,
    linkPatientAbha,
    setDoctorAiOpen,
    voiceRxAutoStart,
    setVoiceRxAutoStart,
    notify,
  } = useClinic();

  const draft: PrescriptionDraft | undefined =
    state.prescriptionDrafts.find((d) => d.id === activeRxId) ||
    state.prescriptionDrafts[0];

  const patient = state.patients.find((p) => p.id === draft?.patientId) || state.patients[0];

  const [padMode, setPadMode] = useState<PadMode>("pad");
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("past-visits");
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const [showCollabToast, setShowCollabToast] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showAbhaModal, setShowAbhaModal] = useState(false);
  const [abhaInput, setAbhaInput] = useState("");
  const [showTemplatesMenu, setShowTemplatesMenu] = useState(false);

  // Inputs
  const [symptomQuery, setSymptomQuery] = useState("");
  const [diagQuery, setDiagQuery] = useState("");
  const [medQuery, setMedQuery] = useState("");
  const [labQuery, setLabQuery] = useState("");
  const [customSectionTitle, setCustomSectionTitle] = useState("");
  const [addingCustomSection, setAddingCustomSection] = useState(false);
  const [aiPatientSummary, setAiPatientSummary] = useState<string | null>(null);

  // ClinScribe Voice Drawer
  const [scribeOpen, setScribeOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [scribeLines, setScribeLines] = useState<Array<{ speaker: "Doctor" | "Patient"; text: string; tag?: string }>>([]);
  const [manualUtterance, setManualUtterance] = useState("");
  const streamTimerRef = useRef<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speechRecRef = useRef<any>(null);

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [penColor, setPenColor] = useState("#0f172a");
  const [penWidth, setPenWidth] = useState(2.5);

  const dropdownContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (dropdownContainerRef.current && !dropdownContainerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (voiceRxAutoStart) {
      setScribeOpen(true);
      setVoiceRxAutoStart(false);
    }
  }, [voiceRxAutoStart, setVoiceRxAutoStart]);

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

  if (!draft || !patient) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
        <h2 className="text-base font-bold text-slate-900">No Active Prescription Selected</h2>
        <p className="text-xs text-slate-500">Pick a patient from the OPD Queue and click "Write" to open Prescription Pad v2.</p>
        <button
          onClick={() => setActivePage("queue")}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
        >
          Back to OPD Queue
        </button>
      </div>
    );
  }

  const updateDraft = (patch: Partial<PrescriptionDraft>) => {
    savePrescriptionDraft(draft.id, patch);
  };

  const updateVitals = (field: keyof PrescriptionDraft["vitals"], value: string) => {
    const next = { ...draft.vitals, [field]: value };
    const h = parseFloat(field === "heightCm" ? value : next.heightCm);
    const w = parseFloat(field === "weightKg" ? value : next.weightKg);
    if (h > 0 && w > 0) {
      next.bmi = (w / Math.pow(h / 100, 2)).toFixed(1);
    }
    updateDraft({ vitals: next });
  };

  const toggleVitalLock = (field: string) => {
    const locked = draft.vitals.lockedFields.includes(field)
      ? draft.vitals.lockedFields.filter((f) => f !== field)
      : [...draft.vitals.lockedFields, field];
    updateDraft({ vitals: { ...draft.vitals, lockedFields: locked } });
  };

  const toggleHistoryChip = (tag: string) => {
    const exists = draft.medicalHistoryTags.includes(tag);
    const next = exists
      ? draft.medicalHistoryTags.filter((t) => t !== tag)
      : [...draft.medicalHistoryTags, tag];
    updateDraft({ medicalHistoryTags: next, noKnownMedicalHistory: false });
  };

  const addSymptom = (name: string, icdCode?: string) => {
    const clean = name.trim();
    if (!clean || draft.symptoms.some((s) => s.name.toLowerCase() === clean.toLowerCase())) return;
    updateDraft({ symptoms: [...draft.symptoms, { name: clean, icdCode }] });
    setSymptomQuery("");
  };

  const addDiagnosis = (name: string, icdCode?: string) => {
    const clean = name.trim();
    if (!clean || draft.diagnoses.some((d) => d.name.toLowerCase() === clean.toLowerCase())) return;
    updateDraft({ diagnoses: [...draft.diagnoses, { name: clean, icdCode }] });
    setDiagQuery("");
  };

  const addMedication = (med: {
    brandName: string;
    genericComposition?: string;
    dosage: string;
    frequency: string;
    timing: RxDraftMedication["timing"];
    durationDays: number;
    inventoryId?: string;
  }) => {
    const newMed: RxDraftMedication = {
      id: `rxm-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      inventoryItemId: med.inventoryId,
      brandName: med.brandName,
      genericComposition: med.genericComposition,
      dosage: med.dosage,
      frequency: med.frequency,
      timing: med.timing,
      durationDays: med.durationDays,
      instructions: `${med.dosage} • ${med.frequency} • ${med.timing} • ${med.durationDays} days`,
      hindiInstructions: translateInstructionToHindi(med.dosage, med.frequency, med.timing, med.durationDays),
    };
    updateDraft({ medications: [...draft.medications, newMed] });
    setMedQuery("");
    setOpenDropdown(null);
  };

  const addLabTest = (testName: string) => {
    const clean = testName.trim();
    if (!clean || draft.labInvestigations.includes(clean)) return;
    updateDraft({ labInvestigations: [...draft.labInvestigations, clean] });
    setLabQuery("");
  };

  // ClinScribe Voice Ingestion
  const ingestUtterance = (speaker: "Doctor" | "Patient", text: string) => {
    const clean = text.trim();
    if (!clean) return;
    const extracted = extractEntitiesFromUtterance(clean);
    setScribeLines((prev) => [...prev, { speaker, text: clean, tag: extracted.tag }]);

    const nextSymptoms = [...draft.symptoms];
    extracted.symptoms.forEach((s) => {
      if (!nextSymptoms.some((x) => x.name.toLowerCase() === s.toLowerCase())) {
        nextSymptoms.push({ name: s });
      }
    });
    const nextLabs = [...draft.labInvestigations];
    extracted.investigations.forEach((l) => {
      if (!nextLabs.includes(l)) nextLabs.push(l);
    });

    updateDraft({
      symptoms: nextSymptoms,
      labInvestigations: nextLabs,
      examinationFindings: extracted.examNote
        ? draft.examinationFindings
          ? `${draft.examinationFindings}; ${extracted.examNote}`
          : extracted.examNote
        : draft.examinationFindings,
    });
  };

  const toggleMicrophone = () => {
    if (isRecording) {
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
      return;
    }

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
          if (last?.[0]?.transcript) ingestUtterance("Patient", last[0].transcript);
        };
        rec.start();
        speechRecRef.current = rec;
        notify("ClinScribe listening...", "Speak symptoms, exam findings or tests", "info");
        return;
      } catch {
        // fallback
      }
    }
    notify("ClinScribe active", "Type utterance or run a sample consultation stream", "info");
  };

  const runSampleScribeStream = (scenarioId: string) => {
    const scenario = LIVE_MEETING_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return;
    if (streamTimerRef.current) window.clearInterval(streamTimerRef.current);
    setScribeLines([]);
    setIsRecording(true);
    let idx = 0;
    ingestUtterance(scenario.lines[0].speaker, scenario.lines[0].text);
    idx = 1;
    streamTimerRef.current = window.setInterval(() => {
      if (idx >= scenario.lines.length) {
        if (streamTimerRef.current) window.clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
        setIsRecording(false);
        notify("ClinScribe finished", "Symptoms, exam findings & labs populated in Pad");
        return;
      }
      const ln = scenario.lines[idx];
      ingestUtterance(ln.speaker, ln.text);
      idx += 1;
    }, 900);
  };

  const applyTemplate = (tpl: "asthma" | "osa" | "copd") => {
    if (tpl === "asthma") {
      updateDraft({
        symptoms: [{ name: "Cough", icdCode: "R05" }, { name: "Breathlessness", icdCode: "R06.02" }],
        diagnoses: [{ name: "NBA (Nocturnal / Bronchial Asthma)", icdCode: "J45.909" }],
        labInvestigations: ["Spirometry", "FENO - Fractional Exhaled Nitric Oxide Test", "IgE Immunoglobulin, Serum"],
        advices: "Use spacer with MDI inhaler; rinse mouth after puffs. Avoid dust & cold exposure.",
      });
      if (draft.medications.length === 0) {
        addMedication(FREQUENT_MEDICATIONS[5]);
        addMedication(FREQUENT_MEDICATIONS[2]);
      }
    } else if (tpl === "osa") {
      updateDraft({
        symptoms: [{ name: "Loud Snoring & Daytime Somnolence", icdCode: "R06.83" }],
        diagnoses: [{ name: "OSA - Obstructive sleep apnea", icdCode: "G47.33" }],
        labInvestigations: ["Polysomnography (Overnight Sleep Study)", "TSH (Thyroid Stimulating Hormone)"],
        advices: "Positional sleep therapy (lateral), avoid sedatives at bedtime, weight optimization.",
      });
    } else {
      updateDraft({
        symptoms: [{ name: "Breathlessness", icdCode: "R06.02" }, { name: "Cough", icdCode: "R05" }],
        diagnoses: [{ name: "COPD - Chronic obstructive pulmonary disease", icdCode: "J44.9" }],
        labInvestigations: ["Spirometry", "X-Ray Chest - PA View"],
        advices: "Complete smoking cessation; pneumococcal & annual influenza vaccination advised.",
      });
      if (draft.medications.length === 0) {
        addMedication(FREQUENT_MEDICATIONS[1]);
      }
    }
    setShowTemplatesMenu(false);
    notify("Clinical template applied to Prescription Pad");
  };

  const pastNotes = state.clinicalNotes.filter((n) => n.patientId === patient.id);
  const pastRxs = state.prescriptions.filter((r) => r.patientId === patient.id);

  // Canvas drawing handlers
  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    drawingRef.current = true;
  };
  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };
  const endDraw = () => {
    if (!drawingRef.current || !canvasRef.current) return;
    drawingRef.current = false;
    updateDraft({ canvasDataUrl: canvasRef.current.toDataURL() });
  };

  return (
    <div className="flex flex-col -m-4 lg:-m-6 min-h-[calc(100vh-3.5rem)] bg-slate-50">
      {/* Top Patient & Pad Utility Header (CliniFlow Prescription Pad v2) */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage("queue")}
            className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700"
            title="Back to OPD Queue"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div
            onClick={() => openPatientVisitHub(patient.id)}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
              {patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold uppercase tracking-wide text-slate-900 group-hover:text-blue-600">
                  {patient.name}
                </span>
                <span className="text-[11px] text-slate-500">
                  {patient.age}y | {patient.gender[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>{patient.uhid || patient.mrn}</span>
                <span>•</span>
                <span>{patient.phone}</span>
              </div>
            </div>
          </div>

          {/* Quick action icon pills */}
          <div className="hidden md:flex items-center gap-1.5 ml-2">
            <button
              onClick={() => openPatientVisitHub(patient.id)}
              className="p-1.5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100"
              title="Edit Patient Profile"
            >
              <PenTool className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => notify("Video Telehealth link copied for patient", "Google Meet link ready")}
              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
              title="Start Telehealth Video"
            >
              <Video className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowAbhaModal(true)}
              className={`p-1.5 rounded-lg ${
                patient.abhaStatus === "ABHA Linked"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-violet-50 text-violet-600 hover:bg-violet-100"
              }`}
              title={patient.abhaStatus === "ABHA Linked" ? `ABHA: ${patient.abhaId}` : "Link ABHA ID"}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Top Right Tooling */}
        <div className="flex flex-wrap items-center gap-2 relative">
          <button
            onClick={() => setDoctorAiOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50/70 text-blue-700 text-xs font-semibold hover:bg-blue-100"
          >
            <Sparkles className="w-3.5 h-3.5" />
            CliniFlow AI Assessments
          </button>

          <button
            onClick={() => setScribeOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
              scribeOpen || isRecording
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            ClinScribe
          </button>

          <div className="relative">
            <button
              onClick={() => setShowTemplatesMenu((v) => !v)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <span className="font-serif font-bold">T</span> Templates
            </button>
            {showTemplatesMenu && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-40">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase text-slate-400">Specialty Quick Templates</div>
                <button onClick={() => applyTemplate("asthma")} className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-blue-50 font-medium">
                  Bronchial Asthma / Allergy Workup
                </button>
                <button onClick={() => applyTemplate("osa")} className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-blue-50 font-medium">
                  Obstructive Sleep Apnea (OSA)
                </button>
                <button onClick={() => applyTemplate("copd")} className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-blue-50 font-medium">
                  COPD Maintenance & PFT
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setDrawerOpen((v) => !v)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            {drawerOpen ? "Hide Past Visits" : "Show Past Visits"}
          </button>
        </div>
      </div>

      {/* Mode Sub-Tabs (Overview | Pad | Canvas | Medical Records) */}
      <div className="bg-white border-b border-slate-200 px-6 flex items-center justify-center gap-6 text-xs">
        {(
          [
            { id: "overview", label: "Overview" },
            { id: "pad", label: "Pad" },
            { id: "canvas", label: "Canvas" },
            { id: "records", label: "Medical Records" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setPadMode(t.id)}
            className={`py-2.5 px-1 font-semibold border-b-2 transition ${
              padMode === t.id
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Live ClinScribe Ambient Voice Panel */}
      {scribeOpen && (
        <div className="bg-slate-900 text-white px-6 py-3.5 border-b border-slate-800 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? "bg-rose-500 animate-pulse" : "bg-emerald-400"}`} />
              <span className="text-xs font-bold">ClinScribe Voice-to-Prescription</span>
              <span className="text-[11px] text-slate-400">Live speech auto-populates Symptoms, Exam Findings & Lab Orders</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMicrophone}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                  isRecording ? "bg-rose-600 text-white" : "bg-teal-600 text-white"
                }`}
              >
                {isRecording ? <Square className="w-3 h-3" /> : <Mic className="w-3.5 h-3.5" />}
                {isRecording ? "Stop Mic" : "Start Mic"}
              </button>
              <button
                onClick={() => runSampleScribeStream("osa-sleep")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-semibold hover:bg-slate-700"
              >
                <Play className="w-3 h-3 text-emerald-400" /> Demo OSA Consult
              </button>
              <button
                onClick={() => runSampleScribeStream("severe-copd")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-semibold hover:bg-slate-700"
              >
                <Play className="w-3 h-3 text-amber-400" /> Demo COPD Consult
              </button>
              <button onClick={() => setScribeOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              value={manualUtterance}
              onChange={(e) => setManualUtterance(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  ingestUtterance("Patient", manualUtterance);
                  setManualUtterance("");
                }
              }}
              placeholder="Dictate or type clinical utterance (e.g. 'Patient has chronic cough, wheezing and fever; order spirometry')..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-400 outline-none"
            />
            <button
              onClick={() => {
                ingestUtterance("Patient", manualUtterance);
                setManualUtterance("");
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-xs font-semibold"
            >
              Extract
            </button>
          </div>

          {scribeLines.length > 0 && (
            <div className="max-h-24 overflow-y-auto space-y-1 text-[11px]">
              {scribeLines.map((l, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-200">
                  <span className={`font-bold ${l.speaker === "Doctor" ? "text-teal-300" : "text-sky-300"}`}>{l.speaker}:</span>
                  <span className="flex-1">{l.text}</span>
                  {l.tag && <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">{l.tag}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Workspace + Right Past Visits Sidebar */}
      <div className="flex-1 flex overflow-hidden relative" ref={dropdownContainerRef}>
        {/* Left/Center Main Pane */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-28 space-y-4">
          {padMode === "overview" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 max-w-4xl mx-auto">
              <h3 className="text-sm font-bold text-slate-900">Patient Snapshot — {patient.name}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500">UHID</div>
                  <div className="font-bold text-slate-900 mt-0.5">{patient.uhid || patient.mrn}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500">ABHA Status</div>
                  <div className="font-bold text-slate-900 mt-0.5">{patient.abhaStatus || "No ABHA"}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500">Known Allergies</div>
                  <div className="font-bold text-rose-700 mt-0.5">{patient.allergies.join(", ")}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500">Chronic Conditions</div>
                  <div className="font-bold text-slate-900 mt-0.5">{patient.chronicConditions.join(", ") || "None"}</div>
                </div>
              </div>
              <button onClick={() => setPadMode("pad")} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold">
                Return to Prescription Pad
              </button>
            </div>
          )}

          {padMode === "records" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Lab Reports & Uploaded Records ({state.labOrders.filter((l) => l.patientId === patient.id).length})</h3>
                <button onClick={() => setPadMode("pad")} className="text-xs font-semibold text-blue-600 hover:underline">
                  Back to Pad
                </button>
              </div>
              {state.labOrders
                .filter((l) => l.patientId === patient.id)
                .map((lab) => (
                  <div key={lab.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{lab.testName}</span>
                      <span className="capitalize text-emerald-700">{lab.status}</span>
                    </div>
                    <div className="text-slate-500">{lab.category} • Ordered {lab.orderedAt}</div>
                    {lab.resultsSummary && <div className="text-slate-700 pt-1">{lab.resultsSummary}</div>}
                  </div>
                ))}
              {state.labOrders.filter((l) => l.patientId === patient.id).length === 0 && (
                <div className="text-xs text-slate-400 py-6 text-center">No uploaded medical records yet for {patient.name}.</div>
              )}
            </div>
          )}

          {padMode === "canvas" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 max-w-4xl mx-auto">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Freehand Stylus / Prescription Canvas</h3>
                  <p className="text-xs text-slate-500">Sketch anatomical diagrams, lung fields, or handwritten Rx notes</p>
                </div>
                <div className="flex items-center gap-2">
                  {["#0f172a", "#1d4ed8", "#dc2626"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setPenColor(c)}
                      className={`w-6 h-6 rounded-full border-2 ${penColor === c ? "border-amber-400 scale-110" : "border-slate-200"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="range"
                    min={1}
                    max={6}
                    step={0.5}
                    value={penWidth}
                    onChange={(e) => setPenWidth(Number(e.target.value))}
                    className="w-20"
                  />
                  <button
                    onClick={() => {
                      const ctx = canvasRef.current?.getContext("2d");
                      if (ctx && canvasRef.current) {
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        updateDraft({ canvasDataUrl: undefined });
                      }
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50"
                  >
                    <Eraser className="w-3.5 h-3.5" /> Clear Canvas
                  </button>
                </div>
              </div>
              <canvas
                ref={canvasRef}
                width={780}
                height={420}
                onPointerDown={startDraw}
                onPointerMove={moveDraw}
                onPointerUp={endDraw}
                onPointerLeave={endDraw}
                className="w-full border border-slate-200 rounded-xl bg-slate-50/40 touch-none cursor-crosshair"
              />
            </div>
          )}

          {padMode === "pad" && (
            <div className="max-w-4xl mx-auto space-y-4">
              {/* 1. Vitals & Clinical Exam Card */}
              <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-600" /> Vitals
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => notify("Imported latest clinic vitals into Pad")}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Add Past Vitals
                    </button>
                    <span className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-500">
                      Configure
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {[
                    { key: "pulse" as const, label: "Pulse", unit: "/min" },
                    { key: "spo2" as const, label: "Peripheral oxygen saturation", unit: "%" },
                    { key: "bp" as const, label: "Blood pressure", unit: "mmHg" },
                    { key: "heightCm" as const, label: "Height", unit: "cm" },
                    { key: "weightKg" as const, label: "Body weight", unit: "kgs" },
                    { key: "bmi" as const, label: "BMI", unit: "kg/m2" },
                  ].map((v) => {
                    const locked = draft.vitals.lockedFields.includes(v.key);
                    return (
                      <div key={v.key} className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-600 w-28 shrink-0 leading-tight">{v.label}</span>
                        <div className="flex-1 flex items-center border border-slate-200 rounded-lg bg-slate-50/70 px-2 py-1">
                          <input
                            value={draft.vitals[v.key]}
                            disabled={locked}
                            onChange={(e) => updateVitals(v.key, e.target.value)}
                            className="w-full bg-transparent text-xs font-semibold text-slate-900 outline-none disabled:text-slate-600"
                          />
                          <span className="text-[10px] text-slate-400 ml-1 shrink-0">{v.unit}</span>
                        </div>
                        <button
                          onClick={() => toggleVitalLock(v.key)}
                          className={`p-1 rounded ${locked ? "text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
                          title={locked ? "Locked by Staff — click to unlock" : "Click to lock vital"}
                        >
                          {locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 w-28">Lymph nodes</span>
                    <input
                      value={draft.vitals.lymphNodes}
                      onChange={(e) => updateVitals("lymphNodes", e.target.value)}
                      placeholder="e.g. SUPRACLAVICULAR / NIL"
                      className="flex-1 px-2.5 py-1 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 w-28">ANEMIA</span>
                    <input
                      value={draft.vitals.anemia}
                      onChange={(e) => updateVitals("anemia", e.target.value)}
                      placeholder="Absent / Mild / Pallor"
                      className="flex-1 px-2.5 py-1 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </section>

              {/* 2. Medical History */}
              <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Medical History</h3>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.noKnownMedicalHistory}
                      onChange={(e) =>
                        updateDraft({
                          noKnownMedicalHistory: e.target.checked,
                          medicalHistoryTags: e.target.checked ? [] : draft.medicalHistoryTags,
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    No known medical history
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {MEDICAL_HISTORY_CHIPS.map((tag) => {
                    const active = draft.medicalHistoryTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleHistoryChip(tag)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium text-left transition ${
                          active
                            ? "bg-blue-50 border-blue-500 text-blue-800 font-semibold"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                          {active ? "✓" : "+"}
                        </span>
                        {tag}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {["Medications", "Family History", "LifeStyle Habit", "Food/Other Allergy", "Drug Allergy"].map((pill) => (
                    <button
                      key={pill}
                      type="button"
                      onClick={() => toggleHistoryChip(pill)}
                      className="px-2.5 py-1 rounded-full border border-blue-200 bg-blue-50/40 text-blue-700 text-[11px] font-semibold hover:bg-blue-100"
                    >
                      + {pill}
                    </button>
                  ))}
                </div>
              </section>

              {/* 3. Notes (Patient vs Private) */}
              <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5" />
                  </span>
                  Notes
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Notes for Patient (Treatment / Surgical / Others)
                    </div>
                    <textarea
                      rows={2}
                      value={draft.patientNotes}
                      onChange={(e) => updateDraft({ patientNotes: e.target.value })}
                      placeholder="Printed on patient prescription..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1 flex items-center justify-between">
                      <span>Private Notes</span>
                      <span className="text-emerald-600 font-semibold normal-case">These will not be printed</span>
                    </div>
                    <textarea
                      rows={2}
                      value={draft.privateNotes}
                      onChange={(e) => updateDraft({ privateNotes: e.target.value })}
                      placeholder="Internal clinical remarks..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-amber-50/30 text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </section>

              {/* 4. Symptoms (with FREQUENTLY popover) */}
              <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-2.5 relative">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <span className="w-5 h-5 rounded bg-sky-100 text-sky-700 flex items-center justify-center font-bold">*</span>
                  Symptoms
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-500 font-semibold">ICD-10</span>
                </div>

                {draft.symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {draft.symptoms.map((s) => (
                      <span key={s.name} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-xs font-semibold text-sky-900">
                        {s.name}
                        {s.icdCode && <span className="text-[10px] text-sky-600 font-mono">{s.icdCode}</span>}
                        <button
                          onClick={() => updateDraft({ symptoms: draft.symptoms.filter((x) => x.name !== s.name) })}
                          className="text-sky-500 hover:text-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <input
                    value={symptomQuery}
                    onFocus={() => setOpenDropdown("symptoms")}
                    onChange={(e) => {
                      setSymptomQuery(e.target.value);
                      setOpenDropdown("symptoms");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSymptom(symptomQuery);
                      }
                    }}
                    placeholder="Start typing Symptoms / Chief Complaints"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-500"
                  />

                  {openDropdown === "symptoms" && (
                    <div className="mt-1.5 bg-white rounded-xl border border-slate-200 shadow-lg p-2 z-30">
                      <div className="flex items-center justify-between px-2 py-1 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">FREQUENTLY</span>
                          <span className="text-[11px] text-slate-400">used by you</span>
                        </div>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1"><ArrowUpDown className="w-3 h-3" /> Specialty Ranked</span>
                      </div>
                      <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
                        {FREQUENT_SYMPTOMS.filter((s) => !symptomQuery || s.name.toLowerCase().includes(symptomQuery.toLowerCase())).map((sym) => (
                          <button
                            key={sym.name}
                            type="button"
                            onClick={() => addSymptom(sym.name, sym.icdCode)}
                            className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-slate-700 hover:bg-blue-50 rounded-lg text-left"
                          >
                            <span className="flex items-center gap-2 font-medium">
                              <span className="px-1 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500">Sx</span>
                              {sym.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{sym.icdCode}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* 5. Diagnosis (with FREQUENTLY popover) */}
              <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <span className="w-5 h-5 rounded bg-violet-100 text-violet-700 flex items-center justify-center font-bold">D</span>
                  Diagnosis
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-500 font-semibold">ICD-10</span>
                </div>

                {draft.diagnoses.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {draft.diagnoses.map((d) => (
                      <span key={d.name} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-50 border border-violet-200 text-xs font-semibold text-violet-900">
                        {d.name}
                        {d.icdCode && <span className="text-[10px] text-violet-600 font-mono">{d.icdCode}</span>}
                        <button
                          onClick={() => updateDraft({ diagnoses: draft.diagnoses.filter((x) => x.name !== d.name) })}
                          className="text-violet-500 hover:text-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <input
                    value={diagQuery}
                    onFocus={() => setOpenDropdown("diagnosis")}
                    onChange={(e) => {
                      setDiagQuery(e.target.value);
                      setOpenDropdown("diagnosis");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addDiagnosis(diagQuery);
                      }
                    }}
                    placeholder="Start typing Diagnosis"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-500"
                  />

                  {openDropdown === "diagnosis" && (
                    <div className="mt-1.5 bg-white rounded-xl border border-slate-200 shadow-lg p-2 z-30">
                      <div className="flex items-center gap-1.5 px-2 py-1 mb-1">
                        <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">FREQUENTLY</span>
                        <span className="text-[11px] text-slate-400">used by you</span>
                      </div>
                      <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                        {FREQUENT_DIAGNOSES.filter((d) => !diagQuery || d.name.toLowerCase().includes(diagQuery.toLowerCase())).map((diag) => (
                          <button
                            key={diag.name}
                            type="button"
                            onClick={() => addDiagnosis(diag.name, diag.icdCode)}
                            className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-slate-700 hover:bg-violet-50 rounded-lg text-left"
                          >
                            <span className="font-medium">{diag.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{diag.icdCode}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* 6. Examination Findings */}
              <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                <div className="text-xs font-bold text-slate-800">Examination Findings</div>
                <input
                  value={draft.examinationFindings}
                  onChange={(e) => updateDraft({ examinationFindings: e.target.value })}
                  placeholder="Start typing Findings (e.g. Bilateral vesicular breath sounds, Mallampati II)..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-500"
                />
              </section>

              {/* 7. Medications (with FREQUENTLY popover + Hindi/English Default Instructions) */}
              <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <span className="w-5 h-5 rounded bg-rose-100 text-rose-600 flex items-center justify-center">
                      <Pill className="w-3.5 h-3.5" />
                    </span>
                    Medications
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-slate-400">Default Instructions:</span>
                    <select
                      value={draft.instructionLanguage}
                      onChange={(e) => updateDraft({ instructionLanguage: e.target.value as "en" | "hi" })}
                      className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 font-semibold text-slate-700"
                    >
                      <option value="hi">हिंदी - Hindi</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>

                {draft.medications.length > 0 && (
                  <div className="space-y-2">
                    {draft.medications.map((m, idx) => (
                      <div key={m.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div>
                          <div className="font-bold text-slate-900">
                            {idx + 1}. {m.brandName}
                          </div>
                          {m.genericComposition && (
                            <div className="text-[10px] uppercase tracking-wide text-slate-400">{m.genericComposition}</div>
                          )}
                          <div className="text-[11px] text-blue-700 font-medium mt-1">
                            {draft.instructionLanguage === "hi" ? m.hindiInstructions : m.instructions}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <select
                            value={m.frequency}
                            onChange={(e) => {
                              const freq = e.target.value;
                              updateDraft({
                                medications: draft.medications.map((item) =>
                                  item.id === m.id
                                    ? {
                                        ...item,
                                        frequency: freq,
                                        instructions: `${item.dosage} • ${freq} • ${item.timing} • ${item.durationDays} days`,
                                        hindiInstructions: translateInstructionToHindi(item.dosage, freq, item.timing, item.durationDays),
                                      }
                                    : item
                                ),
                              });
                            }}
                            className="px-2 py-1 rounded border border-slate-200 bg-white text-[11px] font-semibold"
                          >
                            <option value="1-0-1">1-0-1</option>
                            <option value="1-0-0">1-0-0</option>
                            <option value="0-0-1">0-0-1</option>
                            <option value="1-1-1">1-1-1</option>
                            <option value="SOS">SOS</option>
                          </select>
                          <input
                            type="number"
                            min={1}
                            value={m.durationDays}
                            onChange={(e) => {
                              const days = Math.max(1, Number(e.target.value));
                              updateDraft({
                                medications: draft.medications.map((item) =>
                                  item.id === m.id
                                    ? {
                                        ...item,
                                        durationDays: days,
                                        instructions: `${item.dosage} • ${item.frequency} • ${item.timing} • ${days} days`,
                                        hindiInstructions: translateInstructionToHindi(item.dosage, item.frequency, item.timing, days),
                                      }
                                    : item
                                ),
                              });
                            }}
                            className="w-14 px-2 py-1 rounded border border-slate-200 bg-white text-[11px] font-semibold"
                          />
                          <span className="text-[10px] text-slate-400">days</span>
                          <button
                            onClick={() => updateDraft({ medications: draft.medications.filter((x) => x.id !== m.id) })}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <input
                    value={medQuery}
                    onFocus={() => setOpenDropdown("medications")}
                    onChange={(e) => {
                      setMedQuery(e.target.value);
                      setOpenDropdown("medications");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && medQuery.trim()) {
                        e.preventDefault();
                        addMedication({
                          brandName: medQuery.trim(),
                          dosage: "1 tablet",
                          frequency: "1-0-1",
                          timing: "After Food",
                          durationDays: 7,
                        });
                      }
                    }}
                    placeholder="Start typing Medicines"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-500"
                  />

                  {openDropdown === "medications" && (
                    <div className="mt-1.5 bg-white rounded-xl border border-slate-200 shadow-lg p-2 z-30">
                      <div className="flex items-center gap-1.5 px-2 py-1 mb-1">
                        <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">FREQUENTLY</span>
                        <span className="text-[11px] text-slate-400">prescribed by you</span>
                      </div>
                      <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                        {FREQUENT_MEDICATIONS.filter(
                          (m) =>
                            !medQuery ||
                            m.brandName.toLowerCase().includes(medQuery.toLowerCase()) ||
                            m.genericComposition.toLowerCase().includes(medQuery.toLowerCase())
                        ).map((med) => (
                          <button
                            key={med.brandName}
                            type="button"
                            onClick={() => addMedication(med)}
                            className="w-full flex items-center justify-between px-2.5 py-2 text-xs hover:bg-rose-50/70 rounded-lg text-left"
                          >
                            <div>
                              <div className="font-bold text-slate-800">{med.brandName}</div>
                              <div className="text-[10px] text-slate-400 uppercase">{med.genericComposition}</div>
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium shrink-0">
                              {med.dosage} | {med.frequency}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* 8. Lab Investigations (TESTS & PANELS) */}
              <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <span className="w-5 h-5 rounded bg-amber-100 text-amber-700 flex items-center justify-center">
                    <FlaskConical className="w-3.5 h-3.5" />
                  </span>
                  Lab Investigations
                </div>

                {draft.labInvestigations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {draft.labInvestigations.map((t) => (
                      <span key={t} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900">
                        {t}
                        <button
                          onClick={() => updateDraft({ labInvestigations: draft.labInvestigations.filter((x) => x !== t) })}
                          className="text-amber-600 hover:text-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <input
                    value={labQuery}
                    onFocus={() => setOpenDropdown("labs")}
                    onChange={(e) => {
                      setLabQuery(e.target.value);
                      setOpenDropdown("labs");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && labQuery.trim()) {
                        e.preventDefault();
                        addLabTest(labQuery);
                      }
                    }}
                    placeholder="Start typing Lab test / Radiology"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-500"
                  />

                  {openDropdown === "labs" && (
                    <div className="mt-1.5 bg-white rounded-xl border border-slate-200 shadow-lg p-2 z-30">
                      <div className="flex items-center gap-1.5 px-2 py-1 mb-1">
                        <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">TESTS & PANELS</span>
                        <span className="text-[11px] text-slate-400">suggested / prescribed by you</span>
                      </div>
                      <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                        {FREQUENT_LAB_TESTS.filter((l) => !labQuery || l.name.toLowerCase().includes(labQuery.toLowerCase())).map((lab) => (
                          <button
                            key={lab.name}
                            type="button"
                            onClick={() => addLabTest(lab.name)}
                            className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-slate-700 hover:bg-amber-50 rounded-lg text-left"
                          >
                            <span className="flex items-center gap-2 font-medium">
                              <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">Lab</span>
                              {lab.name}
                            </span>
                            <span className="text-[10px] text-slate-400">{lab.category} • ₹{lab.cost}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* 9. Lab Results */}
              <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold text-slate-800">Lab Results</div>
                  <div className="flex items-center gap-3 text-xs">
                    <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.printOnlyOutOfRange}
                        onChange={(e) => updateDraft({ printOnlyOutOfRange: e.target.checked })}
                        className="rounded text-blue-600"
                      />
                      Print only Out of range in Rx
                    </label>
                    <button
                      type="button"
                      onClick={() => setPadMode("records")}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold hover:bg-slate-50"
                    >
                      Browse Panels
                    </button>
                  </div>
                </div>
                <input
                  placeholder="Start typing a parameter (e.g. HbA1c: 6.9%, IgE: 420 IU/mL)..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      updateDraft({
                        labResults: [
                          ...draft.labResults,
                          { id: `lr-${Date.now()}`, parameter: val, value: "", unit: "", reference: "", outOfRange: true },
                        ],
                      });
                      (e.target as HTMLInputElement).value = "";
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-500"
                />
                {draft.labResults.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {draft.labResults.map((lr) => (
                      <span key={lr.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-medium">
                        {lr.parameter}
                        <button onClick={() => updateDraft({ labResults: draft.labResults.filter((x) => x.id !== lr.id) })}>
                          <X className="w-3 h-3 text-slate-400" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </section>

              {/* 10. Refer to a doctor, Follow Up & Advices */}
              <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                <div>
                  <div className="text-xs font-bold text-slate-800 mb-1.5">Refer to a doctor</div>
                  <input
                    value={draft.referToDoctor}
                    onChange={(e) => updateDraft({ referToDoctor: e.target.value })}
                    placeholder="Start typing doctor name or specialty (e.g. Dr. Rishabh Kacker - ENT)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" /> Follow Up
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={draft.followUpDays || 3}
                        onChange={(e) => updateDraft({ followUpDays: Number(e.target.value) })}
                        className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
                      />
                      <span className="text-xs text-slate-500">Days</span>
                      <button
                        type="button"
                        onClick={() => notify(`Follow-up slot reserved in ${draft.followUpDays || 3} days`)}
                        className="px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-50"
                      >
                        Book Slot
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[2, 3, 4, 6, 7, 15].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => updateDraft({ followUpDays: d })}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            draft.followUpDays === d ? "bg-blue-600 border-blue-600 text-white" : "bg-slate-50 border-slate-200 text-slate-600"
                          }`}
                        >
                          {d} Days
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-800">Advices</div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Bold className="w-3.5 h-3.5" />
                        <Italic className="w-3.5 h-3.5" />
                        <List className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      value={draft.advices}
                      onChange={(e) => updateDraft({ advices: e.target.value })}
                      placeholder="Patient instructions & lifestyle advices..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-500"
                    />
                    <div className="flex flex-wrap gap-1">
                      {ADVICE_CHIPS.slice(0, 4).map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() =>
                            updateDraft({
                              advices: draft.advices ? `${draft.advices}\n• ${chip}` : `• ${chip}`,
                            })
                          }
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 text-[10px] text-slate-600 hover:text-blue-700 font-medium text-left"
                        >
                          + {chip.slice(0, 34)}...
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* 11. Injections, Procedures & Custom Sections */}
              <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-800 mb-1">Injections</div>
                    <input
                      value={draft.injections}
                      onChange={(e) => updateDraft({ injections: e.target.value })}
                      placeholder="Add clinic injections / nebulization..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 mb-1">Procedures</div>
                    <input
                      value={draft.procedures}
                      onChange={(e) => updateDraft({ procedures: e.target.value })}
                      placeholder="Add procedures (e.g. PFT, CPAP Titration)..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {draft.customSections.map((cs) => (
                  <div key={cs.id} className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                      <span>{cs.title}</span>
                      <button
                        onClick={() =>
                          updateDraft({ customSections: draft.customSections.filter((x) => x.id !== cs.id) })
                        }
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={cs.content}
                      onChange={(e) =>
                        updateDraft({
                          customSections: draft.customSections.map((x) =>
                            x.id === cs.id ? { ...x, content: e.target.value } : x
                          ),
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>
                ))}

                {addingCustomSection ? (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      value={customSectionTitle}
                      onChange={(e) => setCustomSectionTitle(e.target.value)}
                      placeholder="Section title (e.g. Diet / Immunization)..."
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                    />
                    <button
                      onClick={() => {
                        if (!customSectionTitle.trim()) return;
                        updateDraft({
                          customSections: [
                            ...draft.customSections,
                            { id: `cs-${Date.now()}`, title: customSectionTitle.trim(), content: "" },
                          ],
                        });
                        setCustomSectionTitle("");
                        setAddingCustomSection(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                    >
                      Add
                    </button>
                    <button onClick={() => setAddingCustomSection(false)} className="text-xs text-slate-500">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingCustomSection(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline pt-1"
                  >
                    <span className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                    Custom Section
                  </button>
                )}
              </section>
            </div>
          )}
        </div>

        {/* Right Contextual Sidebar (Past Visits / H / V) */}
        {drawerOpen && (
          <aside className="hidden lg:flex w-80 xl:w-96 bg-white border-l border-slate-200 flex-col shrink-0 pb-20">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <History className="w-4 h-4" />
                <button
                  onClick={() => setDrawerTab("past-visits")}
                  className={`px-2 py-0.5 rounded-full ${drawerTab === "past-visits" ? "bg-white text-blue-700" : "text-white/80"}`}
                >
                  Past Visits
                </button>
                <button
                  onClick={() => setDrawerTab("history")}
                  className={`px-2 py-0.5 rounded-full ${drawerTab === "history" ? "bg-white text-blue-700" : "text-white/80"}`}
                >
                  H
                </button>
                <button
                  onClick={() => setDrawerTab("vitals")}
                  className={`px-2 py-0.5 rounded-full ${drawerTab === "vitals" ? "bg-white text-blue-700" : "text-white/80"}`}
                >
                  V
                </button>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
              {drawerTab === "past-visits" && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <button
                      onClick={() => openPatientVisitHub(patient.id)}
                      className="font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
                    >
                      See all Past Visits <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      const summary = `${patient.name} (${patient.age}y ${patient.gender}) • Conditions: ${patient.chronicConditions.join(", ") || "None"} • Past Visits: ${pastNotes.length} notes, ${pastRxs.length} prescriptions. Latest BP ${draft.vitals.bp}, SpO2 ${draft.vitals.spo2}%.`;
                      setAiPatientSummary(summary);
                    }}
                    className="w-full py-2 px-3 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Generate patient summary
                  </button>
                  <div className="text-[10px] text-center text-slate-400">Powered by CliniFlow DocAssist AI</div>

                  {aiPatientSummary && (
                    <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 space-y-1">
                      <div className="font-bold text-indigo-800">AI Clinical Summary</div>
                      <p className="leading-relaxed">{aiPatientSummary}</p>
                    </div>
                  )}

                  {pastNotes.map((note) => (
                    <div key={note.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{note.createdAt}</span>
                        <button
                          onClick={() => {
                            note.symptoms.forEach((s) => addSymptom(s));
                            notify("Copied past visit symptoms into current Pad");
                          }}
                          className="text-[11px] font-semibold text-blue-600 hover:underline"
                        >
                          Copy to Pad
                        </button>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400">Symptoms: </span>
                        <span className="text-slate-700">{note.symptoms.join(", ") || note.chiefComplaint}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400">Diagnosis: </span>
                        <span className="text-slate-800 font-medium">{note.assessment}</span>
                      </div>
                      {note.medicinesSummary && (
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400">Medicines: </span>
                          <span className="text-slate-600">{note.medicinesSummary.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {pastRxs.map((rx) => (
                    <div key={rx.id} className="p-3 rounded-xl border border-slate-200 bg-white space-y-1 text-xs">
                      <div className="font-bold text-slate-900">{rx.createdAt}</div>
                      <div className="text-[11px] text-slate-500">{rx.diagnosis}</div>
                      <ul className="text-[11px] text-slate-700 space-y-0.5">
                        {rx.items.map((it) => (
                          <li key={it.id}>• {it.medicineName} ({it.frequency})</li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {pastNotes.length === 0 && pastRxs.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-400">
                      You can see your patient's past visits here
                    </div>
                  )}
                </>
              )}

              {drawerTab === "history" && (
                <div className="space-y-2 text-xs">
                  <div className="font-bold text-slate-800">Chronic Conditions & Allergies</div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div><strong>Allergies:</strong> {patient.allergies.join(", ")}</div>
                    <div><strong>Conditions:</strong> {patient.chronicConditions.join(", ") || "None"}</div>
                    <div><strong>Medical History Tags:</strong> {draft.medicalHistoryTags.join(", ") || "None"}</div>
                  </div>
                </div>
              )}

              {drawerTab === "vitals" && (
                <div className="space-y-2 text-xs">
                  <div className="font-bold text-slate-800">Recorded Vitals Trend ({patient.vitals.length})</div>
                  {patient.vitals.slice().reverse().map((v) => (
                    <div key={v.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                      <div className="font-bold text-slate-900">{v.recordedAt}</div>
                      <div className="text-slate-600">
                        BP: {v.bpSystolic}/{v.bpDiastolic} • HR: {v.heartRate} • SpO2: {v.spo2}% • Wt: {v.weightKg}kg
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Staff Doctor Collaboration Toast + Sticky Blue Bottom Bar */}
      <div className="fixed bottom-0 left-0 lg:left-16 right-0 z-30 pointer-events-none">
        {showCollabToast && (
          <div className="max-w-xl mx-auto mb-2 px-4 pointer-events-auto">
            <div className="bg-slate-800/95 text-white px-4 py-2 rounded-xl shadow-lg flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-sky-300" />
                <span>
                  Prescription updated by <strong>{draft.lastUpdatedBy}</strong> |{" "}
                  {draft.lastUpdatedMinutesAgo === 0 ? "Just now" : `${draft.lastUpdatedMinutesAgo} minutes ago`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPreviewModal(true)}
                  className="text-sky-300 font-semibold hover:underline"
                >
                  View Summary
                </button>
                <button onClick={() => setShowCollabToast(false)} className="text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-[#0d6efd] text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xl pointer-events-auto">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                updateDraft({
                  symptoms: [],
                  diagnoses: [],
                  medications: [],
                  labInvestigations: [],
                  patientNotes: "",
                  advices: "",
                });
                notify("Cleared current prescription draft", undefined, "info");
              }}
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold"
            >
              Clear
            </button>
            <button
              onClick={() => setShowPreviewModal(true)}
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold hidden sm:inline-flex items-center gap-1"
            >
              Print Settings
            </button>
            <button
              onClick={() =>
                updateDraft({ instructionLanguage: draft.instructionLanguage === "hi" ? "en" : "hi" })
              }
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              {draft.instructionLanguage === "hi" ? "हिंदी - Hindi" : "English"}
            </button>
            <button
              onClick={() => setDoctorAiOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Ask DocAssist AI
            </button>
          </div>

          <button
            onClick={() => pushPrescriptionUpdates(draft.id)}
            className="px-4 py-1.5 rounded-lg hover:bg-white/15 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <UploadCloud className="w-4 h-4" />
            Push Updates
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreviewModal(true)}
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              Preview
            </button>
            <button
              onClick={() => {
                setShowPreviewModal(true);
              }}
              className="p-2 rounded-lg bg-white/15 hover:bg-white/25"
              title="Print Prescription"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => finishPrescription(draft.id)}
              className="px-4 py-1.5 rounded-lg bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" /> → Finish Prescription
            </button>
          </div>
        </div>
      </div>

      {/* Preview / Printable Rx Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={() => setShowPreviewModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Dr. Kacker's Chest, Sleep & ENT Clinic</h2>
                <p className="text-xs text-slate-500">Dr. Rajeev Kacker (Pulmonology & Sleep) • Kanpur</p>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl">
              <div><strong>Patient:</strong> {patient.name} ({patient.age}y / {patient.gender[0]})</div>
              <div><strong>UHID:</strong> {patient.uhid || patient.mrn}</div>
              <div><strong>Vitals:</strong> BP {draft.vitals.bp} | SpO2 {draft.vitals.spo2}% | Pulse {draft.vitals.pulse}/min | BMI {draft.vitals.bmi}</div>
              <div><strong>Date:</strong> {draft.createdAt}</div>
            </div>

            {draft.symptoms.length > 0 && (
              <div className="text-xs"><strong>Symptoms:</strong> {draft.symptoms.map((s) => s.name).join(", ")}</div>
            )}
            {draft.diagnoses.length > 0 && (
              <div className="text-xs"><strong>Diagnosis:</strong> {draft.diagnoses.map((d) => `${d.name}${d.icdCode ? ` (${d.icdCode})` : ""}`).join(", ")}</div>
            )}
            {draft.medications.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-bold uppercase text-slate-500">Rx Medications ({draft.instructionLanguage === "hi" ? "Hindi" : "English"})</div>
                {draft.medications.map((m, i) => (
                  <div key={m.id} className="text-xs p-2 rounded-lg border border-slate-100">
                    <div className="font-bold">{i + 1}. {m.brandName}</div>
                    <div className="text-slate-600">{draft.instructionLanguage === "hi" ? m.hindiInstructions : m.instructions}</div>
                  </div>
                ))}
              </div>
            )}
            {draft.labInvestigations.length > 0 && (
              <div className="text-xs"><strong>Lab Investigations:</strong> {draft.labInvestigations.join(", ")}</div>
            )}
            {draft.advices && <div className="text-xs"><strong>Advices:</strong> {draft.advices}</div>}
            {draft.followUpDays && <div className="text-xs"><strong>Follow-up:</strong> After {draft.followUpDays} days</div>}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button onClick={() => window.print()} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold inline-flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" /> Print Rx
              </button>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  finishPrescription(draft.id);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Finish & Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link ABHA Modal */}
      {showAbhaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={() => setShowAbhaModal(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!abhaInput.trim()) return;
              linkPatientAbha(patient.id, abhaInput);
              setShowAbhaModal(false);
              setAbhaInput("");
            }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-xl"
          >
            <h3 className="text-sm font-bold text-slate-900">Create / Link ABHA ID</h3>
            <p className="text-xs text-slate-500">Link Ayushman Bharat Health Account for {patient.name}</p>
            <input
              required
              value={abhaInput}
              onChange={(e) => setAbhaInput(e.target.value)}
              placeholder="e.g. ankur.gupta@abdm or 14-digit ABHA"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
            <button type="submit" className="w-full py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold">
              Verify & Link ABHA
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
