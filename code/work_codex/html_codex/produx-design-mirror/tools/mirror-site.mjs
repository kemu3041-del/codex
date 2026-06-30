import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const origin = "https://www.produx.design";
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const maxPasses = 4;
const downloaded = new Set();
const queued = new Set(["/"]);

const ignoredExtensions = new Set([
  ".html",
  ".htm",
  ".php",
]);

function normalizeResource(value, base = origin) {
  if (!value) return null;

  const clean = value
    .replace(/&amp;/g, "&")
    .trim()
    .replace(/^['"]|['"]$/g, "");

  if (
    !clean ||
    clean.startsWith("#") ||
    clean.startsWith("mailto:") ||
    clean.startsWith("tel:") ||
    clean.startsWith("data:") ||
    clean.startsWith("blob:")
  ) {
    return null;
  }

  let url;
  try {
    url = new URL(clean, base);
  } catch {
    return null;
  }

  if (url.origin !== origin) return null;
  const pathname = url.pathname;
  if (pathname === "/_next/image" && url.searchParams.get("url")) {
    return normalizeResource(url.searchParams.get("url"));
  }

  const ext = path.extname(pathname).toLowerCase();

  if (pathname !== "/" && ignoredExtensions.has(ext)) return null;
  return pathname + url.search;
}

function localPathFor(resource) {
  const url = new URL(resource, origin);
  if (url.pathname === "/") return path.join(rootDir, "index.html");

  const decodedPath = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const ext = path.extname(decodedPath);
  const filePath = ext
    ? path.join(rootDir, decodedPath)
    : path.join(rootDir, decodedPath, "index.html");
  if (!url.search) return filePath;

  // Next static chunks are query-versioned. Preserve a stable file name while
  // keeping the HTML references unchanged for HTTP serving from the mirror root.
  return filePath;
}

function collectResources(text, baseResource = "/") {
  const found = new Set();
  const base = new URL(baseResource, origin).href;
  const patterns = [
    /\b(?:src|href|poster)=["']([^"']+)["']/gi,
    /\bsrcset=["']([^"']+)["']/gi,
    /url\(([^)]+)\)/gi,
    /["'](\/(?:_next|images|videos|SEO|fonts|favicon|assets)\/[^"'\s)<>\\]+)["']/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text))) {
      if (pattern.source.includes("srcset")) {
        for (const candidate of match[1].split(",")) {
          const resource = normalizeResource(candidate.trim().split(/\s+/)[0], base);
          if (resource) found.add(resource);
        }
      } else {
        const resource = normalizeResource(match[1], base);
        if (resource) found.add(resource);
      }
    }
  }

  return found;
}

async function download(resource) {
  if (downloaded.has(resource)) return "";
  downloaded.add(resource);

  const targetPath = localPathFor(resource);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });

  const remoteUrl = new URL(resource, origin);
  const response = await fetch(remoteUrl, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/126 Safari/537.36",
    },
  });

  if (!response.ok) {
    console.warn(`skip ${resource}: ${response.status}`);
    return "";
  }

  const contentType = response.headers.get("content-type") || "";
  const buffer = Buffer.from(await response.arrayBuffer());

  await fs.writeFile(targetPath, buffer);
  console.log(`saved ${resource}`);

  if (
    contentType.includes("text/") ||
    contentType.includes("javascript") ||
    contentType.includes("json") ||
    contentType.includes("xml")
  ) {
    return buffer.toString("utf8");
  }

  return "";
}

for (let pass = 0; pass < maxPasses; pass += 1) {
  const currentPass = [...queued].filter((resource) => !downloaded.has(resource));
  if (!currentPass.length) break;

  for (const resource of currentPass) {
    const text = await download(resource);
    if (!text) continue;

    for (const discovered of collectResources(text, resource)) {
      if (!downloaded.has(discovered)) queued.add(discovered);
    }
  }
}

const summary = {
  origin,
  downloaded: downloaded.size,
  generatedAt: new Date().toISOString(),
};

await fs.writeFile(
  path.join(rootDir, "mirror-summary.json"),
  `${JSON.stringify(summary, null, 2)}\n`,
);
