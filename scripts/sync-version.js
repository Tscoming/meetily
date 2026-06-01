#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const versionPath = path.join(rootDir, 'VERSION');
const packagePath = path.join(rootDir, 'frontend', 'package.json');
const tauriConfigPath = path.join(rootDir, 'frontend', 'src-tauri', 'tauri.conf.json');
const cargoTomlPath = path.join(rootDir, 'frontend', 'src-tauri', 'Cargo.toml');

function readVersion() {
  const version = fs.readFileSync(versionPath, 'utf8').trim();
  const semverPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

  if (!semverPattern.test(version)) {
    throw new Error(`VERSION must be a SemVer value like 0.3.1 or 0.3.1-beta.1, got "${version}"`);
  }

  return version;
}

function writeJsonVersion(filePath, version) {
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  json.version = version;
  fs.writeFileSync(filePath, `${JSON.stringify(json, null, 4)}\n`);
}

function writeCargoVersion(filePath, version) {
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  let inPackage = false;
  let updated = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (/^\[package\]\s*$/.test(line)) {
      inPackage = true;
      continue;
    }

    if (inPackage && /^\[/.test(line)) {
      break;
    }

    if (inPackage && /^version\s*=/.test(line)) {
      lines[index] = `version = "${version}"`;
      updated = true;
      break;
    }
  }

  if (!updated) {
    throw new Error(`Could not find [package] version in ${filePath}`);
  }

  fs.writeFileSync(filePath, lines.join('\n'));
}

function main() {
  const version = readVersion();

  writeJsonVersion(packagePath, version);
  writeJsonVersion(tauriConfigPath, version);
  writeCargoVersion(cargoTomlPath, version);

  console.log(`Synced Meetily version to ${version}`);
}

main();
