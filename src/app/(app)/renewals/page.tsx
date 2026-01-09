
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
import { addDays, subDays, differenceInDays, isBefore, isAfter, addMonths } from 'date-fns';
import { MessageSquare } from 'lucide-react';
import type { Client, Service, Appointment } from '@/lib/types';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, startAfter, getDocs, DocumentSnapshot, doc } from 'firebase/firestore';
import { Loader } from '@/components/ui/loader';

const PAGE_SIZE = 12;

// This custom hook handles the logic for fetching paginated appointments.
// It fetches raw appointments, and the filtering logic is handled by the component.
function usePaginatedAppointments(
    baseQuery: ReturnType<typeof query> | null
) {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const fetchAppointments = useCallback(async (loadMore = false) => {
        if (!baseQuery || (!hasMore && loadMore)) {
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
            const newAppointments = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Appointment));
            
            setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
            setHasMore(newAppointments.length === PAGE_SIZE);

            setAppointments(prev => {
                const existingIds = new Set(prev.map(r => r.id));
                const uniqueNewAppointments = newAppointments.filter(r => !existingIds.has(r.id));
                return loadMore ? [...prev, ...uniqueNewAppointments] : newAppointments;
            });
        } catch (error) {
            console.error("Error fetching appointments:", error);
        } finally {
            setIsLoading(false);
        }
    }, [baseQuery, lastDoc, hasMore]);

    // Initial fetch
    useEffect(() => {
        if (baseQuery) {
            setAppointments([]); // Reset on new query
            setLastDoc(null);
            setHasMore(true);
            fetchAppointments(false);
        }
    }, [baseQuery]);

    return { appointments, isLoading, hasMore, loadMore: () => fetchAppointments(true) };
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

    const { data: client, isLoading: isLoadingClient } = useDoc<Client>(clientDoc);
    const { data: service, isLoading: isLoadingService } = useDoc<Service>(serviceDoc);

    const renewalDetails = useMemo(() => {
        const renewalDate = renewal.renewalDate ? new Date(renewal.renewalDate) : addMonths(new Date(renewal.appointmentDate), renewal.validityPeriodMonths);
        const daysLeft = differenceInDays(renewalDate, new Date());
        return { renewalDate, daysLeft };
    }, [renewal]);

    if (isLoadingClient || isLoadingService) {
        return <TableRow><TableCell colSpan={6}><Loader className="py-2"/></TableCell></TableRow>;
    }
    
    if (!client || !service) {
        // This can happen if a client or service was deleted. We just don't render the row.
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
    
    // Base query to fetch all appointments, ordered by date.
    const baseAppointmentsQuery = useMemoFirebase(() => {
        if (!user) return null;
        const appointmentsCollection = collection(firestore, 'professionals', user.uid, 'appointments');
        return query(appointmentsCollection, orderBy('appointmentDate', 'desc'));
    }, [user, firestore]);
    
    const { 
        appointments: allAppointments, 
        isLoading, 
        hasMore, 
        loadMore 
    } = usePaginatedAppointments(baseAppointmentsQuery);

    const { upcomingRenewals, expiredRenewals } = useMemo(() => {
        const now = new Date();
        const upcoming: Appointment[] = [];
        const expired: Appointment[] = [];

        allAppointments.forEach(app => {
            const renewalDate = app.renewalDate ? new Date(app.renewalDate) : addMonths(new Date(app.appointmentDate), app.validityPeriodMonths);
            
            if (isAfter(renewalDate, now)) {
                upcoming.push(app);
            } else {
                expired.push(app);
            }
        });
        
        // Sort upcoming from soonest to latest
        upcoming.sort((a, b) => new Date(a.renewalDate!).getTime() - new Date(b.renewalDate!).getTime());
        // Expired are already sorted by appointmentDate desc, which is fine.

        return { upcomingRenewals: upcoming, expiredRenewals: expired };
    }, [allAppointments]);


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
                                    {isLoading && allAppointments.length === 0 && <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader /></TableCell></TableRow>}
                                    {upcomingRenewals.map((renewal) => <RenewalRow key={renewal.id} renewal={renewal} />)}
                                     {upcomingRenewals.length === 0 && !isLoading && (
                                        <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Nenhuma renovação futura encontrada.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
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
                                    {isLoading && allAppointments.length === 0 && <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader /></TableCell></TableRow>}
                                    {expiredRenewals.map((renewal) => <RenewalRow key={renewal.id} renewal={renewal} />)}
                                     {expiredRenewals.length === 0 && !isLoading && (
                                        <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Nenhuma renovação vencida encontrada.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                 {hasMore && (
                    <div className="mt-4 flex justify-center">
                        <Button onClick={loadMore} disabled={isLoading}>
                            {isLoading ? 'Carregando...' : 'Carregar Mais Atendimentos'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
