const pages = ["landing", "home", "journey", "help", "comfort"];

const styleIcons = {
  simple: ["\uD83D\uDCC4", "\uD83D\uDCCC", "\u2705", "\uD83D\uDCC5", "\uD83D\uDEE1\uFE0F", "\u2139\uFE0F"],
  animal: ["\uD83E\uDD89", "\uD83D\uDC1D", "\uD83E\uDD8A", "\uD83D\uDC22", "\uD83D\uDC18", "\uD83C\uDF3F"],
  shape: ["\uD83D\uDFE2", "\uD83D\uDFE8", "\uD83D\uDD36", "\u23F0", "\uD83D\uDEE1\uFE0F", "\uD83D\uDD35"],
  map: ["1", "2", "3", "4", "5", "6"]
};

const helpGuides = {
  overwhelmed: {
    title: "I feel overwhelmed",
    text: "It is okay to feel this way. You can take one small step at a time.",
    steps: [
      {
        icon: "focus",
        title: "Turn on Focus mode",
        detail: "Hide distractions and see one step at a time."
      },
      {
        icon: "document",
        title: "Read only the Action card",
        detail: "You do not need to understand everything."
      },
      {
        icon: "pause",
        title: "Take a break",
        detail: "It is okay to pause and come back later."
      }
    ],
    action: "Turn on Focus mode",
    actionType: "focus"
  },
  fake: {
    title: "I think this document is fake",
    text: "Do not pay or share details until you check it safely.",
    steps: [
      {
        icon: "shield",
        title: "Do not use links in the document",
        detail: "They may not be safe."
      },
      {
        icon: "search",
        title: "Search for the organisation yourself",
        detail: "Use its official website or app."
      },
      {
        icon: "people",
        title: "Ask someone to check it with you",
        detail: "A second look can help."
      }
    ],
    action: "Open Document check",
    actionType: "check"
  },
  deadline: {
    title: "I cannot find the deadline",
    text: "Deadlines can be hidden in small text. Check slowly.",
    steps: [
      {
        icon: "calendar",
        title: "Open the Deadline card",
        detail: "ClearSteps looks for the due date."
      },
      {
        icon: "document",
        title: "Check the original page",
        detail: "Look near the top, bottom, and bold text."
      },
      {
        icon: "bell",
        title: "Save the date if you find one",
        detail: "Write it down or set a reminder."
      }
    ],
    action: "Open Deadline card",
    actionType: "deadline"
  },
  time: {
    title: "I need more time",
    text: "You may be able to ask for more time. Use safe contact details.",
    steps: [
      {
        icon: "document",
        title: "Check who sent it",
        detail: "Find the organisation name first."
      },
      {
        icon: "shield",
        title: "Use official contact details",
        detail: "Do not rely on unknown links or numbers."
      },
      {
        icon: "message",
        title: "Ask for an extension",
        detail: "Use clear words: I need more time."
      }
    ],
    action: "Go to Document Journey",
    actionType: "journey"
  },
  wrong: {
    title: "I uploaded the wrong file",
    text: "That is easy to fix. You can replace the file.",
    steps: [
      {
        icon: "close",
        title: "Remove the current upload",
        detail: "ClearSteps will forget this file."
      },
      {
        icon: "folder",
        title: "Choose the correct document",
        detail: "Pick one clear file if possible."
      },
      {
        icon: "upload",
        title: "Upload it again",
        detail: "Start the same simple journey."
      }
    ],
    action: "Upload another document",
    actionType: "upload"
  },
  person: {
    title: "I need someone to help me",
    text: "You can ask someone you trust to look with you.",
    steps: [
      {
        icon: "copy",
        title: "Copy the summary",
        detail: "Share only the simple explanation."
      },
      {
        icon: "people",
        title: "Choose a trusted person",
        detail: "Family, friend, adviser, or support worker."
      },
      {
        icon: "document",
        title: "Ask them to read one card",
        detail: "Start with the Action card together."
      }
    ],
    action: "Copy summary",
    actionType: "copy"
  }
};

const cardEncouragement = [
  "Good start. Let's go one card at a time.",
  "One step done.",
  "You are doing well.",
  "Good progress.",
  "You are nearly there.",
  "Last card. You made it."
];

const themeConfig = {
  light: {
    top: "#ece8fb",
    bottom: "#fffdf8",
    soft: "#f1effd",
    panel: "#fffdfa",
    accent: "#2f5b35",
    line: "rgba(148, 136, 213, 0.16)",
    strongLine: "rgba(148, 136, 213, 0.28)",
    blobA: "#dfe8d8",
    blobB: "#fff1d8",
    blobC: "#f6d3c4",
    art: "#2f5b35"
  },
  calm: {
    top: "#ece8fb",
    bottom: "#fffdf8",
    soft: "#f1effd",
    panel: "#fffdfa",
    accent: "#2f5b35",
    line: "rgba(148, 136, 213, 0.16)",
    strongLine: "rgba(148, 136, 213, 0.28)",
    blobA: "#dfe8d8",
    blobB: "#fff1d8",
    blobC: "#f6d3c4",
    art: "#2f5b35"
  },
  lavender: {
    top: "#cbc3eb",
    bottom: "#f9dcd6",
    soft: "#ebe6fb",
    panel: "#fffaff",
    accent: "#4c5271",
    line: "rgba(104, 94, 160, 0.16)",
    strongLine: "rgba(104, 94, 160, 0.28)",
    blobA: "#e6e1f5",
    blobB: "#f9dcd6",
    blobC: "#d6cfef",
    art: "#4c5271"
  },
  cream: {
    top: "#ffe0a8",
    bottom: "#fff4df",
    soft: "#fff3df",
    panel: "#fffaf0",
    accent: "#5a5136",
    line: "rgba(168, 126, 49, 0.15)",
    strongLine: "rgba(168, 126, 49, 0.26)",
    blobA: "#eee4c8",
    blobB: "#ffe8b8",
    blobC: "#f2d9c8",
    art: "#5a5136"
  },
  sage: {
    top: "#dce7d2",
    bottom: "#f4f4dd",
    soft: "#eef4ea",
    panel: "#fffdfa",
    accent: "#2f5b35",
    line: "rgba(91, 125, 82, 0.15)",
    strongLine: "rgba(91, 125, 82, 0.27)",
    blobA: "#dce7d2",
    blobB: "#f4f4dd",
    blobC: "#e2efd8",
    art: "#2f5b35"
  },
  classic: {
    top: "#e7ebf2",
    bottom: "#566277",
    soft: "#e9edf4",
    panel: "#f8f9fb",
    accent: "#1f2d45",
    line: "rgba(31, 45, 69, 0.15)",
    strongLine: "rgba(31, 45, 69, 0.28)",
    blobA: "#d8dde8",
    blobB: "#eef1f5",
    blobC: "#c7cedb",
    art: "#1f2d45"
  },
  dark: {
    top: "#283039",
    bottom: "#1c2529",
    soft: "#2d3042",
    panel: "#1c2529",
    accent: "#b6d2ad",
    line: "rgba(207, 199, 255, 0.12)",
    strongLine: "rgba(207, 199, 255, 0.24)",
    blobA: "#2d3b31",
    blobB: "#4d402f",
    blobC: "#483535",
    art: "#b6d2ad"
  }
};

let selectedType = "auto";
let activeCardStyle = "simple";
let cardIndex = 0;
let latestResult = createMockApiResult();
let pendingDocumentJobId = null;
let currentTheme = "calm";
let currentBackgroundStyle = "plain";
let activeFeedbackAnswer = "";
let latestUploadInputQuality = "unknown";
let latestOcrStatus = "unknown";
let lastTrackedCardKey = "";
let journeyCompletedTracked = false;

const backgroundStyles = ["plain", "dots", "animals", "dinosaurs", "space", "ocean", "cars", "shapes", "notebook", "cozy", "heroes"];
const legacyBackgroundStyles = {
  clouds: "plain",
  forest: "animals",
  rainbow: "shapes"
};

const feedbackChoices = {
  yes: {
    rating: "Yes, this helped",
    label: "Yes",
    detail: "This helped",
    tone: "positive",
    heading: "What helped most?",
    chips: ["Simple words", "Clear next step", "Easy to read", "Less overwhelming", "Focus mode helped"]
  },
  little: {
    rating: "A little",
    label: "A little",
    detail: "Partly helpful",
    tone: "mixed",
    heading: "What could be clearer?",
    chips: ["Too much text", "Action was unclear", "Deadline was unclear", "Words felt difficult", "Needed more support"]
  },
  no: {
    rating: "No, I was confused",
    label: "No",
    detail: "I was confused",
    tone: "needs-work",
    heading: "What went wrong?",
    chips: ["I was still confused", "Wrong information", "Too much information", "I did not know what to do", "I did not trust it"]
  }
};

const pageSections = Object.fromEntries(
  pages.map((page) => [page, document.querySelector(`#page-${page}`)])
);

const pageLinks = Array.from(document.querySelectorAll("[data-page-link]"));
const themeButtons = Array.from(document.querySelectorAll("[data-theme]"));
const toggleButtons = Array.from(document.querySelectorAll("[data-toggle]"));
const chips = Array.from(document.querySelectorAll(".chip[data-category]"));
const railSteps = Array.from(document.querySelectorAll(".rail-step"));
const form = document.querySelector("#upload-form");
const fileInput = document.querySelector("#document-file");
const fileName = document.querySelector("#file-name");
const statusText = document.querySelector("#status");
const statusTitle = statusText?.querySelector("[data-status-title]");
const statusDetail = statusText?.querySelector("[data-status-detail]");
const removeDocumentButton = document.querySelector("#remove-document");
const moreTypeButton = document.querySelector("#more-type-button");
const moreTypeMenu = document.querySelector("#more-type-menu");
const moreTypeLabel = moreTypeButton?.querySelector("[data-more-label]");
const submitButton = document.querySelector("#submit-button");
const journeyPage = document.querySelector("#page-journey");
const cardSteps = document.querySelector("#card-steps");
const modal = document.querySelector("#modal");
const modalTitle = document.querySelector("#modal-title");
const modalContent = document.querySelector("#modal-content");
const progressDots = document.querySelector("#progress-dots");
const cardFeedbackPanel = document.querySelector("#card-feedback-panel");
const cardFocusToggle = document.querySelector("#card-focus-toggle");
let modalReturnFocusTarget = null;

document.addEventListener("click", (event) => {
  const helpCard = event.target.closest(".help-card[data-help]");
  if (!helpCard) return;

  openHelpModal(helpCard.dataset.help, helpCard);
});

loadSavedPreferences();
wireNavigation();
wireUpload();
wireCueCards();
wireActions();
wireHelp();
wireComfortSettings();
wireFeedback();

setPage("landing");
setJourneyStep("upload");
renderCard();
renderProgressDots();

function wireNavigation() {
  pageLinks.forEach((button) => {
    button.addEventListener("click", () => {
      setPage(button.dataset.pageLink);
      if (button.dataset.pageLink === "journey" && !hasUploadedResult()) {
        setJourneyStep("upload");
      }
    });
  });

  themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const requestedTheme = button.dataset.theme;
      if (requestedTheme === "dark" && document.body.classList.contains("theme-dark")) {
        setTheme("calm");
        savePreferences(false);
        return;
      }

      setTheme(requestedTheme);
      savePreferences(false);
    });
  });

  toggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.toggle === "focus-mode") {
        setFocusMode(!document.body.classList.contains("focus-mode"), { save: true });
        return;
      }

      document.body.classList.toggle(button.dataset.toggle);
      const isActive = document.body.classList.contains(button.dataset.toggle);
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
      savePreferences(false);
    });
  });

  cardFocusToggle?.addEventListener("click", () => {
    setFocusMode(!document.body.classList.contains("focus-mode"), { save: true });
  });

  document.querySelector("#colour-wheel").addEventListener("click", () => setPage("comfort"));

  document.querySelectorAll("[data-action='save-preferences']").forEach((button) => {
    button.addEventListener("click", savePreferences);
  });

  document.querySelectorAll("[data-open-check]").forEach((button) => {
    button.addEventListener("click", () => {
      setPage("journey");
      openDocumentCheck();
    });
  });

  document.querySelectorAll("[data-open-reminder]").forEach((button) => {
    button.addEventListener("click", openReminderModal);
  });

  railSteps.forEach((button) => {
    button.addEventListener("click", () => {
      moveToRailStep(button.dataset.rail);
    });
  });
}

function setFocusMode(isActive, options = {}) {
  document.body.classList.toggle("focus-mode", isActive);

  document.querySelectorAll("[data-toggle='focus-mode']").forEach((button) => {
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    button.setAttribute("aria-label", isActive ? "Turn off Focus mode" : "Focus mode");
  });

  if (cardFocusToggle) {
    cardFocusToggle.classList.toggle("active", isActive);
    cardFocusToggle.setAttribute("aria-pressed", String(isActive));
    cardFocusToggle.querySelector("span").textContent = isActive ? "Exit focus" : "Focus on card";
  }

  if (options.save) {
    if (isActive) {
      trackAnalyticsEvent("focus_mode_used", {
        section: hasUploadedResult() ? "cue_card" : "global"
      });
    }
    savePreferences(false);
  }
}

function trackCurrentCardViewed() {
  if (!hasUploadedResult()) return;

  const card = latestResult.cards?.[cardIndex];
  if (!card) return;

  const key = `${latestResult.job_id || pendingDocumentJobId || "mock"}:${cardIndex}:${card.id}`;
  if (key === lastTrackedCardKey) return;

  lastTrackedCardKey = key;
  trackAnalyticsEvent("card_viewed", {
    page: "journey",
    section: "cue_card",
    card_number: cardIndex + 1,
    card_type: card.id
  });
}

function trackCurrentCardAction(eventName) {
  if (!hasUploadedResult()) return;

  const card = latestResult.cards?.[cardIndex];
  trackAnalyticsEvent(eventName, {
    page: "journey",
    section: "cue_card",
    card_number: cardIndex + 1,
    card_type: card?.id || ""
  });
}

function trackAnalyticsEvent(eventName, fields = {}) {
  try {
    const payload = buildAnalyticsPayload(eventName, fields);
    if (!payload.event_name) return;

    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {});
  } catch (error) {
    // Analytics must never block reading, uploading, feedback, or navigation.
  }
}

function buildAnalyticsPayload(eventName, fields = {}) {
  const trust = latestResult?.trust || {};
  const card = latestResult?.cards?.[cardIndex] || {};
  const payload = {
    event_name: eventName,
    client_job_id: fields.client_job_id || latestResult?.job_id || pendingDocumentJobId || "",
    page: fields.page || document.body.dataset.page || "unknown",
    section: fields.section || "",
    card_number: fields.card_number || "",
    card_type: fields.card_type || card.id || "",
    document_type: fields.document_type || trust.document_category || trust.document_type || selectedType || "",
    input_quality: fields.input_quality || trust.input_quality || latestUploadInputQuality || "",
    ai_status: fields.ai_status || extractAiStatus(latestResult) || "",
    ocr_status: fields.ocr_status || latestOcrStatus || "",
    error_code: fields.error_code || "",
    created_at: new Date().toISOString()
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== "" && value !== null && value !== undefined)
  );
}

function extractAiStatus(result) {
  if (!result) return "";
  return result.ai_status
    || result.debug?.ai_status
    || result.debug?.ai?.status
    || result.debug?.ai?.ai_status
    || "";
}

function wireUpload() {
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      selectedType = chip.dataset.category;
      const isMoreOption = Boolean(chip.closest("#more-type-menu"));

      chips.forEach((item) => {
        const isSelected = item === chip;
        item.classList.toggle("active", isSelected);
        item.setAttribute("aria-checked", String(isSelected));
      });

      if (moreTypeButton) {
        moreTypeButton.classList.toggle("active", isMoreOption);
        moreTypeButton.setAttribute("aria-pressed", String(isMoreOption));
      }
      if (moreTypeLabel) {
        moreTypeLabel.textContent = "More";
      }
      closeMoreTypeMenu();
    });
  });

  moreTypeButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    const shouldOpen = moreTypeButton.getAttribute("aria-expanded") !== "true";
    moreTypeButton.setAttribute("aria-expanded", String(shouldOpen));
    moreTypeMenu?.classList.toggle("hidden", !shouldOpen);
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".more-type-wrapper")) {
      closeMoreTypeMenu();
    }
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    pendingDocumentJobId = null;
    fileName.textContent = "PDF, image, or document";
    setStatus(file ? "Document selected." : "Choose a document to begin.");
  });

  removeDocumentButton?.addEventListener("click", () => {
    fileInput.value = "";
    pendingDocumentJobId = null;
    fileName.textContent = "PDF, image, or document";
    setStatus("Choose a document to begin.");
    fileInput.focus();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (pendingDocumentJobId) {
      await analyseReadyDocument();
      return;
    }

    const file = fileInput.files[0];
    if (!file) {
      setStatus("Choose one document first.", true);
      return;
    }

    setLoading(true);
    setStatus("Reading your document.");
    setJourneyStep("upload");
    document.querySelector("#achievement").classList.add("hidden");
    cardFeedbackPanel.classList.add("hidden");
    lastTrackedCardKey = "";
    journeyCompletedTracked = false;

    trackAnalyticsEvent("upload_started", {
      page: "journey",
      section: "upload",
      document_type: selectedType
    });

    const formData = new FormData();
    formData.append("letter", file);
    formData.append("documentCategory", selectedType);

    try {
      const response = await fetch("/api/simplify", {
        method: "POST",
        body: formData
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Upload failed.");
      }

      if (isOcrReadyResult(payload)) {
        latestUploadInputQuality = payload.input_quality || "unknown";
        latestOcrStatus = payload.success ? "completed" : "failed";
        trackAnalyticsEvent(payload.success ? "upload_completed" : "upload_failed", {
          page: "journey",
          section: "upload",
          client_job_id: payload.job_id || "",
          document_type: selectedType,
          input_quality: latestUploadInputQuality,
          ocr_status: latestOcrStatus,
          error_code: payload.success ? "" : "ocr_unreadable"
        });
        showOcrReadyResult(payload);
        return;
      }

      latestResult = normalizeApiResult(payload);
      latestResult.hasUploaded = true;
      latestUploadInputQuality = latestResult.trust?.input_quality || "unknown";
      latestOcrStatus = latestResult.debug?.ocr_status || latestOcrStatus || "unknown";
      pendingDocumentJobId = null;
      cardIndex = 0;
      trackAnalyticsEvent("upload_completed", {
        page: "journey",
        section: "upload",
        client_job_id: latestResult.job_id,
        document_type: selectedType,
        input_quality: latestUploadInputQuality,
        ocr_status: latestOcrStatus
      });
      trackAnalyticsEvent("analysis_completed", {
        page: "journey",
        section: "analysis",
        client_job_id: latestResult.job_id,
        document_type: latestResult.trust?.document_category || selectedType,
        input_quality: latestUploadInputQuality,
        ai_status: extractAiStatus(latestResult),
        ocr_status: latestOcrStatus
      });
      trackAnalyticsEvent("cards_generated", {
        page: "journey",
        section: "cue_cards",
        client_job_id: latestResult.job_id,
        document_type: latestResult.trust?.document_category || selectedType,
        input_quality: latestUploadInputQuality,
        ai_status: extractAiStatus(latestResult),
        ocr_status: latestOcrStatus
      });
      renderCard();
      setJourneyStep("understand");
      setStatus("Your cue cards are ready.");
    } catch (error) {
      latestOcrStatus = "failed";
      trackAnalyticsEvent("upload_failed", {
        page: "journey",
        section: "upload",
        document_type: selectedType,
        ocr_status: latestOcrStatus,
        error_code: "upload_request_failed"
      });
      setStatus(error.message || "Please try again.", true);
    } finally {
      setLoading(false);
    }
  });
}

function closeMoreTypeMenu() {
  moreTypeButton?.setAttribute("aria-expanded", "false");
  moreTypeMenu?.classList.add("hidden");
}

async function analyseReadyDocument() {
  const analysisJobId = pendingDocumentJobId;
  setLoading(true);
  setStatus("Understanding your document.");
  trackAnalyticsEvent("analysis_started", {
    page: "journey",
    section: "analysis",
    client_job_id: analysisJobId,
    document_type: selectedType,
    input_quality: latestUploadInputQuality,
    ocr_status: latestOcrStatus || "completed"
  });

  try {
    const response = await fetch("/api/simplify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "analyse",
        job_id: pendingDocumentJobId,
        documentCategory: selectedType
      })
    });

    const payload = await response.json();
    if (!response.ok || payload.success === false) {
      throw new Error(payload.error || "We could not understand this document yet.");
    }

    latestResult = normalizeApiResult(payload);
    latestResult.hasUploaded = true;
    latestUploadInputQuality = latestResult.trust?.input_quality || latestUploadInputQuality || "unknown";
    latestOcrStatus = latestResult.debug?.ocr_status || latestOcrStatus || "completed";
    pendingDocumentJobId = null;
    cardIndex = 0;
    lastTrackedCardKey = "";
    journeyCompletedTracked = false;
    trackAnalyticsEvent("analysis_completed", {
      page: "journey",
      section: "analysis",
      client_job_id: latestResult.job_id || analysisJobId,
      document_type: latestResult.trust?.document_category || selectedType,
      input_quality: latestUploadInputQuality,
      ai_status: extractAiStatus(latestResult),
      ocr_status: latestOcrStatus
    });
    trackAnalyticsEvent("cards_generated", {
      page: "journey",
      section: "cue_cards",
      client_job_id: latestResult.job_id || analysisJobId,
      document_type: latestResult.trust?.document_category || selectedType,
      input_quality: latestUploadInputQuality,
      ai_status: extractAiStatus(latestResult),
      ocr_status: latestOcrStatus
    });
    renderCard();
    setJourneyStep("understand");
    setStatus("Your cue cards are ready.");
  } catch (error) {
    trackAnalyticsEvent("analysis_failed", {
      page: "journey",
      section: "analysis",
      client_job_id: analysisJobId,
      document_type: selectedType,
      input_quality: latestUploadInputQuality,
      ocr_status: latestOcrStatus,
      error_code: "analysis_request_failed"
    });
    setStatus(error.message || "Please try again.", true);
  } finally {
    setLoading(false);
  }
}

function wireCueCards() {
  document.querySelector("#card-back").addEventListener("click", () => {
    trackCurrentCardAction("back_clicked");
    if (cardIndex === 0) {
      setJourneyStep("upload");
      return;
    }

    cardIndex -= 1;
    renderCard();
    setJourneyStep("understand");
  });

  document.querySelector("#card-next").addEventListener("click", () => {
    const cards = latestResult.cards;
    trackCurrentCardAction("next_clicked");
    if (cardIndex >= cards.length - 1) {
      setJourneyStep("act");
      document.querySelector("#achievement").classList.remove("hidden");
      cardFeedbackPanel.classList.remove("hidden");
      showActionMessage("");
      if (!journeyCompletedTracked) {
        journeyCompletedTracked = true;
        trackAnalyticsEvent("journey_completed", {
          page: "journey",
          section: "cue_cards",
          card_number: cardIndex + 1,
          card_type: cards[cardIndex]?.id || ""
        });
      }
      return;
    }

    cardIndex += 1;
    renderCard();
    setJourneyStep("understand");
  });

  document.querySelector("#details-button")?.addEventListener("click", () => {
    const card = latestResult.cards[cardIndex];
    openModal(card.title, `<p>${buildCardDetail(card)}</p>`);
  });

  document.querySelector("#card-style-button").addEventListener("click", openCardStyleModal);
  document.querySelector("#card-style-marker").addEventListener("click", openCardStyleModal);
  document.querySelector("#check-button").addEventListener("click", () => {
    openDocumentCheck();
  });
}

function wireActions() {
  document.querySelector("#copy-summary").addEventListener("click", async () => {
    setJourneyStep("act");
    trackAnalyticsEvent("copy_summary_clicked", {
      page: "journey",
      section: "actions"
    });
    const text = latestResult.cards.map((card) => `${card.title} ${card.short_answer}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      showActionMessage("Summary copied.");
    } catch (error) {
      showActionMessage("Copy did not work. You can copy from the card text.");
    }
  });

  document.querySelector("#add-calendar").addEventListener("click", () => {
    setJourneyStep("act");
    const deadlineCard = latestResult.cards.find((card) => card.id === "when_is_it_due");
    const deadlineText = deadlineCard?.date || null;

    if (deadlineText) {
      openModal(
        "Calendar preview",
        `<p><strong>Event:</strong> Document follow-up</p><p><strong>Date:</strong> ${deadlineText}</p><p>This is a preview only.</p>`
      );
    } else {
      openModal("Calendar preview", "<p>No clear deadline found.<br>Calendar event cannot be created yet.</p>");
    }
  });

  document.querySelector("#send-reminder").addEventListener("click", openReminderModal);

  document.querySelector("#review-check").addEventListener("click", openDocumentCheck);
  document.querySelector("#give-feedback").addEventListener("click", openFeedbackModal);

  document.querySelector("#upload-another").addEventListener("click", () => {
    form.reset();
    pendingDocumentJobId = null;
    latestUploadInputQuality = "unknown";
    latestOcrStatus = "unknown";
    lastTrackedCardKey = "";
    journeyCompletedTracked = false;
    fileName.textContent = "PDF, image, or document";
    setStatus("Choose a document to begin.");
    latestResult = createMockApiResult();
    cardIndex = 0;
    renderCard();
    setJourneyStep("upload");
    document.querySelector("#achievement").classList.add("hidden");
    cardFeedbackPanel.classList.add("hidden");
    fileInput.focus();
  });

  document.querySelector("#modal-close").addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  modal.addEventListener("pointerdown", (event) => {
    if (!event.target.closest(".modal-box")) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (modal.classList.contains("hidden")) return;

    if (event.key === "Escape") {
      closeModal();
      return;
    }

    if (event.key === "Tab") {
      trapModalFocus(event);
    }
  });
}

function wireHelp() {
  // Help cards use delegated clicks so the modal still works if the page is re-rendered later.
}

function openHelpModal(key, sourceCard) {
  const guide = helpGuides[key];
  if (!guide) return;

  openModal(guide.title, buildHelpModalMarkup(key, guide), {
    returnFocusTo: sourceCard,
    variant: "help",
    closeLabel: "&times;",
    closeAriaLabel: "Close help popup"
  });
}

function buildHelpModalMarkup(key, guide) {
  const steps = guide.steps.map((step) => `
    <li>
      <span class="help-step-icon" aria-hidden="true">${helpStepIconMarkup(step.icon)}</span>
      <span class="help-step-copy">
        <strong>${escapeHtml(step.title)}</strong>
        <small>${escapeHtml(step.detail)}</small>
      </span>
    </li>
  `).join("");

  return `
    <div class="help-modal-content">
      <span class="help-icon-bubble help-modal-icon ${helpIconTone(key)}" aria-hidden="true">${helpIconMarkup(key)}</span>
      <p class="help-modal-text">${escapeHtml(guide.text)}</p>
      <hr class="help-modal-rule">
      <p class="help-modal-section-title">Try these next steps</p>
      <ol class="help-modal-steps">
        ${steps}
      </ol>
      <div class="help-modal-footer">
        <button type="button" class="outline-btn help-modal-back" data-modal-back>&larr; Back</button>
        <button type="button" class="primary-btn help-modal-action" data-help-action="${escapeHtml(guide.actionType)}">${escapeHtml(guide.action)} <span aria-hidden="true">&rarr;</span></button>
      </div>
    </div>
  `;
}

function helpIconTone(key) {
  const tones = {
    overwhelmed: "lavender",
    fake: "sage",
    deadline: "blue",
    time: "cream",
    wrong: "sage",
    person: "lavender"
  };
  return tones[key] || "sage";
}

function helpIconMarkup(key) {
  const icons = {
    overwhelmed: `<svg class="help-line-icon" viewBox="0 0 32 32" focusable="false"><path d="M16 7c-5 0-9 3.6-9 8.2 0 4.8 3.8 8.8 8.8 8.8 4.4 0 7.2-2.8 7.2-6.2 0-3.2-2.4-5.4-5.2-5.4-2.6 0-4.5 1.8-4.5 4 0 2 1.5 3.4 3.4 3.4 1.6 0 2.8-1 2.8-2.3"></path></svg>`,
    fake: `<svg class="help-line-icon" viewBox="0 0 32 32" focusable="false"><path d="M16 5.5 25 9v6.2c0 5.5-3.4 9.4-9 11.3-5.6-1.9-9-5.8-9-11.3V9z"></path><path d="m12.5 12.5 7 7"></path><path d="m19.5 12.5-7 7"></path></svg>`,
    deadline: `<svg class="help-line-icon" viewBox="0 0 32 32" focusable="false"><path d="M8 9.5h16v15H8z"></path><path d="M11.5 6.5v5"></path><path d="M20.5 6.5v5"></path><path d="M8 14h16"></path><path d="M12 18h3"></path><path d="M17 18h3"></path><path d="M12 22h3"></path></svg>`,
    time: `<svg class="help-line-icon" viewBox="0 0 32 32" focusable="false"><circle cx="16" cy="16" r="10"></circle><path d="M16 10.5V16l4 2.5"></path></svg>`,
    wrong: `<svg class="help-line-icon" viewBox="0 0 32 32" focusable="false"><path d="M10 23h12a4 4 0 0 0 .8-7.9 6.8 6.8 0 0 0-13.1-1.8A5 5 0 0 0 10 23z"></path><path d="M16 22V13"></path><path d="m12.8 16.2 3.2-3.2 3.2 3.2"></path></svg>`,
    person: `<svg class="help-line-icon" viewBox="0 0 32 32" focusable="false"><circle cx="12.5" cy="12" r="3.2"></circle><circle cx="20.5" cy="12.5" r="2.8"></circle><path d="M7 24c.8-4 3-6 5.5-6s4.7 2 5.5 6"></path><path d="M17.5 24c.7-3 2.4-4.6 4.5-4.6 1.8 0 3.2 1.2 4 4.6"></path></svg>`
  };

  return icons[key] || icons.overwhelmed;
}

function helpStepIconMarkup(icon) {
  const icons = {
    focus: `<svg class="help-step-svg" viewBox="0 0 24 24" focusable="false"><path d="M12 4l1.4 4.2L17.5 10l-4.1 1.8L12 16l-1.4-4.2L6.5 10l4.1-1.8z"></path><path d="M18.5 14.5l.7 2.1 2.1.9-2.1.9-.7 2.1-.7-2.1-2.1-.9 2.1-.9z"></path></svg>`,
    document: `<svg class="help-step-svg" viewBox="0 0 24 24" focusable="false"><path d="M7 4.5h7l3 3v12H7z"></path><path d="M14 4.5v3h3"></path><path d="M9.5 11h5"></path><path d="M9.5 14h5"></path><path d="M9.5 17h3.4"></path></svg>`,
    pause: `<svg class="help-step-svg" viewBox="0 0 24 24" focusable="false"><path d="M8 9h8v5a4 4 0 0 1-4 4 4 4 0 0 1-4-4z"></path><path d="M16 10h1.5a2 2 0 0 1 0 4H16"></path><path d="M7 20h10"></path><path d="M10 5.5c-.6.6-.6 1.2 0 1.8"></path><path d="M14 5.5c-.6.6-.6 1.2 0 1.8"></path></svg>`,
    shield: `<svg class="help-step-svg" viewBox="0 0 24 24" focusable="false"><path d="M12 3.5 19 6v5.2c0 4.4-2.6 7.3-7 9-4.4-1.7-7-4.6-7-9V6z"></path><path d="M8.7 11.8l2.2 2.2 4.4-4.6"></path></svg>`,
    search: `<svg class="help-step-svg" viewBox="0 0 24 24" focusable="false"><circle cx="10.5" cy="10.5" r="5.5"></circle><path d="m15 15 4.5 4.5"></path></svg>`,
    people: `<svg class="help-step-svg" viewBox="0 0 24 24" focusable="false"><circle cx="9" cy="9" r="2.7"></circle><circle cx="15.8" cy="9.6" r="2.3"></circle><path d="M4.5 19c.8-3.2 2.5-4.8 4.5-4.8s3.7 1.6 4.5 4.8"></path><path d="M13.5 18.8c.7-2.5 2-3.8 3.7-3.8 1.4 0 2.5 1 3.1 3.8"></path></svg>`,
    calendar: `<svg class="help-step-svg" viewBox="0 0 24 24" focusable="false"><path d="M5 6.5h14v13H5z"></path><path d="M8 4v5"></path><path d="M16 4v5"></path><path d="M5 10h14"></path><path d="M8 13.2h2.2"></path><path d="M12 13.2h2.2"></path><path d="M8 16.2h2.2"></path></svg>`,
    bell: `<svg class="help-step-svg" viewBox="0 0 24 24" focusable="false"><path d="M7 17h10l-1.2-2.4V11a3.8 3.8 0 0 0-7.6 0v3.6z"></path><path d="M10 19a2.2 2.2 0 0 0 4 0"></path><path d="M12 5V3.8"></path></svg>`,
    message: `<svg class="help-step-svg" viewBox="0 0 24 24" focusable="false"><path d="M5 6h14v9.5H9l-4 3z"></path><path d="M8.5 10h7"></path><path d="M8.5 13h4.5"></path></svg>`,
    close: `<svg class="help-step-svg" viewBox="0 0 24 24" focusable="false"><path d="M7 7l10 10"></path><path d="M17 7 7 17"></path><circle cx="12" cy="12" r="8"></circle></svg>`,
    folder: `<svg class="help-step-svg" viewBox="0 0 24 24" focusable="false"><path d="M4 7h6l2 2h8v9.5H4z"></path><path d="M4 9h16"></path></svg>`,
    upload: `<svg class="help-step-svg" viewBox="0 0 24 24" focusable="false"><path d="M7 18h10a3 3 0 0 0 .6-5.9 5.2 5.2 0 0 0-10-1.3A3.9 3.9 0 0 0 7 18z"></path><path d="M12 17V10"></path><path d="m9.5 12.5 2.5-2.5 2.5 2.5"></path></svg>`,
    copy: `<svg class="help-step-svg" viewBox="0 0 24 24" focusable="false"><path d="M8 8h10v12H8z"></path><path d="M6 16H4V4h10v2"></path><path d="M10.5 12h5"></path><path d="M10.5 15h5"></path></svg>`
  };

  return icons[icon] || icons.document;
}

function handleHelpAction(action) {
  if (action === "focus") {
    setFocusMode(true, { save: true });
    closeModal();
    return;
  }

  if (action === "check") {
    closeModal();
    setPage("journey");
    openDocumentCheck();
    return;
  }

  if (action === "deadline") {
    closeModal();
    setPage("journey");
    if (!hasUploadedResult()) {
      setJourneyStep("upload");
      setStatus("Upload a document first, then ClearSteps can look for a deadline.", true);
      fileInput.focus();
      return;
    }
    const deadlineIndex = latestResult.cards.findIndex((card) => card.id === "when_is_it_due");
    if (deadlineIndex >= 0) {
      cardIndex = deadlineIndex;
      renderCard();
    }
    setJourneyStep("understand");
    return;
  }

  if (action === "upload") {
    closeModal();
    setPage("journey");
    if (hasUploadedResult()) {
      document.querySelector("#upload-another").click();
      return;
    }
    setJourneyStep("upload");
    fileInput.focus();
    return;
  }

  if (action === "copy") {
    closeModal();
    setPage("journey");
    if (hasUploadedResult()) {
      document.querySelector("#copy-summary").click();
      return;
    }
    setJourneyStep("upload");
    setStatus("Upload a document first, then ClearSteps can make a summary.", true);
    fileInput.focus();
    return;
  }

  closeModal();
  setPage("journey");
}

function wireComfortSettings() {
  document.querySelectorAll(".feeling-btn").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".feeling-btn").forEach((item) => item.classList.toggle("selected", item === button));
    });
  });

  document.querySelectorAll("textarea").forEach((textarea) => {
    textarea.addEventListener("input", () => {
      const counter = textarea.nextElementSibling;
      if (counter?.classList.contains("char-count")) {
        counter.textContent = `${textarea.value.length} / ${textarea.maxLength}`;
      }
    });
  });

  document.querySelectorAll(".colour-style").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".colour-style").forEach((item) => item.classList.toggle("selected", item === button));
      setTheme(button.dataset.colourStyle);
      savePreferences(false);
    });
  });

  document.querySelectorAll(".text-size-btn").forEach((button) => {
    button.addEventListener("click", () => {
      setTextSize(button.dataset.textSize);
      savePreferences(false);
    });
  });

  document.querySelectorAll(".background-style-choice").forEach((button) => {
    button.addEventListener("click", () => {
      setBackgroundStyle(button.dataset.backgroundStyle);
      savePreferences(false);
    });
  });

  document.querySelectorAll(".card-style-choice").forEach((button) => {
    button.addEventListener("click", () => {
      setCardStyle(button.dataset.cardStyleChoice);
      savePreferences(false);
    });
  });

  document.querySelector("#save-comfort").addEventListener("click", savePreferences);
}

function wireFeedback() {
  document.addEventListener("click", (event) => {
    const feedbackLink = event.target.closest("[data-feedback-open]");
    if (feedbackLink) {
      openFeedbackModal(feedbackLink);
      return;
    }

    const modalBack = event.target.closest("[data-modal-back]");
    if (modalBack) {
      closeModal();
      return;
    }

    const helpAction = event.target.closest("[data-help-action]");
    if (helpAction) {
      handleHelpAction(helpAction.dataset.helpAction);
      return;
    }

    const feedbackChoice = event.target.closest("[data-feedback-choice]");
    if (feedbackChoice) {
      activeFeedbackAnswer = feedbackChoice.dataset.feedbackChoice;
      renderFeedbackStepTwo(activeFeedbackAnswer);
      return;
    }

    const feedbackChange = event.target.closest("[data-feedback-change]");
    if (feedbackChange) {
      activeFeedbackAnswer = "";
      renderFeedbackStepOne();
      return;
    }

    const feedbackChip = event.target.closest(".feedback-reason-chip");
    if (feedbackChip) {
      const isSelected = feedbackChip.getAttribute("aria-pressed") === "true";
      feedbackChip.classList.toggle("selected", !isSelected);
      feedbackChip.setAttribute("aria-pressed", String(!isSelected));
      return;
    }

    const ratingButton = event.target.closest(".feedback-rating-btn");
    if (ratingButton) {
      const panel = ratingButton.closest(".short-feedback-panel");
      panel.dataset.rating = ratingButton.dataset.rating;
      panel.querySelectorAll(".feedback-rating-btn").forEach((button) => {
        const isSelected = button === ratingButton;
        button.classList.toggle("selected", isSelected);
        button.setAttribute("aria-pressed", String(isSelected));
      });
      return;
    }

    const sendButton = event.target.closest(".send-short-feedback");
    if (sendButton) {
      saveShortFeedback(sendButton.closest(".short-feedback-panel") || sendButton.closest(".feedback-flow"));
      return;
    }
  });

  document.addEventListener("change", (event) => {
    const contactToggle = event.target.closest("#modal-feedback-contact-toggle");
    if (!contactToggle) return;

    const contactPanel = document.querySelector("#modal-feedback-contact-panel");
    if (!contactPanel) return;

    contactPanel.classList.toggle("hidden", !contactToggle.checked);
    if (contactToggle.checked) {
      contactPanel.querySelector("input")?.focus();
    }
  });
}

function setPage(page) {
  if (!pages.includes(page)) return;
  document.body.dataset.page = page;

  pages.forEach((entry) => {
    pageSections[entry].classList.toggle("active", entry === page);
  });

  pageLinks.forEach((button) => {
    const isActive = button.dataset.pageLink === page;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setTheme(theme) {
  document.body.classList.remove("theme-light", "theme-calm", "theme-lavender", "theme-cream", "theme-sage", "theme-classic", "theme-dark");
  const themeClass = Object.prototype.hasOwnProperty.call(themeConfig, theme) ? theme : "calm";
  currentTheme = themeClass;
  document.body.classList.add(`theme-${themeClass}`);
  applyThemeTokens(themeClass);

  themeButtons.forEach((button) => {
    const isModeActive = button.dataset.theme === "dark" ? themeClass === "dark" : themeClass !== "dark";
    button.classList.toggle("active", isModeActive);
    button.setAttribute("aria-pressed", String(isModeActive));
  });

  if (themeClass !== "dark") {
    document.querySelectorAll(".colour-style").forEach((button) => {
      button.classList.toggle("selected", button.dataset.colourStyle === themeClass);
    });
  }

  setBackgroundStyle(currentBackgroundStyle);
}

function applyThemeTokens(themeClass) {
  const theme = themeConfig[themeClass] || themeConfig.calm;
  const target = document.body.style;
  target.setProperty("--theme-top", theme.top);
  target.setProperty("--theme-bottom", theme.bottom);
  target.setProperty("--theme-soft", theme.soft);
  target.setProperty("--theme-panel", theme.panel);
  target.setProperty("--theme-accent", theme.accent);
  target.setProperty("--theme-line", theme.line);
  target.setProperty("--theme-line-strong", theme.strongLine);
  target.setProperty("--theme-blob-a", theme.blobA);
  target.setProperty("--theme-blob-b", theme.blobB);
  target.setProperty("--theme-blob-c", theme.blobC);
  target.setProperty("--wallpaper-line", hexToRgba(theme.art, 0.1));
  updateBackgroundPreviews(themeClass);
}

function setTextSize(size) {
  const selectedSize = ["small", "medium", "large"].includes(size) ? size : "medium";
  document.body.classList.remove("text-small", "text-large");
  if (selectedSize === "small") document.body.classList.add("text-small");
  if (selectedSize === "large") document.body.classList.add("text-large");

  document.querySelectorAll(".text-size-btn").forEach((button) => {
    const isSelected = button.dataset.textSize === selectedSize;
    button.classList.toggle("selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
}

function setCardStyle(style) {
  const selectedStyle = style === "standard" ? "standard" : "soft";
  document.body.classList.toggle("card-standard", selectedStyle === "standard");

  document.querySelectorAll(".card-style-choice").forEach((button) => {
    const isSelected = button.dataset.cardStyleChoice === selectedStyle;
    button.classList.toggle("selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
}

function setBackgroundStyle(style) {
  const selectedStyle = normaliseBackgroundStyle(style);
  currentBackgroundStyle = selectedStyle;

  document.body.classList.remove(
    ...[...backgroundStyles, ...Object.keys(legacyBackgroundStyles)].map((entry) => `bg-${entry}`)
  );
  document.body.classList.add(`bg-${selectedStyle}`);
  document.body.style.setProperty("--wallpaper-art", makeBackgroundArt(selectedStyle, currentTheme, false));

  document.querySelectorAll(".background-style-choice").forEach((button) => {
    const isSelected = button.dataset.backgroundStyle === selectedStyle;
    button.classList.toggle("selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  const playfulDetails = document.querySelector("#playful-backgrounds");
  const selectedButton = document.querySelector(`.background-style-choice[data-background-style="${selectedStyle}"]`);
  if (playfulDetails && selectedButton && playfulDetails.contains(selectedButton)) {
    playfulDetails.open = true;
  }
}

function updateBackgroundPreviews(themeClass) {
  document.querySelectorAll(".background-style-choice").forEach((button) => {
    const style = normaliseBackgroundStyle(button.dataset.backgroundStyle);
    button.style.setProperty("--preview-art", makeBackgroundArt(style, themeClass, true));
  });
}

function normaliseBackgroundStyle(style) {
  if (backgroundStyles.includes(style)) return style;
  return legacyBackgroundStyles[style] || "plain";
}

function makeBackgroundArt(style, themeClass, isPreview) {
  const selectedStyle = normaliseBackgroundStyle(style);
  if (selectedStyle === "plain") {
    return "none";
  }

  const palette = backgroundPalette(themeClass);
  const width = isPreview ? 220 : 720;
  const height = isPreview ? 260 : 520;
  const opacity = isPreview ? 0.92 : 0.24;
  const content = isPreview
    ? makePreviewBackgroundMotif(selectedStyle, palette, opacity)
    : makePageBackgroundMotif(selectedStyle, palette, opacity);
  const base = isPreview
    ? `<rect width="220" height="260" rx="24" fill="${palette.paper}"/>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${base}${content}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function makePageBackgroundMotif(style, palette, opacity) {
  const symbols = backgroundSymbols(style, palette);
  const uses = {
    dots: `
      <circle cx="96" cy="78" r="5"/><circle cx="304" cy="64" r="4"/><circle cx="526" cy="92" r="5"/>
      <circle cx="184" cy="226" r="5"/><circle cx="430" cy="228" r="4"/><circle cx="640" cy="198" r="5"/>
      <circle cx="92" cy="390" r="5"/><circle cx="338" cy="410" r="5"/><circle cx="574" cy="382" r="4"/>`,
    animals: `
      <use href="#cat" transform="translate(78 58) scale(1.05)"/><use href="#bunny" transform="translate(282 38) scale(0.95)"/><use href="#bird" transform="translate(520 76) scale(1)"/>
      <use href="#turtle" transform="translate(130 258) scale(1)"/><use href="#cat" transform="translate(424 250) scale(0.92)"/><use href="#bunny" transform="translate(626 306) scale(0.9)"/>
      <use href="#bird" transform="translate(246 404) scale(0.85)"/>`,
    dinosaurs: `
      <use href="#longneck" transform="translate(48 58) scale(0.9)"/><use href="#trex" transform="translate(308 56) scale(0.82)"/><use href="#triceratops" transform="translate(526 100) scale(0.82)"/>
      <use href="#stego" transform="translate(112 292) scale(0.88)"/><use href="#longneck" transform="translate(372 312) scale(0.76)"/><use href="#dino-egg" transform="translate(632 340) scale(0.78)"/>`,
    space: `
      <use href="#ring-planet" transform="translate(72 62) scale(0.95)"/><use href="#astronaut" transform="translate(318 52) scale(0.82)"/><use href="#rocket" transform="translate(550 72) scale(0.86)"/>
      <use href="#moon" transform="translate(154 306) scale(0.9)"/><use href="#satellite" transform="translate(376 300) scale(0.86)"/><use href="#star-cluster" transform="translate(612 338) scale(0.78)"/>`,
    ocean: `
      <use href="#wave" transform="translate(42 86) scale(1.05)"/><use href="#fish" transform="translate(360 84) scale(1)"/><use href="#bubble" transform="translate(604 84) scale(1)"/>
      <use href="#fish" transform="translate(112 288) scale(0.88)"/><use href="#wave" transform="translate(356 320) scale(0.95)"/><use href="#bubble" transform="translate(276 410) scale(0.85)"/>`,
    cars: `
      <use href="#suv" transform="translate(52 74) scale(0.82)"/><use href="#sedan" transform="translate(288 78) scale(0.78)"/><use href="#pickup" transform="translate(506 118) scale(0.74)"/>
      <use href="#van" transform="translate(106 302) scale(0.82)"/><use href="#convertible" transform="translate(358 304) scale(0.78)"/><use href="#small-car" transform="translate(572 380) scale(0.72)"/>`,
    shapes: `
      <use href="#soft-circle" transform="translate(72 64) scale(1)"/><use href="#soft-square" transform="translate(302 58) scale(0.92)"/><use href="#soft-star" transform="translate(548 72) scale(0.95)"/>
      <use href="#soft-triangle" transform="translate(150 286) scale(1)"/><use href="#soft-blob" transform="translate(384 274) scale(0.95)"/><use href="#soft-circle" transform="translate(614 354) scale(0.72)"/>`,
    notebook: `
      <path d="M0 96H720M0 188H720M0 280H720M0 372H720M0 464H720"/>
      <path d="M110 0V520"/>
      <use href="#pencil" transform="translate(524 90) scale(0.88)"/><use href="#paper-dot" transform="translate(176 314) scale(1)"/><use href="#paper-dot" transform="translate(438 396) scale(0.9)"/>`,
    cozy: `
      <use href="#book" transform="translate(80 76) scale(1)"/><use href="#lamp" transform="translate(330 58) scale(0.95)"/><use href="#plant" transform="translate(566 88) scale(1)"/>
      <use href="#mug" transform="translate(160 308) scale(1)"/><use href="#book" transform="translate(394 318) scale(0.9)"/><use href="#cushion" transform="translate(606 352) scale(0.84)"/>`,
    heroes: `
      <use href="#shield" transform="translate(92 72) scale(1)"/><use href="#spark" transform="translate(330 84) scale(0.95)"/><use href="#cape" transform="translate(548 76) scale(0.92)"/>
      <use href="#shield" transform="translate(188 306) scale(0.84)"/><use href="#bolt" transform="translate(418 308) scale(0.94)"/><use href="#spark" transform="translate(636 364) scale(0.72)"/>`
  };

  return `${symbols}<g opacity="${opacity}" fill="none" stroke="${palette.line}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${uses[style] || uses.shapes}</g>`;
}

function makePreviewBackgroundMotif(style, palette, opacity) {
  const symbols = backgroundSymbols(style, palette);
  const uses = {
    dots: `<circle cx="58" cy="58" r="6"/><circle cx="158" cy="70" r="5"/><circle cx="110" cy="130" r="6"/><circle cx="58" cy="204" r="5"/><circle cx="166" cy="190" r="6"/>`,
    animals: `<use href="#cat" transform="translate(42 52) scale(1.25)"/><use href="#bunny" transform="translate(126 134) scale(1)"/>`,
    dinosaurs: `<use href="#longneck" transform="translate(26 62) scale(0.74)"/><use href="#stego" transform="translate(72 150) scale(0.58)"/><use href="#trex" transform="translate(112 82) scale(0.54)"/>`,
    space: `<use href="#ring-planet" transform="translate(34 48) scale(0.88)"/><use href="#rocket" transform="translate(120 134) scale(0.74)"/><use href="#astronaut" transform="translate(124 54) scale(0.52)"/><use href="#star-cluster" transform="translate(62 166) scale(0.54)"/>`,
    ocean: `<use href="#wave" transform="translate(20 58) scale(0.78)"/><use href="#fish" transform="translate(72 136) scale(1.1)"/><use href="#bubble" transform="translate(158 90) scale(0.76)"/>`,
    cars: `<use href="#suv" transform="translate(24 66) scale(0.72)"/><use href="#convertible" transform="translate(86 150) scale(0.66)"/><use href="#small-car" transform="translate(118 88) scale(0.56)"/>`,
    shapes: `<use href="#soft-circle" transform="translate(38 50) scale(0.94)"/><use href="#soft-square" transform="translate(118 64) scale(0.78)"/><use href="#soft-star" transform="translate(84 156) scale(0.75)"/>`,
    notebook: `<path d="M0 66H220M0 116H220M0 166H220M0 216H220"/><path d="M48 0V260"/><use href="#pencil" transform="translate(128 72) scale(0.78)"/>`,
    cozy: `<use href="#lamp" transform="translate(52 52) scale(0.92)"/><use href="#mug" transform="translate(128 140) scale(0.9)"/><use href="#plant" transform="translate(42 156) scale(0.82)"/>`,
    heroes: `<use href="#shield" transform="translate(52 48) scale(1.1)"/><use href="#spark" transform="translate(128 144) scale(0.8)"/>`
  };

  return `${symbols}<g opacity="${opacity}" fill="none" stroke="${palette.line}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${uses[style] || uses.shapes}</g>`;
}

function backgroundSymbols(style, palette) {
  const common = {
    dots: `<defs><g id="paper-dot"><circle cx="0" cy="0" r="7" fill="${palette.a}" stroke="${palette.line}"/></g></defs>`,
    animals: `<defs>
      <g id="cat"><circle cx="36" cy="40" r="28" fill="${palette.a}" stroke="${palette.line}"/><path fill="${palette.a}" stroke="${palette.line}" d="M14 22 8 2l22 12M58 22 64 2 42 14"/><path d="M27 39h1M45 39h1M34 49q4 4 8 0M36 43l4 3"/></g>
      <g id="bunny"><ellipse cx="36" cy="48" rx="25" ry="22" fill="${palette.b}" stroke="${palette.line}"/><path fill="${palette.b}" stroke="${palette.line}" d="M22 28C12 4 24-8 34 18M50 28C60 4 48-8 38 18"/><path d="M28 47h1M44 47h1M32 56q5 4 10 0"/></g>
      <g id="bird"><path fill="${palette.c}" stroke="${palette.line}" d="M10 42c22-28 58-24 76 8-22 18-58 18-76-8Z"/><path fill="${palette.d}" stroke="${palette.line}" d="M62 44l22-18v34Z"/><path d="M34 41h1M26 58l-10 14M42 58l8 14"/></g>
      <g id="turtle"><ellipse cx="42" cy="44" rx="34" ry="22" fill="${palette.b}" stroke="${palette.line}"/><circle cx="76" cy="42" r="12" fill="${palette.a}" stroke="${palette.line}"/><path d="M20 58l-12 12M44 62l-2 14M62 58l8 12M26 33q16 16 32 0"/></g>
    </defs>`,
    dinosaurs: `<defs>
      <g id="longneck">
        <ellipse cx="88" cy="98" rx="58" ry="31" fill="${palette.b}" stroke="${palette.line}"/>
        <path fill="${palette.b}" stroke="${palette.line}" d="M128 82c-8-44 16-76 54-74 22 2 34 18 22 34-10 12-30 12-46 2-4 14 0 30 16 48Z"/>
        <path fill="${palette.b}" stroke="${palette.line}" d="M38 88C20 86 8 78 0 62c22 4 42 12 60 26Z"/>
        <path d="M52 122l-10 34M96 126l-4 34M130 118l18 32M184 28h1"/>
      </g>
      <g id="trex">
        <path fill="${palette.c}" stroke="${palette.line}" d="M18 94c22-40 74-54 122-30l28-24c24-20 58-12 66 12 8 26-14 44-48 42-10 22-38 40-76 44-40 4-72-8-92-44Z"/>
        <path d="M54 128l-18 34M110 136l14 32M150 88l-22 18M186 60h1M206 74h22M68 66c-16-8-34-14-54-16"/>
      </g>
      <g id="triceratops">
        <path fill="${palette.a}" stroke="${palette.line}" d="M20 100c20-32 62-44 108-28l42-20c30-14 60 4 64 34-18 16-46 20-78 10-14 24-42 38-82 38-28 0-48-10-54-34Z"/>
        <path fill="${palette.a}" stroke="${palette.line}" d="M164 58c-2-28 14-46 42-48 22 18 26 44 12 70"/>
        <path d="M188 78l34-20M186 80l42 2M62 128l-10 30M118 130l10 30M214 72h1"/>
      </g>
      <g id="stego">
        <path fill="${palette.d}" stroke="${palette.line}" d="M14 102c24-36 80-46 132-22 22 10 38 24 46 42h34c16 0 28 10 34 24-42 8-90 6-138-10-38 16-84 8-108-34Z"/>
        <path fill="${palette.a}" stroke="${palette.line}" d="M58 72 76 38l18 44M100 68l22-42 20 52M148 78l18-34 18 44"/>
        <path d="M58 136l-12 34M122 140l8 34M208 120h1M224 126h24"/>
      </g>
      <g id="dino-egg"><ellipse cx="30" cy="40" rx="24" ry="32" fill="${palette.a}" stroke="${palette.line}"/><path d="M16 40q14 10 28 0M20 58q10 8 22 0"/></g>
    </defs>`,
    space: `<defs>
      <g id="ring-planet"><circle cx="54" cy="54" r="34" fill="${palette.a}" stroke="${palette.line}"/><path d="M4 66c42 22 98 10 134-24M14 84c42-2 80-18 110-50"/><path d="M30 34c16 8 32 8 48 0"/></g>
      <g id="star"><path fill="${palette.d}" stroke="${palette.line}" d="m36 2 10 24 26 3-20 17 6 26-22-14-22 14 6-26L0 29l26-3Z"/></g>
      <g id="small-star"><path fill="${palette.c}" stroke="${palette.line}" d="M22 0l7 16 17 6-17 6-7 18-7-18-15-6 15-6Z"/></g>
      <g id="star-cluster"><use href="#star" transform="scale(0.7)"/><use href="#small-star" transform="translate(70 18) scale(0.65)"/><circle cx="48" cy="82" r="7" fill="${palette.b}" stroke="${palette.line}"/></g>
      <g id="rocket"><path fill="${palette.c}" stroke="${palette.line}" d="M54 4c32 18 48 56 40 102L42 58C22 28 32 12 54 4Z"/><path fill="${palette.d}" stroke="${palette.line}" d="M38 64 8 88l40 10M90 106l-10 38 34-28"/><circle cx="62" cy="44" r="11" fill="${palette.a}" stroke="${palette.line}"/><path fill="${palette.d}" stroke="${palette.line}" d="M44 116c-14 12-16 26-6 42 18-8 26-20 24-38"/></g>
      <g id="astronaut"><circle cx="48" cy="38" r="30" fill="${palette.a}" stroke="${palette.line}"/><circle cx="48" cy="38" r="17" fill="${palette.paper}" stroke="${palette.line}"/><rect x="24" y="70" width="48" height="54" rx="14" fill="${palette.b}" stroke="${palette.line}"/><path d="M24 86 4 72M72 86l22-14M34 92h28M40 108h16M30 124l-12 26M66 124l12 26"/></g>
      <g id="moon"><path fill="${palette.d}" stroke="${palette.line}" d="M72 8C36 18 12 52 18 90c6 38 40 66 78 66 14 0 28-4 40-10-24-4-44-24-50-52-6-34 8-66 36-82-16-6-34-8-50-4Z"/></g>
      <g id="satellite"><rect x="42" y="34" width="46" height="36" rx="8" fill="${palette.b}" stroke="${palette.line}"/><path d="M22 10 42 34M88 70l28 28M18 78l24-18M88 44l32-14"/><rect x="0" y="0" width="36" height="24" rx="4" fill="${palette.a}" stroke="${palette.line}"/><rect x="110" y="88" width="42" height="26" rx="4" fill="${palette.a}" stroke="${palette.line}"/></g>
    </defs>`,
    ocean: `<defs>
      <g id="wave"><path d="M0 34c32-22 64-22 96 0s64 22 96 0 64-22 96 0"/><path d="M22 76c28-18 56-18 84 0s56 18 84 0"/></g>
      <g id="fish"><path fill="${palette.a}" stroke="${palette.line}" d="M4 34c32-28 78-26 108 0-30 26-76 28-108 0Z"/><path fill="${palette.c}" stroke="${palette.line}" d="M112 34l38-24v48Z"/><circle cx="36" cy="30" r="2" fill="${palette.line}" stroke="none"/></g>
      <g id="bubble"><circle cx="16" cy="16" r="10" fill="${palette.b}" stroke="${palette.line}"/><circle cx="46" cy="44" r="7" fill="${palette.b}" stroke="${palette.line}"/><circle cx="28" cy="74" r="5" fill="${palette.b}" stroke="${palette.line}"/></g>
    </defs>`,
    cars: `<defs>
      <g id="small-car"><path fill="${palette.b}" stroke="${palette.line}" d="M20 58h130c16 0 28 12 34 30H2c4-18 10-30 18-30Z"/><path fill="${palette.a}" stroke="${palette.line}" d="M48 58l28-36h54l34 36"/><circle cx="46" cy="90" r="14" fill="${palette.c}" stroke="${palette.line}"/><circle cx="138" cy="90" r="14" fill="${palette.c}" stroke="${palette.line}"/><path d="M84 30h22M118 30h14"/></g>
      <g id="sedan"><path fill="${palette.c}" stroke="${palette.line}" d="M18 72h174c18 0 32 12 38 32H2c4-20 10-32 16-32Z"/><path fill="${palette.a}" stroke="${palette.line}" d="M62 72l42-44h86l48 44"/><circle cx="56" cy="106" r="15" fill="${palette.b}" stroke="${palette.line}"/><circle cx="174" cy="106" r="15" fill="${palette.b}" stroke="${palette.line}"/><path d="M112 38h34M158 38h28"/></g>
      <g id="suv"><path fill="${palette.b}" stroke="${palette.line}" d="M16 68h178c20 0 36 14 44 36H0c6-22 10-36 16-36Z"/><path fill="${palette.a}" stroke="${palette.line}" d="M48 68l30-50h92l58 50"/><circle cx="56" cy="108" r="18" fill="${palette.c}" stroke="${palette.line}"/><circle cx="178" cy="108" r="18" fill="${palette.c}" stroke="${palette.line}"/><path d="M90 28h34M136 28h30M180 42h24"/></g>
      <g id="pickup"><path fill="${palette.d}" stroke="${palette.line}" d="M16 74h104l18-42h68l34 42h56v34H0c4-22 10-34 16-34Z"/><path d="M206 74h78M154 42h28M192 42h14"/><circle cx="56" cy="112" r="16" fill="${palette.b}" stroke="${palette.line}"/><circle cx="218" cy="112" r="16" fill="${palette.b}" stroke="${palette.line}"/></g>
      <g id="van"><path fill="${palette.a}" stroke="${palette.line}" d="M12 42h176c30 0 54 24 58 62H0c2-38 6-62 12-62Z"/><path d="M42 56h36M92 56h36M142 56h36"/><circle cx="56" cy="108" r="16" fill="${palette.c}" stroke="${palette.line}"/><circle cx="190" cy="108" r="16" fill="${palette.c}" stroke="${palette.line}"/></g>
      <g id="convertible"><path fill="${palette.c}" stroke="${palette.line}" d="M18 70h158c20 0 36 14 42 34H2c4-20 10-34 16-34Z"/><path d="M78 70c26-34 68-38 112-10M132 44l30 24"/><circle cx="52" cy="108" r="15" fill="${palette.b}" stroke="${palette.line}"/><circle cx="168" cy="108" r="15" fill="${palette.b}" stroke="${palette.line}"/></g>
      <g id="road-dot"><rect x="0" y="22" width="68" height="18" rx="9" fill="${palette.d}" stroke="${palette.line}"/></g>
    </defs>`,
    shapes: `<defs>
      <g id="soft-circle"><circle cx="42" cy="42" r="40" fill="${palette.a}" stroke="${palette.line}"/></g>
      <g id="soft-square"><rect x="0" y="0" width="84" height="84" rx="22" fill="${palette.b}" stroke="${palette.line}"/></g>
      <g id="soft-triangle"><path fill="${palette.c}" stroke="${palette.line}" d="M44 0 88 78H0Z"/></g>
      <g id="soft-star"><path fill="${palette.d}" stroke="${palette.line}" d="m42 0 11 28 31 4-23 20 7 31-26-17-26 17 7-31L0 32l31-4Z"/></g>
      <g id="soft-blob"><path fill="${palette.c}" stroke="${palette.line}" d="M42 4c28-12 66 2 76 30 12 32-14 66-48 72-32 6-66-14-70-44C-4 34 14 16 42 4Z"/></g>
    </defs>`,
    notebook: `<defs>
      <g id="pencil"><path fill="${palette.d}" stroke="${palette.line}" d="M8 78 58 10l26 20-52 68-30 8Z"/><path d="m58 10 26 20M22 84l14 10"/></g>
      <g id="paper-dot"><circle cx="0" cy="0" r="8" fill="${palette.a}" stroke="${palette.line}"/></g>
    </defs>`,
    cozy: `<defs>
      <g id="book"><path fill="${palette.a}" stroke="${palette.line}" d="M8 18h54c18 0 30 12 30 30v58H38c-18 0-30-12-30-30Z"/><path fill="${palette.b}" stroke="${palette.line}" d="M92 18h54v88H92Z"/><path d="M92 22v84M28 44h38M28 64h36"/></g>
      <g id="lamp"><path fill="${palette.d}" stroke="${palette.line}" d="M28 4h54l26 58H2Z"/><path d="M54 62v58M28 120h54"/></g>
      <g id="mug"><path fill="${palette.c}" stroke="${palette.line}" d="M10 22h72v54c0 20-16 34-36 34S10 96 10 76Z"/><path d="M82 44h22c20 0 20 44 0 44H82"/></g>
      <g id="plant"><path fill="${palette.a}" stroke="${palette.line}" d="M30 78h72l-10 48H40Z"/><path fill="${palette.b}" stroke="${palette.line}" d="M66 74C28 52 18 26 42 8c18 18 26 40 24 66ZM70 74c30-34 62-42 78-18-16 28-42 36-78 18Z"/></g>
      <g id="cushion"><rect x="4" y="8" width="82" height="66" rx="20" fill="${palette.b}" stroke="${palette.line}"/></g>
    </defs>`,
    heroes: `<defs>
      <g id="shield"><path fill="${palette.a}" stroke="${palette.line}" d="M42 0 84 16v38c0 42-18 70-42 86C18 124 0 96 0 54V16Z"/><path d="M42 18v92"/></g>
      <g id="spark"><path fill="${palette.d}" stroke="${palette.line}" d="M42 0 54 34l34 10-34 12-12 34-12-34L0 44l30-10Z"/></g>
      <g id="cape"><path fill="${palette.c}" stroke="${palette.line}" d="M16 0c44 16 72 52 72 108-32-20-56-22-88-8C22 66 26 34 16 0Z"/></g>
      <g id="bolt"><path fill="${palette.d}" stroke="${palette.line}" d="M48 0 12 68h42l-28 78 76-104H58Z"/></g>
    </defs>`
  };

  return common[style] || common.shapes;
}

function backgroundPalette(themeClass) {
  const palettes = {
    calm: { paper: "#fffdf8", a: "#dfe8d8", b: "#d9e7f0", c: "#fff1d8", d: "#f3d5c8", line: "#2f5b35" },
    light: { paper: "#fffdf8", a: "#dfe8d8", b: "#d9e7f0", c: "#fff1d8", d: "#f3d5c8", line: "#2f5b35" },
    lavender: { paper: "#fffaff", a: "#e6e1f5", b: "#f9dcd6", c: "#d6cfef", d: "#fff1d8", line: "#4c5271" },
    cream: { paper: "#fffaf0", a: "#ffe8b8", b: "#eee4c8", c: "#fff4df", d: "#f2d9c8", line: "#5a5136" },
    sage: { paper: "#fffdfa", a: "#dce7d2", b: "#f4f4dd", c: "#d7e8dd", d: "#fff1d8", line: "#2f5b35" },
    classic: { paper: "#f8f9fb", a: "#e7ebf2", b: "#d8dde8", c: "#eef1f5", d: "#c7cedb", line: "#1f2d45" },
    dark: { paper: "#1c2529", a: "#3a4b40", b: "#3b3855", c: "#5c4c31", d: "#5b3834", line: "#b6d2ad" }
  };

  return palettes[themeClass] || palettes.calm;
}

function hexToRgba(hex, alpha) {
  const value = hex.replace("#", "");
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function setJourneyStep(step) {
  railSteps.forEach((item) => {
    item.classList.toggle("active", item.dataset.rail === step);
  });

  journeyPage.classList.remove("upload-active", "understand-active", "act-active", "check-active");
  journeyPage.classList.add(`${step}-active`);
  document.body.dataset.journeyStep = step;
}

function moveToRailStep(step) {
  setPage("journey");

  if (step === "upload") {
    setJourneyStep("upload");
    return;
  }

  if (!hasUploadedResult()) {
    setJourneyStep("upload");
    setStatus("Upload a document first, then you can check it.", true);
    if (step === "check") {
      openDocumentCheck();
    }
    return;
  }

  setJourneyStep(step);

  if (step === "check") {
    openDocumentCheck();
  }
}

function openDocumentCheck() {
  if (!hasUploadedResult()) {
    setJourneyStep("upload");
    openModal("Document check", "<p>Upload a document first.<br>Then ClearSteps can check trust, severity, and next steps.</p>");
    return;
  }

  setJourneyStep("check");
  trackAnalyticsEvent("document_check_clicked", {
    page: "journey",
    section: "document_check"
  });
  openModal("Document check", buildCheckMarkup(latestResult.trust));
}

function renderCard() {
  const card = latestResult.cards[cardIndex];

  document.querySelector("#card-progress").textContent = `Card ${cardIndex + 1} of ${latestResult.cards.length}`;
  document.querySelector("#card-style-marker").innerHTML = stylePillMarkup(labelForStyle(activeCardStyle));
  document.querySelector("#card-icon").innerHTML = cardIconMarkup(card.id);
  document.querySelector("#card-title").textContent = card.title;
  document.querySelector("#card-answer").textContent = card.short_answer;
  document.querySelector("#card-explanation").textContent = shortCardExplanation(card);
  document.querySelector("#card-feedback").textContent = cardEncouragement[cardIndex] || "Keep going at your own pace.";

  if (Array.isArray(card.steps) && card.steps.length > 0) {
    cardSteps.classList.remove("hidden");
    cardSteps.innerHTML = card.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
  } else {
    cardSteps.classList.add("hidden");
    cardSteps.innerHTML = "";
  }

  renderProgressDots();
  trackCurrentCardViewed();
}

function stylePillMarkup(label) {
  return escapeHtml(label);
}

function cardIconMarkup(cardId) {
  const icons = {
    what_is_this: `<svg viewBox="0 0 24 24" focusable="false"><path d="M8 4h6l3 3v13H8z"></path><path d="M14 4v4h4"></path><path d="M10.5 11h5"></path><path d="M10.5 14h5"></path><path d="M10.5 17h3.5"></path></svg>`,
    what_matters_most: `<svg viewBox="0 0 24 24" focusable="false"><path d="M12 4v16"></path><path d="M5 9h14"></path><path d="M7 15h10"></path></svg>`,
    what_do_i_need_to_do: `<svg viewBox="0 0 24 24" focusable="false"><path d="M8 6h10"></path><path d="M8 12h10"></path><path d="M8 18h10"></path><path d="M4 6l1 1 2-2"></path><path d="M4 12l1 1 2-2"></path><path d="M4 18l1 1 2-2"></path></svg>`,
    when_is_it_due: `<svg viewBox="0 0 24 24" focusable="false"><path d="M6 7h12v12H6z"></path><path d="M8 4v4"></path><path d="M16 4v4"></path><path d="M6 10h12"></path></svg>`,
    what_could_happen: `<svg viewBox="0 0 24 24" focusable="false"><path d="M12 4l7 4v4c0 4-2.6 7-7 8-4.4-1-7-4-7-8V8z"></path><path d="M12 8v5"></path><path d="M12 16h.01"></path></svg>`,
    helpful_note: `<svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="8"></circle><path d="M12 11v5"></path><path d="M12 8h.01"></path></svg>`
  };

  return icons[cardId] || icons.what_is_this;
}

function shortCardExplanation(card) {
  if (card.id === "what_is_this") {
    return "It can be read clearly, so we can pull out the key points.";
  }
  if (card.id === "what_matters_most") {
    return "This helps you know what needs attention first.";
  }
  if (card.id === "what_do_i_need_to_do") {
    return "Use these as small steps, one at a time.";
  }
  if (card.id === "when_is_it_due") {
    return card.date ? "Use this date before making a reminder." : "No clear date was found in the document.";
  }
  if (card.id === "what_could_happen") {
    return "This helps you decide how carefully to respond.";
  }
  return "Check the original document if anything feels unclear.";
}

function renderProgressDots() {
  progressDots.innerHTML = latestResult.cards
    .map((card, index) => `<span class="progress-dot${index === cardIndex ? " active" : ""}" aria-label="${index + 1} of ${latestResult.cards.length}"></span>`)
    .join("");
}

function openCardStyleModal() {
  const styles = [
    { id: "simple", label: "Simple view" },
    { id: "animal", label: "Animal Cards" },
    { id: "shape", label: "Shape Cards" },
    { id: "map", label: "Map Cards" }
  ];

  const markup = styles
    .map((style) => {
      const activeText = style.id === activeCardStyle ? " selected" : "";
      return `<button type="button" class="outline-btn style-option${activeText}" data-style="${style.id}">${style.label}</button>`;
    })
    .join("");

  openModal("Card style", `<div class="style-list">${markup}<p>Custom card packs coming later.</p></div>`);

  document.querySelectorAll(".style-option").forEach((button) => {
    button.addEventListener("click", () => {
      activeCardStyle = button.dataset.style;
      if (activeCardStyle === "simple") {
        trackAnalyticsEvent("simple_view_used", {
          page: "journey",
          section: "card_style"
        });
      }
      closeModal();
      renderCard();
      showActionMessage(`${labelForStyle(activeCardStyle)} selected.`);
    });
  });
}

function openReminderModal() {
  setJourneyStep("act");
  openModal(
    "Send reminder",
    `<div class="reminder-list">
      <button type="button" class="outline-btn">Today</button>
      <button type="button" class="outline-btn">Tomorrow</button>
      <button type="button" class="outline-btn">Three days before deadline</button>
      <button type="button" class="outline-btn">One week before deadline</button>
      <button type="button" class="outline-btn">Custom</button>
      <p><strong>Notification permission needed</strong></p>
      <button type="button" class="primary-btn" id="allow-notification">Allow notifications</button>
      <p>This is a placeholder. Real scheduling is not active yet.</p>
    </div>`
  );

  document.querySelector("#allow-notification").addEventListener("click", () => {
    closeModal();
    showActionMessage("Notification permission placeholder shown.");
  });
}

function openFeedbackModal(sourceButton) {
  activeFeedbackAnswer = "";
  const returnTarget = sourceButton?.currentTarget || sourceButton?.target || sourceButton;
  trackAnalyticsEvent("feedback_opened", {
    page: document.body.dataset.page || "unknown",
    section: "feedback"
  });
  openModal("Give feedback", buildFeedbackStepOneMarkup(), {
    returnFocusTo: returnTarget,
    variant: "feedback"
  });
}

function renderFeedbackStepOne() {
  modalTitle.textContent = "Give feedback";
  modalContent.innerHTML = buildFeedbackStepOneMarkup();
  modalContent.querySelector("[data-feedback-choice]")?.focus();
}

function renderFeedbackStepTwo(answerKey) {
  const choice = feedbackChoices[answerKey] || feedbackChoices.little;
  modalTitle.textContent = "Give feedback";
  modalContent.innerHTML = buildFeedbackStepTwoMarkup(answerKey, choice);
  modalContent.querySelector(".feedback-reason-chip")?.focus();
}

function buildFeedbackStepOneMarkup() {
  const choices = Object.entries(feedbackChoices).map(([key, choice]) => `
    <button type="button" class="feedback-choice-card ${choice.tone}" data-feedback-choice="${key}">
      <span class="feedback-face" aria-hidden="true">${feedbackFaceMarkup(key)}</span>
      <strong>${escapeHtml(choice.label)}</strong>
      <small>${escapeHtml(choice.detail)}</small>
    </button>
  `).join("");

  return `
    <section class="feedback-flow modal-feedback-panel" data-feedback-context="modal">
      <p class="feedback-intro">Your feedback helps us make ClearSteps better.</p>
      <hr class="feedback-rule">
      <div class="feedback-question">
        <h3>Was this helpful?</h3>
        <p>This will only take a few seconds.</p>
      </div>
      <div class="feedback-choice-row" role="group" aria-label="Was this helpful?">
        ${choices}
      </div>
      <p class="feedback-private-note">${feedbackPrivacyIcon()} Your feedback is private and helps us improve.</p>
    </section>
  `;
}

function buildFeedbackStepTwoMarkup(answerKey, choice) {
  const chips = choice.chips.map((chip) => `
    <button type="button" class="feedback-reason-chip" data-reason="${escapeHtml(chip)}" aria-pressed="false">
      ${feedbackReasonIcon(chip)}
      <span>${escapeHtml(chip)}</span>
    </button>
  `).join("");

  return `
    <section class="feedback-flow modal-feedback-panel feedback-step-two" data-feedback-context="modal" data-rating="${escapeHtml(choice.rating)}" data-answer="${answerKey}">
      <div class="feedback-selected-bar ${choice.tone}">
        <span>You selected: <strong>${escapeHtml(choice.rating)}</strong></span>
        <button type="button" data-feedback-change>Change</button>
      </div>
      <div class="feedback-question">
        <h3>${escapeHtml(choice.heading)}</h3>
        <p>Choose any that apply.</p>
      </div>
      <div class="feedback-chip-grid" role="group" aria-label="${escapeHtml(choice.heading)}">
        ${chips}
      </div>
      <label class="feedback-label" for="modal-feedback-comment">Anything else? <span>optional</span></label>
      <textarea id="modal-feedback-comment" class="short-feedback-comment" maxlength="240" placeholder="A short note is enough."></textarea>
      <div class="feedback-contact-toggle-row">
        <label>
          <input id="modal-feedback-contact-toggle" type="checkbox">
          <span>I'm happy for ClearSteps to contact me about this</span>
        </label>
      </div>
      <div id="modal-feedback-contact-panel" class="optional-contact feedback-contact-reveal hidden">
        <label class="feedback-label" for="modal-feedback-contact">Email or phone number</label>
        <input id="modal-feedback-contact" class="feedback-contact-input" type="text" placeholder="Your email or phone number">
        <small>We'll only use this for your feedback.</small>
      </div>
      <button type="button" class="primary-btn send-short-feedback">${sendIconMarkup()} Send feedback</button>
      <p class="feedback-saved-message" role="status" aria-live="polite"></p>
    </section>
  `;
}

function feedbackFaceMarkup(key) {
  const faces = {
    yes: `<svg viewBox="0 0 40 40" focusable="false"><circle cx="20" cy="20" r="17"></circle><path d="M13.5 17.5h.1"></path><path d="M26.5 17.5h.1"></path><path d="M13.5 23.5c3 3 10 3 13 0"></path></svg>`,
    little: `<svg viewBox="0 0 40 40" focusable="false"><circle cx="20" cy="20" r="17"></circle><path d="M13.5 17.5h.1"></path><path d="M26.5 17.5h.1"></path><path d="M14 25h12"></path></svg>`,
    no: `<svg viewBox="0 0 40 40" focusable="false"><circle cx="20" cy="20" r="17"></circle><path d="M13.5 17.5h.1"></path><path d="M26.5 17.5h.1"></path><path d="M13.5 27c3-3 10-3 13 0"></path></svg>`
  };

  return faces[key] || faces.little;
}

function feedbackReasonIcon(reason) {
  const icons = {
    "Simple words": `<svg viewBox="0 0 24 24" focusable="false"><path d="M5 8h5"></path><path d="M5 12h8"></path><path d="M5 16h6"></path><path d="M16 7v10"></path><path d="m13.5 9 2.5-2 2.5 2"></path></svg>`,
    "Clear next step": `<svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="8"></circle><path d="m8.5 12 2.2 2.2 4.8-5"></path></svg>`,
    "Easy to read": `<svg viewBox="0 0 24 24" focusable="false"><path d="M3.5 12s3.2-5 8.5-5 8.5 5 8.5 5-3.2 5-8.5 5-8.5-5-8.5-5z"></path><circle cx="12" cy="12" r="2.5"></circle></svg>`,
    "Less overwhelming": `<svg viewBox="0 0 24 24" focusable="false"><path d="M18 5c-5.5.4-9.4 3.4-10.5 9.5"></path><path d="M18 5c-.2 6-3.2 10-9.5 11.5"></path><path d="M7.5 14.5 5 17"></path></svg>`,
    "Focus mode helped": `<svg viewBox="0 0 24 24" focusable="false"><path d="M12 4v3"></path><path d="M12 17v3"></path><path d="M4 12h3"></path><path d="M17 12h3"></path><circle cx="12" cy="12" r="3.5"></circle></svg>`,
    "Too much text": `<svg viewBox="0 0 24 24" focusable="false"><path d="M5 7h14"></path><path d="M5 11h14"></path><path d="M5 15h10"></path><path d="M5 19h8"></path></svg>`,
    "Action was unclear": `<svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="8"></circle><path d="M12 8v5"></path><path d="M12 16.5h.1"></path></svg>`,
    "Deadline was unclear": `<svg viewBox="0 0 24 24" focusable="false"><path d="M5 6h14v14H5z"></path><path d="M8 4v4"></path><path d="M16 4v4"></path><path d="M5 10h14"></path><path d="M12 14v2.5"></path><path d="M12 18h.1"></path></svg>`,
    "Words felt difficult": `<svg viewBox="0 0 24 24" focusable="false"><path d="M4 17 8.5 7l4.5 10"></path><path d="M6 13h5"></path><path d="M14 17V9"></path><path d="M14 9h3.5a2.5 2.5 0 0 1 0 5H14"></path></svg>`,
    "Needed more support": `<svg viewBox="0 0 24 24" focusable="false"><circle cx="8.5" cy="10" r="2.8"></circle><circle cx="16" cy="10.5" r="2.4"></circle><path d="M4 19c.7-3.2 2.4-5 4.5-5s3.8 1.8 4.5 5"></path><path d="M13 19c.6-2.4 1.8-3.7 3.4-3.7S19.2 16.6 20 19"></path></svg>`,
    "I was still confused": `<svg viewBox="0 0 24 24" focusable="false"><path d="M8.5 9a3.5 3.5 0 0 1 7 0c0 3-3.5 2.8-3.5 5.5"></path><path d="M12 18h.1"></path><circle cx="12" cy="12" r="9"></circle></svg>`,
    "Wrong information": `<svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="8"></circle><path d="m9 9 6 6"></path><path d="m15 9-6 6"></path></svg>`,
    "Too much information": `<svg viewBox="0 0 24 24" focusable="false"><path d="M6 5h12"></path><path d="M6 8h12"></path><path d="M6 11h12"></path><path d="M6 14h12"></path><path d="M6 17h8"></path></svg>`,
    "I did not know what to do": `<svg viewBox="0 0 24 24" focusable="false"><path d="M5 12h11"></path><path d="m12 8 4 4-4 4"></path><path d="M18.5 6.5v11"></path></svg>`,
    "I did not trust it": `<svg viewBox="0 0 24 24" focusable="false"><path d="M12 4.5 19 7v5c0 4.5-2.6 7.4-7 8.8-4.4-1.4-7-4.3-7-8.8V7z"></path><path d="M12 9v4"></path><path d="M12 16.5h.1"></path></svg>`
  };

  return icons[reason] || `<svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="8"></circle></svg>`;
}

function feedbackPrivacyIcon() {
  return `<svg viewBox="0 0 20 20" focusable="false" aria-hidden="true"><path d="M10 3.5 15 5.2v3.7c0 3.2-1.8 5.5-5 6.6-3.2-1.1-5-3.4-5-6.6V5.2z"></path><path d="M8.4 10.2h3.2"></path><path d="M8.8 10V8.8a1.2 1.2 0 0 1 2.4 0V10"></path></svg>`;
}

function sendIconMarkup() {
  return `<svg class="button-line-icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M4 12 20 5l-5.5 14-3-6.2z"></path><path d="m11.5 12.8 4-4"></path></svg>`;
}

function feedbackHeartIcon() {
  return `<svg viewBox="0 0 32 32" focusable="false"><path d="M16 25s-8.5-4.8-8.5-11a4.8 4.8 0 0 1 8.5-3.1A4.8 4.8 0 0 1 24.5 14c0 6.2-8.5 11-8.5 11z"></path></svg>`;
}

function normaliseFeedbackRating(value, answerKey) {
  if (answerKey) return answerKey;

  const rating = String(value || "").toLowerCase();
  if (rating.startsWith("yes")) return "yes";
  if (rating.includes("little") || rating.includes("partly")) return "little";
  if (rating.startsWith("no")) return "no";
  return "";
}

function getFeedbackPayload(panel) {
  const contactToggle = panel.querySelector("#modal-feedback-contact-toggle");

  return {
    rating: normaliseFeedbackRating(panel.dataset.rating, panel.dataset.answer),
    reasons: Array.from(panel.querySelectorAll(".feedback-reason-chip.selected")).map((chip) => chip.dataset.reason),
    note: panel.querySelector(".short-feedback-comment")?.value.trim() || "",
    contact_permission: contactToggle ? contactToggle.checked : false,
    page: document.body.dataset.page || "unknown",
    section: panel.dataset.feedbackContext || "feedback",
    document_category: latestResult.trust?.document_category || selectedType || "unknown",
    trust_level: latestResult.trust?.trust_assessment || "unknown",
    severity_level: latestResult.trust?.severity_level || "unknown"
  };
}

function saveFeedbackFallback(feedback) {
  const savedFeedback = JSON.parse(localStorage.getItem("clearsteps-feedback") || "[]");
  savedFeedback.unshift({
    rating: feedback.rating,
    reasons: feedback.reasons,
    note: feedback.note,
    contact_permission: feedback.contact_permission,
    page: feedback.page,
    section: feedback.section,
    document_category: feedback.document_category,
    trust_level: feedback.trust_level,
    severity_level: feedback.severity_level,
    timestamp: new Date().toISOString(),
    saved_locally: true
  });
  localStorage.setItem("clearsteps-feedback", JSON.stringify(savedFeedback.slice(0, 50)));
}

async function saveShortFeedback(panel) {
  if (!panel) return;

  const rating = normaliseFeedbackRating(panel.dataset.rating, panel.dataset.answer);
  const message = panel.querySelector(".feedback-saved-message");
  if (!rating) {
    if (message) message.textContent = "Choose one option first.";
    return;
  }

  const sendButton = panel.querySelector(".send-short-feedback");
  if (sendButton) sendButton.disabled = true;

  const feedback = getFeedbackPayload(panel);
  let savedToSupabase = false;

  try {
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedback)
    });
    savedToSupabase = response.ok;
    if (!response.ok) {
      throw new Error("Feedback endpoint did not accept the event.");
    }
  } catch (error) {
    console.warn("Feedback saved locally because Supabase save failed:", error.message);
    saveFeedbackFallback(feedback);
  } finally {
    if (sendButton) sendButton.disabled = false;
  }

  trackAnalyticsEvent("feedback_submitted", {
    page: feedback.page,
    section: feedback.section
  });

  if (panel.dataset.feedbackContext === "modal") {
    modalTitle.textContent = "Thanks.";
    modalContent.innerHTML = `
      <section class="feedback-flow feedback-success" role="status" aria-live="polite">
        <span class="feedback-success-icon" aria-hidden="true">${feedbackHeartIcon()}</span>
        <h3>Thanks.</h3>
        <p>Every bit of feedback helps us make ClearSteps calmer, clearer and more helpful.</p>
        <button type="button" class="primary-btn" data-modal-back>Done</button>
      </section>
    `;
    modalContent.querySelector("[data-modal-back]")?.focus();
    return;
  }

  if (message) {
    message.textContent = savedToSupabase
      ? "Thank you. Your feedback was saved."
      : "Thank you. Your feedback was saved on this device.";
  }
}

function isOcrReadyResult(payload) {
  return payload && Object.prototype.hasOwnProperty.call(payload, "success");
}

function showOcrReadyResult(payload) {
  if (!payload.success) {
    setStatus(payload.error || "This document is hard to read. Please upload a clearer image.", true);
    return;
  }

  pendingDocumentJobId = payload.job_id || null;
  setStatus(payload.message || "Your document is ready.");
}

function buildCardDetail(card) {
  if (card.id === "what_do_i_need_to_do" && card.steps?.length) {
    return card.steps.join(" ");
  }

  if (card.id === "when_is_it_due") {
    return card.date ? `Date found: ${card.date}.` : "No deadline clearly stated.";
  }

  return card.short_answer;
}

function buildCheckMarkup(trust) {
  const bannerText = latestResult.banner?.text || safeActionFromTrust(trust);
  return `
    <div class="check-grid">
      <p><strong>Trust level</strong><br><span class="badge-chip ${classFromLevel(trust.trust_assessment)}">${escapeHtml(trust.trust_assessment)}</span></p>
      <p><strong>Severity</strong><br><span class="badge-chip ${classFromLevel(trust.severity_level)}">${escapeHtml(trust.severity_level)}</span></p>
      <p><strong>Document status</strong><br>${escapeHtml(trust.document_type || "unknown")}</p>
      <p><strong>Confidence</strong><br><span class="badge-chip ${classFromLevel(trust.confidence)}">${escapeHtml(trust.confidence)}</span></p>
      <p><strong>Needs review</strong><br>${trust.needs_human_review ? "Yes" : "No"}</p>
      <p><strong>Possible issue</strong><br>${escapeHtml(trust.review_reason || "No major issue found.")}</p>
      <p><strong>Safe next step</strong><br>${escapeHtml(trust.safe_next_step || bannerText)}</p>
    </div>
  `;
}

function safeActionFromTrust(trust) {
  if (trust.processing_mode === "verification_only") {
    return "Verify using official contact details before acting.";
  }
  if (trust.processing_mode === "unsupported") {
    return "Use a clearer upload or ask for help checking details.";
  }
  return "Check the original document before acting.";
}

function classFromLevel(level) {
  const value = String(level || "").toLowerCase();
  if (value.includes("urgent") || value.includes("high") || value.includes("low")) return "badge-high";
  if (value.includes("medium")) return "badge-medium";
  return "badge-low";
}

function labelForStyle(style) {
  const labels = {
    simple: "Simple view",
    animal: "Animal Cards",
    shape: "Shape Cards",
    map: "Map Cards"
  };
  return labels[style] || "Simple view";
}

function showActionMessage(message) {
  document.querySelector("#action-message").textContent = message;
}

function setStatus(message, isError = false) {
  if (!statusText) return;

  const file = fileInput?.files?.[0];
  const shouldHide = !isError && !file && message === "Choose a document to begin.";
  statusText.classList.toggle("hidden", shouldHide);
  statusText.classList.toggle("error", isError);

  if (shouldHide) return;

  if (!statusTitle || !statusDetail) {
    statusText.textContent = message;
    return;
  }

  if (isError) {
    statusTitle.textContent = "Please check your upload";
    statusDetail.textContent = message;
    return;
  }

  if (message === "Document selected." || message === "Your document is ready.") {
    statusTitle.textContent = "Document ready";
    statusDetail.textContent = file ? `${file.name} • ${formatFileSize(file.size)}` : message;
    return;
  }

  statusTitle.textContent = message;
  statusDetail.textContent = file ? `${file.name} • ${formatFileSize(file.size)}` : "";
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Reading..." : "Understand this document \u2192";
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, unitIndex);
  return `${value >= 10 || unitIndex === 0 ? Math.round(value) : value.toFixed(1)} ${units[unitIndex]}`;
}

function openModal(title, html, options = {}) {
  modalReturnFocusTarget = options.returnFocusTo || document.activeElement;
  modalTitle.textContent = title;
  modalContent.innerHTML = html;
  modal.classList.toggle("help-modal", options.variant === "help");
  modal.classList.toggle("feedback-modal", options.variant === "feedback");
  modal.classList.remove("hidden");
  const closeButton = document.querySelector("#modal-close");
  closeButton.innerHTML = options.closeLabel || "Back";
  closeButton.setAttribute("aria-label", options.closeAriaLabel || "Go back");
  closeButton.focus();
}

function closeModal() {
  const returnTarget = modalReturnFocusTarget;
  modalReturnFocusTarget = null;
  modal.classList.add("hidden");
  modal.classList.remove("help-modal");
  modal.classList.remove("feedback-modal");
  const closeButton = document.querySelector("#modal-close");
  closeButton.textContent = "Back";
  closeButton.setAttribute("aria-label", "Go back");
  modalContent.innerHTML = "";
  if (returnTarget && typeof returnTarget.focus === "function" && document.contains(returnTarget)) {
    returnTarget.focus();
  }
}

function trapModalFocus(event) {
  const focusable = Array.from(
    modal.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")
  ).filter((element) => !element.disabled && element.getAttribute("aria-hidden") !== "true");

  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function normalizeApiResult(result) {
  const fallback = createMockApiResult();
  const safeResult = result || {};
  const cards = cardsFromStructuredResult(safeResult, fallback);
  const trust = safeResult.trust || fallback.trust;

  return {
    ...fallback,
    ...safeResult,
    trust: {
      ...fallback.trust,
      ...trust
    },
    banner: {
      ...fallback.banner,
      ...(safeResult.banner || {})
    },
    structured_result: safeResult.structured_result || fallback.structured_result || null,
    cards: cards.map((card, index) => {
      const fallbackCard = fallback.cards[index];
      return {
        ...fallbackCard,
        ...card,
        short_answer: card.short_answer || fallbackCard.short_answer
      };
    })
  };
}

function cardsFromStructuredResult(result, fallback) {
  const structuredCards = result?.structured_result?.cards;

  if (Array.isArray(structuredCards) && structuredCards.length > 0) {
    return fallback.cards.map((fallbackCard, index) => {
      const structuredCard = structuredCards[index];
      return structuredCardToUiCard(structuredCard, index, fallbackCard);
    });
  }

  if (Array.isArray(result.cards) && result.cards.length === 6) {
    return result.cards;
  }

  return fallback.cards;
}

function structuredCardToUiCard(card, index, fallbackCard) {
  if (!card || typeof card !== "object") {
    return fallbackCard;
  }

  const keyPoints = Array.isArray(card.key_points)
    ? card.key_points.filter(Boolean).map((item) => String(item))
    : [];

  return {
    ...fallbackCard,
    id: legacyIdFromStructuredCard(card, fallbackCard),
    title: card.title || fallbackCard.title,
    short_answer: card.simple_explanation || fallbackCard.short_answer,
    steps: keyPoints,
    date: card.possible_deadline || null,
    status: card.status || statusFromStructuredWarning(card.warning) || fallbackCard.status,
    structured_card: {
      ...card,
      card_number: card.card_number || index + 1
    }
  };
}

function legacyIdFromStructuredCard(card, fallbackCard) {
  if (card.card_id) return card.card_id;

  const cardTypeMap = {
    what_is_this: "what_is_this",
    who_sent_it: "what_is_this",
    what_matters_most: "what_matters_most",
    what_do_i_need_to_do: "what_do_i_need_to_do",
    when_does_it_matter: "when_is_it_due",
    what_should_i_check: "what_could_happen",
    what_if_i_feel_stuck: "helpful_note"
  };

  return cardTypeMap[card.card_type] || fallbackCard.id;
}

function statusFromStructuredWarning(warning) {
  const text = String(warning || "").toLowerCase();
  if (!text) return null;
  if (text.includes("urgent") || text.includes("serious")) return "urgent";
  if (text.includes("check") || text.includes("suspicious") || text.includes("unclear")) return "caution";
  return "normal";
}

function createMockApiResult() {
  return {
    job_id: "mock-job",
    hasUploaded: false,
    trust: {
      trust_assessment: "medium",
      severity_level: "medium",
      urgency_level: "soon",
      document_category: "bill_or_payment",
      document_type: "unknown",
      processing_mode: "caution",
      confidence: "medium",
      needs_human_review: false,
      review_reason: "Some details may need checking.",
      authentic_signals: [],
      distrust_signals: [],
      scam_signals: [],
      severity_signals: [],
      input_quality: "borderline",
      safe_next_step: "Check the original document before acting."
    },
    banner: {
      show: true,
      type: "caution",
      text: "Some details need checking before you act."
    },
    structured_result: null,
    cards: [
      { id: "what_is_this", title: "What is this?", short_answer: "This looks like a formal document.", status: "normal" },
      { id: "what_matters_most", title: "What matters most?", short_answer: "This may need checking soon.", status: "normal" },
      { id: "what_do_i_need_to_do", title: "What do I need to do?", short_answer: "Check the amount and due date.", steps: ["Check the amount.", "Check the due date."], status: "normal" },
      { id: "when_is_it_due", title: "When is it due?", short_answer: "No deadline clearly stated.", date: null, status: "normal" },
      { id: "what_could_happen", title: "What could happen if I ignore it?", short_answer: "There may be follow-up action.", status: "caution" },
      { id: "helpful_note", title: "Helpful note", short_answer: "Check the original before acting.", status: "good" }
    ],
    display_text: "",
    tts_script: ""
  };
}

function hasUploadedResult() {
  return Boolean(latestResult.hasUploaded);
}

function savePreferences(showConfirmation = true) {
  const selectedColour = document.body.classList.contains("theme-dark")
    ? "dark"
    : document.querySelector(".colour-style.selected")?.dataset.colourStyle || "calm";
  const selectedTextSize = document.querySelector(".text-size-btn.selected")?.dataset.textSize || "medium";
  const selectedBackground = document.querySelector(".background-style-choice.selected")?.dataset.backgroundStyle || "plain";
  const standardCards = document.body.classList.contains("card-standard");

  localStorage.setItem(
    "clearsteps-preferences",
    JSON.stringify({
      colour: selectedColour,
      backgroundStyle: selectedBackground,
      textSize: selectedTextSize,
      cardStyle: standardCards ? "standard" : "soft",
      focusMode: document.body.classList.contains("focus-mode"),
      dyslexiaMode: document.body.classList.contains("dyslexia-mode")
    })
  );

  if (showConfirmation !== false) {
    openModal("Saved", "<p>Your preferences are saved on this device.</p>");
  }
}

function loadSavedPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem("clearsteps-preferences") || "{}");
    setTheme(saved.colour || "calm");
    setBackgroundStyle(saved.backgroundStyle || "plain");
    setTextSize(saved.textSize || "medium");
    setCardStyle(saved.cardStyle || "soft");
    setFocusMode(Boolean(saved.focusMode), { save: false });
    document.body.classList.toggle("dyslexia-mode", Boolean(saved.dyslexiaMode));

    toggleButtons.forEach((button) => {
      if (button.dataset.toggle === "focus-mode") return;

      const isActive = document.body.classList.contains(button.dataset.toggle);
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  } catch (error) {
    setTheme("calm");
    setBackgroundStyle("plain");
    setTextSize("medium");
    setCardStyle("soft");
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
