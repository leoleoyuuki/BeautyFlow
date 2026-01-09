
'use client';

import {
  collection,
  query,
  getDocs,
  writeBatch,
  Firestore,
  limit,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import { addMonths } from 'date-fns';
import type { Appointment } from '@/lib/types';

/**
 * Finds all appointments without a 'renewalDate' and updates them in batches.
 * This is intended as a one-time migration for existing data.
 * It fetches all documents and processes them client-side because Firestore
 * does not efficiently support querying for non-existent fields.
 * @param db The Firestore instance.
 * @param professionalId The UID of the professional.
 */
export async function backfillRenewalDates(db: Firestore, professionalId: string): Promise<void> {
  console.log(`Starting renewalDate backfill for user: ${professionalId}`);
  const appointmentsRef = collection(db, 'professionals', professionalId, 'appointments');
  let lastDoc: DocumentSnapshot | null = null;
  let hasMore = true;
  let totalProcessed = 0;
  
  while (hasMore) {
    let q = query(appointmentsRef, limit(200)); // Process in chunks of 200
    if (lastDoc) {
      q = query(appointmentsRef, startAfter(lastDoc), limit(200));
    }

    try {
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        hasMore = false;
        continue;
      }

      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      
      let batch = writeBatch(db);
      let batchCount = 0;

      for (const doc of snapshot.docs) {
        const appointment = doc.data() as Appointment;

        // Check if renewalDate already exists to avoid redundant writes.
        if (!appointment.renewalDate) {
          const appointmentDate = new Date(appointment.appointmentDate);
          const validity = appointment.validityPeriodMonths || 0;
          
          if (validity > 0) {
            const renewalDate = addMonths(appointmentDate, validity);
            batch.update(doc.ref, { renewalDate: renewalDate.toISOString() });
          } else {
            // If validity is 0, set renewalDate to the original date to prevent re-processing.
            batch.update(doc.ref, { renewalDate: appointment.appointmentDate });
          }
          batchCount++;
          totalProcessed++;
        }

        // Commit batch when it's full.
        if (batchCount === 499) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      }

      // Commit any remaining operations in the last batch for this chunk.
      if (batchCount > 0) {
        await batch.commit();
      }

      if (snapshot.docs.length < 200) {
        hasMore = false;
      }

    } catch (error) {
      console.error(`Error during renewalDate backfill for user ${professionalId}:`, error);
      hasMore = false; // Stop on error to prevent infinite loops
    }
  }

  if (totalProcessed > 0) {
    console.log(`Successfully checked and backfilled renewalDate for ${totalProcessed} appointments for user: ${professionalId}`);
  } else {
    console.log(`No appointments needed backfilling for user: ${professionalId}`);
  }
}
