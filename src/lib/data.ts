import { Client, Service, Procedure } from './types';
import { subMonths, formatISO } from 'date-fns';

export const services: Service[] = [
  { id: '1', name: 'Botox' },
  { id: '2', name: 'Lash Lifting' },
  { id: '3', name: 'Design de Sobrancelha' },
  { id: '4', name: 'Manicure' },
  { id: '5', name: 'Limpeza de Pele' },
];

export const clients: Client[] = [
  { id: '1', name: 'Ana Silva', phone: '5511987654321', joinDate: formatISO(subMonths(new Date(), 8)) },
  { id: '2', name: 'Beatriz Costa', phone: '5521912345678', joinDate: formatISO(subMonths(new Date(), 5)) },
  { id: '3', name: 'Carla Dias', phone: '5531988887777', joinDate: formatISO(subMonths(new Date(), 2)) },
  { id: '4', name: 'Daniela Souza', phone: '5541999998888', joinDate: formatISO(subMonths(new Date(), 1)) },
  { id: '5', name: 'Eduarda Lima', phone: '5551977776666', joinDate: formatISO(subMonths(new Date(), 11)) },
  { id: '6', name: 'Fernanda Alves', phone: '5561966665555', joinDate: formatISO(new Date()) },
];

export const procedures: Procedure[] = [
  // Ana Silva
  { id: 'p1', clientId: '1', serviceId: '1', date: formatISO(subMonths(new Date(), 5)), price: 800, validityMonths: 6 },
  { id: 'p2', clientId: '1', serviceId: '3', date: formatISO(subMonths(new Date(), 1)), price: 50, validityMonths: 1 },
  
  // Beatriz Costa
  { id: 'p3', clientId: '2', serviceId: '2', date: formatISO(subMonths(new Date(), 2)), price: 150, validityMonths: 3 },
  { id: 'p4', clientId: '2', serviceId: '4', date: formatISO(subMonths(new Date(), 0.5)), price: 40, validityMonths: 1 },

  // Carla Dias
  { id: 'p5', clientId: '3', serviceId: '5', date: formatISO(subMonths(new Date(), 1.5)), price: 200, validityMonths: 2 },

  // Daniela Souza
  { id: 'p6', clientId: '4', serviceId: '3', date: formatISO(subMonths(new Date(), 0)), price: 50, validityMonths: 1 },

  // Eduarda Lima
  { id: 'p7', clientId: '5', serviceId: '1', date: formatISO(subMonths(new Date(), 10)), price: 750, validityMonths: 6 },
  { id: 'p8', clientId: '5', serviceId: '1', date: formatISO(subMonths(new Date(), 4)), price: 850, validityMonths: 6 },
  { id: 'p9', clientId: '5', serviceId: '5', date: formatISO(subMonths(new Date(), 1)), price: 220, validityMonths: 2 },

  // Older data for charts
  { id: 'p10', clientId: '1', serviceId: '1', date: formatISO(subMonths(new Date(), 11)), price: 700, validityMonths: 6 },
  { id: 'p11', clientId: '2', serviceId: '3', date: formatISO(subMonths(new Date(), 7)), price: 45, validityMonths: 1 },
  { id: 'p12', clientId: '5', serviceId: '4', date: formatISO(subMonths(new Date(), 6)), price: 35, validityMonths: 1 },
  { id: 'p13', clientId: '1', serviceId: '5', date: formatISO(subMonths(new Date(), 8)), price: 180, validityMonths: 2 },
];
