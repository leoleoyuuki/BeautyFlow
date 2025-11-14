
"use client";

import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { addMonths, isAfter, differenceInDays } from 'date-fns';
import { MessageSquare } from 'lucide-react';
import type { Client, Service, Appointment } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function RenewalsPage() {
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

  const { data: allAppointments, isLoading: isLoadingAppointments } = useCollection<Appointment>(appointmentsCollection);
  const { data: allClients, isLoading: isLoadingClients } = useCollection<Client>(clientsCollection);
  const { data: allServices, isLoading: isLoadingServices } = useCollection<Service>(servicesCollection);

  const renewals = useMemo(() => {
    if (!allAppointments) return [];
    const now = new Date();
    return allAppointments
      .map(p => {
        const renewalDate = addMonths(new Date(p.appointmentDate), p.validityPeriodMonths);
        const daysLeft = differenceInDays(renewalDate, now);
        return { ...p, renewalDate, daysLeft };
      })
      .filter(p => isAfter(p.renewalDate, now) && p.validityPeriodMonths > 0)
      .sort((a, b) => a.renewalDate.getTime() - b.renewalDate.getTime());
  }, [allAppointments]);

  const handleWhatsAppRedirect = (client: Client, service: Service, procedure: Appointment & { renewalDate: Date }) => {
    const message = `Olá ${client.name.split(' ')[0]}! Está na hora de renovar seu procedimento de ${service.name}. Que tal agendarmos um horário? 💖✨`;
    const whatsappUrl = `https://wa.me/${client.phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getBadgeVariant = (daysLeft: number) => {
    if (daysLeft <= 30) return 'destructive';
    if (daysLeft <= 60) return 'secondary';
    return 'outline';
  };
  
  const getDaysLeftText = (daysLeft: number) => {
    if (daysLeft <= 0) return 'Vencido';
    if (daysLeft === 1) return 'Vence em 1 dia';
    return `Vence em ${daysLeft} dias`;
  }

  const isLoading = isLoadingAppointments || isLoadingClients || isLoadingServices;

  return (
    <div className="flex-1 space-y-4 p-2 md:p-6 pt-6">
       <div className="px-2">
            <h1 className="text-3xl font-bold tracking-tight font-headline">Renovações</h1>
            <p className="text-muted-foreground">Acompanhe os vencimentos e envie lembretes para suas clientes agendarem a renovação. 💖✨</p>
        </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="mt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Procedimento</TableHead>
                    <TableHead>Data do Atendimento</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && <TableRow><TableCell colSpan={6} className="text-center">Carregando...</TableCell></TableRow>}
                  {renewals.map((renewal) => {
                    const client = allClients?.find(c => c.id === renewal.clientId);
                    const service = allServices?.find(s => s.id === renewal.serviceId);
                    if (!client || !service) return null;

                    return (
                      <TableRow key={renewal.id}>
                        <TableCell className="font-medium whitespace-nowrap">{client.name}</TableCell>
                        <TableCell className="whitespace-nowrap">{service.name}</TableCell>
                        <TableCell>{formatDate(renewal.appointmentDate)}</TableCell>
                        <TableCell>{formatDate(renewal.renewalDate.toISOString())}</TableCell>
                        <TableCell>
                          <Badge variant={getBadgeVariant(renewal.daysLeft)}>
                            {getDaysLeftText(renewal.daysLeft)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleWhatsAppRedirect(client, service, renewal)}>
                            <MessageSquare className="h-4 w-4 text-green-500" />
                            <span className="sr-only">Enviar WhatsApp</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

       {/* Mobile Cards */}
       <div className="grid gap-4 md:hidden">
        {isLoading && <p className="text-center">Carregando...</p>}
        {renewals.map((renewal) => {
            const client = allClients?.find(c => c.id === renewal.clientId);
            const service = allServices?.find(s => s.id === renewal.serviceId);
            if (!client || !service) return null;

            return (
              <Card key={renewal.id}>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center text-lg">
                        <span>{client.name}</span>
                        <Button variant="ghost" size="icon" onClick={() => handleWhatsAppRedirect(client, service, renewal)}>
                            <MessageSquare className="h-5 w-5 text-green-500" />
                            <span className="sr-only">Enviar WhatsApp</span>
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Procedimento:</span>
                        <span className="font-medium">{service.name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Última vez:</span>
                        <span className="font-medium">{formatDate(renewal.appointmentDate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Vencimento:</span>
                        <div className="flex items-center gap-2">
                             <span className="font-medium">{formatDate(renewal.renewalDate.toISOString())}</span>
                             <Badge variant={getBadgeVariant(renewal.daysLeft)} className="text-xs">
                                {getDaysLeftText(renewal.daysLeft)}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
              </Card>
            )
        })}
      </div>

    </div>
  );
}
