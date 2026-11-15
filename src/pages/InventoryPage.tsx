import React, { useState } from "react";
import { AlertTriangle, ArrowLeftRight, CheckCircle2, Download, Minus, Package, Plus, Search, Truck, X } from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { InventoryItem } from "../types/clinic";

export const InventoryPage: React.FC = () => {
  const { state, adjustInventory, addInventoryItem, createPurchaseOrder, receivePurchaseOrder, notify } = useClinic();
  const [tab, setTab] = useState<"stock" | "po" | "vendors">("stock");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [addOpen, setAddOpen] = useState(false);

  // Add Item Form
  const [name, setName] = useState("");
  const [sku, setSku] = useState("MED-990");
  const [cat, setCat] = useState<InventoryItem["category"]>("Medicine");
  const [stock, setStock] = useState(50);
  const [price, setPrice] = useState(45);

  // PO Form
  const [poVendorId, setPoVendorId] = useState(state.vendors[0]?.id || "");
  const [poItemId, setPoItemId] = useState(state.inventory[2]?.id || state.inventory[0]?.id || "");
  const [poQty, setPoQty] = useState(50);

  const filtered = state.inventory.filter((i) => {
    if (state.activeBranchId !== "all" && i.branchId !== state.activeBranchId) return false;
    if (catFilter !== "All" && i.category !== catFilter) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !i.sku.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const exportCsv = () => {
    const header = "SKU,Name,Category,Batch,Expiry,Stock,ReorderLevel,SellingPrice\n";
    const rows = filtered.map((i) => `${i.sku},"${i.name}",${i.category},${i.batchNumber},${i.expiryDate},${i.stock},${i.reorderLevel},${i.sellingPrice}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cliniflow-inventory.csv";
    a.click();
    URL.revokeObjectURL(url);
    notify("Inventory CSV exported");
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addInventoryItem({
      sku,
      name,
      category: cat,
      batchNumber: "B26-NEW",
      expiryDate: "2027-08-30",
      branchId: state.activeBranchId === "all" ? "br-1" : state.activeBranchId,
      stock,
      reorderLevel: 15,
      unit: "Units",
      costPrice: Math.round(price * 0.65),
      sellingPrice: price,
      vendorId: state.vendors[0]?.id || "ven-1",
    });
    setAddOpen(false);
    setName("");
  };

  const handleCreatePo = (e: React.FormEvent) => {
    e.preventDefault();
    const item = state.inventory.find((i) => i.id === poItemId);
    if (!item) return;
    createPurchaseOrder({
      vendorId: poVendorId,
      branchId: item.branchId,
      expectedDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
      items: [{ inventoryItemId: item.id, itemName: item.name, quantity: poQty, unitCost: item.costPrice }],
      totalAmount: Math.round(poQty * item.costPrice),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Inventory, Purchase Orders & Vendors</h1>
          <p className="text-xs text-slate-500 mt-0.5">Batch-wise stock control, expiry alerts, branch transfers & vendor procurement</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold">
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl w-fit">
        {[
          { id: "stock", label: `Stock Master (${filtered.length})` },
          { id: "po", label: `Purchase Orders (${state.purchaseOrders.length})` },
          { id: "vendors", label: `Vendors (${state.vendors.length})` },
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

      {tab === "stock" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter by SKU or item name..." className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50" />
            </div>
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white">
              <option value="All">All Categories</option>
              <option value="Medicine">Medicine</option>
              <option value="Ayurvedic Formulation">Ayurvedic Formulation</option>
              <option value="Supplement">Supplement</option>
              <option value="Skincare">Skincare</option>
              <option value="Consumable">Consumable</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-[11px] text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">Item & SKU</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Batch / Expiry</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Price</th>
                  <th className="p-3 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => {
                  const isLow = item.stock <= item.reorderLevel;
                  const daysToExp = (new Date(item.expiryDate).getTime() - Date.now()) / 86400000;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[11px] text-slate-400">{item.sku}</div>
                      </td>
                      <td className="p-3 text-slate-600">{item.category}</td>
                      <td className="p-3">
                        <div className="font-medium">{item.batchNumber}</div>
                        <div className={`text-[11px] ${daysToExp <= 35 ? "text-amber-700 font-bold" : "text-slate-400"}`}>
                          Exp: {item.expiryDate}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          isLow ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {isLow && <AlertTriangle className="w-3 h-3" />}
                          {item.stock} {item.unit}
                        </span>
                      </td>
                      <td className="p-3 font-semibold">₹{item.sellingPrice}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => adjustInventory(item.id, -1, "Internal Clinic Consumption")}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100"
                            title="Consume 1 unit"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => adjustInventory(item.id, 10, "Quick Restock +10")}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100"
                            title="Add 10 units"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => adjustInventory(item.id, -5, "Transferred 5 units to Branch 2")}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold hover:bg-slate-100"
                          >
                            <ArrowLeftRight className="w-3 h-3" /> Transfer
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

      {tab === "po" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <form onSubmit={handleCreatePo} className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 h-fit">
            <h3 className="text-sm font-bold text-slate-900">Create Purchase Order</h3>
            <select value={poVendorId} onChange={(e) => setPoVendorId(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
              {state.vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <select value={poItemId} onChange={(e) => setPoItemId(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
              {state.inventory.map((i) => <option key={i.id} value={i.id}>{i.name} (Cur: {i.stock})</option>)}
            </select>
            <input type="number" min={1} value={poQty} onChange={(e) => setPoQty(Number(e.target.value))} placeholder="Order Quantity" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
            <button type="submit" className="w-full py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold">Issue Purchase Order</button>
          </form>

          <div className="lg:col-span-2 space-y-3">
            {state.purchaseOrders.map((po) => {
              const vendor = state.vendors.find((v) => v.id === po.vendorId);
              return (
                <div key={po.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{po.poNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        po.status === "received" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                      }`}>{po.status}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{vendor?.name} • Expected {po.expectedDate} • ₹{po.totalAmount}</div>
                    <div className="text-[11px] text-slate-600 mt-1">
                      {po.items.map((it) => `${it.itemName} (x${it.quantity})`).join(", ")}
                    </div>
                  </div>
                  {po.status === "ordered" && (
                    <button
                      onClick={() => receivePurchaseOrder(po.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Receive Stock
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "vendors" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {state.vendors.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <div className="text-sm font-bold text-slate-900">{v.name}</div>
              <div className="text-xs text-teal-700 font-semibold">{v.category}</div>
              <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                <div>Contact: {v.contactPerson}</div>
                <div>{v.phone} • {v.email}</div>
                <div className="text-[11px] text-slate-400">GSTIN: {v.gstNumber}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4" onClick={() => setAddOpen(false)}>
          <form onSubmit={handleAddSubmit} className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-3 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-1.5"><Package className="w-4 h-4 text-teal-600" /> Add Inventory Item</h3>
              <button type="button" onClick={() => setAddOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Product / Medicine Name" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
            <div className="grid grid-cols-2 gap-2">
              <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" className="px-3 py-2 text-xs border border-slate-200 rounded-xl" />
              <select value={cat} onChange={(e) => setCat(e.target.value as InventoryItem["category"])} className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
                <option value="Medicine">Medicine</option>
                <option value="Ayurvedic Formulation">Ayurveda</option>
                <option value="Supplement">Supplement</option>
                <option value="Skincare">Skincare</option>
                <option value="Consumable">Consumable</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} placeholder="Initial Stock" className="px-3 py-2 text-xs border border-slate-200 rounded-xl" />
              <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="MRP ₹" className="px-3 py-2 text-xs border border-slate-200 rounded-xl" />
            </div>
            <button type="submit" className="w-full py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold">Save Item</button>
          </form>
        </div>
      )}
    </div>
  );
};
