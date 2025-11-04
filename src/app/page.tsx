"use client";

import { useState, useMemo } from 'react';
import { Eye, EyeOff, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  RevenueChart,
  NewClientsChart,
  PopularServicesChart,
} from '@/components/dashboard/charts';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { UpcomingRenewals } from '@/components/dashboard/upcoming-renewals';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Appointment, Client, Service } from '@/lib/types';


export default function DashboardPage() {
  const [isRevenueVisible, setIsRevenueVisible] = useState(true);
  const { firestore, user } = useFirebase();

  const appointmentsCollection = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'professionals', user.uid, 'appointments');
  }, [firestore, user]);

  const clientsCollection = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'professionals', user.uid, 'clients');
  }, [firestore, user]);

  const servicesCollection = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'professionals', user.uid, 'services');
  }, [firestore, user]);

  const { data: appointments } = useCollection<Appointment>(appointmentsCollection);
  const { data: clients } = useCollection<Client>(clientsCollection);
  const { data: services } = useCollection<Service>(servicesCollection);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Dashboard
        </h1>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsRevenueVisible(!isRevenueVisible)} variant="outline" size="icon">
            {isRevenueVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="sr-only">{isRevenueVisible ? 'Hide revenue' : 'Show revenue'}</span>
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <StatsCards isRevenueVisible={isRevenueVisible} appointments={appointments || []} clients={clients || []} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4">
            <RevenueChart isRevenueVisible={isRevenueVisible} appointments={appointments || []} />
          </div>
          <div className="col-span-4 lg:col-span-3">
             <NewClientsChart clients={clients || []} />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PopularServicesChart appointments={appointments || []} services={services || []} />
            <UpcomingRenewals appointments={appointments || []} clients={clients || []} services={services || []} />
        </div>
      </div>
    </div>
  );
}
