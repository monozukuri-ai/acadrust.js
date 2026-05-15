import { randomUUID } from "node:crypto";
import { rm, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { tmpdir } from "node:os";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

class RequestError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, {
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "Only POST requests are supported.",
      },
    });
    return;
  }

  try {
    const fileName = decodeFileName(request.headers["x-file-name"]);
    const source = await readRequestBody(request);
    const drawing = await parseDxf(source);

    sendJson(response, 200, {
      fileName,
      drawing,
    });
  } catch (error) {
    if (error instanceof RequestError) {
      sendJson(response, error.statusCode, {
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    const detail = error instanceof Error ? error.message : String(error);
    const code = typeof error?.code === "string" ? error.code : "DXF_PARSE_ERROR";

    sendJson(response, 400, {
      error: {
        code,
        message: detail,
      },
    });
  }
}

async function parseDxf(source) {
  const { readDxfSync } = await loadAcadrust();
  const path = join(tmpdir(), `acadrust-js-${randomUUID()}.dxf`);

  await writeFile(path, source);

  try {
    return readDxfSync(path).toJSON();
  } finally {
    await rm(path, { force: true });
  }
}

async function loadAcadrust() {
  if (process.env.ACADRUST_JS_IMPORT) {
    return import(process.env.ACADRUST_JS_IMPORT);
  }

  return import("acadrust.js");
}

async function readRequestBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.from(chunk);
    size += buffer.byteLength;

    if (size > MAX_UPLOAD_BYTES) {
      throw new RequestError(
        413,
        "UPLOAD_TOO_LARGE",
        `DXF uploads are limited to ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`,
      );
    }

    chunks.push(buffer);
  }

  if (size === 0) {
    throw new RequestError(400, "EMPTY_UPLOAD", "The request body is empty.");
  }

  return Buffer.concat(chunks, size);
}

function decodeFileName(value) {
  const first = Array.isArray(value) ? value[0] : value;

  if (!first) {
    return "upload.dxf";
  }

  try {
    return basename(decodeURIComponent(first)).slice(0, 140) || "upload.dxf";
  } catch {
    return basename(String(first)).slice(0, 140) || "upload.dxf";
  }
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}
