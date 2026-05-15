const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const { simplifyRoute } = require("./src/routes/simplifyRoute");
const { loadEnvFile } = require("./src/utils/loadEnv");

loadEnvFile(__dirname);

const PORT = Number(process.env.PORT || 3000);
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
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

    if (req.method === "POST" && (req.url === "/api/simplify" || req.url === "/api/upload")) {
      return handleSimplify(req, res);
    }

    sendJson(res, 404, { error: "Not found." });
  } catch (error) {
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
  // TODO: Add short retention cleanup for uploads/results with a scheduled task.
}

async function handleSimplify(req, res) {
  const contentType = req.headers["content-type"] || "";
  let fields = {};
  let file = null;

  if (contentType.startsWith("multipart/form-data")) {
    const body = await readRequestBody(req, MAX_UPLOAD_BYTES);
    const form = parseMultipartForm(body, contentType);
    fields = form.fields;

    if (form.file) {
      if (!ALLOWED_TYPES.has(form.file.contentType)) {
        return sendJson(res, 400, { error: "Please upload a PDF, image, DOCX, DOC, or text file." });
      }

      const jobId = crypto.randomUUID();
      const filePath = path.join(UPLOAD_DIR, `${jobId}${extensionForType(form.file.contentType)}`);
      fs.writeFileSync(filePath, form.file.data);

      file = {
        jobId,
        savedPath: filePath,
        filename: form.file.filename,
        contentType: form.file.contentType
      };
    }
  } else if (contentType.includes("application/json")) {
    const body = await readRequestBody(req, MAX_UPLOAD_BYTES);
    try {
      const json = JSON.parse(body.toString("utf8"));
      fields = {
        pastedText: typeof json.text === "string" ? json.text : "",
        documentCategory: typeof json.documentCategory === "string" ? json.documentCategory : "auto"
      };
    } catch (error) {
      return sendJson(res, 400, { error: "Invalid JSON body." });
    }
  } else {
    return sendJson(res, 400, { error: "Use multipart upload or JSON text input." });
  }

  if (!file && !String(fields.pastedText || "").trim()) {
    return sendJson(res, 400, { error: "Upload a document or provide pasted text." });
  }

  const result = await simplifyRoute({
    file,
    fields,
    directories: {
      uploadsDir: UPLOAD_DIR,
      resultsDir: RESULT_DIR
    }
  });

  sendJson(res, 200, result);
}

function readRequestBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;

    req.on("data", (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        reject(new Error("Request body is too large."));
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
