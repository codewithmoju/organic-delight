import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();

/**
 * Syncs organization membership to Firebase Auth custom claims.
 *
 * When an `organization_members/{orgId}_{uid}` document is created, updated,
 * or deleted, this function rebuilds the user's `orgs` custom claim:
 *
 *   { orgs: { "<orgId>": "<role>", ... } }
 *
 * The client can read this via `getIdTokenResult()` without any extra
 * Firestore reads, making role checks O(1) instead of O(n) per request.
 */
export const syncMemberClaims = onDocumentWritten(
  "organization_members/{memberId}",
  async (event) => {
    const memberId = event.params.memberId;

    // Extract uid from composite doc ID: "{orgId}_{uid}"
    const lastUnderscore = memberId.lastIndexOf("_");
    if (lastUnderscore === -1) return;
    const uid = memberId.substring(lastUnderscore + 1);
    if (!uid) return;

    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    // Collect all organization_members docs for this user
    const db = getFirestore();
    const memberSnap = await db
      .collection("organization_members")
      .where("user_id", "==", uid)
      .where("status", "==", "active")
      .get();

    const orgs = {};
    for (const doc of memberSnap.docs) {
      const data = doc.data();
      if (data.organization_id && data.role) {
        orgs[data.organization_id] = data.role;
      }
    }

    try {
      await getAuth().setCustomUserClaims(uid, { orgs });
      console.log(`Updated claims for ${uid}:`, orgs);
    } catch (err) {
      console.error(`Failed to set claims for ${uid}:`, err);
    }
  }
);

/**
 * Create a team member account.
 *
 * Only owners/managers can call this. Creates a Firebase Auth user,
 * profile doc, and organization_members doc in one atomic operation.
 * The syncMemberClaims trigger fires automatically from the member doc.
 */
export const createTeamAccount = onCall(
  { enforceAppCheck: false, cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const callerUid = request.auth.uid;
    const { orgId, email, displayName, password, role } = request.data;

    // Input validation
    if (!orgId || !email || !password || !role) {
      throw new HttpsError("invalid-argument", "Missing required fields: orgId, email, password, role");
    }

    const validRoles = ["manager", "cashier", "accountant", "viewer"];
    if (!validRoles.includes(role)) {
      throw new HttpsError("invalid-argument", `Invalid role. Must be one of: ${validRoles.join(", ")}`);
    }

    // Password strength validation
    if (password.length < 8) {
      throw new HttpsError("invalid-argument", "Password must be at least 8 characters");
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      throw new HttpsError("invalid-argument", "Password must contain uppercase, lowercase, and a number");
    }

    const auth = getAuth();
    const db = getFirestore();

    // Verify caller is owner/manager of the org (via custom claims)
    const callerClaims = request.auth.token.orgs || {};
    const callerRole = callerClaims[orgId];
    if (callerRole !== "owner" && callerRole !== "manager") {
      throw new HttpsError("permission-denied", "Only owners and managers can create accounts");
    }

    // Check if email already exists
    try {
      await auth.getUserByEmail(email);
      throw new HttpsError("already-exists", "An account with this email already exists");
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      // auth/user-not-found is expected — continue
    }

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || email.split("@")[0],
      disabled: false,
    });

    // Create profile document
    await db.collection("profiles").doc(userRecord.uid).set({
      id: userRecord.uid,
      email,
      full_name: displayName || email.split("@")[0],
      preferred_currency: "PKR",
      role: "user",
      created_by_admin: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Create organization_members document (composite ID)
    const memberId = `${orgId}_${userRecord.uid}`;
    await db.collection("organization_members").doc(memberId).set({
      organization_id: orgId,
      user_id: userRecord.uid,
      role,
      status: "active",
      joined_at: new Date(),
      invited_by: callerUid,
      user_name: displayName || email.split("@")[0],
      user_email: email,
    });

    // syncMemberClaims trigger fires automatically from the write above

    return {
      userId: userRecord.uid,
      email,
      role,
    };
  }
);

/**
 * Generate a password reset link for a team member.
 * Only owners/managers can call this.
 */
export const resetTeamMemberPassword = onCall(
  { enforceAppCheck: false, cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const { orgId, email } = request.data;
    if (!orgId || !email) {
      throw new HttpsError("invalid-argument", "Missing orgId or email");
    }

    // Verify caller is owner/manager
    const callerClaims = request.auth.token.orgs || {};
    const callerRole = callerClaims[orgId];
    if (callerRole !== "owner" && callerRole !== "manager") {
      throw new HttpsError("permission-denied", "Only owners and managers can reset passwords");
    }

    // Verify target user exists
    try {
      await getAuth().getUserByEmail(email);
    } catch {
      throw new HttpsError("not-found", "No account found with this email");
    }

    const resetLink = await getAuth().generatePasswordResetLink(email);
    return { resetLink };
  }
);
