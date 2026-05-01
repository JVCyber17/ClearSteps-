const form = document.querySelector("#upload-form");
const fileInput = document.querySelector("#letter-file");
const fileName = document.querySelector("#file-name");
const statusText = document.querySelector("#status");
const submitButton = document.querySelector("#submit-button");
const resultCard = document.querySelector("#result-card");
const warningBox = document.querySelector("#warning");

const fields = {
  summary: document.querySelector("#summary"),
  action: document.querySelector("#action"),
  deadline: document.querySelector("#deadline"),
  risk: document.querySelector("#risk"),
  note: document.querySelector("#note")
};

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  fileName.textContent = file ? file.name : "PDF, JPG, PNG, or WebP";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const file = fileInput.files[0];
  if (!file) {
    setStatus("Choose one letter first.");
    return;
  }

  setLoading(true);
  setStatus("Reading the letter.");
  resultCard.classList.add("hidden");

  const formData = new FormData();
  formData.append("letter", file);

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Upload failed.");
    }

    showResult(data.result);
    setStatus("Ready.");
  } catch (error) {
    setStatus(error.message || "Please try again.");
  } finally {
    setLoading(false);
  }
});

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Processing..." : "Simplify letter";
}

function setStatus(message) {
  statusText.textContent = message;
}

function showResult(result) {
  if (result.warning) {
    warningBox.textContent = result.warning;
    warningBox.classList.remove("hidden");
  } else {
    warningBox.textContent = "";
    warningBox.classList.add("hidden");
  }

  fields.summary.textContent = result.summary;
  fields.action.textContent = result.action;
  fields.deadline.textContent = result.deadline;
  fields.risk.textContent = result.risk;
  fields.note.textContent = result.note;

  resultCard.classList.remove("hidden");
}
