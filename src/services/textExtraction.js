const fs = require("node:fs");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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

async function extractTextFromImage({ filePath }) {
  if (!filePath || !fs.existsSync(filePath)) {
    return {
      success: false,
      error: "This document is hard to read. Please upload a clearer image."
    };
  }

  try {
    // Tesseract writes OCR text to stdout when the output target is "stdout".
    // Keep this developer-only step separate from the AI pipeline for now.
    const { stdout } = await execFileAsync(
      "tesseract",
      [filePath, "stdout", "-l", "eng", "--psm", "6"],
      {
        maxBuffer: 4 * 1024 * 1024,
        windowsHide: true
      }
    );

    const extractedText = normaliseOcrText(stdout);
    const inputQuality = rateInputQuality(extractedText);

    if (inputQuality === "poor") {
      return {
        success: false,
        error: "This document is hard to read. Please upload a clearer image."
      };
    }

    return {
      success: true,
      extracted_text: extractedText,
      input_quality: inputQuality
    };
  } catch (error) {
    return {
      success: false,
      error: "This document is hard to read. Please upload a clearer image."
    };
  }
}

function isImageMimeType(mimeType) {
  return IMAGE_MIME_TYPES.has(String(mimeType || "").toLowerCase());
}

function normaliseOcrText(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function rateInputQuality(text) {
  const cleaned = normaliseOcrText(text);
  const words = cleaned.match(/[A-Za-z0-9$]+/g) || [];
  const letters = cleaned.replace(/[^A-Za-z0-9]/g, "");

  if (letters.length >= 80 && words.length >= 12) return "good";
  if (letters.length >= 25 && words.length >= 5) return "borderline";
  return "poor";
}

module.exports = {
  extractTextFromInput,
  extractTextFromImage,
  isImageMimeType,
  rateInputQuality
};
