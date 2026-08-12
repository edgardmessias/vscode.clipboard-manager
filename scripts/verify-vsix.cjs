/* eslint-disable */
"use strict";

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const vsixPath = path.resolve(
  process.env.VSIX_FILE || path.join(repoRoot, "clipboard-manager.vsix")
);
const packageJsonPath = path.resolve(
  process.env.PACKAGE_JSON || path.join(repoRoot, "package.json")
);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function loadJson(filePath, label) {
  if (!fs.existsSync(filePath)) {
    fail(`${label} not found: ${filePath}`);
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`Failed to read ${label}: ${error.message}`);
  }
}

function resolveNodeEntry(packageJson) {
  const exportsRoot = packageJson.exports?.["."];

  if (exportsRoot?.node?.require) {
    return exportsRoot.node.require.replace(/^\.\//, "");
  }

  if (typeof exportsRoot === "string") {
    return exportsRoot.replace(/^\.\//, "");
  }

  if (packageJson.main) {
    return packageJson.main.replace(/^\.\//, "");
  }

  return "index.js";
}

function dependencyPrefix(name) {
  return `extension/node_modules/${name.replace(/\\/g, "/")}/`;
}

function hasPath(listing, filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  return listing.has(normalized);
}

function hasDependency(listing, name) {
  const prefix = dependencyPrefix(name);
  for (const entry of listing) {
    if (entry.startsWith(prefix)) {
      return true;
    }
  }
  return false;
}

function listDependencyFiles(listing, name) {
  const prefix = dependencyPrefix(name);
  return [...listing]
    .filter(entry => entry.startsWith(prefix))
    .sort();
}

function listZipEntries(zipPath) {
  const buffer = fs.readFileSync(zipPath);
  let eocdOffset = -1;

  for (let i = buffer.length - 22; i >= 0; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    fail("Invalid VSIX: ZIP end of central directory not found");
  }

  const centralDirOffset = buffer.readUInt32LE(eocdOffset + 16);
  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const entries = [];
  let offset = centralDirOffset;

  for (let i = 0; i < totalEntries; i++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      fail("Invalid VSIX: corrupt central directory");
    }

    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraFieldLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const fileName = buffer.toString(
      "utf8",
      offset + 46,
      offset + 46 + fileNameLength
    );

    entries.push(fileName);
    offset += 46 + fileNameLength + extraFieldLength + commentLength;
  }

  return entries;
}

function listVsixFiles(vsixPath) {
  return listZipEntries(vsixPath).join("\n");
}

if (!fs.existsSync(vsixPath)) {
  fail(`VSIX not found: ${vsixPath}`);
}

const pkg = loadJson(packageJsonPath, "package.json");
const dependencies = pkg.dependencies ?? {};

const listing = new Set(
  listVsixFiles(vsixPath)
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line => line.replace(/\\/g, "/"))
);

const mainEntry = (pkg.main || "./out/extension.js").replace(/^\.\//, "");
const requiredCore = [
  "extension/package.json",
  `extension/${mainEntry}`,
];

const missingCore = requiredCore.filter(file => !hasPath(listing, file));
if (missingCore.length > 0) {
  console.error("VSIX is missing required extension files:");
  for (const file of missingCore) {
    console.error(`  - ${file}`);
  }
  process.exit(1);
}

const dependencyNames = Object.keys(dependencies);
if (dependencyNames.length === 0) {
  console.log(`VSIX verification passed: ${path.basename(vsixPath)}`);
  console.log("No production dependencies declared in package.json.");
  process.exit(0);
}

const missingDependencies = [];
const missingEntries = [];

for (const name of dependencyNames) {
  if (!hasDependency(listing, name)) {
    missingDependencies.push(name);
    continue;
  }

  const depPackageJsonPath = path.join(repoRoot, "node_modules", name, "package.json");
  if (!fs.existsSync(depPackageJsonPath)) {
    fail(
      `Dependency "${name}" is declared in package.json but not installed locally at ${depPackageJsonPath}. Run npm install first.`
    );
  }

  const depPackageJson = loadJson(depPackageJsonPath, `${name}/package.json`);
  const entry = resolveNodeEntry(depPackageJson);
  const entryPath = `${dependencyPrefix(name)}${entry}`;

  if (!hasPath(listing, entryPath)) {
    missingEntries.push({ name, entryPath, version: dependencies[name] });
  }
}

if (missingDependencies.length > 0) {
  console.error(
    "VSIX is missing production dependencies from package.json (was --no-dependencies used?):"
  );
  for (const name of missingDependencies) {
    console.error(`  - ${name}@${dependencies[name]}`);
  }
  process.exit(1);
}

if (missingEntries.length > 0) {
  console.error("VSIX includes dependencies but is missing their runtime entry files:");
  for (const { name, entryPath, version } of missingEntries) {
    console.error(`  - ${name}@${version} -> ${entryPath}`);
  }
  process.exit(1);
}

console.log(`VSIX verification passed: ${path.basename(vsixPath)}`);
console.log(`Production dependencies checked (${dependencyNames.length}):`);

for (const name of dependencyNames) {
  const depPackageJson = loadJson(
    path.join(repoRoot, "node_modules", name, "package.json"),
    `${name}/package.json`
  );
  const entry = resolveNodeEntry(depPackageJson);
  const files = listDependencyFiles(listing, name);

  console.log(`  ${name}@${dependencies[name]} (${files.length} files, entry: ${entry})`);
}
