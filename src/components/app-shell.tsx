
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
  PanelLeft,
  KeyRound,
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
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Logo } from './icons/logo';
import { useFirebase } from '@/firebase';

const ADMIN_UID = 'fE4wQQun2zgDr39cwH0AKoOADkT2';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/appointments', icon: CalendarPlus, label: 'Atendimentos' },
  { href: '/clients', icon: Users, label: 'Clientes' },
  { href: '/renewals', icon: BellRing, label: 'Renovações' },
  { href: '/services', icon: List, label: 'Serviços' },
];

const adminNavItems = [
    { href: '/admin/tokens', icon: KeyRound, label: 'Gerar Tokens' }
]

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { auth, user, isUserLoading } = useFirebase();
  const { setOpenMobile, isMobile } = useSidebar();
  const isAdmin = user?.uid === ADMIN_UID;

  if (isUserLoading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-2xl font-bold">Carregando...</div>
        </div>
    );
  }
  
  const handleSignOut = () => {
    if (auth) {
      auth.signOut();
    }
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }


  return (
    <>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="shrink-0" asChild>
                <Link href="/dashboard">
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
                  onClick={handleLinkClick}
                >
                  <Link href={item.href}>
                    <item.icon className="shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {isAdmin && (
                <>
                    <SidebarSeparator className="my-4" />
                     {adminNavItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                            asChild
                            isActive={pathname === item.href}
                            tooltip={item.label}
                            className="justify-start"
                            onClick={handleLinkClick}
                            >
                            <Link href={item.href}>
                                <item.icon className="shrink-0" />
                                <span>{item.label}</span>
                            </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </>
            )}
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
    </>
  );
}


export function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppShellContent>{children}</AppShellContent>
        </SidebarProvider>
    )
}
