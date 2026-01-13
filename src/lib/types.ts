
import { Timestamp } from "firebase/firestore";

export type Professional = {
    id: string;
    name: string;
    contactNumber: string;
    activationExpiresAt?: string; // ISO string
};

export type Client = {
    id: string;
    professionalId: string;
    name: string;
    phoneNumber: string;
    createdAt: string; 
};

export type Service = {
    id: string;
    professionalId: string;
    name: string;
    description: string;
    price: number;
    createdAt: string;
};

export type Appointment = {
    id: string;
    clientId: string;
    serviceId: string;
    professionalId: string;
    appointmentDate: string; // ISO string
    renewalDate: string; // ISO string
    notes?: string;
    validityPeriodDays: number;
    price?: number;
};

export type ActivationToken = {
    id: string;
    createdAt: string; // ISO string
    durationMonths: number;
    isUsed: boolean;
    usedAt?: string; // ISO string
    usedBy?: string; // UID of the professional
};

export type MaterialCategory = {
    id: string;
    professionalId: string;
    name: string;
};

export type Material = {
    id: string;
    professionalId: string;
    name: string;
    categoryId: string;
    stock: number;
    unitOfMeasure: string;
};

export type MaterialPurchase = {
    id: string;
    professionalId: string;
    materialId: string;
    quantity: number;
    totalPrice: number;
    purchaseDate: string; // ISO string
};

export type Summary = {
    id?: string;
    totalRevenue: number;
    totalClients: number;
    totalAppointments: number;
    totalExpenses?: number;
    monthlyRevenue: { [key: string]: number }; // e.g., {'2024-07': 1500.50}
    monthlyExpenses?: { [key: string]: number }; // e.g., {'2024-07': 500.25}
    newClientsPerMonth: { [key: string]: number }; // e.g., {'2024-07': 10}
    serviceCounts: { [key: string]: number }; // e.g., {'serviceId1': 25}
};


    
