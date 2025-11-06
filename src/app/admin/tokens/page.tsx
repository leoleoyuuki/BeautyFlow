"use client";

import { useState } from 'react';
import { useFirebase, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Copy, Check } from 'lucide-react';
import type { ActivationToken } from '@/lib/types';
import { formatDate } from '@/lib/utils';

const ADMIN_UID = 'fE4wQQun2zgDr39cwH0AKoOADkT2';

export default function TokenGeneratorPage() {
  const { user, isUserLoading, firestore } = useFirebase();
  const router = useRouter();
  const [durationMonths, setDurationMonths] = useState(12);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const tokensCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'activationTokens');
  }, [firestore]);

  const { data: tokens, isLoading: isLoadingTokens } = useCollection<ActivationToken>(tokensCollection);

  const handleGenerateToken = async () => {
    if (!tokensCollection) return;

    const tokenData = {
      createdAt: new Date().toISOString(),
      durationMonths: Number(durationMonths),
      isUsed: false,
    };
    
    const docRef = await addDocumentNonBlocking(tokensCollection, tokenData);
    if(docRef) {
        setGeneratedToken(docRef.id);
        setCopied(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  if (isUserLoading) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  if (!user || user.uid !== ADMIN_UID) {
    if (typeof window !== 'undefined') {
        router.push('/');
    }
    return <div className="flex h-screen items-center justify-center">Acesso negado.</div>;
  }

  const sortedTokens = tokens?.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Gerador de Tokens</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Token de Ativação</CardTitle>
          <CardDescription>Defina a validade em meses e gere um novo token.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="duration">Duração (meses)</Label>
            <Input
              id="duration"
              type="number"
              value={durationMonths}
              onChange={(e) => setDurationMonths(Number(e.target.value))}
              placeholder="Ex: 12"
            />
          </div>
           {generatedToken && (
            <div className="space-y-2">
                <Label>Token Gerado</Label>
                <div className="flex items-center gap-2">
                    <Input type="text" readOnly value={generatedToken} className="font-mono"/>
                    <Button onClick={() => copyToClipboard(generatedToken)} variant="outline" size="icon">
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerateToken}>Gerar Token</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Tokens Gerados</CardTitle>
            <CardDescription>Lista de todos os tokens de ativação já criados.</CardDescription>
        </CardHeader>
        <CardContent>
             <div className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Token ID</TableHead>
                            <TableHead>Criação</TableHead>
                            <TableHead>Duração</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Usado Em</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingTokens && <TableRow><TableCell colSpan={5} className="text-center">Carregando...</TableCell></TableRow>}
                        {sortedTokens?.map(token => (
                            <TableRow key={token.id}>
                                <TableCell className="font-mono">{token.id}</TableCell>
                                <TableCell>{formatDate(token.createdAt)}</TableCell>
                                <TableCell>{token.durationMonths} meses</TableCell>
                                <TableCell>
                                    <Badge variant={token.isUsed ? "secondary" : "default"}>
                                        {token.isUsed ? "Usado" : "Disponível"}
                                    </Badge>
                                </TableCell>
                                <TableCell>{token.usedAt ? formatDate(token.usedAt) : '-'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             </div>
             <div className="grid gap-4 md:hidden">
                {isLoadingTokens && <p className="text-center">Carregando...</p>}
                {sortedTokens?.map(token => (
                    <Card key={token.id}>
                         <CardHeader>
                            <CardTitle className="text-base font-mono flex items-center justify-between">
                                <span>{token.id.substring(0,8)}...</span>
                                <Badge variant={token.isUsed ? "secondary" : "default"}>
                                    {token.isUsed ? "Usado" : "Disponível"}
                                </Badge>
                            </CardTitle>
                         </CardHeader>
                         <CardContent className="text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Criação:</span>
                                <span>{formatDate(token.createdAt)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Duração:</span>
                                <span>{token.durationMonths} meses</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Usado em:</span>
                                <span>{token.usedAt ? formatDate(token.usedAt) : '-'}</span>
                            </div>
                         </CardContent>
                    </Card>
                ))}
             </div>
        </CardContent>
      </Card>
    </div>
  );
}
