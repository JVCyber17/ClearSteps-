const pages = ["home", "upload", "understand", "act", "check"];
const slideIcons = ["?", "!", ">", "D", "R", "i"];

const pageViews = Object.fromEntries(
  pages.map((page) => [page, document.querySelector(`#page-${page}`)])
);

const routeButtons = Array.from(document.querySelectorAll(".route-step"));
const form = document.querySelector("#upload-form");
const fileInput = document.querySelector("#document-file");
const fileName = document.querySelector("#file-name");
const dropzone = document.querySelector(".upload-dropzone");
const statusText = document.querySelector("#status");
const submitButton = document.querySelector("#submit-button");
const typeChips = Array.from(document.querySelectorAll(".type-chip"));
const progressDots = Array.from(document.querySelectorAll(".progress-dot"));
const modal = document.querySelector("#modal");
const modalTitle = document.querySelector("#modal-title");
const modalBody = document.querySelector("#modal-body");

let currentPage = "home";
let currentSlide = 0;
let selectedType = "auto";
let latestResult = createMockResult();

const checkFields = {
  trust_level: document.querySelector("#trust-level"),
  severity_level: document.querySelector("#severity-level"),
  document_status: document.querySelector("#document-status"),
  confidence: document.querySelector("#confidence"),
  needs_review: document.querySelector("#needs-review"),
  possible_issue: document.querySelector("#possible-issue"),
  safe_next_step: document.querySelector("#safe-next-step")
};

// Basic page navigation. The app stays one HTML page, but the user sees one job at a time.
document.querySelectorAll("[data-next]").forEach((button) => {
  button.addEventListener("click", () => showPage(button.dataset.next));
});

document.querySelectorAll("[data-back]").forEach((button) => {
  button.addEventListener("click", () => showPage(button.dataset.back));
});

routeButtons.forEach((button) => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

// Document type chips pass a simple hint to the mock backend pipeline.
typeChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    selectedType = chip.dataset.category;
    typeChips.forEach((item) => {
      const isSelected = item === chip;
      item.classList.toggle("active", isSelected);
      item.setAttribute("aria-checked", String(isSelected));
    });
  });
});

fileInput.addEventListener("change", () => {
  setChosenFile(fileInput.files[0]);
});

dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("dragging");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("dragging");
});

dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropzone.classList.remove("dragging");

  if (event.dataTransfer.files.length > 0) {
    fileInput.files = event.dataTransfer.files;
    setChosenFile(fileInput.files[0]);
  }
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

  const formData = new FormData();
  formData.append("letter", file);
  formData.append("documentCategory", selectedType);

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Upload failed.");
    }

    latestResult = normalizeResult(data.result);
    currentSlide = 0;
    renderSlide();
    renderCheck();
    setStatus("Ready.");
    showPage("understand");
  } catch (error) {
    setStatus(error.message || "Please try again.");
  } finally {
    setLoading(false);
  }
});

document.querySelector("#slide-back").addEventListener("click", () => {
  if (currentSlide === 0) {
    showPage("upload");
    return;
  }

  currentSlide -= 1;
  renderSlide();
});

document.querySelector("#slide-next").addEventListener("click", () => {
  const cards = getUnderstandCards();
  if (currentSlide >= cards.length - 1) {
    showPage("act");
    return;
  }

  currentSlide += 1;
  renderSlide();
});

document.querySelector("#details-button").addEventListener("click", () => {
  const card = getUnderstandCards()[currentSlide];
  openModal(card.title, `<p>${card.detail}</p>`);
});

document.querySelector("#copy-summary").addEventListener("click", async () => {
  const text = latestResult.plain_summary || latestResult.what_this_is;
  try {
    await navigator.clipboard.writeText(text);
    showActionMessage("Summary copied.");
  } catch (error) {
    showActionMessage(text);
  }
});

document.querySelector("#add-calendar").addEventListener("click", () => {
  if (hasClearDeadline(latestResult.deadline)) {
    openModal(
      "Calendar preview",
      `<div class="preview-card"><strong>Check document</strong><span>${latestResult.deadline}</span><p>${latestResult.action}</p></div>`
    );
  } else {
    openModal("Calendar preview", "<p>No clear deadline found. Calendar event cannot be created yet.</p>");
  }
});

document.querySelector("#send-reminder").addEventListener("click", () => {
  openModal(
    "Reminder preview",
    `<div class="reminder-choice-list">
      <button type="button">Today</button>
      <button type="button">Tomorrow</button>
      <button type="button">Three days before deadline</button>
      <button type="button">One week before deadline</button>
      <button type="button">Custom</button>
    </div>
    <div class="permission-card">
      <strong>Notification permission needed</strong>
      <button type="button" id="allow-notifications">Allow notifications</button>
      <p>This is a visual placeholder. No reminder is scheduled yet.</p>
    </div>`
  );

  document.querySelector("#allow-notifications").addEventListener("click", () => {
    document.querySelector(".permission-card p").textContent = "Permission flow placeholder ready for later.";
  });
});

document.querySelector("#upload-another").addEventListener("click", () => {
  form.reset();
  fileName.textContent = "Drag and drop, or browse";
  setStatus("");
  latestResult = createMockResult();
  currentSlide = 0;
  showPage("upload");
  fileInput.focus();
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

document.querySelectorAll("[data-toggle]").forEach((toggle) => {
  toggle.addEventListener("change", () => {
    document.body.classList.toggle(toggle.dataset.toggle, toggle.checked);
  });
});

renderSlide();
renderCheck();
showPage("home");

function showPage(page) {
  if (!pages.includes(page)) return;

  currentPage = page;
  pageViews[page].classList.add("active");

  pages.forEach((item) => {
    pageViews[item].classList.toggle("active", item === page);
  });

  routeButtons.forEach((button) => {
    const isActive = button.dataset.page === page;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-current", isActive ? "step" : "false");
  });

  if (page === "understand") renderSlide();
  if (page === "check") renderCheck();
}

function setChosenFile(file) {
  fileName.textContent = file ? file.name : "Drag and drop, or browse";
}

function setStatus(message) {
  statusText.textContent = message;
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Reading..." : "Next";
}

function renderSlide() {
  const cards = getUnderstandCards();
  const card = cards[currentSlide] || cards[0];

  document.querySelector("#slide-icon").textContent = slideIcons[currentSlide] || "?";
  document.querySelector("#slide-count").textContent = `${currentSlide + 1} of ${cards.length}`;
  document.querySelector("#slide-title").textContent = card.title;
  document.querySelector("#slide-answer").textContent = card.answer;
  document.querySelector("#slide-next").textContent = currentSlide === cards.length - 1 ? "Next" : "Next";

  progressDots.forEach((dot, index) => {
    dot.classList.toggle("active", index === currentSlide);
  });
}

function getUnderstandCards() {
  return [
    {
      title: "What is this",
      answer: latestResult.what_this_is,
      detail: latestResult.plain_summary
    },
    {
      title: "What matters most",
      answer: firstItem(latestResult.important_points),
      detail: latestResult.plain_summary
    },
    {
      title: "What do I need to do",
      answer: latestResult.action,
      detail: firstItem(latestResult.next_steps)
    },
    {
      title: "When is it due",
      answer: latestResult.deadline,
      detail: hasClearDeadline(latestResult.deadline)
        ? "You can use this date for a calendar preview."
        : "No clear deadline was found in the readable text."
    },
    {
      title: "What could happen",
      answer: latestResult.risk,
      detail: latestResult.safe_action_message
    },
    {
      title: "Helpful note",
      answer: latestResult.note,
      detail: latestResult.review_reason
    }
  ];
}

function renderCheck() {
  checkFields.trust_level.textContent = latestResult.trust_level;
  checkFields.severity_level.textContent = latestResult.severity_level;
  checkFields.document_status.textContent = latestResult.document_status;
  checkFields.confidence.textContent = latestResult.confidence;
  checkFields.needs_review.textContent = latestResult.needs_review;
  checkFields.possible_issue.textContent = latestResult.review_reason;
  checkFields.safe_next_step.textContent = latestResult.safe_action_message;
}

function showActionMessage(message) {
  document.querySelector("#action-message").textContent = message;
}

function openModal(title, html) {
  modalTitle.textContent = title;
  modalBody.innerHTML = html;
  modal.classList.remove("hidden");
  document.querySelector("#modal-close").focus();
}

function closeModal() {
  modal.classList.add("hidden");
}

function normalizeResult(result) {
  return {
    ...createMockResult(),
    ...result,
    action: result.action || firstItem(result.actions) || "Check the original document.",
    important_points: result.important_points || ["Check the main point."],
    next_steps: result.next_steps || ["Ask someone you trust if unsure."]
  };
}

function createMockResult() {
  return {
    document_category: "other readable document",
    document_title: "Document guide",
    plain_summary: "This document can be explained in small steps.",
    what_this_is: "A readable document.",
    important_points: ["It may contain information you need to check."],
    action: "Upload a document to get your next step.",
    deadline: "No clear deadline found.",
    risk: "Missing important information could cause problems.",
    note: "Cannot confirm authenticity.",
    next_steps: ["Upload one document first."],
    trust_level: "Low - Cannot confirm authenticity",
    severity_level: "Low",
    document_status: "Other",
    confidence: "Low",
    needs_review: "No",
    review_reason: "Some details may need checking.",
    is_template: false,
    is_outgoing: false,
    is_suspicious: false,
    safe_action_message: "Check the original document before acting."
  };
}

function firstItem(value) {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function hasClearDeadline(deadline) {
  return deadline && deadline !== "No clear deadline found." && deadline !== "Unknown.";
}
