import React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  Cake,
  Calendar,
  Clock,
  CreditCard,
  Gift,
  IndianRupee,
  Package,
  Pill,
  Play,
  Sparkles,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { TODAY_STR } from "../data/seedData";

export const DashboardPage: React.FC = () => {
  const { state, setActivePage, startConsultation, notify } = useClinic();

  const branchFilter = (branchId: string) =>
    state.activeBranchId === "all" || branchId === state.activeBranchId;

  const todayApts = state.appointments.filter(
    (a) => !a.isBlockedSlot && a.date === TODAY_STR && branchFilter(a.branchId)
  );
  const waitingQueue = todayApts.filter((a) =>
    ["checked-in", "vitals-done", "in-consultation"].includes(a.status)
  );

  const filteredInvoices = state.invoices.filter((i) => branchFilter(i.branchId));
  const totalRevenue = filteredInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const pendingReceivables = filteredInvoices.reduce(
    (s, i) => s + Math.max(0, i.totalAmount - i.paidAmount),
    0
  );
  const lowStockItems = state.inventory.filter(
    (i) => branchFilter(i.branchId) && i.stock <= i.reorderLevel
  );
  const expiringSoon = state.inventory.filter((i) => {
    const days = (new Date(i.expiryDate).getTime() - Date.now()) / 86400000;
    return branchFilter(i.branchId) && days <= 35;
  });

  const expiringMemberships = state.patients.filter((p) => {
    if (!p.membershipExpiresAt) return false;
    const days = (new Date(p.membershipExpiresAt).getTime() - Date.now()) / 86400000;
    return days <= 25;
  });

  const expiringDiets = state.dietPlans.filter((d) => {
    const days = (new Date(d.expiresAt).getTime() - Date.now()) / 86400000;
    return days <= 10;
  });

  const birthdayPatients = state.patients.filter((p) => p.isBirthdayToday);
  const doctors = state.staff.filter((s) => s.role === "doctor" && branchFilter(s.branchId));

  // Weekly revenue chart data (illustrative + live today)
  const chartData = [
    { day: "Mon", rev: 18400, exp: 9200 },
    { day: "Tue", rev: 24200, exp: 11000 },
    { day: "Wed", rev: 21500, exp: 8400 },
    { day: "Thu", rev: 29800, exp: 12100 },
    { day: "Fri", rev: 34600, exp: 14500 },
    { day: "Sat", rev: 38200, exp: 13200 },
    { day: "Today", rev: Math.max(totalRevenue, 12400), exp: 6400 },
  ];
  const maxVal = Math.max(...chartData.map((d) => d.rev));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Clinic Operations Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unified view across Appointments, EMR, Pharmacy, Billing, Memberships & AI Agents
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActivePage("queue")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            Queue Board ({waitingQueue.length})
          </button>
          <button
            onClick={() => setActivePage("pharmacy")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Pill className="w-3.5 h-3.5 text-amber-600" />
            Quick Sale POS
          </button>
          <button
            onClick={() => setActivePage("ai-agents")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold shadow-xs hover:opacity-95"
          >
            <Bot className="w-3.5 h-3.5" />
            Launch AI Agents
          </button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Collected Revenue</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">₹{totalRevenue.toLocaleString()}</div>
          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +18.4% vs last wk
            </span>
            <button onClick={() => setActivePage("billing")} className="text-slate-500 hover:text-teal-700 font-medium">
              View Invoices →
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Appointments</span>
            <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{todayApts.length}</div>
          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span className="text-slate-600">
              {todayApts.filter((a) => a.mode === "online").length} Video • {todayApts.filter((a) => a.mode === "home-visit").length} Home
            </span>
            <button onClick={() => setActivePage("calendar")} className="text-teal-600 font-medium hover:underline">
              Schedule →
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Payments</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">₹{pendingReceivables.toLocaleString()}</div>
          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span className="text-amber-700 font-medium">
              {filteredInvoices.filter((i) => i.status !== "paid").length} open invoices
            </span>
            <button onClick={() => setActivePage("billing")} className="text-slate-500 hover:text-teal-700 font-medium">
              Collect →
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Memberships & Leads</span>
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {state.memberships.reduce((s, m) => s + m.activeMembers, 0)}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span className="text-indigo-600 font-medium">
              {state.leads.filter((l) => l.stage !== "Converted").length} active CRM leads
            </span>
            <button onClick={() => setActivePage("growth")} className="text-slate-500 hover:text-teal-700 font-medium">
              CRM →
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart + Active Queue */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue vs Expense Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Revenue vs Expense Performance (7 Days)</h2>
              <p className="text-xs text-slate-500">Consultations, Pharmacy POS, Labs & Memberships</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> Revenue
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Expense
              </span>
            </div>
          </div>

          <div className="h-52 flex items-end justify-between gap-3 pt-4 px-2 border-b border-slate-100">
            {chartData.map((d) => {
              const revH = Math.round((d.rev / maxVal) * 155);
              const expH = Math.round((d.exp / maxVal) * 155);
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full flex items-end justify-center gap-1.5 h-40">
                    <div
                      style={{ height: `${revH}px` }}
                      className="w-4 sm:w-6 rounded-t-lg bg-gradient-to-t from-teal-600 to-cyan-500 transition-all group-hover:opacity-90 relative"
                      title={`Revenue: ₹${d.rev.toLocaleString()}`}
                    />
                    <div
                      style={{ height: `${expH}px` }}
                      className="w-3 sm:w-4 rounded-t-lg bg-slate-200 transition-all"
                      title={`Expense: ₹${d.exp.toLocaleString()}`}
                    />
                  </div>
                  <span className={`text-[11px] font-medium ${d.day === "Today" ? "text-teal-700 font-bold" : "text-slate-500"}`}>
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Specialist Leaderboard */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Top Specialist Performance</h3>
              <button onClick={() => setActivePage("reports")} className="text-xs font-medium text-teal-600 hover:underline flex items-center gap-0.5">
                Full Analytics <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {doctors.slice(0, 3).map((doc) => {
                const docApts = state.appointments.filter((a) => a.doctorId === doc.id && !a.isBlockedSlot);
                return (
                  <div key={doc.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${doc.avatarColor} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
                      {doc.name.replace("Dr. ", "").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{doc.name}</div>
                      <div className="text-[11px] text-slate-500">{doc.specialty}</div>
                      <div className="text-[11px] font-semibold text-teal-700 mt-0.5">
                        {docApts.length} visits • ★ {doc.rating}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Clinical Queue */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-teal-600" />
                Live Patient Flow
              </h2>
              <p className="text-xs text-slate-500">Click Consult to open EMR 360</p>
            </div>
            <button onClick={() => setActivePage("queue")} className="text-xs font-semibold text-teal-600 hover:underline">
              All →
            </button>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto">
            {todayApts.slice(0, 5).map((apt) => {
              const patient = state.patients.find((p) => p.id === apt.patientId);
              const doc = state.staff.find((d) => d.id === apt.doctorId);
              if (!patient) return null;
              return (
                <div key={apt.id} className="p-3 rounded-xl border border-slate-200/80 hover:border-teal-300 bg-slate-50/50 transition">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-bold">
                        {apt.tokenNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{patient.name}</span>
                      {apt.mode === "online" && <Video className="w-3.5 h-3.5 text-indigo-500" />}
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">{apt.startTime}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 truncate">
                    {doc?.name} • {apt.reason}
                  </div>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                        apt.status === "in-consultation"
                          ? "bg-teal-100 text-teal-800"
                          : apt.status === "vitals-done"
                          ? "bg-indigo-100 text-indigo-800"
                          : apt.status === "checked-in"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {apt.status.replace("-", " ")}
                    </span>
                    <button
                      onClick={() => startConsultation(patient.id, apt.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold transition"
                    >
                      <Play className="w-3 h-3" /> Consult
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Actionable Alerts Row (Expiring Packages, Diet Plans, Stock Alerts, Birthdays) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Low Stock & Expiry */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Stock & Expiry Alerts
            </span>
            <button onClick={() => setActivePage("inventory")} className="text-[11px] font-semibold text-teal-600">
              Restock →
            </button>
          </div>
          <div className="space-y-2">
            {lowStockItems.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-rose-50/60 border border-rose-100">
                <span className="font-medium text-slate-800 truncate pr-2">{item.name}</span>
                <span className="text-rose-700 font-bold shrink-0">{item.stock} left</span>
              </div>
            ))}
            {expiringSoon.slice(0, 1).map((item) => (
              <div key={item.id + "-exp"} className="flex items-center justify-between text-xs p-2 rounded-lg bg-amber-50/70 border border-amber-100">
                <span className="font-medium text-slate-800 truncate pr-2">{item.name}</span>
                <span className="text-amber-700 font-semibold shrink-0">Exp {item.expiryDate}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Package / Membership Expiries */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-indigo-500" />
              Membership Renewals
            </span>
            <button onClick={() => setActivePage("billing")} className="text-[11px] font-semibold text-teal-600">
              Manage →
            </button>
          </div>
          <div className="space-y-2">
            {expiringMemberships.map((p) => (
              <div key={p.id} className="p-2 rounded-lg bg-indigo-50/50 border border-indigo-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-800">{p.name}</div>
                  <div className="text-[11px] text-slate-500">{p.membershipSessionsLeft} sessions • Exp {p.membershipExpiresAt}</div>
                </div>
                <button
                  onClick={() => notify(`WhatsApp renewal reminder sent to ${p.name}`)}
                  className="px-2 py-1 rounded-md bg-white border border-indigo-200 text-indigo-700 text-[11px] font-semibold hover:bg-indigo-50"
                >
                  Nudge
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Diet Plan Expiries */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Diet Plan Renewals
            </span>
            <button onClick={() => setActivePage("ai-agents")} className="text-[11px] font-semibold text-teal-600">
              NutriPlan AI →
            </button>
          </div>
          <div className="space-y-2">
            {expiringDiets.map((d) => {
              const p = state.patients.find((pt) => pt.id === d.patientId);
              return (
                <div key={d.id} className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs">
                  <div className="font-semibold text-slate-800">{p?.name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{d.title}</div>
                  <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">Expires {d.expiresAt}</div>
                </div>
              );
            })}
            {expiringDiets.length === 0 && (
              <div className="text-xs text-slate-400 py-4 text-center">All diet plans active</div>
            )}
          </div>
        </div>

        {/* Today's Patient Birthdays */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Cake className="w-4 h-4 text-pink-500" />
              Today's Birthdays ({birthdayPatients.length})
            </span>
            <Gift className="w-4 h-4 text-pink-400" />
          </div>
          <div className="space-y-2">
            {birthdayPatients.map((p) => (
              <div key={p.id} className="p-2 rounded-lg bg-pink-50/50 border border-pink-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-800">{p.name}</div>
                  <div className="text-[11px] text-slate-500">{p.phone}</div>
                </div>
                <button
                  onClick={() => notify(`Sent WhatsApp birthday wish + 15% wellness voucher to ${p.name}`)}
                  className="px-2 py-1 rounded-md bg-pink-600 text-white text-[11px] font-semibold hover:bg-pink-700"
                >
                  Send Wish
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
