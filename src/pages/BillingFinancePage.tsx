import React, { useState } from "react";
import { Award, CheckCircle2, CreditCard, Plus, Printer, Receipt, Tag, TrendingDown, X } from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { TODAY_STR } from "../data/seedData";
import { ExpenseRecord, Invoice } from "../types/clinic";

export const BillingFinancePage: React.FC = () => {
  const { state, createQuickSaleInvoice, collectInvoicePayment, addExpense, assignMembership, toggleDiscount } = useClinic();
  const [tab, setTab] = useState<"invoices" | "memberships" | "expenses">("invoices");
  const [newInvOpen, setNewInvOpen] = useState(false);

  // New Invoice Builder
  const [invPatientId, setInvPatientId] = useState(state.patients[0]?.id || "");
  const [invDesc, setInvDesc] = useState("Specialist Consultation & Follow-up");
  const [invPrice, setInvPrice] = useState(800);
  const [invMethod, setInvMethod] = useState<Invoice["paymentMethod"]>("UPI / Razorpay");

  // Assign Membership
  const [memPatientId, setMemPatientId] = useState(state.patients[3]?.id || state.patients[0]?.id || "");
  const [memPlanId, setMemPlanId] = useState(state.memberships[0]?.id || "");

  // Expense Form
  const [expCat, setExpCat] = useState<ExpenseRecord["category"]>("Consumables");
  const [expVendor, setExpVendor] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState(2500);

  const totalBilled = state.invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalCollected = state.invoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalExpenses = state.expenses.reduce((s, e) => s + e.amount, 0);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = state.patients.find((p) => p.id === invPatientId);
    createQuickSaleInvoice({
      patientId: pat?.id,
      customerName: pat?.name || "Patient",
      items: [{ type: "Consultation", description: invDesc, qty: 1, unitPrice: invPrice }],
      discountLabel: pat?.membershipId ? "Membership 10%" : undefined,
      discountPercent: pat?.membershipId ? 10 : 0,
      paymentMethod: invMethod,
      markPaid: invMethod !== "Pending",
    });
    setNewInvOpen(false);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expVendor.trim()) return;
    addExpense({
      date: TODAY_STR,
      category: expCat,
      vendor: expVendor,
      description: expDesc || `${expCat} payment`,
      amount: expAmount,
      branchId: state.activeBranchId === "all" ? "br-1" : state.activeBranchId,
    });
    setExpVendor("");
    setExpDesc("");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Billing, Memberships, Discounts & Expenses</h1>
          <p className="text-xs text-slate-500 mt-0.5">Unified revenue collection, membership packages, discount rules & clinic P&L</p>
        </div>
        <button
          onClick={() => setNewInvOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold w-fit"
        >
          <Plus className="w-3.5 h-3.5" /> Create Invoice
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
          <div className="text-xs font-semibold text-slate-500">Total Collected</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">₹{totalCollected.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Out of ₹{totalBilled.toLocaleString()} billed</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
          <div className="text-xs font-semibold text-slate-500">Pending Receivables</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">₹{(totalBilled - totalCollected).toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{state.invoices.filter((i) => i.status !== "paid").length} unpaid/partial invoices</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
          <div className="text-xs font-semibold text-slate-500">Clinic Operating Expenses</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">₹{totalExpenses.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{state.expenses.length} logged expense entries</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl w-fit">
        {[
          { id: "invoices", label: `Invoices (${state.invoices.length})` },
          { id: "memberships", label: "Memberships & Discounts" },
          { id: "expenses", label: "Expenses & P&L" },
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

      {tab === "invoices" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-[11px] text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Patient / Customer</th>
                  <th className="p-3.5">Line Items</th>
                  <th className="p-3.5">Total</th>
                  <th className="p-3.5">Paid / Mode</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.invoices.map((inv) => {
                  const due = Math.max(0, inv.totalAmount - inv.paidAmount);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{inv.invoiceNumber}</div>
                        <div className="text-[11px] text-slate-400">{inv.createdAt}</div>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800">{inv.customerName}</td>
                      <td className="p-3.5 text-slate-600 max-w-xs truncate">
                        {inv.items.map((it) => it.description).join(", ")}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">₹{inv.totalAmount}</td>
                      <td className="p-3.5">
                        <div className="font-semibold">₹{inv.paidAmount}</div>
                        <div className="text-[11px] text-slate-400">{inv.paymentMethod}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          inv.status === "paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : inv.status === "partial"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {due > 0 && (
                            <button
                              onClick={() => collectInvoicePayment(inv.id, due, "UPI / Razorpay")}
                              className="px-2.5 py-1 rounded-lg bg-teal-600 text-white text-[11px] font-semibold hover:bg-teal-700"
                            >
                              Collect ₹{due}
                            </button>
                          )}
                          <button onClick={() => window.print()} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100" title="Print">
                            <Printer className="w-3.5 h-3.5 text-slate-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "memberships" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.memberships.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold">
                    {m.activeMembers} Active Members
                  </span>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{m.name}</div>
                  <div className="text-xs text-slate-500">{m.specialty} • {m.includedSessions} sessions / {m.durationMonths} mos</div>
                </div>
                <div className="text-xl font-bold text-teal-700">₹{m.price.toLocaleString()}</div>
                <ul className="space-y-1 text-xs text-slate-600">
                  {m.perks.map((pk) => (
                    <li key={pk} className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {pk}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {/* Assign Membership */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Enroll Patient in Membership</h3>
              <select value={memPatientId} onChange={(e) => setMemPatientId(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
                {state.patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.mrn})</option>)}
              </select>
              <select value={memPlanId} onChange={(e) => setMemPlanId(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
                {state.memberships.map((m) => <option key={m.id} value={m.id}>{m.name} — ₹{m.price}</option>)}
              </select>
              <button
                onClick={() => assignMembership(memPatientId, memPlanId)}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
              >
                Activate Membership
              </button>
            </div>

            {/* Discount Rules */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-teal-600" /> Discount Management
              </h3>
              {state.discounts.map((d) => (
                <div key={d.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{d.code} — {d.percent}% Off</div>
                    <div className="text-[11px] text-slate-500">{d.label} ({d.applicableTo})</div>
                  </div>
                  <button
                    onClick={() => toggleDiscount(d.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${d.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}
                  >
                    {d.active ? "Active" : "Paused"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "expenses" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <form onSubmit={handleAddExpense} className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 h-fit">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-rose-500" /> Log Clinic Expense
            </h3>
            <select value={expCat} onChange={(e) => setExpCat(e.target.value as ExpenseRecord["category"])} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
              <option value="Rent">Rent</option>
              <option value="Salaries">Salaries</option>
              <option value="Utilities">Utilities</option>
              <option value="Consumables">Consumables</option>
              <option value="Marketing">Marketing</option>
              <option value="Software">Software</option>
            </select>
            <input required value={expVendor} onChange={(e) => setExpVendor(e.target.value)} placeholder="Vendor / Payee" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
            <input value={expDesc} onChange={(e) => setExpDesc(e.target.value)} placeholder="Description" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
            <input type="number" value={expAmount} onChange={(e) => setExpAmount(Number(e.target.value))} placeholder="Amount ₹" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
            <button type="submit" className="w-full py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold">Record Expense</button>
          </form>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Expense Ledger</h3>
            {state.expenses.map((exp) => (
              <div key={exp.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{exp.vendor} <span className="ml-1.5 px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px]">{exp.category}</span></div>
                  <div className="text-[11px] text-slate-500">{exp.date} • {exp.description}</div>
                </div>
                <div className="text-sm font-bold text-rose-700">-₹{exp.amount.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {newInvOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4" onClick={() => setNewInvOpen(false)}>
          <form onSubmit={handleCreateInvoice} className="bg-white rounded-2xl p-5 w-full max-w-md space-y-3.5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-1.5"><Receipt className="w-4 h-4 text-teal-600" /> Generate Patient Invoice</h3>
              <button type="button" onClick={() => setNewInvOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <select value={invPatientId} onChange={(e) => setInvPatientId(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
              {state.patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.mrn})</option>)}
            </select>
            <input required value={invDesc} onChange={(e) => setInvDesc(e.target.value)} placeholder="Service / Procedure Description" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
            <input type="number" value={invPrice} onChange={(e) => setInvPrice(Number(e.target.value))} placeholder="Amount ₹" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
            <select value={invMethod} onChange={(e) => setInvMethod(e.target.value as Invoice["paymentMethod"])} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
              <option value="UPI / Razorpay">UPI / Razorpay</option>
              <option value="Card">Card</option>
              <option value="Cash">Cash</option>
              <option value="Wallet Credits">Wallet Credits</option>
              <option value="Pending">Mark Pending (Pay Later)</option>
            </select>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-teal-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5">
              <CreditCard className="w-4 h-4" /> Create Invoice
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
