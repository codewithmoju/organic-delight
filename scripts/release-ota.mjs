import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import AdmZip from 'adm-zip';

const DIST_DIR = path.resolve('dist');
const OTA_DIR = path.resolve('public/ota'); // We place it in public so it goes to firebase hosting

// Step 1: Generate version based on timestamp or package.json
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
// We append a timestamp so every release is unique and forces the app to update
const version = `${pkg.version}-${Date.now()}`;
const zipName = `${version}.zip`;

console.log(`🚀 Starting OTA Release: ${version}`);

// Step 2: Build the web app
console.log('📦 Building web app...');
execSync('npm run build', { stdio: 'inherit' });

// Step 3: Create the OTA directory if it doesn't exist
if (!fs.existsSync(OTA_DIR)) {
  fs.mkdirSync(OTA_DIR, { recursive: true });
}

// Step 4: Zip the dist folder
console.log(`🗜️ Zipping dist folder to ${zipName}...`);
const zip = new AdmZip();
zip.addLocalFolder(DIST_DIR);
zip.writeZip(path.join(OTA_DIR, zipName));

// Step 5: Generate version.json
console.log('📝 Generating version.json...');
const versionInfo = {
  version: version,
  url: `/ota/${zipName}` // relative URL, the app will prepend the hosting domain
};
fs.writeFileSync(path.join(OTA_DIR, 'version.json'), JSON.stringify(versionInfo, null, 2));

console.log('✅ OTA Release prepared successfully!');
console.log(`Now run: firebase deploy --only hosting`);
