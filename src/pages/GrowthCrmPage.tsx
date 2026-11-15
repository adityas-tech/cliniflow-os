import React, { useState } from "react";
import { Calendar, CheckCircle2, Globe, Megaphone, MessageCircle, Plus, Star, UserPlus, Users } from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { TODAY_STR } from "../data/seedData";
import { AppointmentMode, Lead } from "../types/clinic";

export const GrowthCrmPage: React.FC = () => {
  const { state, addLead, updateLeadStage, convertLeadToPatient, sendCampaign, moderateReview, registerEventAttendee, addPatient, addAppointment, notify } = useClinic();
  const [tab, setTab] = useState<"leads" | "campaigns" | "events" | "microsite">("leads");

  // New Lead
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadSource, setLeadSource] = useState<Lead["source"]>("WhatsApp Bot");
  const [leadInterest, setLeadInterest] = useState("");

  // Broadcast
  const [cmpTitle, setCmpTitle] = useState("");
  const [cmpMsg, setCmpMsg] = useState("Hi {{name}}, book your annual preventive health checkup this week and get 15% off!");
  const [cmpAudience, setCmpAudience] = useState("All Active Patients");

  // Microsite Live Booking Widget
  const doctors = state.staff.filter((s) => s.role === "doctor");
  const [msDocId, setMsDocId] = useState(doctors[0]?.id || "");
  const [msMode, setMsMode] = useState<AppointmentMode>("in-person");
  const [msTime, setMsTime] = useState("16:00");
  const [msName, setMsName] = useState("");
  const [msPhone, setMsPhone] = useState("");

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim()) return;
    addLead({
      name: leadName,
      phone: leadPhone || "+91 98000 12345",
      email: `${leadName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      source: leadSource,
      interest: leadInterest || "General Consultation",
      stage: "New",
      notes: "Captured via CRM",
    });
    setLeadName("");
    setLeadPhone("");
    setLeadInterest("");
  };

  const handleMicrositeBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msName.trim() || !msPhone.trim()) return;
    const doc = doctors.find((d) => d.id === msDocId) || doctors[0];
    const pat = addPatient({
      name: msName,
      phone: msPhone,
      email: `${msName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      dob: "1994-03-10",
      age: 32,
      gender: "Other",
      bloodGroup: "O+",
      branchId: doc?.branchId || "br-1",
      specialtyTag: doc?.specialty || "General Medicine",
      allergies: ["None Known"],
      chronicConditions: [],
    });
    addAppointment({
      patientId: pat.id,
      doctorId: doc.id,
      branchId: doc.branchId,
      date: TODAY_STR,
      startTime: msTime,
      durationMin: 30,
      mode: msMode,
      reason: "Booked via Branded Clinic Microsite",
      status: "confirmed",
      reminderSent: true,
      source: "Online Microsite",
    });
    setMsName("");
    setMsPhone("");
    notify("Public Microsite Booking Confirmed!", "Patient added & slot synced to Clinic Calendar");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">CRM, Leads, WhatsApp Marketing & Branded Microsite</h1>
          <p className="text-xs text-slate-500 mt-0.5">Capture leads from WhatsApp/Meta/Web, convert in 1 click, run broadcasts & accept online bookings</p>
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl w-fit">
          {[
            { id: "leads", label: `Leads Pipeline (${state.leads.length})` },
            { id: "campaigns", label: "WhatsApp Broadcasts" },
            { id: "events", label: "Events & Reviews" },
            { id: "microsite", label: "Live Branded Microsite" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${tab === t.id ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "leads" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <form onSubmit={handleAddLead} className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 h-fit">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-teal-600" /> Capture New Lead
            </h3>
            <input required value={leadName} onChange={(e) => setLeadName(e.target.value)} placeholder="Prospect Name" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
            <input value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} placeholder="WhatsApp / Mobile" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
            <select value={leadSource} onChange={(e) => setLeadSource(e.target.value as Lead["source"])} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
              <option value="WhatsApp Bot">WhatsApp Bot</option>
              <option value="Clinic Microsite">Clinic Microsite</option>
              <option value="Instagram Ad">Instagram Ad</option>
              <option value="Google Search">Google Search</option>
              <option value="Walk-in / Referral">Walk-in / Referral</option>
            </select>
            <input value={leadInterest} onChange={(e) => setLeadInterest(e.target.value)} placeholder="Treatment / Service Interest" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
            <button type="submit" className="w-full py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold">Add to Pipeline</button>
          </form>

          <div className="lg:col-span-2 space-y-3">
            {state.leads.map((lead) => (
              <div key={lead.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{lead.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">{lead.source}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      lead.stage === "Converted" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
                    }`}>{lead.stage}</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">{lead.interest} • {lead.phone}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{lead.notes} • {lead.createdAt}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {lead.stage !== "Converted" ? (
                    <>
                      <select
                        value={lead.stage}
                        onChange={(e) => updateLeadStage(lead.id, e.target.value as Lead["stage"])}
                        className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Appointment Booked">Booked</option>
                      </select>
                      <button
                        onClick={() => convertLeadToPatient(lead.id, doctors[0]?.id, "in-person")}
                        className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
                      >
                        Convert & Book →
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Converted
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "campaigns" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!cmpTitle.trim()) return;
              sendCampaign({
                title: cmpTitle,
                channel: "WhatsApp",
                audience: cmpAudience,
                message: cmpMsg,
                sentCount: state.patients.length * 24,
              });
              setCmpTitle("");
            }}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3.5"
          >
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-emerald-600" /> New WhatsApp Broadcast Campaign
            </h3>
            <input required value={cmpTitle} onChange={(e) => setCmpTitle(e.target.value)} placeholder="Campaign Title (e.g., Summer Skin Checkup Offer)" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
            <select value={cmpAudience} onChange={(e) => setCmpAudience(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
              <option value="All Active Patients">All Active Patients</option>
              <option value="Diabetes & Nutrition Cohort">Diabetes & Nutrition Cohort</option>
              <option value="Expiring Memberships (15 Days)">Expiring Memberships (15 Days)</option>
            </select>
            <textarea rows={4} value={cmpMsg} onChange={(e) => setCmpMsg(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
            <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
              Launch WhatsApp Broadcast
            </button>
          </form>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Sent Campaigns</h3>
            {state.campaigns.map((c) => (
              <div key={c.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{c.title}</span>
                  <span className="text-emerald-700">{c.openRate} Open Rate</span>
                </div>
                <div className="text-[11px] text-slate-500">{c.channel} • {c.audience} • {c.sentCount} sent • {c.sentAt}</div>
                <p className="text-slate-600 pt-1">{c.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "events" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-teal-600" /> Health Camps & Webinars
            </h3>
            {state.events.map((ev) => (
              <div key={ev.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{ev.title}</div>
                    <div className="text-slate-500 mt-0.5">{ev.type} • {ev.date} • {ev.time} • {ev.location}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">{ev.status}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-semibold text-slate-700">{ev.registeredCount} / {ev.capacity} registered</span>
                  <button onClick={() => registerEventAttendee(ev.id)} className="px-3 py-1.5 rounded-lg bg-teal-600 text-white font-semibold">
                    + Register Walk-in
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500" /> Patient Review Moderation (Microsite)
            </h3>
            {state.reviews.map((rev) => (
              <div key={rev.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-900">{rev.patientName} → {rev.doctorName}</span>
                  <span className="text-amber-500 font-bold">{"★".repeat(rev.rating)}</span>
                </div>
                <p className="text-slate-600">"{rev.comment}"</p>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    rev.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                  }`}>{rev.status}</span>
                  <div className="flex gap-2">
                    <button onClick={() => moderateReview(rev.id, "approved")} className="text-emerald-700 font-semibold hover:underline">Approve</button>
                    <button onClick={() => moderateReview(rev.id, "hidden")} className="text-slate-500 font-semibold hover:underline">Hide</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "microsite" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="bg-gradient-to-r from-teal-700 to-cyan-700 text-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-[11px] font-semibold mb-2">
                <Globe className="w-3.5 h-3.5" /> Public Clinic Microsite: cliniflow.care/koramangala
              </div>
              <h2 className="text-xl font-bold">CliniFlow Integrated Medical & Wellness Center</h2>
              <p className="text-xs text-teal-100 mt-1">Book In-Person, Video Telehealth, or Home Visits — zero app download required.</p>
            </div>
            <div className="text-right text-xs">
              <div className="font-bold">★ 4.9 / 5.0 Verified Patient Rating</div>
              <div className="text-teal-100">{state.reviews.filter((r) => r.status === "approved").length} Published Reviews</div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={handleMicrositeBook} className="space-y-3.5 p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-600" /> Instant Online Appointment Booking
              </h3>
              <select value={msDocId} onChange={(e) => setMsDocId(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.specialty} (₹{d.consultationFee})</option>)}
              </select>
              <div className="grid grid-cols-3 gap-2">
                {(["in-person", "online", "home-visit"] as AppointmentMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMsMode(m)}
                    className={`py-2 rounded-xl text-xs font-semibold capitalize border ${msMode === m ? "bg-teal-600 text-white border-teal-600" : "bg-white border-slate-200 text-slate-700"}`}
                  >
                    {m.replace("-", " ")}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <input required value={msName} onChange={(e) => setMsName(e.target.value)} placeholder="Your Full Name" className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white" />
                <input required value={msPhone} onChange={(e) => setMsPhone(e.target.value)} placeholder="WhatsApp Number" className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white" />
              </div>
              <input type="time" value={msTime} onChange={(e) => setMsTime(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white" />
              <button type="submit" className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold">
                Confirm Slot (Syncs Directly to Clinic Calendar)
              </button>
            </form>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Verified Patient Testimonials</h3>
              {state.reviews.filter((r) => r.status === "approved").map((r) => (
                <div key={r.id} className="p-4 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{r.patientName}</span>
                    <span className="text-amber-500">{"★".repeat(r.rating)}</span>
                  </div>
                  <div className="text-[11px] text-teal-700 font-semibold">Consulted {r.doctorName}</div>
                  <p className="text-slate-600">"{r.comment}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
