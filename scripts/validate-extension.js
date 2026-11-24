#!/usr/bin/env node

/**
 * Minimal, dependency-free preflight check for the packaged Chrome extension.
 * Run with: node scripts/validate-extension.js
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "manifest.json");

function fail(message) {
  console.error(`Validation failed: ${message}`);
  process.exitCode = 1;
}

if (!fs.existsSync(manifestPath)) {
  fail("manifest.json is missing");
} else {
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    fail(`manifest.json is not valid JSON (${error.message})`);
  }

  if (manifest) {
    if (manifest.manifest_version !== 3) fail("manifest_version must be 3");
    if (!manifest.name) fail("extension name is missing");

    const requiredFiles = [
      manifest.background?.service_worker,
      manifest.action?.default_popup,
      ...(manifest.content_scripts || []).flatMap((script) => script.js || []),
    ].filter(Boolean);

    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(root, file))) fail(`referenced file is missing: ${file}`);
    }

    if (!process.exitCode) {
      console.log(`Extension manifest is valid (${requiredFiles.length} referenced files checked).`);
    }
  }
}
