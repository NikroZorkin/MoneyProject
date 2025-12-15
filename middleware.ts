import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/3fd1a540-59ca-4abc-88b9-9a8b673c0610',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:9',message:'Middleware entry',data:{url:request.url,pathname:request.nextUrl.pathname,method:request.method},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  
  const response = intlMiddleware(request);
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/3fd1a540-59ca-4abc-88b9-9a8b673c0610',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:13',message:'After intlMiddleware',data:{hasResponse:!!response,responseStatus:response?.status,responseUrl:response?.headers.get('location')},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  
  // Add security headers: noindex for all pages
  if (response) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/3fd1a540-59ca-4abc-88b9-9a8b673c0610',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:24',message:'Middleware exit',data:{returningResponse:!!response,status:response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  
  return response || NextResponse.next();
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};



