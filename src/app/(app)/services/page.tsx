
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
import { PlusCircle, Pencil, Trash } from 'lucide-react';
import type { Service } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { formatCurrency } from '@/lib/utils';
import { Loader } from '@/components/ui/loader';

const PAGE_SIZE = 15;

export default function ServicesPage() {
  const { firestore, user } = useFirebase();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newService, setNewService] = useState({ name: '', description: '', price: 0 });
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);

  const servicesQuery = useMemoFirebase(() => {
    if (!user) return null;
    const servicesCollection = collection(firestore, 'professionals', user.uid, 'services');
    return query(servicesCollection, orderBy('createdAt', 'desc'));
  }, [firestore, user]);

  const { data: services, isLoading, loadMore, hasMore } = useCollection<Service>(servicesQuery, PAGE_SIZE);

  const handleAddService = () => {
    if (!firestore || !user || !newService.name) return;
    const servicesCollection = collection(firestore, 'professionals', user.uid, 'services');
    const serviceToAdd = {
      ...newService,
      price: newService.price || 0,
      professionalId: user!.uid,
      createdAt: new Date().toISOString(),
    };
    addDocumentNonBlocking(servicesCollection, serviceToAdd);
    setNewService({ name: '', description: '', price: 0 });
    setAddDialogOpen(false);
  };
  
  const handleUpdateService = () => {
    if (!firestore || !user || !editingService) return;
    const servicesCollection = collection(firestore, 'professionals', user.uid, 'services');
    const serviceDocRef = doc(servicesCollection, editingService.id);
    const { id, ...serviceData } = editingService;
    const updatedData = {
        ...serviceData,
        price: serviceData.price || 0
    };
    updateDocumentNonBlocking(serviceDocRef, updatedData);
    setEditingService(null);
    setEditDialogOpen(false);
  };

  const handleDeleteService = () => {
    if (!firestore || !user || !deletingService) return;
    const servicesCollection = collection(firestore, 'professionals', user.uid, 'services');
    const serviceDocRef = doc(servicesCollection, deletingService.id);
    deleteDocumentNonBlocking(serviceDocRef);
    setDeletingService(null);
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setEditDialogOpen(true);
  };

  return (
    <div className="flex-1 space-y-4 p-2 md:p-6 pt-6">
      <div className="flex items-center justify-between px-2">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Serviços</h1>
            <p className="text-muted-foreground">Adicione todos os seus procedimentos aqui para facilitar o agendamento.</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Novo Serviço</span>
              <span className="inline md:hidden">Novo</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Serviço</DialogTitle>
              <DialogDescription>
                Preencha as informações do novo serviço.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nome
                </Label>
                <Input
                  id="name"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="col-span-3"
                  placeholder="Ex: Manicure"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  className="col-span-3"
                  placeholder="Ex: Cutilagem e esmaltação"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
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
              <Button type="submit" onClick={handleAddService}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

       {/* Edit Service Dialog */}
       <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Serviço</DialogTitle>
              <DialogDescription>
                Atualize as informações do serviço.
              </DialogDescription>
            </DialogHeader>
            {editingService && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="edit-name"
                    value={editingService.name}
                    onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-description" className="text-right">
                    Descrição
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={editingService.description}
                    onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-price" className="text-right">
                    Preço
                  </Label>
                  <CurrencyInput
                    id="edit-price"
                    value={editingService.price}
                    onValueChange={(value) => setEditingService({ ...editingService, price: value || 0 })}
                    className="col-span-3"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="submit" onClick={handleUpdateService}>Salvar Alterações</Button>
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
                    <TableHead>Nome do Serviço</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && !services && <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader /></TableCell></TableRow>}
                    {services?.map((service) => (
                    <TableRow key={service.id}>
                        <TableCell className="font-medium whitespace-nowrap">{service.name}</TableCell>
                        <TableCell className="whitespace-nowrap">{service.description}</TableCell>
                        <TableCell>{formatCurrency(service.price)}</TableCell>
                        <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(service)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar Serviço</span>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => setDeletingService(service)}>
                                <Trash className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Excluir Serviço</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Essa ação não pode ser desfeita. Isso irá apagar permanentemente o serviço.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeletingService(null)}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteService}>Continuar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
             {hasMore && (
                <div className="mt-4 flex justify-center">
                    <Button onClick={loadMore} disabled={isLoading}>
                        {isLoading ? 'Carregando...' : 'Carregar Mais'}
                    </Button>
                </div>
            )}
            </CardContent>
        </Card>
      </div>

       {/* Mobile Cards */}
       <div className="grid gap-4 md:hidden">
        {isLoading && !services && <Loader />}
        {services?.map((service) => (
          <Card key={service.id}>
            <CardHeader>
                <CardTitle className="flex justify-between items-center text-lg">
                    <span>{service.name}</span>
                    <div>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(service)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar Serviço</span>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => setDeletingService(service)}>
                                <Trash className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Excluir Serviço</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Essa ação não pode ser desfeita. Isso irá apagar permanentemente o serviço.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeletingService(null)}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteService}>Continuar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">{service.description}</p>
                <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-bold text-primary">{formatCurrency(service.price)}</span>
                </div>
            </CardContent>
          </Card>
        ))}
         {hasMore && (
            <div className="mt-4 flex justify-center">
                <Button onClick={loadMore} disabled={isLoading}>
                    {isLoading ? 'Carregando...' : 'Carregar Mais'}
                </Button>
            </div>
        )}
      </div>
    </div>
  );
}

    