import React, { useState } from "react";
import { ClipboardCheck, Download, Plug, RotateCcw, Shield } from "lucide-react";
import { useClinic } from "../context/ClinicContext";

export const ReportsIntegrationsPage: React.FC = () => {
  const { state, toggleIntegration, addFormTemplate, resetDemoData, notify } = useClinic();
  const [tab, setTab] = useState<"reports" | "integrations" | "forms" | "audit">("reports");

  const [formTitle, setFormTitle] = useState("");
  const [formCat, setFormCat] = useState<"Intake" | "Consent" | "Assessment" | "Feedback">("Intake");
  const [fieldLabel, setFieldLabel] = useState("Current Symptoms & Duration");

  const totalRev = state.invoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalExp = state.expenses.reduce((s, e) => s + e.amount, 0);

  const exportFinancialCsv = () => {
    const header = "Invoice,Customer,Date,Subtotal,Discount,Tax,Total,Paid,Method,Status\n";
    const rows = state.invoices
      .map((i) => `${i.invoiceNumber},"${i.customerName}",${i.createdAt},${i.subtotal},${i.discountAmount},${i.taxAmount},${i.totalAmount},${i.paidAmount},${i.paymentMethod},${i.status}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cliniflow-financial-report.csv";
    a.click();
    URL.revokeObjectURL(url);
    notify("Financial CSV Report downloaded");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reports, Integrations, Custom Forms & HIPAA Audit</h1>
          <p className="text-xs text-slate-500 mt-0.5">Export financial/clinical reports, manage connected apps, build intake forms & inspect activity logs</p>
        </div>

        <button
          onClick={resetDemoData}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 w-fit"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Demo Data
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl w-fit">
        {[
          { id: "reports", label: "Reports & Exports" },
          { id: "integrations", label: `Integrations (${state.integrations.filter((i) => i.connected).length} Connected)` },
          { id: "forms", label: `Custom Forms (${state.forms.length})` },
          { id: "audit", label: `Audit Log (${state.auditLogs.length})` },
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

      {tab === "reports" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-2">
            <div className="text-xs font-semibold text-slate-500">Collected Revenue</div>
            <div className="text-2xl font-bold text-emerald-700">₹{totalRev.toLocaleString()}</div>
            <button onClick={exportFinancialCsv} className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold">
              <Download className="w-3.5 h-3.5" /> Export Revenue CSV
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-2">
            <div className="text-xs font-semibold text-slate-500">Total Operating Expenses</div>
            <div className="text-2xl font-bold text-rose-700">₹{totalExp.toLocaleString()}</div>
            <div className="text-xs text-slate-500">Across {state.expenses.length} expense records</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-2">
            <div className="text-xs font-semibold text-slate-500">Appointment Mode Split</div>
            <div className="text-xs space-y-1 pt-1">
              <div className="flex justify-between"><span>In-Person:</span><strong>{state.appointments.filter((a) => !a.isBlockedSlot && a.mode === "in-person").length}</strong></div>
              <div className="flex justify-between"><span>Video Telehealth:</span><strong>{state.appointments.filter((a) => a.mode === "online").length}</strong></div>
              <div className="flex justify-between"><span>Home Visits:</span><strong>{state.appointments.filter((a) => a.mode === "home-visit").length}</strong></div>
            </div>
          </div>
        </div>
      )}

      {tab === "integrations" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {state.integrations.map((intg) => (
            <div key={intg.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-md text-white text-[10px] font-bold ${intg.badgeColor}`}>{intg.category}</span>
                  <span className={`text-[11px] font-bold ${intg.connected ? "text-emerald-600" : "text-slate-400"}`}>
                    {intg.connected ? "● Connected" : "Disconnected"}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900 mt-2.5 flex items-center gap-1.5">
                  <Plug className="w-3.5 h-3.5 text-slate-400" /> {intg.name}
                </div>
                <p className="text-xs text-slate-500 mt-1">{intg.description}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">{intg.lastSynced || "Not configured"}</span>
                <button
                  onClick={() => toggleIntegration(intg.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    intg.connected ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-teal-600 text-white hover:bg-teal-700"
                  }`}
                >
                  {intg.connected ? "Disconnect" : "Connect"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "forms" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!formTitle.trim()) return;
              addFormTemplate({
                title: formTitle,
                category: formCat,
                fields: [{ id: "fld-1", label: fieldLabel, type: "text" }],
              });
              setFormTitle("");
            }}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 h-fit"
          >
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <ClipboardCheck className="w-4 h-4 text-teal-600" /> Custom Digital Form Builder
            </h3>
            <input required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Form Title (e.g., Dermatology Consent)" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
            <select value={formCat} onChange={(e) => setFormCat(e.target.value as typeof formCat)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
              <option value="Intake">Patient Intake</option>
              <option value="Consent">Procedure Consent</option>
              <option value="Assessment">Clinical Assessment</option>
              <option value="Feedback">Post-Visit Feedback</option>
            </select>
            <input value={fieldLabel} onChange={(e) => setFieldLabel(e.target.value)} placeholder="Primary Question Field" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
            <button type="submit" className="w-full py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold">Publish Form to Microsite & WhatsApp</button>
          </form>

          <div className="space-y-3">
            {state.forms.map((f) => (
              <div key={f.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 text-xs space-y-1.5">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{f.title}</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px]">{f.category}</span>
                </div>
                <div className="text-slate-500">{f.fields.length} fields • {f.submissionsCount} patient submissions</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "audit" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Shield className="w-4 h-4 text-emerald-600" />
            Immutable HIPAA Activity & Audit Log
          </div>
          <div className="space-y-2">
            {state.auditLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-slate-900">[{log.module}] {log.action}</span>
                  <div className="text-slate-600 mt-0.5">{log.details}</div>
                </div>
                <div className="text-[11px] text-slate-400 shrink-0">
                  {log.actor} ({log.role}) • {log.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
