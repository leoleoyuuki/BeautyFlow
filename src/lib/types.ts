export type Client = {
  id: string;
  name: string;
  phone: string;
  joinDate: string; // ISO string for date
};

export type Service = {
  id: string;
  name: string;
};

export type Procedure = {
  id: string;
  clientId: string;
  serviceId: string;
  date: string; // ISO string for date
  price: number;
  notes?: string;
  validityMonths: number;
};
