function runLetterPipeline({ extractedText, fileMeta }) {
  const trust = evaluateTrust(extractedText, fileMeta);
  const structuredOutput = extractStructuredLetter(extractedText, trust);
  const userOutput = renderForUser(structuredOutput);

  return { structuredOutput, userOutput };
}

function evaluateTrust(text, fileMeta) {
  const lowerText = text.toLowerCase();
  const scamSignals = findScamSignals(lowerText);
  const inputQuality = text.trim().length < 40 ? "poor" : "good";
  const isTemplate = /\[[^\]]+\]|{[^}]+}|insert name|lorem ipsum/i.test(text);
  const isOutgoing = /yours sincerely|i am writing to|please find attached/i.test(text);

  let documentType = "official";
  let processingMode = "normal";
  let confidence = "medium";
  let reviewReason = "";

  if (inputQuality === "poor") {
    documentType = "unclear";
    processingMode = "unsupported";
    confidence = "low";
    reviewReason = "The upload is not clear enough to read.";
  } else if (isTemplate) {
    documentType = "template";
    processingMode = "caution";
    reviewReason = "The document looks like a template or has missing fields.";
  } else if (isOutgoing) {
    documentType = "outgoing";
    processingMode = "caution";
    reviewReason = "The document may be a letter written by the user.";
  }

  if (scamSignals.length > 0) {
    documentType = "suspicious";
    processingMode = "verification_only";
    confidence = "medium";
    reviewReason = "The document contains wording that can appear in scams.";
  }

  return {
    trust_assessment: trustLabelForMode(processingMode),
    document_type: documentType,
    processing_mode: processingMode,
    authentic_signals: findOfficialSignals(lowerText, fileMeta),
    scam_signals: scamSignals,
    confidence,
    needs_human_review: inputQuality === "poor" || processingMode === "verification_only",
    review_reason: reviewReason,
    sender_guess: null,
    is_multi_letter_input: false,
    input_quality: inputQuality
  };
}

function extractStructuredLetter(text, trust) {
  if (trust.input_quality === "poor") {
    return {
      summary: "I cannot read this clearly.",
      action: "Upload a clearer PDF or image.",
      deadline: "Unknown.",
      risk: "Important details may be missed.",
      note: "Use a sharp photo with all pages visible.",
      trust_assessment: trust.trust_assessment,
      confidence: "low",
      needs_human_review: true,
      review_reason: trust.review_reason
    };
  }

  if (trust.processing_mode === "verification_only") {
    return {
      summary: "This letter looks suspicious.",
      action: "Check it using an official website or known phone number.",
      deadline: "Do not rush.",
      risk: "It may be trying to pressure you.",
      note: "Do not use links or phone numbers from the letter until checked.",
      trust_assessment: trust.trust_assessment,
      confidence: trust.confidence,
      needs_human_review: true,
      review_reason: trust.review_reason
    };
  }

  return {
    summary: "This looks like a formal letter.",
    action: "Read the original letter before taking action.",
    deadline: extractDeadline(text),
    risk: "Missing a real deadline could cause problems.",
    note: noteForTrust(trust),
    trust_assessment: trust.trust_assessment,
    confidence: trust.confidence,
    needs_human_review: trust.needs_human_review,
    review_reason: trust.review_reason
  };
}

function renderForUser(structured) {
  const warning =
    structured.trust_assessment === "suspicious"
      ? "Warning: this looks suspicious. Check it first."
      : "";

  return {
    warning,
    summary: simpleLine(structured.summary),
    action: simpleLine(structured.action),
    deadline: simpleLine(structured.deadline),
    risk: simpleLine(structured.risk),
    note: simpleLine(structured.note)
  };
}

function findScamSignals(lowerText) {
  const checks = [
    ["gift card", "Asks for gift cards."],
    ["crypto", "Mentions crypto payment."],
    ["password", "Asks for a password."],
    ["pin number", "Asks for a PIN."],
    ["bank transfer", "Asks for a bank transfer."],
    ["act now", "Uses urgent pressure."],
    ["final warning", "Uses urgent pressure."],
    ["remote access", "Asks for remote access."]
  ];

  return checks
    .filter(([needle]) => lowerText.includes(needle))
    .map(([, label]) => label);
}

function findOfficialSignals(lowerText, fileMeta) {
  const signals = [];

  if (fileMeta.mimeType === "application/pdf") {
    signals.push("Uploaded as a PDF.");
  }

  if (lowerText.includes("reference") || lowerText.includes("account number")) {
    signals.push("Includes a reference or account number.");
  }

  if (/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/.test(lowerText)) {
    signals.push("Includes a date.");
  }

  return signals;
}

function extractDeadline(text) {
  const dateMatch = text.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/);
  if (dateMatch) return dateMatch[0];
  return "No clear deadline found.";
}

function noteForTrust(trust) {
  if (trust.document_type === "template") {
    return "Some fields may be missing.";
  }

  if (trust.document_type === "outgoing") {
    return "This may be a letter you wrote.";
  }

  return "This does not prove the letter is genuine.";
}

function trustLabelForMode(mode) {
  if (mode === "verification_only") return "suspicious";
  if (mode === "unsupported") return "unclear";
  if (mode === "caution") return "needs caution";
  return "looks consistent";
}

function simpleLine(value) {
  if (!value || typeof value !== "string") return "Unknown.";
  return value.trim().replace(/\s+/g, " ");
}

module.exports = { runLetterPipeline };
