
'use client';

import {
  collection,
  doc,
  getDocs,
  setDoc,
  Firestore,
} from 'firebase/firestore';
import { format } from 'date-fns';
import type { Appointment, Client, Summary, MaterialPurchase } from '@/lib/types';

/**
 * Calculates historical summary data for a user by fetching all their appointments and clients.
 * This should only be run once for existing users when the summary feature is first introduced.
 * @param db The Firestore instance.
 * @param professionalId The UID of the professional.
 */
export async function backfillSummaryForUser(db: Firestore, professionalId: string): Promise<void> {
  console.log(`Starting summary backfill for user: ${professionalId}`);
  const summaryRef = doc(db, 'professionals', professionalId, 'summary', 'main');
  const appointmentsRef = collection(db, 'professionals', professionalId, 'appointments');
  const clientsRef = collection(db, 'professionals', professionalId, 'clients');
  const purchasesRef = collection(db, 'professionals', professionalId, 'materialPurchases');

  try {
    // Fetch all historical data in parallel
    const [appointmentSnaps, clientSnaps, purchaseSnaps] = await Promise.all([
      getDocs(appointmentsRef),
      getDocs(clientsRef),
      getDocs(purchasesRef)
    ]);

    const appointments = appointmentSnaps.docs.map(d => d.data() as Appointment);
    const clients = clientSnaps.docs.map(d => d.data() as Client);
    const purchases = purchaseSnaps.docs.map(d => d.data() as MaterialPurchase);

    // Initialize summary object
    const summary: Summary = {
      totalRevenue: 0,
      totalClients: clients.length,
      totalAppointments: appointments.length,
      totalExpenses: 0,
      monthlyRevenue: {},
      monthlyExpenses: {},
      newClientsPerMonth: {},
      serviceCounts: {},
    };

    // Process appointments
    for (const app of appointments) {
      summary.totalRevenue += app.price || 0;
      
      const monthKey = format(new Date(app.appointmentDate), 'yyyy-MM');
      summary.monthlyRevenue[monthKey] = (summary.monthlyRevenue[monthKey] || 0) + (app.price || 0);

      summary.serviceCounts[app.serviceId] = (summary.serviceCounts[app.serviceId] || 0) + 1;
    }

    // Process clients
    for (const client of clients) {
        if(client.createdAt) {
            const monthKey = format(new Date(client.createdAt), 'yyyy-MM');
            summary.newClientsPerMonth[monthKey] = (summary.newClientsPerMonth[monthKey] || 0) + 1;
        }
    }

    // Process purchases
    for (const purchase of purchases) {
        summary.totalExpenses! += purchase.totalPrice || 0;
        const monthKey = format(new Date(purchase.purchaseDate), 'yyyy-MM');
        summary.monthlyExpenses![monthKey] = (summary.monthlyExpenses![monthKey] || 0) + (purchase.totalPrice || 0);
    }

    // Write the calculated summary to a new document
    await setDoc(summaryRef, summary);
    console.log(`Successfully completed summary backfill for user: ${professionalId}`);

  } catch (error) {
    console.error(`Error during summary backfill for user ${professionalId}:`, error);
    // We don't re-throw here to avoid crashing the app on a background task.
    // The error is logged for debugging.
  }
}
