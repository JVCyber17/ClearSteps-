const fs = require("node:fs");

async function extractTextFromInput({ pastedText, filePath, mimeType, originalName }) {
  if (typeof pastedText === "string" && pastedText.trim()) {
    return pastedText.trim();
  }

  if (!filePath || !fs.existsSync(filePath)) {
    return "";
  }

  const size = fs.statSync(filePath).size;
  if (size < 20) return "";

  if (mimeType === "text/plain") {
    try {
      return fs.readFileSync(filePath, "utf8").trim();
    } catch (error) {
      return "";
    }
  }

  // Placeholder extraction path for PDF/image/DOCX in this backend scaffold.
  return [
    "Placeholder extracted text for ClearSteps backend testing.",
    `Original file name: ${originalName || "unknown"}.`,
    `Detected file type: ${mimeType || "unknown"}.`,
    "This appears to be a formal readable document.",
    "No clear deadline was found in this placeholder extraction."
  ].join("\n");
}

module.exports = { extractTextFromInput };
