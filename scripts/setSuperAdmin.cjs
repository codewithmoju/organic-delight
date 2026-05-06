/**
 * Set super admin custom claim on a Firebase Auth user.
 *
 * Usage:
 *   node scripts/setSuperAdmin.js <firebase-uid>
 *
 * Prerequisites:
 *   - Firebase Admin SDK installed: npm install firebase-admin
 *   - Service account key available via GOOGLE_APPLICATION_CREDENTIALS env var,
 *     or initialize the app with explicit credentials.
 *
 * After running this script, the user must sign out and sign back in
 * for the custom claim to take effect in their auth token.
 */

const admin = require('firebase-admin');
const path = require('path');

// Load service account key from scripts/ directory
const keyPath = path.join(__dirname, 'service-account.json');
let serviceAccount;
try {
  serviceAccount = require(keyPath);
} catch {
  console.error('Could not find scripts/service-account-key.json');
  console.error('Download it from: Firebase Console → Project Settings → Service accounts → Generate new private key');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = process.argv[2];

if (!uid) {
  console.error('Usage: node scripts/setSuperAdmin.js <firebase-uid>');
  process.exit(1);
}

async function setSuperAdmin() {
  try {
    // Set the superAdmin custom claim
    await admin.auth().setCustomUserClaims(uid, { superAdmin: true });
    console.log(`Successfully set superAdmin claim on user: ${uid}`);
    console.log('The user must sign out and sign back in for the claim to take effect.');

    // Verify the claim was set
    const user = await admin.auth().getUser(uid);
    console.log('Current custom claims:', JSON.stringify(user.customClaims, null, 2));
  } catch (error) {
    console.error('Error setting super admin claim:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

setSuperAdmin();
