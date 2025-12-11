
"use client";

import { useState } from 'react';
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
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { MaterialPurchase, Material, MaterialCategory } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { CurrencyInput } from '@/components/ui/currency-input';
import { formatDate, formatCurrency } from '@/lib/utils';


export default function ExpensesPage() {
  const { firestore, user } = useFirebase();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const initialPurchaseState = {
    materialId: '',
    materialName: '',
    categoryId: '',
    categoryName: '',
    quantity: 1,
    totalPrice: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
  };
  
  const [newPurchase, setNewPurchase] = useState(initialPurchaseState);

  const purchasesCollection = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'professionals', user.uid, 'materialPurchases');
  }, [firestore, user]);

  const materialsCollection = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'professionals', user.uid, 'materials');
  }, [firestore, user]);

  const categoriesCollection = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'professionals', user.uid, 'materialCategories');
  }, [firestore, user]);


  const { data: purchases, isLoading: isLoadingPurchases } = useCollection<MaterialPurchase>(purchasesCollection);
  const { data: materials, isLoading: isLoadingMaterials } = useCollection<Material>(materialsCollection);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<MaterialCategory>(categoriesCollection);

 const handleAddPurchase = async () => {
    if (!user || !materialsCollection || !categoriesCollection || !purchasesCollection) return;

    let materialId = newPurchase.materialId;
    let categoryId = newPurchase.categoryId;

    // Create new category if it doesn't exist
    if (!categoryId && newPurchase.categoryName) {
      const existingCategory = categories?.find(c => c.name.toLowerCase() === newPurchase.categoryName.toLowerCase());
      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        const categoryDoc = await addDoc(categoriesCollection, {
          name: newPurchase.categoryName,
          professionalId: user.uid,
        });
        categoryId = categoryDoc.id;
      }
    }
    
    if (!categoryId) {
        // Here you might want to show a toast or error message
        console.error("Category is required");
        return;
    }

    // Create new material if it doesn't exist
    if (!materialId && newPurchase.materialName) {
       const existingMaterial = materials?.find(m => m.name.toLowerCase() === newPurchase.materialName.toLowerCase());
       if (existingMaterial) {
         materialId = existingMaterial.id;
       } else {
          const materialDoc = await addDoc(materialsCollection, {
            name: newPurchase.materialName,
            categoryId: categoryId,
            professionalId: user.uid,
            stock: 0, // Initial stock
          });
          materialId = materialDoc.id;
       }
    }
    
    if (!materialId) {
        console.error("Material is required");
        return;
    }


    // Add the purchase record
    const purchaseToAdd = {
      materialId: materialId,
      quantity: Number(newPurchase.quantity),
      totalPrice: newPurchase.totalPrice,
      purchaseDate: new Date(newPurchase.purchaseDate).toISOString(),
      professionalId: user.uid,
    };

    addDocumentNonBlocking(purchasesCollection, purchaseToAdd);

    // TODO: Update material stock

    setNewPurchase(initialPurchaseState);
    setAddDialogOpen(false);
  };

  const materialOptions = useMemo(() => materials?.map(m => ({ value: m.id, label: m.name })) || [], [materials]);
  const categoryOptions = useMemo(() => categories?.map(c => ({ value: c.id, label: c.name })) || [], [categories]);

  const getMaterialName = (id: string) => materials?.find(m => m.id === id)?.name || '...';

  return (
    <div className="flex-1 space-y-4 p-2 md:p-6 pt-6">
      <div className="flex items-center justify-between px-2">
         <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Controle de Gastos</h1>
            <p className="text-muted-foreground">Registre suas compras de materiais para manter o controle do estoque e dos custos.</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Nova Compra</span>
              <span className="inline md:hidden">Nova</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Compra de Material</DialogTitle>
              <DialogDescription>
                Preencha os detalhes da sua nova compra.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Categoria
                </Label>
                <Combobox
                    options={categoryOptions}
                    value={newPurchase.categoryId}
                    onSelect={(value, label) => setNewPurchase({...newPurchase, categoryId: value, categoryName: label})}
                    onCreate={(inputValue) => setNewPurchase({...newPurchase, categoryId: '', categoryName: inputValue})}
                    placeholder="Selecione ou crie"
                    createText="Criar nova categoria"
                    searchPlaceholder="Buscar categoria..."
                    notFoundText="Nenhuma categoria encontrada."
                    className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="material" className="text-right">
                  Material
                </Label>
                <Combobox
                    options={materialOptions}
                    value={newPurchase.materialId}
                    onSelect={(value, label) => setNewPurchase({...newPurchase, materialId: value, materialName: label})}
                    onCreate={(inputValue) => setNewPurchase({...newPurchase, materialId: '', materialName: inputValue})}
                    placeholder="Selecione ou crie"
                    createText="Criar novo material"
                    searchPlaceholder="Buscar material..."
                    notFoundText="Nenhum material encontrado."
                    className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">
                  Quantidade
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  value={newPurchase.quantity}
                  onChange={(e) => setNewPurchase({ ...newPurchase, quantity: Number(e.target.value) })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="totalPrice" className="text-right">
                  Preço Total
                </Label>
                 <CurrencyInput
                    id="totalPrice"
                    value={newPurchase.totalPrice}
                    onValueChange={(value) => setNewPurchase({ ...newPurchase, totalPrice: value || 0 })}
                    className="col-span-3"
                />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="purchaseDate" className="text-right">
                  Data
                </Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={newPurchase.purchaseDate}
                  onChange={(e) => setNewPurchase({ ...newPurchase, purchaseDate: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddPurchase}>Salvar Compra</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

       <div className="hidden md:block">
        <Card>
            <CardContent className="mt-6">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Material</TableHead>
                                <TableHead>Quantidade</TableHead>
                                <TableHead>Preço Total</TableHead>
                                <TableHead>Data da Compra</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingPurchases && <TableRow><TableCell colSpan={4} className="text-center">Carregando...</TableCell></TableRow>}
                            {purchases?.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell>{getMaterialName(p.materialId)}</TableCell>
                                    <TableCell>{p.quantity}</TableCell>
                                    <TableCell>{formatCurrency(p.totalPrice)}</TableCell>
                                    <TableCell>{formatDate(p.purchaseDate)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      </div>
      
    </div>
  );
}

