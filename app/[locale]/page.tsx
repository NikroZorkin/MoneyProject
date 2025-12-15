import { redirect } from 'next/navigation';

export default async function RootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // #region agent log
  const locale = (await params).locale;
  fetch('http://127.0.0.1:7243/ingest/3fd1a540-59ca-4abc-88b9-9a8b673c0610',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[locale]/page.tsx:6',message:'RootPage entry',data:{locale},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  // #region agent log
  const targetPath = `/${locale}/dashboard`;
  fetch('http://127.0.0.1:7243/ingest/3fd1a540-59ca-4abc-88b9-9a8b673c0610',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[locale]/page.tsx:11',message:'Before redirect',data:{targetPath,locale},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  redirect(targetPath);
}



