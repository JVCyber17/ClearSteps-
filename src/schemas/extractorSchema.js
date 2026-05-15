const extractorSchema = {
  summary: "string",
  most_important_point: "string",
  actions: "array",
  deadline: ["string", "null"],
  risk: ["string", "null"],
  helpful_note: ["string", "null"],
  money_amounts: "array",
  reference_numbers: "array",
  contact_details: "array",
  appeal_rights: "array",
  support_options: "array",
  confidence: ["high", "medium", "low"],
  needs_human_review: "boolean",
  review_reason: "string",
  evidence_spans: "array"
};

module.exports = { extractorSchema };
