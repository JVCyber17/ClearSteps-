const {
  validateStructuredResult,
  sanitizeStructuredResult
} = require("../utils/validateStructuredResult");

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-4.1-mini";
const AI_TIMEOUT_MS = Number(process.env.CLEARSTEPS_AI_TIMEOUT_MS || 25000);

async function applyAiStructuredResult({ rulesRun, extractedText }) {
  const output = rulesRun.api_output;
  const fallbackStructuredResult = output.structured_result;
  const startedAt = Date.now();
  const model = DEFAULT_MODEL;

  if (!process.env.OPENAI_API_KEY) {
    attachAiMetadata(output, {
      ai_used: false,
      ai_status: "skipped",
      ai_provider: "openai",
      ai_model: model,
      ai_duration_ms: 0,
      ai_error_code: "missing_api_key"
    });
    return rulesRun;
  }

  try {
    const candidate = await requestStructuredResultFromOpenAi({
      extractedText,
      fallbackStructuredResult,
      model
    });

    const sanitized = sanitizeStructuredResult(candidate, fallbackStructuredResult);
    const validation = validateStructuredResult(sanitized, fallbackStructuredResult);
    if (!validation.valid) {
      const validationSummary = summarizeValidationErrors(validation.errors);
      attachAiMetadata(output, {
        ai_used: false,
        ai_status: "fallback",
        ai_provider: "openai",
        ai_model: model,
        ai_duration_ms: Date.now() - startedAt,
        ai_error_code: "invalid_structured_result",
        validation_errors: validationSummary
      });
      logAiDebug("validation_failed", {
        ai_status: "fallback",
        ai_error_code: "invalid_structured_result",
        ai_model: model,
        ai_duration_ms: Date.now() - startedAt,
        validation_errors: validationSummary
      });
      return rulesRun;
    }

    output.structured_result = sanitized;
    output.display_text = sanitized.cards.map((card) => `${card.title} ${card.simple_explanation}`).join("\n");
    output.tts_script = sanitized.cards.map((card) => card.read_aloud_text).join("\n");
    rulesRun.structured_output.structured_result = sanitized;
    rulesRun.structured_output.display_text = output.display_text;
    rulesRun.structured_output.tts_script = output.tts_script;

    attachAiMetadata(output, {
      ai_used: true,
      ai_status: "completed",
      ai_provider: "openai",
      ai_model: model,
      ai_duration_ms: Date.now() - startedAt,
      ai_error_code: null
    });
    logAiDebug("completed", {
      ai_status: "completed",
      ai_model: model,
      ai_duration_ms: output.debug.ai.ai_duration_ms
    });
    return rulesRun;
  } catch (error) {
    const aiErrorCode = normalizeAiErrorCode(error);
    attachAiMetadata(output, {
      ai_used: false,
      ai_status: "fallback",
      ai_provider: "openai",
      ai_model: model,
      ai_duration_ms: Date.now() - startedAt,
      ai_error_code: aiErrorCode
    });
    logAiDebug("fallback", {
      ai_status: "fallback",
      ai_error_code: aiErrorCode,
      ai_model: model,
      ai_duration_ms: output.debug.ai.ai_duration_ms,
      http_status: error.httpStatus || null
    });
    return rulesRun;
  }
}

async function requestStructuredResultFromOpenAi({ extractedText, fallbackStructuredResult, model }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: buildSystemPrompt()
          },
          {
            role: "user",
            content: buildUserPrompt({ extractedText, fallbackStructuredResult })
          }
        ],
        temperature: 0.2,
        max_output_tokens: 2600
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const error = new Error(`openai_http_${response.status}`);
      error.code = response.status === 401 ? "invalid_api_key" : `openai_http_${response.status}`;
      error.httpStatus = response.status;
      throw error;
    }

    const data = await response.json();
    const text = extractResponseText(data);
    if (!text) {
      const error = new Error("empty_ai_response");
      error.code = "empty_ai_response";
      throw error;
    }

    return parseJsonObject(text);
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error("ai_timeout");
      timeoutError.code = "ai_timeout";
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function buildSystemPrompt() {
  return [
    "You are the backend structured-output layer for ClearSteps.",
    "Return strict JSON only. No Markdown. No commentary.",
    "Use UK English, plain language, calm wording, and short lines.",
    "Do not give legal, medical, financial, or authenticity advice.",
    "Do not tell the user to pay, click links, call document numbers, or reply to a sender.",
    "Do not guess missing facts. If unclear, say Not clearly stated.",
    "Keep the same JSON shape as the provided fallback structured_result.",
    "Return exactly six cards in the same order and with the same card_id values.",
    "Set all privacy flags to false."
  ].join("\n");
}

function buildUserPrompt({ extractedText, fallbackStructuredResult }) {
  return [
    "Improve this ClearSteps structured_result using only the document text below.",
    "Keep session_id and anonymous_session_id exactly the same as the fallback.",
    "Keep all field names exactly the same.",
    "",
    "Fallback structured_result:",
    JSON.stringify(fallbackStructuredResult),
    "",
    "Document text for in-memory analysis only. Do not store it or repeat unnecessary personal details:",
    String(extractedText || "").slice(0, 12000)
  ].join("\n");
}

function extractResponseText(data) {
  if (typeof data.output_text === "string") return data.output_text;
  if (!Array.isArray(data.output)) return "";

  const parts = [];
  for (const item of data.output) {
    if (!Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (typeof content.text === "string") parts.push(content.text);
      if (typeof content.output_text === "string") parts.push(content.output_text);
    }
  }
  return parts.join("\n").trim();
}

function parseJsonObject(text) {
  const trimmed = String(text || "").trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    const error = new Error("ai_json_not_found");
    error.code = "ai_json_not_found";
    throw error;
  }

  try {
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  } catch (error) {
    error.code = "ai_json_parse_failed";
    throw error;
  }
}

function attachAiMetadata(output, metadata) {
  output.debug.ai = metadata;
}

function cleanAiErrorCode(value) {
  return String(value || "ai_failed")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .slice(0, 80) || "ai_failed";
}

function normalizeAiErrorCode(error) {
  if (!error) return "ai_failed";
  if (error.name === "AbortError" || error.code === 20 || error.code === "20") {
    return "ai_timeout";
  }
  return cleanAiErrorCode(error.code || error.message || "ai_failed");
}

function summarizeValidationErrors(errors) {
  if (!Array.isArray(errors)) return [];
  return errors
    .map((error) => String(error || "validation_error").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 8);
}

function logAiDebug(event, metadata) {
  if (process.env.CLEARSTEPS_AI_DEBUG !== "true") return;
  console.warn("[clearsteps-ai]", JSON.stringify({
    event,
    ...metadata
  }));
}

module.exports = {
  applyAiStructuredResult,
  requestStructuredResultFromOpenAi,
  extractResponseText,
  normalizeAiErrorCode,
  summarizeValidationErrors
};
