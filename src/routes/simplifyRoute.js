const fs = require("node:fs");
const crypto = require("node:crypto");
const path = require("node:path");

const {
  extractTextFromInput,
  extractTextFromImage,
  isImageMimeType
} = require("../services/textExtraction");
const { runClearStepsEngine } = require("../services/clearStepsEngine");
const {
  createDocumentSession,
  updateDocumentSession,
  markDocumentSessionAnalysed,
  markDocumentSessionFailed,
  markOcrStarted,
  markOcrCompleted,
  markOcrFailed
} = require("../services/documentSessionService");
const { applyAiStructuredResult } = require("../services/aiStructuredResultService");

const OCR_SESSION_TTL_MS = 30 * 60 * 1000;
const ocrSessionStore = new Map();

async function simplifyRoute({ file, fields, directories }) {
  const { uploadsDir, resultsDir } = directories;
  const pastedText = fields.pastedText || fields.text || "";
  const action = fields.action || "";
  const requestedJobId = fields.jobId || fields.job_id || "";
  const selectedCategory = fields.documentCategory || "auto";
  const anonymousSessionId = fields.anonymousSessionId || "";

  if (action === "analyse") {
    return await analyseStoredDocument({
      jobId: requestedJobId,
      selectedCategory,
      anonymousSessionId,
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
    await createDocumentSession({
      clientJobId: jobId,
      status: "uploaded",
      anonymousSessionId,
      sourceMimeType: mimeType,
      sourceSizeBytes: file.sizeBytes,
      documentCategory: selectedCategory,
      expiresAt: new Date(Date.now() + OCR_SESSION_TTL_MS).toISOString()
    });

    try {
      const extractionResult = await extractUploadedFileText({
        filePath,
        mimeType,
        originalName,
        jobId,
        anonymousSessionId,
        sourceSizeBytes: file.sizeBytes,
        selectedCategory
      });

      if (!extractionResult.success) {
        await markDocumentSessionFailed(jobId, "unreadable_document", {
          inputQuality: "poor",
          anonymousSessionId,
          sourceMimeType: mimeType,
          sourceSizeBytes: file.sizeBytes,
          documentCategory: selectedCategory
        });
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

      await updateDocumentSession(jobId, {
        status: "uploaded",
        anonymousSessionId,
        inputQuality: extractionResult.inputQuality,
        sourceMimeType: mimeType,
        sourceSizeBytes: file.sizeBytes,
        documentCategory: selectedCategory,
        expiresAt: new Date(Date.now() + OCR_SESSION_TTL_MS).toISOString()
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
  jobId = jobId || crypto.randomUUID();
  const pastedInputQuality = hasEnoughText(extractedText)
    ? (extractedText.length >= 160 ? "good" : "borderline")
    : "poor";

  await createDocumentSession({
    clientJobId: jobId,
    status: "uploaded",
    anonymousSessionId,
    sourceMimeType: mimeType,
    sourceSizeBytes: Buffer.byteLength(extractedText, "utf8"),
    inputQuality: pastedInputQuality,
    documentCategory: selectedCategory
  });

  if (!hasEnoughText(extractedText)) {
    await markDocumentSessionFailed(jobId, "unreadable_document", {
      inputQuality: "poor",
      anonymousSessionId,
      sourceMimeType: mimeType,
      documentCategory: selectedCategory
    });
    return unreadableDocumentResponse();
  }

  const run = await analyseDocumentText(extractedText, {
    jobId,
    mimeType,
    originalName,
    selectedCategory,
    anonymousSessionId
  });

  const output = run.api_output;

  // Store safe processing metadata only. The API response still returns cue cards,
  // but local disk does not retain document-derived text, OCR text, or raw AI output.
  fs.writeFileSync(
    path.join(resultsDir, `${output.job_id}.json`),
    JSON.stringify(buildSafeStoredResult(output), null, 2)
  );

  await markDocumentSessionAnalysed(jobId, output, {
    inputQuality: pastedInputQuality,
    anonymousSessionId,
    sourceMimeType: mimeType,
    documentCategory: selectedCategory
  });

  // Keep file retention short in production.
  // TODO: Add scheduled deletion policy for uploads.
  deleteTemporaryUpload({ filePath, uploadsDir });

  return output;
}

async function extractUploadedFileText({
  filePath,
  mimeType,
  originalName,
  jobId,
  anonymousSessionId,
  sourceSizeBytes,
  selectedCategory
}) {
  if (isImageMimeType(mimeType)) {
    const ocrStartedAt = new Date().toISOString();
    const ocrStartMs = Date.now();

    await markOcrStarted(jobId, {
      anonymousSessionId,
      sourceMimeType: mimeType,
      sourceSizeBytes,
      documentCategory: selectedCategory,
      ocrStartedAt,
      ocrEngine: "tesseract"
    });

    const ocrResult = await extractTextFromImage({ filePath });
    const ocrDurationMs = Date.now() - ocrStartMs;
    const ocrCompletedAt = new Date().toISOString();
    const ocrInputQuality = normaliseOcrInputQuality(ocrResult.input_quality);
    const ocrConfidenceCategory = inferOcrConfidenceCategory(ocrInputQuality);

    if (!ocrResult.success || !hasEnoughText(ocrResult.extracted_text)) {
      await markOcrFailed(jobId, "ocr_unreadable", {
        anonymousSessionId,
        sourceMimeType: mimeType,
        sourceSizeBytes,
        documentCategory: selectedCategory,
        inputQuality: "poor",
        ocrStartedAt,
        ocrCompletedAt,
        ocrDurationMs,
        ocrInputQuality: ocrInputQuality === "unknown" ? "poor" : ocrInputQuality,
        ocrConfidenceCategory: ocrConfidenceCategory === "unknown" ? "low" : ocrConfidenceCategory,
        ocrEngine: "tesseract"
      });
      return unreadableDocumentResponse();
    }

    await markOcrCompleted(jobId, {
      anonymousSessionId,
      sourceMimeType: mimeType,
      sourceSizeBytes,
      documentCategory: selectedCategory,
      inputQuality: normaliseAppInputQuality(ocrResult.input_quality),
      ocrStartedAt,
      ocrCompletedAt,
      ocrDurationMs,
      ocrInputQuality,
      ocrConfidenceCategory,
      ocrEngine: "tesseract"
    });

    return {
      success: true,
      extractedText: ocrResult.extracted_text,
      inputQuality: normaliseAppInputQuality(ocrResult.input_quality)
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

async function analyseStoredDocument({ jobId, selectedCategory, anonymousSessionId, resultsDir }) {
  cleanupOldOcrSessions();

  const storedDocument = ocrSessionStore.get(jobId);
  if (!storedDocument || !hasEnoughText(storedDocument.extractedText)) {
    await markDocumentSessionFailed(jobId, "ocr_session_missing_or_expired", {
      inputQuality: "poor",
      anonymousSessionId,
      documentCategory: selectedCategory
    });
    return unreadableDocumentResponse();
  }

  await updateDocumentSession(jobId, {
    status: "uploaded",
    anonymousSessionId,
    inputQuality: storedDocument.inputQuality,
    sourceMimeType: storedDocument.mimeType,
    documentCategory: selectedCategory
  });

  const run = await analyseDocumentText(storedDocument.extractedText, {
    jobId,
    mimeType: storedDocument.mimeType,
    originalName: storedDocument.originalName,
    selectedCategory,
    anonymousSessionId
  });

  const output = run.api_output;

  // Store safe processing metadata only. The temporary OCR text is deleted below.
  fs.writeFileSync(
    path.join(resultsDir, `${output.job_id}.json`),
    JSON.stringify(buildSafeStoredResult(output), null, 2)
  );

  await markDocumentSessionAnalysed(jobId, output, {
    inputQuality: storedDocument.inputQuality,
    anonymousSessionId,
    sourceMimeType: storedDocument.mimeType,
    documentCategory: selectedCategory
  });

  // Remove the temporary raw text after it has been used.
  ocrSessionStore.delete(jobId);

  return output;
}

async function analyseDocumentText(extractedText, fileMeta = {}) {
  const rulesRun = runClearStepsEngine({
    extractedText,
    fileMeta
  });

  // Optional backend-only AI pass. If it is unavailable, slow, invalid, or unsafe,
  // the existing rules-based result is returned unchanged.
  return await applyAiStructuredResult({
    rulesRun,
    extractedText
  });
}

function buildSafeStoredResult(output = {}) {
  const trust = output.trust || {};
  const ai = output.debug?.ai || {};

  return {
    job_id: output.job_id,
    created_at: output.debug?.created_at,
    status: "analysed",
    cards_count: Array.isArray(output.cards) ? output.cards.length : 0,
    trust: {
      trust_assessment: trust.trust_assessment,
      severity_level: trust.severity_level,
      processing_mode: trust.processing_mode,
      confidence: trust.confidence,
      input_quality: trust.input_quality,
      document_category: trust.document_category,
      document_type: trust.document_type,
      needs_human_review: trust.needs_human_review
    },
    banner_type: output.banner?.type,
    debug: {
      prompt_version: output.debug?.prompt_version,
      model: output.debug?.model,
      ai: {
        ai_used: ai.ai_used,
        ai_status: ai.ai_status,
        ai_provider: ai.ai_provider,
        ai_model: ai.ai_model,
        ai_duration_ms: ai.ai_duration_ms,
        ai_error_code: ai.ai_error_code
      }
    }
  };
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

function normaliseAppInputQuality(value) {
  const cleaned = String(value || "").toLowerCase();
  if (cleaned === "good") return "good";
  if (cleaned === "fair" || cleaned === "borderline") return "borderline";
  return "poor";
}

function normaliseOcrInputQuality(value) {
  const cleaned = String(value || "").toLowerCase();
  if (cleaned === "good") return "good";
  if (cleaned === "fair" || cleaned === "borderline") return "fair";
  if (cleaned === "poor") return "poor";
  return "unknown";
}

function inferOcrConfidenceCategory(inputQuality) {
  if (inputQuality === "good") return "high";
  if (inputQuality === "fair") return "medium";
  if (inputQuality === "poor") return "low";
  return "unknown";
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
