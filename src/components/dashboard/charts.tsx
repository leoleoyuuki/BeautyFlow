
"use client";

import { useMemo } from 'react';
import { Bar, BarChart, Line, LineChart, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils';
import { subMonths, format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Service, Summary } from '@/lib/types';

interface RevenueChartProps {
  isRevenueVisible: boolean;
  summary: Summary | null;
}

export function RevenueChart({ isRevenueVisible, summary }: RevenueChartProps) {
  const chartData = useMemo(() => {
    if (!summary?.monthlyRevenue) return [];
    const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i));
    return months.map(monthDate => {
      const monthKey = format(monthDate, 'yyyy-MM');
      return {
        month: format(monthDate, 'MMM', { locale: ptBR }),
        revenue: summary.monthlyRevenue[monthKey] || 0,
      };
    });
  }, [summary]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Faturamento Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: isRevenueVisible ? -10 : 20, bottom: 5 }}>
              <XAxis dataKey="month" />
              <YAxis tickFormatter={value => isRevenueVisible ? formatCurrency(value) : ''} />
              <Tooltip
                content={<ChartTooltipContent 
                    formatter={(value) => isRevenueVisible ? formatCurrency(Number(value)) : "Oculto"}
                />}
                />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
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
