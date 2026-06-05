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
  const structuredResult = buildStructuredResult({
    jobId,
    anonymousSessionId: fileMeta.anonymousSessionId || null,
    text: primaryText,
    trust,
    extraction,
    displayCards: cards
  });

  const output = {
    job_id: jobId,
    trust: toPublicTrustShape(trust),
    cards,
    structured_result: structuredResult,
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
    if (trust.input_quality !== "poor" && String(text || "").trim().length >= 80) {
      return buildReadableUnsupportedExtraction(text, trust);
    }

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
  if (shouldUseReadableUnsupportedAid(text, trust)) {
    return buildReadableUnsupportedExtraction(text, trust);
  }

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
    money_amounts: [],
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

  if (extraction.readable_unsupported_signals) {
    return buildReadableUnsupportedCards({ trust, extraction, cardStatus, actionLine });
  }

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

function buildReadableUnsupportedExtraction(text, trust) {
  const signals = extractReadableDocumentSignals(text, trust);
  const summary = `This appears to be a readable official or formal document about ${signals.topic}. ClearSteps is not fully trained for this document type yet, so use this as a reading aid only.`;
  const hasClearNoAction = clearlySaysNoActionNeeded(text);
  const actions = hasClearNoAction
    ? ["No action needed right now."]
    : ["Check the original document to see whether a response or action is needed."];

  return {
    summary,
    most_important_point: signals.mostImportantPoint,
    actions,
    deadline: signals.primaryDate,
    risk: signals.risk,
    helpful_note: "ClearSteps is not fully trained for this document type yet. Use this as a reading aid, not advice.",
    money_amounts: extractMoneyAmounts(text),
    reference_numbers: [],
    contact_details: [],
    appeal_rights: [],
    support_options: [],
    confidence: trust.input_quality === "good" ? "medium" : "low",
    needs_human_review: true,
    review_reason: "This readable document type is not fully supported yet.",
    evidence_spans: [],
    readable_unsupported_signals: signals
  };
}

function buildReadableUnsupportedCards({ extraction, cardStatus, actionLine }) {
  const signals = extraction.readable_unsupported_signals;
  const status = cardStatus === "good" ? "caution" : cardStatus;

  return [
    {
      id: "what_is_this",
      title: "What is this?",
      short_answer: cleanLine(extraction.summary),
      status
    },
    {
      id: "what_matters_most",
      title: "Who sent it?",
      short_answer: signals.sender
        ? cleanLine(`This appears to be from ${signals.sender}. Check the original document to confirm.`)
        : "The sender is not clearly stated. Check the original document.",
      status
    },
    {
      id: "what_do_i_need_to_do",
      title: "What do I need to do?",
      short_answer: actionLine,
      steps: Array.isArray(extraction.actions) ? extraction.actions.map(cleanLine) : [],
      status
    },
    {
      id: "when_is_it_due",
      title: "When does it matter?",
      short_answer: cleanLine(signals.dateMessage),
      date: signals.primaryDate || null,
      status
    },
    {
      id: "what_could_happen",
      title: "What matters most?",
      short_answer: cleanLine(signals.mostImportantPoint),
      status
    },
    {
      id: "helpful_note",
      title: "What should I check?",
      short_answer: cleanLine(extraction.helpful_note),
      steps: signals.keyChecks,
      status
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
    sender_guess: trust.sender_guess,
    is_template: trust.is_template,
    is_outgoing: trust.is_outgoing,
    is_multi_document: trust.is_multi_document,
    safe_next_step: trust.safe_next_step
  };
}

function buildStructuredResult({ jobId, anonymousSessionId, text, trust, extraction, displayCards }) {
  const documentType = detectStructuredDocumentType({ text, trust });
  const documentTypeConfidence = pickStructuredDocumentTypeConfidence({ documentType, trust });
  const actionLine = normalizeActionLine(extraction.actions);
  const deadline = extraction.deadline || null;
  const moneyAmount = firstOrNull(extraction.money_amounts);

  return {
    schema_version: "clearsteps_structured_v1",
    session_id: jobId,
    anonymous_session_id: anonymousSessionId,
    document_type: documentType,
    document_type_label: labelForStructuredDocumentType(documentType),
    document_type_confidence: documentTypeConfidence,
    overall_confidence: normaliseStructuredConfidence(extraction.confidence || trust.confidence),
    risk_level: normaliseStructuredRiskLevel(trust.severity_level),
    processing_mode: normaliseStructuredProcessingMode(trust.processing_mode),
    needs_user_check: Boolean(
      trust.needs_human_review ||
      trust.processing_mode !== "normal" ||
      ["high", "urgent"].includes(trust.severity_level)
    ),
    summary: {
      one_line_summary: cleanLine(extraction.summary || "Not clearly stated."),
      main_action: actionLine,
      main_date: deadline,
      main_amount: moneyAmount
    },
    cards: buildStructuredCards({ trust, extraction, displayCards }),
    warnings: buildStructuredWarnings(trust),
    privacy: {
      original_file_stored: false,
      ocr_text_stored: false,
      document_text_stored: false,
      personal_details_stored: false
    }
  };
}

function buildStructuredCards({ trust, extraction, displayCards }) {
  const status = statusFromTrustAndSeverity(trust);
  const actionLine = normalizeActionLine(extraction.actions);
  const deadlineText = extraction.deadline ? `Due by ${extraction.deadline}.` : "No deadline clearly stated.";
  const paymentAmount = firstOrNull(extraction.money_amounts);
  const oldCardById = new Map(displayCards.map((card) => [card.id, card]));
  const deadlineDisplayText = oldCardById.get("when_is_it_due")?.short_answer || deadlineText;

  const cardDefinitions = [
    {
      legacyId: "what_is_this",
      cardType: "what_is_this",
      title: "What is this?",
      explanation: oldCardById.get("what_is_this")?.short_answer || extraction.summary,
      keyPoints: [extraction.most_important_point],
      actionNeeded: null
    },
    {
      legacyId: "what_matters_most",
      cardType: "what_matters_most",
      title: "What matters most?",
      explanation: oldCardById.get("what_matters_most")?.short_answer || inferMostImportantPoint(trust),
      keyPoints: trust.severity_signals,
      actionNeeded: null
    },
    {
      legacyId: "what_do_i_need_to_do",
      cardType: "what_do_i_need_to_do",
      title: "What do I need to do?",
      explanation: actionLine,
      keyPoints: Array.isArray(extraction.actions) ? extraction.actions : [],
      actionNeeded: actionLine
    },
    {
      legacyId: "when_is_it_due",
      cardType: "when_does_it_matter",
      title: "When is it due?",
      explanation: deadlineDisplayText,
      keyPoints: extraction.deadline ? [`Check this date on the original document: ${extraction.deadline}.`] : [],
      actionNeeded: null,
      possibleDeadline: extraction.deadline || null
    },
    {
      legacyId: "what_could_happen",
      cardType: "what_should_i_check",
      title: "What should I check?",
      explanation: "Check key details on the original document.",
      keyPoints: buildCheckKeyPoints({ trust, extraction }),
      actionNeeded: null,
      possiblePayment: paymentAmount
    },
    {
      legacyId: "helpful_note",
      cardType: "what_if_i_feel_stuck",
      title: "Helpful note",
      explanation: oldCardById.get("helpful_note")?.short_answer || inferHelpfulNote(trust, extraction.helpful_note),
      keyPoints: [trust.safe_next_step],
      actionNeeded: trust.safe_next_step || null
    }
  ];

  return cardDefinitions.map((definition, index) => {
    const simpleExplanation = cleanLine(definition.explanation || "Not clearly stated.");
    const keyPoints = normaliseKeyPoints(definition.keyPoints);
    const warning = buildStructuredCardWarning({ trust, cardType: definition.cardType });

    return {
      card_id: definition.legacyId,
      card_number: index + 1,
      card_type: definition.cardType,
      title: definition.title,
      simple_explanation: simpleExplanation,
      key_points: keyPoints,
      action_needed: definition.actionNeeded ? cleanLine(definition.actionNeeded) : null,
      possible_deadline: definition.possibleDeadline || null,
      possible_payment: definition.possiblePayment || null,
      confidence_level: normaliseStructuredConfidence(extraction.confidence || trust.confidence),
      warning,
      read_aloud_text: buildReadAloudText(definition.title, simpleExplanation, keyPoints),
      status
    };
  });
}

function buildCheckKeyPoints({ trust, extraction }) {
  const points = [];

  if (extraction.deadline) points.push(`Date: ${extraction.deadline}.`);
  if (firstOrNull(extraction.money_amounts)) points.push(`Amount shown: ${firstOrNull(extraction.money_amounts)}.`);
  if (trust.processing_mode === "verification_only") {
    points.push("Use official contact details before acting.");
  } else if (trust.needs_human_review) {
    points.push("Check unclear details on the original.");
  }

  if (points.length === 0) points.push("No extra checks clearly stated.");
  return points;
}

function buildStructuredCardWarning({ trust, cardType }) {
  if (trust.processing_mode === "verification_only") {
    return "This may be suspicious. Verify before acting.";
  }

  if (trust.processing_mode === "unsupported") {
    return "This upload may be hard to read.";
  }

  if (cardType === "when_does_it_matter" && !trust.severity_signals.length) {
    return null;
  }

  if (trust.severity_level === "urgent") {
    return "This looks important. Do not ignore it.";
  }

  return null;
}

function buildStructuredWarnings(trust) {
  const warnings = [];

  if (trust.processing_mode === "verification_only") {
    warnings.push("This may be suspicious. Verify using official contact details before acting.");
  }

  if (trust.processing_mode === "unsupported") {
    warnings.push("This document may be hard to read. Upload a clearer copy if possible.");
  }

  if (trust.severity_level === "urgent") {
    warnings.push("This looks important. Check the original document carefully.");
  }

  if (trust.needs_human_review && trust.review_reason) {
    warnings.push(cleanLine(trust.review_reason));
  }

  return unique(warnings);
}

function shouldUseReadableUnsupportedAid(text, trust) {
  if (!text || trust.input_quality === "poor") return false;
  if (trust.processing_mode === "verification_only") return false;
  if (trust.document_type === "template" || trust.document_type === "outgoing" || trust.document_type === "possible_scam") {
    return false;
  }
  return !isFullySupportedDocument(text, trust);
}

function isFullySupportedDocument(text, trust) {
  const lower = String(text || "").toLowerCase();
  if (lower.includes("council tax")) return true;
  if (
    lower.includes("energy bill") ||
    lower.includes("electricity bill") ||
    lower.includes("gas bill") ||
    (trust.document_category === "bill_or_payment" && /\b(energy|electricity|gas)\b/.test(lower))
  ) {
    return true;
  }
  return false;
}

function extractReadableDocumentSignals(text, trust) {
  const value = String(text || "");
  const lower = value.toLowerCase();
  const sender = guessDetailedSender(value) || trust.sender_guess || null;
  const topic = inferReadableTopic(value, trust);
  const visibleDates = extractVisibleDates(value);
  const visibleTimeframes = extractVisibleTimeframes(value);
  const dateParts = unique([...visibleDates, ...visibleTimeframes]).slice(0, 4);
  const hasResponseRequest = /\b(please respond|respond by|response|reply by|submit|provide|return|complete|consultation|representation|comment|contact)\b/i.test(value);
  const hasDeadlineLanguage = /\b(deadline|due by|by no later than|no later than|before|within|reply by|respond by|return by|submit by|complete by)\b/i.test(value);
  const primaryDate = dateParts[0] || null;

  const mostImportantPoint = buildReadableMostImportantPoint({
    topic,
    dateParts,
    hasResponseRequest,
    hasDeadlineLanguage
  });

  return {
    sender,
    topic,
    dateParts,
    primaryDate,
    hasResponseRequest,
    hasDeadlineLanguage,
    mostImportantPoint,
    dateMessage: buildReadableDateMessage({ dateParts, hasDeadlineLanguage }),
    risk: buildReadableRiskMessage({ dateParts, hasResponseRequest, hasDeadlineLanguage }),
    keyChecks: buildReadableKeyChecks({ sender, topic, dateParts, hasResponseRequest })
  };
}

function buildReadableMostImportantPoint({ topic, dateParts, hasResponseRequest, hasDeadlineLanguage }) {
  if (hasDeadlineLanguage && dateParts.length > 0) {
    return `This may include a deadline about ${topic}. Check the original before acting.`;
  }
  if (hasResponseRequest) {
    return `This may ask for a response about ${topic}. Check the original document.`;
  }
  if (dateParts.length > 0) {
    return `Important dates are visible. Check what each date refers to.`;
  }
  return `The clearest topic appears to be ${topic}. Check the original for details.`;
}

function buildReadableDateMessage({ dateParts, hasDeadlineLanguage }) {
  if (dateParts.length === 0) {
    return "No clear date was found. Check the original document.";
  }

  const visibleText = dateParts.slice(0, 3).join(", ");
  if (hasDeadlineLanguage) {
    return `These may be important dates: ${visibleText}. Check what they refer to.`;
  }
  return `These dates appear in the document: ${visibleText}. Check what they refer to.`;
}

function buildReadableRiskMessage({ dateParts, hasResponseRequest, hasDeadlineLanguage }) {
  if (hasDeadlineLanguage || hasResponseRequest) {
    return "You may miss a response request or important date.";
  }
  if (dateParts.length > 0) {
    return "You may miss what the visible dates mean.";
  }
  return "Not clearly stated. Check the original document.";
}

function buildReadableKeyChecks({ sender, topic, dateParts, hasResponseRequest }) {
  const checks = [];
  checks.push(sender ? `Check the sender: ${sender}.` : "Check who sent the document.");
  checks.push(`Check the topic: ${topic}.`);
  if (dateParts.length > 0) checks.push(`Check these visible dates: ${dateParts.slice(0, 3).join(", ")}.`);
  if (hasResponseRequest) checks.push("Check whether a response is requested.");
  checks.push("Use official contact details before acting.");
  return unique(checks).slice(0, 5);
}

function inferReadableTopic(text, trust) {
  const lower = String(text || "").toLowerCase();
  const topicChecks = [
    [["local plan", "planning", "consultation"], "a local plan or consultation"],
    [["urgent care centre", "healthcare", "nhs"], "healthcare services"],
    [["appointment", "clinic"], "an appointment"],
    [["school", "trip", "student"], "school or education"],
    [["employment", "attendance", "manager"], "work or employment"],
    [["rent", "landlord", "tenancy"], "housing or rent"],
    [["loan", "bank", "mortgage"], "banking or a loan"],
    [["insurance", "policy", "claim"], "insurance"],
    [["benefit", "universal credit"], "benefits support"],
    [["court", "tribunal", "legal"], "a legal or court matter"],
    [["council", "borough"], "a council or local authority matter"],
    [["hmrc", "tax"], "tax or HMRC"],
    [["medical", "hospital", "gp"], "medical information"]
  ];

  for (const [needles, label] of topicChecks) {
    if (needles.some((needle) => lower.includes(needle))) return label;
  }

  const heading = firstMeaningfulHeading(text);
  if (heading) return heading.toLowerCase();

  const categoryLabels = {
    appointment: "an appointment",
    employment: "work or employment",
    education: "school or education",
    housing: "housing or rent",
    bank_or_loan: "banking or a loan",
    government: "a government or council matter",
    medical: "medical information",
    legal_or_court: "a legal or court matter",
    benefits: "benefits support",
    insurance: "insurance",
    email: "an email message",
    unknown: "the topic shown in the document",
    unsupported: "the topic shown in the document"
  };

  return categoryLabels[trust.document_category] || "the topic shown in the document";
}

function firstMeaningfulHeading(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => cleanLine(line))
    .filter(Boolean)
    .slice(0, 12);

  return lines.find((line) => (
    line.length >= 6 &&
    line.length <= 70 &&
    !/\b(dear|tel|telephone|email|address|postcode|reference|ref:)\b/i.test(line) &&
    !/\b\d{1,2}(?:st|nd|rd|th)?\s+[a-z]+\s+\d{4}\b/i.test(line) &&
    !/^\d/.test(line)
  )) || null;
}

function guessDetailedSender(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => cleanLine(line))
    .filter(Boolean)
    .slice(0, 14);

  const senderLine = lines.find((line) => (
    /\b(HMRC|NHS|Council|Borough|County|University|School|College|Department|Authority|Bank|Court|Hospital|Clinic|Trust|Employer|Landlord)\b/i.test(line) &&
    line.length <= 90 &&
    !/\b(email|telephone|tel|floor|street|road|postcode)\b/i.test(line)
  ));

  return senderLine || null;
}

function extractVisibleDates(text) {
  const value = String(text || "");
  const matches = [];

  const patterns = [
    /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g,
    /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{2,4}\b/gi,
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{2,4}\b/gi
  ];

  patterns.forEach((pattern) => {
    const found = value.match(pattern) || [];
    found.forEach((match) => matches.push(cleanLine(match)));
  });

  return unique(matches).slice(0, 5);
}

function extractVisibleTimeframes(text) {
  const value = String(text || "");
  const matches = value.match(/\bwithin\s+\d+\s+(?:day|days|week|weeks|month|months)|\b(?:today|tomorrow|next week|next month)\b/gi) || [];
  return unique(matches.map(cleanLine)).slice(0, 3);
}

function clearlySaysNoActionNeeded(text) {
  return /\b(no action needed|no action is needed|you do not need to do anything|for information only)\b/i.test(String(text || ""));
}

function detectStructuredDocumentType({ text, trust }) {
  if (trust.processing_mode === "unsupported" || trust.document_category === "unsupported") {
    return "unsupported";
  }

  const lower = String(text || "").toLowerCase();
  if (lower.includes("council tax")) return "council_tax_notice";
  if (
    lower.includes("energy bill") ||
    lower.includes("electricity bill") ||
    lower.includes("gas bill") ||
    (trust.document_category === "bill_or_payment" && /\b(energy|electricity|gas)\b/.test(lower))
  ) {
    return "energy_bill";
  }

  return "unknown";
}

function labelForStructuredDocumentType(documentType) {
  const labels = {
    council_tax_notice: "Council tax notice",
    energy_bill: "Energy bill",
    unknown: "Unknown document",
    unsupported: "Unsupported document"
  };
  return labels[documentType] || labels.unknown;
}

function pickStructuredDocumentTypeConfidence({ documentType, trust }) {
  if (documentType === "unsupported") return "low";
  if (documentType === "unknown") return "unknown";
  if (trust.input_quality === "good") return "high";
  if (trust.input_quality === "borderline") return "medium";
  return "low";
}

function normaliseStructuredConfidence(value) {
  const confidence = String(value || "").toLowerCase();
  if (["high", "medium", "low"].includes(confidence)) return confidence;
  return "unknown";
}

function normaliseStructuredRiskLevel(value) {
  const severity = String(value || "").toLowerCase();
  if (severity === "urgent") return "high";
  if (["low", "medium", "high"].includes(severity)) return severity;
  return "unknown";
}

function normaliseStructuredProcessingMode(value) {
  const mode = String(value || "").toLowerCase();
  if (mode === "normal") return "normal";
  if (mode === "caution" || mode === "verification_only") return "caution";
  return "failed";
}

function normaliseKeyPoints(points) {
  if (!Array.isArray(points)) return [];
  return unique(points.map(cleanLine).filter(Boolean)).slice(0, 4);
}

function buildReadAloudText(title, simpleExplanation, keyPoints) {
  const extra = keyPoints.length > 0 ? ` ${keyPoints.join(" ")}` : "";
  return cleanLine(`${title}. ${simpleExplanation}.${extra}`);
}

function firstOrNull(items) {
  return Array.isArray(items) && items.length > 0 ? cleanLine(items[0]) : null;
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
  const paymentLikeCategory = ["bill_or_payment", "bank_or_loan", "housing"].includes(trust.document_category);
  const explicitPaymentRequest = /\b(pay|payment|settle|amount due|balance due|overdue|arrears|final notice)\b/.test(lower);
  const hasMoneyAmount = extractMoneyAmounts(text).length > 0;

  if (paymentLikeCategory && explicitPaymentRequest && (hasMoneyAmount || /\b(due|overdue|arrears|final notice)\b/.test(lower))) {
    actions.push("Check the payment amount and due date.");
  }
  if (/\b(please contact|contact us|call us|reply by|email us|phone us)\b/.test(lower)) {
    actions.push("Contact the sender using trusted contact details.");
  }
  if (trust.document_category === "appointment" || /\b(must attend|please attend|your appointment|meeting to attend)\b/.test(lower)) {
    actions.push("Attend the appointment or meeting.");
  }
  if (/\b(send us|submit|provide evidence|complete the form|fill in|return the form)\b/.test(lower)) {
    actions.push("Send the requested documents or form.");
  }

  if (actions.length === 0) {
    return ["No action needed right now."];
  }

  return unique(actions);
}

function extractMoneyAmounts(text) {
  return String(text || "").match(/(?:£|GBP)\s?\d+(?:[.,]\d{2})?/gi) || [];
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
