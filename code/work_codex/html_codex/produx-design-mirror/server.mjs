import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4177);

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".webm", "video/webm"],
  [".mp4", "video/mp4"],
  [".mov", "video/quicktime"],
  [".otf", "font/otf"],
  [".ttf", "font/ttf"],
]);

function safeJoin(urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  return path.join(rootDir, normalized);
}

async function findStaticFile(urlPath) {
  const pathname = urlPath === "/" ? "/index.html" : urlPath;
  const directPath = safeJoin(pathname);

  try {
    const stat = await fs.stat(directPath);
    if (stat.isFile()) return directPath;
    if (stat.isDirectory()) return path.join(directPath, "index.html");
  } catch {}

  if (!path.extname(pathname)) {
    const routeIndex = safeJoin(path.join(pathname, "index.html"));
    try {
      const stat = await fs.stat(routeIndex);
      if (stat.isFile()) return routeIndex;
    } catch {}
  }

  return null;
}

async function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const body = await fs.readFile(filePath);
  res.writeHead(200, {
    "content-type": mimeTypes.get(ext) || "application/octet-stream",
    "content-length": body.length,
    "cache-control": "no-store",
  });
  res.end(body);
}

const transparentPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || "/", `http://${req.headers.host}`);

    // Next Image is a runtime optimizer on the live site. Locally we serve the
    // original image path so React Flight payloads can stay byte-for-byte intact.
    if (requestUrl.pathname === "/_next/image") {
      const source = requestUrl.searchParams.get("url");
      const filePath = source ? await findStaticFile(source) : null;
      if (filePath) return sendFile(res, filePath);
    }

    if (requestUrl.pathname === "/cookie.png") {
      res.writeHead(200, {
        "content-type": "image/png",
        "content-length": transparentPng.length,
        "cache-control": "no-store",
      });
      return res.end(transparentPng);
    }

    if (requestUrl.searchParams.has("_rsc")) {
      res.writeHead(204, {
        "content-type": "text/x-component; charset=utf-8",
        "cache-control": "no-store",
      });
      return res.end();
    }

    const filePath = await findStaticFile(requestUrl.pathname);
    if (filePath) return sendFile(res, filePath);

    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  } catch (error) {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end(error instanceof Error ? error.message : "Server error");
  }
});

server.listen(port, () => {
  console.log(`PRODUX mirror running at http://127.0.0.1:${port}/`);
});
