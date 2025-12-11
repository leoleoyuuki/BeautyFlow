
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MinusCircle, PlusCircle, Pencil, Save, X } from 'lucide-react';
import type { Material, MaterialCategory } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';

export default function StockPage() {
  const { firestore, user } = useFirebase();
  const [editingStock, setEditingStock] = useState<{ [key: string]: number | undefined }>({});
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  const materialsCollection = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'professionals', user.uid, 'materials');
  }, [firestore, user]);

  const categoriesCollection = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'professionals', user.uid, 'materialCategories');
  }, [firestore, user]);

  const { data: materials, isLoading: isLoadingMaterials } = useCollection<Material>(materialsCollection);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<MaterialCategory>(categoriesCollection);
  
  const getCategoryName = (id: string) => categories?.find(c => c.id === id)?.name || '...';
  
  const handleEditClick = (material: Material) => {
    setEditingRowId(material.id);
    setEditingStock({ [material.id]: material.stock });
  };
  
  const handleCancelClick = () => {
    setEditingRowId(null);
    setEditingStock({});
  };

  const handleSaveStock = async (materialId: string) => {
    if (!firestore || !user) return;
    const newStock = editingStock[materialId];
    if (newStock === undefined || isNaN(newStock)) return;

    const materialRef = doc(firestore, 'professionals', user.uid, 'materials', materialId);
    await updateDoc(materialRef, { stock: newStock });

    setEditingRowId(null);
    setEditingStock({});
  };
  
  const handleStockChange = (materialId: string, value: string) => {
    const numberValue = value === '' ? undefined : parseInt(value, 10);
     if(numberValue === undefined || (!isNaN(numberValue) && numberValue >= 0)) {
       setEditingStock({ [materialId]: numberValue });
    }
  };
  
  const adjustStock = (materialId: string, amount: number) => {
     setEditingStock(prev => {
        const currentStock = prev[materialId] ?? materials?.find(m => m.id === materialId)?.stock ?? 0;
        const newStock = Math.max(0, currentStock + amount);
        return { [materialId]: newStock };
     });
  };

  const sortedMaterials = useMemo(() => {
    return materials?.sort((a,b) => a.name.localeCompare(b.name)) || [];
  }, [materials]);

  const getStockBadgeVariant = (stock: number) => {
    if (stock <= 5) return 'destructive';
    if (stock <= 15) return 'secondary';
    return 'default';
  }

  const isLoading = isLoadingMaterials || isLoadingCategories;

  return (
    <div className="flex-1 space-y-4 p-2 md:p-6 pt-6">
      <div className="px-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Controle de Estoque</h1>
        <p className="text-muted-foreground">Visualize e gerencie a quantidade de cada material disponível.</p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card>
            <CardContent className="mt-6">
                <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Estoque Atual</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoading && <TableRow><TableCell colSpan={4} className="text-center">Carregando...</TableCell></TableRow>}
                    {sortedMaterials.map((material) => (
                        <TableRow key={material.id}>
                            <TableCell className="font-medium whitespace-nowrap">{material.name}</TableCell>
                            <TableCell>{getCategoryName(material.categoryId)}</TableCell>
                            <TableCell>
                                {editingRowId === material.id ? (
                                     <div className="flex items-center gap-2 max-w-[150px]">
                                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => adjustStock(material.id, -1)}><MinusCircle className="h-4 w-4" /></Button>
                                        <Input 
                                            type="number" 
                                            value={editingStock[material.id] ?? ''} 
                                            onChange={(e) => handleStockChange(material.id, e.target.value)}
                                            className="h-8 w-16 text-center"
                                        />
                                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => adjustStock(material.id, 1)}><PlusCircle className="h-4 w-4"/></Button>
                                     </div>
                                ) : (
                                    <Badge variant={getStockBadgeVariant(material.stock)}>{material.stock} unidades</Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                {editingRowId === material.id ? (
                                    <>
                                        <Button variant="ghost" size="icon" onClick={() => handleSaveStock(material.id)}>
                                            <Save className="h-4 w-4 text-primary" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={handleCancelClick}>
                                            <X className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </>
                                ) : (
                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(material)}>
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Editar Estoque</span>
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </div>
            </CardContent>
        </Card>
      </div>

       {/* Mobile Cards */}
       <div className="grid gap-4 md:hidden">
        {isLoading && <p className="text-center">Carregando...</p>}
        {sortedMaterials.map((material) => (
            <Card key={material.id}>
                <CardHeader>
                    <CardTitle className="flex justify-between items-start text-lg">
                        <span>{material.name}</span>
                        {editingRowId === material.id ? (
                            <div>
                                <Button variant="ghost" size="icon" onClick={() => handleSaveStock(material.id)}>
                                    <Save className="h-4 w-4 text-primary" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={handleCancelClick}>
                                    <X className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ) : (
                             <Button variant="ghost" size="icon" onClick={() => handleEditClick(material)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground !mt-1">{getCategoryName(material.categoryId)}</p>
                </CardHeader>
                <CardContent>
                   {editingRowId === material.id ? (
                        <div className="flex items-center gap-2">
                           <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => adjustStock(material.id, -1)}><MinusCircle className="h-4 w-4" /></Button>
                            <Input 
                                type="number" 
                                value={editingStock[material.id] ?? ''} 
                                onChange={(e) => handleStockChange(material.id, e.target.value)}
                                className="h-8 flex-1 text-center"
                            />
                             <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => adjustStock(material.id, 1)}><PlusCircle className="h-4 w-4"/></Button>
                        </div>
                   ) : (
                        <div className="flex items-center">
                            <span className="text-sm text-muted-foreground mr-2">Estoque:</span>
                            <Badge variant={getStockBadgeVariant(material.stock)}>{material.stock} unidades</Badge>
                        </div>
                   )}
                </CardContent>
            </Card>
        ))}
       </div>
    </div>
  );
}
