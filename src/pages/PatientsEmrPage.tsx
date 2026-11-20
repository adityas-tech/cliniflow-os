import React, { useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bot,
  Calendar,
  Check,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Dumbbell,
  FileText,
  FlaskConical,
  GitMerge,
  HeartPulse,
  MessageSquare,
  Pill,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserPlus,
  Utensils,
  Watch,
  X,
} from "lucide-react";
import { DoctorConsultCopilot } from "../components/DoctorConsultCopilot";
import { useClinic } from "../context/ClinicContext";
import { TODAY_STR } from "../data/seedData";
import { ClinicSpecialty } from "../types/clinic";

type HubSection =
  | "past-visits"
  | "overview"
  | "treatments"
  | "medical-history"
  | "records"
  | "vitals"
  | "assessments"
  | "billing";

export const PatientsEmrPage: React.FC = () => {
  const {
    state,
    selectedPatientId,
    setSelectedPatientId,
    patientViewMode,
    setPatientViewMode,
    openPatientVisitHub,
    openPrescriptionPad,
    addPatient,
    addVitalRecord,
    syncWearable,
    addLabOrder,
    updateLabOrderStatus,
    addDietPlan,
    addWorkoutPlan,
    linkPatientAbha,
    mergePatients,
    notify,
  } = useClinic();

  const [search, setSearch] = useState("");
  const [hubSection, setHubSection] = useState<HubSection>("past-visits");
  const [newPatientOpen, setNewPatientOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergePrimaryId, setMergePrimaryId] = useState(state.patients[0]?.id || "");
  const [mergeDupId, setMergeDupId] = useState(state.patients[1]?.id || "");
  const [abhaModalPatId, setAbhaModalPatId] = useState<string | null>(null);
  const [abhaInput, setAbhaInput] = useState("");

  // New Patient Form
  const [npName, setNpName] = useState("");
  const [npPhone, setNpPhone] = useState("");
  const [npAge, setNpAge] = useState(32);
  const [npGender, setNpGender] = useState<"Male" | "Female" | "Other">("Female");
  const [npSpec, setNpSpec] = useState<ClinicSpecialty>("Pulmonology & Sleep");
  const [npAllergies, setNpAllergies] = useState("");

  // Vitals Form
  const [bpSys, setBpSys] = useState(124);
  const [bpDia, setBpDia] = useState(80);
  const [hr, setHr] = useState(74);
  const [temp, setTemp] = useState(98.4);
  const [spo2, setSpo2] = useState(99);
  const [weight, setWeight] = useState(70);
  const [glucose, setGlucose] = useState(110);

  // Lab Order
  const [labTest, setLabTest] = useState("Pulmonary Function Test (PFT / Spirometry)");
  const [labPriority, setLabPriority] = useState<"routine" | "urgent">("routine");

  const filteredPatients = state.patients.filter((p) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.uhid || p.mrn).toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.specialtyTag.toLowerCase().includes(q)
    );
  });

  const patient = state.patients.find((p) => p.id === selectedPatientId) || state.patients[0];
  const abhaCount = state.patients.filter((p) => p.abhaStatus === "ABHA Linked").length;
  const activeBranch = state.branches.find((b) => b.id === state.activeBranchId) || state.branches[0];

  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    const created = addPatient({
      name: npName,
      phone: npPhone,
      email: `${npName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      dob: "1992-06-15",
      age: npAge,
      gender: npGender,
      bloodGroup: "O+",
      branchId: state.activeBranchId === "all" ? "br-1" : state.activeBranchId,
      specialtyTag: npSpec,
      allergies: npAllergies ? npAllergies.split(",").map((s) => s.trim()) : ["None Known"],
      chronicConditions: [],
    });
    setSelectedPatientId(created.id);
    setNewPatientOpen(false);
    setNpName("");
    setNpPhone("");
  };

  // ============================================================================
  // VIEW 1: ALL PATIENTS DIRECTORY TABLE (matches 0:58–1:10 of video)
  // ============================================================================
  if (patientViewMode === "directory") {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900">Patients ({state.patients.length})</h1>
                <span className="px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                  {activeBranch?.name.split("—")[0].trim()}
                </span>
              </div>
              <div className="text-xs font-semibold text-blue-600 mt-1">
                {abhaCount} Patients with ABHA
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by UHID / Phone / Name"
                  className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl w-64 outline-none focus:border-blue-500"
                />
              </div>
              <button
                onClick={() => setMergeOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
              >
                <GitMerge className="w-3.5 h-3.5" /> Merge Profiles
              </button>
              <button
                onClick={() => setNewPatientOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0d6efd] hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" /> Add New
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Sr. No.</th>
                  <th className="py-3 px-4">Patient Details</th>
                  <th className="py-3 px-4">UHID</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">ABHA Id</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => openPatientVisitHub(p.id)}
                        className="font-bold text-blue-700 hover:underline text-left"
                      >
                        {p.name.toUpperCase()}
                      </button>
                      <span className="text-slate-600">, {p.gender}, {p.age}y</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{p.uhid || p.mrn}</td>
                    <td className="py-3 px-4 text-slate-600">{p.phone}</td>
                    <td className="py-3 px-4">
                      {p.abhaStatus === "ABHA Linked" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" /> ABHA Linked
                        </span>
                      ) : (
                        <button
                          onClick={() => setAbhaModalPatId(p.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold hover:bg-rose-100"
                        >
                          ● No ABHA ▸
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openPrescriptionPad(p.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-blue-700 hover:bg-blue-50 font-bold"
                      >
                        →] Start Visit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modals */}
        {newPatientOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4" onClick={() => setNewPatientOpen(false)}>
            <form onSubmit={handleRegisterPatient} className="bg-white rounded-2xl p-5 w-full max-w-md space-y-3.5 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Register New Patient</h3>
                <button type="button" onClick={() => setNewPatientOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <input required value={npName} onChange={(e) => setNpName(e.target.value)} placeholder="Patient Full Name" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
              <input required value={npPhone} onChange={(e) => setNpPhone(e.target.value)} placeholder="Mobile / WhatsApp (+91 ...)" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
              <div className="grid grid-cols-3 gap-2">
                <input type="number" value={npAge} onChange={(e) => setNpAge(Number(e.target.value))} placeholder="Age" className="px-3 py-2 text-xs border border-slate-200 rounded-xl" />
                <select value={npGender} onChange={(e) => setNpGender(e.target.value as "Male" | "Female" | "Other")} className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
                <select value={npSpec} onChange={(e) => setNpSpec(e.target.value as ClinicSpecialty)} className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
                  <option value="Pulmonology & Sleep">Pulmonology</option>
                  <option value="ENT & Head-Neck">ENT</option>
                  <option value="General Medicine">General</option>
                  <option value="Diabetes & Nutrition">Diabetes</option>
                </select>
              </div>
              <input value={npAllergies} onChange={(e) => setNpAllergies(e.target.value)} placeholder="Known Allergies (comma separated)" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
              <button type="submit" className="w-full py-2.5 rounded-xl bg-[#0d6efd] text-white text-xs font-semibold flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" /> Create Patient Profile
              </button>
            </form>
          </div>
        )}

        {mergeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4" onClick={() => setMergeOpen(false)}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                mergePatients(mergePrimaryId, mergeDupId);
                setMergeOpen(false);
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-5 w-full max-w-md space-y-3 shadow-xl text-xs"
            >
              <h3 className="text-sm font-bold text-slate-900">Merge Duplicate Patient Profiles</h3>
              <div>
                <label className="font-semibold text-slate-600">Primary Profile (Keep)</label>
                <select value={mergePrimaryId} onChange={(e) => setMergePrimaryId(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl bg-white">
                  {state.patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.uhid || p.mrn})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-600">Duplicate Profile (Merge & Remove)</label>
                <select value={mergeDupId} onChange={(e) => setMergeDupId(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl bg-white">
                  {state.patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.uhid || p.mrn})</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-[#0d6efd] text-white font-bold">
                Merge Profiles
              </button>
            </form>
          </div>
        )}

        {abhaModalPatId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4" onClick={() => setAbhaModalPatId(null)}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!abhaInput.trim()) return;
                linkPatientAbha(abhaModalPatId, abhaInput);
                setAbhaModalPatId(null);
                setAbhaInput("");
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-3 shadow-xl text-xs"
            >
              <h3 className="text-sm font-bold text-slate-900">Link ABHA ID</h3>
              <input required value={abhaInput} onChange={(e) => setAbhaInput(e.target.value)} placeholder="e.g. patient@abdm" className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
              <button type="submit" className="w-full py-2 rounded-xl bg-[#0d6efd] text-white font-bold">Verify & Link</button>
            </form>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // VIEW 2: PATIENT VISIT HUB (matches 0:06–0:12 of video)
  // ============================================================================
  const latestVitals = patient.vitals[patient.vitals.length - 1];
  const patientNotes = state.clinicalNotes.filter((n) => n.patientId === patient.id);
  const patientRxs = state.prescriptions.filter((r) => r.patientId === patient.id);
  const patientLabs = state.labOrders.filter((l) => l.patientId === patient.id);
  const patientDiets = state.dietPlans.filter((d) => d.patientId === patient.id);
  const patientWorkouts = state.workoutPlans.filter((w) => w.patientId === patient.id);
  const patientInvoices = state.invoices.filter((i) => i.patientId === patient.id);
  const doctors = state.staff.filter((s) => s.role === "doctor");

  const labCatalog = [
    { name: "Pulmonary Function Test (PFT / Spirometry)", cat: "Pulmonology", cost: 900 },
    { name: "Polysomnography (Overnight Sleep Study)", cat: "Sleep Lab", cost: 4500 },
    { name: "Comprehensive Metabolic & HbA1c Panel", cat: "Biochemistry", cost: 1250 },
    { name: "Thyroid Profile (T3, T4, TSH)", cat: "Endocrinology", cost: 750 },
    { name: "Chest X-Ray (PA View)", cat: "Radiology", cost: 550 },
  ];

  const handleRecordVitals = (e: React.FormEvent) => {
    e.preventDefault();
    addVitalRecord(patient.id, {
      recordedAt: TODAY_STR,
      bpSystolic: bpSys,
      bpDiastolic: bpDia,
      heartRate: hr,
      temperatureF: temp,
      spo2,
      weightKg: weight,
      heightCm: latestVitals?.heightCm || 170,
      bloodGlucoseMgDl: glucose,
      source: "clinic",
    });
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setPatientViewMode("directory")}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to All Patients ({state.patients.length})
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Profile & Navigation Column (from video 0:10) */}
        <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center shrink-0">
              {patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-extrabold uppercase text-slate-900 truncate">{patient.name}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {patient.age}Y | {patient.gender[0]} | #{patient.uhid || patient.mrn}
              </div>
              <div className="text-[11px] text-slate-500">{patient.phone}</div>
              <div className="mt-2">
                {patient.abhaStatus === "ABHA Linked" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3" /> ABHA Linked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold">
                    ● No ABHA
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => openPatientVisitHub(patient.id)}
            className="text-xs font-semibold text-blue-600 hover:underline block"
          >
            Merge Patients
          </button>

          {/* Left Nav Items */}
          <nav className="divide-y divide-slate-100 border-t border-slate-100 text-xs">
            {(
              [
                { id: "past-visits", label: "Past visits", icon: Calendar },
                { id: "overview", label: "Patient Overview", icon: Activity },
                { id: "treatments", label: "Treatments", icon: Utensils },
                { id: "medical-history", label: "Add Medical History", icon: Plus },
                { id: "records", label: "Medical Records", icon: FlaskConical },
                { id: "vitals", label: "Vitals & Lab Trends", icon: HeartPulse },
                { id: "assessments", label: "Assessments (AI Copilot)", icon: Stethoscope },
                { id: "billing", label: "Billing History & Comms", icon: CreditCard },
              ] as const
            ).map((item) => {
              const active = hubSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setHubSection(item.id)}
                  className={`w-full flex items-center justify-between py-2.5 px-2 text-left transition ${
                    active ? "bg-blue-50/80 text-blue-700 font-bold rounded-lg" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <item.icon className={`w-3.5 h-3.5 ${active ? "text-blue-600" : "text-slate-400"}`} />
                    {item.label}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              );
            })}
          </nav>

          {/* Primary Start Visit CTA (matches video 0:10) */}
          <button
            onClick={() => openPrescriptionPad(patient.id)}
            className="w-full py-2.5 rounded-xl bg-[#0d6efd] hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
          >
            Start Visit
          </button>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          {hubSection === "past-visits" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 min-h-[420px]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  SEE ALL PAST VISITS
                </h2>
                <button
                  onClick={() => openPrescriptionPad(patient.id)}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  + New Consultation Pad <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {patientNotes.length === 0 && patientRxs.length === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                  <div className="text-xs text-slate-400 font-medium">No visits from this patient yet</div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">November 2026</div>
                  {patientNotes.map((note) => (
                    <div key={note.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-bold text-slate-900">{note.createdAt} • {note.templateType}</div>
                        <button
                          onClick={() => openPrescriptionPad(patient.id)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50"
                        >
                          Open in Pad
                        </button>
                      </div>
                      <div><strong>Chief Complaint:</strong> {note.chiefComplaint}</div>
                      <div><strong>Assessment:</strong> {note.assessment}</div>
                      {note.medicinesSummary && (
                        <div><strong>Medicines:</strong> {note.medicinesSummary.join(", ")}</div>
                      )}
                    </div>
                  ))}
                  {patientRxs.map((rx) => (
                    <div key={rx.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5 text-xs">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>e-Prescription • {rx.createdAt}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px]">{rx.status}</span>
                      </div>
                      <div className="text-slate-600">{rx.diagnosis}</div>
                      <ul className="text-[11px] text-slate-700 space-y-0.5">
                        {rx.items.map((it) => (
                          <li key={it.id}>• {it.medicineName} ({it.frequency}, {it.timing})</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {hubSection === "overview" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Patient Overview</h2>
                <button
                  onClick={() => syncWearable(patient.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-sky-600" /> Sync Wearables
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500">Blood Group</div>
                  <div className="font-bold text-slate-900 mt-0.5">{patient.bloodGroup}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500">Specialty</div>
                  <div className="font-bold text-slate-900 mt-0.5">{patient.specialtyTag}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500">Allergies</div>
                  <div className="font-bold text-rose-700 mt-0.5">{patient.allergies.join(", ")}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500">Wallet Credits</div>
                  <div className="font-bold text-teal-700 mt-0.5">₹{patient.walletCredits}</div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Watch className="w-5 h-5 text-sky-600" />
                  <div>
                    <div className="font-bold text-slate-900">Wearable Telemetry</div>
                    <div className="text-slate-600">
                      {patient.wearable
                        ? `${patient.wearable.dailySteps.toLocaleString()} steps • ${patient.wearable.avgSleepHours}h sleep • Resting HR ${patient.wearable.restingHr} bpm`
                        : "Click Sync Wearables to pull Apple Health / OMRON / Google Fit data"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {hubSection === "vitals" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Vitals & Telemetry History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="py-2">Date</th>
                        <th className="py-2">BP</th>
                        <th className="py-2">HR</th>
                        <th className="py-2">SpO2</th>
                        <th className="py-2">Weight</th>
                        <th className="py-2">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {patient.vitals.slice().reverse().map((v) => (
                        <tr key={v.id}>
                          <td className="py-2 font-medium">{v.recordedAt}</td>
                          <td className="py-2 font-semibold">{v.bpSystolic}/{v.bpDiastolic}</td>
                          <td className="py-2">{v.heartRate} bpm</td>
                          <td className="py-2">{v.spo2}%</td>
                          <td className="py-2">{v.weightKg} kg</td>
                          <td className="py-2 capitalize text-slate-500">{v.source || "clinic"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <form onSubmit={handleRecordVitals} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 h-fit text-xs">
                <h3 className="text-sm font-bold text-slate-900">Record New Vitals</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-600">Systolic BP</label>
                    <input type="number" value={bpSys} onChange={(e) => setBpSys(Number(e.target.value))} className="w-full mt-1 px-2.5 py-1.5 border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600">Diastolic BP</label>
                    <input type="number" value={bpDia} onChange={(e) => setBpDia(Number(e.target.value))} className="w-full mt-1 px-2.5 py-1.5 border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600">Heart Rate</label>
                    <input type="number" value={hr} onChange={(e) => setHr(Number(e.target.value))} className="w-full mt-1 px-2.5 py-1.5 border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600">SpO2 (%)</label>
                    <input type="number" value={spo2} onChange={(e) => setSpo2(Number(e.target.value))} className="w-full mt-1 px-2.5 py-1.5 border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600">Temp (°F)</label>
                    <input type="number" step="0.1" value={temp} onChange={(e) => setTemp(Number(e.target.value))} className="w-full mt-1 px-2.5 py-1.5 border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600">Weight (kg)</label>
                    <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="w-full mt-1 px-2.5 py-1.5 border border-slate-200 rounded-lg" />
                  </div>
                </div>
                <button type="submit" className="w-full py-2 rounded-xl bg-[#0d6efd] text-white font-semibold">
                  Save Vitals Reading
                </button>
              </form>
            </div>
          )}

          {hubSection === "records" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 h-fit text-xs">
                <h3 className="text-sm font-bold text-slate-900">Order Diagnostic Lab Test</h3>
                <select value={labTest} onChange={(e) => setLabTest(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white">
                  {labCatalog.map((t) => (
                    <option key={t.name} value={t.name}>{t.name} — ₹{t.cost}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  {(["routine", "urgent"] as const).map((pr) => (
                    <button key={pr} type="button" onClick={() => setLabPriority(pr)} className={`flex-1 py-1.5 rounded-lg font-semibold capitalize border ${labPriority === pr ? "bg-blue-50 border-blue-500 text-blue-700" : "border-slate-200 text-slate-600"}`}>
                      {pr}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const item = labCatalog.find((l) => l.name === labTest) || labCatalog[0];
                    addLabOrder({ patientId: patient.id, doctorId: doctors[0]?.id || "doc-1", testName: item.name, category: item.cat, priority: labPriority, cost: item.cost });
                  }}
                  className="w-full py-2 rounded-xl bg-[#0d6efd] text-white font-semibold"
                >
                  Create Lab Order
                </button>
              </div>
              <div className="xl:col-span-2 space-y-3">
                {patientLabs.map((lab) => (
                  <div key={lab.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{lab.testName}</div>
                        <div className="text-slate-500">{lab.category} • {lab.orderedAt}</div>
                      </div>
                      {lab.status !== "report-ready" ? (
                        <button onClick={() => updateLabOrderStatus(lab.id, "report-ready")} className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-semibold">
                          Upload Report
                        </button>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">Report Ready</span>
                      )}
                    </div>
                    {lab.aiSummary && (
                      <div className="p-2.5 rounded-xl bg-violet-50 border border-violet-200 text-violet-950">
                        <strong className="flex items-center gap-1 text-violet-800"><Bot className="w-3.5 h-3.5" /> MedDoc AI:</strong> {lab.aiSummary}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {hubSection === "treatments" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5"><Utensils className="w-4 h-4 text-emerald-600" /> Diet Plans</h3>
                  <button
                    onClick={() =>
                      addDietPlan({
                        patientId: patient.id,
                        title: "AI Respiratory & Anti-Inflammatory Plan",
                        goal: "Optimize immunity & sleep hygiene",
                        caloriesTarget: 1800,
                        expiresAt: TODAY_STR,
                        aiGenerated: true,
                        restrictions: ["Cold drinks", "Refined Sugar"],
                        meals: [{ slot: "Breakfast", items: "Moong dal chilla + warm herbal tea", calories: 410, macros: "22g P" }],
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> NutriPlan AI
                  </button>
                </div>
                {patientDiets.map((dp) => (
                  <div key={dp.id} className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
                    <div className="font-bold text-slate-900">{dp.title}</div>
                    <div className="text-slate-600">{dp.goal} • {dp.caloriesTarget} kcal/day</div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5"><Dumbbell className="w-4 h-4 text-sky-600" /> Pulmonary / Rehab Protocols</h3>
                  <button
                    onClick={() =>
                      addWorkoutPlan({
                        patientId: patient.id,
                        title: "Pulmonary Breathing & Mobility Protocol",
                        goal: "Improve diaphragmatic endurance",
                        expiresAt: TODAY_STR,
                        exercises: [{ name: "Pursed-Lip Breathing", setsReps: "10 mins BD", frequency: "Daily", notes: "Seated upright" }],
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-sky-600 text-white font-semibold"
                  >
                    + Assign Protocol
                  </button>
                </div>
                {patientWorkouts.map((wp) => (
                  <div key={wp.id} className="p-3 rounded-xl bg-sky-50/50 border border-sky-200">
                    <div className="font-bold text-slate-900">{wp.title}</div>
                    <div className="text-slate-600">{wp.goal}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hubSection === "medical-history" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 text-xs">
              <h3 className="text-sm font-bold text-slate-900">Medical History & Chronic Conditions</h3>
              <div className="flex flex-wrap gap-2">
                {patient.chronicConditions.map((c) => (
                  <span key={c} className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-semibold">{c}</span>
                ))}
                {patient.allergies.map((a) => (
                  <span key={a} className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Allergy: {a}
                  </span>
                ))}
              </div>
              <button onClick={() => openPrescriptionPad(patient.id)} className="px-4 py-2 rounded-xl bg-[#0d6efd] text-white font-semibold">
                Update History in Prescription Pad →
              </button>
            </div>
          )}

          {hubSection === "assessments" && <DoctorConsultCopilot patient={patient} />}

          {hubSection === "billing" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 text-xs">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">WhatsApp & Portal Log</h3>
                  <button onClick={() => notify(`WhatsApp check-in sent to ${patient.name}`)} className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold">
                    + Send WhatsApp
                  </button>
                </div>
                {patient.communicationLog.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="font-semibold text-slate-700">{c.channel} • {c.sentAt}</div>
                    <div className="text-slate-600 mt-0.5">{c.message}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Billing History</h3>
                {patientInvoices.map((inv) => (
                  <div key={inv.id} className="p-3 rounded-xl border border-slate-200 flex justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{inv.invoiceNumber}</div>
                      <div className="text-slate-500">{inv.createdAt} • {inv.paymentMethod}</div>
                    </div>
                    <div className="text-right font-bold">₹{inv.totalAmount} ({inv.status})</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
