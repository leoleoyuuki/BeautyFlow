
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { addMonths, isAfter, differenceInMonths, format } from 'date-fns';
import type { Appointment, Client, Service } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface UpcomingRenewalsProps {
  appointments: Appointment[];
  clients: Client[];
  services: Service[];
}

export function UpcomingRenewals({ appointments, clients, services }: UpcomingRenewalsProps) {
  const upcoming = useMemo(() => {
    if (!appointments) return [];
    const now = new Date();
    const twoMonthsFromNow = addMonths(now, 2);
    return appointments
      .map(p => {
        const renewalDate = addMonths(new Date(p.appointmentDate), p.validityPeriodMonths);
        return { ...p, renewalDate };
      })
      .filter(p => isAfter(p.renewalDate, now) && isAfter(twoMonthsFromNow, p.renewalDate))
      .sort((a, b) => a.renewalDate.getTime() - b.renewalDate.getTime())
      .slice(0, 5);
  }, [appointments]);

  const handleWhatsAppRedirect = (client: Client, service: Service, procedure: Appointment) => {
    const monthsAgo = differenceInMonths(new Date(), new Date(procedure.appointmentDate));
    const message = `Olá ${client.name.split(' ')[0]}! Já faz ${monthsAgo} meses que você fez seu procedimento de ${service.name}. Que tal renovar sua beleza com 5% de desconto? 😊`;
    const whatsappUrl = `https://wa.me/${client.phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Renovações Próximas</CardTitle>
        <CardDescription>Clientes com procedimentos perto de vencer.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcoming.length > 0 ? (
          upcoming.map((p) => {
            const client = clients.find(c => c.id === p.clientId);
            const service = services.find(s => s.id === p.serviceId);
            if (!client || !service) return null;

            return (
              <div key={p.id} className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-4">
                    <Avatar>
                        <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-medium leading-none">{client.name}</p>
                        <p className="text-sm text-muted-foreground">{service.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-right">
                        <p className="text-sm font-medium">{format((p as any).renewalDate, 'dd/MM/yy')}</p>
                        <p className="text-xs text-muted-foreground">Vencimento</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleWhatsAppRedirect(client, service, p)}>
                        <MessageSquare className="h-4 w-4 text-green-500" />
                    </Button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma renovação próxima.</p>
        )}
        {upcoming.length > 0 && (
            <Button variant="outline" className="w-full" asChild>
                <Link href="/renewals">Ver todas as renovações</Link>
            </Button>
        )}
      </CardContent>
    </Card>
  );
}
