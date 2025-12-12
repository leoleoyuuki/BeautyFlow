
"use client";

import { useState, useMemo } from 'react';
import { useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, setDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { addMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { ActivationToken, Professional } from '@/lib/types';
import { Logo } from '@/components/icons/logo';

export default function ActivatePage() {
    const { firestore, user, isUserLoading } = useFirebase();
    const router = useRouter();
    const { toast } = useToast();
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const whatsappMessage = useMemo(() => encodeURIComponent("Olá! Gostaria de adquirir acesso ao BeautyFlow 💖✨"), []);

    const handleActivation = async () => {
        if (!firestore || !user || !token) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Por favor, insira um token de ativação válido.',
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

            // Create or update professional's profile with expiration date
            const professionalSnap = await getDoc(professionalRef);
            const professionalData = (professionalSnap.data() as Professional) || {};
            
            const dataToSave = {
                ...professionalData,
                id: user.uid,
                name: professionalData.name || user.displayName || 'Novo Usuário',
                contactNumber: professionalData.contactNumber || user.phoneNumber || '',
                activationExpiresAt: expirationDate.toISOString(),
            };

            await setDoc(professionalRef, dataToSave, { merge: true });

            // Create default "Contas" category if it doesn't exist
            const categoriesCollectionRef = collection(firestore, 'professionals', user.uid, 'materialCategories');
            const q = query(categoriesCollectionRef, where("name", "==", "Contas"));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                await addDoc(categoriesCollectionRef, { name: "Contas", professionalId: user.uid });
            }

            toast({
                title: 'Sucesso! ✨',
                description: 'Sua conta foi ativada e está pronta para uso.',
            });

            // Force a re-evaluation in the FirebaseProvider
             window.location.href = '/dashboard';

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
                    <CardTitle className="text-2xl font-bold">Ative sua Conta ✨</CardTitle>
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
                 <CardFooter className="flex-col items-center justify-center pt-4 border-t">
                    <p className="text-sm text-center text-muted-foreground px-4">
                        Não possui um código de ativação? Clique abaixo para pedir o seu.
                    </p>
                    <Button variant="link" className="mt-2" asChild>
                        <a href={`https://wa.me/5511957211546?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer">
                            Pedir pelo WhatsApp
                        </a>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
