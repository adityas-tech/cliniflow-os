import React, { useState } from "react";
import {
  Activity,
  Bot,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Filter,
  HeartPulse,
  IndianRupee,
  Mic,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { MEDICAL_HISTORY_CHIPS } from "../data/medicalKnowledge";
import { TODAY_STR } from "../data/seedData";
import { AppointmentMode } from "../types/clinic";

export const QueueAttendancePage: React.FC = () => {
  const {
    state,
    addAppointment,
    addPatient,
    addVitalRecord,
    linkPatientAbha,
    openPatientVisitHub,
    openPrescriptionPad,
    updateAppointmentDetails,
    updateAppointmentStatus,
    toggleStaffStatus,
    setDoctorAiOpen,
    notify,
  } = useClinic();

  const [mainView, setMainView] = useState<"opd" | "attendance">("opd");
  const [opdTab, setOpdTab] = useState<"my-opd" | "completed">("my-opd");
  const [leftTab, setLeftTab] = useState<"booked" | "followups" | "others">("booked");

  // Left Pane: Add New Walk-in / Appointment Form
  const doctors = state.staff.filter((s) => s.role === "doctor");
  const [selBranchId, setSelBranchId] = useState(state.branches[0]?.id || "br-1");
  const [selDoctorId, setSelDoctorId] = useState(doctors[0]?.id || "doc-1");
  const [selMode, setSelMode] = useState<AppointmentMode>("in-person");
  const [patientSearch, setPatientSearch] = useState("");
  const [selPatientId, setSelPatientId] = useState<string>("");
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [newPatName, setNewPatName] = useState("");
  const [newPatPhone, setNewPatPhone] = useState("");
  const [newPatAge, setNewPatAge] = useState(36);
  const [newPatGender, setNewPatGender] = useState<"Male" | "Female" | "Other">("Male");
  const [selHistory, setSelHistory] = useState<string[]>([]);
  const [selService, setSelService] = useState("Consultation (₹800)");
  const [selTag, setSelTag] = useState("Walk-in");

  // Queue search & modals
  const [queueFilter, setQueueFilter] = useState("");
  const [vitalsModalPatId, setVitalsModalPatId] = useState<string | null>(null);
  const [vBpSys, setVBpSys] = useState(124);
  const [vBpDia, setVBpDia] = useState(80);
  const [vHr, setVHr] = useState(82);
  const [vSpo2, setVSpo2] = useState(98);
  const [vWt, setVWt] = useState(69);

  const [abhaModalPatId, setAbhaModalPatId] = useState<string | null>(null);
  const [abhaInput, setAbhaInput] = useState("");

  const [serviceModalAptId, setServiceModalAptId] = useState<string | null>(null);
  const [extraServiceInput, setExtraServiceInput] = useState("Spirometry (₹900)");

  const todayApts = state.appointments.filter(
    (a) =>
      !a.isBlockedSlot &&
      a.date === TODAY_STR &&
      (state.activeBranchId === "all" || a.branchId === state.activeBranchId)
  );

  const myOpdApts = todayApts.filter((a) => a.status !== "completed" && a.status !== "cancelled");
  const completedApts = todayApts.filter((a) => a.status === "completed");
  const activeList = (opdTab === "my-opd" ? myOpdApts : completedApts).filter((apt) => {
    if (!queueFilter.trim()) return true;
    const p = state.patients.find((pt) => pt.id === apt.patientId);
    const q = queueFilter.toLowerCase();
    return (
      p?.name.toLowerCase().includes(q) ||
      (p?.uhid || p?.mrn || "").toLowerCase().includes(q) ||
      apt.tokenNumber.toLowerCase().includes(q)
    );
  });

  const matchingPatients = state.patients
    .filter((p) => {
      if (!patientSearch.trim()) return false;
      const q = patientSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        (p.uhid || p.mrn).toLowerCase().includes(q)
      );
    })
    .slice(0, 5);

  const handleCheckInNew = (e: React.FormEvent) => {
    e.preventDefault();
    let targetPatId = selPatientId;

    if (!targetPatId && quickAddMode && newPatName.trim()) {
      const created = addPatient({
        name: newPatName.trim(),
        phone: newPatPhone.trim() || "+91 98000 00000",
        email: `${newPatName.trim().toLowerCase().replace(/\s+/g, ".")}@example.com`,
        dob: "1988-01-01",
        age: newPatAge,
        gender: newPatGender,
        bloodGroup: "O+",
        branchId: selBranchId,
        specialtyTag: "Pulmonology & Sleep",
        allergies: ["None Known"],
        chronicConditions: selHistory,
      });
      targetPatId = created.id;
    }

    if (!targetPatId) {
      notify("Select or add a patient first", undefined, "warning");
      return;
    }

    const doc = doctors.find((d) => d.id === selDoctorId);
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    addAppointment({
      patientId: targetPatId,
      doctorId: selDoctorId,
      branchId: selBranchId,
      date: TODAY_STR,
      startTime: new Date().toTimeString().slice(0, 5),
      durationMin: 20,
      mode: selMode,
      reason: selService,
      status: "checked-in",
      checkedInAt: nowTime,
      reminderSent: true,
      source: "Front Desk",
      visitType: leftTab === "followups" ? "Follow Up" : selTag === "Booked" ? "Booked" : "Walkin",
      paymentStatus: "paid",
      paymentMethod: "Cash",
      consultationFee: doc?.consultationFee || 800,
      isNewPatient: quickAddMode,
      waitMinutes: 1,
      appointmentTag: selTag,
    });

    setPatientSearch("");
    setSelPatientId("");
    setQuickAddMode(false);
    setNewPatName("");
    setNewPatPhone("");
    setSelHistory([]);
  };

  return (
    <div className="space-y-4 pb-16">
      {/* Sub-header toggle for Staff Attendance */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500 font-medium">
          OPD Queue & Check-in • <span className="text-slate-900 font-semibold">{myOpdApts.length} waiting</span> •{" "}
          <span className="text-emerald-700 font-semibold">{completedApts.length} completed</span>
        </div>
        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl">
          <button
            onClick={() => setMainView("opd")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              mainView === "opd" ? "bg-[#0d6efd] text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            OPD Queue & Walk-in
          </button>
          <button
            onClick={() => setMainView("attendance")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              mainView === "attendance" ? "bg-[#0d6efd] text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Staff & Client Attendance
          </button>
        </div>
      </div>

      {mainView === "opd" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT PANE: Add New Appointment / Walk-in (from video) */}
          <form
            onSubmit={handleCheckInNew}
            className="lg:col-span-4 xl:col-span-4 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs"
          >
            <div className="bg-[#0d6efd] text-white px-3 pt-2.5 flex items-center gap-1 text-xs font-semibold">
              {(
                [
                  { id: "booked", label: `Booked (${todayApts.filter((a) => a.visitType === "Booked").length})` },
                  { id: "followups", label: `Follow Ups (${todayApts.filter((a) => a.visitType === "Follow Up").length})` },
                  { id: "others", label: "Others (0)" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setLeftTab(t.id)}
                  className={`px-3 py-2 rounded-t-lg transition ${
                    leftTab === t.id ? "bg-white text-blue-700 font-bold" : "text-white/85 hover:bg-white/10"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-4 space-y-3 text-xs">
              {/* Clinic Row */}
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70">
                <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                <select
                  value={selBranchId}
                  onChange={(e) => setSelBranchId(e.target.value)}
                  className="flex-1 bg-transparent font-semibold text-slate-800 outline-none"
                >
                  {state.branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Doctor Row */}
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70">
                <Stethoscope className="w-4 h-4 text-teal-600 shrink-0" />
                <select
                  value={selDoctorId}
                  onChange={(e) => setSelDoctorId(e.target.value)}
                  className="flex-1 bg-transparent font-semibold text-slate-800 outline-none"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (₹{d.consultationFee})
                    </option>
                  ))}
                </select>
              </div>

              {/* Time & Mode Row */}
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Now ({new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})</span>
                </div>
                <select
                  value={selMode}
                  onChange={(e) => setSelMode(e.target.value as AppointmentMode)}
                  className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold outline-none"
                >
                  <option value="in-person">In-Clinic</option>
                  <option value="online">Video</option>
                  <option value="home-visit">Home Visit</option>
                </select>
              </div>

              {/* Select or Add Patient */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Patient</span>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickAddMode((v) => !v);
                      setSelPatientId("");
                    }}
                    className="text-blue-600 font-semibold text-[11px] hover:underline flex items-center gap-1"
                  >
                    <UserPlus className="w-3 h-3" />
                    {quickAddMode ? "Select Existing" : "+ New Walk-in Patient"}
                  </button>
                </div>

                {!quickAddMode ? (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      value={patientSearch}
                      onChange={(e) => {
                        setPatientSearch(e.target.value);
                        setSelPatientId("");
                      }}
                      placeholder="Select or Add Patient (Name / Phone / UHID)"
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
                    />
                    {matchingPatients.length > 0 && !selPatientId && (
                      <div className="mt-1 bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100 max-h-44 overflow-y-auto">
                        {matchingPatients.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelPatientId(p.id);
                              setPatientSearch(`${p.name} (${p.uhid || p.mrn})`);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-slate-900">{p.name}</div>
                              <div className="text-[10px] text-slate-500">{p.age}y {p.gender} • {p.phone}</div>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">{p.uhid || p.mrn}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <input
                      required
                      value={newPatName}
                      onChange={(e) => setNewPatName(e.target.value)}
                      placeholder="Patient Full Name"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                    <input
                      value={newPatPhone}
                      onChange={(e) => setNewPatPhone(e.target.value)}
                      placeholder="Phone (+91 ...)"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={newPatAge}
                        onChange={(e) => setNewPatAge(Number(e.target.value))}
                        placeholder="Age"
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                      <select
                        value={newPatGender}
                        onChange={(e) => setNewPatGender(e.target.value as "Male" | "Female" | "Other")}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Add medical history */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-500">Add medical history</div>
                <div className="flex flex-wrap gap-1">
                  {MEDICAL_HISTORY_CHIPS.slice(0, 5).map((chip) => {
                    const active = selHistory.includes(chip);
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() =>
                          setSelHistory((prev) => (active ? prev.filter((x) => x !== chip) : [...prev, chip]))
                        }
                        className={`px-2 py-1 rounded-lg border text-[11px] font-medium ${
                          active ? "bg-blue-50 border-blue-500 text-blue-700" : "border-slate-200 text-slate-600"
                        }`}
                      >
                        {active ? "✓ " : "+ "}
                        {chip}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Select Service & Tag */}
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selService}
                  onChange={(e) => setSelService(e.target.value)}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium"
                >
                  <option>Consultation (₹800)</option>
                  <option>Follow-up (₹500)</option>
                  <option>Spirometry / PFT (₹900)</option>
                  <option>Sleep Study Consult</option>
                </select>
                <select
                  value={selTag}
                  onChange={(e) => setSelTag(e.target.value)}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium"
                >
                  <option value="Walk-in">Walk-in</option>
                  <option value="Priority">Priority</option>
                  <option value="Booked">Booked</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#0d6efd] hover:bg-blue-700 text-white font-bold shadow-xs transition"
              >
                Check In & Add to OPD Queue
              </button>
            </div>
          </form>

          {/* RIGHT PANE: MY OPD / COMPLETED Queue Cards */}
          <div className="lg:col-span-8 xl:col-span-8 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            {/* Blue Header Tabs */}
            <div className="bg-[#0d6efd] text-white px-4 pt-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold">
                <button
                  onClick={() => setOpdTab("my-opd")}
                  className={`px-3.5 py-2 rounded-t-lg transition ${
                    opdTab === "my-opd" ? "bg-white text-blue-700" : "text-white/85 hover:bg-white/10"
                  }`}
                >
                  MY OPD ({String(myOpdApts.length).padStart(2, "0")})
                </button>
                <button
                  onClick={() => setOpdTab("completed")}
                  className={`px-3.5 py-2 rounded-t-lg transition ${
                    opdTab === "completed" ? "bg-white text-blue-700" : "text-white/85 hover:bg-white/10"
                  }`}
                >
                  COMPLETED ({String(completedApts.length).padStart(2, "0")})
                </button>
              </div>

              <div className="flex items-center gap-2 pb-1.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-white/70 absolute left-2.5 top-1.5" />
                  <input
                    value={queueFilter}
                    onChange={(e) => setQueueFilter(e.target.value)}
                    placeholder="Filter queue..."
                    className="pl-7 pr-2.5 py-1 rounded-lg bg-white/15 text-white placeholder:text-white/70 text-xs outline-none w-36 sm:w-44"
                  />
                </div>
                <Filter className="w-4 h-4 text-white/80" />
                <Settings className="w-4 h-4 text-white/80" />
              </div>
            </div>

            {/* Queue List */}
            <div className="p-3.5 space-y-3 bg-slate-50/70 min-h-[480px]">
              {activeList.map((apt, idx) => {
                const patient = state.patients.find((p) => p.id === apt.patientId);
                if (!patient) return null;
                const isUpNext = opdTab === "my-opd" && idx === 0;
                const waitStr = apt.waitMinutes
                  ? apt.waitMinutes >= 60
                    ? `${String(Math.floor(apt.waitMinutes / 60)).padStart(2, "0")}h`
                    : `${apt.waitMinutes}m`
                  : "15m";
                const fee = apt.consultationFee || 800;

                return (
                  <div
                    key={apt.id}
                    className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:border-blue-300 transition space-y-2.5"
                  >
                    {/* Status Badges Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                        {isUpNext && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">Up Next</span>
                        )}
                        {apt.isNewPatient && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            New Patient
                          </span>
                        )}
                        {patient.abhaStatus === "ABHA Linked" ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> ABHA Linked
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 inline-flex items-center gap-1">
                            ⚙ No ABHA
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 capitalize">
                        {apt.status.replace("-", " ")}
                      </span>
                    </div>

                    {/* Patient Main Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="text-sm font-extrabold text-slate-700 w-7 pt-0.5">
                          {apt.tokenNumber.replace("T-", "")}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              onClick={() => openPatientVisitHub(patient.id)}
                              className="text-sm font-bold text-blue-700 hover:underline flex items-center gap-1 text-left"
                            >
                              {patient.name} | {patient.gender[0]} | {patient.age}y
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            #{patient.uhid || patient.mrn} • {patient.phone}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <button
                          onClick={() =>
                            updateAppointmentDetails(apt.id, {
                              paymentStatus: apt.paymentStatus === "paid" ? "pending" : "paid",
                            })
                          }
                          className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 ${
                            apt.paymentStatus === "paid"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-amber-50 border-amber-200 text-amber-700"
                          }`}
                        >
                          <CreditCard className="w-3 h-3" />
                          {apt.paymentStatus === "paid" ? "paid" : "pending"} +
                        </button>
                        <span className="text-slate-600 font-medium">{apt.visitType || "Walkin"}</span>
                        <span className="text-slate-500">Assessment</span>
                        <button
                          onClick={() => setServiceModalAptId(apt.id)}
                          className="text-blue-600 font-semibold hover:underline"
                        >
                          Add Services +
                        </button>
                      </div>
                    </div>

                    {/* Bottom Action Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px]">
                          Wait: {waitStr} | {apt.checkedInAt || apt.startTime}
                        </span>
                        <button
                          onClick={() =>
                            updateAppointmentDetails(apt.id, {
                              paymentMethod: apt.paymentMethod === "Cash" ? "UPI" : "Cash",
                              paymentStatus: "paid",
                            })
                          }
                          className="px-2.5 py-1 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1"
                        >
                          <IndianRupee className="w-3 h-3" /> {fee} {apt.paymentMethod || "Cash"}
                        </button>

                        {patient.abhaStatus === "ABHA Linked" && patient.abhaId ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-mono">
                            {patient.abhaId}
                          </span>
                        ) : (
                          <button
                            onClick={() => setAbhaModalPatId(patient.id)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-semibold"
                          >
                            + Create Abha
                          </button>
                        )}

                        <button
                          onClick={() => setVitalsModalPatId(patient.id)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <HeartPulse className="w-3 h-3 text-rose-500" /> Vitals
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {apt.status !== "completed" && (
                          <button
                            onClick={() => updateAppointmentStatus(apt.id, "completed")}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-semibold"
                            title="Mark Completed"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => openPrescriptionPad(patient.id, apt.id)}
                          className="px-4 py-1.5 rounded-lg bg-white border border-blue-600 text-blue-700 hover:bg-blue-600 hover:text-white font-bold text-xs transition inline-flex items-center gap-1.5 shadow-2xs"
                        >
                          ✎ Write
                        </button>
                      </div>
                    </div>

                    {apt.servicesAdded && apt.servicesAdded.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {apt.servicesAdded.map((srv, sIdx) => (
                          <span key={sIdx} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold">
                            + {srv}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {activeList.length === 0 && (
                <div className="text-center py-16 text-xs text-slate-400">
                  No patients in {opdTab === "my-opd" ? "MY OPD" : "COMPLETED"} queue.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Staff & Client Attendance View (preserved from CliniFlow OS) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-600" />
              Staff Digital Check-In / Shift Log
            </h2>
            <p className="text-xs text-slate-500 mb-4">Live branch workforce & attendance tracking</p>
            <div className="space-y-2.5">
              {state.staff.map((s) => (
                <div key={s.id} className="p-3 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${s.avatarColor} text-white text-xs font-bold flex items-center justify-center`}>
                      {s.name.replace("Dr. ", "").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{s.name}</div>
                      <div className="text-[11px] text-slate-500 capitalize">
                        {s.role} {s.specialty ? `• ${s.specialty}` : ""} • {s.workingHours}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${s.status === "off-duty" ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700"}`}>
                      {s.status.replace("-", " ")}
                    </span>
                    <button
                      onClick={() => toggleStaffStatus(s.id)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50"
                    >
                      {s.status === "off-duty" ? "Check In" : "Check Out"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              Patient Attendance & Session Adherence
            </h2>
            <p className="text-xs text-slate-500 mb-4">Tracks check-ins and completed sessions</p>
            <div className="space-y-2.5">
              {todayApts.map((apt) => {
                const p = state.patients.find((pt) => pt.id === apt.patientId);
                return (
                  <div key={apt.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{p?.name} (#{apt.tokenNumber})</div>
                      <div className="text-[11px] text-slate-500">Scheduled {apt.startTime} • {apt.checkedInAt ? `Arrived ${apt.checkedInAt}` : "Awaiting arrival"}</div>
                    </div>
                    {apt.status === "completed" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Attended</span>
                    ) : (
                      <button
                        onClick={() => updateAppointmentStatus(apt.id, "checked-in")}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-semibold"
                      >
                        Mark Present
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom AI Actions (from video) */}
      <div className="fixed bottom-4 right-5 z-20 flex flex-wrap items-center gap-2.5">
        <button
          onClick={() => setDoctorAiOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-lg hover:bg-slate-50 text-xs font-bold text-slate-800 inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-blue-600" />
          Meet DocAssist AI
        </button>
        <button
          onClick={() => {
            const firstApt = myOpdApts[0] || todayApts[0];
            if (firstApt) {
              openPrescriptionPad(firstApt.patientId, firstApt.id, { autoVoice: true });
            } else {
              openPrescriptionPad(state.patients[0].id, undefined, { autoVoice: true });
            }
          }}
          className="px-3.5 py-2 rounded-xl bg-white border border-blue-200 shadow-lg hover:bg-blue-50 text-xs font-bold text-blue-700 inline-flex items-center gap-2"
        >
          <Mic className="w-4 h-4 text-blue-600" />
          Generate prescription from voice
        </button>
      </div>

      {/* Quick Vitals Modal */}
      {vitalsModalPatId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={() => setVitalsModalPatId(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addVitalRecord(vitalsModalPatId, {
                recordedAt: TODAY_STR,
                bpSystolic: vBpSys,
                bpDiastolic: vBpDia,
                heartRate: vHr,
                temperatureF: 98.4,
                spo2: vSpo2,
                weightKg: vWt,
                heightCm: 168,
                source: "clinic",
              });
              setVitalsModalPatId(null);
            }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-xl text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Record Staff Pre-Visit Vitals</h3>
              <button type="button" onClick={() => setVitalsModalPatId(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="font-semibold text-slate-500">BP Systolic</label>
                <input type="number" value={vBpSys} onChange={(e) => setVBpSys(Number(e.target.value))} className="w-full mt-1 px-2.5 py-1.5 border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="font-semibold text-slate-500">BP Diastolic</label>
                <input type="number" value={vBpDia} onChange={(e) => setVBpDia(Number(e.target.value))} className="w-full mt-1 px-2.5 py-1.5 border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="font-semibold text-slate-500">Pulse (/min)</label>
                <input type="number" value={vHr} onChange={(e) => setVHr(Number(e.target.value))} className="w-full mt-1 px-2.5 py-1.5 border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="font-semibold text-slate-500">SpO2 (%)</label>
                <input type="number" value={vSpo2} onChange={(e) => setVSpo2(Number(e.target.value))} className="w-full mt-1 px-2.5 py-1.5 border border-slate-200 rounded-lg" />
              </div>
              <div className="col-span-2">
                <label className="font-semibold text-slate-500">Weight (kgs)</label>
                <input type="number" value={vWt} onChange={(e) => setVWt(Number(e.target.value))} className="w-full mt-1 px-2.5 py-1.5 border border-slate-200 rounded-lg" />
              </div>
            </div>
            <button type="submit" className="w-full py-2 rounded-xl bg-blue-600 text-white font-bold">
              Save & Lock Vitals
            </button>
          </form>
        </div>
      )}

      {/* Create ABHA Modal */}
      {abhaModalPatId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={() => setAbhaModalPatId(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!abhaInput.trim()) return;
              linkPatientAbha(abhaModalPatId, abhaInput);
              setAbhaModalPatId(null);
              setAbhaInput("");
            }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-xl text-xs"
          >
            <h3 className="text-sm font-bold text-slate-900">Create / Link ABHA Address</h3>
            <input
              required
              value={abhaInput}
              onChange={(e) => setAbhaInput(e.target.value)}
              placeholder="e.g. name1234@abdm"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
            <button type="submit" className="w-full py-2 rounded-xl bg-blue-600 text-white font-bold">
              Link ABHA
            </button>
          </form>
        </div>
      )}

      {/* Add Services Modal */}
      {serviceModalAptId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={() => setServiceModalAptId(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const target = state.appointments.find((a) => a.id === serviceModalAptId);
              if (target) {
                updateAppointmentDetails(target.id, {
                  servicesAdded: [...(target.servicesAdded || []), extraServiceInput],
                });
                notify("Service added to OPD visit", extraServiceInput);
              }
              setServiceModalAptId(null);
            }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-xl text-xs"
          >
            <h3 className="text-sm font-bold text-slate-900">Add Clinic Service / Procedure</h3>
            <select
              value={extraServiceInput}
              onChange={(e) => setExtraServiceInput(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
            >
              <option>Spirometry (₹900)</option>
              <option>FENO Test (₹1,400)</option>
              <option>Nebulization (₹250)</option>
              <option>ECG 12-Lead (₹400)</option>
              <option>Sleep Study Booking (₹4,500)</option>
            </select>
            <button type="submit" className="w-full py-2 rounded-xl bg-blue-600 text-white font-bold">
              Add Service
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
