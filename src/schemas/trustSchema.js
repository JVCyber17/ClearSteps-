const trustSchema = {
  trust_assessment: ["high", "medium", "low"],
  document_type: ["official_incoming", "outgoing", "template", "possible_scam", "unsupported", "unknown"],
  processing_mode: ["normal", "caution", "verification_only", "unsupported"],
  confidence: ["high", "medium", "low"],
  needs_human_review: "boolean",
  review_reason: "string",
  authentic_signals: "array",
  scam_signals: "array",
  sender_guess: ["string", "null"],
  is_multi_letter_input: "boolean",
  input_quality: ["good", "borderline", "poor"],
  evidence_snippets: "array"
};

module.exports = { trustSchema };
