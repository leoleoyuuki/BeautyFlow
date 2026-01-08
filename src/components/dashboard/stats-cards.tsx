
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { subMonths, format } from 'date-fns';
import { DollarSign, Users, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import type { Summary } from '@/lib/types';

interface StatsCardsProps {
  isRevenueVisible: boolean;
  summary: Summary | null;
  viewMode: 'revenue' | 'profit';
}

export function StatsCards({ isRevenueVisible, summary, viewMode }: StatsCardsProps) {
  const stats = useMemo(() => {
    if (!summary) {
        return {
            totalRevenue: 0,
            revenueLastMonth: 0,
            totalClients: 0,
            newClientsLastMonth: 0,
            totalAppointments: 0,
            totalExpenses: 0,
            expensesLastMonth: 0,
            totalProfit: 0,
            profitLastMonth: 0
        }
    }
    const lastMonthKey = format(subMonths(new Date(), 1), 'yyyy-MM');
    const revenueLastMonth = summary.monthlyRevenue?.[lastMonthKey] || 0;
    const expensesLastMonth = summary.monthlyExpenses?.[lastMonthKey] || 0;

    return { 
        totalRevenue: summary.totalRevenue,
        revenueLastMonth,
        totalClients: summary.totalClients,
        newClientsLastMonth: summary.newClientsPerMonth?.[lastMonthKey] || 0,
        totalAppointments: summary.totalAppointments,
        totalExpenses: summary.totalExpenses || 0,
        expensesLastMonth,
        totalProfit: summary.totalRevenue - (summary.totalExpenses || 0),
        profitLastMonth: revenueLastMonth - expensesLastMonth
     };
  }, [summary]);

  const RevenueDisplay = ({ value }: { value: number }) => 
    isRevenueVisible ? <span>{formatCurrency(value)}</span> : <span className="text-lg font-semibold">●●●●</span>;

  if (viewMode === 'profit') {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Real Total</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <RevenueDisplay value={stats.totalProfit} />
              </div>
              <p className="text-xs text-muted-foreground">
                <RevenueDisplay value={stats.profitLastMonth} /> no último mês
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <RevenueDisplay value={stats.totalRevenue} />
              </div>
              <p className="text-xs text-muted-foreground">
                <RevenueDisplay value={stats.revenueLastMonth} /> no último mês
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <RevenueDisplay value={stats.totalExpenses} />
              </div>
              <p className="text-xs text-muted-foreground">
                <RevenueDisplay value={stats.expensesLastMonth} /> no último mês
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
                {stats.totalClients}
              </div>
              <p className="text-xs text-muted-foreground">
                +{stats.newClientsLastMonth} no último mês
              </p>
            </CardContent>
          </Card>
        </div>
      )
  }

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
            <RevenueDisplay value={stats.revenueLastMonth} /> no último mês
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
            {stats.totalClients}
          </div>
          <p className="text-xs text-muted-foreground">
            +{stats.newClientsLastMonth} no último mês
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
            {stats.totalAppointments}
          </div>
           <p className="text-xs text-muted-foreground">Total de atendimentos</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <RevenueDisplay value={stats.totalExpenses} />
          </div>
          <p className="text-xs text-muted-foreground"><RevenueDisplay value={stats.expensesLastMonth} /> no último mês</p>
        </CardContent>
      </Card>
    </div>
  );
}
