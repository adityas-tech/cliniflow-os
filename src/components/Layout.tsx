import React, { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Home,
  LayoutDashboard,
  LayoutGrid,
  List,
  Megaphone,
  Menu,
  MessageCircle,
  Mic,
  Package,
  PhoneCall,
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
import { DoctorAiDrawer } from "./DoctorAiDrawer";
import { OnboardingModal } from "./OnboardingModal";
import { QuickBookModal } from "./QuickBookModal";
import { TourBanner } from "./TourBanner";

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    state,
    activePage,
    setActivePage,
    setPatientViewMode,
    openPrescriptionPad,
    setRole,
    setBranch,
    toasts,
    dismissToast,
    completedTutorials,
    markTutorialDone,
    tourActive,
    startTour,
    stopTour,
    doctorAiOpen,
    setDoctorAiOpen,
    notify,
  } = useClinic();

  const [cmdOpen, setCmdOpen] = useState(false);
  const [quickBookOpen, setQuickBookOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
  const [onboardingMode, setOnboardingMode] = useState<"welcome" | "page-help">("welcome");
  const [onboardingOpen, setOnboardingOpen] = useState(false);

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

  // CliniFlow Primary Icon Rail Items
  const railItems: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    active: boolean;
    onClick: () => void;
  }> = [
    {
      id: "queue",
      label: "Queue",
      icon: Home,
      badge: waitingCount || undefined,
      active: activePage === "queue",
      onClick: () => setActivePage("queue"),
    },
    {
      id: "clinscribe",
      label: "ClinScribe",
      icon: Mic,
      active: activePage === "prescription-pad",
      onClick: () => {
        const nextApt = state.appointments.find((a) => !a.isBlockedSlot && a.status !== "completed");
        openPrescriptionPad(nextApt?.patientId || state.patients[0].id, nextApt?.id, { autoVoice: true });
      },
    },
    {
      id: "patients",
      label: "Patients",
      icon: Users,
      active: activePage === "patients",
      onClick: () => {
        setPatientViewMode("directory");
        setActivePage("patients");
      },
    },
    {
      id: "payments",
      label: "Payments",
      icon: CreditCard,
      active: activePage === "billing",
      onClick: () => setActivePage("billing"),
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      active: activePage === "analytics",
      onClick: () => setActivePage("analytics"),
    },
    {
      id: "abha",
      label: "ABHA",
      icon: ShieldCheck,
      active: false,
      onClick: () => {
        setPatientViewMode("directory");
        setActivePage("patients");
        notify("ABHA Registry active", `${state.patients.filter((p) => p.abhaStatus === "ABHA Linked").length} patients linked`, "info");
      },
    },
    {
      id: "pharmacy",
      label: "Pharmacy",
      icon: Pill,
      badge: pendingRxCount || undefined,
      active: activePage === "pharmacy",
      onClick: () => setActivePage("pharmacy"),
    },
    {
      id: "more",
      label: "Add-Ons",
      icon: LayoutGrid,
      active: moreDrawerOpen || ["dashboard", "calendar", "inventory", "growth", "voice-whatsapp", "ai-agents", "reports", "patient-portal", "tutorials"].includes(activePage),
      onClick: () => setMoreDrawerOpen((v) => !v),
    },
  ];

  const moreModules: Array<{ id: PageId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "dashboard", label: "Command Center", icon: LayoutDashboard },
    { id: "calendar", label: "Calendar & Telehealth", icon: Calendar },
    { id: "inventory", label: "Inventory & Vendors", icon: Package },
    { id: "growth", label: "CRM, Leads & Microsite", icon: Megaphone },
    { id: "voice-whatsapp", label: "Voice AI & WhatsApp", icon: PhoneCall },
    { id: "ai-agents", label: "AI Agents Hub", icon: Bot },
    { id: "reports", label: "Reports, Forms & Audit", icon: Stethoscope },
    { id: "patient-portal", label: "Patient Portal View", icon: UserCheck },
    { id: "tutorials", label: "Tutorials & Academy", icon: BookOpen },
  ];

  const roleLabels: Record<UserRole, string> = {
    owner: "Dr. Rajeev K.",
    doctor: "Doctor",
    reception: "Staff / Desk",
    pharmacist: "Pharmacist",
    patient: "Patient",
  };

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Compact CliniFlow Left Icon Rail */}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-40 w-16 bg-white border-r border-slate-200 flex flex-col items-center py-2.5 justify-between transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col items-center w-full gap-1">
          {/* CliniFlow PRO Logo Badge */}
          <button
            onClick={() => setActivePage("queue")}
            className="mb-2 flex flex-col items-center group"
            title="CliniFlow OS"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0d6efd] to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <span className="mt-0.5 px-1.5 py-0.2 bg-slate-900 text-white text-[9px] font-extrabold rounded">
              PRO
            </span>
          </button>

          {/* Rail Icons */}
          <nav className="w-full px-1.5 space-y-1">
            {railItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  item.onClick();
                  setMobileMenuOpen(false);
                }}
                className={`relative w-full py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition ${
                  item.active
                    ? "bg-blue-50 text-[#0d6efd]"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-[10px] font-semibold leading-tight text-center">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="absolute top-1 right-1.5 min-w-[15px] h-[15px] px-1 rounded-full bg-[#0d6efd] text-white text-[9px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom WhatsApp & Account */}
        <div className="flex flex-col items-center gap-2 w-full px-1.5">
          <button
            onClick={() => setActivePage("voice-whatsapp")}
            className="w-full py-1.5 rounded-xl flex flex-col items-center gap-0.5 text-emerald-600 hover:bg-emerald-50"
            title="WhatsApp & Voice AI"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-[9px] font-semibold">WhatsApp</span>
          </button>
          <div
            className="w-8 h-8 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center cursor-pointer"
            onClick={() => {
              setOnboardingMode("welcome");
              setOnboardingOpen(true);
            }}
            title="Dr. Rajeev Kacker"
          >
            RK
          </div>
        </div>
      </aside>

      {/* Expandable Add-Ons / All Modules Popover */}
      {moreDrawerOpen && (
        <div
          className="no-print fixed inset-0 z-30 bg-slate-900/20"
          onClick={() => setMoreDrawerOpen(false)}
        >
          <div
            className="fixed left-16 top-14 w-64 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 space-y-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Clinic Add-Ons & Modules</span>
              <button onClick={() => setMoreDrawerOpen(false)}><X className="w-3.5 h-3.5" /></button>
            </div>
            {moreModules.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setActivePage(m.id);
                  setMoreDrawerOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activePage === m.id ? "bg-blue-50 text-[#0d6efd]" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <m.icon className="w-4 h-4" />
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${doctorAiOpen ? "xl:pr-[430px]" : ""}`}>
        {/* Top Operational Bar (hidden on full-bleed Prescription Pad v2 to match video) */}
        {activePage !== "prescription-pad" && (
          <header className="no-print h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between gap-2 sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-1.5 rounded-lg border border-slate-200 text-slate-600"
              >
                <Menu className="w-4 h-4" />
              </button>

              {/* Date Pill & Today */}
              <div className="hidden sm:flex items-center gap-1 border border-slate-200 rounded-xl px-2 py-1 bg-white text-xs font-semibold text-slate-700">
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                <span className="px-1">{todayFormatted}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <button
                onClick={() => setActivePage("queue")}
                className="hidden md:inline-flex px-2.5 py-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Today
              </button>

              {/* Clinic Selector */}
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200 bg-white text-xs">
                <Building2 className="w-3.5 h-3.5 text-[#0d6efd]" />
                <select
                  value={state.activeBranchId}
                  onChange={(e) => setBranch(e.target.value)}
                  className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer max-w-[190px]"
                >
                  <option value="all">Dr. Kacker's Chest & Sleep...</option>
                  {state.branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* List vs Calendar Switcher */}
              <div className="hidden xl:flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50">
                <button
                  onClick={() => setActivePage("queue")}
                  className={`p-1.5 rounded-lg ${activePage === "queue" ? "bg-white shadow-2xs text-[#0d6efd]" : "text-slate-400"}`}
                  title="OPD Queue List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActivePage("calendar")}
                  className={`p-1.5 rounded-lg ${activePage === "calendar" ? "bg-white shadow-2xs text-[#0d6efd]" : "text-slate-400"}`}
                  title="Appointment Calendar"
                >
                  <Calendar className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCmdOpen(true)}
                className="flex items-center gap-2 w-40 sm:w-56 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500 hover:bg-white transition"
              >
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span className="flex-1 text-left truncate">Search</span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded">⌘K</kbd>
              </button>

              {/* Role / Doctor Pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200 bg-white text-xs">
                <select
                  value={state.activeRole}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  {Object.entries(roleLabels).map(([role, label]) => (
                    <option key={role} value={role}>
                      {label}
                    </option>
                  ))}
                </select>
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                  ★ Premium
                </span>
              </div>

              <button
                onClick={() => setDoctorAiOpen(!doctorAiOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition ${
                  doctorAiOpen
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden md:inline">DocAssist</span>
              </button>

              <button
                onClick={() => setQuickBookOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0d6efd] hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Book</span>
              </button>
            </div>
          </header>
        )}

        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">{children}</main>
      </div>

      {/* Toast Notifications */}
      <div className="no-print fixed bottom-16 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-start gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700/80"
          >
            <CheckCircle2
              className={`w-4 h-4 mt-0.5 shrink-0 ${
                t.type === "warning" ? "text-amber-400" : t.type === "info" ? "text-sky-400" : "text-emerald-400"
              }`}
            />
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
      <OnboardingModal open={onboardingOpen} mode={onboardingMode} onClose={() => setOnboardingOpen(false)} onStartTour={(p) => startTour(p)} />
      <TourBanner active={tourActive} onClose={stopTour} completedIds={completedTutorials} onMarkCompleted={markTutorialDone} />
      <DoctorAiDrawer />
    </div>
  );
};
