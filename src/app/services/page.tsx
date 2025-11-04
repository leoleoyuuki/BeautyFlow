"use client";

import { useState } from 'react';
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
import { services as initialServices } from '@/lib/data';
import { PlusCircle } from 'lucide-react';
import type { Service } from '@/lib/types';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [open, setOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');

  const handleAddService = () => {
    if (newServiceName.trim()) {
      const newService: Service = {
        id: (services.length + 2).toString(),
        name: newServiceName.trim(),
      };
      setServices([...services, newService]);
      setNewServiceName('');
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
                Digite o nome do novo serviço ou procedimento.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="service-name" className="text-right">
                  Nome
                </Label>
                <Input
                  id="service-name"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="col-span-3"
                  placeholder="Ex: Corte de Cabelo"
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.sort((a, b) => a.name.localeCompare(b.name)).map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
