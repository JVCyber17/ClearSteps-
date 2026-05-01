const fs = require("node:fs");

async function extractTextFromUpload({ filePath, mimeType, originalName }) {
  // This is the extraction boundary for the app.
  // Production should add native PDF text extraction first, then OCR for scans.
  // For now, OCR is not ready, so this MVP returns placeholder extracted text.
  const fileSize = fs.statSync(filePath).size;

  if (fileSize < 50) {
    return "";
  }

  return [
    "Placeholder extracted text for MVP testing.",
    `Original file name: ${originalName}.`,
    `Detected file type: ${mimeType}.`,
    "The document appears to be a formal incoming letter.",
    "It may ask the reader to check the letter and take one next step.",
    "No clear deadline was found in the placeholder extraction."
  ].join("\n");
}

module.exports = { extractTextFromUpload };
