import React, { useState } from "react";
import { Calendar, Video, MapPin, Home, X, Check } from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { TODAY_STR } from "../data/seedData";
import { AppointmentMode } from "../types/clinic";

interface QuickBookModalProps {
  open: boolean;
  onClose: () => void;
  defaultPatientId?: string;
}

export const QuickBookModal: React.FC<QuickBookModalProps> = ({ open, onClose, defaultPatientId }) => {
  const { state, addAppointment, addPatient } = useClinic();
  const doctors = state.staff.filter((s) => s.role === "doctor");

  const [isNewPatient, setIsNewPatient] = useState(false);
  const [patientId, setPatientId] = useState(defaultPatientId || state.patients[0]?.id || "");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [doctorId, setDoctorId] = useState(doctors[0]?.id || "");
  const [branchId, setBranchId] = useState(state.branches[0]?.id || "br-1");
  const [date, setDate] = useState(TODAY_STR);
  const [startTime, setStartTime] = useState("12:30");
  const [durationMin, setDurationMin] = useState(30);
  const [mode, setMode] = useState<AppointmentMode>("in-person");
  const [facility, setFacility] = useState("Consult Room 1");
  const [reason, setReason] = useState("");
  const [sendReminder, setSendReminder] = useState(true);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalPatientId = patientId;
    if (isNewPatient) {
      if (!newName.trim() || !newPhone.trim()) return;
      const created = addPatient({
        name: newName.trim(),
        phone: newPhone.trim(),
        email: `${newName.trim().toLowerCase().replace(/\s+/g, ".")}@example.com`,
        dob: "1992-05-15",
        age: 34,
        gender: "Other",
        bloodGroup: "O+",
        branchId,
        specialtyTag: doctors.find((d) => d.id === doctorId)?.specialty || "General Medicine",
        allergies: ["None Known"],
        chronicConditions: [],
      });
      finalPatientId = created.id;
    }

    addAppointment({
      patientId: finalPatientId,
      doctorId,
      branchId,
      date,
      startTime,
      durationMin,
      mode,
      facility: mode === "in-person" ? facility : undefined,
      reason: reason.trim() || "General Clinical Consultation",
      status: "confirmed",
      reminderSent: sendReminder,
      source: "Front Desk",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-xs p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Book Clinic Appointment</h3>
              <p className="text-xs text-slate-500">In-person, Video Telehealth, or Home Visit</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Patient</label>
              <button
                type="button"
                onClick={() => setIsNewPatient(!isNewPatient)}
                className="text-xs font-medium text-teal-600 hover:text-teal-700"
              >
                {isNewPatient ? "Select existing patient" : "+ Quick Register New Patient"}
              </button>
            </div>
            {isNewPatient ? (
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Full Name"
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                />
                <input
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="WhatsApp / Mobile"
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                />
              </div>
            ) : (
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              >
                {state.patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.mrn}) — {p.phone}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Specialist / Doctor</label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialty})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Branch</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
              >
                {state.branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Consultation Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "in-person", label: "In-Person", icon: MapPin },
                { id: "online", label: "Video Consult", icon: Video },
                { id: "home-visit", label: "Home Visit", icon: Home },
              ] as const).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                    mode === m.id
                      ? "bg-teal-50 border-teal-500 text-teal-800"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <m.icon className="w-3.5 h-3.5" />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Duration</label>
              <select
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
              >
                <option value={15}>15 mins</option>
                <option value={30}>30 mins</option>
                <option value={45}>45 mins</option>
                <option value={60}>60 mins</option>
              </select>
            </div>
          </div>

          {mode === "in-person" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Facility / Room Allocation</label>
              <select
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
              >
                {(state.branches.find((b) => b.id === branchId)?.facilities || []).map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Reason / Chief Complaint</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Follow-up BP check, Physio session, Skin rash..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={sendReminder}
              onChange={(e) => setSendReminder(e.target.checked)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            Send automated WhatsApp & SMS confirmation immediately
          </label>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              Confirm Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
