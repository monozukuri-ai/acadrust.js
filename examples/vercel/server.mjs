import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import parseDxf from "./api/parse-dxf.mjs";

const root = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(root, "public");
const port = Number(process.env.PORT || 4173);

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".dxf", "application/dxf"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
]);

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (url.pathname === "/api/parse-dxf") {
    await parseDxf(request, response);
    return;
  }

  serveStatic(url.pathname, response);
});

server.listen(port, () => {
  console.log(`acadrust.js Vercel example running at http://localhost:${port}`);
});

function serveStatic(pathname, response) {
  const publicPath = pathname === "/" ? "/index.html" : pathname;
  const resolved = normalize(join(publicDir, publicPath));

  if (!resolved.startsWith(publicDir) || !existsSync(resolved) || !statSync(resolved).isFile()) {
    response.statusCode = 404;
    response.end("Not found");
    return;
  }

  response.setHeader("Content-Type", mimeTypes.get(extname(resolved)) || "application/octet-stream");
  createReadStream(resolved).pipe(response);
}
