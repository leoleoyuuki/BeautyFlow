
"use client";

import React, { useState, useCallback, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { addDays, subDays, differenceInDays } from 'date-fns';
import { MessageSquare } from 'lucide-react';
import type { Client, Service, Appointment } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, orderBy, limit, startAfter, getDocs, DocumentSnapshot, DocumentData, doc } from 'firebase/firestore';
import { Loader } from '@/components/ui/loader';

const PAGE_SIZE = 10;

// This custom hook handles the logic for fetching paginated renewals.
function usePaginatedRenewals(
    baseQuery: ReturnType<typeof query> | null,
    loadInitial: boolean
) {
    const [renewals, setRenewals] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(loadInitial);
    const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const fetchRenewals = useCallback(async (loadMore = false) => {
        if (!baseQuery) {
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);

        let finalQuery = query(baseQuery, limit(PAGE_SIZE));
        if (loadMore && lastDoc) {
            finalQuery = query(baseQuery, startAfter(lastDoc), limit(PAGE_SIZE));
        }

        try {
            const snapshot = await getDocs(finalQuery);
            const newRenewals = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Appointment));

            setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
            setHasMore(newRenewals.length === PAGE_SIZE);
            setRenewals(prev => {
                const existingIds = new Set(prev.map(r => r.id));
                const uniqueNewRenewals = newRenewals.filter(r => !existingIds.has(r.id));
                return loadMore ? [...prev, ...uniqueNewRenewals] : newRenewals;
            });
        } catch (error) {
            console.error("Error fetching renewals:", error);
        } finally {
            setIsLoading(false);
        }

    }, [baseQuery, lastDoc]);

    // Initial fetch
    React.useEffect(() => {
        if(loadInitial) {
            fetchRenewals(false);
        }
    }, [loadInitial, fetchRenewals]);

    return { renewals, isLoading, hasMore, loadMore: () => fetchRenewals(true) };
}

// A component to render a single row, fetching its own related data.
const RenewalRow = React.memo(({ renewal }: { renewal: Appointment }) => {
    const { firestore, user } = useFirebase();

    const clientDoc = useMemoFirebase(() => {
        if (!user || !renewal.clientId) return null;
        return doc(firestore, 'professionals', user.uid, 'clients', renewal.clientId);
    }, [firestore, user, renewal.clientId]);

    const serviceDoc = useMemoFirebase(() => {
        if (!user || !renewal.serviceId) return null;
        return doc(firestore, 'professionals', user.uid, 'services', renewal.serviceId);
    }, [firestore, user, renewal.serviceId]);

    const { data: client } = useDoc<Client>(clientDoc);
    const { data: service } = useDoc<Service>(serviceDoc);

    if (!client || !service || !renewal.renewalDate) {
        return <TableRow><TableCell colSpan={6}><Loader className="py-2"/></TableCell></TableRow>;
    }
    
    const daysLeft = differenceInDays(new Date(renewal.renewalDate), new Date());

    const handleWhatsAppRedirect = () => {
        const daysText = Math.abs(daysLeft) === 1 ? '1 dia' : `${Math.abs(daysLeft)} dias`;
        const messageText = daysLeft >= 0 
            ? `Passando para lembrar que seu procedimento de ${service.name} vence em ${daysText}.`
            : `Notei que seu procedimento de ${service.name} venceu há ${daysText}.`;

        const message = `Olá ${client.name.split(' ')[0]}! Tudo bem? ${messageText} Que tal agendarmos a sua renovação?`;
        const whatsappUrl = `https://wa.me/${client.phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const getBadgeVariant = (days: number) => {
        if (days < 0) return 'destructive';
        if (days <= 7) return 'secondary';
        return 'outline';
    };

    const getDaysLeftText = (days: number) => {
        if (days < 0) return `Venceu há ${Math.abs(days)} ${Math.abs(days) === 1 ? 'dia' : 'dias'}`;
        if (days === 0) return 'Vence hoje';
        if (days === 1) return 'Vence em 1 dia';
        return `Vence em ${days} dias`;
    };

    return (
        <TableRow>
            <TableCell className="font-medium whitespace-nowrap">{client.name}</TableCell>
            <TableCell className="whitespace-nowrap">{service.name}</TableCell>
            <TableCell>{formatDate(renewal.appointmentDate)}</TableCell>
            <TableCell>{formatDate(renewal.renewalDate)}</TableCell>
            <TableCell>
                <Badge variant={getBadgeVariant(daysLeft)}>{getDaysLeftText(daysLeft)}</Badge>
            </TableCell>
            <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={handleWhatsAppRedirect}>
                    <MessageSquare className="h-4 w-4 text-green-500" />
                    <span className="sr-only">Enviar WhatsApp</span>
                </Button>
            </TableCell>
        </TableRow>
    );
});
RenewalRow.displayName = 'RenewalRow';


export default function RenewalsPage() {
    const { firestore, user } = useFirebase();
    const now = new Date();
    
    const upcomingQuery = useMemoFirebase(() => {
        if (!user) return null;
        const upcomingEndDate = addDays(now, 15);
        const appointmentsCollection = collection(firestore, 'professionals', user.uid, 'appointments');
        return query(appointmentsCollection, 
            where('renewalDate', '>=', now.toISOString()),
            where('renewalDate', '<=', upcomingEndDate.toISOString()),
            orderBy('renewalDate', 'asc')
        );
    }, [user, firestore]);

    const expiredQuery = useMemoFirebase(() => {
        if (!user) return null;
        const expiredStartDate = subDays(now, 15);
        const appointmentsCollection = collection(firestore, 'professionals', user.uid, 'appointments');
        return query(appointmentsCollection, 
            where('renewalDate', '>=', expiredStartDate.toISOString()),
            where('renewalDate', '<', now.toISOString()),
            orderBy('renewalDate', 'desc')
        );
    }, [user, firestore]);
    
    const { 
        renewals: upcomingRenewals, 
        isLoading: isLoadingUpcoming, 
        hasMore: hasMoreUpcoming, 
        loadMore: loadMoreUpcoming 
    } = usePaginatedRenewals(upcomingQuery, !!user);
    
    const { 
        renewals: expiredRenewals, 
        isLoading: isLoadingExpired, 
        hasMore: hasMoreExpired, 
        loadMore: loadMoreExpired 
    } = usePaginatedRenewals(expiredQuery, !!user);


    return (
        <div className="flex-1 space-y-6 p-2 md:p-6 pt-6">
            <div className="px-2">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Renovações</h1>
                <p className="text-muted-foreground">Acompanhe os vencimentos e envie lembretes para suas clientes.</p>
            </div>

            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Próximas Renovações (15 dias)</CardTitle>
                        <CardDescription>Procedimentos que estão perto de vencer.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Procedimento</TableHead>
                                        <TableHead>Última Vez</TableHead>
                                        <TableHead>Vencimento</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingUpcoming && upcomingRenewals.length === 0 && <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader /></TableCell></TableRow>}
                                    {upcomingRenewals.map((renewal) => <RenewalRow key={renewal.id} renewal={renewal} />)}
                                </TableBody>
                            </Table>
                        </div>
                        {hasMoreUpcoming && (
                            <div className="mt-4 flex justify-center">
                                <Button onClick={loadMoreUpcoming} disabled={isLoadingUpcoming}>
                                    {isLoadingUpcoming ? 'Carregando...' : 'Carregar Mais'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Renovações Vencidas (Últimos 15 dias)</CardTitle>
                        <CardDescription>Clientes que já passaram da data de renovação.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Procedimento</TableHead>
                                        <TableHead>Última Vez</TableHead>
                                        <TableHead>Vencimento</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingExpired && expiredRenewals.length === 0 && <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader /></TableCell></TableRow>}
                                    {expiredRenewals.map((renewal) => <RenewalRow key={renewal.id} renewal={renewal} />)}
                                </TableBody>
                            </Table>
                        </div>
                         {hasMoreExpired && (
                            <div className="mt-4 flex justify-center">
                                <Button onClick={loadMoreExpired} disabled={isLoadingExpired}>
                                    {isLoadingExpired ? 'Carregando...' : 'Carregar Mais Vencidas'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
