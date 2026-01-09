
"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
import { differenceInDays, addMonths, isAfter } from 'date-fns';
import { MessageSquare } from 'lucide-react';
import type { Client, Service, Appointment } from '@/lib/types';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, startAfter, getDocs, DocumentSnapshot, doc, where } from 'firebase/firestore';
import { Loader } from '@/components/ui/loader';
import { backfillRenewalDates } from '@/firebase/backfills/appointment-renewal-date';

const PAGE_SIZE = 12;

function usePaginatedRenewals(baseQuery: ReturnType<typeof query> | null, enabled: boolean) {
    const [renewals, setRenewals] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(enabled);
    const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const fetchRenewals = useCallback(async (loadMore = false) => {
        if (!baseQuery || !enabled || (!hasMore && loadMore)) {
            if (enabled) setIsLoading(false);
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
    }, [baseQuery, lastDoc, hasMore, enabled]);

    useEffect(() => {
        setRenewals([]);
        setLastDoc(null);
        setHasMore(true);
        fetchRenewals(false);
    }, [baseQuery]);

    return { renewals, isLoading, hasMore, loadMore: () => fetchRenewals(true) };
}

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

    const { data: client, isLoading: isLoadingClient } = useDoc<Client>(clientDoc);
    const { data: service, isLoading: isLoadingService } = useDoc<Service>(serviceDoc);

    const renewalDetails = useMemo(() => {
        const renewalDate = new Date(renewal.renewalDate!);
        const daysLeft = differenceInDays(renewalDate, new Date());
        return { renewalDate, daysLeft };
    }, [renewal]);

    if (isLoadingClient || isLoadingService) {
        return <TableRow><TableCell colSpan={6}><Loader className="py-2"/></TableCell></TableRow>;
    }
    
    if (!client || !service) {
        return null;
    }

    const { renewalDate, daysLeft } = renewalDetails;

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
            <TableCell>{formatDate(renewalDate.toISOString())}</TableCell>
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
    const [isBackfilling, setIsBackfilling] = useState(true);
    const [backfillCompleted, setBackfillCompleted] = useState(false);

    useEffect(() => {
        const runBackfill = async () => {
            if (user && firestore) {
                 // We can use a session storage to avoid re-running this for the same session
                const backfillFlag = `backfill_renewals_${user.uid}`;
                if (!sessionStorage.getItem(backfillFlag)) {
                    setIsBackfilling(true);
                    await backfillRenewalDates(firestore, user.uid);
                    sessionStorage.setItem(backfillFlag, 'true');
                }
                setBackfillCompleted(true);
                setIsBackfilling(false);
            }
        }
        runBackfill();
    }, [user, firestore]);
    
    // Query for upcoming renewals
    const upcomingQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(
            collection(firestore, 'professionals', user.uid, 'appointments'),
            where('renewalDate', '>=', new Date().toISOString()),
            orderBy('renewalDate', 'asc')
        );
    }, [user, firestore]);
    
    // Query for expired renewals
    const expiredQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(
            collection(firestore, 'professionals', user.uid, 'appointments'),
            where('renewalDate', '<', new Date().toISOString()),
            orderBy('renewalDate', 'desc')
        );
    }, [user, firestore]);

    const { renewals: upcomingRenewals, isLoading: isLoadingUpcoming, hasMore: hasMoreUpcoming, loadMore: loadMoreUpcoming } = usePaginatedRenewals(upcomingQuery, backfillCompleted);
    const { renewals: expiredRenewals, isLoading: isLoadingExpired, hasMore: hasMoreExpired, loadMore: loadMoreExpired } = usePaginatedRenewals(expiredQuery, backfillCompleted);
    
    if (isBackfilling) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
                <Loader text="Preparando seus dados de renovação pela primeira vez..." />
                <p className="text-sm text-muted-foreground">Isso pode levar um instante e só acontecerá uma vez.</p>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-6 p-2 md:p-6 pt-6">
            <div className="px-2">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Renovações</h1>
                <p className="text-muted-foreground">Acompanhe os vencimentos e envie lembretes para suas clientes.</p>
            </div>

            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Próximas Renovações</CardTitle>
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
                                     {upcomingRenewals.length === 0 && !isLoadingUpcoming && (
                                        <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Nenhuma renovação futura encontrada.</TableCell></TableRow>
                                    )}
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
                        <CardTitle>Renovações Vencidas</CardTitle>
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
                                     {expiredRenewals.length === 0 && !isLoadingExpired && (
                                        <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Nenhuma renovação vencida encontrada.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {hasMoreExpired && (
                            <div className="mt-4 flex justify-center">
                                <Button onClick={loadMoreExpired} disabled={isLoadingExpired}>
                                    {isLoadingExpired ? 'Carregando...' : 'Carregar Mais'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

