import { PageId, UserRole } from "../types/clinic";

export interface FeatureTutorial {
  id: PageId;
  number: string;
  title: string;
  tagline: string;
  roles: string[];
  estimatedMin: string;
  whatItCovers: string[];
  steps: Array<{ title: string; detail: string }>;
  tryItLive: string;
}

export const FEATURE_TUTORIALS: FeatureTutorial[] = [
  {
    id: "dashboard",
    number: "01",
    title: "Command Center & Live KPIs",
    tagline: "Single-pane executive pulse across revenue, appointments, queue, and alerts.",
    roles: ["Clinic Owner", "Admin", "Front Desk"],
    estimatedMin: "2 min",
    whatItCovers: [
      "Collected Revenue vs. Pending Receivables & 7-day Expense chart",
      "Top Specialist Leaderboard across Kanpur & Lucknow branches",
      "Live Patient Flow queue with 1-click Consult jump into EMR",
      "Actionable Alerts: Low Stock, Expiring Memberships, Diet Expiries & Patient Birthdays",
    ],
    steps: [
      { title: "Filter by Branch", detail: "Use the top bar Branch selector (All Branches, KNP-01 Kanpur, or LKO-02 Lucknow) to scope metrics." },
      { title: "Jump straight into a Consultation", detail: "In the Live Patient Flow card on the right, click 'Consult' on any waiting patient to open their EMR 360." },
      { title: "Act on Alerts", detail: "Click 'Nudge' on expiring memberships or 'Send Wish' on today's birthdays to trigger instant WhatsApp actions." },
    ],
    tryItLive: "Click 'Consult' on Aarav Sharma (T-01) in Live Patient Flow to jump directly into his Patient 360 Healthboard.",
  },
  {
    id: "calendar",
    number: "02",
    title: "Unified Calendar & Video Telehealth",
    tagline: "Schedule In-Person, Video Telehealth & Home Visits with room blocking.",
    roles: ["Front Desk", "Doctor", "Admin"],
    estimatedMin: "3 min",
    whatItCovers: [
      "3 Consultation Modes: In-Person (with room/facility), Video Telehealth & Home Visit",
      "Specialist, Date & Mode filtering + Block Calendar for equipment/leave",
      "Built-in HD Video Telehealth Room with side-by-side EMR access",
      "1-click WhatsApp Appointment Reminder & Status Progression",
    ],
    steps: [
      { title: "Book or Block Slots", detail: "Click '+ Add Appointment' to book a new visit, or 'Block Calendar' to reserve a room or doctor break." },
      { title: "Inspect & Update Stage", detail: "Click any appointment card to open the right-side inspector and move status from Confirmed → Checked-In → Completed." },
      { title: "Launch Video Consult", detail: "For 'Video Telehealth' bookings (e.g., T-04 Ishita Banerjee), click 'Join Video' to launch the live telehealth room." },
    ],
    tryItLive: "Click 'Join Video' on a Video Telehealth slot, then click 'Open EMR & e-Rx' inside the video modal.",
  },
  {
    id: "queue",
    number: "03",
    title: "Front Desk Queue & Attendance",
    tagline: "Eliminate waiting-room bottlenecks with live token stages and staff shift logs.",
    roles: ["Front Desk", "Nurse", "Admin"],
    estimatedMin: "2 min",
    whatItCovers: [
      "4-stage Kanban flow: Scheduled → Waiting (Checked-In) → Vitals Done → In Consultation",
      "Automatic arrival timestamps and token numbers (T-01, T-02...)",
      "Staff Digital Check-In / Check-Out attendance board for payroll readiness",
    ],
    steps: [
      { title: "Check In Arriving Patients", detail: "Click 'Check In' on a scheduled patient to move them into the Waiting column with a timestamp." },
      { title: "Hand Off to Doctor", detail: "After recording vitals, click 'Mark Vitals Done' → 'Send to Doctor' or click the Play button to start EMR." },
      { title: "Track Staff Shifts", detail: "Switch to the 'Staff & Client Attendance' tab to toggle on-duty / off-duty status for doctors and staff." },
    ],
    tryItLive: "Advance Siddharth Malhotra (T-03) from 'Checked In' to 'Mark Vitals Done' and watch the Live Queue badge update.",
  },
  {
    id: "patients",
    number: "04",
    title: "Doctor Consultation, EMR 360 & Clinical AI Copilot",
    tagline: "Real-time meeting recording, Symptoms, On-Exam, Lab Investigations, e-Rx, AI Diagnosis & Hospitalization/Referral.",
    roles: ["Doctor", "Medical Director"],
    estimatedMin: "5 min",
    whatItCovers: [
      "Doctor-Only Clinical AI Copilot with Differential Diagnoses (ICD-10), Red-Flag Alerts & Allergy-Safe Prescribing",
      "Real-Time Consultation Recorder that listens/transcribes live meetings and extracts Symptoms, On-Exam & Lab needs automatically",
      "Structured entry for Symptoms, On-Examination (General/Resp/CVS/ENT), Lab Investigations, Medicines & Plan of Action",
      "Care Disposition: Outpatient Follow-Up, Inpatient Hospitalization Order (ICU/HDU/Ward), or Specialist Referral",
    ],
    steps: [
      { title: "Record Live Consultation Meeting", detail: "In 'Doctor Consultation & AI Copilot', click 'Start Live Recording' or run a 'Simulate' meeting to see symptoms, exam findings & labs populate in real time." },
      { title: "Use the Doctor AI Helping Hand", detail: "Review the right-side Doctor-Only CDSS panel for ranked differential diagnoses, allergy checks & hospitalization triggers, then click 'Apply to Chart'." },
      { title: "Save Consultation, Labs, Rx & Disposition", detail: "Choose Outpatient, Hospitalization Required, or Specialist Referral, then click 'Save Consultation...' to sync notes, lab orders & pharmacy Rx to the patient database." },
    ],
    tryItLive: "Run 'Simulate: HDU Triage' in the Consultation Recorder, click 'Apply to Chart', and save to see a Hospitalization disposition + auto-created Lab Orders!",
  },
  {
    id: "pharmacy",
    number: "05",
    title: "Pharmacy Dispensing & Quick Sale (POS)",
    tagline: "Fulfill doctor e-Prescriptions or run instant OTC retail billing with stock sync.",
    roles: ["Pharmacist", "Front Desk"],
    estimatedMin: "3 min",
    whatItCovers: [
      "Incoming e-Rx Queue directly from doctor consultations",
      "1-click 'Dispense & Bill' that deducts inventory and creates a paid invoice automatically",
      "Thermal label printing & Quick Sale (POS) cart for walk-in OTC customers",
      "Discount code application, 5% GST calculation & UPI/Card/Cash/Wallet payment modes",
    ],
    steps: [
      { title: "Dispense Pending e-Rx", detail: "In the 'e-Rx Queue' tab, choose payment mode and click 'Dispense & Bill' to fulfill and invoice in one click." },
      { title: "Run an OTC Quick Sale", detail: "Switch to 'Quick Sale (POS)', search/tap items to add to cart, optionally apply a discount code, and complete checkout." },
    ],
    tryItLive: "In 'e-Rx Queue', click 'Dispense & Bill' on Aarav Sharma's pending prescription to see stock & billing update automatically.",
  },
  {
    id: "inventory",
    number: "06",
    title: "Inventory, Purchase Orders & Vendors",
    tagline: "Batch & expiry control, low-stock alerts, branch transfers & PO receiving.",
    roles: ["Pharmacist", "Inventory Manager", "Owner"],
    estimatedMin: "3 min",
    whatItCovers: [
      "Real-time stock master with batch numbers, expiry dates & low-stock alerts",
      "Internal consumption (-1), quick restock (+10), and inter-branch stock transfers",
      "Vendor Master & Purchase Order (PO) creation with 1-click 'Receive Stock'",
      "One-click CSV export for audits and accounting",
    ],
    steps: [
      { title: "Spot Low Stock & Expiry", detail: "Red badges highlight items below reorder level; amber dates flag batches expiring within 35 days." },
      { title: "Issue & Receive a Purchase Order", detail: "Open 'Purchase Orders', issue a PO to a vendor, then click 'Receive Stock' to auto-increment inventory." },
    ],
    tryItLive: "Open 'Purchase Orders' and click 'Receive Stock' on PO-2026-084 to watch Augmentin & D3 stock jump immediately.",
  },
  {
    id: "billing",
    number: "07",
    title: "Billing, Memberships, Discounts & Expenses",
    tagline: "Unified invoicing, multi-session care packages, discounts & clinic P&L.",
    roles: ["Front Desk", "Accountant", "Owner"],
    estimatedMin: "3 min",
    whatItCovers: [
      "Invoices table across Paid, Partial & Pending statuses with 1-click payment collection",
      "Multi-session Membership & Package creation and patient enrollment",
      "Toggleable Discount Rules (MEMBER10, SENIOR15, CAMP20)",
      "Clinic Operating Expense ledger (Rent, Salaries, Utilities, Consumables)",
    ],
    steps: [
      { title: "Collect Pending Balances", detail: "Click 'Collect ₹...' on any pending or partial invoice to settle via UPI / Razorpay." },
      { title: "Enroll a Patient in a Membership", detail: "Switch to 'Memberships & Discounts', choose a patient and plan, and click 'Activate Membership'." },
      { title: "Log Clinic Expenses", detail: "Use 'Expenses & P&L' to record rent, payroll, or consumable payouts." },
    ],
    tryItLive: "Click 'Collect ₹1622' on Ishita Banerjee's pending invoice and verify Collected Revenue updates on the Dashboard.",
  },
  {
    id: "growth",
    number: "08",
    title: "CRM, Leads, Broadcasts & Branded Microsite",
    tagline: "Convert WhatsApp/Instagram leads into booked patients & run online booking.",
    roles: ["Marketing", "Front Desk", "Owner"],
    estimatedMin: "3 min",
    whatItCovers: [
      "Multi-source Leads Pipeline (WhatsApp Bot, Microsite, Instagram, Referral)",
      "1-click 'Convert & Book' turning a prospect into a registered patient + calendar slot",
      "WhatsApp Broadcast Campaigns & Health Camp Event Registrations",
      "Live Branded Clinic Microsite with public online booking",
    ],
    steps: [
      { title: "Convert a Lead", detail: "Click 'Convert & Book →' on Pranav Joshi in the Leads Pipeline to auto-create his MRN and appointment." },
      { title: "Test the Public Microsite", detail: "Open the 'Live Branded Microsite' tab and submit an online booking — it writes straight into your Clinic Calendar." },
    ],
    tryItLive: "Open 'Live Branded Microsite', book a slot for a new patient, and verify it appears in Calendar & Telehealth.",
  },
  {
    id: "voice-whatsapp",
    number: "09",
    title: "Voice AI Helpline, WhatsApp Flow & Reviews",
    tagline: "24/7 AI phone & WhatsApp receptionist trained on Dr. Kacker's Google Business profile.",
    roles: ["Front Desk", "Owner", "Patient Experience"],
    estimatedMin: "4 min",
    whatItCovers: [
      "Inbound Voice AI Line (096707 33339) trained on Dr. Kacker's Kanpur & Lucknow Google Business data",
      "Book, Reschedule, Cancel appointments & read Lab Report updates over live voice/text call",
      "WhatsApp Bot Flow for New Patient Registration, Slot Booking, Queries & Rating collection",
      "Unified Reviews & Feedback Workbench (Google Business + Portal) with Action-Required follow-up tickets",
    ],
    steps: [
      { title: "Simulate an Inbound Voice Call", detail: "Click 'Start Test Call', then tap 'Ask Address & Timings', 'Book Appointment', or 'Check My Lab Report'." },
      { title: "Run the WhatsApp Registration & Booking Flow", detail: "Switch to 'WhatsApp Bot Flow' to register a walk-in patient and confirm an appointment directly in chat." },
      { title: "Train & Resolve Reviews", detail: "Add custom Q&As in 'Google Business Training' and resolve flagged 3★ feedback in 'Reviews & Follow-Up'." },
    ],
    tryItLive: "In 'Voice AI Call Agent', click 'Start Test Call' → 'Book Appointment' and save a 5★ rating to see it enter Reviews & Follow-Up.",
  },
  {
    id: "ai-agents",
    number: "10",
    title: "Autonomous AI Agents Hub",
    tagline: "Dedicated workspace for MedQuery, MedDoc, VoiceCmd & NutriPlan agents.",
    roles: ["Doctor", "Nutritionist", "Front Desk"],
    estimatedMin: "3 min",
    whatItCovers: [
      "MedQuery Agent: 24/7 patient triage, lab prep & clinic FAQ assistant",
      "MedDoc Agent: Paste or analyze raw lab reports to extract abnormal biomarkers",
      "VoiceCmd Agent: Convert consultation transcripts into structured SOAP notes & save to EMR",
      "NutriPlan Agent: Generate pathology-aware regional meal plans & assign to Patient Healthboard",
    ],
    steps: [
      { title: "Test MedDoc Extractor", detail: "Select 'MedDoc Agent' and click 'Extract & Summarize Biomarkers' on the sample pathology report." },
      { title: "Push VoiceCmd SOAP to EMR", detail: "Select 'VoiceCmd Agent', parse the transcript, and click 'Save Directly to Patient EMR'." },
    ],
    tryItLive: "Open 'NutriPlan Agent', pick any patient and cuisine style, and click 'Generate & Assign to Patient Healthboard'.",
  },
  {
    id: "reports",
    number: "11",
    title: "Reports, Integrations, Forms & Audit",
    tagline: "Export CSVs, toggle WhatsApp/Razorpay/OMRON integrations, build forms & inspect HIPAA logs.",
    roles: ["Owner", "Admin", "Compliance"],
    estimatedMin: "3 min",
    whatItCovers: [
      "Financial & Appointment Analytics with 1-click CSV export",
      "Integrations Marketplace (WhatsApp, Razorpay, Stripe, Google Meet, OMRON, Apple Health, Zoho/Tally)",
      "Custom Digital Intake & Consent Form Builder",
      "Immutable HIPAA Audit Log & 'Reset Demo Data' button",
    ],
    steps: [
      { title: "Export Reports", detail: "Click 'Export Revenue CSV' to download a clean financial ledger of all clinic invoices." },
      { title: "Manage Integrations & Forms", detail: "Toggle any integration card or publish a new intake form in 'Custom Forms'." },
      { title: "Inspect Audit Trail", detail: "Every clinical note, Rx, invoice, and voice call is logged chronologically in 'Audit Log'." },
    ],
    tryItLive: "Open 'Audit Log' to see every action you just performed across the platform recorded with timestamps.",
  },
  {
    id: "patient-portal",
    number: "12",
    title: "Secured Patient Self-Service Portal",
    tagline: "What patients see: appointments, e-Rx, lab summaries, diet plans, bills & reviews.",
    roles: ["Patient", "Reviewer"],
    estimatedMin: "2 min",
    whatItCovers: [
      "Preview portal as any patient in the clinic using the top-right switcher",
      "View upcoming appointments, membership session balance & wallet credits",
      "Pay open invoices online, view lab summaries & download prescriptions",
      "Submit visit ratings & feedback directly to Portal and Google Business",
    ],
    steps: [
      { title: "Switch Patient Context", detail: "Use 'Preview as Patient' in the teal banner to inspect different patients (e.g., Aarav Sharma vs. Ishita Banerjee)." },
      { title: "Pay a Bill & Leave Feedback", detail: "Click 'Pay ₹...' on an open invoice or submit a rating at the bottom of the portal." },
    ],
    tryItLive: "Switch to 'Ishita Banerjee' in the top-right dropdown and pay her pending invoice online in 1 click!",
  },
];

export const ROLE_QUICK_PATHS: Record<
  UserRole,
  { title: string; subtitle: string; steps: Array<{ page: PageId; label: string; why: string }> }
> = {
  owner: {
    title: "Clinic Owner / Admin Quick Start",
    subtitle: "Monitor P&L, multi-branch operations, AI helpline, and HIPAA audit in 5 minutes.",
    steps: [
      { page: "dashboard", label: "Command Center KPIs", why: "Check daily revenue, waiting queue & expiry alerts" },
      { page: "voice-whatsapp", label: "Voice AI & Google Reviews", why: "Test helpline 096707 33339 & resolve flagged feedback" },
      { page: "billing", label: "Billing & Expenses", why: "Track collected payments, memberships & clinic P&L" },
      { page: "reports", label: "Reports & Audit Log", why: "Export CSVs & review HIPAA activity logs" },
    ],
  },
  doctor: {
    title: "Doctor / Specialist Quick Start",
    subtitle: "Streamline consultations with VoiceCmd AI, e-Rx, MedDoc labs & NutriPlan.",
    steps: [
      { page: "calendar", label: "Today's Schedule & Video", why: "View OPD slots & launch video consultations" },
      { page: "patients", label: "EMR 360 Healthboard", why: "Review vitals, dictate SOAP/Ayurveda notes & send e-Rx" },
      { page: "ai-agents", label: "AI Agents Hub", why: "Summarize lab reports with MedDoc & build NutriPlan diets" },
      { page: "patient-portal", label: "Patient View Check", why: "Verify what prescriptions & plans patients receive" },
    ],
  },
  reception: {
    title: "Front Desk / Reception Quick Start",
    subtitle: "Manage bookings, waiting-room tokens, lead conversions & bill collection.",
    steps: [
      { page: "queue", label: "Waiting Room Queue", why: "Check in arriving patients & track staff attendance" },
      { page: "calendar", label: "Appointments & Blocking", why: "Book In-Person/Video/Home slots & send WhatsApp reminders" },
      { page: "growth", label: "CRM Leads & Microsite", why: "Convert WhatsApp/Instagram leads into patients in 1 click" },
      { page: "billing", label: "Collect Payments", why: "Settle open consultation & lab invoices via UPI/Card/Cash" },
    ],
  },
  pharmacist: {
    title: "Pharmacist & Inventory Quick Start",
    subtitle: "Dispense doctor e-Prescriptions, run OTC POS & manage vendor Purchase Orders.",
    steps: [
      { page: "pharmacy", label: "Dispense e-Rx Queue", why: "Fulfill doctor prescriptions & auto-generate invoices" },
      { page: "pharmacy", label: "Quick Sale (POS)", why: "Checkout walk-in OTC items with discounts & GST" },
      { page: "inventory", label: "Stock & Expiry Master", why: "Monitor low-stock warnings & batch expiry dates" },
      { page: "inventory", label: "Purchase Orders", why: "Issue vendor POs and receive stock in 1 click" },
    ],
  },
  patient: {
    title: "Patient Self-Service Quick Start",
    subtitle: "Book slots via WhatsApp/Microsite, view care plans & pay bills online.",
    steps: [
      { page: "patient-portal", label: "My Health Portal", why: "Check appointments, prescriptions, labs & diet plans" },
      { page: "growth", label: "Online Booking Microsite", why: "Self-book In-Person, Video or Home Visits" },
      { page: "voice-whatsapp", label: "WhatsApp & Voice AI", why: "Register, ask clinic queries or submit a review" },
    ],
  },
};
