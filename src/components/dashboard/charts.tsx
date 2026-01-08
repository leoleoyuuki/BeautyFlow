
"use client";

import { useMemo } from 'react';
import { Bar, BarChart, Line, LineChart, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils';
import { subMonths, format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Service, Summary, MaterialPurchase } from '@/lib/types';

interface RevenueChartProps {
  isRevenueVisible: boolean;
  summary: Summary | null;
  viewMode: 'revenue' | 'profit';
}

export function RevenueChart({ isRevenueVisible, summary, viewMode }: RevenueChartProps) {
  const chartData = useMemo(() => {
    if (!summary) return [];
    const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i));
    return months.map(monthDate => {
      const monthKey = format(monthDate, 'yyyy-MM');
      const revenue = summary.monthlyRevenue?.[monthKey] || 0;
      const expenses = summary.monthlyExpenses?.[monthKey] || 0;
      const profit = revenue - expenses;
      return {
        month: format(monthDate, 'MMM', { locale: ptBR }),
        revenue,
        expenses,
        profit,
      };
    });
  }, [summary]);

  const chartConfig = {
      revenue: { label: 'Faturamento', color: 'hsl(var(--chart-1))' },
      expenses: { label: 'Despesas', color: 'hsl(var(--chart-2))' },
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{viewMode === 'revenue' ? 'Faturamento Mensal' : 'Receitas vs. Despesas'}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: isRevenueVisible ? -10 : 20, bottom: 5 }}>
              <XAxis dataKey="month" />
              <YAxis tickFormatter={value => isRevenueVisible ? formatCurrency(value) : ''} />
              <Tooltip
                content={<ChartTooltipContent 
                    formatter={(value, name) => {
                        if (!isRevenueVisible) return "Oculto";
                        
                        if(name === 'profit') {
                             const profitValue = chartData.find(d => d.profit === value)?.profit;
                             return profitValue !== undefined ? formatCurrency(profitValue) : formatCurrency(Number(value));
                        }
                        
                        return formatCurrency(Number(value))
                    }}
                />}
                />
              <Legend />
              <Line type="monotone" dataKey="revenue" name="Faturamento" stroke={chartConfig.revenue.color} strokeWidth={2} dot={viewMode === 'profit'}/>
              {viewMode === 'profit' && (
                <>
                    <Line type="monotone" dataKey="expenses" name="Despesas" stroke={chartConfig.expenses.color} strokeWidth={2} />
                    <Line type="monotone" dataKey="profit" name="Lucro" strokeWidth={0} dot={false} activeDot={false} legendType="none" />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

interface NewClientsChartProps {
    summary: Summary | null;
}

export function NewClientsChart({ summary }: NewClientsChartProps) {
    const chartData = useMemo(() => {
       if (!summary?.newClientsPerMonth) return [];
        const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i));
        return months.map(monthDate => {
            const monthKey = format(monthDate, 'yyyy-MM');
            return {
                month: format(monthDate, 'MMM', { locale: ptBR }),
                newClients: summary.newClientsPerMonth[monthKey] || 0,
            };
        });
    }, [summary]);
  
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Novos Clientes por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip content={<ChartTooltipContent />} cursor={false} />
                <Bar dataKey="newClients" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  }

  interface PopularServicesChartProps {
    summary: Summary | null;
    services: Service[];
  }

  export function PopularServicesChart({ summary, services }: PopularServicesChartProps) {
    const chartData = useMemo(() => {
      if (!summary?.serviceCounts || !services.length) return [];
      
      return Object.entries(summary.serviceCounts)
        .map(([serviceId, count]) => {
            const service = services.find(s => s.id === serviceId);
            return {
                name: service?.name || 'Desconhecido',
                value: count
            };
        })
        .sort((a, b) => b.value - a.value);

    }, [summary, services]);

    const chartConfig = {
        value: { label: 'Vendas' },
        ...chartData.reduce((acc, item) => {
            acc[item.name] = { label: item.name };
            return acc;
        }, {} as any)
    };

    const COLORS = [
        'hsl(var(--chart-1))',
        'hsl(var(--chart-2))',
        'hsl(var(--chart-3))',
        'hsl(var(--chart-4))',
        'hsl(var(--chart-5))',
    ];
  
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Procedimentos Mais Vendidos</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer config={chartConfig} className="mx-auto aspect-square h-full max-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                    <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} labelLine={false} >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                     <Legend content={<ChartLegendContent />} />
                </RechartsPieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  }

interface ExpensesChartProps {
  purchases: MaterialPurchase[] | null;
}

export function ExpensesChart({ purchases }: ExpensesChartProps) {
  const chartData = useMemo(() => {
    const monthlyTotals: { [key: string]: number } = {};
    const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i));

    months.forEach(monthDate => {
        const monthKey = format(monthDate, 'yyyy-MM');
        monthlyTotals[monthKey] = 0;
    });

    purchases?.forEach(purchase => {
        const monthKey = format(new Date(purchase.purchaseDate), 'yyyy-MM');
        if (monthlyTotals.hasOwnProperty(monthKey)) {
            monthlyTotals[monthKey] += purchase.totalPrice;
        }
    });

    return Object.entries(monthlyTotals).map(([monthKey, total]) => ({
      month: format(parse(monthKey, 'yyyy-MM', new Date()), 'MMM', { locale: ptBR }),
      total,
    }));
  }, [purchases]);
  
  return (
     <Card>
        <CardHeader>
          <CardTitle>Gastos Mensais</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="month" />
                <YAxis tickFormatter={value => formatCurrency(Number(value))} />
                <Tooltip 
                    content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} 
                    cursor={false}
                />
                <Bar dataKey="total" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
  )
}

    