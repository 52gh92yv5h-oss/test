import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const orgsFile = join(root, "templates/swedish-government/organisations.json");
const logosDir = join(root, "templates/swedish-government/logos");

mkdirSync(logosDir, { recursive: true });

const orgs = JSON.parse(readFileSync(orgsFile, "utf8"));

for (const org of orgs.organisations) {
  const dataUrl = org.logoDataUrl;
  const base64Match = dataUrl.match(/base64,(.+)$/);
  if (!base64Match) {
    console.warn(`Skipping ${org.id}: invalid data URL format`);
    continue;
  }

  const svgData = Buffer.from(base64Match[1], "base64").toString("utf8");
  const fileName = `${org.id}.svg`;
  const filePath = join(logosDir, fileName);

  writeFileSync(filePath, svgData);
  console.log(`Extracted: ${fileName}`);
}

console.log(`\nLogos saved to: ${logosDir}`);
