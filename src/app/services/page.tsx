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
import { Card, CardContent } from '@/components/ui/card';
import type { Service } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function ServicesPage() {
  const { firestore, user } = useFirebase();

  const servicesCollection = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'professionals', user.uid, 'services');
  }, [firestore, user]);

  const { data: services, isLoading } = useCollection<Service>(servicesCollection);

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Serviços</h1>
            <p className="text-muted-foreground">Consulte os procedimentos que você oferece.</p>
        </div>
      </div>
      <Card>
        <CardContent className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Serviço</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Preço</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={3}>Carregando...</TableCell></TableRow>}
              {services?.sort((a, b) => a.name.localeCompare(b.name)).map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>{service.description}</TableCell>
                  <TableCell>R$ {service.price.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
