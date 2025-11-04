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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { procedures as allProcedures, clients as allClients, services as allServices } from '@/lib/data';
import { formatDate } from '@/lib/utils';
import { addMonths, isAfter, differenceInMonths, differenceInDays } from 'date-fns';
import { MessageSquare } from 'lucide-react';
import type { Client, Service, Procedure } from '@/lib/types';

export default function RenewalsPage() {
  const renewals = useMemo(() => {
    const now = new Date();
    return allProcedures
      .map(p => {
        const renewalDate = addMonths(new Date(p.date), p.validityMonths);
        const daysLeft = differenceInDays(renewalDate, now);
        return { ...p, renewalDate, daysLeft };
      })
      .filter(p => isAfter(p.renewalDate, now))
      .sort((a, b) => a.renewalDate.getTime() - b.renewalDate.getTime());
  }, []);

  const handleWhatsAppRedirect = (client: Client, service: Service, procedure: Procedure) => {
    const monthsAgo = differenceInMonths(new Date(), new Date(procedure.date));
    const message = `Olá ${client.name.split(' ')[0]}! Já faz ${monthsAgo} meses que você fez seu procedimento de ${service.name}. Que tal renovar sua beleza com 5% de desconto? 😊`;
    const whatsappUrl = `https://wa.me/${client.phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getBadgeVariant = (daysLeft: number) => {
    if (daysLeft <= 30) return 'destructive';
    if (daysLeft <= 60) return 'secondary';
    return 'outline';
  };

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
       <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Renovações</h1>
            <p className="text-muted-foreground">Acompanhe todos os procedimentos com vencimento futuro.</p>
        </div>
      <Card>
        <CardContent className="mt-6">
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
              {renewals.map((renewal) => {
                const client = allClients.find(c => c.id === renewal.clientId);
                const service = allServices.find(s => s.id === renewal.serviceId);
                if (!client || !service) return null;

                return (
                  <TableRow key={renewal.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{service.name}</TableCell>
                    <TableCell>{formatDate(renewal.date)}</TableCell>
                    <TableCell>{formatDate(renewal.renewalDate.toISOString())}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(renewal.daysLeft)}>
                        {renewal.daysLeft > 1 ? `Vence em ${renewal.daysLeft} dias` : `Vence em ${renewal.daysLeft} dia`}
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
        </CardContent>
      </Card>
    </div>
  );
}
