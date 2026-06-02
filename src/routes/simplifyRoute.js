const fs = require("node:fs");
const path = require("node:path");

const {
  extractTextFromInput,
  extractTextFromImage,
  isImageMimeType
} = require("../services/textExtraction");
const { runClearStepsEngine } = require("../services/clearStepsEngine");

const OCR_SESSION_TTL_MS = 30 * 60 * 1000;
const ocrSessionStore = new Map();

async function simplifyRoute({ file, fields, directories }) {
  const { uploadsDir, resultsDir } = directories;
  const pastedText = fields.pastedText || fields.text || "";
  const action = fields.action || "";
  const requestedJobId = fields.jobId || fields.job_id || "";

  if (action === "analyse") {
    return analyseStoredDocument({
      jobId: requestedJobId,
      selectedCategory: fields.documentCategory || "auto",
      resultsDir
    });
  }

  let filePath = null;
  let mimeType = "text/plain";
  let originalName = "pasted-text";
  let jobId = null;

  if (file) {
    jobId = file.jobId;
    filePath = file.savedPath;
    mimeType = file.contentType;
    originalName = file.filename;
  }

  if (filePath) {
    try {
      const extractionResult = await extractUploadedFileText({
        filePath,
        mimeType,
        originalName
      });

      if (!extractionResult.success) {
        return extractionResult;
      }

      // Store extracted text in memory only for the next backend step.
      // Do not send raw OCR or document text to the normal user interface.
      rememberOcrText({
        jobId,
        extractedText: extractionResult.extractedText,
        inputQuality: extractionResult.inputQuality,
        mimeType,
        originalName
      });

      return {
        success: true,
        job_id: jobId,
        message: "Your document is ready.",
        input_quality: extractionResult.inputQuality
      };
    } finally {
      deleteTemporaryUpload({ filePath, uploadsDir });
    }
  }

  const extractedText = pastedText.trim();
  if (!hasEnoughText(extractedText)) {
    return unreadableDocumentResponse();
  }

  const run = analyseDocumentText(extractedText, {
    jobId,
    mimeType,
    originalName,
    selectedCategory: fields.documentCategory || "auto"
  });

  const output = run.api_output;
  const structured = run.structured_output;

  // Store only structured output, not raw text.
  fs.writeFileSync(
    path.join(resultsDir, `${output.job_id}.json`),
    JSON.stringify({
      job_id: output.job_id,
      created_at: output.debug.created_at,
      structured_output: structured
    }, null, 2)
  );

  // Keep file retention short in production.
  // TODO: Add scheduled deletion policy for uploads.
  deleteTemporaryUpload({ filePath, uploadsDir });

  return output;
}

async function extractUploadedFileText({ filePath, mimeType, originalName }) {
  if (isImageMimeType(mimeType)) {
    const ocrResult = await extractTextFromImage({ filePath });
    if (!ocrResult.success || !hasEnoughText(ocrResult.extracted_text)) {
      return unreadableDocumentResponse();
    }

    return {
      success: true,
      extractedText: ocrResult.extracted_text,
      inputQuality: ocrResult.input_quality
    };
  }

  const extractedText = await extractTextFromInput({
    pastedText: "",
    filePath,
    mimeType,
    originalName
  });

  if (!hasEnoughText(extractedText)) {
    return unreadableDocumentResponse();
  }

  return {
    success: true,
    extractedText,
    inputQuality: extractedText.length >= 160 ? "good" : "borderline"
  };
}

function analyseStoredDocument({ jobId, selectedCategory, resultsDir }) {
  cleanupOldOcrSessions();

  const storedDocument = ocrSessionStore.get(jobId);
  if (!storedDocument || !hasEnoughText(storedDocument.extractedText)) {
    return unreadableDocumentResponse();
  }

  const run = analyseDocumentText(storedDocument.extractedText, {
    jobId,
    mimeType: storedDocument.mimeType,
    originalName: storedDocument.originalName,
    selectedCategory
  });

  const output = run.api_output;
  const structured = run.structured_output;

  // Store only structured output, not raw extracted text.
  fs.writeFileSync(
    path.join(resultsDir, `${output.job_id}.json`),
    JSON.stringify({
      job_id: output.job_id,
      created_at: output.debug.created_at,
      structured_output: structured
    }, null, 2)
  );

  // Remove the temporary raw text after it has been used.
  ocrSessionStore.delete(jobId);

  return output;
}

function analyseDocumentText(extractedText, fileMeta = {}) {
  // Placeholder analysis layer until the full AI call is connected.
  // It already returns the six ClearSteps cue cards from the extracted text.
  return runClearStepsEngine({
    extractedText,
    fileMeta
  });
}

function rememberOcrText({ jobId, extractedText, inputQuality, mimeType, originalName }) {
  cleanupOldOcrSessions();

  ocrSessionStore.set(jobId, {
    extractedText,
    inputQuality,
    mimeType,
    originalName,
    createdAt: Date.now()
  });
}

function hasEnoughText(text) {
  const cleaned = String(text || "").replace(/\s+/g, " ").trim();
  const wordCount = (cleaned.match(/[A-Za-z0-9]+/g) || []).length;
  return cleaned.length >= 25 && wordCount >= 5;
}

function unreadableDocumentResponse() {
  return {
    success: false,
    error: "We could not read enough text from this document. Please upload a clearer image or PDF."
  };
}

function cleanupOldOcrSessions() {
  const cutoff = Date.now() - OCR_SESSION_TTL_MS;
  for (const [storedJobId, value] of ocrSessionStore.entries()) {
    if (value.createdAt < cutoff) {
      ocrSessionStore.delete(storedJobId);
    }
  }
}

function deleteTemporaryUpload({ filePath, uploadsDir }) {
  if (process.env.CLEARSTEPS_ENABLE_FILE_RETENTION || !filePath || !filePath.startsWith(uploadsDir)) {
    return;
  }

  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    // Keep deletion errors silent to avoid leaking file details in logs.
  }
}

module.exports = { simplifyRoute, ocrSessionStore };
