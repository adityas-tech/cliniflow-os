import { ConsultationDisposition, DifferentialDiagnosis, Patient, VitalRecord } from "../types/clinic";

export interface ClinicalCopilotOutput {
  redFlags: string[];
  differentials: DifferentialDiagnosis[];
  recommendedExamChecks: string[];
  recommendedInvestigations: string[];
  suggestedMedicines: Array<{ name: string; dosage: string; rationale: string; allergyWarning?: string }>;
  recommendedPlanOfAction: string;
  dispositionAdvice: ConsultationDisposition;
  dispositionRationale: string;
}

export const INVESTIGATION_CATALOG = [
  { name: "Polysomnography (Overnight Sleep Study)", cat: "Sleep Lab", cost: 4500 },
  { name: "Pulmonary Function Test (PFT / Spirometry)", cat: "Pulmonology", cost: 900 },
  { name: "Comprehensive Allergy Skin Prick / IgE Panel", cat: "Allergy", cost: 2800 },
  { name: "Chest X-Ray (PA View)", cat: "Radiology", cost: 550 },
  { name: "HRCT Thorax (High-Res Chest CT)", cat: "Radiology", cost: 3800 },
  { name: "Arterial Blood Gas (ABG)", cat: "Critical Care", cost: 1100 },
  { name: "Complete Blood Count (CBC) + CRP + ESR", cat: "Hematology", cost: 650 },
  { name: "Comprehensive Metabolic & HbA1c Panel", cat: "Biochemistry", cost: 1250 },
  { name: "12-Lead ECG + Troponin-I", cat: "Cardiology", cost: 950 },
  { name: "Diagnostic Nasal / ENT Endoscopy", cat: "ENT", cost: 1500 },
  { name: "Thyroid Profile (T3, T4, TSH)", cat: "Endocrinology", cost: 750 },
  { name: "Lipid Profile (Fasting)", cat: "Cardiology", cost: 650 },
];

export const COMMON_SYMPTOMS_CHIPS = [
  "Chronic Cough (> 2 wks)",
  "Shortness of Breath / Dyspnea",
  "Loud Snoring & Witnessed Apnea",
  "Daytime Somnolence / Fatigue",
  "Wheezing / Chest Tightness",
  "High Fever & Chills",
  "Nasal Blockage / Sinus Pressure",
  "Sore Throat / Hoarseness",
  "Chest Pain / Palpitations",
  "Morning Hyperglycemia",
  "Dizziness / Headache",
];

export function analyzeClinicalCase(params: {
  symptoms: string[];
  examText: string;
  chiefComplaint: string;
  patient?: Patient;
  vitals?: VitalRecord;
}): ClinicalCopilotOutput {
  const combined = `${params.chiefComplaint} ${params.symptoms.join(" ")} ${params.examText}`.toLowerCase();
  const allergies = (params.patient?.allergies || []).map((a) => a.toLowerCase());
  const hasAllergy = (kw: string) => allergies.some((a) => a.includes(kw));

  const redFlags: string[] = [];
  const differentials: DifferentialDiagnosis[] = [];
  const examChecks = new Set<string>(["Pulse oximetry (SpO2) at rest & exertion", "Auscultate bilateral lung fields & heart sounds"]);
  const investigations = new Set<string>();
  const meds: ClinicalCopilotOutput["suggestedMedicines"] = [];

  let disposition: ConsultationDisposition = "Outpatient Follow-Up";
  let dispositionRationale = "Hemodynamically stable with normal oxygenation; safe for structured outpatient management.";

  // Vital-based Red Flags
  if (params.vitals) {
    if (params.vitals.spo2 > 0 && params.vitals.spo2 < 92) {
      redFlags.push(`Hypoxemia Alert: SpO2 is ${params.vitals.spo2}% (< 92%). Immediate supplemental O2 & inpatient/HDU evaluation warranted.`);
      disposition = "Hospitalization Required";
      dispositionRationale = `Resting SpO2 ${params.vitals.spo2}% indicates acute respiratory compromise requiring monitored O2 therapy and ABG.`;
      investigations.add("Arterial Blood Gas (ABG)");
      investigations.add("Chest X-Ray (PA View)");
    }
    if (params.vitals.bpSystolic >= 170 || params.vitals.bpDiastolic >= 110) {
      redFlags.push(`Severe Hypertension (${params.vitals.bpSystolic}/${params.vitals.bpDiastolic} mmHg): Evaluate for target-organ damage / hypertensive urgency.`);
      investigations.add("12-Lead ECG + Troponin-I");
    }
    if (params.vitals.temperatureF >= 101.5) {
      redFlags.push(`High-Grade Pyrexia (${params.vitals.temperatureF}°F): Screen for lower respiratory tract infection or systemic sepsis.`);
      investigations.add("Complete Blood Count (CBC) + CRP + ESR");
    }
    if (params.vitals.bloodGlucoseMgDl && params.vitals.bloodGlucoseMgDl >= 250) {
      redFlags.push(`Marked Hyperglycemia (${params.vitals.bloodGlucoseMgDl} mg/dL): Check urine/blood ketones & hydration status.`);
    }
  }

  // Pattern 1: Snoring / Sleep Apnea / Daytime Fatigue
  if (combined.includes("snor") || combined.includes("apnea") || combined.includes("sleep") || combined.includes("somnolence")) {
    differentials.push({
      condition: "Obstructive Sleep Apnea (OSA)",
      icdCode: "G47.33",
      likelihood: "High",
      rationale: "Loud snoring, witnessed apneas, or daytime fatigue with elevated neck circumference / Mallampati score.",
    });
    examChecks.add("Measure neck circumference, BMI & Mallampati airway grade");
    examChecks.add("Check STOP-BANG sleep apnea screening score");
    investigations.add("Polysomnography (Overnight Sleep Study)");
    investigations.add("Diagnostic Nasal / ENT Endoscopy");
    investigations.add("Thyroid Profile (T3, T4, TSH)");
    meds.push({
      name: "Fluticasone / Azelastine Nasal Spray",
      dosage: "2 sprays each nostril HS",
      rationale: "Reduces nasal mucosal congestion contributing to upper airway resistance.",
    });
  }

  // Pattern 2: Asthma / COPD / Wheezing / Chronic Cough / Dyspnea
  if (
    combined.includes("cough") ||
    combined.includes("wheez") ||
    combined.includes("dyspnea") ||
    combined.includes("breath") ||
    combined.includes("asthma") ||
    combined.includes("copd") ||
    combined.includes("chest tightness")
  ) {
    const isSevere = combined.includes("severe") || combined.includes("accessory") || combined.includes("silent chest") || (params.vitals?.spo2 || 99) < 92;
    differentials.push({
      condition: combined.includes("copd") || (params.patient?.age || 35) > 50 ? "COPD / Chronic Bronchitis Exacerbation" : "Bronchial Asthma / Reactive Airway Disease",
      icdCode: "J45.909",
      likelihood: "High",
      rationale: "Expiratory wheeze, chronic cough, or dyspnea triggered by allergens/infection.",
    });
    examChecks.add("Assess peak expiratory flow rate (PEFR) & accessory muscle use");
    investigations.add("Pulmonary Function Test (PFT / Spirometry)");
    investigations.add("Chest X-Ray (PA View)");
    investigations.add("Comprehensive Allergy Skin Prick / IgE Panel");

    meds.push({
      name: "Budesonide + Formoterol MDI/DPI (200/6 mcg)",
      dosage: "2 puffs BD + SOS",
      rationale: "MART anti-inflammatory reliever + controller therapy per GINA guidelines.",
    });
    meds.push({
      name: "Montelukast + Levocetirizine (10/5 mg)",
      dosage: "1 tab OD at bedtime",
      rationale: "Controls leukotriene-mediated nocturnal cough and allergic airway inflammation.",
    });

    if (isSevere) {
      disposition = "Hospitalization Required";
      dispositionRationale = "Severe dyspnea / hypoxemia or refractory bronchospasm warrants nebulized bronchodilators, IV steroids & HDU monitoring.";
      redFlags.push("Acute Respiratory Distress Risk: Prioritize nebulized Salbutamol + Ipratropium, systemic corticosteroids & O2 titration.");
    }
  }

  // Pattern 3: Fever + Productive Cough / Crackles -> Pneumonia / LRTI
  if (combined.includes("fever") || combined.includes("chills") || combined.includes("crackles") || combined.includes("crepitation") || combined.includes("pneumonia")) {
    differentials.push({
      condition: "Community-Acquired Pneumonia / Acute LRTI",
      icdCode: "J18.9",
      likelihood: "Moderate",
      rationale: "Fever with respiratory symptoms or focal crackles on chest auscultation.",
    });
    investigations.add("Chest X-Ray (PA View)");
    investigations.add("Complete Blood Count (CBC) + CRP + ESR");
    examChecks.add("Calculate CURB-65 pneumonia severity score (Confusion, Urea, RR >=30, BP, Age >=65)");

    const penicillinAllergic = hasAllergy("penicillin") || hasAllergy("amoxicillin");
    meds.push({
      name: penicillinAllergic ? "Azithromycin 500mg / Levofloxacin 750mg" : "Augmentin 625 Duo (Amoxicillin-Clavulanate)",
      dosage: penicillinAllergic ? "1 tab OD x 5 days" : "1 tab TDS x 5-7 days",
      rationale: penicillinAllergic
        ? "Macrolide/fluoroquinolone alternative selected due to documented Penicillin allergy."
        : "First-line empiric coverage for respiratory bacterial pathogens.",
      allergyWarning: penicillinAllergic ? "Penicillin allergy detected in patient chart — avoided Beta-Lactam!" : undefined,
    });
  }

  // Pattern 4: ENT / Sinusitis / Sore Throat
  if (combined.includes("sinus") || combined.includes("nasal") || combined.includes("throat") || combined.includes("hoarse") || combined.includes("ear")) {
    differentials.push({
      condition: "Allergic Rhinosinusitis / Deviated Nasal Septum",
      icdCode: "J30.9",
      likelihood: "Moderate",
      rationale: "Upper airway congestion, post-nasal drip, or facial sinus tenderness.",
    });
    investigations.add("Diagnostic Nasal / ENT Endoscopy");
    examChecks.add("Anterior rhinoscopy & oropharyngeal inspection");
    if (combined.includes("hoarse") || combined.includes("mass") || combined.includes("septum")) {
      if (disposition === "Outpatient Follow-Up") {
        disposition = "Specialist Referral";
        dispositionRationale = "Recommend ENT Head & Neck evaluation with Dr. Rishabh Kacker for diagnostic nasal/laryngeal endoscopy.";
      }
    }
  }

  // Pattern 5: Chest Pain / Cardiac Red Flag
  if (combined.includes("chest pain") || combined.includes("palpitation") || combined.includes("angina")) {
    redFlags.push("Chest Pain Red Flag: Immediately obtain 12-lead ECG & Troponin-I to rule out Acute Coronary Syndrome / Pulmonary Embolism.");
    differentials.unshift({
      condition: "Rule Out Acute Coronary Syndrome / Pulmonary Embolism",
      icdCode: "R07.9",
      likelihood: "Rule Out",
      rationale: "Must exclude life-threatening cardiopulmonary etiology before attributing to musculoskeletal/GERD pain.",
    });
    investigations.add("12-Lead ECG + Troponin-I");
    if (disposition === "Outpatient Follow-Up") {
      disposition = "Specialist Referral";
      dispositionRationale = "Urgent Cardiology / Emergency triage advised for chest pain workup.";
    }
  }

  // Pattern 6: Diabetes / Metabolic / Hypertension
  if (combined.includes("diab") || combined.includes("glucose") || combined.includes("sugar") || combined.includes("hba1c") || combined.includes("hypertension")) {
    differentials.push({
      condition: "Type 2 Diabetes Mellitus / Cardiometabolic Syndrome",
      icdCode: "E11.9",
      likelihood: "High",
      rationale: "Elevated glycemic markers or cardiometabolic risk profile.",
    });
    investigations.add("Comprehensive Metabolic & HbA1c Panel");
    investigations.add("Lipid Profile (Fasting)");
    meds.push({
      name: "Glycomet-GP 1 (Metformin + Glimepiride)",
      dosage: "1 tab OD before breakfast",
      rationale: "Maintains glycemic control; monitor fasting & post-prandial glucose.",
    });
  }

  if (differentials.length === 0) {
    differentials.push({
      condition: "Acute Upper Respiratory / Viral Syndrome",
      icdCode: "J06.9",
      likelihood: "Moderate",
      rationale: "Non-specific symptoms without focal cardiopulmonary instability.",
    });
    investigations.add("Complete Blood Count (CBC) + CRP + ESR");
  }

  // Allergy check on NSAIDs
  if (hasAllergy("ibuprofen") || hasAllergy("aspirin")) {
    meds.push({
      name: "Dolo 650mg (Paracetamol)",
      dosage: "1 tab SOS (max 3/day)",
      rationale: "Safe antipyretic/analgesic — NSAIDs avoided due to documented allergy.",
      allergyWarning: "NSAID/Aspirin allergy flagged in patient record.",
    });
  }

  const planLines = [
    `1. Primary Clinical Focus: ${differentials[0]?.condition} (${differentials[0]?.icdCode}).`,
    `2. Diagnostic Workup: Order ${Array.from(investigations).slice(0, 4).join(", ") || "routine baseline labs"}.`,
    `3. Pharmacotherapy: ${meds.map((m) => `${m.name} (${m.dosage})`).join("; ") || "Supportive care & symptom relief"}.`,
    `4. Disposition: ${disposition} — ${dispositionRationale}`,
  ];

  return {
    redFlags,
    differentials,
    recommendedExamChecks: Array.from(examChecks),
    recommendedInvestigations: Array.from(investigations),
    suggestedMedicines: meds,
    recommendedPlanOfAction: planLines.join("\n"),
    dispositionAdvice: disposition,
    dispositionRationale,
  };
}

export function extractEntitiesFromUtterance(text: string): {
  symptoms: string[];
  examNote?: string;
  investigations: string[];
  tag?: string;
} {
  const lower = text.toLowerCase();
  const symptoms: string[] = [];
  const investigations: string[] = [];
  let examNote: string | undefined;
  let tag: string | undefined;

  if (lower.includes("cough")) { symptoms.push("Chronic Cough (> 2 wks)"); tag = "Symptom: Cough"; }
  if (lower.includes("snor") || lower.includes("sleep") || lower.includes("apnea")) {
    symptoms.push("Loud Snoring & Witnessed Apnea");
    investigations.push("Polysomnography (Overnight Sleep Study)");
    tag = "Symptom + Sleep Study";
  }
  if (lower.includes("breath") || lower.includes("shortness") || lower.includes("dyspnea")) {
    symptoms.push("Shortness of Breath / Dyspnea");
    investigations.push("Pulmonary Function Test (PFT / Spirometry)");
    tag = "Symptom: Dyspnea";
  }
  if (lower.includes("wheez")) { symptoms.push("Wheezing / Chest Tightness"); tag = "Exam/Symptom: Wheeze"; }
  if (lower.includes("fever")) {
    symptoms.push("High Fever & Chills");
    investigations.push("Complete Blood Count (CBC) + CRP + ESR");
    investigations.push("Chest X-Ray (PA View)");
    tag = "Fever + CXR/CBC";
  }
  if (lower.includes("spo2") || lower.includes("auscultation") || lower.includes("crepitation") || lower.includes("wheeze on exam") || lower.includes("mallampati")) {
    examNote = text;
    tag = "On-Exam Finding";
  }
  if (lower.includes("nasal") || lower.includes("sinus")) {
    symptoms.push("Nasal Blockage / Sinus Pressure");
    investigations.push("Diagnostic Nasal / ENT Endoscopy");
    tag = "ENT Symptom";
  }

  return { symptoms, examNote, investigations, tag };
}

export const LIVE_MEETING_SCENARIOS = [
  {
    id: "osa-sleep",
    title: "Sleep Apnea & Snoring Consult (Dr. Rajeev Kacker)",
    lines: [
      { speaker: "Doctor" as const, text: "Hello, what brings you in today? How has your sleep and breathing been?" },
      { speaker: "Patient" as const, text: "Doctor, I have had loud snoring, witnessed pauses in breathing, and severe daytime fatigue for 4 months." },
      { speaker: "Patient" as const, text: "Also some morning nasal blockage and dry throat when I wake up." },
      { speaker: "Doctor" as const, text: "On examination: Mallampati Class III airway, mild bilateral turbinate hypertrophy, SpO2 97% on room air, chest clear." },
      { speaker: "Doctor" as const, text: "We should order an overnight Polysomnography sleep study and ENT nasal endoscopy to evaluate OSA severity." },
    ],
  },
  {
    id: "severe-copd",
    title: "Acute Dyspnea & Hypoxemia Triage (Hospitalization Red Flag)",
    lines: [
      { speaker: "Patient" as const, text: "I am having severe shortness of breath, wheezing, and high fever since last night." },
      { speaker: "Doctor" as const, text: "On examination: SpO2 89% on room air, tachypnea RR 28/min, diffuse bilateral expiratory wheeze and right basal crepitations." },
      { speaker: "Doctor" as const, text: "This requires immediate ABG, Chest X-Ray, CBC+CRP, and inpatient Respiratory HDU admission for O2 & nebulization." },
    ],
  },
];

export interface DoctorChatResponse {
  title: string;
  answerSections: Array<{ heading: string; bullets: string[] }>;
  references: string[];
  allergyAlert?: string;
  suggestedLabs?: string[];
  suggestedPlanSnippet?: string;
  suggestedIcd?: string;
}

export function answerDoctorMedicalQuery(params: {
  query: string;
  patient?: Patient;
  vitals?: VitalRecord;
  recentLabsSummary?: string;
}): DoctorChatResponse {
  const q = params.query.toLowerCase();
  const pat = params.patient;
  const allergies = (pat?.allergies || []).filter((a) => a !== "None Known");
  const allergyText = allergies.length > 0 ? allergies.join(", ") : "None documented";
  const hasPenicillinAllergy = allergies.some((a) => a.toLowerCase().includes("penicillin"));
  const hasNsaidAllergy = allergies.some((a) => a.toLowerCase().includes("ibuprofen") || a.toLowerCase().includes("aspirin"));
  const hasSulfaAllergy = allergies.some((a) => a.toLowerCase().includes("sulfa"));

  const vitalsStr = params.vitals
    ? `BP ${params.vitals.bpSystolic}/${params.vitals.bpDiastolic} mmHg, HR ${params.vitals.heartRate} bpm, SpO2 ${params.vitals.spo2}%, Temp ${params.vitals.temperatureF}°F${params.vitals.bloodGlucoseMgDl ? `, Glucose ${params.vitals.bloodGlucoseMgDl} mg/dL` : ""}`
    : "No vitals recorded today";

  // 1. Drug interaction / Allergy-safe antibiotic or medication query
  if (q.includes("antibiotic") || q.includes("drug") || q.includes("allergy") || q.includes("interaction") || q.includes("safe") || q.includes("medicine")) {
    const alerts: string[] = [];
    if (hasPenicillinAllergy) alerts.push("AVOID Amoxicillin / Augmentin / Piperacillin (Penicillin allergy documented).");
    if (hasSulfaAllergy) alerts.push("AVOID TMP-SMX (Co-trimoxazole) / Sulfonamides (Sulfa allergy documented).");
    if (hasNsaidAllergy) alerts.push("AVOID Ibuprofen / Diclofenac / Aspirin (NSAID allergy documented).");

    return {
      title: `Allergy-Safe Pharmacotherapy & Interaction Check (${pat?.name || "Patient"})`,
      allergyAlert: alerts.length > 0 ? alerts.join(" ") : undefined,
      answerSections: [
        {
          heading: "Patient Safety Profile",
          bullets: [
            `Documented Allergies: ${allergyText}`,
            `Chronic Conditions: ${pat?.chronicConditions.join(", ") || "None"}`,
            `Current Vitals: ${vitalsStr}`,
          ],
        },
        {
          heading: "Recommended Safe Options (Respiratory / ENT)",
          bullets: [
            hasPenicillinAllergy
              ? "Community-Acquired LRTI/Sinusitis: Azithromycin 500mg OD x 5d OR Levofloxacin 750mg OD x 5d (avoiding Beta-Lactams)."
              : "First-line Bacterial LRTI/ENT: Amoxicillin-Clavulanate 625mg TDS x 5–7d or Cefuroxime 500mg BD.",
            hasNsaidAllergy
              ? "Analgesic/Antipyretic: Paracetamol (Dolo) 650mg SOS (max 3g/day); avoid all NSAIDs."
              : "Analgesic/Antipyretic: Paracetamol 650mg SOS; caution with NSAIDs if asthmatic/renal impairment.",
            "Airway Controller: Budesonide-Formoterol 200/6 mcg MART regimen (minimal systemic interaction).",
          ],
        },
      ],
      references: ["IDSA/ATS CAP Guidelines", "GINA 2025 Pharmacotherapy", "Patient Allergy Registry"],
      suggestedPlanSnippet: `Allergy-verified regimen (${hasPenicillinAllergy ? "Macrolide/Fluoroquinolone preferred, avoid Penicillins" : "Standard empiric coverage"}). Monitor clinical response in 48–72 hours.`,
    };
  }

  // 2. Hospitalization / CURB-65 / Red flags / ICU triage
  if (q.includes("hospital") || q.includes("admit") || q.includes("curb") || q.includes("icu") || q.includes("red flag") || q.includes("spo2") || q.includes("hdu")) {
    const lowSpo2 = (params.vitals?.spo2 || 99) < 92;
    return {
      title: "Inpatient Admission & Respiratory Red-Flag Criteria (CURB-65 / NEWS2)",
      allergyAlert: lowSpo2 ? `CRITICAL: Patient's latest SpO2 is ${params.vitals?.spo2}% (< 92%) — meets threshold for Respiratory HDU / Supplemental O2!` : undefined,
      answerSections: [
        {
          heading: "Immediate Hospitalization Triggers",
          bullets: [
            "Resting SpO2 < 92% on room air (or < 88% in known hypercapnic COPD) or PaO2 < 60 mmHg on ABG.",
            "Respiratory Rate >= 28–30/min, accessory muscle fatigue, silent chest, or inability to speak full sentences.",
            "Hemodynamic instability: SBP < 90 mmHg, DBP <= 60 mmHg, or altered sensorium (Confusion).",
            "CURB-65 Score >= 2 (General Ward) or >= 3 (ICU / Respiratory HDU evaluation).",
          ],
        },
        {
          heading: "Immediate Stabilization Protocol",
          bullets: [
            "Titrate O2 via nasal cannula/Venturi mask targeting SpO2 94–98% (88–92% if COPD hypercapnia risk).",
            "Stat ABG, Chest X-Ray PA, CBC + CRP + Procalcitonin + Blood Cultures prior to IV antibiotics.",
            "Nebulized Salbutamol 2.5mg + Ipratropium 500mcg q20min x 3 + IV Hydrocortisone 100mg / Methylprednisolone.",
          ],
        },
      ],
      references: ["BTS Oxygen Guidelines", "CURB-65 Severity Score", "GOLD Acute Exacerbation Protocol"],
      suggestedLabs: ["Arterial Blood Gas (ABG)", "Chest X-Ray (PA View)", "Complete Blood Count (CBC) + CRP + ESR"],
      suggestedPlanSnippet: "Evaluate for Respiratory HDU admission if SpO2 < 92% or CURB-65 >= 2; order stat ABG, CXR & CBC+CRP.",
    };
  }

  // 3. Sleep Apnea / OSA / Snoring / Sleep Study
  if (q.includes("sleep") || q.includes("osa") || q.includes("apnea") || q.includes("snor") || q.includes("stop-bang") || q.includes("cpap")) {
    return {
      title: "Obstructive Sleep Apnea (OSA) Diagnostic & Management Guide",
      answerSections: [
        {
          heading: "STOP-BANG & Clinical Assessment",
          bullets: [
            "Evaluate Snoring, Tiredness, Observed apneas, high BP, BMI > 35, Age > 50, Neck circumference > 40cm, Gender (Male).",
            "ENT Airway Exam: Mallampati grade III/IV, tonsillar hypertrophy, deviated nasal septum, retrognathia.",
            `Patient Baseline: ${pat?.name || "Patient"} (${pat?.age || "—"}y ${pat?.gender || ""}), ${vitalsStr}.`,
          ],
        },
        {
          heading: "Diagnostic Thresholds (AHI) & Treatment",
          bullets: [
            "Mild OSA (AHI 5–14): Positional therapy, weight loss, oral appliance / nasal steroid if rhinitis.",
            "Moderate-Severe OSA (AHI >= 15, or >= 5 with daytime sleepiness/HTN/DM): Gold-standard Auto-CPAP / BiPAP titration.",
            "Refractory nasal obstruction or anatomical collapse: Refer to ENT Head & Neck Surgeon (Dr. Rishabh Kacker) for DISE / surgery.",
          ],
        },
      ],
      references: ["AASM Clinical Practice Guideline for Adult OSA", "Dr. Kacker's Sleep Lab Protocol"],
      suggestedLabs: ["Polysomnography (Overnight Sleep Study)", "Diagnostic Nasal / ENT Endoscopy", "Thyroid Profile (T3, T4, TSH)"],
      suggestedIcd: "G47.33",
      suggestedPlanSnippet: "Order Level-1/Home Polysomnography (Sleep Study) + ENT Nasal Endoscopy; counsel on sleep hygiene & CPAP trial if AHI >= 15.",
    };
  }

  // 4. Asthma / COPD / PFT / Inhaler step-up
  if (q.includes("asthma") || q.includes("copd") || q.includes("pft") || q.includes("inhaler") || q.includes("wheez") || q.includes("cough")) {
    return {
      title: "Asthma & COPD Stepwise Management & PFT Interpretation",
      answerSections: [
        {
          heading: "Spirometry (PFT) Diagnostic Keys",
          bullets: [
            "Asthma: Variable airflow limitation; post-bronchodilator FEV1 increase >= 12% AND >= 200 mL.",
            "COPD: Persistent airflow limitation; post-bronchodilator FEV1/FVC < 0.70.",
            "Assess blood eosinophils (> 300 cells/µL favors ICS responsiveness) & Total IgE / Allergy Skin Prick if atopic.",
          ],
        },
        {
          heading: "GINA 2025 / GOLD Evidence-Based Therapy",
          bullets: [
            "Asthma Track 1 (Preferred): Low-dose ICS-Formoterol (Budesonide/Formoterol 200/6 mcg) as both maintenance & reliever (MART).",
            "COPD Group B/E: LABA + LAMA dual bronchodilator; add ICS if frequent exacerbations + eosinophils >= 300.",
            "Verify inhaler technique + spacer use at every visit; screen for allergic rhinitis or GERD overlap.",
          ],
        },
      ],
      references: ["GINA 2025 Global Strategy", "GOLD 2025 COPD Report"],
      suggestedLabs: ["Pulmonary Function Test (PFT / Spirometry)", "Comprehensive Allergy Skin Prick / IgE Panel", "Chest X-Ray (PA View)"],
      suggestedIcd: "J45.909",
      suggestedPlanSnippet: "Perform PFT with bronchodilator reversibility + Allergy panel; initiate Budesonide-Formoterol MART inhaler & spacer counselling.",
    };
  }

  // 5. Lab interpretation / HbA1c / Metabolic / Differential for current patient
  return {
    title: `Clinical Case Synthesis & Differential Workup — ${pat?.name || "Current Patient"}`,
    allergyAlert: allergies.length > 0 ? `Safety Reminder — Documented Allergies: ${allergyText}` : undefined,
    answerSections: [
      {
        heading: "Patient Context & Biomarkers",
        bullets: [
          `Profile: ${pat?.age || "—"}y ${pat?.gender || ""} • Conditions: ${pat?.chronicConditions.join(", ") || "None"}`,
          `Latest Vitals: ${vitalsStr}`,
          `Recent Labs: ${params.recentLabsSummary || "Review pending lab orders in EMR"}`,
        ],
      },
      {
        heading: "Clinical Diagnostic Considerations",
        bullets: [
          "Correlate metabolic status (HbA1c, Fasting Glucose, Lipids) with sleep quality & blood pressure (OSA frequently co-exists with Type 2 DM & resistant HTN).",
          "Check Vitamin D3 & Thyroid profile if persistent fatigue or myalgia is reported.",
          "Ensure targeted organ-system exam (Chest auscultation, ENT airway, CVS, and peripheral foot/neuro check if diabetic).",
        ],
      },
      {
        heading: "Suggested Next Diagnostic Steps",
        bullets: [
          "Order/review Comprehensive Metabolic + HbA1c Panel, Lipid Profile, and PFT/Sleep Study if respiratory or snoring symptoms are present.",
          "Provide structured NutriPlan low-GI diet + Zone-2 post-meal walking protocol.",
        ],
      },
    ],
    references: ["ADA Standards of Care 2026", "ACC/AHA Hypertension Guidelines", "AASM OSA Screening"],
    suggestedLabs: ["Comprehensive Metabolic & HbA1c Panel", "Lipid Profile (Fasting)", "Polysomnography (Overnight Sleep Study)"],
    suggestedIcd: "E11.9",
    suggestedPlanSnippet: "Review metabolic & sleep profile, correlate vitals, order targeted lab panel and reinforce individualized diet/medication adherence.",
  };
}
