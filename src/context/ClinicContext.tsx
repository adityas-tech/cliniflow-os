import React, { createContext, useContext, useEffect, useState } from "react";
import { SEED_STATE, TODAY_STR } from "../data/seedData";
import {
  Appointment,
  AppointmentMode,
  AppointmentStatus,
  AuditLogEntry,
  BroadcastCampaign,
  ClinicalNote,
  ClinicState,
  CustomFormTemplate,
  DietPlan,
  ExpenseRecord,
  InventoryItem,
  Invoice,
  InvoiceLineItem,
  LabOrder,
  Lead,
  PageId,
  Patient,
  Prescription,
  PurchaseOrder,
  UserRole,
  VitalRecord,
  WorkoutPlan,
} from "../types/clinic";

const STORAGE_KEY = "cliniflow_os_state_v1";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: "success" | "info" | "warning";
}

interface ClinicContextValue {
  state: ClinicState;
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  selectedPatientId: string;
  setSelectedPatientId: (id: string) => void;
  toasts: ToastItem[];
  notify: (title: string, description?: string, type?: ToastItem["type"]) => void;
  dismissToast: (id: string) => void;

  setRole: (role: UserRole) => void;
  setBranch: (branchId: string) => void;
  setPortalPatient: (patientId: string) => void;

  startConsultation: (patientId: string, appointmentId?: string) => void;
  addAppointment: (apt: Omit<Appointment, "id" | "tokenNumber">) => Appointment;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  sendAppointmentReminder: (id: string) => void;

  addPatient: (patient: Omit<Patient, "id" | "mrn" | "vitals" | "communicationLog" | "submittedForms" | "walletCredits" | "lastVisit">) => Patient;
  addVitalRecord: (patientId: string, vital: Omit<VitalRecord, "id">) => void;
  syncWearable: (patientId: string) => void;

  addClinicalNote: (note: Omit<ClinicalNote, "id" | "createdAt">) => void;
  addPrescription: (rx: Omit<Prescription, "id" | "createdAt" | "status">) => Prescription;
  dispensePrescription: (rxId: string, paymentMethod: Invoice["paymentMethod"]) => void;

  addLabOrder: (order: Omit<LabOrder, "id" | "orderedAt" | "status">) => void;
  updateLabOrderStatus: (id: string, status: LabOrder["status"], aiSummary?: string) => void;

  addDietPlan: (plan: Omit<DietPlan, "id" | "createdAt">) => void;
  addWorkoutPlan: (plan: Omit<WorkoutPlan, "id">) => void;

  createQuickSaleInvoice: (params: {
    patientId?: string;
    customerName: string;
    items: Array<{ inventoryItemId?: string; type: InvoiceLineItem["type"]; description: string; qty: number; unitPrice: number }>;
    discountLabel?: string;
    discountPercent?: number;
    paymentMethod: Invoice["paymentMethod"];
    markPaid?: boolean;
  }) => Invoice;
  collectInvoicePayment: (invoiceId: string, amount: number, method: Invoice["paymentMethod"]) => void;
  addExpense: (exp: Omit<ExpenseRecord, "id">) => void;
  assignMembership: (patientId: string, membershipId: string) => void;
  toggleDiscount: (discountId: string) => void;

  adjustInventory: (itemId: string, delta: number, reason: string) => void;
  addInventoryItem: (item: Omit<InventoryItem, "id">) => void;
  createPurchaseOrder: (po: Omit<PurchaseOrder, "id" | "poNumber" | "createdAt" | "status">) => void;
  receivePurchaseOrder: (poId: string) => void;

  addLead: (lead: Omit<Lead, "id" | "createdAt">) => void;
  updateLeadStage: (leadId: string, stage: Lead["stage"]) => void;
  convertLeadToPatient: (leadId: string, bookDoctorId?: string, mode?: AppointmentMode) => Patient | null;
  sendCampaign: (campaign: Omit<BroadcastCampaign, "id" | "sentAt" | "openRate">) => void;
  moderateReview: (reviewId: string, status: "approved" | "hidden") => void;
  registerEventAttendee: (eventId: string) => void;

  toggleIntegration: (integrationId: string) => void;
  addFormTemplate: (form: Omit<CustomFormTemplate, "id" | "submissionsCount">) => void;
  toggleStaffStatus: (staffId: string) => void;
  resetDemoData: () => void;
}

const ClinicContext = createContext<ClinicContextValue | null>(null);

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ClinicState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved) as ClinicState;
    } catch {
      // ignore parse errors
    }
    return SEED_STATE;
  });

  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const [selectedPatientId, setSelectedPatientId] = useState<string>(SEED_STATE.patients[0].id);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage quota errors
    }
  }, [state]);

  const notify = (title: string, description?: string, type: ToastItem["type"] = "success") => {
    const id = uid("toast");
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const dismissToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const appendAudit = (prev: ClinicState, module: string, action: string, details: string): AuditLogEntry[] => [
    {
      id: uid("aud"),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      actor: prev.activeRole === "owner" ? "Clinic Admin" : prev.activeRole.toUpperCase(),
      role: prev.activeRole,
      module,
      action,
      details,
    },
    ...prev.auditLogs.slice(0, 49),
  ];

  const setRole = (activeRole: UserRole) => {
    setState((prev) => ({ ...prev, activeRole }));
    if (activeRole === "patient") {
      setActivePage("patient-portal");
    } else if (activePage === "patient-portal") {
      setActivePage("dashboard");
    }
    notify(`Switched workspace view to ${activeRole.toUpperCase()}`, undefined, "info");
  };

  const setBranch = (activeBranchId: string) => {
    setState((prev) => ({ ...prev, activeBranchId }));
  };

  const setPortalPatient = (activePortalPatientId: string) => {
    setState((prev) => ({ ...prev, activePortalPatientId }));
  };

  const startConsultation = (patientId: string, appointmentId?: string) => {
    setSelectedPatientId(patientId);
    if (appointmentId) {
      setState((prev) => ({
        ...prev,
        appointments: prev.appointments.map((a) =>
          a.id === appointmentId ? { ...a, status: "in-consultation" } : a
        ),
        auditLogs: appendAudit(prev, "Consultation", "Started Consultation", `Opened Healthboard for appointment ${appointmentId}`),
      }));
    }
    setActivePage("patients");
  };

  const addAppointment: ClinicContextValue["addAppointment"] = (apt) => {
    const nextToken = `T-${String(state.appointments.length + 1).padStart(2, "0")}`;
    const created: Appointment = {
      ...apt,
      id: uid("apt"),
      tokenNumber: apt.isBlockedSlot ? "BLK" : nextToken,
    };
    setState((prev) => {
      const patient = prev.patients.find((p) => p.id === apt.patientId);
      const doc = prev.staff.find((d) => d.id === apt.doctorId);
      return {
        ...prev,
        appointments: [created, ...prev.appointments],
        auditLogs: appendAudit(
          prev,
          "Calendar",
          apt.isBlockedSlot ? "Blocked Calendar Slot" : "Appointment Booked",
          apt.isBlockedSlot
            ? `Blocked ${apt.startTime} for ${doc?.name || "Doctor"}`
            : `${patient?.name || "Walk-in"} with ${doc?.name || "Doctor"} at ${apt.startTime} (${apt.mode})`
        ),
      };
    });
    notify(apt.isBlockedSlot ? "Calendar slot blocked" : `Appointment ${created.tokenNumber} booked`);
    return created;
  };

  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    setState((prev) => {
      const target = prev.appointments.find((a) => a.id === id);
      const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return {
        ...prev,
        appointments: prev.appointments.map((a) =>
          a.id === id
            ? {
                ...a,
                status,
                checkedInAt: status === "checked-in" && !a.checkedInAt ? nowStr : a.checkedInAt,
              }
            : a
        ),
        auditLogs: appendAudit(
          prev,
          "Appointments",
          `Status -> ${status}`,
          `Updated token ${target?.tokenNumber || id} to ${status}`
        ),
      };
    });
    notify(`Appointment updated to ${status.replace("-", " ")}`, undefined, "info");
  };

  const sendAppointmentReminder = (id: string) => {
    setState((prev) => {
      const apt = prev.appointments.find((a) => a.id === id);
      const doc = prev.staff.find((d) => d.id === apt?.doctorId);
      return {
        ...prev,
        appointments: prev.appointments.map((a) => (a.id === id ? { ...a, reminderSent: true } : a)),
        patients: prev.patients.map((p) =>
          p.id === apt?.patientId
            ? {
                ...p,
                communicationLog: [
                  {
                    id: uid("comm"),
                    channel: "WhatsApp",
                    message: `Reminder: Your ${apt.mode} consultation with ${doc?.name || "Doctor"} is scheduled at ${apt.startTime} on ${apt.date}.`,
                    sentAt: "Just now",
                    status: "delivered",
                  },
                  ...p.communicationLog,
                ],
              }
            : p
        ),
      };
    });
    notify("WhatsApp reminder sent to patient");
  };

  const addPatient: ClinicContextValue["addPatient"] = (p) => {
    const newPatient: Patient = {
      ...p,
      id: uid("pat"),
      mrn: `CF-${10430 + state.patients.length}`,
      vitals: [],
      communicationLog: [],
      submittedForms: [],
      walletCredits: 200,
      lastVisit: TODAY_STR,
    };
    setState((prev) => ({
      ...prev,
      patients: [newPatient, ...prev.patients],
      auditLogs: appendAudit(prev, "Patients", "Registered Patient", `Created MRN ${newPatient.mrn} for ${newPatient.name}`),
    }));
    notify(`Patient ${newPatient.name} (${newPatient.mrn}) added`);
    return newPatient;
  };

  const addVitalRecord = (patientId: string, vital: Omit<VitalRecord, "id">) => {
    const rec: VitalRecord = { ...vital, id: uid("vit") };
    setState((prev) => ({
      ...prev,
      patients: prev.patients.map((p) =>
        p.id === patientId ? { ...p, vitals: [...p.vitals, rec] } : p
      ),
      auditLogs: appendAudit(prev, "EMR Vitals", "Recorded Vitals", `BP ${vital.bpSystolic}/${vital.bpDiastolic}, HR ${vital.heartRate} bpm`),
    }));
    notify("Vitals saved to Healthboard");
  };

  const syncWearable = (patientId: string) => {
    setState((prev) => ({
      ...prev,
      patients: prev.patients.map((p) => {
        if (p.id !== patientId) return p;
        const steps = (p.wearable?.dailySteps || 6200) + Math.floor(Math.random() * 900 + 200);
        const hr = Math.max(60, Math.min(84, (p.wearable?.restingHr || 72) + Math.floor(Math.random() * 5 - 2)));
        return {
          ...p,
          wearable: {
            provider: p.wearable?.provider || "Apple Health",
            lastSynced: "Just now",
            dailySteps: steps,
            avgSleepHours: p.wearable?.avgSleepHours || 7.1,
            restingHr: hr,
            lastBp: p.wearable?.lastBp || "122/78 mmHg",
          },
        };
      }),
    }));
    notify("Wearable telemetry synced", "Updated steps, sleep & resting HR");
  };

  const addClinicalNote = (note: Omit<ClinicalNote, "id" | "createdAt">) => {
    const rec: ClinicalNote = {
      ...note,
      id: uid("cn"),
      createdAt: `${TODAY_STR} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
    };
    setState((prev) => ({
      ...prev,
      clinicalNotes: [rec, ...prev.clinicalNotes],
      auditLogs: appendAudit(prev, "EMR Notes", `Added ${note.templateType} Note`, note.chiefComplaint),
    }));
    notify("Clinical note signed & saved");
  };

  const addPrescription: ClinicContextValue["addPrescription"] = (rx) => {
    const rec: Prescription = {
      ...rx,
      id: uid("rx"),
      createdAt: `${TODAY_STR} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      status: "pending-dispense",
    };
    setState((prev) => ({
      ...prev,
      prescriptions: [rec, ...prev.prescriptions],
      patients: prev.patients.map((p) =>
        p.id === rx.patientId && rx.sentViaWhatsApp
          ? {
              ...p,
              communicationLog: [
                {
                  id: uid("comm"),
                  channel: "WhatsApp",
                  message: `Digital e-Prescription (${rx.items.length} medicines) shared for ${rx.diagnosis}.`,
                  sentAt: "Just now",
                  status: "delivered",
                },
                ...p.communicationLog,
              ],
            }
          : p
      ),
      auditLogs: appendAudit(prev, "e-Prescription", "Issued Prescription", `${rx.items.length} items queued for pharmacy`),
    }));
    notify("e-Prescription sent to Pharmacy queue");
    return rec;
  };

  const dispensePrescription = (rxId: string, paymentMethod: Invoice["paymentMethod"]) => {
    setState((prev) => {
      const rx = prev.prescriptions.find((r) => r.id === rxId);
      if (!rx || rx.status === "dispensed") return prev;
      const patient = prev.patients.find((p) => p.id === rx.patientId);

      // Deduct inventory
      const nextInventory = prev.inventory.map((inv) => {
        const match = rx.items.find((it) => it.inventoryItemId === inv.id || it.medicineName.toLowerCase().includes(inv.name.toLowerCase().slice(0, 8)));
        if (!match) return inv;
        return { ...inv, stock: Math.max(0, inv.stock - match.quantity) };
      });

      const lineItems: InvoiceLineItem[] = rx.items.map((it) => {
        const inv = prev.inventory.find((i) => i.id === it.inventoryItemId);
        return {
          id: uid("il"),
          type: "Pharmacy",
          description: `${it.medicineName} (${it.dosage}, ${it.frequency})`,
          qty: it.quantity,
          unitPrice: inv ? inv.sellingPrice : 25,
        };
      });

      const subtotal = lineItems.reduce((s, x) => s + x.qty * x.unitPrice, 0);
      const discountPercent = patient?.membershipId ? 10 : 0;
      const discountAmount = Math.round((subtotal * discountPercent) / 100);
      const taxAmount = Math.round(((subtotal - discountAmount) * 5) / 100);
      const totalAmount = subtotal - discountAmount + taxAmount;

      const invoice: Invoice = {
        id: uid("inv"),
        invoiceNumber: `INV-2026-${1044 + prev.invoices.length}`,
        patientId: rx.patientId,
        customerName: patient?.name || "Patient",
        branchId: patient?.branchId || "br-1",
        createdAt: `${TODAY_STR} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        items: lineItems,
        subtotal,
        discountLabel: discountPercent ? "Membership 10%" : undefined,
        discountAmount,
        taxAmount,
        totalAmount,
        paidAmount: paymentMethod === "Pending" ? 0 : totalAmount,
        paymentMethod,
        status: paymentMethod === "Pending" ? "pending" : "paid",
      };

      return {
        ...prev,
        inventory: nextInventory,
        prescriptions: prev.prescriptions.map((r) =>
          r.id === rxId ? { ...r, status: "dispensed", dispensedAt: "Just now" } : r
        ),
        invoices: [invoice, ...prev.invoices],
        auditLogs: appendAudit(prev, "Pharmacy", "Dispensed Rx", `Dispensed Rx ${rxId}, generated ${invoice.invoiceNumber} (₹${totalAmount})`),
      };
    });
    notify("Prescription dispensed, stock updated & invoice created");
  };

  const addLabOrder = (order: Omit<LabOrder, "id" | "orderedAt" | "status">) => {
    const rec: LabOrder = {
      ...order,
      id: uid("lab"),
      orderedAt: TODAY_STR,
      status: "ordered",
    };
    setState((prev) => ({
      ...prev,
      labOrders: [rec, ...prev.labOrders],
      auditLogs: appendAudit(prev, "Lab Orders", "Ordered Lab Test", `${order.testName} (${order.priority})`),
    }));
    notify(`Lab order created: ${order.testName}`);
  };

  const updateLabOrderStatus = (id: string, status: LabOrder["status"], aiSummary?: string) => {
    setState((prev) => ({
      ...prev,
      labOrders: prev.labOrders.map((l) => {
        if (l.id !== id) return l;
        const sampleBiomarkers =
          status === "report-ready" && !l.biomarkers
            ? [
                { name: "TSH", value: "5.2", unit: "mIU/L", reference: "0.4 - 4.0", flag: "high" as const },
                { name: "Free T4", value: "1.1", unit: "ng/dL", reference: "0.8 - 1.8", flag: "normal" as const },
              ]
            : l.biomarkers;
        return {
          ...l,
          status,
          biomarkers: sampleBiomarkers,
          resultsSummary: status === "report-ready" && !l.resultsSummary ? "Mildly elevated TSH suggesting subclinical hypothyroidism." : l.resultsSummary,
          aiSummary: aiSummary ?? l.aiSummary,
        };
      }),
    }));
    notify(`Lab order marked ${status.replace("-", " ")}`, undefined, "info");
  };

  const addDietPlan = (plan: Omit<DietPlan, "id" | "createdAt">) => {
    const rec: DietPlan = { ...plan, id: uid("dp"), createdAt: TODAY_STR };
    setState((prev) => ({
      ...prev,
      dietPlans: [rec, ...prev.dietPlans],
      auditLogs: appendAudit(prev, "Nutrition", "Created Diet Plan", plan.title),
    }));
    notify("Personalized diet plan assigned to patient");
  };

  const addWorkoutPlan = (plan: Omit<WorkoutPlan, "id">) => {
    const rec: WorkoutPlan = { ...plan, id: uid("wp") };
    setState((prev) => ({
      ...prev,
      workoutPlans: [rec, ...prev.workoutPlans],
      auditLogs: appendAudit(prev, "Rehab", "Created Workout Plan", plan.title),
    }));
    notify("Workout plan assigned to patient");
  };

  const createQuickSaleInvoice: ClinicContextValue["createQuickSaleInvoice"] = ({
    patientId,
    customerName,
    items,
    discountLabel,
    discountPercent = 0,
    paymentMethod,
    markPaid = true,
  }) => {
    const lineItems: InvoiceLineItem[] = items.map((it) => ({
      id: uid("il"),
      type: it.type,
      description: it.description,
      qty: it.qty,
      unitPrice: it.unitPrice,
    }));
    const subtotal = lineItems.reduce((s, x) => s + x.qty * x.unitPrice, 0);
    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const taxAmount = Math.round(((subtotal - discountAmount) * 5) / 100);
    const totalAmount = subtotal - discountAmount + taxAmount;

    const invoice: Invoice = {
      id: uid("inv"),
      invoiceNumber: `INV-2026-${1044 + state.invoices.length}`,
      patientId,
      customerName,
      branchId: state.activeBranchId === "all" ? "br-1" : state.activeBranchId,
      createdAt: `${TODAY_STR} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      items: lineItems,
      subtotal,
      discountLabel,
      discountAmount,
      taxAmount,
      totalAmount,
      paidAmount: markPaid && paymentMethod !== "Pending" ? totalAmount : 0,
      paymentMethod: markPaid ? paymentMethod : "Pending",
      status: markPaid && paymentMethod !== "Pending" ? "paid" : "pending",
    };

    setState((prev) => {
      const nextInventory = prev.inventory.map((inv) => {
        const bought = items.find((i) => i.inventoryItemId === inv.id);
        return bought ? { ...inv, stock: Math.max(0, inv.stock - bought.qty) } : inv;
      });
      return {
        ...prev,
        inventory: nextInventory,
        invoices: [invoice, ...prev.invoices],
        auditLogs: appendAudit(prev, "POS & Billing", "Generated Invoice", `${invoice.invoiceNumber} for ${customerName} — ₹${totalAmount}`),
      };
    });
    notify(`Invoice ${invoice.invoiceNumber} created (₹${totalAmount})`);
    return invoice;
  };

  const collectInvoicePayment = (invoiceId: string, amount: number, method: Invoice["paymentMethod"]) => {
    setState((prev) => ({
      ...prev,
      invoices: prev.invoices.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        const paidAmount = Math.min(inv.totalAmount, inv.paidAmount + amount);
        return {
          ...inv,
          paidAmount,
          paymentMethod: method,
          status: paidAmount >= inv.totalAmount ? "paid" : "partial",
        };
      }),
      auditLogs: appendAudit(prev, "Billing", "Collected Payment", `₹${amount} via ${method} for invoice ${invoiceId}`),
    }));
    notify(`Payment of ₹${amount} recorded`);
  };

  const addExpense = (exp: Omit<ExpenseRecord, "id">) => {
    setState((prev) => ({
      ...prev,
      expenses: [{ ...exp, id: uid("exp") }, ...prev.expenses],
      auditLogs: appendAudit(prev, "Expenses", "Logged Expense", `${exp.category}: ₹${exp.amount} (${exp.vendor})`),
    }));
    notify("Clinic expense logged");
  };

  const assignMembership = (patientId: string, membershipId: string) => {
    const plan = state.memberships.find((m) => m.id === membershipId);
    if (!plan) return;
    const expDate = new Date();
    expDate.setMonth(expDate.getMonth() + plan.durationMonths);
    setState((prev) => ({
      ...prev,
      patients: prev.patients.map((p) =>
        p.id === patientId
          ? {
              ...p,
              membershipId: plan.id,
              membershipSessionsLeft: plan.includedSessions,
              membershipExpiresAt: expDate.toISOString().slice(0, 10),
            }
          : p
      ),
      memberships: prev.memberships.map((m) =>
        m.id === membershipId ? { ...m, activeMembers: m.activeMembers + 1 } : m
      ),
      auditLogs: appendAudit(prev, "Memberships", "Assigned Plan", `${plan.name} assigned to patient ${patientId}`),
    }));
    notify(`Membership "${plan.name}" activated`);
  };

  const toggleDiscount = (discountId: string) => {
    setState((prev) => ({
      ...prev,
      discounts: prev.discounts.map((d) => (d.id === discountId ? { ...d, active: !d.active } : d)),
    }));
  };

  const adjustInventory = (itemId: string, delta: number, reason: string) => {
    setState((prev) => {
      const target = prev.inventory.find((i) => i.id === itemId);
      return {
        ...prev,
        inventory: prev.inventory.map((i) =>
          i.id === itemId ? { ...i, stock: Math.max(0, i.stock + delta) } : i
        ),
        auditLogs: appendAudit(
          prev,
          "Inventory",
          delta >= 0 ? "Stock Added" : "Stock Consumed",
          `${target?.name || itemId}: ${delta >= 0 ? "+" : ""}${delta} (${reason})`
        ),
      };
    });
    notify(`Stock updated (${reason})`, undefined, "info");
  };

  const addInventoryItem = (item: Omit<InventoryItem, "id">) => {
    setState((prev) => ({
      ...prev,
      inventory: [{ ...item, id: uid("inv") }, ...prev.inventory],
    }));
    notify(`Added ${item.name} to inventory`);
  };

  const createPurchaseOrder = (po: Omit<PurchaseOrder, "id" | "poNumber" | "createdAt" | "status">) => {
    const newPo: PurchaseOrder = {
      ...po,
      id: uid("po"),
      poNumber: `PO-2026-0${85 + state.purchaseOrders.length}`,
      createdAt: TODAY_STR,
      status: "ordered",
    };
    setState((prev) => ({
      ...prev,
      purchaseOrders: [newPo, ...prev.purchaseOrders],
      auditLogs: appendAudit(prev, "Purchase Order", "Created PO", `${newPo.poNumber} worth ₹${newPo.totalAmount}`),
    }));
    notify(`Purchase Order ${newPo.poNumber} issued`);
  };

  const receivePurchaseOrder = (poId: string) => {
    setState((prev) => {
      const po = prev.purchaseOrders.find((p) => p.id === poId);
      if (!po || po.status === "received") return prev;
      const nextInventory = prev.inventory.map((inv) => {
        const line = po.items.find((i) => i.inventoryItemId === inv.id);
        return line ? { ...inv, stock: inv.stock + line.quantity } : inv;
      });
      return {
        ...prev,
        inventory: nextInventory,
        purchaseOrders: prev.purchaseOrders.map((p) => (p.id === poId ? { ...p, status: "received" } : p)),
        auditLogs: appendAudit(prev, "Inventory", "Received PO", `Stock incremented from ${po.poNumber}`),
      };
    });
    notify("PO received and stock levels updated");
  };

  const addLead = (lead: Omit<Lead, "id" | "createdAt">) => {
    setState((prev) => ({
      ...prev,
      leads: [{ ...lead, id: uid("lead"), createdAt: "Just now" }, ...prev.leads],
    }));
    notify(`Lead ${lead.name} added to pipeline`);
  };

  const updateLeadStage = (leadId: string, stage: Lead["stage"]) => {
    setState((prev) => ({
      ...prev,
      leads: prev.leads.map((l) => (l.id === leadId ? { ...l, stage } : l)),
    }));
  };

  const convertLeadToPatient = (leadId: string, bookDoctorId?: string, mode: AppointmentMode = "in-person") => {
    const lead = state.leads.find((l) => l.id === leadId);
    if (!lead) return null;

    const newPatient: Patient = {
      id: uid("pat"),
      mrn: `CF-${10430 + state.patients.length}`,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      dob: "1992-01-01",
      age: 34,
      gender: "Other",
      bloodGroup: "Unknown",
      branchId: "br-1",
      specialtyTag: "General Medicine",
      allergies: ["Pending Intake"],
      chronicConditions: [],
      walletCredits: 250,
      vitals: [],
      lastVisit: TODAY_STR,
      communicationLog: [
        { id: uid("c"), channel: "WhatsApp", message: `Welcome to CliniFlow, ${lead.name}! Your patient profile (${`CF-${10430 + state.patients.length}`}) is ready.`, sentAt: "Just now", status: "delivered" },
      ],
      submittedForms: [],
    };

    const newApt: Appointment | null = bookDoctorId
      ? {
          id: uid("apt"),
          tokenNumber: `T-${String(state.appointments.length + 1).padStart(2, "0")}`,
          patientId: newPatient.id,
          doctorId: bookDoctorId,
          branchId: "br-1",
          date: TODAY_STR,
          startTime: "15:30",
          durationMin: 30,
          mode,
          reason: lead.interest,
          status: "confirmed",
          reminderSent: true,
          source: "Online Microsite",
        }
      : null;

    setState((prev) => ({
      ...prev,
      patients: [newPatient, ...prev.patients],
      appointments: newApt ? [newApt, ...prev.appointments] : prev.appointments,
      leads: prev.leads.map((l) =>
        l.id === leadId ? { ...l, stage: "Converted", convertedPatientId: newPatient.id } : l
      ),
      auditLogs: appendAudit(prev, "CRM Leads", "Converted Lead", `Converted ${lead.name} -> MRN ${newPatient.mrn}`),
    }));
    notify(`Converted ${lead.name} to Patient ${newPatient.mrn}${newApt ? " & booked appointment" : ""}`);
    return newPatient;
  };

  const sendCampaign = (campaign: Omit<BroadcastCampaign, "id" | "sentAt" | "openRate">) => {
    setState((prev) => ({
      ...prev,
      campaigns: [
        { ...campaign, id: uid("cmp"), sentAt: "Just now", openRate: "91%" },
        ...prev.campaigns,
      ],
      auditLogs: appendAudit(prev, "Marketing", "Sent Broadcast", `${campaign.channel} campaign "${campaign.title}" to ${campaign.sentCount} patients`),
    }));
    notify(`${campaign.channel} broadcast queued to ${campaign.sentCount} recipients`);
  };

  const moderateReview = (reviewId: string, status: "approved" | "hidden") => {
    setState((prev) => ({
      ...prev,
      reviews: prev.reviews.map((r) => (r.id === reviewId ? { ...r, status } : r)),
    }));
    notify(`Review ${status}`, undefined, "info");
  };

  const registerEventAttendee = (eventId: string) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.map((e) =>
        e.id === eventId && e.registeredCount < e.capacity
          ? { ...e, registeredCount: e.registeredCount + 1 }
          : e
      ),
    }));
    notify("Participant registered for health event");
  };

  const toggleIntegration = (integrationId: string) => {
    setState((prev) => ({
      ...prev,
      integrations: prev.integrations.map((intg) =>
        intg.id === integrationId
          ? { ...intg, connected: !intg.connected, lastSynced: !intg.connected ? "Just now" : undefined }
          : intg
      ),
    }));
  };

  const addFormTemplate = (form: Omit<CustomFormTemplate, "id" | "submissionsCount">) => {
    setState((prev) => ({
      ...prev,
      forms: [{ ...form, id: uid("frm"), submissionsCount: 0 }, ...prev.forms],
    }));
    notify(`Form template "${form.title}" published`);
  };

  const toggleStaffStatus = (staffId: string) => {
    setState((prev) => ({
      ...prev,
      staff: prev.staff.map((s) => {
        if (s.id !== staffId) return s;
        const nextStatus = s.status === "off-duty" ? "on-duty" : "off-duty";
        return {
          ...s,
          status: nextStatus,
          checkedInAt: nextStatus === "on-duty" ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : s.checkedInAt,
        };
      }),
    }));
    notify("Staff attendance status updated", undefined, "info");
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(SEED_STATE);
    setSelectedPatientId(SEED_STATE.patients[0].id);
    notify("Clinic workspace reset to default demo state", undefined, "info");
  };

  return (
    <ClinicContext.Provider
      value={{
        state,
        activePage,
        setActivePage,
        selectedPatientId,
        setSelectedPatientId,
        toasts,
        notify,
        dismissToast,
        setRole,
        setBranch,
        setPortalPatient,
        startConsultation,
        addAppointment,
        updateAppointmentStatus,
        sendAppointmentReminder,
        addPatient,
        addVitalRecord,
        syncWearable,
        addClinicalNote,
        addPrescription,
        dispensePrescription,
        addLabOrder,
        updateLabOrderStatus,
        addDietPlan,
        addWorkoutPlan,
        createQuickSaleInvoice,
        collectInvoicePayment,
        addExpense,
        assignMembership,
        toggleDiscount,
        adjustInventory,
        addInventoryItem,
        createPurchaseOrder,
        receivePurchaseOrder,
        addLead,
        updateLeadStage,
        convertLeadToPatient,
        sendCampaign,
        moderateReview,
        registerEventAttendee,
        toggleIntegration,
        addFormTemplate,
        toggleStaffStatus,
        resetDemoData,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error("useClinic must be used within ClinicProvider");
  return ctx;
};
