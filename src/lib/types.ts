import { Timestamp } from "firebase/firestore";

export type Professional = {
    id: string;
    name: string;
    contactNumber: string;
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
};

export type Appointment = {
    id: string;
    clientId: string;
    serviceId: string;
    professionalId: string;
    appointmentDate: string; // ISO string
    notes?: string;
    validityPeriodMonths: number;
    price?: number;
};
