"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BellRing,
  LayoutDashboard,
  List,
  Users,
  CalendarPlus,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Logo } from './icons/logo';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/appointments', icon: CalendarPlus, label: 'Atendimentos' },
  { href: '/clients', icon: Users, label: 'Clientes' },
  { href: '/renewals', icon: BellRing, label: 'Renovações' },
  { href: '/services', icon: List, label: 'Serviços' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="shrink-0" asChild>
                <Link href="/">
                    <Logo className="text-primary"/>
                </Link>
            </Button>
            <h2 className="text-xl font-bold tracking-tight font-headline">BeautyFlow</h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                  className="justify-start"
                >
                  <Link href={item.href}>
                    <item.icon className="shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:hidden">
            <SidebarTrigger/>
            <h2 className="text-lg font-bold tracking-tight font-headline">BeautyFlow</h2>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
