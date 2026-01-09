
'use client';

import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  Firestore,
} from 'firebase/firestore';
import { addMonths } from 'date-fns';
import type { Appointment } from '@/lib/types';

/**
 * Finds all appointments without a 'renewalDate' and updates them in batches.
 * This is intended as a one-time migration for existing data.
 * @param db The Firestore instance.
 * @param professionalId The UID of the professional.
 */
export async function backfillRenewalDates(db: Firestore, professionalId: string): Promise<void> {
  console.log(`Starting renewalDate backfill for user: ${professionalId}`);
  const appointmentsRef = collection(db, 'professionals', professionalId, 'appointments');
  
  // Query for documents where 'renewalDate' does NOT exist.
  // Firestore doesn't have a 'does not exist' operator, so we query for documents
  // where renewalDate is null, as unset fields behave like null in queries.
  // A more robust way if needed would be to fetch all and filter client-side, but this is often sufficient.
  const q = query(appointmentsRef, where('renewalDate', '==', null));

  try {
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log(`No appointments to backfill for user: ${professionalId}`);
      return;
    }

    console.log(`Found ${snapshot.docs.length} appointments to backfill.`);

    let batch = writeBatch(db);
    let count = 0;

    for (const doc of snapshot.docs) {
      const appointment = doc.data() as Appointment;

      // Double-check just in case the query isn't perfect or data is weird
      if (appointment.renewalDate) {
        continue;
      }
      
      const appointmentDate = new Date(appointment.appointmentDate);
      const validity = appointment.validityPeriodMonths || 0;
      
      // Only calculate if there's a validity period
      if (validity > 0) {
        const renewalDate = addMonths(appointmentDate, validity);
        batch.update(doc.ref, { renewalDate: renewalDate.toISOString() });
        count++;
      } else {
         // If validity is 0, maybe set it to appointment date or a far-future date
         // so it doesn't show up in renewals. Let's use the original date.
         batch.update(doc.ref, { renewalDate: appointment.appointmentDate });
      }

      // Firestore batches have a limit of 500 operations.
      if (count % 499 === 0) {
        await batch.commit();
        batch = writeBatch(db);
      }
    }

    // Commit any remaining operations in the last batch.
    if (count > 0) {
      await batch.commit();
    }

    console.log(`Successfully backfilled renewalDate for ${count} appointments for user: ${professionalId}`);

  } catch (error) {
    console.error(`Error during renewalDate backfill for user ${professionalId}:`, error);
  }
}
