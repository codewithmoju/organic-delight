import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getOrgIdOrNull } from './orgScope';
import type { Unit } from './units';
import type { PaymentMethod } from './paymentMethods';
import type { BillType } from '../types';

export interface OrganizationSettings {
  custom_units?: Omit<Unit, 'id'>[];
  disabled_payment_methods?: string[];
  custom_bill_types?: Omit<BillType, 'id'>[];
}

const COLLECTION = 'organization_settings';

function settingsDocRef(orgId: string) {
  return doc(db, COLLECTION, orgId);
}

export async function getOrgSettings(orgId?: string): Promise<OrganizationSettings> {
  const id = orgId ?? getOrgIdOrNull();
  if (!id) return {};
  try {
    const snap = await getDoc(settingsDocRef(id));
    if (!snap.exists()) return {};
    const data = snap.data();
    return {
      custom_units: data.custom_units,
      disabled_payment_methods: data.disabled_payment_methods,
      custom_bill_types: data.custom_bill_types,
    };
  } catch {
    return {};
  }
}

export async function updateOrgSettings(
  settings: Partial<OrganizationSettings>,
  orgId?: string
): Promise<void> {
  const id = orgId ?? getOrgIdOrNull();
  if (!id) throw new Error('No active organization');
  await setDoc(
    settingsDocRef(id),
    { ...settings, updated_at: Timestamp.now() },
    { merge: true }
  );
}
