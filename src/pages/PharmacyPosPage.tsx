import React, { useState } from "react";
import { CheckCircle2, CreditCard, Minus, Pill, Plus, Printer, Search, ShoppingBag, Tag, Trash2 } from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { Invoice } from "../types/clinic";

export const PharmacyPosPage: React.FC = () => {
  const { state, dispensePrescription, createQuickSaleInvoice, notify } = useClinic();
  const [tab, setTab] = useState<"rx" | "pos">("rx");
  const [payMethod, setPayMethod] = useState<Invoice["paymentMethod"]>("UPI / Razorpay");

  // Quick Sale POS State
  const [posSearch, setPosSearch] = useState("");
  const [posPatientId, setPosPatientId] = useState<string>("walk-in");
  const [posDiscountId, setPosDiscountId] = useState<string>("none");
  const [cart, setCart] = useState<Array<{ inventoryItemId: string; name: string; unitPrice: number; qty: number; maxStock: number }>>([]);
  const [lastReceipt, setLastReceipt] = useState<Invoice | null>(null);

  const pendingRxs = state.prescriptions.filter((r) => r.status === "pending-dispense");
  const completedRxs = state.prescriptions.filter((r) => r.status === "dispensed");

  const filteredStock = state.inventory.filter(
    (i) => i.stock > 0 && (i.name.toLowerCase().includes(posSearch.toLowerCase()) || i.sku.toLowerCase().includes(posSearch.toLowerCase()))
  );

  const addToCart = (itemId: string) => {
    const item = state.inventory.find((i) => i.id === itemId);
    if (!item || item.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.inventoryItemId === itemId);
      if (existing) {
        return prev.map((c) => (c.inventoryItemId === itemId ? { ...c, qty: Math.min(c.maxStock, c.qty + 1) } : c));
      }
      return [...prev, { inventoryItemId: item.id, name: item.name, unitPrice: item.sellingPrice, qty: 1, maxStock: item.stock }];
    });
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.inventoryItemId === id ? { ...c, qty: Math.min(c.maxStock, c.qty + delta) } : c))
        .filter((c) => c.qty > 0)
    );
  };

  const subtotal = cart.reduce((s, c) => s + c.qty * c.unitPrice, 0);
  const discObj = state.discounts.find((d) => d.id === posDiscountId && d.active);
  const discAmt = discObj ? Math.round((subtotal * discObj.percent) / 100) : 0;
  const taxAmt = Math.round(((subtotal - discAmt) * 5) / 100);
  const totalAmt = subtotal - discAmt + taxAmt;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const pat = state.patients.find((p) => p.id === posPatientId);
    const inv = createQuickSaleInvoice({
      patientId: pat?.id,
      customerName: pat ? pat.name : "Walk-in OTC Customer",
      items: cart.map((c) => ({
        inventoryItemId: c.inventoryItemId,
        type: "OTC",
        description: c.name,
        qty: c.qty,
        unitPrice: c.unitPrice,
      })),
      discountLabel: discObj?.label,
      discountPercent: discObj?.percent || 0,
      paymentMethod: payMethod,
      markPaid: true,
    });
    setLastReceipt(inv);
    setCart([]);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Pharmacy Dispensing & Quick Sale (POS)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Instant e-Rx fulfillment, label printing, OTC walk-in billing & live inventory stock deduction
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl w-fit">
          <button
            onClick={() => setTab("rx")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === "rx" ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            e-Rx Queue ({pendingRxs.length})
          </button>
          <button
            onClick={() => setTab("pos")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === "pos" ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Quick Sale (POS)
          </button>
        </div>
      </div>

      {tab === "rx" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Pending Dispensing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Pending Doctor Prescriptions ({pendingRxs.length})</h2>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as Invoice["paymentMethod"])}
                className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1 bg-white"
              >
                <option value="UPI / Razorpay">Pay via UPI / Razorpay</option>
                <option value="Card">Pay via Card</option>
                <option value="Cash">Pay via Cash</option>
                <option value="Wallet Credits">Pay via Wallet Credits</option>
              </select>
            </div>

            {pendingRxs.map((rx) => {
              const pat = state.patients.find((p) => p.id === rx.patientId);
              const doc = state.staff.find((d) => d.id === rx.doctorId);
              return (
                <div key={rx.id} className="bg-white rounded-2xl border border-amber-200 p-4 space-y-3 shadow-2xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{pat?.name} ({pat?.mrn})</div>
                      <div className="text-[11px] text-slate-500">Prescribed by {doc?.name} • {rx.createdAt}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">Ready to Dispense</span>
                  </div>

                  <div className="space-y-1.5">
                    {rx.items.map((it) => {
                      const inv = state.inventory.find((i) => i.id === it.inventoryItemId);
                      return (
                        <div key={it.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-semibold text-slate-900">{it.medicineName}</div>
                            <div className="text-[11px] text-slate-500">{it.frequency} • {it.timing} • {it.durationDays} days</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-slate-900">Qty: {it.quantity}</div>
                            <div className="text-[10px] text-emerald-700">Stock: {inv ? inv.stock : "Available"}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => notify("Dosage labels sent to thermal label printer", undefined, "info")}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Labels
                    </button>
                    <button
                      onClick={() => dispensePrescription(rx.id, payMethod)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Dispense & Bill ({payMethod})
                    </button>
                  </div>
                </div>
              );
            })}

            {pendingRxs.length === 0 && (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-400">
                All doctor prescriptions have been dispensed! Issue a new e-Rx from EMR to see it here.
              </div>
            )}
          </div>

          {/* Dispensed History */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 h-fit">
            <h2 className="text-sm font-bold text-slate-900">Recently Dispensed ({completedRxs.length})</h2>
            {completedRxs.map((rx) => {
              const pat = state.patients.find((p) => p.id === rx.patientId);
              return (
                <div key={rx.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{pat?.name} — {rx.diagnosis}</div>
                    <div className="text-[11px] text-slate-500">{rx.items.length} items • Dispensed {rx.dispensedAt}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">Dispensed</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Catalog */}
          <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-4 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                value={posSearch}
                onChange={(e) => setPosSearch(e.target.value)}
                placeholder="Scan barcode or search medicine / skincare / supplement..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[500px] overflow-y-auto">
              {filteredStock.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item.id)}
                  className="text-left p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 transition flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{item.name}</div>
                    <div className="text-[11px] text-slate-500">{item.sku} • {item.stock} {item.unit} left</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-teal-700">₹{item.sellingPrice}</div>
                    <span className="text-[10px] text-slate-400">+ Add</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* POS Cart */}
          <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Quick Sale Cart</h2>
                <span className="text-xs text-slate-500">{cart.reduce((s, c) => s + c.qty, 0)} items</span>
              </div>

              <select
                value={posPatientId}
                onChange={(e) => setPosPatientId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50"
              >
                <option value="walk-in">Walk-in OTC Customer (No Registration)</option>
                {state.patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.mrn})</option>
                ))}
              </select>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {cart.map((c) => (
                  <div key={c.inventoryItemId} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-slate-900 truncate">{c.name}</div>
                      <div className="text-[11px] text-slate-500">₹{c.unitPrice} / unit</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => updateCartQty(c.inventoryItemId, -1)} className="p-1 rounded bg-white border border-slate-200">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold w-5 text-center">{c.qty}</span>
                      <button onClick={() => updateCartQty(c.inventoryItemId, 1)} className="p-1 rounded bg-white border border-slate-200">
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="font-bold w-14 text-right">₹{(c.qty * c.unitPrice).toFixed(0)}</span>
                      <button onClick={() => updateCartQty(c.inventoryItemId, -c.qty)} className="text-rose-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && <div className="text-xs text-slate-400 text-center py-8">Click items on the left to add to POS cart</div>}
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={posDiscountId}
                  onChange={(e) => setPosDiscountId(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="none">No Discount</option>
                  {state.discounts.filter((d) => d.active).map((d) => (
                    <option key={d.id} value={d.id}>{d.label} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
                {discAmt > 0 && <div className="flex justify-between text-emerald-700"><span>Discount</span><span>-₹{discAmt}</span></div>}
                <div className="flex justify-between text-slate-500"><span>GST (5%)</span><span>₹{taxAmt}</span></div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-100">
                  <span>Total Payable</span><span>₹{totalAmt}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {(["UPI / Razorpay", "Card", "Cash"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setPayMethod(m)}
                    className={`py-1.5 rounded-lg text-[11px] font-semibold border ${
                      payMethod === m ? "bg-teal-50 border-teal-500 text-teal-800" : "border-slate-200 text-slate-600"
                    }`}
                  >
                    {m.split(" ")[0]}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full py-2.5 rounded-xl bg-teal-600 disabled:opacity-40 hover:bg-teal-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" /> Complete Sale & Sync Stock
              </button>

              {lastReceipt && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-emerald-900">Receipt {lastReceipt.invoiceNumber} Paid</div>
                    <div className="text-[11px] text-emerald-700">₹{lastReceipt.totalAmount} via {lastReceipt.paymentMethod}</div>
                  </div>
                  <button onClick={() => window.print()} className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-800 font-semibold">
                    Print
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
