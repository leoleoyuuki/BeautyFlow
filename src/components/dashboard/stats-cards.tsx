"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { procedures, clients } from '@/lib/data';
import { formatCurrency } from '@/lib/utils';
import { subMonths, isAfter, addMonths } from 'date-fns';
import { DollarSign, Users, BellRing, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
  isRevenueVisible: boolean;
}

export function StatsCards({ isRevenueVisible }: StatsCardsProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const oneMonthAgo = subMonths(now, 1);
    
    const totalRevenue = procedures.reduce((sum, p) => sum + p.price, 0);
    const revenueLastMonth = procedures
        .filter(p => isAfter(new Date(p.date), oneMonthAgo))
        .reduce((sum, p) => sum + p.price, 0);

    const totalClients = clients.length;
    const newClientsLastMonth = clients.filter(c => isAfter(new Date(c.joinDate), oneMonthAgo)).length;
    
    const upcomingRenewals = procedures.filter(p => {
        const renewalDate = addMonths(new Date(p.date), p.validityMonths);
        const twoMonthsFromNow = addMonths(now, 2);
        return isAfter(renewalDate, now) && isAfter(twoMonthsFromNow, renewalDate);
    }).length;

    return { totalRevenue, revenueLastMonth, totalClients, newClientsLastMonth, upcomingRenewals };
  }, []);

  const RevenueDisplay = ({ value }: { value: number }) => 
    isRevenueVisible ? <span>{formatCurrency(value)}</span> : <span className="text-lg font-semibold">●●●●</span>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <RevenueDisplay value={stats.totalRevenue} />
          </div>
          <p className="text-xs text-muted-foreground">
            +<RevenueDisplay value={stats.revenueLastMonth} /> no último mês
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalClients}</div>
          <p className="text-xs text-muted-foreground">+{stats.newClientsLastMonth} no último mês</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Renovações Próximas</CardTitle>
          <BellRing className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{stats.upcomingRenewals}</div>
          <p className="text-xs text-muted-foreground">Nos próximos 2 meses</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Procedimentos Realizados</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{procedures.length}</div>
          <p className="text-xs text-muted-foreground">Total de atendimentos</p>
        </CardContent>
      </Card>
    </div>
  );
}
