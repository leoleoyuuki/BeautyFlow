
"use client";

import { useState } from 'react';
import { useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { addMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { ActivationToken, Professional } from '@/lib/types';
import { Logo } from '@/components/icons/logo';

export default function ActivatePage() {
    const { firestore, user, isUserLoading } = useFirebase();
    const router = useRouter();
    const { toast } = useToast();
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleActivation = async () => {
        if (!firestore || !user || !token) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Por favor, insira um token válido.',
            });
            return;
        }

        setIsLoading(true);
        
        const tokenRef = doc(firestore, 'activationTokens', token);
        const professionalRef = doc(firestore, 'professionals', user.uid);

        try {
            const tokenSnap = await getDoc(tokenRef);
            if (!tokenSnap.exists() || tokenSnap.data().isUsed) {
                throw new Error('Token inválido ou já utilizado.');
            }

            const tokenData = tokenSnap.data() as ActivationToken;
            
            // Calculate new expiration date
            const now = new Date();
            const expirationDate = addMonths(now, tokenData.durationMonths);

            // Update token
            await updateDoc(tokenRef, {
                isUsed: true,
                usedAt: now.toISOString(),
                usedBy: user.uid,
            });

            // Update professional's profile with expiration date
            const professionalSnap = await getDoc(professionalRef);
            const professionalData = (professionalSnap.data() as Professional) || {};
            
            await updateDoc(professionalRef, {
                ...professionalData,
                activationExpiresAt: expirationDate.toISOString(),
            });

            toast({
                title: 'Sucesso!',
                description: 'Sua conta foi ativada.',
            });

            // Force a re-evaluation in the FirebaseProvider
             window.location.href = '/';

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            toast({
                variant: 'destructive',
                title: 'Falha na Ativação',
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isUserLoading) {
        return <div className="flex h-screen items-center justify-center">Carregando...</div>;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-sm mx-4">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Logo className="w-12 h-12 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Ativar sua Conta</CardTitle>
                    <CardDescription>
                        Insira o token de ativação que você recebeu para começar a usar o BeautyFlow.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <Input
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Seu token de ativação"
                        disabled={isLoading}
                    />
                    <Button onClick={handleActivation} disabled={isLoading}>
                        {isLoading ? 'Ativando...' : 'Ativar Conta'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
