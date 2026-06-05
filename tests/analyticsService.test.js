const assert = require("node:assert/strict");
const test = require("node:test");

const { buildAnalyticsEventRow } = require("../src/services/analyticsService");

test("analytics accepts a safe client session field but stores the backend session id", () => {
  const row = buildAnalyticsEventRow(
    {
      event_name: "upload_started",
      anonymous_session_id: "client-session-ignored",
      client_job_id: "job-123",
      page: "journey",
      section: "upload",
      card_number: 1,
      card_type: "what_is_this",
      document_type: "letter",
      input_quality: "good",
      ai_status: "success",
      ocr_status: "completed",
      created_at: "2026-06-05T10:00:00.000Z"
    },
    { anonymousSessionId: "server-session-kept" }
  );

  assert.equal(row.event_name, "upload_started");
  assert.equal(row.page, "journey");
  assert.equal(row.metadata.anonymous_session_id, "server-session-kept");
  assert.equal(row.metadata.client_job_id, "job-123");
});

test("analytics rejects unknown unsafe fields", () => {
  assert.throws(
    () =>
      buildAnalyticsEventRow(
        {
          event_name: "upload_started",
          document_text: "do not store document text"
        },
        { anonymousSessionId: "server-session" }
      ),
    /Unknown analytics fields/
  );
});

test("analytics rejects unknown event names", () => {
  assert.throws(
    () =>
      buildAnalyticsEventRow(
        {
          event_name: "document_text_uploaded"
        },
        { anonymousSessionId: "server-session" }
      ),
    /not allowed/
  );
});
