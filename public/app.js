const pages = ["home", "journey", "help"];
const styleIcons = {
  simple: ["D", "A", "C", "K", "R", "I"],
  animal: ["O", "F", "E", "T", "B", "N"],
  shape: ["O", "S", "T", "C", "A", "H"],
  map: ["1", "2", "3", "4", "5", "6"]
};

const helpAnswers = {
  overwhelmed: "Read only the Action card first. You do not need to understand everything at once.",
  fake: "Do not pay or share details yet. Check using official contact details.",
  deadline: "Open the Deadline card. If it says unclear, check the original document.",
  time: "Look for contact details in the document. Ask the sender about an extension.",
  person: "Copy the summary and share it with someone you trust.",
  wrong: "Go back and upload another document."
};

let selectedType = "auto";
let activeCardStyle = "simple";
let cardIndex = 0;
let latestResult = createMockApiResult();

const pageSections = Object.fromEntries(
  pages.map((page) => [page, document.querySelector(`#page-${page}`)])
);

const pageLinks = Array.from(document.querySelectorAll("[data-page-link]"));
const themeButtons = Array.from(document.querySelectorAll("[data-theme]"));
const toggleButtons = Array.from(document.querySelectorAll("[data-toggle]"));
const chips = Array.from(document.querySelectorAll(".chip"));
const railSteps = Array.from(document.querySelectorAll(".rail-step"));
const form = document.querySelector("#upload-form");
const fileInput = document.querySelector("#document-file");
const fileName = document.querySelector("#file-name");
const statusText = document.querySelector("#status");
const submitButton = document.querySelector("#submit-button");
const cardSteps = document.querySelector("#card-steps");
const trustBanner = document.querySelector("#trust-banner");
const modal = document.querySelector("#modal");
const modalTitle = document.querySelector("#modal-title");
const modalContent = document.querySelector("#modal-content");

pageLinks.forEach((button) => {
  button.addEventListener("click", () => setPage(button.dataset.pageLink));
});

themeButtons.forEach((button) => {
  button.addEventListener("click", () => setTheme(button.dataset.theme));
});

toggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    document.body.classList.toggle(button.dataset.toggle);
    button.classList.toggle("active");
  });
});

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    selectedType = chip.dataset.category;
    chips.forEach((item) => {
      const isSelected = item === chip;
      item.classList.toggle("active", isSelected);
      item.setAttribute("aria-checked", String(isSelected));
    });
  });
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  fileName.textContent = file ? file.name : "PDF, image, document";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const file = fileInput.files[0];
  if (!file) {
    setStatus("Choose one document first.");
    return;
  }

  setLoading(true);
  setStatus("Reading your document.");
  setJourneyStep("upload");
  document.querySelector("#achievement").classList.add("hidden");

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

    latestResult = normalizeApiResult(payload);
    cardIndex = 0;
    renderCard();
    setJourneyStep("understand");
    setStatus("Your cue cards are ready.");
  } catch (error) {
    setStatus(error.message || "Please try again.");
  } finally {
    setLoading(false);
  }
});

document.querySelector("#card-back").addEventListener("click", () => {
  if (cardIndex === 0) {
    setJourneyStep("upload");
    return;
  }
  cardIndex -= 1;
  renderCard();
});

document.querySelector("#card-next").addEventListener("click", () => {
  const cards = latestResult.cards;
  if (cardIndex >= cards.length - 1) {
    setJourneyStep("act");
    document.querySelector("#achievement").classList.remove("hidden");
    return;
  }

  cardIndex += 1;
  renderCard();
  setJourneyStep("understand");
});

document.querySelector("#details-button").addEventListener("click", () => {
  const card = latestResult.cards[cardIndex];
  const detail = buildCardDetail(card);
  openModal(card.title, `<p>${detail}</p>`);
});

document.querySelector("#card-style-button").addEventListener("click", () => {
  const styles = [
    { id: "simple", label: "Simple Cards" },
    { id: "animal", label: "Animal Cards" },
    { id: "shape", label: "Shape Cards" },
    { id: "map", label: "Map Cards" }
  ];

  const markup = styles
    .map((style) => {
      const activeText = style.id === activeCardStyle ? " (Active)" : "";
      return `<button type="button" class="soft-btn style-option" data-style="${style.id}">${style.label}${activeText}</button>`;
    })
    .join("");

  openModal("Card Style", `<div class="style-list">${markup}<p>Custom card packs coming later.</p></div>`);

  document.querySelectorAll(".style-option").forEach((button) => {
    button.addEventListener("click", () => {
      activeCardStyle = button.dataset.style;
      closeModal();
      renderCard();
      showActionMessage(`${labelForStyle(activeCardStyle)} selected.`);
    });
  });
});

document.querySelector("#check-button").addEventListener("click", () => {
  setJourneyStep("check");
  openModal("Document Check", buildCheckMarkup(latestResult.trust));
});

document.querySelector("#copy-summary").addEventListener("click", async () => {
  setJourneyStep("act");
  const text = latestResult.cards[0]?.short_answer || latestResult.display_text;
  try {
    await navigator.clipboard.writeText(text);
    showActionMessage("Summary copied.");
  } catch (error) {
    showActionMessage(text);
  }
});

document.querySelector("#add-calendar").addEventListener("click", () => {
  setJourneyStep("act");
  const deadlineCard = latestResult.cards.find((card) => card.id === "when_is_it_due");
  const deadlineText = deadlineCard?.date || null;

  if (deadlineText) {
    openModal(
      "Calendar preview",
      `<p><strong>Event:</strong> Document follow-up</p><p><strong>Date:</strong> ${deadlineText}</p>`
    );
  } else {
    openModal("Calendar preview", "<p>No clear deadline found. Calendar event cannot be created yet.</p>");
  }
});

document.querySelector("#send-reminder").addEventListener("click", () => {
  setJourneyStep("act");
  openModal(
    "Send reminder",
    `<div class="reminder-list">
      <button type="button" class="soft-btn">Today</button>
      <button type="button" class="soft-btn">Tomorrow</button>
      <button type="button" class="soft-btn">Three days before deadline</button>
      <button type="button" class="soft-btn">One week before deadline</button>
      <button type="button" class="soft-btn">Custom</button>
      <p><strong>Notification permission needed</strong></p>
      <button type="button" class="primary-btn" id="allow-notification">Allow notifications</button>
      <p>This is a placeholder. Real scheduling is not active yet.</p>
    </div>`
  );

  document.querySelector("#allow-notification").addEventListener("click", () => {
    closeModal();
    showActionMessage("Notification permission placeholder shown.");
  });
});

document.querySelector("#upload-another").addEventListener("click", () => {
  form.reset();
  fileName.textContent = "PDF, image, document";
  setStatus("");
  latestResult = createMockApiResult();
  cardIndex = 0;
  renderCard();
  setJourneyStep("upload");
  document.querySelector("#achievement").classList.add("hidden");
  fileInput.focus();
});

document.querySelectorAll(".help-card").forEach((card) => {
  card.addEventListener("click", () => {
    const key = card.dataset.help;
    openModal(card.textContent, `<p>${helpAnswers[key]}</p>`);
  });
});

document.querySelector("#modal-close").addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.classList.contains("hidden")) {
    closeModal();
  }
});

setTheme("light");
setPage("home");
renderCard();

function setPage(page) {
  if (!pages.includes(page)) return;

  pages.forEach((entry) => {
    pageSections[entry].classList.toggle("active", entry === page);
  });

  pageLinks.forEach((button) => {
    const isActive = button.dataset.pageLink === page;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");
  });
}

function setTheme(theme) {
  document.body.classList.remove("theme-dark", "theme-night");
  if (theme === "dark") document.body.classList.add("theme-dark");
  if (theme === "night") document.body.classList.add("theme-night");

  themeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.theme === theme);
  });
}

function renderCard() {
  const card = latestResult.cards[cardIndex];
  const styleIcon = styleIcons[activeCardStyle][cardIndex] || styleIcons.simple[cardIndex];
  const iconText = activeCardStyle === "simple" ? iconFromCard(card.icon) : styleIcon;

  document.querySelector("#card-progress").textContent = `${cardIndex + 1} of ${latestResult.cards.length}`;
  document.querySelector("#card-style-marker").textContent = labelForStyle(activeCardStyle);
  document.querySelector("#card-status").textContent = `Status: ${statusLabel(card.status)}`;
  document.querySelector("#card-icon").textContent = iconText;
  document.querySelector("#card-title").textContent = card.title;
  document.querySelector("#card-answer").textContent = card.short_answer;

  if (Array.isArray(card.steps) && card.steps.length > 0) {
    cardSteps.classList.remove("hidden");
    cardSteps.innerHTML = card.steps.map((step) => `<li>${step}</li>`).join("");
  } else {
    cardSteps.classList.add("hidden");
    cardSteps.innerHTML = "";
  }

  renderTrustBanner();
}

function renderTrustBanner() {
  const trust = latestResult.trust;
  trustBanner.classList.remove("trust-high", "trust-medium", "trust-low");

  if (trust.trust_assessment === "high") {
    trustBanner.classList.add("trust-high");
    trustBanner.textContent = "This looks like a normal formal document.";
    return;
  }

  if (trust.trust_assessment === "medium") {
    trustBanner.classList.add("trust-medium");
    trustBanner.textContent = "Some parts need checking before you act.";
    return;
  }

  trustBanner.classList.add("trust-low");
  trustBanner.textContent = "This may be suspicious. Check before responding.";
}

function setJourneyStep(step) {
  railSteps.forEach((item) => {
    item.classList.toggle("active", item.dataset.rail === step);
  });
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
  return `
    <div class="check-grid">
      <p><strong>Trust level</strong><br><span class="badge-chip ${classFromLevel(trust.trust_assessment)}">${trust.trust_assessment}</span></p>
      <p><strong>Document type</strong><br>${trust.document_type}</p>
      <p><strong>Processing mode</strong><br>${trust.processing_mode}</p>
      <p><strong>Confidence</strong><br><span class="badge-chip ${classFromLevel(trust.confidence)}">${trust.confidence}</span></p>
      <p><strong>Needs review</strong><br>${trust.needs_human_review ? "Yes" : "No"}</p>
      <p><strong>Safe next step</strong><br>${safeActionFromTrust(trust)}</p>
      <p><strong>Review reason</strong><br>${trust.review_reason}</p>
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
  if (String(level).toLowerCase().includes("high")) return "badge-high";
  if (String(level).toLowerCase().includes("medium")) return "badge-medium";
  return "badge-low";
}

function iconFromCard(icon) {
  const map = {
    document: "D",
    alert: "A",
    checklist: "C",
    calendar: "K",
    risk: "R",
    info: "I"
  };
  return map[icon] || "D";
}

function statusLabel(status) {
  const map = {
    normal: "Normal",
    caution: "Caution",
    urgent: "Urgent",
    good: "Good"
  };
  return map[status] || "Normal";
}

function labelForStyle(style) {
  const labels = {
    simple: "Simple Cards",
    animal: "Animal Cards",
    shape: "Shape Cards",
    map: "Map Cards"
  };
  return labels[style] || "Simple Cards";
}

function showActionMessage(message) {
  document.querySelector("#action-message").textContent = message;
}

function setStatus(message) {
  statusText.textContent = message;
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Reading..." : "Understand this document";
}

function openModal(title, html) {
  modalTitle.textContent = title;
  modalContent.innerHTML = html;
  modal.classList.remove("hidden");
  document.querySelector("#modal-close").focus();
}

function closeModal() {
  modal.classList.add("hidden");
}

function normalizeApiResult(result) {
  const fallback = createMockApiResult();
  const cards = Array.isArray(result.cards) && result.cards.length === 6 ? result.cards : fallback.cards;
  const trust = result.trust || fallback.trust;

  return {
    ...fallback,
    ...result,
    trust: {
      ...fallback.trust,
      ...trust
    },
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

function createMockApiResult() {
  return {
    job_id: "mock-job",
    trust: {
      trust_assessment: "medium",
      document_type: "unknown",
      processing_mode: "caution",
      confidence: "low",
      needs_human_review: false,
      review_reason: "Some details may need checking.",
      authentic_signals: [],
      scam_signals: [],
      input_quality: "borderline"
    },
    cards: [
      { id: "what_is_this", title: "What is this?", short_answer: "Upload a document to begin.", icon: "document", status: "normal" },
      { id: "what_matters_most", title: "What matters most?", short_answer: "Key point appears here after upload.", icon: "alert", status: "normal" },
      { id: "what_do_i_need_to_do", title: "What do I need to do?", short_answer: "No action needed right now.", steps: [], icon: "checklist", status: "good" },
      { id: "when_is_it_due", title: "When is it due?", short_answer: "No deadline clearly stated.", date: null, icon: "calendar", status: "normal" },
      { id: "what_could_happen", title: "What could happen if I ignore it?", short_answer: "No risk clearly stated.", icon: "risk", status: "normal" },
      { id: "helpful_note", title: "Helpful note", short_answer: "No extra note.", icon: "info", status: "good" }
    ],
    display_text: "",
    tts_script: ""
  };
}
