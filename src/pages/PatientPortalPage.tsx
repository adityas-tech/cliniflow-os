import React from "react";
import { Award, Calendar, CreditCard, Dumbbell, FileText, Pill, ShieldCheck, Utensils } from "lucide-react";
import { useClinic } from "../context/ClinicContext";

export const PatientPortalPage: React.FC = () => {
  const { state, setPortalPatient, collectInvoicePayment, notify } = useClinic();
  const patient = state.patients.find((p) => p.id === state.activePortalPatientId) || state.patients[0];

  const myApts = state.appointments.filter((a) => !a.isBlockedSlot && a.patientId === patient.id);
  const myRxs = state.prescriptions.filter((r) => r.patientId === patient.id);
  const myLabs = state.labOrders.filter((l) => l.patientId === patient.id);
  const myDiets = state.dietPlans.filter((d) => d.patientId === patient.id);
  const myWorkouts = state.workoutPlans.filter((w) => w.patientId === patient.id);
  const myInvoices = state.invoices.filter((i) => i.patientId === patient.id);
  const membership = state.memberships.find((m) => m.id === patient.membershipId);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Portal Top Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-emerald-700 text-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-semibold mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Secured Patient Self-Service Portal
          </div>
          <h1 className="text-xl font-bold">Welcome back, {patient.name}</h1>
          <p className="text-xs text-teal-100 mt-0.5">
            MRN: {patient.mrn} • Wallet Credits: ₹{patient.walletCredits} {membership ? `• ${membership.name}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-teal-100">Preview as Patient:</span>
          <select
            value={patient.id}
            onChange={(e) => setPortalPatient(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-semibold outline-none"
          >
            {state.patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.mrn})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Appointments */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-teal-600" /> My Appointments ({myApts.length})
          </h2>
          {myApts.map((a) => {
            const doc = state.staff.find((d) => d.id === a.doctorId);
            return (
              <div key={a.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900">{doc?.name} ({doc?.specialty})</div>
                  <div className="text-slate-500">{a.date} at {a.startTime} • {a.mode}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold capitalize">
                  {a.status.replace("-", " ")}
                </span>
              </div>
            );
          })}
          {myApts.length === 0 && <div className="text-xs text-slate-400">No scheduled appointments.</div>}
        </div>

        {/* Bills & Membership */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-indigo-600" /> Billing & Membership
          </h2>
          {membership && (
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs flex items-center justify-between">
              <div>
                <div className="font-bold text-indigo-950 flex items-center gap-1"><Award className="w-3.5 h-3.5" /> {membership.name}</div>
                <div className="text-indigo-700 mt-0.5">{patient.membershipSessionsLeft} sessions left • Expires {patient.membershipExpiresAt}</div>
              </div>
            </div>
          )}
          {myInvoices.map((inv) => {
            const due = Math.max(0, inv.totalAmount - inv.paidAmount);
            return (
              <div key={inv.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900">{inv.invoiceNumber} — ₹{inv.totalAmount}</div>
                  <div className="text-slate-500">{inv.createdAt} • {inv.status.toUpperCase()}</div>
                </div>
                {due > 0 ? (
                  <button
                    onClick={() => collectInvoicePayment(inv.id, due, "UPI / Razorpay")}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 text-white font-semibold"
                  >
                    Pay ₹{due}
                  </button>
                ) : (
                  <span className="text-emerald-700 font-bold">Paid</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Digital Prescriptions & Lab Reports */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Pill className="w-4 h-4 text-amber-600" /> Prescriptions & Lab Reports
          </h2>
          {myRxs.map((rx) => (
            <div key={rx.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Rx: {rx.diagnosis}</span>
                <button onClick={() => notify("Prescription PDF downloaded")} className="text-teal-700 hover:underline">Download</button>
              </div>
              <div className="text-slate-600">{rx.items.map((i) => `${i.medicineName} (${i.frequency})`).join(", ")}</div>
            </div>
          ))}
          {myLabs.map((lab) => (
            <div key={lab.id} className="p-3 rounded-xl bg-violet-50/50 border border-violet-200 text-xs space-y-1">
              <div className="flex justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-violet-600" /> {lab.testName}</span>
                <span className="text-violet-700 capitalize">{lab.status.replace("-", " ")}</span>
              </div>
              {lab.aiSummary && <p className="text-slate-600">{lab.aiSummary}</p>}
            </div>
          ))}
        </div>

        {/* Diet & Workout Plans */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Utensils className="w-4 h-4 text-emerald-600" /> My Diet & Workout Care Plans
          </h2>
          {myDiets.map((dp) => (
            <div key={dp.id} className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs space-y-1.5">
              <div className="font-bold text-emerald-950">{dp.title} ({dp.caloriesTarget} kcal/day)</div>
              {dp.meals.slice(0, 3).map((m) => (
                <div key={m.slot} className="text-slate-700"><strong>{m.slot}:</strong> {m.items}</div>
              ))}
            </div>
          ))}
          {myWorkouts.map((wp) => (
            <div key={wp.id} className="p-3 rounded-xl bg-sky-50/50 border border-sky-200 text-xs space-y-1">
              <div className="font-bold text-sky-950 flex items-center gap-1"><Dumbbell className="w-3.5 h-3.5" /> {wp.title}</div>
              {wp.exercises.map((ex) => (
                <div key={ex.name} className="text-slate-700">• {ex.name}: {ex.setsReps} ({ex.frequency})</div>
              ))}
            </div>
          ))}
          {myDiets.length === 0 && myWorkouts.length === 0 && (
            <div className="text-xs text-slate-400">No diet or workout plans assigned yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};
