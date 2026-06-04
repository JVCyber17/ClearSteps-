const { getSupabaseAdminClient } = require("./supabaseService");

const VALID_STATUSES = new Set(["uploaded", "analysed", "failed", "expired"]);
const VALID_INPUT_QUALITIES = new Set(["good", "borderline", "poor"]);
const VALID_OCR_STATUSES = new Set(["not_started", "processing", "completed", "failed", "skipped"]);
const VALID_OCR_INPUT_QUALITIES = new Set(["good", "fair", "poor", "unknown"]);
const VALID_OCR_CONFIDENCE_CATEGORIES = new Set(["high", "medium", "low", "unknown"]);
const VALID_TRUST_LEVELS = new Set(["high", "medium", "low", "unknown"]);
const VALID_SEVERITY_LEVELS = new Set(["low", "medium", "high", "urgent"]);
const VALID_PROCESSING_MODES = new Set(["normal", "caution", "verification_only", "unsupported"]);
const VALID_CONFIDENCE_LEVELS = new Set(["high", "medium", "low"]);
const VALID_BANNER_TYPES = new Set(["safe", "caution", "warning", "urgent"]);
const VALID_AI_STATUSES = new Set(["skipped", "completed", "fallback", "failed"]);

async function createDocumentSession(metadata = {}) {
  const clientJobId = cleanText(metadata.clientJobId, 120);
  if (!clientJobId) return null;

  const row = buildSafeSessionRow({
    ...metadata,
    clientJobId,
    status: metadata.status || "uploaded"
  });

  return writeDocumentSession("upsert", clientJobId, row);
}

async function updateDocumentSession(clientJobId, updates = {}) {
  const cleanedJobId = cleanText(clientJobId, 120);
  if (!cleanedJobId) return null;

  const row = buildSafeSessionRow({
    ...updates,
    clientJobId: cleanedJobId
  });

  delete row.client_job_id;
  return writeDocumentSession("update", cleanedJobId, row);
}

async function markDocumentSessionAnalysed(clientJobId, output = {}, updates = {}) {
  return updateDocumentSession(clientJobId, {
    ...updates,
    ...metadataFromAnalysisOutput(output),
    status: "analysed",
    processedAt: new Date().toISOString(),
    errorCode: null
  });
}

async function markDocumentSessionFailed(clientJobId, errorCode, updates = {}) {
  return updateDocumentSession(clientJobId, {
    ...updates,
    status: "failed",
    errorCode: cleanErrorCode(errorCode || "document_processing_failed")
  });
}

async function markOcrStarted(clientJobId, updates = {}) {
  return updateDocumentSession(clientJobId, {
    ...updates,
    ocrStatus: "processing",
    ocrStartedAt: new Date().toISOString(),
    ocrEngine: updates.ocrEngine || "tesseract"
  });
}

async function markOcrCompleted(clientJobId, updates = {}) {
  const completedAt = updates.ocrCompletedAt || new Date().toISOString();
  return updateDocumentSession(clientJobId, {
    ...updates,
    ocrStatus: "completed",
    ocrCompletedAt: completedAt,
    ocrEngine: updates.ocrEngine || "tesseract"
  });
}

async function markOcrFailed(clientJobId, errorCode, updates = {}) {
  const completedAt = updates.ocrCompletedAt || new Date().toISOString();
  return updateDocumentSession(clientJobId, {
    ...updates,
    ocrStatus: "failed",
    ocrCompletedAt: completedAt,
    ocrEngine: updates.ocrEngine || "tesseract",
    errorCode: cleanErrorCode(errorCode || "ocr_failed")
  });
}

function buildSafeSessionRow(metadata) {
  const row = {
    client_job_id: cleanText(metadata.clientJobId, 120),
    anonymous_session_id: cleanAnonymousSessionId(metadata.anonymousSessionId),
    status: normaliseEnum(metadata.status, VALID_STATUSES),
    input_quality: normaliseEnum(metadata.inputQuality, VALID_INPUT_QUALITIES),
    document_category: cleanCategory(metadata.documentCategory),
    document_type: cleanCategory(metadata.documentType),
    trust_assessment: normaliseEnum(metadata.trustAssessment, VALID_TRUST_LEVELS),
    severity_level: normaliseEnum(metadata.severityLevel, VALID_SEVERITY_LEVELS),
    processing_mode: normaliseEnum(metadata.processingMode, VALID_PROCESSING_MODES),
    confidence: normaliseEnum(metadata.confidence, VALID_CONFIDENCE_LEVELS),
    needs_human_review: typeof metadata.needsHumanReview === "boolean" ? metadata.needsHumanReview : undefined,
    banner_type: normaliseEnum(metadata.bannerType, VALID_BANNER_TYPES),
    cards_count: normaliseCardsCount(metadata.cardsCount),
    source_mime_type: cleanText(metadata.sourceMimeType || metadata.mimeType, 120),
    source_size_bytes: normaliseSize(metadata.sourceSizeBytes || metadata.fileSize),
    ocr_started_at: cleanIsoDate(metadata.ocrStartedAt),
    ocr_completed_at: cleanIsoDate(metadata.ocrCompletedAt),
    ocr_duration_ms: normaliseDuration(metadata.ocrDurationMs),
    ocr_status: normaliseEnum(metadata.ocrStatus, VALID_OCR_STATUSES),
    ocr_engine: cleanOcrEngine(metadata.ocrEngine),
    ocr_input_quality: normaliseEnum(metadata.ocrInputQuality, VALID_OCR_INPUT_QUALITIES),
    ocr_confidence_category: normaliseEnum(metadata.ocrConfidenceCategory, VALID_OCR_CONFIDENCE_CATEGORIES),
    ai_used: typeof metadata.aiUsed === "boolean" ? metadata.aiUsed : undefined,
    ai_status: normaliseEnum(metadata.aiStatus, VALID_AI_STATUSES),
    ai_provider: cleanAiProvider(metadata.aiProvider),
    ai_model: cleanAiModel(metadata.aiModel),
    ai_duration_ms: normaliseDuration(metadata.aiDurationMs),
    ai_error_code: metadata.aiErrorCode === null ? null : cleanErrorCode(metadata.aiErrorCode),
    error_code: metadata.errorCode === null ? null : cleanErrorCode(metadata.errorCode),
    expires_at: cleanIsoDate(metadata.expiresAt),
    processed_at: cleanIsoDate(metadata.processedAt)
  };

  return Object.fromEntries(
    Object.entries(row).filter(([, value]) => value !== undefined && value !== "")
  );
}

function metadataFromAnalysisOutput(output = {}) {
  const trust = output.trust || {};
  const banner = output.banner || {};
  const ai = output.debug?.ai || {};

  return {
    inputQuality: trust.input_quality,
    documentCategory: trust.document_category,
    documentType: trust.document_type,
    trustAssessment: trust.trust_assessment,
    severityLevel: trust.severity_level,
    processingMode: trust.processing_mode,
    confidence: trust.confidence,
    needsHumanReview: trust.needs_human_review,
    bannerType: banner.type,
    cardsCount: Array.isArray(output.cards) ? output.cards.length : undefined,
    aiUsed: typeof ai.ai_used === "boolean" ? ai.ai_used : undefined,
    aiStatus: ai.ai_status,
    aiProvider: ai.ai_provider,
    aiModel: ai.ai_model,
    aiDurationMs: ai.ai_duration_ms,
    aiErrorCode: ai.ai_error_code
  };
}

async function writeDocumentSession(mode, clientJobId, row) {
  let supabase;
  try {
    supabase = getSupabaseAdminClient();
  } catch (error) {
    console.warn("Document session tracking skipped:", error.message);
    return null;
  }

  if (!supabase) return null;

  try {
    const query = mode === "upsert"
      ? supabase
        .from("document_sessions")
        .upsert(row, { onConflict: "client_job_id" })
        .select("id")
        .single()
      : supabase
        .from("document_sessions")
        .update(row)
        .eq("client_job_id", clientJobId)
        .select("id")
        .maybeSingle();

    const { data, error } = await query;
    if (error) {
      console.warn("Document session tracking failed:", error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.warn("Document session tracking failed:", error.message);
    return null;
  }
}

function cleanText(value, maxLength = 120) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanAnonymousSessionId(value) {
  const cleaned = cleanText(value, 120);
  if (!/^anon_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cleaned)) {
    return undefined;
  }
  return cleaned;
}

function cleanCategory(value) {
  const cleaned = cleanText(value, 80).toLowerCase();
  if (!cleaned || cleaned === "auto" || cleaned === "auto detect") return undefined;
  return cleaned.replace(/[^a-z0-9_-]/g, "_").slice(0, 80);
}

function cleanErrorCode(value) {
  if (value === null) return null;
  const cleaned = cleanText(value, 80).toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  return cleaned || undefined;
}

function normaliseEnum(value, allowedValues) {
  const cleaned = cleanText(value, 60).toLowerCase();
  return allowedValues.has(cleaned) ? cleaned : undefined;
}

function normaliseCardsCount(value) {
  const count = Number(value);
  if (!Number.isInteger(count)) return undefined;
  return Math.max(0, Math.min(6, count));
}

function normaliseSize(value) {
  const size = Number(value);
  if (!Number.isFinite(size) || size < 0) return undefined;
  return Math.round(size);
}

function normaliseDuration(value) {
  const duration = Number(value);
  if (!Number.isFinite(duration) || duration < 0) return undefined;
  return Math.round(duration);
}

function cleanOcrEngine(value) {
  const cleaned = cleanText(value, 40).toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  return cleaned || undefined;
}

function cleanAiProvider(value) {
  const cleaned = cleanText(value, 40).toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  return cleaned || undefined;
}

function cleanAiModel(value) {
  const cleaned = cleanText(value, 80).replace(/[^a-zA-Z0-9_.:-]/g, "_");
  return cleaned || undefined;
}

function cleanIsoDate(value) {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return undefined;
  return new Date(timestamp).toISOString();
}

module.exports = {
  createDocumentSession,
  updateDocumentSession,
  markDocumentSessionAnalysed,
  markDocumentSessionFailed,
  markOcrStarted,
  markOcrCompleted,
  markOcrFailed,
  metadataFromAnalysisOutput
};
