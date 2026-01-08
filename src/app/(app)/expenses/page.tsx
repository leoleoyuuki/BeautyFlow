
"use client";

import { useState, useMemo } from 'react';
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
import { collection, addDoc, doc, runTransaction, DocumentReference, query, orderBy, where, writeBatch, serverTimestamp, getDoc } from 'firebase/firestore';
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
import { useToast } from '@/hooks/use-toast';
import { Loader } from '@/components/ui/loader';
import { ExpensesChart } from '@/components/dashboard/charts';

const PAGE_SIZE = 15;

export default function ExpensesPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const initialPurchaseState = {
    materialId: '',
    materialName: '',
    unitOfMeasure: '',
    categoryId: '',
    categoryName: '',
    quantity: 1,
    totalPrice: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
  };
  
  const [newPurchase, setNewPurchase] = useState(initialPurchaseState);
  
  const materialsCollection = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'professionals', user.uid, 'materials');
  }, [firestore, user]);

  const categoriesCollection = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'professionals', user.uid, 'materialCategories');
  }, [firestore, user]);
  
  const { data: materials, isLoading: isLoadingMaterials, setData: setMaterials } = useCollection<Material>(materialsCollection);
  const { data: categories, isLoading: isLoadingCategories, setData: setCategories } = useCollection<MaterialCategory>(categoriesCollection);

  const allPurchasesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
        collection(firestore, 'professionals', user.uid, 'materialPurchases'),
        orderBy('purchaseDate', 'desc')
    );
  }, [firestore, user]);

  const { data: allPurchases, isLoading: isLoadingPurchases, loadMore, hasMore, setData: setAllPurchases } = useCollection<MaterialPurchase>(allPurchasesQuery, PAGE_SIZE);

  const contasCategoryId = useMemo(() => categories?.find(c => c.name.toLowerCase() === 'contas')?.id, [categories]);

  const { materialPurchases, accountExpenses } = useMemo(() => {
    if (!allPurchases) {
      return { materialPurchases: [], accountExpenses: [] };
    }
    const materialIdToCategory = new Map(materials?.map(m => [m.id, m.categoryId]) || []);

    const accountExpensesList: MaterialPurchase[] = [];
    const materialPurchasesList: MaterialPurchase[] = [];

    allPurchases.forEach(purchase => {
      const materialDoc = materials?.find(m => m.id === purchase.materialId);
      if (materialDoc?.categoryId === contasCategoryId) {
        accountExpensesList.push(purchase);
      } else {
        materialPurchasesList.push(purchase);
      }
    });

    return { materialPurchases: materialPurchasesList, accountExpenses: accountExpensesList };
  }, [allPurchases, materials, contasCategoryId]);

  
 const handleAddPurchase = async () => {
    if (!user || !materialsCollection || !categoriesCollection || !firestore) return;
    let localPurchaseState = { ...newPurchase };
    
    try {
        const batch = writeBatch(firestore);
        let newCategoryId = localPurchaseState.categoryId;
        let newMaterialId = localPurchaseState.materialId;
        
        const trimmedCategoryName = localPurchaseState.categoryName.trim();
        if (!newCategoryId && trimmedCategoryName) {
            const existingCategory = categories?.find(c => c.name.toLowerCase() === trimmedCategoryName.toLowerCase());
            if (existingCategory) {
                newCategoryId = existingCategory.id;
            } else {
                const categoryRef = doc(categoriesCollection);
                newCategoryId = categoryRef.id;
                batch.set(categoryRef, { name: trimmedCategoryName, professionalId: user.uid });
                setCategories(prev => [{id: newCategoryId, name: trimmedCategoryName, professionalId: user.uid }, ...(prev || [])]);
            }
        }
        
        if (!newCategoryId) {
            toast({ variant: "destructive", title: "Erro", description: "A categoria é obrigatória." });
            return;
        }

        const trimmedMaterialName = localPurchaseState.materialName.trim();
        if (!newMaterialId && trimmedMaterialName) {
            const existingMaterial = materials?.find(m => m.name.toLowerCase() === trimmedMaterialName.toLowerCase());
            if (existingMaterial) {
                newMaterialId = existingMaterial.id;
            } else {
                 if(!localPurchaseState.unitOfMeasure && trimmedCategoryName.toLowerCase() !== 'contas') {
                    toast({ variant: "destructive", title: "Erro", description: "A unidade de medida é obrigatória para novos materiais." });
                    return;
                }
                const materialRef = doc(materialsCollection);
                newMaterialId = materialRef.id;
                const newMaterialData = { 
                    name: trimmedMaterialName, 
                    categoryId: newCategoryId, 
                    professionalId: user.uid, 
                    stock: Number(localPurchaseState.quantity),
                    unitOfMeasure: localPurchaseState.unitOfMeasure,
                };
                batch.set(materialRef, newMaterialData);
                setMaterials(prev => [{id: newMaterialId, ...newMaterialData}, ...(prev || [])]);
            }
        }
        
        if (!newMaterialId) {
            toast({ variant: "destructive", title: "Erro", description: "O item é obrigatório." });
            return;
        }

        // Only update stock if it's an existing material and category is not "Contas"
        const categoryData = await (async () => {
            const found = categories?.find(c => c.id === newCategoryId);
            if(found) return found;
            const docSnap = await getDoc(doc(categoriesCollection, newCategoryId));
            return docSnap.data() as MaterialCategory;
        })();

        if (newMaterialId && categoryData?.name.toLowerCase() !== 'contas' && !materials?.some(m => m.id === newMaterialId)) {
            const materialRef = doc(materialsCollection, newMaterialId);
            batch.update(materialRef, { stock: increment(Number(localPurchaseState.quantity)) });
        }
        
        const purchaseRef = doc(collection(firestore, 'professionals', user.uid, 'materialPurchases'));
        const purchaseDate = new Date(localPurchaseState.purchaseDate + 'T00:00:00'); // Ensure it's treated as local date
        const purchaseToAdd = {
            professionalId: user.uid,
            materialId: newMaterialId,
            quantity: Number(localPurchaseState.quantity),
            totalPrice: localPurchaseState.totalPrice,
            purchaseDate: purchaseDate.toISOString(),
        };

        batch.set(purchaseRef, purchaseToAdd);

        await batch.commit();

        setAllPurchases(prev => [{id: purchaseRef.id, ...purchaseToAdd}, ...(prev || [])]);

        toast({ title: "Sucesso!", description: "Despesa registrada com sucesso." });
        setNewPurchase(initialPurchaseState);
        setAddDialogOpen(false);
    } catch (error) {
        console.error("Erro ao adicionar compra:", error);
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
        toast({ variant: "destructive", title: "Falha ao registrar", description: errorMessage });
    }
  };

  const materialOptions = useMemo(() => materials?.map(m => ({ value: m.id, label: m.name })) || [], [materials]);
  const categoryOptions = useMemo(() => categories?.map(c => ({ value: c.id, label: c.name })) || [], [categories]);

  const getMaterialName = (id: string) => materials?.find(m => m.id === id)?.name || '...';
  
  const isCreatingNewMaterial = !!(newPurchase.materialName && !newPurchase.materialId && !materials?.some(m => m.name.toLowerCase() === newPurchase.materialName.toLowerCase()));
  const showUnitOfMeasure = isCreatingNewMaterial && newPurchase.categoryName.toLowerCase() !== 'contas';
  
  const isLoading = isLoadingPurchases || isLoadingMaterials || isLoadingCategories;

  return (
    <div className="flex-1 space-y-4 p-2 md:p-6 pt-6">
      <div className="flex items-center justify-between px-2">
         <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Controle de Gastos</h1>
            <p className="text-muted-foreground">Registre suas compras e despesas para manter o controle dos custos.</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Nova Despesa</span>
              <span className="inline md:hidden">Nova</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nova Despesa</DialogTitle>
              <DialogDescription>
                Preencha os detalhes da sua nova compra ou conta. O estoque será atualizado automaticamente, exceto para a categoria "Contas".
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
                    displayValue={newPurchase.categoryName}
                    onSelect={(value, label) => setNewPurchase({...newPurchase, categoryId: value, categoryName: label, materialId: '', materialName: ''})}
                    onCreate={(inputValue) => setNewPurchase({...newPurchase, categoryId: '', categoryName: inputValue, materialId: '', materialName: ''})}
                    placeholder="Selecione ou crie"
                    createText="Criar nova categoria"
                    searchPlaceholder="Buscar categoria..."
                    notFoundText="Nenhuma categoria encontrada."
                    className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="material" className="text-right">
                  Item
                </Label>
                <Combobox
                    options={materialOptions.filter(m => {
                        const material = materials?.find(mat => mat.id === m.value);
                        return !newPurchase.categoryId || material?.categoryId === newPurchase.categoryId
                    })}
                    value={newPurchase.materialId}
                    displayValue={newPurchase.materialName}
                    onSelect={(value, label) => setNewPurchase({...newPurchase, materialId: value, materialName: label})}
                    onCreate={(inputValue) => setNewPurchase({...newPurchase, materialId: '', materialName: inputValue})}
                    placeholder="Selecione ou crie"
                    createText="Criar novo item"
                    searchPlaceholder="Buscar item..."
                    notFoundText="Nenhum item encontrado."
                    className="col-span-3"
                    disabled={!newPurchase.categoryId && !newPurchase.categoryName}
                />
              </div>

              {showUnitOfMeasure && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="unitOfMeasure" className="text-right">
                    Unidade
                    </Label>
                    <Input
                    id="unitOfMeasure"
                    value={newPurchase.unitOfMeasure}
                    onChange={(e) => setNewPurchase({ ...newPurchase, unitOfMeasure: e.target.value })}
                    className="col-span-3"
                    placeholder="Ex: un, ml, g"
                    />
                </div>
              )}

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
              <Button onClick={handleAddPurchase}>Salvar Despesa</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="px-2 md:px-0">
          <ExpensesChart purchases={allPurchases} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Card de Despesas (Contas) */}
        <Card>
            <CardHeader>
                <CardTitle>Despesas (Contas)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="hidden md:block overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Valor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && accountExpenses?.length === 0 && <TableRow><TableCell colSpan={3} className="h-24 text-center"><Loader /></TableCell></TableRow>}
                            {accountExpenses?.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell>{formatDate(p.purchaseDate)}</TableCell>
                                    <TableCell>{getMaterialName(p.materialId)}</TableCell>
                                    <TableCell>{formatCurrency(p.totalPrice)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                 <div className="grid gap-4 md:hidden">
                    {isLoading && accountExpenses?.length === 0 && <Loader />}
                    {accountExpenses?.map((purchase) => (
                        <Card key={purchase.id} className="border-l-4 border-destructive">
                            <CardHeader className="p-4">
                                <CardTitle className="text-base flex justify-between items-center">
                                    <span>{getMaterialName(purchase.materialId)}</span>
                                    <span className="font-medium">{formatCurrency(purchase.totalPrice)}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Data:</span>
                                    <span>{formatDate(purchase.purchaseDate)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
        
        {/* Card de Compras de Materiais */}
        <Card>
            <CardHeader>
                <CardTitle>Histórico de Compras de Materiais</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="hidden md:block overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Material</TableHead>
                                <TableHead>Qnt.</TableHead>
                                <TableHead>Valor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && materialPurchases?.length === 0 && <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader /></TableCell></TableRow>}
                            {materialPurchases?.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell>{formatDate(p.purchaseDate)}</TableCell>
                                    <TableCell>{getMaterialName(p.materialId)}</TableCell>
                                    <TableCell>{p.quantity}</TableCell>
                                    <TableCell>{formatCurrency(p.totalPrice)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="grid gap-4 md:hidden">
                    {isLoading && materialPurchases?.length === 0 && <Loader />}
                    {materialPurchases?.map((purchase) => (
                        <Card key={purchase.id}>
                            <CardHeader className="p-4">
                                <CardTitle className="text-base flex justify-between items-center">
                                    <span>{getMaterialName(purchase.materialId)}</span>
                                    <span className="font-medium">{formatCurrency(purchase.totalPrice)}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Quantidade:</span>
                                    <span>{purchase.quantity}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Data:</span>
                                    <span>{formatDate(purchase.purchaseDate)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                  {hasMore && (
                    <div className="mt-4 flex justify-center">
                        <Button onClick={loadMore} disabled={isLoadingPurchases}>
                            {isLoadingPurchases ? 'Carregando...' : 'Carregar Mais'}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

    