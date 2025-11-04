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
import { PlusCircle, Pencil } from 'lucide-react';
import type { Client } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function ClientsPage() {
  const { firestore, user } = useFirebase();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phoneNumber: '' });
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const clientsCollection = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'professionals', user.uid, 'clients');
  }, [firestore, user]);

  const { data: clients, isLoading } = useCollection<Client>(clientsCollection);

  const handleAddClient = () => {
    if (!clientsCollection) return;
    const clientToAdd = {
      name: newClient.name,
      phoneNumber: newClient.phoneNumber,
      professionalId: user!.uid,
      createdAt: new Date().toISOString(),
    };
    addDocumentNonBlocking(clientsCollection, clientToAdd);
    setNewClient({ name: '', phoneNumber: '' });
    setAddDialogOpen(false);
  };
  
  const handleUpdateClient = () => {
    if (!clientsCollection || !editingClient) return;
    const clientDocRef = doc(clientsCollection, editingClient.id);
    const { id, ...clientData } = editingClient;
    updateDocumentNonBlocking(clientDocRef, clientData);
    setEditingClient(null);
    setEditDialogOpen(false);
  }

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setEditDialogOpen(true);
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Clientes</h1>
            <p className="text-muted-foreground">Gerencie sua lista de clientes.</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
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
        <DialogContent className="sm:max-w-[425px]">
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
                  {isLoading && <TableRow><TableCell colSpan={3} className="text-center">Carregando...</TableCell></TableRow>}
                  {clients?.sort((a, b) => a.name.localeCompare(b.name)).map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium whitespace-nowrap">{client.name}</TableCell>
                      <TableCell>{client.phoneNumber}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(client)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar Cliente</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
