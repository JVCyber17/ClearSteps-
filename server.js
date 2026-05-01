const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const { runLetterPipeline } = require("./src/aiPipeline");
const { extractTextFromUpload } = require("./src/textExtraction");

const PORT = Number(process.env.PORT || 3000);
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const PUBLIC_DIR = path.join(__dirname, "public");
const UPLOAD_DIR = path.join(__dirname, "private_storage", "uploads");
const RESULT_DIR = path.join(__dirname, "private_storage", "results");

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

ensurePrivateFolders();

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET") {
      return serveStaticFile(req, res);
    }

    if (req.method === "POST" && req.url === "/api/upload") {
      return handleUpload(req, res);
    }

    sendJson(res, 404, { error: "Not found." });
  } catch (error) {
    // Do not log raw letter text here. Keep logs limited to safe operational errors.
    console.error("Request failed:", error.message);
    sendJson(res, 500, { error: "Something went wrong. Please try again." });
  }
});

server.listen(PORT, () => {
  if (process.stdout.isTTY) {
    console.log(`ClearSteps is running at http://localhost:${PORT}`);
  }
});

function ensurePrivateFolders() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.mkdirSync(RESULT_DIR, { recursive: true });

  // TODO: Add short retention deletion for raw uploaded files before production.
  // Example: delete files older than 24 hours with a scheduled worker.
}

async function handleUpload(req, res) {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.startsWith("multipart/form-data")) {
    return sendJson(res, 400, { error: "Please upload one PDF or image." });
  }

  const body = await readRequestBody(req, MAX_UPLOAD_BYTES);
  const form = parseMultipartForm(body, contentType);
  const file = form.file;

  if (!file) {
    return sendJson(res, 400, { error: "Please choose one file." });
  }

  if (!ALLOWED_TYPES.has(file.contentType)) {
    return sendJson(res, 400, { error: "Please upload a PDF, image, or document file." });
  }

  const jobId = crypto.randomUUID();
  const safeExt = extensionForType(file.contentType);
  const savedPath = path.join(UPLOAD_DIR, `${jobId}${safeExt}`);

  // Save the original upload privately. It is not inside the public folder.
  fs.writeFileSync(savedPath, file.data);

  // Extract text before the AI pipeline. OCR is a placeholder in this MVP.
  const extractedText = await extractTextFromUpload({
    filePath: savedPath,
    mimeType: file.contentType,
    originalName: file.filename
  });

  const pipelineResult = runLetterPipeline({
    extractedText,
    fileMeta: {
      jobId,
      mimeType: file.contentType,
      originalName: file.filename,
      sizeBytes: file.data.length,
      selectedCategory: form.fields.documentCategory || "auto"
    }
  });

  const storedResult = {
    job_id: jobId,
    created_at: new Date().toISOString(),
    structured_output: pipelineResult.structuredOutput,
    user_output: pipelineResult.userOutput
  };

  // Store only structured output for now. Do not store raw extracted letter text.
  fs.writeFileSync(
    path.join(RESULT_DIR, `${jobId}.json`),
    JSON.stringify(storedResult, null, 2)
  );

  // TODO: Add short retention deletion for stored structured output if required by policy.
  sendJson(res, 200, {
    job_id: jobId,
    result: pipelineResult.userOutput
  });
}

function readRequestBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;

    req.on("data", (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        reject(new Error("Upload is too large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function parseMultipartForm(body, contentType) {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  const boundary = boundaryMatch && (boundaryMatch[1] || boundaryMatch[2]);
  const form = { file: null, fields: {} };
  if (!boundary) return form;

  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const parts = splitBuffer(body, boundaryBuffer);

  for (const part of parts) {
    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd === -1) continue;

    const rawHeaders = part.slice(0, headerEnd).toString("utf8");
    const dataStart = headerEnd + 4;
    let data = part.slice(dataStart);

    if (data.slice(-2).toString() === "\r\n") {
      data = data.slice(0, -2);
    }

    const disposition = rawHeaders.match(/content-disposition:\s*form-data;(.+)/i);
    const fileNameMatch = rawHeaders.match(/filename="([^"]*)"/i);
    const typeMatch = rawHeaders.match(/content-type:\s*([^\r\n]+)/i);

    if (disposition && fileNameMatch && fileNameMatch[1]) {
      form.file = {
        filename: path.basename(fileNameMatch[1]),
        contentType: (typeMatch && typeMatch[1].trim().toLowerCase()) || "application/octet-stream",
        data
      };
      continue;
    }

    const nameMatch = rawHeaders.match(/name="([^"]*)"/i);
    if (disposition && nameMatch && nameMatch[1]) {
      form.fields[nameMatch[1]] = data.toString("utf8").trim();
    }
  }

  return form;
}

function splitBuffer(buffer, separator) {
  const parts = [];
  let start = buffer.indexOf(separator);

  while (start !== -1) {
    const next = buffer.indexOf(separator, start + separator.length);
    if (next === -1) break;

    const part = buffer.slice(start + separator.length, next);
    const trimmed = trimBoundaryPart(part);
    if (trimmed.length) parts.push(trimmed);

    start = next;
  }

  return parts;
}

function trimBoundaryPart(part) {
  let output = part;

  if (output.slice(0, 2).toString() === "\r\n") {
    output = output.slice(2);
  }

  if (output.slice(0, 2).toString() === "--") {
    return Buffer.alloc(0);
  }

  return output;
}

function extensionForType(contentType) {
  if (contentType === "application/pdf") return ".pdf";
  if (contentType === "image/jpeg") return ".jpg";
  if (contentType === "image/png") return ".png";
  if (contentType === "image/webp") return ".webp";
  if (contentType === "text/plain") return ".txt";
  if (contentType === "application/msword") return ".doc";
  if (contentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return ".docx";
  return ".bin";
}

function serveStaticFile(req, res) {
  const cleanUrl = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const decodedPath = decodeURIComponent(cleanUrl);
  const requestedPath = path.normalize(path.join(PUBLIC_DIR, decodedPath));

  if (!requestedPath.startsWith(PUBLIC_DIR)) {
    return sendJson(res, 403, { error: "Forbidden." });
  }

  if (!fs.existsSync(requestedPath) || fs.statSync(requestedPath).isDirectory()) {
    return sendJson(res, 404, { error: "Not found." });
  }

  const ext = path.extname(requestedPath);
  const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml"
  };

  res.writeHead(200, {
    "Content-Type": contentTypes[ext] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  fs.createReadStream(requestedPath).pipe(res);
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}
