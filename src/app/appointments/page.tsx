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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, PlusCircle } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import type { Client, Service, Appointment } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AppointmentsPage() {
  const { firestore, user } = useFirebase();
  const [open, setOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState<{
    clientId: string;
    serviceId: string;
    appointmentDate: Date | undefined;
    validityPeriodMonths: string;
  }>({
    clientId: '',
    serviceId: '',
    appointmentDate: new Date(),
    validityPeriodMonths: '1',
  });

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

  const { data: appointments, isLoading: isLoadingAppointments } = useCollection<Appointment>(appointmentsCollection);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsCollection);
  const { data: services, isLoading: isLoadingServices } = useCollection<Service>(servicesCollection);

  const handleAddAppointment = () => {
    if (!appointmentsCollection || !newAppointment.clientId || !newAppointment.serviceId || !newAppointment.appointmentDate) return;

    const selectedService = services?.find(s => s.id === newAppointment.serviceId);

    const appointmentToAdd = {
      clientId: newAppointment.clientId,
      serviceId: newAppointment.serviceId,
      professionalId: user!.uid,
      appointmentDate: newAppointment.appointmentDate.toISOString(),
      validityPeriodMonths: Number(newAppointment.validityPeriodMonths),
      price: selectedService?.price || 0,
    };
    addDocumentNonBlocking(appointmentsCollection, appointmentToAdd);
    setNewAppointment({ clientId: '', serviceId: '', appointmentDate: new Date(), validityPeriodMonths: '1' });
    setOpen(false);
  };
  
  const sortedAppointments = useMemo(() => {
    return appointments?.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()) || [];
  }, [appointments]);

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Atendimentos</h1>
            <p className="text-muted-foreground">Gerencie os atendimentos realizados.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Atendimento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Atendimento</DialogTitle>
              <DialogDescription>
                Selecione o cliente, o serviço e a data.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client" className="text-right">
                  Cliente
                </Label>
                <Select
                  value={newAppointment.clientId}
                  onValueChange={(value) => setNewAppointment({ ...newAppointment, clientId: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="service" className="text-right">
                  Serviço
                </Label>
                <Select
                    value={newAppointment.serviceId}
                    onValueChange={(value) => setNewAppointment({ ...newAppointment, serviceId: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services?.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Data
                </Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "col-span-3 justify-start text-left font-normal",
                            !newAppointment.appointmentDate && "text-muted-foreground"
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newAppointment.appointmentDate ? format(newAppointment.appointmentDate, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                        mode="single"
                        selected={newAppointment.appointmentDate}
                        onSelect={(date) => setNewAppointment({ ...newAppointment, appointmentDate: date })}
                        initialFocus
                        />
                    </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="validity" className="text-right">
                    Validade (meses)
                </Label>
                <Input
                    id="validity"
                    type="number"
                    value={newAppointment.validityPeriodMonths}
                    onChange={(e) => setNewAppointment({ ...newAppointment, validityPeriodMonths: e.target.value })}
                    className="col-span-3"
                    placeholder="Ex: 12"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddAppointment}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Preço</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(isLoadingAppointments || isLoadingClients || isLoadingServices) && <TableRow><TableCell colSpan={4}>Carregando...</TableCell></TableRow>}
              {sortedAppointments.map((appointment) => {
                const client = clients?.find(c => c.id === appointment.clientId);
                const service = services?.find(s => s.id === appointment.serviceId);
                return (
                    <TableRow key={appointment.id}>
                        <TableCell className="font-medium">{client?.name || '...'}</TableCell>
                        <TableCell>{service?.name || '...'}</TableCell>
                        <TableCell>{formatDate(appointment.appointmentDate)}</TableCell>
                        <TableCell>R$ {appointment.price?.toFixed(2) || '0,00'}</TableCell>
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
