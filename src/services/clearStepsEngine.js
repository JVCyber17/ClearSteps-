const crypto = require("node:crypto");

const { trustEvaluatorPrompt } = require("../prompts/trustEvaluatorPrompt");
const { extractorPrompt } = require("../prompts/extractorPrompt");
const { rendererPrompt } = require("../prompts/rendererPrompt");
const { trustSchema } = require("../schemas/trustSchema");
const { extractorSchema } = require("../schemas/extractorSchema");
const { cardSchema, allowedCardIds } = require("../schemas/cardSchema");
const { validateBySchema, validateCards } = require("../utils/validateOutput");
const { splitDocuments } = require("../utils/splitDocuments");

function runClearStepsEngine({ extractedText, fileMeta }) {
  const jobId = fileMeta.jobId || crypto.randomUUID();
  const split = splitDocuments(extractedText);
  const primaryText = split.documents[0] || "";

  const trust = evaluateTrustLayer({
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

  const output = {
    job_id: jobId,
    trust: toPublicTrustShape(trust),
    cards,
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

function evaluateTrustLayer({ text, fileMeta, split }) {
  const lower = text.toLowerCase();
  const scamSignals = detectScamSignals(lower);
  const authenticSignals = detectAuthenticSignals(lower, fileMeta);
  const inputQuality = detectInputQuality(text);
  const isTemplate = looksTemplate(text);
  const isOutgoing = looksOutgoing(lower);
  const isUnsupported = looksUnsupported(fileMeta.mimeType, text);

  let trust_assessment = "high";
  let document_type = "official_incoming";
  let processing_mode = "normal";
  let confidence = "medium";
  let needs_human_review = false;
  let review_reason = "No major issue found in readable text.";

  if (isTemplate) {
    trust_assessment = "medium";
    document_type = "template";
    processing_mode = "caution";
    review_reason = "Template markers were found.";
  }

  if (isOutgoing) {
    trust_assessment = "medium";
    document_type = "outgoing";
    processing_mode = "caution";
    review_reason = "Looks like a document sent by the user or organisation.";
  }

  if (scamSignals.length > 0) {
    trust_assessment = "low";
    document_type = "possible_scam";
    processing_mode = "verification_only";
    confidence = "low";
    needs_human_review = true;
    review_reason = "Suspicious wording suggests scam behaviour.";
  }

  if (inputQuality === "poor") {
    trust_assessment = "low";
    document_type = "unknown";
    confidence = "low";
    needs_human_review = true;
    review_reason = "Text quality is poor and parts are unclear.";
  }

  if (isUnsupported) {
    trust_assessment = "low";
    document_type = "unsupported";
    processing_mode = "unsupported";
    confidence = "low";
    needs_human_review = true;
    review_reason = "Document type is unsupported for reliable extraction.";
  }

  if (split.isMultiLetterInput) {
    needs_human_review = true;
    confidence = "low";
    review_reason = "Multiple letters may be present in one upload.";
  }

  if (confidence === "low") {
    needs_human_review = true;
  }

  return {
    trust_assessment,
    document_type,
    processing_mode,
    confidence,
    needs_human_review,
    review_reason,
    authentic_signals: authenticSignals,
    scam_signals: scamSignals,
    sender_guess: guessSender(text),
    is_multi_letter_input: split.isMultiLetterInput,
    input_quality: inputQuality,
    evidence_snippets: collectEvidenceSnippets(text, scamSignals, authenticSignals)
  };
}

function runExtractorLayer({ text, trust }) {
  if (trust.processing_mode === "unsupported") {
    return {
      summary: "Document type is not fully supported.",
      most_important_point: "Not clearly stated.",
      actions: ["No action needed right now."],
      deadline: null,
      risk: "Not clearly stated.",
      helpful_note: "This document can be explained partly, but details may be missing.",
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
      summary: "This may be suspicious.",
      most_important_point: "Check authenticity before you take any action.",
      actions: [
        "Verify sender details on an official website.",
        "Check reference details with known official contact routes.",
        "Do not use links or phone numbers inside this document."
      ],
      deadline: null,
      risk: "You could lose money or share private details.",
      helpful_note: "Do not pay or reply until checks are complete.",
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
  const actions = extractActions(text);

  return {
    summary: inferSummary(text, trust),
    most_important_point: inferMostImportantPoint(text, trust),
    actions,
    deadline,
    risk: inferRisk(text, trust),
    helpful_note: inferHelpfulNote(text, trust),
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
  const actionLine = normalizeActionLine(extraction.actions);

  const cards = [
    {
      id: "what_is_this",
      title: "What is this?",
      short_answer: cleanLine(extraction.summary || "Not clearly stated."),
      icon: "document",
      status: statusFromTrust(trust)
    },
    {
      id: "what_matters_most",
      title: "What matters most?",
      short_answer: cleanLine(extraction.most_important_point || "Not clearly stated."),
      icon: "alert",
      status: statusFromTrust(trust)
    },
    {
      id: "what_do_i_need_to_do",
      title: "What do I need to do?",
      short_answer: actionLine,
      steps: extraction.actions && extraction.actions.length ? extraction.actions.map(cleanLine) : [],
      icon: "checklist",
      status: statusFromTrust(trust)
    },
    {
      id: "when_is_it_due",
      title: "When is it due?",
      short_answer: extraction.deadline ? cleanLine(`Due by ${extraction.deadline}.`) : "No deadline clearly stated.",
      date: extraction.deadline || null,
      icon: "calendar",
      status: statusFromTrust(trust)
    },
    {
      id: "what_could_happen",
      title: "What could happen if I ignore it?",
      short_answer: cleanLine(extraction.risk || "No risk clearly stated."),
      icon: "risk",
      status: statusFromTrust(trust)
    },
    {
      id: "helpful_note",
      title: "Helpful note",
      short_answer: cleanLine(extraction.helpful_note || "No extra note."),
      icon: "info",
      status: statusFromTrust(trust)
    }
  ];

  return cards;
}

function toPublicTrustShape(trust) {
  return {
    trust_assessment: trust.trust_assessment,
    document_type: trust.document_type,
    processing_mode: trust.processing_mode,
    confidence: trust.confidence,
    needs_human_review: trust.needs_human_review,
    review_reason: trust.review_reason,
    authentic_signals: trust.authentic_signals,
    scam_signals: trust.scam_signals,
    input_quality: trust.input_quality
  };
}

function detectScamSignals(lower) {
  const checks = [
    ["gift card", "Mentions gift cards."],
    ["crypto", "Mentions cryptocurrency payment."],
    ["bank transfer", "Requests bank transfer."],
    ["act now", "Uses urgent pressure wording."],
    ["final warning", "Uses urgent warning language."],
    ["share your password", "Requests password or secret details."]
  ];

  return checks.filter(([needle]) => lower.includes(needle)).map(([, label]) => label);
}

function detectAuthenticSignals(lower, fileMeta) {
  const signals = [];
  if ((fileMeta.mimeType || "").includes("pdf")) signals.push("Uploaded as PDF.");
  if (lower.includes("reference")) signals.push("Contains reference details.");
  if (/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/.test(lower)) signals.push("Contains a date format.");
  return signals;
}

function detectInputQuality(text) {
  const cleaned = String(text || "").trim();
  if (!cleaned || cleaned.length < 40) return "poor";
  if (cleaned.length < 160) return "borderline";
  return "good";
}

function looksTemplate(text) {
  return /\[[^\]]+\]|{[^}]+}|insert name|insert date|template/i.test(text);
}

function looksOutgoing(lower) {
  return lower.includes("yours sincerely") || lower.includes("i am writing to") || lower.includes("from our team");
}

function looksUnsupported(mimeType, text) {
  if (!mimeType) return false;
  const supported = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];
  return !supported.includes(mimeType) || (!String(text || "").trim() && mimeType !== "text/plain");
}

function guessSender(text) {
  const match = String(text || "").match(/\b(HMRC|NHS|Council|University|Employer|Department)\b/i);
  return match ? match[0] : null;
}

function collectEvidenceSnippets(text, scamSignals, authenticSignals) {
  const snippets = [];
  if (scamSignals.length > 0) snippets.push("Suspicious wording detected in document text.");
  if (authenticSignals.length > 0) snippets.push("Formal structure markers are present.");
  if (String(text || "").length < 40) snippets.push("Text appears incomplete.");
  return snippets;
}

function extractDeadline(text) {
  const dateMatch = String(text || "").match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/);
  if (dateMatch) return dateMatch[0];
  return null;
}

function extractActions(text) {
  const lower = String(text || "").toLowerCase();
  const actions = [];

  if (lower.includes("pay")) actions.push("Pay the amount if the document is verified.");
  if (lower.includes("contact")) actions.push("Contact the sender through verified official details.");
  if (lower.includes("attend")) actions.push("Attend the appointment or meeting if confirmed.");
  if (lower.includes("reply")) actions.push("Reply with the required information.");

  if (actions.length === 0) {
    return ["No action needed right now."];
  }

  return actions;
}

function inferSummary(text, trust) {
  if (trust.document_type === "template") return "This appears to be a template document.";
  if (trust.document_type === "outgoing") return "This appears to be an outgoing document.";
  if (trust.document_type === "possible_scam") return "This appears to be suspicious.";
  if (trust.input_quality === "poor") return "Only part of this document is readable.";
  return "This appears to be a formal document.";
}

function inferMostImportantPoint(text, trust) {
  if (trust.processing_mode === "verification_only") {
    return "Check the document first before doing anything else.";
  }

  const deadline = extractDeadline(text);
  if (deadline) return `A key date appears in this document: ${deadline}.`;
  return "Read the main request and check the reference details.";
}

function inferRisk(text, trust) {
  if (trust.processing_mode === "verification_only") {
    return "You may be tricked into unsafe payment or data sharing.";
  }

  if (trust.input_quality === "poor") {
    return "Important details may be missing from unreadable sections.";
  }

  return "Ignoring this could cause follow-up action from the sender.";
}

function inferHelpfulNote(text, trust) {
  if (trust.document_type === "template") return "Some fields may be missing in this template.";
  if (trust.document_type === "outgoing") return "This looks like a document sent by you or your organisation.";
  if (trust.input_quality === "poor") return "Not clearly stated. A clearer upload may help.";
  return "Check details against the original document before acting.";
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
  return emailMatches;
}

function cleanLine(value) {
  return String(value || "Not clearly stated.").replace(/\s+/g, " ").trim();
}

function normalizeActionLine(actions) {
  if (!Array.isArray(actions) || actions.length === 0) return "No action needed right now.";
  const first = cleanLine(actions[0]);
  const startsWithVerb = /^(Pay|Call|Contact|Reply|Attend|Check|Verify|Send|Complete|Read|Use)\b/i.test(first);
  if (startsWithVerb) return first;
  if (/^No action needed right now\./i.test(first)) return "No action needed right now.";
  return `Check: ${first}`;
}

function statusFromTrust(trust) {
  if (trust.processing_mode === "verification_only") return "urgent";
  if (trust.processing_mode === "unsupported") return "caution";
  if (trust.trust_assessment === "low") return "caution";
  if (trust.trust_assessment === "medium") return "normal";
  return "good";
}

module.exports = { runClearStepsEngine };
