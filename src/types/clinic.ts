export type UserRole = "owner" | "doctor" | "reception" | "pharmacist" | "patient";

export type AppointmentMode = "in-person" | "online" | "home-visit";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "checked-in"
  | "vitals-done"
  | "in-consultation"
  | "completed"
  | "cancelled"
  | "no-show";

export type ClinicSpecialty =
  | "Pulmonology & Sleep"
  | "ENT & Head-Neck"
  | "Chest & Allergy"
  | "General Medicine"
  | "Dermatology"
  | "Physiotherapy"
  | "Ayurveda"
  | "Pediatrics"
  | "Diabetes & Nutrition"
  | "Orthopedics"
  | "Gynecology"
  | "Ophthalmology"
  | "Dentistry";

export type PageId =
  | "dashboard"
  | "calendar"
  | "queue"
  | "patients"
  | "pharmacy"
  | "inventory"
  | "billing"
  | "growth"
  | "voice-whatsapp"
  | "ai-agents"
  | "reports"
  | "patient-portal"
  | "tutorials";

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  facilities: string[];
}

export interface StaffMember {
  id: string;
  name: string;
  role: "doctor" | "reception" | "pharmacist" | "nurse" | "admin";
  specialty?: ClinicSpecialty;
  branchId: string;
  avatarColor: string;
  consultationFee: number;
  status: "on-duty" | "in-session" | "on-break" | "off-duty";
  checkedInAt?: string;
  workingHours: string;
  rating: number;
}

export interface VitalRecord {
  id: string;
  recordedAt: string;
  bpSystolic: number;
  bpDiastolic: number;
  heartRate: number;
  temperatureF: number;
  spo2: number;
  weightKg: number;
  heightCm: number;
  bloodGlucoseMgDl?: number;
  source?: "clinic" | "OMRON" | "Apple Health" | "Google Fit";
}

export interface WearableSnapshot {
  provider: "Apple Health" | "Google Fit" | "OMRON" | "Samsung Health";
  lastSynced: string;
  dailySteps: number;
  avgSleepHours: number;
  restingHr: number;
  lastBp?: string;
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  createdAt: string;
  templateType: "SOAP" | "Ayurveda Prakriti" | "Physiotherapy ROM" | "Dermatology";
  chiefComplaint: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  icdCode?: string;
  ayurvedaDosha?: {
    prakriti: string;
    vikriti: string;
    agni: string;
    nadi: string;
  };
  aiGenerated?: boolean;
}

export interface PrescriptionItem {
  id: string;
  inventoryItemId?: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  timing: "After Food" | "Before Food" | "Empty Stomach" | "Bedtime";
  durationDays: number;
  quantity: number;
  instructions?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  createdAt: string;
  diagnosis: string;
  items: PrescriptionItem[];
  notes?: string;
  status: "pending-dispense" | "dispensed" | "cancelled";
  dispensedAt?: string;
  sentViaWhatsApp?: boolean;
}

export interface LabOrder {
  id: string;
  patientId: string;
  doctorId: string;
  testName: string;
  category: string;
  orderedAt: string;
  status: "ordered" | "sample-collected" | "processing" | "report-ready";
  priority: "routine" | "urgent";
  cost: number;
  resultsSummary?: string;
  biomarkers?: Array<{
    name: string;
    value: string;
    unit: string;
    reference: string;
    flag: "normal" | "high" | "low";
  }>;
  aiSummary?: string;
}

export interface DietPlan {
  id: string;
  patientId: string;
  title: string;
  goal: string;
  caloriesTarget: number;
  expiresAt: string;
  createdAt: string;
  aiGenerated?: boolean;
  meals: Array<{
    slot: "Early Morning" | "Breakfast" | "Mid-Morning" | "Lunch" | "Evening Snack" | "Dinner";
    items: string;
    calories: number;
    macros: string;
  }>;
  restrictions: string[];
}

export interface WorkoutPlan {
  id: string;
  patientId: string;
  title: string;
  goal: string;
  expiresAt: string;
  exercises: Array<{
    name: string;
    setsReps: string;
    frequency: string;
    notes: string;
  }>;
}

export interface Patient {
  id: string;
  mrn: string;
  name: string;
  phone: string;
  email: string;
  dob: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  bloodGroup: string;
  branchId: string;
  specialtyTag: ClinicSpecialty;
  allergies: string[];
  chronicConditions: string[];
  membershipId?: string;
  membershipSessionsLeft?: number;
  membershipExpiresAt?: string;
  walletCredits: number;
  vitals: VitalRecord[];
  wearable?: WearableSnapshot;
  lastVisit: string;
  isBirthdayToday?: boolean;
  communicationLog: Array<{
    id: string;
    channel: "WhatsApp" | "SMS" | "Email" | "Portal";
    message: string;
    sentAt: string;
    status: "delivered" | "read" | "sent";
  }>;
  submittedForms: Array<{
    id: string;
    formTitle: string;
    submittedAt: string;
    answers: Record<string, string>;
  }>;
}

export interface Appointment {
  id: string;
  tokenNumber: string;
  patientId: string;
  doctorId: string;
  branchId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationMin: number;
  mode: AppointmentMode;
  facility?: string;
  reason: string;
  status: AppointmentStatus;
  checkedInAt?: string;
  reminderSent: boolean;
  isBlockedSlot?: boolean;
  source: "Front Desk" | "Online Microsite" | "WhatsApp AI" | "Voice AI Call" | "Follow-up";
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: "Medicine" | "Consumable" | "Ayurvedic Formulation" | "Supplement" | "Skincare";
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  branchId: string;
  stock: number;
  reorderLevel: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  vendorId: string;
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstNumber: string;
  category: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  branchId: string;
  createdAt: string;
  expectedDate: string;
  status: "ordered" | "received" | "cancelled";
  items: Array<{
    inventoryItemId: string;
    itemName: string;
    quantity: number;
    unitCost: number;
  }>;
  totalAmount: number;
}

export interface InvoiceLineItem {
  id: string;
  type: "Consultation" | "Procedure" | "Pharmacy" | "Lab" | "Membership" | "OTC";
  description: string;
  qty: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId?: string;
  customerName: string;
  branchId: string;
  createdAt: string;
  items: InvoiceLineItem[];
  subtotal: number;
  discountLabel?: string;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: "UPI / Razorpay" | "Card" | "Cash" | "Wallet Credits" | "Stripe" | "Pending";
  status: "paid" | "partial" | "pending";
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category: "Rent" | "Salaries" | "Utilities" | "Consumables" | "Marketing" | "Software";
  vendor: string;
  description: string;
  amount: number;
  branchId: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  specialty: string;
  price: number;
  durationMonths: number;
  includedSessions: number;
  discountPercent: number;
  perks: string[];
  activeMembers: number;
}

export interface DiscountRule {
  id: string;
  code: string;
  label: string;
  percent: number;
  applicableTo: "All" | "Members" | "Senior Citizens" | "Health Camp";
  active: boolean;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: "WhatsApp Bot" | "Clinic Microsite" | "Instagram Ad" | "Google Search" | "Walk-in / Referral";
  interest: string;
  stage: "New" | "Contacted" | "Appointment Booked" | "Converted";
  createdAt: string;
  notes: string;
  convertedPatientId?: string;
}

export interface ClinicEvent {
  id: string;
  title: string;
  type: "Health Camp" | "Webinar" | "Awareness Workshop";
  date: string;
  time: string;
  location: string;
  capacity: number;
  registeredCount: number;
  status: "Upcoming" | "Live" | "Completed";
}

export interface PatientReview {
  id: string;
  patientName: string;
  doctorName: string;
  rating: number;
  comment: string;
  createdAt: string;
  channel: "Google Business" | "WhatsApp" | "Voice AI" | "Patient Portal";
  status: "pending" | "approved" | "hidden" | "action-required" | "resolved";
  actionNote?: string;
  assignedTo?: string;
  syncedToGoogle?: boolean;
}

export interface GoogleBusinessKnowledge {
  clinicName: string;
  googleShareUrl: string;
  phone: string;
  address: string;
  secondaryLocation: string;
  timings: string;
  googleRating: number;
  googleReviewCount: number;
  doctorsSummary: Array<{
    name: string;
    role: string;
    expertise: string;
    fee: number;
  }>;
  servicesFaq: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
}

export interface VoiceCallLog {
  id: string;
  callerPhone: string;
  callerName: string;
  timestamp: string;
  durationSec: number;
  intent: "Book Appointment" | "Reschedule" | "Cancel" | "Report Update" | "Clinic Query" | "Feedback";
  outcome: string;
  ratingCollected?: number;
  transcript: Array<{ speaker: "AI Agent" | "Caller"; text: string }>;
}

export interface BroadcastCampaign {
  id: string;
  title: string;
  channel: "WhatsApp" | "SMS" | "Email";
  audience: string;
  message: string;
  sentCount: number;
  openRate: string;
  sentAt: string;
}

export interface CustomFormTemplate {
  id: string;
  title: string;
  category: "Intake" | "Consent" | "Assessment" | "Feedback";
  fields: Array<{ id: string; label: string; type: "text" | "yesno" | "scale" | "date" }>;
  submissionsCount: number;
}

export interface IntegrationConfig {
  id: string;
  name: string;
  category: "Payments" | "Messaging" | "Telehealth" | "Wearables" | "Accounting" | "Analytics";
  description: string;
  connected: boolean;
  lastSynced?: string;
  badgeColor: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  module: string;
  action: string;
  details: string;
}

export interface ClinicState {
  branches: Branch[];
  activeBranchId: string;
  activeRole: UserRole;
  activePortalPatientId: string;
  staff: StaffMember[];
  patients: Patient[];
  appointments: Appointment[];
  clinicalNotes: ClinicalNote[];
  prescriptions: Prescription[];
  labOrders: LabOrder[];
  dietPlans: DietPlan[];
  workoutPlans: WorkoutPlan[];
  inventory: InventoryItem[];
  vendors: Vendor[];
  purchaseOrders: PurchaseOrder[];
  invoices: Invoice[];
  expenses: ExpenseRecord[];
  memberships: MembershipPlan[];
  discounts: DiscountRule[];
  leads: Lead[];
  events: ClinicEvent[];
  reviews: PatientReview[];
  campaigns: BroadcastCampaign[];
  forms: CustomFormTemplate[];
  integrations: IntegrationConfig[];
  auditLogs: AuditLogEntry[];
  googleBusiness: GoogleBusinessKnowledge;
  voiceCallLogs: VoiceCallLog[];
}
