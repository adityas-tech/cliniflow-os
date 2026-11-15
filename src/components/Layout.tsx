import React, { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Bot,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Megaphone,
  Menu,
  Package,
  Pill,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { PageId, UserRole } from "../types/clinic";
import { CommandPalette } from "./CommandPalette";
import { QuickBookModal } from "./QuickBookModal";

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, activePage, setActivePage, setRole, setBranch, toasts, dismissToast } = useClinic();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [quickBookOpen, setQuickBookOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const waitingCount = state.appointments.filter(
    (a) => !a.isBlockedSlot && (a.status === "checked-in" || a.status === "vitals-done" || a.status === "in-consultation")
  ).length;
  const pendingRxCount = state.prescriptions.filter((r) => r.status === "pending-dispense").length;
  const lowStockCount = state.inventory.filter((i) => i.stock <= i.reorderLevel).length;
  const pendingInvoicesCount = state.invoices.filter((i) => i.status !== "paid").length;

  const navGroups: Array<{
    title: string;
    items: Array<{ id: PageId; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number; badgeColor?: string }>;
  }> = [
    {
      title: "Clinical Care",
      items: [
        { id: "dashboard", label: "Command Center", icon: LayoutDashboard },
        { id: "calendar", label: "Calendar & Telehealth", icon: Calendar },
        { id: "queue", label: "Front Desk & Queue", icon: ClipboardList, badge: waitingCount || undefined, badgeColor: "bg-teal-100 text-teal-800" },
        { id: "patients", label: "Patients & EMR 360", icon: Stethoscope },
      ],
    },
    {
      title: "Pharmacy & Stock",
      items: [
        { id: "pharmacy", label: "Pharmacy & POS", icon: Pill, badge: pendingRxCount || undefined, badgeColor: "bg-amber-100 text-amber-800" },
        { id: "inventory", label: "Inventory & Vendors", icon: Package, badge: lowStockCount || undefined, badgeColor: "bg-rose-100 text-rose-700" },
      ],
    },
    {
      title: "Revenue & Growth",
      items: [
        { id: "billing", label: "Billing & Memberships", icon: CreditCard, badge: pendingInvoicesCount || undefined, badgeColor: "bg-sky-100 text-sky-700" },
        { id: "growth", label: "CRM, Leads & Microsite", icon: Megaphone },
      ],
    },
    {
      title: "Intelligence & System",
      items: [
        { id: "ai-agents", label: "AI Agents Hub", icon: Bot },
        { id: "reports", label: "Reports, Forms & Audit", icon: BarChart3 },
        { id: "patient-portal", label: "Patient Portal View", icon: UserCheck },
      ],
    },
  ];

  const roleLabels: Record<UserRole, string> = {
    owner: "Clinic Owner / Admin",
    doctor: "Doctor / Specialist",
    reception: "Front Desk / Reception",
    pharmacist: "Pharmacist / POS",
    patient: "Patient Portal",
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-600 text-white flex items-center justify-center shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                CliniFlow <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">AI OS</span>
              </div>
              <div className="text-[11px] text-slate-500">One Software. One Flow.</div>
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden p-1 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navGroups.map((group) => (
            <div key={group.title}>
              <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActivePage(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                        active
                          ? "bg-teal-600 text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <item.icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-400"}`} />
                        {item.label}
                      </span>
                      {item.badge !== undefined && (
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                            active ? "bg-white/20 text-white" : item.badgeColor
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Compliance Badge */}
        <div className="p-3 border-t border-slate-100">
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              HIPAA & Cyber Essentials
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Encrypted EMR, role-based access & full audit logging active.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="no-print h-16 bg-white border-b border-slate-200 px-4 lg:px-6 flex items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <Menu className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCmdOpen(true)}
              className="hidden sm:flex items-center gap-2.5 w-64 md:w-80 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-500 hover:border-slate-300 hover:bg-white transition"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="flex-1 text-left">Search patient, MRN, medicine...</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded">⌘K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Branch Selector */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs">
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <select
                value={state.activeBranchId}
                onChange={(e) => setBranch(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Clinic Branches (2)</option>
                {state.branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.code} — {b.name.split("—")[1]?.trim() || b.name}</option>
                ))}
              </select>
            </div>

            {/* Role Switcher */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <select
                value={state.activeRole}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
              >
                {Object.entries(roleLabels).map(([role, label]) => (
                  <option key={role} value={role}>{label}</option>
                ))}
              </select>
            </div>

            {/* Quick AI Hub */}
            <button
              onClick={() => setActivePage("ai-agents")}
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 text-xs font-semibold transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Agents
            </button>

            {/* Quick Book CTA */}
            <button
              onClick={() => setQuickBookOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Book Appointment</span>
              <span className="sm:hidden">Book</span>
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Toast Notifications */}
      <div className="no-print fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-start gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700/80 animate-in fade-in"
          >
            <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${t.type === "warning" ? "text-amber-400" : t.type === "info" ? "text-sky-400" : "text-emerald-400"}`} />
            <div className="flex-1 text-xs">
              <div className="font-semibold">{t.title}</div>
              {t.description && <div className="text-slate-300 mt-0.5">{t.description}</div>}
            </div>
            <button onClick={() => dismissToast(t.id)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onOpenQuickBook={() => setQuickBookOpen(true)} />
      <QuickBookModal open={quickBookOpen} onClose={() => setQuickBookOpen(false)} />
    </div>
  );
};
