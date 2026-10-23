import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { minify as minifyJavaScript } from "terser";

const sourcePath = resolve("index.html");
const outputPath = resolve("dist", "index.html");
const customDomainPath = resolve("CNAME");
const source = await readFile(sourcePath, "utf8");
const customDomain = await readFile(customDomainPath, "utf8");
const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
const scripts = [...source.matchAll(scriptPattern)];
const inlineScripts = scripts.filter((script) => !/\bsrc\s*=/.test(script[1]));

if (inlineScripts.length !== 1 || inlineScripts[0][1].trim() !== "") {
  throw new Error("Expected exactly one inline application script without attributes.");
}

const applicationScript = inlineScripts[0];
const script = await minifyJavaScript(applicationScript[2], {
  compress: true,
  mangle: true,
  format: { comments: false },
});

if (!script.code) {
  throw new Error("JavaScript minification returned no output.");
}

const htmlWithMinifiedScript = source.replace(
  applicationScript[0],
  () => `<script>${script.code}</script>`,
);
const output = htmlWithMinifiedScript;

await mkdir(resolve("dist"), { recursive: true });
await writeFile(outputPath, output, "utf8");
await writeFile(resolve("dist", "CNAME"), customDomain, "utf8");

const inputBytes = (await stat(sourcePath)).size;
const outputBytes = Buffer.byteLength(output);
const reduction = Math.round((1 - outputBytes / inputBytes) * 100);
console.log(
  `Created dist/index.html (${inputBytes} -> ${outputBytes} bytes, ${reduction}% smaller).`,
);
