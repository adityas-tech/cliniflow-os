import React, { useEffect, useState } from "react";
import { BookOpen, Calendar, FileText, Package, PhoneCall, Pill, Search, Sparkles, User, X } from "lucide-react";
import { useClinic } from "../context/ClinicContext";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onOpenQuickBook: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose, onOpenQuickBook }) => {
  const { state, setActivePage, setSelectedPatientId } = useClinic();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  if (!open) return null;

  const q = query.toLowerCase().trim();
  const patients = state.patients
    .filter((p) => !q || p.name.toLowerCase().includes(q) || p.mrn.toLowerCase().includes(q) || p.phone.includes(q))
    .slice(0, 5);

  const inventory = state.inventory
    .filter((i) => !q || i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
    .slice(0, 4);

  const invoices = state.invoices
    .filter((inv) => !q || inv.invoiceNumber.toLowerCase().includes(q) || inv.customerName.toLowerCase().includes(q))
    .slice(0, 3);

  const quickActions = [
    { label: "Book New Appointment", icon: Calendar, action: () => { onClose(); onOpenQuickBook(); } },
    { label: "Open Voice AI Helpline & WhatsApp Flow", icon: PhoneCall, action: () => { setActivePage("voice-whatsapp"); onClose(); } },
    { label: "Open Pharmacy & Quick Sale (POS)", icon: Pill, action: () => { setActivePage("pharmacy"); onClose(); } },
    { label: "Launch AI Agents Hub (MedQuery / VoiceCmd / MedDoc)", icon: Sparkles, action: () => { setActivePage("ai-agents"); onClose(); } },
    { label: "Switch to Patient Self-Service Portal", icon: User, action: () => { setActivePage("patient-portal"); onClose(); } },
    { label: "Open Onboarding & Feature Tutorials Academy", icon: BookOpen, action: () => { setActivePage("tutorials"); onClose(); } },
  ].filter((a) => !q || a.label.toLowerCase().includes(q));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 backdrop-blur-xs pt-20 px-4" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients, MRN, medicines, invoices, or quick actions..."
            className="flex-1 text-sm outline-none text-slate-800 placeholder:text-slate-400"
          />
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 space-y-3">
          {quickActions.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Quick Actions</div>
              {quickActions.map((act) => (
                <button
                  key={act.label}
                  onClick={act.action}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-800 transition"
                >
                  <act.icon className="w-4 h-4 text-teal-600" />
                  <span className="font-medium">{act.label}</span>
                </button>
              ))}
            </div>
          )}

          {patients.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Patients (Open Healthboard)</div>
              {patients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPatientId(p.id);
                    setActivePage("patients");
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center">
                      {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </span>
                    <div>
                      <div className="font-medium text-slate-800">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.mrn} • {p.specialtyTag} • {p.phone}</div>
                    </div>
                  </div>
                  <span className="text-xs text-teal-600 font-medium">EMR →</span>
                </button>
              ))}
            </div>
          )}

          {inventory.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pharmacy & Stock</div>
              {inventory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActivePage("inventory"); onClose(); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-indigo-500" />
                    <span className="text-slate-700 font-medium">{item.name}</span>
                  </div>
                  <span className="text-xs text-slate-500">{item.stock} {item.unit}</span>
                </button>
              ))}
            </div>
          )}

          {invoices.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Invoices</div>
              {invoices.map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => { setActivePage("billing"); onClose(); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-amber-500" />
                    <span className="text-slate-700 font-medium">{inv.invoiceNumber} — {inv.customerName}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-600">₹{inv.totalAmount}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">⌘K</kbd> anytime to search</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
