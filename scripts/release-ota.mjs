import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import AdmZip from 'adm-zip';

const DIST_DIR = path.resolve('dist');
const DIST_OTA_DIR = path.resolve('dist/ota');
const PUBLIC_OTA_DIR = path.resolve('public/ota');

// Step 1: Generate version based on timestamp
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = `${pkg.version}-${Date.now()}`;
const zipName = `${version}.zip`;

console.log(`🚀 Starting OTA Release: ${version}`);

// Step 2: Build the web app
console.log('📦 Building web app...');
execSync('npm run build', { stdio: 'inherit' });

// Ensure dist exists
if (!fs.existsSync(DIST_DIR)) {
  throw new Error('dist directory does not exist after build!');
}

// Step 3: Zip the dist folder BEFORE adding the ota folder into it
console.log(`🗜️ Zipping web assets to ${zipName}...`);
const zip = new AdmZip();
zip.addLocalFolder(DIST_DIR);

// Step 4: Create the OTA directories in both dist/ota and public/ota
[DIST_OTA_DIR, PUBLIC_OTA_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Step 5: Save the zip bundle
const distZipPath = path.join(DIST_OTA_DIR, zipName);
const publicZipPath = path.join(PUBLIC_OTA_DIR, zipName);
zip.writeZip(distZipPath);
try {
  fs.copyFileSync(distZipPath, publicZipPath);
} catch (e) {
  console.warn('Could not copy to public/ota:', e.message);
}

// Step 6: Generate version.json
console.log('📝 Generating version.json...');
const versionInfo = {
  version: version,
  url: `https://stocksuit.web.app/ota/${zipName}`,
  updatedAt: new Date().toISOString()
};

const versionJsonContent = JSON.stringify(versionInfo, null, 2);
fs.writeFileSync(path.join(DIST_OTA_DIR, 'version.json'), versionJsonContent);
fs.writeFileSync(path.join(PUBLIC_OTA_DIR, 'version.json'), versionJsonContent);

console.log('✅ OTA Release prepared successfully!');
console.log(`Version: ${version}`);
console.log(`Files generated in dist/ota/ and public/ota/`);
