"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BellRing,
  LayoutDashboard,
  List,
  Users,
  CalendarPlus,
  LogOut,
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
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Logo } from './icons/logo';
import { cn } from '@/lib/utils';
import { useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/appointments', icon: CalendarPlus, label: 'Atendimentos' },
  { href: '/clients', icon: Users, label: 'Clientes' },
  { href: '/renewals', icon: BellRing, label: 'Renovações' },
  { href: '/services', icon: List, label: 'Serviços' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { auth, user, isUserLoading } = useFirebase();
  const router = useRouter();

  if (isUserLoading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-2xl font-bold">Carregando...</div>
        </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }
  
  const handleSignOut = () => {
    if (auth) {
      auth.signOut();
    }
  };


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
        <SidebarFooter>
            <SidebarSeparator />
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleSignOut} className="justify-start">
                        <LogOut className="shrink-0" />
                        <span>Sair</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:hidden">
            <SidebarTrigger>
                <PanelLeft />
                <span className="sr-only">Toggle Menu</span>
            </SidebarTrigger>
            <h2 className="text-lg font-bold tracking-tight font-headline">BeautyFlow</h2>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}