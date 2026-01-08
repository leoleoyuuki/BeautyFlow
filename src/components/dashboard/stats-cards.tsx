
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { subMonths, isAfter, addMonths, format } from 'date-fns';
import { DollarSign, Users, BellRing, TrendingUp } from 'lucide-react';
import type { Appointment, Client, Summary } from '@/lib/types';

interface StatsCardsProps {
  isRevenueVisible: boolean;
  summary: Summary | null;
}

export function StatsCards({ isRevenueVisible, summary }: StatsCardsProps) {
  const stats = useMemo(() => {
    if (!summary) {
        return {
            totalRevenue: 0,
            revenueLastMonth: 0,
            totalClients: 0,
            newClientsLastMonth: 0,
            totalAppointments: 0,
        }
    }
    const lastMonthKey = format(subMonths(new Date(), 1), 'yyyy-MM');

    return { 
        totalRevenue: summary.totalRevenue,
        revenueLastMonth: summary.monthlyRevenue?.[lastMonthKey] || 0,
        totalClients: summary.totalClients,
        newClientsLastMonth: summary.newClientsPerMonth?.[lastMonthKey] || 0,
        totalAppointments: summary.totalAppointments,
     };
  }, [summary]);

  const StatDisplay = ({ value, prefix = '', suffix = '' }: { value: number | string, prefix?: string, suffix?: string }) => 
    isRevenueVisible ? <span>{prefix}{value}{suffix}</span> : <span className="text-lg font-semibold">●●●●</span>;

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
          <div className="text-2xl font-bold">
            <StatDisplay value={stats.totalClients} />
          </div>
          <p className="text-xs text-muted-foreground">
            <StatDisplay value={stats.newClientsLastMonth} prefix="+" /> no último mês
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Procedimentos Realizados</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <StatDisplay value={stats.totalAppointments} />
          </div>
           <p className="text-xs text-muted-foreground">Total de atendimentos</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Renovações Próximas</CardTitle>
          <BellRing className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ...
          </div>
          <p className="text-xs text-muted-foreground">Em breve</p>
        </CardContent>
      </Card>
    </div>
  );
}

