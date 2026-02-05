
"use client";

import { useMemo } from 'react';
import { Line, LineChart, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';
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
    const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i));
    
    return months.map(monthDate => {
      const monthKey = format(monthDate, 'yyyy-MM');
      const revenue = summary?.monthlyRevenue?.[monthKey] || 0;
      const expenses = summary?.monthlyExpenses?.[monthKey] || 0;
      const profit = revenue - expenses;
      
      return {
        month: format(monthDate, 'MMM', { locale: ptBR }),
        revenue,
        expenses,
        profit,
      };
    });
  }, [summary]);

  const chartConfig: ChartConfig = {
      revenue: { label: 'Faturamento', color: 'hsl(var(--primary))' },
      expenses: { label: 'Custos', color: 'hsl(var(--destructive))' },
      profit: { label: 'Lucro Líquido', color: 'hsl(var(--chart-3))' },
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{viewMode === 'revenue' ? 'Evolução do Faturamento' : 'Análise de Lucro e Custos'}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <XAxis 
                  dataKey="month" 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis 
                  tickFormatter={value => isRevenueVisible ? new Intl.NumberFormat('pt-BR', { notation: 'compact', style: 'currency', currency: 'BRL' }).format(value) : '****'}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                    cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 1 }}
                    content={<ChartTooltipContent 
                        formatter={(value, name) => (
                            <div className="flex w-full items-center justify-between gap-4 min-w-[140px]">
                                <span className="text-muted-foreground text-xs">
                                    {chartConfig[name as string]?.label || name}
                                </span>
                                <span className="font-mono font-medium">
                                    {isRevenueVisible ? formatCurrency(Number(value)) : "●●●●"}
                                </span>
                            </div>
                        )}
                    />}
                />
                <Legend content={<ChartLegendContent />} />
                
                {/* Linha de Faturamento - Sempre visível */}
                <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    name="revenue"
                    stroke="var(--color-revenue)" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: "var(--color-revenue)" }}
                    activeDot={{ r: 6 }}
                />

                {/* Linhas de Custos e Lucro - Visíveis apenas no modo profit */}
                {viewMode === 'profit' && (
                    <Line 
                        type="monotone" 
                        dataKey="expenses" 
                        name="expenses"
                        stroke="var(--color-expenses)" 
                        strokeWidth={2} 
                        strokeDasharray="5 5"
                        dot={{ r: 3, fill: "var(--color-expenses)" }}
                    />
                )}
                {viewMode === 'profit' && (
                    <Line 
                        type="monotone" 
                        dataKey="profit" 
                        name="profit"
                        stroke="var(--color-profit)" 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: "var(--color-profit)" }}
                    />
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

import { Bar, BarChart } from 'recharts';

export function NewClientsChart({ summary }: NewClientsChartProps) {
    const chartData = useMemo(() => {
        const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i));
        return months.map(monthDate => {
            const monthKey = format(monthDate, 'yyyy-MM');
            return {
                month: format(monthDate, 'MMM', { locale: ptBR }),
                newClients: summary?.newClientsPerMonth?.[monthKey] || 0,
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
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
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
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis tickFormatter={value => formatCurrency(Number(value))} axisLine={false} tickLine={false} />
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
