const CATEGORY_LABELS = {
  auto: "Auto detect",
  letter: "Letter",
  bill: "Bill",
  work: "Work",
  medical: "Medical",
  school: "School",
  legal: "Legal",
  contract: "Contract",
  article: "Article",
  email: "Email",
  other: "Other"
};

function runLetterPipeline({ extractedText, fileMeta }) {
  // Step 1: understand the document. This happens even when trust is low.
  const understanding = extractDocumentUnderstanding(extractedText, fileMeta);

  // Step 2: run trust and safety checks separately from the explanation.
  const safety = evaluateTrustAndSafety(extractedText, fileMeta, understanding);

  // Step 3: combine both parts into the JSON shape used by storage and UI.
  const structuredOutput = {
    ...understanding,
    ...safety
  };

  const userOutput = renderForUser(structuredOutput);
  return { structuredOutput, userOutput };
}

function extractDocumentUnderstanding(text, fileMeta) {
  const readableTextExists = text.trim().length > 0;
  const selectedCategory = normalizeSelectedCategory(fileMeta.selectedCategory);
  const detectedCategory = detectDocumentCategory(text, selectedCategory);
  const deadline = extractDeadline(text);

  if (!readableTextExists) {
    return {
      document_category: "unclear document",
      document_title: "Unclear document",
      plain_summary: "I cannot read enough text from this upload.",
      what_this_is: "This looks unclear.",
      important_points: ["There is not enough readable text."],
      action: "Upload a clearer PDF or image.",
      deadline: "No clear deadline found.",
      risk: "Important details may be missed.",
      next_steps: ["Try a sharper image.", "Make sure all pages are visible."],
      note: "Some parts are unclear. Upload a clearer version if possible."
    };
  }

  const friendlyType = titleCase(detectedCategory);
  const hasDeadline = deadline !== "No clear deadline found.";

  return {
    document_category: detectedCategory,
    document_title: `${friendlyType} guide`,
    plain_summary: summaryForCategory(detectedCategory),
    what_this_is: whatThisIsForCategory(detectedCategory),
    important_points: importantPointsForCategory(detectedCategory),
    action: actionForCategory(detectedCategory),
    deadline,
    risk: riskForCategory(detectedCategory),
    next_steps: nextStepsForCategory(detectedCategory, hasDeadline),
    note: noteForCategory(detectedCategory)
  };
}

function evaluateTrustAndSafety(text, fileMeta, understanding) {
  const lowerText = text.toLowerCase();
  const scamSignals = findScamSignals(lowerText);
  const authenticSignals = findAuthenticSignals(lowerText, fileMeta);
  const isTemplate = looksLikeTemplate(text, understanding.document_category);
  const isOutgoing = looksOutgoing(lowerText, understanding.document_category);
  const isSuspicious = scamSignals.length > 0 || understanding.document_category === "suspicious document";
  const isUnclear = text.trim().length < 40 || understanding.document_category === "unclear document";

  let trustLevel = "Medium - Looks consistent with an official document";
  let severityLevel = severityForCategory(understanding.document_category);
  let documentStatus = statusForCategory(understanding.document_category);
  let confidence = "Medium";
  let needsReview = "No";
  let reviewReason = "No major issue found in the readable text.";
  let safeActionMessage = "Check the original document before you act.";

  if (isTemplate) {
    trustLevel = "Medium - Looks like a template";
    documentStatus = "Template";
    reviewReason = "This looks like a template with missing fields.";
    safeActionMessage = "Fill in missing fields only if you know the correct information.";
  }

  if (isOutgoing) {
    trustLevel = "Medium - Looks like an outgoing document";
    documentStatus = "Outgoing";
    reviewReason = "This looks like a document sent by you or your organisation.";
    safeActionMessage = "Check it carefully before sending or reusing it.";
  }

  if (isSuspicious) {
    trustLevel = "Low - May be suspicious";
    severityLevel = "High";
    documentStatus = "Suspicious";
    needsReview = "Yes";
    reviewReason = "The document contains wording that can appear in scams.";
    safeActionMessage = "Do not pay or share details yet. Verify using official contact details.";
  }

  if (isUnclear) {
    trustLevel = "Low - Some details are unclear";
    documentStatus = "Unclear";
    confidence = "Low";
    needsReview = "Yes";
    reviewReason = "Some parts are unclear. Upload a clearer version if possible.";
    safeActionMessage = "Use only the readable parts. Check the original before acting.";
  }

  return {
    trust_level: trustLevel,
    severity_level: severityLevel,
    document_status: documentStatus,
    confidence,
    needs_review: needsReview,
    review_reason: reviewReason,
    is_template: isTemplate,
    is_outgoing: isOutgoing,
    is_suspicious: isSuspicious,
    safe_action_message: safeActionMessage,
    scam_signals: scamSignals,
    authentic_signals: authenticSignals
  };
}

function renderForUser(structured) {
  // The renderer keeps each card short and avoids long AI-style paragraphs.
  return {
    ...structured,
    guide_cards: [
      {
        title: "What is this?",
        text: structured.what_this_is
      },
      {
        title: "What matters most?",
        text: structured.important_points[0] || "No main point found."
      },
      {
        title: "What do I need to do?",
        text: structured.action || "Check the original document."
      },
      {
        title: "When is it due?",
        text: structured.deadline
      },
      {
        title: "What could happen?",
        text: structured.risk
      },
      {
        title: "Helpful note",
        text: structured.note || "Ask someone you trust to check it."
      }
    ],
    document_check: {
      trust_level: structured.trust_level,
      severity_level: structured.severity_level,
      document_status: structured.document_status,
      confidence: structured.confidence,
      needs_review: structured.needs_review,
      possible_issue: structured.review_reason,
      safe_next_step: structured.safe_action_message
    }
  };
}

function normalizeSelectedCategory(value) {
  return CATEGORY_LABELS[value] ? value : "auto";
}

function detectDocumentCategory(text, selectedCategory) {
  if (selectedCategory && selectedCategory !== "auto") {
    return categoryFromMenu(selectedCategory);
  }

  const lowerText = text.toLowerCase();

  if (text.trim().length < 40) return "unclear document";
  if (findScamSignals(lowerText).length > 0) return "suspicious document";
  if (looksLikeTemplate(text)) return "template";
  if (looksOutgoing(lowerText)) return "outgoing letter";
  if (lowerText.includes("invoice")) return "invoice";
  if (lowerText.includes("bill")) return "bill";
  if (lowerText.includes("payment reminder") || lowerText.includes("overdue")) return "payment reminder";
  if (lowerText.includes("termination")) return "termination letter";
  if (lowerText.includes("warning")) return "warning letter";
  if (lowerText.includes("appointment") || lowerText.includes("clinic")) return "medical appointment";
  if (lowerText.includes("court") || lowerText.includes("legal notice")) return "court or legal notice";
  if (lowerText.includes("contract") || lowerText.includes("agreement")) return "contract";
  if (lowerText.includes("university") || lowerText.includes("school")) return "school or university letter";
  if (lowerText.includes("subject:") || lowerText.includes("from:")) return "email";
  if (lowerText.includes("article")) return "article";
  if (lowerText.includes("employee") || lowerText.includes("work")) return "work letter";
  if (lowerText.includes("formal incoming letter")) return "official letter";

  return "other readable document";
}

function categoryFromMenu(selectedCategory) {
  const categories = {
    letter: "official letter",
    bill: "bill",
    work: "work letter",
    medical: "medical appointment",
    school: "school or university letter",
    legal: "court or legal notice",
    contract: "contract",
    article: "article",
    email: "email",
    other: "other readable document"
  };

  return categories[selectedCategory] || "other readable document";
}

function summaryForCategory(category) {
  const summaries = {
    "official letter": "This appears to be a formal document with information or instructions.",
    bill: "This appears to ask for payment.",
    invoice: "This appears to list a payment request for goods or services.",
    "payment reminder": "This appears to remind you about a payment.",
    "work letter": "This appears to be about work or employment.",
    "termination letter": "This appears to say that something is ending.",
    "warning letter": "This appears to warn about a problem that needs attention.",
    "school or university letter": "This appears to be from a school or university.",
    "medical appointment": "This appears to be about an appointment.",
    "court or legal notice": "This appears to include legal or court information.",
    contract: "This appears to describe an agreement.",
    article: "This appears to be an article or information text.",
    email: "This appears to be an email message.",
    template: "This appears to be a template with fields to complete.",
    "outgoing letter": "This appears to be a document sent by you or your organisation.",
    "suspicious document": "This appears to ask for action, but it may need verification first.",
    "unclear document": "Only some parts are readable.",
    "other readable document": "This document can be explained, but some details may need checking."
  };

  return summaries[category] || summaries["other readable document"];
}

function whatThisIsForCategory(category) {
  if (category === "template") return "A template or draft.";
  if (category === "outgoing letter") return "A document that may have been sent by you.";
  if (category === "suspicious document") return "A readable document with possible warning signs.";
  if (category === "unclear document") return "A document with unclear text.";
  return `A ${category}.`;
}

function importantPointsForCategory(category) {
  const points = {
    bill: ["It may ask you to pay money."],
    invoice: ["It may ask for payment for goods or services."],
    "payment reminder": ["It may say a payment is late."],
    "medical appointment": ["It may include a time, place, or appointment change."],
    "court or legal notice": ["It may include important legal dates or instructions."],
    contract: ["It may describe what each person agrees to do."],
    template: ["Some fields may be blank or unfinished."],
    "outgoing letter": ["It may be written from your side."],
    "suspicious document": ["It may pressure you to act quickly."],
    "unclear document": ["Some words may not have been read correctly."]
  };

  return points[category] || ["It may contain information you need to check."];
}

function actionForCategory(category) {
  const actions = {
    bill: ["Check the amount and due date before paying."],
    invoice: ["Check who sent it and what it is for."],
    "payment reminder": ["Check whether the payment is real and already paid."],
    "work letter": ["Read the work instructions and ask HR if unsure."],
    "termination letter": ["Check what is ending and when."],
    "warning letter": ["Read the warning and check what action is requested."],
    "school or university letter": ["Check the date, place, and requested action."],
    "medical appointment": ["Check the appointment date, time, and place."],
    "court or legal notice": ["Check the date and consider getting qualified help."],
    contract: ["Read the terms before signing."],
    article: ["Read the main point and decide if you need more detail."],
    email: ["Check the sender before following links."],
    template: ["Fill missing fields only if you know the correct information."],
    "outgoing letter": ["Check it carefully before sending or reusing it."],
    "suspicious document": ["Do not pay or share details yet."],
    "unclear document": ["Upload a clearer version if possible."]
  };

  return (actions[category] || ["Check the original document before acting."])[0];
}

function riskForCategory(category) {
  const risks = {
    bill: "A missed payment may cause extra charges.",
    invoice: "Paying the wrong invoice may lose money.",
    "payment reminder": "Ignoring a real reminder may cause extra charges.",
    "medical appointment": "You may miss the appointment.",
    "court or legal notice": "Missing a legal date may cause serious problems.",
    contract: "Signing without checking may create obligations.",
    template: "Missing fields can make the document incomplete.",
    "outgoing letter": "Sending it too soon may cause mistakes.",
    "suspicious document": "It may be trying to get money or private details.",
    "unclear document": "Important details may be missed."
  };

  return risks[category] || "Missing important information could cause problems.";
}

function nextStepsForCategory(category, hasDeadline) {
  if (category === "suspicious document") {
    return ["Verify using official contact details.", "Do not use contact details from the document yet."];
  }

  if (category === "unclear document") {
    return ["Upload a clearer version.", "Ask someone you trust to check the original."];
  }

  if (category === "court or legal notice") {
    return ["Check the deadline.", "Consider qualified legal support."];
  }

  if (hasDeadline) {
    return ["Add the date to your calendar.", "Set a reminder."];
  }

  return ["Check the original document.", "Ask a trusted person if unsure."];
}

function noteForCategory(category) {
  if (category === "suspicious document") return "This does not prove the document is fake.";
  if (category === "template") return "This looks like a template with missing fields.";
  if (category === "outgoing letter") return "This looks like a document sent by you or your organisation.";
  if (category === "unclear document") return "Some parts are unclear. Upload a clearer version if possible.";
  if (category === "other readable document") return "This document can be explained, but some details may need checking.";
  return "Cannot confirm authenticity.";
}

function statusForCategory(category) {
  if (category === "template") return "Template";
  if (category === "outgoing letter") return "Outgoing";
  if (category === "suspicious document") return "Suspicious";
  if (category === "unclear document") return "Unclear";
  if (category === "other readable document" || category === "article" || category === "email" || category === "contract") {
    return "Other";
  }
  return "Official looking";
}

function severityForCategory(category) {
  if (category === "court or legal notice") return "High";
  if (category === "termination letter") return "High";
  if (category === "warning letter") return "Medium";
  if (category === "bill" || category === "invoice" || category === "payment reminder") return "Medium";
  if (category === "medical appointment") return "Medium";
  if (category === "suspicious document") return "High";
  if (category === "unclear document") return "Medium";
  return "Low";
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

function findAuthenticSignals(lowerText, fileMeta) {
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

function looksLikeTemplate(text, category) {
  return category === "template" || /\[[^\]]+\]|{[^}]+}|insert name|lorem ipsum/i.test(text);
}

function looksOutgoing(lowerText, category) {
  return (
    category === "outgoing letter" ||
    lowerText.includes("yours sincerely") ||
    lowerText.includes("i am writing to") ||
    lowerText.includes("please find attached")
  );
}

function extractDeadline(text) {
  const dateMatch = text.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/);
  if (dateMatch) return dateMatch[0];
  return "No clear deadline found.";
}

function titleCase(value) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

module.exports = { runLetterPipeline };
