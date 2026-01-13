
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
import { PlusCircle, Pencil, Phone, Trash } from 'lucide-react';
import type { Client } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Loader } from '@/components/ui/loader';
import { handleAddClientSummary, handleDeleteClientSummary } from '@/firebase/summary-updates';

const PAGE_SIZE = 15;

export default function ClientsPage() {
  const { firestore, user } = useFirebase();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phoneNumber: '' });
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);


  const clientsQuery = useMemoFirebase(() => {
    if (!user) return null;
    const clientsCollection = collection(firestore, 'professionals', user.uid, 'clients');
    return query(clientsCollection, orderBy('createdAt', 'desc'));
  }, [firestore, user]);

  const { data: clients, isLoading, loadMore, hasMore, setData: setClients } = useCollection<Client>(clientsQuery, PAGE_SIZE);

  const handleAddClient = async () => {
    if (!firestore || !user || !newClient.name) return;
    const clientsCollection = collection(firestore, 'professionals', user.uid, 'clients');
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
        handleAddClientSummary(firestore, user.uid, newClientDoc);
    }
    setNewClient({ name: '', phoneNumber: '' });
    setAddDialogOpen(false);
  };
  
  const handleUpdateClient = () => {
    if (!firestore || !user || !editingClient) return;
    const clientsCollection = collection(firestore, 'professionals', user.uid, 'clients');
    const clientDocRef = doc(clientsCollection, editingClient.id);
    const { id, ...clientData } = editingClient;
    updateDocumentNonBlocking(clientDocRef, clientData);
    setEditingClient(null);
    setEditDialogOpen(false);
  }

  const handleDeleteClient = async () => {
    if (!firestore || !user || !deletingClient) return;
    
    // We need the full client object to correctly decrement the summary
    const clientRef = doc(firestore, 'professionals', user.uid, 'clients', deletingClient.id);
    const clientSnap = await getDoc(clientRef);

    if (clientSnap.exists()) {
        const clientToDelete = clientSnap.data() as Client;
        deleteDocumentNonBlocking(clientRef);
        handleDeleteClientSummary(firestore, user.uid, clientToDelete);
    }
    
    setDeletingClient(null);
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setEditDialogOpen(true);
  }

  return (
    <div className="flex-1 space-y-4 p-2 md:p-6 pt-6">
      <div className="flex items-center justify-between px-2">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Clientes</h1>
            <p className="text-muted-foreground">Cadastre suas clientes com nome e telefone para gerenciar os atendimentos.</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Novo Cliente</span>
              <span className="inline md:hidden">Novo</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Cliente</DialogTitle>
              <DialogDescription>
                Preencha as informações do novo cliente.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nome
                </Label>
                <Input
                  id="name"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  className="col-span-3"
                  placeholder="Nome completo"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Telefone
                </Label>
                <Input
                  id="phone"
                  value={newClient.phoneNumber}
                  onChange={(e) => setNewClient({ ...newClient, phoneNumber: e.target.value })}
                  className="col-span-3"
                  placeholder="5511987654321"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddClient}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

       {/* Edit Client Dialog */}
       <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
              <DialogDescription>
                Atualize as informações do cliente.
              </DialogDescription>
            </DialogHeader>
            {editingClient && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="edit-name"
                    value={editingClient.name}
                    onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-phone" className="text-right">
                    Telefone
                  </Label>
                  <Input
                    id="edit-phone"
                    value={editingClient.phoneNumber}
                    onChange={(e) => setEditingClient({ ...editingClient, phoneNumber: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="submit" onClick={handleUpdateClient}>Salvar Alterações</Button>
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
                        <TableHead>Nome</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoading && !clients && <TableRow><TableCell colSpan={3} className="h-24 text-center"><Loader /></TableCell></TableRow>}
                    {clients?.map((client) => (
                        <TableRow key={client.id}>
                        <TableCell className="font-medium whitespace-nowrap">{client.name}</TableCell>
                        <TableCell>{client.phoneNumber}</TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(client)}>
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Editar Cliente</span>
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => setDeletingClient(client)}>
                                    <Trash className="h-4 w-4 text-destructive" />
                                    <span className="sr-only">Excluir Cliente</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Essa ação não pode ser desfeita. Isso irá apagar permanentemente o cliente e todos os seus atendimentos.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setDeletingClient(null)}>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteClient}>Continuar</AlertDialogAction>
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
        {isLoading && !clients && <Loader />}
        {clients?.map((client) => (
            <Card key={client.id}>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center text-lg">
                        <span>{client.name}</span>
                        <div>
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(client)}>
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Editar Cliente</span>
                            </Button>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => setDeletingClient(client)}>
                                    <Trash className="h-4 w-4 text-destructive" />
                                    <span className="sr-only">Excluir Cliente</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Essa ação não pode ser desfeita. Isso irá apagar permanentemente o cliente e todos os seus atendimentos.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setDeletingClient(null)}>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteClient}>Continuar</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="mr-2 h-4 w-4" />
                        <span>{client.phoneNumber}</span>
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
