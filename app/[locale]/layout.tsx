import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Nav } from '@/components/nav';
import { Toaster } from '@/components/ui/sonner';
import { HtmlLang } from '@/components/html-lang';
import { AuroraBackground } from '@/components/ui/aurora-background';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <HtmlLang />
      <AuroraBackground className="min-h-screen">
        <Nav />
        <main className="flex-1 w-full">
          {children}
        </main>
      </AuroraBackground>
      <Toaster />
    </NextIntlClientProvider>
  );
}
