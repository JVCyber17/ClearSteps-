const fs = require("node:fs");
const path = require("node:path");

const { extractTextFromInput } = require("../services/textExtraction");
const { runClearStepsEngine } = require("../services/clearStepsEngine");

async function simplifyRoute({ file, fields, directories }) {
  const { uploadsDir, resultsDir } = directories;
  const pastedText = fields.pastedText || fields.text || "";

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

  const extractedText = await extractTextFromInput({
    pastedText,
    filePath,
    mimeType,
    originalName
  });

  const run = runClearStepsEngine({
    extractedText,
    fileMeta: {
      jobId,
      mimeType,
      originalName,
      selectedCategory: fields.documentCategory || "auto"
    }
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
  if (!process.env.CLEARSTEPS_ENABLE_FILE_RETENTION && filePath && filePath.startsWith(uploadsDir)) {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      // Keep deletion errors silent to avoid leaking file details in logs.
    }
  }

  return output;
}

module.exports = { simplifyRoute };
