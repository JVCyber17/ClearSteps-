const test = require("node:test");
const assert = require("node:assert/strict");

const { runClearStepsEngine } = require("../src/services/clearStepsEngine");
const {
  applyAiStructuredResult,
  normalizeAiErrorCode,
  summarizeValidationErrors
} = require("../src/services/aiStructuredResultService");
const {
  sanitizeStructuredResult,
  validateStructuredResult
} = require("../src/utils/validateStructuredResult");

function buildRulesRun() {
  return runClearStepsEngine({
    extractedText: [
      "NHS appointment letter",
      "Your appointment is booked for 20 June 2026.",
      "Please attend the clinic and bring photo ID."
    ].join("\n"),
    fileMeta: {
      jobId: "test-job-id",
      anonymousSessionId: "anon-test-id",
      mimeType: "application/pdf",
      selectedCategory: "medical"
    }
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("AI layer keeps rules output when OPENAI_API_KEY is missing", async () => {
  const originalApiKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  try {
    const rulesRun = buildRulesRun();
    const fallbackStructuredResult = rulesRun.api_output.structured_result;

    const result = await applyAiStructuredResult({
      rulesRun,
      extractedText: "NHS appointment letter with a clear appointment date."
    });

    assert.equal(result.api_output.structured_result, fallbackStructuredResult);
    assert.equal(result.api_output.cards.length, 6);
    assert.equal(result.api_output.debug.ai.ai_used, false);
    assert.equal(result.api_output.debug.ai.ai_status, "skipped");
    assert.equal(result.api_output.debug.ai.ai_error_code, "missing_api_key");
  } finally {
    if (originalApiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalApiKey;
    }
  }
});

test("structured result validation rejects unsafe action advice", () => {
  const fallback = buildRulesRun().api_output.structured_result;
  const unsafeCandidate = clone(fallback);

  unsafeCandidate.cards[2].simple_explanation = "You should pay now.";

  const validation = validateStructuredResult(unsafeCandidate, fallback);

  assert.equal(validation.valid, false);
  assert.match(validation.errors.join("\n"), /unsafe advice/i);
});

test("structured result sanitiser preserves anonymous session and privacy flags", () => {
  const fallback = buildRulesRun().api_output.structured_result;
  const candidate = clone(fallback);

  candidate.session_id = "changed-session-id";
  candidate.anonymous_session_id = "changed-anonymous-id";
  candidate.privacy.original_file_stored = true;
  candidate.privacy.ocr_text_stored = true;
  candidate.privacy.document_text_stored = true;
  candidate.privacy.personal_details_stored = true;

  const sanitized = sanitizeStructuredResult(candidate, fallback);
  const validation = validateStructuredResult(sanitized, fallback);

  assert.equal(validation.valid, true);
  assert.equal(sanitized.session_id, fallback.session_id);
  assert.equal(sanitized.anonymous_session_id, fallback.anonymous_session_id);
  assert.deepEqual(sanitized.privacy, {
    original_file_stored: false,
    ocr_text_stored: false,
    document_text_stored: false,
    personal_details_stored: false
  });
});

test("structured result sanitiser falls back when AI output is unsafe", () => {
  const fallback = buildRulesRun().api_output.structured_result;
  const unsafeCandidate = clone(fallback);

  unsafeCandidate.cards[2].simple_explanation = "Click this link and make a payment.";

  const sanitized = sanitizeStructuredResult(unsafeCandidate, fallback);

  assert.equal(sanitized, fallback);
});

test("AI error normalizer maps DOM abort code 20 to timeout", () => {
  assert.equal(normalizeAiErrorCode({ name: "AbortError", code: 20 }), "ai_timeout");
  assert.equal(normalizeAiErrorCode({ code: "20" }), "ai_timeout");
});

test("AI validation summary is safe and compact", () => {
  const summary = summarizeValidationErrors([
    "missing field: structured_result.cards",
    "card what_do_i_need_to_do contains unsafe advice"
  ]);

  assert.deepEqual(summary, [
    "missing field: structured_result.cards",
    "card what_do_i_need_to_do contains unsafe advice"
  ]);
});
