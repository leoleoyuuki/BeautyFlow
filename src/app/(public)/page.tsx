
'use client';

import {
  Activity,
  CalendarCheck,
  ChevronRight,
  HeartHandshake,
  MessageCircle,
  PlusCircle,
  Star,
  Zap,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Image from 'next/image';

const testimonials = [
  {
    name: 'Luciene Oliveira',
    title: 'Esteticista',
    quote:
      'Não tinha controle de quanto eu faturava por mês, muito menos das clientes que estão com procedimentos a serem renovados. O BeautyFlow resolveu esse problema que eu nem sabia que tinha.',
    avatar:
      '/images/luciene.jpg',
  }
  // {
  //   name: 'Ana Silva',
  //   title: 'Manicure Profissional',
  //   quote:
  //     'O BeautyFlow transformou a gestão das minhas clientes. As notificações de renovação são mágicas e me ajudaram a aumentar meu faturamento em 20%!',
  //   avatar:
  //     'https://images.unsplash.com/photo-1597223557154-721c1cecc4b0?q=80&w=2080&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  // },
  // {
  //   name: 'Juliana Costa',
  //   title: 'Lash Designer',
  //   quote:
  //     'Finalmente um app que entende as minhas necessidades. Agendar, acompanhar e lembrar minhas clientes de voltar nunca foi tão fácil. Indico de olhos fechados!',
  //   avatar:
  //     'https://images.unsplash.com/photo-1557053910-d9eadeed1c58?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  // },
  // {
  //   name: 'Camila Santos',
  //   title: 'Esteticista',
  //   quote:
  //     'Adeus, planilhas! Com o BeautyFlow, tenho tudo na palma da mão: clientes, serviços, e o mais importante, as datas de retorno. Minha organização é outra.',
  //   avatar:
  //     'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  // },
];

const features = [
  {
    icon: <HeartHandshake />,
    title: 'Gestão de Clientes Simplificada',
    description:
      'Cadastre suas clientes com nome e telefone. Acesse o histórico de serviços e contatos em segundos.',
  },
  {
    icon: <CalendarCheck />,
    title: 'Controle Total dos Serviços',
    description:
      'Registre cada atendimento com preço, anotações e, o mais importante, o período de validade para a renovação.',
  },
  {
    icon: <Zap />,
    title: 'Lembretes de Renovação Automáticos',
    description:
      'Nosso sistema inteligente te avisa quando um serviço está perto de vencer, direto no seu dashboard.',
  },
  {
    icon: <MessageCircle />,
    title: 'Mensagens de WhatsApp com 1 Clique',
    description:
      'Envie lembretes para suas clientes via WhatsApp com mensagens personalizadas e ofertas, sem esforço algum.',
  },
  {
    icon: <Activity />,
    title: 'Dashboard com Métricas Essenciais',
    description:
      'Visualize seu faturamento, aquisição de novas clientes e serviços mais populares em gráficos intuitivos.',
  },
  {
    icon: <PlusCircle />,
    title: 'Catálogo de Serviços Centralizado',
    description:
      'Mantenha um registro de todos os procedimentos que você oferece, com preços e descrições, tudo em um só lugar.',
  },
];

const faqs = [
  {
    question: 'O que eu preciso para começar a usar?',
    answer:
      'Apenas de um celular ou computador com acesso à internet e uma conta Google. O processo de login é simples e rápido para você começar a organizar seus atendimentos o quanto antes.',
  },
  {
    question: 'Meus dados estão seguros na plataforma?',
    answer:
      'Sim, a segurança é nossa prioridade. Utilizamos a infraestrutura robusta do Firebase do Google para garantir que seus dados e os de suas clientes estejam sempre protegidos e acessíveis apenas por você.',
  },
  {
    question: 'Posso usar o BeautyFlow em múltiplos dispositivos?',
    answer:
      'Com certeza! O BeautyFlow é uma aplicação web moderna que funciona perfeitamente no seu celular, tablet e computador. Seus dados são sincronizados em tempo real entre todos os seus aparelhos.',
  },
  {
    question: 'Existe algum custo ou taxa escondida?',
    answer:
      'O acesso ao BeautyFlow é feito através de um token de ativação anual. Não há taxas extras, comissões sobre seus serviços ou custos escondidos. É um valor único para você usar a plataforma por um ano inteiro.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className=" border-b border-border/60 bg-background/90 backdrop-blur-lg">
        <div className=" mx-auto w-[80%] container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-6 w-6 text-primary" />
            <span className="font-bold">BeautyFlow</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' })
              )}
            >
              Login
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: 'default', size: 'sm' }),
                'hidden sm:flex'
              )}
            >
              Começar Agora
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="mx-auto w-[80%] overflow-hidden py-32 md:py-40 lg:py-48">
          <div className="absolute inset-0 -z-10 bg-background">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
            <div
              className="absolute -top-1/2 left-1/3 h-[200%] w-2/3 animate-pulse-slow rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-3xl"
            ></div>
             <div
              className="absolute -bottom-1/2 right-1/3 h-[200%] w-2/3 animate-pulse-slower rounded-full bg-gradient-to-tl from-accent/30 to-primary/20 blur-3xl"
            ></div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>
          </div>
          <div className="container">
            <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm">
                <Star className="h-4 w-4 fill-current" />
                {/* <span>Mais de 500 profissionais confiam no BeautyFlow</span> */}
                <span>Para profissionais que buscam agilidade e eficiência</span>
              </div>
              <h1 className="mt-8 scroll-m-20 text-5xl font-black tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl">
                Transforme sua{' '}
                <span className="relative inline-block">
                  <span className="absolute -inset-1 animate-pulse rounded-lg bg-gradient-to-r from-primary to-accent blur-xl"></span>
                  <span className="relative bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    agenda
                  </span>
                </span>
                <br />
                em uma máquina de{' '}
                <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                  lucro
                </span>
              </h1>
              <p className="mt-8 max-w-3xl text-xl text-muted-foreground md:text-2xl">
                Pare de perder clientes por falta de organização. O BeautyFlow automatiza lembretes de renovação e aumenta seu faturamento em até <span className="font-bold text-primary">30%</span>.
              </p>
              <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row">
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'group h-14 px-8 text-lg font-semibold shadow-xl shadow-primary/30 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl hover:shadow-primary/40'
                  )}
                >
                  Começar Agora
                  <ChevronRight className="ml-2 h-6 w-6 transition-transform duration-300 group-hover:translate-x-2" />
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 border-2 px-8 text-lg font-semibold backdrop-blur-sm transition-all duration-300 hover:scale-105"
                  asChild
                >
                  <Link href="#features">
                    Ver Funcionalidades
                  </Link>
                </Button>
              </div>
              <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
                    <CalendarCheck className="h-4 w-4 text-green-500" />
                  </div>
                  <span>Sem cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
                    <Zap className="h-4 w-4 text-blue-500" />
                  </div>
                  <span>Configuração em 2 minutos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20">
                    <HeartHandshake className="h-4 w-4 text-purple-500" />
                  </div>
                  <span>Suporte dedicado</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="mx-auto w-[80%] overflow-hidden py-16 md:py-24"
        >
          <div className="absolute inset-0 -z-10 bg-background">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
            <div
              className="absolute -top-1/2 left-1/3 h-[200%] w-2/3 animate-pulse-slow rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-3xl"
            ></div>
             <div
              className="absolute -bottom-1/2 right-1/3 h-[200%] w-2/3 animate-pulse-slower rounded-full bg-gradient-to-tl from-accent/30 to-primary/20 blur-3xl"
            ></div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>
          </div>
          <div className="container space-y-12">
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
                <p className="font-semibold text-primary">Nossas Ferramentas</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Tudo que você precisa para crescer
                </h2>
                <p className="mt-4 text-muted-foreground">
                Deixe a organização conosco e foque no que você faz de melhor:
                realçar a beleza.
                </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((feature) => (
                <div
                    key={feature.title}
                    className="group relative transform-gpu rounded-xl border bg-card/50 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-primary/10"
                >
                    <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-transparent via-transparent to-accent/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/80 to-accent/80 text-primary-foreground">
                    {feature.icon}
                    </div>
                    <h3 className="mt-6 text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                    </p>
                </div>
                ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section
          id="testimonials"
          className="mx-auto w-[80%] overflow-hidden py-16 md:py-24"
        >
          <div className="absolute inset-0 -z-10 bg-background">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
            <div
              className="absolute -top-1/2 left-1/3 h-[200%] w-2/3 animate-pulse-slow rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-3xl"
            ></div>
             <div
              className="absolute -bottom-1/2 right-1/3 h-[200%] w-2/3 animate-pulse-slower rounded-full bg-gradient-to-tl from-accent/30 to-primary/20 blur-3xl"
            ></div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>
          </div>
          <div className="container">
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
              <p className="font-semibold text-primary">Aprovação Máxima</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                O que as profissionais dizem
              </h2>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <figure
                  key={testimonial.name}
                  className="rounded-2xl border border-border/60 bg-card/50 p-6 shadow-sm backdrop-blur-sm"
                >
                  <blockquote className="text-muted-foreground">
                    <div className="flex text-yellow-400">
                      <Star className="h-5 w-5 fill-current" />
                      <Star className="h-5 w-5 fill-current" />
                      <Star className="h-5 w-5 fill-current" />
                      <Star className="h-5 w-5 fill-current" />
                      <Star className="h-5 w-5 fill-current" />
                    </div>
                    <p className="mt-4 italic">"{testimonial.quote}"</p>
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-4">
                    <Image
                      className="h-12 w-12 rounded-full object-cover"
                      src={testimonial.avatar}
                      alt={`Avatar de ${testimonial.name}`}
                      width={48}
                      height={48}
                    />
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.title}
                      </div>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="mx-auto w-[80%] overflow-hidden py-16 md:py-24">
         <div className="absolute inset-0 -z-10 bg-background">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
            <div
              className="absolute -top-1/2 left-1/3 h-[200%] w-2/3 animate-pulse-slow rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-3xl"
            ></div>
             <div
              className="absolute -bottom-1/2 right-1/3 h-[200%] w-2/3 animate-pulse-slower rounded-full bg-gradient-to-tl from-accent/30 to-primary/20 blur-3xl"
            ></div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>
          </div>
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Perguntas Frequentes
                </h2>
            </div>
            <Accordion type="single" collapsible className="mt-8 max-w-3xl mx-auto">
                {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-border/60 bg-card/20 backdrop-blur-sm rounded-lg px-4 mb-2">
                    <AccordionTrigger className="text-left font-semibold hover:no-underline">
                    {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                    </AccordionContent>
                </AccordionItem>
                ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="mx-auto w-[80%] overflow-hidden py-16 md:py-24">
           <div className="absolute inset-0 -z-10 bg-background">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
            <div
              className="absolute -top-1/2 left-1/3 h-[200%] w-2/3 animate-pulse-slow rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-3xl"
            ></div>
             <div
              className="absolute -bottom-1/2 right-1/3 h-[200%] w-2/3 animate-pulse-slower rounded-full bg-gradient-to-tl from-accent/30 to-primary/20 blur-3xl"
            ></div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>
          </div>
          <div className="container">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-accent p-8 text-center shadow-2xl shadow-primary/20 md:p-12">
              <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
                Pronta para levar seu negócio ao próximo nível?
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/80">
                Junte-se a centenas de profissionais que já estão otimizando o
                tempo e aumentando o lucro.
              </p>
              <div className="mt-8">
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({
                      variant: 'secondary',
                      size: 'lg',
                    }),
                    'bg-white text-primary hover:bg-white/90'
                  )}
                >
                  Criar minha conta agora
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto w-[80%] container flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} BeautyFlow. Todos os direitos
              reservados.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/#features"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Funcionalidades
            </Link>
            <Link
              href="/#faq"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              FAQ
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
