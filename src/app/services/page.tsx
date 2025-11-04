"use client";

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';
import type { Service } from '@/lib/types';
import { useFirebase, useCollection } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function ServicesPage() {
  const { firestore, user } = useFirebase();
  const [open, setOpen] = useState(false);
  const [newService, setNewService] = useState({ name: '', description: '', price: '' });

  const servicesCollection = useMemo(() => {
    if (!user) return null;
    return collection(firestore, 'professionals', user.uid, 'services');
  }, [firestore, user]);

  const { data: services, isLoading } = useCollection<Service>(servicesCollection);

  const handleAddService = () => {
    if (newService.name.trim() && servicesCollection) {
      addDocumentNonBlocking(servicesCollection, {
        name: newService.name,
        description: newService.description,
        price: Number(newService.price),
        professionalId: user!.uid,
      });
      setNewService({ name: '', description: '', price: '' });
      setOpen(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Serviços</h1>
            <p className="text-muted-foreground">Gerencie os procedimentos que você oferece.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Serviço</DialogTitle>
              <DialogDescription>
                Preencha as informações do novo serviço.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="service-name" className="text-right">
                  Nome
                </Label>
                <Input
                  id="service-name"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="col-span-3"
                  placeholder="Ex: Corte de Cabelo"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="service-description" className="text-right">
                  Descrição
                </Label>
                <Input
                  id="service-description"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  className="col-span-3"
                  placeholder="Descrição do serviço"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="service-price" className="text-right">
                  Preço
                </Label>
                <Input
                  id="service-price"
                  type="number"
                  value={newService.price}
                  onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                  className="col-span-3"
                  placeholder="R$ 0,00"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddService}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
