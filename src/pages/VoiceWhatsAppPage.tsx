import React, { useState } from "react";
import {
  Bot,
  Calendar,
  CheckCircle2,
  ExternalLink,
  MapPin,
  MessageCircle,
  Mic,
  Phone,
  PhoneCall,
  PhoneOff,
  Plus,
  Send,
  Sparkles,
  Star,
  UserPlus,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { TODAY_STR } from "../data/seedData";
import { AppointmentMode, PatientReview } from "../types/clinic";

type HubTab = "voice" | "whatsapp" | "training" | "reviews";

export const VoiceWhatsAppPage: React.FC = () => {
  const {
    state,
    addAppointment,
    rescheduleAppointment,
    updateAppointmentStatus,
    addPatient,
    submitFeedback,
    updateReviewFollowUp,
    addGoogleFaq,
    addVoiceCallLog,
    notify,
  } = useClinic();

  const [tab, setTab] = useState<HubTab>("voice");

  // ========================
  // 1. VOICE AI CALL SIMULATOR
  // ========================
  const [callActive, setCallActive] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [callerPatientId, setCallerPatientId] = useState(state.patients[0]?.id || "");
  const [voiceInput, setVoiceInput] = useState("");
  const [voiceMessages, setVoiceMessages] = useState<Array<{ speaker: "AI Agent" | "Caller"; text: string }>>([]);
  const [callIntent, setCallIntent] = useState<"Book Appointment" | "Reschedule" | "Cancel" | "Report Update" | "Clinic Query" | "Feedback">("Clinic Query");
  const [isListeningMic, setIsListeningMic] = useState(false);

  // Voice quick booking drawer inside call
  const doctors = state.staff.filter((s) => s.role === "doctor");
  const [vDocId, setVDocId] = useState(doctors[0]?.id || "");
  const [vTime, setVTime] = useState("18:30");
  const [vMode, setVMode] = useState<AppointmentMode>("in-person");
  const [vRating, setVRating] = useState(5);
  const [vFeedback, setVFeedback] = useState("");
  const [vSyncGoogle, setVSyncGoogle] = useState(true);

  const callerPatient = state.patients.find((p) => p.id === callerPatientId) || state.patients[0];
  const callerApts = state.appointments.filter(
    (a) => !a.isBlockedSlot && a.patientId === callerPatient?.id && a.status !== "cancelled" && a.status !== "completed"
  );

  const speakText = (text: string) => {
    if (!ttsEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.02;
    window.speechSynthesis.speak(utter);
  };

  const startCall = () => {
    const greeting = `Namaste ${callerPatient?.name || ""}! You have reached Dr. Kacker's Chest, Sleep and ENT Clinic on ${state.googleBusiness.phone}. I am your AI Voice Assistant. You can book, reschedule, or cancel an appointment, check your lab reports, or ask about our Kanpur and Lucknow clinics.`;
    setCallActive(true);
    setVoiceMessages([{ speaker: "AI Agent", text: greeting }]);
    speakText(greeting);
  };

  const endCall = () => {
    if (voiceMessages.length > 0) {
      addVoiceCallLog({
        callerPhone: callerPatient?.phone || "+91 96707 33339",
        callerName: callerPatient?.name || "Caller",
        durationSec: voiceMessages.length * 18,
        intent: callIntent,
        outcome: voiceMessages[voiceMessages.length - 1]?.text.slice(0, 120) || "Completed AI voice call",
        ratingCollected: vFeedback ? vRating : undefined,
        transcript: voiceMessages,
      });
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setCallActive(false);
    notify("Voice AI call ended & saved to Call Logs");
  };

  const pushVoiceTurn = (callerText: string, agentText: string, intent: typeof callIntent) => {
    setCallIntent(intent);
    setVoiceMessages((prev) => [
      ...prev,
      { speaker: "Caller", text: callerText },
      { speaker: "AI Agent", text: agentText },
    ]);
    speakText(agentText);
  };

  const handleVoiceFreeText = (raw?: string) => {
    const q = (raw ?? voiceInput).trim();
    if (!q) return;
    if (!raw) setVoiceInput("");
    if (!callActive) setCallActive(true);

    const lower = q.toLowerCase();
    // 1. Report lookup
    if (lower.includes("report") || lower.includes("lab") || lower.includes("result") || lower.includes("test")) {
      const labs = state.labOrders.filter((l) => l.patientId === callerPatient?.id);
      if (labs.length === 0) {
        pushVoiceTurn(q, `I checked your profile (${callerPatient?.mrn}), and there are no pending lab orders right now. Would you like to book a Sleep Study, PFT, or Blood Panel?`, "Report Update");
      } else {
        const latest = labs[0];
        const reply =
          latest.status === "report-ready"
            ? `Good news ${callerPatient?.name}! Your ${latest.testName} is ready. Summary: ${latest.resultsSummary || "Normal findings."} I have sent the PDF report to your WhatsApp.`
            : `Your ${latest.testName} is currently in "${latest.status.replace("-", " ")}" stage. You will receive an automatic WhatsApp alert as soon as it is ready.`;
        pushVoiceTurn(q, reply, "Report Update");
      }
      return;
    }

    // 2. Cancel appointment
    if (lower.includes("cancel")) {
      const apt = callerApts[0];
      if (!apt) {
        pushVoiceTurn(q, `I could not find an active upcoming appointment for ${callerPatient?.name} to cancel. Would you like to book a new one?`, "Cancel");
      } else {
        updateAppointmentStatus(apt.id, "cancelled");
        pushVoiceTurn(q, `Done! I have cancelled your appointment (Token ${apt.tokenNumber}) scheduled at ${apt.startTime} on ${apt.date}. Let me know if you'd like to rebook later.`, "Cancel");
      }
      return;
    }

    // 3. Reschedule / Update appointment
    if (lower.includes("reschedule") || lower.includes("change time") || lower.includes("move") || lower.includes("update appointment")) {
      const apt = callerApts[0];
      if (!apt) {
        pushVoiceTurn(q, `No active booking found for ${callerPatient?.name}. Use "Book Appointment" to schedule a fresh slot with Dr. Rajeev, Dr. Rishabh, or Dr. Varun Kacker.`, "Reschedule");
      } else {
        rescheduleAppointment(apt.id, TODAY_STR, vTime, vMode);
        pushVoiceTurn(q, `Updated! Your appointment ${apt.tokenNumber} has been rescheduled to ${TODAY_STR} at ${vTime} (${vMode}). An updated WhatsApp confirmation has been sent.`, "Reschedule");
      }
      return;
    }

    // 4. Book appointment
    if (lower.includes("book") || lower.includes("appointment") || lower.includes("slot")) {
      const matchedDoc =
        doctors.find((d) => lower.includes(d.name.toLowerCase().split(" ")[1] || "")) ||
        doctors.find((d) => d.id === vDocId) ||
        doctors[0];
      const created = addAppointment({
        patientId: callerPatient.id,
        doctorId: matchedDoc.id,
        branchId: matchedDoc.branchId,
        date: TODAY_STR,
        startTime: vTime,
        durationMin: 30,
        mode: vMode,
        reason: "Booked via Voice AI Helpline (096707 33339)",
        status: "confirmed",
        reminderSent: true,
        source: "Voice AI Call",
      });
      pushVoiceTurn(
        q,
        `Confirmed! I have booked your ${vMode} appointment with ${matchedDoc.name} (${matchedDoc.specialty}) today at ${vTime}. Your token is ${created.tokenNumber}, fee ₹${matchedDoc.consultationFee}. Confirmation sent on WhatsApp.`,
        "Book Appointment"
      );
      return;
    }

    // 5. Search trained Google Business Knowledge Base FAQs
    const faqHit = state.googleBusiness.servicesFaq.find((f) =>
      f.question.toLowerCase().split(" ").some((w) => w.length > 3 && lower.includes(w)) ||
      f.answer.toLowerCase().split(" ").some((w) => w.length > 4 && lower.includes(w))
    );

    if (lower.includes("address") || lower.includes("where") || lower.includes("location") || lower.includes("kanpur") || lower.includes("lucknow")) {
      pushVoiceTurn(
        q,
        `Our Kanpur clinic is at ${state.googleBusiness.address}. We also consult at ${state.googleBusiness.secondaryLocation}. Timings: ${state.googleBusiness.timings}.`,
        "Clinic Query"
      );
      return;
    }

    if (lower.includes("doctor") || lower.includes("rajeev") || lower.includes("rishabh") || lower.includes("varun") || lower.includes("fee")) {
      const docSummary = state.googleBusiness.doctorsSummary
        .map((d) => `${d.name} (${d.role}, ₹${d.fee})`)
        .join("; ");
      pushVoiceTurn(q, `Our specialists at Dr. Kacker's Clinic: ${docSummary}. Would you like me to book an appointment with any of them?`, "Clinic Query");
      return;
    }

    if (faqHit) {
      pushVoiceTurn(q, faqHit.answer, "Clinic Query");
      return;
    }

    pushVoiceTurn(
      q,
      `At Dr. Kacker's Chest, Sleep & ENT Clinic (${state.googleBusiness.address}), we treat Asthma, COPD, Snoring/Sleep Apnea, Allergy, and ENT conditions. Timings: ${state.googleBusiness.timings}. Ask me to book/reschedule/cancel a slot or check your lab report!`,
      "Clinic Query"
    );
  };

  const handleVoiceMic = () => {
    const SpeechRec = (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;
    if (!SpeechRec) {
      handleVoiceFreeText("What are the clinic timings, address, and consultation fees for Dr. Rajeev Kacker?");
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rec: any = new SpeechRec();
      rec.lang = "en-IN";
      setIsListeningMic(true);
      rec.onresult = (evt: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
        const transcript = evt.results[0][0].transcript;
        setIsListeningMic(false);
        handleVoiceFreeText(transcript);
      };
      rec.onerror = () => setIsListeningMic(false);
      rec.start();
    } catch {
      setIsListeningMic(false);
    }
  };

  const handleVoiceFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const doc = doctors.find((d) => d.id === vDocId) || doctors[0];
    submitFeedback({
      patientName: callerPatient?.name || "Phone Caller",
      doctorName: doc.name,
      rating: vRating,
      comment: vFeedback.trim() || `Rated ${vRating}/5 during Voice AI support call.`,
      channel: "Voice AI",
      syncedToGoogle: vSyncGoogle && vRating >= 4,
    });
    pushVoiceTurn(
      `I rate my experience ${vRating} stars. ${vFeedback}`,
      vRating >= 4
        ? `Thank you for the ${vRating}-star rating! I have shared our Google Business review link (${state.googleBusiness.googleShareUrl}) on your WhatsApp as well.`
        : `Thank you for your honest ${vRating}-star feedback. I have logged an immediate follow-up ticket for our clinic manager Priya Menon to resolve this.`,
      "Feedback"
    );
    setVFeedback("");
  };

  // ========================
  // 2. WHATSAPP FLOW STATE
  // ========================
  const [waStep, setWaStep] = useState<"menu" | "register" | "book" | "feedback">("menu");
  const [waInput, setWaInput] = useState("");
  const [waChat, setWaChat] = useState<Array<{ from: "bot" | "user"; text: string; time: string }>>([
    {
      from: "bot",
      text: "Namaste! Welcome to Dr. Kacker's Chest, Sleep & ENT Clinic on WhatsApp (+91 96707 33339).\n\nChoose an option or type any question:\n1️⃣ Register as New Patient\n2️⃣ Book Appointment\n3️⃣ Check Report / Ask Clinic Query\n4️⃣ Rate Visit & Google Review",
      time: "09:40 AM",
    },
  ]);

  // WhatsApp Registration fields
  const [waRegName, setWaRegName] = useState("");
  const [waRegPhone, setWaRegPhone] = useState("");
  const [waRegAge, setWaRegAge] = useState(30);
  const [waRegConcern, setWaRegConcern] = useState("Chronic cough / snoring evaluation");
  const [waActivePatientId, setWaActivePatientId] = useState(state.patients[0]?.id || "");

  // WhatsApp Booking fields
  const [waDocId, setWaDocId] = useState(doctors[0]?.id || "");
  const [waMode, setWaMode] = useState<AppointmentMode>("in-person");
  const [waTime, setWaTime] = useState("19:00");

  // WhatsApp Feedback fields
  const [waRating, setWaRating] = useState(5);
  const [waFeedbackText, setWaFeedbackText] = useState("");

  const pushWa = (from: "bot" | "user", text: string) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setWaChat((prev) => [...prev, { from, text, time }]);
  };

  const handleWaSendText = (e: React.FormEvent) => {
    e.preventDefault();
    const q = waInput.trim();
    if (!q) return;
    setWaInput("");
    pushWa("user", q);
    const lower = q.toLowerCase();

    if (lower.includes("register")) {
      setWaStep("register");
      pushWa("bot", "Sure! Fill out the quick WhatsApp registration card below to receive your MRN instantly.");
      return;
    }
    if (lower.includes("book") || lower.includes("slot") || lower.includes("appointment")) {
      setWaStep("book");
      pushWa("bot", "Let's book your slot! Select your preferred specialist, consultation mode, and time below.");
      return;
    }
    if (lower.includes("report") || lower.includes("hba1c") || lower.includes("test")) {
      const pat = state.patients.find((p) => p.id === waActivePatientId) || state.patients[0];
      const labs = state.labOrders.filter((l) => l.patientId === pat.id);
      const reply = labs.length
        ? `📄 Lab Status for ${pat.name} (${pat.mrn}):\n• ${labs[0].testName}: ${labs[0].status.toUpperCase()}\n${labs[0].resultsSummary || ""}`
        : `No pending lab reports found for ${pat.name} (${pat.mrn}).`;
      pushWa("bot", reply);
      return;
    }
    if (lower.includes("rate") || lower.includes("review") || lower.includes("feedback")) {
      setWaStep("feedback");
      pushWa("bot", "We value your feedback! Tap a star rating below — 4★/5★ reviews can also be posted directly to our Google Business page.");
      return;
    }

    // Trained Google Business query answering
    const faq = state.googleBusiness.servicesFaq.find((f) =>
      f.question.toLowerCase().split(" ").some((w) => w.length > 3 && lower.includes(w)) ||
      f.answer.toLowerCase().split(" ").some((w) => w.length > 4 && lower.includes(w))
    );
    const reply = faq
      ? `ℹ️ ${faq.question}:\n${faq.answer}`
      : `🏥 ${state.googleBusiness.clinicName}\n📍 ${state.googleBusiness.address}\n⏰ ${state.googleBusiness.timings}\n📞 ${state.googleBusiness.phone}\n\nType "register", "book", "report", or "review" anytime!`;
    pushWa("bot", reply);
  };

  const handleWaRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waRegName.trim() || !waRegPhone.trim()) return;
    const created = addPatient({
      name: waRegName.trim(),
      phone: waRegPhone.trim(),
      email: `${waRegName.trim().toLowerCase().replace(/\s+/g, ".")}@example.com`,
      dob: "1993-01-01",
      age: waRegAge,
      gender: "Other",
      bloodGroup: "O+",
      branchId: "br-1",
      specialtyTag: "Pulmonology & Sleep",
      allergies: ["None Known"],
      chronicConditions: [waRegConcern],
    });
    setWaActivePatientId(created.id);
    pushWa("user", `Register: ${created.name}, ${created.phone}, Age ${created.age}`);
    pushWa("bot", `✅ Registration Complete!\nPatient: ${created.name}\nMRN: ${created.mrn}\n\nWould you like to book an appointment now?`);
    setWaRegName("");
    setWaRegPhone("");
    setWaStep("book");
  };

  const handleWaBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = state.patients.find((p) => p.id === waActivePatientId) || state.patients[0];
    const doc = doctors.find((d) => d.id === waDocId) || doctors[0];
    const created = addAppointment({
      patientId: pat.id,
      doctorId: doc.id,
      branchId: doc.branchId,
      date: TODAY_STR,
      startTime: waTime,
      durationMin: 30,
      mode: waMode,
      reason: "Booked via WhatsApp Self-Service Flow",
      status: "confirmed",
      reminderSent: true,
      source: "WhatsApp AI",
    });
    pushWa("user", `Book ${doc.name} (${waMode}) at ${waTime} for ${pat.name}`);
    pushWa(
      "bot",
      `📅 Appointment Confirmed!\n• Token: ${created.tokenNumber}\n• Doctor: ${doc.name}\n• Time: ${TODAY_STR} at ${waTime} (${waMode})\n• Clinic: ${state.googleBusiness.address}\n\nAfter your visit, reply with your rating to help us improve!`
    );
    setWaStep("menu");
  };

  const handleWaFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = state.patients.find((p) => p.id === waActivePatientId) || state.patients[0];
    const doc = doctors.find((d) => d.id === waDocId) || doctors[0];
    submitFeedback({
      patientName: pat.name,
      doctorName: doc.name,
      rating: waRating,
      comment: waFeedbackText.trim() || `Submitted ${waRating}★ rating via WhatsApp flow.`,
      channel: "WhatsApp",
      syncedToGoogle: waRating >= 4,
    });
    pushWa("user", `${"★".repeat(waRating)} (${waRating}/5): ${waFeedbackText || "Great care!"}`);
    pushWa(
      "bot",
      waRating >= 4
        ? `🙏 Thank you ${pat.name}! Your ${waRating}★ review has been saved and linked to Google Business:\n${state.googleBusiness.googleShareUrl}`
        : `🙏 Thank you for sharing this feedback. Our Patient Care Manager has been alerted to follow up with you promptly.`
    );
    setWaFeedbackText("");
    setWaStep("menu");
  };

  // ========================
  // 3. TRAINING & REVIEWS STATE
  // ========================
  const [newFaqQ, setNewFaqQ] = useState("");
  const [newFaqA, setNewFaqA] = useState("");
  const [reviewFilter, setReviewFilter] = useState<"all" | PatientReview["status"]>("all");
  const [actionNotes, setActionNotes] = useState<Record<string, string>>({});

  const filteredReviews = state.reviews.filter((r) => (reviewFilter === "all" ? true : r.status === reviewFilter));
  const actionRequiredCount = state.reviews.filter((r) => r.status === "action-required").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-teal-600" />
            Voice AI Helpline, WhatsApp Flow & Google Business Reviews
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Trained on{" "}
            <a href={state.googleBusiness.googleShareUrl} target="_blank" rel="noreferrer" className="text-teal-700 font-semibold underline inline-flex items-center gap-0.5">
              Dr. Kacker’s Chest, Sleep & ENT Clinic (Google Business) <ExternalLink className="w-3 h-3" />
            </a>{" "}
            • Helpline: <strong>{state.googleBusiness.phone}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl w-fit">
          {[
            { id: "voice", label: "Voice AI Call Agent", icon: Phone },
            { id: "whatsapp", label: "WhatsApp Bot Flow", icon: MessageCircle },
            { id: "training", label: "Google Business Training", icon: Sparkles },
            { id: "reviews", label: `Reviews & Follow-Up (${state.reviews.length})`, icon: Star },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as HubTab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === t.id ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {t.id === "reviews" && actionRequiredCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${tab === "reviews" ? "bg-white/25 text-white" : "bg-rose-100 text-rose-700"}`}>
                  {actionRequiredCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: VOICE AI CALL AGENT */}
      {tab === "voice" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Live Inbound Call Console */}
          <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${callActive ? "bg-emerald-600 text-white animate-pulse" : "bg-slate-100 text-slate-600"}`}>
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    Inbound Voice AI Line: {state.googleBusiness.phone}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {callActive ? "Live AI Agent Connected — Listening for booking, reschedule, cancel, report or clinic query" : "Dial or simulate an inbound patient call"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  className={`p-2 rounded-lg border text-xs ${ttsEnabled ? "bg-teal-50 border-teal-400 text-teal-700" : "border-slate-200 text-slate-500"}`}
                  title="Toggle AI Voice Speech Output"
                >
                  {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                {!callActive ? (
                  <button onClick={startCall} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
                    <PhoneCall className="w-3.5 h-3.5" /> Start Test Call
                  </button>
                ) : (
                  <button onClick={endCall} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold">
                    <PhoneOff className="w-3.5 h-3.5" /> End & Save Log
                  </button>
                )}
              </div>
            </div>

            {/* Caller Identity + Booking Params */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
              <select value={callerPatientId} onChange={(e) => setCallerPatientId(e.target.value)} className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white">
                {state.patients.map((p) => (
                  <option key={p.id} value={p.id}>Caller: {p.name}</option>
                ))}
              </select>
              <select value={vDocId} onChange={(e) => setVDocId(e.target.value)} className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white">
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <input type="time" value={vTime} onChange={(e) => setVTime(e.target.value)} className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white" />
              <select value={vMode} onChange={(e) => setVMode(e.target.value as AppointmentMode)} className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white">
                <option value="in-person">In-Person</option>
                <option value="online">Video Consult</option>
                <option value="home-visit">Home Visit</option>
              </select>
            </div>

            {/* One-Click Voice Intent Triggers */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Ask Address & Timings", cmd: "What is your Kanpur clinic address, timings, and doctor fees?" },
                { label: "Book Appointment", cmd: `Book an appointment with ${doctors.find((d) => d.id === vDocId)?.name || "Dr. Rajeev Kacker"}` },
                { label: "Reschedule Slot", cmd: "Please reschedule my existing appointment to the new time" },
                { label: "Cancel Appointment", cmd: "Please cancel my upcoming appointment" },
                { label: "Check My Lab Report", cmd: "Can you give me an update on my lab report?" },
              ].map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleVoiceFreeText(chip.cmd)}
                  className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[11px] font-semibold transition"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Live Transcript */}
            <div className="h-64 overflow-y-auto p-3.5 rounded-xl bg-slate-900 text-slate-100 space-y-2.5">
              {voiceMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 text-center">
                  <Bot className="w-7 h-7 text-teal-400 mb-2" />
                  Click "Start Test Call" or any quick intent chip above to test the live Voice AI Agent.
                </div>
              ) : (
                voiceMessages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.speaker === "Caller" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                      m.speaker === "Caller" ? "bg-teal-600 text-white" : "bg-slate-800 border border-slate-700 text-slate-100"
                    }`}>
                      <div className="text-[10px] font-bold opacity-70 mb-0.5">{m.speaker}</div>
                      {m.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Voice / Text Prompt Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVoiceFreeText();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={handleVoiceMic}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1 ${
                  isListeningMic ? "bg-rose-600 text-white border-rose-600 animate-pulse" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
                title="Speak into Microphone"
              >
                <Mic className="w-4 h-4" />
              </button>
              <input
                value={voiceInput}
                onChange={(e) => setVoiceInput(e.target.value)}
                placeholder="Type or speak caller query (e.g. 'Book Dr. Rishabh', 'Check report', 'Sleep study price')..."
                className="flex-1 px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl"
              />
              <button type="submit" className="px-4 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-semibold flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" /> Speak
              </button>
            </form>

            {/* Post-Call Rating & Google Review Prompt */}
            <form onSubmit={handleVoiceFeedbackSubmit} className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-950">End-of-Call Voice AI Rating & Google Review Prompt</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setVRating(r)}
                      className={`px-2 py-0.5 rounded text-xs font-bold ${vRating >= r ? "bg-amber-500 text-white" : "bg-white text-slate-400 border border-slate-200"}`}
                    >
                      {r}★
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={vFeedback}
                  onChange={(e) => setVFeedback(e.target.value)}
                  placeholder="Caller spoken feedback (e.g. 'Quick appointment & polite staff')..."
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-amber-200 rounded-lg"
                />
                <label className="flex items-center gap-1.5 text-[11px] text-amber-900 font-medium">
                  <input type="checkbox" checked={vSyncGoogle} onChange={(e) => setVSyncGoogle(e.target.checked)} className="rounded text-teal-600" />
                  Prompt Google Review
                </label>
                <button type="submit" className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold">
                  Save Feedback
                </button>
              </div>
            </form>
          </div>

          {/* Right: Recent Call Logs */}
          <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 h-fit">
            <h2 className="text-sm font-bold text-slate-900">AI Helpline Call Logs ({state.voiceCallLogs.length})</h2>
            <div className="space-y-2.5 max-h-[540px] overflow-y-auto">
              {state.voiceCallLogs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{log.callerName} ({log.callerPhone})</span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">{log.intent}</span>
                  </div>
                  <div className="text-slate-600">{log.outcome}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{log.timestamp} • {log.durationSec}s</span>
                    {log.ratingCollected && <span className="text-amber-600 font-bold">{"★".repeat(log.ratingCollected)} Collected</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WHATSAPP FLOW */}
      {tab === "whatsapp" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Interactive WhatsApp Phone Preview */}
          <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs flex flex-col">
            <div className="bg-emerald-700 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">DK</div>
                <div>
                  <div className="text-sm font-bold">Dr. Kacker's Clinic • WhatsApp Official</div>
                  <div className="text-[11px] text-emerald-100">Automated Registration, Booking, Reports & Feedback</div>
                </div>
              </div>
              <select
                value={waActivePatientId}
                onChange={(e) => setWaActivePatientId(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-emerald-800 text-white text-[11px] font-semibold border border-emerald-600"
              >
                {state.patients.map((p) => (
                  <option key={p.id} value={p.id}>Chatting as: {p.name}</option>
                ))}
              </select>
            </div>

            {/* Flow Quick Pills */}
            <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2 flex flex-wrap gap-1.5">
              <button onClick={() => setWaStep("register")} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${waStep === "register" ? "bg-emerald-600 text-white" : "bg-white text-emerald-800 border border-emerald-200"}`}>
                1. Register New Patient
              </button>
              <button onClick={() => setWaStep("book")} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${waStep === "book" ? "bg-emerald-600 text-white" : "bg-white text-emerald-800 border border-emerald-200"}`}>
                2. Book Appointment
              </button>
              <button
                onClick={() => {
                  const pat = state.patients.find((p) => p.id === waActivePatientId) || state.patients[0];
                  const lab = state.labOrders.find((l) => l.patientId === pat.id);
                  pushWa("user", "Where is my lab report?");
                  pushWa(
                    "bot",
                    lab
                      ? `📄 Lab Report for ${pat.name} (${pat.mrn}):\n• ${lab.testName}: ${lab.status.toUpperCase()}\n${lab.resultsSummary || ""}`
                      : `No pending lab reports found for ${pat.name} (${pat.mrn}).`
                  );
                }}
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white text-emerald-800 border border-emerald-200"
              >
                3. Check Lab Report
              </button>
              <button onClick={() => setWaStep("feedback")} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${waStep === "feedback" ? "bg-emerald-600 text-white" : "bg-white text-emerald-800 border border-emerald-200"}`}>
                4. Rate & Review
              </button>
            </div>

            {/* Chat Stream */}
            <div className="h-80 overflow-y-auto p-4 bg-[#efeae2] space-y-2.5">
              {waChat.map((m, idx) => (
                <div key={idx} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[82%] px-3.5 py-2 rounded-2xl text-xs whitespace-pre-line shadow-2xs ${
                    m.from === "user" ? "bg-[#d9fdd3] text-slate-900" : "bg-white text-slate-800"
                  }`}>
                    {m.text}
                    <div className="text-[9px] text-slate-400 text-right mt-1">{m.time}</div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleWaSendText} className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <input
                value={waInput}
                onChange={(e) => setWaInput(e.target.value)}
                placeholder="Type WhatsApp message (e.g., 'Sleep study cost', 'address', 'register', 'book')..."
                className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              />
              <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold">Send</button>
            </form>
          </div>

          {/* Interactive Action Cards for WhatsApp Flow */}
          <div className="xl:col-span-5 space-y-4">
            {/* Registration Card */}
            <form onSubmit={handleWaRegisterSubmit} className={`bg-white rounded-2xl border p-4 space-y-3 ${waStep === "register" ? "border-emerald-500 ring-2 ring-emerald-500/15" : "border-slate-200/80"}`}>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-emerald-600" /> WhatsApp Patient Registration Flow
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <input required value={waRegName} onChange={(e) => setWaRegName(e.target.value)} placeholder="Patient Name" className="px-3 py-2 text-xs border border-slate-200 rounded-xl" />
                <input required value={waRegPhone} onChange={(e) => setWaRegPhone(e.target.value)} placeholder="WhatsApp Number" className="px-3 py-2 text-xs border border-slate-200 rounded-xl" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input type="number" value={waRegAge} onChange={(e) => setWaRegAge(Number(e.target.value))} placeholder="Age" className="px-3 py-2 text-xs border border-slate-200 rounded-xl" />
                <input value={waRegConcern} onChange={(e) => setWaRegConcern(e.target.value)} placeholder="Primary Concern" className="col-span-2 px-3 py-2 text-xs border border-slate-200 rounded-xl" />
              </div>
              <button type="submit" className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
                Register Patient via WhatsApp
              </button>
            </form>

            {/* Booking Card */}
            <form onSubmit={handleWaBookSubmit} className={`bg-white rounded-2xl border p-4 space-y-3 ${waStep === "book" ? "border-teal-500 ring-2 ring-teal-500/15" : "border-slate-200/80"}`}>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-600" /> WhatsApp Appointment Booking Flow
              </h3>
              <select value={waDocId} onChange={(e) => setWaDocId(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.specialty} (₹{d.consultationFee})</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select value={waMode} onChange={(e) => setWaMode(e.target.value as AppointmentMode)} className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
                  <option value="in-person">In-Person (Kanpur/Lucknow)</option>
                  <option value="online">Video Telehealth</option>
                  <option value="home-visit">Home Sleep Study / Visit</option>
                </select>
                <input type="time" value={waTime} onChange={(e) => setWaTime(e.target.value)} className="px-3 py-2 text-xs border border-slate-200 rounded-xl" />
              </div>
              <button type="submit" className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold">
                Confirm WhatsApp Slot
              </button>
            </form>

            {/* Feedback Card */}
            <form onSubmit={handleWaFeedbackSubmit} className={`bg-white rounded-2xl border p-4 space-y-2.5 ${waStep === "feedback" ? "border-amber-500 ring-2 ring-amber-500/15" : "border-slate-200/80"}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500" /> WhatsApp Rating & Google Review
                </h3>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button key={r} type="button" onClick={() => setWaRating(r)} className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${waRating >= r ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                      {r}★
                    </button>
                  ))}
                </div>
              </div>
              <input value={waFeedbackText} onChange={(e) => setWaFeedbackText(e.target.value)} placeholder="Patient feedback message..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
              <button type="submit" className="w-full py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold">
                Submit WhatsApp Feedback
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: GOOGLE BUSINESS TRAINING KNOWLEDGE BASE */}
      {tab === "training" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 h-fit">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">Google Business Synced</span>
                <h2 className="text-base font-bold text-slate-900 mt-1.5">{state.googleBusiness.clinicName}</h2>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-bold text-amber-500">{state.googleBusiness.googleRating} ★</div>
                <div className="text-[11px] text-slate-500">{state.googleBusiness.googleReviewCount} Google reviews</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" /> <span>{state.googleBusiness.address}</span></div>
              <div><strong>Secondary Centre:</strong> {state.googleBusiness.secondaryLocation}</div>
              <div><strong>Helpline:</strong> {state.googleBusiness.phone}</div>
              <div><strong>Hours:</strong> {state.googleBusiness.timings}</div>
              <a href={state.googleBusiness.googleShareUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-teal-700 font-semibold hover:underline pt-1">
                Open Google Business Profile <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Trained Specialist Profiles</div>
              {state.googleBusiness.doctorsSummary.map((d) => (
                <div key={d.name} className="p-3 rounded-xl border border-slate-200 text-xs">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{d.name}</span>
                    <span className="text-teal-700">₹{d.fee}</span>
                  </div>
                  <div className="text-[11px] text-indigo-700 font-medium">{d.role}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{d.expertise}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newFaqQ.trim() || !newFaqA.trim()) return;
                addGoogleFaq(newFaqQ.trim(), newFaqA.trim());
                setNewFaqQ("");
                setNewFaqA("");
              }}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3"
            >
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-teal-600" /> Train Voice AI & WhatsApp Bot with Custom Clinic Q&A
              </h3>
              <input required value={newFaqQ} onChange={(e) => setNewFaqQ(e.target.value)} placeholder="Topic / Question (e.g., CPAP Machine Trial & Pricing)" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
              <textarea required rows={2} value={newFaqA} onChange={(e) => setNewFaqA(e.target.value)} placeholder="AI Agent Response..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
              <button type="submit" className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold">
                Save to AI Training Corpus
              </button>
            </form>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Active AI Knowledge Base ({state.googleBusiness.servicesFaq.length} Entries)</h3>
              {state.googleBusiness.servicesFaq.map((f) => (
                <div key={f.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="font-bold text-slate-900">{f.question}</div>
                  <div className="text-slate-600 mt-1">{f.answer}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REVIEWS & FEEDBACK FOLLOW-UP PORTAL */}
      {tab === "reviews" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200/80 p-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {(["all", "action-required", "pending", "approved", "resolved"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setReviewFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
                    reviewFilter === st ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st.replace("-", " ")}
                </button>
              ))}
            </div>

            <a
              href={state.googleBusiness.googleShareUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold"
            >
              Google Business ({state.googleBusiness.googleRating} ★ / {state.googleBusiness.googleReviewCount} reviews) <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredReviews.map((rev) => (
              <div key={rev.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{rev.patientName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">{rev.channel}</span>
                      {rev.syncedToGoogle && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">Google Business</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{rev.doctorName} • {rev.createdAt}</div>
                  </div>
                  <div className="text-amber-500 font-bold text-sm">{"★".repeat(rev.rating)}</div>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">"{rev.comment}"</p>

                {rev.actionNote && (
                  <div className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                    <strong>Follow-Up Note:</strong> {rev.actionNote} {rev.assignedTo ? `(${rev.assignedTo})` : ""}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <input
                    value={actionNotes[rev.id] ?? ""}
                    onChange={(e) => setActionNotes((prev) => ({ ...prev, [rev.id]: e.target.value }))}
                    placeholder="Add internal follow-up / resolution note..."
                    className="flex-1 min-w-[180px] px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                  <button
                    onClick={() => {
                      updateReviewFollowUp(rev.id, {
                        actionNote: actionNotes[rev.id] || rev.actionNote || "Followed up with patient",
                        status: "resolved",
                      });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                  </button>
                  <button
                    onClick={() => updateReviewFollowUp(rev.id, { status: "approved", syncedToGoogle: true })}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Approve & Sync
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
