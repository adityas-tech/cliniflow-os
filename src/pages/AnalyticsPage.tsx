import React, { useState } from "react";
import {
  Activity,
  BarChart3,
  BedDouble,
  Calendar,
  ClipboardList,
  Download,
  FileText,
  Globe,
  IndianRupee,
  RefreshCw,
  ShieldCheck,
  Syringe,
  Users,
} from "lucide-react";
import { useClinic } from "../context/ClinicContext";

type AnalyticsSection =
  | "appointment"
  | "patients"
  | "payment"
  | "realtime"
  | "prescription"
  | "vaccine"
  | "questionnaire"
  | "ipd"
  | "deidentified"
  | "gmb"
  | "abdm";

export const AnalyticsPage: React.FC = () => {
  const { state, notify } = useClinic();
  const [section, setSection] = useState<AnalyticsSection>("appointment");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [clinicFilter, setClinicFilter] = useState("all");
  const [rangeFilter, setRangeFilter] = useState("Last 30 days");
  const [loadingDb, setLoadingDb] = useState(false);

  const doctors = state.staff.filter((s) => s.role === "doctor");

  const triggerQueryRefresh = (cb: () => void) => {
    setLoadingDb(true);
    cb();
    setTimeout(() => setLoadingDb(false), 380);
  };

  const filteredApts = state.appointments.filter((a) => {
    if (a.isBlockedSlot) return false;
    if (doctorFilter !== "all" && a.doctorId !== doctorFilter) return false;
    if (clinicFilter !== "all" && a.branchId !== clinicFilter) return false;
    return true;
  });

  const multiplier = rangeFilter === "Last 7 days" ? 0.25 : rangeFilter === "Last 90 days" ? 2.6 : 1;
  const totalAppts = Math.round((831 + filteredApts.length) * multiplier);
  const avgWait = filteredApts.length > 0
    ? (
        filteredApts.reduce((s, a) => s + (a.waitMinutes || 38), 0) / filteredApts.length
      ).toFixed(2)
    : "45.89";
  const avgConsult = "41.49";

  const abhaLinkedCount = state.patients.filter((p) => p.abhaStatus === "ABHA Linked").length;
  const totalRevenue = state.invoices.reduce((s, i) => s + i.paidAmount, 0);

  // Weekly Appt & Rx Trend SVG points
  const trendData = [
    { week: "Wk 1", appts: 202, rx: 186 },
    { week: "Wk 2", appts: 162, rx: 149 },
    { week: "Wk 3", appts: 188, rx: 175 },
    { week: "Wk 4", appts: 184, rx: 171 },
    { week: "Current", appts: 155 + filteredApts.length * 4, rx: 142 + state.prescriptions.length * 5 },
  ];

  const navItems: Array<{ id: AnalyticsSection; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "appointment", label: "Appointment", icon: Calendar },
    { id: "patients", label: "Patients", icon: Users },
    { id: "payment", label: "Payment Report", icon: IndianRupee },
    { id: "realtime", label: "Real Time Report", icon: Activity },
    { id: "prescription", label: "Prescription", icon: FileText },
    { id: "vaccine", label: "Vaccine", icon: Syringe },
    { id: "questionnaire", label: "Questionnaire", icon: ClipboardList },
    { id: "ipd", label: "IPD", icon: BedDouble },
    { id: "deidentified", label: "De-Identified Data", icon: BarChart3 },
    { id: "gmb", label: "GMB", icon: Globe },
    { id: "abdm", label: "ABDM", icon: ShieldCheck },
  ];

  const exportDeidentifiedCsv = () => {
    const header = "PatientHash,Age,Gender,Specialty,ChronicConditions,ABHA_Status\n";
    const rows = state.patients
      .map((p, idx) => `ANON-${1000 + idx},${p.age},${p.gender},"${p.specialtyTag}","${p.chronicConditions.join("; ")}",${p.abhaStatus || "No ABHA"}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cliniflow-deidentified-clinic-dataset.csv";
    a.click();
    URL.revokeObjectURL(url);
    notify("De-Identified cohort CSV exported");
  };

  return (
    <div className="-m-4 lg:-m-6 min-h-[calc(100vh-3.5rem)] flex flex-col bg-slate-50">
      {/* Top Organization Hub Banner (from video) */}
      <div className="bg-[#0d5bd9] text-white px-5 py-2 text-xs font-medium flex items-center justify-between">
        <span>You can manage analytics access for your organization from the Hub.</span>
        <span className="px-2.5 py-0.5 rounded bg-white/15 text-[11px] font-semibold">analytics.cliniflow.ai • Admin</span>
      </div>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Analytics Sidebar */}
        <aside className="w-full md:w-56 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-3 shrink-0">
          <div className="flex items-center gap-2 px-2 pb-3 mb-2 border-b border-slate-100">
            <div className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold">Analytics</div>
            <span className="text-xs font-semibold text-slate-500">Admin</span>
          </div>
          <nav className="flex md:flex-col gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => triggerQueryRefresh(() => setSection(item.id))}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    active
                      ? "bg-blue-50 text-blue-700 font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <item.icon className={`w-3.5 h-3.5 ${active ? "text-blue-600" : "text-slate-400"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main BI Canvas */}
        <div className="flex-1 p-5 lg:p-6 space-y-5 overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-lg font-bold text-slate-900 capitalize">
              {section === "appointment"
                ? "Appointment Dashboard"
                : section === "gmb"
                ? "Google My Business (GMB) Insights"
                : section === "abdm"
                ? "ABDM & ABHA Adoption Dashboard"
                : `${section} Analytics`}
            </h1>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={rangeFilter}
                onChange={(e) => triggerQueryRefresh(() => setRangeFilter(e.target.value))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
              >
                <option value="Last 7 days">Last 7 days</option>
                <option value="Last 30 days">Last 30 days</option>
                <option value="Last 90 days">Last 90 days</option>
              </select>
              <span className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-500">
                Oct 19, 2026 - Nov 19, 2026
              </span>
            </div>
          </div>

          {/* Filter Row (Doctor Name / Clinic Name) */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
              <span className="text-slate-400 font-medium">Doctor Name</span>
              <select
                value={doctorFilter}
                onChange={(e) => triggerQueryRefresh(() => setDoctorFilter(e.target.value))}
                className="font-semibold text-slate-700 bg-transparent outline-none"
              >
                <option value="all">All Doctors ({doctors.length})</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
              <span className="text-slate-400 font-medium">Clinic Name</span>
              <select
                value={clinicFilter}
                onChange={(e) => triggerQueryRefresh(() => setClinicFilter(e.target.value))}
                className="font-semibold text-slate-700 bg-transparent outline-none"
              >
                <option value="all">1 option (All Branches)</option>
                {state.branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          {loadingDb ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["Total Appointments", "Average Waiting Time (In Min)", "Average Consultation Time (In Min)"].map((title) => (
                <div key={title} className="bg-white rounded-xl border border-slate-200 p-6 h-40 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                  <span className="text-xs">Waiting on database..</span>
                </div>
              ))}
            </div>
          ) : section === "appointment" ? (
            <>
              {/* 3 KPI Cards matching video */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
                  <div className="text-xs font-bold text-slate-700">Total Appointments</div>
                  <div className="text-5xl font-normal text-slate-900 mt-5 tracking-tight">{totalAppts}</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
                  <div className="text-xs font-bold text-slate-700">Average Waiting Time (In Min)</div>
                  <div className="text-5xl font-normal text-slate-900 mt-5 tracking-tight">{avgWait}</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
                  <div className="text-xs font-bold text-slate-700">Average Consultation Time (In Min)</div>
                  <div className="text-5xl font-normal text-slate-900 mt-5 tracking-tight">{avgConsult}</div>
                </div>
              </div>

              {/* Weekly Appt and RX Trend Chart */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold text-slate-800">Weekly Appt and RX Trend</div>
                  <div className="flex items-center gap-4 text-[11px] font-semibold">
                    <span className="flex items-center gap-1.5 text-teal-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> Total Appointments
                    </span>
                    <span className="flex items-center gap-1.5 text-blue-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Total Prescriptions
                    </span>
                  </div>
                </div>

                <div className="w-full h-56">
                  <svg viewBox="0 0 700 180" className="w-full h-full overflow-visible">
                    {[150, 200, 250].map((tick, idx) => {
                      const y = 140 - idx * 50;
                      return (
                        <g key={tick}>
                          <line x1="40" y1={y} x2="680" y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                          <text x="10" y={y + 4} fontSize="10" fill="#94a3b8">{tick}</text>
                        </g>
                      );
                    })}
                    <polyline
                      fill="none"
                      stroke="#14b8a6"
                      strokeWidth="2.5"
                      points={trendData.map((d, i) => `${60 + i * 150},${180 - (d.appts - 100)}`).join(" ")}
                    />
                    <polyline
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                      strokeDasharray="5 3"
                      points={trendData.map((d, i) => `${60 + i * 150},${180 - (d.rx - 100)}`).join(" ")}
                    />
                    {trendData.map((d, i) => (
                      <g key={d.week}>
                        <circle cx={60 + i * 150} cy={180 - (d.appts - 100)} r="4" fill="#14b8a6" />
                        <circle cx={60 + i * 150} cy={180 - (d.rx - 100)} r="4" fill="#3b82f6" />
                        <text x={45 + i * 150} y="172" fontSize="10" fill="#64748b">{d.week}</text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>
            </>
          ) : section === "deidentified" ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">De-Identified Clinical Research Cohort</h2>
                  <p className="text-xs text-slate-500">HIPAA / DPDP Safe Harbor anonymized patient summary across {state.patients.length} active profiles</p>
                </div>
                <button
                  onClick={exportDeidentifiedCsv}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" /> Export Anonymized CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Cohort Hash</th>
                      <th className="p-2.5">Age / Sex</th>
                      <th className="p-2.5">Specialty</th>
                      <th className="p-2.5">Conditions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {state.patients.map((p, i) => (
                      <tr key={p.id}>
                        <td className="p-2.5 font-mono text-slate-600">ANON-{1000 + i}</td>
                        <td className="p-2.5">{p.age}y / {p.gender}</td>
                        <td className="p-2.5">{p.specialtyTag}</td>
                        <td className="p-2.5">{p.chronicConditions.join(", ") || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="text-xs font-semibold text-slate-500">Total Registered Patients</div>
                <div className="text-3xl font-bold text-slate-900 mt-2">{state.patients.length}</div>
                <div className="text-xs text-emerald-600 mt-1">{abhaLinkedCount} ABHA Linked</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="text-xs font-semibold text-slate-500">Collected Clinic Revenue</div>
                <div className="text-3xl font-bold text-slate-900 mt-2">₹{totalRevenue.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">{state.invoices.length} Invoices</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="text-xs font-semibold text-slate-500">GMB Rating & Prescriptions</div>
                <div className="text-3xl font-bold text-slate-900 mt-2">{state.googleBusiness.googleRating} ★</div>
                <div className="text-xs text-slate-500 mt-1">
                  {state.googleBusiness.googleReviewCount} Google reviews • {state.prescriptions.length} Rx issued
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
