const ALLOWED_DOCUMENT_TYPES = new Set([
  "council_tax_notice",
  "energy_bill",
  "unknown",
  "unsupported"
]);

const ALLOWED_CONFIDENCE = new Set(["high", "medium", "low", "unknown"]);
const ALLOWED_RISK_LEVELS = new Set(["low", "medium", "high", "unknown"]);
const ALLOWED_PROCESSING_MODES = new Set(["normal", "caution", "failed"]);
const ALLOWED_STATUSES = new Set(["normal", "caution", "urgent", "good"]);
const ALLOWED_CARD_TYPES = new Set([
  "what_is_this",
  "who_sent_it",
  "what_matters_most",
  "what_do_i_need_to_do",
  "when_does_it_matter",
  "what_should_i_check",
  "what_if_i_feel_stuck"
]);

const REQUIRED_CARD_IDS = [
  "what_is_this",
  "what_matters_most",
  "what_do_i_need_to_do",
  "when_is_it_due",
  "what_could_happen",
  "helpful_note"
];

const UNSAFE_ADVICE_PATTERNS = [
  /\byou should pay\b/i,
  /\bpay now\b/i,
  /\bmake a payment\b/i,
  /\bclick (the|this|any)?\s*link\b/i,
  /\bcall (the|this)?\s*number\b/i,
  /\breply to (the|this)?\s*sender\b/i,
  /\bthis document is genuine\b/i,
  /\bdefinitely genuine\b/i,
  /\bguaranteed safe\b/i,
  /\bignore it\b/i
];

function validateStructuredResult(candidate, fallback) {
  const errors = [];

  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return { valid: false, errors: ["structured_result must be an object"] };
  }

  if (candidate.schema_version !== "clearsteps_structured_v1") {
    errors.push("schema_version must be clearsteps_structured_v1");
  }

  if (!isNonEmptyString(candidate.session_id)) errors.push("session_id is required");
  if (!ALLOWED_DOCUMENT_TYPES.has(candidate.document_type)) errors.push("document_type is not allowed");
  if (!isNonEmptyString(candidate.document_type_label)) errors.push("document_type_label is required");
  if (!ALLOWED_CONFIDENCE.has(candidate.document_type_confidence)) errors.push("document_type_confidence is not allowed");
  if (!ALLOWED_CONFIDENCE.has(candidate.overall_confidence)) errors.push("overall_confidence is not allowed");
  if (!ALLOWED_RISK_LEVELS.has(candidate.risk_level)) errors.push("risk_level is not allowed");
  if (!ALLOWED_PROCESSING_MODES.has(candidate.processing_mode)) errors.push("processing_mode is not allowed");
  if (typeof candidate.needs_user_check !== "boolean") errors.push("needs_user_check must be boolean");

  validateSummary(candidate.summary, errors);
  validateCards(candidate.cards, errors);
  validateWarnings(candidate.warnings, errors);
  validatePrivacy(candidate.privacy, errors);
  validateNoUnsafeAdvice(candidate, errors);
  validateKeepsSession(candidate, fallback, errors);

  return {
    valid: errors.length === 0,
    errors
  };
}

function sanitizeStructuredResult(candidate, fallback) {
  const output = {
    schema_version: "clearsteps_structured_v1",
    session_id: fallback.session_id,
    anonymous_session_id: fallback.anonymous_session_id,
    document_type: pickAllowed(candidate.document_type, ALLOWED_DOCUMENT_TYPES, fallback.document_type),
    document_type_label: cleanText(candidate.document_type_label || fallback.document_type_label, 80),
    document_type_confidence: pickAllowed(candidate.document_type_confidence, ALLOWED_CONFIDENCE, fallback.document_type_confidence),
    overall_confidence: pickAllowed(candidate.overall_confidence, ALLOWED_CONFIDENCE, fallback.overall_confidence),
    risk_level: pickAllowed(candidate.risk_level, ALLOWED_RISK_LEVELS, fallback.risk_level),
    processing_mode: pickAllowed(candidate.processing_mode, ALLOWED_PROCESSING_MODES, fallback.processing_mode),
    needs_user_check: typeof candidate.needs_user_check === "boolean"
      ? candidate.needs_user_check
      : Boolean(fallback.needs_user_check),
    summary: sanitizeSummary(candidate.summary || {}, fallback.summary || {}),
    cards: sanitizeCards(candidate.cards || [], fallback.cards || []),
    warnings: sanitizeWarnings(candidate.warnings || fallback.warnings || []),
    privacy: {
      original_file_stored: false,
      ocr_text_stored: false,
      document_text_stored: false,
      personal_details_stored: false
    }
  };

  const validation = validateStructuredResult(output, fallback);
  if (!validation.valid) {
    return fallback;
  }

  return output;
}

function validateSummary(summary, errors) {
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    errors.push("summary must be an object");
    return;
  }

  ["one_line_summary", "main_action", "main_date", "main_amount"].forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(summary, key)) {
      errors.push(`summary.${key} is required`);
    }
  });
}

function validateCards(cards, errors) {
  if (!Array.isArray(cards) || cards.length !== 6) {
    errors.push("cards must contain exactly six cards");
    return;
  }

  cards.forEach((card, index) => {
    if (!card || typeof card !== "object" || Array.isArray(card)) {
      errors.push(`card ${index + 1} must be an object`);
      return;
    }

    if (card.card_id !== REQUIRED_CARD_IDS[index]) errors.push(`card ${index + 1} has the wrong card_id`);
    if (card.card_number !== index + 1) errors.push(`card ${index + 1} has the wrong card_number`);
    if (!ALLOWED_CARD_TYPES.has(card.card_type)) errors.push(`card ${index + 1} has an invalid card_type`);
    if (!isNonEmptyString(card.title)) errors.push(`card ${index + 1} title is required`);
    if (!isNonEmptyString(card.simple_explanation)) errors.push(`card ${index + 1} simple_explanation is required`);
    if (!Array.isArray(card.key_points)) errors.push(`card ${index + 1} key_points must be an array`);
    if (!Object.prototype.hasOwnProperty.call(card, "action_needed")) errors.push(`card ${index + 1} action_needed is required`);
    if (!Object.prototype.hasOwnProperty.call(card, "possible_deadline")) errors.push(`card ${index + 1} possible_deadline is required`);
    if (!Object.prototype.hasOwnProperty.call(card, "possible_payment")) errors.push(`card ${index + 1} possible_payment is required`);
    if (!ALLOWED_CONFIDENCE.has(card.confidence_level)) errors.push(`card ${index + 1} confidence_level is invalid`);
    if (!Object.prototype.hasOwnProperty.call(card, "warning")) errors.push(`card ${index + 1} warning is required`);
    if (!isNonEmptyString(card.read_aloud_text)) errors.push(`card ${index + 1} read_aloud_text is required`);
    if (!ALLOWED_STATUSES.has(card.status)) errors.push(`card ${index + 1} status is invalid`);
  });
}

function validateWarnings(warnings, errors) {
  if (!Array.isArray(warnings)) errors.push("warnings must be an array");
}

function validatePrivacy(privacy, errors) {
  const expected = {
    original_file_stored: false,
    ocr_text_stored: false,
    document_text_stored: false,
    personal_details_stored: false
  };

  if (!privacy || typeof privacy !== "object" || Array.isArray(privacy)) {
    errors.push("privacy must be an object");
    return;
  }

  Object.entries(expected).forEach(([key, value]) => {
    if (privacy[key] !== value) errors.push(`privacy.${key} must be false`);
  });
}

function validateNoUnsafeAdvice(candidate, errors) {
  const text = JSON.stringify(candidate);
  UNSAFE_ADVICE_PATTERNS.forEach((pattern) => {
    if (pattern.test(text)) errors.push(`unsafe advice matched ${pattern}`);
  });
}

function validateKeepsSession(candidate, fallback, errors) {
  if (!fallback) return;
  if (candidate.session_id !== fallback.session_id) errors.push("session_id must not change");
  if (candidate.anonymous_session_id !== fallback.anonymous_session_id) {
    errors.push("anonymous_session_id must not change");
  }
}

function sanitizeSummary(candidate, fallback) {
  return {
    one_line_summary: cleanNullableText(candidate.one_line_summary ?? fallback.one_line_summary, 180),
    main_action: cleanNullableText(candidate.main_action ?? fallback.main_action, 180),
    main_date: cleanNullableText(candidate.main_date ?? fallback.main_date, 80),
    main_amount: cleanNullableText(candidate.main_amount ?? fallback.main_amount, 80)
  };
}

function sanitizeCards(cards, fallbackCards) {
  return REQUIRED_CARD_IDS.map((cardId, index) => {
    const candidate = cards[index] || {};
    const fallback = fallbackCards[index] || {};
    const keyPoints = Array.isArray(candidate.key_points) ? candidate.key_points : fallback.key_points;
    const title = cleanText(candidate.title || fallback.title, 80);
    const simpleExplanation = cleanText(candidate.simple_explanation || fallback.simple_explanation, 220);
    const safeKeyPoints = Array.isArray(keyPoints)
      ? keyPoints.map((point) => cleanText(point, 140)).filter(Boolean).slice(0, 4)
      : [];

    return {
      card_id: cardId,
      card_number: index + 1,
      card_type: pickAllowed(candidate.card_type, ALLOWED_CARD_TYPES, fallback.card_type),
      title,
      simple_explanation: simpleExplanation,
      key_points: safeKeyPoints,
      action_needed: cleanNullableText(candidate.action_needed ?? fallback.action_needed, 180),
      possible_deadline: cleanNullableText(candidate.possible_deadline ?? fallback.possible_deadline, 80),
      possible_payment: cleanNullableText(candidate.possible_payment ?? fallback.possible_payment, 80),
      confidence_level: pickAllowed(candidate.confidence_level, ALLOWED_CONFIDENCE, fallback.confidence_level),
      warning: cleanNullableText(candidate.warning ?? fallback.warning, 180),
      read_aloud_text: cleanText(candidate.read_aloud_text || fallback.read_aloud_text || `${title}. ${simpleExplanation}`, 320),
      status: pickAllowed(candidate.status, ALLOWED_STATUSES, fallback.status)
    };
  });
}

function sanitizeWarnings(warnings) {
  return Array.isArray(warnings)
    ? warnings.map((warning) => cleanText(warning, 180)).filter(Boolean).slice(0, 5)
    : [];
}

function pickAllowed(value, allowedValues, fallback) {
  const cleaned = cleanText(value, 80).toLowerCase();
  if (allowedValues.has(cleaned)) return cleaned;
  return fallback;
}

function cleanText(value, maxLength) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanNullableText(value, maxLength) {
  if (value === null || value === undefined || value === "") return null;
  return cleanText(value, maxLength) || null;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

module.exports = {
  validateStructuredResult,
  sanitizeStructuredResult,
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_CARD_TYPES
};
