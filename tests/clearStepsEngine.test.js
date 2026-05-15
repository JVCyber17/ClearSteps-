const test = require("node:test");
const assert = require("node:assert/strict");

const { runClearStepsEngine } = require("../src/services/clearStepsEngine");

function runEngine(text, selectedCategory = "auto", mimeType = "application/pdf") {
  return runClearStepsEngine({
    extractedText: text,
    fileMeta: { mimeType, selectedCategory }
  }).api_output;
}

function assertBaseOutput(output) {
  assert.equal(output.cards.length, 6, "six cards are returned");
  assert.ok(output.trust.trust_assessment, "trust_assessment is present");
  assert.ok(output.trust.severity_level, "severity_level is present");
  assert.ok(output.trust.processing_mode, "processing_mode is present");
  assert.ok(output.banner, "banner is present");
}

function assertActionCardShape(output) {
  const actionCard = output.cards.find((card) => card.id === "what_do_i_need_to_do");
  const actionLine = actionCard.short_answer;
  assert.equal(
    /^(Check|Verify|Use|Contact|Attend|Send|Complete|Read|Keep|Upload)\b/i.test(actionLine) ||
      /^No action needed right now\./i.test(actionLine),
    true,
    "action card starts with verb or no-action sentence"
  );
}

function assertNoDangerousVerificationInstructions(output) {
  const actionCard = output.cards.find((card) => card.id === "what_do_i_need_to_do");
  const joined = [actionCard.short_answer, ...(actionCard.steps || [])].join(" ").toLowerCase();
  assert.equal(/\bpay\b/.test(joined), false);
  assert.equal(/\bclick\b/.test(joined), false);
  assert.equal(/\breply\b/.test(joined), false);
}

function assertNoInventedDeadline(output) {
  const deadlineCard = output.cards.find((card) => card.id === "when_is_it_due");
  if (!deadlineCard.date) {
    assert.equal(deadlineCard.short_answer, "No deadline clearly stated.");
  }
}

test("normal electricity bill", () => {
  const output = runEngine([
    "Electricity Bill Statement",
    "Reference: ref-elec-1034",
    "This is your routine bill for May.",
    "Amount due is £89.20 by 25/06/2026."
  ].join("\n"), "bill");

  assertBaseOutput(output);
  assertActionCardShape(output);
  assert.equal(output.trust.severity_level, "medium");
  assertNoInventedDeadline(output);
});

test("overdue electricity bill", () => {
  const output = runEngine([
    "Final notice for electricity account",
    "Payment overdue.",
    "Immediate payment required to avoid disconnection.",
    "Amount due £240.00."
  ].join("\n"), "bill");

  assertBaseOutput(output);
  assertActionCardShape(output);
  assert.equal(output.trust.severity_level, "urgent");
  assert.equal(output.banner.type, "urgent");
});

test("school trip letter", () => {
  const output = runEngine([
    "School Trip Letter",
    "School action needed for consent form.",
    "Please complete and return the form."
  ].join("\n"), "school");

  assertBaseOutput(output);
  assertActionCardShape(output);
  assert.equal(output.trust.document_category, "education");
  assertNoInventedDeadline(output);
});

test("employment warning", () => {
  const output = runEngine([
    "Employment Warning",
    "This is an employment warning about attendance.",
    "Please contact your manager and send supporting documents."
  ].join("\n"), "work");

  assertBaseOutput(output);
  assertActionCardShape(output);
  assert.equal(output.trust.severity_level, "high");
});

test("termination letter", () => {
  const output = runEngine([
    "Employment Termination Notice",
    "Termination will proceed after review.",
    "Legal response required."
  ].join("\n"), "work");

  assertBaseOutput(output);
  assertActionCardShape(output);
  assert.equal(output.trust.severity_level, "urgent");
});

test("NHS appointment", () => {
  const output = runEngine([
    "NHS Appointment Letter",
    "Your appointment is booked for 20/06/2026.",
    "Please attend the clinic and bring ID."
  ].join("\n"), "medical");

  assertBaseOutput(output);
  assertActionCardShape(output);
  assert.equal(output.trust.document_category, "appointment");
  assert.equal(output.trust.severity_level, "medium");
});

test("bank loan confirmation", () => {
  const output = runEngine([
    "Loan Confirmation",
    "This is a confirmation of your loan schedule.",
    "No action needed."
  ].join("\n"), "other");

  assertBaseOutput(output);
  assertActionCardShape(output);
  assert.equal(output.trust.document_category, "bank_or_loan");
  assert.equal(output.trust.severity_level, "low");
});

test("rent arrears letter", () => {
  const output = runEngine([
    "Rent Arrears Letter",
    "Your rent arrears have increased.",
    "Payment overdue.",
    "Please contact your landlord."
  ].join("\n"), "other");

  assertBaseOutput(output);
  assertActionCardShape(output);
  assert.equal(output.trust.document_category, "housing");
  assert.equal(output.trust.severity_level, "high");
});

test("possible scam payment email uses verification_only", () => {
  const output = runEngine([
    "Dear customer",
    "Final warning. Act now.",
    "Immediate payment required.",
    "Click this link and pay by bank transfer today."
  ].join("\n"), "email");

  assertBaseOutput(output);
  assert.equal(output.trust.processing_mode, "verification_only");
  assert.equal(output.trust.trust_assessment, "low");
  assertNoDangerousVerificationInstructions(output);
});

test("template letter with missing fields is marked and avoids invented facts", () => {
  const output = runEngine([
    "Template Letter",
    "Dear [Name],",
    "Please respond by [Date].",
    "Reference [Case Number]."
  ].join("\n"), "other");

  assertBaseOutput(output);
  assert.equal(output.trust.document_type, "template");
  assert.equal(output.trust.document_category, "template");
  assertNoInventedDeadline(output);
});
