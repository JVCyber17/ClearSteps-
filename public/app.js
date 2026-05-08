const pages = ["home", "journey", "help"];
const journeyCardsTemplate = [
  { key: "what_this_is", title: "What is this", icon: "D" },
  { key: "important_points", title: "What matters most", icon: "P" },
  { key: "action", title: "What do I need to do", icon: "A" },
  { key: "deadline", title: "When is it due", icon: "C" },
  { key: "risk", title: "What could happen", icon: "W" },
  { key: "note", title: "Helpful note", icon: "I" }
];

const helpAnswers = {
  overwhelmed: "Read only the Action card first. You do not need to understand everything at once.",
  fake: "Do not pay or share details yet. Check using official contact details.",
  deadline: "Open the Deadline card. If it says unclear, check the original document.",
  time: "Look for contact details in the document. Ask the sender about an extension.",
  person: "Copy the summary and share it with someone you trust.",
  wrong: "Go back and upload another document."
};

const cardStyles = {
  simple: { label: "Simple Cards", icons: ["D", "P", "A", "C", "W", "I"] },
  animal: { label: "Animal Cards", icons: ["O", "B", "F", "T", "E", "B"] },
  shape: { label: "Shape Cards", icons: ["O", "S", "A", "C", "T", "H"] },
  map: { label: "Map Cards", icons: ["1", "2", "3", "4", "5", "6"] }
};

let latestResult = createMockResult();
let selectedType = "auto";
let activePage = "home";
let activeTheme = "light";
let activeCardStyle = "simple";
let cardIndex = 0;

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
    const className = button.dataset.toggle;
    document.body.classList.toggle(className);
    button.classList.toggle("active");
  });
});

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    selectedType = chip.dataset.category;
    chips.forEach((item) => {
      const selected = item === chip;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-checked", String(selected));
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

  const formData = new FormData();
  formData.append("letter", file);
  formData.append("documentCategory", selectedType);

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Upload failed.");
    }

    latestResult = normalizeResult(payload.result);
    cardIndex = 0;
    renderCard();
    setJourneyStep("understand");
    setStatus("Your document is ready.");
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
  if (cardIndex >= journeyCardsTemplate.length - 1) {
    setJourneyStep("act");
    document.querySelector("#achievement").classList.remove("hidden");
    return;
  }
  cardIndex += 1;
  renderCard();
  setJourneyStep("understand");
});

document.querySelector("#details-button").addEventListener("click", () => {
  const card = getCards()[cardIndex];
  openModal(card.title, `<p>${card.detail}</p>`);
});

document.querySelector("#card-style-button").addEventListener("click", () => {
  const rows = Object.keys(cardStyles)
    .map((key) => {
      const style = cardStyles[key];
      const active = key === activeCardStyle ? " (Active)" : "";
      return `<button type="button" class="soft-btn style-option" data-style="${key}">${style.label}${active}</button>`;
    })
    .join("");

  openModal(
    "Card Style",
    `<div class="style-list">${rows}<p>Custom card packs coming later.</p></div>`
  );

  document.querySelectorAll(".style-option").forEach((button) => {
    button.addEventListener("click", () => {
      activeCardStyle = button.dataset.style;
      closeModal();
      renderCard();
      showActionMessage(`${cardStyles[activeCardStyle].label} selected.`);
    });
  });
});

document.querySelector("#check-button").addEventListener("click", () => {
  setJourneyStep("check");
  openModal("Document Check", buildCheckMarkup(latestResult));
});

document.querySelector("#copy-summary").addEventListener("click", async () => {
  setJourneyStep("act");
  const text = latestResult.what_this_is;
  try {
    await navigator.clipboard.writeText(text);
    showActionMessage("Summary copied.");
  } catch (error) {
    showActionMessage(text);
  }
});

document.querySelector("#add-calendar").addEventListener("click", () => {
  setJourneyStep("act");
  if (hasDeadline(latestResult.deadline)) {
    openModal(
      "Calendar preview",
      `<p><strong>Document step:</strong> ${latestResult.action}</p><p><strong>Date:</strong> ${latestResult.deadline}</p>`
    );
  } else {
    openModal("Calendar preview", "<p>No clear deadline found.<br>Calendar event cannot be created yet.</p>");
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
      <p>This is a placeholder. Real reminder scheduling is coming later.</p>
    </div>`
  );

  document.querySelector("#allow-notification").addEventListener("click", () => {
    showActionMessage("Notification permission placeholder shown.");
    closeModal();
  });
});

document.querySelector("#upload-another").addEventListener("click", () => {
  form.reset();
  fileName.textContent = "PDF, image, document";
  setStatus("");
  setJourneyStep("upload");
  latestResult = createMockResult();
  cardIndex = 0;
  renderCard();
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
  activePage = page;

  pages.forEach((item) => {
    pageSections[item].classList.toggle("active", item === page);
  });

  pageLinks.forEach((button) => {
    const selected = button.dataset.pageLink === page;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-current", selected ? "page" : "false");
  });
}

function setTheme(theme) {
  activeTheme = theme;
  document.body.classList.remove("theme-dark", "theme-night");

  if (theme === "dark") document.body.classList.add("theme-dark");
  if (theme === "night") document.body.classList.add("theme-night");

  themeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.theme === theme);
  });
}

function renderCard() {
  const cards = getCards();
  const card = cards[cardIndex];
  const style = cardStyles[activeCardStyle];
  const icon = style.icons[cardIndex] || style.icons[0];

  document.querySelector("#card-progress").textContent = `${cardIndex + 1} of ${cards.length}`;
  document.querySelector("#card-style-marker").textContent = style.label;
  document.querySelector("#card-icon").textContent = icon;
  document.querySelector("#card-title").textContent = card.title;
  document.querySelector("#card-answer").textContent = card.answer;
}

function getCards() {
  return journeyCardsTemplate.map((template, index) => {
    const value = latestResult[template.key];
    const answer = Array.isArray(value) ? value[0] : value;

    return {
      title: template.title,
      answer: answer || "No clear detail found.",
      detail: buildDetailText(template.key, index)
    };
  });
}

function buildDetailText(key, index) {
  if (key === "important_points") {
    return listOrText(latestResult.important_points);
  }

  if (key === "note") {
    return latestResult.review_reason || latestResult.note;
  }

  if (key === "risk") {
    return latestResult.safe_action_message;
  }

  if (key === "deadline") {
    return hasDeadline(latestResult.deadline)
      ? "A deadline was found in the readable text."
      : "No clear deadline found in the readable text.";
  }

  if (key === "action") {
    return listOrText(latestResult.next_steps);
  }

  if (index === 0) {
    return latestResult.document_title;
  }

  return "Check the original document for full context.";
}

function setJourneyStep(step) {
  railSteps.forEach((item) => {
    item.classList.toggle("active", item.dataset.rail === step);
  });
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

function openModal(title, markup) {
  modalTitle.textContent = title;
  modalContent.innerHTML = markup;
  modal.classList.remove("hidden");
  document.querySelector("#modal-close").focus();
}

function closeModal() {
  modal.classList.add("hidden");
}

function buildCheckMarkup(result) {
  const severityClass = severityClassName(result.severity_level);
  const trustClass = trustClassName(result.trust_level);
  const reviewClass = result.needs_review === "Yes" ? "badge-medium" : "badge-low";

  return `
    <div class="check-grid">
      <p><strong>Trust level</strong><br><span class="badge-chip ${trustClass}">${result.trust_level}</span></p>
      <p><strong>Severity</strong><br><span class="badge-chip ${severityClass}">${result.severity_level}</span></p>
      <p><strong>Document status</strong><br><span class="badge-chip ${severityClassName(result.document_status)}">${result.document_status}</span></p>
      <p><strong>Confidence</strong><br><span class="badge-chip ${severityClassName(result.confidence)}">${result.confidence}</span></p>
      <p><strong>Needs review</strong><br><span class="badge-chip ${reviewClass}">${result.needs_review}</span></p>
      <p><strong>Safe next step</strong><br>${result.safe_action_message}</p>
    </div>
  `;
}

function severityClassName(value) {
  const lower = String(value || "").toLowerCase();
  if (lower.includes("high") || lower.includes("suspicious")) return "badge-high";
  if (lower.includes("medium")) return "badge-medium";
  return "badge-low";
}

function trustClassName(value) {
  const lower = String(value || "").toLowerCase();
  if (lower.includes("suspicious") || lower.includes("unclear")) return "badge-high";
  if (lower.includes("template") || lower.includes("outgoing")) return "badge-medium";
  return "badge-low";
}

function hasDeadline(value) {
  return value && !String(value).toLowerCase().includes("no clear deadline");
}

function listOrText(value) {
  if (Array.isArray(value)) return value.join(" ");
  return value || "No extra detail found.";
}

function normalizeResult(result) {
  const base = createMockResult();
  const merged = { ...base, ...result };

  return {
    ...merged,
    important_points: merged.important_points || [base.important_points[0]],
    next_steps: merged.next_steps || [base.next_steps[0]],
    action: merged.action || base.action
  };
}

function createMockResult() {
  return {
    document_category: "other readable document",
    document_title: "Document guide",
    what_this_is: "A readable document.",
    important_points: ["It may contain information you need to check."],
    action: "Check the original document before acting.",
    deadline: "No clear deadline found.",
    risk: "Missing key details could cause problems.",
    note: "Cannot confirm authenticity.",
    next_steps: ["Use the action card first.", "Ask someone you trust if needed."],
    trust_level: "Low - Cannot confirm authenticity",
    severity_level: "Low",
    document_status: "Other",
    confidence: "Low",
    needs_review: "No",
    review_reason: "Some details may need checking.",
    is_template: false,
    is_outgoing: false,
    is_suspicious: false,
    safe_action_message: "Verify using official contact details before acting."
  };
}
