import React, { useState } from "react";
import {
  Ban,
  Bell,
  Calendar as CalIcon,
  CheckCircle2,
  Clock,
  Home,
  MapPin,
  Mic,
  MicOff,
  PhoneOff,
  Play,
  Plus,
  UserCheck,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { TODAY_STR } from "../data/seedData";
import { Appointment, AppointmentMode, AppointmentStatus } from "../types/clinic";
import { QuickBookModal } from "../components/QuickBookModal";

export const CalendarPage: React.FC = () => {
  const { state, addAppointment, updateAppointmentStatus, sendAppointmentReminder, startConsultation, notify } = useClinic();
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
  const [selectedMode, setSelectedMode] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_STR);
  const [bookOpen, setBookOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockDocId, setBlockDocId] = useState(state.staff.find((s) => s.role === "doctor")?.id || "");
  const [blockTime, setBlockTime] = useState("15:00");
  const [blockReason, setBlockReason] = useState("CME / Surgery Block");
  const [activeApt, setActiveApt] = useState<Appointment | null>(null);
  const [telehealthApt, setTelehealthApt] = useState<Appointment | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const doctors = state.staff.filter(
    (s) => s.role === "doctor" && (state.activeBranchId === "all" || s.branchId === state.activeBranchId)
  );

  const filteredApts = state.appointments
    .filter((a) => {
      if (state.activeBranchId !== "all" && a.branchId !== state.activeBranchId) return false;
      if (selectedDoctor !== "all" && a.doctorId !== selectedDoctor) return false;
      if (selectedMode !== "all" && a.mode !== selectedMode) return false;
      if (selectedDate && a.date !== selectedDate) return false;
      return true;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const modeBadge = (mode: AppointmentMode) => {
    if (mode === "online") return { label: "Video Telehealth", cls: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: Video };
    if (mode === "home-visit") return { label: "Home Visit", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: Home };
    return { label: "In-Person", cls: "bg-teal-50 text-teal-700 border-teal-200", icon: MapPin };
  };

  const statusColor = (status: AppointmentStatus) => {
    switch (status) {
      case "in-consultation": return "bg-teal-600 text-white";
      case "vitals-done": return "bg-indigo-100 text-indigo-800";
      case "checked-in": return "bg-amber-100 text-amber-800";
      case "completed": return "bg-emerald-100 text-emerald-800";
      case "cancelled":
      case "no-show": return "bg-rose-100 text-rose-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const handleBlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const doc = state.staff.find((s) => s.id === blockDocId);
    addAppointment({
      patientId: "",
      doctorId: blockDocId,
      branchId: doc?.branchId || "br-1",
      date: selectedDate,
      startTime: blockTime,
      durationMin: 60,
      mode: "in-person",
      reason: blockReason,
      status: "scheduled",
      reminderSent: false,
      isBlockedSlot: true,
      source: "Front Desk",
    });
    setBlockOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Unified Calendar & Telehealth</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Multi-specialist scheduling across In-Person, Video Consultations, Home Visits & Room Bookings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setBlockOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Ban className="w-3.5 h-3.5 text-rose-500" />
            Block Calendar
          </button>
          <button
            onClick={() => setBookOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Appointment
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <CalIcon className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5"
          />
          <button
            onClick={() => setSelectedDate("")}
            className={`text-xs px-2.5 py-1.5 rounded-lg font-medium ${!selectedDate ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            All Dates
          </button>
        </div>

        <select
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
          className="text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
        >
          <option value="all">All Specialists ({doctors.length})</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>
          ))}
        </select>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {[
            { id: "all", label: "All Modes" },
            { id: "in-person", label: "In-Person" },
            { id: "online", label: "Video" },
            { id: "home-visit", label: "Home Visit" },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMode(m.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                selectedMode === m.id ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Specialist Columns / Schedule Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-3">
          {filteredApts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
              <CalIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-700">No appointments match this filter</div>
              <p className="text-xs text-slate-500 mt-1">Try switching dates or book a new appointment.</p>
            </div>
          ) : (
            filteredApts.map((apt) => {
              const doc = state.staff.find((d) => d.id === apt.doctorId);
              const patient = state.patients.find((p) => p.id === apt.patientId);
              const badge = modeBadge(apt.mode);
              const BadgeIcon = badge.icon;

              if (apt.isBlockedSlot) {
                return (
                  <div key={apt.id} className="bg-slate-100/80 rounded-2xl border border-dashed border-slate-300 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold">{apt.startTime}</span>
                      <div>
                        <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Ban className="w-3.5 h-3.5 text-rose-500" />
                          {apt.reason}
                        </div>
                        <div className="text-[11px] text-slate-500">{doc?.name} • {apt.facility || "Calendar Blocked"} ({apt.durationMin}m)</div>
                      </div>
                    </div>
                    <button
                      onClick={() => updateAppointmentStatus(apt.id, "cancelled")}
                      className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Unblock
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={apt.id}
                  onClick={() => setActiveApt(apt)}
                  className={`bg-white rounded-2xl border p-4 transition cursor-pointer hover:shadow-sm ${
                    activeApt?.id === apt.id ? "border-teal-500 ring-2 ring-teal-500/15" : "border-slate-200/80"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="text-center px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
                        <div className="text-xs font-bold text-slate-900">{apt.startTime}</div>
                        <div className="text-[10px] text-slate-500">{apt.durationMin}m</div>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">{apt.tokenNumber}</span>
                          <span className="text-sm font-bold text-slate-900">{patient?.name || "Patient"}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.cls}`}>
                            <BadgeIcon className="w-3 h-3" />
                            {badge.label}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mt-1">{apt.reason}</div>
                        <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                          <span>{doc?.name} ({doc?.specialty})</span>
                          {apt.facility && <span>• {apt.facility}</span>}
                          <span>• Source: {apt.source}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${statusColor(apt.status)}`}>
                        {apt.status.replace("-", " ")}
                      </span>
                      {apt.mode === "online" && apt.status !== "completed" && (
                        <button
                          onClick={() => setTelehealthApt(apt)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                        >
                          <Video className="w-3.5 h-3.5" /> Join Video
                        </button>
                      )}
                      {patient && (
                        <button
                          onClick={() => startConsultation(patient.id, apt.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
                        >
                          <Play className="w-3.5 h-3.5" /> Start EMR
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Appointment Inspector & Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 h-fit sticky top-20">
          {activeApt && !activeApt.isBlockedSlot ? (
            (() => {
              const apt = state.appointments.find((a) => a.id === activeApt.id) || activeApt;
              const patient = state.patients.find((p) => p.id === apt.patientId);
              const doc = state.staff.find((d) => d.id === apt.doctorId);
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Appointment Details</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">{apt.tokenNumber}</span>
                  </div>

                  <div>
                    <div className="text-base font-bold text-slate-900">{patient?.name}</div>
                    <div className="text-xs text-slate-500">{patient?.mrn} • {patient?.phone}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-slate-500">Doctor:</span><span className="font-semibold">{doc?.name}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Schedule:</span><span className="font-semibold">{apt.date} at {apt.startTime}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Mode:</span><span className="font-semibold capitalize">{apt.mode}</span></div>
                    {apt.facility && <div className="flex justify-between"><span className="text-slate-500">Room:</span><span className="font-semibold">{apt.facility}</span></div>}
                    <div className="flex justify-between"><span className="text-slate-500">Reminder:</span><span className="font-semibold text-emerald-700">{apt.reminderSent ? "WhatsApp Sent" : "Pending"}</span></div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-700 mb-2">Update Flow Stage</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(["confirmed", "checked-in", "vitals-done", "in-consultation", "completed", "no-show"] as AppointmentStatus[]).map((st) => (
                        <button
                          key={st}
                          onClick={() => updateAppointmentStatus(apt.id, st)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold capitalize border transition ${
                            apt.status === st
                              ? "bg-teal-600 text-white border-teal-600"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {st.replace("-", " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <button
                      onClick={() => sendAppointmentReminder(apt.id)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100"
                    >
                      <Bell className="w-3.5 h-3.5" /> Send WhatsApp Reminder
                    </button>
                    {patient && (
                      <button
                        onClick={() => startConsultation(patient.id, apt.id)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Open Patient 360 Healthboard
                      </button>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-700">Select an Appointment</div>
              <p className="text-[11px] text-slate-500 mt-1">Click any booking on the left to update queue stage, send WhatsApp reminders, or launch video consult.</p>
            </div>
          )}
        </div>
      </div>

      {/* Block Calendar Modal */}
      {blockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setBlockOpen(false)}>
          <form onSubmit={handleBlockSubmit} className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-3 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Block Specialist Calendar</h3>
              <button type="button" onClick={() => setBlockOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <select value={blockDocId} onChange={(e) => setBlockDocId(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white">
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <input type="time" value={blockTime} onChange={(e) => setBlockTime(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg" />
            <input value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Block reason..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg" />
            <button type="submit" className="w-full py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold">Block Slot</button>
          </form>
        </div>
      )}

      {/* Virtual Telehealth Room Modal */}
      {telehealthApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-slate-900 text-white border border-slate-700 overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <div className="text-sm font-bold">
                    Virtual Consultation — {state.patients.find((p) => p.id === telehealthApt.patientId)?.name}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    End-to-End Encrypted HD Telehealth • {state.staff.find((d) => d.id === telehealthApt.doctorId)?.name}
                  </div>
                </div>
              </div>
              <button onClick={() => setTelehealthApt(null)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 aspect-video rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700 flex flex-col items-center justify-center relative">
                <div className="w-20 h-20 rounded-full bg-indigo-600/30 border border-indigo-400/50 flex items-center justify-center text-2xl font-bold text-indigo-200">
                  {state.patients.find((p) => p.id === telehealthApt.patientId)?.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="mt-3 text-sm font-semibold">Patient Connected (HD Audio/Video)</div>
                <div className="text-xs text-slate-400 mt-0.5">Reason: {telehealthApt.reason}</div>
                <div className="absolute bottom-3 right-3 w-28 h-20 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center text-[11px] text-slate-300">
                  {camOn ? "Doctor Cam On" : "Cam Off"}
                </div>
              </div>

              <div className="bg-slate-800/70 rounded-xl p-3.5 border border-slate-700 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Quick Consult Actions</div>
                  <p className="text-[11px] text-slate-400">
                    Open Patient 360 Healthboard side-by-side to dictate VoiceCmd SOAP notes & send digital e-Rx via WhatsApp.
                  </p>
                </div>
                <div className="space-y-2 mt-4">
                  <button
                    onClick={() => {
                      const pid = telehealthApt.patientId;
                      setTelehealthApt(null);
                      startConsultation(pid, telehealthApt.id);
                    }}
                    className="w-full py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-semibold"
                  >
                    Open EMR & e-Rx
                  </button>
                  <button
                    onClick={() => {
                      updateAppointmentStatus(telehealthApt.id, "completed");
                      setTelehealthApt(null);
                      notify("Telehealth session completed");
                    }}
                    className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Complete Visit
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-center gap-3">
              <button
                onClick={() => setMicOn(!micOn)}
                className={`p-2.5 rounded-full ${micOn ? "bg-slate-800 text-white" : "bg-rose-600 text-white"}`}
              >
                {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setCamOn(!camOn)}
                className={`p-2.5 rounded-full ${camOn ? "bg-slate-800 text-white" : "bg-rose-600 text-white"}`}
              >
                {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setTelehealthApt(null)}
                className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-xs font-semibold flex items-center gap-1.5"
              >
                <PhoneOff className="w-4 h-4" /> Leave Room
              </button>
            </div>
          </div>
        </div>
      )}

      <QuickBookModal open={bookOpen} onClose={() => setBookOpen(false)} />
    </div>
  );
};
