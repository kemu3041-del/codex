import { createReadStream, createWriteStream, existsSync, mkdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(import.meta.dirname);
const renderDir = join(root, "renders");
const outputFile = join(renderDir, "potato-cart-short.webm");
const port = Number(process.env.PORT || 4180);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".webm": "video/webm"
};

function sendJson(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(text)
  });
  res.end(text);
}

function serveFile(req, res) {
  const url = new URL(req.url, `http://localhost:${port}`);
  const requestPath = url.pathname === "/" ? "/canvas-render.html" : url.pathname;
  const filePath = normalize(join(root, decodeURIComponent(requestPath)));

  if (!filePath.startsWith(root) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  res.writeHead(200, {
    "content-type": types[extname(filePath)] || "application/octet-stream"
  });
  createReadStream(filePath).pipe(res);
}

const server = createServer((req, res) => {
  if (req.method === "POST" && req.url === "/save-video") {
    mkdirSync(renderDir, { recursive: true });
    const file = createWriteStream(outputFile);
    req.pipe(file);
    req.on("end", () => {
      file.end();
      file.on("finish", () => {
        sendJson(res, 200, {
          ok: true,
          file: outputFile,
          size: statSync(outputFile).size
        });
      });
    });
    req.on("error", (error) => {
      sendJson(res, 500, { ok: false, error: error.message });
    });
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "content-type": "text/plain; charset=utf-8" });
    res.end("Method not allowed");
    return;
  }

  serveFile(req, res);
});

server.listen(port, () => {
  console.log(`Potato render server: http://localhost:${port}/canvas-render.html?auto=1`);
});
