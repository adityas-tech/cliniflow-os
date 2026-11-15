import React, { useState } from "react";
import {
  Activity,
  AlertCircle,
  Bot,
  Check,
  Dumbbell,
  FileText,
  FlaskConical,
  HeartPulse,
  MessageSquare,
  Mic,
  Pill,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  UserPlus,
  Utensils,
  Watch,
  X,
} from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { TODAY_STR } from "../data/seedData";
import { ClinicSpecialty, ClinicalNote, PrescriptionItem } from "../types/clinic";

type EmrTab = "overview" | "notes" | "rx" | "labs" | "careplan" | "comms";

export const PatientsEmrPage: React.FC = () => {
  const {
    state,
    selectedPatientId,
    setSelectedPatientId,
    addPatient,
    addVitalRecord,
    syncWearable,
    addClinicalNote,
    addPrescription,
    addLabOrder,
    updateLabOrderStatus,
    addDietPlan,
    addWorkoutPlan,
    notify,
  } = useClinic();

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<EmrTab>("overview");
  const [newPatientOpen, setNewPatientOpen] = useState(false);

  // New Patient Form
  const [npName, setNpName] = useState("");
  const [npPhone, setNpPhone] = useState("");
  const [npAge, setNpAge] = useState(32);
  const [npGender, setNpGender] = useState<"Male" | "Female" | "Other">("Female");
  const [npSpec, setNpSpec] = useState<ClinicSpecialty>("General Medicine");
  const [npAllergies, setNpAllergies] = useState("");

  // Vitals Form
  const [bpSys, setBpSys] = useState(124);
  const [bpDia, setBpDia] = useState(80);
  const [hr, setHr] = useState(74);
  const [temp, setTemp] = useState(98.4);
  const [spo2, setSpo2] = useState(99);
  const [weight, setWeight] = useState(70);
  const [glucose, setGlucose] = useState(110);

  // Clinical Note + VoiceCmd
  const [noteType, setNoteType] = useState<ClinicalNote["templateType"]>("SOAP");
  const [chief, setChief] = useState("");
  const [subj, setSubj] = useState("");
  const [obj, setObj] = useState("");
  const [assess, setAssess] = useState("");
  const [plan, setPlan] = useState("");
  const [icd, setIcd] = useState("E11.9");
  const [prakriti, setPrakriti] = useState("Vata-Pitta");
  const [vikriti, setVikriti] = useState("Pitta Aggravated");
  const [agni, setAgni] = useState("Tikshnagni");
  const [nadi, setNadi] = useState("Manduka Gati");
  const [isListening, setIsListening] = useState(false);

  // e-Prescription Builder
  const [rxDiagnosis, setRxDiagnosis] = useState("");
  const [rxNotes, setRxNotes] = useState("");
  const [rxWhatsApp, setRxWhatsApp] = useState(true);
  const [rxItems, setRxItems] = useState<PrescriptionItem[]>([]);
  const [selInvId, setSelInvId] = useState(state.inventory[0]?.id || "");
  const [rxFreq, setRxFreq] = useState("1-0-1");
  const [rxTiming, setRxTiming] = useState<PrescriptionItem["timing"]>("After Food");
  const [rxDays, setRxDays] = useState(15);
  const [printRxId, setPrintRxId] = useState<string | null>(null);

  // Lab Order
  const [labTest, setLabTest] = useState("Comprehensive Metabolic & HbA1c Panel");
  const [labPriority, setLabPriority] = useState<"routine" | "urgent">("routine");

  const filteredPatients = state.patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.mrn.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search) ||
      p.specialtyTag.toLowerCase().includes(search.toLowerCase())
  );

  const patient = state.patients.find((p) => p.id === selectedPatientId) || state.patients[0];
  const latestVitals = patient?.vitals[patient.vitals.length - 1];
  const patientNotes = state.clinicalNotes.filter((n) => n.patientId === patient?.id);
  const patientRxs = state.prescriptions.filter((r) => r.patientId === patient?.id);
  const patientLabs = state.labOrders.filter((l) => l.patientId === patient?.id);
  const patientDiets = state.dietPlans.filter((d) => d.patientId === patient?.id);
  const patientWorkouts = state.workoutPlans.filter((w) => w.patientId === patient?.id);
  const patientInvoices = state.invoices.filter((i) => i.patientId === patient?.id);
  const membership = state.memberships.find((m) => m.id === patient?.membershipId);

  const doctors = state.staff.filter((s) => s.role === "doctor");

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

  const handleRecordVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
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

  const runVoiceCmdSimulate = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      if (noteType === "Ayurveda Prakriti") {
        setChief("Chronic fatigue, disturbed sleep, post-meal bloating");
        setSubj("Patient reports waking around 3 AM, acid reflux after spicy foods.");
        setObj("Nadi reveals Vata-Pitta predominance; tongue shows mild Ama coating.");
        setAssess("Vata-Pitta Prakopa with Mandagni");
        setPlan("Start Ashwagandha Churna 1 tsp bedtime, Panchakarma Shirodhara x5, warm cooked meals.");
      } else {
        setChief("Follow-up metabolic review & mild morning dizziness");
        setSubj("Adherent to medication. Morning fasting sugars averaging 126 mg/dL. Reports 7,500 daily steps via Apple Health.");
        setObj(`BP ${latestVitals?.bpSystolic || 126}/${latestVitals?.bpDiastolic || 82} mmHg, HR ${latestVitals?.heartRate || 72} bpm, SpO2 ${latestVitals?.spo2 || 99}%. Cardiovascular & chest exam clear.`);
        setAssess(`${patient?.chronicConditions.join(", ") || "Stable Metabolic Profile"} — improving glycemic trend.`);
        setPlan("Continue current antihyperglycemic regimen, add Vitamin D3 60K weekly, reinforce low-GI NutriPlan diet. Follow up in 4 weeks.");
      }
      notify("VoiceCmd AI Scribe transcribed consultation into structured note", undefined, "info");
    }, 900);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !chief.trim()) return;
    addClinicalNote({
      patientId: patient.id,
      doctorId: doctors[0]?.id || "doc-1",
      templateType: noteType,
      chiefComplaint: chief,
      subjective: subj,
      objective: obj,
      assessment: assess,
      plan,
      icdCode: icd,
      ayurvedaDosha: noteType === "Ayurveda Prakriti" ? { prakriti, vikriti, agni, nadi } : undefined,
    });
    setChief("");
    setSubj("");
    setObj("");
    setAssess("");
    setPlan("");
  };

  const handleAddRxItem = () => {
    const inv = state.inventory.find((i) => i.id === selInvId);
    if (!inv) return;
    const freqCount = rxFreq === "1-0-1" ? 2 : rxFreq === "1-1-1" ? 3 : 1;
    const qty = Math.max(1, freqCount * rxDays);
    setRxItems((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        inventoryItemId: inv.id,
        medicineName: inv.name,
        dosage: inv.unit === "Tablets" || inv.unit === "Capsules" ? "1 unit" : "As directed",
        frequency: rxFreq,
        timing: rxTiming,
        durationDays: rxDays,
        quantity: qty,
      },
    ]);
  };

  const handleSaveRx = () => {
    if (!patient || rxItems.length === 0) return;
    addPrescription({
      patientId: patient.id,
      doctorId: doctors[0]?.id || "doc-1",
      diagnosis: rxDiagnosis || patient.chronicConditions[0] || "Outpatient Care",
      items: rxItems,
      notes: rxNotes,
      sentViaWhatsApp: rxWhatsApp,
    });
    setRxItems([]);
    setRxDiagnosis("");
    setRxNotes("");
  };

  const handleGenerateNutriPlan = () => {
    if (!patient) return;
    const isDiabetic = patient.chronicConditions.some((c) => c.toLowerCase().includes("diab"));
    addDietPlan({
      patientId: patient.id,
      title: isDiabetic ? "AI Low-GI Glycemic Control Plan" : "AI Balanced Anti-Inflammatory Plan",
      goal: isDiabetic ? "Stabilize post-meal glucose & optimize HbA1c" : "Improve gut agni, energy & sleep quality",
      caloriesTarget: 1800,
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      aiGenerated: true,
      restrictions: [...patient.allergies.filter((a) => a !== "None Known"), "Refined Sugar", "Ultra-processed snacks"],
      meals: [
        { slot: "Early Morning", items: "Warm cumin-fenugreek water + 6 soaked almonds & 2 walnuts", calories: 110, macros: "4g P / 3g C / 9g F" },
        { slot: "Breakfast", items: "2 Moong dal chillas with mint chutney + 100g spiced paneer/tofu", calories: 420, macros: "24g P / 44g C / 14g F" },
        { slot: "Mid-Morning", items: "1 bowl seasonal papaya/berries + green tea", calories: 120, macros: "2g P / 26g C / 0g F" },
        { slot: "Lunch", items: "1 cup Foxtail millet + Palak dal + Stir-fried greens + 150ml buttermilk", calories: 560, macros: "21g P / 70g C / 14g F" },
        { slot: "Evening Snack", items: "Roasted chana & makhana trail mix (35g)", calories: 145, macros: "6g P / 22g C / 3g F" },
        { slot: "Dinner", items: "2 Jowar rotis + Grilled veggies / vegetable clear soup + salad", calories: 445, macros: "18g P / 52g C / 14g F" },
      ],
    });
  };

  const handleAddSampleWorkout = () => {
    if (!patient) return;
    addWorkoutPlan({
      patientId: patient.id,
      title: "Daily Metabolic & Mobility Protocol (30 Mins)",
      goal: "Improve insulin sensitivity & postural endurance",
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      exercises: [
        { name: "Zone-2 Brisk Walk", setsReps: "25 mins continuous", frequency: "Daily", notes: "Post-dinner glucose dip walk recommended" },
        { name: "Bodyweight Sit-to-Stand", setsReps: "3 sets x 12 reps", frequency: "4x / week", notes: "Controlled eccentric lower" },
        { name: "Thoracic Open-Book Stretch", setsReps: "2 sets x 8 each side", frequency: "Daily", notes: "Deep diaphragmatic breathing" },
      ],
    });
  };

  const labCatalog = [
    { name: "Comprehensive Metabolic & HbA1c Panel", cat: "Biochemistry", cost: 1250 },
    { name: "Thyroid Profile (T3, T4, TSH)", cat: "Endocrinology", cost: 750 },
    { name: "Complete Blood Count (CBC) + ESR", cat: "Hematology", cost: 450 },
    { name: "Vitamin D (25-OH) & B12 Combo", cat: "Vitamins", cost: 1400 },
    { name: "Lipid Profile (Fasting)", cat: "Cardiology", cost: 650 },
  ];

  const printTargetRx = state.prescriptions.find((r) => r.id === printRxId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Patient Directory Sidebar */}
      <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col max-h-[calc(100vh-7.5rem)]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900">Patients ({filteredPatients.length})</h2>
          <button
            onClick={() => setNewPatientOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700"
          >
            <UserPlus className="w-3.5 h-3.5" /> New
          </button>
        </div>

        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, MRN, phone, specialty..."
            className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {filteredPatients.map((p) => {
            const active = p.id === patient?.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPatientId(p.id)}
                className={`w-full text-left p-3 rounded-xl border transition ${
                  active
                    ? "bg-teal-50/80 border-teal-500 shadow-2xs"
                    : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{p.name}</span>
                  <span className="text-[10px] font-semibold text-slate-500">{p.mrn}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{p.age}y {p.gender} • {p.specialtyTag}</div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {p.membershipId && (
                    <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-semibold">Member</span>
                  )}
                  {p.allergies[0] !== "None Known" && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-semibold">
                      Allergy: {p.allergies[0]}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Patient 360 Healthboard */}
      {patient && (
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          {/* Patient Identity Banner */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 text-white font-bold text-base flex items-center justify-center shrink-0">
                  {patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-lg font-bold text-slate-900">{patient.name}</h1>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">{patient.mrn}</span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
                      Blood: {patient.bloodGroup}
                    </span>
                    {membership && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold">
                        {membership.name.split("(")[0]} ({patient.membershipSessionsLeft} sessions left)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {patient.age} yrs • {patient.gender} • {patient.phone} • {patient.email} • Wallet Credits: <strong className="text-teal-700">₹{patient.walletCredits}</strong>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {patient.allergies.map((al) => (
                      <span
                        key={al}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          al === "None Known" ? "bg-slate-100 text-slate-600" : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        <AlertCircle className="w-3 h-3" /> Allergy: {al}
                      </span>
                    ))}
                    {patient.chronicConditions.map((cond) => (
                      <span key={cond} className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                        {cond}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => syncWearable(patient.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                  Sync Wearables
                </button>
              </div>
            </div>

            {/* Healthboard Sub-Navigation */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
              {([
                { id: "overview", label: "Healthboard & Vitals", icon: HeartPulse },
                { id: "notes", label: "Clinical Notes & VoiceCmd AI", icon: FileText },
                { id: "rx", label: "Digital e-Prescription", icon: Pill },
                { id: "labs", label: "Lab Orders & MedDoc AI", icon: FlaskConical },
                { id: "careplan", label: "Diet & Workout (NutriPlan AI)", icon: Utensils },
                { id: "comms", label: "Forms, Comms & Billing", icon: MessageSquare },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    tab === t.id
                      ? "bg-teal-600 text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: Overview & Vitals */}
          {tab === "overview" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2 space-y-4">
                {/* Latest Vitals Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Blood Pressure", val: latestVitals ? `${latestVitals.bpSystolic}/${latestVitals.bpDiastolic}` : "—", unit: "mmHg", color: "text-rose-600" },
                    { label: "Heart Rate", val: latestVitals?.heartRate || "—", unit: "bpm", color: "text-teal-600" },
                    { label: "SpO2", val: latestVitals ? `${latestVitals.spo2}%` : "—", unit: "Oxygen", color: "text-sky-600" },
                    { label: "Temperature", val: latestVitals?.temperatureF || "—", unit: "°F", color: "text-amber-600" },
                    { label: "Weight / BMI", val: latestVitals ? `${latestVitals.weightKg} kg` : "—", unit: latestVitals ? `BMI ${(latestVitals.weightKg / Math.pow(latestVitals.heightCm / 100, 2)).toFixed(1)}` : "", color: "text-indigo-600" },
                    { label: "Fasting Glucose", val: latestVitals?.bloodGlucoseMgDl || "—", unit: "mg/dL", color: "text-violet-600" },
                  ].map((v) => (
                    <div key={v.label} className="bg-white rounded-2xl border border-slate-200/80 p-3.5">
                      <div className="text-[11px] font-semibold text-slate-500">{v.label}</div>
                      <div className={`text-lg font-bold mt-1 ${v.color}`}>{v.val}</div>
                      <div className="text-[10px] text-slate-400">{v.unit}</div>
                    </div>
                  ))}
                </div>

                {/* Vitals History Table + Trend */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-teal-600" />
                      Vitals & Device Telemetry History
                    </h3>
                    <span className="text-[11px] text-slate-400">{patient.vitals.length} readings</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] text-slate-500 border-b border-slate-100">
                        <tr>
                          <th className="py-2">Date</th>
                          <th className="py-2">BP</th>
                          <th className="py-2">HR</th>
                          <th className="py-2">Weight</th>
                          <th className="py-2">Glucose</th>
                          <th className="py-2">Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {patient.vitals.slice().reverse().map((v) => (
                          <tr key={v.id}>
                            <td className="py-2 font-medium">{v.recordedAt}</td>
                            <td className="py-2 font-semibold">{v.bpSystolic}/{v.bpDiastolic}</td>
                            <td className="py-2">{v.heartRate} bpm</td>
                            <td className="py-2">{v.weightKg} kg</td>
                            <td className="py-2">{v.bloodGlucoseMgDl || "—"}</td>
                            <td className="py-2">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold capitalize">
                                {v.source || "clinic"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Wearable Integration Card */}
                <div className="bg-gradient-to-r from-sky-50 to-indigo-50 rounded-2xl border border-sky-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white text-sky-600 flex items-center justify-center shadow-2xs">
                      <Watch className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Wearable Sync: {patient.wearable?.provider || "Apple Health / OMRON / Google Fit"}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        {patient.wearable
                          ? `${patient.wearable.dailySteps.toLocaleString()} steps • ${patient.wearable.avgSleepHours}h sleep • Resting HR ${patient.wearable.restingHr} bpm • Synced ${patient.wearable.lastSynced}`
                          : "No wearable synced yet — click Sync Wearables to pull live patient metrics"}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => syncWearable(patient.id)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-sky-200 text-sky-700 text-xs font-semibold hover:bg-sky-100 shrink-0"
                  >
                    Pull Latest
                  </button>
                </div>
              </div>

              {/* Record Vitals Form */}
              <form onSubmit={handleRecordVitals} className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 h-fit">
                <h3 className="text-sm font-bold text-slate-900">Record New Vitals</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Systolic BP</label>
                    <input type="number" value={bpSys} onChange={(e) => setBpSys(Number(e.target.value))} className="w-full mt-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Diastolic BP</label>
                    <input type="number" value={bpDia} onChange={(e) => setBpDia(Number(e.target.value))} className="w-full mt-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Heart Rate</label>
                    <input type="number" value={hr} onChange={(e) => setHr(Number(e.target.value))} className="w-full mt-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">SpO2 (%)</label>
                    <input type="number" value={spo2} onChange={(e) => setSpo2(Number(e.target.value))} className="w-full mt-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Temp (°F)</label>
                    <input type="number" step="0.1" value={temp} onChange={(e) => setTemp(Number(e.target.value))} className="w-full mt-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Weight (kg)</label>
                    <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="w-full mt-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Blood Glucose (mg/dL)</label>
                  <input type="number" value={glucose} onChange={(e) => setGlucose(Number(e.target.value))} className="w-full mt-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg" />
                </div>
                <button type="submit" className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold">
                  Save Vitals Reading
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Clinical Notes + VoiceCmd AI */}
          {tab === "notes" && (
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
              <form onSubmit={handleSaveNote} className="xl:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">New Consultation Note</h3>
                  <div className="flex items-center gap-2">
                    <select
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value as ClinicalNote["templateType"])}
                      className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50"
                    >
                      <option value="SOAP">Standard SOAP Note</option>
                      <option value="Ayurveda Prakriti">Ayurveda Prakriti & Dosha EMR</option>
                      <option value="Physiotherapy ROM">Physiotherapy ROM & Rehab</option>
                      <option value="Dermatology">Dermatology Lesion & Regimen</option>
                    </select>
                    <button
                      type="button"
                      onClick={runVoiceCmdSimulate}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        isListening
                          ? "bg-rose-600 text-white animate-pulse"
                          : "bg-violet-600 hover:bg-violet-700 text-white"
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                      {isListening ? "Transcribing..." : "VoiceCmd AI Dictate"}
                    </button>
                  </div>
                </div>

                {noteType === "Ayurveda Prakriti" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <div>
                      <label className="text-[10px] font-bold text-emerald-800 uppercase">Prakriti</label>
                      <input value={prakriti} onChange={(e) => setPrakriti(e.target.value)} className="w-full mt-1 px-2 py-1 text-xs bg-white border border-emerald-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-emerald-800 uppercase">Vikriti</label>
                      <input value={vikriti} onChange={(e) => setVikriti(e.target.value)} className="w-full mt-1 px-2 py-1 text-xs bg-white border border-emerald-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-emerald-800 uppercase">Agni</label>
                      <input value={agni} onChange={(e) => setAgni(e.target.value)} className="w-full mt-1 px-2 py-1 text-xs bg-white border border-emerald-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-emerald-800 uppercase">Nadi Pariksha</label>
                      <input value={nadi} onChange={(e) => setNadi(e.target.value)} className="w-full mt-1 px-2 py-1 text-xs bg-white border border-emerald-200 rounded-lg" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600">Chief Complaint</label>
                    <input required value={chief} onChange={(e) => setChief(e.target.value)} placeholder="Primary symptoms & duration..." className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">ICD-10 Code</label>
                    <input value={icd} onChange={(e) => setIcd(e.target.value)} className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Subjective (History)</label>
                    <textarea rows={3} value={subj} onChange={(e) => setSubj(e.target.value)} className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Objective (Exam / Findings)</label>
                    <textarea rows={3} value={obj} onChange={(e) => setObj(e.target.value)} className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Assessment / Diagnosis</label>
                    <textarea rows={2} value={assess} onChange={(e) => setAssess(e.target.value)} className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Treatment Plan & Follow-Up</label>
                    <textarea rows={2} value={plan} onChange={(e) => setPlan(e.target.value)} className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl" />
                  </div>
                </div>

                <button type="submit" className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold">
                  Sign & Save Clinical Note
                </button>
              </form>

              <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Past Consultation Notes ({patientNotes.length})</h3>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {patientNotes.map((n) => (
                    <div key={n.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-[10px] font-bold">{n.templateType}</span>
                        <span className="text-[11px] text-slate-400">{n.createdAt}</span>
                      </div>
                      <div className="font-bold text-slate-900">{n.chiefComplaint}</div>
                      {n.ayurvedaDosha && (
                        <div className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded">
                          Prakriti: {n.ayurvedaDosha.prakriti} • Vikriti: {n.ayurvedaDosha.vikriti} • Agni: {n.ayurvedaDosha.agni}
                        </div>
                      )}
                      <p className="text-slate-600"><strong>S:</strong> {n.subjective}</p>
                      <p className="text-slate-600"><strong>O:</strong> {n.objective}</p>
                      <p className="text-slate-700"><strong>A:</strong> {n.assessment} {n.icdCode ? `(${n.icdCode})` : ""}</p>
                      <p className="text-slate-700"><strong>P:</strong> {n.plan}</p>
                    </div>
                  ))}
                  {patientNotes.length === 0 && <div className="text-xs text-slate-400 py-8 text-center">No notes recorded yet.</div>}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Digital e-Prescription */}
          {tab === "rx" && (
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
              <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Create Digital e-Prescription</h3>
                  <span className="text-[11px] text-teal-700 font-semibold">Live Pharmacy Stock Linked</span>
                </div>

                <input
                  value={rxDiagnosis}
                  onChange={(e) => setRxDiagnosis(e.target.value)}
                  placeholder="Diagnosis (e.g., Type 2 Diabetes, Acute Pharyngitis...)"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />

                {/* Medicine Picker Row */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500">Medicine / Formulation</label>
                      <select
                        value={selInvId}
                        onChange={(e) => setSelInvId(e.target.value)}
                        className="w-full mt-1 px-2.5 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        {state.inventory.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name} ({i.stock} {i.unit} in stock — ₹{i.sellingPrice})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500">Freq</label>
                        <select value={rxFreq} onChange={(e) => setRxFreq(e.target.value)} className="w-full mt-1 px-2 py-2 text-xs border border-slate-200 rounded-lg bg-white">
                          <option value="1-0-1">1-0-1</option>
                          <option value="1-0-0">1-0-0</option>
                          <option value="0-0-1">0-0-1</option>
                          <option value="1-1-1">1-1-1</option>
                          <option value="Weekly">Weekly</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500">Timing</label>
                        <select value={rxTiming} onChange={(e) => setRxTiming(e.target.value as PrescriptionItem["timing"])} className="w-full mt-1 px-2 py-2 text-xs border border-slate-200 rounded-lg bg-white">
                          <option value="After Food">After Food</option>
                          <option value="Before Food">Before Food</option>
                          <option value="Empty Stomach">Empty Stomach</option>
                          <option value="Bedtime">Bedtime</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500">Days</label>
                        <input type="number" min={1} value={rxDays} onChange={(e) => setRxDays(Number(e.target.value))} className="w-full mt-1 px-2 py-2 text-xs border border-slate-200 rounded-lg bg-white" />
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRxItem}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add to Prescription
                  </button>
                </div>

                {rxItems.length > 0 && (
                  <div className="space-y-2">
                    {rxItems.map((it) => (
                      <div key={it.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{it.medicineName}</div>
                          <div className="text-[11px] text-slate-500">
                            {it.frequency} • {it.timing} • {it.durationDays} days (Qty: {it.quantity})
                          </div>
                        </div>
                        <button
                          onClick={() => setRxItems((prev) => prev.filter((x) => x.id !== it.id))}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  value={rxNotes}
                  onChange={(e) => setRxNotes(e.target.value)}
                  placeholder="Special instructions / dietary advice..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={rxWhatsApp} onChange={(e) => setRxWhatsApp(e.target.checked)} className="rounded text-teal-600" />
                    Send encrypted e-Rx PDF directly via WhatsApp
                  </label>
                  <button
                    onClick={handleSaveRx}
                    disabled={rxItems.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 disabled:opacity-40 hover:bg-teal-700 text-white text-xs font-semibold"
                  >
                    <Send className="w-3.5 h-3.5" /> Issue & Send to Pharmacy
                  </button>
                </div>
              </div>

              <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Prescription History ({patientRxs.length})</h3>
                <div className="space-y-2.5">
                  {patientRxs.map((rx) => (
                    <div key={rx.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{rx.diagnosis}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rx.status === "dispensed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                          {rx.status === "dispensed" ? "Dispensed" : "Queued Pharmacy"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">{rx.createdAt} • {rx.items.length} medicines</div>
                      <ul className="space-y-1 text-[11px] text-slate-700">
                        {rx.items.map((it) => (
                          <li key={it.id}>• {it.medicineName} — {it.frequency} ({it.timing})</li>
                        ))}
                      </ul>
                      <button
                        onClick={() => setPrintRxId(rx.id)}
                        className="flex items-center gap-1 text-teal-700 font-semibold text-[11px] hover:underline pt-1"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print / Preview Rx
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Labs & MedDoc AI */}
          {tab === "labs" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 h-fit">
                <h3 className="text-sm font-bold text-slate-900">Order Diagnostic Lab Test</h3>
                <select value={labTest} onChange={(e) => setLabTest(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
                  {labCatalog.map((t) => (
                    <option key={t.name} value={t.name}>{t.name} — ₹{t.cost}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  {(["routine", "urgent"] as const).map((pr) => (
                    <button
                      key={pr}
                      type="button"
                      onClick={() => setLabPriority(pr)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize border ${
                        labPriority === pr ? "bg-teal-50 border-teal-500 text-teal-800" : "border-slate-200 text-slate-600"
                      }`}
                    >
                      {pr}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const item = labCatalog.find((l) => l.name === labTest) || labCatalog[0];
                    addLabOrder({
                      patientId: patient.id,
                      doctorId: doctors[0]?.id || "doc-1",
                      testName: item.name,
                      category: item.cat,
                      priority: labPriority,
                      cost: item.cost,
                    });
                  }}
                  className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
                >
                  Create Lab Order
                </button>
              </div>

              <div className="xl:col-span-2 space-y-3">
                {patientLabs.map((lab) => (
                  <div key={lab.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{lab.testName}</div>
                        <div className="text-xs text-slate-500">{lab.category} • Ordered {lab.orderedAt} • ₹{lab.cost}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                          lab.status === "report-ready" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                        }`}>
                          {lab.status.replace("-", " ")}
                        </span>
                        {lab.status !== "report-ready" && (
                          <button
                            onClick={() => updateLabOrderStatus(lab.id, "report-ready")}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-semibold"
                          >
                            Upload Report
                          </button>
                        )}
                      </div>
                    </div>

                    {lab.biomarkers && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border border-slate-100 rounded-xl">
                          <thead className="bg-slate-50 text-[11px] text-slate-500">
                            <tr>
                              <th className="p-2">Biomarker</th>
                              <th className="p-2">Result</th>
                              <th className="p-2">Reference</th>
                              <th className="p-2">Flag</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {lab.biomarkers.map((b) => (
                              <tr key={b.name}>
                                <td className="p-2 font-semibold text-slate-800">{b.name}</td>
                                <td className="p-2 font-bold">{b.value} {b.unit}</td>
                                <td className="p-2 text-slate-500">{b.reference}</td>
                                <td className="p-2">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    b.flag === "normal" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                  }`}>
                                    {b.flag}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {lab.aiSummary ? (
                      <div className="p-3 rounded-xl bg-violet-50 border border-violet-200 text-xs text-violet-950">
                        <div className="font-bold flex items-center gap-1.5 text-violet-800 mb-1">
                          <Bot className="w-3.5 h-3.5" /> MedDoc AI Diagnostic Summary
                        </div>
                        {lab.aiSummary}
                      </div>
                    ) : (
                      lab.status === "report-ready" && (
                        <button
                          onClick={() =>
                            updateLabOrderStatus(
                              lab.id,
                              "report-ready",
                              "MedDoc AI flagged mild TSH elevation (5.2 mIU/L) with normal Free T4. Recommend morning Levothyroxine evaluation & 6-week repeat."
                            )
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Run MedDoc AI Extractor
                        </button>
                      )
                    )}
                  </div>
                ))}
                {patientLabs.length === 0 && (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-400">
                    No lab orders for {patient.name} yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Diet & Workout Plans */}
          {tab === "careplan" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Diet Plans */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Utensils className="w-4 h-4 text-emerald-600" />
                      Personalized Diet Plans
                    </h3>
                    <p className="text-xs text-slate-500">Generated from pathology & food preferences</p>
                  </div>
                  <button
                    onClick={handleGenerateNutriPlan}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> NutriPlan AI Generate
                  </button>
                </div>

                {patientDiets.map((dp) => (
                  <div key={dp.id} className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{dp.title}</div>
                        <div className="text-[11px] text-slate-500">{dp.goal} • {dp.caloriesTarget} kcal/day • Exp {dp.expiresAt}</div>
                      </div>
                      {dp.aiGenerated && (
                        <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold">NutriPlan AI</span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {dp.meals.map((m) => (
                        <div key={m.slot} className="p-2.5 rounded-lg bg-white border border-emerald-100 text-xs">
                          <div className="flex justify-between font-bold text-slate-800">
                            <span>{m.slot}</span>
                            <span className="text-emerald-700">{m.calories} kcal • {m.macros}</span>
                          </div>
                          <div className="text-slate-600 mt-0.5">{m.items}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {patientDiets.length === 0 && (
                  <div className="text-xs text-slate-400 py-8 text-center">Click "NutriPlan AI Generate" to build a tailored diet chart.</div>
                )}
              </div>

              {/* Workout Plans */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Dumbbell className="w-4 h-4 text-sky-600" />
                      Workout & Rehab Plans
                    </h3>
                    <p className="text-xs text-slate-500">Goal-based exercises synced to Patient Portal</p>
                  </div>
                  <button
                    onClick={handleAddSampleWorkout}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700"
                  >
                    <Plus className="w-3.5 h-3.5" /> Assign Protocol
                  </button>
                </div>

                {patientWorkouts.map((wp) => (
                  <div key={wp.id} className="p-4 rounded-xl bg-sky-50/40 border border-sky-200/80 space-y-2.5">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{wp.title}</div>
                      <div className="text-[11px] text-slate-500">{wp.goal} • Valid until {wp.expiresAt}</div>
                    </div>
                    {wp.exercises.map((ex) => (
                      <div key={ex.name} className="p-2.5 rounded-lg bg-white border border-sky-100 text-xs">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>{ex.name}</span>
                          <span className="text-sky-700">{ex.setsReps}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{ex.frequency} — {ex.notes}</div>
                      </div>
                    ))}
                  </div>
                ))}
                {patientWorkouts.length === 0 && (
                  <div className="text-xs text-slate-400 py-8 text-center">No workout plans assigned yet.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: Forms, Comms & Billing */}
          {tab === "comms" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">WhatsApp & Portal Communication Log</h3>
                  <button
                    onClick={() => notify(`Sent care check-in WhatsApp message to ${patient.name}`)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                  >
                    + Send WhatsApp
                  </button>
                </div>
                {patient.communicationLog.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span>{c.channel}</span>
                      <span className="text-[11px] text-slate-400">{c.sentAt} • {c.status}</span>
                    </div>
                    <p className="text-slate-600 mt-1">{c.message}</p>
                  </div>
                ))}
                {patient.communicationLog.length === 0 && <div className="text-xs text-slate-400">No messages logged yet.</div>}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Submitted Forms & Invoices</h3>
                {patient.submittedForms.map((sf) => (
                  <div key={sf.id} className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs">
                    <div className="font-bold text-indigo-950">{sf.formTitle} ({sf.submittedAt})</div>
                    <div className="mt-1 space-y-0.5 text-slate-600">
                      {Object.entries(sf.answers).map(([k, v]) => (
                        <div key={k}><strong>{k}:</strong> {v}</div>
                      ))}
                    </div>
                  </div>
                ))}
                {patientInvoices.map((inv) => (
                  <div key={inv.id} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{inv.invoiceNumber}</div>
                      <div className="text-[11px] text-slate-500">{inv.createdAt} • {inv.paymentMethod}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">₹{inv.totalAmount}</div>
                      <span className={`text-[10px] font-bold uppercase ${inv.status === "paid" ? "text-emerald-600" : "text-amber-600"}`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Patient Modal */}
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
                <option value="General Medicine">General</option>
                <option value="Ayurveda">Ayurveda</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Physiotherapy">Physio</option>
                <option value="Diabetes & Nutrition">Diabetes</option>
              </select>
            </div>
            <input value={npAllergies} onChange={(e) => setNpAllergies(e.target.value)} placeholder="Known Allergies (comma separated)" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
            <button type="submit" className="w-full py-2.5 rounded-xl bg-teal-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" /> Create Patient Profile
            </button>
          </form>
        </div>
      )}

      {/* Printable e-Prescription Preview Modal */}
      {printTargetRx && patient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setPrintRxId(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="text-base font-bold text-teal-700">CliniFlow Integrated Healthcare</div>
                <div className="text-[11px] text-slate-500">Digital e-Prescription • HIPAA Verified</div>
              </div>
              <button onClick={() => setPrintRxId(null)} className="no-print text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex justify-between text-xs bg-slate-50 p-3 rounded-xl">
              <div>
                <div className="font-bold text-slate-900">{patient.name} ({patient.mrn})</div>
                <div className="text-slate-500">{patient.age}y / {patient.gender} • {patient.phone}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">Date: {printTargetRx.createdAt}</div>
                <div className="text-slate-500">Dx: {printTargetRx.diagnosis}</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase text-slate-500">Rx Medications</div>
              {printTargetRx.items.map((it, idx) => (
                <div key={it.id} className="p-2.5 border-b border-slate-100 text-xs flex justify-between">
                  <div>
                    <span className="font-bold">{idx + 1}. {it.medicineName}</span>
                    <div className="text-[11px] text-slate-500">{it.dosage} • {it.frequency} • {it.timing} • {it.durationDays} days</div>
                  </div>
                  <span className="font-semibold">Qty: {it.quantity}</span>
                </div>
              ))}
            </div>
            {printTargetRx.notes && <div className="text-xs text-slate-600 bg-amber-50 p-2.5 rounded-lg">Advice: {printTargetRx.notes}</div>}
            <div className="no-print flex justify-end gap-2 pt-2">
              <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold">
                <Printer className="w-3.5 h-3.5" /> Print Prescription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
