import React, { useState } from "react";
import { ArrowRight, CheckCircle2, Clock, Play, UserCheck, Users } from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { TODAY_STR } from "../data/seedData";
import { AppointmentStatus } from "../types/clinic";

export const QueueAttendancePage: React.FC = () => {
  const { state, updateAppointmentStatus, startConsultation, toggleStaffStatus } = useClinic();
  const [tab, setTab] = useState<"queue" | "attendance">("queue");

  const todayApts = state.appointments.filter(
    (a) => !a.isBlockedSlot && a.date === TODAY_STR && (state.activeBranchId === "all" || a.branchId === state.activeBranchId)
  );

  const columns: Array<{ title: string; statuses: AppointmentStatus[]; next?: AppointmentStatus; nextLabel?: string; accent: string }> = [
    { title: "Scheduled / Confirmed", statuses: ["scheduled", "confirmed"], next: "checked-in", nextLabel: "Check In", accent: "border-t-slate-400" },
    { title: "Waiting (Checked-In)", statuses: ["checked-in"], next: "vitals-done", nextLabel: "Mark Vitals Done", accent: "border-t-amber-500" },
    { title: "Vitals Done / Ready", statuses: ["vitals-done"], next: "in-consultation", nextLabel: "Send to Doctor", accent: "border-t-indigo-500" },
    { title: "In Consultation", statuses: ["in-consultation"], next: "completed", nextLabel: "Complete Visit", accent: "border-t-teal-600" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Front Desk Queue & Attendance</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time patient token flow, digital check-in & staff shift attendance</p>
        </div>

        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl w-fit">
          <button
            onClick={() => setTab("queue")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${tab === "queue" ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Patient Waiting Queue
          </button>
          <button
            onClick={() => setTab("attendance")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${tab === "attendance" ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Staff & Client Attendance
          </button>
        </div>
      </div>

      {tab === "queue" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {columns.map((col) => {
            const items = todayApts.filter((a) => col.statuses.includes(a.status));
            return (
              <div key={col.title} className={`bg-white rounded-2xl border border-slate-200/80 border-t-4 ${col.accent} p-4 flex flex-col min-h-[420px]`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">{col.title}</h2>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">{items.length}</span>
                </div>
                <div className="space-y-2.5 flex-1">
                  {items.map((apt) => {
                    const patient = state.patients.find((p) => p.id === apt.patientId);
                    const doc = state.staff.find((d) => d.id === apt.doctorId);
                    if (!patient) return null;
                    return (
                      <div key={apt.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold">{apt.tokenNumber}</span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {apt.checkedInAt || apt.startTime}
                          </span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{patient.name}</div>
                          <div className="text-[11px] text-slate-500">{doc?.name} • {apt.mode}</div>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1">
                          {col.next && (
                            <button
                              onClick={() => updateAppointmentStatus(apt.id, col.next!)}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white border border-slate-200 hover:border-teal-500 text-[11px] font-semibold text-slate-700"
                            >
                              {col.nextLabel} <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => startConsultation(patient.id, apt.id)}
                            className="p-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white"
                            title="Open EMR Consultation"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {items.length === 0 && (
                    <div className="text-xs text-slate-400 text-center py-12">No patients in this stage</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Staff Attendance */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-600" />
                  Staff Digital Check-In / Shift Log
                </h2>
                <p className="text-xs text-slate-500">Live branch workforce & payroll attendance tracking</p>
              </div>
            </div>
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
                        {s.role} {s.specialty ? `• ${s.specialty}` : ""} • Shift: {s.workingHours}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          s.status === "off-duty" ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {s.status.replace("-", " ")}
                      </span>
                      {s.checkedInAt && <div className="text-[10px] text-slate-400 mt-0.5">In: {s.checkedInAt}</div>}
                    </div>
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

          {/* Patient Appointment Adherence */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              Patient Attendance & Session Adherence
            </h2>
            <p className="text-xs text-slate-500 mb-4">Tracks check-ins, completed sessions & membership session deductions</p>
            <div className="space-y-2.5">
              {todayApts.map((apt) => {
                const p = state.patients.find((pt) => pt.id === apt.patientId);
                return (
                  <div key={apt.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{p?.name} ({apt.tokenNumber})</div>
                      <div className="text-[11px] text-slate-500">Scheduled {apt.startTime} • {apt.checkedInAt ? `Arrived ${apt.checkedInAt}` : "Awaiting arrival"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {apt.status === "completed" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Attended</span>
                      ) : (
                        <button
                          onClick={() => updateAppointmentStatus(apt.id, "checked-in")}
                          className="px-2.5 py-1 rounded-lg bg-teal-600 text-white font-semibold"
                        >
                          Mark Present
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
