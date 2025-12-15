import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Nav } from '@/components/nav';
import { Toaster } from '@/components/ui/sonner';
import { HtmlLang } from '@/components/html-lang';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/3fd1a540-59ca-4abc-88b9-9a8b673c0610',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[locale]/layout.tsx:10',message:'LocaleLayout entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  const { locale } = await params;

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/3fd1a540-59ca-4abc-88b9-9a8b673c0610',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[locale]/layout.tsx:16',message:'Locale extracted',data:{locale,isValid:routing.locales.includes(locale as any),validLocales:routing.locales},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  if (!routing.locales.includes(locale as any)) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/3fd1a540-59ca-4abc-88b9-9a8b673c0610',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[locale]/layout.tsx:21',message:'Invalid locale - calling notFound',data:{locale},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    notFound();
  }

  const messages = await getMessages();
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/3fd1a540-59ca-4abc-88b9-9a8b673c0610',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[locale]/layout.tsx:28',message:'LocaleLayout rendering',data:{locale,hasMessages:!!messages},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  return (
    <NextIntlClientProvider messages={messages}>
      <HtmlLang />
      <Nav />
      {children}
      <Toaster />
    </NextIntlClientProvider>
  );
}

