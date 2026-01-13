
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, PlusCircle, Pencil, Trash } from 'lucide-react';
import { formatDate, cn, formatCurrency } from '@/lib/utils';
import type { Client, Service, Appointment } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { handleAddAppointmentSummary, handleDeleteAppointmentSummary, handleUpdateAppointmentSummary } from '@/firebase/summary-updates';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader } from '@/components/ui/loader';

const PAGE_SIZE = 15;

export default function AppointmentsPage() {
  const { firestore, user } = useFirebase();
  const isMobile = useIsMobile();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);
  const [addServiceDialogOpen, setAddServiceDialogOpen] = useState(false);
  const [addCalendarOpen, setAddCalendarOpen] = useState(false);
  const [editCalendarOpen, setEditCalendarOpen] = useState(false);


  const initialNewAppointmentState = {
    clientId: '',
    serviceId: '',
    appointmentDate: new Date(),
    validityPeriodDays: 30,
    price: 0,
  };

  const [newAppointment, setNewAppointment] = useState<{
    clientId: string;
    serviceId: string;
    appointmentDate: Date | undefined;
    validityPeriodDays: number;
    price: number;
  }>(initialNewAppointmentState);

  const [newClient, setNewClient] = useState({ name: '', phoneNumber: '' });
  const [newService, setNewService] = useState({ name: '', description: '', price: 0 });
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null);


  const appointmentsQuery = useMemoFirebase(() => {
    if (!user) return null;
    const appointmentsCollection = collection(firestore, 'professionals', user.uid, 'appointments');
    return query(appointmentsCollection, orderBy('appointmentDate', 'desc'));
  }, [firestore, user]);
  
  const clientsCollection = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'professionals', user.uid, 'clients');
  }, [firestore, user]);

  const servicesCollection = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'professionals', user.uid, 'services');
  }, [firestore, user]);

  const { data: appointments, isLoading: isLoadingAppointments, loadMore, hasMore, setData: setAppointments } = useCollection<Appointment>(appointmentsQuery, PAGE_SIZE);
  const { data: clients, isLoading: isLoadingClients, setData: setClients } = useCollection<Client>(clientsCollection);
  const { data: services, isLoading: isLoadingServices, setData: setServices } = useCollection<Service>(servicesCollection);

  const handleAddAppointment = async () => {
    if (!firestore || !user || !newAppointment.clientId || !newAppointment.serviceId || !newAppointment.appointmentDate) return;
    const appointmentsCollection = collection(firestore, 'professionals', user.uid, 'appointments');
    const selectedService = services?.find(s => s.id === newAppointment.serviceId);
    
    const validity = Number(newAppointment.validityPeriodDays) || 0;
    const renewalDate = addDays(newAppointment.appointmentDate, validity);

    const appointmentToAdd: Omit<Appointment, 'id'> = {
      clientId: newAppointment.clientId,
      serviceId: newAppointment.serviceId,
      professionalId: user!.uid,
      appointmentDate: newAppointment.appointmentDate.toISOString(),
      renewalDate: renewalDate.toISOString(),
      validityPeriodDays: validity,
      price: newAppointment.price || selectedService?.price || 0,
    };
    const docRef = await addDocumentNonBlocking(appointmentsCollection, appointmentToAdd);
    if(docRef) {
        const newAppointmentDoc = { ...appointmentToAdd, id: docRef.id };
        setAppointments(prev => [newAppointmentDoc, ...(prev || [])]);
        handleAddAppointmentSummary(firestore, user.uid, newAppointmentDoc);
    }
    setNewAppointment(initialNewAppointmentState);
    setAddDialogOpen(false);
  };
  
  const handleAddClient = async () => {
    if (!clientsCollection || !newClient.name || !user) return;
    const clientToAdd = {
      name: newClient.name,
      phoneNumber: newClient.phoneNumber,
      professionalId: user.uid,
      createdAt: new Date().toISOString(),
    };
    const docRef = await addDocumentNonBlocking(clientsCollection, clientToAdd);
    if (docRef) {
        const newClientDoc = { ...clientToAdd, id: docRef.id };
        setClients(prevClients => [newClientDoc, ...(prevClients || [])]);
        setNewAppointment(prev => ({...prev, clientId: docRef.id}));
    }
    setNewClient({ name: '', phoneNumber: '' });
    setAddClientDialogOpen(false);
  };

  const handleAddService = async () => {
    if (!servicesCollection || !newService.name || !user) return;
    const serviceToAdd = {
      ...newService,
      price: newService.price || 0,
      professionalId: user.uid,
      createdAt: new Date().toISOString(),
    };
    const docRef = await addDocumentNonBlocking(servicesCollection, serviceToAdd);
    if (docRef) {
        const newServiceDoc = { ...serviceToAdd, id: docRef.id };
        setServices(prevServices => [newServiceDoc, ...(prevServices || [])]);
        setNewAppointment(prev => ({
            ...prev,
            serviceId: docRef.id,
            price: newServiceDoc.price
        }));
    }
    setNewService({ name: '', description: '', price: 0 });
    setAddServiceDialogOpen(false);
  };

  const handleUpdateAppointment = async () => {
    if (!firestore || !user || !editingAppointment) return;
    
    const appointmentDocRef = doc(firestore, 'professionals', user.uid, 'appointments', editingAppointment.id);

    // Get the old state of the document for summary calculation
    const oldDocSnap = await getDoc(appointmentDocRef);
    if (!oldDocSnap.exists()) return;
    const oldAppointment = oldDocSnap.data() as Appointment;

    const selectedService = services?.find(s => s.id === editingAppointment.serviceId);
    
    const appointmentDate = new Date(editingAppointment.appointmentDate);
    const validity = Number(editingAppointment.validityPeriodDays) || 0;
    const renewalDate = addDays(appointmentDate, validity);

    const appointmentToUpdate = {
      ...editingAppointment,
      appointmentDate: appointmentDate.toISOString(),
      renewalDate: renewalDate.toISOString(),
      validityPeriodDays: validity,
      price: editingAppointment.price || selectedService?.price || 0,
    };
    
    const { id, ...appointmentData } = appointmentToUpdate;
    
    updateDocumentNonBlocking(appointmentDocRef, appointmentData);
    setAppointments(prev => prev ? prev.map(a => a.id === id ? appointmentToUpdate : a) : null);
    handleUpdateAppointmentSummary(firestore, user.uid, oldAppointment, appointmentToUpdate);

    setEditingAppointment(null);
    setEditDialogOpen(false);
};

 const handleDeleteAppointment = async () => {
    if (!firestore || !user || !deletingAppointment) return;
    const appointmentDocRef = doc(firestore, 'professionals', user.uid, 'appointments', deletingAppointment.id);
    
    // Get the document before deleting to update the summary
    const oldDocSnap = await getDoc(appointmentDocRef);
    if (oldDocSnap.exists()) {
        const oldAppointment = oldDocSnap.data() as Appointment;
        handleDeleteAppointmentSummary(firestore, user.uid, oldAppointment);
    }
    
    deleteDocumentNonBlocking(appointmentDocRef);
    setAppointments(prev => prev ? prev.filter(a => a.id !== deletingAppointment.id) : null);
    setDeletingAppointment(null);
  };


  const openEditDialog = (appointment: Appointment) => {
    setEditingAppointment({
        ...appointment,
        appointmentDate: new Date(appointment.appointmentDate)
    } as any);
    setEditDialogOpen(true);
  }
  
  const DatePicker = ({ date, onSelect, open, onOpenChange }: { date: Date | undefined, onSelect: (date?: Date) => void, open: boolean, onOpenChange: (open: boolean) => void }) => {
    const handleSelect = (selectedDate?: Date) => {
      onSelect(selectedDate);
      if (isMobile) {
        onOpenChange(false);
      }
    };
  
    const trigger = (
      <Button
        variant={"outline"}
        className={cn(
          "col-span-3 justify-start text-left font-normal",
          !date && "text-muted-foreground"
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? format(date, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
      </Button>
    );
  
    if (isMobile) {
      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogTrigger asChild>{trigger}</DialogTrigger>
          <DialogContent className="w-auto">
            <DialogHeader>
              <DialogTitle className="sr-only">Escolha uma data</DialogTitle>
            </DialogHeader>
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelect}
              initialFocus
            />
          </DialogContent>
        </Dialog>
      );
    }
  
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    );
  };
  
  const isLoading = isLoadingAppointments || isLoadingClients || isLoadingServices;

  return (
    <div className="flex-1 space-y-4 p-2 md:p-6 pt-6">
      <div className="flex items-center justify-between px-2">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Atendimentos</h1>
            <p className="text-muted-foreground">Gerencie os atendimentos realizados.</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Novo Atendimento</span>
              <span className="inline md:hidden">Novo</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
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
                <div className="col-span-3 flex items-center gap-2">
                    <Select
                    value={newAppointment.clientId}
                    onValueChange={(value) => setNewAppointment({ ...newAppointment, clientId: value })}
                    >
                    <SelectTrigger>
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
                    <Dialog open={addClientDialogOpen} onOpenChange={setAddClientDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                                <PlusCircle className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="new-client-name" className="text-right">
                                Nome
                                </Label>
                                <Input
                                id="new-client-name"
                                value={newClient.name}
                                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                                className="col-span-3"
                                placeholder="Nome completo"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="new-client-phone" className="text-right">
                                Telefone
                                </Label>
                                <Input
                                id="new-client-phone"
                                value={newClient.phoneNumber}
                                onChange={(e) => setNewClient({ ...newClient, phoneNumber: e.target.value })}
                                className="col-span-3"
                                placeholder="5511987654321"
                                />
                            </div>
                            </div>
                            <DialogFooter>
                            <Button onClick={handleAddClient}>Salvar Cliente</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="service" className="text-right">
                  Serviço
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                    <Select
                        value={newAppointment.serviceId}
                        onValueChange={(value) => {
                          const selectedService = services?.find(s => s.id === value);
                          setNewAppointment({ 
                            ...newAppointment,
                            serviceId: value,
                            price: selectedService?.price || 0
                          });
                        }}
                    >
                    <SelectTrigger>
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
                    <Dialog open={addServiceDialogOpen} onOpenChange={setAddServiceDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                                <PlusCircle className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Adicionar Novo Serviço</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="new-service-name" className="text-right">
                                    Nome
                                    </Label>
                                    <Input
                                    id="new-service-name"
                                    value={newService.name}
                                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                                    className="col-span-3"
                                    placeholder="Ex: Manicure"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="new-service-description" className="text-right">
                                    Descrição
                                    </Label>
                                    <Textarea
                                    id="new-service-description"
                                    value={newService.description}
                                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                                    className="col-span-3"
                                    placeholder="Ex: Cutilagem e esmaltação"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="new-service-price" className="text-right">
                                    Preço
                                    </Label>
                                     <CurrencyInput
                                        id="price"
                                        value={newService.price}
                                        onValueChange={(value) => setNewService({ ...newService, price: value || 0 })}
                                        className="col-span-3"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddService}>Salvar Serviço</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">
                      Preço
                  </Label>
                  <CurrencyInput
                      id="price"
                      value={newAppointment.price}
                      onValueChange={(value) => setNewAppointment({ ...newAppointment, price: value || 0 })}
                      className="col-span-3"
                  />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Data
                </Label>
                <DatePicker 
                    date={newAppointment.appointmentDate}
                    onSelect={(date) => setNewAppointment({ ...newAppointment, appointmentDate: date })}
                    open={addCalendarOpen}
                    onOpenChange={setAddCalendarOpen}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="validity" className="text-right">
                    Validade
                </Label>
                <div className="col-span-3 space-y-1">
                    <Input
                        id="validity"
                        type="number"
                        value={newAppointment.validityPeriodDays}
                        onChange={(e) => setNewAppointment({ ...newAppointment, validityPeriodDays: Number(e.target.value) })}
                        className="w-full"
                        placeholder="Ex: 30"
                    />
                    <p className="text-xs text-muted-foreground">
                        Tempo em dias para o sistema te lembrar de contatar a cliente para renovar.
                    </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddAppointment}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

       {/* Edit Appointment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Atendimento</DialogTitle>
              <DialogDescription>
                Atualize as informações do atendimento.
              </DialogDescription>
            </DialogHeader>
            {editingAppointment && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-client" className="text-right">
                  Cliente
                </Label>
                <Select
                  value={editingAppointment.clientId}
                  onValueChange={(value) => setEditingAppointment({ ...editingAppointment, clientId: value })}
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
                <Label htmlFor="edit-service" className="text-right">
                  Serviço
                </Label>
                <Select
                    value={editingAppointment.serviceId}
                    onValueChange={(value) => {
                      const selectedService = services?.find(s => s.id === value);
                      setEditingAppointment({
                         ...editingAppointment,
                         serviceId: value,
                         price: selectedService?.price || editingAppointment.price || 0 
                        })
                    }}
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
                  <Label htmlFor="edit-price" className="text-right">
                      Preço
                  </Label>
                  <CurrencyInput
                      id="edit-price"
                      value={editingAppointment.price || 0}
                      onValueChange={(value) => setEditingAppointment({ ...editingAppointment, price: value || 0 })}
                      className="col-span-3"
                  />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-date" className="text-right">
                  Data
                </Label>
                <DatePicker 
                    date={editingAppointment.appointmentDate ? new Date(editingAppointment.appointmentDate) : undefined}
                    onSelect={(date) => setEditingAppointment({ ...editingAppointment, appointmentDate: date as any })}
                    open={editCalendarOpen}
                    onOpenChange={setEditCalendarOpen}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="edit-validity" className="text-right">
                    Validade
                </Label>
                 <div className="col-span-3 space-y-1">
                    <Input
                        id="edit-validity"
                        type="number"
                        value={editingAppointment.validityPeriodDays}
                        onChange={(e) => setEditingAppointment({ ...editingAppointment, validityPeriodDays: Number(e.target.value) })}
                        className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                        Tempo em dias para o sistema te lembrar de contatar a cliente para renovar.
                    </p>
                </div>
              </div>
            </div>
            )}
            <DialogFooter>
              <Button type="submit" onClick={handleUpdateAppointment}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="mt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && !appointments && <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader /></TableCell></TableRow>}
                  {appointments?.map((appointment) => {
                    const client = clients?.find(c => c.id === appointment.clientId);
                    const service = services?.find(s => s.id === appointment.serviceId);
                    return (
                        <TableRow key={appointment.id}>
                            <TableCell className="font-medium whitespace-nowrap">{client?.name || '...'}</TableCell>
                            <TableCell className="whitespace-nowrap">{service?.name || '...'}</TableCell>
                            <TableCell>{formatDate(appointment.appointmentDate)}</TableCell>
                            <TableCell>{formatCurrency(appointment.price || 0)}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(appointment)}>
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Editar Atendimento</span>
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => setDeletingAppointment(appointment)}>
                                      <Trash className="h-4 w-4 text-destructive" />
                                      <span className="sr-only">Excluir Atendimento</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Essa ação não pode ser desfeita. Isso irá apagar permanentemente o atendimento.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel onClick={() => setDeletingAppointment(null)}>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={handleDeleteAppointment}>Continuar</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
             {hasMore && (
                <div className="mt-4 flex justify-center">
                    <Button onClick={loadMore} disabled={isLoadingAppointments}>
                        {isLoadingAppointments ? 'Carregando...' : 'Carregar Mais'}
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>
      </div>

       {/* Mobile Cards */}
       <div className="grid gap-4 md:hidden">
        {isLoading && !appointments && <Loader />}
        {appointments?.map((appointment) => {
            const client = clients?.find(c => c.id === appointment.clientId);
            const service = services?.find(s => s.id === appointment.serviceId);
            return (
              <Card key={appointment.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center text-lg">
                    <span>{client?.name || '...'}</span>
                     <div>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(appointment)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar Atendimento</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setDeletingAppointment(appointment)}>
                              <Trash className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Excluir Atendimento</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Essa ação não pode ser desfeita. Isso irá apagar permanentemente o atendimento.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setDeletingAppointment(null)}>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteAppointment}>Continuar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                     </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Serviço:</span>
                    <span className="font-medium">{service?.name || '...'}</span>
                  </div>
                   <div className="flex justify-between">
                    <span className="text-muted-foreground">Data:</span>
                    <span className="font-medium">{formatDate(appointment.appointmentDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preço:</span>
                    <span className="font-medium">{formatCurrency(appointment.price || 0)}</span>
                  </div>
                </CardContent>
              </Card>
            )
        })}
        {hasMore && (
            <div className="mt-4 flex justify-center">
                <Button onClick={loadMore} disabled={isLoadingAppointments}>
                    {isLoadingAppointments ? 'Carregando...' : 'Carregar Mais'}
                </Button>
            </div>
        )}
      </div>
    </div>
  );
}
