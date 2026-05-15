const crypto = require("node:crypto");

const { trustEvaluatorPrompt } = require("../prompts/trustEvaluatorPrompt");
const { extractorPrompt } = require("../prompts/extractorPrompt");
const { rendererPrompt } = require("../prompts/rendererPrompt");
const { trustSchema } = require("../schemas/trustSchema");
const { extractorSchema } = require("../schemas/extractorSchema");
const { cardSchema, allowedCardIds } = require("../schemas/cardSchema");
const { validateBySchema, validateCards } = require("../utils/validateOutput");
const { splitDocuments } = require("../utils/splitDocuments");

const SUPPORTED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

function runClearStepsEngine({ extractedText, fileMeta }) {
  const jobId = fileMeta.jobId || crypto.randomUUID();
  const split = splitDocuments(extractedText);
  const primaryText = split.documents[0] || "";

  const trust = evaluateTrustAndSeverityLayer({
    text: primaryText,
    fileMeta,
    split,
    prompt: trustEvaluatorPrompt
  });

  const extraction = runExtractorLayer({
    text: primaryText,
    trust,
    prompt: extractorPrompt
  });

  const cards = runRendererLayer({
    trust,
    extraction,
    prompt: rendererPrompt
  });

  const banner = buildBanner(trust);

  const output = {
    job_id: jobId,
    trust: toPublicTrustShape(trust),
    cards,
    banner,
    display_text: cards.map((card) => `${card.title} ${card.short_answer}`).join("\n"),
    tts_script: cards.map((card) => `${card.title}. ${card.short_answer}`).join("\n"),
    debug: {
      prompt_version: "clearsteps_v1",
      model: process.env.CLEARSTEPS_MODEL || "mock-clearsteps-engine-v1",
      created_at: new Date().toISOString()
    }
  };

  const trustErrors = validateBySchema(output.trust, trustSchema, "trust");
  const extractorErrors = validateBySchema(extraction, extractorSchema, "extractor");
  const cardErrors = validateCards(output.cards, cardSchema, allowedCardIds);
  const allErrors = [...trustErrors, ...extractorErrors, ...cardErrors];

  if (allErrors.length > 0) {
    output.debug.validation_errors = allErrors;
  }

  return {
    structured_output: {
      ...output,
      trust_internal: trust,
      extractor_internal: extraction
    },
    api_output: output
  };
}

function evaluateTrustAndSeverityLayer({ text, fileMeta, split }) {
  const normalizedText = String(text || "");
  const lower = normalizedText.toLowerCase();
  const selectedCategory = String(fileMeta.selectedCategory || "auto").toLowerCase();

  const inputQuality = detectInputQuality(normalizedText);
  const isTemplate = looksTemplate(normalizedText);
  const isOutgoing = looksOutgoing(lower);
  const isUnsupported = looksUnsupported(fileMeta.mimeType, normalizedText);

  const authenticSignals = detectAuthenticSignals(lower, fileMeta);
  const distrustSignals = detectDistrustSignals(lower);
  const scamSignals = detectScamSignals(lower);
  const severitySignals = detectSeveritySignals(lower);

  const severityLevel = pickSeverityLevel({ lower, severitySignals, selectedCategory });
  const urgencyLevel = pickUrgencyLevel(lower, severityLevel);
  const documentCategory = detectDocumentCategory({
    lower,
    selectedCategory,
    isTemplate,
    isOutgoing,
    isUnsupported,
    scamSignals
  });

  const trustAssessment = pickTrustAssessment({
    inputQuality,
    isUnsupported,
    scamSignals,
    distrustSignals,
    authenticSignals
  });

  const confidence = pickConfidence({
    inputQuality,
    trustAssessment,
    split
  });

  const documentType = pickDocumentType({
    isUnsupported,
    isTemplate,
    isOutgoing,
    scamSignals
  });

  const processingMode = pickProcessingMode({
    trustAssessment,
    isUnsupported,
    inputQuality,
    scamSignals,
    isTemplate,
    isOutgoing,
    split
  });

  const needsHumanReview = (
    confidence === "low" ||
    trustAssessment === "low" ||
    trustAssessment === "unknown" ||
    split.isMultiLetterInput ||
    processingMode === "verification_only" ||
    processingMode === "unsupported"
  );

  const reviewReason = pickReviewReason({
    processingMode,
    trustAssessment,
    inputQuality,
    isTemplate,
    isOutgoing,
    split
  });

  return {
    trust_assessment: trustAssessment,
    severity_level: severityLevel,
    urgency_level: urgencyLevel,
    document_category: documentCategory,
    document_type: documentType,
    processing_mode: processingMode,
    confidence,
    needs_human_review: needsHumanReview,
    review_reason: reviewReason,
    authentic_signals: authenticSignals,
    distrust_signals: distrustSignals,
    scam_signals: scamSignals,
    severity_signals: severitySignals,
    input_quality: inputQuality,
    sender_guess: guessSender(normalizedText),
    is_template: isTemplate,
    is_outgoing: isOutgoing,
    is_multi_document: split.isMultiLetterInput,
    safe_next_step: buildSafeNextStep({ processingMode, severityLevel, trustAssessment })
  };
}

function runExtractorLayer({ text, trust }) {
  if (trust.processing_mode === "unsupported") {
    return {
      summary: "Readable text is limited in this upload.",
      most_important_point: "Not clearly stated.",
      actions: ["Upload a clearer copy if possible."],
      deadline: null,
      risk: "Important details may be missing.",
      helpful_note: "This document can be partly explained, but details need checking.",
      money_amounts: [],
      reference_numbers: [],
      contact_details: [],
      appeal_rights: [],
      support_options: [],
      confidence: "low",
      needs_human_review: true,
      review_reason: trust.review_reason,
      evidence_spans: []
    };
  }

  if (trust.processing_mode === "verification_only") {
    return {
      summary: inferSummary(text, trust),
      most_important_point: "Check authenticity before taking any action.",
      actions: [
        "Verify the organisation on its official website.",
        "Use contact details from an official source.",
        "Keep your money and personal details protected."
      ],
      deadline: null,
      risk: "You could lose money or share private data.",
      helpful_note: "Do not use links or numbers from this document until checked.",
      money_amounts: extractMoneyAmounts(text),
      reference_numbers: extractReferenceNumbers(text),
      contact_details: [],
      appeal_rights: [],
      support_options: [],
      confidence: "low",
      needs_human_review: true,
      review_reason: trust.review_reason,
      evidence_spans: []
    };
  }

  const deadline = extractDeadline(text);
  const actions = extractActions(text, trust);
  const summary = inferSummary(text, trust);
  const risk = inferRisk(text, trust);
  const note = inferContextNote(text, trust);

  return {
    summary,
    most_important_point: inferMostImportantPoint(trust),
    actions,
    deadline,
    risk,
    helpful_note: note,
    money_amounts: extractMoneyAmounts(text),
    reference_numbers: extractReferenceNumbers(text),
    contact_details: extractContactDetails(text, trust),
    appeal_rights: [],
    support_options: [],
    confidence: trust.confidence,
    needs_human_review: trust.needs_human_review,
    review_reason: trust.review_reason,
    evidence_spans: []
  };
}

function runRendererLayer({ trust, extraction }) {
  const cardStatus = statusFromTrustAndSeverity(trust);
  const actionLine = normalizeActionLine(extraction.actions);

  return [
    {
      id: "what_is_this",
      title: "What is this?",
      short_answer: cleanLine(extraction.summary || "Not clearly stated."),
      status: cardStatus
    },
    {
      id: "what_matters_most",
      title: "What matters most?",
      short_answer: cleanLine(inferMostImportantPoint(trust)),
      status: cardStatus
    },
    {
      id: "what_do_i_need_to_do",
      title: "What do I need to do?",
      short_answer: actionLine,
      steps: Array.isArray(extraction.actions) ? extraction.actions.map(cleanLine) : [],
      status: cardStatus
    },
    {
      id: "when_is_it_due",
      title: "When is it due?",
      short_answer: extraction.deadline ? cleanLine(`Due by ${extraction.deadline}.`) : "No deadline clearly stated.",
      date: extraction.deadline || null,
      status: cardStatus
    },
    {
      id: "what_could_happen",
      title: "What could happen if I ignore it?",
      short_answer: cleanLine(extraction.risk || "No risk clearly stated."),
      status: cardStatus
    },
    {
      id: "helpful_note",
      title: "Helpful note",
      short_answer: cleanLine(inferHelpfulNote(trust, extraction.helpful_note)),
      status: cardStatus
    }
  ];
}

function toPublicTrustShape(trust) {
  return {
    trust_assessment: trust.trust_assessment,
    severity_level: trust.severity_level,
    urgency_level: trust.urgency_level,
    document_category: trust.document_category,
    document_type: trust.document_type,
    processing_mode: trust.processing_mode,
    confidence: trust.confidence,
    needs_human_review: trust.needs_human_review,
    review_reason: trust.review_reason,
    authentic_signals: trust.authentic_signals,
    distrust_signals: trust.distrust_signals,
    scam_signals: trust.scam_signals,
    severity_signals: trust.severity_signals,
    input_quality: trust.input_quality,
    safe_next_step: trust.safe_next_step
  };
}

function buildBanner(trust) {
  if (trust.trust_assessment === "low" && trust.severity_level === "urgent") {
    return {
      show: true,
      type: "urgent",
      text: "This may be suspicious and serious. Verify before acting."
    };
  }

  if (trust.severity_level === "urgent") {
    return {
      show: true,
      type: "urgent",
      text: "This looks important. Do not ignore it."
    };
  }

  if (trust.trust_assessment === "low") {
    return {
      show: true,
      type: "warning",
      text: "This may be suspicious. Check before responding."
    };
  }

  if (trust.trust_assessment === "medium") {
    return {
      show: true,
      type: "caution",
      text: "Some details need checking before you act."
    };
  }

  if (trust.trust_assessment === "high" && trust.severity_level === "low") {
    return {
      show: true,
      type: "safe",
      text: "This looks like a normal document. No urgent risk found."
    };
  }

  return {
    show: true,
    type: "caution",
    text: "Read the next step card before you act."
  };
}

function detectScamSignals(lower) {
  const checks = [
    ["gift card", "Mentions gift card payment."],
    ["crypto", "Mentions crypto payment."],
    ["bank transfer today", "Requests immediate bank transfer."],
    ["act now", "Uses pressure wording."],
    ["final warning", "Uses pressure warning wording."],
    ["click this link", "Requests link-based response."],
    ["confirm your account", "Requests account verification details."],
    ["share your password", "Requests secret details."]
  ];

  return checks.filter(([needle]) => lower.includes(needle)).map(([, label]) => label);
}

function detectDistrustSignals(lower) {
  const checks = [
    ["dear customer", "Generic greeting used."],
    ["urgent payment required", "Urgent payment pressure."],
    ["limited time", "Artificial urgency used."],
    ["unusual sender", "Sender wording appears unusual."]
  ];

  return checks.filter(([needle]) => lower.includes(needle)).map(([, label]) => label);
}

function detectAuthenticSignals(lower, fileMeta) {
  const signals = [];
  if (String(fileMeta.mimeType || "").includes("pdf")) signals.push("Uploaded as PDF format.");
  if (lower.includes("reference")) signals.push("Contains reference details.");
  if (/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/.test(lower)) signals.push("Contains date format.");
  if (lower.includes("dear")) signals.push("Contains formal letter structure.");
  return signals;
}

function detectInputQuality(text) {
  const cleaned = String(text || "").trim();
  if (!cleaned || cleaned.length < 40) return "poor";
  if (cleaned.length < 160) return "borderline";
  return "good";
}

function looksTemplate(text) {
  return /\[[^\]]+\]|{[^}]+}|<[^>]+>|insert name|insert date|template/i.test(String(text || ""));
}

function looksOutgoing(lower) {
  return (
    lower.includes("yours sincerely") ||
    lower.includes("yours faithfully") ||
    lower.includes("i am writing to") ||
    lower.includes("from our team")
  );
}

function looksUnsupported(mimeType, text) {
  if (!mimeType) return false;
  return !SUPPORTED_MIME_TYPES.includes(mimeType) || (!String(text || "").trim() && mimeType !== "text/plain");
}

function pickDocumentType({ isUnsupported, isTemplate, isOutgoing, scamSignals }) {
  if (isUnsupported) return "unsupported";
  if (isTemplate) return "template";
  if (isOutgoing) return "outgoing";
  if (scamSignals.length > 0) return "possible_scam";
  return "official_incoming";
}

function detectDocumentCategory({ lower, selectedCategory, isTemplate, isOutgoing, isUnsupported, scamSignals }) {
  if (isUnsupported) return "unsupported";
  if (isTemplate) return "template";
  if (isOutgoing) return "outgoing";
  if (scamSignals.length > 0) return "possible_scam";

  const selectedCategoryMap = {
    bill: "bill_or_payment",
    work: "employment",
    medical: "medical",
    school: "education",
    legal: "legal_or_court",
    email: "email"
  };

  const checks = [
    [["rent", "landlord", "tenancy", "eviction"], "housing"],
    [["invoice", "bill", "payment reminder", "arrears"], "bill_or_payment"],
    [["appointment", "clinic", "consultation"], "appointment"],
    [["disciplinary", "employment", "manager", "termination"], "employment"],
    [["school", "university", "student"], "education"],
    [["loan", "bank", "mortgage", "credit"], "bank_or_loan"],
    [["hmrc", "council", "department", "gov.uk"], "government"],
    [["nhs", "hospital", "gp", "medical"], "medical"],
    [["court", "tribunal", "legal", "prosecution", "bailiff"], "legal_or_court"],
    [["benefit", "universal credit", "allowance"], "benefits"],
    [["insurance", "policy", "claim"], "insurance"],
    [["email", "subject:", "from:"], "email"]
  ];

  for (const [needles, category] of checks) {
    if (needles.some((needle) => lower.includes(needle))) {
      return category;
    }
  }

  if (selectedCategoryMap[selectedCategory]) {
    return selectedCategoryMap[selectedCategory];
  }

  return "unknown";
}

function pickTrustAssessment({ inputQuality, isUnsupported, scamSignals, distrustSignals, authenticSignals }) {
  if (isUnsupported || inputQuality === "poor") return "unknown";
  if (scamSignals.length > 0) return "low";
  if (distrustSignals.length > 1) return "low";
  if (authenticSignals.length >= 2 && distrustSignals.length === 0) return "high";
  return "medium";
}

function pickConfidence({ inputQuality, trustAssessment, split }) {
  if (inputQuality === "poor" || split.isMultiLetterInput) return "low";
  if (trustAssessment === "high" && inputQuality === "good") return "high";
  return "medium";
}

function pickProcessingMode({ trustAssessment, isUnsupported, inputQuality, scamSignals, isTemplate, isOutgoing, split }) {
  if (isUnsupported || inputQuality === "poor") return "unsupported";
  if (trustAssessment === "low" || scamSignals.length > 0) return "verification_only";
  if (trustAssessment === "medium" || isTemplate || isOutgoing || inputQuality === "borderline" || split.isMultiLetterInput) {
    return "caution";
  }
  return "normal";
}

function pickReviewReason({ processingMode, trustAssessment, inputQuality, isTemplate, isOutgoing, split }) {
  if (processingMode === "unsupported") return "Some parts are unclear or unsupported.";
  if (processingMode === "verification_only") return "Suspicious patterns were detected.";
  if (split.isMultiLetterInput) return "Multiple documents may be mixed in one upload.";
  if (isTemplate) return "Template markers were found.";
  if (isOutgoing) return "Looks like an outgoing document.";
  if (inputQuality === "borderline") return "Some details are readable but need checking.";
  if (trustAssessment === "high") return "No major trust issue found.";
  return "Some details need checking before action.";
}

function buildSafeNextStep({ processingMode, severityLevel, trustAssessment }) {
  if (processingMode === "verification_only") {
    return "Verify using official contact details from the organisation website.";
  }
  if (processingMode === "unsupported") {
    return "Upload a clearer copy before taking action.";
  }
  if (severityLevel === "urgent") {
    return "Check the action card now and act using trusted details.";
  }
  if (trustAssessment === "medium") {
    return "Check key details on the original document before acting.";
  }
  return "Follow the action card step by step.";
}

function detectSeveritySignals(lower) {
  const checks = [
    ["court action", "Mentions court action."],
    ["eviction", "Mentions eviction risk."],
    ["winding up", "Mentions winding up action."],
    ["bailiff", "Mentions bailiff action."],
    ["criminal prosecution", "Mentions criminal prosecution."],
    ["termination", "Mentions termination."],
    ["disconnection", "Mentions disconnection risk."],
    ["foreclosure", "Mentions foreclosure risk."],
    ["urgent medical appointment", "Mentions urgent medical appointment."],
    ["final notice", "Mentions final notice wording."],
    ["immediate payment required", "Mentions immediate payment required."],
    ["payment overdue", "Mentions overdue payment."],
    ["missed deadline", "Mentions missed deadline."],
    ["employment warning", "Mentions employment warning."],
    ["benefit problem", "Mentions benefit issue."],
    ["housing risk", "Mentions housing risk."],
    ["loan default", "Mentions loan default."],
    ["legal response required", "Mentions legal response required."],
    ["appointment", "Mentions appointment."],
    ["school action needed", "Mentions school action needed."],
    ["documents to send", "Mentions documents to send."],
    ["form to complete", "Mentions form to complete."],
    ["meeting to attend", "Mentions meeting to attend."],
    ["information only", "Marked as information only."],
    ["confirmation", "Looks like confirmation content."],
    ["receipt", "Looks like receipt content."],
    ["newsletter", "Looks like newsletter content."],
    ["no action needed", "Says no action needed."],
    ["general update", "Looks like general update content."]
  ];

  return checks.filter(([needle]) => lower.includes(needle)).map(([, label]) => label);
}

function pickSeverityLevel({ lower, severitySignals, selectedCategory }) {
  if (matchesAny(lower, URGENT_SEVERITY_KEYWORDS)) return "urgent";
  if (matchesAny(lower, HIGH_SEVERITY_KEYWORDS)) return "high";
  if (matchesAny(lower, MEDIUM_SEVERITY_KEYWORDS)) return "medium";
  if (matchesAny(lower, LOW_SEVERITY_KEYWORDS)) return "low";

  if (selectedCategory === "bill") return "medium";
  if (selectedCategory === "medical") return "medium";
  if (selectedCategory === "legal") return "high";
  if (selectedCategory === "work") return "medium";

  if (severitySignals.length > 0) return "medium";
  return "low";
}

function pickUrgencyLevel(lower, severityLevel) {
  if (severityLevel === "urgent") return "immediate";
  if (severityLevel === "high") return "urgent";
  if (severityLevel === "medium") {
    if (lower.includes("today") || lower.includes("within 24 hours")) return "urgent";
    return "soon";
  }
  return "none";
}

function inferSummary(text, trust) {
  if (trust.input_quality === "poor") return "Some parts are unclear in this document.";
  if (trust.document_type === "template") return "This looks like a template with blank fields.";
  if (trust.document_type === "outgoing") return "This looks like a document sent by you.";
  if (trust.document_type === "possible_scam") return "This may be a suspicious message about money or details.";

  const summaryByCategory = {
    bill_or_payment: "This is about a bill or payment request.",
    appointment: "This is about an appointment.",
    employment: "This is about work or employment.",
    education: "This is about school or university.",
    housing: "This is about housing or rent.",
    bank_or_loan: "This is about banking or a loan.",
    government: "This is from a government or council source.",
    medical: "This is a medical document.",
    legal_or_court: "This is a legal or court document.",
    benefits: "This is about benefits support.",
    insurance: "This is about insurance.",
    email: "This appears to be an email message.",
    unsupported: "This document is not fully readable.",
    unknown: "This is a readable formal document."
  };

  return summaryByCategory[trust.document_category] || "This is a readable formal document.";
}

function inferMostImportantPoint(trust) {
  if (trust.trust_assessment === "low") {
    return "This may be suspicious. Check it first.";
  }

  if (trust.severity_level === "urgent") {
    return "This is urgent. You may need to act today.";
  }

  if (trust.severity_level === "high") {
    return "This is important, but not an emergency.";
  }

  if (trust.severity_level === "medium") {
    return "Action is likely needed soon.";
  }

  return "This looks like information only.";
}

function inferRisk(text, trust) {
  if (trust.processing_mode === "verification_only") {
    return "You may be tricked into unsafe payment or data sharing.";
  }

  if (trust.severity_level === "urgent") {
    return "Ignoring this could cause serious problems quickly.";
  }

  if (trust.severity_level === "high") {
    return "Ignoring this could lead to penalties or service issues.";
  }

  if (trust.severity_level === "medium") {
    return "Ignoring this may create delays or follow-up action.";
  }

  if (trust.input_quality === "poor") {
    return "No risk clearly stated.";
  }

  if (String(text || "").toLowerCase().includes("no action needed")) {
    return "No risk clearly stated.";
  }

  return "No risk clearly stated.";
}

function inferContextNote(text, trust) {
  if (trust.document_type === "template") return "Some fields may be missing.";
  if (trust.document_type === "outgoing") return "This may be a copy sent by you.";
  if (trust.input_quality === "poor") return "Upload a clearer version if possible.";
  if (extractReferenceNumbers(text).length > 0) return "Keep the reference number ready.";
  return "No extra note.";
}

function inferHelpfulNote(trust, extractorNote) {
  if (trust.trust_assessment === "low") {
    return "Do not use links or numbers in the document until checked.";
  }

  if (trust.document_type === "template") {
    return "This looks like a template with blank fields.";
  }

  if (trust.document_type === "outgoing") {
    return "This looks like an outgoing document.";
  }

  if (trust.trust_assessment === "high") {
    return "This looks like a normal formal letter.";
  }

  if (trust.trust_assessment === "unknown") {
    return "Some details are unclear. Check the original document.";
  }

  return extractorNote || "Some details are missing. Check the original.";
}

function extractDeadline(text) {
  const value = String(text || "");
  const numericDate = value.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/);
  if (numericDate) return numericDate[0];

  const longDate = value.match(/\b\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4}\b/i);
  if (longDate) return longDate[0];

  return null;
}

function extractActions(text, trust) {
  if (trust.processing_mode === "verification_only") {
    return [
      "Verify the organisation on its official website.",
      "Use contact details from an official source.",
      "Keep your money and personal details protected."
    ];
  }

  const lower = String(text || "").toLowerCase();
  const actions = [];

  if (/\b(pay|payment|settle)\b/.test(lower)) {
    actions.push("Check the payment amount and due date.");
  }
  if (/\b(contact|phone|call|email|reply)\b/.test(lower)) {
    actions.push("Contact the sender using trusted contact details.");
  }
  if (/\b(attend|appointment|meeting)\b/.test(lower)) {
    actions.push("Attend the appointment or meeting.");
  }
  if (/\b(send|submit|provide|complete|fill)\b/.test(lower)) {
    actions.push("Send the requested documents or form.");
  }

  if (actions.length === 0) {
    return ["No action needed right now."];
  }

  return unique(actions);
}

function extractMoneyAmounts(text) {
  return String(text || "").match(/£\s?\d+(?:[.,]\d{2})?/g) || [];
}

function extractReferenceNumbers(text) {
  return String(text || "").match(/\bref(?:erence)?[:\s-]*[a-z0-9-]{4,}\b/gi) || [];
}

function extractContactDetails(text, trust) {
  if (trust.processing_mode === "verification_only") return [];
  const emailMatches = String(text || "").match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || [];
  return unique(emailMatches);
}

function guessSender(text) {
  const match = String(text || "").match(/\b(HMRC|NHS|Council|University|Employer|Department|Bank|Landlord|Court)\b/i);
  return match ? match[0] : null;
}

function normalizeActionLine(actions) {
  if (!Array.isArray(actions) || actions.length === 0) return "No action needed right now.";
  const first = cleanLine(actions[0]);
  if (/^No action needed right now\./i.test(first)) return "No action needed right now.";
  if (/^(Check|Verify|Use|Contact|Attend|Send|Complete|Read|Keep|Upload)\b/i.test(first)) return first;
  return `Check ${first}`;
}

function statusFromTrustAndSeverity(trust) {
  if (trust.severity_level === "urgent") return "urgent";
  if (trust.processing_mode === "verification_only") return "caution";
  if (trust.severity_level === "high") return "caution";
  if (trust.trust_assessment === "high" && trust.severity_level === "low") return "good";
  return "normal";
}

function cleanLine(value) {
  return String(value || "Not clearly stated.").replace(/\s+/g, " ").trim();
}

function matchesAny(text, list) {
  return list.some((entry) => text.includes(entry));
}

function unique(items) {
  return [...new Set(items)];
}

const URGENT_SEVERITY_KEYWORDS = [
  "court action",
  "eviction",
  "winding up",
  "bailiff",
  "criminal prosecution",
  "termination",
  "disconnection",
  "foreclosure",
  "urgent medical appointment",
  "final notice",
  "immediate payment required"
];

const HIGH_SEVERITY_KEYWORDS = [
  "payment overdue",
  "missed deadline",
  "employment warning",
  "benefit problem",
  "housing risk",
  "loan default",
  "medical appointment that may affect care",
  "legal response required",
  "rent arrears"
];

const MEDIUM_SEVERITY_KEYWORDS = [
  "appointment",
  "routine bill",
  "school action needed",
  "documents to send",
  "form to complete",
  "meeting to attend"
];

const LOW_SEVERITY_KEYWORDS = [
  "information only",
  "confirmation",
  "receipt",
  "newsletter",
  "no action needed",
  "general update"
];

module.exports = { runClearStepsEngine };
