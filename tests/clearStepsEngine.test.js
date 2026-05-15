const test = require("node:test");
const assert = require("node:assert/strict");

const { runClearStepsEngine } = require("../src/services/clearStepsEngine");

function actionStartsWithVerbOrNoAction(text) {
  return /^(Pay|Call|Contact|Reply|Attend|Check|Verify|Send|Complete|Read|Use)\b/i.test(text) ||
    /^No action needed right now\./i.test(text);
}

test("Normal HMRC style payment letter returns six cards", () => {
  const text = [
    "HMRC Payment Notice",
    "Reference: ref-abc123",
    "Please pay 125.00 by 15/06/2026.",
    "Contact HMRC if you need support."
  ].join("\n");

  const run = runClearStepsEngine({
    extractedText: text,
    fileMeta: { mimeType: "application/pdf", selectedCategory: "auto" }
  });

  assert.equal(run.api_output.cards.length, 6);
  assert.equal(actionStartsWithVerbOrNoAction(run.api_output.cards[2].short_answer), true);
});

test("NHS appointment letter returns six cards with appointment style action", () => {
  const text = [
    "NHS Appointment Letter",
    "Your appointment is on 20/06/2026.",
    "Please attend the clinic and bring ID."
  ].join("\n");

  const run = runClearStepsEngine({
    extractedText: text,
    fileMeta: { mimeType: "application/pdf", selectedCategory: "medical" }
  });

  assert.equal(run.api_output.cards.length, 6);
  assert.equal(actionStartsWithVerbOrNoAction(run.api_output.cards[2].short_answer), true);
});

test("Work warning letter returns six cards", () => {
  const text = [
    "Work Warning",
    "We are writing about your attendance.",
    "Please contact your manager immediately."
  ].join("\n");

  const run = runClearStepsEngine({
    extractedText: text,
    fileMeta: { mimeType: "application/pdf", selectedCategory: "work" }
  });

  assert.equal(run.api_output.cards.length, 6);
  assert.equal(actionStartsWithVerbOrNoAction(run.api_output.cards[2].short_answer), true);
});

test("Template with missing fields is marked as template", () => {
  const text = [
    "Template letter",
    "Dear [Name],",
    "Please complete by [Date]."
  ].join("\n");

  const run = runClearStepsEngine({
    extractedText: text,
    fileMeta: { mimeType: "application/pdf", selectedCategory: "auto" }
  });

  assert.equal(run.api_output.trust.document_type, "template");
  assert.equal(run.api_output.cards.length, 6);
});

test("Possible scam payment letter uses verification_only", () => {
  const text = [
    "Final warning.",
    "Act now.",
    "Pay by bank transfer today.",
    "Use this private link."
  ].join("\n");

  const run = runClearStepsEngine({
    extractedText: text,
    fileMeta: { mimeType: "application/pdf", selectedCategory: "auto" }
  });

  assert.equal(run.api_output.trust.processing_mode, "verification_only");
  assert.equal(run.api_output.cards.length, 6);

  const dueCard = run.api_output.cards.find((card) => card.id === "when_is_it_due");
  assert.equal(dueCard.short_answer, "No deadline clearly stated.");
});
