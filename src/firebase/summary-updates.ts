
'use client';

import { doc, runTransaction, Firestore, increment } from 'firebase/firestore';
import { format } from 'date-fns';
import type { Appointment, Client } from './types';

// Helper function to get the month key (e.g., '2024-07')
const getMonthKey = (date: Date) => format(date, 'yyyy-MM');

// --- Functions for Client Updates ---

export async function handleAddClientSummary(db: Firestore, professionalId: string, client: Client) {
    const summaryRef = doc(db, 'professionals', professionalId, 'summary', 'main');
    const monthKey = getMonthKey(new Date(client.createdAt));

    try {
        await runTransaction(db, async (transaction) => {
            transaction.update(summaryRef, {
                totalClients: increment(1),
                [`newClientsPerMonth.${monthKey}`]: increment(1)
            });
        });
    } catch (error) {
        console.error("Error updating summary for new client:", error);
    }
}

export async function handleDeleteClientSummary(db: Firestore, professionalId: string, client: Client) {
    const summaryRef = doc(db, 'professionals', professionalId, 'summary', 'main');
    const monthKey = getMonthKey(new Date(client.createdAt));

    try {
        await runTransaction(db, async (transaction) => {
            const summaryDoc = await transaction.get(summaryRef);
            if (!summaryDoc.exists()) return;

            const newClientsInMonth = summaryDoc.data().newClientsPerMonth?.[monthKey] || 0;

            transaction.update(summaryRef, {
                totalClients: increment(-1),
                [`newClientsPerMonth.${monthKey}`]: newClientsInMonth > 0 ? increment(-1) : 0
            });
        });
    } catch (error) {
        console.error("Error updating summary for deleted client:", error);
    }
}


// --- Functions for Appointment Updates ---

export async function handleAddAppointmentSummary(db: Firestore, professionalId: string, appointment: Appointment) {
    const summaryRef = doc(db, 'professionals', professionalId, 'summary', 'main');
    const monthKey = getMonthKey(new Date(appointment.appointmentDate));

    try {
        await runTransaction(db, async (transaction) => {
            transaction.update(summaryRef, {
                totalAppointments: increment(1),
                totalRevenue: increment(appointment.price || 0),
                [`monthlyRevenue.${monthKey}`]: increment(appointment.price || 0),
                [`serviceCounts.${appointment.serviceId}`]: increment(1),
            });
        });
    } catch (error) {
        console.error("Error updating summary for new appointment:", error);
    }
}

export async function handleDeleteAppointmentSummary(db: Firestore, professionalId: string, appointment: Appointment) {
    const summaryRef = doc(db, 'professionals', professionalId, 'summary', 'main');
    const monthKey = getMonthKey(new Date(appointment.appointmentDate));

    try {
        await runTransaction(db, async (transaction) => {
             const summaryDoc = await transaction.get(summaryRef);
            if (!summaryDoc.exists()) return;

            const serviceCount = summaryDoc.data().serviceCounts?.[appointment.serviceId] || 0;

            transaction.update(summaryRef, {
                totalAppointments: increment(-1),
                totalRevenue: increment(-(appointment.price || 0)),
                [`monthlyRevenue.${monthKey}`]: increment(-(appointment.price || 0)),
                [`serviceCounts.${appointment.serviceId}`]: serviceCount > 0 ? increment(-1) : 0,
            });
        });
    } catch (error) {
        console.error("Error updating summary for deleted appointment:", error);
    }
}

export async function handleUpdateAppointmentSummary(db: Firestore, professionalId: string, oldAppointment: Appointment, newAppointment: Appointment) {
    const summaryRef = doc(db, 'professionals', professionalId, 'summary', 'main');
    
    // First, reverse the old appointment's contribution
    await handleDeleteAppointmentSummary(db, professionalId, oldAppointment);
    
    // Then, add the new appointment's contribution
    await handleAddAppointmentSummary(db, professionalId, newAppointment);
}
