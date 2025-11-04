"use client";

import { useMemo } from 'react';
import { Bar, BarChart, Line, LineChart, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils';
import { subMonths, format, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Appointment, Client, Service } from '@/lib/types';

interface RevenueChartProps {
  isRevenueVisible: boolean;
  appointments: Appointment[];
}

export function RevenueChart({ isRevenueVisible, appointments }: RevenueChartProps) {
  const chartData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => startOfMonth(subMonths(new Date(), 5 - i)));
    return months.map(monthStart => {
      const monthEnd = endOfMonth(monthStart);
      const monthlyRevenue = appointments
        .filter(p => p.appointmentDate && isWithinInterval(new Date(p.appointmentDate), { start: monthStart, end: monthEnd }))
        .reduce((sum, p) => sum + (p.price || 0), 0);
      return {
        month: format(monthStart, 'MMM', { locale: ptBR }),
        revenue: monthlyRevenue,
      };
    });
  }, [appointments]);

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
    clients: Client[];
}

export function NewClientsChart({ clients }: NewClientsChartProps) {
    const chartData = useMemo(() => {
      const months = Array.from({ length: 6 }, (_, i) => startOfMonth(subMonths(new Date(), 5 - i)));
      return months.map(monthStart => {
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
        // Assuming client data has a joinDate property
        const newClientsCount = clients
          .filter(c => c.createdAt && isWithinInterval(new Date(c.createdAt), { start: monthStart, end: monthEnd }))
          .length;
        return {
          month: format(monthStart, 'MMM', { locale: ptBR }),
          newClients: newClientsCount,
        };
      });
    }, [clients]);
  
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
    appointments: Appointment[];
    services: Service[];
  }

  export function PopularServicesChart({ appointments, services }: PopularServicesChartProps) {
    const chartData = useMemo(() => {
      if (!appointments || !services) return [];
      const serviceCounts = appointments.reduce((acc, p) => {
        const serviceName = services.find(s => s.id === p.serviceId)?.name || 'Desconhecido';
        acc[serviceName] = (acc[serviceName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
  
      return Object.entries(serviceCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    }, [appointments, services]);

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
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (percent as number) > 0.05 ? (<text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
                            {`${(percent * 100).toFixed(0)}%`}
                        </text>) : null;
                    }}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                </RechartsPieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  }
